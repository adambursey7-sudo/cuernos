// Capturas del tramo 2 (ejercicios y sesiones) en tamaño iPhone, para la página de bocetos.
// Uso: PLAYWRIGHT_CORE=<carpeta de playwright-core> node scripts/capturas-tramo2.mjs <url> <carpeta de salida> [ejercicios]
import { pathToFileURL } from 'node:url';

const rutaPw = process.env.PLAYWRIGHT_CORE;
if (!rutaPw) {
  console.error('Falta PLAYWRIGHT_CORE (carpeta de playwright-core).');
  process.exit(1);
}
const { chromium } = await import(pathToFileURL(rutaPw + '/index.mjs').href);
const [url, salida, parte = 'ejercicios'] = process.argv.slice(2);
const navegador = await chromium.launch({ channel: 'chrome', headless: true });
const pagina = await navegador.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errores = [];
pagina.on('pageerror', (e) => errores.push(e.message));
pagina.on('console', (m) => m.type() === 'error' && errores.push(m.text()));
const foto = (nombre, completa = false) => pagina.screenshot({ path: `${salida}/${nombre}.png`, fullPage: completa });

await pagina.goto(url);
await pagina.waitForTimeout(600);

if (parte === 'ejercicios') {
  await pagina.locator('nav.pestanas').getByRole('button', { name: 'Ejercicios' }).click();
  await pagina.waitForTimeout(300);
  await foto('t2-2-lista');
  // Filtros: equipo infantil y solo 2x0.
  await pagina.getByRole('group', { name: 'Nivel del equipo' }).getByRole('button', { name: 'Infantil' }).click();
  await pagina.getByRole('group', { name: 'Formato' }).getByRole('button', { name: '2x0' }).click();
  await pagina.waitForTimeout(200);
  await foto('t2-2-filtros');
  // Ficha de un 2x0: a mitad del paso 2 (el 1 sale por el bloqueo).
  await pagina.locator('.tarjeta-ejercicio').first().click();
  await pagina.getByRole('button', { name: 'Siguiente' }).click();
  await pagina.waitForTimeout(800);
  await foto('t2-2-ficha', true);
  // Un 3x3 con defensa.
  await pagina.getByRole('button', { name: 'Volver' }).click();
  await pagina.getByRole('group', { name: 'Formato' }).getByRole('button', { name: '3x3' }).click();
  await pagina.getByRole('group', { name: 'Nivel del equipo' }).getByRole('button', { name: 'Cualquier nivel' }).click();
  await pagina.locator('.tarjeta-ejercicio').first().click();
  await pagina.getByRole('button', { name: 'Siguiente' }).click();
  await pagina.waitForTimeout(1900);
  await foto('t2-2-defensa');
  // Desde Inicio, la colección de ejercicios lleva a la ficha.
  await pagina.locator('nav.pestanas').getByRole('button', { name: 'Inicio' }).click();
  await pagina.locator('.ejercicio').first().scrollIntoViewIfNeeded();
  await foto('t2-2-inicio');
  await pagina.locator('.ejercicio').first().click();
  await pagina.waitForTimeout(300);
  if (!(await pagina.locator('.ficha-ejercicio').isVisible())) errores.push('La tarjeta de Inicio no abre el ejercicio');
}

await navegador.close();
console.log(errores.length ? 'ERRORES:\n' + errores.join('\n') : 'capturas en ' + salida + ', sin errores');
