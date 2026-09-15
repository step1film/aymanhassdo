/* =====================================================
   STEP1FILM — undersidorna
   =====================================================
   Startsidans main.js bär hela svepsystemet, markören och
   formuläret. Undersidorna behöver inget av det: de är vanliga
   dokument. Kvar blir två saker — trailerrutan och bildgalleriet —
   och båda läser samma listor i site-config.js som startsidan.

   Tomt innehåll göms i stället för att visas som platshållare:
   saknas video-id försvinner trailerrutan, och är bildlistan tom
   försvinner hela galleriavsnittet. Ingen "trailer kommer". */
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
  /* Sökvägarna i site-config.js är skrivna som startsidan ser dem:
     "assets/films/..." utan inledande snedstreck. Härifrån, på
     /Birdsofpassage/, hade webbläsaren läst dem som
     /Birdsofpassage/assets/... och fått 404 på varenda bild. Vi
     lägger på rotens snedstreck. Hela adresser och sökvägar som
     redan börjar med / lämnas som de är. */
  function frånRoten(sokvag) {
    const v = String(sokvag).trim();
    if (/^([a-z]+:)?\/\//i.test(v) || v.startsWith('/')) return v;
    return '/' + v.replace(/^\.?\//, '');
  }

  function initBilder() {
    const block = document.querySelector('[data-bilder-block]');
    const rutnat = document.querySelector('[data-bilder]');
    if (!rutnat) return;

    const nyckel = rutnat.getAttribute('data-bilder');
    const lista = (window.STEP1FILM_POSTERS || {})[nyckel] || [];
    const rena = lista.filter(s => typeof s === 'string' && s.trim());
    if (!rena.length) { if (block) block.hidden = true; return; }
    /* Avsnittet står hidden i HTML:en. Det är med flit: finns inga
       bilder ska rubriken "Bilder" aldrig blinka förbi innan skriptet
       hunnit gömma den. Nu vet vi att det finns bilder — visa det. */
    if (block) block.hidden = false;

    let kvar = rena.length;
    const alt = rutnat.getAttribute('data-bilder-alt') || '';
    rena.forEach((src, i) => {
      const bild = new Image();
      bild.src = frånRoten(src);
      /* Numrerad alt-text, utan ett ord som måste översättas: sidan
         finns på två språk och bilderna byter inte innehåll med dem. */
      bild.alt = alt ? alt + ' ' + (i + 1) : '';
      bild.loading = 'lazy';
      bild.decoding = 'async';
      bild.addEventListener('error', () => {
        bild.remove();
        if (--kvar === 0 && block) block.hidden = true;
      });
      rutnat.appendChild(bild);
    });
  }

  function start() { initTrailer(); initBilder(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
