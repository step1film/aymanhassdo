# STEP1FILM — Ayman Hassdo

Personal portfolio for filmmaker Ayman Hassdo (STEP1FILM).

## Files

| File | Purpose |
|---|---|
| `index.html` | Page markup |
| `style.css` | All styling |
| `main.js` | Loader, clapperboard scroll, hero video, cursor, tweaks |
| `image-slot.js` | Drag-and-drop image placeholders (films, portrait) |
| `shop.html` | Merch store — tees, hoodies, caps, mugs |
| `shop.css` | Store styling (matches the film site) |
| `shop.js` | Store logic: products, live colour preview, cart, SV/EN, checkout |
| `bg-stage.jpg` | Background behind the clapperboard |
| `cursor.png` | Custom cursor |
| `robots.txt` | Search engine directive |
| `sitemap.xml` | Sitemap for search engines |

## Deploy to GitHub Pages

1. Create a repo (e.g. `step1film/myweb`) on GitHub.
2. Upload all the files above to the **root** of the repo.
3. Go to **Settings → Pages → Source → Deploy from a branch → main → / (root)**.
4. Wait ~1 minute. Your site will be live at `https://<username>.github.io/<repo>/`.

## Change the showreel video

Open `index.html`, find this line near the bottom:

```js
window.STEP1FILM_VIDEO = { provider: 'youtube', id: 'bW9R0R8KKw8' };
```

Replace the `id` with your YouTube video ID. For Vimeo, change `provider` to `'vimeo'`.

## Drop your own stills

Open the site, scroll to the Films panel, and **drag any image onto a thumbnail slot**. The same works for the About portrait. Images persist in your browser's localStorage.

## The Store (`shop.html`)

A standalone merch store, linked from the **STORE** link in the top bar. It shares
the film site's dark look but runs on its own CSS/JS (no dependency on the loader
or custom cursor).

**Features**
- Products in three categories: **Kläder / Clothing**, **Kepsar / Caps**, **Muggar / Mugs**.
- **Live colour preview** — the garment illustration recolours instantly when you pick a swatch.
- Size selection (clothing) and category filtering.
- Cart with quantity control, saved in `localStorage`.
- **SV / EN** language toggle (remembered between visits).
- Checkout collects the order and opens a pre-filled e-mail to `step1film@gmail.com`.

**Editing the store** — open `shop.js`:
- `PRODUCTS` — add/rename items, set prices, colours and sizes.
- `COLORS` — the colour palette (hex + Swedish/English names) used for the previews.
- `CONFIG` — currency, order e-mail, and a `swishNumber` slot for later.

**Payment** is deliberately not wired yet — checkout sends an order request by
e-mail. Real payment (Swish / card) can be added once the site moves to its own
domain; the `CONFIG` block already has a place for the Swish number.

## Domain / SEO

When you point a custom domain at the GitHub Pages deploy, update these URLs in `index.html` (search for `step1film.com`) and in `sitemap.xml`.
