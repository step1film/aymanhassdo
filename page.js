/* =====================================================
   STEP1FILM — undersidorna
   =====================================================
   Startsidans main.js bär hela svepsystemet, markören och
   formuläret. Undersidorna behöver inget av det: de är vanliga
   dokument. Kvar blir två saker — trailerrutan och bildgalleriet —
   och båda läser samma listor i site-config.js som startsidan.

   Bilderna låg förut i en lista i site-config.js och ritades ut som
   ett galleri härifrån. De ligger nu direkt i sidan i stället: elva
   bilder som var och en har sin egen plats och storlek i layouten,
   och en sådan placering går inte att räkna fram ur en lista.

   Kvar blir trailern. Saknas video-id göms rutan — ingen platshållare
   som säger "trailer kommer". */
(() => {
  'use strict';

  /* --- Trailern ---------------------------------------------------
     Rutan står stilla tills man klickar. Först då laddas iframen,
     och då med autoplay — annars hade ett Vimeo-anrop gått i väg på
     varje sidvisning, även för den som aldrig tryckte play. */
  function initTrailer() {
    const box = document.querySelector('[data-trailer]');
    if (!box) return;

    const nyckel = box.getAttribute('data-trailer');
    const alla = window.STEP1FILM_EMBEDS || {};
    const v = alla[nyckel];
    if (!v || !v.id) { box.hidden = true; return; }

    const knapp = box.querySelector('.trailer-play');
    if (!knapp) return;

    knapp.addEventListener('click', () => {
      const ram = document.createElement('iframe');
      ram.title = v.title || 'Trailer';
      ram.allow = 'autoplay; fullscreen; picture-in-picture';
      ram.setAttribute('allowfullscreen', '');
      ram.loading = 'lazy';
      ram.referrerPolicy = 'strict-origin-when-cross-origin';

      if (v.provider === 'youtube') {
        ram.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(v.id) +
                  '?autoplay=1&rel=0&modestbranding=1';
      } else {
        /* Vimeos privatlänkar bär en hash. Utan den svarar spelaren
           med "Private video" — den måste med i adressen. */
        ram.src = 'https://player.vimeo.com/video/' + encodeURIComponent(v.id) +
                  (v.hash ? '?h=' + encodeURIComponent(v.hash) + '&' : '?') +
                  'autoplay=1&title=0&byline=0&portrait=0&dnt=1';
      }
      knapp.remove();
      box.appendChild(ram);
    }, { once: true });
  }

  /* --- Bilderna ---------------------------------------------------
     Listan ligger i STEP1FILM_POSTERS under sidans egen nyckel. En
     bild som inte går att ladda tas bort ur rutnätet i stället för
     att lämna en trasig ikon — filerna laddas upp efter hand, och
     en adress kan peka fel under tiden. */
  function start() { initTrailer(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
