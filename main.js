/* =====================================================
   STEP1FILM — main.js
   Clean, modular, accessibility-first.
   ===================================================== */
(function () {
  'use strict';

  /* --------------------------------------------------
     Capability + preference detection
  -------------------------------------------------- */
  const prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const isTouch =
    window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches;

  const isWideScreen = () =>
    window.matchMedia && window.matchMedia('(min-width: 901px)').matches;

  if (prefersReducedMotion) document.body.classList.add('reduced-motion');

  /* --------------------------------------------------
     FILM GRAIN — throttled, cached frames
     Old version: random RGB pixel fill at 60fps (~100% CPU on slow devices).
     New: pre-bake 8 noise tiles at small res, rotate at ~12fps,
     pause when document is hidden or reduced-motion is on.
  -------------------------------------------------- */
  function initGrain() {
    // Disabled per design decision — keep the function so the boot wiring
    // stays intact, but do no work.
    const c = document.getElementById('grain');
    if (c) c.style.display = 'none';
    return;
  }

  /* --------------------------------------------------
     COUNTDOWN LOADER — now skippable + reduced-motion-aware
  -------------------------------------------------- */
  function initLoader(onDone) {
    const loader = document.getElementById('loader');
    const numEl = document.getElementById('ldNum');
    const bar = document.querySelector('.ld-progress');
    const skipBtn = document.getElementById('ldSkip');
    if (!loader) { onDone(); return; }

    let done = false;
    function finish() {
      if (done) return;
      done = true;
      if (bar) bar.style.strokeDashoffset = '0';
      if (numEl) numEl.textContent = '';
      setTimeout(() => {
        loader.classList.add('out');
        setTimeout(onDone, 500);
      }, 250);
    }

    // Reduced motion: skip the cinematic boot entirely
    if (prefersReducedMotion) {
      loader.style.display = 'none';
      onDone();
      return;
    }

    const CIRC = 314, STEPS = 5;
    let n = STEPS;
    function set(num) {
      numEl.textContent = num > 0 ? num : '';
      const offset = CIRC - CIRC * ((STEPS - num + 1) / STEPS);
      bar.style.strokeDashoffset = String(Math.max(0, offset));
    }
    set(STEPS);
    const iv = setInterval(() => {
      n--;
      if (n <= 0) { clearInterval(iv); finish(); }
      else set(n);
    }, 900);

    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        clearInterval(iv);
        finish();
      });
    }

    // Escape key also skips
    window.addEventListener('keydown', function escListener(e) {
      if (done) { window.removeEventListener('keydown', escListener); return; }
      if (e.key === 'Escape' || e.key === 'Enter') {
        clearInterval(iv);
        finish();
        window.removeEventListener('keydown', escListener);
      }
    });
  }

  /* --------------------------------------------------
     HERO VIDEO — lazy load on click / scroll-in
  -------------------------------------------------- */
  function initHeroVideo() {
    const wrap = document.getElementById('heroVideoWrap');
    const playBtn = document.getElementById('heroPlay');
    if (!wrap || !playBtn) return;

    const cfg = window.STEP1FILM_VIDEO || {};
    const id = (cfg.id || '').trim();
    const provider = cfg.provider || 'youtube';

    if (!id) {
      wrap.classList.add('no-video');
      playBtn.setAttribute('aria-disabled', 'true');
      playBtn.addEventListener('click', e => e.preventDefault());
      return;
    }

    let loaded = false;
    let iframe = null;

    function sendCommand(cmd) {
      if (!iframe) return;
      try {
        if (provider === 'vimeo') {
          iframe.contentWindow.postMessage(JSON.stringify({ method: cmd }), '*');
        } else {
          iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: cmd, args: '' }), '*');
        }
      } catch (e) {}
    }

    function loadVideo() {
      if (loaded) return;
      loaded = true;
      iframe = document.createElement('iframe');
      let src = '';
      if (provider === 'vimeo') {
        src = `https://player.vimeo.com/video/${encodeURIComponent(id)}?background=1&autoplay=1&muted=1&loop=1`;
      } else {
        src = `https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&mute=1&loop=1&playlist=${encodeURIComponent(id)}&controls=0&rel=0&showinfo=0&playsinline=1&modestbranding=1&enablejsapi=1`;
      }
      iframe.setAttribute('src', src);
      iframe.setAttribute('title', 'Showreel');
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      iframe.setAttribute('loading', 'lazy');
      wrap.insertBefore(iframe, wrap.firstChild);
      wrap.classList.add('playing');
    }

    // Load at 40% visibility, play/pause on scroll in/out.
    const heroEl = document.getElementById('hero');
    if (heroEl && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.intersectionRatio >= 0.6) {
            if (!loaded) {
              loadVideo();
            } else {
              sendCommand(provider === 'vimeo' ? 'play' : 'playVideo');
            }
          } else {
            sendCommand(provider === 'vimeo' ? 'pause' : 'pauseVideo');
          }
        });
      }, { threshold: [0, 0.1, 0.4, 0.6, 1.0] });
      io.observe(heroEl);
    } else {
      loadVideo();
    }

    playBtn.addEventListener('click', loadVideo);
  }

  /* --------------------------------------------------
     SCROLL DRIVER — desktop (horizontal wipe) only.
     On mobile we use a simpler IntersectionObserver-based nav sync.
  -------------------------------------------------- */
  function initScrollDriver() {
    const hWrapper = document.getElementById('h-wrapper');
    const panels = Array.from(document.querySelectorAll('.h-panel'));
    const dots = Array.from(document.querySelectorAll('.h-dot'));
    const curEl = document.getElementById('hCur');
    const labelEl = document.getElementById('hLabel');
    const prevBtn = document.getElementById('hPrev');
    const nextBtn = document.getElementById('hNext');
    if (!hWrapper || !panels.length) return;

    const LABELS = () => window.STEP1FILM_NAV_LABELS || ['Films', 'About', 'Practice', 'Press', 'Contact'];
    const TOTAL = panels.length;
    const fmt = n => String(n + 1).padStart(2, '0');
    let lastPanelIdx = -1;
    let wideMode = isWideScreen();

    // Byt språk → skriv om den synliga sektionsetiketten direkt
    document.addEventListener('s1f:langchange', () => {
      if (labelEl && lastPanelIdx >= 0) labelEl.textContent = LABELS()[lastPanelIdx] || '';
    });

    function setActive(panelIdx) {
      if (panelIdx === lastPanelIdx) return;
      lastPanelIdx = panelIdx;
      dots.forEach((d, i) => {
        const on = i === panelIdx;
        d.classList.toggle('active', on);
        d.setAttribute('aria-current', on ? 'true' : 'false');
      });
      if (curEl) curEl.textContent = fmt(panelIdx);
      if (labelEl) labelEl.textContent = LABELS()[panelIdx] || '';
    }

    /* --- Desktop: clip-path wipe driven by scrollY --- */
    function onScrollDesktop() {
      const vh = window.innerHeight;

      const scrolledIn = -hWrapper.getBoundingClientRect().top;
      panels.forEach((panel, i) => {
        if (i === 0) return;
        const progress = Math.max(0, Math.min(1, (scrolledIn - (i - 1) * vh) / vh));
        panel.style.clipPath = `inset(0 0 0 ${(1 - progress) * 100}%)`;
      });

      const panelIdx = Math.min(TOTAL - 1, Math.max(0, Math.floor(scrolledIn / vh)));
      setActive(panelIdx);

      if (prevBtn) prevBtn.disabled = panelIdx <= 0 && scrolledIn <= 0;
      if (nextBtn) nextBtn.disabled = panelIdx >= TOTAL - 1 && scrolledIn >= (TOTAL - 1) * vh;
    }

    /* --- Mobile: sync nav dots via IntersectionObserver --- */
    function setupMobileNav() {
      // Reset any inline clip-paths applied in desktop mode
      panels.forEach(p => { p.style.clipPath = ''; });

      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const idx = parseInt(entry.target.dataset.panel, 10);
          if (!Number.isNaN(idx)) setActive(idx);
        });
      }, { threshold: [0.4, 0.6] });
      panels.forEach(p => io.observe(p));
    }

    function goToPanel(idx) {
      idx = Math.max(0, Math.min(TOTAL - 1, idx));
      if (wideMode) {
        window.scrollTo({ top: hWrapper.offsetTop + idx * window.innerHeight, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      } else {
        const target = panels[idx];
        if (target) target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
      }
    }

    function currentIdx() {
      if (wideMode) {
        return Math.min(TOTAL - 1, Math.max(0, Math.floor(-hWrapper.getBoundingClientRect().top / window.innerHeight)));
      }
      // Mobile: find which panel is closest to viewport center
      const mid = window.innerHeight / 2;
      let best = 0, bestDist = Infinity;
      panels.forEach((p, i) => {
        const r = p.getBoundingClientRect();
        const c = r.top + r.height / 2;
        const d = Math.abs(c - mid);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      return best;
    }

    /* --- Mount the right handler & wire controls --- */
    if (wideMode) {
      window.addEventListener('scroll', onScrollDesktop, { passive: true });
      onScrollDesktop();
    } else {
      setupMobileNav();
    }

    // Handle resize across breakpoints: simplest correct behaviour is to reload,
    // but that's harsh — instead, just toggle which observer set is active.
    let resizeT;
    window.addEventListener('resize', () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(() => {
        const nowWide = isWideScreen();
        if (nowWide !== wideMode) {
          // Reload to reset cleanly — rare action, acceptable cost.
          location.reload();
        }
      }, 250);
    });

    dots.forEach(dot => dot.addEventListener('click', () => goToPanel(parseInt(dot.dataset.i, 10))));

    if (prevBtn) prevBtn.addEventListener('click', () => goToPanel(currentIdx() - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goToPanel(currentIdx() + 1));

    window.addEventListener('keydown', e => {
      // Only intercept arrows when focus isn't inside a form-like field
      const tag = (document.activeElement && document.activeElement.tagName) || '';
      if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goToPanel(currentIdx() + 1); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goToPanel(currentIdx() - 1); }
    });

    // Touch swipe — desktop sticky wipe doesn't get touchmove; mobile uses native scroll
    if (wideMode) {
      const sticky = document.getElementById('h-sticky');
      if (sticky) {
        let tx = 0, ty = 0;
        sticky.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
        sticky.addEventListener('touchend', e => {
          const dx = e.changedTouches[0].clientX - tx;
          const dy = e.changedTouches[0].clientY - ty;
          if (Math.abs(dx) < 40 && Math.abs(dy) < 40) return;
          if (Math.abs(dx) > Math.abs(dy)) goToPanel(currentIdx() + (dx < 0 ? 1 : -1));
        }, { passive: true });
      }
    }
  }

  /* --------------------------------------------------
     FILM REEL CURSOR — desktop only, GPU-composited
  -------------------------------------------------- */
  function initCursor() {
    if (isTouch) return;
    const el = document.createElement('div');
    el.id = 'film-cursor';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
    window.addEventListener('mousemove', e => {
      el.style.transform = `translate3d(${e.clientX - 10}px,${e.clientY - 10}px,0)`;
      if (!el.classList.contains('visible')) el.classList.add('visible');
    }, { passive: true });
  }

  /* --------------------------------------------------
     TWEAKS — accent color (red / amber / cool)
     Listens for the host editor's __activate_edit_mode message.
  -------------------------------------------------- */
  const ACCENTS = {
    red:   { value: '#e01c1c', label: 'Red' },
    amber: { value: '#d97718', label: 'Amber' },
    cool:  { value: '#5aa9d6', label: 'Cool' }
  };

  function initTweaks() {
    let current = localStorage.getItem('s1f.accent') || 'red';
    applyAccent(current);

    function applyAccent(name) {
      const a = ACCENTS[name] || ACCENTS.red;
      document.documentElement.style.setProperty('--accent', a.value);
      current = name;
      try { localStorage.setItem('s1f.accent', name); } catch (e) {}
      // Reflect in panel if mounted
      const swatches = document.querySelectorAll('.tw-swatch');
      swatches.forEach(s => {
        const pressed = s.dataset.accent === name;
        s.setAttribute('aria-pressed', pressed ? 'true' : 'false');
      });
    }

    function buildPanel() {
      if (document.getElementById('tweaks')) return document.getElementById('tweaks');
      const panel = document.createElement('aside');
      panel.id = 'tweaks';
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-label', 'Tweaks');
      panel.innerHTML = `
        <div class="tw-head">
          <span>TWEAKS</span>
          <button class="tw-close" type="button" aria-label="Close tweaks">×</button>
        </div>
        <div>
          <label class="tw-label">Accent</label>
          <div class="tw-swatches" role="radiogroup" aria-label="Accent color">
            ${Object.entries(ACCENTS).map(([k, a]) => `
              <button class="tw-swatch" data-accent="${k}" type="button" role="radio" aria-label="${a.label}" aria-pressed="false">
                <span class="sw-dot" style="background:${a.value}"></span>
              </button>
            `).join('')}
          </div>
        </div>
      `;
      document.body.appendChild(panel);
      panel.querySelectorAll('.tw-swatch').forEach(btn => {
        btn.addEventListener('click', () => applyAccent(btn.dataset.accent));
      });
      panel.querySelector('.tw-close').addEventListener('click', () => {
        panel.classList.remove('is-open');
        try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch (e) {}
      });
      return panel;
    }

    window.addEventListener('message', e => {
      const data = e.data || {};
      if (data.type === '__activate_edit_mode') {
        const p = buildPanel();
        p.classList.add('is-open');
        // Re-sync pressed swatch
        applyAccent(current);
      } else if (data.type === '__deactivate_edit_mode') {
        const p = document.getElementById('tweaks');
        if (p) p.classList.remove('is-open');
      }
    });

    // Announce availability AFTER the listener is registered
    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (e) {}
  }

  /* --------------------------------------------------
     FILMRUTOR — trailer-embed, logotyprad, affischbildspel
     Allt innehåll konfigureras längst ner i index.html:
       window.STEP1FILM_EMBEDS   { 'film-001': { provider, id } }
       window.STEP1FILM_CLIENTS  [ { src, name } ]
       window.STEP1FILM_POSTERS  { shorts: [ 'sökväg.jpg', … ] }
     Saknas innehållet visas ett neutralt tomläge — aldrig en trasig ruta.
  -------------------------------------------------- */
  function initFilmMedia() {
    /* --- 001: trailer som laddas först vid klick --- */
    const embeds = window.STEP1FILM_EMBEDS || {};
    document.querySelectorAll('[data-embed]').forEach(box => {
      const cfg = embeds[box.dataset.embed] || {};
      const id = String(cfg.id || '').trim();
      if (!id) { box.classList.add('no-video'); return; }

      const btn = box.querySelector('.fe-play');
      if (!btn) return;
      btn.addEventListener('click', () => {
        if (box.classList.contains('is-playing')) return;
        const provider = cfg.provider === 'vimeo' ? 'vimeo' : 'youtube';
        // Vimeo: olistade filmer kräver sekretessnyckeln (h=) för att spelas
        const hash = String(cfg.hash || '').trim();
        const src = provider === 'vimeo'
          ? `https://player.vimeo.com/video/${encodeURIComponent(id)}?autoplay=1&playsinline=1`
            + (hash ? `&h=${encodeURIComponent(hash)}` : '')
          : `https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
        const frame = document.createElement('iframe');
        frame.src = src;
        frame.title = cfg.title || 'Trailer';
        frame.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share');
        frame.setAttribute('allowfullscreen', '');
        frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        frame.setAttribute('loading', 'lazy');
        box.appendChild(frame);
        box.classList.add('is-playing');
      });
    });

    /* --- 002: samarbetslogotyper --- */
    const clients = window.STEP1FILM_CLIENTS || [];
    document.querySelectorAll('[data-logos]').forEach(box => {
      if (!clients.length) { box.classList.add('is-empty'); return; }
      clients.slice(0, 6).forEach(c => {
        const img = document.createElement('img');
        img.src = c.src;
        img.alt = c.name || '';
        img.loading = 'lazy';
        // En logotyp som inte laddar ska försvinna, inte lämna en trasig ikon
        img.addEventListener('error', () => img.remove());
        box.appendChild(img);
      });
    });

    /* --- 003: affischbildspel, byter bild vid hover och klick --- */
    const posters = window.STEP1FILM_POSTERS || {};
    document.querySelectorAll('[data-slides]').forEach(box => {
      const list = posters[box.dataset.slides] || [];
      if (!list.length) { box.classList.add('is-empty'); return; }

      const imgs = list.map((src, i) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = '';
        img.loading = i === 0 ? 'eager' : 'lazy';
        if (i === 0) img.classList.add('is-on');
        box.appendChild(img);
        return img;
      });

      let dots = null;
      if (list.length > 1) {
        dots = document.createElement('div');
        dots.className = 'fs-dots';
        list.forEach((_, i) => {
          const d = document.createElement('span');
          if (i === 0) d.classList.add('is-on');
          dots.appendChild(d);
        });
        box.appendChild(dots);
      }

      let idx = 0;
      function show(n) {
        idx = (n + imgs.length) % imgs.length;
        imgs.forEach((im, i) => im.classList.toggle('is-on', i === idx));
        if (dots) Array.from(dots.children).forEach((d, i) => d.classList.toggle('is-on', i === idx));
      }

      // Ingen automatisk uppspelning — besökaren styr, precis som i butiken
      const item = box.closest('.film-item');
      if (item) {
        item.addEventListener('mouseenter', () => { if (imgs.length > 1) show(1); });
        item.addEventListener('mouseleave', () => show(0));
      }
      box.addEventListener('click', () => show(idx + 1));

      // Svep på pekskärm
      let x0 = null;
      box.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
      box.addEventListener('touchend', e => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 30) show(idx + (dx < 0 ? 1 : -1));
        x0 = null;
      }, { passive: true });
    });
  }

  /* --------------------------------------------------
     BOOT SEQUENCE
  -------------------------------------------------- */
  function boot() {
    initGrain();
    initCursor();
    initTweaks();
    initHeroVideo();
    initFilmMedia();
    initLoader(() => {
      document.body.classList.remove('is-loading');
      initScrollDriver();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
