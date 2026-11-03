import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL('C:/dev/e2e-herramientas/node_modules/playwright-core/index.mjs').href);
const n = await chromium.launch({ channel: 'chrome', headless: true });
const p = await n.newPage({ viewport: { width: 800, height: 800 } });
await p.goto(pathToFileURL(process.cwd() + '/escudo.html').href); await p.waitForTimeout(400);
await p.screenshot({ path: 'escudo.png' }); await n.close();
