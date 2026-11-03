import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL('C:/dev/e2e-herramientas/node_modules/playwright-core/index.mjs').href);
const salida = process.argv[2];
const n = await chromium.launch({ channel: 'chrome', headless: true });
const p = await n.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto(pathToFileURL(process.cwd() + '/hoja-escenas.html').href); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
for (const k of ['uno', 'dos', 'tres', 'cara', 'cuatro']) {
  await p.evaluate((k) => { document.body.innerHTML = Escena.svg(k); const s = document.querySelector('svg'); s.style.width = '1080px'; s.style.height = '1920px'; s.style.display = 'block'; }, k);
  await p.screenshot({ path: `${salida}/boceto-${k}.png` });
}
await n.close();
