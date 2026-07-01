import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const statePath = path.join(root, ".netlify", "state.json");
const snapshotDir = path.join(root, "site-snapshot");

if (!fs.existsSync(statePath)) {
  console.error("Missing .netlify/state.json. Link the site with Netlify CLI first.");
  process.exit(1);
}

const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
const siteId = state.siteId;

if (!siteId) {
  console.error("Could not read siteId from .netlify/state.json.");
  process.exit(1);
}

const files = JSON.parse(
  execFileSync(
    "netlify",
    ["api", "listSiteFiles", "--data", JSON.stringify({ site_id: siteId })],
    { cwd: root, encoding: "utf8", maxBuffer: 50 * 1024 * 1024 }
  )
).filter((file) => file.path !== "/netlify.toml");

if (files.length === 0) {
  console.error("Netlify returned no site files for the current production alias.");
  process.exit(1);
}

fs.rmSync(snapshotDir, { recursive: true, force: true });
fs.mkdirSync(snapshotDir, { recursive: true });

const baseUrl = "https://www.iowacyp.com";

const roots = ["dist", "src", "content"];
const lowercasePathMap = new Map();

function walk(dir, base = dir) {
  if (!fs.existsSync(dir)) {
    return;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath, base);
      continue;
    }

    const relativePath = path.relative(root, fullPath).replace(/\\/g, "/");
    lowercasePathMap.set(relativePath.toLowerCase(), fullPath);
  }
}

for (const dir of roots) {
  walk(path.join(root, dir));
}

function sha1(buffer) {
  return crypto.createHash("sha1").update(buffer).digest("hex");
}

function findMatchingLocalFile(file) {
  const candidates = [
    `dist${file.path}`,
    file.path.replace(/^\/+/, ""),
    `src${file.path}`,
  ];

  for (const candidate of candidates) {
    const exactPath = path.join(root, candidate);
    const mappedPath = lowercasePathMap.get(candidate.toLowerCase());

    for (const possiblePath of [exactPath, mappedPath]) {
      if (!possiblePath || !fs.existsSync(possiblePath) || fs.statSync(possiblePath).isDirectory()) {
        continue;
      }

      const buffer = fs.readFileSync(possiblePath);
      if (sha1(buffer) === file.sha) {
        return buffer;
      }
    }
  }

  return null;
}

for (const file of files) {
  const relativePath = file.path.replace(/^\/+/, "");
  const targetPath = path.join(snapshotDir, relativePath);
  const targetDir = path.dirname(targetPath);

  fs.mkdirSync(targetDir, { recursive: true });

  const localBuffer = findMatchingLocalFile(file);
  if (localBuffer) {
    fs.writeFileSync(targetPath, localBuffer);
    continue;
  }

  const url = `${baseUrl}${file.path}`;
  const response = await fetch(url);

  if (!response.ok) {
    console.error(`Failed to download ${file.path}: ${response.status} ${response.statusText}`);
    process.exit(1);
  }

  const liveBuffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(targetPath, liveBuffer);
}

console.log(`Synced ${files.length} files from ${baseUrl} to site-snapshot/.`);
