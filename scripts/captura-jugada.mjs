// Captura la pantalla de una jugada (móvil) para comprobar los mandos. Uso: PLAYWRIGHT_CORE=... node scripts/captura-jugada.mjs <url> <salida.jpg>
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_CORE);
const [url, salida] = process.argv.slice(2);
const b = await chromium.launch({ channel: 'chrome' });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5 })).newPage();
await p.addInitScript(() => { try { localStorage.setItem('horns.acceso', 'prueba'); } catch {} });
await p.goto(url + '?ejemplo=pro'); await p.waitForTimeout(1500);
await p.getByRole('button', { name: /Biblioteca/ }).last().click(); await p.waitForTimeout(500);
await p.locator('details.grupo-jugadas > summary').first().click(); await p.locator('details[open] button.tarjeta').first().click(); await p.waitForTimeout(800);
await p.screenshot({ path: salida, type: 'jpeg', quality: 70 });
await b.close();
