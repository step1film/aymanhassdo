/* =====================================================
   STEP1FILM ADMIN — mejlbiblioteket
   =====================================================
   Adresserna på step1film.se ligger hos one.com. one.com har
   inget API för inkommande post — det de erbjuder är IMAP och
   SMTP, alltså samma vägar som ett vanligt mejlprogram. Det är
   därför inkorgen i admin läser direkt ur brevlådan i stället
   för att spara mejlen någonstans på vägen.

   Två saker vinner vi på det:

   1. INGENTING LAGRAS HÄR. Adminsidans övriga innehåll sparas
      genom att skriva till GitHub-repot — och det repot är
      publikt, det är sajten. Ett mejl som hamnade där hade
      legat öppet för vem som helst. Nu passerar mejlen bara
      servern på väg till din skärm.

   2. MX-posterna rörs inte. Byter man leverantör för
      inkommande post slutar de befintliga brevlådorna ta emot.
      Här fortsätter allt precis som förut — admin är bara
      ytterligare ett mejlprogram som tittar i samma låda.

   Skickat mejl läggs dessutom tillbaka i Skickat via IMAP, så
   det syns i telefonens mejlprogram också. Utan det steget hade
   ett svar skickat härifrån varit osynligt överallt annars.

   -----------------------------------------------------
   MILJÖVARIABLER (Netlify → Site settings → Environment)
   -----------------------------------------------------
     MAIL_ACCOUNTS    JSON-lista med brevlådorna, se nedan
     MAIL_IMAP_HOST   valfri, standard imap.one.com
     MAIL_IMAP_PORT   valfri, standard 993
     MAIL_SMTP_HOST   valfri, standard send.one.com
     MAIL_SMTP_PORT   valfri, standard 465

   MAIL_ACCOUNTS är en JSON-array. `namn` är valfritt och blir
   avsändarnamnet; `anvandare` behövs bara om inloggningen är
   något annat än adressen:

     [
       {"adress":"info@step1film.se","losenord":"…","namn":"STEP1FILM"},
       {"adress":"ayman@step1film.se","losenord":"…","namn":"Ayman Hassdo"}
     ]

   ⚠️ Lösenorden här är brevlådornas riktiga lösenord och ger
   full åtkomst till posten. De ligger hos Netlify, aldrig i
   repot, och lämnar aldrig servern — webbläsaren får bara veta
   vilka ADRESSER som finns, aldrig ett lösenord. Har one.com
   appspecifika lösenord är de att föredra framför huvudordet.

   Saknas MAIL_ACCOUNTS är mejlfliken helt avstängd: funktionerna
   svarar 503 och fliken göms i admin.
   ===================================================== */
'use strict';

const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');
const MailComposer = require('nodemailer/lib/mail-composer');
const adressparser = require('nodemailer/lib/addressparser');

const IMAP_HOST = process.env.MAIL_IMAP_HOST || 'imap.one.com';
const IMAP_PORT = Number(process.env.MAIL_IMAP_PORT || 993);
const SMTP_HOST = process.env.MAIL_SMTP_HOST || 'send.one.com';
const SMTP_PORT = Number(process.env.MAIL_SMTP_PORT || 465);

/* Brevlådorna, lästa en gång. Trasig JSON ska inte ta ned
   funktionen — då är mejlfliken bara avstängd, som om
   variabeln saknats. */
let KONTON = [];
try {
  const rad = process.env.MAIL_ACCOUNTS;
  if (rad) {
    const p = JSON.parse(rad);
    if (Array.isArray(p)) {
      KONTON = p.filter(k => k && typeof k.adress === 'string' && typeof k.losenord === 'string');
    }
  }
} catch {
  KONTON = [];
}

const konfigurerad = () => KONTON.length > 0;

/* Bara adresserna ut till webbläsaren — aldrig lösenorden. */
const kontolista = () => KONTON.map(k => ({ adress: k.adress, namn: k.namn || '' }));

