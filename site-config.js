/* =====================================================
   STEP1FILM — innehåll som fylls på
   =====================================================
   Allt som ska bytas ut när nytt material kommer ligger
   här, i en egen fil i stället för inbakat i index.html.
   Skälet är säkerhetsheadern i netlify.toml: den tillåter
   bara skript från den egna sajten, och ett <script> direkt
   i sidan hade blockerats.
   ===================================================== */
/* Showreel i hero */
window.STEP1FILM_VIDEO = { provider: 'vimeo', id: '1213253177' };

/* 001 BIRDS OF PASSAGE — trailer.
   Klistra in video-id:t mellan citattecknen. För YouTube är det den
   del av adressen som står efter v= (t.ex. bW9R0R8KKw8), för Vimeo
   är det siffrorna sist i adressen.
   Lämna tomt så står det "Trailer kommer" i stället. */
window.STEP1FILM_EMBEDS = {
  'film-001': {
    provider: 'vimeo',
    id: '1158214964',
    hash: 'c2727eaa5d',          // krävs — filmen är olistad på Vimeo
    title: 'Birds Of Passage — official trailer'
  }
};

/* 002 REKLAMFILM — samarbetslogotyper.
   Lägg filerna i assets/clients/ (SVG är bäst, annars PNG med
   genomskinlig bakgrund) och lista dem här. Max 6 visas.
   Logotyperna görs automatiskt vita så raden blir enhetlig. */
window.STEP1FILM_CLIENTS = [
  // { src: 'assets/clients/kundnamn.svg', name: 'Kundnamn' },
];

/* 003 KORTFILMER — affischbildspel.
   Lägg affischerna i assets/films/posters/ och lista dem här.
   Första bilden visas alltid först; nästa vid hover eller klick. */
window.STEP1FILM_POSTERS = {
  // Samma ordning som filmerna nämns i texten
  shorts: [
    'assets/films/posters/nya-ord.jpg',
    'assets/films/posters/minds-eye.jpg',
    'assets/films/posters/otyg.jpg'
  ]
};
