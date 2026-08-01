/* =====================================================
   STEP1FILM — sajtens innehåll
   =====================================================
   ⚠️ REDIGERAS I ADMIN: step1film.se/admin

   Allt mellan ADMIN:START och ADMIN:SLUT skrivs om av
   adminsidan varje gång du sparar. Skriv inget för hand
   där inne och lägg inga kommentarer i blocket — de
   försvinner vid nästa sparning. Behöver du anteckna
   något, gör det här ovanför markören.

   Filen ligger separat i stället för inbakad i index.html
   på grund av säkerhetsheadern i netlify.toml: den tillåter
   bara skript från den egna sajten, och ett <script> direkt
   i sidan hade blockerats.

   -----------------------------------------------------
   VAD DE OLIKA LISTORNA STYR
   -----------------------------------------------------
   STEP1FILM_VIDEO       Showreelen i heron. `aspect` är filmens egen
                         bredd/höjd och används bara som startvärde tills
                         Vimeo svarat med sina riktiga mått — rutan ska
                         vara rätt redan första sekunden.
                         2.39 cinemascope · 2.35 widescreen
                         2.00 univisium   · 1.78 vanlig 16:9

   STEP1FILM_EMBEDS      Trailern på panel 02 (film-001). Tom id-sträng
                         ger texten "Trailer kommer" i stället.

   STEP1FILM_REEL        Klippspelaren på panel 01. Varje klipp spelar
                         30 sekunder och lämnar sedan över till nästa.
                         Längden sitter i SEKUNDER i main.js.

   STEP1FILM_CLIENTS     Logotyperna på praxinoskoptrumman. Filerna i
                         assets/clients/ är tvättade: vit siluett på
                         genomskinlig botten, alla i samma optiska
                         storlek. En ny logga behöver samma behandling,
                         annars sticker den ut i färg och storlek.
                         `name` blir alt-text för skärmläsare.

   STEP1FILM_FILMOGRAPHY Filmerna. Visas i CV-panelen med speltid och
                         not. `note` visas bara där.

   STEP1FILM_SELECTED    CV-panelen: utvald av.

                         Festivaler och stöd hade egna listor förut men är
                         borta. Festivalvisningarna står i respektive films
                         `note` — samma uppgifter på ett ställe i stället för
                         två. Story AB nämns där filmen presenteras, på
                         panel 02, och biblioteket i Vaggeryd står kvar under
                         STEP1FILM_CV.

   STEP1FILM_EDUCATION   Utbildning. Ligger kvar som underlag men visas
                         inte längre någonstans — spalten togs bort från
                         både Drömmen och CV-panelen. Sparad så att den
                         går att ta in igen utan att skrivas om.

   STEP1FILM_CV          Erfarenhet. Visas inte heller just nu.

   STEP1FILM_POSTERS     Affischerna på panel 02. De tonar in och ut, var
                         och en på sin plats: en i mitten, två delar
                         rutan, tre står vänster/mitten/höger. Fler än
                         tre går men börjar trängas. Tom lista ger
                         "Bilder kommer".

   Fält som finns i två språk skrivs { sv: '…', en: '…' }. Ett fält som
   är samma på båda språken får stå som en vanlig sträng.
   ===================================================== */

/* ADMIN:START innehall */
window.STEP1FILM_VIDEO = {
  "provider": "vimeo",
  "id": "1213253177",
  "aspect": 2.35
};

window.STEP1FILM_EMBEDS = {
  "film-001": {
    "provider": "vimeo",
    "id": "1158214964",
    "hash": "c2727eaa5d",
    "title": "Birds Of Passage — official trailer"
  }
};

window.STEP1FILM_REEL = [
  {
    "id": "469092414",
    "title": "THE MIND’S EYE — trailer"
  },
  {
    "id": "529274561",
    "title": "Fusion — Vem kan segla & Ya Msafer"
  },
  {
    "id": "135358398",
    "title": "NYA ORD — trailer, 2015"
  },
  {
    "id": "1174493683",
    "title": "Värnamo Filmhistoriska Vänner"
  }
];

