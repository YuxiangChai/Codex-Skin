import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

function styleDeclaration() {
  const values = new Map();
  const priorities = new Map();
  return {
    priorities, values,
    getPropertyValue(name) { return values.get(name) || ""; },
    getPropertyPriority(name) { return priorities.get(name) || ""; },
    setProperty(name, value, priority = "") {
      values.set(name, String(value));
      if (priority) priorities.set(name, String(priority));
      else priorities.delete(name);
    },
    removeProperty(name) { values.delete(name); priorities.delete(name); },
    [Symbol.iterator]() { return values.keys(); },
  };
}

function classList(initial) {
  const values = new Set(initial);
  const writes = [];
  return {
    values,
    writes,
    contains(value) { return values.has(value); },
    add(...names) { writes.push(["add", ...names]); names.forEach((name) => values.add(name)); },
    remove(...names) { writes.push(["remove", ...names]); names.forEach((name) => values.delete(name)); },
    toggle(name, enabled) { writes.push(["toggle", name, enabled]); if (enabled) values.add(name); else values.delete(name); },
  };
}

function makeFixture({
  nativeAppearance = "dark",
  settings = false,
  settingsPanel = false,
  adopted = true,
  modernHome = false,
  pinnedSummaryOpen = null,
  generic = false, genericComposer = true, genericHome = false, genericSearch = false,
  modernMessages = false, modernComposerLayout = false, modernComposerPair = false,
  pathname = "/index.html", initialRoute = "",
} = {}) {
  let settingsActive = settings;
  const attrs = new Map();
  const rootStyle = styleDeclaration();
  const rootClasses = classList([nativeAppearance === "dark" ? "electron-dark" : "electron-light"]);
  const nodes = new Map();
  const domNodes = new Set();
  const selectorNodes = new Map();
  const observers = [];
  const timers = new Map();
  const intervals = new Map();
  const listeners = new Map();
  const revoked = [];
  let nextId = 0;
  let nextBlob = 0;
  const attributesFor = (values) => [...values].map(([name, value]) => ({ name, value }));
  const makeDomNode = (name, parentElement = null, values = new Map(), matchedSelectors = []) => {
    const selectorMatches = new Set(matchedSelectors);
    const node = {
      name,
      parentElement,
      style: styleDeclaration(),
      get attributes() { return attributesFor(values); },
      getAttribute(attribute) { return values.get(attribute) ?? null; },
      hasAttribute(attribute) { return values.has(attribute); },
      setAttribute(attribute, value) { values.set(attribute, String(value)); },
      removeAttribute(attribute) { values.delete(attribute); },
      appendChild(child) { child.parentElement = node; return child; },
      matches(selector) { return selectorMatches.has(selector); },
      closest(selector) {
        let current = node;
        while (current) {
          if (current.matches?.(selector)) return current;
          current = current.parentElement;
        }
        return null;
      },
      contains(candidate) {
        let current = candidate;
        while (current) {
          if (current === node) return true;
          current = current.parentElement;
        }
        return false;
      },
      querySelector(selector) {
        return [...domNodes].find((candidate) =>
          candidate !== node && node.contains(candidate) && candidate.matches?.(selector),
        ) || null;
      },
    };
    domNodes.add(node);
    return node;
  };
  const root = makeDomNode("root", null, attrs);
  root.classList = rootClasses;
  root.style = rootStyle;
  root.appendChild = (node) => {
    node.parentElement = root;
    if (node.id) nodes.set(node.id, node);
    return node;
  };
  const body = makeDomNode("body", root);
  body.appendChild = (node) => {
    node.parentElement = body;
    if (node.id) nodes.set(node.id, node);
    return node;
  };
  const register = (selector, node) => {
    const current = selectorNodes.get(selector) || [];
    current.push(node);
    selectorNodes.set(selector, current);
  };
  const partFixtures = {};
  if (!settingsActive && !settingsPanel && generic) {
    const mainSelector = 'main, [role="main"]';
    const inputSelector = 'textarea, [contenteditable="true"], [role="textbox"]';
    const sidebarSelector = 'aside, nav[aria-label]';
    const composerSelector = '[data-testid*="composer" i], [data-testid*="prompt" i], ' +
      '[class*="composer" i], [class*="prompt" i]';
    const composerLayoutRootSelector = '[class*="_ComposerLayoutRoot_"]';
    const overlaySelector = '[role="dialog"], [aria-modal="true"]';
    partFixtures.shell = makeDomNode("generic-shell", body);
    partFixtures.sidebar = makeDomNode("generic-sidebar", partFixtures.shell, new Map(), [sidebarSelector]);
    partFixtures.main = makeDomNode("generic-main", partFixtures.shell, new Map(), [mainSelector]);
    if (genericComposer) {
      partFixtures.composer = makeDomNode(
        "generic-composer", partFixtures.main, new Map(),
        [modernComposerLayout ? composerLayoutRootSelector : composerSelector],
      );
      const inputParent = modernComposerLayout
        ? (partFixtures.composerFooter = makeDomNode(
          "generic-composer-footer", partFixtures.composer, new Map(), [composerSelector],
        ))
        : partFixtures.composer;
      partFixtures.input = makeDomNode("generic-input", inputParent, new Map(), [inputSelector]);
    }
    partFixtures.unrelatedAside = makeDomNode(
      "generic-content-aside", partFixtures.main, new Map(), [sidebarSelector],
    );
    partFixtures.dialog = makeDomNode("generic-dialog", partFixtures.main, new Map(), [overlaySelector]);
    partFixtures.dialogInput = makeDomNode(
      "generic-dialog-input", partFixtures.dialog, new Map(), [inputSelector],
    );
    if (genericSearch) {
      partFixtures.searchForm = makeDomNode("generic-search-form", partFixtures.main, new Map(), ["form"]);
      partFixtures.searchInput = makeDomNode(
        "generic-search-input", partFixtures.searchForm, new Map(), [inputSelector],
      );
    }
    register(mainSelector, partFixtures.main);
    if (genericSearch) register(inputSelector, partFixtures.searchInput);
    if (genericComposer) register(inputSelector, partFixtures.input);
    register(inputSelector, partFixtures.dialogInput);
    register(sidebarSelector, partFixtures.sidebar);
    register(sidebarSelector, partFixtures.unrelatedAside);
    if (genericHome) {
      partFixtures.homeIcon = makeDomNode("generic-home-icon", partFixtures.main);
      register('[data-testid="home-icon"]', partFixtures.homeIcon);
      register('[role="main"]:has([data-testid="home-icon"])', partFixtures.main);
      register('[role="main"]', partFixtures.main);
    }
  } else if (!settingsActive && !settingsPanel) {
    partFixtures.sidebar = makeDomNode(
      "sidebar",
      body,
      new Map([["style", "padding-top: 40px; width: 280px;"]]),
    );
    partFixtures.main = makeDomNode("main", body);
    partFixtures.header = makeDomNode("header", body);
    partFixtures.home = makeDomNode("home", partFixtures.main);
    partFixtures.homeHero = makeDomNode("home-hero", partFixtures.home);
    partFixtures.homeIcon = makeDomNode("home-icon", partFixtures.homeHero);
    partFixtures.gameSource = makeDomNode("game-source", partFixtures.homeHero);
    partFixtures.projectList = makeDomNode("project-list", partFixtures.home);
    partFixtures.thread = makeDomNode("thread", partFixtures.main);
    partFixtures.message = makeDomNode(
      "message",
      partFixtures.thread,
      new Map([["data-message-author-role", "assistant"]]),
    );
    partFixtures.messageUser = makeDomNode(
      "message-user",
      partFixtures.thread,
      new Map([["data-message-author-role", "user"]]),
    );
    partFixtures.userMessage = makeDomNode(
      "user-message",
      partFixtures.thread,
      new Map([["data-local-conversation-user-anchor", ""]]),
    );
    partFixtures.userMessageBubble = makeDomNode(
      "user-message-bubble",
      partFixtures.userMessage,
      new Map([["data-user-message-bubble", ""]]),
      ['[class*="max-w-"][class*="rounded-2xl"][class*="text-start"]'],
    );
    partFixtures.steerMessageBubble = makeDomNode(
      "steer-message-bubble",
      partFixtures.thread,
      new Map([["data-user-message-bubble", ""]]),
    );
    partFixtures.assistantMessage = makeDomNode(
      "assistant-message",
      partFixtures.thread,
      new Map([["data-local-conversation-final-assistant", ""]]),
    );
    const preferredComposerSelector =
      '[class*="_ComposerLayoutRoot_"], ' +
      '[data-composer-surface-variant][data-composer-radius-variant], ' +
      '.composer-surface-chrome';
    partFixtures.composer = makeDomNode(
      "composer", partFixtures.main, new Map(),
      modernComposerPair ? [preferredComposerSelector] : [],
    );
    partFixtures.composerBody = modernComposerPair
      ? makeDomNode("composer-body", partFixtures.composer)
      : null;
    partFixtures.composerToolbar = makeDomNode(
      "composer-toolbar", partFixtures.composerBody ?? partFixtures.composer,
    );
    if (typeof pinnedSummaryOpen === "boolean") {
      partFixtures.pinnedSummaryWrapper = makeDomNode(
        "pinned-summary-wrapper",
        partFixtures.header,
        new Map([["data-state", pinnedSummaryOpen ? "delayed-open" : "closed"]]),
      );
      partFixtures.pinnedSummaryToggle = makeDomNode(
        "pinned-summary-toggle",
        partFixtures.pinnedSummaryWrapper,
        new Map([
          ["aria-label", "Toggle pinned summary"],
          ["aria-pressed", pinnedSummaryOpen ? "true" : "false"],
        ]),
      );
      partFixtures.pinnedSummaryToggle.clickCount = 0;
      partFixtures.pinnedSummaryToggle.click = () => {
        partFixtures.pinnedSummaryToggle.clickCount += 1;
        partFixtures.pinnedSummaryToggle.setAttribute("aria-pressed", "false");
        partFixtures.pinnedSummaryWrapper.setAttribute("data-state", "closed");
      };
    }
    register("aside.app-shell-left-panel", partFixtures.sidebar);
    register('main:is(.main-surface, [data-app-shell-main-surface], [class*="_MainContentSurface_"])', partFixtures.main);
    register('header:is(.app-header-tint, [data-app-shell-header-edge-scroll], [class*="_Header_"])', partFixtures.header);
    if (!modernHome) {
      register('[data-testid="home-icon"]', partFixtures.homeIcon);
      register('[role="main"]:has([data-testid="home-icon"])', partFixtures.home);
    }
    register('[role="main"]', partFixtures.home);
    register('[data-feature="game-source"]', partFixtures.homeHero);
    register(".group\\/project-selector", partFixtures.projectList);
    register(".thread-scroll-container", partFixtures.thread);
    const messageSelector =
      ':is([data-message-author-role], [data-local-conversation-user-anchor], [data-local-conversation-final-assistant])';
    const messageUserSelector =
      ':is([data-message-author-role="user"], [data-local-conversation-user-anchor])';
    const messageUserBubbleSelector = '[data-user-message-bubble]';
    register(messageSelector, partFixtures.message);
    register(messageSelector, partFixtures.messageUser);
    register(messageUserSelector, partFixtures.messageUser);
    if (modernMessages) {
      register(messageSelector, partFixtures.userMessage);
      register(messageSelector, partFixtures.assistantMessage);
      register(messageUserSelector, partFixtures.userMessage);
      register(messageUserBubbleSelector, partFixtures.userMessageBubble);
      register(messageUserBubbleSelector, partFixtures.steerMessageBubble);
    }
    if (partFixtures.pinnedSummaryToggle) {
      register('button[aria-label="Toggle pinned summary"]', partFixtures.pinnedSummaryToggle);
    }
    register(
      ':is(.composer-surface-chrome, [class*="_ComposerLayoutRoot_"], [data-composer-surface-variant][data-composer-radius-variant], [class*="_ComposerLayoutBody_"])',
      partFixtures.composer,
    );
    if (partFixtures.composerBody) {
      register(
        ':is(.composer-surface-chrome, [class*="_ComposerLayoutRoot_"], [data-composer-surface-variant][data-composer-radius-variant], [class*="_ComposerLayoutBody_"])',
        partFixtures.composerBody,
      );
    }
    register(
      ':is(.composer-surface-chrome [class*="_footer_"], [class*="_ComposerLayoutRoot_"] [class*="_ComposerLayoutFooter_"], [data-composer-surface-variant][data-composer-radius-variant] :is([data-composer-footer-responsive], [class*="_ComposerLayoutFooter_"], [class*="_footer_"]))',
      partFixtures.composerToolbar,
    );
  }
  const makeStyleNode = () => {
    const node = {
      id: "",
      textContent: "",
      parentElement: null,
      dataset: {},
      remove() { if (node.id) nodes.delete(node.id); node.parentElement = null; },
    };
    return node;
  };
  const document = {
    documentElement: root,
    head: root,
    body,
    adoptedStyleSheets: adopted ? [] : undefined,
    createElement(tag) { return tag === "style" ? makeStyleNode() : { tagName: tag }; },
    getElementById(id) { return nodes.get(id) || null; },
    querySelector(selector) {
      if (settingsPanel && selector === '[data-settings-panel-slug="general-settings"]') {
        return makeDomNode("settings:general-settings", body);
      }
      if (settingsActive && (selector.includes("appearance-theme") || selector.includes("theme-preview"))) {
        return makeDomNode(`settings:${selector}`, body);
      }
      return (selectorNodes.get(selector) || [])[0] || null;
    },
    querySelectorAll(selector) {
      if (selector === "[data-ds-part]") {
        return [...domNodes].filter((node) => node.getAttribute?.("data-ds-part") !== null);
      }
      return [...(selectorNodes.get(selector) || [])];
    },
    addEventListener(type, callback) { listeners.set(`document:${type}`, callback); },
    removeEventListener(type, callback) {
      if (listeners.get(`document:${type}`) === callback) listeners.delete(`document:${type}`);
    },
  };
  const navigation = {
    addEventListener(type, callback) { listeners.set(`navigation:${type}`, callback); },
    removeEventListener(type) { listeners.delete(`navigation:${type}`); },
  };
  class MockMutationObserver {
    constructor(callback) { this.callback = callback; this.options = null; this.observations = []; observers.push(this); }
    observe(target, options) { this.target = target; this.options = options; this.observations.push({ target, options }); }
    disconnect() { this.disconnected = true; }
  }
  class MockSheet {
    replaceSync(text) { this.text = text; }
  }
  const window = {
    navigation,
    matchMedia() {
      return {
        matches: nativeAppearance === "dark",
        addEventListener(type, callback) { listeners.set(`media:${type}`, callback); },
        removeEventListener(type) { listeners.delete(`media:${type}`); },
      };
    },
    addEventListener() {},
    removeEventListener() {},
  };
  const context = {
    window,
    document,
    location: {
      protocol: "app:",
      pathname,
      search: initialRoute ? `?initialRoute=${encodeURIComponent(initialRoute)}` : "",
    },
    MutationObserver: MockMutationObserver,
    CSSStyleSheet: adopted ? MockSheet : undefined,
    Blob,
    Uint8Array,
    atob,
    URL: {
      createObjectURL() { nextBlob += 1; return `blob:fixture-${nextBlob}`; },
      revokeObjectURL(value) { revoked.push(value); },
    },
    URLSearchParams,
    performance: { now: () => 1 },
    setTimeout(callback, delay) { const id = ++nextId; timers.set(id, { callback, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    setInterval(callback, delay) { const id = ++nextId; intervals.set(id, { callback, delay }); return id; },
    clearInterval(id) { intervals.delete(id); },
    console,
  };
  const payloadFor = (theme = {}, cssText = ".fixture { color: red; }") => {
    const template = fixture.template;
    return template
      .replace("__DREAM_SKIN_CSS_JSON__", JSON.stringify(cssText))
      .replace("__DREAM_SKIN_ART_JSON__", JSON.stringify("data:image/png;base64,AA=="))
      .replace("__DREAM_SKIN_THEME_JSON__", JSON.stringify({ id: "fixture", appearance: "auto", ...theme }))
      .replace("__DREAM_SKIN_VERSION_JSON__", JSON.stringify("test"))
      .replace("__DREAM_SKIN_STYLE_REVISION_JSON__", JSON.stringify("css-rev"))
      .replace("__DREAM_SKIN_PAYLOAD_REVISION_JSON__", JSON.stringify("payload-rev"));
  };
  const flushTimers = (maximumDelay = Infinity) => {
    for (const [id, timer] of [...timers]) {
      if (timer.delay <= maximumDelay) { timers.delete(id); timer.callback(); }
    }
  };
  const addDynamicMessage = (role = "assistant") => {
    const messageSelector =
      ':is([data-message-author-role], [data-local-conversation-user-anchor], [data-local-conversation-final-assistant])';
    const messageUserSelector =
      ':is([data-message-author-role="user"], [data-local-conversation-user-anchor])';
    const node = makeDomNode(
      `message-${(selectorNodes.get(messageSelector) || []).length + 1}`,
      partFixtures.thread || body,
      new Map([["data-message-author-role", role]]),
    );
    register(messageSelector, node);
    if (role === "user") register(messageUserSelector, node);
    return node;
  };
  const setSettingsMode = (active) => {
    settingsActive = active;
    if (!active) return;
    selectorNodes.clear();
  };
  const replaceThreadSurface = () => {
    const replacement = makeDomNode("thread-replacement", partFixtures.main || body);
    selectorNodes.set(".thread-scroll-container", [replacement]);
    partFixtures.thread = replacement;
    return replacement;
  };
  return {
    addDynamicMessage, attrs, context, document, domNodes, flushTimers, intervals, listeners,
    nodes, observers, partFixtures, payloadFor, revoked, root, rootClasses, rootStyle,
    replaceThreadSurface, selectorNodes, setSettingsMode, timers, window,
  };
}

function unscopedCssRules(css) {
  const rules = [];
  let start = 0;
  let quote = null;
  let index = 0;
  while (index < css.length) {
    if (!quote && css.startsWith("/*", index)) {
      const end = css.indexOf("*/", index + 2);
      index = end < 0 ? css.length : end + 2;
      continue;
    }
    const character = css[index];
    if (quote) {
      if (character === "\\") index += 2;
      else { if (character === quote) quote = null; index += 1; }
      continue;
    }
    if (character === "\"" || character === "'") { quote = character; index += 1; continue; }
    if (character === "{") {
      const prelude = css.slice(start, index).trim();
      if (prelude && !prelude.startsWith("@") &&
        !prelude.includes('html[data-dream-skin="active"]') &&
        !prelude.includes(':root[data-dream-skin="active"]')) {
        rules.push(prelude);
      }
      start = index + 1;
    } else if (character === "}") {
      start = index + 1;
    }
    index += 1;
  }
  return rules;
}

export async function runRendererRuntimeTest(assetRoot) {
  const template = await fs.readFile(path.join(assetRoot, "renderer-inject.js"), "utf8");
  const css = await fs.readFile(path.join(assetRoot, "dream-skin.css"), "utf8");
  const shellPattern = String.raw`main:is\(\.main-surface, \[data-app-shell-main-surface\], \[class\*="_MainContentSurface_"\]\)`;
  const headerPattern = String.raw`header:is\(\.app-header-tint, \[data-app-shell-header-edge-scroll\], \[class\*="_Header_"\]\)`;
  const composerPattern = String.raw`:is\(\.composer-surface-chrome, \[class\*="_ComposerLayoutRoot_"\], \[data-composer-surface-variant\]\[data-composer-radius-variant\], \[class\*="_ComposerLayoutBody_"\]\)`;
  const publicComposerPattern = `${composerPattern}\\[data-ds-part="composer"\\]`;
  const homeUtilityPattern = String.raw`:is\(\[class\*="_homeUtilityBar_"\], \[class\*="_ComposerHomeUtilityBar_"\]\)`;
  fixture.template = template;

  assert.match(template, /adoptedStyleSheets/);
  assert.match(template, /CSSStyleSheet/);
  assert.match(template, /window\.navigation/);
  assert.match(template, /electron-dark/);
  assert.doesNotMatch(template, /electron-opaque|home-suggestion-list-item/,
    "Runtime payload must not carry retired selector documentation/fossils.");
  assert.doesNotMatch(template, /classList\.(add|remove|toggle)/);
  assert.doesNotMatch(template, /getBoundingClientRect|ResizeObserver/);
  assert.match(template, /_ComposerLayoutBody_/,
    "Codex 26.730 composer body must remain the public composer surface.");
  assert.match(template, /_ComposerLayoutFooter_/,
    "Codex 26.730 composer footer must remain the public toolbar surface.");
  assert.doesNotMatch(template, /_ComposerLayout(?:Body|Footer)_[a-z0-9]+_\d+/i,
    "Composer selectors must never bind to a build-specific CSS Modules hash.");
  assert.match(template, /childList:\s*true/);
  assert.match(template, /subtree:\s*true/);
  // The new contract intentionally keeps the `data-dream-*` attribute names
  // and `--dream-*` custom properties.  Only the retired DOM marker classes
  // and the measured fossil selector must be absent from the canonical CSS.
  assert.doesNotMatch(css, /(?:^|[.#\s])(?:codex-dream-skin|dream-skin-home|dream-home|dream-task)(?:[\s.#:{>]|$)|home-suggestion-list-item/);
  assert.match(css, /html\[data-dream-skin="active"\]/);
  const sidebar = "(?:__DREAM_SELECTOR_LEFT_PANEL__|aside\\.app-shell-left-panel)";
  const noInlineColor = "svg:not\\(\\[style\\^=[\"']color:[\"']\\]\\):not\\(\\[style\\*=[\"'];color:[\"']\\]\\):not\\(\\[style\\*=[\"']; color:[\"']\\]\\)";
  assert.match(
    css,
    new RegExp(`${sidebar} ${noInlineColor}\\s*\\{\\s*color:\\s*rgb\\(var\\(--ds-muted-rgb\\) / \\.96\\) !important;`),
    "Sidebar base icon tint must exempt only an inline color declaration.",
  );
  assert.match(
    css,
    new RegExp(`${sidebar} button:hover ${noInlineColor},\\s*[\\s\\S]{0,160}${sidebar} a:hover ${noInlineColor}\\s*\\{\\s*color:\\s*var\\(--ds-accent\\) !important;`),
    "Sidebar hover tint must exempt only an inline color declaration.",
  );
  assert.match(
    css,
    new RegExp(`${sidebar} \\[aria-current=\\\"page\\\"\\] ${noInlineColor}\\s*\\{\\s*color:\\s*var\\(--ds-accent\\) !important;`),
    "Sidebar current-page tint must exempt only an inline color declaration.",
  );
  assert.doesNotMatch(
    css,
    /(?:__DREAM_SELECTOR_LEFT_PANEL__|aside\.app-shell-left-panel) svg\s*\{\s*color:\s*rgb\(var\(--ds-muted-rgb\) \/ \.96\) !important;/,
    "Sidebar base tint must not override every SVG.",
  );
  assert.doesNotMatch(
    css,
    /(?:__DREAM_SELECTOR_LEFT_PANEL__|aside\.app-shell-left-panel) button:hover svg\s*,\s*[\s\S]{0,160}(?:__DREAM_SELECTOR_LEFT_PANEL__|aside\.app-shell-left-panel) a:hover svg\s*\{\s*color:\s*var\(--ds-accent\) !important;/,
    "Sidebar hover tint must not override every SVG.",
  );
  assert.doesNotMatch(
    css,
    /(?:__DREAM_SELECTOR_LEFT_PANEL__|aside\.app-shell-left-panel) \[aria-current="page"\] svg\s*\{\s*color:\s*var\(--ds-accent\) !important;/,
    "Sidebar current-page tint must not override every SVG.",
  );
  // Home gating must stay single-level: CSS forbids :has() inside :has(),
  // and Chromium drops any rule that nests it (the v1.3.1 regression).  The
  // canonical CSS therefore gates on the :has()-free home-route-css alias.
  assert.match(css, new RegExp(`${shellPattern}:has\\(\\[role="main"\\]\\)`));
  assert.match(css, new RegExp(`${shellPattern}:not\\(:has\\(\\[role="main"\\]\\)\\)`));
  assert.match(css, new RegExp(headerPattern));
  assert.match(css, /:is\(\.app-shell-main-content-top-fade, \[data-app-shell-main-content-top-fade\], \[class\*=\"_MainContentTopFade_\"\]\)/);
  assert.doesNotMatch(css, /:has\([^()]*:has\(/);
  assert.match(
    css,
    /data-dream-art-scope="main"[\s\S]{0,240}body\s*\{[\s\S]{0,180}background-image:\s*none\s*!important;/,
    "Main-scoped artwork must be removed from the full-window body canvas.",
  );
  assert.match(
    css,
    /data-dream-art-scope="main"[\s\S]{0,260}aside\.app-shell-left-panel\s*\{[\s\S]{0,180}background:\s*var\(--ds-panel\)\s*!important;/,
    "Main-scoped artwork must leave the sidebar on one opaque theme color.",
  );
  assert.match(
    css,
    new RegExp(`data-dream-art-scope="main"[\\s\\S]{0,320}${shellPattern}:has\\(\\[role="main"\\]\\)\\s*\\{[\\s\\S]{0,240}background-image:\\s*var\\(--dream-skin-art\\)\\s*!important;[\\s\\S]{0,180}background-position:\\s*var\\(--ds-art-position\\)\\s*!important;`),
    "Home artwork must be centered by the responsive main surface itself.",
  );
  assert.match(
    css,
    /data-dream-art-sidebar="shared"[\s\S]{0,420}body\s*\{[\s\S]{0,320}background-image:\s*linear-gradient\(\s*rgb\(0 0 0 \/ var\(--ds-theme-image-dim\)\),\s*rgb\(0 0 0 \/ var\(--ds-theme-image-dim\)\)\),\s*var\(--dream-skin-art\)\s*!important;[\s\S]{0,320}background-position:\s*center,\s*calc\(var\(--ds-focus-x\)\s*\+\s*var\(--dream-skin-sidebar-offset\)\)\s+var\(--ds-focus-y\)\s*!important;/,
    "Shared-sidebar artwork must use one body canvas shifted to the main-surface center.",
  );
  assert.match(
    css,
    /data-dream-art-sidebar="shared"[\s\S]{0,900}background-size:\s*100%\s+100%,\s*max\(\s*calc\(100%\s*\+\s*var\(--dream-skin-sidebar-width\)\),\s*var\(--dream-skin-art-cover-width\)\)\s*auto\s*!important;/,
    "A shifted shared canvas must grow enough to cover the sidebar-side edge.",
  );
  assert.match(
    css,
    /data-dream-art-sidebar="shared"[\s\S]{0,360}aside\.app-shell-left-panel\s*\{[\s\S]{0,180}background:\s*transparent\s*!important;/,
    "Shared-sidebar artwork must remain continuous underneath a transparent sidebar.",
  );
  assert.match(
    css,
    /html\[data-dream-skin="active"\]\[data-dream-art-scope="main"\]\[data-dream-art-sidebar="shared"\]\s+\.app-shell-left-panel:has\(\[data-settings-panel-slug\]\)\s*\{[\s\S]{0,180}background:\s*transparent\s*!important;/,
    "Settings navigation must reveal the body artwork in its first native style calculation.",
  );
  assert.match(
    css,
    /html\[data-dream-skin="active"\]\[data-dream-art-scope="main"\]\[data-dream-art-sidebar="shared"\]\s+:is\([\s\S]{0,260}\.electron\\:bg-token-main-surface-primary,[\s\S]{0,360}\.app-shell-left-panel:has\(\[data-settings-panel-slug\]\)\s*\+\s*div\s+\[class~="electron:bg-surface"\]\[class~="electron:elevation-prominent"\]\)\s*\{[\s\S]{0,180}background:\s*transparent\s*!important;[\s\S]{0,120}box-shadow:\s*none\s*!important;/,
    "Settings content must clear both the legacy surface and the bounded Codex 26.825 opaque wrapper.",
  );
  assert.doesNotMatch(
    css,
    /html\[data-dream-skin="active"\][^{]*>\s*\[class~="electron:bg-surface"\]/,
    "The 26.825 repair must stay inside the verified Settings sibling instead of clearing every native surface.",
  );
  assert.match(
    css,
    new RegExp(`data-dream-art-sidebar="shared"[\\s\\S]{0,520}${shellPattern}:not\\(:has\\(\\[role="main"\\]\\)\\)::before\\s*\\{[\\s\\S]{0,120}content:\\s*none\\s*!important;`),
    "Shared canvases must not apply a second route-specific dim layer over only the main surface.",
  );
  assert.match(
    css,
    new RegExp(`data-dream-art-sidebar="shared"[\\s\\S]{0,1300}${shellPattern}:not\\(:has\\(\\[role="main"\\]\\)\\)\\s*\\{[\\s\\S]{0,180}background:\\s*transparent\\s*!important;[\\s\\S]{0,120}box-shadow:\\s*none\\s*!important;`),
    "Shared canvases must clear the legacy task-only main-surface gradient.",
  );
  const customPolicyMarker = "/* Personal custom engine policy. */";
  const customPolicyOffset = css.indexOf(customPolicyMarker);
  assert.notEqual(customPolicyOffset, -1,
    "The personal engine policy must remain explicit and easy to rebase.");
  const customPolicy = css.slice(customPolicyOffset);
  assert.match(
    customPolicy,
    new RegExp(`${headerPattern}::before,[\\s\\S]{0,520}${headerPattern}::after,[\\s\\S]{0,520}${shellPattern}:has\\(\\[role="main"\\]\\)::after\\s*\\{\\s*content:\\s*none\\s*!important;\\s*\\}`),
    "Personal builds must suppress the task brand, status, and home quote pseudo-content.",
  );
  assert.match(
    customPolicy,
    /\[role="main"\]\s+\.group\\\/home-suggestions\s*\{\s*display:\s*none\s*!important;\s*\}/,
    "Personal builds must hide the four native home recommendation cards.",
  );
  assert.match(
    customPolicy,
    new RegExp(`\\[role="main"\\]\\s*>\\s*div:first-child\\s*>\\s*div:has\\(${composerPattern}\\)\\s*\\{[\\s\\S]{0,220}justify-content:\\s*flex-end\\s*!important;`),
    "Personal builds must bottom-align the native home composer row from its synchronous native selector.",
  );
  assert.doesNotMatch(
    customPolicy,
    new RegExp(`\\[role="main"\\]\\s*>\\s*div:first-child\\s*>\\s*div:has\\(${publicComposerPattern}\\)`),
    "Home-row positioning must not wait for the debounced public composer annotation.",
  );
  assert.match(
    customPolicy,
    new RegExp(`\\[role="main"\\]:has\\(${homeUtilityPattern}\\)\\s+${publicComposerPattern}\\s*\\{[\\s\\S]{0,420}background-color:\\s*color-mix\\(in oklab,\\s*var\\(--color-token-input-background\\)\\s*90%,\\s*transparent\\)\\s*!important;[\\s\\S]{0,420}border:\\s*1px solid var\\(--ds-immersive-line\\)\\s*!important;[\\s\\S]{0,220}border-radius:\\s*var\\(--radius-3xl\\)\\s*!important;[\\s\\S]{0,220}box-shadow:\\s*0 10px 28px rgb\\(var\\(--ds-bg-rgb\\) / \\.24\\)\\s*!important;`),
    "Personal builds must give the native home composer one complete border, radius and drop shadow.",
  );
  assert.match(
    customPolicy,
    new RegExp(`data-dream-art-wide="true"[\\s\\S]{0,320}\\[role="main"\\]:has\\(\\[data-feature="game-source"\\]\\):has\\(${homeUtilityPattern}\\)\\s+${publicComposerPattern}\\s*\\{[\\s\\S]{0,420}border:\\s*1px solid var\\(--ds-immersive-line\\)\\s*!important;[\\s\\S]{0,220}border-radius:\\s*var\\(--radius-3xl\\)\\s*!important;[\\s\\S]{0,220}box-shadow:\\s*0 10px 28px rgb\\(var\\(--ds-bg-rgb\\) / \\.24\\)\\s*!important;`),
    "Wide standalone project homes must keep one complete outer border instead of an inset duplicate.",
  );
  assert.match(
    customPolicy,
    new RegExp(`data-dream-shell="dark"[\\s\\S]{0,280}\\[role="main"\\]:has\\(${homeUtilityPattern}\\)\\s+${publicComposerPattern}\\s*\\{[\\s\\S]{0,220}background-color:\\s*var\\(--color-token-input-background\\)\\s*!important;`),
    "The restored home composer must retain Codex's native dark appearance token.",
  );
  assert.match(
    customPolicy,
    new RegExp(`\\[role="main"\\]\\s+${homeUtilityPattern}\\s*\\{[\\s\\S]{0,520}top:\\s*auto\\s*!important;[\\s\\S]{0,220}width:\\s*auto\\s*!important;[\\s\\S]{0,220}margin-inline:\\s*var\\(--home-composer-inline-inset\\)\\s*!important;[\\s\\S]{0,220}margin-block:\\s*0\\s*!important;[\\s\\S]{0,220}padding-inline:\\s*calc\\(var\\(--spacing\\)\\s*\\*\\s*1\\.5\\)\\s*!important;[\\s\\S]{0,220}padding-block:\\s*calc\\(var\\(--spacing\\)\\s*\\*\\s*1\\.5\\)\\s*!important;[\\s\\S]{0,220}border-radius:\\s*0\\s+0\\s+var\\(--radius-2xl\\)\\s+var\\(--radius-2xl\\)\\s*!important;[\\s\\S]{0,220}box-shadow:\\s*none\\s*!important;`),
    "Personal builds must restore the native inset utility bar while keeping the outer composer width unchanged.",
  );
  assert.match(
    customPolicy,
    new RegExp(`\\[role="main"\\]:has\\(\\[data-feature="game-source"\\]\\):has\\(${homeUtilityPattern}\\)\\s+${homeUtilityPattern}\\s*\\{[\\s\\S]{0,520}padding-block:\\s*calc\\(var\\(--spacing\\)\\s*\\*\\s*1\\.5\\)\\s*!important;[\\s\\S]{0,320}background-color:\\s*color-mix\\(in oklab,\\s*var\\(--color-token-side-bar-background\\)\\s*88%,\\s*transparent\\)\\s*!important;[\\s\\S]{0,320}backdrop-filter:\\s*blur\\(var\\(--blur-lg\\)\\)\\s*!important;`),
    "Standalone utility controls must use the compact translucent Work-style strip.",
  );
  assert.match(
    customPolicy,
    new RegExp(`\\[role="main"\\]:has\\(\\[data-feature="game-source"\\]\\):has\\(${homeUtilityPattern}\\)\\s+${homeUtilityPattern}::before\\s*\\{\\s*content:\\s*none\\s*!important;\\s*\\}`),
    "Standalone project homes must not add a second Select project label above the native controls.",
  );
  assert.match(
    customPolicy,
    /\[role="main"\]::before\s*\{[\s\S]{0,220}content:\s*var\(--dream-skin-home-title,\s*"Jarvis at your service"\)\s*!important;[\s\S]{0,420}top:\s*calc\(50vh\s*-\s*var\(--app-shell-main-content-frame-top-offset,\s*0px\)\)\s*!important;[\s\S]{0,300}transform:\s*translateY\(-50%\)\s*!important;/,
    "Every home mode must render one theme-owned title layer at the full-window vertical center.",
  );
  assert.match(
    customPolicy,
    /\[role="main"\]::before\s*\{[\s\S]{0,720}font-family:\s*inherit\s*!important;[\s\S]{0,220}font-size:\s*clamp\([\s\S]{0,120}\)\s*!important;[\s\S]{0,160}font-weight:\s*600\s*!important;[\s\S]{0,160}line-height:\s*1\.15\s*!important;/,
    "Chat, Work and Codex must share one explicit title typography contract.",
  );
  assert.match(
    customPolicy,
    /\[role="main"\]:has\(\[data-feature="game-source"\]\)\s+\[data-feature="game-source"\]\s*,[\s\S]{0,260}\[role="main"\]:not\(:has\(\[data-feature="game-source"\]\)\)\s+h1\.heading-xl:not\(\.invisible\)\s*\{[\s\S]{0,160}opacity:\s*0\s*!important;/,
    "The shared title layer must hide both native title variants without removing their semantic nodes.",
  );
  assert.match(
    customPolicy,
    /\[role="main"\]:has\(\[data-feature="game-source"\]\)\s*\{\s*--thread-content-max-width:\s*672px\s*!important;\s*\}/,
    "Standalone project homes must retain the same 640px composer surface as Work after native toolbar padding.",
  );
  assert.match(
    customPolicy,
    new RegExp(`\\[role="main"\\]:has\\(\\[data-feature="game-source"\\]\\)\\s+div:has\\(>\\s*div\\s*>\\s*${homeUtilityPattern}\\)\\s*\\{[\\s\\S]{0,160}order:\\s*2\\s*!important;[\\s\\S]{0,160}margin-top:\\s*calc\\(var\\(--spacing\\)\\s*\\*\\s*-2\\)\\s*!important;[\\s\\S]{0,160}display:\\s*flex\\s*!important;[\\s\\S]{0,100}flex-direction:\\s*column\\s*!important;`),
    "Project-home composer and utility controls must use one deterministic Work-style column.",
  );
  assert.match(
    customPolicy,
    new RegExp(`div:has\\(>\\s*div\\s*>\\s*${homeUtilityPattern}\\)[\\s\\S]{0,180}> div:has\\(>\\s*${homeUtilityPattern}\\)\\s*\\{[\\s\\S]{0,100}order:\\s*2\\s*!important;[\\s\\S]{0,180}border-radius:\\s*0 0 var\\(--radius-2xl\\) var\\(--radius-2xl\\)\\s*!important;`),
    "The project utility rail must follow the composer and retain only its lower corners.",
  );
  assert.match(
    customPolicy,
    new RegExp(`div:has\\(>\\s*div\\s*>\\s*${homeUtilityPattern}\\)[\\s\\S]{0,260}> div:has\\(${composerPattern}\\)\\s*\\{[\\s\\S]{0,100}order:\\s*1\\s*!important;`),
    "The standalone composer must precede its attached project utility rail.",
  );
  assert.match(
    customPolicy,
    new RegExp(`data-dream-art-scope="main"\\]\\[data-dream-art-sidebar="shared"\\][\\s\\S]{0,320}${shellPattern}:not\\(:has\\(\\[role="main"\\]\\)\\)[\\s\\S]{0,220}\\.thread-scroll-container\\s+\\.sticky\\.bottom-0[\\s\\S]{0,160}\\[class~="bg-gradient-to-t"\\]\\[class~="from-token-main-surface-primary"\\]\\s*\\{[\\s\\S]{0,120}background-image:\\s*none\\s*!important;`),
    "Shared-canvas sessions must clear native footer gradients below the composer.",
  );
  assert.match(
    customPolicy,
    /\[data-ds-part="message-user"\]\s*\{[\s\S]{0,180}background-color:\s*var\(--ds-theme-color-message-user\)\s*!important;[\s\S]{0,260}border:\s*1px solid rgb\(var\(--ds-accent-rgb\) \/ \.22\)\s*!important;[\s\S]{0,320}backdrop-filter:\s*blur\(18px\) saturate\(1\.16\)\s*!important;/,
    "User-authored messages must use one theme-colored translucent glass surface.",
  );
  assert.match(
    customPolicy,
    /pointer-events:\s*none\s*!important;/,
    "The decorative title layer must never block native home controls.",
  );
  assert.doesNotMatch(
    css,
    /content:\s*var\(--dream-skin-(?:brand-subtitle|status|quote)/,
    "Core CSS must not inject fixed branding or status labels over native content.",
  );
  assert.match(
    css,
    /:is\(\[class~="group\/application-menu-top-bar"\], \[class\*="_ApplicationMenuTopBar_"\]\)[\s\S]{0,140}background:\s*rgb\(var\(--ds-panel-rgb\) \/ \.38\)/,
    "The current Windows application menu bar must use the themed acrylic surface.",
  );
  assert.match(css, /--ds-task-full-veil/);
  assert.match(css, /data-dream-task-mode="full"/);
  assert.match(css, /background-image:\s*var\(--ds-task-full-veil\),\s*var\(--dream-skin-art\)/);
  assert.match(
    css,
    /(?:__DREAM_SELECTOR_COMPOSER_CHROME__|:is\(\.composer-surface-chrome,[^)]*\)|\.composer-surface-chrome)\s*\{[^}]*background:\s*rgb\(var\(--ds-panel-rgb\) \/ \.94\)/,
    "The merged composer shell must retain the personal 94% panel surface used for accent contrast",
  );
  assert.match(
    css,
    new RegExp(`${publicComposerPattern}[\\s\\S]{0,80}> \\[class\\*="_ComposerLayoutBody_"\\]\\s*\\{[\\s\\S]{0,180}background:\\s*transparent\\s*!important;[\\s\\S]{0,180}border:\\s*0\\s*!important;[\\s\\S]{0,140}border-radius:\\s*0\\s*!important;[\\s\\S]{0,180}box-shadow:\\s*none\\s*!important;[\\s\\S]{0,180}backdrop-filter:\\s*none\\s*!important;`),
    "One public ComposerLayoutRoot must clear the nested Body surface in both Home and Session.",
  );
  assert.doesNotMatch(
    css,
    /data-codex-composer-root\][\s\S]{0,120}data-composer-placement="thread"/,
    "Nested Composer cleanup must not depend on attributes absent from the current native root.",
  );
  assert.match(
    css,
    /(?:__DREAM_SELECTOR_HOME_UTILITY__|:is\(\[class\*="_homeUtilityBar_"\], \[class\*="_ComposerHomeUtilityBar_"\]\))[\s\S]{0,100}position:\s*relative;[\s\S]{0,60}z-index:\s*3;/,
    "The Home project utility must remain above the composer surface.",
  );
  assert.match(
    css,
    /\[class~="h-full"\]\[class~="bg-gradient-to-t"\]\[class~="from-surface"\]\[class~="via-surface"\]/,
    "The current 148px sticky composer fade must be removed by its full utility signature.",
  );
  assert.match(
    css,
    /\[class~="h-7"\]\[class~="bg-gradient-to-t"\]\[class~="from-surface"\]\[class~="to-transparent"\]/,
    "The current 28px composer-top fade must be removed by its full utility signature.",
  );
  assert.match(
    css,
    /\[data-markdown-table="true"\][\s\S]{0,220}margin-inline:\s*0\s*!important/,
    "Markdown wide tables must remain aligned with the themed message body.",
  );
  assert.match(
    css,
    /\[data-response-annotation-conversation\]\[data-response-annotation-target\][\s\S]{0,900}backdrop-filter:\s*blur\(20px\)/,
    "Streaming reasoning needs a readable single themed surface.",
  );
  assert.match(
    css,
    /\[data-local-conversation-final-assistant\][\s\S]{0,160}\[data-response-annotation-conversation\]\[data-response-annotation-target\][\s\S]{0,260}background:\s*transparent\s*!important/,
    "Final assistant messages must not retain a nested reasoning surface.",
  );
  assert.match(
    css,
    /\[data-local-conversation-item-target-ids\][\s\S]{0,900}backdrop-filter:\s*blur\(18px\)/,
    "Expanded command details need a readable themed surface.",
  );
  assert.match(
    css,
    /button\[class~="bg-primary-solid"\][\s\S]{0,520}color:\s*var\(--ds-on-accent\)\s*!important/,
    "Current composer actions must retain computed accent foreground contrast.",
  );
  assert.match(
    css,
    /(?:__DREAM_SELECTOR_SHELL_MAIN__|main:is\(\.main-surface, \[data-app-shell-main-surface\], \[class\*="_MainContentSurface_"\]\))[\s\S]{0,180}\[data-vscode-context\]\[tabindex="0"\]:focus-visible[\s\S]{0,120}outline:\s*none\s*!important;/,
    "The non-interactive Codex route wrapper must not draw a window-sized focus outline.",
  );
  assert.match(
    css,
    /:not\(:has\(main:is\(\.main-surface, \[data-app-shell-main-surface\], \[class\*=\"_MainContentSurface_\"\]\)\)\)[\s\S]{0,120}\[data-ds-part="sidebar"\]/,
    "Core CSS must style the validated generic sidebar when the exact shell selector is absent.",
  );
  assert.match(
    css,
    /:not\(:has\(main:is\(\.main-surface, \[data-app-shell-main-surface\], \[class\*=\"_MainContentSurface_\"\]\)\)\)[\s\S]{0,180}\[data-ds-part="main"\]/,
    "Core CSS must paint a validated generic main surface.",
  );
  assert.match(
    css,
    /:not\(:has\(main:is\(\.main-surface, \[data-app-shell-main-surface\], \[class\*=\"_MainContentSurface_\"\]\)\)\)[\s\S]{0,120}\[data-ds-part="composer"\]/,
    "Core CSS must style the validated generic composer.",
  );
  // Every home/project selector must stay behind the root skin gate.  A
  // marker-class-to-:has() conversion must never leave native layout rules
  // active after pause/restore.
  const unscoped = unscopedCssRules(css).join("\n");
  assert.doesNotMatch(unscoped, /\[role="main"\]:has\(\[data-testid="home-icon"\]\)/);
  assert.doesNotMatch(unscoped, /\.group\\\/project-selector/);

  const home = makeFixture({ nativeAppearance: "dark" });
  vm.runInNewContext(home.payloadFor({
    art: {
      safeArea: "left",
      taskMode: "banner",
      scope: "main",
      sidebar: "shared",
      dim: 0.18,
    },
  }), home.context);
  const state = home.window.__CODEX_DREAM_SKIN_STATE__;
  assert.equal(home.attrs.get("data-dream-skin"), "active");
  assert.equal(home.attrs.get("data-dream-shell"), "dark");
  assert.equal(home.attrs.get("data-dream-art-scope"), "main");
  assert.equal(home.attrs.get("data-dream-art-sidebar"), "shared");
  assert.equal(home.attrs.get("data-ds-part"), "root");
  assert.equal(state.styleMode, "adopted");
  assert.equal(home.document.adoptedStyleSheets.length, 1);
  assert.equal(state.scope.baseState, "home");
  assert.equal(state.scope.level, "L1");
  assert.equal(home.rootStyle.values.get("--dream-skin-brand-subtitle"), '"CODEX DREAM SKIN"');
  assert.equal(home.rootStyle.values.get("--dream-skin-status"), '"DREAM SKIN ONLINE"');
  assert.equal(
    home.rootStyle.values.get("--dream-skin-home-title"),
    '"Jarvis at your service"',
    "Legacy themes must keep the current personal-engine greeting.",
  );
  assert.equal(home.rootStyle.values.get("--ds-theme-surface-radius"), "12px");
  assert.equal(home.rootStyle.values.get("--ds-theme-surface-opacity"), "1");
  assert.equal(home.rootStyle.values.get("--ds-theme-surface-blur"), "0px");
  const publicDefaults = {
    "--ds-theme-font-family": "system",
    "--ds-theme-font-scale": "1",
    "--ds-theme-surface-border-alpha": "0.14",
    "--ds-theme-surface-shadow": "soft",
    "--ds-theme-image-zoom": "1",
    "--ds-theme-image-task-intensity": "0.35",
    "--ds-theme-density-scale": "standard",
    "--ds-theme-motion-level": "standard",
  };
  for (const [variable, expected] of Object.entries(publicDefaults)) {
    assert.equal(home.rootStyle.values.get(variable), expected);
  }
  const customTitle = makeFixture({ nativeAppearance: "dark" });
  vm.runInNewContext(
    customTitle.payloadFor({ homeTitle: "说吧，想干啥" }),
    customTitle.context,
  );
  assert.equal(
    customTitle.rootStyle.values.get("--dream-skin-home-title"),
    '"说吧，想干啥"',
    "Themes must be able to replace the shared Chat, Work and Codex home title.",
  );
  assert.equal(home.rootStyle.values.get("--ds-theme-image-focus-x"), "0.72");
  assert.equal(home.rootStyle.values.get("--ds-theme-image-focus-y"), "0.5");
  assert.equal(home.rootStyle.values.get("--dream-skin-sidebar-width"), "280px");
  assert.equal(home.rootStyle.values.get("--dream-skin-sidebar-offset"), "140px");
  assert.equal(home.rootStyle.values.get("--dream-skin-art-cover-width"), "100vw");
  assert.equal(home.rootStyle.values.get("--ds-theme-image-dim"), "0.18");
  assert.equal(state.metrics.routePasses, 1);
  assert.equal(state.metrics.partPasses, 1);
  assert.equal(state.metrics.layoutReads, 0, "Runtime must not perform layout reads");
  assert.equal(home.rootClasses.writes.length, 0, "Runtime must not write classes");
  const messageColor = makeFixture({ nativeAppearance: "dark" });
  vm.runInNewContext(messageColor.payloadFor({
    colors: {
      accent: "#64e6ff",
      userMessage: "rgba(213, 30, 69, 0.14)",
    },
  }), messageColor.context);
  assert.equal(
    messageColor.rootStyle.values.get("--ds-theme-color-message-user"),
    "rgba(213, 30, 69, 0.14)",
    "Themes must be able to declare the user-message surface color.",
  );
  const derivedMessageColor = makeFixture({ nativeAppearance: "dark" });
  vm.runInNewContext(derivedMessageColor.payloadFor({
    colors: { accent: "#64e6ff" },
  }), derivedMessageColor.context);
  assert.equal(
    derivedMessageColor.rootStyle.values.get("--ds-theme-color-message-user"),
    "rgba(100, 230, 255, 0.12)",
    "Legacy themes must derive a translucent user-message surface from their accent.",
  );
  const partObserver = home.observers.find((observer) => observer.options?.childList);
  const rootObserver = home.observers.find((observer) => observer.options?.attributes);
  assert.ok(partObserver?.options?.subtree, "Dynamic parts require one subtree child-list observer");
  assert.ok(rootObserver && !rootObserver.options?.childList && !rootObserver.options?.subtree);
  const sidebarObserver = home.observers.find((observer) =>
    observer.options?.attributeFilter?.includes("style"));
  assert.equal(sidebarObserver?.target, home.partFixtures.sidebar);
  home.partFixtures.sidebar.setAttribute("style", "width: 312.5px;");
  sidebarObserver.callback([{ type: "attributes", attributeName: "style" }]);
  assert.equal(home.rootStyle.values.get("--dream-skin-sidebar-width"), "312.5px",
    "A sidebar resize must update the shared canvas offset without reading layout.");
  assert.equal(home.rootStyle.values.get("--dream-skin-sidebar-offset"), "156.25px");
  const expectedParts = {
    sidebar: "sidebar",
    main: "main",
    header: "header",
    home: "home",
    homeHero: "home-hero",
    projectList: "project-list",
    thread: "thread",
    message: "message",
    messageUser: "message-user",
    composer: "composer",
    composerToolbar: "composer-toolbar",
  };
  for (const [fixtureKey, part] of Object.entries(expectedParts)) {
    assert.equal(home.partFixtures[fixtureKey].getAttribute("data-ds-part"), part,
      `${part} must be exposed through the public Safe CSS bridge`);
  }
  const nestedComposer = makeFixture({ nativeAppearance: "dark", modernComposerPair: true });
  vm.runInNewContext(nestedComposer.payloadFor(), nestedComposer.context);
  assert.equal(nestedComposer.partFixtures.composer.getAttribute("data-ds-part"), "composer",
    "Codex 26.814+ must expose ComposerLayoutRoot as the single public composer surface.");
  assert.equal(nestedComposer.partFixtures.composerBody.getAttribute("data-ds-part"), null,
    "A nested ComposerLayoutBody must stay private when its outer Root is present.");
  home.setSettingsMode(true);
  partObserver.callback([{ type: "childList" }]);
  home.flushTimers(80);
  assert.equal(state.scope.baseState, "settings");
  assert.equal(home.attrs.get("data-dream-base-state"), "settings",
    "The active route must be exposed to route-specific CSS without adding DOM markers.");
  assert.equal(home.rootStyle.values.get("--dream-skin-sidebar-width"), "312.5px",
    "Settings must preserve the last valid shared-sidebar width so the wallpaper does not resize.");
  assert.equal(home.rootStyle.values.get("--dream-skin-sidebar-offset"), "156.25px",
    "Settings must preserve the main-surface focal offset while its native shell is replaced.");
  const modernHome = makeFixture({ nativeAppearance: "dark", modernHome: true });
  vm.runInNewContext(modernHome.payloadFor(), modernHome.context);
  const modernState = modernHome.window.__CODEX_DREAM_SKIN_STATE__;
  assert.equal(modernState.scope.baseState, "home",
    "Codex 26.721+ must detect the home route without the retired home-icon.");
  assert.equal(modernState.scope.level, "L1");
  assert.equal(modernHome.partFixtures.home.getAttribute("data-ds-part"), "home");
  assert.equal(modernHome.partFixtures.homeHero.getAttribute("data-ds-part"), "home-hero");

  const routeTransition = makeFixture({ nativeAppearance: "dark", modernHome: true });
  routeTransition.selectorNodes.delete('[role="main"]');
  vm.runInNewContext(routeTransition.payloadFor(), routeTransition.context);
  assert.equal(routeTransition.window.__CODEX_DREAM_SKIN_STATE__.scope.baseState, "thread");
  routeTransition.selectorNodes.set('[role="main"]', [routeTransition.partFixtures.home]);
  const transitionObserver = routeTransition.observers.find((observer) => observer.options?.childList);
  transitionObserver.callback([{ type: "childList" }]);
  routeTransition.flushTimers(80);
  assert.equal(routeTransition.window.__CODEX_DREAM_SKIN_STATE__.scope.baseState, "home",
    "SPA DOM replacement must refresh route scope even when the app:// URL does not navigate.");
  const routePassesBeforeMessages = state.metrics.routePasses;

  const composerBridgeCss = `@layer dreamskin-community {
    [data-ds-part="composer"] {
      --ds-community-composer-border-color: rgba(255, 255, 255, 0.28) !important;
      --ds-community-composer-border-width: 1px !important;
      --ds-community-composer-border-style: solid !important;
    }
  }`;
  const bridgedComposer = makeFixture({ nativeAppearance: "dark" });
  bridgedComposer.partFixtures.composer.style.setProperty("border-color", "red");
  bridgedComposer.partFixtures.composer.style.setProperty("border-width", "2px", "important");
  bridgedComposer.partFixtures.composer.style.setProperty("border-style", "dashed");
  vm.runInNewContext(bridgedComposer.payloadFor({}, composerBridgeCss), bridgedComposer.context);
  for (const property of ["border-color", "border-width", "border-style"]) {
    assert.equal(
      bridgedComposer.partFixtures.composer.style.getPropertyValue(property),
      `var(--ds-community-composer-${property})`,
      `${property} must be bridged to the validated community cascade`,
    );
    assert.equal(bridgedComposer.partFixtures.composer.style.getPropertyPriority(property), "important");
  }
  assert.equal(bridgedComposer.window.__CODEX_DREAM_SKIN_STATE__.cleanup(), true);
  assert.equal(bridgedComposer.partFixtures.composer.style.getPropertyValue("border-color"), "red");
  assert.equal(bridgedComposer.partFixtures.composer.style.getPropertyPriority("border-width"), "important");

  const petOverlay = makeFixture({ nativeAppearance: "dark", initialRoute: "/avatar-overlay" });
  vm.runInNewContext(petOverlay.payloadFor(), petOverlay.context);
  assert.equal(petOverlay.window.__CODEX_DREAM_SKIN_STATE__, undefined,
    "The avatar overlay must reject Dream Skin before installing renderer state.");
  assert.equal(petOverlay.window.__CODEX_DREAM_SKIN_DISABLED__, true);
  assert.equal(petOverlay.document.adoptedStyleSheets.length, 0);
  assert.equal(petOverlay.attrs.get("data-dream-skin"), undefined);

  const petComposition = makeFixture({
    nativeAppearance: "dark", pathname: "/avatar-overlay-composition-surface.html",
  });
  vm.runInNewContext(petComposition.payloadFor(), petComposition.context);
  assert.equal(petComposition.window.__CODEX_DREAM_SKIN_STATE__, undefined,
    "Pet composition surfaces must remain transparent and unthemed.");
  assert.equal(petComposition.document.adoptedStyleSheets.length, 0);

  const navigatedPet = makeFixture({ nativeAppearance: "dark" });
  vm.runInNewContext(navigatedPet.payloadFor(), navigatedPet.context);
  navigatedPet.context.location.pathname = "/avatar-overlay-composition-surface.html";
  vm.runInNewContext(navigatedPet.payloadFor(), navigatedPet.context);
  assert.equal(navigatedPet.window.__CODEX_DREAM_SKIN_STATE__, undefined,
    "Reapplying on a Pet route must clean an older renderer injection.");
  assert.equal(navigatedPet.document.adoptedStyleSheets.length, 0);
  assert.equal(navigatedPet.attrs.get("data-dream-skin"), undefined);
  assert.equal(navigatedPet.revoked.length, 1,
    "Pet cleanup must revoke the previous wallpaper blob URL.");
  const dynamicMessage = home.addDynamicMessage();
  partObserver.callback([{ type: "childList" }]);
  home.flushTimers(80);
  assert.equal(dynamicMessage.getAttribute("data-ds-part"), "message");
  const dynamicUserMessage = home.addDynamicMessage("user");
  partObserver.callback([{ type: "childList" }]);
  home.flushTimers(80);
  assert.equal(dynamicUserMessage.getAttribute("data-ds-part"), "message-user",
    "User-authored messages must expose a dedicated bounded theme surface.");

  const automaticPinned = makeFixture({
    nativeAppearance: "dark",
    pinnedSummaryOpen: true,
  });
  vm.runInNewContext(automaticPinned.payloadFor(), automaticPinned.context);
  assert.equal(automaticPinned.partFixtures.pinnedSummaryToggle.getAttribute("aria-pressed"), "false");
  assert.equal(automaticPinned.partFixtures.pinnedSummaryToggle.clickCount, 1,
    "An initially open pinned summary must be closed exactly once.");
  assert.equal(
    automaticPinned.window.__CODEX_DREAM_SKIN_STATE__.metrics.pinnedSummaryAutoCloses,
    1,
  );

  const manualPinned = makeFixture({
    nativeAppearance: "dark",
    pinnedSummaryOpen: false,
  });
  vm.runInNewContext(manualPinned.payloadFor(), manualPinned.context);
  const pinnedClickHandler = manualPinned.listeners.get("document:click");
  assert.equal(typeof pinnedClickHandler, "function");
  pinnedClickHandler({
    isTrusted: true,
    target: manualPinned.partFixtures.pinnedSummaryToggle,
  });
  manualPinned.partFixtures.pinnedSummaryToggle.setAttribute("aria-pressed", "true");
  manualPinned.partFixtures.pinnedSummaryWrapper.setAttribute("data-state", "delayed-open");
  const pinnedObserver = manualPinned.observers.find((observer) =>
    observer.options?.attributeFilter?.includes("aria-pressed"));
  assert.equal(pinnedObserver?.target, manualPinned.partFixtures.pinnedSummaryToggle);
  pinnedObserver.callback([{ type: "attributes", attributeName: "aria-pressed" }]);
  assert.equal(manualPinned.partFixtures.pinnedSummaryToggle.getAttribute("aria-pressed"), "true",
    "A trusted user open must remain open in the current thread.");
  assert.equal(manualPinned.partFixtures.pinnedSummaryToggle.clickCount, 0);
  manualPinned.replaceThreadSurface();
  const manualPartObserver = manualPinned.observers.find((observer) => observer.options?.childList);
  manualPartObserver.callback([{ type: "childList" }]);
  manualPinned.flushTimers(80);
  assert.equal(manualPinned.partFixtures.pinnedSummaryToggle.getAttribute("aria-pressed"), "false",
    "A replacement thread surface must restore the default-closed policy.");
  assert.equal(manualPinned.partFixtures.pinnedSummaryToggle.clickCount, 1);

  assert.equal(state.metrics.routePasses, routePassesBeforeMessages + 2,
    "DOM mutations must refresh SPA route scope alongside public parts");

  const modernMessages = makeFixture({ nativeAppearance: "dark", modernMessages: true });
  vm.runInNewContext(modernMessages.payloadFor(), modernMessages.context);
  assert.equal(modernMessages.partFixtures.message.getAttribute("data-ds-part"), "message",
    "The legacy message role attribute must remain supported.");
  assert.equal(modernMessages.partFixtures.userMessage.getAttribute("data-ds-part"), null,
    "Codex 26.727-26.818 user message rows must remain transparent instead of receiving a wide panel.");
  assert.equal(modernMessages.partFixtures.userMessageBubble.getAttribute("data-ds-part"), "message-user",
    "Codex 26.727 explicit and 26.818 adaptive rounded bubbles must expose the dedicated user-message part.");
  assert.equal(modernMessages.partFixtures.steerMessageBubble.getAttribute("data-ds-part"), "message-user",
    "A live steer bubble must receive the same user-message part without waiting for an outer semantic anchor.");
  assert.equal(modernMessages.partFixtures.assistantMessage.getAttribute("data-ds-part"), "message",
    "Codex 26.727 assistant message containers must expose the public message part.");

  const generic = makeFixture({ nativeAppearance: "dark", generic: true });
  vm.runInNewContext(generic.payloadFor(), generic.context);
  assert.equal(generic.partFixtures.sidebar.getAttribute("data-ds-part"), "sidebar");
  assert.equal(generic.partFixtures.main.getAttribute("data-ds-part"), "main");
  assert.equal(generic.partFixtures.composer.getAttribute("data-ds-part"), "composer");
  assert.equal(generic.partFixtures.input.getAttribute("data-ds-part"), null,
    "The composer wrapper, not its input, should receive the public part when available.");
  assert.equal(generic.partFixtures.unrelatedAside.getAttribute("data-ds-part"), null,
    "An aside inside the main content must not be exposed as the app sidebar.");
  assert.equal(generic.partFixtures.dialogInput.getAttribute("data-ds-part"), null,
    "Dialog inputs must not be mistaken for the app composer.");

  const modernComposer = makeFixture({
    nativeAppearance: "dark", generic: true, modernComposerLayout: true,
  });
  vm.runInNewContext(modernComposer.payloadFor(), modernComposer.context);
  assert.equal(modernComposer.partFixtures.composer.getAttribute("data-ds-part"), "composer",
    "The ComposerLayoutRoot wrapper must receive the public composer part.");
  assert.equal(modernComposer.partFixtures.composerFooter.getAttribute("data-ds-part"), null,
    "The broad composer fallback must not stop at ComposerLayoutFooter.");

  const genericSearch = makeFixture({
    nativeAppearance: "dark", generic: true, genericComposer: false, genericSearch: true,
  });
  vm.runInNewContext(genericSearch.payloadFor(), genericSearch.context);
  assert.equal(genericSearch.partFixtures.searchForm.getAttribute("data-ds-part"), null,
    "A generic search form must not be exposed as the app composer.");
  assert.equal(genericSearch.partFixtures.searchInput.getAttribute("data-ds-part"), null,
    "A generic search textbox must not be exposed as the app composer.");

  const genericSearchBeforeComposer = makeFixture({
    nativeAppearance: "dark", generic: true, genericComposer: true, genericSearch: true,
  });
  vm.runInNewContext(
    genericSearchBeforeComposer.payloadFor(), genericSearchBeforeComposer.context,
  );
  assert.equal(
    genericSearchBeforeComposer.partFixtures.searchInput.getAttribute("data-ds-part"), null,
    "A preceding search textbox must remain unmarked.",
  );
  assert.equal(
    genericSearchBeforeComposer.partFixtures.composer.getAttribute("data-ds-part"), "composer",
    "A preceding search textbox must not hide the real semantic composer.",
  );

  const genericHome = makeFixture({ nativeAppearance: "dark", generic: true, genericHome: true });
  vm.runInNewContext(genericHome.payloadFor(), genericHome.context);
  assert.equal(genericHome.partFixtures.main.getAttribute("data-ds-part"), "home",
    "The specific home part must win when generic home and main are one node.");
  assert.equal(genericHome.window.__CODEX_DREAM_SKIN_STATE__.scope.baseState, "home");

  const full = makeFixture({ nativeAppearance: "dark" });
  vm.runInNewContext(full.payloadFor({ art: { taskMode: "full" } }), full.context);
  assert.equal(full.attrs.get("data-dream-art-scope"), "window");
  assert.equal(full.attrs.get("data-dream-art-sidebar"), "solid");
  assert.equal(full.rootStyle.values.get("--dream-skin-sidebar-width"), "0px");
  assert.equal(full.rootStyle.values.get("--dream-skin-sidebar-offset"), "0px");
  assert.equal(full.attrs.get("data-dream-task-mode"), "full");
  assert.equal(full.attrs.get("data-dream-art-task-mode"), "full");

  const landscape = makeFixture({ nativeAppearance: "dark" });
  vm.runInNewContext(landscape.payloadFor({
    artMetadata: { wide: false, aspect: "wide", focusX: 0.5, focusY: 0.5, taskMode: "ambient" },
  }), landscape.context);
  assert.equal(landscape.attrs.get("data-dream-art-wide"), "true",
    "Landscape artwork classified as wide must use the immersive layout without requiring 16:9.");

  const explicitColors = {
    background: "#abc",
    panel: "#abcd",
    panelAlt: "#11223344",
    accent: "#010203",
    accentAlt: "rgba(4, 5, 6, .5)",
    secondary: "rgb(999, 2, 3)",
    highlight: "#abcdef",
    text: "#000",
    muted: "#fff8",
    line: "rgba(7, 8, 9, .25)",
  };
  const explicitLight = makeFixture({ nativeAppearance: "light" });
  vm.runInNewContext(explicitLight.payloadFor({
    appearance: "auto",
    colorMode: "explicit",
    explicitColorKeys: Object.keys(explicitColors),
    colors: explicitColors,
  }), explicitLight.context);
  const renderedColors = {
    background: "--ds-bg",
    panel: "--ds-panel",
    panelAlt: "--ds-panel-2",
    accent: "--ds-green",
    accentAlt: "--ds-lime",
    secondary: "--ds-cyan",
    highlight: "--ds-purple",
    text: "--ds-text",
    muted: "--ds-muted",
    line: "--ds-line",
  };
  for (const [key, variable] of Object.entries(renderedColors)) {
    assert.equal(explicitLight.rootStyle.values.get(variable), explicitColors[key],
      `Light auto appearance must preserve explicit ${key}`);
  }
  const publicColorVariables = {
    "--ds-theme-color-background": "background",
    "--ds-theme-color-panel": "panel",
    "--ds-theme-color-panel-alt": "panelAlt",
    "--ds-theme-color-accent": "accent",
    "--ds-theme-color-accent-alt": "accentAlt",
    "--ds-theme-color-secondary": "secondary",
    "--ds-theme-color-highlight": "highlight",
    "--ds-theme-color-text": "text",
    "--ds-theme-color-muted": "muted",
    "--ds-theme-color-line": "line",
  };
  for (const [variable, colorKey] of Object.entries(publicColorVariables)) {
    assert.equal(explicitLight.rootStyle.values.get(variable), explicitColors[colorKey],
      `${variable} must expose the validated theme color`);
  }
  const renderedRgb = {
    "--ds-bg-rgb": "170 187 204",
    "--ds-panel-rgb": "170 187 204",
    "--ds-panel-2-rgb": "17 34 51",
    "--ds-accent-rgb": "1 2 3",
    "--ds-accent-alt-rgb": "4 5 6",
    "--ds-secondary-rgb": "255 2 3",
    "--ds-highlight-rgb": "171 205 239",
    "--ds-text-rgb": "0 0 0",
    "--ds-muted-rgb": "255 255 255",
    "--ds-line-rgb": "7 8 9",
  };
  for (const [variable, expected] of Object.entries(renderedRgb)) {
    assert.equal(explicitLight.rootStyle.values.get(variable), expected,
      `${variable} must support official hex forms and clamp RGB channels`);
  }

  const routePassesBeforeAttribute = state.metrics.routePasses;
  const contrastCases = [
    { accent: "#ffffff", lightInk: "rgb(0 0 0)", darkInk: "rgb(0 0 0)" },
    { accent: "#000000", lightInk: "rgb(255 255 255)", darkInk: "rgb(255 255 255)" },
    { accent: "#fff0", lightInk: "rgb(0 0 0)", darkInk: "rgb(255 255 255)" },
    { accent: "#00000000", lightInk: "rgb(0 0 0)", darkInk: "rgb(255 255 255)" },
    { accent: "rgba(255, 255, 255, 0.05)", lightInk: "rgb(0 0 0)", darkInk: "rgb(255 255 255)" },
    { accent: "rgba(999, 999, 999, 0.1)", lightInk: "rgb(0 0 0)", darkInk: "rgb(255 255 255)" },
  ];
  for (const nativeAppearance of ["light", "dark"]) {
    for (const { accent, lightInk, darkInk } of contrastCases) {
      const contrast = makeFixture({ nativeAppearance });
      vm.runInNewContext(contrast.payloadFor({
        appearance: "auto",
        colorMode: "explicit",
        explicitColorKeys: ["accent"],
        colors: { accent },
      }), contrast.context);
      assert.equal(contrast.rootStyle.values.get("--ds-green"), accent);
      assert.equal(
        contrast.rootStyle.values.get("--ds-on-accent"),
        nativeAppearance === "light" ? lightInk : darkInk,
        `Explicit ${accent} must keep readable button text in the ${nativeAppearance} shell`,
      );
    }
  }

  for (const { nativeAppearance, panel, expectedInk } of [
    { nativeAppearance: "light", panel: "#0000", expectedInk: "rgb(255 255 255)" },
    { nativeAppearance: "dark", panel: "#fff0", expectedInk: "rgb(0 0 0)" },
  ]) {
    const transparentSurfaces = makeFixture({ nativeAppearance });
    vm.runInNewContext(transparentSurfaces.payloadFor({
      appearance: "auto",
      colorMode: "explicit",
      explicitColorKeys: ["panel", "accent"],
      colors: {
        panel,
        accent: "rgba(0, 0, 0, 0)",
      },
    }), transparentSurfaces.context);
    assert.equal(
      transparentSurfaces.rootStyle.values.get("--ds-on-accent"),
      expectedInk,
      `Transparent accent ink must model the ${panel} composer RGB surface`,
    );
  }

  const adaptiveAccent = makeFixture({ nativeAppearance: "dark" });
  vm.runInNewContext(adaptiveAccent.payloadFor({
    colorMode: "explicit",
    explicitColorKeys: ["accent"],
    colors: { accent: "#ffffff" },
  }), adaptiveAccent.context);
  assert.equal(adaptiveAccent.rootStyle.values.get("--ds-on-accent"), "rgb(0 0 0)");
  vm.runInNewContext(adaptiveAccent.payloadFor(), adaptiveAccent.context);
  assert.equal(adaptiveAccent.rootStyle.values.has("--ds-on-accent"), false,
    "Reapplying an adaptive accent must restore the shell-specific CSS foreground default");
  rootObserver.callback([]);
  home.flushTimers(64);
  assert.equal(state.metrics.routePasses, routePassesBeforeAttribute,
    "Attribute safety pass must not be a route pass");
  const navigationHandler = home.listeners.get("navigation:navigate");
  assert.equal(typeof navigationHandler, "function");
  navigationHandler();
  home.flushTimers(180);
  assert.equal(state.metrics.navigationEvents, 1);
  assert.equal(state.metrics.routePasses, routePassesBeforeAttribute + 1);

  const settings = makeFixture({ nativeAppearance: "light", settings: true });
  vm.runInNewContext(settings.payloadFor(), settings.context);
  assert.equal(settings.window.__CODEX_DREAM_SKIN_STATE__.scope.baseState, "settings");
  assert.equal(settings.window.__CODEX_DREAM_SKIN_STATE__.scope.level, "L0");
  assert.equal(settings.attrs.get("data-dream-base-state"), "settings");
  assert.equal(settings.attrs.get("data-dream-skin"), "active");
  assert.equal(settings.document.adoptedStyleSheets.length, 1);

  const currentSettings = makeFixture({ nativeAppearance: "light", settingsPanel: true });
  vm.runInNewContext(currentSettings.payloadFor(), currentSettings.context);
  const currentSettingsScope = currentSettings.window.__CODEX_DREAM_SKIN_STATE__.scope;
  assert.equal(currentSettingsScope.baseState, "settings",
    "Codex 26.727 general-settings must classify as Settings without legacy appearance controls.");
  assert.equal(currentSettingsScope.level, "L0");
  assert.equal(currentSettingsScope.missingL1.length, 0);
  assert.equal(currentSettings.attrs.get("data-dream-skin"), "active");
  assert.equal(currentSettings.document.adoptedStyleSheets.length, 1);

  const explicit = makeFixture({ nativeAppearance: "light" });
  const result = vm.runInNewContext(explicit.payloadFor({ appearance: "dark", quote: "TEST QUOTE" }), explicit.context);
  assert.equal(result.shell, "dark", "Explicit appearance must beat native appearance");
  assert.equal(explicit.attrs.get("data-dream-shell"), "dark");
  const oldState = explicit.window.__CODEX_DREAM_SKIN_STATE__;
  vm.runInNewContext(explicit.payloadFor({ appearance: "dark" }), explicit.context);
  assert.equal(oldState.cleanup(), false, "A stale cleanup must not remove the replacement");
  const replacement = explicit.window.__CODEX_DREAM_SKIN_STATE__;
  assert.equal(explicit.document.adoptedStyleSheets.length, 1);
  assert.equal(replacement.cleanup(), true);
  assert.equal(explicit.document.adoptedStyleSheets.length, 0);
  assert.equal(explicit.attrs.size, 0);
  assert.equal(explicit.rootStyle.values.size, 0);
  assert.equal(explicit.window.__CODEX_DREAM_SKIN_STATE__, undefined);
  assert.ok([...explicit.domNodes].every((node) => node.getAttribute?.("data-ds-part") === null));
  assert.deepEqual(explicit.revoked, ["blob:fixture-1", "blob:fixture-2"]);

  const fallback = makeFixture({ nativeAppearance: "dark", adopted: false });
  vm.runInNewContext(fallback.payloadFor(), fallback.context);
  const fallbackState = fallback.window.__CODEX_DREAM_SKIN_STATE__;
  assert.equal(fallbackState.styleMode, "style");
  assert.ok(fallback.nodes.has("codex-dream-skin-style"));
  assert.equal(fallbackState.cleanup(), true);
  assert.equal(fallback.nodes.has("codex-dream-skin-style"), false);

  console.log(`PASS: unified renderer runtime (${path.basename(assetRoot)})`);
}

const fixture = { template: "" };
