// Mobile navigation with focus trap
const navToggle = document.getElementById('navToggle');
const mobileNav = document.getElementById('mobileNav');
const navOverlay = document.getElementById('navOverlay');
let navOpen = false;
let previousFocus = null;

const getNavFocusable = () => {
  if (!mobileNav) return [];
  return Array.from(mobileNav.querySelectorAll('[data-nav-focus], [data-nav-close], a'))
    .filter(
    (el) => !el.hasAttribute('disabled')
    );
};

const closeAllMobileSubmenus = () => {
  if (!mobileNav) return;
  const submenus = mobileNav.querySelectorAll('[data-nav-submenu]');
  const parentButtons = mobileNav.querySelectorAll('[data-nav-parent-button]');
  submenus.forEach((submenu) => {
    submenu.classList.remove('is-open');
    submenu.setAttribute('aria-hidden', 'true');
  });
  parentButtons.forEach((button) => {
    button.setAttribute('aria-expanded', 'false');
    button.classList.remove('is-open');
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
  document.body.classList.remove('overflow-hidden');
  closeAllMobileSubmenus();
  if (previousFocus) {
    previousFocus.focus();
  }
  previousFocus = null;
};

const openNav = () => {
  if (!mobileNav || !navToggle) return;
  closeAllMobileSubmenus();
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
  document.body.classList.add('overflow-hidden');
  window.scrollTo(0, 0);
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
  const parentButtons = mobileNav.querySelectorAll('[data-nav-parent-button]');
  parentButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const submenu = button.nextElementSibling;
      if (!submenu) return;
      const expanded = button.getAttribute('aria-expanded') === 'true';
      if (expanded) {
        submenu.classList.remove('is-open');
        submenu.setAttribute('aria-hidden', 'true');
        button.setAttribute('aria-expanded', 'false');
        button.classList.remove('is-open');
      } else {
        closeAllMobileSubmenus();
        submenu.classList.add('is-open');
        submenu.setAttribute('aria-hidden', 'false');
        button.setAttribute('aria-expanded', 'true');
        button.classList.add('is-open');
      }
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

const scrollReveal = (() => {
  const SELECTOR = [
    '[data-reveal]',
    'main section',
    'main article',
    'main aside',
    'main .content-card',
    'main .feature-card',
    'main .resource-card',
    'main .grid > *',
  ].join(', ');
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const supportsObserver = typeof window !== 'undefined' && 'IntersectionObserver' in window;
  let observer = null;
  let globalOrder = 0;

  const clearFallback = (element) => {
    const fallbackId = element.dataset.revealFallback;
    if (!fallbackId) return;
    window.clearTimeout(Number.parseInt(fallbackId, 10));
    delete element.dataset.revealFallback;
  };

const makeVisible = (element) => {
  clearFallback(element);
  element.classList.add('reveal-visible');
  element.classList.add('in-view');
  element.classList.remove('reveal-on-scroll');
};

  const handleEntries = (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting && entry.intersectionRatio <= 0) {
        return;
      }
      const element = entry.target;
      clearFallback(element);
      observer.unobserve(element);
      requestAnimationFrame(() => {
        makeVisible(element);
      });
    });
  };

  const ensureObserver = () => {
    if (!supportsObserver) return null;
    if (observer) return observer;
    observer = new IntersectionObserver(handleEntries, {
      threshold: 0.15,
      rootMargin: '0px 0px -5% 0px',
    });
    return observer;
  };

  const prepareElement = (el) => {
    if (!el.dataset.revealPrepared) {
      el.dataset.revealPrepared = 'true';
    }
    if (!el.classList.contains('animate-on-scroll')) {
      el.classList.add('animate-on-scroll');
    }
  };

  const init = (scope = document) => {
    const elements = scope.querySelectorAll(SELECTOR);
    if (!elements.length) return;

    if (!supportsObserver || reduceMotionQuery.matches) {
      elements.forEach((el) => {
        prepareElement(el);
        makeVisible(el);
      });
      return;
    }

    const obs = ensureObserver();
    if (!obs) {
      elements.forEach((el) => {
        prepareElement(el);
        makeVisible(el);
      });
      return;
    }
    elements.forEach((el) => {
      if (el.dataset.revealPrepared) return;
      prepareElement(el);
      el.classList.add('reveal-on-scroll');
      el.style.setProperty('--reveal-order', Math.min(globalOrder, 6));
      globalOrder += 1;
      const fallbackId = window.setTimeout(() => {
        if (el.classList.contains('reveal-visible')) return;
        makeVisible(el);
        if (obs) {
          obs.unobserve(el);
        }
      }, 900);
      el.dataset.revealFallback = String(fallbackId);
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

// Partner parallax background
const initParallaxSections = () => {
  const sections = document.querySelectorAll('[data-parallax]');
  if (!sections.length) return;

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduceMotionQuery.matches) {
    sections.forEach((section) => {
      section.style.setProperty('--parallax-offset', '0px');
    });
    return;
  }

  let ticking = false;
  const update = () => {
    sections.forEach((section) => {
      const speed = Number.parseFloat(section.dataset.parallaxSpeed || '0.35');
      const rect = section.getBoundingClientRect();
      const offset = rect.top * speed;
      section.style.setProperty('--parallax-offset', `${offset}px`);
    });
    ticking = false;
  };

  const requestTick = () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  };

  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);
  update();
};

initParallaxSections();

// Render Upcoming + Completed Events from JSON (if present)
const formatEventDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(date);
};

const splitEventsByDate = (events = [], months = 12) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff = new Date(today);
  cutoff.setMonth(cutoff.getMonth() - months);

  return events.reduce(
    (acc, event) => {
      if (!event || !event.date) {
        acc.upcoming.push(event);
        return acc;
      }
      const eventDate = new Date(`${event.date}T00:00:00`);
      if (Number.isNaN(eventDate.getTime())) {
        acc.upcoming.push(event);
        return acc;
      }
      if (eventDate < cutoff) {
        acc.archived.push(event);
      } else if (eventDate < today) {
        acc.past.push(event);
      } else {
        acc.upcoming.push(event);
      }
      return acc;
    },
    { upcoming: [], past: [], archived: [] }
  );
};

