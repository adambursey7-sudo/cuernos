// Jugada dentro del enlace (3.1, opción C elegida por Adam): sin cuentas ni servidor, porque la app vive en GitHub Pages.
// Todo va detrás de «#», que el navegador no manda a ningún servidor.
//   #j=cuernos&d=1&c=…   jugada del libro: basta con su id
//   #p=<comprimida>&d=1&c=…   jugada propia: entera, comprimida y en base64 para URL
// d = con defensa (1/0); c = los cuatro colores del entrenador sin «#», separados por puntos.
import { SISTEMAS } from '../sistemas/datos';
import { NIVELES, type Jugador, type Movimiento, type Nivel, type Paso, type Punto, type Sistema } from '../sistemas/tipos';
import type { Colores } from '../temas';

export interface Compartida {
  sistema: Sistema;
  conDefensa: boolean;
  colores: Colores | null;
  /** Es una jugada del libro (ya está en la app de quien la abre). */
  delLibro: boolean;
}

const JUGADORES: Jugador[] = ['1', '2', '3', '4', '5'];
const COLORES: (keyof Colores)[] = ['principal', 'fondo', 'pista', 'jugadores'];
/** Topes para que un enlace raro no cuelgue el móvil de quien lo abre. */
const MAX_BYTES = 64_000;
const MAX_PASOS = 40;
const MAX_MOVIMIENTOS = 12;
const MAX_TEXTO = 400;

/** Lo que viaja de una jugada propia: solo lo que hace falta para verla y guardarla. */
interface Paquete {
  n: string;
  t: Sistema['tipo'];
  nv: Nivel;
  i: Record<Jugador, Punto>;
  b: Jugador;
  p: [string, Movimiento[]][];
}

function aBase64(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function deBase64(texto: string): Uint8Array {
  const bin = atob(texto.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function comprimir(texto: string): Promise<Uint8Array> {
  const flujo = new Blob([texto]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(flujo).arrayBuffer());
}

/** Descomprime, pero corta si sale más de MAX_BYTES (un enlace pequeño que se infla a lo bestia). */
async function descomprimir(bytes: Uint8Array): Promise<string> {
  const lector = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
  const trozos: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    total += value.length;
    if (total > MAX_BYTES) {
      await lector.cancel();
      throw new Error('demasiado grande');
    }
    trozos.push(value);
  }
  return new TextDecoder().decode(await new Blob(trozos as BlobPart[]).arrayBuffer());
}

const esPunto = (p: unknown): p is Punto =>
  Array.isArray(p) && p.length === 2 && p.every((n) => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) < 1000);
const esJugador = (j: unknown): j is Jugador => JUGADORES.includes(j as Jugador);
const esTexto = (t: unknown, max = MAX_TEXTO): t is string => typeof t === 'string' && t.length <= max;

function esMovimiento(m: unknown): m is Movimiento {
  const x = m as Record<string, unknown>;
  if (!x || typeof x !== 'object') return false;
  if (x.tipo === 'pase') return esJugador(x.de) && esJugador(x.a);
  return ['corte', 'bote', 'bloqueo'].includes(x.tipo as string) && esJugador(x.jugador) && esPunto(x.a) && (x.por === undefined || esPunto(x.por));
}

/** Rehace la jugada a partir de lo que llega en el enlace; lo que no encaje la invalida entera. */
export function desempaquetar(p: unknown): Sistema | null {
  const x = p as Paquete;
  if (!x || typeof x !== 'object' || !esTexto(x.n, 80) || !x.i || !esJugador(x.b)) return null;
  if (!JUGADORES.every((j) => esPunto(x.i[j]))) return null;
  if (!Array.isArray(x.p) || x.p.length === 0 || x.p.length > MAX_PASOS) return null;
  const pasos: Paso[] = [];
  for (const paso of x.p) {
    if (!Array.isArray(paso) || !esTexto(paso[0]) || !Array.isArray(paso[1]) || paso[1].length > MAX_MOVIMIENTOS) return null;
    if (!paso[1].every(esMovimiento)) return null;
    pasos.push({ texto: paso[0], movimientos: paso[1] });
  }
  return {
    id: 'enlace',
    nombre: x.n.trim() || 'Jugada',
    tipo: x.t === 'defensa' ? 'defensa' : 'ataque',
    contra: '',
    nivelMinimo: NIVELES.some((n) => n.id === x.nv) ? x.nv : 'infantil',
    idea: '',
    inicio: Object.fromEntries(JUGADORES.map((j) => [j, x.i[j]])) as Record<Jugador, Punto>,
    balon: x.b,
    pasos,
    lecturas: {},
    errores: [],
    ejercicios: [],
  };
}

/** Enlace que abre la jugada animada. `base` es la dirección de la app (en GitHub Pages, …/cuernos/). */
export async function crearEnlace(s: Sistema, conDefensa: boolean, colores: Colores, base: string): Promise<string> {
  const datos = new URLSearchParams();
  if (!s.propio && SISTEMAS.some((x) => x.id === s.id)) datos.set('j', s.id);
  else {
    const paquete: Paquete = {
      n: s.nombre,
      t: s.tipo,
      nv: s.nivelMinimo,
      i: s.inicio,
      b: s.balon,
      p: s.pasos.map((p) => [p.texto, p.movimientos]),
    };
    datos.set('p', aBase64(await comprimir(JSON.stringify(paquete))));
  }
  datos.set('d', conDefensa ? '1' : '0');
  datos.set('c', COLORES.map((k) => colores[k].slice(1)).join('.'));
  return `${base.split('#')[0]}#${datos}`;
}

/** Lee el «#…» de la dirección. Devuelve null si no es un enlace de jugada, y lanza si lo es pero no se puede abrir. */
export async function leerEnlace(hash: string): Promise<Compartida | null> {
  const datos = new URLSearchParams(hash.replace(/^#/, ''));
  const id = datos.get('j');
  const comprimida = datos.get('p');
  if (!id && !comprimida) return null;

  let sistema: Sistema | null | undefined;
  if (id) sistema = SISTEMAS.find((s) => s.id === id);
  else {
    const texto = await descomprimir(deBase64(comprimida!));
    sistema = desempaquetar(JSON.parse(texto));
  }
  if (!sistema) throw new Error('jugada no válida');

  const trozos = (datos.get('c') ?? '').split('.');
  const colores =
    trozos.length === 4 && trozos.every((c) => /^[0-9a-f]{6}$/i.test(c))
      ? (Object.fromEntries(COLORES.map((k, n) => [k, '#' + trozos[n]])) as unknown as Colores)
      : null;
  return { sistema, conDefensa: datos.get('d') !== '0', colores, delLibro: !!id };
}
