import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const snapshotDir = path.join(root, "site-snapshot");
const distDir = path.join(root, "dist");
const upcomingEventsSourceDir = path.join(root, "content", "UpcomingEvents");
const upcomingEventsDistDir = path.join(distDir, "content", "upcomingevents");

if (!fs.existsSync(snapshotDir)) {
  console.error("Missing site snapshot at site-snapshot/. Run `npm run sync:live` first.");
  process.exit(1);
}

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });
fs.cpSync(snapshotDir, distDir, { recursive: true });

if (fs.existsSync(upcomingEventsSourceDir)) {
  fs.mkdirSync(upcomingEventsDistDir, { recursive: true });

  for (const entry of fs.readdirSync(upcomingEventsSourceDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;

    const sourcePath = path.join(upcomingEventsSourceDir, entry.name);
    const targetPath = path.join(upcomingEventsDistDir, entry.name);
    fs.copyFileSync(sourcePath, targetPath);
  }
}

console.log("Copied site-snapshot/ to dist/ and overlaid content/UpcomingEvents/ into dist/content/upcomingevents/.");