window.STEP1FILM_CLIENTS = [
  {
    "src": "assets/clients/arcus.webp",
    "name": "Arcus Utbildning & Jobbförmedling"
  },
  {
    "src": "assets/clients/kinnarps.webp",
    "name": "Kinnarps"
  },
  {
    "src": "assets/clients/hemkop.webp",
    "name": "Hemköp"
  },
  {
    "src": "assets/clients/vaggeryds-kommun.webp",
    "name": "Vaggeryds kommun"
  },
  {
    "src": "assets/clients/traningsmagasinet.webp",
    "name": "Träningsmagasinet"
  },
  {
    "src": "assets/clients/hallstorps-bil.webp",
    "name": "Hällstorps Bil"
  },
  {
    "src": "assets/clients/home-care.webp",
    "name": "Home Care"
  },
  {
    "src": "assets/clients/brightness-au.webp",
    "name": "Brightness Au"
  },
  {
    "src": "assets/clients/partner-08.webp",
    "name": ""
  },
  {
    "src": "assets/clients/partner-09.webp",
    "name": ""
  }
];

window.STEP1FILM_FILMOGRAPHY = [
  {
    "year": "2015–2016",
    "title": "NYA ORD",
    "subtitle": "New Words",
    "format": {
      "sv": "Dokumentär · pedagogik, komedi, musik, resa",
      "en": "Documentary · educational, comedy, music, travel"
    },
    "runtime": "48 min"
  },
  {
    "year": "2020–2021",
    "title": "THE MIND’S EYE",
    "format": {
      "sv": "Kortfilm · drama",
      "en": "Short film · drama"
    },
    "runtime": "05 min",
    "note": {
      "sv": "Official selection — CortoDino Film Festival, X Edizione, Neapel, 23 november 2020. Semifinal — Festival del Cinema di Cefalù, Palermo, 23 november 2020.",
      "en": "Official selection — CortoDino Film Festival, X Edizione, Naples, 23 November 2020. Semi-final — Festival del Cinema di Cefalù, Palermo, 23 November 2020."
    }
  },
  {
    "year": "2021–2022",
    "title": "TOGETHER WE CREATE HARMONY",
    "format": {
      "sv": "Musik och kort 3D-film",
      "en": "Music and a short 3D film"
    },
    "runtime": "04 min",
    "note": {
      "sv": "Allt började med en fråga: kan olika noter mötas och skapa harmoni? Vi lät en orientalisk sång i bayati-skalan möta en svensk. De harmonierade vackert.",
      "en": "It started with one question: can different notes meet and create harmony? We let an oriental song in the bayati scale meet a Swedish one. They harmonised beautifully."
    }
  },
  {
    "year": "2022–2023",
    "title": "OTYG",
    "format": {
      "sv": "Kortfilm",
      "en": "Short film"
    },
    "runtime": "09 min",
    "note": {
      "sv": "Pitchad på Värnamo Filmhistoriska Festival och visad på två filmfestivaler online. Manus till en långfilm är under utveckling.",
      "en": "Pitched at the Värnamo Film History Festival and shown at two online film festivals. A feature-length script is in development."
    }
  },
  {
    "year": "2026–2027",
    "title": "BIRDS OF PASSAGE",
    "format": {
      "sv": "Långfilmsdokumentär",
      "en": "Feature-length documentary"
    },
    "status": {
      "sv": "Pågående",
      "en": "In progress"
    },
    "note": {
      "sv": "Samproduktion: Story AB",
      "en": "Co-production: Story AB"
    }
  }
];

window.STEP1FILM_SELECTED = [
  {
    "year": "",
    "what": "GAZE",
    "where": {
      "sv": "Talangprogram · Region Jönköpings län",
      "en": "Talent programme · Region Jönköping County"
    }
  },
  {
    "year": "",
    "what": "SVT Nyheter Jönköping",
    "where": {
      "sv": "Reportage",
      "en": "Feature"
    }
  },
  {
    "year": "",
    "what": "Sveriges Radio P4",
    "where": {
      "sv": "Reportage",
      "en": "Feature"
    }
  }
];

