import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL('C:/dev/e2e-herramientas/node_modules/playwright-core/index.mjs').href);
const n = await chromium.launch({ channel: 'chrome', headless: true });
const p = await n.newPage({ viewport: { width: 1230, height: 1100 } });
await p.goto(pathToFileURL(process.cwd() + '/' + process.argv[2]).href); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
await p.screenshot({ path: process.argv[3] }); await n.close();
