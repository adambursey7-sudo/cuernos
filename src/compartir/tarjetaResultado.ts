// Tarjeta del resultado como imagen para compartir (loop Pro, tramo 6). Se dibuja en un lienzo, en el móvil, sin servidor.
// Solo lleva dorsales: ningún nombre de jugadora entra en la imagen.
import type { Equipo, Jugadora } from '../diario/diario';
import { colorLegible, escudoPorDefecto } from '../equipo/modelo';
import { corta } from '../temporada/fechas';
import { COMPETICIONES, competicionDe, type Evento } from '../temporada/temporada';
import { textoSobre } from '../temas';

export interface DatosTarjeta {
  equipo: string;
  letras: string;
  color: string;
  rival: string;
  a: number;
  c: number;
  marca: 'G' | 'P' | 'E';
  cuando: string;
  detalle: string;
  /** Lo mejor del partido, con dorsal. */
  destacadas: { etiqueta: string; dorsal: string; valor: number }[];
}

const COLOR_POR_DEFECTO = '#f2b134';

/** Los datos de la tarjeta, o nada si el partido aún no tiene resultado. */
export function datosTarjeta(equipo: Equipo, e: Evento, jugadoras: Pick<Jugadora, 'id' | 'numero'>[]): DatosTarjeta | undefined {
  if (e.tipo !== 'partido' || !e.resultado) return undefined;
  const { a, c } = e.resultado;
  const dorsal = (id: string) => jugadoras.find((j) => j.id === id)?.numero || '?';
  const destacadas: DatosTarjeta['destacadas'] = [];
  for (const [campo, etiqueta] of [['p', 'Puntos'], ['reb', 'Rebotes'], ['ast', 'Asistencias']] as const) {
    let mejor: { id: string; v: number } | undefined;
    for (const [id, l] of Object.entries(e.directo ?? {})) {
      const v = l[campo] ?? 0;
      if (v > 0 && (!mejor || v > mejor.v)) mejor = { id, v };
    }
    if (mejor) destacadas.push({ etiqueta, dorsal: dorsal(mejor.id), valor: mejor.v });
  }
  const comp = COMPETICIONES.find(([id]) => id === competicionDe(e))?.[1];
  return {
    equipo: equipo.nombre, letras: (equipo.escudo ?? escudoPorDefecto(equipo.nombre)).letras, color: colorLegible(equipo.color ?? COLOR_POR_DEFECTO),
    rival: e.titulo || 'Rival', a, c, marca: a > c ? 'G' : a < c ? 'P' : 'E', cuando: corta(e.fecha),
    detalle: [comp, e.jornada ? `Jornada ${e.jornada}` : '', e.casa === false ? 'Fuera' : 'En casa'].filter(Boolean).join(' · '),
    destacadas,
  };
}

const ANCHO = 1080;
const ALTO = 1350;
const FUENTE = "'Graduate', 'Rockwell', Georgia, serif";

