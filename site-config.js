/* =====================================================
   STEP1FILM — innehåll som fylls på
   =====================================================
   Allt som ska bytas ut när nytt material kommer ligger
   här, i en egen fil i stället för inbakat i index.html.
   Skälet är säkerhetsheadern i netlify.toml: den tillåter
   bara skript från den egna sajten, och ett <script> direkt
   i sidan hade blockerats.
   ===================================================== */
/* Showreel i hero.
   `aspect` = filmens egen bredd/höjd. Den används bara som startvärde:
   så fort Vimeo-spelaren svarat med sina riktiga mått räknar sidan om
   själv. Värdet finns här för att rutan ska vara rätt redan första
   sekunden, innan spelaren hunnit svara.
     2.39 = cinemascope   2.35 = widescreen
     2.00 = univisium     1.78 = vanlig 16:9 */
window.STEP1FILM_VIDEO = { provider: 'vimeo', id: '1213253177', aspect: 2.35 };

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
   Loggorna sitter på en trumma som snurrar som ett praxinoskop.
   Filerna i assets/clients/ är redan tvättade: vit siluett på
   genomskinlig botten, alla i samma optiska storlek.

   Lägger du till en ny logga — spara originalet i
   assets/Reklam i Småland_partners/ och säg till, så kör jag den
   genom samma tvätt. Annars sticker den ut i färg och storlek.

   `name` blir bildens alt-text för skärmläsare. Rätta gärna de två
   som heter partner-08 / partner-09 — jag kunde inte läsa namnen
   ur logotyperna. */
window.STEP1FILM_CLIENTS = [
  { src: 'assets/clients/arcus.webp',             name: 'Arcus Utbildning & Jobbförmedling' },
  { src: 'assets/clients/kinnarps.webp',          name: 'Kinnarps' },
  { src: 'assets/clients/hemkop.webp',            name: 'Hemköp' },
  { src: 'assets/clients/vaggeryds-kommun.webp',  name: 'Vaggeryds kommun' },
  { src: 'assets/clients/traningsmagasinet.webp', name: 'Träningsmagasinet' },
  { src: 'assets/clients/hallstorps-bil.webp',    name: 'Hällstorps Bil' },
  { src: 'assets/clients/home-care.webp',         name: 'Home Care' },
  { src: 'assets/clients/brightness-au.webp',     name: 'Brightness Au' },
  { src: 'assets/clients/partner-08.webp',        name: '' },
  { src: 'assets/clients/partner-09.webp',        name: '' }
];

/* 003 KORTFILMER — affischerna.
   Lägg affischerna i assets/films/posters/ och lista dem här.
   De tonar in och ut, var och en på sin egen plats i rutan:
   en i mitten, två delar rutan, tre står vänster/mitten/höger.
   Fler än tre går, men de börjar trängas. */
window.STEP1FILM_POSTERS = {
  // Samma ordning som filmerna nämns i texten
  shorts: [
    'assets/films/posters/nya-ord.jpg',
    'assets/films/posters/minds-eye.jpg',
    'assets/films/posters/otyg.jpg'
  ]
};
