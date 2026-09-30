/* =====================================================
   STEP1FILM — ordmärket leker när man klickar på det
   =====================================================
   Rullen snurrar ett varv och bokstäverna studsar upp efter
   varandra. Leken låg förut i main.js, och main.js laddas bara av
   startsidan — på filmsidorna, /om/ och i butiken hände ingenting.
   Den bor därför i en egen fil som varje sida med ett ordmärke
   hämtar.

   Uppdelningen i bokstäver görs här i stället för i HTML:en. Förut
   stod nio <em> inskrivna på startsidan, och de skulle ha skrivits in
   en gång till på varje ny sida — en rad att glömma varje gång. Nu
   räcker det att märket finns; skriptet hittar det och delar ordet
   självt.

   Ordet behöver inte vara STEP1FILM. Butiken säger STEP1 STORE, och
   den fungerar likadant: mellanslaget lämnas som mellanslag och varje
   tecken omkring det får sitt eget element.
   ===================================================== */
(() => {
  'use strict';

  /* Den som bett om lugn rörelse i sitt system får ingen lek. CSS:en
     har samma spärr, men här slipper vi också dela upp ordet i onödan. */
  const lugnt = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Rullens 880 ms plus sista bokstavens fördröjning och studs. Tas
     tilltaget: klassen ska bort när allt stannat, inte mitt i. */
  const LANGST = 1400;

  /* Så länge ett sidbyte hålls kvar för att leken ska hinna synas.
     Kort med flit: rullen är drygt halvvägs och de första bokstäverna
     uppe, och det räcker för att klicket ska kännas besvarat. */
  const HALL = 520;

  /* Delar upp märkets text i ett element per tecken.

     Rullen är ett tomt <i> och lämnas ifred — den snurrar, den
     studsar inte. Ettan ligger redan i ett eget <span> som gör den
     röd; det elementet får bara klassen, så färgen är kvar. */
  function delaUpp(logga) {
    if (logga.querySelector('.lm-l')) return true;   // redan uppdelad

    let nagot = false;
    [...logga.childNodes].forEach((nod) => {
      if (nod.nodeType === Node.TEXT_NODE) {
        const bit = document.createDocumentFragment();
        [...nod.textContent].forEach((tecken) => {
          if (!tecken.trim()) { bit.appendChild(document.createTextNode(tecken)); return; }
          const e = document.createElement('em');
          e.className = 'lm-l';
          e.textContent = tecken;
          bit.appendChild(e);
          nagot = true;
        });
        nod.replaceWith(bit);
      } else if (nod.nodeType === Node.ELEMENT_NODE && !nod.classList.contains('logo-reel')) {
        nod.classList.add('lm-l');
        nagot = true;
      }
    });
    return nagot;
  }

  function vackTill(logga) {
    if (!delaUpp(logga)) return;

    /* Ordningstalet styr fördröjningen i CSS:en. Att räkna här i
       stället för i en regel per bokstav gör att märket kan vara hur
       långt som helst. */
    [...logga.querySelectorAll('.lm-l')].forEach((bokstav, i) => {
      bokstav.style.setProperty('--f', String(i));
    });

    let timer = 0;
    let pavag = false;

    const spela = () => {
      clearTimeout(timer);
      logga.classList.remove('rullar');
      /* Läser fram en layout så att webbläsaren uppfattar klassen som
         ny. Utan den startar inte animationen om vid ett andra klick. */
      void logga.offsetWidth;
      logga.classList.add('rullar');
      timer = setTimeout(() => logga.classList.remove('rullar'), LANGST);
    };

    logga.addEventListener('click', (e) => {
      spela();

      /* På startsidan pekar märket på #hero och sidan står kvar — hela
         leken syns. På undersidorna är det en länk hem, och där hann
         ingenting synas: webbläsaren bytte sida i samma ögonblick.
         Det var inte att skriptet saknades, det var att det aldrig
         fick en chans.

         Därför hålls bytet kvar en kort stund. Inte hela leken, det
         vore att göra en länk långsam för en animations skull — bara
         så länge att rullen kommit i gång och de första bokstäverna
         hunnit upp. */
      const adress = logga.getAttribute('href') || '';
      const byterSida = logga.tagName === 'A' && adress && adress[0] !== '#'
        && logga.target !== '_blank';
      /* Ctrl-, cmd- och mittenklick öppnar i ny flik. Den som gör så
         ska inte få sin flik fördröjd, och inte heller hindrad. */
      const egetSatt = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;

      if (!byterSida || egetSatt || pavag) return;
      e.preventDefault();
      pavag = true;
      setTimeout(() => { window.location.href = logga.href; }, HALL);
    });
  }

  function igang() {
    if (lugnt) return;
    /* Sidhuvudets märke på alla sidor: startsidan och undersidorna har
       det i #logo-mark, butiken i sin egen header. Sidfotens märke är
       inte en länk och rörs inte. */
    document.querySelectorAll('#logo-mark .logo-text, .shop-header .logo-text')
      .forEach(vackTill);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', igang);
  } else {
    igang();
  }
})();
