public enum SelfUpdatePolicy {
  /// A confirmed update always restores Codex and the active skin, even when
  /// Codex happened to be closed at the instant the user confirmed install.
  public static func restartCodexAfterInstall(wasRunning: Bool) -> Bool {
    _ = wasRunning
    return true
  }

  /// Older updater versions persisted a conditional restart flag. Ignore that
  /// legacy value so the replacement App can repair the first upgrade into the
  /// deterministic restart-and-reapply flow as well.
  public static func restartCodexForPendingMarker(_ storedValue: Bool?) -> Bool {
    _ = storedValue
    return true
  }
}
