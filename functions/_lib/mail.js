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
       {"adress":"ayman@step1film.se","losenord":"…","namn":"Ayman Hassdo"},
       {"adress":"info@step1film.se","losenord":"…","namn":"STEP1FILM"},
       {"adress":"shop@step1film.se","losenord":"…","namn":"STEP1FILM STORE"},
       {"adress":"collaboration@step1film.se","losenord":"…","namn":"STEP1FILM"}
     ]

   Ordningen i listan är den ordning brevlådorna står i väljaren,
   och den första är den som öppnas när fliken laddas.

   ⚠️ Lösenorden här är brevlådornas riktiga lösenord och ger
   full åtkomst till posten. De ligger hos Netlify, aldrig i
   repot, och lämnar aldrig servern — webbläsaren får bara veta
   vilka ADRESSER som finns, aldrig ett lösenord. Har one.com
   appspecifika lösenord är de att föredra framför huvudordet.

   Saknas MAIL_ACCOUNTS är mejlfliken helt avstängd: funktionerna
   svarar 503 och fliken göms i admin.
   ===================================================== */
'use strict';

const crypto = require('crypto');
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

/* Vilken brevlåda ska ett automatiskt brev gå ut från?
   Den önskade om den finns, annars den första i listan. Ett kvitto som
   kommer från fel avsändare är bättre än inget kvitto alls — och den
   som satt EMAIL_FROM till en adress som inte är uppsatt ska inte
   upptäcka det genom att kunderna slutar få brev. */
const avsandare = (onskad) => {
  const k = kontoFor(onskad);
  if (k) return k.adress;
  return KONTON.length ? KONTON[0].adress : '';
};

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
    '\\Trash': ['trash', 'papperskorg', 'borttaget', 'deleted items', 'deleted messages'],
    '\\Junk':  ['junk', 'spam', 'skräppost', 'junk e-mail', 'junk email', 'bulk mail']
  }[sort] || [];
  const gissad = lista.find(m => namn.includes(m.path.toLowerCase()) || namn.includes((m.name || '').toLowerCase()));
  return gissad ? gissad.path : null;
}

/* Webbläsaren väljer mapp med ett av två ord, aldrig med ett
   mappnamn: Skickat heter olika på olika servrar, och ett fritt
   namn hade låtit vem som helst med en session peta i vilken mapp
   som helst. Hittas mappen inte blir svaret null. */
const MAPPAR = ['inkorg', 'skickat', 'utkast', 'skrap', 'papperskorg'];
const SPECIAL = { skickat: '\\Sent', utkast: '\\Drafts', skrap: '\\Junk', papperskorg: '\\Trash' };
async function mappFor(klient, mapp) {
  if (SPECIAL[mapp]) return hittaMapp(klient, SPECIAL[mapp]);
  return 'INBOX';
}

/* Rubrikerna i en mapp, nyast först.
   Bara kuvertet hämtas — avsändare, ämne, datum, storlek. Att läsa
   brödtexten för varje rad hade gjort listan tiotals gånger tyngre
   utan att något av det syns i den. */
