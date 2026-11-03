import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL('C:/dev/e2e-herramientas/node_modules/playwright-core/index.mjs').href);
const nav = await chromium.launch({ channel: 'chrome', headless: true });
const p = await nav.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto(pathToFileURL(process.cwd() + '/render/'+(process.argv[3]||'collage.html')+'').href); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
await p.screenshot({ path: process.argv[2] });
await nav.close();
