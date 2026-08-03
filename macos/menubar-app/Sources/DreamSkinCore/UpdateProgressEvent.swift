import Foundation

public struct UpdateProgressEvent: Equatable {
  static let marker = "[update-progress]"

  public let stage: String
  public let completedBytes: Int64
  public let totalBytes: Int64
  public let message: String

  public var fractionCompleted: Double? {
    guard totalBytes > 0 else { return nil }
    return min(max(Double(completedBytes) / Double(totalBytes), 0), 1)
  }

  public init?(line: String) {
    let fields = line.split(separator: "\t", maxSplits: 4, omittingEmptySubsequences: false)
    guard fields.count == 5,
          fields[0] == Substring(Self.marker),
          fields[1].range(of: #"^[a-z][a-z0-9-]{0,31}$"#, options: .regularExpression) != nil,
          let completed = Int64(fields[2]), completed >= 0,
          let total = Int64(fields[3]), total >= 0,
          total == 0 || completed <= total else {
      return nil
    }
    let rawMessage = String(fields[4])
    guard !rawMessage.isEmpty,
          rawMessage.count <= 160,
          rawMessage.unicodeScalars.allSatisfy({
            !CharacterSet.controlCharacters.contains($0)
          }) else {
      return nil
    }
    stage = String(fields[1])
    completedBytes = completed
    totalBytes = total
    message = rawMessage
  }
}