async function renderEvents() {
  const target = document.getElementById('eventsList');
  const completedTarget = document.getElementById('completedEvents');
  const archiveTarget = document.getElementById('archiveEvents');
  if (!target) return;
  if (target.dataset.eventsHydrated === 'true') return;
  const originalMarkup = target.innerHTML;
  const completedOriginalMarkup = completedTarget ? completedTarget.innerHTML : '';
  const archiveOriginalMarkup = archiveTarget ? archiveTarget.innerHTML : '';
  target.setAttribute('aria-busy', 'true');
  if (completedTarget) completedTarget.setAttribute('aria-busy', 'true');
  if (archiveTarget) archiveTarget.setAttribute('aria-busy', 'true');
  try {
    const res = await fetch('/events.json', { headers: { 'Cache-Control': 'no-cache' } });
    if (!res.ok) throw new Error(`Failed to fetch events: ${res.status}`);
    const data = await res.json();
    if (!data.events || !data.events.length) {
      target.innerHTML = '<p class="text-gray-600">No upcoming events right now. Check back soon!</p>';
      if (completedTarget) {
        completedTarget.innerHTML = '<p class="text-gray-600">No completed events to show yet.</p>';
      }
      if (archiveTarget) {
        archiveTarget.innerHTML = '<p class="text-gray-600">No archived events to show yet.</p>';
      }
      target.dataset.eventsHydrated = 'true';
      return;
    }
    const grouped = splitEventsByDate(data.events, 12);
    target.innerHTML = grouped.upcoming.length
      ? grouped.upcoming
      .map((ev) => {
        const displayDate = ev.displayDate || formatEventDate(ev.date);
        const datetimeAttr = ev.date ? ` datetime="${ev.date}"` : '';
        const dateLabel = displayDate || ev.date || '';
        const isClosed = Boolean(ev.closed);
        const ctaLabel = isClosed ? 'Registration Full' : (ev.ctaLabel || 'Learn More');
        const timeLine = dateLabel || ev.time
          ? `<p class="text-gray-700">${dateLabel ? `<time${datetimeAttr}>${dateLabel}</time>` : ''}${
              ev.time ? `<span class="text-gray-500"> &middot; ${ev.time}</span>` : ''
            }</p>`
          : '';
        const locationLine = ev.location ? `<p class="text-sm text-gray-600">${ev.location}</p>` : '';
        const notesLine = ev.notes ? `<p class="text-sm text-gray-600 leading-relaxed">${ev.notes}</p>` : '';
        const imageBlock = ev.image
          ? `<img src="${ev.image}" alt="${ev.title}" class="event-banner" loading="lazy" decoding="async">`
          : '';
        let ctaButton = '';
        if (!isClosed && ev.ctaUrl) {
          const absolute = /^https?:/i.test(ev.ctaUrl);
          const currentOrigin = window.location.origin;
          const external = absolute && !ev.ctaUrl.startsWith(currentOrigin);
          const attrs = external ? ' target="_blank" rel="noopener"' : '';
          const externalNote = external ? ' <span class="sr-only">(opens in new tab)</span>' : '';
          ctaButton = `<a class="btn w-fit" href="${ev.ctaUrl}"${attrs}>${ctaLabel}${externalNote}</a>`;
        } else if (isClosed) {
          ctaButton = `<span class="btn w-fit cursor-not-allowed pointer-events-none bg-slate-200 text-slate-700 border border-slate-300 hover:bg-slate-200 hover:text-slate-700 opacity-100" aria-disabled="true">${ctaLabel}</span>`;
        }
        return `
          <article class="content-card h-full flex flex-col gap-4" data-reveal>
            ${imageBlock}
            <div class="space-y-2">
              <div class="flex items-start gap-2">
                <h3 class="text-xl font-semibold text-primary">${ev.title}</h3>
                ${isClosed ? '<span class="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700">Full</span>' : ''}
              </div>
              ${timeLine}
              ${locationLine}
              ${notesLine}
            </div>
            ${ctaButton}
          </article>
        `;
      })
      .join('')
      : '<p class="text-gray-600">No upcoming events right now. Check back soon!</p>';
    if (completedTarget) {
      completedTarget.innerHTML = grouped.past.length
        ? grouped.past
          .slice()
          .reverse()
          .map((ev) => {
            const displayDate = ev.displayDate || formatEventDate(ev.date);
            const datetimeAttr = ev.date ? ` datetime="${ev.date}"` : '';
            const dateLabel = displayDate || ev.date || '';
            const timeLine = dateLabel || ev.time
              ? `<p class="text-sm text-slate-600">${dateLabel ? `<time${datetimeAttr}>${dateLabel}</time>` : ''}${
                  ev.time ? `<span class="text-slate-500"> &middot; ${ev.time}</span>` : ''
                }</p>`
              : '';
            const locationLine = ev.location ? `<p class="text-sm text-slate-600">${ev.location}</p>` : '';
            const imageBlock = ev.image
              ? `<img src="${ev.image}" alt="${ev.title}" class="event-banner opacity-90" loading="lazy" decoding="async">`
              : '';
            return `
              <article class="content-card h-full flex flex-col gap-3 border border-slate-200/80 bg-slate-50/60" data-reveal>
                ${imageBlock}
                <div class="space-y-2">
                  <div class="flex items-start gap-2">
                    <h3 class="text-lg font-semibold text-slate-800">${ev.title}</h3>
                    <span class="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700">Completed</span>
                  </div>
                  ${timeLine}
                  ${locationLine}
                  <p class="text-sm text-slate-600 leading-relaxed">Thanks to all who joined us.</p>
                </div>
              </article>
            `;
          })
          .join('')
        : '<p class="text-gray-600">No completed events to show yet.</p>';
    }
    if (archiveTarget) {
      archiveTarget.innerHTML = grouped.archived.length
        ? grouped.archived
          .slice()
          .reverse()
          .map((ev) => {
            const displayDate = ev.displayDate || formatEventDate(ev.date);
            const datetimeAttr = ev.date ? ` datetime="${ev.date}"` : '';
            const dateLabel = displayDate || ev.date || '';
            const timeLine = dateLabel || ev.time
              ? `<p class="text-sm text-slate-600">${dateLabel ? `<time${datetimeAttr}>${dateLabel}</time>` : ''}${
                  ev.time ? `<span class="text-slate-500"> &middot; ${ev.time}</span>` : ''
                }</p>`
              : '';
            const locationLine = ev.location ? `<p class="text-sm text-slate-600">${ev.location}</p>` : '';
            return `
              <article class="content-card h-full flex flex-col gap-2 border border-slate-200/70 bg-white" data-reveal>
                <div class="space-y-2">
                  <div class="flex items-start gap-2">
                    <h3 class="text-lg font-semibold text-slate-800">${ev.title}</h3>
                    <span class="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700">Archived</span>
                  </div>
                  ${timeLine}
                  ${locationLine}
                </div>
              </article>
            `;
          })
          .join('')
        : '<p class="text-gray-600">No archived events to show yet.</p>';
    }
    target.dataset.eventsHydrated = 'true';
    scrollReveal.init(target);
    if (completedTarget) scrollReveal.init(completedTarget);
    if (archiveTarget) scrollReveal.init(archiveTarget);
  } catch (error) {
    target.innerHTML = originalMarkup || '<p class="text-red-600">Could not load events. Please refresh and try again.</p>';
    if (completedTarget) {
      completedTarget.innerHTML = completedOriginalMarkup || '<p class="text-red-600">Could not load events. Please refresh and try again.</p>';
    }
    if (archiveTarget) {
      archiveTarget.innerHTML = archiveOriginalMarkup || '<p class="text-red-600">Could not load events. Please refresh and try again.</p>';
    }
    console.error(error);
  } finally {
    target.setAttribute('aria-busy', 'false');
    if (completedTarget) completedTarget.setAttribute('aria-busy', 'false');
    if (archiveTarget) archiveTarget.setAttribute('aria-busy', 'false');
  }
}
renderEvents();

