import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL('C:/dev/e2e-herramientas/node_modules/playwright-core/index.mjs').href);
const n = await chromium.launch({ channel: 'chrome', headless: true });
const p = await n.newPage({ viewport: { width: 420, height: 900 } });
const e = []; p.on('pageerror', (x) => e.push(x.message));
await p.goto(pathToFileURL(process.argv[2]).href); await p.waitForTimeout(1200);
await p.screenshot({ path: process.argv[3], fullPage: true, clip: { x: 0, y: 0, width: 420, height: 2600 } }); console.log(e.join('|') || 'sin errores'); await n.close();
