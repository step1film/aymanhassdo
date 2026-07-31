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

/* KLIPPSPELAREN på panel 01 (Drömmen).
   Fyra klipp som man bläddrar mellan. Varje klipp spelar 30 sekunder
   och går sedan vidare till nästa av sig själv — det är ett smakprov,
   inte hela filmen. Vill du visa mer, ändra `SEKUNDER` i main.js.

   `id`    = siffrorna sist i Vimeo-adressen
   `hash`  = sekretessnyckeln (h=…) — behövs bara för olistade filmer
   `title` = det som står under rutan, och bildens titel för skärmläsare */
window.STEP1FILM_REEL = [
  { id: '469092414',  title: 'THE MIND’S EYE — trailer' },
  { id: '529274561',  title: 'Fusion — Vem kan segla & Ya Msafer' },
  { id: '135358398',  title: 'NYA ORD — trailer, 2015' },
  { id: '1174493683', title: 'Värnamo Filmhistoriska Vänner' }
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

/* CV, panel 04 — FESTIVALER.
   Allt här är hämtat från uppgifterna som redan stod i filmografin.
   ⚠️ FYLL PÅ: de två onlinefestivalerna för OTYG saknar namn, och
   visningar som inte nämnts på sajten tidigare finns inte med alls.
   Skicka namn, ort och år så lägger jag in dem. */
window.STEP1FILM_FESTIVALS = [
  {
    year: '2020',
    what: 'CortoDino Film Festival, X Edizione',
    where: { sv: 'Neapel, Italien', en: 'Naples, Italy' },
    note: { sv: 'THE MIND’S EYE · Official selection', en: 'THE MIND’S EYE · Official selection' }
  },
  {
    year: '2020',
    what: 'Festival del Cinema di Cefalù',
    where: { sv: 'Palermo, Italien', en: 'Palermo, Italy' },
    note: { sv: 'THE MIND’S EYE · Semifinal', en: 'THE MIND’S EYE · Semi-final' }
  },
  {
    year: '2023',
    what: { sv: 'Värnamo Filmhistoriska Festival', en: 'Värnamo Film History Festival' },
    where: { sv: 'Värnamo, Sverige', en: 'Värnamo, Sweden' },
    note: { sv: 'OTYG · Pitch', en: 'OTYG · Pitch' }
  },
  {
    year: '2023',
    what: { sv: 'Två filmfestivaler online', en: 'Two online film festivals' },
    where: '',
    note: { sv: 'OTYG · Visning', en: 'OTYG · Screening' }
  }
];

/* CV, panel 04 — STÖD OCH SAMARBETEN.
   ⚠️ FYLL PÅ: fonder, regioner och produktionsbolag som stöttat
   projekten. Just nu står bara det som redan nämnts på sajten. */
window.STEP1FILM_SUPPORT = [
  {
    year: '2026–2027',
    what: 'Story AB',
    where: { sv: 'Samproduktion · BIRDS OF PASSAGE', en: 'Co-production · BIRDS OF PASSAGE' }
  },
  {
    year: '2015 / 2017',
    what: { sv: 'Vaggeryds bibliotek', en: 'Vaggeryd library' },
    where: { sv: 'Filmprojekt för unga', en: 'Film projects for young people' }
  }
];

/* CV, panel 04 — UTVALD AV.
   Talangprogram, urval och redaktioner som lyft fram arbetet.
   ⚠️ FYLL PÅ — det här är den kortaste listan och den som säger mest. */
window.STEP1FILM_SELECTED = [
  {
    year: '',
    what: 'GAZE',
    where: { sv: 'Talangprogram · Region Jönköpings län', en: 'Talent programme · Region Jönköping County' }
  },
  {
    year: '',
    what: 'SVT Nyheter Jönköping',
    where: { sv: 'Reportage', en: 'Feature' }
  },
  {
    year: '',
    what: 'Sveriges Radio P4',
    where: { sv: 'Reportage', en: 'Feature' }
  }
];

/* CV — utbildning. Ligger kvar som underlag men visas inte längre
   någonstans på sajten; utbildningsspalten togs bort från både
   Drömmen och CV-panelen. Raderas inte, så att den går att ta in
   igen utan att skrivas om. */
window.STEP1FILM_EDUCATION = [
  {
    year: { sv: 'Sep–okt 2024', en: 'Sep–Oct 2024' },
    what: { sv: 'Samordning och projektansökningar', en: 'Coordination and grant applications' },
    where: { sv: 'Intensivkurs på distans · Tornedalens folkhögskola', en: 'Intensive course, distance · Tornedalen folk high school' }
  },
  {
    year: '2020–2023',
    what: { sv: 'Kandidat, filmfoto', en: 'Bachelor, cinematography' },
    where: { sv: 'Egypten · distans', en: 'Egypt · distance' }
  },
  {
    year: '2016–2017',
    what: { sv: 'Dokumentärfilm', en: 'Documentary film' },
    where: { sv: 'Ölands folkhögskola · Öland, Sverige', en: 'Ölands folk high school · Öland, Sweden' }
  },
  {
    year: '2016',
    what: { sv: 'Manusskrivarveckan', en: 'Screenwriting week' },
    where: { sv: 'Workshop arrangerad av Råfilm', en: 'Workshop organised by Råfilm' }
  },
  {
    year: '2013–2015',
    what: { sv: 'Media och produktion, svenska', en: 'Media and production, Swedish' },
    where: { sv: 'Fenix · Vaggeryd', en: 'Fenix · Vaggeryd' }
  },
  {
    year: '2007–2009',
    what: { sv: 'Musikinstitutet', en: 'Music Institute' },
    where: { sv: 'Damaskus, Syrien', en: 'Damascus, Syria' }
  },
  {
    year: '2007',
    what: { sv: 'Gymnasium', en: 'Upper secondary school' },
    where: { sv: 'Al-Hasakah, Syrien', en: 'Al-Hasakah, Syria' }
  },
  {
    year: '2005',
    what: { sv: 'Kortare IT-kurser', en: 'Short IT courses' },
    where: { sv: 'Syrien', en: 'Syria' }
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
  ],
  /* 002 JAG SOM HAR TVÅ MAMMOR — bilder kommer 2027.
     Så länge listan är tom står det "Bilder kommer" i rutan.
     Lägg filerna i assets/films/mammor/ och skriv in dem här. */
  mammor: []
};
