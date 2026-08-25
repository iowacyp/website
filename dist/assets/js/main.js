document.documentElement.classList.add('js');

// Mobile navigation with focus trap
const navToggle = document.getElementById('navToggle');
const mobileNav = document.getElementById('mobileNav');
const navOverlay = document.getElementById('navOverlay');
let navOpen = false;
let previousFocus = null;
let bodyScrollLockCount = 0;
let bodyScrollY = 0;

const lockBodyScroll = () => {
  bodyScrollLockCount += 1;
  if (bodyScrollLockCount > 1) return;

  bodyScrollY = window.scrollY || window.pageYOffset || 0;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${bodyScrollY}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';
  document.body.style.overflow = 'hidden';
};

const unlockBodyScroll = () => {
  if (bodyScrollLockCount === 0) return;
  bodyScrollLockCount -= 1;
  if (bodyScrollLockCount > 0) return;

  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  document.body.style.overflow = '';
  window.scrollTo(0, bodyScrollY);
};

const getNavFocusable = () => {
  if (!mobileNav) return [];
  return Array.from(mobileNav.querySelectorAll('[data-nav-focus], [data-nav-close], [data-nav-parent-button], a, button'))
    .filter(
    (el) => !el.hasAttribute('disabled')
    );
};

const collapseMobileSubmenus = () => {
  if (!mobileNav) return;
  const parentButtons = mobileNav.querySelectorAll('[data-nav-parent-button]');
  const submenus = mobileNav.querySelectorAll('[data-nav-submenu]');

  parentButtons.forEach((button) => {
    button.setAttribute('aria-expanded', 'false');
    const icon = button.querySelector('svg');
    if (icon) icon.classList.remove('rotate-180');
  });

  submenus.forEach((submenu) => {
    submenu.classList.remove('is-open');
    submenu.setAttribute('aria-hidden', 'true');
  });
};

const closeNav = () => {
  if (!mobileNav || !navToggle) return;
  navOpen = false;
  mobileNav.classList.add('translate-x-full');
  mobileNav.classList.remove('drawer-open');
  mobileNav.setAttribute('aria-hidden', 'true');
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.classList.remove('ring-2', 'ring-primary/40');
  if (navOverlay) {
    navOverlay.classList.add('hidden');
  }
  unlockBodyScroll();
  collapseMobileSubmenus();
  if (previousFocus) {
    previousFocus.focus();
  }
  previousFocus = null;
};

const openNav = () => {
  if (!mobileNav || !navToggle) return;
  navOpen = true;
  previousFocus = document.activeElement;
  mobileNav.classList.remove('translate-x-full');
  mobileNav.classList.add('drawer-open');
  mobileNav.setAttribute('aria-hidden', 'false');
  navToggle.setAttribute('aria-expanded', 'true');
  navToggle.classList.add('ring-2', 'ring-primary/40');
  if (navOverlay) {
    navOverlay.classList.remove('hidden');
  }
  lockBodyScroll();
  const focusable = getNavFocusable();
  if (focusable.length) {
    focusable[0].focus();
  }
};

const handleNavKeydown = (event) => {
  if (!navOpen) return;
  if (event.key === 'Tab') {
    const focusable = getNavFocusable();
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  } else if (event.key === 'Escape') {
    event.preventDefault();
    closeNav();
  }
};

if (navToggle && mobileNav) {
  mobileNav.setAttribute('aria-hidden', 'true');
  mobileNav.classList.add('translate-x-full');
  navToggle.addEventListener('click', () => {
    if (navOpen) {
      closeNav();
    } else {
      openNav();
    }
  });
  document.addEventListener('keydown', handleNavKeydown);
  const closeButton = mobileNav.querySelector('[data-nav-close]');
  if (closeButton) {
    closeButton.addEventListener('click', closeNav);
  }

  mobileNav.querySelectorAll('[data-nav-parent-button]').forEach((button) => {
    button.addEventListener('click', () => {
      const container = button.closest('[data-nav-item]');
      const submenu = container?.querySelector('[data-nav-submenu]');
      if (!submenu) return;

      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      submenu.classList.toggle('is-open', !expanded);
      submenu.setAttribute('aria-hidden', expanded ? 'true' : 'false');

      const icon = button.querySelector('svg');
      if (icon) icon.classList.toggle('rotate-180', !expanded);
    });
  });

  mobileNav.addEventListener('click', (event) => {
    if (event.target.matches('[data-nav-focus]')) {
      closeNav();
    }
  });
  if (navOverlay) {
    navOverlay.addEventListener('click', closeNav);
  }
}

// Desktop dropdown hover-intent — 200 ms close delay prevents accidental triggers
{
  const navItems = document.querySelectorAll('header.nav nav > ul > .nav-item');
  let closeTimer = null;
  let activeItem = null;

  const closeItem = (li) => {
    li.removeAttribute('data-open');
    if (activeItem === li) activeItem = null;
  };

  const openItem = (li) => {
    clearTimeout(closeTimer);
    if (activeItem && activeItem !== li) {
      closeItem(activeItem);
    }
    activeItem = li;
    li.setAttribute('data-open', '');
  };

  const scheduleClose = (li) => {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      closeItem(li);
    }, 200);
  };

  navItems.forEach((li) => {
    const trigger = li.querySelector(':scope > a[data-nav-trigger]');
    const panel = li.querySelector('[data-nav-panel]');

    if (!trigger || !panel) return;

    trigger.addEventListener('mouseenter', () => openItem(li));
    trigger.addEventListener('mouseleave', () => scheduleClose(li));
    trigger.addEventListener('focus', () => openItem(li));
    trigger.addEventListener('blur', (event) => {
      if (!li.contains(event.relatedTarget)) {
        scheduleClose(li);
      }
    });
    panel.addEventListener('mouseenter', () => openItem(li));
    panel.addEventListener('mouseleave', () => scheduleClose(li));
    li.addEventListener('focusin', () => openItem(li));
    li.addEventListener('focusout', (event) => {
      if (!li.contains(event.relatedTarget)) {
        scheduleClose(li);
      }
    });
  });

  window.addEventListener('scroll', () => {
    if (activeItem) {
      closeItem(activeItem);
    }
  }, { passive: true });
}

const setupFrameEmbeds = () => {
  const frames = Array.from(document.querySelectorAll('iframe[data-frame-src], iframe[data-frame-eager]'));
  if (!frames.length) return;

  const markLoaded = (frame) => {
    frame.classList.add('is-loaded');
    const shell = frame.closest('[data-frame-shell]');
    if (shell) {
      shell.setAttribute('data-frame-loaded', 'true');
    }
  };

  const hydrateFrame = (frame) => {
    if (frame.dataset.frameHydrated === 'true') return;
    const src = frame.dataset.frameSrc;
    if (!src) return;

    frame.dataset.frameHydrated = 'true';
    frame.addEventListener('load', () => markLoaded(frame), { once: true });
    frame.src = src;
  };

  const observeOptions = {
    rootMargin: '220px 0px',
    threshold: 0.01,
  };

  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && entry.intersectionRatio <= 0) {
            return;
          }
          observer.unobserve(entry.target);
          hydrateFrame(entry.target);
        });
      }, observeOptions)
    : null;

  frames.forEach((frame) => {
    frame.classList.add('frame-embed');

    if (frame.dataset.frameBound === 'true') return;
    frame.dataset.frameBound = 'true';

    const shell = frame.closest('[data-frame-shell]');
    if (shell) {
      shell.setAttribute('data-frame-loaded', 'false');
    }

    if (frame.hasAttribute('data-frame-eager')) {
      hydrateFrame(frame);
      return;
    }

    if (observer) {
      observer.observe(frame);
    } else {
      hydrateFrame(frame);
    }
  });
};

