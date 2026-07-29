/* =====================================================
   STEP1FILM — projektförfrågan från startsidan
   =====================================================
   Tar emot formuläret på panel 05 och mejlar det vidare
   till collaboration@step1film.se.

   Miljövariabler (samma som orderbekräftelsen):
     RESEND_API_KEY   – re_… från Resend
     EMAIL_FROM       – t.ex. "STEP1FILM <shop@step1film.se>"

   Saknas nycklarna svarar funktionen 503 och butiken/sidan
   visar mejladressen så besökaren kan skriva direkt i stället.
   ===================================================== */
'use strict';

const { corsHeaders, isForeignOrigin } = require('./_lib/http');

const TILL = 'collaboration@step1film.se';
const RESEND_API = 'https://api.resend.com/emails';

/** Escapar text som ska in i HTML — allt här kommer utifrån. */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Plockar ut ett fält, trimmat och kapat. Kastar om det saknas. */
function fält(data, namn, max, krävs) {
  const v = (data && data[namn] != null) ? String(data[namn]).trim() : '';
  if (!v && krävs) throw new Error(`Fältet "${namn}" saknas.`);
  return v.slice(0, max);
}

exports.handler = async (event) => {
  const cors = corsHeaders(event, 'POST, OPTIONS');
  if (isForeignOrigin(event)) {
    return { statusCode: 403, headers: cors, body: JSON.stringify({ error: 'Otillåtet ursprung.' }) };
  }
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let data;
  try { data = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Ogiltig JSON.' }) }; }

  // Robotfällan är ett fält som ingen människa ser. Är det ifyllt
  // svarar vi 200 utan att skicka något — roboten märker ingenting.
  if (String(data.company || '').trim()) {
    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) };
  }

  let namn, epost, länk, pitch;
  try {
    namn  = fält(data, 'name', 120, true);
    epost = fält(data, 'email', 160, true);
    länk  = fält(data, 'link', 400, false);
    pitch = fält(data, 'pitch', 4000, true);
  } catch (err) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: String(err.message || err) }) };
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(epost)) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Ogiltig e-postadress.' }) };
  }
  // Bara http(s) i länkfältet — inga javascript:-adresser i mejlet
  if (länk && !/^https?:\/\//i.test(länk)) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Länken måste börja med http:// eller https://' }) };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.warn(`[collab] Ej konfigurerad — förfrågan från ${epost} kunde inte skickas.\n${namn}\n${länk}\n${pitch}`);
    return { statusCode: 503, headers: cors, body: JSON.stringify({ error: 'E-post är inte påslagen ännu.' }) };
  }

  const text = [
    `Ny projektförfrågan från step1film.se`,
    '',
    `Namn:  ${namn}`,
    `E-post: ${epost}`,
    länk ? `Länk:  ${länk}` : 'Länk:  —',
    '',
    'Idén:',
    pitch
  ].join('\n');

  const html = `<div style="font:400 15px/1.6 Helvetica,Arial,sans-serif;color:#111;max-width:560px">
  <p style="font:700 12px/1 Helvetica,Arial,sans-serif;letter-spacing:.18em;color:#6b6b6b">NY PROJEKTFÖRFRÅGAN</p>
  <p><strong>${esc(namn)}</strong><br>
  <a href="mailto:${esc(epost)}">${esc(epost)}</a><br>
  ${länk ? `<a href="${esc(länk)}">${esc(länk)}</a>` : '<span style="color:#6b6b6b">ingen länk</span>'}</p>
  <hr style="border:0;border-top:1px solid #e6e3de">
  <p style="white-space:pre-wrap">${esc(pitch)}</p>
</div>`;

  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [TILL],
        // Svara-knappen ska gå till den som skrev, inte till oss själva
        reply_to: epost,
        subject: `Projektförfrågan — ${namn}`,
        text,
        html
      })
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      console.error('[collab] Resend svarade', res.status, JSON.stringify(d).slice(0, 300));
      return { statusCode: 502, headers: cors, body: JSON.stringify({ error: 'Kunde inte skicka just nu.' }) };
    }
  } catch (err) {
    console.error('[collab]', String(err && err.message || err));
    return { statusCode: 502, headers: cors, body: JSON.stringify({ error: 'Kunde inte skicka just nu.' }) };
  }

  return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) };
};
