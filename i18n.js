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

      /* --- Vrid enheten --- */
      rotateTitle: 'Vrid enheten',
      rotateBody: 'Liggande läge ger dig hela versionen — samma som på en dator.',
      rotateStay: 'Behåll som det är',

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
      f4Title: 'STEP<em>1</em> HÖRNA',
      f4Syn: 'Från musik till digital konst, webbutveckling och workshops — ett fritt hörn där idéer får testas innan de blir film.',
      f5Year: 'Butik',
      f5Type: 'Merch · Tryck',
      f5Syn: 'Allt är designat för STEP1 STORE och trycks först när du beställer. Färska varor — och inget blir över. Handla nu →',
      storeAria: 'STEP1 Store — merch, kepsar och muggar',

      /* --- Panel 01: Drömmen --- */
      p2Title: 'Dröm&shy;men',
      portraitCap: 'Foto: Joel Arvidsson &nbsp;·&nbsp; Småland, Sverige',
      aboutP1: 'Jag föddes i nordöstra Syrien, i en ganska torr region med en rik mångfald av människor, språk och kulturer. Det som präglade mig mest var människornas värme, generositet och omtanke — värderingar som följt mig genom livet och gett mig modet att drömma stort.',
      aboutP2: 'När kriget tvingade mig att lämna Syrien kom jag till Sverige. Här möttes jag av nya möjligheter och började arbeta målmedvetet för att förverkliga mina drömmar. Jag har studerat och fortsätter, fått stöd, kunskap och förtroende, och kärlek från människor längs vägen. Därför vill jag nu ge något tillbaka.',
      aboutP3: 'STEP1FILM finns för att stötta nästa generation filmskapare. Om du arbetar med din debut, har en idé som du tror starkt på men inte vet hur du ska ta nästa steg, eller saknar ett nätverk inom filmbranschen — vill vi gärna hjälpa dig. Vi kan vägleda dig genom processen, hjälpa dig att utveckla en plan och, när det är möjligt, sätta dig i kontakt med rätt personer inom branschen.',
      aboutP4: 'Att göra film är sällan en resa man klarar ensam. Om vi kan bidra med kunskap, erfarenhet eller rätt kontakter gör vi det gärna. Tveka inte att höra av dig — kanske är ett enkelt samtal början på din nästa film.',
      aboutQuote: 'Kom ihåg: om dina drömmar inte skrämmer dig är de kanske inte tillräckligt stora.',
      cvSchool: 'Utbildning',
      cvComposing: 'Komposition',
      cvDoc: 'Film · Dokumentär',
      cvDistance: 'Distans',
      cvFilms: 'Filmer',
      cvFilmsSoon: 'Filmografi kommer',

      /* --- Panel 03: Vad vi kan göra --- */
      p3Title: 'Vad vi kan göra<br>för ditt filmprojekt',
      p3Meta: 'Från första samtalet till färdig mix',
      p3Intro: 'Skicka ett mejl med var projektet står, vad det handlar om, och en länk till rörligt material om det finns. Sedan tar vi ett onlinemöte och bestämmer en plan tillsammans.',
      aboutMail: 'Skriv till Ayman',
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
      contactIntro: 'Pitcha din idé i några rader — var projektet står, vad det handlar om, och en länk till ditt material om det finns. Sedan tar vi ett onlinemöte och bestämmer en plan tillsammans. ;)',
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
      navAbout: 'Drömmen',
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

      rotateTitle: 'Turn your device',
      rotateBody: 'Landscape gives you the full version — the same one you get on a computer.',
      rotateStay: 'Stay as it is',

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
      f4Title: 'STEP<em>1</em> CORNER',
      f4Syn: 'From music to digital art, web development and workshops — a free corner where ideas get tested before they become film.',
      f5Year: 'Store',
      f5Type: 'Merch · Print',
      f5Syn: 'Everything is designed for STEP1 STORE and printed only when you order. Fresh pieces — and nothing left over. Shop now →',
      storeAria: 'STEP1 Store — merch, caps and mugs',

      p2Title: 'The<br>Dream',
      portraitCap: 'Photo by Joel Arvidsson &nbsp;·&nbsp; Småland, Sweden',
      aboutP1: 'I was born in north-eastern Syria, in a fairly dry region with a rich mix of people, languages and cultures. What marked me most was the warmth, generosity and care of the people there — values that have followed me through life and given me the courage to dream big.',
      aboutP2: 'When the war forced me to leave Syria I came to Sweden. Here I met new possibilities and began working with purpose to make my dreams real. I have studied, and I keep studying; I have been given support, knowledge, trust and love from people along the way. That is why I now want to give something back.',
      aboutP3: 'STEP1FILM exists to support the next generation of filmmakers. If you are working on your debut, have an idea you believe in strongly but don’t know how to take the next step, or lack a network in the film industry — we would gladly help. We can guide you through the process, help you build a plan and, where possible, put you in touch with the right people in the industry.',
      aboutP4: 'Making a film is rarely a journey you complete alone. If we can contribute knowledge, experience or the right contacts, we do it gladly. Don’t hesitate to get in touch — a simple conversation might be the beginning of your next film.',
      aboutQuote: 'Remember: if your dreams don’t scare you, maybe they aren’t big enough.',
      cvSchool: 'Education',
      cvComposing: 'Composing',
      cvDoc: 'Film · Documentary',
      cvDistance: 'Distance',
      cvFilms: 'Films',
      cvFilmsSoon: 'Filmography coming',

      p3Title: 'What we can do<br>for your film project',
      p3Meta: 'From first call to final mix',
      p3Intro: 'Send an email with where your project stands, what it is about, and a link to any footage you already have. Then we take an online meeting and set a plan together.',
      aboutMail: 'Write to Ayman',
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
      contactIntro: 'Pitch your idea in a few lines — where the project stands, what it is about, and a link to any footage you have. Then we take an online meeting and set a plan together. ;)',
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
      navAbout: 'The Dream',
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

    /* Sektionsnamnen i sidonavigeringen läses av main.js.
       Uppslag på panelens id, inte på ordningen — då spelar det ingen
       roll om en panel stängs av eller byter plats. */
    window.STEP1FILM_NAV_LABELS = {
      about:   t('navAbout'),
      films:   t('navFilms'),
      awards:  t('navPractice'),
      press:   t('navPress'),
      contact: t('navContact')
    };
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