const initStoryCarousels = () => {
  const carousels = document.querySelectorAll('[data-story-carousel]');
  if (!carousels.length) return;

  carousels.forEach((carousel) => {
    const track = carousel.querySelector('[data-story-track]');
    const slides = Array.from(carousel.querySelectorAll('[data-story-slide]'));
    if (!track || slides.length <= 1) return;

    // Reorder slides by published date (newest first) before initializing
    const sortedSlides = slides
      .map((slide, idx) => {
        const published = slide.dataset.published;
        const timestamp = published ? new Date(published).getTime() : Number.NEGATIVE_INFINITY;
        return { slide, idx, timestamp };
      })
      .sort((a, b) => {
        if (a.timestamp === b.timestamp) return a.idx - b.idx;
        return b.timestamp - a.timestamp;
      })
      .map((entry) => entry.slide);
    sortedSlides.forEach((slide) => track.appendChild(slide));

    const prevBtn = carousel.querySelector('[data-story-prev]');
    const nextBtn = carousel.querySelector('[data-story-next]');
    let activeIndex = 0;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const updateButtons = () => {
      if (prevBtn) prevBtn.disabled = activeIndex <= 0;
      if (nextBtn) nextBtn.disabled = activeIndex >= slides.length - 1;
    };

    const scrollToSlide = (index, smooth = true) => {
      const targetIndex = clamp(index, 0, slides.length - 1);
      const targetSlide = slides[targetIndex];
      if (!targetSlide) return;
      activeIndex = targetIndex;
      const trackRect = track.getBoundingClientRect();
      const slideRect = targetSlide.getBoundingClientRect();
      const offset = slideRect.left - trackRect.left + track.scrollLeft;
      track.scrollTo({ left: offset, behavior: smooth ? 'smooth' : 'auto' });
      updateButtons();
    };

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        scrollToSlide(activeIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        scrollToSlide(activeIndex + 1);
      });
    }

    let scrollFrame = null;
    const handleScroll = () => {
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      scrollFrame = window.requestAnimationFrame(() => {
        const trackLeft = track.getBoundingClientRect().left;
        let closestIndex = activeIndex;
        let smallestDiff = Number.POSITIVE_INFINITY;
        slides.forEach((slide, idx) => {
          const diff = Math.abs(slide.getBoundingClientRect().left - trackLeft);
          if (diff < smallestDiff) {
            smallestDiff = diff;
            closestIndex = idx;
          }
        });
        if (closestIndex !== activeIndex) {
          activeIndex = closestIndex;
          updateButtons();
        }
      });
    };

    const handleResize = () => scrollToSlide(activeIndex, false);

    track.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    scrollToSlide(0, false);
  });
};

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