const kontoFor = (adress) => {
  const sokt = String(adress || '').trim().toLowerCase();
  return KONTON.find(k => k.adress.trim().toLowerCase() === sokt) || null;
};

/* --- IMAP ---------------------------------------------------------
   En uppkoppling per anrop. Serverlösa funktioner lever bara under
   anropet, så det finns inget att återanvända mellan dem — och en
   kvarglömd socket hade hållit funktionen vid liv tills den timade
   ut. Därför alltid logout i finally. */
async function medImap(konto, arbete) {
  const klient = new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    secure: true,
    auth: { user: konto.anvandare || konto.adress, pass: konto.losenord },
    logger: false,
    /* one.com svarar snabbt. Tar det längre än så är något fel, och
       Netlify klipper ändå anropet vid tio sekunder — bättre att ge
       ett begripligt fel än att bli avhuggen mitt i. */
    socketTimeout: 8000,
    greetingTimeout: 5000
  });
  await klient.connect();
  try {
    return await arbete(klient);
  } finally {
    try { await klient.logout(); } catch { /* stängd ändå */ }
  }
}

/* Mappnamnen skiljer sig mellan servrar: Skickat, Sent, Sent Items.
   IMAP har en standard för att märka ut dem (SPECIAL-USE) och
   ImapFlow läser den åt oss. Hittas ingen märkning gissar vi på
   namnet, och hittas inget alls hoppar vi över steget hellre än att
   skriva brevet i fel mapp. */
async function hittaMapp(klient, sort) {
  const lista = await klient.list();
  const flaggad = lista.find(m => m.specialUse === sort);
  if (flaggad) return flaggad.path;
  const namn = {
    '\\Sent':  ['sent', 'skickat', 'sent items', 'skickade', 'skickad post'],
    '\\Drafts':['drafts', 'utkast'],
    '\\Trash': ['trash', 'papperskorg', 'borttaget']
  }[sort] || [];
  const gissad = lista.find(m => namn.includes(m.path.toLowerCase()) || namn.includes((m.name || '').toLowerCase()));
  return gissad ? gissad.path : null;
}

/* Rubrikerna i en mapp, nyast först.
   Bara kuvertet hämtas — avsändare, ämne, datum, storlek. Att läsa
   brödtexten för varje rad hade gjort listan tiotals gånger tyngre
   utan att något av det syns i den. */
async function lista(konto, { mapp = 'INBOX', fran = 0, antal = 25 } = {}) {
  return medImap(konto, async (klient) => {
    const las = await klient.getMailboxLock(mapp);
    try {
      const totalt = klient.mailbox.exists;
      if (!totalt) return { totalt: 0, brev: [] };

      /* IMAP numrerar äldst först. Vi vill ha nyast först, så vi
         räknar fram fönstret bakifrån. */
      const slut = Math.max(1, totalt - fran);
      const start = Math.max(1, slut - antal + 1);
      if (slut < start) return { totalt, brev: [] };

      const brev = [];
      for await (const m of klient.fetch(`${start}:${slut}`, {
        uid: true, envelope: true, flags: true, size: true, bodyStructure: true
      })) {
        const e = m.envelope || {};
        const avs = (e.from && e.from[0]) || {};
        brev.push({
          uid: m.uid,
          amne: e.subject || '(utan ämne)',
          franNamn: avs.name || '',
          franAdress: avs.address || '',
          datum: e.date ? new Date(e.date).toISOString() : null,
          last: m.flags ? m.flags.has('\\Seen') : false,
          storlek: m.size || 0,
          bilagor: harBilaga(m.bodyStructure)
        });
      }
      brev.reverse();
      return { totalt, brev };
    } finally {
      las.release();
    }
  });
}

function harBilaga(del) {
  if (!del) return false;
  if (del.disposition === 'attachment') return true;
  if (Array.isArray(del.childNodes)) return del.childNodes.some(harBilaga);
  return false;
}

/* Ett helt brev. Källan hämtas rå och tolkas här — mailparser klarar
   teckenkodningar, flerdelade brev och bilagor, och det är inte
   något man skriver själv en fredag. */
