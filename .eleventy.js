const photoPool = require("./utils/photo-pool");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets/img": "assets/img" });
  eleventyConfig.addPassthroughCopy({ "src/assets/js": "assets/js" });
  eleventyConfig.addPassthroughCopy({ "src/assets/video": "assets/video" });
  eleventyConfig.addPassthroughCopy({ "src/assets/files": "assets/files" });
  eleventyConfig.addPassthroughCopy({ "src/assets/static": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/assets/pwa": "assets/pwa" });
  eleventyConfig.addPassthroughCopy({ "content/Media": "content/Media" });
  eleventyConfig.addPassthroughCopy({ "src/data/events.json": "events.json" });
  eleventyConfig.addPassthroughCopy("src/manifest.webmanifest");
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
