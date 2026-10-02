// Ritar sociala medier-bilder för STEP1 STORE: feed 1080×1350 och story 1080×1920.
// Kör: node social/src/render.js  (kräver playwright + python3 med Pillow)
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const SRC = __dirname;
const ROOT = path.join(SRC, '..', '..');
const OUT = path.join(SRC, '..');
const PREP = fs.mkdtempSync(path.join(os.tmpdir(), 'social-'));
const products = require('./products.json');

const BLACK = '#121212';
const SAND = '#E8DCC6';

// Formaten. "img" är produktrutans höjd; den är full bredd och utgör ≥ 65 % av ytan.
const FORMATS = {
  feed:  { w: 1080, h: 1350, top: 56,  logo: 40, gap: 34, img: 880,  name: 46, price: 36, btnW: 400, btnH: 88, btnFs: 30, url: 26 },
  story: { w: 1080, h: 1920, top: 150, logo: 44, gap: 40, img: 1260, name: 52, price: 40, btnW: 440, btnH: 100, btnFs: 34, url: 28 },
};

const url = p => 'file://' + p;
// Typsnitt och rull-ikon bäddas in som data-URI: Chromium vägrar maskbilder via file://.
const dataUri = (p, type) => `data:${type};base64,${fs.readFileSync(p).toString('base64')}`;
const INTER = dataUri(path.join(SRC, 'fonts/inter-var-latin.woff2'), 'font/woff2');
const BEBAS = dataUri(path.join(ROOT, 'assets/fonts/bebas-neue-400-latin.woff2'), 'font/woff2');
const REEL = dataUri(path.join(ROOT, 'cursor.png'), 'image/png');

function html(p, f) {
  return `<!doctype html><html><head><meta charset="utf-8">
<style>
@font-face { font-family: 'Inter'; font-weight: 100 900; src: url('${INTER}') format('woff2'); }
@font-face { font-family: 'Bebas Neue'; src: url('${BEBAS}') format('woff2'); }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: ${f.w}px; height: ${f.h}px; background: ${SAND}; color: ${BLACK}; overflow: hidden; }
body { font-family: Inter, sans-serif; display: flex; flex-direction: column; align-items: center; padding-top: ${f.top}px; }
.logo { font-family: 'Bebas Neue', sans-serif; font-size: ${f.logo}px; letter-spacing: .14em; line-height: 1; white-space: nowrap; }
.reel { display: inline-block; width: 1em; height: 1em; vertical-align: -.14em; margin-right: .38em; background: ${BLACK};
        -webkit-mask: url('${REEL}') center / contain no-repeat; }
.img { width: ${f.w}px; height: ${f.img}px; margin-top: ${f.gap}px; padding: 24px 60px; display: flex; align-items: center; justify-content: center; }
.img img { max-width: 100%; max-height: 100%; object-fit: contain; filter: drop-shadow(0 28px 34px rgba(18,18,18,.22)); }
.name { margin-top: ${f.gap}px; font-weight: 700; font-size: ${f.name}px; letter-spacing: .06em; line-height: 1.1; }
.price { margin-top: ${Math.round(f.name * .25)}px; font-weight: 400; font-size: ${f.price}px; letter-spacing: .02em; line-height: 1.1; }
.btn { margin-top: ${f.gap}px; width: ${f.btnW}px; height: ${f.btnH}px; background: ${BLACK}; color: ${SAND}; border-radius: ${f.btnH / 2}px;
       display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: ${f.btnFs}px; letter-spacing: .16em; padding-left: .16em; }
.url { margin-top: ${Math.round(f.gap * .5)}px; font-weight: 500; font-size: ${f.url}px; letter-spacing: .04em; }
</style></head><body>
<div class="logo"><i class="reel"></i>STEP1 FILM</div>
<div class="img"><img src="${url(path.join(PREP, p.id + '.png'))}"></div>
<div class="name">${p.name}</div>
<div class="price">${p.price} kr</div>
<div class="btn">HANDLA NU</div>
<div class="url">step1film.se/store</div>
</body></html>`;
}

(async () => {
  execFileSync('python3', [path.join(SRC, 'prep.py')], { env: { ...process.env, PREP_DIR: PREP }, stdio: 'inherit' });
  const browser = await chromium.launch();
  for (const [fmt, f] of Object.entries(FORMATS)) {
    fs.mkdirSync(path.join(OUT, fmt), { recursive: true });
    const page = await browser.newPage({ viewport: { width: f.w, height: f.h } });
    for (const [i, p] of products.entries()) {
      const file = path.join(PREP, `${fmt}-${p.id}.html`);
      fs.writeFileSync(file, html(p, f));
      await page.goto(url(file), { waitUntil: 'networkidle' });
      const fonts = await page.evaluate(async () => { await document.fonts.ready; return [...document.fonts].filter(x => x.status === 'loaded').map(x => x.family); });
      if (!fonts.includes('Inter') || !fonts.includes('Bebas Neue')) throw new Error('typsnitt saknas: ' + fonts);
      const bottom = await page.evaluate(() => document.querySelector('.url').getBoundingClientRect().bottom);
      if (bottom > f.h) throw new Error(`${fmt}/${p.id}: texten går utanför bilden (${bottom}px)`);
      const out = path.join(OUT, fmt, `${String(i + 1).padStart(2, '0')}-${p.id}-${fmt}.jpg`);
      await page.screenshot({ path: out, type: 'jpeg', quality: 92 });
      console.log(out, `bottom=${Math.round(bottom)}`);
    }
    await page.close();
  }
  await browser.close();
})();
