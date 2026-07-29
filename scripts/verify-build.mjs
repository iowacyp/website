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

const storyDataPath = path.join(root, "src", "data", "storyGallery.json");
const storyData = JSON.parse(fs.readFileSync(storyDataPath, "utf8"));
const stories = storyData.items;
if (!Array.isArray(stories) || stories.length === 0) {
  fail("storyGallery.json must contain at least one story");
}

const requiredStoryFields = [
  "id", "title", "eyebrow", "published", "image", "thumbnail", "alt",
  "hook", "quote", "body", "impact",
];
const storyIds = new Set();
let previousStoryCardPosition = -1;
const storiesIndex = fs.readFileSync(path.join(distDir, "stories", "index.html"), "utf8");
const kioskIndex = fs.readFileSync(path.join(distDir, "story-gallery", "index.html"), "utf8");
const kioskWorker = fs.readFileSync(path.join(distDir, "story-gallery", "sw.js"), "utf8");
const stpIndex = fs.readFileSync(path.join(distDir, "state-teen-panel", "index.html"), "utf8");
const sitemap = fs.readFileSync(path.join(distDir, "sitemap.xml"), "utf8");

function sourceAssetPath(asset) {
  if (asset.startsWith("/assets/")) return path.join(root, "src", asset);
  if (asset.startsWith("/content/")) return path.join(root, asset);
  return null;
}

for (const story of stories) {
  for (const field of requiredStoryFields) {
    if (!story[field] || (Array.isArray(story[field]) && story[field].length === 0)) {
      fail(`story ${story.id || "(missing id)"} is missing required field: ${field}`);
    }
  }

  if (storyIds.has(story.id)) fail(`duplicate story id: ${story.id}`);
  storyIds.add(story.id);

  const storyAssets = [story.image, story.thumbnail, ...(story.gallery || []).map((image) => image.src)];
  for (const asset of storyAssets) {
    const assetPath = sourceAssetPath(asset);
    if (!assetPath || !fs.existsSync(assetPath)) {
      fail(`story ${story.id} references a missing local asset: ${asset}`);
    }
    if (!kioskWorker.includes(JSON.stringify(asset))) {
      fail(`story ${story.id} asset is missing from the kiosk offline cache: ${asset}`);
    }
  }

  const publicStoryPath = path.join(distDir, "stories", story.id, "index.html");
  if (!fs.existsSync(publicStoryPath)) fail(`public story page was not generated: ${story.id}`);
  const publicStory = fs.readFileSync(publicStoryPath, "utf8");
  const storyCardPosition = storiesIndex.indexOf(`/stories/${story.id}/`);
  if (storyCardPosition < 0) fail(`Stories page is missing: ${story.id}`);
  if (storyCardPosition <= previousStoryCardPosition) {
    fail(`Stories page order does not match storyGallery.json at: ${story.id}`);
  }
  previousStoryCardPosition = storyCardPosition;
  if (!kioskIndex.includes(`data-story-id="${story.id}"`)) fail(`kiosk is missing: ${story.id}`);
  if (!sitemap.includes(`/stories/${story.id}/`)) fail(`sitemap is missing story: ${story.id}`);

  if (story.morePhotosUrl) {
    if (!publicStory.includes(story.morePhotosUrl)) {
      fail(`public story page is missing its photo link: ${story.id}`);
    }
    if (!kioskIndex.includes(story.morePhotosUrl)) {
      fail(`story gallery is missing its photo link: ${story.id}`);
    }
  }

  if (story.audiences?.includes("stp") && !stpIndex.includes(`/stories/${story.id}/`)) {
    fail(`STP-tagged story is missing from the State Teen Panel page: ${story.id}`);
  }
}

console.log("Build verification passed.");