setupFrameEmbeds();

const setupVideoFades = () => {
  const videos = Array.from(document.querySelectorAll('video[data-video-fade], video[data-video-lazy], .hero-video'));
  if (!videos.length) return;

  const startVideo = (video) => {
    if (video.dataset.videoMotionDisabled === 'true') return;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        // Autoplay can still be blocked by browser policy; poster remains visible.
      });
    }
  };

  const markLoaded = (video) => {
    const shell = video.closest('[data-video-shell], [data-frame-shell], .hero-video-wrapper, .video-shell');
    if (shell) {
      shell.setAttribute('data-video-loaded', 'true');
    }
    video.setAttribute('data-video-loaded', 'true');
  };

  const markLoadedAndPlay = (video) => {
    markLoaded(video);
    startVideo(video);
  };

  const prepareVideo = (video) => {
    if (video.dataset.videoBound === 'true') return;
    video.dataset.videoBound = 'true';
    video.muted = true;
    video.defaultMuted = true;
    video.autoplay = true;
    video.playsInline = true;

    const shell = video.closest('[data-video-shell], [data-frame-shell], .hero-video-wrapper, .video-shell');
    if (shell) {
      shell.setAttribute('data-video-loaded', 'false');
    }

    const lazySources = Array.from(video.querySelectorAll('source[data-src]'));
    if (lazySources.length) {
      lazySources.forEach((source) => {
        source.src = source.dataset.src;
      });
    }

    video.load();

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      markLoadedAndPlay(video);
      return;
    }

    ['loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough', 'playing'].forEach((eventName) => {
      video.addEventListener(eventName, () => markLoadedAndPlay(video), { once: true });
    });
  };

  videos.forEach(prepareVideo);

  const retryVideos = () => {
    videos.forEach((video) => {
      if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
        markLoadedAndPlay(video);
      }
    });
  };

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) retryVideos();
  });
  ['pointerdown', 'touchstart', 'keydown'].forEach((eventName) => {
    window.addEventListener(eventName, retryVideos, { once: true, passive: true });
  });
};

setupVideoFades();

const scrollReveal = (() => {
  const SELECTOR = '[data-reveal]';
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let observer = null;
  let globalOrder = 0;

  const makeVisible = (element) => {
    element.classList.add('reveal-visible');
    element.classList.remove('reveal-on-scroll');
  };

  const handleEntries = (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting && entry.intersectionRatio <= 0) {
        return;
      }
      const element = entry.target;
      observer.unobserve(element);
      requestAnimationFrame(() => {
        makeVisible(element);
      });
    });
  };

  const ensureObserver = () => {
    if (observer) return observer;
    observer = new IntersectionObserver(handleEntries, {
      threshold: 0.08,
      rootMargin: '0px 0px -3% 0px',
    });
    return observer;
  };

  const init = (scope = document) => {
    const elements = scope.querySelectorAll(SELECTOR);
    if (!elements.length) return;

    if (reduceMotionQuery.matches) {
      elements.forEach((el) => {
        if (!el.dataset.revealPrepared) {
          el.dataset.revealPrepared = 'true';
        }
        makeVisible(el);
      });
      return;
    }

    const obs = ensureObserver();
    elements.forEach((el) => {
      if (el.dataset.revealPrepared) return;
      el.dataset.revealPrepared = 'true';
      el.classList.add('reveal-on-scroll');
      el.style.setProperty('--reveal-order', Math.min(globalOrder, 6));
      globalOrder += 1;
      obs.observe(el);
    });
  };

  if (reduceMotionQuery.addEventListener) {
    reduceMotionQuery.addEventListener('change', () => {
      if (reduceMotionQuery.matches) {
        init();
      }
    });
  } else if (reduceMotionQuery.addListener) {
    reduceMotionQuery.addListener(() => {
      if (reduceMotionQuery.matches) {
        init();
      }
    });
  }

  return { init };
})();

scrollReveal.init();

// Render Upcoming Events from JSON (if present)
const formatEventDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(date);
};

const sortEventsByDate = (events, direction = 'asc') =>
  [...events].sort((left, right) => {
    const leftFeatured = Boolean(left.featured);
    const rightFeatured = Boolean(right.featured);

    if (direction === 'asc' && leftFeatured !== rightFeatured) {
      return leftFeatured ? -1 : 1;
    }

    const leftDate = left.date || '';
    const rightDate = right.date || '';
    return direction === 'desc'
      ? rightDate.localeCompare(leftDate)
      : leftDate.localeCompare(rightDate);
  });

const isEventFull = (event) => event.full === true || event.full === 'true';

const DEFAULT_PROGRAM_YEAR = {
  label: '2026–27 Program Year',
  start: '2026-09-01',
  end: '2027-08-31',
};

const escapeEventHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const getEventRegistrationId = (event) => {
  if (event?.adminId) return String(event.adminId).toLowerCase();
  const match = String(event?.ctaUrl || '').match(/\/register\/([0-9a-f-]{36})(?:[/?#]|$)/i);
  return match ? match[1].toLowerCase() : '';
};

const hasEventValue = (value) => value !== undefined && value !== null && value !== '';

const mergeEventRecords = (existing, incoming) => {
  const adminRecord = incoming.adminId ? incoming : existing.adminId ? existing : null;
  if (!adminRecord) return incoming;
  const companionRecord = adminRecord === incoming ? existing : incoming;
  const merged = { ...companionRecord };

  Object.entries(adminRecord).forEach(([key, value]) => {
    if (hasEventValue(value)) merged[key] = value;
  });

  return merged;
};

const normalizeEventTitle = (title = '') => String(title).replace(/^MFE\s+/i, 'Military Family Event: ');

const normalizeProgramEvents = (events, programYear) => {
  const uniqueEvents = new Map();

  events.forEach((event, index) => {
    const registrationId = getEventRegistrationId(event);
    const key = registrationId || `event-${event.date || 'undated'}-${event.title || index}`;
    const normalizedEvent = { ...event, title: normalizeEventTitle(event.title) };
    const existing = uniqueEvents.get(key);
    uniqueEvents.set(key, existing ? mergeEventRecords(existing, normalizedEvent) : normalizedEvent);
  });

  const eventsByName = new Map();
  Array.from(uniqueEvents.values()).forEach((event, index) => {
    const nameKey = normalizeEventTitle(event.title).trim().toLowerCase();
    const existing = eventsByName.get(nameKey);

    if (existing && (existing.adminId || event.adminId)) {
      eventsByName.set(nameKey, mergeEventRecords(existing, event));
      return;
    }

    eventsByName.set(existing ? `${nameKey}-${event.date || index}` : nameKey, event);
  });

  return sortEventsByDate(
    Array.from(eventsByName.values()).filter((event) => (
      event.showOnWebsite !== false &&
      event.date && event.date >= programYear.start && event.date <= programYear.end
    )),
    'asc'
  );
};

const groupEventsBySeason = (events, programYear) => {
  const fallYear = Number(programYear.start.slice(0, 4));
  const springYear = Number(programYear.end.slice(0, 4));
  const groups = [
    { key: 'fall', label: `Fall ${fallYear}`, months: 'September–December', events: [] },
    { key: 'spring', label: `Spring ${springYear}`, months: 'January–May', events: [] },
    { key: 'summer', label: `Summer ${springYear}`, months: 'June–August', events: [] },
  ];

  events.forEach((event) => {
    const month = Number(String(event.date).slice(5, 7));
    const group = month >= 9 ? groups[0] : month <= 5 ? groups[1] : groups[2];
    group.events.push(event);
  });

  return groups;
};

const EVENT_IMAGE_BY_ADMIN_ID = Object.freeze({
  'e80bfe5f-23fc-49e4-86f7-2e61c1c40965': '/assets/img/events/previous-years/fall-family-festival.webp',
  'ae600c2b-e49a-4578-8703-ddac2291d079': '/assets/img/events/previous-years/cookies-with-santa.webp',
  '0f19c721-953d-4b09-8b94-e3d2f84c3042': '/assets/img/events/previous-years/mfe-1.webp',
  'f0673f8b-0172-4773-b927-ddc374e44d66': '/assets/img/events/previous-years/mfe-3.webp',
  '424fb1cd-b67d-4747-8501-3dcf060f3562': '/assets/img/events/previous-years/mfe-4.webp',
  '7d4eb844-1979-4ff1-bfb8-9f4c06324dfb': '/assets/img/events/previous-years/mfe.webp',
  'e7de22ae-2e5d-47b1-b30a-ecb4c6107375': '/assets/img/events/previous-years/mfe-des-moines.webp',
  '14022ce7-fee7-4bad-a2a2-d18c0b29c380': '/assets/img/events/previous-years/mfe-sioux-city.webp',
  'da077f60-2d98-4f3d-942b-14f17130c0fd': '/assets/img/events/previous-years/military-family-ball.webp',
  'd96271f7-d8f1-4ad4-bc4a-df337cfc53be': '/assets/img/events/previous-years/summer-camp.webp',
});

const renderEventCard = (event, variant = 'upcoming') => {
  const displayDate = event.displayDate || formatEventDate(event.date);
  const safeDate = escapeEventHtml(event.date);
  const datetimeAttr = event.date ? ` datetime="${safeDate}"` : '';
  const eventDate = event.date ? new Date(`${event.date}T00:00:00Z`) : null;
  const dateMonth = eventDate && !Number.isNaN(eventDate.getTime())
    ? new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(eventDate)
    : '';
  const dateDay = eventDate && !Number.isNaN(eventDate.getTime()) ? eventDate.getUTCDate() : '';
  const eventFull = variant !== 'completed' && isEventFull(event);
  const eventImage = event.image || EVENT_IMAGE_BY_ADMIN_ID[event.adminId] || '';
  const dateBadge = `
    <div class="event-card__date${eventImage ? ' event-card__date--overlay' : ''}" aria-hidden="true">
      <span>${escapeEventHtml(dateMonth)}</span>
      <strong>${escapeEventHtml(dateDay)}</strong>
    </div>
  `;

  const wrapperClass =
    variant === 'completed'
      ? 'content-card h-full flex flex-col overflow-hidden border border-slate-200/80 bg-slate-50/60 p-0'
      : `event-card event-card--uniform${eventFull ? ' event-card--full' : ''}`;

  const titleClass = variant === 'completed'
    ? 'text-lg font-semibold text-slate-800'
    : `text-xl font-semibold ${eventFull ? 'text-slate-500' : 'text-primary'}`;
  const locationClass = variant === 'completed'
    ? 'text-sm text-slate-600'
    : `text-sm ${eventFull ? 'text-slate-500' : 'text-gray-600'}`;
  const notesClass = variant === 'completed'
    ? 'text-sm text-slate-600 leading-relaxed'
    : `text-sm leading-relaxed ${eventFull ? 'text-slate-500' : 'text-gray-600'}`;
  const featuredBadge = variant !== 'completed' && event.featured
    ? '<span class="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Top event</span>'
    : '';
  const fullBadge = eventFull
    ? '<span class="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-red-700">Full</span>'
    : '';

  let ctaButton = '';
  let ctaButtonSecondary = '';
  if (eventFull) {
    ctaButton = '<span class="btn event-card__full-cta w-fit" aria-disabled="true">Event full</span>';
  } else if (variant !== 'completed' && event.ctaDisabled && event.ctaLabel) {
    ctaButton = `<span class="btn w-fit cursor-default" aria-disabled="true">${escapeEventHtml(event.ctaLabel)}</span>`;
  } else if (variant !== 'completed' && event.ctaUrl) {
    const currentOrigin = window.location.origin;
    const absolute = /^https?:/i.test(event.ctaUrl);
    const external = absolute && !event.ctaUrl.startsWith(currentOrigin);
    const attrs = external ? ' target="_blank" rel="noopener"' : '';
    const label = event.ctaLabel || 'Learn More';
    const externalNote = external ? ' <span class="sr-only">(opens in new tab)</span>' : '';
    ctaButton = `<a class="btn w-fit" href="${escapeEventHtml(event.ctaUrl)}"${attrs}>${escapeEventHtml(label)}${externalNote}</a>`;

    if (event.ctaUrl2) {
      const absolute2 = /^https?:/i.test(event.ctaUrl2);
      const external2 = absolute2 && !event.ctaUrl2.startsWith(currentOrigin);
      const attrs2 = external2 ? ' target="_blank" rel="noopener"' : '';
      const label2 = event.ctaLabel2 || 'Learn More';
      const externalNote2 = external2 ? ' <span class="sr-only">(opens in new tab)</span>' : '';
      ctaButtonSecondary = `<a class="btn-secondary w-fit" href="${escapeEventHtml(event.ctaUrl2)}"${attrs2}>${escapeEventHtml(label2)}${externalNote2}</a>`;
    }
  }

  const wrapperAccent = variant !== 'completed'
    ? `${event.featured ? ' ring-2 ring-secondary/60 shadow-lg' : ''}${eventFull ? ' shadow-none' : ''}`
    : '';

  return `
    <article class="${wrapperClass}${wrapperAccent}"${eventFull ? ' aria-disabled="true"' : ''}>
      ${eventImage
        ? `<div class="event-card__media">
            <img class="event-card__image${eventFull ? ' event-card__image--full' : ''}" src="${escapeEventHtml(eventImage)}" alt="" width="1200" height="630" loading="lazy" decoding="async">
            ${dateBadge}
          </div>`
        : dateBadge}
      <div class="event-card__body">
        <div class="space-y-2">
          <div class="flex items-start gap-2 flex-wrap">
            <h3 class="${titleClass}">${escapeEventHtml(event.title)}</h3>
            ${variant === 'completed' ? '<span class="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700">Completed</span>' : `${featuredBadge}${fullBadge}`}
          </div>
          ${
            displayDate || event.time
              ? `<p class="${variant === 'completed' ? 'text-sm text-slate-600' : 'text-gray-700'}"><time${datetimeAttr}>${escapeEventHtml(displayDate || event.date || '')}</time>${event.time ? ` &middot; ${escapeEventHtml(event.time)}` : ''}</p>`
              : ''
          }
          ${event.location ? `<p class="${locationClass}">${escapeEventHtml(event.location)}</p>` : ''}
          ${
            variant === 'completed'
              ? '<p class="text-sm text-slate-600 leading-relaxed">Thanks to all who joined us.</p>'
              : event.notes
                ? `<p class="${notesClass}"><strong class="font-semibold text-slate-800">What to expect:</strong> ${escapeEventHtml(event.notes)}</p>`
                : ''
          }
        </div>
        ${ctaButtonSecondary ? `<div class="flex flex-wrap items-center gap-2">${ctaButton}${ctaButtonSecondary}</div>` : ctaButton}
      </div>
    </article>
  `;
};

const renderEventSeasonGroup = (group) => {
  const eventCount = group.events.length;
  const eventGrid = group.events.map((event) => renderEventCard(event)).join('');

  return `
    <section class="event-season" aria-labelledby="event-season-${group.key}">
      <div class="event-season__header">
        <div>
          <p class="event-season__months">${group.months}</p>
          <h3 class="event-season__title" id="event-season-${group.key}">${group.label}</h3>
        </div>
        <span class="event-quarter-meta">${eventCount} event${eventCount === 1 ? '' : 's'}</span>
      </div>
      ${eventCount
        ? `<div class="event-quarter-grid">${eventGrid}</div>`
        : '<p class="event-season__empty">More events will be added as details are finalized.</p>'}
    </section>
  `;
};

const updateEventStructuredData = (events) => {
  const target = document.getElementById('eventStructuredData');
  if (!target) return;
  target.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': events.map((event) => ({
      '@type': 'Event',
      name: event.title,
      startDate: event.date,
      ...(event.endDate ? { endDate: event.endDate } : {}),
      ...(event.location ? { location: { '@type': 'Place', name: event.location } } : {}),
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      ...(event.ctaUrl ? { url: new URL(event.ctaUrl, window.location.origin).href } : {}),
      organizer: { '@type': 'Organization', name: 'Iowa Child & Youth Program', url: window.location.origin },
    })),
  });
};

