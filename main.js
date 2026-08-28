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

  /* Svepsystemet kräver både bredd OCH höjd. En telefon i liggande läge
     är bred nog (t.ex. 932 px) men bara ~430 px hög — då fick filmlistan
     171 px där den behöver 354 och halva innehållet försvann.
     Håll i synk med media queries i style.css. */
  const isWideScreen = () =>
    window.matchMedia && window.matchMedia('(min-width: 901px) and (min-height: 560px)').matches;

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
    let playing = false;

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

    /* -------- Fyll rutan helt --------
       Ramen är 16:9. Är filmen bredare lägger spelaren svarta kanter
       över och under. Vi förstorar ramen tills själva filmen täcker
       rutan, så kanterna hamnar utanför bild. */
    const FRAME_AR = 16 / 9;
    let videoAR = Number(cfg.aspect) > 0 ? Number(cfg.aspect) : FRAME_AR;
    let videoW = 0, videoH = 0;

    function fitFrame() {
      const vw = window.innerWidth, vh = window.innerHeight;
      const w = videoAR >= FRAME_AR
        ? Math.max(vw, videoAR * vh)              // brevlådekanter uppe/nere
        : FRAME_AR * Math.max(vh, vw / videoAR);  // kanter på sidorna
      wrap.style.setProperty('--hero-fw', Math.ceil(w) + 'px');
    }

    // Spelaren svarar på sina egna mått — då blir det exakt, oavsett
    // vad som står i site-config.js.
    window.addEventListener('message', (e) => {
      if (!iframe) return;
      let host = '';
      try { host = new URL(e.origin).hostname; } catch { return; }
      if (!/(^|\.)vimeo\.com$/.test(host)) return;
      let d = e.data;
      if (typeof d === 'string') { try { d = JSON.parse(d); } catch { return; } }
      if (!d) return;
      if (d.event === 'ready') { sendCommand('getVideoWidth'); sendCommand('getVideoHeight'); return; }
      if (d.method === 'getVideoWidth') videoW = Number(d.value) || 0;
      if (d.method === 'getVideoHeight') videoH = Number(d.value) || 0;
      if (videoW > 0 && videoH > 0) { videoAR = videoW / videoH; fitFrame(); }
    });

    fitFrame();
    let fitT;
    window.addEventListener('resize', () => { clearTimeout(fitT); fitT = setTimeout(fitFrame, 120); });

    function loadVideo() {
      if (loaded) return;
      loaded = true;
      iframe = document.createElement('iframe');
      let src = '';
      if (provider === 'vimeo') {
        src = `https://player.vimeo.com/video/${encodeURIComponent(id)}?background=1&autoplay=1&muted=1&loop=1&autopause=0`;
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
      playing = true; // src:en har autoplay=1
    }

    /* -------- Spela / pausa efter hur täckt showreelen är --------
       Den rullar så länge minst 15 % av den syns. Är den 85 % täckt
       av nästa sida pausar den, och startar igen när den kommer fram. */
    const COVER_PAUSE = 0.85;

    function setPlaying(on) {
      if (on === playing) return;
      playing = on;
      sendCommand(on
        ? (provider === 'vimeo' ? 'play' : 'playVideo')
        : (provider === 'vimeo' ? 'pause' : 'pauseVideo'));
    }

    document.addEventListener('s1f:herocover', (e) => {
      const covered = e.detail;
      if (covered < COVER_PAUSE) {
        if (!loaded) loadVideo(); else setPlaying(true);
      } else if (loaded) {
        setPlaying(false);
      }
    });

    // Ingen wipe att lyssna på (t.ex. utan JS-driven scroll) — ladda ändå.
    loadVideo();

    playBtn.addEventListener('click', () => { loadVideo(); setPlaying(true); });
  }

  /* --------------------------------------------------
     SCROLL DRIVER — desktop (horizontal wipe) only.
     On mobile we use a simpler IntersectionObserver-based nav sync.
  -------------------------------------------------- */
  function initScrollDriver() {
    const hWrapper = document.getElementById('h-wrapper');
    const hSticky = document.getElementById('h-sticky');
    /* Bara paneler som är påslagna. Sätt hidden på en <section class="h-panel">
       så försvinner den ur numrering, prickar, rullhöjd och fokusenhet. */
    const panels = Array.from(document.querySelectorAll('.h-panel:not([hidden])'));
    let dots = Array.from(document.querySelectorAll('.h-dot'));
    const curEl = document.getElementById('hCur');
    const totalEl = document.getElementById('fuTotal');
    const labelEl = document.getElementById('hLabel');
    const prevBtn = document.getElementById('hPrev');
    const nextBtn = document.getElementById('hNext');
    if (!hWrapper || !hSticky || !panels.length) return;

    const RESERV = { about: 'The Dream', films: 'Selected Works', awards: 'What We Do', press: 'Press', contact: 'Contact' };
    const LABELS = () => window.STEP1FILM_NAV_LABELS || RESERV;
    const TOTAL = panels.length;
    const fmt = n => String(n + 1).padStart(2, '0');

    /* Numrera om efter hur många paneler som faktiskt är på. Allt
       nedan räknar på TOTAL, så en avstängd panel lämnar inget hål. */
    panels.forEach((panel, i) => {
      panel.dataset.panel = String(i);
      const num = panel.querySelector('.panel-num');
      if (num) num.textContent = fmt(i);
    });
    dots.slice(TOTAL).forEach(d => d.remove());
    dots = dots.slice(0, TOTAL);
    dots.forEach((d, i) => {
      d.dataset.i = String(i);
      d.setAttribute('data-i18n-aria', 'nav' + panels[i].id.charAt(0).toUpperCase() + panels[i].id.slice(1));
    });
    if (totalEl) totalEl.textContent = '/ ' + fmt(TOTAL - 1);
    /* En skärm för showreelen, en per panel — och en sista bit till
       footern. Remsan har ett eget svep efter att alla sidor är inne:
       den glider in från högerkanten som en avslutande spalt, i stället
       för att komma underifrån. Steget är kortare än en panels: remsan
       är smal och rör sig bara sin egen bredd, så en hel skärmhöjd
       rullning hade känts som att inget hände. */
    const FOT_STEG = 0.35;
    hWrapper.style.height = ((TOTAL + 1 + FOT_STEG) * 100) + 'vh';
    let lastPanelIdx = -1;
    let wideMode = isWideScreen();

    /* --- Kanterna ---
       Footern ligger i svepstacken som en lodrät remsa vid högerkanten,
       och bottenstapeln (pilar + fokusenhet) står kvar i nederkanten.
       Kontaktpanelen lämnar plats för båda. Måtten går inte att skriva
       i CSS — de beror på typsnitt, språk och fönsterstorlek — så vi
       mäter dem och lägger ut dem som variabler på #h-sticky, där
       stapeln och panelen ärver dem. */
    const footEl = document.getElementById('footer');
    const dockEl = document.querySelector('.h-dock');
    let footW = -1, dockH = -1;
    function matBotten() {
      if (!wideMode) return;
      if (footEl) {
        const w = footEl.offsetWidth;
        if (w !== footW) { footW = w; hSticky.style.setProperty('--foot-w', w + 'px'); }
      }
      if (dockEl) {
        const h = dockEl.offsetHeight;
        if (h !== dockH) { dockH = h; hSticky.style.setProperty('--dock-h', h + 'px'); }
      }
    }

    /* --- Fokusenheten ---
       Rullningen 0–1 läses av som ett fokusavstånd: närgränsen 0,6 m
       vid showreelen, oändligt längst ned. Kurvan är hyperbolisk som
       på en riktig objektivskala — tätt i början, glest mot slutet. */
    const idxEl  = document.getElementById('fuIndex');
    const distEl = document.getElementById('fuDist');
    const NARA = 0.6;      // meter — objektivets närgräns
    const FJARRAN = 24;    // bortom detta står det ∞

    const enhetEl = document.querySelector('.fu-unit');
    function visaFokus(p) {
      p = Math.max(0, Math.min(1, p));
      /* Skalan ligger ned i bottenstapeln och står upp vid kanten på
         telefon — indexstrecket glider åt det håll skalan pekar. */
      if (idxEl) idxEl.style[wideMode ? 'left' : 'top'] = (p * 100).toFixed(2) + '%';
      if (!distEl) return;
      // 1/avstånd rör sig linjärt — det är så en fokusskala är graderad
      const d = 1 / ((1 / NARA) * (1 - p) + (1 / (FJARRAN * 3)) * p);
      const oandligt = d >= FJARRAN;
      distEl.textContent = oandligt ? '\u221E' : d >= 10 ? d.toFixed(0) : d.toFixed(1);
      // "∞ m" betyder ingenting — meterbeteckningen tas bort där
      if (enhetEl) enhetEl.style.visibility = oandligt ? 'hidden' : '';
    }

    // Byt språk → skriv om den synliga sektionsetiketten direkt
    document.addEventListener('s1f:langchange', () => {
      if (labelEl && lastPanelIdx >= 0) labelEl.textContent = LABELS()[panels[lastPanelIdx].id] || '';
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
      if (labelEl) labelEl.textContent = LABELS()[panels[panelIdx].id] || '';
    }

    /* Hur stor del av showreelen som täcks av panel 01 (0–1).
       Läses av hero-videon, som pausar när den är nästan helt dold. */
    let heroCover = -1;
    function reportCover(v) {
      v = Math.max(0, Math.min(1, v));
      if (Math.abs(v - heroCover) < 0.005) return;
      heroCover = v;
      document.dispatchEvent(new CustomEvent('s1f:herocover', { detail: v }));
    }

    /* Mjukstart och mjukstopp. Kurvan börjar och slutar med noll
       hastighet, så svepet känns som en rörelse mellan två nyckelbilder
       i stället för en linjär dragning.

       Smootherstep ensamt gled i gång för tidigt. Här blandas den till
       hälften med sig själv körd två gånger. Utsidorna blir flackare och
       mitten brantare: hastigheten i mitten går från 1,88× till 2,7× den
       linjära, och i kanterna ned till 0,12×. Samma sträcka på samma
       rullning, men fördelad som en riktig in- och utfasning.

       Två gånger rakt av gav 3,5× i mitten och 0,01× i kanterna — då
       stod bilden stilla en kvarts skärm och kändes trasig i stället
       för mjuk. Blandningen är avvägd mot det. */
    function mjuk(p) {
      p = Math.max(0, Math.min(1, p));
      const s = p * p * p * (p * (p * 6 - 15) + 10);
      const ss = s * s * s * (s * (s * 6 - 15) + 10);
      return 0.5 * s + 0.5 * ss;
    }

    /* --- Desktop: clip-path wipe driven by scrollY ---
       Skärm 0 är showreelen; panel i sveper in under skärm i+1. */
    function onScrollDesktop() {
      const vh = window.innerHeight;

      const scrolledIn = -hWrapper.getBoundingClientRect().top;
      panels.forEach((panel, i) => {
        const progress = mjuk((scrolledIn - i * vh) / vh);
        panel.style.clipPath = `inset(0 0 0 ${(1 - progress) * 100}%)`;
        if (i === 0) reportCover(progress);
      });

      /* Footern kommer sist och för sig själv: alla sidor är inne, och
         först därefter glider remsan in från högerkanten med samma
         kurva som svepen. Den är vriden ett kvarts varv och står som
         en avslutande spalt vid kanten — rörelsen håller sig åt samma
         håll som resten av sviten. */
      const fotP = mjuk((scrolledIn - TOTAL * vh) / (FOT_STEG * vh));
      if (footEl) footEl.style.transform = `translateX(${((1 - fotP) * 100).toFixed(2)}%)`;

      /* Fokusräknaren följer samma kurva som svepet — annars hade
         siffran glidit jämnt medan bilden rörde sig ojämnt. */
      const steg = Math.max(0, Math.min(TOTAL, Math.floor(scrolledIn / vh)));
      const inomSteg = mjuk(scrolledIn / vh - steg);
      visaFokus((steg + inomSteg) / TOTAL);

      const panelIdx = Math.min(TOTAL - 1, Math.max(0, Math.floor(scrolledIn / vh) - 1));
      setActive(panelIdx);

      if (prevBtn) prevBtn.disabled = scrolledIn <= 0;
      if (nextBtn) nextBtn.disabled = scrolledIn >= (TOTAL + FOT_STEG) * vh - 1;

    }

    /* --- Mobile: sync nav dots via IntersectionObserver --- */
    function setupMobileNav() {
      // Reset any inline clip-paths applied in desktop mode
      panels.forEach(p => { p.style.clipPath = ''; });
      if (footEl) { footEl.style.clipPath = ''; footEl.style.transform = ''; }

      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const idx = parseInt(entry.target.dataset.panel, 10);
          if (!Number.isNaN(idx)) setActive(idx);
        });
      }, { threshold: [0.4, 0.6] });
      panels.forEach(p => io.observe(p));

      // Här skjuts showreelen undan vertikalt — täckningen är hur stor
      // del av rutan den lämnat ifrån sig.
      const hero = document.getElementById('hero');
      if (hero) {
        const onScroll = () => {
          const r = hero.getBoundingClientRect();
          const vh = window.innerHeight;
          const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
          reportCover(1 - visible / vh);
          const kvar = document.documentElement.scrollHeight - vh;
          visaFokus(kvar > 0 ? window.scrollY / kvar : 0);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
      }
    }

    /* Biografin sitter i en ruta som inte rullar — panel 01 är exakt en
       skärm hög och hjulet ska byta panel, inte rulla inuti texten. Då
       måste texten rymmas, och det går inte att garantera i CSS ensamt:
       graden hänger på webbläsarens grundgrad, som användaren själv får
       ställa, och radbrytningarna på språket.

       Så vi mäter i stället. Ryms inte texten krymper vi --bio-skala i
       små steg tills den gör det. Vid grundgrad 16 ryms den redan och
       faktorn står kvar på 1 — den här koden gör då ingenting.

       Faktorn sätts på .about-cols, inte på <html>: en ärvd variabel på
       rotelementet tvingar omräkning av hela dokumentet. Här gäller det
       ett par dussin noder, och bara när fönstret ändrar storlek. */
    const bioRuta = document.querySelector('.about-scroll');
    const bioCols = document.querySelector('.about-cols');
    let bioPagar = false;
    function passaBiografin() {
      if (!bioRuta || !bioCols || bioPagar) return;
      bioPagar = true;
      bioCols.style.removeProperty('--bio-skala');
      /* Golv på 0,72. Vid webbläsarens grundgrad 22 px landar det på
         drygt 12 px — samma grad som panelen ändå visar på ett litet
         fönster, alltså inget nytt läsbarhetsproblem. Under det golvet
         väger vi över: då är beskuren text det mindre onda.
         Att läsa scrollHeight tvingar fram ny layout, så varje varv
         mäter resultatet av föregående steg. */
      let skala = 1;
      while (skala > 0.72 && bioRuta.scrollHeight > bioRuta.clientHeight + 1) {
        skala -= 0.02;
        bioCols.style.setProperty('--bio-skala', skala.toFixed(2));
      }
      bioPagar = false;
    }
    matBotten();
    passaBiografin();
    /* Igen när typsnitten laddat: mätningen ovan sker på reservsnittet,
       och radbrytningarna flyttar sig när det riktiga kommer in. */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { matBotten(); passaBiografin(); }).catch(() => {});
    }
    let bioTimer = 0;
    /* Bottenhöjderna mäts före texten: de styr panelens nedre marginal,
       och biografin passas in mot den ytan som blir kvar. */
    const bioSnart = () => {
      clearTimeout(bioTimer);
      bioTimer = setTimeout(() => { matBotten(); passaBiografin(); }, 120);
    };
    window.addEventListener('resize', bioSnart);
    /* Språkbytet byter ut hela texten, och andra lyssnare ritar om delar
       av panelen efter oss. Ett varv till på nästa bildruta fångar det
       som hunnit flytta sig. */
    document.addEventListener('s1f:langchange', () => {
      passaBiografin();
      requestAnimationFrame(passaBiografin);
      bioSnart();
    });
    /* Sista skyddsnätet: ändrar rutan storlek av något annat skäl —
       en sen bild, en omritad spalt — mäter vi om. Vi bevakar
       .about-content, vars höjd sätts av panelen och alltså inte av
       vår egen krympning, så observatören kan inte trigga sig själv. */
    const bioBox = document.querySelector('.about-content');
    if (bioBox && window.ResizeObserver) {
      new ResizeObserver(bioSnart).observe(bioBox);
    }
    /* Footern och stapeln byter höjd vid språkbyte och radbrytning.
       De mäts om när det händer — variablerna de skriver styr bara
       placering och marginal, så de kan inte trigga sig själva. */
    if (window.ResizeObserver) {
      const bottenOgat = new ResizeObserver(() => matBotten());
      if (footEl) bottenOgat.observe(footEl);
      if (dockEl) bottenOgat.observe(dockEl);
    }

    /* Egen rullning för pilarna i stället för behavior: 'smooth'.
       Webbläsarens egen är avpassad för långa dokument och tar drygt en
       sekund över en skärmhöjd — svepet drivs av rullningen, så det blev
       trögt att bläddra. Här är längden fast och kurvan bromsar bara i
       slutet, så bilden kommer igång direkt.

       Rör användaren hjulet mitt i rörelsen avbryts den: den egna
       rullningen ska aldrig slåss mot handen. */
    let rullAnim = null;
    function rullaTill(top) {
      if (rullAnim) { cancelAnimationFrame(rullAnim); rullAnim = null; }
      if (prefersReducedMotion) { window.scrollTo(0, top); return; }
      const start = window.scrollY;
      const avstand = top - start;
      if (!avstand) return;
      /* 950 ms i stället för 560. Bläddrar man med pilarna eller
         tangentbordet är svepet det man tittar på — då ska det hinna
         läsas som en rörelse mellan två bilder, inte som ett hopp.
         Hjulet rullar fortfarande i sin egen takt; det här gäller bara
         den egna rullningen. */
      const langd = 950;                          // ms, oavsett avstånd
      const t0 = performance.now();
      const kurva = (t) => 1 - Math.pow(1 - t, 3);
      const steg = (nu) => {
        const p = Math.min(1, (nu - t0) / langd);
        window.scrollTo(0, start + avstand * kurva(p));
        rullAnim = p < 1 ? requestAnimationFrame(steg) : null;
      };
      rullAnim = requestAnimationFrame(steg);
    }
    const avbryt = () => { if (rullAnim) { cancelAnimationFrame(rullAnim); rullAnim = null; } };
    window.addEventListener('wheel', avbryt, { passive: true });
    window.addEventListener('touchstart', avbryt, { passive: true });

    /* idx -1 = showreelen, 0…TOTAL-1 = panelerna, TOTAL = footersteget.
       Footersteget finns bara i svepläget; på telefon ligger remsan
       sist i flödet och nås genom att rulla. */
    function goToPanel(idx) {
      idx = Math.max(-1, Math.min(wideMode ? TOTAL : TOTAL - 1, idx));
      if (wideMode) {
        const steg = idx === TOTAL ? TOTAL + FOT_STEG : idx + 1;
        rullaTill(hWrapper.offsetTop + steg * window.innerHeight);
      } else if (idx < 0) {
        const hero = document.getElementById('hero');
        if (hero) hero.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
      } else {
        const target = panels[idx];
        if (target) target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
      }
    }
    /* Hero-pilen, skip-länken och logotypen pekar på #films / #hero,
       som numera ligger absolut placerade i samma stack — webbläsarens
       eget ankarhopp landar då på fel ställe. Vi sköter hoppet själva,
       och flyttar tangentbordsfokus dit så skip-länken fortsatt fungerar. */
    function jumpTo(idx, focusEl) {
      goToPanel(idx);
      if (!focusEl) return;
      const had = focusEl.hasAttribute('tabindex');
      if (!had) focusEl.setAttribute('tabindex', '-1');
      focusEl.focus({ preventScroll: true });
      if (!had) focusEl.addEventListener('blur', () => focusEl.removeAttribute('tabindex'), { once: true });
    }
    document.querySelectorAll('a[href="#about"]').forEach((a) => {
      a.addEventListener('click', (e) => { e.preventDefault(); jumpTo(0, document.getElementById('about')); });
    });
    document.querySelectorAll('a[href="#films"]').forEach((a) => {
      a.addEventListener('click', (e) => { e.preventDefault(); jumpTo(1, document.getElementById('films')); });
    });
    document.querySelectorAll('a[href="#hero"]').forEach((a) => {
      a.addEventListener('click', (e) => { e.preventDefault(); jumpTo(-1, document.getElementById('hero')); });
    });

    function currentIdx() {
      if (wideMode) {
        const steg = -hWrapper.getBoundingClientRect().top / window.innerHeight;
        // Förbi sista panelen står vi i footersteget
        if (steg >= TOTAL + 0.02) return TOTAL;
        return Math.min(TOTAL - 1, Math.max(-1, Math.floor(steg) - 1));
      }
      // Mobile: showreelen först, annars den panel som ligger närmast mitten
      const hero = document.getElementById('hero');
      if (hero) {
        const hr = hero.getBoundingClientRect();
        if (hr.bottom > window.innerHeight * 0.5) return -1;
      }
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

    /* Ljuset som följer markören.
       -----------------------------------------------------
       Låg förut som CSS-variabler på <html>: --spot-x/y skrevs varje
       musrörelse, och en ÄRVD custom property på rotelementet tvingar
       webbläsaren att räkna om stilen för HELA dokumentet. Mätt med
       Chromes egna räknare över 80 musrörelser: 549 ms stilomräkning.
       Utan den skrivningen: 37 ms. Det var det som kändes tungt — inte
       ritandet, som kostade lika mycket med som utan skenet.

       Nu är ljuset en egen liten ruta per panel som flyttas med
       transform. Transformer går på kompositorn: ingen stilomräkning,
       ingen layout. Rutan ligger över panelens mörkerlager men under
       texten och lyser upp med mix-blend-mode: screen — det ersätter
       både det gamla hålet i mörkret och det varma skenet. */
    const spotar = [];
    document.querySelectorAll('.h-panel').forEach(panel => {
      const d = document.createElement('div');
      d.className = 'panel-spot';
      d.setAttribute('aria-hidden', 'true');
      panel.appendChild(d);
      spotar.push(d);
    });

    const sticky = document.getElementById('h-sticky');

    let x = 0, y = 0, vantar = false;
    function mala() {
      vantar = false;
      /* Koordinaterna raknas fran #h-sticky, inte fonstret. Rutorna
         ligger inuti det lagret, och lagret sitter i fonstrets horn bara
         sa lange det ar fastklistrat. */
      const r = sticky ? sticky.getBoundingClientRect() : { left: 0, top: 0 };
      const tr = 'translate3d(' + (x - r.left) + 'px,' + (y - r.top) + 'px,0)';
      for (const d of spotar) d.style.transform = tr;
      el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    }

    function begar() {
      if (!vantar) { vantar = true; requestAnimationFrame(mala); }
    }

    /* Lampan ska lysa svagare medan man rör markören och stå full styrka
       när den vilar — som en lampa man svänger med handen.

       Dämpningen sätts som opacity direkt på de fem skenrutorna. Det är
       en kompositoregenskap: den kostar ingen stilomräkning av
       dokumentet, till skillnad från den gamla klassväxlingen på <html>
       som var halva orsaken till att markören kändes trög. Skrivningen
       sker dessutom bara vid övergången rör sig ⇄ still, inte varje
       bildruta — CSS-övergången sköter tonandet däremellan. */
    const DAMPAD = '0.5';
    let rorSig = false, stillTimer = 0;
    function sattSken(v) { for (const d of spotar) d.style.opacity = v; }
    function rorelse() {
      if (!rorSig) { rorSig = true; sattSken(DAMPAD); }
      clearTimeout(stillTimer);
      stillTimer = setTimeout(() => { rorSig = false; sattSken('1'); }, 140);
    }

    window.addEventListener('scroll', begar, { passive: true });

    window.addEventListener('mousemove', (e) => {
      x = e.clientX; y = e.clientY;
      begar();
      rorelse();
      if (!el.classList.contains('visible')) el.classList.add('visible');
      // Röd ton när man pekar på något klickbart
      const påLänk = !!(e.target && e.target.closest &&
        e.target.closest('a,button,[role="button"],.h-dot,.h-arrow,.film-item'));
      el.classList.toggle('on-link', påLänk);
    }, { passive: true });

    /* Cirkeln ligger kvar även när pekaren lämnar fönstret — bara
       filmmärket tonas bort. Hålet ska alltid finnas. */
    document.addEventListener('mouseleave', () => el.classList.remove('visible'));
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

      const provider = cfg.provider === 'vimeo' ? 'vimeo' : 'youtube';
      // Vimeo: olistade filmer kräver sekretessnyckeln (h=) för att spelas
      const hash = String(cfg.hash || '').trim();
      const src = provider === 'vimeo'
        ? `https://player.vimeo.com/video/${encodeURIComponent(id)}?background=1&autoplay=1&muted=1&loop=1&autopause=0&playsinline=1`
          + (hash ? `&h=${encodeURIComponent(hash)}` : '')
        : `https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&mute=1&loop=1&playlist=${encodeURIComponent(id)}&controls=0&rel=0&modestbranding=1&playsinline=1`;

      /* Trailern rullar tyst och loopat, som showreelen. Laddas först när
         rutan syns — annars drar den data på mobil utan att någon ser den. */
      let loaded = false;
      const load = () => {
        if (loaded) return;
        loaded = true;
        const frame = document.createElement('iframe');
        frame.src = src;
        frame.title = cfg.title || 'Trailer';
        frame.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share');
        frame.setAttribute('allowfullscreen', '');
        frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        frame.setAttribute('loading', 'lazy');
        box.appendChild(frame);
        box.classList.add('is-playing');
      };

      if (prefersReducedMotion) { box.classList.add('no-video'); return; }
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((e) => { if (e.isIntersecting) { load(); io.disconnect(); } });
        }, { threshold: 0.3 });
        io.observe(box);
      } else {
        load();
      }
    });

    const sprak = () => (window.STEP1FILM_I18N && window.STEP1FILM_I18N.lang) || 'sv';
    const tv = (v) => (v && typeof v === 'object') ? (v[sprak()] || v.sv || '') : (v || '');

    const filmer = (window.STEP1FILM_FILMOGRAPHY || []).filter(f => f && f.title);

    /* --- 04: filmer, festivaler, stöd och urval ---
       De tre korta listorna har samma form: år, namn, en underrad och
       ibland en not. Därför en enda ritare i stället för tre kopior. */
    function ritaLista(valjare, poster) {
      document.querySelectorAll(valjare).forEach(box => {
        box.textContent = '';
        (poster || []).forEach(p => {
          const rad = document.createElement('div');
          rad.className = 'cvb-row';
          rad.innerHTML = '<span class="cvb-year"></span><div class="cvb-body">'
            + '<span class="cvb-role"></span><span class="cvb-where"></span>'
            + '<span class="cvb-note"></span></div>';
          const ar = tv(p.year);
          if (ar) rad.querySelector('.cvb-year').textContent = ar;
          else rad.querySelector('.cvb-year').remove();
          /* Namnet blir en länk om posten har en adress. Bara http(s):
             en javascript:-adress hade blivit ett skript i besökarens
             webbläsare, så andra protokoll ritas som vanlig text. */
          const roll = rad.querySelector('.cvb-role');
          const adress = tv(p.url);
          if (adress && /^https?:\/\//i.test(adress)) {
            const a = document.createElement('a');
            a.className = 'cvb-link';
            a.href = adress;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = tv(p.what);
            roll.appendChild(a);
          } else {
            roll.textContent = tv(p.what);
          }
          const var_ = tv(p.where);
          if (var_) rad.querySelector('.cvb-where').textContent = var_;
          else rad.querySelector('.cvb-where').remove();
          const not = tv(p.note);
          if (not) rad.querySelector('.cvb-note').textContent = not;
          else rad.querySelector('.cvb-note').remove();
          box.appendChild(rad);
        });
      });
    }

    function ritaCV() {
      ritaLista('[data-selected]', window.STEP1FILM_SELECTED);
      ritaLista('[data-media]', window.STEP1FILM_MEDIA);
      ritaLista('[data-education]', window.STEP1FILM_EDUCATION);

      document.querySelectorAll('[data-filmography-full]').forEach(box => {
        box.textContent = '';
        filmer.forEach(f => {
          const rad = document.createElement('div');
          rad.className = 'cvb-row';
          rad.innerHTML = '<span class="cvb-year"></span><div class="cvb-body">'
            + '<span class="cvb-role"></span><span class="cvb-where"></span>'
            + '<span class="cvb-note"></span></div>';
          rad.querySelector('.cvb-year').textContent = f.year || '';

          const titel = rad.querySelector('.cvb-role');
          titel.textContent = f.title;
          if (f.subtitle) {
            const alt = document.createElement('em');
            alt.textContent = ' “' + f.subtitle + '”';
            titel.appendChild(alt);
          }

          const meta = [tv(f.format), f.runtime, tv(f.status)].filter(Boolean);
          rad.querySelector('.cvb-where').textContent = meta.join(' · ');

          const not = rad.querySelector('.cvb-note');
          const nt = tv(f.note);
          if (nt) not.textContent = nt; else not.remove();
          box.appendChild(rad);
        });
      });
    }
    ritaCV();
    document.addEventListener('s1f:langchange', ritaCV);

    /* --- 002: samarbetslogotyper på en praxinoskoptrumma ---
       Loggorna sitter runt en cylinder som snurrar. Radien är den som
       gör att de N sidorna precis går ihop till en sluten trumma:
         radie = (sidbredd / 2) / tan(180° / N)
       Bredden hålls nere när det är många loggor, annars blir trumman
       så stor att man bara ser en bråkdel av varje. */
    const clients = window.STEP1FILM_CLIENTS || [];
    document.querySelectorAll('[data-logos]').forEach(box => {
      const list = clients.filter(c => c && c.src);
      if (!list.length) { box.classList.add('is-empty'); return; }

      const n = list.length;
      const drum = document.createElement('div');
      drum.className = 'fl-drum';

      if (n === 1) {
        // En enda logga — ingen trumma att snurra
        drum.style.setProperty('--steg', '0deg');
        drum.style.setProperty('--radie', '0px');
        drum.style.animation = 'none';
      } else {
        const bredd = n > 6 ? 0.52 : 0.62;              // andel av rutans bredd
        const radie = (bredd / 2) / Math.tan(Math.PI / n);
        drum.style.setProperty('--bredd', (bredd * 100).toFixed(1) + '%');
        drum.style.setProperty('--steg', (360 / n).toFixed(3) + 'deg');
        drum.style.setProperty('--radie', (radie * 100).toFixed(1) + 'cqw');
        // Ungefär 2,6 s per logga — hinner läsas utan att kännas trögt
        drum.style.setProperty('--varv', (n * 2.6).toFixed(1) + 's');
      }

      // Samma sak här: tappar trumman alla loggor ska texten tillbaka.
      let kvarLoggor = n;

      list.forEach((c, i) => {
        const img = document.createElement('img');
        img.src = c.src;
        img.alt = c.name || '';
        // Inte lazy: en logga som dyker upp mitt i snurren ser trasig ut.
        // Hela uppsättningen väger under 100 kB.
        img.loading = 'eager';
        img.style.setProperty('--i', i);
        // En logotyp som inte laddar ska försvinna, inte lämna en trasig ikon
        img.addEventListener('error', () => {
          img.remove();
          if (--kvarLoggor === 0) { drum.remove(); box.classList.add('is-empty'); }
        });
        drum.appendChild(img);
      });
      box.appendChild(drum);
    });

    /* --- 003: affischerna tonar in och ut, var och en på sin plats ---
       Två affischer delar rutan på mitten, tre står vänster/mitten/höger. */
    const posters = window.STEP1FILM_POSTERS || {};
    const PLATSER = { 1: ['50%'], 2: ['30%', '70%'], 3: ['22%', '50%', '78%'] };
    document.querySelectorAll('[data-slides]').forEach(box => {
      const list = posters[box.dataset.slides] || [];
      if (!list.length) { box.classList.add('is-empty'); return; }

      // Fler än tre: fördela jämnt över rutan
      const platser = PLATSER[list.length] ||
        list.map((_, i) => (((i + 0.5) / list.length) * 100).toFixed(0) + '%');

      /* En ensam affisch ska stå still. Tonväxlingen är byggd för att
         lämna över mellan flera: varje bild syns 1,1 s av sin cykel och
         är borta resten. Med en enda bild finns ingen att lämna över
         till, så den bara blinkade. Samma undantag som trumman ovanför
         gör för en ensam logotyp. */
      if (list.length === 1) box.classList.add('en-bild');

      /* Faller varenda bild bort ska rutan säga "Bilder kommer" igen.
         is-empty sattes bara när listan var tom, så en lista som pekade
         på en fil som inte finns — ett stavfel, en bild som inte hunnit
         laddas upp — gav en tom grå ruta utan text i stället. */
      let kvar = list.length;

      list.forEach((src, i) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = '';
        img.loading = 'lazy';
        img.style.setProperty('--i', i);
        img.style.setProperty('--antal', list.length);
        img.style.setProperty('--x', platser[i]);
        // En affisch som inte laddar ska försvinna, inte lämna en trasig ikon
        img.addEventListener('error', () => {
          img.remove();
          if (--kvar === 0) box.classList.add('is-empty');
        });
        box.appendChild(img);
      });
    });
  }

  /* --------------------------------------------------
     PROJEKTFÖRFRÅGAN — panel 05
     Skickas till funktionen collab, som mejlar vidare till
     collaboration@step1film.se. Går det inte fram får besökaren
     adressen så hen kan skriva direkt i stället.
  -------------------------------------------------- */
  const COLLAB_MAIL = 'collaboration@step1film.se';

  function initCollabForm() {
    const form = document.getElementById('collabForm');
    const status = document.getElementById('cfStatus');
    if (!form || !status) return;

    const t = (nyckel, reserv) => (window.STEP1FILM_I18N && window.STEP1FILM_I18N.t(nyckel)) || reserv;
    const api = (window.STEP1FILM_API || 'https://step1film.netlify.app/.netlify/functions').replace(/\/$/, '');

    function säg(text, sort) {
      status.textContent = text;
      status.className = 'cf-status' + (sort ? ' cf-status--' + sort : '');
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form).entries());

      if (!String(d.name || '').trim() || !String(d.email || '').trim() || !String(d.pitch || '').trim()) {
        säg(t('cfMissing', 'Fyll i namn, e-post och din idé.'), 'fel');
        return;
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(d.email).trim())) {
        säg(t('cfBadEmail', 'Kontrollera e-postadressen.'), 'fel');
        return;
      }

      const knapp = form.querySelector('.cf-send');
      knapp.disabled = true;
      säg(t('cfSending', 'Skickar …'));

      try {
        const r = await fetch(api + '/collab', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(d)
        });
        if (!r.ok) throw new Error(String(r.status));
        form.reset();
        säg(t('cfOk', 'Tack! Mejlet är skickat — du hör från oss.'), 'ok');
      } catch {
        // Servern kan vara avstängd — ge adressen så det inte blir en återvändsgränd
        säg(t('cfFail', 'Det gick inte att skicka just nu. Mejla oss direkt:'), 'fel');
        const a = document.createElement('a');
        a.href = 'mailto:' + COLLAB_MAIL;
        a.textContent = COLLAB_MAIL;
        status.append(' ', a);
      } finally {
        knapp.disabled = false;
      }
    });
  }

  /* --------------------------------------------------
     VRID ENHETEN
     Visas bara när en vridning faktiskt lönar sig, alltså när
     liggande läge skulle klara svepsystemets krav (901 px brett,
     560 px högt). Uppmätt:
       iPad Air     820×1180 → liggande 1180×820  ✔ visas
       iPad mini    768×1024 → liggande 1024×768  ✔ visas
       iPhone 14    390×844  → liggande  844×390  ✘ för smalt
       iPhone Max   430×932  → liggande  932×430  ✘ för lågt
     Att tjata om en vridning som ger en sämre sida vore bara i vägen.
  -------------------------------------------------- */
  function initRotateHint() {
    const box = document.getElementById('rotate-hint');
    const close = document.getElementById('rhClose');
    if (!box || !isTouch) return;

    const NYCKEL = 's1f_rotate_seen';
    let sedd = false;
    try { sedd = localStorage.getItem(NYCKEL) === '1'; } catch {}
    if (sedd) return;

    // Vinner vi något på att vrida? Bredd och höjd byter plats.
    const lonarSig = () =>
      window.innerHeight > window.innerWidth &&      // står stående nu
      window.innerHeight >= 901 &&                   // blir bredden
      window.innerWidth >= 560;                      // blir höjden

    function gom() {
      box.classList.remove('in');
      setTimeout(() => { box.hidden = true; }, 450);
      try { localStorage.setItem(NYCKEL, '1'); } catch {}
    }

    if (!lonarSig()) return;
    box.hidden = false;
    requestAnimationFrame(() => box.classList.add('in'));

    close.addEventListener('click', gom);
    // Vred hen på enheten är saken avklarad
    window.addEventListener('resize', () => { if (!lonarSig()) gom(); }, { passive: true });
    // Står den kvar stående ändå ska den inte blockera sidan för evigt
    setTimeout(() => { if (!box.hidden) gom(); }, 9000);
  }

  /* --------------------------------------------------
     TRAILERRUTAN — "Watch" på panel 02
     Öppnar filmen i en liten skärm mitt på sidan. iframe:en byggs
     vid klick och rivs vid stängning, så ljudet inte fortsätter
     spela bakom en stängd ruta. Samma källa som rutan i listan,
     men med Vimeos kontroller och ljudet på.
  -------------------------------------------------- */
  function initTrailerBox() {
    const box = document.getElementById('trailer-box');
    if (!box) return;
    const scen  = box.querySelector('[data-tb-stage]');
    const titel = box.querySelector('.tb-title');
    let sistaKnapp = null;

    function stang() {
      if (box.hidden) return;
      box.hidden = true;
      scen.textContent = '';                 // river iframe:en → filmen slutar
      box.classList.remove('visar-bild');
      document.body.classList.remove('tb-open');
      if (sistaKnapp) { sistaKnapp.focus(); sistaKnapp = null; }
    }

    function oppna(nyckel, knapp) {
      const cfg = (window.STEP1FILM_EMBEDS || {})[nyckel];
      const id = cfg && String(cfg.id || '').trim();
      if (!id) return;                       // inget id → knappen gör inget
      sistaKnapp = knapp || null;
      titel.textContent = cfg.title || '';
      const src = 'https://player.vimeo.com/video/' + encodeURIComponent(id)
        + '?autoplay=1&playsinline=1&autopause=0'
        + (cfg.hash ? '&h=' + encodeURIComponent(cfg.hash) : '');
      const frame = document.createElement('iframe');
      frame.src = cfg.provider === 'vimeo' || !cfg.provider ? src
        : 'https://www.youtube.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
      frame.title = cfg.title || 'Trailer';
      frame.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; encrypted-media');
      frame.setAttribute('allowfullscreen', '');
      frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      scen.textContent = '';
      scen.appendChild(frame);
      box.hidden = false;
      document.body.classList.add('tb-open');
      box.querySelector('.tb-close').focus();
    }

    document.querySelectorAll('[data-watch]').forEach(knapp => {
      knapp.addEventListener('click', (e) => {
        e.preventDefault();
        oppna(knapp.dataset.watch, knapp);
      });
    });

    /* --- Affischerna i stort format ---
       Rutorna på panel 02 visar affischerna i miniatyr, runt 50 px
       breda. Ett klick lägger den i samma ruta som trailern, bara med
       en bild i stället för en film. Rutan får en klass så att den
       kan formas efter bilden: en stående affisch behöver inte
       trailerns 16:9. */
    function oppnaBild(kalla, alt, ruta) {
      sistaKnapp = ruta || null;
      titel.textContent = alt || '';
      const img = document.createElement('img');
      img.src = kalla;
      img.alt = alt || '';
      scen.textContent = '';
      scen.appendChild(img);
      box.classList.add('visar-bild');
      box.hidden = false;
      document.body.classList.add('tb-open');
      box.querySelector('.tb-close').focus();
    }

    document.querySelectorAll('.film-slides').forEach(ruta => {
      /* Vilken affisch som syns just nu: de tonar in och ut, så den
         med högst genomskinlighet är den man faktiskt tittar på. */
      const synlig = () => {
        const bilder = [...ruta.querySelectorAll('img')];
        if (!bilder.length) return null;
        return bilder.reduce((a, b) =>
          parseFloat(getComputedStyle(b).opacity) >= parseFloat(getComputedStyle(a).opacity) ? b : a);
      };
      const oppnaSynlig = (e) => {
        const bild = synlig();
        if (!bild) return;                    // tom ruta — låt klicket vara
        e.preventDefault();
        oppnaBild(bild.currentSrc || bild.src, bild.alt || titelForRuta(ruta), ruta);
      };
      ruta.addEventListener('click', oppnaSynlig);
      ruta.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') oppnaSynlig(e);
      });
      ruta.tabIndex = 0;
      ruta.setAttribute('role', 'button');
    });

    /* Rubriken på filmen rutan hör till — blir bildens namn i stort format. */
    function titelForRuta(ruta) {
      const rad = ruta.closest('.film-item');
      const h = rad && rad.querySelector('.film-title');
      return h ? h.textContent.trim() : '';
    }
    box.querySelectorAll('[data-tb-close]').forEach(el => el.addEventListener('click', stang));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') stang(); });
  }

  /* --------------------------------------------------
     KLIPPSPELAREN — panel 01
     Fyra Vimeo-klipp som man bläddrar mellan. Varje klipp spelar
     SEKUNDER sekunder och lämnar sedan över till nästa av sig själv.
     Klippen listas i STEP1FILM_REEL i site-config.js.

     Ingen Vimeo-JS inblandad: säkerhetsheadern släpper bara in skript
     från den egna sajten, så bytet sköts av en vanlig timer och en ny
     iframe. Det räcker — vi behöver bara starta om, inte styra spelaren.
  -------------------------------------------------- */
  function initReel() {
    const SEKUNDER = 30;                 // så mycket av varje klipp som visas

    document.querySelectorAll('[data-reel]').forEach(box => {
      const klipp = (window.STEP1FILM_REEL || []).filter(k => k && k.id);
      const scen    = box.querySelector('[data-reel-frame]');
      const titelEl = box.querySelector('[data-reel-title]');
      const prickar = box.querySelector('[data-reel-dots]');
      if (!scen) return;

      if (!klipp.length) { box.classList.add('is-empty'); return; }
      box.classList.add('has-clips');

      // En prick per klipp — både lägesvisare och genväg
      const dots = klipp.map((k, i) => {
        const d = document.createElement('button');
        d.type = 'button';
        d.className = 'reel-dot';
        d.setAttribute('role', 'tab');
        d.setAttribute('aria-label', k.title || String(i + 1));
        d.addEventListener('click', () => visa(i));
        if (prickar) prickar.appendChild(d);
        return d;
      });

      let nu = -1;
      let timer = null;
      let igang = false;

      function bygg(i) {
        const k = klipp[i];
        /* background=1 ger en ren bild utan Vimeos knappar — klippet är
           ett smakprov, inte en spelare man ska styra. loop=1 finns med
           för klipp som är kortare än SEKUNDER. */
        const src = 'https://player.vimeo.com/video/' + encodeURIComponent(k.id)
          + '?background=1&autoplay=1&muted=1&loop=1&autopause=0&playsinline=1'
          + (k.hash ? '&h=' + encodeURIComponent(k.hash) : '');
        const frame = document.createElement('iframe');
        frame.src = src;
        frame.title = k.title || 'Klipp';
        frame.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; encrypted-media');
        frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        frame.setAttribute('loading', 'lazy');
        scen.textContent = '';
        scen.appendChild(frame);
      }

      function visa(i, auto) {
        i = ((i % klipp.length) + klipp.length) % klipp.length;
        if (i === nu && auto !== true) return;
        nu = i;
        bygg(i);
        if (titelEl) titelEl.textContent = klipp[i].title || '';
        dots.forEach((d, j) => {
          d.classList.toggle('active', j === i);
          d.setAttribute('aria-selected', j === i ? 'true' : 'false');
        });
        clearTimeout(timer);
        // Den som bett om lugn rörelse får byta klipp själv
        if (!prefersReducedMotion) timer = setTimeout(() => visa(nu + 1, true), SEKUNDER * 1000);
      }

      box.querySelector('[data-reel-prev]')?.addEventListener('click', () => visa(nu - 1));
      box.querySelector('[data-reel-next]')?.addEventListener('click', () => visa(nu + 1));

      /* Starta först när rutan syns — annars drar fyra videor data på
         mobil innan någon rullat ned till panelen. */
      const start = () => { if (!igang) { igang = true; visa(0); } };
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((poster) => {
          poster.forEach(p => { if (p.isIntersecting) { start(); io.disconnect(); } });
        }, { threshold: 0.25 });
        io.observe(box);
      } else {
        start();
      }

      // Ligger fliken i bakgrunden ska timern inte springa i väg
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) clearTimeout(timer);
        else if (igang && !prefersReducedMotion) timer = setTimeout(() => visa(nu + 1, true), SEKUNDER * 1000);
      });
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
    initReel();
    initTrailerBox();
    initCollabForm();
    initLoader(() => {
      document.body.classList.remove('is-loading');
      initScrollDriver();
      initRotateHint();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
