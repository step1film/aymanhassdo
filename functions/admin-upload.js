/* =====================================================
   ADMIN — ladda upp bild
   =====================================================
   POST { path, base64 }  med sessionsnyckeln i X-Admin-Session
   → { ok, path, commit }

   Bilden läggs rakt in i repot och syns på sajten när GitHub
   Pages byggt om, ungefär en minut senare.

   BEGRÄNSNINGARNA ÄR POÄNGEN
   -----------------------------------------------------
   `path` kommer från webbläsaren och får därför bara peka på
   en handfull mappar under assets/, med en handfull filändelser.
   Utan den spärren hade en kapad session kunnat skriva t.ex.
   .github/workflows/ — och därmed köra godtycklig kod i repot.

   Filändelsen kontrolleras dessutom mot bildens egna första
   byte. Ett skript som döpts om till .webp stoppas här.
   ===================================================== */
'use strict';

const { corsHeaders, isForeignOrigin, json } = require('./_lib/http');
const A = require('./_lib/admin');

/* Filsignaturer — de första byten i filen avslöjar den riktiga typen. */
function riktigTyp(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'jpg';
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) return 'png';
  if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return 'webp';
  return null;
}

exports.handler = async (event) => {
  const headers = corsHeaders(event, 'POST, OPTIONS');
  headers['Access-Control-Allow-Headers'] = 'Content-Type, X-Admin-Session';

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return json(405, headers, { fel: 'Metod stöds inte.' });
  if (isForeignOrigin(event)) return json(403, headers, { fel: 'Otillåtet ursprung.' });
  if (!A.konfigurerad()) return json(503, headers, { fel: 'Admin är inte igångsatt.' });
  if (!A.giltigNyckel(A.nyckelUr(event))) return json(401, headers, { fel: 'Sessionen har gått ut. Logga in igen.' });

  let kropp;
  try { kropp = JSON.parse(event.body || '{}'); }
  catch { return json(400, headers, { fel: 'Trasig förfrågan.' }); }

  const path = String(kropp.path || '');
  if (!A.tillatenBild(path)) {
    return json(400, headers, {
      fel: 'Bilden måste heta något med .webp, .jpg eller .png och ligga i '
         + A.BILDMAPPAR.join(', ') + '.'
    });
  }

  const b64 = String(kropp.base64 || '').replace(/^data:[^,]*,/, '');
  if (!b64) return json(400, headers, { fel: 'Ingen bild kom med.' });

  let buf;
  try { buf = Buffer.from(b64, 'base64'); }
  catch { return json(400, headers, { fel: 'Bilden gick inte att läsa.' }); }

  if (!buf.length) return json(400, headers, { fel: 'Bilden är tom.' });
  if (buf.length > A.MAX_BILD) {
    return json(413, headers, {
      fel: `Bilden är ${Math.round(buf.length / 1024 / 1024 * 10) / 10} MB. `
         + `Max är ${A.MAX_BILD / 1024 / 1024} MB — spara om den mindre först.`
    });
  }

  const angiven = path.split('.').pop().toLowerCase();
  const verklig = riktigTyp(buf);
  if (!verklig) return json(400, headers, { fel: 'Filen är ingen bild.' });
  const sammaTyp = verklig === angiven || (verklig === 'jpg' && angiven === 'jpeg');
  if (!sammaTyp) {
    return json(400, headers, { fel: `Filen heter .${angiven} men är en ${verklig}-bild. Byt filändelse.` });
  }

  try {
    const sha = await A.skrivFiler(
      [{ path, base64: buf.toString('base64') }],
      `Admin: bild ${path}\n\nUppladdad från step1film.se/admin.`
    );
    return json(200, headers, { ok: true, path, commit: sha.slice(0, 7) });
  } catch (e) {
    console.error('admin-upload:', path, e.message, e.detalj || '');
    return json(502, headers, { fel: 'Kunde inte spara bilden. ' + e.message });
  }
};
