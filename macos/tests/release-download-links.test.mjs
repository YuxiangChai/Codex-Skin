import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

test("release notes download assets from the repository running the workflow", async () => {
  const workflow = await fs.readFile(
    path.join(projectRoot, ".github", "workflows", "release.yml"),
    "utf8",
  );

  assert.doesNotMatch(
    workflow,
    /github\.com\/Fei-Away\/Codex-Dream-Skin\/releases\/download/,
    "A personal repository release must not send users to the upstream binaries.",
  );
  assert.match(
    workflow,
    /github\.com\/\$\{GITHUB_REPOSITORY\}\/releases\/download\/v\$\{VERSION\}/,
    "Release links must be derived from the repository running the workflow.",
  );
});
