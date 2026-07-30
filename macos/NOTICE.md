# Notices

Codex Dream Skin Studio is an **unofficial** customization project and is **not affiliated with, endorsed by, or sponsored by OpenAI**.

## Software license

The MIT License in `LICENSE` applies to the **software source code** in this repository (scripts, CSS, injectors, docs that describe the software, and the abstract demo asset generated for this repo).

It does **not** grant rights to:

- OpenAI or Codex trademarks, product names, logos, or trade dress
- Official Codex / ChatGPT application binaries, `.app` bundles, or `app.asar`
- Any user-supplied images or third-party artwork you drop into a theme
- Character likenesses, franchise art, or celebrity imagery

## Demo artwork

`assets/portal-hero.png` is original abstract geometric art generated for this open-source repository (no characters). Replace it with your own image before shipping a branded theme to customers.

## Iron Man preset

`presets/preset-iron-man/background.jpg` and the byte-identical Windows
`assets/dream-reference.jpg` are user-supplied AI-generated artwork. The user
explicitly confirmed that this artwork may be redistributed with this personal
release. The artwork remains outside the MIT software license unless its owner
separately grants those terms.

“Iron Man” and related character elements may be trademarks or copyrighted
material of their respective owners. Their appearance here does not imply
affiliation with or endorsement by Marvel, Disney, OpenAI, or Codex.

## Runtime

- The macOS package does not redistribute Node.js. It validates and uses the
  Node.js executable already signed and bundled inside the user's official
  Codex desktop application.
- The Windows Setup.exe redistributes only `node.exe` and `LICENSE` from the
  pinned official Node.js v22.23.1 win-x64 archive after verifying its published
  SHA-256. Node.js is distributed under its own license; that license is kept
  beside the bundled executable in `runtime/node/LICENSE`.

## Inno Setup Simplified Chinese messages

The Windows installer is compiled with Inno Setup. Its Simplified Chinese
messages file is vendored unchanged from the official Inno Setup source tag
`is-6_7_1` at
`windows/installer/languages/ChineseSimplified.isl`, maintained by Zhenghan
Yang and distributed under the Inno Setup License. The full license is retained
at `windows/installer/languages/Inno-Setup-License.txt`.

## Security model

Themes are applied through Chromium DevTools Protocol on **loopback only**. While a themed session is running, treat the local debugging port as sensitive: do not run untrusted local software that could attach to it. Use the Restore launcher to tear down the themed session and debugging port.
