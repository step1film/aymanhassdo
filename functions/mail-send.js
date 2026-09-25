/* =====================================================
   ADMIN — skicka mejl
   =====================================================
   POST { konto, till, kopia?, dold?, amne, text, svarPa?, referenser? }
   → { ok: true, id, iSkickat }

   Avsändaren bestäms av `konto` och slås upp mot
   MAIL_ACCOUNTS på servern. Webbläsaren kan alltså inte
   skicka i någon annans namn — den som inte finns i listan
   går inte att skicka från.
   ===================================================== */
'use strict';

const { corsHeaders, isForeignOrigin, json } = require('./_lib/http');
const A = require('./_lib/admin');
const M = require('./_lib/mail');
const adressparser = require('nodemailer/lib/addressparser');

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
const adresser = (v) => adressparser(falt(v)).map(a => String(a.address || a.name || '').trim());
const allaGiltiga = (v) => adresser(v).every(a => ADRESS.test(a));

exports.handler = async (event) => {
  const headers = corsHeaders(event, 'POST, OPTIONS');
  headers['Access-Control-Allow-Headers'] = 'Content-Type, X-Admin-Session';
  headers['Cache-Control'] = 'no-store, max-age=0';

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return json(405, headers, { fel: 'Metod stöds inte.' });
  if (isForeignOrigin(event)) return json(403, headers, { fel: 'Otillåtet ursprung.' });
  if (!A.konfigurerad()) return json(503, headers, { fel: 'Admin är inte igångsatt.' });
  if (!A.giltigNyckel(A.nyckelUr(event))) return json(401, headers, { fel: 'Sessionen har gått ut. Logga in igen.' });
  if (!M.konfigurerad()) return json(503, headers, { fel: 'Mejlfliken är inte igångsatt.' });

  let d;
  try { d = JSON.parse(event.body || '{}'); }
  catch { return json(400, headers, { fel: 'Trasig JSON.' }); }

  const konto = M.kontoFor(d.konto);
  if (!konto) return json(403, headers, { fel: 'Du kan bara skicka från dina egna adresser.' });

  const till  = falt(d.till);
  const kopia = falt(d.kopia);
  const dold  = falt(d.dold);
  const amne  = enRad(d.amne);
  const text  = String(d.text || '');

  if (!till)  return json(400, headers, { fel: 'Mottagare saknas.' });
  if (!amne)  return json(400, headers, { fel: 'Ämne saknas.' });
  if (!text.trim()) return json(400, headers, { fel: 'Meddelandet är tomt.' });
  if (!allaGiltiga(till))  return json(400, headers, { fel: 'Kontrollera adresserna i Till.' });
  if (!allaGiltiga(kopia)) return json(400, headers, { fel: 'Kontrollera adresserna i Kopia.' });
  if (!allaGiltiga(dold))  return json(400, headers, { fel: 'Kontrollera adresserna i Dold kopia.' });
  if (adresser(till).length + adresser(kopia).length + adresser(dold).length > 50) {
    return json(400, headers, { fel: 'Högst 50 mottagare per brev.' });
  }

  try {
    const svar = await M.skicka(konto, {
      till, kopia, dold, amne, text,
      svarPa: enRad(d.svarPa),
      referenser: enRad(d.referenser)
    });
    return json(200, headers, { ok: true, ...svar });
  } catch (e) {
    console.error('mail-send:', e && e.message);
    return json(502, headers, { fel: 'Kunde inte skicka. Kontrollera SMTP-uppgifterna hos one.com.' });
  }
};
