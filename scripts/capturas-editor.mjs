// Prueba el editor como lo haría un entrenador con el dedo y saca capturas.
// Uso: PLAYWRIGHT_CORE=<ruta> node scripts/capturas-editor.mjs <url> <carpeta>
import { pathToFileURL } from 'node:url';

const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_CORE + '/index.mjs').href);
const [url, salida] = process.argv.slice(2);
const navegador = await chromium.launch({ channel: 'chrome', headless: true });
const p = await navegador.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
await p.goto(url);
await p.evaluate(() => localStorage.removeItem('cuernos.mios'));
await p.reload();

const capa = p.locator('.capa');
/** Arrastra en coordenadas de pista (dm) de un punto a otro. */
async function arrastrar(de, a) {
  const caja = await capa.boundingBox();
  const px = ([x, y]) => [caja.x + (x / 150) * caja.width, caja.y + (y / 140) * caja.height];
  const [x1, y1] = px(de);
  const [x2, y2] = px(a);
  await p.mouse.move(x1, y1);
  await p.mouse.down();
  for (let i = 1; i <= 8; i++) await p.mouse.move(x1 + ((x2 - x1) * i) / 8, y1 + ((y2 - y1) * i) / 8);
  await p.mouse.up();
}

await p.getByText('+ Nueva jugada').click();
await p.locator('#nombre-jugada').fill('Cuernos de prueba');
await arrastrar([14, 14], [55, 60]); // 4 al codo izquierdo
await arrastrar([136, 14], [95, 60]); // 5 al codo derecho
await p.screenshot({ path: `${salida}/e1-colocacion.png` });
await p.getByText('Empezar pasos').click();
await arrastrar([95, 60], [86, 88]); // 5 sube a bloquear
await p.screenshot({ path: `${salida}/e2-eleccion.png` });
await p.getByRole('button', { name: 'Bloqueo' }).click();
await arrastrar([75, 100], [108, 80]); // 1 sale botando por el bloqueo
await p.getByRole('button', { name: 'Bote' }).click();
{
  // Tocar la flecha del bloqueo del 5 (en su tramo central) para curvarla.
  const caja = await capa.boundingBox();
  await p.mouse.click(caja.x + (91 / 150) * caja.width, caja.y + (72.6 / 140) * caja.height);
}
await p.screenshot({ path: `${salida}/e3-paso1.png` });
await p.getByText('+ Paso').click();
await p.getByRole('button', { name: 'Pase' }).click();
await p.locator('.fila-chips.pase').getByRole('button', { name: '5' }).click();
await arrastrar([86, 88], [80, 28]); // 5 continúa a canasta
await p.getByRole('button', { name: 'Corte' }).click();
await p.screenshot({ path: `${salida}/e4-paso2.png` });
await p.getByText('Guardar jugada').click();
await p.waitForTimeout(300);
await p.screenshot({ path: `${salida}/e5-guardada.png` });
await p.getByText('Sistemas', { exact: true }).last().click();
await p.screenshot({ path: `${salida}/e6-lista.png` });
const guardadas = await p.evaluate(() => JSON.parse(localStorage.getItem('cuernos.mios') ?? '[]'));
// Copia de seguridad: descargar, borrar todo, volver a cargar.
await p.getByRole('button', { name: 'Ajustes' }).click();
const [descarga] = await Promise.all([p.waitForEvent('download'), p.getByText('Descargar copia').click()]);
const archivo = `${salida}/copia.json`;
await descarga.saveAs(archivo);
await p.evaluate(() => localStorage.removeItem('cuernos.mios'));
await p.reload();
await p.getByRole('button', { name: 'Ajustes' }).click();
await p.locator('#cargar-copia').setInputFiles(archivo);
await p.waitForTimeout(300);
await p.screenshot({ path: `${salida}/e7-copia.png`, fullPage: true });
console.log('aviso:', await p.locator('.aviso-copia').textContent());
console.log('curva del 5:', JSON.stringify(guardadas[0]?.pasos[0].movimientos.find((m) => m.jugador === '5')));
console.log('guardadas:', guardadas.length, guardadas[0]?.nombre, guardadas[0]?.pasos.map((x) => x.texto).join(' | '));
await navegador.close();
