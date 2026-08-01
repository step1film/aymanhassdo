# Adminsidan — så sätter du igång den

Adminsidan ligger på **step1film.se/admin**. Där ändrar du texter,
filmer, CV, videoklipp, produkter, priser och bilder. När du sparar
skrivs ändringen in i GitHub, och sajten byggs om av sig själv — det
tar ungefär en minut.

Just nu svarar admin **503 "Admin är inte igångsatt"**. Fyra
miljövariabler saknas i Netlify. När de är på plats fungerar den.

---

## Del 1 — Skapa ett GitHub-token

Det är den här nyckeln som ger admin rätt att skriva i repot. Den ska
vara så snäv som möjligt: bara ditt repo, bara filer.

1. Gå till <https://github.com/settings/personal-access-tokens/new>
2. Fyll i:
   - **Token name:** `step1film-admin`
   - **Expiration:** 1 år (skriv upp datumet — den slutar fungera då)
   - **Resource owner:** `step1film`
   - **Repository access:** *Only select repositories* →
     välj **step1film/aymanhassdo** och ingen annan
   - **Repository permissions** → **Contents:** `Read and write`
     (Allt annat lämnar du på *No access*.)
3. **Generate token** och kopiera strängen som börjar med `github_pat_…`

Den visas bara en gång. Tappar du bort den får du skapa en ny.

---

## Del 2 — Bestäm ditt lösenord

Det finns inget lösenord än, och det står ingenstans i koden. Du hittar
på det själv nu.

**Varför inte i koden?** Allt i repot går att läsa. Ett lösenord i en
fil vore som att tejpa nyckeln på dörren. Därför ligger det som en
*miljövariabel* hos Netlify — ett värde bara servern ser, aldrig
webbläsaren och aldrig git.

Du behöver två strängar.

### ADMIN_PASSWORD — det du skriver in

Det här är ditt lösenord. Minst 20 tecken.

Enklaste sättet att få ett som är både starkt och möjligt att komma
ihåg: **fyra ord som inte hör ihop, med bindestreck emellan.**

```
kamera-fjäril-tegel-nionde
stativ-hallon-oktober-brygga
```

Hitta på dina egna. Fyra slumpmässiga svenska ord är svårare att gissa
än `Sommar2026!` — och lättare att minnas.

Undvik: ditt namn, STEP1FILM, födelseår, adressen, något du använder
någon annanstans.

### ADMIN_SECRET — den du aldrig ser

Den används för att signera din inloggning så att ingen kan förfalska
en. Du skriver aldrig in den. Den ska vara ren slump.

Har du en terminal:

```
openssl rand -base64 48
```

Har du inte det: gå till <https://www.random.org/strings/> och be om
**4 strängar, 20 tecken, med både siffror och bokstäver**, och klistra
ihop dem till en enda lång rad.

### Skriv ner båda innan du går vidare

Netlify visar dem aldrig igen efter att du sparat. Lägg dem i din
lösenordshanterare, eller på ett papper i en låda. Tappar du
`ADMIN_PASSWORD` kommer du inte in — men det är inte hela världen: du
går bara in i Netlify och skriver ett nytt.

## Del 3 — Lägg in dem i Netlify

1. Logga in på <https://app.netlify.com> och öppna sajten
   **step1film**
2. **Site configuration** → **Environment variables** → **Add a
   variable** → *Add a single variable*
3. Lägg in fyra stycken, en i taget. Scope: *All scopes*.

| Nyckel           | Värde                                            |
|------------------|--------------------------------------------------|
| `ADMIN_PASSWORD` | lösenordet från del 2                            |
| `ADMIN_SECRET`   | slumpsträngen från del 2                         |
| `GITHUB_TOKEN`   | `github_pat_…` från del 1                        |
| `GITHUB_REPO`    | `step1film/aymanhassdo`                          |

`GITHUB_BRANCH` behöver du bara om du vill spara till en annan gren än
`main`. Lämna den.

4. **Deploys** → **Trigger deploy** → *Clear cache and deploy site*.
   Nya miljövariabler slår inte igenom förrän funktionerna byggts om.

---

## Del 4 — Prova

1. Gå till <https://step1film.se/admin>
2. Logga in
3. Gå till **Texter**, sök efter `heroTag`, ändra något litet
4. **Spara texter** → det ska stå *Sparat (i18n.js)*
5. Vänta en minut, ladda om step1film.se och se att det ändrats
6. Ändra tillbaka

Funkar det är du igång.

---

## Vad du kan ändra var

| Flik | Vad det styr | Filen som skrivs |
|------|--------------|------------------|
| **Texter** | Alla texter på startsidan, svenska och engelska | `i18n.js` |
| **Filmer & CV** | Filmografin, festivaler, stöd, utvald av, partnerlogotyper | `site-config.js` |
| **Video** | Showreelen, trailern, de fyra klippen, affischerna | `site-config.js` |
| **Produkter** | Namn, beskrivning, pris, färger, storlekar, ordning, dölj/visa | `shop.js` + `functions/_lib/catalog.js` |
| **Bilder** | Uppladdning till `assets/` | den mappen du väljer |

---

## Tre saker att veta

**Priset sparas alltid på två ställen samtidigt.** `shop.js` är det
kunden ser, `functions/_lib/catalog.js` är det servern debiterar.
Adminsidan skriver båda i samma commit — det går inte att spara det ena
utan det andra. Därför ska du aldrig ändra ett pris för hand i någon av
filerna.

**Döljer du en produkt går den inte heller att beställa.** Flaggan
följer med till servern, så en slutsåld vara kan inte beställas ens av
någon som känner till produkt-id:t.

**Byt aldrig id på en produkt som redan sålts.** Id:t sitter i gamla
ordrar och i kopplingen till Printful. Vill du byta namn på produkten
ändrar du fältet *Namn*, inte *Id*.

---

## Om något går fel

**"Admin är inte igångsatt"** — någon av de fyra variablerna saknas,
eller så har sajten inte byggts om efter att du lagt in dem. Kör
*Clear cache and deploy site*.

**"Fel lösenord"** — `ADMIN_PASSWORD` i Netlify stämmer inte med det du
skriver. Vanligaste orsaken är ett mellanslag som följt med när du
klistrade in.

**"Sessionen har gått ut"** — du har varit inloggad i över åtta timmar.
Logga in igen.

**"Kunde inte läsa innehållet från GitHub"** — tokenet har gått ut
eller saknar *Contents: Read and write*. Gör om del 1.

**Sajten ser trasig ut efter en sparning** — allt ligger i git. Gå till
<https://github.com/step1film/aymanhassdo/commits/main>, hitta commiten
som heter *Admin: …*, och tryck **Revert**. Eller säg till mig, så
backar jag den.

---

## Var gränserna går

Adminsidan får bara skriva fyra filer och lägga bilder i fem mappar.
Allt annat nekas av servern, även om någon skulle ta sig förbi
inloggningen. Uppladdade bilder kontrolleras mot sina första byte —
ett skript som döpts om till `.png` stoppas.

`GITHUB_TOKEN` lämnar aldrig Netlify. Adminsidan i webbläsaren ser den
aldrig; den ber Netlify-funktionerna göra jobbet, och de har nyckeln.

Kommer du på att lösenordet läckt: byt `ADMIN_PASSWORD` **och**
`ADMIN_SECRET` i Netlify och deploya om. Alla inloggade sessioner
slutar då gälla direkt.
