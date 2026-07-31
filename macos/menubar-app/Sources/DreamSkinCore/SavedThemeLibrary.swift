import Foundation

public struct SavedThemeOption: Equatable, Sendable {
  public let id: String
  public let name: String

  public init(id: String, name: String) {
    self.id = id
    self.name = name
  }
}

public func deduplicatedSavedThemes(
  _ themes: [SavedThemeOption],
  currentThemeID: String
) -> [SavedThemeOption] {
  let currentID = currentThemeID.lowercased()
  var selected: [String: SavedThemeOption] = [:]

  for theme in themes {
    guard !retiredBundledThemeIDs.contains(theme.id.lowercased()) else { continue }
    let key = logicalThemeID(theme.id)
    guard let existing = selected[key] else {
      selected[key] = theme
      continue
    }
    if themePriority(theme, currentID: currentID) < themePriority(existing, currentID: currentID) {
      selected[key] = theme
    }
  }
  return Array(selected.values)
}

private let bundledIronManAliases = Set([
  "iron-man",
  "preset-iron-man",
  "custom-iron-man"
])

// Upgrades preserve the user's saved-theme library. An older managed engine
// can therefore leave a retired bundled preset behind even after a newer App
// no longer ships it. Keep exact reserved preset IDs out of the native menu;
// custom themes, including similarly named ones, remain untouched.
private let retiredBundledThemeIDs = Set([
  "preset-midnight-aurora",
  "preset-sakura-dawn",
  "preset-amber-dusk",
  "preset-forest-mist",
  "preset-cyber-neon",
  "preset-romantic-rose",
  "preset-gothic-void-crusade",
  "preset-arina-hashimoto",
])

private func logicalThemeID(_ id: String) -> String {
  let normalized = id.lowercased()
  return bundledIronManAliases.contains(normalized) ? "iron-man" : normalized
}

private func themePriority(_ theme: SavedThemeOption, currentID: String) -> Int {
  let id = theme.id.lowercased()
  if !currentID.isEmpty && id == currentID { return 0 }
  if id == "preset-iron-man" { return 1 }
  return 2
}
