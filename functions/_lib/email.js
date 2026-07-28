/* =====================================================
   STEP1 STORE — orderbekräftelse till kunden
   =====================================================
   Skickas när betalningen är BEKRÄFTAD, direkt efter att
   ordern lagts hos Printful.

   Skickas via Resend (https://resend.com) över vanlig HTTPS —
   inget SMTP, inga extra paket att installera.

   Miljövariabler:
     RESEND_API_KEY   – re_… från Resend
     EMAIL_FROM       – t.ex. "STEP1FILM STORE <shop@step1film.se>"
     EMAIL_BCC        – valfritt, din egen kopia av varje order

   ⚠️ Saknas RESEND_API_KEY skickas ingenting — funktionen
   loggar bara och returnerar. Betalningen och tryckordern
   påverkas ALDRIG av att mejlet misslyckas.
   ===================================================== */
'use strict';

const RESEND_API = 'https://api.resend.com/emails';

/* HÅLL I SYNK med company.js (som styr sidfot och villkorssidor). */
const COMPANY = {
  brand: 'STEP1FILM',
  legalName: 'Ayman Hassdo',
  addressLine: 'Östra Vasagatan 1A, 568 32 Skillingaryd, Sverige',
  // Butikens adress — order, retur, frakt, reklamation.
  // info@ är allmän företagskontakt och ska INTE stå i orderflödet.
  email: 'shop@step1film.se',
  site: 'https://step1film.se'
};

/* Villkorssidorna, i samma ordning som i sidfoten. */
const LEGAL = [
  { file: 'kopvillkor.html',      sv: 'Köpvillkor',              en: 'Terms of purchase' },
  { file: 'frakt-leverans.html',  sv: 'Frakt & leverans',        en: 'Shipping & delivery' },
  { file: 'retur-angerratt.html', sv: 'Retur & ångerrätt',       en: 'Returns & right of withdrawal' },
  { file: 'integritetspolicy.html', sv: 'Integritetspolicy',     en: 'Privacy policy' }
];

const T = {
  sv: {
    subject: (ref) => `Tack för din beställning — ${ref}`,
    hi: (name) => `Hej ${name},`,
    intro: 'tack för din beställning! Betalningen är genomförd och ordern är på väg till tryckeriet.',
    orderNo: 'Ordernummer',
    yourOrder: 'Din beställning',
    shipping: 'Frakt',
    freeShipping: 'Fri frakt',
    total: 'Totalt',
    vatNote: 'Alla priser inkl. moms.',
    deliverTo: 'Levereras till',
    guideTitle: 'Så går det till härnäst',
    guide: [
      ['Trycket startar', 'Varje plagg trycks upp när du beställt det — ingenting ligger på lager. Det tar normalt 2–5 arbetsdagar.'],
      ['Paketet skickas', 'Du får ett mejl med spårningslänk så fort paketet lämnat tryckeriet.'],
      ['Leverans', 'Räkna med 5–10 arbetsdagar totalt inom Sverige. Utanför Sverige kan det ta längre.']
    ],
    goodTitle: 'Bra att veta',
    good: [
      'Delar av beställningen kan komma i olika paket om de trycks på olika ställen. Du betalar inte extra frakt för det.',
      'Du har 14 dagars ångerrätt från den dag du fick paketet. Varan ska vara oanvänd och i originalskick.',
      'Är något fel eller skadat — mejla oss med ordernumret och en bild, så löser vi det utan att du behöver returnera först.',
      'Tvätta plaggen ut och in i 30°, torktumla inte trycket. Då håller det i åratal.'
    ],
    contactTitle: 'Frågor om ordern?',
    contact: (mail) => `Svara på det här mejlet eller skriv till ${mail}. Ha ordernumret till hands, så går det fortare.`,
    legalTitle: 'Villkor',
    footNote: 'Det här mejlet är din orderbekräftelse — spara det.'
  },
  en: {
    subject: (ref) => `Thanks for your order — ${ref}`,
    hi: (name) => `Hi ${name},`,
    intro: 'thank you for your order! The payment went through and your order is on its way to the print house.',
    orderNo: 'Order number',
    yourOrder: 'Your order',
    shipping: 'Shipping',
    freeShipping: 'Free shipping',
    total: 'Total',
    vatNote: 'All prices include VAT.',
    deliverTo: 'Delivered to',
    guideTitle: 'What happens next',
    guide: [
      ['Printing starts', 'Every piece is printed after you order it — nothing sits in a warehouse. That normally takes 2–5 working days.'],
      ['The parcel ships', 'You get an email with a tracking link as soon as it leaves the print house.'],
      ['Delivery', 'Expect 5–10 working days in total within Sweden. Outside Sweden it can take longer.']
    ],
    goodTitle: 'Good to know',
    good: [
      'Parts of your order may arrive in separate parcels if they are printed in different places. You are never charged extra shipping for that.',
      'You have 14 days to change your mind, counted from the day the parcel reached you. The item must be unused and in original condition.',
      'If something is wrong or damaged — email us with the order number and a photo and we will sort it out, no return needed first.',
      'Wash inside out at 30°C and keep the print out of the tumble dryer. It will last for years.'
    ],
    contactTitle: 'Questions about your order?',
    contact: (mail) => `Just reply to this email, or write to ${mail}. Have the order number ready and it goes faster.`,
    legalTitle: 'Terms',
    footNote: 'This email is your order confirmation — keep it.'
  }
};

