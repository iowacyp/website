import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const distDir = path.join(root, "dist");
const githubWorkflowsDir = path.join(root, ".github", "workflows");

function fail(message) {
  console.error(`Build verification failed: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(distDir)) {
  fail("dist/ does not exist. Run the build first.");
}

function hasExactChildName(dir, name) {
  if (!fs.existsSync(dir)) return false;
  return fs.readdirSync(dir, { withFileTypes: true }).some((entry) => entry.name === name);
}

function walkFiles(dir, callback) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, callback);
      continue;
    }

    callback(fullPath);
  }
}

if (hasExactChildName(distDir, "pages")) {
  fail("forbidden legacy path still exists: dist/pages");
}

const distContentDir = path.join(distDir, "content");
if (hasExactChildName(distContentDir, "upcomingevents")) {
  fail("forbidden legacy path still exists: dist/content/upcomingevents");
}

if (hasExactChildName(root, "CNAME")) {
  fail("GitHub Pages indicator found at repo root: CNAME");
}

const textExtensions = new Set([
  ".html",
  ".htm",
  ".js",
  ".json",
  ".xml",
  ".txt",
  ".webmanifest",
  ".svg",
  ".css",
]);

const forbiddenPatterns = [
  { pattern: /href="\/pages\//g, label: "legacy /pages/ links" },
  { pattern: /src="\/pages\//g, label: "legacy /pages/ assets" },
  { pattern: /action="\/pages\//g, label: "legacy /pages/ form actions" },
  { pattern: /site-snapshot/i, label: "snapshot references" },
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!textExtensions.has(path.extname(entry.name).toLowerCase())) {
      continue;
    }

    const content = fs.readFileSync(fullPath, "utf8");
    for (const rule of forbiddenPatterns) {
      if (rule.pattern.test(content)) {
        fail(`${rule.label} found in ${path.relative(root, fullPath)}`);
      }
    }
  }
}

walk(distDir);

const forbiddenWorkflowPatterns = [
  { pattern: /actions\/deploy-pages/i, label: "GitHub Pages deploy action" },
  { pattern: /actions\/upload-pages-artifact/i, label: "GitHub Pages artifact action" },
  { pattern: /peaceiris\/actions-gh-pages/i, label: "gh-pages publish action" },
  { pattern: /\bgh-pages\b/i, label: "gh-pages branch or publish reference" },
  { pattern: /\bgithub\.io\b/i, label: "GitHub Pages domain reference" },
];

walkFiles(githubWorkflowsDir, (fullPath) => {
  if (!/\.(ya?ml)$/i.test(fullPath)) {
    return;
  }

  const content = fs.readFileSync(fullPath, "utf8");
  for (const rule of forbiddenWorkflowPatterns) {
    if (rule.pattern.test(content)) {
      fail(`${rule.label} found in ${path.relative(root, fullPath)}`);
    }
  }
});

console.log("Build verification passed.");
