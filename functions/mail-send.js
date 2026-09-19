/* =====================================================
   ADMIN — skicka mejl
   =====================================================
   POST { konto, till, kopia?, amne, text, svarPa?, referenser? }
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

/* Radbrytningar i rubrikfält är hur man smyger in extra mottagare
   i ett mejl. Fälten som hamnar i huvudet får aldrig innehålla dem. */
const enRad = (v) => String(v || '').replace(/[\r\n]+/g, ' ').trim();

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

  const till  = enRad(d.till);
  const kopia = enRad(d.kopia);
  const amne  = enRad(d.amne);
  const text  = String(d.text || '');

  if (!till)  return json(400, headers, { fel: 'Mottagare saknas.' });
  if (!amne)  return json(400, headers, { fel: 'Ämne saknas.' });
  if (!text.trim()) return json(400, headers, { fel: 'Meddelandet är tomt.' });
  if (!/^[^@\s,]+@[^@\s,]+\.[^@\s,]+$/.test(till.split(',')[0].trim())) {
    return json(400, headers, { fel: 'Kontrollera mottagarens adress.' });
  }

  try {
    const svar = await M.skicka(konto, {
      till, kopia, amne, text,
      svarPa: enRad(d.svarPa),
      referenser: enRad(d.referenser)
    });
    return json(200, headers, { ok: true, ...svar });
  } catch (e) {
    console.error('mail-send:', e && e.message);
    return json(502, headers, { fel: 'Kunde inte skicka. Kontrollera SMTP-uppgifterna hos one.com.' });
  }
};
