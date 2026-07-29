/* =====================================================
   STEP1FILM — språk (svenska / engelska)
   =====================================================
   Samma mönster som butiken: varje text bär ett
   data-i18n-attribut och hämtar sin sträng härifrån.

   Attribut som stöds:
     data-i18n        → textContent
     data-i18n-html   → innerHTML (för rubriker med <br>)
     data-i18n-aria   → aria-label

   Valet sparas i localStorage under 's1f_lang' — samma
   nyckel som shop.js, så språket följer med mellan
   startsidan och butiken.
   ===================================================== */
(function () {
  'use strict';

  const STRINGS = {
    sv: {
      /* --- Ramverk --- */
      skip: 'Hoppa till innehållet',
      homeAria: 'STEP1FILM — startsida',
      storeLink: 'BUTIK',
      storeLinkAria: 'STEP1FILM Store',
      skipIntro: 'HOPPA ÖVER INTRO',
      skipIntroAria: 'Hoppa över introt och gå till sidan',
      loaderLabel: 'ROLL &nbsp;·&nbsp; LJUD &nbsp;·&nbsp; TAGNING',

      /* --- Hero --- */
      playShowreel: 'SPELA SHOWREEL',
      showreel: 'Showreel',
      enterSite: 'Gå in på sidan',

      /* --- Panel 01: Filmer --- */
      p1Title: 'Utvalda<br>arbeten',
      p1Meta: 'Dokumentär · Filmografi · Workshops · Reklam',
      trailerSoon: 'Trailer kommer',
      playTrailer: 'Spela trailer',
      logosSoon: 'Samarbeten',
      postersSoon: 'Affischer',
      f1Type: 'Dokumentär . Pågående',
      f1Syn: 'Långfilmsdokumentär . Speltid: 85 min',
      f2Type: 'Reklam',
      f2Title: 'Reklamfilm — i Småland',
      f2Syn: 'Regi och foto för svenska varumärken.',
      f3Type: 'Kortfilm . Dokumentär',
      f3Title: 'KORTFILMER',
      f3Syn: 'Nya ord — min första film, om utmaningen att lära sig ett nytt språk som flykting . The Mind’s Eye . Otyg . Together We Create Harmony.',
      cornerSign: 'HÖRNA',
      f4Type: 'Fritt hörn',
      f4Title: 'STEP1 HÖRNA',
      f4Syn: 'Från musik till digital konst, webbutveckling och workshops — ett fritt hörn där idéer får testas innan de blir film.',
      f5Year: 'Butik',
      f5Type: 'Merch · Tryck',
      f5Syn: 'Allt är designat för STEP1 STORE och trycks först när du beställer. Färska varor — och inget blir över. Handla nu →',
      storeAria: 'STEP1 Store — merch, kepsar och muggar',

      /* --- Panel 02: Om --- */
      p2Title: 'Filmaren',
      portraitCap: 'Ayman Hassdo &nbsp;·&nbsp; Småland',
      aboutLead: 'Ayman Hassdo är en bred filmskapare som arbetar som regissör, filmfotograf, manusförfattare, ljuddesigner, producent och kompositör.',
      aboutBody: 'Född i Al-Hassake i Syrien och uppvuxen på landsbygden. Flyttade till Damaskus 2007 för att satsa på musiken och lärde sig film på egen hand när tillgången var knapp. Kom till Sverige som flykting 2013 — lärde sig svenska och regisserade sedan sin första dokumentär om vad det innebär att lära sig ett nytt språk. Studerade film på Öland 2017, där han färdigställde en biografisk poesidokumentär. I dag arbetar han som frilans från en liten by i Småland.',
      aboutQuiet: 'Arbetet är format av två länder och en övertygelse — att film kan ge plats åt medmänsklighet, klimat och kultur utan att höja rösten.',
      aboutNumsAria: 'Verksamhet',
      an1: 'Kom till Sverige',
      an2: 'Filmskola, Öland',
      an3: 'Discipliner',

      /* --- Panel 03: Vad vi kan göra --- */
      p3Title: 'Vad vi kan göra<br>för ditt filmprojekt',
      p3Meta: 'Från första samtalet till färdig mix',
      p3Intro: 'Skicka ett mejl med var projektet står, vad det handlar om, och en länk till rörligt material om det finns. Sedan tar vi ett onlinemöte och bestämmer en plan tillsammans.',
      aw1: 'Vi planerar projektet',
      aw1d: 'Ett onlinemöte när du skickat projektstatus, projektbeskrivning och länk till ditt material.',
      aw2: 'Vi utvecklar ditt manus',
      aw2d: 'Vi hjälper dig ta idén från anteckning till ett manus som håller.',
      aw3: 'Vi filmar din film',
      aw3d: 'Vi filmar — kamera, ljus och regi på plats.',
      aw4: 'Vi klipper',
      aw4d: 'Bildklipp och färg, tills filmen hittar sin rytm.',
      aw5: 'Vi ljudlägger och mixar',
      aw5d: 'Ljuddesign, musik och den färdiga mixen.',
      aw6: 'Vi kopplar dig rätt',
      aw6d: 'Vi hjälper din vision fram genom att koppla dig till de filmmedarbetare den behöver.',

      /* --- Panel 04: Press --- */
      p4Title: 'Med&nbsp;deras<br>ord',
      p4Meta: 'Press & kundomdömen',
      pq1: 'Vi ser stor potential i filmen som visar en unik sida av den svåra processen att fly krig och anpassa sig till ett nytt samhälle.',
      pq1a: 'GAZE — Region Jönköpings Län',
      pq1m: 'Talangprogrammet GAZE',
      pq2: 'Jag har aldrig tidigare träffat en person som varit så driven som han.',
      pq2a: 'Kjell Frick — medielärare',
      pq2m: 'SVT Nyheter Jönköping',
      pq3: 'En dokumentärfilm om hur det är att lära sig ett nytt språk.',
      pq3m: 'Sveriges Radio P4',

      /* --- Panel 05: Kontakt --- */
      p5Title: 'Nu<br>kör vi',
      contactIntro: 'Pitcha din idé i några rader, bifoga ditt material och låt oss prata därefter. ;)',
      cfName: 'Namn',
      cfEmail: 'E-post',
      cfLink: 'Länk till ditt material',
      cfOptional: 'valfritt',
      cfPitch: 'Din idé',
      cfSend: 'Skicka',
      cfSending: 'Skickar …',
      cfOk: 'Tack! Mejlet är skickat — du hör från oss.',
      cfFail: 'Det gick inte att skicka just nu. Mejla oss direkt:',
      cfMissing: 'Fyll i namn, e-post och din idé.',
      cfBadEmail: 'Kontrollera e-postadressen.',
      crBased: 'Baserad i',
      crBasedVal: 'Småland',

      /* --- Navigation --- */
      navFilms: 'Utvalda arbeten',
      navAbout: 'Filmskaparen',
      navPractice: 'Vad vi gör',
      navPress: 'Press',
      navContact: 'Kontakt',
      navAria: 'Sektionsnavigering',
      prevSection: 'Föregående sektion',
      nextSection: 'Nästa sektion',

      /* --- Sidfot --- */
      footCopy: '© 2026 STEP1FILM · Småland, Sverige'
    },

    en: {
      skip: 'Skip to content',
      homeAria: 'STEP1FILM — home',
      storeLink: 'STORE',
      storeLinkAria: 'STEP1FILM Store',
      skipIntro: 'SKIP INTRO',
      skipIntroAria: 'Skip intro and enter site',
      loaderLabel: 'ROLL &nbsp;·&nbsp; SOUND &nbsp;·&nbsp; ACTION',

      playShowreel: 'PLAY SHOWREEL',
      showreel: 'Showreel',
      enterSite: 'Enter site',

      p1Title: 'Selected<br>Works',
      p1Meta: 'Documentary · Filmography · Workshops · Commercial',
      trailerSoon: 'Trailer coming',
      playTrailer: 'Play trailer',
      logosSoon: 'Collaborations',
      postersSoon: 'Posters',
      f1Type: 'Documentary . In progress',
      f1Syn: 'A feature-length documentary . Runtime: 85 min',
      f2Type: 'Commercial',
      f2Title: 'Commercial film — in Småland',
      f2Syn: 'Direction and cinematography for Swedish brands.',
      f3Type: 'Shorts . Documentary',
      f3Title: 'SHORT FILMS',
      f3Syn: 'Nya ord — my first film, on the challenges of learning a new language as a refugee . The Mind’s Eye . Otyg . Together We Create Harmony.',
      cornerSign: 'CORNER',
      f4Type: 'Free corner',
      f4Title: 'STEP1 CORNER',
      f4Syn: 'From music to digital art, web development and workshops — a free corner where ideas get tested before they become film.',
      f5Year: 'Store',
      f5Type: 'Merch · Print',
      f5Syn: 'Everything is designed for STEP1 STORE and printed only when you order. Fresh pieces — and nothing left over. Shop now →',
      storeAria: 'STEP1 Store — merch, caps and mugs',

      p2Title: 'The<br>Filmmaker',
      portraitCap: 'Ayman Hassdo &nbsp;·&nbsp; Småland',
      aboutLead: 'Ayman Hassdo is a multi-disciplinary filmmaker working as a director, cinematographer, screenwriter, sound designer, producer and composer.',
      aboutBody: 'Born in Al-Hassake, Syria, and raised in the countryside. Moved to Damascus in 2007 to pursue music; taught himself film when access to it was scarce. Arrived in Sweden as a refugee in 2013 — learned Swedish, then directed a first documentary on what it means to learn a new language. Studied film on Öland in 2017, where he completed a biography-poetry documentary. Today he works freelance from a small village in Småland.',
      aboutQuiet: 'The work is shaped by two countries and one belief — that film can hold space for humanity, climate and culture without raising its voice.',
      aboutNumsAria: 'Practice',
      an1: 'Arrived in Sweden',
      an2: 'Film school, Öland',
      an3: 'Disciplines',

      p3Title: 'What we can do<br>for your film project',
      p3Meta: 'From first call to final mix',
      p3Intro: 'Send an email with where your project stands, what it is about, and a link to any footage you already have. Then we take an online meeting and set a plan together.',
      aw1: 'We plan the project',
      aw1d: 'An online meeting once you have sent your project status, a description, and a link to any material.',
      aw2: 'We develop your script',
      aw2d: 'We help you take the idea from a note to a screenplay that holds.',
      aw3: 'We shoot your film',
      aw3d: 'We film it — camera, light and direction on set.',
      aw4: 'We edit',
      aw4d: 'Picture edit and grade, until the film finds its rhythm.',
      aw5: 'We do sound and mix',
      aw5d: 'Sound design, music and the final mix.',
      aw6: 'We connect you right',
      aw6d: 'We help your vision along by connecting you to the film crew it needs.',

      p4Title: 'In&nbsp;their<br>words',
      p4Meta: 'Press & client notes',
      pq1: 'We see great potential in the film, which shows a unique side of the difficult process of fleeing war and adapting to a new society.',
      pq1a: 'GAZE — Region Jönköpings Län',
      pq1m: 'The GAZE talent programme',
      pq2: 'I have never met anyone as driven as he is.',
      pq2a: 'Kjell Frick — media teacher',
      pq2m: 'SVT Nyheter Jönköping',
      pq3: 'A documentary about what it is like to learn a new language.',
      pq3m: 'Sveriges Radio P4',

      p5Title: 'Let’s<br>Work',
      contactIntro: 'Pitch your idea in a few lines, attach your material, and let’s talk from there. ;)',
      cfName: 'Name',
      cfEmail: 'Email',
      cfLink: 'Link to your material',
      cfOptional: 'optional',
      cfPitch: 'Your idea',
      cfSend: 'Send',
      cfSending: 'Sending …',
      cfOk: 'Thank you! Your message is on its way — you will hear from us.',
      cfFail: 'That did not go through. Email us directly:',
      cfMissing: 'Please fill in name, email and your idea.',
      cfBadEmail: 'Please check the email address.',
      crBased: 'Based in',
      crBasedVal: 'Småland',

      navFilms: 'Selected Works',
      navAbout: 'The Filmmaker',
      navPractice: 'What We Do',
      navPress: 'Press',
      navContact: 'Contact',
      navAria: 'Section navigation',
      prevSection: 'Previous section',
      nextSection: 'Next section',

      footCopy: '© 2026 STEP1FILM · Småland, Sweden'
    }
  };

  /* Engelska är huvudspråk på filmsidan — den vänder sig till festivaler
     och produktionsbolag utanför Sverige. Butiken har svenska som
     standard, eftersom den säljer till svenska kunder. Väljer besökaren
     språk själv sparas det och gäller överallt. */
  let lang = localStorage.getItem('s1f_lang');
  if (lang !== 'sv' && lang !== 'en') lang = 'en';

  const t = key => {
    const dict = STRINGS[lang] || STRINGS.sv;
    return (key in dict) ? dict[key] : (STRINGS.sv[key] !== undefined ? STRINGS.sv[key] : '');
  };

  function apply() {
    document.documentElement.setAttribute('lang', lang);

    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });

    document.querySelectorAll('.lang-toggle button').forEach(b => {
      const on = b.dataset.lang === lang;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    // Sektionsnamnen i sidonavigeringen läses av main.js
    // Samma ordning som panelerna: 01 filmskaparen, 02 utvalda arbeten
    window.STEP1FILM_NAV_LABELS =
      [t('navAbout'), t('navFilms'), t('navPractice'), t('navPress'), t('navContact')];
    document.dispatchEvent(new CustomEvent('s1f:langchange', { detail: { lang } }));
  }

  function setLang(l) {
    if (l !== 'sv' && l !== 'en') return;
    lang = l;
    localStorage.setItem('s1f_lang', l);
    apply();
  }

  function init() {
    document.querySelectorAll('.lang-toggle button').forEach(b => {
      b.addEventListener('click', () => setLang(b.dataset.lang));
    });
    apply();
  }

  window.STEP1FILM_I18N = { get lang() { return lang; }, t, setLang };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
