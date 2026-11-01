// Bandeja de entrada (loop Herramienta diaria, tramo 2): lo que Adam pega o adjunta de un partido se convierte en
// borradores. NADA de esto toca el almacenamiento: los borradores viven en la pantalla y solo `repartir` (que tampoco
// guarda: devuelve el resultado) se llama al pulsar «Aceptar y repartir». Quien guarda es la pantalla.
// Privacidad: antes de mandar nada a Claude, los nombres de la plantilla se cambian por su dorsal.
import { limpiarDirecto, type Directo } from '../temporada/directo';
import { limpiarInforme, RASGOS_RIVAL, type InformeRival } from '../temporada/rival';
import type { Evento } from '../temporada/temporada';
import { nuevaFicha, type Ficha } from '../recursos/fichas';

export type TipoBorrador = 'boxscore' | 'notas' | 'rival' | 'ejercicio';

export const NOMBRE_TIPO: Record<TipoBorrador, string> = {
  boxscore: 'Estadística del partido',
  notas: 'Notas tácticas',
  rival: 'Informe del rival',
  ejercicio: 'Posible ejercicio',
};

export interface FilaBox {
  dorsal: string;
  p: number;
  f: number;
  reb?: number;
  ast?: number;
  rob?: number;
  per?: number;
}

interface Base {
  id: string;
  titulo: string;
  /** El entrenador lo quita antes de repartir. */
  incluir: boolean;
}
export type Borrador =
  | (Base & { tipo: 'boxscore'; filas: FilaBox[] })
  | (Base & { tipo: 'notas'; texto: string })
  | (Base & { tipo: 'rival'; rasgos: string[]; vigilar: string; haremos: string })
  | (Base & { tipo: 'ejercicio'; objetivo: string; pasos: string[] });

/** Tope de letras que Jarvis acepta en una petición (menos el texto base). */
export const MAX_TEXTO = 6000;

let contador = 0;
const nuevoId = () => `b${Date.now().toString(36)}${(contador++).toString(36)}`;
const corto = (t: unknown, max: number) => (typeof t === 'string' ? t.replace(/[ \t]+/g, ' ').trim().slice(0, max) : '');
const entero = (x: unknown, tope: number) => {
  const n = typeof x === 'number' ? x : typeof x === 'string' ? Number(x.replace(',', '.')) : NaN;
  return Number.isFinite(n) ? Math.min(tope, Math.max(0, Math.round(n))) : 0;
};

// ---------- 1. Estadística desde una tabla (CSV, hoja de cálculo pegada, texto de un PDF) ----------

const COLUMNAS: Record<string, keyof FilaBox> = {
  dorsal: 'dorsal', n: 'dorsal', num: 'dorsal', numero: 'dorsal', nº: 'dorsal', no: 'dorsal', '#': 'dorsal',
  pts: 'p', puntos: 'p', p: 'p', pt: 'p',
  faltas: 'f', f: 'f', pf: 'f',
  reb: 'reb', rebotes: 'reb', r: 'reb', rt: 'reb',
  ast: 'ast', asistencias: 'ast', a: 'ast', as: 'ast',
  rob: 'rob', robos: 'rob', st: 'rob', br: 'rob',
  per: 'per', perdidas: 'per', 'pérdidas': 'per', to: 'per', bp: 'per',
};

const sinTildes = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '');
const celdasDe = (linea: string) => linea.split(/\s*[;\t|]\s*|,(?=\s*\S)/).map((c) => c.trim()).filter((c) => c !== '');

/** Lee las filas de una tabla con cabecera (dorsal y puntos como mínimo). Devuelve [] si el texto no es una tabla. */
export function leerTabla(texto: string): FilaBox[] {
  const lineas = texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lineas.length; i++) {
    const cab = celdasDe(lineas[i]).map((c) => COLUMNAS[sinTildes(c.toLowerCase()).replace(/\.$/, '')] ?? COLUMNAS[c.toLowerCase().replace(/\.$/, '')]);
    if (!cab.includes('dorsal') || !cab.includes('p')) continue;
    const filas: FilaBox[] = [];
    for (const l of lineas.slice(i + 1)) {
      const c = celdasDe(l);
      if (c.length < cab.length - 1) continue;
      const fila: FilaBox = { dorsal: '', p: 0, f: 0 };
      cab.forEach((campo, k) => {
        if (!campo || c[k] === undefined) return;
        if (campo === 'dorsal') fila.dorsal = c[k].replace(/^#/, '').slice(0, 3);
        else if (campo === 'p' || campo === 'f') fila[campo] = entero(c[k], campo === 'p' ? 300 : 7);
        else if (entero(c[k], 99)) fila[campo] = entero(c[k], 99);
      });
      if (/^\d{1,2}$/.test(fila.dorsal) || /^00$/.test(fila.dorsal)) filas.push(fila);
    }
    return filas;
  }
  return [];
}

