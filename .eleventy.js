const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const photoPool = require("./utils/photo-pool");

const imageMetaCache = new Map();
const contentMediaFiles = [
  "1593491592788477691.jpg",
  "38084-416330724_medium.mp4",
  "5027202-uhd_4096_2160_30fps.mp4",
  "7106702-uhd_3840_2160_30fps.mp4",
  "846-140823862_small.mp4",
  "about.mp4",
  "CYPSail.svg",
  "MFB-Recap.jpg",
  "Proc.jpg",
  "PurpleUPStory.jpg",
  "VeteranPicture.jpeg",
  "wfsb.jpg",
  "arngcys.webp",
  "ball2.jpg",
  "charlee.jpg",
  "goldstar.jpg",
  "googleplay.png",
  "iaarng.jpg",
  "islaandrylee.jpg",
  "kit.jpg",
  "lemon.jpg",
  "patriotic.jpg",
  "purplestarschools.png",
  "size0-full.jpg",
  "stories-hero.mp4",
  "stories.png",
  "tutor-square-color.png",
  "volunteer.jpg",
  "website-recap.mp4",
];

const resolveImagePath = (src) => {
  if (!src || typeof src !== "string") return null;
  if (/^(https?:)?\/\//i.test(src) || src.startsWith("data:")) return null;

  const cleanPath = src.split("?")[0].split("#")[0].replace(/^\//, "");
  const candidates = [
    path.join(__dirname, cleanPath),
    path.join(__dirname, "src", cleanPath),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) || null;
};

const readDimensions = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const buffer = fs.readFileSync(filePath);

  if (ext === ".png" && buffer.length >= 24) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }

  if ((ext === ".jpg" || ext === ".jpeg") && buffer.length >= 4) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xFF) break;
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);

      if (
        marker === 0xC0 ||
        marker === 0xC1 ||
        marker === 0xC2 ||
        marker === 0xC3 ||
        marker === 0xC5 ||
        marker === 0xC6 ||
        marker === 0xC7 ||
        marker === 0xC9 ||
        marker === 0xCA ||
        marker === 0xCB ||
        marker === 0xCD ||
        marker === 0xCE ||
        marker === 0xCF
      ) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        };
      }

      offset += 2 + length;
    }
  }

  if (ext === ".gif" && buffer.length >= 10) {
    return {
      width: buffer.readUInt16LE(6),
      height: buffer.readUInt16LE(8),
    };
  }

  if (ext === ".webp" && buffer.length >= 30 && buffer.toString("ascii", 12, 16) === "VP8X") {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }

  if (ext === ".svg") {
    const text = buffer.toString("utf8");
    const widthMatch = text.match(/\bwidth="([\d.]+)(px)?"/i);
    const heightMatch = text.match(/\bheight="([\d.]+)(px)?"/i);
    const viewBoxMatch = text.match(/\bviewBox="[\d.\s-]+"/i);

    if (widthMatch && heightMatch) {
      return {
        width: Math.round(Number(widthMatch[1])),
        height: Math.round(Number(heightMatch[1])),
      };
    }

    if (viewBoxMatch) {
      const numbers = viewBoxMatch[0].match(/[-\d.]+/g)?.map(Number) || [];
      if (numbers.length === 4) {
        return {
          width: Math.round(numbers[2]),
          height: Math.round(numbers[3]),
        };
      }
    }
  }

  return null;
};

const imageAttrs = (src) => {
  const filePath = resolveImagePath(src);
  if (!filePath) return "";

  const cached = imageMetaCache.get(filePath);
  if (cached) return cached;

  const dimensions = readDimensions(filePath);
  if (!dimensions) return "";

  const attrs = `width="${dimensions.width}" height="${dimensions.height}"`;
  imageMetaCache.set(filePath, attrs);
  return attrs;
};

const jsonStringify = (value) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

const getFeaturedEvent = (events) =>
  Array.isArray(events) ? events.find((event) => event?.featured === true) || null : null;

const getStoryOfflineAssets = (stories = []) => {
  const assets = [
    "/story-gallery/",
    "/assets/css/site.css",
    "/assets/js/story-gallery.js",
    "/assets/img/branding_symbol.png",
    "/assets/pwa/icon-192.png",
  ];

  for (const story of stories) {
    if (story?.image) assets.push(story.image);
    if (story?.thumbnail) assets.push(story.thumbnail);
    for (const image of story?.gallery || []) {
      if (image?.src) assets.push(image.src);
    }
  }

  return [...new Set(assets)];
};

const getStoryCacheVersion = (stories = []) => {
  const hash = crypto.createHash("sha256").update(JSON.stringify(stories));
  for (const asset of getStoryOfflineAssets(stories)) {
    const filePath = resolveImagePath(asset);
    if (filePath) hash.update(fs.readFileSync(filePath));
  }
  return hash.digest("hex").slice(0, 12);
};

const storiesForAudience = (stories = [], audience, limit) => {
  const matches = stories.filter((story) => story?.audiences?.includes(audience));
  return Number.isInteger(limit) ? matches.slice(0, limit) : matches;
};

module.exports = function (eleventyConfig) {
  eleventyConfig.addNunjucksGlobal("imageAttrs", imageAttrs);
  eleventyConfig.addNunjucksGlobal("jsonStringify", jsonStringify);
  eleventyConfig.addNunjucksGlobal("getFeaturedEvent", getFeaturedEvent);
  eleventyConfig.addNunjucksGlobal("storyOfflineAssets", getStoryOfflineAssets);
  eleventyConfig.addNunjucksGlobal("storyCacheVersion", getStoryCacheVersion);
  eleventyConfig.addFilter("storiesForAudience", storiesForAudience);
  eleventyConfig.addPassthroughCopy({ "src/assets/img": "assets/img" });
  eleventyConfig.addPassthroughCopy({ "src/assets/js": "assets/js" });
  eleventyConfig.addPassthroughCopy({ "src/assets/video": "assets/video" });
  eleventyConfig.addPassthroughCopy({ "src/assets/files": "assets/files" });
  eleventyConfig.addPassthroughCopy({ "src/assets/static": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/assets/pwa": "assets/pwa" });
  for (const fileName of contentMediaFiles) {
    eleventyConfig.addPassthroughCopy({
      [`content/Media/${fileName}`]: `content/Media/${fileName}`,
    });
  }
  eleventyConfig.addPassthroughCopy({ "content/UpcomingEvents": "content/UpcomingEvents" });
  eleventyConfig.addPassthroughCopy({ "src/data/events.json": "events.json" });
  eleventyConfig.addPassthroughCopy("src/robots.txt");

  eleventyConfig.addWatchTarget("src/assets/css");

  eleventyConfig.addNunjucksGlobal("requestPhoto", function (criteria = {}) {
    return photoPool.request(criteria);
  });

  eleventyConfig.addNunjucksGlobal("photoNeeds", function () {
    return photoPool.getPending();
  });

  eleventyConfig.addNunjucksGlobal("photoUsage", function () {
    return photoPool.getUsageReport();
  });

  eleventyConfig.on("beforeBuild", () => {
    photoPool.resetUsage();
  });

  eleventyConfig.on("beforeWatch", () => {
    photoPool.reload();
  });

  return {
    dir: {
      input: "src",
      data: "data",
      includes: "_includes",
      output: "dist"
    },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    dataTemplateEngine: "njk"
  };
};