/** Un rectángulo de esquinas redondas dibujado a mano: `roundRect` no existe en los Safari anteriores al 16. */
function rectRedondo(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Un #rrggbb (o #rgb) con transparencia, como rgba(). */
export function conAlfa(hex: string, alfa: number): string {
  const h = hex.length === 4 ? hex.slice(1).split('').map((c) => c + c).join('') : hex.slice(1);
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alfa})`;
}

function recortar(ctx: CanvasRenderingContext2D, texto: string, ancho: number): string {
  if (ctx.measureText(texto).width <= ancho) return texto;
  let t = texto;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > ancho) t = t.slice(0, -1);
  return `${t}…`;
}

export function dibujarTarjeta(ctx: CanvasRenderingContext2D, d: DatosTarjeta): void {
  const fondo = '#10151f';
  const sobre = textoSobre(d.color);
  ctx.fillStyle = fondo;
  ctx.fillRect(0, 0, ANCHO, ALTO);
  // franja del color del equipo con círculos suaves
  const g = ctx.createLinearGradient(0, 0, ANCHO, 560);
  g.addColorStop(0, d.color);
  g.addColorStop(1, '#00000066');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, ANCHO, 560);
  ctx.strokeStyle = conAlfa(sobre, 0.13);
  ctx.lineWidth = 60;
  ctx.beginPath();
  ctx.arc(ANCHO - 60, 40, 260, 0, Math.PI * 2);
  ctx.stroke();

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = sobre;
  ctx.font = `700 40px ${FUENTE}`;
  ctx.fillText(d.marca === 'G' ? 'VICTORIA' : d.marca === 'P' ? 'DERROTA' : 'EMPATE', 70, 120);
  ctx.font = `400 34px ${FUENTE}`;
  ctx.globalAlpha = 0.85;
  ctx.fillText(recortar(ctx, d.detalle.toUpperCase(), 940), 70, 175);
  ctx.globalAlpha = 1;

  // marcador
  ctx.textAlign = 'center';
  ctx.font = `900 250px ${FUENTE}`;
  ctx.fillText(`${d.a}–${d.c}`, ANCHO / 2, 430);

  // equipos
  ctx.fillStyle = '#fff8ee';
  ctx.font = `700 54px ${FUENTE}`;
  ctx.fillText(recortar(ctx, d.equipo.toUpperCase(), 900), ANCHO / 2, 680);
  ctx.fillStyle = '#b9b4aa';
  ctx.font = `400 40px ${FUENTE}`;
  ctx.fillText(`contra ${recortar(ctx, d.rival, 700)}`, ANCHO / 2, 745);
  ctx.fillText(d.cuando, ANCHO / 2, 805);

  // lo mejor, con dorsal
  const n = d.destacadas.length;
  if (n) {
    const ancho = 300;
    const hueco = (ANCHO - n * ancho) / (n + 1);
    d.destacadas.forEach((x, i) => {
      const cx = hueco * (i + 1) + ancho * i + ancho / 2;
      ctx.fillStyle = '#1c2433';
      rectRedondo(ctx, cx - ancho / 2, 900, ancho, 280, 28);
      ctx.fill();
      ctx.fillStyle = d.color;
      ctx.font = `900 120px ${FUENTE}`;
      ctx.fillText(String(x.valor), cx, 1030);
      ctx.fillStyle = '#fff8ee';
      ctx.font = `700 46px ${FUENTE}`;
      ctx.fillText(`#${x.dorsal}`, cx, 1095);
      ctx.fillStyle = '#b9b4aa';
      ctx.font = `400 30px ${FUENTE}`;
      ctx.fillText(x.etiqueta.toUpperCase(), cx, 1148);
    });
  }

  // pie
  ctx.fillStyle = '#6b7385';
  ctx.font = `400 30px ${FUENTE}`;
  ctx.fillText('HORNS', ANCHO / 2, 1290);
}

/** La tarjeta como imagen PNG. */
export async function tarjetaPng(d: DatosTarjeta): Promise<Blob> {
  try { await document.fonts?.load(`700 40px Graduate`); } catch { /* sin la letra, se dibuja con la de reserva */ }
  const lienzo = document.createElement('canvas');
  lienzo.width = ANCHO;
  lienzo.height = ALTO;
  const ctx = lienzo.getContext('2d');
  if (!ctx) throw new Error('Este móvil no deja dibujar la tarjeta.');
  dibujarTarjeta(ctx, d);
  return new Promise((ok, mal) => lienzo.toBlob((b) => (b ? ok(b) : mal(new Error('No se pudo crear la imagen.'))), 'image/png'));
}

/** Abre el menú de compartir con la imagen; si el móvil no deja, la descarga. */
export async function compartirImagen(blob: Blob, nombre: string): Promise<'enviado' | 'guardado' | 'nada'> {
  const archivo = new File([blob], nombre, { type: 'image/png' });
  try {
    if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [archivo] })) {
      await navigator.share({ files: [archivo] });
      return 'enviado';
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return 'nada';
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  return 'guardado';
}
