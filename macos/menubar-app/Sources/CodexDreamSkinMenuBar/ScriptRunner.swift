import Foundation
import DreamSkinCore

struct ScriptResult {
  let exitCode: Int32
  let output: String
  let cancelled: Bool

  var succeeded: Bool { exitCode == 0 }

  init(exitCode: Int32, output: String, cancelled: Bool = false) {
    self.exitCode = exitCode
    self.output = output
    self.cancelled = cancelled
  }
}

final class ScriptTask {
  private let lock = NSLock()
  private var process: Process?
  private var cancellationRequested = false

  fileprivate func bind(_ process: Process) {
    lock.lock()
    self.process = process
    let shouldTerminate = cancellationRequested
    lock.unlock()
    if shouldTerminate, process.isRunning { process.terminate() }
  }

  fileprivate func unbind() {
    lock.lock()
    process = nil
    lock.unlock()
  }

  fileprivate var wasCancelled: Bool {
    lock.lock()
    defer { lock.unlock() }
    return cancellationRequested
  }

  func cancel() {
    lock.lock()
    cancellationRequested = true
    let current = process
    lock.unlock()
    if current?.isRunning == true { current?.terminate() }
  }
}

enum ScriptRunner {
  @discardableResult
  static func run(
    script: URL,
    arguments: [String] = [],
    outputHandler: ((String) -> Void)? = nil,
    completion: @escaping (ScriptResult) -> Void
  ) -> ScriptTask {
    let task = ScriptTask()
    DispatchQueue.global(qos: .userInitiated).async {
      let process = Process()
      let pipe = Pipe()
      process.executableURL = URL(fileURLWithPath: "/bin/bash")
      process.arguments = [script.path] + arguments
      process.currentDirectoryURL = script.deletingLastPathComponent()
      var environment = ProcessInfo.processInfo.environment
      environment["PATH"] = "/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin"
      environment["LC_ALL"] = "en_US.UTF-8"
      environment["DREAMSKIN_LANG"] = DreamSkinLanguage.stored().environmentValue
      process.environment = environment
      process.standardOutput = pipe
      process.standardError = pipe

      let result: ScriptResult
      do {
        try process.run()
        task.bind(process)
        let handle = pipe.fileHandleForReading
        var data = Data()
        var line = Data()
        while let chunk = try handle.read(upToCount: 4096), !chunk.isEmpty {
          data.append(chunk)
          guard outputHandler != nil else { continue }
          for byte in chunk {
            if byte == 10 || byte == 13 {
              guard !line.isEmpty else { continue }
              let value = String(decoding: line, as: UTF8.self)
              line.removeAll(keepingCapacity: true)
              DispatchQueue.main.async { outputHandler?(value) }
            } else {
              line.append(byte)
            }
          }
        }
        if !line.isEmpty {
          let value = String(decoding: line, as: UTF8.self)
          DispatchQueue.main.async { outputHandler?(value) }
        }
        process.waitUntilExit()
        task.unbind()
        result = ScriptResult(
          exitCode: process.terminationStatus,
          output: String(decoding: data, as: UTF8.self),
          cancelled: task.wasCancelled
        )
      } catch {
        task.unbind()
        result = ScriptResult(
          exitCode: 127,
          output: error.localizedDescription,
          cancelled: task.wasCancelled
        )
      }
      DispatchQueue.main.async {
        completion(result)
      }
    }
    return task
  }
}
