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
    'main .event-card',
    'main .grid > *',
  ].join(', ');
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
      threshold: 0.25,
      rootMargin: '0px 0px -10% 0px',
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

async function renderEvents() {
  const target = document.getElementById('eventsList');
  if (!target) return;
  target.setAttribute('aria-busy', 'true');
  try {
    const res = await fetch('/events.json', { headers: { 'Cache-Control': 'no-cache' } });
    if (!res.ok) throw new Error(`Failed to fetch events: ${res.status}`);
    const data = await res.json();
    if (!data.events || !data.events.length) {
      target.innerHTML = '<p class="text-gray-600">No upcoming events right now. Check back soon!</p>';
      return;
    }
    target.innerHTML = data.events
      .map((ev) => {
        const displayDate = ev.displayDate || formatEventDate(ev.date);
        const datetimeAttr = ev.date ? ` datetime="${ev.date}"` : '';
        const timeDetails = [displayDate, ev.time].filter(Boolean).join(' &middot; ');
        const locationLine = ev.location ? `<p class="text-sm text-gray-600">${ev.location}</p>` : '';
        const notesLine = ev.notes ? `<p class="text-sm text-gray-600">${ev.notes}</p>` : '';
        const imageBlock = ev.image
          ? `<img src="${ev.image}" alt="${ev.title}" class="event-card__image mb-4" loading="lazy" decoding="async">`
          : '';
        let ctaButton = '';
        if (ev.ctaUrl) {
          const absolute = /^https?:/i.test(ev.ctaUrl);
          const currentOrigin = window.location.origin;
          const external = absolute && !ev.ctaUrl.startsWith(currentOrigin);
          const attrs = external ? ' target="_blank" rel="noopener"' : '';
          const label = ev.ctaLabel || 'Learn More';
          const externalNote = external ? ' <span class="sr-only">(opens in new tab)</span>' : '';
          ctaButton = `<a class="btn w-fit" href="${ev.ctaUrl}"${attrs}>${label}${externalNote}</a>`;
        }
        return `
          <article class="event-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
            ${imageBlock}
            <div class="space-y-2 mb-4">
              <h3 class="text-xl font-semibold text-primary">${ev.title}</h3>
              ${
                timeDetails
                  ? `<p class="text-gray-700"><time${datetimeAttr}>${displayDate || ev.date || ''}</time>${ev.time ? ` &middot; ${ev.time}` : ''}</p>`
                  : ''
              }
              ${locationLine}
              ${notesLine}
            </div>
            ${ctaButton}
          </article>
        `;
      })
      .join('');
    scrollReveal.init(target);
  } catch (error) {
    target.innerHTML = '<p class="text-red-600">Could not load events. Please refresh and try again.</p>';
    console.error(error);
  } finally {
    target.setAttribute('aria-busy', 'false');
  }
}
renderEvents();

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
