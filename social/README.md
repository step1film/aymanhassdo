# Sociala medier — STEP1 STORE

Färdiga produktbilder för Instagram, Facebook och TikTok.

- `feed/` — 1080×1350 JPG (inlägg)
- `story/` — 1080×1920 JPG (story / reel-omslag)

Produkterna, namnen och priserna står i `src/products.json` (hämtade från `PRODUCTS` i `shop.js`).
Ändras ett pris eller byts en produkt: uppdatera `products.json` och kör

```
NODE_PATH=$(npm root -g) node social/src/render.js
```

(kräver Playwright och Python med Pillow).
