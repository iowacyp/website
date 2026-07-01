import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const distDir = path.join(root, "dist");
const maxDistBytes = 220 * 1024 * 1024;
const maxFileBytes = 35 * 1024 * 1024;

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function fail(message) {
  console.error(`Asset size check failed: ${message}`);
  process.exit(1);
}

function walkFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, files);
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

if (!fs.existsSync(distDir)) {
  fail("dist/ does not exist. Run the build first.");
}

const files = walkFiles(distDir);
const totalBytes = files.reduce((sum, filePath) => sum + fs.statSync(filePath).size, 0);
const oversizedFiles = files
  .map((filePath) => ({ filePath, size: fs.statSync(filePath).size }))
  .filter((file) => file.size > maxFileBytes)
  .sort((left, right) => right.size - left.size);

if (totalBytes > maxDistBytes) {
  fail(`dist/ is ${formatBytes(totalBytes)}; budget is ${formatBytes(maxDistBytes)}.`);
}

if (oversizedFiles.length > 0) {
  const details = oversizedFiles
    .map((file) => `${path.relative(root, file.filePath)} (${formatBytes(file.size)})`)
    .join(", ");
  fail(`files exceed ${formatBytes(maxFileBytes)}: ${details}`);
}

console.log(`Asset size check passed: dist/ is ${formatBytes(totalBytes)} across ${files.length} files.`);
