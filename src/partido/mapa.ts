// Mapa de tiros (loop Pro, tramo 4): dónde se tira, con qué acierto y desde qué zona.
// Las posiciones son de 0 a 100 sobre la media pista de Horns (150 × 140 unidades; el aro está en 75, 12). Sin imágenes externas.
import type { Evento } from '../temporada/temporada';
import type { Vivo } from './vivo';

export type Zona = 'pintura' | 'media-izq' | 'media-cen' | 'media-der' | 'esq-izq' | 'esq-der' | 'tri-izq' | 'tri-cen' | 'tri-der';

/** Zonas con su nombre y el punto de la pista donde se escribe el porcentaje. */
export const ZONAS: { id: Zona; nombre: string; cx: number; cy: number }[] = [
  { id: 'pintura', nombre: 'Zona', cx: 75, cy: 32 },
  { id: 'media-izq', nombre: 'Media distancia izquierda', cx: 31, cy: 46 },
  { id: 'media-cen', nombre: 'Media distancia central', cx: 75, cy: 70 },
  { id: 'media-der', nombre: 'Media distancia derecha', cx: 119, cy: 46 },
  { id: 'esq-izq', nombre: 'Esquina izquierda', cx: 4.5, cy: 14 },
  { id: 'esq-der', nombre: 'Esquina derecha', cx: 145.5, cy: 14 },
  { id: 'tri-izq', nombre: 'Triple izquierdo', cx: 22, cy: 66 },
  { id: 'tri-cen', nombre: 'Triple central', cx: 75, cy: 106 },
  { id: 'tri-der', nombre: 'Triple derecho', cx: 128, cy: 66 },
];

const ANCHO = 150;
const ALTO = 140;
const ARO = { x: 75, y: 12 };
const RADIO_TRIPLE = 67.5;

const aPista = (x: number, y: number) => ({ X: (x / 100) * ANCHO, Y: (y / 100) * ALTO });

/** ¿Está fuera de la línea de tres? (el arco de la pista de Horns, y las esquinas fuera de la línea recta). */
export function esTriple(x: number, y: number): boolean {
  const { X, Y } = aPista(x, y);
  return Math.hypot(X - ARO.x, Y - ARO.y) >= RADIO_TRIPLE || X <= 9 || X >= 141;
}

/** Límites de las zonas: la zona pintada (50,5 a 99,5 de ancho y hasta 58 de largo) y sus prolongaciones separan izquierda, centro y derecha. */
const IZQ = 50.5;
const DER = 99.5;

export function zonaDe(x: number, y: number): Zona {
  const { X, Y } = aPista(x, y);
  const lado = X < IZQ ? 'izq' : X > DER ? 'der' : 'cen';
  if (esTriple(x, y)) {
    if (Y <= 26 && X <= 9) return 'esq-izq';
    if (Y <= 26 && X >= 141) return 'esq-der';
    return `tri-${lado}` as Zona;
  }
  if (lado === 'cen' && Y <= 58) return 'pintura';
  return `media-${lado}` as Zona;
}

export interface Tiro {
  x: number;
  y: number;
  ok: boolean;
  tres: boolean;
  /** Jugadora (id) y cuarto. */
  j?: string;
  c?: number;
}

/** Los tiros con posición de un partido en directo. */
export function tirosDeVivo(v: Vivo | undefined): Tiro[] {
  return (v?.cronologia ?? []).flatMap((j) =>
    (j.tipo === 'c2' || j.tipo === 'c3' || j.tipo === 'f2' || j.tipo === 'f3') && j.x !== undefined && j.y !== undefined
      ? [{ x: j.x, y: j.y, ok: j.tipo[0] === 'c', tres: j.tipo[1] === '3', ...(j.j ? { j: j.j } : {}), c: j.c }]
      : [],
  );
}

export const tirosDeEventos = (eventos: Evento[]): Tiro[] => eventos.flatMap((e) => tirosDeVivo(e.vivo));

export interface Cuenta {
  /** Anotados e intentados. */
  a: number;
  i: number;
  /** Porcentaje (0–100) o null si no hay intentos. */
  pct: number | null;
}

const cuenta = (ts: Tiro[]): Cuenta => {
  const a = ts.filter((t) => t.ok).length;
  return { a, i: ts.length, pct: ts.length ? Math.round((a / ts.length) * 100) : null };
};

export function porZona(tiros: Tiro[]): Record<Zona, Cuenta> {
  return Object.fromEntries(ZONAS.map((z) => [z.id, cuenta(tiros.filter((t) => zonaDe(t.x, t.y) === z.id))])) as Record<Zona, Cuenta>;
}

/** Tiros de campo, de 2, de 3 y el porcentaje efectivo (los triples valen medio acierto más). */
export function resumenTiros(tiros: Tiro[]): { tc: Cuenta; t2: Cuenta; t3: Cuenta; efg: number | null } {
  const tc = cuenta(tiros);
  const t3 = cuenta(tiros.filter((t) => t.tres));
  return { tc, t2: cuenta(tiros.filter((t) => !t.tres)), t3, efg: tc.i ? Math.round(((tc.a + 0.5 * t3.a) / tc.i) * 100) : null };
}

/** Color del calor para un porcentaje: de rojo (tira mal) a verde (tira bien). Sin intentos, ninguno. */
export function colorCalor(pct: number | null): string | undefined {
  if (pct === null) return undefined;
  const t = Math.min(1, Math.max(0, (pct - 20) / 40));
  return `hsl(${Math.round(t * 130)} 70% 48%)`;
}

/** A partir de una pulsación en la pista (píxeles dentro de la caja) devuelve la posición de 0 a 100. */
export function posicionDe(px: number, py: number, ancho: number, alto: number): { x: number; y: number } {
  const lim = (n: number) => Math.round(Math.min(100, Math.max(0, n)) * 10) / 10;
  return { x: lim((px / ancho) * 100), y: lim((py / alto) * 100) };
}
