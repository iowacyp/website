const fs = require("node:fs");
const path = require("node:path");
const matter = require("gray-matter");

const pagesDir = path.join(__dirname, "..", "pages");
const dataDir = __dirname;

const readJson = (filename) => {
  const filePath = path.join(dataDir, filename);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
};

const walkFiles = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walkFiles(fullPath);
    }
    return [fullPath];
  });
};

const stripNunjucks = (value) =>
  value
    .replace(/\{%-?[\s\S]*?-?%\}/g, " ")
    .replace(/\{\{[\s\S]*?\}\}/g, " ");

const stripMarkup = (value) =>
  stripNunjucks(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&lsquo;|&rsquo;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const limitText = (value, max = 180) => {
  if (!value) return "";
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
};

const normalizeUrl = (filePath, permalink) => {
  if (permalink) {
    if (permalink === "/") return "/";
    if (permalink.endsWith("index.html")) return permalink.replace(/index\.html$/, "");
    if (permalink.endsWith(".html")) return permalink.replace(/\.html$/, "/");
    return permalink;
  }

  const slug = path.basename(filePath, path.extname(filePath));
  return slug === "index" ? "/" : `/${slug}/`;
};

const makeSearchText = (...parts) =>
  stripMarkup(parts.filter(Boolean).join(" "))
    .toLowerCase();

const pageFiles = walkFiles(pagesDir).filter((filePath) => /\.(njk|md|html)$/i.test(filePath));
const pageItems = pageFiles
  .map((filePath) => {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = matter(raw);
    const data = parsed.data || {};
    if (data.searchExclude) return null;
    const title = data.title || path.basename(filePath, path.extname(filePath));
    const description = data.description || "";
    const bodyText = stripMarkup(parsed.content);
    const summary = limitText([description, bodyText].filter(Boolean).join(" "), 220);
    const url = normalizeUrl(filePath, data.permalink);
    const searchText = makeSearchText(title, description, bodyText);

    return {
      title,
      url,
      type: "Page",
      summary,
      featured: ["/", "/about/", "/events/", "/resources/", "/contact/", "/support/", "/stories/", "/educators/", "/mental-health-resources/", "/subscribe/"].includes(url),
      keywords: [title, description, bodyText.slice(0, 160)],
      searchText,
    };
  })
  .filter(Boolean)
  .filter((item) => !["/404/", "/404.html"].includes(item.url));

const events = readJson("events.json").events || [];
const eventItems = events.map((event) => ({
  title: event.title,
  url: event.ctaUrl && /^https?:/i.test(event.ctaUrl) ? event.ctaUrl : "/events/#upcoming",
  type: "Event",
  summary: limitText([event.displayDate || event.date, event.location, event.notes].filter(Boolean).join(" · "), 180),
  featured: true,
  external: Boolean(event.ctaUrl && /^https?:/i.test(event.ctaUrl)),
  keywords: [event.title, event.location, event.notes, event.ctaLabel],
  searchText: makeSearchText(event.title, event.date, event.displayDate, event.time, event.location, event.notes, event.ctaLabel),
}));

const resources = readJson("resources.json").items || [];
const resourceItems = resources.map((resource) => ({
  title: resource.label,
  url: resource.url,
  type: "Resource",
  summary: limitText(resource.summary || "", 180),
  featured: ["/content/Media/googleplay.png", "/content/Media/iaarng.jpg", "/content/Media/arngcys.webp", "/content/Media/wfsb.jpg"].includes(resource.image),
  external: /^https?:/i.test(resource.url),
  keywords: [resource.label, resource.summary, resource.notes],
  searchText: makeSearchText(resource.label, resource.summary, resource.notes, resource.url),
}));

const programs = readJson("programs.json").items || [];
const programItems = programs.map((program) => ({
  title: program.name,
  url: program.cta && program.cta.url ? program.cta.url : "/events/#programs",
  type: "Program",
  summary: limitText([program.type, program.targetAudience, program.description].filter(Boolean).join(" · "), 200),
  featured: Boolean(program.featured),
  external: Boolean(program.cta && /^https?:/i.test(program.cta.url || "")),
  keywords: [program.name, program.type, program.targetAudience, program.description, program.quote && program.quote.text],
  searchText: makeSearchText(program.name, program.type, program.targetAudience, program.description, program.quote && program.quote.text, program.quote && program.quote.attribution),
}));

const downloads = readJson("downloads.json").items || [];
const downloadItems = downloads.map((download) => ({
  title: download.title,
  url: "/resources/#downloads",
  type: "Download",
  summary: limitText(download.description || "", 180),
  featured: false,
  external: false,
  keywords: [download.title, download.description],
  searchText: makeSearchText(download.title, download.description, ...(download.thumbnails || []), download.file),
}));

const quotes = readJson("quotes.json").items || [];
const quoteItems = quotes.map((quote) => ({
  title: quote.role || "Story quote",
  url: "/stories/#voices",
  type: "Quote",
  summary: limitText(quote.text || "", 180),
  featured: false,
  external: false,
  keywords: [quote.text, quote.role, quote.useCase, quote.section, quote.author],
  searchText: makeSearchText(quote.text, quote.role, quote.useCase, quote.section, quote.author),
}));

const partners = readJson("partners.json").items || [];
const partnerItems = partners.map((partner) => ({
  title: partner.name,
  url: partner.website,
  type: "Partner",
  summary: limitText(partner.description || "", 180),
  featured: false,
  external: true,
  keywords: [partner.name, partner.description],
  searchText: makeSearchText(partner.name, partner.description, partner.website),
}));

const team = readJson("team.json");
const teamItems = (team.members || []).map((member) => ({
  title: member.name,
  url: "/contact/",
  type: "Contact",
  summary: limitText([member.title, member.organization].filter(Boolean).join(" · "), 180),
  featured: true,
  keywords: [member.name, member.title, member.bio],
  searchText: makeSearchText(member.name, member.title, member.organization, member.bio, member.email, member.phone, team.officeLocation),
}));

module.exports = [
  ...pageItems,
  ...eventItems,
  ...resourceItems,
  ...programItems,
  ...downloadItems,
  ...quoteItems,
  ...partnerItems,
  ...teamItems,
];