initStoryCarousels();
initQuoteCarousels();

const initModals = () => {
  const triggers = document.querySelectorAll('[data-modal-open]');
  const modalNodes = document.querySelectorAll('[data-modal]');
  if (!triggers.length || !modalNodes.length) return;

  const modals = new Map();
  modalNodes.forEach((modal) => {
    const id = modal.dataset.modal;
    if (!id) return;
    modals.set(id, modal);
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    if (!modal.hasAttribute('tabindex')) {
      modal.setAttribute('tabindex', '-1');
    }
  });
  if (!modals.size) return;

  const focusableSelectors =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let activeModal = null;
  let previousFocus = null;

  const getFocusable = (modal) =>
    Array.from(modal.querySelectorAll(focusableSelectors)).filter((element) => {
      if (element.hasAttribute('disabled')) return false;
      if (element.getAttribute('aria-hidden') === 'true') return false;
      return element.offsetParent !== null || element.getClientRects().length > 0 || modal === element;
    });

  const handleKeydown = (event) => {
    if (!activeModal) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal(activeModal);
      return;
    }
    if (event.key === 'Tab') {
      const focusable = getFocusable(activeModal);
      if (!focusable.length) {
        event.preventDefault();
        activeModal.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey) {
        if (document.activeElement === first || !activeModal.contains(document.activeElement)) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  const openModal = (modal) => {
    if (activeModal === modal) return;
    if (activeModal) {
      closeModal(activeModal);
    }
    activeModal = modal;
    previousFocus = document.activeElement;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('overflow-hidden');
    const focusable = getFocusable(modal);
    window.requestAnimationFrame(() => {
      if (focusable.length) {
        focusable[0].focus();
      } else {
        modal.focus();
      }
    });
    document.addEventListener('keydown', handleKeydown);
  };

  const closeModal = (modal) => {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    if (activeModal === modal) {
      activeModal = null;
      document.body.classList.remove('overflow-hidden');
      document.removeEventListener('keydown', handleKeydown);
      if (previousFocus && typeof previousFocus.focus === 'function') {
        previousFocus.focus();
      }
      previousFocus = null;
    }
  };

  modals.forEach((modal) => {
    const overlay = modal.querySelector('[data-modal-overlay]');
    if (overlay) {
      overlay.addEventListener('click', () => {
        closeModal(modal);
      });
    }
    const closeButtons = modal.querySelectorAll('[data-modal-close]');
    closeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        closeModal(modal);
      });
    });
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeModal(modal);
      }
    });
  });

  triggers.forEach((trigger) => {
    const targetId = trigger.dataset.modalOpen;
    if (!targetId || !modals.has(targetId)) return;
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      const modal = modals.get(targetId);
      if (modal) {
        openModal(modal);
      }
    });
  });
};
initModals();