/** Escapar text som ska in i HTML. Kundnamn och adress kommer utifrån. */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function lineLabel(l) {
  return [l.name, l.color, l.size].filter(Boolean).join(' · ');
}

/** Ren textversion — når fram även i klienter som blockar HTML. */
function textBody(order, t, lang) {
  const rows = order.lines.map((l) => `  ${l.qty}× ${lineLabel(l)} — ${l.lineTotal} kr`).join('\n');
  const r = order.recipient || {};
  return [
    t.hi(r.name || ''),
    '',
    t.intro,
    '',
    `${t.orderNo}: ${order.reference}`,
    '',
    `${t.yourOrder}:`,
    rows,
    `  ${order.shipping === 0 ? t.freeShipping : t.shipping} — ${order.shipping} kr`,
    `  ${t.total}: ${order.total} kr`,
    `  ${t.vatNote}`,
    '',
    `${t.deliverTo}:`,
    `  ${r.name || ''}`,
    `  ${r.address1 || ''}${r.address2 ? ', ' + r.address2 : ''}`,
    `  ${r.zip || ''} ${r.city || ''}, ${r.country_code || 'SE'}`,
    '',
    `${t.guideTitle}:`,
    ...t.guide.map(([h, b], i) => `  ${i + 1}. ${h} — ${b}`),
    '',
    `${t.goodTitle}:`,
    ...t.good.map((g) => `  • ${g}`),
    '',
    `${t.contactTitle}`,
    `  ${t.contact(COMPANY.email)}`,
    '',
    `${t.legalTitle}: ` + LEGAL.map((l) => `${l[lang]} ${COMPANY.site}/${l.file}`).join(' · '),
    '',
    `${COMPANY.brand} · ${COMPANY.legalName} · ${COMPANY.addressLine}`,
    t.footNote
  ].join('\n');
}