window.STEP1FILM_EDUCATION = [
  {
    "year": {
      "sv": "Sep–okt 2024",
      "en": "Sep–Oct 2024"
    },
    "what": {
      "sv": "Samordning och projektansökningar",
      "en": "Coordination and grant applications"
    },
    "where": {
      "sv": "Intensivkurs på distans · Tornedalens folkhögskola",
      "en": "Intensive course, distance · Tornedalen folk high school"
    }
  },
  {
    "year": "2020–2023",
    "what": {
      "sv": "Kandidat, filmfoto",
      "en": "Bachelor, cinematography"
    },
    "where": {
      "sv": "Egypten · distans",
      "en": "Egypt · distance"
    }
  },
  {
    "year": "2016–2017",
    "what": {
      "sv": "Dokumentärfilm",
      "en": "Documentary film"
    },
    "where": {
      "sv": "Ölands folkhögskola · Öland, Sverige",
      "en": "Ölands folk high school · Öland, Sweden"
    }
  },
  {
    "year": "2016",
    "what": {
      "sv": "Manusskrivarveckan",
      "en": "Screenwriting week"
    },
    "where": {
      "sv": "Workshop arrangerad av Råfilm",
      "en": "Workshop organised by Råfilm"
    }
  },
  {
    "year": "2013–2015",
    "what": {
      "sv": "Media och produktion, svenska",
      "en": "Media and production, Swedish"
    },
    "where": {
      "sv": "Fenix · Vaggeryd",
      "en": "Fenix · Vaggeryd"
    }
  },
  {
    "year": "2007–2009",
    "what": {
      "sv": "Musikinstitutet",
      "en": "Music Institute"
    },
    "where": {
      "sv": "Damaskus, Syrien",
      "en": "Damascus, Syria"
    }
  },
  {
    "year": "2007",
    "what": {
      "sv": "Gymnasium",
      "en": "Upper secondary school"
    },
    "where": {
      "sv": "Al-Hasakah, Syrien",
      "en": "Al-Hasakah, Syria"
    }
  },
  {
    "year": "2005",
    "what": {
      "sv": "Kortare IT-kurser",
      "en": "Short IT courses"
    },
    "where": {
      "sv": "Syrien",
      "en": "Syria"
    }
  }
];

window.STEP1FILM_CV = [
  {
    "year": "2017–2020",
    "role": {
      "sv": "Fritidshem / pedagog",
      "en": "After-school centre / educator"
    },
    "where": {
      "sv": "Film och musik för barn F–3, Vaggeryds kommun",
      "en": "Film and music for children, years F–3, Vaggeryd municipality"
    }
  },
  {
    "year": {
      "sv": "Sedan 2016",
      "en": "Since 2016"
    },
    "role": {
      "sv": "Reklam- och infofilm",
      "en": "Commercial and information film"
    },
    "where": {
      "sv": "Uppdrag för svenska varumärken",
      "en": "Commissions for Swedish brands"
    }
  },
  {
    "year": "2015 / 2017",
    "role": {
      "sv": "Filmprojektledare",
      "en": "Film project leader"
    },
    "where": {
      "sv": "I samarbete med biblioteket i Vaggeryd",
      "en": "In collaboration with Vaggeryd library"
    }
  },
  {
    "year": "2008–2010",
    "role": {
      "sv": "Lärare",
      "en": "Teacher"
    },
    "where": {
      "sv": "Kulturskolan, Syrien",
      "en": "The culture school, Syria"
    }
  }
];

window.STEP1FILM_POSTERS = {
  "shorts": [
    "assets/films/posters/nya-ord.jpg",
    "assets/films/posters/minds-eye.jpg",
    "assets/films/posters/otyg.jpg"
  ],
  "mammor": []
};
/* ADMIN:SLUT innehall */
