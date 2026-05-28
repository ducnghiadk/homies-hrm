#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const extensionRoot = path.join(
  process.env.USERPROFILE || path.join("/mnt/c/Users", os.userInfo().username),
  ".vscode",
  "extensions",
);

const extensionPrefix = "continue.continue-";
const targetSnippet =
  'Er("updateApplyState",async d=>{t($Ne(d))},[])';
const patchedSnippet =
  'Er("updateApplyState",async d=>{t($Ne(d)),d!=null&&d.status==="done"&&(d.numDiffs??0)>0&&d.filepath&&a.post("acceptDiff",{filepath:d.filepath,streamId:d.streamId})},[])';

function fail(message) {
  console.error(message);
  process.exit(1);
}

function findLatestContinueDir() {
  if (!fs.existsSync(extensionRoot)) {
    fail(`VS Code extensions folder not found: ${extensionRoot}`);
  }

  const dirs = fs
    .readdirSync(extensionRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(extensionPrefix))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (dirs.length === 0) {
    fail(`No Continue extension found under: ${extensionRoot}`);
  }

  return path.join(extensionRoot, dirs[dirs.length - 1]);
}

function main() {
  const continueDir = findLatestContinueDir();
  const bundlePath = path.join(continueDir, "gui", "assets", "index.js");
  const backupPath = `${bundlePath}.bak-autoaccept`;

  if (!fs.existsSync(bundlePath)) {
    fail(`Continue bundle not found: ${bundlePath}`);
  }

  const source = fs.readFileSync(bundlePath, "utf8");

  if (source.includes(patchedSnippet)) {
    console.log(`Patch already present: ${bundlePath}`);
    return;
  }

  if (!source.includes(targetSnippet)) {
    fail(
      [
        "Patch anchor not found in Continue bundle.",
        `Bundle: ${bundlePath}`,
        "Continue may have changed its internal build format.",
      ].join("\n"),
    );
  }

  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(bundlePath, backupPath);
    console.log(`Created backup: ${backupPath}`);
  }

  const nextSource = source.replace(targetSnippet, patchedSnippet);
  fs.writeFileSync(bundlePath, nextSource, "utf8");

  console.log(`Patched Continue auto-accept: ${bundlePath}`);
  console.log("Reload VS Code with: Developer: Reload Window");
}

main();
