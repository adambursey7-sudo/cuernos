// Auditoría de interfaz: capturas de las 5 pestañas (móvil y tableta) y botones pequeños (<44 px).
// Uso: PLAYWRIGHT_CORE=C:/dev/e2e-herramientas/node_modules/playwright-core node scripts/auditoria-interfaz.mjs <url> <salida>
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_CORE + '/index.mjs').href);
const [url, salida] = process.argv.slice(2);
const nav = await chromium.launch({ channel: 'chrome', headless: true });
const tamanos = { movil: { width: 390, height: 844 }, tableta: { width: 820, height: 1180 } };
const informe = {};
for (const [t, vp] of Object.entries(tamanos)) {
  const p = await nav.newPage({ viewport: vp, deviceScaleFactor: 1.5 });
  await p.addInitScript(() => { try { localStorage.setItem('horns.acceso', 'prueba'); } catch {} });
  await p.goto(url + '?ejemplo=pro'); await p.waitForTimeout(1500);
  for (const n of ['Hoy', 'Biblioteca', 'Sesiones', 'Equipo', 'Más']) {
    await p.getByRole('button', { name: n, exact: true }).last().click().catch(() => {});
    await p.waitForTimeout(500);
    await p.screenshot({ path: `${salida}/${t}-${n.replace('á', 'a')}.jpg`, type: 'jpeg', quality: 70 });
    informe[`${t}/${n}`] = await p.evaluate(() => {
      const peq = [...document.querySelectorAll('button,a,[role=button],input,select')].map((e) => { const r = e.getBoundingClientRect(); return { r, e }; })
        .filter(({ r }) => r.width > 0 && r.height > 0 && (r.height < 44 || r.width < 44))
        .map(({ r, e }) => `${(e.getAttribute('aria-label') || e.textContent || e.className).trim().slice(0, 30)} ${Math.round(r.width)}x${Math.round(r.height)}`);
      return { botonesPequenos: peq.length, ejemplos: peq.slice(0, 8), desborda: document.documentElement.scrollWidth > innerWidth };
    });
  }
  await p.close();
}
console.log(JSON.stringify(informe, null, 1));
await nav.close();