async function renderEvents() {
  const upcomingTarget = document.getElementById('eventsList');
  if (!upcomingTarget) return;

  upcomingTarget.setAttribute('aria-busy', 'true');

  try {
    const res = await fetch('/events.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch events: ${res.status}`);

    const data = await res.json();
    const eventList = Array.isArray(data.events)
      ? data.events.filter((event) => event?.showOnWebsite === true)
      : [];
    const programYear = { ...DEFAULT_PROGRAM_YEAR, ...(data.programYear || {}) };
    const upcomingEvents = normalizeProgramEvents(eventList, programYear);

    upcomingTarget.innerHTML = upcomingEvents.length
      ? groupEventsBySeason(upcomingEvents, programYear).map(renderEventSeasonGroup).join('')
      : `<p class="text-gray-600">No events are listed for ${escapeEventHtml(programYear.label)} yet. Check back soon.</p>`;

    scrollReveal.init(upcomingTarget);
    updateEventStructuredData(upcomingEvents);
  } catch (error) {
    upcomingTarget.innerHTML = '<p class="text-red-600">Could not load events. Please refresh and try again.</p>';
    console.error(error);
  } finally {
    upcomingTarget.setAttribute('aria-busy', 'false');
  }
}
renderEvents();

const initFestivalTrunkSignup = () => {
  const form = document.querySelector('[data-festival-trunk-form]');
  if (!form) return;

  const statusEl = form.querySelector('[data-festival-trunk-status]');
  const submitBtn = form.querySelector('[data-festival-trunk-submit]');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const payload = Object.fromEntries(new FormData(form).entries());
    payload.affiliation = 'Fall Family Festival supporter';
    payload.service_area = 'Des Moines';
    payload.event_signup = 'Fall Family Festival 2026';
    payload.source = 'www.iowacyp.com';
    payload.tags = 'fall-family-festival-2026,event-support,no-background-check-required';
    payload.submitted_at = new Date().toISOString();

    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-60', 'cursor-wait');
    statusEl.textContent = 'Sending your signup…';
    statusEl.className = 'text-sm text-slate-600';

    try {
      const response = await fetch('/.netlify/functions/subscribe-proxy', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true) {
        throw new Error(result.error || 'Unable to complete your signup right now.');
      }

      form.reset();
      statusEl.textContent = 'Thank you! Your festival support signup has been received. We will be in touch with next steps.';
      statusEl.className = 'text-sm font-medium text-green-700';
    } catch (error) {
      statusEl.textContent = error.message || 'Unable to complete your signup right now. Please try again.';
      statusEl.className = 'text-sm font-medium text-red-700';
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-60', 'cursor-wait');
    }
  });
};

initFestivalTrunkSignup();

const initQuoteCarousels = () => {
  const carousels = document.querySelectorAll('[data-quote-carousel]');
  if (!carousels.length) return;

  carousels.forEach((carousel) => {
    const slides = Array.from(carousel.querySelectorAll('[data-quote-slide]'));
    if (!slides.length) return;

    let activeIndex = slides.findIndex((slide) => slide.classList.contains('is-active'));
    if (activeIndex < 0) activeIndex = 0;

    const prevBtn = carousel.querySelector('[data-quote-prev]');
    const nextBtn = carousel.querySelector('[data-quote-next]');
    const dots = Array.from(carousel.querySelectorAll('[data-quote-dot]'));
    let autoTimer = null;
    const AUTO_INTERVAL = 8000;

    const setActive = (index) => {
      const slideCount = slides.length;
      if (!slideCount) return;
      const nextIndex = (index + slideCount) % slideCount;
      activeIndex = nextIndex;

      slides.forEach((slide, idx) => {
        slide.classList.toggle('is-active', idx === activeIndex);
        slide.setAttribute('aria-hidden', idx === activeIndex ? 'false' : 'true');
      });

      dots.forEach((dot, idx) => {
        const isActive = idx === activeIndex;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
    };

    const startAutoPlay = () => {
      if (autoTimer) {
        clearInterval(autoTimer);
      }
      autoTimer = window.setInterval(() => {
        setActive(activeIndex + 1);
      }, AUTO_INTERVAL);
    };

    const stopAutoPlay = () => {
      if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = null;
      }
    };

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        setActive(activeIndex - 1);
        startAutoPlay();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        setActive(activeIndex + 1);
        startAutoPlay();
      });
    }

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const targetIndex = Number.parseInt(dot.dataset.quoteDot, 10);
        if (Number.isInteger(targetIndex)) {
          setActive(targetIndex);
          startAutoPlay();
        }
      });
    });

    carousel.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setActive(activeIndex - 1);
        startAutoPlay();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setActive(activeIndex + 1);
        startAutoPlay();
      }
    });

    carousel.addEventListener('mouseenter', stopAutoPlay);
    carousel.addEventListener('mouseleave', startAutoPlay);
    carousel.addEventListener('focusin', stopAutoPlay);
    carousel.addEventListener('focusout', startAutoPlay);

    setActive(activeIndex);
    startAutoPlay();
  });
};

initQuoteCarousels();

const initStoryCarousel = () => {
  const carousel = document.querySelector('[data-story-carousel]');
  const track = carousel?.querySelector('[data-story-track]');
  if (!carousel || !track) return;

  const slides = Array.from(track.querySelectorAll('[data-story-slide]'));
  const prevButton = carousel.querySelector('[data-story-prev]');
  const nextButton = carousel.querySelector('[data-story-next]');
  if (!slides.length) return;

  const scrollAmount = () => {
    const firstSlide = slides[0];
    if (!firstSlide) return 0;
    const styles = window.getComputedStyle(track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || '0');
    return firstSlide.getBoundingClientRect().width + gap;
  };

  const updateButtons = () => {
    if (!prevButton || !nextButton) return;
    const maxScrollLeft = track.scrollWidth - track.clientWidth;
    prevButton.disabled = track.scrollLeft <= 4;
    nextButton.disabled = track.scrollLeft >= maxScrollLeft - 4;
  };

  const moveTrack = (direction) => {
    track.scrollBy({ left: direction * scrollAmount(), behavior: 'smooth' });
  };

  prevButton?.addEventListener('click', () => moveTrack(-1));
  nextButton?.addEventListener('click', () => moveTrack(1));
  track.addEventListener('scroll', updateButtons, { passive: true });
  window.addEventListener('resize', updateButtons);
  updateButtons();
};

