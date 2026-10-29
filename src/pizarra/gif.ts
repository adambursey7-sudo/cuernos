// Jugada en GIF para mandarla por WhatsApp: cabecera con el nombre y el paso, la pista animada y la explicación.
// Cada fotograma se pinta con la misma <Pista> de la app (fuera de la pantalla) y se pasa a un lienzo.
import { applyPalette, GIFEncoder, quantize } from 'gifenc';
import { createElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import type { Sistema } from '../sistemas/tipos';
import { APLASTADO, BALON, CAJA_O, CUERNO, PUNTA } from '../Logo';
import { pasoDe } from './animar';
import { Pista } from './Pista';
import { SEGUNDOS_POR_PASO } from './useJugada';

const ANCHO = 480;
const ALTO_PISTA = (ANCHO * 140) / 150;
const CABECERA = 64;
const PIE = 76;
const FPS = 12;
/** Pausas (ms): al principio, al acabar cada paso y al final antes de volver a empezar. */
const PAUSA_INICIO = 1200;
const PAUSA_PASO = 700;
const PAUSA_FINAL = 2200;

const VARIABLES = ['--principal', '--fondo', '--texto', '--pista', '--zona', '--lineas', '--jugadores', '--texto-jugadores', '--flechas', '--defensa', '--body'];

/** Las reglas de la pista con los colores actuales, para meterlas dentro del SVG (una imagen no ve la hoja de la app). */
function estiloPista(): string {
  const raiz = getComputedStyle(document.documentElement);
  const vars = VARIABLES.map((v) => `${v}:${raiz.getPropertyValue(v)}`).join(';');
  let reglas = '';
  for (const hoja of Array.from(document.styleSheets)) {
    try {
      for (const r of Array.from(hoja.cssRules)) if (r instanceof CSSStyleRule && r.selectorText.includes('.pista')) reglas += r.cssText;
    } catch {
      /* hoja de otro origen: no se puede leer */
    }
  }
  return `svg{${vars}}${reglas}`;
}

/** Momentos de la jugada que van al GIF, con lo que dura cada uno en pantalla. */
export function fotogramas(total: number): { t: number; ms: number }[] {
  const lista = [{ t: 0, ms: PAUSA_INICIO }];
  const n = Math.round(SEGUNDOS_POR_PASO * FPS);
  for (let paso = 0; paso < total; paso++) {
    for (let i = 1; i <= n; i++) lista.push({ t: paso + i / n, ms: 1000 / FPS });
    lista[lista.length - 1].ms = paso === total - 1 ? PAUSA_FINAL : PAUSA_PASO;
  }
  return lista;
}

function lineas(ctx: CanvasRenderingContext2D, texto: string, ancho: number): string[] {
  const salida: string[] = [];
  let linea = '';
  for (const palabra of texto.split(/\s+/).filter(Boolean)) {
    const prueba = linea ? `${linea} ${palabra}` : palabra;
    if (linea && ctx.measureText(prueba).width > ancho) {
      salida.push(linea);
      linea = palabra;
    } else linea = prueba;
  }
  if (linea) salida.push(linea);
  if (salida.length > 2) salida.splice(2, Infinity, salida[1].replace(/\s*\S*$/, '') + '…');
  return salida;
}

/** El logo HORNS en pequeño, con su borde derecho en x y la línea de las letras en `base`. */
function marca(ctx: CanvasRenderingContext2D, x: number, base: number, tam: number, texto: string, principal: string) {
  ctx.save();
  // El resto del GIF escribe centrado en vertical; el logo se apoya en la línea de las letras.
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${tam}px Graduate, serif`;
  const alto = ctx.measureText('H').actualBoundingBoxAscent;
  const ancho = (alto * CAJA_O.ancho) / CAJA_O.alto;
  const [h, rns] = [ctx.measureText('H').width, ctx.measureText('RNS').width];
  const hueco = tam * 0.08;
  let x0 = x - (h + hueco + ancho + hueco + rns);
  ctx.fillStyle = texto;
  ctx.fillText('H', x0, base);
  x0 += h + hueco;
  const cuerno = new Path2D(CUERNO);
  ctx.save();
  ctx.translate(x0, base - alto);
  ctx.scale(alto / CAJA_O.alto, alto / CAJA_O.alto);
  ctx.translate(-CAJA_O.x, -CAJA_O.y);
  ctx.fillStyle = principal;
  for (const lado of [1, -1]) {
    ctx.save();
    ctx.translate(0, 50 - lado * PUNTA * APLASTADO);
    ctx.scale(1, lado * APLASTADO);
    ctx.fill(cuerno);
    ctx.restore();
  }
  ctx.fillStyle = texto;
  ctx.beginPath();
  ctx.arc(BALON.cx, BALON.cy, BALON.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillText('RNS', x0 + ancho + hueco, base);
  ctx.restore();
}

export async function crearGif(s: Sistema, conDefensa: boolean, avance: (k: number) => void): Promise<Blob> {
  const raiz = getComputedStyle(document.documentElement);
  const color = (v: string) => raiz.getPropertyValue(v).trim();
  await Promise.all([document.fonts.load('30px "Graduate"'), document.fonts.load('17px "Atkinson Hyperlegible"')]);

  const lienzo = document.createElement('canvas');
  lienzo.width = ANCHO;
  lienzo.height = CABECERA + ALTO_PISTA + PIE;
  const ctx = lienzo.getContext('2d', { willReadFrequently: true })!;

  const caja = document.createElement('div');
  caja.style.cssText = `position:fixed;left:-9999px;top:0;width:${ANCHO}px`;
  document.body.append(caja);
  const react = createRoot(caja);
  const css = estiloPista();
  const gif = GIFEncoder();
  let paleta: number[][] | null = null;

  try {
    const lista = fotogramas(s.pasos.length);
    for (const [k, { t, ms }] of lista.entries()) {
      flushSync(() => react.render(createElement(Pista, { sistema: s, t, conDefensa })));
      const svg = caja.querySelector('svg')!.cloneNode(true) as SVGSVGElement;
      svg.setAttribute('width', String(ANCHO));
      svg.setAttribute('height', String(ALTO_PISTA));
      const estilo = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      estilo.textContent = css;
      svg.prepend(estilo);
      const img = new Image();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg));
      await img.decode();

      const paso = pasoDe(t, s.pasos.length);
      ctx.fillStyle = color('--fondo');
      ctx.fillRect(0, 0, lienzo.width, lienzo.height);
      ctx.textBaseline = 'middle';
      ctx.fillStyle = color('--texto');
      ctx.font = '30px Graduate, serif';
      ctx.fillText(s.nombre.toUpperCase(), 16, CABECERA / 2 + 2, ANCHO - 140);
      ctx.textAlign = 'right';
      ctx.fillStyle = color('--principal');
      ctx.fillText(`${paso + 1} / ${s.pasos.length}`, ANCHO - 16, CABECERA / 2 + 2);
      ctx.textAlign = 'left';
      ctx.drawImage(img, 0, CABECERA, ANCHO, ALTO_PISTA);
      ctx.fillStyle = color('--texto');
      ctx.font = '17px "Atkinson Hyperlegible", sans-serif';
      // Se deja sitio a la derecha para el logo.
      lineas(ctx, s.pasos[paso].texto, ANCHO - 120).forEach((l, i) => ctx.fillText(l, 16, CABECERA + ALTO_PISTA + 22 + i * 24));
      marca(ctx, ANCHO - 14, lienzo.height - 12, 22, color('--texto'), color('--principal'));

      const { data } = ctx.getImageData(0, 0, lienzo.width, lienzo.height);
      // Una sola paleta, sacada del primer fotograma: los colores de la jugada no cambian y el GIF pesa menos.
      if (!paleta) paleta = quantize(data, 256);
      gif.writeFrame(applyPalette(data, paleta), lienzo.width, lienzo.height, k === 0 ? { palette: paleta, delay: ms } : { delay: ms });
      avance((k + 1) / lista.length);
      // Deja respirar a la pantalla para que se vea el avance.
      await new Promise((r) => setTimeout(r));
    }
    gif.finish();
    return new Blob([gif.bytes()], { type: 'image/gif' });
  } finally {
    react.unmount();
    caja.remove();
  }
}

/** En el iPhone abre el menú de compartir (WhatsApp, Fotos…); si no se puede, lo descarga. */
export async function compartirGif(gif: Blob, nombre: string) {
  const archivo = new File([gif], `${nombre.toLowerCase().replace(/[^a-z0-9ñáéíóúü]+/gi, '-')}.gif`, { type: 'image/gif' });
  if (navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo] });
      return;
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return;
    }
  }
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(archivo);
  enlace.download = archivo.name;
  enlace.click();
  // Safari empieza la descarga más tarde: si se suelta el archivo enseguida, sale vacío.
  setTimeout(() => URL.revokeObjectURL(enlace.href), 60_000);
}
