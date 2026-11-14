# Keybridge Exit Partners weboldal

Kész, feltölthető weboldal a Keybridge Exit Partners számára: 23 oldal, 12 tudástár-cikk és 4 letölthető útmutató (e-book), a prospektus arculatával (fenyő, kő és sárgaréz; Newsreader és Hanken Grotesk betűk; boltíves logó).

## Mi hol van

| Mappa, fájl | Mire való |
|---|---|
| `dist/` | **A kész weboldal.** Ezt a mappát kell feltölteni a tárhelyre, úgy, ahogy van. |
| `site.json` | Cégadatok és beállítások. Indulás előtt ezt az egy fájlt kell kitölteni. |
| `src/pages/` | A fő oldalak szövege. |
| `src/articles/` | A tudástár cikkei. Egy fájl = egy cikk. |
| `src/guides/` | Az útmutatók (e-bookok) szövege. Weboldalként és PDF-ként is megjelennek. |
| `src/assets/pdf/` | Az útmutatók kész PDF változata. |
| `tools/make-pdfs.js` | A PDF-ek újragenerálása a weboldal szövegéből (fejlesztői eszköz). |
| `src/seo.json` | Oldalanként a keresőben megjelenő cím (legfeljebb 60 karakter) és leírás (legfeljebb 158 karakter). |
| `src/assets/` | Stíluslap, képek, logók. |
| `build.py` | Ebből a parancsból készül újra a `dist/` mappa: `python3 build.py` |

## Indulás előtti teendők

A szögletes zárójeles, sárgával kiemelt részek helykitöltők. Ezeket kell pótolni:

1. **`site.json`**: végleges domain (`url`), cégnév és cégforma, e-mail, sajtó e-mail, telefon, székhely, cégjegyzékszám, adószám, LinkedIn-oldal.
2. **Kapcsolati űrlap**: a `form_endpoint` mezőbe egy űrlapfogadó szolgáltatás címe kerül (például Formspree, Basin vagy a tárhely saját megoldása). Amíg üres, az űrlap jelzi, hogy nincs bekötve. A hírlevélhez a `newsletter_endpoint` tartozik.
3. **Partnerek** (`src/pages/40-partnerek.html` és a főoldal): Anita, Mariann és Andrea fotója és bemutatkozása. A fotó helyén most monogram áll. Fotócsere: a képet `src/assets/img/` alá kell tenni (ajánlott: álló, 4:5 arány, legalább 640 képpont széles), és a monogram `<div class="mono">…</div>` sorát egy `<img>` sorra cserélni, Kohári Levente mintájára.
4. **Jogi oldal** (`src/pages/90-jogi.html`): tárhelyszolgáltató adatai, adatkezelési tájékoztató véglegesítése adatvédelmi szakértővel.
5. **Ellenőrzendő vállalások**, amelyek a prospektusban nem szerepeltek szó szerint: titoktartási nyilatkozat kérésre az első találkozó előtt; a GYIK gyakorlati válaszai a diagnózis menetéről.
6. **Cikkek szerzője**: a pénzügyi témájú cikkeknél Kohári Levente szerepel, a többinél a szerkesztőség. Ha más partner jegyzi, a cikk fejlécében az `author:` sort kell átírni, és a szerzőt a `build.py` `AUTHORS` listájához hozzáadni.

Minden módosítás után: `python3 build.py`, majd a `dist/` mappa újbóli feltöltése.

## Közzététel

A `dist/` mappa bármely statikus tárhelyre feltölthető (hagyományos tárhely FTP-vel, Netlify, Cloudflare Pages, GitHub Pages). Adatbázis és szerveroldali program nem kell hozzá. A domaint a tárhely gyökerére kell irányítani, és a tárhelyen a `404.html` oldalt hibaoldalként beállítani.

Indulás után:

- a `sitemap.xml` beküldése a Google Search Console-ba és a Bing Webmaster Tools-ba,
- Google Cégprofil létrehozása ugyanazzal a névvel, címmel és telefonszámmal,
- a LinkedIn céges oldal összekötése a weboldallal.

## Új cikk hozzáadása

1. Másolja le bármelyik fájlt az `src/articles/` mappában, és nevezze át: a fájlnév lesz a cím az URL-ben (ékezet nélkül, kötőjelekkel).
2. Írja át a fejlécet: `title`, `desc` (ez a bevezető a cikk tetején és a listákban), `date`, `author`, `cat` (`ertek`, `tranzakcio`, `utodlas`, `mukodes`, `vagyon`), `read` (perc), `tldr` (a „Röviden” doboz pontjai, `|` jellel elválasztva).
3. Vegyen fel egy sort az `src/seo.json` fájlba a keresőcímmel és a leírással.
4. `python3 build.py`

A cikk automatikusan megjelenik a Tudástárban, a főoldalon, az oldaltérképben és az RSS-ben, és megkapja a strukturált adatokat.

## Útmutatók (e-bookok) és PDF-ek

A négy útmutató szövege az `src/guides/` mappában van. A weboldal ebből készíti az olvasható változatot, a PDF pedig ugyanennek az oldalnak a nyomtatási képe (borítóval, oldalszámozással).

Ha egy útmutató szövege változik, a PDF-et újra kell generálni, különben a letölthető változat a régi marad:

```
python3 build.py
cd dist && python3 -m http.server 8765 &
node tools/make-pdfs.js src/assets/pdf
python3 build.py
```

Ehhez Node.js és Playwright kell. Ha nincs kéznél fejlesztő, a PDF bármely böngészőből is elkészíthető: az útmutató oldalán Nyomtatás, majd Mentés PDF-ként, háttérgrafikával.

## A főoldali görgetős jelenet

„A garázstól a világvállalatig" jelenet rajza és szövege a `src/pages/00-fooldal.html` fájlban van (`scrolly` rész). Az öt lépés szövege szabadon átírható. A rajz öt rétegből áll (`st2`–`st5` jelölésű csoportok), ezek a görgetés hatására jelennek meg. Csökkentett mozgást kérő eszközökön az átmenetek animáció nélkül váltanak.

## Keresőoptimalizálás: mi van beépítve

- Minden oldalon egyedi cím és leírás, egyetlen H1, kanonikus URL, Open Graph és megosztási kép.
- Strukturált adatok (schema.org): szervezet, weboldal, morzsamenü, szolgáltatás, cikk szerzővel és dátummal, GYIK, fogalomtár, személyek.
- `sitemap.xml`, `robots.txt`, RSS, és `llms.txt` a mesterségesintelligencia-alapú keresőknek (ChatGPT, Perplexity, Google AI áttekintések).
- Válaszközpontú cikkszerkezet: „Röviden” doboz az elején, kérdés formájú alcímek, GYIK a végén, forráslista.
- Gyors betöltés: keretrendszer nélkül, WebP képek több méretben, késleltetett képbetöltés, előtöltés a hivatkozásokra, sima oldalváltási átmenet.
- Az útmutatók regisztráció nélkül olvashatók (ez a keresőknek és az MI-alapú válaszmotoroknak is látható tartalom), mellettük PDF-letöltés.
- Akadálymentesség: billentyűzettel kezelhető, kontrasztos, a képeknek van szöveges leírása.
- Magyar és angol oldal `hreflang` jelöléssel.

## Előnézet saját gépen

```
python3 build.py
cd dist && python3 -m http.server 8000
```

Utána a böngészőben: `http://localhost:8000`
