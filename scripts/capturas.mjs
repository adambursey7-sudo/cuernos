// Iconos PNG del logo y capturas de la app en tamaño iPhone.
// Necesita playwright-core fuera del repo: variable PLAYWRIGHT_CORE con la ruta de su carpeta.
// Uso: node scripts/capturas.mjs iconos   |   node scripts/capturas.mjs <url> <carpeta de salida>
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const rutaPw = process.env.PLAYWRIGHT_CORE;
if (!rutaPw) {
  console.error('Falta PLAYWRIGHT_CORE (carpeta de playwright-core).');
  process.exit(1);
}
const { chromium } = await import(pathToFileURL(rutaPw + '/index.mjs').href);
const navegador = await chromium.launch({ channel: 'chrome', headless: true });
const [modo, salida] = process.argv.slice(2);

if (modo === 'iconos') {
  const svg = readFileSync('public/icono.svg', 'utf8');
  const pagina = await navegador.newPage();
  for (const tam of [180, 192, 512]) {
    await pagina.setViewportSize({ width: tam, height: tam });
    await pagina.setContent(`<style>*{margin:0}svg{width:${tam}px;height:${tam}px;display:block}</style>${svg}`);
    await pagina.screenshot({ path: `public/icono-${tam}.png` });
  }
  console.log('iconos listos en public/');
} else {
  const pagina = await navegador.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await pagina.goto(modo);
  await pagina.waitForTimeout(600);
  await pagina.screenshot({ path: `${salida}/1-sistemas.png` });
  await pagina.getByText('Cuernos Flex').click();
  await pagina.getByText('Siguiente').click();
  await pagina.waitForTimeout(300);
  await pagina.screenshot({ path: `${salida}/2-sistema.png` });
  await pagina.getByRole('button', { name: 'Colores' }).click();
  await pagina.getByText('Pizarra verde').click();
  await pagina.waitForTimeout(300);
  await pagina.screenshot({ path: `${salida}/3-colores.png`, fullPage: true });
  console.log('capturas en', salida);
}
await navegador.close();
