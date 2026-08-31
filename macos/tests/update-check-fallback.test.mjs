import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.resolve(here, "../scripts/check-update-macos.sh");

function macOSTest(name, fn) {
  return test(name, {
    skip: process.platform === "darwin"
      ? false
      : "executes the macOS checker with Apple system utilities",
  }, fn);
}

test("the public release fallback stays pinned to verified personal assets", () => {
  const source = readFileSync(script, "utf8");
  assert.match(source, /REPOSITORY="YuxiangChai\/Codex-Skin"/);
  assert.match(source, /CHECKSUM_URL="https:\/\/github\.com\/\$\{REPOSITORY\}\/releases\/download\/v\$\{LATEST_VERSION\}\/SHA256SUMS\.txt"/);
  assert.match(source, /ASSET_URL_EXPECTED="https:\/\/github\.com\/\$\{REPOSITORY\}\/releases\/download\/v\$\{LATEST_VERSION\}\/\$\{ASSET_NAME\}"/);
  assert.match(source, /\[ "\$CHECKSUM_LINE" = "\$ASSET_SHA256  \$ASSET_NAME" \]/);
  assert.match(source, /\[ "\$ASSET_URL" = "\$ASSET_URL_EXPECTED" \]/);
});

function makeFallback({
  effectiveUrl = "https://github.com/YuxiangChai/Codex-Skin/releases/tag/v9.8.7",
  checksum = `${"a".repeat(64)}  CodexDreamSkin-v9.8.7.dmg\n`,
  headers = [
    "HTTP/2 302",
    "content-length: 0",
    "location: https://release-assets.githubusercontent.com/example",
    "",
    "HTTP/2 200",
    "content-type: application/octet-stream",
    "content-length: 3350526",
    "",
  ].join("\r\n"),
} = {}) {
  const directory = mkdtempSync(path.join(tmpdir(), "dreamskin-update-fallback-"));
  writeFileSync(path.join(directory, "latest-effective-url.txt"), effectiveUrl);
  writeFileSync(path.join(directory, "SHA256SUMS.txt"), checksum);
  writeFileSync(path.join(directory, "asset-headers.txt"), headers);
  return directory;
}

function runFallback(directory) {
  return spawnSync(script, ["--json"], {
    encoding: "utf8",
    env: { ...process.env, CODEX_DREAM_SKIN_TEST_FALLBACK_DIR: directory },
  });
}

macOSTest("the public release fallback preserves exact update metadata", () => {
  const directory = makeFallback();
  try {
    const result = runFallback(directory);
    assert.equal(result.status, 0, result.stderr);
    const metadata = JSON.parse(result.stdout);
    assert.equal(metadata.currentVersion, "v1.5.16.3");
    assert.equal(metadata.latestVersion, "v9.8.7");
    assert.equal(metadata.updateAvailable, true);
    assert.equal(metadata.assetName, "CodexDreamSkin-v9.8.7.dmg");
    assert.equal(metadata.assetUrl,
      "https://github.com/YuxiangChai/Codex-Skin/releases/download/v9.8.7/CodexDreamSkin-v9.8.7.dmg");
    assert.equal(metadata.assetBytes, 3350526);
    assert.equal(metadata.assetSha256, "a".repeat(64));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

for (const [name, fixture] of [
  ["foreign latest-release URL", {
    effectiveUrl: "https://github.com/Fei-Away/Codex-Dream-Skin/releases/tag/v9.8.7",
  }],
  ["latest-release URL with a query", {
    effectiveUrl: "https://github.com/YuxiangChai/Codex-Skin/releases/tag/v9.8.7?download=1",
  }],
  ["checksum for a different filename", {
    checksum: `${"a".repeat(64)}  Other.dmg\n`,
  }],
  ["malformed checksum", {
    checksum: `sha256:${"a".repeat(64)}  CodexDreamSkin-v9.8.7.dmg\n`,
  }],
  ["checksum with an extra line", {
    checksum: `${"a".repeat(64)}  CodexDreamSkin-v9.8.7.dmg\n${"b".repeat(64)}  Other.dmg\n`,
  }],
  ["duplicate final content length", {
    headers: "HTTP/2 200\r\ncontent-length: 3350526\r\ncontent-length: 3350526\r\n",
  }],
  ["non-successful final asset response", {
    headers: "HTTP/2 404\r\ncontent-length: 3350526\r\n",
  }],
  ["zero-length package", {
    headers: "HTTP/2 200\r\ncontent-length: 0\r\n",
  }],
  ["oversized package", {
    headers: "HTTP/2 200\r\ncontent-length: 134217729\r\n",
  }],
]) {
  macOSTest(`the public release fallback rejects ${name}`, () => {
    const directory = makeFallback(fixture);
    try {
      const result = runFallback(directory);
      assert.notEqual(result.status, 0);
      assert.equal(result.stdout, "");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
}

macOSTest("an API response with invalid metadata fails closed instead of consulting fallback", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "dreamskin-update-api-invalid-"));
  const response = path.join(directory, "release.json");
  writeFileSync(response, JSON.stringify({ tag_name: "v9.8.7", assets: [] }));
  try {
    const result = spawnSync(script, ["--json"], {
      encoding: "utf8",
      env: { ...process.env, CODEX_DREAM_SKIN_TEST_RESPONSE_FILE: response },
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /expected macOS installer/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