const initStoryModals = () => {
  const openButtons = Array.from(document.querySelectorAll('[data-modal-open]'));
  if (!openButtons.length) return;

  let activeModal = null;
  let previousFocus = null;

  const closeModal = (modal) => {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    unlockBodyScroll();
    activeModal = null;
    if (previousFocus instanceof HTMLElement) {
      previousFocus.focus();
    }
    previousFocus = null;
  };

  const openModal = (modal) => {
    if (!modal) return;
    previousFocus = document.activeElement;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    lockBodyScroll();
    activeModal = modal;
    modal.scrollTop = 0;
    const autoFocus = modal.querySelector('[data-modal-autofocus]');
    const firstFocusable = modal.querySelector('input, textarea, button, a[href], [tabindex]:not([tabindex="-1"])');
    (autoFocus instanceof HTMLElement ? autoFocus : firstFocusable || modal).focus();
  };

  openButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const modalName = button.getAttribute('data-modal-open');
      if (!modalName) return;
      openModal(document.querySelector(`[data-modal="${modalName}"]`));
    });
  });

  document.querySelectorAll('[data-modal]').forEach((modal) => {
    modal.querySelectorAll('[data-modal-close], [data-modal-overlay]').forEach((element) => {
      element.addEventListener('click', () => closeModal(modal));
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && activeModal) {
      event.preventDefault();
      closeModal(activeModal);
    }
  });
};

initStoryCarousel();
initStoryModals();

