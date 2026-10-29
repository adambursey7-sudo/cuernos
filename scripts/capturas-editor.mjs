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
/** Arrastra con el dedo por los puntos dados (coordenadas de pista en dm), pasando por cada uno. */
async function arrastrar(...puntos) {
  const caja = await capa.boundingBox();
  const px = ([x, y]) => [caja.x + (x / 150) * caja.width, caja.y + (y / 140) * caja.height];
  const [x0, y0] = px(puntos[0]);
  await p.mouse.move(x0, y0);
  await p.mouse.down();
  for (let n = 1; n < puntos.length; n++) {
    const [x1, y1] = px(puntos[n - 1]);
    const [x2, y2] = px(puntos[n]);
    for (let i = 1; i <= 8; i++) await p.mouse.move(x1 + ((x2 - x1) * i) / 8, y1 + ((y2 - y1) * i) / 8);
  }
  await p.mouse.up();
}

await p.getByText('+ Nueva jugada').click();
await p.locator('#nombre-jugada').fill('Cuernos de prueba');
await arrastrar([14, 14], [55, 60]); // 4 al codo izquierdo
await arrastrar([136, 14], [95, 60]); // 5 al codo derecho
await p.screenshot({ path: `${salida}/e1-colocacion.png` });
await p.getByText('Empezar pasos').click();
await arrastrar([95, 60], [86, 88]); // 5 sube a bloquear al 1 (se adivina bloqueo)
await arrastrar([75, 100], [92, 104], [108, 80]); // 1 sale botando por el bloqueo, en curva (se adivina bote)
await p.screenshot({ path: `${salida}/e3-paso1.png` });
await p.getByText('+ Paso').click();
await arrastrar([111, 75], [86, 88]); // pase: el balón del 1 se suelta encima del 5
await arrastrar([86, 88], [70, 60], [80, 28]); // 5 continúa a canasta (corte en curva)
await p.getByRole('button', { name: /Corte del 5/ }).click(); // la etiqueta cambia a bloqueo…
await p.getByRole('button', { name: /Bloqueo del 5/ }).click(); // …y vuelve a corte
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
console.log('paso 1:', JSON.stringify(guardadas[0]?.pasos[0].movimientos));
console.log('paso 2:', JSON.stringify(guardadas[0]?.pasos[1]?.movimientos));
console.log('guardadas:', guardadas.length, guardadas[0]?.nombre, guardadas[0]?.pasos.map((x) => x.texto).join(' | '));
await navegador.close();