async function lista(konto, { mapp = 'inkorg', fran = 0, antal = 25, sok = '' } = {}) {
  return medImap(konto, async (klient) => {
    const sokvag = await mappFor(klient, mapp);
    if (!sokvag) return { totalt: 0, brev: [], saknas: true };
    const las = await klient.getMailboxLock(sokvag);
    try {
      const antalIMappen = klient.mailbox.exists;
      if (!antalIMappen) return { totalt: 0, brev: [] };

      /* Vilka brev ska med? Utan sökord: ett fönster räknat bakifrån,
         eftersom IMAP numrerar äldst först. Med sökord: servern letar
         i avsändare, mottagare, ämne och text, och vi bläddrar bland
         träffarna, nyast (högst uid) först. */
      let urval, totalt, uid = false;
      if (sok) {
        const traffar = await klient.search({
          or: [{ subject: sok }, { from: sok }, { to: sok }, { body: sok }]
        }, { uid: true }) || [];
        traffar.sort((a, b) => b - a);
        totalt = traffar.length;
        const sida = traffar.slice(fran, fran + antal);
        if (!sida.length) return { totalt, brev: [] };
        urval = sida.join(',');
        uid = true;
      } else {
        totalt = antalIMappen;
        const slut = Math.max(1, totalt - fran);
        const start = Math.max(1, slut - antal + 1);
        if (fran >= totalt) return { totalt, brev: [] };
        urval = `${start}:${slut}`;
      }

      const brev = [];
      for await (const m of klient.fetch(urval, {
        uid: true, envelope: true, flags: true, size: true, bodyStructure: true
      }, { uid })) {
        const e = m.envelope || {};
        const avs = (e.from && e.from[0]) || {};
        /* I Skickat är det mottagaren som ska stå på raden, inte du. */
        const mott = [].concat(e.to || [], e.cc || []);
        brev.push({
          uid: m.uid,
          amne: e.subject || '(utan ämne)',
          franNamn: avs.name || '',
          franAdress: avs.address || '',
          till: mott.map(t => t.name || t.address || '').filter(Boolean),
          datum: e.date ? new Date(e.date).toISOString() : null,
          last: m.flags ? m.flags.has('\\Seen') : false,
          storlek: m.size || 0,
          bilagor: harBilaga(m.bodyStructure)
        });
      }
      brev.sort((a, b) => b.uid - a.uid);
      return { totalt, brev };
    } finally {
      las.release();
    }
  });
}

/* En del räknas som bilaga om den är märkt så — eller om den har ett
   filnamn. Många mejlprogram (Apple Mail, mobiler) skickar PDF:er och
   bilder som `inline` eller helt utan märkning, bara med ett namn.
   Att bara titta på `attachment` gjorde att de aldrig syntes. */