// Handle reduced motion for hero video
const heroVideo = document.querySelector('.hero-video');
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const isHtmlMediaElement = heroVideo instanceof HTMLMediaElement;
const isYouTubeEmbed =
  heroVideo instanceof HTMLIFrameElement && heroVideo.src.includes('youtube.com/embed');

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
      heroVideo.pause();
      heroVideo.currentTime = 0;
      heroVideo.removeAttribute('autoplay');
      heroVideo.setAttribute('aria-hidden', 'true');
    } else {
      heroVideo.removeAttribute('aria-hidden');
      heroVideo.muted = true;
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
      heroVideo.setAttribute('aria-hidden', 'true');
    } else {
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

const initSubscribeForm = () => {
  const form = document.getElementById('subscribeForm');
  if (!form) return;

  const statusEl = document.getElementById('subscribeStatus');
  const submitBtn = form.querySelector('[data-subscribe-submit]');
  let busy = false;

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
    const botField = String(formData.get('bot-field') || '').trim();

    if (!email) {
      setStatus('Please enter your email address.', 'error');
      return;
    }

    if (botField) {
      setStatus('Thanks, you are subscribed.', 'success');
      form.reset();
      return;
    }

    const payload = {
      email,
      service_area: String(formData.get('service_area') || '').trim() || null,
      affiliation: String(formData.get('affiliation') || '').trim() || null,
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

// Inject current year in footer
const yearTarget = document.getElementById('year');
if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/assets/js/service-worker.js').catch((error) => {
      console.error('Service worker registration failed', error);
    });
  });
}
