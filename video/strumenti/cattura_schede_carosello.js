// cattura_schede_carosello.js — cattura ogni scheda di un carosello prodotti (es. ".products.all > *")
// come immagine separata ad alta risoluzione, con la posizione dell'immagine del prodotto nella scheda.
// Uso:  node cattura_schede_carosello.js "URL_DEL_SITO" "SELETTORE_SCHEDE" cartella_uscita
// L'URL (anche di anteprima privata) si passa da riga di comando: NON scriverlo in questo file.
const {chromium} = require('playwright');
const fs = require('fs');
const [url, selettore = '.products.all > *', uscita = 'public'] = process.argv.slice(2);
if (!url) {
  console.error('Uso: node cattura_schede_carosello.js URL [SELETTORE] [CARTELLA]');
  process.exit(1);
}
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({viewport: {width: 432, height: 1200}, deviceScaleFactor: 5});
  await p.goto(url, {waitUntil: 'networkidle', timeout: 90000});
  const acc = p.locator('button:has-text("Accetta"), button:has-text("Accept")');
  if (await acc.count()) await acc.first().click().catch(() => {});
  await p.evaluate(() => {
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed' || cs.position === 'sticky') el.style.display = 'none';
    }
  });
  fs.mkdirSync(uscita, {recursive: true});
  const cards = p.locator(selettore);
  const n = await cards.count();
  const out = [];
  for (let k = 0; k < n; k++) {
    const c = cards.nth(k);
    await c.scrollIntoViewIfNeeded();
    await p.waitForTimeout(900);
    const bb = await c.boundingBox();
    const ib = await c.locator('img').first().boundingBox().catch(() => null);
    const file = `${uscita}/card_${k}.png`;
    await c.screenshot({path: file});
    out.push({file, card: bb, img: ib ? {x: ib.x - bb.x, y: ib.y - bb.y, w: ib.width, h: ib.height} : null});
  }
  fs.writeFileSync(`${uscita}/cards.json`, JSON.stringify(out, null, 1));
  console.log(`ok: ${out.length} schede`);
  await b.close();
})();
