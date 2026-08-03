import AppKit
import DreamSkinCore

final class UpdateProgressWindowController: NSWindowController {
  private let stageLabel = NSTextField(labelWithString: "")
  private let detailLabel = NSTextField(labelWithString: "")
  private let progressIndicator = NSProgressIndicator()
  private let cancelButton = NSButton(title: "取消", target: nil, action: nil)
  private var cancelHandler: (() -> Void)?

  init(cancelHandler: (() -> Void)? = nil) {
    self.cancelHandler = cancelHandler
    let panel = NSPanel(
      contentRect: NSRect(x: 0, y: 0, width: 440, height: 190),
      styleMask: [.titled, .fullSizeContentView],
      backing: .buffered,
      defer: false
    )
    panel.title = "更新 Codex Dream Skin"
    panel.titleVisibility = .hidden
    panel.titlebarAppearsTransparent = true
    panel.isFloatingPanel = true
    panel.hidesOnDeactivate = false
    panel.isReleasedWhenClosed = false
    super.init(window: panel)
    configureContent()
    setCancellable(cancelHandler != nil)
  }

  required init?(coder: NSCoder) {
    nil
  }

  private func configureContent() {
    guard let content = window?.contentView else { return }
    stageLabel.font = .systemFont(ofSize: 17, weight: .semibold)
    stageLabel.maximumNumberOfLines = 1
    stageLabel.lineBreakMode = .byTruncatingTail
    stageLabel.setAccessibilityLabel("更新阶段")

    detailLabel.font = .systemFont(ofSize: 13, weight: .regular)
    detailLabel.textColor = .secondaryLabelColor
    detailLabel.maximumNumberOfLines = 2
    detailLabel.lineBreakMode = .byWordWrapping
    detailLabel.setAccessibilityLabel("更新详情")

    progressIndicator.style = .bar
    progressIndicator.controlSize = .regular
    progressIndicator.minValue = 0
    progressIndicator.maxValue = 1
    progressIndicator.doubleValue = 0
    progressIndicator.setAccessibilityLabel("更新进度")

    cancelButton.bezelStyle = .rounded
    cancelButton.target = self
    cancelButton.action = #selector(cancelUpdate)
    cancelButton.setAccessibilityLabel("取消更新")

    let buttonRow = NSStackView(views: [NSView(), cancelButton])
    buttonRow.orientation = .horizontal
    buttonRow.alignment = .centerY

    let stack = NSStackView(views: [stageLabel, detailLabel, progressIndicator, buttonRow])
    stack.orientation = .vertical
    stack.alignment = .leading
    stack.spacing = 12
    stack.edgeInsets = NSEdgeInsets(top: 28, left: 28, bottom: 22, right: 28)
    stack.translatesAutoresizingMaskIntoConstraints = false
    content.addSubview(stack)
    NSLayoutConstraint.activate([
      stack.leadingAnchor.constraint(equalTo: content.leadingAnchor),
      stack.trailingAnchor.constraint(equalTo: content.trailingAnchor),
      stack.topAnchor.constraint(equalTo: content.topAnchor),
      stack.bottomAnchor.constraint(equalTo: content.bottomAnchor),
      detailLabel.widthAnchor.constraint(equalTo: stack.widthAnchor, constant: -56),
      progressIndicator.widthAnchor.constraint(equalTo: stack.widthAnchor, constant: -56),
      progressIndicator.heightAnchor.constraint(equalToConstant: 8),
      buttonRow.widthAnchor.constraint(equalTo: stack.widthAnchor, constant: -56),
      cancelButton.widthAnchor.constraint(greaterThanOrEqualToConstant: 88),
      cancelButton.heightAnchor.constraint(greaterThanOrEqualToConstant: 32)
    ])
  }

  func present(stage: String, detail: String, cancellable: Bool) {
    stageLabel.stringValue = stage
    detailLabel.stringValue = detail
    setCancellable(cancellable)
    progressIndicator.isIndeterminate = true
    progressIndicator.startAnimation(nil)
    window?.center()
    showWindow(nil)
    window?.makeKeyAndOrderFront(nil)
    NSApp.activate(ignoringOtherApps: true)
  }

  func apply(_ event: UpdateProgressEvent) {
    stageLabel.stringValue = event.message
    if let fraction = event.fractionCompleted {
      progressIndicator.stopAnimation(nil)
      progressIndicator.isIndeterminate = false
      progressIndicator.doubleValue = fraction
      detailLabel.stringValue = ByteCountFormatter.string(
        fromByteCount: event.completedBytes,
        countStyle: .file
      ) + " / " + ByteCountFormatter.string(fromByteCount: event.totalBytes, countStyle: .file)
      progressIndicator.setAccessibilityValue("\(Int((fraction * 100).rounded()))%")
    } else {
      progressIndicator.isIndeterminate = true
      progressIndicator.startAnimation(nil)
      detailLabel.stringValue = detail(for: event.stage)
    }
  }

  func setCancellable(_ enabled: Bool) {
    cancelButton.isHidden = !enabled
    cancelButton.isEnabled = enabled
  }

  func markCancelling() {
    setCancellable(false)
    stageLabel.stringValue = "正在取消更新…"
    detailLabel.stringValue = "当前 App 和已下载的正式版本不会被替换。"
    progressIndicator.isIndeterminate = true
    progressIndicator.startAnimation(nil)
  }

  func dismiss() {
    progressIndicator.stopAnimation(nil)
    close()
  }

  private func detail(for stage: String) -> String {
    switch stage {
    case "metadata": return "正在核对发布版本和下载信息。"
    case "verify": return "正在检查文件大小和 SHA-256。"
    case "stage": return "正在挂载 DMG 并准备经过验证的新 App。"
    case "eject": return "正在安全卸载安装镜像。"
    case "close-codex": return "正在退出 Codex 并停止旧注入器。"
    case "install": return "正在准备原子替换和失败回滚。"
    case "ready": return "安装助手已就绪，Dream Skin 即将重新启动。"
    default: return "请稍候，更新过程不会修改你的主题和图片。"
    }
  }

  @objc private func cancelUpdate() {
    guard cancelButton.isEnabled else { return }
    markCancelling()
    cancelHandler?()
  }
}
