/* =====================================================
   STEP1FILM ADMIN
   =====================================================
   Sidan är bara ett formulär. All kontroll ligger i
   Netlify-funktionerna: lösenordet prövas där, GitHub-
   token finns bara där, och bara vitlistade filer går
   att skriva. Kommer du åt den här filen har du inte
   kommit åt något.

   Sessionsnyckeln ligger i sessionStorage, inte
   localStorage — då dör den när fliken stängs.
   ===================================================== */
(function () {
  'use strict';

  const API = 'https://step1film.netlify.app/.netlify/functions';
  const NYCKEL_LAGER = 's1f_admin_session';

  /* Sajtens rådata. Fylls av admin-load, skickas tillbaka av admin-save. */
  const S = { texter: null, innehall: null, produkter: null, varianter: null };
  const andrad = { texter: false, innehall: false, produkter: false };

  /* -----------------------------------------------------
     Småplock
  ----------------------------------------------------- */
  const $  = (v, r = document) => r.querySelector(v);
  const $$ = (v, r = document) => Array.from(r.querySelectorAll(v));

  function el(tagg, klass, text) {
    const e = document.createElement(tagg);
    if (klass) e.className = klass;
    if (text != null) e.textContent = text;
    return e;
  }

  let ropTimer;
  function rop(text, sort) {
    const box = $('#rop');
    box.textContent = text;
    box.className = sort || '';
    box.hidden = false;
    clearTimeout(ropTimer);
    if (sort !== 'vantar') ropTimer = setTimeout(() => { box.hidden = true; }, 5200);
  }

  function markera(del) {
    if (del in andrad) andrad[del] = true;
    visaStatus();
  }

  function visaStatus() {
    const kvar = Object.keys(andrad).filter(k => andrad[k]);
    const e = $('#sparStatus');
    if (!kvar.length) { e.textContent = ''; e.className = 'sparstatus'; return; }
    e.textContent = 'Osparade ändringar';
    e.className = 'sparstatus andrad';
  }

  /* Varning innan man lämnar med osparat i formuläret */
  window.addEventListener('beforeunload', (e) => {
    if (Object.values(andrad).some(Boolean)) { e.preventDefault(); e.returnValue = ''; }
  });

  /* -----------------------------------------------------
     Anrop
  ----------------------------------------------------- */
  const nyckel = () => sessionStorage.getItem(NYCKEL_LAGER) || '';

  async function be(vag, init = {}) {
    const svar = await fetch(API + vag, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Session': nyckel(),
        ...(init.headers || {})
      }
    });
    let data = {};
    try { data = await svar.json(); } catch { /* tomt svar */ }
    if (svar.status === 401) { loggaUt(true); throw new Error('Sessionen har gått ut. Logga in igen.'); }
    if (!svar.ok) throw new Error(data.fel || `Något gick fel (${svar.status}).`);
    return data;
  }

  /* -----------------------------------------------------
     Inloggning
  ----------------------------------------------------- */
  $('#grindForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const knapp = $('#grindKnapp');
    const fel = $('#grindFel');
    fel.hidden = true;
    knapp.disabled = true;
    knapp.textContent = 'Loggar in …';
    try {
      const svar = await fetch(API + '/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ losenord: $('#grindLosen').value })
      });
      const data = await svar.json();
      if (!svar.ok) throw new Error(data.fel || 'Inloggningen gick inte igenom.');
      sessionStorage.setItem(NYCKEL_LAGER, data.session);
      $('#grindLosen').value = '';
      await start();
    } catch (er) {
      fel.textContent = er.message;
      fel.hidden = false;
    } finally {
      knapp.disabled = false;
      knapp.textContent = 'Logga in';
    }
  });

  function loggaUt(tyst) {
    sessionStorage.removeItem(NYCKEL_LAGER);
    $('#admin').hidden = true;
    $('#grind').hidden = false;
    Object.keys(andrad).forEach(k => { andrad[k] = false; });
    if (!tyst) rop('Utloggad.');
  }
  $('#loggaUt').addEventListener('click', () => {
    if (Object.values(andrad).some(Boolean) &&
        !confirm('Du har osparade ändringar. Logga ut ändå?')) return;
    loggaUt();
  });

  async function start() {
    rop('Hämtar innehållet …', 'vantar');
    const d = await be('/admin-load');
    S.texter    = d.texter;
    S.innehall  = d.innehall;
    S.produkter = d.produkter;
    S.varianter = d.varianter || {};
    $('#grind').hidden = true;
    $('#admin').hidden = false;
    ritaTexter();
    ritaFilmer();
    ritaVideo();
    ritaProdukter();
    ritaBilder();
    rop('Klart. Allt du sparar går ut på step1film.se.');
  }

  /* -----------------------------------------------------
     Flikar
  ----------------------------------------------------- */
  $('#flikar').addEventListener('click', (e) => {
    const f = e.target.closest('.flik');
    if (!f) return;
    $$('.flik').forEach(b => b.classList.toggle('active', b === f));
    $$('.del').forEach(d => d.classList.toggle('active', d.dataset.del === f.dataset.flik));
  });

  /* -----------------------------------------------------
     Spara
  ----------------------------------------------------- */
  document.addEventListener('click', async (e) => {
    const k = e.target.closest('[data-spara]');
    if (!k) return;
    const del = k.dataset.spara;
    const data = del === 'texter' ? S.texter : del === 'produkter' ? S.produkter : S.innehall;

    k.disabled = true;
    const gammalText = k.textContent;
    k.textContent = 'Sparar …';
    rop('Sparar till GitHub …', 'vantar');
    try {
      const svar = await be('/admin-save', {
        method: 'POST',
        body: JSON.stringify({ del, data })
      });
      andrad[del] = false;
      visaStatus();
      $('#sparStatus').textContent = 'Sparat · ' + svar.commit;
      $('#sparStatus').className = 'sparstatus sparad';
      rop('Sparat (' + svar.filer.join(', ') + '). Syns på sajten om ungefär en minut.');
    } catch (er) {
      rop(er.message, 'fel');
    } finally {
      k.disabled = false;
      k.textContent = gammalText;
    }
  });

  /* =====================================================
     TEXTER
     =====================================================
     Nycklarna grupperas som de gjorde i i18n.js innan
     admin tog över filen. Nycklar som inte finns i någon
     grupp hamnar under Övrigt — då syns de ändå.
  ===================================================== */
  const TEXTGRUPPER = [
    ['Hero och ramverk', ['skip', 'homeAria', 'storeLink', 'storeLinkAria', 'skipIntro', 'skipIntroAria',
      'loaderLabel', 'rotateTitle', 'rotateBody', 'rotateStay', 'playShowreel', 'showreel', 'enterSite', 'heroTag']],
    ['Panel 02 — Utvalda arbeten', ['p1Title', 'p1Meta', 'trailerSoon', 'playTrailer', 'logosSoon', 'postersSoon',
      'stillsSoon', 'f1Type', 'f1Syn', 'f2Type', 'f2Title', 'f2Syn', 'f3Type', 'f3Title', 'f3Syn',
      'labSign', 'f4Type', 'f4Title', 'f4Syn', 'f5Year', 'f5Type', 'f5Syn', 'storeAria',
      'ctaWatch', 'ctaFilms', 'ctaSoon', 'ctaShopping', 'watchAria', 'closeTrailer']],
    ['Panel 01 — Drömmen', ['p2Title', 'portraitCap', 'aboutP1', 'aboutP2', 'aboutP3', 'aboutP4', 'aboutP5',
      'aboutQuote', 'aboutPitch', 'aboutMail', 'reelHead', 'reelSoon', 'reelPrev', 'reelNext', 'reelList']],
    ['Panel 03 — Vad vi kan göra', ['p3Title', 'p3Meta', 'p3Intro',
      'aw1', 'aw1d', 'aw2', 'aw2d', 'aw3', 'aw3d', 'aw4', 'aw4d', 'aw5', 'aw5d', 'aw6', 'aw6d']],
    ['Panel 04 — CV', ['p4Title', 'p4Meta', 'cvFilms', 'cvSelected', 'cvMedia', 'cvRuntime',
      'pq1', 'pq1a', 'pq1m', 'pq2', 'pq2a', 'pq2m', 'pq3', 'pq3m']],
    ['Panel 05 — Kontakt', ['p5Title', 'contactIntro', 'cfName', 'cfEmail', 'cfLink', 'cfOptional',
      'cfPitch', 'cfSend', 'cfSending', 'cfOk', 'cfFail', 'cfMissing', 'cfBadEmail', 'crBased', 'crBasedVal']],
    ['Navigering och sidfot', ['navFilms', 'navAbout', 'navPractice', 'navPress', 'navContact',
      'navAria', 'prevSection', 'nextSection', 'footCopy']]
  ];

  /* Texter som är längre än så här får en textarea i stället för en rad */
  const LANG = 90;

  function ritaTexter() {
    const box = $('#textLista');
    box.textContent = '';
    const alla = new Set([...Object.keys(S.texter.sv), ...Object.keys(S.texter.en)]);
    const tagna = new Set();

    const grupper = TEXTGRUPPER.map(([namn, nycklar]) => {
      const finns = nycklar.filter(n => alla.has(n));
      finns.forEach(n => tagna.add(n));
      return [namn, finns];
    });
    const ovriga = [...alla].filter(n => !tagna.has(n));
    if (ovriga.length) grupper.push(['Övrigt', ovriga]);

    grupper.forEach(([namn, nycklar]) => {
      if (!nycklar.length) return;
      box.appendChild(el('h3', 'grupp-rubrik', namn));
      nycklar.forEach(n => box.appendChild(textrad(n)));
    });
  }

  function textrad(n) {
    const rad = el('div', 'textrad');
    rad.dataset.nyckel = n;

    const vanster = el('div', 'textrad-nyckel');
    vanster.appendChild(el('b', null, n));
    rad.appendChild(vanster);

    ['sv', 'en'].forEach(spr => {
      const cell = el('div');
      cell.appendChild(el('span', 'sprakflagg', spr === 'sv' ? 'Svenska' : 'English'));
      const varde = S.texter[spr][n] != null ? S.texter[spr][n] : '';
      const langt = String(S.texter.sv[n] || '').length > LANG;
      const f = document.createElement(langt ? 'textarea' : 'input');
      if (!langt) f.type = 'text';
      f.value = varde;
      if (langt) f.rows = Math.min(8, Math.ceil(varde.length / 70) + 1);
      f.addEventListener('input', () => { S.texter[spr][n] = f.value; markera('texter'); });
      cell.appendChild(f);
      rad.appendChild(cell);
    });
    return rad;
  }

  $('#sokText').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    $$('#textLista .textrad').forEach(r => {
      const n = r.dataset.nyckel;
      const traff = !q || n.toLowerCase().includes(q)
        || String(S.texter.sv[n] || '').toLowerCase().includes(q)
        || String(S.texter.en[n] || '').toLowerCase().includes(q);
      r.classList.toggle('dold', !traff);
    });
    // En rubrik utan synliga rader under sig ska inte stå kvar ensam
    $$('#textLista .grupp-rubrik').forEach(h => {
      let n = h.nextElementSibling, syns = false;
      while (n && !n.classList.contains('grupp-rubrik')) {
        if (!n.classList.contains('dold')) { syns = true; break; }
        n = n.nextElementSibling;
      }
      h.style.display = syns ? '' : 'none';
    });
  });

  /* =====================================================
     GEMENSAMT KORT
  ===================================================== */
  function kort({ titel, under, marken = [], drag = true, klasser = '' }) {
    const k = el('div', 'kort ' + klasser);
    const topp = el('div', 'kort-topp');
    if (drag) {
      const h = el('span', 'drag', '⠿');
      h.title = 'Dra för att flytta';
      topp.appendChild(h);
    }
    const pil = el('span', 'pil', '›');
    topp.appendChild(pil);
    const mitt = el('div', 'kort-mitt');
    const t = el('div', 'kort-titel', titel);
    mitt.appendChild(t);
    const u = el('div', 'kort-under', under || '');
    mitt.appendChild(u);
    topp.appendChild(mitt);
    marken.forEach(m => topp.appendChild(m));
    topp.addEventListener('click', (e) => {
      if (e.target.closest('.drag')) return;
      k.classList.toggle('oppen');
    });
    k.appendChild(topp);
    const kropp = el('div', 'kort-kropp');
    k.appendChild(kropp);
    k._titel = t; k._under = u; k._kropp = kropp;
    return k;
  }

  /** Textfält kopplat till en plats i datan. */
  function falt(etikett, las, skriv, del, { textarea = false, typ = 'text', hjalp = '' } = {}) {
    const w = el('label', 'falt');
    w.appendChild(el('span', 'falt-etikett', etikett));
    const f = document.createElement(textarea ? 'textarea' : 'input');
    if (!textarea) f.type = typ;
    const v = las();
    f.value = v == null ? '' : v;
    f.addEventListener('input', () => { skriv(f.value); markera(del); });
    w.appendChild(f);
    if (hjalp) w.appendChild(el('p', 'hjalp', hjalp));
    w._falt = f;
    return w;
  }

  /** Samma fält på svenska och engelska. Objektet kan vara en ren sträng. */
  function sprakFalt(etikett, obj, nyckel, del, extra = {}) {
    const w = el('div', 'rutor rutor--sprak brett');
    ['sv', 'en'].forEach(spr => {
      w.appendChild(falt(
        etikett + ' · ' + (spr === 'sv' ? 'svenska' : 'engelska'),
        () => {
          const v = obj[nyckel];
          return (v && typeof v === 'object') ? (v[spr] || '') : (spr === 'sv' ? (v || '') : '');
        },
        (nytt) => {
          const v = obj[nyckel];
          const bas = (v && typeof v === 'object') ? v : { sv: v || '', en: v || '' };
          bas[spr] = nytt;
          obj[nyckel] = bas;
        },
        del, extra
      ));
    });
    return w;
  }

  /** Gör en lista dragbar. `efter` körs när ordningen ändrats. */
  function gorDragbar(box, lista, del, efter) {
    let fran = null;
    box.addEventListener('dragstart', (e) => {
      const k = e.target.closest('.kort');
      if (!k) return;
      fran = [...box.children].indexOf(k);
      k.classList.add('dras');
      e.dataTransfer.effectAllowed = 'move';
      // Firefox startar inte draget utan nyttolast
      e.dataTransfer.setData('text/plain', String(fran));
    });
    box.addEventListener('dragover', (e) => {
      e.preventDefault();
      const k = e.target.closest('.kort');
      $$('.kort', box).forEach(x => x.classList.toggle('over', x === k));
    });
    box.addEventListener('drop', (e) => {
      e.preventDefault();
      const k = e.target.closest('.kort');
      $$('.kort', box).forEach(x => x.classList.remove('over', 'dras'));
      if (!k || fran == null) return;
      const till = [...box.children].indexOf(k);
      if (till === fran || till < 0) return;
      lista.splice(till, 0, lista.splice(fran, 1)[0]);
      fran = null;
      markera(del);
      efter();
    });
    box.addEventListener('dragend', () => {
      $$('.kort', box).forEach(x => x.classList.remove('over', 'dras'));
      fran = null;
    });
  }

  /** Rad med Flytta upp/ned + Ta bort, för den som hellre klickar än drar. */
  function listVerktyg(lista, i, del, rita, vad) {
    const rad = el('div', 'del-verktyg');
    rad.style.marginTop = '0.8rem';
    const upp = el('button', 'knapp knapp--liten', '↑ Upp');
    const ned = el('button', 'knapp knapp--liten', '↓ Ned');
    const bort = el('button', 'knapp knapp--liten knapp--fara', 'Ta bort');
    upp.type = ned.type = bort.type = 'button';
    upp.disabled = i === 0;
    ned.disabled = i === lista.length - 1;
    upp.onclick = () => { lista.splice(i - 1, 0, lista.splice(i, 1)[0]); markera(del); rita(); };
    ned.onclick = () => { lista.splice(i + 1, 0, lista.splice(i, 1)[0]); markera(del); rita(); };
    bort.onclick = () => {
      if (!confirm(`Ta bort ${vad}? Det sparas först när du trycker Spara.`)) return;
      lista.splice(i, 1); markera(del); rita();
    };
    rad.append(upp, ned, bort);
    return rad;
  }

  const tv = (v) => (v && typeof v === 'object') ? (v.sv || v.en || '') : (v || '');

  /* =====================================================
     FILMER & CV
  ===================================================== */
  const LISTOR = [
    { nyckel: 'STEP1FILM_FILMOGRAPHY', namn: 'Filmer',      vad: 'filmen',      falt: 'film' },
    { nyckel: 'STEP1FILM_SELECTED',    namn: 'Utvald av',   vad: 'posten',      falt: 'post' },
    { nyckel: 'STEP1FILM_MEDIA',       namn: 'I media',     vad: 'posten',      falt: 'post' },
    { nyckel: 'STEP1FILM_CLIENTS',     namn: 'Logotyper',   vad: 'logotypen',   falt: 'logga' }
  ];

  function ritaFilmer() {
    const box = $('#filmLista');
    box.textContent = '';
    LISTOR.forEach(def => {
      const lista = S.innehall[def.nyckel] || (S.innehall[def.nyckel] = []);
      box.appendChild(el('h3', 'grupp-rubrik', def.namn));

      const hallare = el('div');
      hallare.dataset.lista = def.nyckel;
      box.appendChild(hallare);

      const rita = () => {
        hallare.textContent = '';
        if (!lista.length) hallare.appendChild(el('div', 'tom', 'Inget här än.'));
        lista.forEach((post, i) => hallare.appendChild(postKort(def, post, i, lista, rita)));
      };
      rita();
      gorDragbar(hallare, lista, 'innehall', rita);

      const lagg = el('button', 'knapp knapp--liten', '+ Lägg till');
      lagg.type = 'button';
      lagg.onclick = () => {
        lista.push(def.falt === 'film' ? { year: '', title: '', format: { sv: '', en: '' }, runtime: '' }
                 : def.falt === 'logga' ? { src: '', name: '' }
                 : { year: '', what: { sv: '', en: '' }, where: { sv: '', en: '' } });
        markera('innehall'); rita();
      };
      box.appendChild(lagg);
    });
  }

  function postKort(def, post, i, lista, rita) {
    const titel = def.falt === 'logga' ? (post.name || post.src || 'Namnlös')
                : def.falt === 'film'  ? (post.title || 'Namnlös')
                : (tv(post.what) || 'Namnlös');
    const under = def.falt === 'logga' ? post.src : [tv(post.year), tv(post.where)].filter(Boolean).join(' · ');

    const k = kort({ titel, under });
    k.draggable = true;
    const kropp = k._kropp;
    const uppd = () => {
      k._titel.textContent = def.falt === 'logga' ? (post.name || post.src || 'Namnlös')
                           : def.falt === 'film' ? (post.title || 'Namnlös') : (tv(post.what) || 'Namnlös');
    };

    if (def.falt === 'logga') {
      const g = el('div', 'rutor rutor--2');
      g.appendChild(falt('Filnamn', () => post.src, v => { post.src = v; }, 'innehall',
        { hjalp: 'T.ex. assets/clients/kinnarps.webp — ladda upp filen under Bilder först.' }));
      g.appendChild(falt('Namn (alt-text)', () => post.name, v => { post.name = v; uppd(); }, 'innehall',
        { hjalp: 'Läses upp av skärmläsare.' }));
      kropp.appendChild(g);

    } else if (def.falt === 'film') {
      const g = el('div', 'rutor rutor--3');
      g.appendChild(falt('År', () => post.year, v => { post.year = v; }, 'innehall'));
      g.appendChild(falt('Titel', () => post.title, v => { post.title = v; uppd(); }, 'innehall'));
      g.appendChild(falt('Speltid', () => post.runtime, v => { post.runtime = v; }, 'innehall',
        { hjalp: 'T.ex. 09 min' }));
      kropp.appendChild(g);
      kropp.appendChild(el('div', null, ' '));
      kropp.appendChild(falt('Originaltitel', () => post.subtitle, v => { post.subtitle = v; }, 'innehall',
        { hjalp: 'Valfri. Visas i citattecken efter titeln.' }));
      kropp.appendChild(sprakFalt('Format', post, 'format', 'innehall'));
      kropp.appendChild(sprakFalt('Status', post, 'status', 'innehall',
        { hjalp: 'Valfri. T.ex. Pågående.' }));
      kropp.appendChild(sprakFalt('Not', post, 'note', 'innehall', { textarea: true }));

    } else {
      kropp.appendChild(falt('År', () => tv(post.year), v => { post.year = v; }, 'innehall'));
      kropp.appendChild(sprakFalt('Namn', post, 'what', 'innehall'));
      kropp.appendChild(sprakFalt('Var / vad', post, 'where', 'innehall'));
      kropp.appendChild(falt('Länk', () => post.url, v => { post.url = v.trim(); }, 'innehall',
        { hjalp: 'Valfri. Hela adressen, t.ex. https://www.svt.se/… Namnet blir då klickbart.' }));
    }

    kropp.appendChild(listVerktyg(lista, i, 'innehall', rita, def.vad));
    return k;
  }

  /* =====================================================
     VIDEO
     -----------------------------------------------------
     Vimeo-adresser ser ut så här:
       vimeo.com/469092414
       vimeo.com/469092414/c2727eaa5d   ← olistad, andra delen är nyckeln
       player.vimeo.com/video/469092414?h=c2727eaa5d
     Fältet tar emot alla tre, och en naken siffra.

     YouTube-adresser går lika bra — klippspelaren på panel 01 spelar
     båda tjänsterna, och fältet skriver vilken det blev i raden under.
  ===================================================== */
  function tolkaVimeo(text) {
    const s = String(text || '').trim();
    if (/^\d+$/.test(s)) return { id: s, hash: '' };
    const m = s.match(/vimeo\.com\/(?:video\/)?(\d+)(?:[/?&#]|$)/i);
    if (!m) return null;
    const h = s.match(/[?&]h=([a-z0-9]+)/i) || s.match(/vimeo\.com\/(?:video\/)?\d+\/([a-z0-9]+)/i);
    return { id: m[1], hash: h ? h[1] : '' };
  }

  /* YouTube-id är elva tecken och kan komma i tre former: watch?v=,
     youtu.be/ och /embed/. Bara id:t sparas — allt annat i länken är
     spårparametrar som inte hör hemma i inställningarna. */
  function tolkaYoutube(text) {
    const s = String(text || '').trim();
    const m = s.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i);
    return m ? { id: m[1] } : null;
  }

  /** Ett fält där man klistrar in en Vimeo- eller YouTube-adress;
      tjänst, id och eventuell nyckel fylls i själva. */
  function videoFalt(etikett, obj, hjalp) {
    const w = el('div');
    const rad = falt(etikett, () => obj.id ? videoAdress(obj) : '', () => {}, 'innehall', { hjalp });
    const f = rad._falt;
    const svar = el('p', 'hjalp');
    const visa = () => {
      const tjanst = obj.provider === 'youtube' ? 'YouTube' : 'Vimeo';
      svar.textContent = obj.id
        ? `${tjanst} · id ${obj.id}` + (obj.hash ? ` · nyckel ${obj.hash}` : '')
        : 'Tomt — rutan visar "Trailer kommer".';
      svar.style.color = '';
    };
    visa();
    f.addEventListener('input', () => {
      const v = f.value.trim();
      if (!v) { obj.id = ''; obj.hash = ''; markera('innehall'); visa(); return; }
      /* YouTube först: en YouTube-länk innehåller aldrig vimeo.com, men
         en ren sifferrad tolkas som ett Vimeo-id och ska inte fastna i
         YouTube-mönstret. */
      const y = tolkaYoutube(v);
      const t = y || tolkaVimeo(v);
      if (!t) {
        svar.textContent = 'Det där ser inte ut som en Vimeo- eller YouTube-adress. Klistra in hela länken.';
        svar.style.color = '#ff8f8f';
        return;
      }
      obj.id = t.id;
      if (t.hash) obj.hash = t.hash; else delete obj.hash;
      obj.provider = y ? 'youtube' : 'vimeo';
      markera('innehall');
      visa();
    });
    w.appendChild(rad);
    w.appendChild(svar);
    return w;
  }

  const vimeoAdress = o => 'https://vimeo.com/' + o.id + (o.hash ? '/' + o.hash : '');
  const videoAdress = o => (o.provider === 'youtube'
    ? 'https://www.youtube.com/watch?v=' + o.id
    : vimeoAdress(o));

  function ritaVideo() {
    const box = $('#videoLista');
    box.textContent = '';

    /* --- Showreel --- */
    box.appendChild(el('h3', 'grupp-rubrik', 'Showreel i heron'));
    const sr = S.innehall.STEP1FILM_VIDEO || (S.innehall.STEP1FILM_VIDEO = { provider: 'vimeo', id: '', aspect: 2.35 });
    const srBox = el('div', 'kort');
    const srKropp = el('div', 'kort-kropp');
    srKropp.style.display = 'block';
    srKropp.style.paddingTop = '0.9rem';
    srKropp.appendChild(videoFalt('Vimeo- eller YouTube-adress', sr, 'Klistra in hela adressen från Vimeo eller YouTube.'));
    srKropp.appendChild(falt('Bildformat', () => sr.aspect, v => {
      const n = parseFloat(v);
      if (Number.isFinite(n) && n > 0.2 && n < 5) sr.aspect = n;
    }, 'innehall', { hjalp: '2.39 cinemascope · 2.35 widescreen · 2.00 univisium · 1.78 vanlig 16:9. Bara ett startvärde — Vimeo rättar det själv efter en sekund.' }));
    srBox.appendChild(srKropp);
    box.appendChild(srBox);

    /* --- Trailer --- */
    box.appendChild(el('h3', 'grupp-rubrik', 'Trailer — panel 02, Birds of Passage'));
    const emb = S.innehall.STEP1FILM_EMBEDS || (S.innehall.STEP1FILM_EMBEDS = {});
    const tr = emb['film-001'] || (emb['film-001'] = { provider: 'vimeo', id: '', title: '' });
    const trBox = el('div', 'kort');
    const trKropp = el('div', 'kort-kropp');
    trKropp.style.display = 'block';
    trKropp.style.paddingTop = '0.9rem';
    trKropp.appendChild(videoFalt('Vimeo- eller YouTube-adress', tr, 'Är filmen olistad på Vimeo måste nyckeln följa med — klistra in hela adressen så tas den med automatiskt.'));
    trKropp.appendChild(falt('Titel', () => tr.title, v => { tr.title = v; }, 'innehall',
      { hjalp: 'Visas överst i trailerrutan och läses av skärmläsare.' }));
    trBox.appendChild(trKropp);
    box.appendChild(trBox);

    /* --- Klippen --- */
    box.appendChild(el('h3', 'grupp-rubrik', 'Klipp — panel 01, Drömmen'));
    const klipp = S.innehall.STEP1FILM_REEL || (S.innehall.STEP1FILM_REEL = []);
    const hallare = el('div');
    box.appendChild(hallare);

    const rita = () => {
      hallare.textContent = '';
      if (!klipp.length) hallare.appendChild(el('div', 'tom', 'Inga klipp än.'));
      klipp.forEach((k, i) => {
        const kk = kort({ titel: k.title || 'Namnlöst klipp', under: k.id ? videoAdress(k) : 'Ingen adress' });
        kk.draggable = true;
        kk._kropp.appendChild(videoFalt('Vimeo- eller YouTube-adress', k, 'Hela adressen. Olistade Vimeo-filmer får sin nyckel automatiskt.'));
        kk._kropp.appendChild(falt('Titel', () => k.title, v => { k.title = v; kk._titel.textContent = v || 'Namnlöst klipp'; }, 'innehall',
          { hjalp: 'Står under rutan.' }));
        kk._kropp.appendChild(listVerktyg(klipp, i, 'innehall', rita, 'klippet'));
        hallare.appendChild(kk);
      });
    };
    rita();
    gorDragbar(hallare, klipp, 'innehall', rita);

    const lagg = el('button', 'knapp knapp--liten', '+ Lägg till klipp');
    lagg.type = 'button';
    lagg.onclick = () => { klipp.push({ id: '', title: '' }); markera('innehall'); rita(); };
    box.appendChild(lagg);

    /* --- Affischer --- */
    box.appendChild(el('h3', 'grupp-rubrik', 'Affischer och stillbilder — panel 02'));
    const post = S.innehall.STEP1FILM_POSTERS || (S.innehall.STEP1FILM_POSTERS = { shorts: [], mammor: [] });
    [['shorts', '003 Filmer — affischer'], ['mammor', '002 Jag som har två mammor — stillbilder']].forEach(([n, etikett]) => {
      const lista = post[n] || (post[n] = []);
      const w = el('div', 'kort');
      const kropp = el('div', 'kort-kropp');
      kropp.style.display = 'block';
      kropp.style.paddingTop = '0.9rem';
      kropp.appendChild(falt(etikett, () => lista.join('\n'), v => {
        post[n] = v.split('\n').map(s => s.trim()).filter(Boolean);
      }, 'innehall', { textarea: true, hjalp: 'En filsökväg per rad. Tom lista ger "Bilder kommer". Ladda upp filerna under Bilder först.' }));
      w.appendChild(kropp);
      box.appendChild(w);
    });
  }

  /* =====================================================
     PRODUKTER
  ===================================================== */
  function ritaProdukter() {
    const box = $('#produktLista');
    const rita = () => {
      box.textContent = '';
      if (!S.produkter.length) { box.appendChild(el('div', 'tom', 'Inga produkter.')); return; }
      S.produkter.forEach((p, i) => box.appendChild(produktKort(p, i, rita)));
    };
    rita();
    gorDragbar(box, S.produkter, 'produkter', rita);
    $('#nyProdukt').onclick = () => {
      S.produkter.unshift({
        id: '', cat: 'clothing', type: 'tee', print: 'S1F',
        name: { sv: '', en: '' }, desc: { sv: '', en: '' },
        price: 299, colors: ['black'], sizes: null, image: '', gallery: []
      });
      markera('produkter'); rita();
      box.firstChild.classList.add('oppen');
    };
  }

  function produktKort(p, i, rita) {
    const prisMarke = el('span', 'marke marke--pris', p.price + ' kr');
    const marken = [prisMarke];
    if (p.hidden) marken.unshift(el('span', 'marke marke--dold', 'Dold'));

    const k = kort({
      titel: (p.name && p.name.sv) || p.id || 'Ny produkt',
      under: p.id,
      marken,
      klasser: p.hidden ? 'dold' : ''
    });
    k.draggable = true;
    const kropp = k._kropp;

    const g1 = el('div', 'rutor rutor--3');
    g1.appendChild(falt('Id', () => p.id, v => { p.id = v.trim(); k._under.textContent = p.id; }, 'produkter',
      { hjalp: 'Små bokstäver, siffror, bindestreck. BYT ALDRIG på en produkt som redan sålts — id:t sitter i gamla ordrar.' }));
    g1.appendChild(falt('Pris (kr)', () => p.price, v => {
      const n = parseInt(v, 10);
      if (Number.isFinite(n)) { p.price = n; prisMarke.textContent = n + ' kr'; }
    }, 'produkter', { typ: 'number', hjalp: 'Både det kunden ser och det som debiteras.' }));

    const kat = el('label', 'falt');
    kat.appendChild(el('span', 'falt-etikett', 'Kategori'));
    const s = document.createElement('select');
    [['clothing', 'Kläder'], ['caps', 'Kepsar och mössor'], ['mugs', 'Muggar'],
     ['accessories', 'Accessoarer'], ['stickers', 'Stickers']].forEach(([v, n]) => {
      const o = document.createElement('option');
      o.value = v; o.textContent = n; o.selected = p.cat === v;
      s.appendChild(o);
    });
    s.addEventListener('change', () => { p.cat = s.value; markera('produkter'); });
    kat.appendChild(s);
    g1.appendChild(kat);
    kropp.appendChild(g1);

    kropp.appendChild(sprakFalt('Namn', p, 'name', 'produkter'));
    kropp.appendChild(sprakFalt('Beskrivning', p, 'desc', 'produkter', { textarea: true }));
    kropp.appendChild(sprakFalt('Etikett på kortet', p, 'badge', 'produkter',
      { hjalp: 'Valfri. T.ex. Bestseller.' }));

    const g2 = el('div', 'rutor rutor--2');
    g2.appendChild(falt('Färger', () => (p.colors || []).join(', '),
      v => { p.colors = v.split(',').map(x => x.trim()).filter(Boolean); }, 'produkter',
      { hjalp: 'Kommaseparerat, t.ex. black, white' }));
    g2.appendChild(falt('Storlekar', () => (p.sizes || []).join(', '),
      v => { const a = v.split(',').map(x => x.trim()).filter(Boolean); p.sizes = a.length ? a : null; }, 'produkter',
      { hjalp: 'Tomt = one size.' }));
    kropp.appendChild(g2);

    kropp.appendChild(falt('Avvikande pris per storlek', () => JSON.stringify(p.sizePrices || {}),
      v => { try { const o = JSON.parse(v || '{}'); p.sizePrices = Object.keys(o).length ? o : undefined; } catch { /* skriver fortfarande */ } },
      'produkter', { hjalp: 'T.ex. {"13\\"": 599, "15\\"": 699}. Lämna {} om priset är samma för alla storlekar.' }));

    kropp.appendChild(falt('Bild på kortet', () => p.image, v => { p.image = v.trim(); }, 'produkter',
      { hjalp: 'T.ex. assets/products/reel-mugg.webp' }));
    kropp.appendChild(falt('Bildspel', () => (p.gallery || []).join('\n'),
      v => { p.gallery = v.split('\n').map(x => x.trim()).filter(Boolean); }, 'produkter',
      { textarea: true, hjalp: 'En sökväg per rad. Bilden på kortet först.' }));

    /* Materialpunkterna lagras som en lista men skrivs som rader — en
       punkt per rad är lättare att redigera än JSON. */
    const mat = el('div', 'rutor rutor--sprak brett');
    ['sv', 'en'].forEach(spr => {
      mat.appendChild(falt('Material · ' + (spr === 'sv' ? 'svenska' : 'engelska'),
        () => ((p.material && p.material[spr]) || []).join('\n'),
        v => {
          p.material = p.material || { sv: [], en: [] };
          p.material[spr] = v.split('\n').map(x => x.trim()).filter(Boolean);
        }, 'produkter', { textarea: true, hjalp: spr === 'sv' ? 'En punkt per rad.' : '' }));
    });
    kropp.appendChild(mat);

    /* Varianter — visas men går inte att ändra här */
    const v = (S.varianter && S.varianter[p.id]) || {};
    const vRad = el('p', 'hjalp');
    vRad.style.marginTop = '0.8rem';
    vRad.textContent = Object.keys(v).length
      ? `Printful-varianter: ${Object.keys(v).length} st, kopplade. De rörs inte när du sparar.`
      : 'Inga Printful-varianter kopplade — produkten går att lägga i kundvagnen men ordern kan inte skickas till Printful. Säg till så kopplar jag den.';
    if (!Object.keys(v).length) vRad.classList.add('varning');
    kropp.appendChild(vRad);

    /* Verktyg: dölj/visa först, sedan flytta och ta bort */
    const verktyg = listVerktyg(S.produkter, i, 'produkter', rita, `produkten ${p.id || ''}`);
    const dolj = el('button', 'knapp knapp--liten', p.hidden ? 'Visa i butiken' : 'Dölj i butiken');
    dolj.type = 'button';
    dolj.onclick = () => { if (p.hidden) delete p.hidden; else p.hidden = true; markera('produkter'); rita(); };
    verktyg.insertBefore(dolj, verktyg.firstChild);
    kropp.appendChild(verktyg);

    return k;
  }

  /* =====================================================
     BILDER
  ===================================================== */
  const BILDMAPPAR = [
    ['assets/products/', 'Produktbilder'],
    ['assets/clients/', 'Partnerlogotyper'],
    ['assets/films/posters/', 'Affischer'],
    ['assets/films/mammor/', 'Stillbilder — Två mammor'],
    ['assets/portraits/', 'Porträtt']
  ];

  function ritaBilder() {
    const box = $('#bildYta');
    box.textContent = '';

    const val = el('label', 'falt');
    val.appendChild(el('span', 'falt-etikett', 'Lägg bilden i'));
    const s = document.createElement('select');
    BILDMAPPAR.forEach(([v, n]) => {
      const o = document.createElement('option');
      o.value = v; o.textContent = n + '  (' + v + ')';
      s.appendChild(o);
    });
    val.appendChild(s);
    box.appendChild(val);

    const slapp = el('div', 'slapp');
    slapp.innerHTML = '<b>Släpp bilder här</b>eller klicka för att välja. Max 4 MB, .webp, .jpg eller .png.';
    box.appendChild(slapp);

    const fil = document.createElement('input');
    fil.type = 'file';
    fil.accept = '.webp,.jpg,.jpeg,.png';
    fil.multiple = true;
    fil.hidden = true;
    box.appendChild(fil);

    const lista = el('div');
    box.appendChild(lista);

    slapp.addEventListener('click', () => fil.click());
    fil.addEventListener('change', () => { ta(fil.files, s.value, lista); fil.value = ''; });
    ['dragenter', 'dragover'].forEach(n => slapp.addEventListener(n, e => {
      e.preventDefault(); slapp.classList.add('over');
    }));
    ['dragleave', 'drop'].forEach(n => slapp.addEventListener(n, e => {
      e.preventDefault(); slapp.classList.remove('over');
    }));
    slapp.addEventListener('drop', e => ta(e.dataTransfer.files, s.value, lista));
  }

  function ta(filer, mapp, lista) {
    Array.from(filer).forEach(f => laddaUpp(f, mapp, lista));
  }

  async function laddaUpp(fil, mapp, lista) {
    /* Filnamnet städas: bara små bokstäver, siffror, punkt och bindestreck.
       Servern skulle ändå neka allt annat, men ett tydligt namn här är
       bättre än ett avslag efter uppladdningen. */
    const rent = fil.name.toLowerCase()
      .replace(/[åä]/g, 'a').replace(/ö/g, 'o').replace(/[^a-z0-9.-]+/g, '-')
      .replace(/-+/g, '-').replace(/^-|-$/g, '');
    const path = mapp + rent;

    const rad = el('div', 'bildrad');
    const bild = document.createElement('img');
    bild.alt = '';
    bild.src = URL.createObjectURL(fil);
    const mitt = el('div', 'bildrad-mitt');
    mitt.appendChild(el('div', 'bildrad-namn', path));
    const status = el('div', 'bildrad-status', 'Laddar upp …');
    mitt.appendChild(status);
    rad.append(bild, mitt);
    lista.prepend(rad);

    try {
      if (fil.size > 4 * 1024 * 1024) {
        throw new Error(`Bilden är ${(fil.size / 1024 / 1024).toFixed(1)} MB. Max är 4 MB.`);
      }
      const b64 = await new Promise((ok, nej) => {
        const l = new FileReader();
        l.onload = () => ok(String(l.result).split(',')[1]);
        l.onerror = () => nej(new Error('Filen gick inte att läsa.'));
        l.readAsDataURL(fil);
      });
      await be('/admin-upload', { method: 'POST', body: JSON.stringify({ path, base64: b64 }) });
      status.textContent = 'Uppladdad. Skriv in sökvägen där bilden ska användas.';
      status.className = 'bildrad-status klar';
      const kopiera = el('button', 'knapp knapp--liten', 'Kopiera sökvägen');
      kopiera.type = 'button';
      kopiera.onclick = () => {
        navigator.clipboard.writeText(path).then(
          () => rop('Sökvägen är kopierad: ' + path),
          () => rop('Kunde inte kopiera — markera texten i stället.', 'fel')
        );
      };
      mitt.appendChild(kopiera);
    } catch (e) {
      status.textContent = e.message;
      status.className = 'bildrad-status fel';
    }
  }

  /* -----------------------------------------------------
     Igång
  ----------------------------------------------------- */
  if (nyckel()) {
    start().catch(() => { /* utgången nyckel → inloggningen visas av be() */ });
  }
})();
