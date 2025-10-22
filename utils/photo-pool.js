const path = require("path");

const DATA_PATH = path.join(process.cwd(), "src/data/photos.js");

class PhotoPool {
  constructor(dataPath) {
    this.dataPath = dataPath;
    this.reload();
  }

  reload() {
    delete require.cache[require.resolve(this.dataPath)];
    const photosData = require(this.dataPath);
    const sourceItems = Array.isArray(photosData)
      ? photosData
      : Array.isArray(photosData?.items)
      ? photosData.items
      : [];

    this.items = sourceItems.map((item, index) => ({
      status: "available",
      priority: index,
      ...item
    }));

    this.resetUsage();
  }

  resetUsage() {
    this.usedIds = new Set();
    this.usageLog = [];
  }

  getUsageReport() {
    return [...this.usageLog];
  }

  getPending() {
    return this.items.filter((item) => item.status === "needed");
  }

  createPlaceholder({ alt = "Photo coming soon" } = {}) {
    const label = encodeURIComponent(alt);
    return (
      "data:image/svg+xml;utf8," +
      `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360' viewBox='0 0 640 360'><rect width='100%' height='100%' fill='%23E2E8F0'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%234C1D95' font-size='20' font-family='Arial, sans-serif'>${label}</text></svg>`
    );
  }

  normaliseTags(tags) {
    if (!tags) return [];
    const arr = Array.isArray(tags) ? tags : [tags];
    return arr.map((tag) => String(tag).toLowerCase());
  }

  matchesTags(photo, tags) {
    if (!tags.length) return true;
    const photoTags = this.normaliseTags(photo.tags);
    return tags.every((tag) => photoTags.includes(tag));
  }

  selectCandidate(criteria, { includeNeeded = false } = {}) {
    const tags = this.normaliseTags(criteria.tags);
    const wantsId = criteria.id;
    const orientation = criteria.orientation;
    const excludeIds = new Set(this.normaliseArray(criteria.exclude));
    const allowRepeat = Boolean(criteria.allowRepeat);

    const isAllowedStatus = (photo) => {
      if (photo.status === "needed") {
        return includeNeeded;
      }

      if (Array.isArray(criteria.status)) {
        return criteria.status.includes(photo.status || "available");
      }

      return true;
    };

    const matchesOrientation = (photo) => {
      if (!orientation || !photo.orientation) return true;
      return photo.orientation === orientation;
    };

    const isUsed = (photo) => {
      if (allowRepeat) return false;
      return this.usedIds.has(photo.id);
    };

    return this.items.find((photo) => {
      if (excludeIds.has(photo.id)) return false;
      if (!photo.src && photo.status !== "needed") return false;
      if (wantsId && photo.id !== wantsId) return false;
      if (isUsed(photo)) return false;
      if (!isAllowedStatus(photo)) return false;
      if (!this.matchesTags(photo, tags)) return false;
      if (!matchesOrientation(photo)) return false;
      return true;
    });
  }

  normaliseArray(value) {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  recordUsage(photo, context, note) {
    this.usageLog.push({
      id: photo.id || null,
      src: photo.src || null,
      status: photo.status || null,
      context: context || null,
      note: note || photo.note || null
    });
  }

  request(criteria = {}) {
    const context = criteria.context || null;
    const note = criteria.note || null;
    const allowNeeded = Boolean(criteria.allowNeeded);
    const strict = Boolean(criteria.strict);

    let candidate = null;

    if (criteria.id) {
      candidate = this.selectCandidate(criteria, { includeNeeded: allowNeeded });
    }

    if (!candidate) {
      candidate = this.selectCandidate(criteria, { includeNeeded: false });
    }

    if (!candidate && allowNeeded) {
      candidate = this.selectCandidate(criteria, { includeNeeded: true });
    }

    if (!candidate && !strict) {
      candidate = this.items.find((photo) => {
        if (!photo.src && photo.status !== "needed") return false;
        if (this.usedIds.has(photo.id)) return false;
        if (photo.status === "needed" && !allowNeeded) return false;
        return true;
      });
    }

    let result;

    if (candidate) {
      result = {
        ...candidate,
        alt: criteria.alt || candidate.alt || "",
        status: candidate.status || "available"
      };

      if (result.status === "needed") {
        result.placeholder = this.createPlaceholder(result);
        result.src = result.placeholder;
      }

      this.recordUsage(result, context, note);

      if (result.id && !criteria.allowRepeat) {
        this.usedIds.add(result.id);
      }

      return result;
    }

    if (criteria.fallback) {
      result = {
        id: criteria.fallbackId || "fallback",
        src: criteria.fallback,
        alt: criteria.alt || "",
        status: "fallback",
        note
      };

      this.recordUsage(result, context, note);
      return result;
    }

    const placeholderAlt = criteria.alt || "Photo coming soon";
    result = {
      id: "missing-photo",
      src: this.createPlaceholder({ alt: placeholderAlt }),
      alt: placeholderAlt,
      status: "missing",
      note
    };

    this.recordUsage(result, context, note);
    return result;
  }
}

module.exports = new PhotoPool(DATA_PATH);
