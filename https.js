// Skyddsnät: kommer besökaren in via http:// (t.ex. en gammal länk i
// Instagram-bion) skickas hen direkt vidare till https://, innan något
// annat laddas. Lokalt (localhost) lämnas sidan ifred.
(function () {
  var l = window.location;
  if (l.protocol === 'http:' && !/^(localhost|127\.0\.0\.1)$/.test(l.hostname)) {
    l.replace('https://' + l.host + l.pathname + l.search + l.hash);
  }
})();