// ---------- 2. Privacidad: nombres → dorsales ----------

const escapar = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Cambia los nombres de la plantilla por «#dorsal». Devuelve cuántas veces cambió algo. */
export function anonimizar(texto: string, plantilla: { nombre: string; numero: string }[]): { texto: string; cambios: number } {
  let salida = texto;
  let cambios = 0;
  // Primero los nombres completos y luego sus trozos (de 3 letras o más), de más largo a más corto.
  const partes = plantilla.flatMap((j) => {
    const marca = j.numero ? `#${j.numero}` : 'una jugadora';
    const nombre = j.nombre.trim();
    if (!nombre) return [];
    const trozos = nombre.split(/\s+/).filter((t) => t.length >= 3);
    return [nombre, ...trozos].map((t) => ({ t, marca }));
  });
  partes.sort((a, b) => b.t.length - a.t.length);
  for (const { t, marca } of partes) {
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapar(t)}(?![\\p{L}\\p{N}])`, 'giu');
    salida = salida.replace(re, () => { cambios++; return marca; });
  }
  return { texto: salida, cambios };
}

// ---------- 3. Borradores sin conexión ----------

/** Lo que se puede sacar en el móvil, sin IA: la tabla de estadística y, si hay más texto, una nota. */
export function borradoresLocales(texto: string): Borrador[] {
  const t = texto.trim();
  if (!t) return [];
  const filas = leerTabla(t);
  if (filas.length) return [{ id: nuevoId(), tipo: 'boxscore', titulo: 'Estadística del partido', filas, incluir: true }];
  return [{ id: nuevoId(), tipo: 'notas', titulo: 'Notas del partido', texto: t.slice(0, 4000), incluir: true }];
}

// ---------- 4. Con Claude (por Jarvis) ----------

export const PROMPT_BANDEJA = `You are the assistant of a basketball coach. Sort the raw match material below into drafts.
Rules:
- Do not invent anything: use only what the text says. Players appear only as jersey numbers.
- Write all the content in Spanish (Spain), short and practical.
- Reply with ONLY a JSON object, with no text around it:
{"borradores":[{"tipo":"boxscore","titulo":"","filas":[{"dorsal":"7","p":12,"f":2,"reb":4,"ast":1,"rob":0,"per":2}]},
{"tipo":"notas","titulo":"","texto":""},
{"tipo":"rival","titulo":"","rasgos":[],"vigilar":"","haremos":""},
{"tipo":"ejercicio","titulo":"","objetivo":"","pasos":["",""]}]}
- Include only the kinds that the text really supports. "rasgos" may only use these ids: ${RASGOS_RIVAL.map((r) => r.id).join(', ')}.
- "vigilar" names opponents only by jersey number.`;

export function promptBandeja(textoAnonimo: string): string {
  return `${PROMPT_BANDEJA}\n\nMATERIAL:\n${textoAnonimo.slice(0, MAX_TEXTO)}`;
}

/** Quita las vallas ``` y se queda con el primer objeto JSON completo. */
function extraerJson(t: string): unknown {
  const s = t.replace(/```(?:json)?/gi, '');
  const ini = s.indexOf('{');
  const fin = s.lastIndexOf('}');
  if (ini < 0 || fin <= ini) return undefined;
  try {
    return JSON.parse(s.slice(ini, fin + 1));
  } catch {
    return undefined;
  }
}

/** Convierte la respuesta de Claude en borradores. Lo que no cuadra se tira; nunca lanza. */
export function leerRespuesta(texto: string): Borrador[] {
  const x = extraerJson(texto) as { borradores?: unknown } | undefined;
  if (!x || !Array.isArray(x.borradores)) return [];
  const salida: Borrador[] = [];
  for (const raw of x.borradores.slice(0, 12)) {
    const b = raw as Record<string, unknown> | null;
    if (!b || typeof b !== 'object') continue;
    const titulo = corto(b.titulo, 80);
    if (b.tipo === 'boxscore' && Array.isArray(b.filas)) {
      const filas: FilaBox[] = [];
      for (const f of b.filas.slice(0, 30) as Record<string, unknown>[]) {
        const dorsal = corto(f?.dorsal, 3).replace(/^#/, '');
        if (!/^\d{1,2}$/.test(dorsal)) continue;
        const fila: FilaBox = { dorsal, p: entero(f.p, 300), f: entero(f.f, 7) };
        for (const k of ['reb', 'ast', 'rob', 'per'] as const) if (entero(f[k], 99)) fila[k] = entero(f[k], 99);
        filas.push(fila);
      }
      if (filas.length) salida.push({ id: nuevoId(), tipo: 'boxscore', titulo: titulo || NOMBRE_TIPO.boxscore, filas, incluir: true });
    } else if (b.tipo === 'notas') {
      const t = corto(b.texto, 4000);
      if (t) salida.push({ id: nuevoId(), tipo: 'notas', titulo: titulo || NOMBRE_TIPO.notas, texto: t, incluir: true });
    } else if (b.tipo === 'rival') {
      const validos = new Set(RASGOS_RIVAL.map((r) => r.id));
      const rasgos = Array.isArray(b.rasgos) ? [...new Set(b.rasgos.filter((r): r is string => typeof r === 'string' && validos.has(r)))] : [];
      const vigilar = corto(b.vigilar, 400);
      const haremos = corto(b.haremos, 400);
      if (rasgos.length || vigilar || haremos) salida.push({ id: nuevoId(), tipo: 'rival', titulo: titulo || NOMBRE_TIPO.rival, rasgos, vigilar, haremos, incluir: true });
    } else if (b.tipo === 'ejercicio') {
      const pasos = Array.isArray(b.pasos) ? b.pasos.map((p) => corto(p, 200)).filter(Boolean).slice(0, 10) : [];
      if (titulo && pasos.length) salida.push({ id: nuevoId(), tipo: 'ejercicio', titulo, objetivo: corto(b.objetivo, 200), pasos, incluir: true });
    }
  }
  return salida;
}

// ---------- 5. Repartir (solo al aceptar) ----------

export interface ResultadoReparto {
  evento: Evento;
  fichas: Ficha[];
  /** Lo que no se pudo repartir y por qué. */
  avisos: string[];
  /** Cuántos borradores se repartieron. */
  repartidos: number;
}

/** Dorsal → id de jugadora: igual de texto o, si no hay otra igual, igual de número («07» y «7»). */
function idPorDorsal(dorsal: string, jugadoras: { id: string; numero: string }[]): string | undefined {
  const exacta = jugadoras.filter((j) => j.numero.trim() === dorsal);
  if (exacta.length === 1) return exacta[0].id;
  if (exacta.length > 1) return undefined;
  const num = jugadoras.filter((j) => /^\d+$/.test(j.numero.trim()) && /^\d+$/.test(dorsal) && Number(j.numero) === Number(dorsal));
  return num.length === 1 ? num[0].id : undefined;
}

/** Aplica los borradores marcados como «incluir» sobre el partido. Es pura: no guarda nada. */
export function repartir(borradores: Borrador[], evento: Evento, jugadoras: { id: string; numero: string }[]): ResultadoReparto {
  let e: Evento = { ...evento };
  const fichas: Ficha[] = [];
  const avisos: string[] = [];
  let repartidos = 0;
  for (const b of borradores.filter((x) => x.incluir)) {
    if (b.tipo === 'boxscore') {
      const directo: Directo = { ...(e.directo ?? {}) };
      let puestas = 0;
      for (const f of b.filas) {
        const id = idPorDorsal(f.dorsal, jugadoras);
        if (!id) { avisos.push(`Dorsal ${f.dorsal}: no sé qué jugador es y no lo he apuntado.`); continue; }
        const { dorsal: _d, ...linea } = f;
        directo[id] = linea;
        puestas++;
      }
      if (puestas) { e = { ...e, directo: limpiarDirecto(directo) }; repartidos++; }
    } else if (b.tipo === 'notas') {
      const nota = b.texto.trim();
      if (nota) { e = { ...e, balance: [e.balance, nota].filter(Boolean).join('\n') }; repartidos++; }
    } else if (b.tipo === 'rival') {
      const antes: InformeRival = e.rival ?? { rasgos: [], vigilar: '', haremos: '' };
      const junto = (a: string, n: string) => [a, n].filter((x) => x.trim()).join('\n');
      e = { ...e, rival: limpiarInforme({ rasgos: [...new Set([...antes.rasgos, ...b.rasgos])], vigilar: junto(antes.vigilar, b.vigilar), haremos: junto(antes.haremos, b.haremos) }) };
      repartidos++;
    } else if (b.tipo === 'ejercicio') {
      fichas.push({ ...nuevaFicha(), nombre: b.titulo, objetivo: b.objetivo, pasos: b.pasos, etiquetas: ['bandeja'] });
      repartidos++;
    }
  }
  return { evento: e, fichas, avisos, repartidos };
}
