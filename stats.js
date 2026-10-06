/* =====================================================
   STEP1FILM — besöksstatistik
   =====================================================
   Skickar två sorters små meddelanden till vår egen
   Netlify-funktion, stats-collect:

     pv   en sida har öppnats (sökväg, källa, skärmbredd, språk)
     tid  hur länge sidan faktiskt låg framme

   Ingen cookie, ingenting i localStorage eller
   sessionStorage. Tiden räknas bara medan fliken syns —
   en flik som ligger bakom tio andra är inte läsning.

   sendBeacon skickar som text/plain, så webbläsaren
   behöver ingen CORS-förfrågan i förväg, och meddelandet
   går iväg även när sidan stängs.
   ===================================================== */
(function () {
  'use strict';

  var MAL = 'https://step1film.netlify.app/.netlify/functions/stats-collect';
  var host = location.hostname;
  if (!/(^|\.)step1film\.(se|github\.io|netlify\.app)$/.test(host)) return;   // inte lokalt, inte i förhandsvisningar
  if (/^\/admin/.test(location.pathname) || !navigator.sendBeacon) return;

  function skicka(d) {
    d.p = location.pathname;
    try { navigator.sendBeacon(MAL, JSON.stringify(d)); } catch (e) { /* statistik får aldrig störa sidan */ }
  }

  var utm = '';
  try { utm = new URLSearchParams(location.search).get('utm_source') || ''; } catch (e) { /* gammal webbläsare */ }

  skicka({ t: 'pv', r: document.referrer || '', w: window.innerWidth || 0, u: utm, l: navigator.language || '' });

  /* Synlig tid. Räknas upp medan sidan syns och skickas varje gång
     den göms — byte av flik, låst telefon eller stängd sida. */
  var sedan = document.visibilityState === 'visible' ? Date.now() : 0;
  var samlat = 0;

  function lamna() {
    if (sedan) { samlat += Date.now() - sedan; sedan = 0; }
    if (samlat >= 1000) { skicka({ t: 'tid', ms: samlat }); samlat = 0; }
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') lamna();
    else sedan = Date.now();
  });
  window.addEventListener('pagehide', lamna);
})();
