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

  /* ADMIN:START texter */
  const STRINGS = {
    "sv": {
      "skip": "Hoppa till innehållet",
      "homeAria": "STEP1FILM — startsida",
      "storeLink": "BUTIK",
      "storeLinkAria": "STEP1FILM Store",
      "skipIntro": "HOPPA ÖVER INTRO",
      "skipIntroAria": "Hoppa över introt och gå till sidan",
      "loaderLabel": "ROLL &nbsp;·&nbsp; LJUD &nbsp;·&nbsp; TAGNING",
      "rotateTitle": "Vrid enheten",
      "rotateBody": "Liggande läge ger dig hela versionen — samma som på en dator.",
      "rotateStay": "Behåll som det är",
      "playShowreel": "SPELA SHOWREEL",
      "showreel": "Showreel",
      "enterSite": "Gå in på sidan",
      "introPlace": "Filmproduktion i Småland och Jönköpings län.",
      "introDoes": "Dokumentär · kortfilm · uppdragsfilm · utveckling",
      "heroTag": "Stories from people",
      "p1Title": "Utvalda<br>arbeten",
      "p1Meta": "Dokumentär · Kortfilm · Reklam · Digitalt labb · Webbutik",
      "playTrailer": "Spela trailer",
      "logosSoon": "Samarbeten",
      "postersSoon": "Affischer",
      "f1Type": "Dokumentär · Pågående",
      "f1Syn": "Långfilmsdokumentär · Speltid 80 min · Samproduktion med Story AB",
      "f2Type": "Research & development",
      "f2Title": "JAG SOM HAR TVÅ MAMMOR",
      "f2Syn": "Under research och utveckling.",
      "f3Type": "Kortfilm · Dokumentär · Reklam",
      "f3Title": "FILMER",
      "f3Syn": "Kortfilm, dokumentär och uppdrag för svenska varumärken — från Nya ord till The Mind’s Eye, Otyg och Together We Create Harmony.",
      "labSign": "DIGITAL LAB",
      "f4Type": "Digitalt labb",
      "f4Title": "STEP<em>1</em> DIGITAL LAB",
      "f4Syn": "Från musik till digital konst, webbutveckling och workshops — ett fritt labb där idéer får testas innan de blir film.",
      "f5Year": "Butik",
      "f5Type": "Merch · Tryck",
      "f5Syn": "Allt är designat för STEP1 STORE och trycks först när du beställer. Färska varor — och inget blir över.",
      "storeAria": "STEP1 Store — merch, kepsar och muggar",
      "ctaFilms": "Filmer",
      "ctaShopping": "Handla",
      "closeTrailer": "Stäng trailern",
      "p2Title": "Varför<br>vi finns",
      "portraitCap": "Foto: Joel Arvidsson · Småland, Sverige",
      "aboutP1": "Jag föddes i nordöstra Syrien, i en relativt torr region som är rik på mänsklig, språklig och kulturell mångfald. Det som präglade mig mest var värmen, generositeten och omtanken hos dess folk — värderingar som följt mig genom livet och gett mig modet att drömma stort.",
      "aboutP2": "När kriget tvingade mig att lämna Syrien sökte jag skydd i Sverige. Där fann jag nya horisonter och började arbeta hårt för att förverkliga mina drömmar. Jag studerade, och studerar fortfarande, och har fått stöd, kunskap, förtroende och kärlek från människor längs vägen. Efter dessa år i Sverige, och de erfarenheter och relationer jag byggt, började jag fundera på ett sätt att ge tillbaka — och så föddes STEP1FILM.",
      "aboutP3": "STEP1FILM är en plattform för att stötta nästa generations filmskapare i deras första projekt, och en mötesplats för dem som söker kontakt med konstnärer och tekniker inom filmbranschen — för att hjälpa dem genom resan att producera sin första film, från idé till distribution på biografer och festivaler. Det första steget är det svåraste. Inte för att idéerna saknas, utan för att vägen dit sällan står skriven någonstans: vem man ska fråga, vad ett projekt kostar, i vilken ordning sakerna ska göras. Det är där vi kommer in.",
      "aboutP4": "Om du har en idé du tror starkt på men inte vet hur du ska ta nästa steg, eller saknar ett nätverk inom filmbranschen, hjälper vi gärna till. Vi kan vägleda dig genom processen, hjälpa dig lägga upp en plan, och koppla ihop dig, så långt det är möjligt, med rätt personer för din film.",
      "aboutP5": "Att göra film är en resa som sällan görs ensam. Om vi kan bidra med vår kunskap, erfarenhet eller våra kontakter, gör vi det gärna. Tveka inte att höra av dig: ett enkelt samtal kan vara starten på din nästa film.",
      "aboutStoryHead": "Berättelsen bakom",
      "aboutShort1": "STEP1FILM är ett filmproduktions- och utvecklingsbolag i Småland. Vi gör egna filmer och hjälper andra att ta sitt första steg — från idé till färdig film.",
      "aboutShort2": "Bakom bolaget står Ayman Hassdo. Han föddes i nordöstra Syrien, kom till Sverige när kriget tvingade honom att lämna, och byggde STEP1FILM som ett sätt att ge tillbaka av det han själv fick hjälp med. <a href=\"/om-step1/\" target=\"_blank\" rel=\"noopener\">Hela berättelsen finns här.</a>",
      "omKicker": "Om bolaget",
      "omTitle": "Om STEP<em>1</em>FILM",
      "omWhy": "Varför vi finns",
      "bopBack": "← Till startsidan",
      "bopKicker": "Långfilmsdokumentär · STEP1FILM",
      "bopUnder": "Långfilmsdokumentär av Ayman Hassdo, i samproduktion med Story AB.",
      "bopFStatus": "Status",
      "bopVStatus": "I produktion",
      "bopFYear": "År",
      "bopFFormat": "Format",
      "bopVFormat": "Långfilmsdokumentär",
      "bopFRuntime": "Speltid",
      "bopFRatio": "Bildformat",
      "bopFAudience": "Publik",
      "bopVAudience": "Från 15 år",
      "bopStatusHead": "Status och produktion",
      "bopStatus1": "Större delen av filmen är inspelad och en råklippning finns. Arbetet fortsätter med kompletterande inspelning och slutklippning.",
      "bopStatus2": "Vi söker finansiering för att färdigställa filmen och en producent som vill ansluta till teamet. Parallellt sätter vi samman gruppen som ska göra efterarbetet.",
      "bopCProducer": "Producent",
      "bopCDopSyria": "Foto i Syrien",
      "bopCCamSyria": "Kamera i Syrien",
      "bopCCamera": "Kamera",
      "bopCResearchSe": "Research och kamera i Sverige",
      "bopCCamSe": "Kamera i Sverige",
      "bopCConsultant": "Konsult",
      "bopCDramaturg": "Konsult och dramaturg",
      "bopCMentor": "Mentor",
      "bopCSound": "Ljuddesign",
      "bopCMusic": "Musik",
      "bopCCoord": "Produktionskoordinator",
      "bopCFolk": "Research i syrisk folkmusik",
      "bopFCoprod": "Samproduktion",
      "bopSupportHead": "Med stöd av",
      "bopSupportNames": "Film i Region Jönköping, Gaze ”Talent to Watch”, Längmanska kulturfonden",
      "bopTrailer": "Trailer",
      "bopPlay": "Spela trailern",
      "bopPlayAria": "Spela trailern till Birds of Passage",
      "bopSynopsis": "Synopsis",
      "bopSyn1": "Efter att ha kommit till Sverige som flykting från Syrien, och så småningom fått hit sin fru och sina barn, dras regissören Ayman Hassdo in i en infekterad vårdnadstvist där ingenting är som det ser ut.",
      "bopStills": "Bilder",
      "bopCredits": "Medverkande",
      "bopCDirector": "Regi och produktion",
      "bopCCoprod": "Samproduktion",
      "bopContact": "Skriv till Ayman",
      "bopContactNote": "Frågor om filmen, visningar eller samarbete.",
      "ctaRead": "Läs om",
      "readAria": "Läs om Birds of Passage",
      "aboutQuote": "Avslutningsvis vill jag dela något jag lärt mig: ”Om dina drömmar inte skrämmer dig, är de kanske inte stora nog.”",
      "aboutPitch": "Pitcha din idé i några rader — var projektet står, vad det handlar om och en länk till ditt material. Sedan tar vi ett onlinemöte och lägger en plan. ;)",
      "reelHead": "Klipp",
      "reelSoon": "Klipp kommer",
      "reelPrev": "Föregående klipp",
      "reelNext": "Nästa klipp",
      "reelList": "Välj klipp",
      "p3Title": "Vad vi gör",
      "p3Meta": "Från första samtalet till färdig mix",
      "p3Intro": "Ett filmproduktions- och utvecklingsbolag som hjälper berättelser att ta sitt första steg.",
      "aboutMail": "Skriv till Ayman",
      "doMake": "Vi gör",
      "doMake1": "Dokumentär",
      "doMake2": "Kortfilm",
      "doMake3": "Reklam/uppdragsfilm",
      "doMake4": "Filmproduktion från idé till färdig film",
      "doDev": "Vi utvecklar",
      "doDev1": "Manus",
      "doDev2": "Filmprojekt",
      "doDev3": "Nya filmskapare",
      "doDev4": "Workshops & filmutbildning",
      "p4Title": "CV",
      "p4Meta": "Filmer · Utvald av · I media · Utbildning",
      "cvFilms": "Filmer",
      "cvSelected": "Utvald av",
      "cvMedia": "I media",
      "cvEducation": "Utbildning",
      "cvRuntime": "Speltid",
      "pq1": "Vi ser stor potential i filmen som visar en unik sida av den svåra processen att fly krig och anpassa sig till ett nytt samhälle.",
      "pq1a": "GAZE — Region Jönköpings län",
      "pq1m": "Talangprogrammet GAZE",
      "pq2": "Jag har aldrig tidigare träffat en person som varit så driven som han.",
      "pq2a": "Kjell Frick — medielärare",
      "pq2m": "SVT Nyheter Jönköping",
      "pq3": "En dokumentärfilm om hur det är att lära sig ett nytt språk.",
      "pq3m": "Sveriges Radio P4",
      "p5Title": "Nu<br>kör vi",
      "contactIntro": "Genom våra kontakter kan vi hjälpa dig med din film, boka föreläsare, ordna workshops eller utveckla kulturella appar. Har du något annat på gång — eller bara en fråga som inte riktigt passar in någon annanstans? Skriv ändå, så hör vi av oss.",
      "cfName": "Namn",
      "cfEmail": "E-post",
      "cfLink": "Länk <em>valfritt</em>",
      "cfOptional": "valfritt",
      "cfPitch": "Ditt meddelande",
      "cfSend": "Skicka",
      "cfSending": "Skickar …",
      "cfOk": "Tack! Mejlet är skickat — du hör från oss.",
      "cfFail": "Det gick inte att skicka just nu. Mejla oss direkt:",
      "cfMissing": "Fyll i namn, e-post och ditt meddelande.",
      "cfBadEmail": "Kontrollera e-postadressen.",
      "crBased": "Baserad i",
      "crBasedVal": "Småland",
      "navFilms": "Utvalda arbeten",
      "navAbout": "Varför vi finns",
      "navPractice": "Vad vi gör",
      "navAwards": "Vad vi gör",
      "navPress": "CV",
      "navContact": "Kontakt",
      "navAria": "Sektionsnavigering",
      "prevSection": "Föregående sektion",
      "nextSection": "Nästa sektion",
      "footCopy": "© 2026 STEP1FILM · Småland, Sverige"
    },
    "en": {
      "skip": "Skip to content",
      "homeAria": "STEP1FILM — home",
      "storeLink": "STORE",
      "storeLinkAria": "STEP1FILM Store",
      "skipIntro": "SKIP INTRO",
      "skipIntroAria": "Skip intro and enter site",
      "loaderLabel": "ROLL &nbsp;·&nbsp; SOUND &nbsp;·&nbsp; ACTION",
      "rotateTitle": "Turn your device",
      "rotateBody": "Landscape gives you the full version — the same one you get on a computer.",
      "rotateStay": "Stay as it is",
      "playShowreel": "PLAY SHOWREEL",
      "showreel": "Showreel",
      "enterSite": "Enter site",
      "introPlace": "Film production in Småland and Jönköping County.",
      "introDoes": "Documentary · short film · commissioned film · development",
      "heroTag": "Stories from people",
      "p1Title": "Selected<br>Works",
      "p1Meta": "Documentary · Short film · Commercial · Digital lab · Web shop",
      "playTrailer": "Play trailer",
      "logosSoon": "Collaborations",
      "postersSoon": "Posters",
      "f1Type": "Documentary · In progress",
      "f1Syn": "A feature-length documentary · Runtime 80 min · Co-produced with Story AB",
      "f2Type": "Research & development",
      "f2Title": "I HAVE TWO MOTHERS",
      "f2Syn": "In research and development.",
      "f3Type": "Shorts · Documentary · Commercial",
      "f3Title": "FILMS",
      "f3Syn": "Short films, documentaries and commissioned work for Swedish brands — from Nya ord to The Mind’s Eye, Otyg and Together We Create Harmony.",
      "labSign": "DIGITAL LAB",
      "f4Type": "Digital lab",
      "f4Title": "STEP<em>1</em> DIGITAL LAB",
      "f4Syn": "From music to digital art, web development and workshops — a free lab where ideas get tested before they become film.",
      "f5Year": "Store",
      "f5Type": "Merch · Print",
      "f5Syn": "Everything is designed for STEP1 STORE and printed only when you order. Fresh pieces — and nothing left over.",
      "storeAria": "STEP1 Store — merch, caps and mugs",
      "ctaFilms": "Films",
      "ctaShopping": "Shop",
      "closeTrailer": "Close the trailer",
      "p2Title": "Why<br>we exist",
      "portraitCap": "Photo by Joel Arvidsson · Småland, Sweden",
      "aboutP1": "I was born in north-eastern Syria, in a relatively arid region rich in human, linguistic and cultural diversity. What shaped me most was the warmth, generosity and care of its people — values that have stayed with me throughout my life and gave me the courage to dream big.",
      "aboutP2": "When war forced me to leave Syria, I found refuge in Sweden. There I found new horizons and began working hard to achieve my dreams. I studied, and I’m still studying, and I’ve received support, knowledge, trust and love from people along the way. After these years in Sweden, and the experiences and relationships I’ve built, I started thinking of a way to give back — and that’s how STEP1FILM came to be.",
      "aboutP3": "STEP1FILM is a platform to support the next generation of filmmakers in their first projects, and a meeting point for those seeking to connect with artists and technicians in filmmaking — helping them through the journey of producing their first film, from writing the idea to distributing it in theatres and festivals. The first step is the hardest one. Not for any lack of ideas, but because the way there is rarely written down anywhere: who to ask, what a project costs, in what order things need to happen. That is where we come in.",
      "aboutP4": "If you have an idea you believe in strongly but don’t know how to take the next step, or lack a network in the film industry, we’d be glad to help. We can guide you through the process, help you build a plan, and connect you, as much as possible, with the right people for your film.",
      "aboutP5": "Filmmaking is a journey rarely completed alone. If we can contribute our knowledge, experience or connections, we’d be happy to. Don’t hesitate to reach out: a simple conversation could be the start of your next film.",
      "aboutStoryHead": "The story behind",
      "aboutShort1": "STEP1FILM is a film production and development company in Småland, Sweden. We make our own films and help others take their first step — from idea to finished film.",
      "aboutShort2": "Behind the company is Ayman Hassdo. He was born in north-eastern Syria, came to Sweden when war forced him to leave, and built STEP1FILM as a way of giving back what he was once helped with. <a href=\"/om-step1/\" target=\"_blank\" rel=\"noopener\">The full story is here.</a>",
      "omKicker": "About the company",
      "omTitle": "About STEP<em>1</em>FILM",
      "omWhy": "Why we exist",
      "bopBack": "← Back to the start page",
      "bopKicker": "Feature-length documentary · STEP1FILM",
      "bopUnder": "A feature-length documentary by Ayman Hassdo, co-produced with Story AB.",
      "bopFStatus": "Status",
      "bopVStatus": "In production",
      "bopFYear": "Year",
      "bopFFormat": "Format",
      "bopVFormat": "Feature-length documentary",
      "bopFRuntime": "Running time",
      "bopFRatio": "Aspect ratio",
      "bopFAudience": "Audience",
      "bopVAudience": "15+ adult",
      "bopStatusHead": "Status and production",
      "bopStatus1": "The majority of the film has already been shot and a rough cut is available. Work continues with additional scenes and the final edit.",
      "bopStatus2": "We are seeking funding to complete the film and a producer to join the team. In parallel we are assembling the group who will carry out post-production.",
      "bopCProducer": "Producer",
      "bopCDopSyria": "DOP in Syria",
      "bopCCamSyria": "Camera in Syria",
      "bopCCamera": "Camera",
      "bopCResearchSe": "Research & camera in Sweden",
      "bopCCamSe": "Camera in Sweden",
      "bopCConsultant": "Consultant",
      "bopCDramaturg": "Consultant & dramaturg",
      "bopCMentor": "Mentor",
      "bopCSound": "Sound designer",
      "bopCMusic": "Music composer",
      "bopCCoord": "Production coordinator",
      "bopCFolk": "Research in Syrian folk music",
      "bopFCoprod": "Co-production",
      "bopSupportHead": "With support",
      "bopSupportNames": "Film i Region Jönköping, Gaze ”Talent to Watch”, Längmanska kulturfonden",
      "bopTrailer": "Trailer",
      "bopPlay": "Play the trailer",
      "bopPlayAria": "Play the Birds of Passage trailer",
      "bopSynopsis": "Synopsis",
      "bopSyn1": "After coming to Sweden as a refugee from Syria and eventually bringing his wife and children there, director Ayman Hassdo finds himself drawn into a contentious custody dispute where everything is not as it seems.",
      "bopStills": "Stills",
      "bopCredits": "Credits",
      "bopCDirector": "Director & producer",
      "bopCCoprod": "Co-production",
      "bopContact": "Write to Ayman",
      "bopContactNote": "Questions about the film, screenings or collaboration.",
      "ctaRead": "Read more",
      "readAria": "Read about Birds of Passage",
      "aboutQuote": "Finally, I’d like to share something I’ve learned: “If your dreams don’t scare you, they’re probably not big enough.”",
      "aboutPitch": "Pitch your idea in a few lines — where the project stands, what it is about, and a link to your material. Then we have an online meeting and make a plan. ;)",
      "reelHead": "Clips",
      "reelSoon": "Clips coming",
      "reelPrev": "Previous clip",
      "reelNext": "Next clip",
      "reelList": "Choose clip",
      "p3Title": "What we do",
      "p3Meta": "From first call to final mix",
      "p3Intro": "A film production and development company that helps stories take their first step.",
      "aboutMail": "Write to Ayman",
      "doMake": "We make",
      "doMake1": "Documentary",
      "doMake2": "Short film",
      "doMake3": "Commercials / commissioned film",
      "doMake4": "Film production from idea to finished film",
      "doDev": "We develop",
      "doDev1": "Screenplays",
      "doDev2": "Film projects",
      "doDev3": "New filmmakers",
      "doDev4": "Workshops & film education",
      "p4Title": "CV",
      "p4Meta": "Films · Selected by · In the media · Education",
      "cvFilms": "Films",
      "cvSelected": "Selected by",
      "cvMedia": "In the media",
      "cvEducation": "Education",
      "cvRuntime": "Runtime",
      "pq1": "We see great potential in the film, which shows a unique side of the difficult process of fleeing war and adapting to a new society.",
      "pq1a": "GAZE — Region Jönköpings län",
      "pq1m": "The GAZE talent programme",
      "pq2": "I have never met anyone as driven as he is.",
      "pq2a": "Kjell Frick — media teacher",
      "pq2m": "SVT Nyheter Jönköping",
      "pq3": "A documentary about what it is like to learn a new language.",
      "pq3m": "Sveriges Radio P4",
      "p5Title": "Let’s<br>Work",
      "contactIntro": "Through our network we can help you with your film, book speakers, arrange workshops or develop cultural apps. Something else in the works — or just a question that doesn’t quite fit anywhere else? Write anyway, and we’ll get back to you.",
      "cfName": "Name",
      "cfEmail": "Email",
      "cfLink": "Link <em>optional</em>",
      "cfOptional": "optional",
      "cfPitch": "Your message",
      "cfSend": "Send",
      "cfSending": "Sending …",
      "cfOk": "Thank you! Your message is on its way — you will hear from us.",
      "cfFail": "That did not go through. Email us directly:",
      "cfMissing": "Please fill in name, email and your message.",
      "cfBadEmail": "Please check the email address.",
      "crBased": "Based in",
      "crBasedVal": "Småland",
      "navFilms": "Selected Works",
      "navAbout": "Why We Exist",
      "navPractice": "What We Do",
      "navAwards": "What We Do",
      "navPress": "CV",
      "navContact": "Contact",
      "navAria": "Section navigation",
      "prevSection": "Previous section",
      "nextSection": "Next section",
      "footCopy": "© 2026 STEP1FILM · Småland, Sweden"
    }
  };
  /* ADMIN:SLUT texter */

  /* Svenska är standard. Sajten säljer och söker uppdrag i Sverige,
   så det är svenska sökord den ska rankas på — och en svensk besökare
   ska inte behöva byta språk först. Engelskan finns ett klick bort och
   sparas när den väljs, så internationella besökare slipper välja om.
   HÅLL I SYNK med lang-attributet i index.html.

   De svenska strängarna står dessutom skrivna i index.html och
   store.html. Skriptet skriver samma text en gång till vid
   inladdning — det syns inte, och poängen är den som inte kör
   skriptet: en sökmotors första avläsning ska möta svenska på en
   sida som säger lang="sv", inte engelska. Ändras en svensk text
   här bör motsvarande rad i HTML-filen ändras med den. */
  /* -----------------------------------------------------
     VILKET SPRÅK BESÖKAREN MÖTS AV
     -----------------------------------------------------
     Har besökaren själv tryckt SV eller EN gäller det valet, alltid.
     Först när inget val finns lagrat gissar vi: är besökaren i
     Sverige blir det svenska, annars engelska.

     Gissningen görs på enhetens tidszon, inte på en IP-uppslagning.
     Tidszonen finns redan i webbläsaren — ingen förfrågan lämnar
     sajten, ingen tjänst att betala för, ingenting att vänta på, och
     inga personuppgifter som passerar en tredje part. Europe/Stockholm
     är Sveriges enda zon, så träffen är exakt.

     Saknas tidszonen (mycket gamla webbläsare) faller vi tillbaka på
     webbläsarens språklista. Den säger vad besökaren läser, inte var
     hen är — sämre för frågan "är jag i Sverige?", men bättre än
     ingenting.

     Obs: den serverade HTML:en är och förblir svensk, och sidan säger
     lang="sv" tills skriptet kört. Det betyder att en sökmotor som
     kör JavaScript från en server utanför Sverige nu får se den
     engelska texten. Vill du att Google alltid ska läsa svenska är
     det det här blocket som ska bort. */
  function gissaSprak() {
    try {
      const zon = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (zon) return zon === 'Europe/Stockholm' ? 'sv' : 'en';
    } catch {}
    const listan = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || ''];
    return listan.some(l => String(l).toLowerCase().startsWith('sv')) ? 'sv' : 'en';
  }

  let lang = null;
  try { lang = localStorage.getItem('s1f_lang'); } catch {}
  if (lang !== 'sv' && lang !== 'en') lang = gissaSprak();

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

    /* Rader som bara hör hemma på svenska. Orten — Småland, Jönköpings
       län — säger något för den som läser svenska och ingenting för den
       som inte gör det, så den ska inte stå kvar i den engelska
       versionen. Texten ligger kvar i DOM:en och byts som vanligt; det
       är bara synligheten som följer språket. */
    document.querySelectorAll('[data-i18n-sv-only]').forEach(el => {
      el.hidden = lang !== 'sv';
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
    try { localStorage.setItem('s1f_lang', l); } catch {}
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