function harBilaga(del) {
  if (!del) return false;
  if (del.disposition === 'attachment') return true;
  const namn = (del.dispositionParameters && del.dispositionParameters.filename)
    || (del.parameters && del.parameters.name);
  if (namn && !/^multipart\//i.test(del.type || '')) return true;
  if (Array.isArray(del.childNodes)) return del.childNodes.some(harBilaga);
  return false;
}

/* Ett helt brev. Källan hämtas rå och tolkas här — mailparser klarar
   teckenkodningar, flerdelade brev och bilagor, och det är inte
   något man skriver själv en fredag. */
async function las(konto, { mapp = 'inkorg', uid }) {
  return medImap(konto, async (klient) => {
    const sokvag = await mappFor(klient, mapp);
    if (!sokvag) return null;
    const las = await klient.getMailboxLock(sokvag);
    try {
      const m = await klient.fetchOne(String(uid), { source: true, flags: true }, { uid: true });
      if (!m || !m.source) return null;
      const p = await simpleParser(m.source, { keepCidLinks: true });

      /* Markera som läst först när brevet faktiskt öppnats. */
      try { await klient.messageFlagsAdd(String(uid), ['\\Seen'], { uid: true }); } catch {}

      const adr = (f) => (f && f.value ? f.value.map(v => ({ namn: v.name || '', adress: v.address || '' })) : []);

      /* Bilder inne i brevet — logotyper i signaturer, inklistrade
         skärmdumpar — pekar på sina bilagor med cid:. Webbläsaren kan
         inte följa en sådan adress, så de små bakas in i HTML:en som
         data:-bilder. Taket håller svaret under Netlifys sex megabyte. */
      let html = p.html || '';
      const inbakade = new Set();
      let utrymme = 2.5 * 1024 * 1024;
      (p.attachments || []).forEach((b, nr) => {
        if (!b.cid || !/^image\//i.test(b.contentType || '') || !b.content) return;
        if (b.content.length > utrymme) return;
        const cid = 'cid:' + b.cid;
        if (!html.includes(cid)) return;
        html = html.split(cid).join(`data:${b.contentType};base64,${b.content.toString('base64')}`);
        utrymme -= b.content.length;
        inbakade.add(nr);
      });

      return {
        uid: Number(uid),
        amne: p.subject || '(utan ämne)',
        fran: adr(p.from),
        till: adr(p.to),
        kopia: adr(p.cc),
        /* Dold kopia syns bara i ditt eget exemplar i Skickat —
           mottagarna får aldrig raden. */
        dold: adr(p.bcc),
        datum: p.date ? p.date.toISOString() : null,
        html,
        text: p.text || '',
        messageId: p.messageId || '',
        svarPa: p.inReplyTo || '',
        referenser: Array.isArray(p.references) ? p.references.join(' ') : (p.references || ''),
        /* nr är bilagans plats i brevet — det är den bilaga() nedan
           frågar efter när en fil ska hämtas. Bilder som redan visas
           inne i texten står inte med i listan, men behåller sitt nr. */
        bilagor: (p.attachments || []).map((b, nr) => ({
          nr,
          namn: b.filename || namnFor(b.contentType),
          typ: b.contentType || '',
          storlek: b.size || 0,
          iTexten: inbakade.has(nr)
        })).filter(b => !b.iTexten)
      };
    } finally {
      las.release();
    }
  });
}

/* Bilagor utan filnamn — vidarebefordrade brev, kalenderinbjudningar,
   bilder inklistrade i brevet — får ett namn efter sin sort, så att det
   syns vad de är och filen får rätt ändelse när den sparas. */
const ANDELSE = {
  'message/rfc822': 'vidarebefordrat-brev.eml',
  'text/calendar': 'inbjudan.ics',
  'text/vcard': 'kontakt.vcf',
  'text/x-vcard': 'kontakt.vcf',
  'text/plain': 'text.txt',
  'text/html': 'sida.html',
  'application/pdf': 'dokument.pdf',
  'image/jpeg': 'bild.jpg',
  'image/png': 'bild.png',
  'image/gif': 'bild.gif',
  'image/webp': 'bild.webp',
  'image/heic': 'bild.heic'
};
function namnFor(typ) {
  return ANDELSE[String(typ || '').toLowerCase()] || 'bilaga';
}

/* En bilaga, som råa byte.
   -----------------------------------------------------
   Brevet hämtas och tolkas på nytt och bilagan plockas ut på sin
   plats i listan — samma ordning som las() gav webbläsaren. IMAP
   kan visserligen hämta en enskild del, men mailparser säger inte
   vilket delnummer en bilaga har, och att räkna fram det själv är
   lätt att göra fel. Brevet markeras inte som läst här; det har
   redan öppnats. */
async function bilaga(konto, { mapp = 'inkorg', uid, nr }) {
  return medImap(konto, async (klient) => {
    const sokvag = await mappFor(klient, mapp);
    if (!sokvag) return null;
    const las = await klient.getMailboxLock(sokvag);
    try {
      const m = await klient.fetchOne(String(uid), { source: true }, { uid: true });
      if (!m || !m.source) return null;
      const p = await simpleParser(m.source);
      const b = (p.attachments || [])[nr];
      if (!b) return null;
      const typ = b.contentType || 'application/octet-stream';
      /* Ett vidarebefordrat brev ligger som rå MIME-källa — kodad och
         oläslig som den är. Det tolkas här så att admin kan visa det
         som vanlig text. Själva filen (.eml) går fortfarande att ladda
         ned orörd. */
      let lasbar = '';
      if (/^message\/rfc822$/i.test(typ)) {
        try {
          const inre = await simpleParser(b.content);
          lasbar = [
            'Från: ' + (inre.from ? inre.from.text : ''),
            'Till: ' + (inre.to ? inre.to.text : ''),
            'Datum: ' + (inre.date ? inre.date.toLocaleString('sv-SE') : ''),
            'Ämne: ' + (inre.subject || ''),
            '',
            inre.text || ''
          ].join('\n');
        } catch { /* då visas den inte, men går att ladda ned */ }
      }
      return {
        namn: b.filename || namnFor(typ),
        typ,
        innehall: b.content,
        lasbar
      };
    } finally {
      las.release();
    }
  });
}

/* Läst eller oläst. */
async function markera(konto, { mapp = 'inkorg', uid, last }) {
  return medImap(konto, async (klient) => {
    const sokvag = await mappFor(klient, mapp);
    if (!sokvag) return false;
    const las = await klient.getMailboxLock(sokvag);
    try {
      if (last) await klient.messageFlagsAdd(String(uid), ['\\Seen'], { uid: true });
      else await klient.messageFlagsRemove(String(uid), ['\\Seen'], { uid: true });
      return true;
    } finally {
      las.release();
    }
  });
}

/* Flytta ett brev mellan två av de kända mapparna — "Inte skräppost",
   "Återställ" ur papperskorgen. Målet anges med samma ord som
   listan använder, aldrig som ett fritt mappnamn. */
async function flytta(konto, { mapp = 'inkorg', uid, till }) {
  return medImap(konto, async (klient) => {
    const fran = await mappFor(klient, mapp);
    const mal = await mappFor(klient, till);
    if (!fran || !mal) return { ok: false };
    if (fran.toLowerCase() === mal.toLowerCase()) return { ok: true };
    const las = await klient.getMailboxLock(fran);
    try {
      await klient.messageMove(String(uid), mal, { uid: true });
      return { ok: true };
    } finally {
      las.release();
    }
  });
}

/* Bilagor ur ett brev som redan ligger i brevlådan, som färdiga
   nodemailer-bilagor. Det är så vidarebefordran tar med originalets
   filer, och så ett utkast behåller sina: filerna går direkt från
   IMAP till SMTP på servern och behöver aldrig via webbläsaren. */
async function bilagorUr(konto, { mapp = 'inkorg', uid, nr }) {
  return medImap(konto, async (klient) => {
    const sokvag = await mappFor(klient, mapp);
    if (!sokvag) return [];
    const las = await klient.getMailboxLock(sokvag);
    try {
      const m = await klient.fetchOne(String(uid), { source: true }, { uid: true });
      if (!m || !m.source) return [];
      const p = await simpleParser(m.source);
      const valda = new Set(nr);
      return (p.attachments || [])
        .map((b, i) => ({ b, i }))
        .filter(({ i }) => valda.has(i))
        .map(({ b }) => ({
          filename: b.filename || namnFor(b.contentType),
          content: b.content,
          contentType: b.contentType || 'application/octet-stream',
          ...(b.cid ? { cid: b.cid } : {})
        }));
    } finally {
      las.release();
    }
  });
}

/* Brevet som nodemailer-objekt — samma för det som skickas och det
   som sparas som utkast. */
function byggBrev(konto, { till, kopia, dold, amne, text, html, bilagor, svarPa, referenser }) {
  const brev = {
    from: konto.namn ? `${konto.namn} <${konto.adress}>` : konto.adress,
    subject: amne || '',
    text: text || ''
  };
  if (till) brev.to = till;
  if (html) {
    /* Bilder som klistrats in i texten eller signaturen ligger som
       data:-adresser. Gmail och Outlook visar inte sådana, så de
       görs om till inbäddade bilagor (cid:), som alla mejlprogram
       klarar. */
    const inbaddade = [];
    html = html.replace(/(<img\b[^>]*?\bsrc\s*=\s*["'])data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)(["'])/gi,
      (hel, fore, typ, data, efter) => {
        const cid = `bild${inbaddade.length + 1}.${crypto.randomBytes(6).toString('hex')}@step1film`;
        const andelse = (typ.split('/')[1] || 'png').replace('jpeg', 'jpg').replace(/\+.*$/, '');
        inbaddade.push({ cid, contentType: typ, filename: `bild${inbaddade.length + 1}.${andelse}`, content: Buffer.from(data.replace(/\s+/g, ''), 'base64') });
        return `${fore}cid:${cid}${efter}`;
      });
    brev.html = html;
    if (inbaddade.length) bilagor = [...(bilagor || []), ...inbaddade];
  }
  if (kopia) brev.cc = kopia;
  if (dold) brev.bcc = dold;
  if (bilagor && bilagor.length) brev.attachments = bilagor;
  /* In-Reply-To och References är det som gör att svaret hamnar i
     samma tråd hos mottagaren i stället för som ett löst brev. */
  if (svarPa) {
    brev.inReplyTo = svarPa;
    brev.references = referenser || svarPa;
  }
  return brev;
}

/* Spara ett utkast i Utkast-mappen, så att det syns i telefonen
   också. IMAP kan inte ändra ett brev, så ett nytt sparande lägger
   in en ny version och tar bort den gamla. */
async function sparaUtkast(konto, data, ersatt) {
  const brev = byggBrev(konto, data);
  brev.date = new Date();
  const nod = new MailComposer(brev).compile();
  nod.keepBcc = true;
  const ravara = await nod.build();
  return medImap(konto, async (klient) => {
    const mapp = await hittaMapp(klient, '\\Drafts');
    if (!mapp) return { ok: false };
    const svar = await klient.append(mapp, ravara, ['\\Draft', '\\Seen']);
    if (ersatt) {
      const las = await klient.getMailboxLock(mapp);
      try { await klient.messageDelete(String(ersatt), { uid: true }); }
      catch { /* den gamla versionen får ligga kvar hellre än att sparandet faller */ }
      finally { las.release(); }
    }
    return { ok: true, uid: (svar && svar.uid) || null };
  });
}

/* Ta bort ett utkast som just skickats. */
async function raderaUtkast(konto, uid) {
  return medImap(konto, async (klient) => {
    const mapp = await hittaMapp(klient, '\\Drafts');
    if (!mapp) return;
    const las = await klient.getMailboxLock(mapp);
    try { await klient.messageDelete(String(uid), { uid: true }); }
    finally { las.release(); }
  });
}

/* Radera ett brev.
   -----------------------------------------------------
   Att radera betyder flytta till papperskorgen, inte utplåna. Det är
   vad varje mejlprogram gör, och det är det enda rimliga här: den som
   råkar trycka fel ska kunna hämta tillbaka brevet i telefonen.

   Står brevet redan i papperskorgen finns ingenstans kvar att flytta
   det. Då raderas det på riktigt — annars hade ett andra tryck inte
   gjort någonting, och papperskorgen aldrig gått att tömma.

   Hittas ingen papperskorg alls (en brevlåda kan sakna den) görs
   ingenting. Att i det läget radera permanent vore att göra mer än
   den som tryckte bad om. */
async function radera(konto, { mapp = 'inkorg', uid }) {
  return medImap(konto, async (klient) => {
    /* Samma mappnamn som listan använder — 'inkorg' och 'skickat' —
       översätts till serverns egna sökvägar. Raderar man ur Skickat
       ska brevet tas därifrån, inte ur inkorgen. */
    const sokvag = await mappFor(klient, mapp);
    if (!sokvag) return { ok: false, skal: 'mappen saknas' };

    const papperskorg = await hittaMapp(klient, '\\Trash');
    if (!papperskorg) return { ok: false, skal: 'ingen papperskorg' };
    const iPapperskorgen = papperskorg.toLowerCase() === sokvag.toLowerCase();

    const las = await klient.getMailboxLock(sokvag);
    try {
      if (iPapperskorgen) {
        await klient.messageDelete(String(uid), { uid: true });
        return { ok: true, borta: true };
      }
      await klient.messageMove(String(uid), papperskorg, { uid: true });
      return { ok: true, borta: false, mapp: papperskorg };
    } finally {
      las.release();
    }
  });
}

/* Skicka, och lägg tillbaka en kopia i Skickat.
   SMTP skickar brevet men lämnar inget spår i brevlådan — det steget
   gör mejlprogram själva. Utan det hade ett svar skrivet här varit
   osynligt i telefonen. */
function smtp(konto, tidsgrans) {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: konto.anvandare || konto.adress, pass: konto.losenord },
    /* Sätts bara för automatiska brev. En hängande SMTP-uppkoppling
       inne i Stripes webhook hade tagit ned hela anropet, och då
       hade ordern sett ut att misslyckas fast den var betald. */
    ...(tidsgrans ? { connectionTimeout: tidsgrans, greetingTimeout: tidsgrans, socketTimeout: tidsgrans } : {})
  });
}

async function skicka(konto, data) {
  const post = smtp(konto);

  const brev = byggBrev(konto, data);
  /* Id och datum sätts här så att brevet som skickas och kopian i
     Skickat — som byggs var för sig, se nedan — blir samma brev. */
  brev.messageId = `<${Date.now().toString(36)}.${crypto.randomBytes(8).toString('hex')}@${konto.adress.split('@')[1] || 'step1film.se'}>`;
  brev.date = new Date();
  const { till, kopia, dold } = data;

  /* Brevet byggs en gång, till färdiga byte. Samma byte går ut på
     SMTP och läggs i Skickat — annars hade kopian kunnat skilja sig
     från det mottagaren fick. (sendMail ger bara tillbaka källan när
     den skriver till en ström, aldrig över SMTP, så den måste
     byggas här.) */
  const ravara = await new MailComposer(brev).compile().build();

  /* Kopian till Skickat byggs en gång till, med Bcc-raden kvar.
     Den som skickar ska kunna se vem som fick en dold kopia; de som
     tog emot brevet ska inte. Utan dold kopia är de två identiska. */
  let skickatKopia = ravara;
  if (dold) {
    const nod = new MailComposer(brev).compile();
    nod.keepBcc = true;
    skickatKopia = await nod.build();
  }

  /* Kuvertet måste räknas fram själv när brevet skickas färdigbyggt.
     Fälten är en kommalista och kan innehålla namn — hit ska bara de
     rena adresserna. */
  const rena = (v) => adressparser(String(v || '')).map(a => a.address).filter(Boolean);
  const mottagare = rena(till).concat(rena(kopia), rena(dold));
  const kvitto = await post.sendMail({
    envelope: { from: konto.adress, to: mottagare },
    raw: ravara
  });

  let iSkickat = false;
  try {
    await medImap(konto, async (klient) => {
      const mapp = await hittaMapp(klient, '\\Sent');
      if (!mapp) return;
      await klient.append(mapp, skickatKopia, ['\\Seen']);
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

/* --- Automatiska brev ------------------------------------------------
   Orderbekräftelsen och samarbetsförfrågan går samma väg som posten
   du skriver själv: SMTP hos one.com, från en brevlåda som redan står
   i MAIL_ACCOUNTS. Ingen ny leverantör, inga nya DNS-poster — SPF och
   DKIM är redan utfärdade för one.coms servrar, så breven är signerade
   från första dagen.

   Skillnaden mot skicka() ovan: ingen kopia läggs i Skickat (en
   orderbekräftelse hör hemma hos kunden, inte i din inkorg — använd
   dold kopia om du vill ha den), brevet får ha HTML, och uppkopplingen
   har en tidsgräns eftersom den sker mitt i ett serveranrop. */
async function skickaBrev({ fran, till, amne, text, html, svaraTill, hemligKopia }) {
  const konto = kontoFor(fran);
  if (!konto) throw new Error(`Avsändaren ${fran} finns inte i MAIL_ACCOUNTS.`);

  const post = smtp(konto, 7000);
  const brev = {
    from: konto.namn ? `${konto.namn} <${konto.adress}>` : konto.adress,
    to: till,
    subject: amne,
    text
  };
  if (html) brev.html = html;
  if (svaraTill) brev.replyTo = svaraTill;
  if (hemligKopia) brev.bcc = hemligKopia;

  const kvitto = await post.sendMail(brev);
  return { id: kvitto.messageId || '' };
}

module.exports = { MAPPAR, byggBrev, konfigurerad, kontolista, kontoFor, avsandare, lista, las, bilaga, bilagorUr, markera, flytta, radera, skicka, sparaUtkast, raderaUtkast, skickaBrev, hittaMapp };