async function las(konto, { mapp = 'INBOX', uid }) {
  return medImap(konto, async (klient) => {
    const las = await klient.getMailboxLock(mapp);
    try {
      const m = await klient.fetchOne(String(uid), { source: true, flags: true }, { uid: true });
      if (!m || !m.source) return null;
      const p = await simpleParser(m.source);

      /* Markera som läst först när brevet faktiskt öppnats. */
      try { await klient.messageFlagsAdd(String(uid), ['\\Seen'], { uid: true }); } catch {}

      const adr = (f) => (f && f.value ? f.value.map(v => ({ namn: v.name || '', adress: v.address || '' })) : []);
      return {
        uid: Number(uid),
        amne: p.subject || '(utan ämne)',
        fran: adr(p.from),
        till: adr(p.to),
        kopia: adr(p.cc),
        datum: p.date ? p.date.toISOString() : null,
        html: p.html || '',
        text: p.text || '',
        messageId: p.messageId || '',
        bilagor: (p.attachments || []).map(b => ({
          namn: b.filename || 'bilaga',
          typ: b.contentType || '',
          storlek: b.size || 0
        }))
      };
    } finally {
      las.release();
    }
  });
}

/* Skicka, och lägg tillbaka en kopia i Skickat.
   SMTP skickar brevet men lämnar inget spår i brevlådan — det steget
   gör mejlprogram själva. Utan det hade ett svar skrivet här varit
   osynligt i telefonen. */
async function skicka(konto, { till, kopia, amne, text, svarPa, referenser }) {
  const post = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: konto.anvandare || konto.adress, pass: konto.losenord }
  });

  const brev = {
    from: konto.namn ? `${konto.namn} <${konto.adress}>` : konto.adress,
    to: till,
    subject: amne,
    text
  };
  if (kopia) brev.cc = kopia;
  /* In-Reply-To och References är det som gör att svaret hamnar i
     samma tråd hos mottagaren i stället för som ett löst brev. */
  if (svarPa) {
    brev.inReplyTo = svarPa;
    brev.references = referenser || svarPa;
  }

  /* Brevet byggs en gång, till färdiga byte. Samma byte går ut på
     SMTP och läggs i Skickat — annars hade kopian kunnat skilja sig
     från det mottagaren fick. (sendMail ger bara tillbaka källan när
     den skriver till en ström, aldrig över SMTP, så den måste
     byggas här.) */
  const ravara = await new MailComposer(brev).compile().build();

  /* Kuvertet måste räknas fram själv när brevet skickas färdigbyggt.
     Fälten är en kommalista och kan innehålla namn — hit ska bara de
     rena adresserna. */
  const rena = (v) => adressparser(String(v || '')).map(a => a.address).filter(Boolean);
  const mottagare = rena(till).concat(rena(kopia));
  const kvitto = await post.sendMail({
    envelope: { from: konto.adress, to: mottagare },
    raw: ravara
  });

  let iSkickat = false;
  try {
    await medImap(konto, async (klient) => {
      const mapp = await hittaMapp(klient, '\\Sent');
      if (!mapp) return;
      await klient.append(mapp, ravara, ['\\Seen']);
      iSkickat = true;
    });
  } catch {
    /* Brevet ÄR skickat. Att kopian inte kom på plats är en
       skönhetsfläck, inte ett fel — svaret säger vilket. */
  }

  /* Message-ID läses ur huvudet vi själva byggde. Nodemailer hittar
     på ett eget id för ett färdigbyggt brev, och det står inte i det
     brev som faktiskt gick ut — det är alltså inte det man vill ha
     tillbaka. */
  const idRad = ravara.toString('utf8', 0, 4000).match(/^Message-ID:\s*(<[^>]+>)/mi);
  return { id: idRad ? idRad[1] : (kvitto.messageId || ''), iSkickat };
}

module.exports = { konfigurerad, kontolista, kontoFor, lista, las, skicka, hittaMapp };
