/* =====================================================
   ADMIN — hämta allt innehåll
   =====================================================
   GET, med sessionsnyckeln i X-Admin-Session
   → { innehall, texter, produkter, katalog, bilder }

   Läser filerna från GitHub, inte från den publicerade
   sajten. Skillnaden märks precis efter en sparning:
   GitHub har det nya direkt, medan Pages behöver en minut
   på sig att bygga om. Admin ska visa det du senast sparade.
   ===================================================== */
'use strict';

const { corsHeaders, isForeignOrigin, json } = require('./_lib/http');
const A = require('./_lib/admin');

exports.handler = async (event) => {
  const headers = corsHeaders(event, 'GET, OPTIONS');
  headers['Access-Control-Allow-Headers'] = 'Content-Type, X-Admin-Session';

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'GET') return json(405, headers, { fel: 'Metod stöds inte.' });
  if (isForeignOrigin(event)) return json(403, headers, { fel: 'Otillåtet ursprung.' });
  if (!A.konfigurerad()) return json(503, headers, { fel: 'Admin är inte igångsatt.' });
  if (!A.giltigNyckel(A.nyckelUr(event))) return json(401, headers, { fel: 'Sessionen har gått ut. Logga in igen.' });

  try {
    const [sc, i18, sh, cat] = await Promise.all([
      A.lasFil('site-config.js'),
      A.lasFil('i18n.js'),
      A.lasFil('shop.js'),
      A.lasFil('functions/_lib/catalog.js')
    ]);

    const katalog = A.lasBlock(cat, 'katalog', 'CATALOG');

    return json(200, headers, {
      innehall:  A.lasInnehall(sc),
      texter:    A.lasBlock(i18, 'texter', 'STRINGS'),
      produkter: A.lasBlock(sh, 'produkter', 'PRODUCTS'),
      // Variant-id:n visas inte i formuläret men måste följa med tillbaka
      // vid sparning, annars tappar Printful kopplingen till produkten.
      varianter: Object.fromEntries(
        Object.entries(katalog).map(([id, p]) => [id, p.variants || {}])
      ),
      gren: A.BRANCH
    });
  } catch (e) {
    console.error('admin-load:', e.message, e.detalj || '');
    return json(502, headers, { fel: 'Kunde inte läsa innehållet från GitHub. ' + e.message });
  }
};
