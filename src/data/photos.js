/**
 * Central photo catalog used to keep imagery fresh across pages.
 * Every photo can include tags, orientation, and an optional status:
 * - "available": ready to use (default)
 * - "reserved": keep unique to specific context but track usage
 * - "needed": placeholder entry that highlights photography gaps
 */
module.exports = {
  items: [
    {
      id: "support-hero-summer-camp",
      src: "/content/media/patriotic.jpg",
      alt: "Guard-connected youth and families gathered with patriotic bunting",
      tags: ["support", "hero", "patriotic", "families", "event"],
      orientation: "landscape",
      credit: null
    },
    {
      id: "support-stp-panel",
      src: "/assets/img/programs/stp_panel_group.jpg",
      alt: "State Teen Panel members planning a youth leadership session",
      tags: ["support", "stp", "leadership", "teens", "indoor"],
      orientation: "landscape",
      credit: null
    },
    {
      id: "support-momc-purple-up",
      src: "/assets/img/programs/momc_purple_up.jpg",
      alt: "Guard-connected youth wearing purple during Month of the Military Child",
      tags: ["momc", "celebration", "event", "purple-up"],
      orientation: "landscape",
      credit: null
    },
    {
      id: "support-volunteer-celebration",
      src: "/content/media/volunteer.jpg",
      alt: "Volunteer cheering alongside Guard-connected youth during a CYP activity",
      tags: ["volunteers", "celebration", "event", "support"],
      orientation: "landscape",
      credit: null
    },
    {
      id: "support-adventure-kits",
      src: "/assets/img/programs/adventure_kits.jpg",
      alt: "Guard youth holding adventure kits during a community event",
      tags: ["support", "kits", "community", "event"],
      orientation: "landscape",
      credit: null
    },
    {
      id: "support-family-event-dance",
      src: "/assets/img/programs/family_ball_dance.jpg",
      alt: "Guard families dancing at the Military Family Ball",
      tags: ["momc", "event", "families", "celebration"],
      orientation: "landscape",
      credit: null
    },
    {
      id: "stories-hero",
      src: "/content/media/stories.png",
      alt: "Guard-connected youth sharing stories at a community gathering",
      tags: ["stories", "hero", "patriotic", "event", "families"],
      orientation: "landscape",
      credit: null
    },
    {
      id: "momc-kit",
      src: "/content/media/kit.jpg",
      alt: "Students opening Purple Up classroom kits filled with activities",
      tags: ["momc", "kit", "classroom", "resources"],
      orientation: "landscape",
      credit: null
    },
    {
      id: "support-teen-service",
      status: "needed",
      tags: ["stp", "service", "outdoor"],
      orientation: "landscape",
      alt: "Need photo: Teen leaders running an outdoor service project",
      note: "Grab a State Teen Panel shot in action (service project or mentoring younger campers)."
    },
    {
      id: "support-volunteer-outdoor",
      status: "needed",
      tags: ["volunteers", "outdoor", "camp", "mentors"],
      orientation: "landscape",
      alt: "Need photo: Volunteers leading an outdoor activity with Guard youth",
      note: "Photograph volunteers in the field to replace indoor kit-prep photo on Support > Volunteers."
    }
  ]
};
