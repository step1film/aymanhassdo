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

/* FILMOGRAFIN — används på två ställen:
     panel 01, kort lista bredvid texten
     panel 04, full lista med speltid och festivaler
   `note` visas bara i panel 04. Lämna tom om det inte finns något. */
window.STEP1FILM_FILMOGRAPHY = [
  {
    year: '2015–2016',
    title: 'NYA ORD',
    subtitle: 'New Words',
    format: { sv: 'Dokumentär · pedagogik, komedi, musik, resa', en: 'Documentary · educational, comedy, music, travel' },
    runtime: '48 min'
  },
  {
    year: '2020–2021',
    title: 'THE MIND’S EYE',
    format: { sv: 'Kortfilm · drama', en: 'Short film · drama' },
    runtime: '05 min',
    note: {
      sv: 'Official selection — CortoDino Film Festival, X Edizione, Neapel, 23 november 2020. Semifinal — Festival del Cinema di Cefalù, Palermo, 23 november 2020.',
      en: 'Official selection — CortoDino Film Festival, X Edizione, Naples, 23 November 2020. Semi-final — Festival del Cinema di Cefalù, Palermo, 23 November 2020.'
    }
  },
  {
    year: '2021–2022',
    title: 'TOGETHER WE CREATE HARMONY',
    format: { sv: 'Musik och kort 3D-film', en: 'Music and a short 3D film' },
    runtime: '04 min',
    note: {
      sv: 'Allt började med en fråga: kan olika noter mötas och skapa harmoni? Vi lät en orientalisk sång i bayati-skalan möta en svensk. De harmonierade vackert.',
      en: 'It started with one question: can different notes meet and create harmony? We let an oriental song in the bayati scale meet a Swedish one. They harmonised beautifully.'
    }
  },
  {
    year: '2022–2023',
    title: 'OTYG',
    format: { sv: 'Kortfilm', en: 'Short film' },
    runtime: '09 min',
    note: {
      sv: 'Pitchad på Värnamo Filmhistoriska Festival och visad på två filmfestivaler online. Manus till en långfilm är under utveckling.',
      en: 'Pitched at the Värnamo Film History Festival and shown at two online film festivals. A feature-length script is in development.'
    }
  },
  {
    year: '2026–2027',
    title: 'BIRDS OF PASSAGE',
    format: { sv: 'Långfilmsdokumentär', en: 'Feature-length documentary' },
    status: { sv: 'Pågående', en: 'In progress' },
    note: { sv: 'Samproduktion: Story AB', en: 'Co-production: Story AB' }
  }
];

/* CV — erfarenhet. Visas på panel 04. */
window.STEP1FILM_CV = [
  {
    year: '2017–2020',
    role: { sv: 'Fritidshem / pedagog', en: 'After-school centre / educator' },
    where: { sv: 'Film och musik för barn F–3, Vaggeryds kommun', en: 'Film and music for children, years F–3, Vaggeryd municipality' }
  },
  {
    year: { sv: 'Sedan 2016', en: 'Since 2016' },
    role: { sv: 'Reklam- och infofilm', en: 'Commercial and information film' },
    where: { sv: 'Uppdrag för svenska varumärken', en: 'Commissions for Swedish brands' }
  },
  {
    year: '2015 / 2017',
    role: { sv: 'Filmprojektledare', en: 'Film project leader' },
    where: { sv: 'I samarbete med biblioteket i Vaggeryd', en: 'In collaboration with Vaggeryd library' }
  },
  {
    year: '2008–2010',
    role: { sv: 'Lärare', en: 'Teacher' },
    where: { sv: 'Kulturskolan, Syrien', en: 'The culture school, Syria' }
  }
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
