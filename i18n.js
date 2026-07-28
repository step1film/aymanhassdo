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
      p1Meta: 'Filmografi · Reklam · Dokumentär · Konst',
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
      f4Type: 'Konst',
      f4Title: 'STEP1 HÖRNA',
      f4Syn: 'Från musik till digital konst — och webbutveckling.',
      f5Year: 'Butik',
      f5Type: 'Merch · Tryck',
      f5Syn: 'Officiell STEP1FILM-merch — t-shirts, hoodies, kepsar & muggar. Välj färg och storlek. Handla nu →',
      storeAria: 'STEP1 Store — merch, kepsar och muggar',

      /* --- Panel 02: Om --- */
      p2Title: 'Filmaren',
      portraitCap: 'Ayman Hassdo &nbsp;·&nbsp; Småland',
      aboutLead: 'Ayman Hassdo är en bred filmskapare som arbetar som regissör, filmfotograf, manusförfattare, ljuddesigner, producent och kompositör.',
      aboutBody: 'Född i Al-Hassake i Syrien och uppvuxen på landsbygden. Flyttade till Damaskus 2007 för att satsa på musiken och lärde sig film på egen hand när tillgången var knapp. Kom till Sverige som flykting 2013 — lärde sig svenska och regisserade sedan sin första dokumentär om vad det innebär att lära sig ett nytt språk. Studerade film på Öland 2017, där han färdigställde en biografisk poesidokumentär. I dag arbetar han som frilans från en liten by utanför Jönköping, i Småland.',
      aboutQuiet: 'Arbetet är format av två länder och en övertygelse — att film kan ge plats åt medmänsklighet, klimat och kultur utan att höja rösten.',
      aboutNumsAria: 'Verksamhet',
      an1: 'Kom till Sverige',
      an2: 'Filmskola, Öland',
      an3: 'Discipliner',

      /* --- Panel 03: Vad jag gör --- */
      p3Title: 'Det jag helst gör',
      p3Meta: 'Discipliner & leveranser',
      p3Intro: 'Jag gillar att hitta lösningar — genom film, teknik och kod. Och lika mycket att föra vidare det jag lärt mig: pedagogiskt arbete med både barn och vuxna.',
      aw1: 'Regi',
      aw1d: 'Långfilm, kortfilm, dokumentär, reklam. Från manus till leverans.',
      aw2: 'Skrivande',
      aw2d: 'Allt börjar på pappret. Jag måste se scenen stå still innan kameran får röra sig.',
      aw3: 'Ljud & musik',
      aw3d: 'Ljuddesign, mixning och originalmusik.',
      aw4: 'Klipp & färg',
      aw4d: 'Bildklipp, färgläggning och finish för festival och webb.',
      aw5: 'Foto (stillbild)',
      aw5d: 'Stillbild, porträtt och redaktionellt — stillsamt, i befintligt ljus.',
      aw6: 'Företagsfilm',
      aw6d: 'Reklamfilm och företagsfilm, producerad från Småland.',

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
      contactIntro: 'Tillgänglig för regi, foto och reklamfilm — baserad i Småland, arbetar var som helst. Festivalprogrammare och produktionsbolag är välkomna.',
      crEmail: 'E-post',
      crPortfolio: 'Portfolio',
      crRates: 'Tjänster & priser',
      crRatesVal: 'På förfrågan',
      crBased: 'Baserad i',
      crBasedVal: 'Jönköping, Småland',

      /* --- Navigation --- */
      navFilms: 'Filmer',
      navAbout: 'Om',
      navPractice: 'Verksamhet',
      navPress: 'Press',
      navContact: 'Kontakt',
      navAria: 'Sektionsnavigering',
      prevSection: 'Föregående sektion',
      nextSection: 'Nästa sektion',

      /* --- Sidfot --- */
      footCopy: '© 2026 Ayman Hassdo · Jönköping, Sverige'
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
      p1Meta: 'Filmography · Commercial · Documentary · Art',
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
      f4Type: 'Art',
      f4Title: 'STEP1 CORNER',
      f4Syn: 'From music to digital art — and web development.',
      f5Year: 'Store',
      f5Type: 'Merch · Print',
      f5Syn: 'Official STEP1FILM merch — tees, hoodies, caps & mugs. Choose colour and size. Shop now →',
      storeAria: 'STEP1 Store — merch, caps and mugs',

      p2Title: 'The<br>Filmmaker',
      portraitCap: 'Ayman Hassdo &nbsp;·&nbsp; Småland',
      aboutLead: 'Ayman Hassdo is a multi-disciplinary filmmaker working as a director, cinematographer, screenwriter, sound designer, producer and composer.',
      aboutBody: 'Born in Al-Hassake, Syria, and raised in the countryside. Moved to Damascus in 2007 to pursue music; taught himself film when access to it was scarce. Arrived in Sweden as a refugee in 2013 — learned Swedish, then directed a first documentary on what it means to learn a new language. Studied film on Öland in 2017, where he completed a biography-poetry documentary. Today he works freelance from a small village outside Jönköping, in Småland.',
      aboutQuiet: 'The work is shaped by two countries and one belief — that film can hold space for humanity, climate and culture without raising its voice.',
      aboutNumsAria: 'Practice',
      an1: 'Arrived in Sweden',
      an2: 'Film school, Öland',
      an3: 'Disciplines',

      p3Title: 'What I Like To Do',
      p3Meta: 'Disciplines & deliverables',
      p3Intro: 'I like inventing solutions — through film, technology and code. And just as much, I love passing on what I’ve learned: pedagogical work with children and grown-ups alike.',
      aw1: 'Direction',
      aw1d: 'Feature, short, documentary, commercial. From script to delivery.',
      aw2: 'Writing',
      aw2d: 'It all starts on paper. I need to see the scene hold still before the camera is allowed to move.',
      aw3: 'Sound & Music',
      aw3d: 'Sound design, mixing and original score.',
      aw4: 'Editing & Colour',
      aw4d: 'Picture edit, grade and finish for festival and online delivery.',
      aw5: 'Photography',
      aw5d: 'Stills, portrait and editorial — quiet, available-light work.',
      aw6: 'Corporate film',
      aw6d: 'Commercial and corporate film, produced from Småland.',

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
      contactIntro: 'Available for direction, cinematography and commercial work — based in Småland, working anywhere. Festival programmers and production companies welcome.',
      crEmail: 'Email',
      crPortfolio: 'Portfolio',
      crRates: 'Services & rates',
      crRatesVal: 'On request',
      crBased: 'Based in',
      crBasedVal: 'Jönköping, Småland',

      navFilms: 'Films',
      navAbout: 'About',
      navPractice: 'Practice',
      navPress: 'Press',
      navContact: 'Contact',
      navAria: 'Section navigation',
      prevSection: 'Previous section',
      nextSection: 'Next section',

      footCopy: '© 2026 Ayman Hassdo · Jönköping, Sweden'
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
    window.STEP1FILM_NAV_LABELS =
      [t('navFilms'), t('navAbout'), t('navPractice'), t('navPress'), t('navContact')];
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
