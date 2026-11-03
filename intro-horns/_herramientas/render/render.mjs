import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL('C:/dev/e2e-herramientas/node_modules/playwright-core/index.mjs').href);
const salida = process.argv[2];
const nav = await chromium.launch({ channel: 'chrome', headless: true });
const p = await nav.newPage({ viewport: { width: 1080, height: 1920 } });
const raiz = pathToFileURL(process.cwd() + '/render/logo.html').href;
for (const [v, n] of [['completo', 'logo-completo'], ['abierta', 'logo-O-abierta'], ['sin', 'logo-sin-O']]) {
  await p.goto(raiz + '?v=' + v); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  await p.screenshot({ path: `${salida}/${n}.png` });
}
await nav.close();