const initResourceLogoFallbacks = () => {
  const logos = Array.from(document.querySelectorAll('[data-resource-logo]'));
  if (!logos.length) return;

  const iconPaths = {
    education: '<path d="M4 6.5 12 3l8 3.5-8 3.5L4 6.5Z"/><path d="M6.5 9v4.25c0 1.25 2.45 2.75 5.5 2.75s5.5-1.5 5.5-2.75V9"/><path d="M20 7v5"/>',
    app: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 17h2"/>',
    support: '<path d="M12 21s-7-4.4-7-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7 3.8C19 16.6 12 21 12 21Z"/>',
    health: '<path d="M12 21s-7-4.4-7-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7 3.8C19 16.6 12 21 12 21Z"/><path d="M12 8v6"/><path d="M9 11h6"/>',
    childcare: '<path d="M8 11a4 4 0 0 1 8 0"/><path d="M6 11h12l-1.2 8H7.2L6 11Z"/><path d="M9 15h.01"/><path d="M15 15h.01"/>',
    wellness: '<path d="M5 19c5.5 0 10-4.5 10-10V5H9C5.7 5 3 7.7 3 11c0 2.2 1.2 4.1 3 5.2"/><path d="M9 15c2.5-2.5 5.3-4.1 9-5"/>',
    money: '<rect x="4" y="6" width="16" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M7 9h.01"/><path d="M17 15h.01"/>',
    guard: '<path d="M12 3 5 6v5c0 4.2 2.8 8.1 7 10 4.2-1.9 7-5.8 7-10V6l-7-3Z"/><path d="M12 8v6"/><path d="M9 11h6"/>',
    family: '<path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M17 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M14.5 20a4.5 4.5 0 0 1 6-4.2"/>',
    entrepreneurship: '<path d="M6 10h12l-1 10H7L6 10Z"/><path d="M9 10V8a3 3 0 0 1 6 0v2"/><path d="M8 14h8"/>',
    default: '<path d="M6 4h9l3 3v13H6V4Z"/><path d="M14 4v4h4"/><path d="M9 13h6"/><path d="M9 17h4"/>',
  };

  const themes = [
    { name: 'health', words: ['crisis', 'mental health', 'counselor', 'confidential', 'red cross'] },
    { name: 'childcare', words: ['child care', 'childcare', 'respite', 'drill', 'kids'] },
    { name: 'education', words: ['scholarship', 'tutor', 'tutoring', 'homework', 'student', 'college', 'database'] },
    { name: 'app', words: ['app', 'iphone', 'android', 'mobile', 'download'] },
    { name: 'wellness', words: ['wellness', 'fitness', 'kidsfit', 'challenge'] },
    { name: 'entrepreneurship', words: ['lemonade', 'entrepreneur', 'financial literacy', 'stand'] },
    { name: 'money', words: ['grant', 'fee assistance', 'funding'] },
    { name: 'guard', words: ['national guard', 'army', 'arng', 'warrior'] },
    { name: 'family', words: ['family', 'families', 'youth', 'children'] },
    { name: 'support', words: ['support', 'services', 'resources', 'programs'] },
  ];

  const pickTheme = (text) => {
    const normalized = String(text || '').toLowerCase();
    const match = themes.find((theme) => theme.words.some((word) => normalized.includes(word)));
    return match ? match.name : 'default';
  };

  const buildFallback = (theme) => {
    const fallback = document.createElement('span');
    fallback.className = `resource-logo-fallback resource-logo-fallback--${theme}`;
    fallback.setAttribute('aria-hidden', 'true');
    fallback.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${iconPaths[theme] || iconPaths.default}</svg>`;
    return fallback;
  };

  logos.forEach((logo) => {
    logo.addEventListener('error', () => {
      const theme = pickTheme(logo.dataset.resourceText);
      logo.replaceWith(buildFallback(theme));
    }, { once: true });
  });
};

initResourceLogoFallbacks();

const initSiteSearch = () => {
  const modal = document.querySelector('[data-modal="site-search"]');
  if (!modal) return;

  const input = modal.querySelector('[data-site-search-input]');
  const results = modal.querySelector('[data-site-search-results]');
  const status = modal.querySelector('[data-site-search-status]');
  const clearButton = modal.querySelector('[data-site-search-clear]');
  const form = modal.querySelector('[data-site-search-form]');
  const loadSearchItems = () => {
    const dataNode = document.getElementById('site-search-data');
    if (dataNode && dataNode.textContent) {
      try {
        const parsed = JSON.parse(dataNode.textContent);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      } catch (error) {
        // Fall back to the small static index below.
      }
    }

    return [
      { title: 'Home', url: '/', type: 'Page', summary: 'Landing page with featured programs, mission, and quick access to updates.', keywords: ['landing', 'featured', 'updates'], featured: true },
      { title: 'About', url: '/about/', type: 'Page', summary: 'Mission, vision, values, and team information.', keywords: ['mission', 'vision', 'values', 'team'], featured: true },
      { title: 'Stories', url: '/stories/', type: 'Page', summary: 'Family stories and community voices.', keywords: ['stories', 'voices', 'spotlight'], featured: true },
      { title: 'Events', url: '/events/', type: 'Page', summary: 'Upcoming events, completed gatherings, and programs.', keywords: ['calendar', 'programs'], featured: true },
      { title: 'Support', url: '/support/', type: 'Page', summary: 'Ways to partner, volunteer, and support the mission.', keywords: ['partner', 'volunteer', 'donate'], featured: true },
      { title: 'Educators', url: '/educators/', type: 'Page', summary: 'Purple Star Schools tools and classroom resources.', keywords: ['teachers', 'schools', 'classroom'], featured: true },
      { title: 'Month of the Military Child', url: '/month-of-the-military-child/', type: 'Page', summary: 'Celebration tools and classroom ideas for MOMC.', keywords: ['momc', 'purple up', 'military child'], featured: true },
      { title: 'Resources', url: '/resources/', type: 'Page', summary: 'Scholarships, downloads, and trusted partner links.', keywords: ['resource hub', 'help', 'links'], featured: true },
      { title: 'Contact', url: '/contact/', type: 'Page', summary: 'Reach the team by phone or email.', keywords: ['email', 'phone', 'help'], featured: true },
      { title: 'Mental Health Resources', url: '/mental-health-resources/', type: 'Page', summary: 'Mental health support and crisis resources.', keywords: ['crisis', 'mental health', 'support'], featured: true },
    ];
  };

  const searchItems = loadSearchItems();

  const normalize = (value = '') => value.toLowerCase().replace(/[\u2019']/g, "'").replace(/[^a-z0-9]+/g, ' ').trim();
  const defaultItems = searchItems.filter((item) => item.featured).slice(0, 8);

  const buildHref = (item) => {
    if (item.external) return item.url;
    return item.url;
  };

  const scoreItem = (item, query) => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return item.featured ? 1 : 0;

    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
    const haystack = normalize(item.searchText || [item.title, item.type, item.summary, ...(item.keywords || [])].join(' '));
    if (!tokens.every((token) => haystack.includes(token))) return null;

    let score = 0;
    if (normalize(item.title).startsWith(normalizedQuery)) score += 80;
    if (normalize(item.title).includes(normalizedQuery)) score += 40;
    if (normalize(item.summary).includes(normalizedQuery)) score += 20;
    if (haystack.includes(normalizedQuery)) score += 10;
    tokens.forEach((token) => {
      if (normalize(item.title).includes(token)) score += 10;
      if (normalize(item.summary).includes(token)) score += 5;
      if (haystack.includes(token)) score += 2;
    });
    if (item.external) score -= 5;
    if (item.featured) score += 6;
    return score;
  };

  const renderResults = (query = '') => {
    if (!results || !status) return;

    const trimmedQuery = query.trim();
    const list = trimmedQuery
      ? searchItems
          .map((item) => ({ item, score: scoreItem(item, trimmedQuery) }))
          .filter((entry) => entry.score !== null)
          .sort((left, right) => right.score - left.score)
          .map((entry) => entry.item)
          .slice(0, 10)
      : defaultItems;

    status.textContent = trimmedQuery
      ? `${list.length} result${list.length === 1 ? '' : 's'} for "${trimmedQuery}".`
      : 'Showing quick links. Start typing to search the site.';

    if (!list.length) {
      results.innerHTML = `
        <div class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-slate-600">
          No results found for "${trimmedQuery}". Try a different keyword or browse the quick links above.
        </div>
      `;
      return;
    }

    results.innerHTML = list.map((item) => {
      const externalNote = item.external ? '<span class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">External</span>' : '';
      const newTabAttrs = item.external ? ' target="_blank" rel="noopener"' : '';
      const closeAttr = ' data-modal-close';
      return `
        <a
          href="${buildHref(item)}"
          class="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-px hover:border-primary hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          ${newTabAttrs}
          ${closeAttr}
        >
          <span class="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 3v18M3 12h18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
          </span>
          <span class="min-w-0 flex-1">
            <span class="flex flex-wrap items-center gap-2">
              <span class="block text-base font-semibold text-slate-900 group-hover:text-primary">${item.title}</span>
              ${externalNote}
            </span>
            <span class="mt-1 block text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">${item.type}</span>
            <span class="mt-2 block text-sm leading-relaxed text-slate-600">${item.summary}</span>
          </span>
        </a>
      `;
    }).join('');
  };

  const focusInput = () => {
    if (!(input instanceof HTMLElement)) return;
    input.focus();
    if (typeof input.select === 'function') {
      input.select();
    }
  };

  if (input) {
    input.addEventListener('input', () => renderResults(input.value));
  }

  if (clearButton) {
    clearButton.addEventListener('click', () => {
      if (input instanceof HTMLInputElement) {
        input.value = '';
      }
      renderResults('');
      focusInput();
    });
  }

  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      renderResults(input instanceof HTMLInputElement ? input.value : '');
    });
  }

  const observer = new MutationObserver(() => {
    if (modal.getAttribute('aria-hidden') === 'false') {
      renderResults(input instanceof HTMLInputElement ? input.value : '');
      requestAnimationFrame(focusInput);
    }
  });
  observer.observe(modal, { attributes: true, attributeFilter: ['aria-hidden'] });

  renderResults('');
};

initSiteSearch();

// Handle reduced motion for hero video
const heroVideo = document.querySelector('.hero-video');
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const isHtmlMediaElement = heroVideo instanceof HTMLMediaElement;
const isYouTubeEmbed =
  heroVideo instanceof HTMLIFrameElement && heroVideo.src.includes('youtube.com/embed');
const heroVideoOrigin = heroVideo && isYouTubeEmbed ? window.location.origin : null;

if (isYouTubeEmbed && heroVideoOrigin) {
  try {
    const heroUrl = new URL(heroVideo.src);
    if (heroUrl.searchParams.get('origin') !== heroVideoOrigin) {
      heroUrl.searchParams.set('origin', heroVideoOrigin);
      heroVideo.src = heroUrl.toString();
    }
  } catch (error) {
    // Leave the iframe as-is if the URL cannot be parsed.
  }
}

const postToYouTube = (action) => {
  if (!isYouTubeEmbed || !heroVideo.contentWindow) return;
  heroVideo.contentWindow.postMessage(
    JSON.stringify({ event: 'command', func: action, args: [] }),
    '*'
  );
};

const updateHeroVideo = () => {
  if (!heroVideo) return;
  if (isHtmlMediaElement) {
    if (motionQuery.matches) {
      heroVideo.dataset.videoMotionDisabled = 'true';
      heroVideo.pause();
      heroVideo.currentTime = 0;
      heroVideo.removeAttribute('autoplay');
      heroVideo.classList.add('is-motion-disabled');
      heroVideo.setAttribute('aria-hidden', 'true');
    } else {
      heroVideo.dataset.videoMotionDisabled = 'false';
      heroVideo.classList.remove('is-motion-disabled');
      heroVideo.removeAttribute('aria-hidden');
      heroVideo.muted = true;
      heroVideo.defaultMuted = true;
      heroVideo.playsInline = true;
      const playPromise = heroVideo.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.catch(() => {
          /* Autoplay blocked: ignored because controls are hidden */
        });
      }
    }
    return;
  }

  if (isYouTubeEmbed) {
    if (motionQuery.matches) {
      postToYouTube('pauseVideo');
      heroVideo.classList.add('is-motion-disabled');
      heroVideo.setAttribute('aria-hidden', 'true');
    } else {
      heroVideo.classList.remove('is-motion-disabled');
      heroVideo.removeAttribute('aria-hidden');
      postToYouTube('mute');
      postToYouTube('playVideo');
    }
  }
};
if (motionQuery.addEventListener) {
  motionQuery.addEventListener('change', updateHeroVideo);
} else if (motionQuery.addListener) {
  motionQuery.addListener(updateHeroVideo);
}
updateHeroVideo();

if (isYouTubeEmbed) {
  heroVideo.addEventListener('load', () => {
    if (!motionQuery.matches) {
      postToYouTube('mute');
      postToYouTube('playVideo');
    }
  });
}

const markExternalLinks = () => {
  const anchors = document.querySelectorAll('a[href^="http"]');
  const origin = window.location.origin;
  anchors.forEach((anchor) => {
    const href = anchor.getAttribute('href');
    if (!href) return;
    if (href.startsWith(origin)) return;
    if (href.startsWith('http')) {
      anchor.setAttribute('target', '_blank');
      const rel = anchor.getAttribute('rel') || '';
      if (!rel.includes('noopener')) {
        anchor.setAttribute('rel', `${rel} noopener noreferrer`.trim());
      }
    }
  });
};
markExternalLinks();

const ALLOWED_SERVICE_AREAS = new Set([
  'Des Moines',
  'Sioux City',
  'Council Bluffs',
  'Waterloo',
  'Cedar Rapids',
  'Davenport',
]);

const isAllowedServiceArea = (value) => ALLOWED_SERVICE_AREAS.has(String(value || '').trim());

const initSubscribeForm = () => {
  const form = document.getElementById('subscribeForm');
  if (!form) return;

  const statusEl = document.getElementById('subscribeStatus');
  const submitBtn = form.querySelector('[data-subscribe-submit]');
  const virtualContentToggle = form.querySelector('[data-virtual-content-toggle]');
  const virtualParticipantField = form.querySelector('[data-virtual-participant-field]');
  const virtualParticipantInput = form.querySelector('[data-virtual-participant-input]');
  let busy = false;

  const syncVirtualParticipantField = () => {
    const enabled = virtualContentToggle instanceof HTMLInputElement && virtualContentToggle.checked;
    virtualParticipantField?.classList.toggle('hidden', !enabled);
    if (virtualParticipantInput instanceof HTMLInputElement) {
      virtualParticipantInput.disabled = !enabled;
      virtualParticipantInput.required = enabled;
      if (!enabled) virtualParticipantInput.value = '';
    }
  };

  virtualContentToggle?.addEventListener('change', syncVirtualParticipantField);
  form.addEventListener('reset', () => window.setTimeout(syncVirtualParticipantField, 0));
  syncVirtualParticipantField();

  const setStatus = (message, tone = 'muted') => {
    if (!statusEl) return;
    statusEl.textContent = message || '';
    statusEl.classList.remove('text-slate-600', 'text-emerald-700', 'text-red-700');
    if (tone === 'success') {
      statusEl.classList.add('text-emerald-700');
    } else if (tone === 'error') {
      statusEl.classList.add('text-red-700');
    } else {
      statusEl.classList.add('text-slate-600');
    }
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;

    const formData = new FormData(form);
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const affiliation = String(formData.get('affiliation') || '').trim();
    const serviceArea = String(formData.get('service_area') || '').trim();
    const virtualContent = Boolean(formData.get('virtual_content'));
    const participantCount = Number.parseInt(String(formData.get('num_participants') || ''), 10);
    const consent = Boolean(formData.get('consent'));
    const botField = String(formData.get('bot-field') || '').trim();

    if (!email) {
      setStatus('Please enter your email address.', 'error');
      return;
    }

    if (!affiliation || !serviceArea) {
      setStatus('Please select both your affiliation / program and service area.', 'error');
      return;
    }

    if (!isAllowedServiceArea(serviceArea)) {
      setStatus('Please select a valid service area / closest city.', 'error');
      return;
    }

    if (virtualContent && (!Number.isInteger(participantCount) || participantCount < 1 || participantCount > 25)) {
      setStatus('Please enter the number of children or youth receiving virtual content (1–25).', 'error');
      return;
    }

    if (!consent) {
      setStatus('Please confirm you want to receive updates from Iowa CYP.', 'error');
      return;
    }

    if (botField) {
      setStatus('Thanks, you are subscribed.', 'success');
      form.reset();
      return;
    }

    const payload = {
      email,
      region: String(formData.get('region') || '').trim() || null,
      service_area: serviceArea,
      affiliation,
      virtual_content: virtualContent,
      num_participants: virtualContent ? participantCount : null,
      consent: true,
      source: String(formData.get('source') || '').trim() || 'www.iowacyp.com',
      tags: String(formData.get('tags') || '').trim(),
      submitted_at: new Date().toISOString(),
    };

    busy = true;
    if (submitBtn instanceof HTMLButtonElement) {
      submitBtn.disabled = true;
    }
    setStatus('Submitting...');

    try {
      const response = await fetch('/.netlify/functions/subscribe-proxy', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let responseBody = {};
      try {
        responseBody = await response.json();
      } catch (_error) {
        responseBody = {};
      }

      if (!response.ok || responseBody.ok !== true) {
        const message =
          String(responseBody.error || '').trim() ||
          'We could not save your subscription. Please try again.';
        throw new Error(message);
      }

      if (responseBody.unsubscribed_all === true) {
        setStatus('Your email is marked as unsubscribed. Contact the CYP team to re-enable updates.', 'success');
      } else {
        setStatus('You are subscribed. Watch for upcoming Iowa CYP updates in your inbox.', 'success');
      }
      form.reset();
    } catch (error) {
      setStatus(String(error?.message || 'Submission failed. Please try again.'), 'error');
      console.error('Subscribe submission failed', error);
    } finally {
      busy = false;
      if (submitBtn instanceof HTMLButtonElement) {
        submitBtn.disabled = false;
      }
    }
  });
};

initSubscribeForm();

const initVirtualProgrammingSignupForm = () => {
  const form = document.querySelector('[data-virtual-programming-signup-form]');
  if (!form) return;

  const statusEl = form.querySelector('[data-vp-signup-status]');
  const submitBtn = form.querySelector('[data-vp-signup-submit]');
  const emailInput = form.querySelector('input[name="email"]');
  const storageKey = 'virtual-programming-signup-email';
  let busy = false;
  const canUseStorage = () => {
    try {
      return typeof window.localStorage !== 'undefined';
    } catch (_error) {
      return false;
    }
  };

  if (canUseStorage() && emailInput instanceof HTMLInputElement) {
    const rememberedEmail = window.localStorage.getItem(storageKey);
    if (rememberedEmail) {
      emailInput.value = rememberedEmail;
    }
  }

  const setStatus = (message, tone = 'muted') => {
    if (!statusEl) return;
    statusEl.textContent = message || '';
    statusEl.classList.remove('text-slate-600', 'text-emerald-700', 'text-red-700');
    if (tone === 'success') {
      statusEl.classList.add('text-emerald-700');
    } else if (tone === 'error') {
      statusEl.classList.add('text-red-700');
    } else {
      statusEl.classList.add('text-slate-600');
    }
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;

    const formData = new FormData(form);
    const firstName = String(formData.get('parent_first_name') || '').trim();
    const lastName = String(formData.get('parent_last_name') || '').trim();
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const affiliation = String(formData.get('military_affiliation') || '').trim();
    const serviceArea = String(formData.get('service_area') || '').trim();
    const participantCount = Number.parseInt(String(formData.get('num_participants') || ''), 10);
    const consent = Boolean(formData.get('consent'));
    const botField = String(formData.get('bot-field') || '').trim();

    if (!firstName || !lastName || !email) {
      setStatus('Please enter the parent/guardian name and email address.', 'error');
      return;
    }

    if (!affiliation || !serviceArea) {
      setStatus('Please select both your affiliation / program and service area.', 'error');
      return;
    }

    if (!isAllowedServiceArea(serviceArea)) {
      setStatus('Please select a valid service area / closest city.', 'error');
      return;
    }

    if (!Number.isInteger(participantCount) || participantCount < 1 || participantCount > 25) {
      setStatus('Please enter the number of children or youth (1–25).', 'error');
      return;
    }

    if (!consent) {
      setStatus('Please confirm you want to receive updates from Iowa CYP.', 'error');
      return;
    }

    if (botField) {
      setStatus('Thank you! Your virtual programming interest form has been submitted.', 'success');
      if (canUseStorage()) {
        window.localStorage.setItem(storageKey, email);
      }
      form.reset();
      return;
    }

    const payload = {
      parent_first_name: firstName,
      parent_last_name: lastName,
      email,
      phone: String(formData.get('phone') || '').trim() || null,
      service_area: serviceArea,
      military_affiliation: affiliation,
      num_participants: participantCount,
      child_youth_ages: String(formData.get('child_youth_ages') || '').trim() || null,
      comments: String(formData.get('comments') || '').trim() || null,
      consent: true,
      source: String(formData.get('source') || '').trim() || 'www.iowacyp.com',
      tags: String(formData.get('tags') || '').trim(),
      submitted_at: new Date().toISOString(),
    };

    busy = true;
    if (submitBtn instanceof HTMLButtonElement) {
      submitBtn.disabled = true;
    }
    setStatus('Submitting...');

    try {
      const response = await fetch('/.netlify/functions/virtual-programming-signup-proxy', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let responseBody = {};
      try {
        responseBody = await response.json();
      } catch (_error) {
        responseBody = {};
      }

      if (!response.ok || responseBody.ok !== true) {
        const message =
          String(responseBody.error || '').trim() ||
          'We could not submit your virtual programming signup. Please try again.';
        throw new Error(message);
      }

      if (canUseStorage()) {
        window.localStorage.setItem(storageKey, email);
      }
      setStatus('Thank you! Your virtual programming interest form has been submitted.', 'success');
      form.reset();
    } catch (error) {
      setStatus(String(error?.message || 'Submission failed. Please try again.'), 'error');
      console.error('Virtual programming signup submission failed', error);
    } finally {
      busy = false;
      if (submitBtn instanceof HTMLButtonElement) {
        submitBtn.disabled = false;
      }
    }
  });
};

initVirtualProgrammingSignupForm();

const initAccessGate = ({
  gateSelector,
  contentSelector,
  formSelector,
  statusSelector,
  submitSelector,
  storageKey,
  emailKey,
  unlockedMessage,
  successMessage,
  defaultSource,
  logLabel,
}) => {
  const gate = document.querySelector(gateSelector);
  const content = document.querySelector(contentSelector);
  const form = document.querySelector(formSelector);
  if (!gate || !content || !form) return;

  const statusEl = form.querySelector(statusSelector);
  const submitBtn = form.querySelector(submitSelector);
  const emailInput = form.querySelector('input[name="email"]');
  let busy = false;

  const canUseStorage = () => {
    try {
      return typeof window.localStorage !== 'undefined';
    } catch (_error) {
      return false;
    }
  };

  const unlock = () => {
    gate.classList.add('hidden');
    content.hidden = false;
  };

  if (canUseStorage() && window.localStorage.getItem(storageKey) === 'true') {
    if (emailInput instanceof HTMLInputElement) {
      const rememberedEmail = window.localStorage.getItem(emailKey);
      if (rememberedEmail) {
        emailInput.value = rememberedEmail;
      }
    }
    unlock();
    return;
  }

  if (canUseStorage() && emailInput instanceof HTMLInputElement) {
    const rememberedEmail = window.localStorage.getItem(emailKey);
    if (rememberedEmail) {
      emailInput.value = rememberedEmail;
    }
  }

  const setStatus = (message, tone = 'muted') => {
    if (!statusEl) return;
    statusEl.textContent = message || '';
    statusEl.classList.remove('text-slate-600', 'text-emerald-700', 'text-red-700');
    if (tone === 'success') {
      statusEl.classList.add('text-emerald-700');
    } else if (tone === 'error') {
      statusEl.classList.add('text-red-700');
    } else {
      statusEl.classList.add('text-slate-600');
    }
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;

    const formData = new FormData(form);
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const affiliation = String(formData.get('affiliation') || '').trim();
    const serviceArea = String(formData.get('service_area') || '').trim();
    const consent = Boolean(formData.get('consent'));
    const botField = String(formData.get('bot-field') || '').trim();

    if (!email) {
      setStatus('Please enter your email address.', 'error');
      return;
    }

    if (!affiliation || !serviceArea) {
      setStatus('Please select both your affiliation / program and service area.', 'error');
      return;
    }

    if (!isAllowedServiceArea(serviceArea)) {
      setStatus('Please select a valid service area / closest city.', 'error');
      return;
    }

    if (!consent) {
      setStatus('Please confirm you want to receive updates from Iowa CYP.', 'error');
      return;
    }

    if (botField) {
      setStatus(unlockedMessage, 'success');
      if (canUseStorage()) {
        window.localStorage.setItem(storageKey, 'true');
        window.localStorage.setItem(emailKey, email);
      }
      unlock();
      return;
    }

    const payload = {
      email,
      region: String(formData.get('region') || '').trim() || null,
      service_area: serviceArea,
      affiliation,
      consent: true,
      source: String(formData.get('source') || '').trim() || defaultSource,
      tags: String(formData.get('tags') || '').trim(),
      submitted_at: new Date().toISOString(),
    };

    busy = true;
    if (submitBtn instanceof HTMLButtonElement) {
      submitBtn.disabled = true;
    }
    setStatus('Submitting...');

    try {
      const response = await fetch('/.netlify/functions/subscribe-proxy', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseBody = await response.json().catch(() => ({}));

      if (!response.ok || responseBody?.ok !== true) {
        const message =
          String(responseBody.error || '').trim() ||
          'Unable to complete the signup right now. Please try again.';
        throw new Error(message);
      }

      if (canUseStorage()) {
        window.localStorage.setItem(storageKey, 'true');
        window.localStorage.setItem(emailKey, email);
      }
      setStatus(successMessage, 'success');
      unlock();
    } catch (error) {
      if (canUseStorage()) {
        window.localStorage.setItem(storageKey, 'true');
        window.localStorage.setItem(emailKey, email);
      }
      setStatus(String(error?.message || 'Submission failed. Please try again.'), 'error');
      console.error(`${logLabel || 'Access'} submission failed`, error);
    } finally {
      busy = false;
      if (submitBtn instanceof HTMLButtonElement) {
        submitBtn.disabled = false;
      }
    }
  });
};

initAccessGate({
  gateSelector: '[data-lemonade-boss-gate]',
  contentSelector: '[data-lemonade-boss-content]',
  formSelector: '[data-lemonade-boss-access-form]',
  statusSelector: '[data-lemonade-boss-access-status]',
  submitSelector: '[data-lemonade-boss-access-submit]',
  storageKey: 'lemonade-boss-access-granted',
  emailKey: 'lemonade-boss-access-email',
  unlockedMessage: 'Access unlocked. The Lemonade Boss links are now available.',
  successMessage: 'Access unlocked. The Lemonade Boss links are now available.',
  defaultSource: 'www.iowacyp.com',
  logLabel: 'Lemonade Boss access',
});

initAccessGate({
  gateSelector: '[data-adventure-kits-gate]',
  contentSelector: '[data-adventure-kits-content]',
  formSelector: '[data-adventure-kits-access-form]',
  statusSelector: '[data-adventure-kits-access-status]',
  submitSelector: '[data-adventure-kits-access-submit]',
  storageKey: 'adventure-kits-access-granted',
  emailKey: 'adventure-kits-access-email',
  unlockedMessage: 'Access unlocked. The Adventure Kits content is now available.',
  successMessage: 'Access unlocked. The Adventure Kits content is now available.',
  defaultSource: 'www.iowacyp.com',
  logLabel: 'Adventure Kits access',
});
// Inject current year in footer
const yearTarget = document.getElementById('year');
if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear();
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((registrations) => Promise.all(
      registrations
        .filter((registration) => new URL(registration.scope).pathname === '/')
        .map((registration) => registration.unregister())
    ))
    .catch((error) => console.error('Service worker cleanup failed', error));
}

if ('caches' in window) {
  caches.keys()
    .then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith('iowa-cyp-cache-'))
        .map((key) => caches.delete(key))
    ))
    .catch((error) => console.error('Legacy cache cleanup failed', error));
}
