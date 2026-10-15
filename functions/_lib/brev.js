/* =====================================================
   STEP1FILM ADMIN — ett brev ur ett anrop
   =====================================================
   mail-send och mail-draft tar emot samma sorts brev från
   adminsidan. Här tolkas och kontrolleras det, och bilagorna
   samlas ihop från de tre ställen de kan komma ifrån:

     bilagor        små filer, inbakade som base64 i anropet
     uppladdade     stora filer, uppladdade i delar i förväg
                    med mail-upload (Netlify Blobs)
     medfoljande    filer som redan ligger i ett brev i
                    brevlådan — originalets bilagor vid
                    vidarebefordran, ett utkasts egna filer

   Ett anrop till en Netlify-funktion får vara högst sex
   megabyte. Därför den uppdelningen: allt som får plats går
   med direkt, resten laddas upp i bitar först.
   ===================================================== */
'use strict';

const { getStore, connectLambda } = require('@netlify/blobs');
const adressparser = require('nodemailer/lib/addressparser');
const M = require('./mail');

/* Tak för ett helt brev. one.com tar emot större, men funktionen
   har tio sekunder på sig att bygga, skicka och lägga en kopia i
   Skickat — och mottagarnas servrar säger ofta nej över 20 MB. */
const MAX_TOTALT = 20 * 1024 * 1024;

/** Butiken för uppladdade bilagor och inställningar. */
function butik(event) {
  connectLambda(event);
  return getStore({ name: 'mejl' });
}

/* Radbrytningar i rubrikfält är hur man smyger in extra mottagare
   i ett mejl. Fälten som hamnar i huvudet får aldrig innehålla dem. */
const enRad = (v) => String(v || '').replace(/[\r\n]+/g, ' ').trim();

/* Till, Kopia och Dold kopia är kommalistor. Varje adress i dem
   kontrolleras, så att ett stavfel märks innan brevet går — inte
   när en studsning kommer tillbaka. Namn i formen
   "Namn <adress>" går bra; semikolon räknas som komma, som i
   Outlook. */
const ADRESS = /^[^@\s,<>]+@[^@\s,<>]+\.[^@\s,<>]+$/;
const falt = (v) => enRad(v).replace(/;/g, ',');
const adresser = (v) => adressparser(falt(v)).map(a => String(a.address || a.name || '').trim()).filter(Boolean);
const allaGiltiga = (v) => adresser(v).every(a => ADRESS.test(a));

/* Ett filnamn ur webbläsaren hamnar i brevets huvud. */
const filnamn = (v) => enRad(v).replace(/[\\/"]/g, '_').slice(0, 180) || 'bilaga';
const filtyp = (v) => (/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i.test(String(v || '')) ? String(v) : 'application/octet-stream');

/* Id:t för en uppladdning: tid + slump, satt av webbläsaren. Bara
   bokstäver, siffror och bindestreck — det blir en del av en nyckel. */
const UPP_ID = /^[0-9]{13}-[a-z0-9]{8,32}$/;

/** Läs in ett brev ur anropet. `strikt` = det ska skickas, inte bara sparas. */
async function tolka(event, d, { strikt }) {
  const konto = M.kontoFor(d.konto);
  if (!konto) return { fel: 'Du kan bara skicka från dina egna adresser.', status: 403 };

  const brev = {
    till: falt(d.till),
    kopia: falt(d.kopia),
    dold: falt(d.dold),
    amne: enRad(d.amne),
    text: String(d.text || ''),
    html: String(d.html || ''),
    svarPa: enRad(d.svarPa),
    referenser: enRad(d.referenser)
  };

  if (strikt) {
    if (!brev.till) return { fel: 'Mottagare saknas.' };
    if (!brev.amne) return { fel: 'Ämne saknas.' };
    if (!brev.text.trim() && !brev.html.trim()) return { fel: 'Meddelandet är tomt.' };
  }
  if (!allaGiltiga(brev.till))  return { fel: 'Kontrollera adresserna i Till.' };
  if (!allaGiltiga(brev.kopia)) return { fel: 'Kontrollera adresserna i Kopia.' };
  if (!allaGiltiga(brev.dold))  return { fel: 'Kontrollera adresserna i Dold kopia.' };
  if (adresser(brev.till).length + adresser(brev.kopia).length + adresser(brev.dold).length > 50) {
    return { fel: 'Högst 50 mottagare per brev.' };
  }

  const bilagor = [];

  /* 1. Små filer direkt i anropet. */
  for (const b of Array.isArray(d.bilagor) ? d.bilagor.slice(0, 30) : []) {
    if (!b || typeof b.data !== 'string') continue;
    bilagor.push({ filename: filnamn(b.namn), contentType: filtyp(b.typ), content: Buffer.from(b.data, 'base64') });
  }

  /* 2. Stora filer, uppladdade i delar. Läsningen försöker några
     gånger: Blobs i Lambda-format kan ligga en stund efter. */
  const uppladdade = Array.isArray(d.uppladdade) ? d.uppladdade.slice(0, 30) : [];
  if (uppladdade.some(u => !u || !UPP_ID.test(String(u.id)) || !Number.isInteger(u.delar) || u.delar < 1 || u.delar > 10)) {
    return { fel: 'En uppladdad bilaga är trasig. Ta bort den och lägg till den igen.' };
  }
  if (uppladdade.length) {
    const store = butik(event);
    for (const u of uppladdade) {
      const bitar = [];
      for (let i = 0; i < u.delar; i++) {
        let bit = null;
        for (let forsok = 0; forsok < 4 && !bit; forsok++) {
          if (forsok) await new Promise(r => setTimeout(r, 400));
          const ab = await store.get(`u/${u.id}/${i}`, { type: 'arrayBuffer' });
          if (ab) bit = Buffer.from(ab);
        }
        if (!bit) return { fel: 'En bilaga hann inte bli klar på servern. Vänta ett ögonblick och tryck Skicka igen.' };
        bitar.push(bit);
      }
      bilagor.push({ filename: filnamn(u.namn), contentType: filtyp(u.typ), content: Buffer.concat(bitar), _upp: u.id });
    }
  }

  /* 3. Filer ur ett brev i brevlådan. */
  const m = d.medfoljande;
  if (m && Array.isArray(m.nr) && m.nr.length) {
    const uid = Number(m.uid);
    const mapp = M.MAPPAR.includes(m.mapp) ? m.mapp : 'inkorg';
    const nr = m.nr.map(Number).filter(n => Number.isInteger(n) && n >= 0).slice(0, 50);
    if (Number.isInteger(uid) && uid > 0 && nr.length) {
      bilagor.push(...await M.bilagorUr(konto, { mapp, uid, nr }));
    }
  }

  const storlek = bilagor.reduce((s, b) => s + b.content.length, 0);
  if (storlek > MAX_TOTALT) return { fel: 'Bilagorna är för stora tillsammans (högst 20 MB per brev).' };

  brev.bilagor = bilagor.map(({ _upp, ...b }) => b);
  return { konto, brev, uppladdningar: bilagor.filter(b => b._upp).map(b => b._upp) };
}

/** Städa bort uppladdade delar som inte längre behövs. */
async function stada(event, ider) {
  if (!ider || !ider.length) return;
  try {
    const store = butik(event);
    for (const id of ider) {
      const { blobs } = await store.list({ prefix: `u/${id}/` });
      await Promise.all(blobs.map(b => store.delete(b.key)));
    }
  } catch { /* gamla delar städas ändå bort av mail-upload efter ett dygn */ }
}

module.exports = { tolka, stada, butik, enRad, UPP_ID, MAX_TOTALT };