/** HTML-versionen — tabellbaserad så den håller i Outlook och Gmail. */
function htmlBody(order, t, lang) {
  const r = order.recipient || {};
  const ink = '#111'; const dim = '#6b6b6b'; const rule = '#e6e3de';

  const rows = order.lines.map((l) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${rule};font:400 15px/1.4 Helvetica,Arial,sans-serif;color:${ink}">
          ${esc(lineLabel(l))}<br><span style="font-size:13px;color:${dim}">${l.qty} × ${l.unitPrice} kr</span>
        </td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid ${rule};font:400 15px/1.4 Helvetica,Arial,sans-serif;color:${ink};white-space:nowrap">
          ${l.lineTotal} kr
        </td>
      </tr>`).join('');

  const steps = t.guide.map(([h, b], i) => `
      <tr>
        <td width="28" valign="top" style="padding:0 0 14px;font:700 15px/1.5 Helvetica,Arial,sans-serif;color:${dim}">${i + 1}</td>
        <td style="padding:0 0 14px;font:400 15px/1.55 Helvetica,Arial,sans-serif;color:${ink}">
          <strong>${h}</strong><br><span style="color:${dim}">${b}</span>
        </td>
      </tr>`).join('');

  const good = t.good.map((g) => `
      <li style="margin:0 0 8px;font:400 14px/1.6 Helvetica,Arial,sans-serif;color:${dim}">${g}</li>`).join('');

  const legal = LEGAL.map((l) =>
    `<a href="${COMPANY.site}/${l.file}" style="color:${dim};text-decoration:underline">${l[lang]}</a>`
  ).join(' &nbsp;·&nbsp; ');

  return `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(t.subject(order.reference))}</title></head>
<body style="margin:0;padding:0;background:#f4f2ee">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ee">
<tr><td align="center" style="padding:32px 16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:14px;padding:32px 28px">

    <tr><td style="padding:0 0 6px;font:700 13px/1 Helvetica,Arial,sans-serif;letter-spacing:.22em;color:${ink}">
      STEP1<span style="color:${dim}">FILM</span> STORE
    </td></tr>
    <tr><td style="padding:0 0 22px;font:400 13px/1 Helvetica,Arial,sans-serif;color:${dim}">
      ${t.orderNo} ${esc(order.reference)}
    </td></tr>

    <tr><td style="padding:0 0 20px;font:400 16px/1.6 Helvetica,Arial,sans-serif;color:${ink}">
      ${esc(t.hi(r.name || ''))}<br>${t.intro}
    </td></tr>

    <tr><td style="padding:8px 0 4px;font:700 12px/1 Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:${dim}">
      ${t.yourOrder}
    </td></tr>
    <tr><td style="padding:0 0 6px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${rows}
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid ${rule};font:400 15px/1.4 Helvetica,Arial,sans-serif;color:${dim}">
            ${order.shipping === 0 ? t.freeShipping : t.shipping}
          </td>
          <td align="right" style="padding:10px 0;border-bottom:1px solid ${rule};font:400 15px/1.4 Helvetica,Arial,sans-serif;color:${dim};white-space:nowrap">
            ${order.shipping} kr
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0 2px;font:700 17px/1.4 Helvetica,Arial,sans-serif;color:${ink}">${t.total}</td>
          <td align="right" style="padding:12px 0 2px;font:700 17px/1.4 Helvetica,Arial,sans-serif;color:${ink};white-space:nowrap">${order.total} kr</td>
        </tr>
        <tr><td colspan="2" style="font:400 12px/1.4 Helvetica,Arial,sans-serif;color:${dim}">${t.vatNote}</td></tr>
      </table>
    </td></tr>

    <tr><td style="padding:24px 0 4px;font:700 12px/1 Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:${dim}">
      ${t.deliverTo}
    </td></tr>
    <tr><td style="padding:0 0 20px;font:400 15px/1.6 Helvetica,Arial,sans-serif;color:${ink}">
      ${esc(r.name)}<br>
      ${esc(r.address1)}${r.address2 ? '<br>' + esc(r.address2) : ''}<br>
      ${esc(r.zip)} ${esc(r.city)}, ${esc(r.country_code || 'SE')}
    </td></tr>

    <tr><td style="padding:14px 0 12px;border-top:1px solid ${rule};font:700 12px/1 Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:${dim}">
      ${t.guideTitle}
    </td></tr>
    <tr><td style="padding:0 0 6px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${steps}</table>
    </td></tr>

    <tr><td style="padding:14px 0 8px;border-top:1px solid ${rule};font:700 12px/1 Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:${dim}">
      ${t.goodTitle}
    </td></tr>
    <tr><td style="padding:0 0 14px">
      <ul style="margin:0;padding:0 0 0 18px">${good}</ul>
    </td></tr>

    <tr><td style="padding:14px 0 20px;border-top:1px solid ${rule};font:400 15px/1.6 Helvetica,Arial,sans-serif;color:${ink}">
      <strong>${t.contactTitle}</strong><br>
      <span style="color:${dim}">${t.contact(`<a href="mailto:${COMPANY.email}" style="color:${ink}">${COMPANY.email}</a>`)}</span>
    </td></tr>

    <tr><td style="padding:16px 0 0;border-top:1px solid ${rule};font:400 12px/1.7 Helvetica,Arial,sans-serif;color:${dim}">
      ${t.legalTitle}: ${legal}<br><br>
      ${COMPANY.brand} · ${COMPANY.legalName} · ${COMPANY.addressLine}<br>
      ${t.footNote}
    </td></tr>

  </table>
</td></tr></table>
</body></html>`;
}

/**
 * Skickar orderbekräftelsen. Kastar aldrig.
 * @param {{reference:string, recipient:object, lines:Array, shipping:number, total:number, lang?:string}} order
 * @returns {Promise<{ok:boolean, skipped?:boolean, reason?:string, id?:string}>}
 */
async function sendOrderConfirmation(order) {
  const to = order.recipient && order.recipient.email;
  if (!to) return { ok: false, skipped: true, reason: 'Kundens e-postadress saknas' };

  const lang = order.lang === 'en' ? 'en' : 'sv';
  const t = T[lang];

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    // Inte påslaget än — logga så ordern går att bekräfta för hand.
    console.warn(`[email] Ej konfigurerad (RESEND_API_KEY/EMAIL_FROM saknas). Bekräftelse till ${to} för ${order.reference} skickades INTE.`);
    return { ok: false, skipped: true, reason: 'RESEND_API_KEY/EMAIL_FROM saknas' };
  }

  const body = {
    from,
    to: [to],
    reply_to: COMPANY.email,
    subject: t.subject(order.reference),
    text: textBody(order, t, lang),
    html: htmlBody(order, t, lang)
  };
  if (process.env.EMAIL_BCC) body.bcc = [process.env.EMAIL_BCC];

  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, reason: JSON.stringify(data).slice(0, 300) };
    return { ok: true, id: data.id };
  } catch (err) {
    return { ok: false, reason: String(err && err.message || err) };
  }
}

module.exports = { sendOrderConfirmation, textBody, htmlBody, T, COMPANY, LEGAL };
