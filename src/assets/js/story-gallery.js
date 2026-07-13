(() => {
  const dataElement = document.getElementById('story-gallery-data');
  if (!dataElement) return;

  let stories = [];
  try {
    stories = JSON.parse(dataElement.textContent || '[]');
  } catch (error) {
    console.error('Could not load story gallery data', error);
    return;
  }

  if (!Array.isArray(stories) || !stories.length) return;

  const detail = document.querySelector('[data-story-detail]');
  const detailContent = document.querySelector('[data-detail-content]');
  const detailScroll = document.querySelector('[data-detail-scroll]');
  const detailCount = document.querySelector('[data-detail-count]');
  const closeButton = document.querySelector('[data-detail-close]');
  const previousButton = document.querySelector('[data-detail-prev]');
  const nextButton = document.querySelector('[data-detail-next]');
  const attract = document.querySelector('[data-attract]');
  const attractBackdrop = document.querySelector('[data-attract-backdrop]');
  const attractImage = document.querySelector('[data-attract-image]');
  const attractEyebrow = document.querySelector('[data-attract-eyebrow]');
  const attractTitle = document.querySelector('[data-attract-title]');
  const attractQuote = document.querySelector('[data-attract-quote]');
  const attractCount = document.querySelector('[data-attract-count]');
  const startAttractButton = document.querySelector('[data-start-attract]');
  const offlineStatus = document.querySelector('[data-offline-status]');
  const offlineDot = document.querySelector('[data-offline-dot]');
  const offlineLabel = document.querySelector('[data-offline-label]');
  const kioskShell = document.querySelector('.story-kiosk');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const IDLE_DELAY = 90000;
  const ATTRACT_INTERVAL = reducedMotion ? 15000 : 11000;
  let activeIndex = -1;
  let previousFocus = null;
  let idleTimer = null;
  let attractTimer = null;
  let attractStory = null;
  let attractQueue = [];
  let attractPosition = 0;
  let lastAttractId = null;
  let touchStartX = 0;
  let touchStartY = 0;

  const setKioskInert = (inert) => {
    if (!kioskShell) return;
    if (inert) kioskShell.setAttribute('inert', '');
    else kioskShell.removeAttribute('inert');
  };

  const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const shuffle = (items) => {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    if (shuffled.length > 1 && shuffled[0].id === lastAttractId) {
      [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
    }
    return shuffled;
  };

  const renderStats = (stats = []) => {
    if (!stats.length) return '';
    return `
      <dl class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        ${stats.map((stat) => `
          <div class="rounded-2xl bg-primary/5 p-4">
            <dt class="text-2xl font-bold text-primary sm:text-3xl">${escapeHtml(stat.value)}</dt>
            <dd class="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">${escapeHtml(stat.label)}</dd>
          </div>
        `).join('')}
      </dl>
    `;
  };

  const renderGallery = (story) => {
    const gallery = Array.isArray(story.gallery) ? story.gallery : [];
    if (gallery.length <= 1) return '';
    return `
      <section class="space-y-4" aria-labelledby="kiosk-gallery-heading">
        <h3 id="kiosk-gallery-heading" class="font-heading text-2xl font-semibold text-slate-900">More from this story</h3>
        <div class="grid grid-cols-2 gap-3 lg:grid-cols-3">
          ${gallery.map((image, index) => `
            <figure class="overflow-hidden rounded-2xl bg-slate-200 ${index === 0 ? 'row-span-2' : ''}">
              <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}" class="h-full min-h-52 w-full object-cover" loading="lazy" decoding="async">
            </figure>
          `).join('')}
        </div>
      </section>
    `;
  };

  const renderDetail = (story) => {
    if (!detailContent) return;
    detailContent.innerHTML = `
      <figure class="relative h-[38vh] min-h-72 overflow-hidden bg-slate-900 sm:h-[48vh]">
        <img src="${escapeHtml(story.image)}" alt="" class="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl" aria-hidden="true" decoding="async">
        <img src="${escapeHtml(story.image)}" alt="${escapeHtml(story.alt)}" class="absolute inset-0 h-full w-full object-contain" decoding="async">
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-slate-950/5"></div>
        <figcaption class="absolute inset-x-0 bottom-0 px-5 pb-5 text-white sm:px-10 sm:pb-7 lg:px-14">
          <div class="max-w-5xl rounded-[1.5rem] border border-white/15 bg-slate-950/90 px-5 py-4 shadow-2xl backdrop-blur-md sm:px-7 sm:py-5">
            <p class="text-xs font-bold uppercase tracking-[0.25em] text-secondary">${escapeHtml(story.eyebrow)}</p>
            <h2 id="kiosk-story-title" class="mt-2 font-heading text-3xl font-bold leading-tight text-white sm:text-5xl">${escapeHtml(story.title)}</h2>
          </div>
        </figcaption>
      </figure>
      <div class="mx-auto max-w-7xl space-y-10 px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
        <div class="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
          <div class="space-y-6 text-lg leading-relaxed text-slate-700">
            <p class="text-sm font-bold uppercase tracking-[0.2em] text-primary/60">${escapeHtml(story.published)}</p>
            ${(story.body || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
          </div>
          <aside class="space-y-5">
            <blockquote class="rounded-3xl border-l-4 border-secondary bg-secondary/10 p-6 font-heading text-2xl font-semibold leading-snug text-slate-900">&ldquo;${escapeHtml(story.quote)}&rdquo;</blockquote>
            <div class="rounded-3xl border border-primary/15 bg-white p-6 shadow-lg">
              <p class="text-xs font-bold uppercase tracking-[0.22em] text-primary/60">Why it matters</p>
              <p class="mt-3 leading-relaxed text-slate-700">${escapeHtml(story.impact)}</p>
            </div>
            ${renderStats(story.stats)}
          </aside>
        </div>
        ${renderGallery(story)}
        <div class="flex items-center justify-between gap-4 border-t border-slate-200 pt-6">
          <button type="button" class="inline-flex min-h-14 items-center gap-2 rounded-full border border-primary/15 bg-white px-6 py-3 font-bold text-primary shadow-sm active:scale-[0.98]" data-inline-prev>&larr; Previous</button>
          <button type="button" class="inline-flex min-h-14 items-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-white shadow-sm active:scale-[0.98]" data-inline-next>Next story &rarr;</button>
        </div>
      </div>
    `;

    detailContent.querySelector('[data-inline-prev]')?.addEventListener('click', () => moveDetail(-1));
    detailContent.querySelector('[data-inline-next]')?.addEventListener('click', () => moveDetail(1));
  };

  const openDetail = (index, options = {}) => {
    if (!detail || !stories[index]) return;
    stopAttract();
    activeIndex = index;
    previousFocus = options.preserveFocus ? previousFocus : document.activeElement;
    renderDetail(stories[index]);
    if (detailCount) detailCount.textContent = `Story ${index + 1} of ${stories.length}`;
    detail.classList.remove('hidden');
    detail.setAttribute('aria-hidden', 'false');
    setKioskInert(true);
    document.body.classList.add('overflow-hidden');
    if (detailScroll) detailScroll.scrollTop = 0;
    closeButton?.focus({ preventScroll: true });
    resetIdleTimer();
  };

  const closeDetail = (restoreFocus = true) => {
    if (!detail || detail.classList.contains('hidden')) return;
    detail.classList.add('hidden');
    detail.setAttribute('aria-hidden', 'true');
    setKioskInert(false);
    document.body.classList.remove('overflow-hidden');
    activeIndex = -1;
    if (restoreFocus && previousFocus instanceof HTMLElement) previousFocus.focus();
    previousFocus = null;
  };

  function moveDetail(direction) {
    const nextIndex = (activeIndex + direction + stories.length) % stories.length;
    openDetail(nextIndex, { preserveFocus: true });
  }

  const prepareAttractQueue = () => {
    attractQueue = shuffle(stories);
    attractPosition = 0;
  };

  const showNextAttractStory = () => {
    if (!attractQueue.length || attractPosition >= attractQueue.length) prepareAttractQueue();
    attractStory = attractQueue[attractPosition];
    attractPosition += 1;
    lastAttractId = attractStory.id;
    if (attractImage) {
      attractImage.classList.add('opacity-0');
      if (attractBackdrop) attractBackdrop.style.opacity = '0';
      window.setTimeout(() => {
        attractImage.src = attractStory.image;
        attractImage.alt = attractStory.alt;
        if (attractBackdrop) attractBackdrop.src = attractStory.image;
        attractImage.classList.remove('opacity-0');
        if (attractBackdrop) attractBackdrop.style.opacity = '0.7';
      }, reducedMotion ? 0 : 220);
    }
    if (attractEyebrow) attractEyebrow.textContent = attractStory.eyebrow;
    if (attractTitle) attractTitle.textContent = attractStory.title;
    if (attractQuote) attractQuote.textContent = `“${attractStory.quote}”`;
    if (attractCount) attractCount.textContent = `Story ${attractPosition} of ${stories.length}`;
  };

  const startAttract = () => {
    if (!attract) return;
    closeDetail(false);
    window.clearTimeout(idleTimer);
    window.clearInterval(attractTimer);
    showNextAttractStory();
    attract.classList.remove('hidden');
    attract.setAttribute('aria-hidden', 'false');
    setKioskInert(true);
    document.body.classList.add('overflow-hidden');
    attractTimer = window.setInterval(showNextAttractStory, ATTRACT_INTERVAL);
  };

  function stopAttract() {
    window.clearInterval(attractTimer);
    attractTimer = null;
    attract?.classList.add('hidden');
    attract?.setAttribute('aria-hidden', 'true');
    if (detail?.classList.contains('hidden')) setKioskInert(false);
    if (detail?.classList.contains('hidden')) document.body.classList.remove('overflow-hidden');
  }

  const handleIdle = () => {
    closeDetail(false);
    startAttract();
  };

  function resetIdleTimer() {
    if (attract && !attract.classList.contains('hidden')) return;
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(handleIdle, IDLE_DELAY);
  }

  document.querySelectorAll('[data-story-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const index = stories.findIndex((story) => story.id === button.getAttribute('data-story-id'));
      if (index >= 0) openDetail(index);
    });
  });

  closeButton?.addEventListener('click', () => {
    closeDetail();
    resetIdleTimer();
  });
  previousButton?.addEventListener('click', () => moveDetail(-1));
  nextButton?.addEventListener('click', () => moveDetail(1));
  startAttractButton?.addEventListener('click', startAttract);
  attract?.addEventListener('click', () => {
    const index = stories.findIndex((story) => story.id === attractStory?.id);
    stopAttract();
    if (index >= 0) openDetail(index);
  });

  detailScroll?.addEventListener('touchstart', (event) => {
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true });

  detailScroll?.addEventListener('touchend', (event) => {
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    if (Math.abs(deltaX) > 80 && Math.abs(deltaY) < 70) moveDetail(deltaX > 0 ? -1 : 1);
  }, { passive: true });
  detailScroll?.addEventListener('scroll', resetIdleTimer, { passive: true });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (attract && !attract.classList.contains('hidden')) stopAttract();
      else closeDetail();
      resetIdleTimer();
    }
    if (activeIndex >= 0 && event.key === 'ArrowLeft') moveDetail(-1);
    if (activeIndex >= 0 && event.key === 'ArrowRight') moveDetail(1);
    if (activeIndex >= 0 && event.key === 'Tab' && detail) {
      const focusable = Array.from(detail.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])'))
        .filter((element) => !element.hasAttribute('disabled'));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  });

  ['pointerdown', 'keydown', 'scroll'].forEach((eventName) => {
    document.addEventListener(eventName, resetIdleTimer, { passive: true });
  });

  const setOfflineStatus = (state, label) => {
    if (offlineStatus) offlineStatus.dataset.state = state;
    if (offlineLabel) offlineLabel.textContent = label;
    if (offlineDot) {
      offlineDot.className = `h-2.5 w-2.5 rounded-full ${state === 'ready' ? 'bg-emerald-400' : state === 'offline' ? 'bg-secondary' : 'bg-amber-400'}`;
    }
  };

  const updateConnectionStatus = () => {
    if (!navigator.onLine) setOfflineStatus('offline', 'Offline mode active');
  };

  if ('serviceWorker' in navigator) {
    let reloadingForUpdate = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloadingForUpdate) return;
      reloadingForUpdate = true;
      window.location.reload();
    });

    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/story-gallery/sw.js', {
          scope: '/story-gallery/',
          updateViaCache: 'none',
        });
        await registration.update();
        await navigator.serviceWorker.ready;
        setOfflineStatus('ready', navigator.onLine ? 'Offline ready' : 'Offline mode active');

        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible' && navigator.onLine) registration.update();
        });
        window.setInterval(() => {
          if (navigator.onLine) registration.update();
        }, 5 * 60 * 1000);
      } catch (error) {
        setOfflineStatus('error', 'Online mode only');
        console.error('Story gallery offline setup failed', error);
      }
    });
  } else {
    setOfflineStatus('error', 'Online mode only');
  }

  window.addEventListener('online', () => setOfflineStatus('ready', 'Offline ready'));
  window.addEventListener('offline', updateConnectionStatus);
  resetIdleTimer();
})();
