// Ejercicio hecho por Claude: comprueba el texto que devuelve y lo convierte en un Sistema propio (borrador).
// Función pura, sin pantalla. Si algo no encaja devuelve el motivo en castellano; el mismo motivo se le repite
// a Claude en el reintento. Claude solo propone ejercicios (técnica, juegos reducidos): nunca se guarda solo.
import type { Jugador, Movimiento, Punto, Sistema } from '../sistemas/tipos';

/** Jarvis corta la respuesta a este tamaño: si llega entera al tope, casi seguro faltó el final. */
export const LIMITE_RESPUESTA = 12000;
export const MAX_PUESTOS = 5;
export const MAX_PASOS = 8;
const MAX_MOV_POR_PASO = 6;
const ANCHO = 150;
const FONDO = 140;
/** Hasta cuánto fuera de la pista se corrige sin protestar (decímetros); más allá se rechaza. */
const MARGEN = 12;

const PUESTOS: Jugador[] = ['1', '2', '3', '4', '5'];
const TIPOS = ['corte', 'bote', 'bloqueo'] as const;
// Los puestos que no salen se colocan aquí para que el Sistema siga completo; no se dibujan (visibles).
const RESERVA: Sistema['inicio'] = { '1': [75, 100], '2': [22, 70], '3': [128, 70], '4': [14, 14], '5': [136, 14] };

export type Resultado = { ok: true; sistema: Sistema; minutos?: number; material: string } | { ok: false; motivo: string };

const fallo = (motivo: string): Resultado => ({ ok: false, motivo });
class Rechazo extends Error {}
const no = (motivo: string): never => {
  throw new Rechazo(motivo);
};

const esObjeto = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Texto corto y limpio: sin HTML ni saltos, recortado. */
function texto(v: unknown, max: number, dónde: string, obligatorio: boolean): string {
  if (v === undefined || v === null || v === '') {
    if (obligatorio) no(`falta ${dónde}`);
    return '';
  }
  if (typeof v !== 'string') return no(`${dónde} debe ser un texto`);
  if (/<\s*\/?\s*[a-zA-Z!]/.test(v) || /&[a-z#0-9]+;/i.test(v)) return no(`${dónde} lleva HTML`);
  const t = v.replace(/\s+/g, ' ').trim();
  if (!t && obligatorio) no(`falta ${dónde}`);
  return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t;
}

function coordenada(n: unknown, max: number, dónde: string): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return no(`${dónde}: la coordenada no es un número`);
  if (n < -MARGEN || n > max + MARGEN) return no(`${dónde}: queda fuera de la pista`);
  return Math.round(Math.min(Math.max(n, 0), max));
}

function punto(p: unknown, dónde: string): Punto {
  if (!Array.isArray(p) || p.length !== 2) return no(`${dónde} debe ser [x, y]`);
  return [coordenada(p[0], ANCHO, dónde), coordenada(p[1], FONDO, dónde)];
}

function puesto(v: unknown, salen: Jugador[], dónde: string): Jugador {
  const j = typeof v === 'number' ? String(v) : v;
  if (typeof j !== 'string' || !PUESTOS.includes(j as Jugador)) return no(`${dónde}: puesto desconocido`);
  if (!salen.includes(j as Jugador)) return no(`${dónde}: la jugadora ${j} no sale en el ejercicio`);
  return j as Jugador;
}

/** Saca el JSON del texto. Solo se admite el JSON solo o dentro de un bloque de código; nada más alrededor. */
function extraer(crudo: string): unknown {
  let t = crudo.trim();
  if (!t) no('la respuesta está vacía');
  const valla = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(t);
  if (valla) t = valla[1];
  if (!t.startsWith('{') || !t.endsWith('}')) {
    return no(t.includes('{') ? 'hay texto fuera del JSON o la respuesta quedó cortada' : 'la respuesta no es un JSON');
  }
  try {
    return JSON.parse(t);
  } catch {
    return no(crudo.length >= LIMITE_RESPUESTA ? 'la respuesta se cortó por ser demasiado larga' : 'el JSON no es válido');
  }
}

function leerMovimiento(m: unknown, salen: Jugador[], dónde: string): Movimiento {
  if (!esObjeto(m)) return no(`${dónde} no es un movimiento`);
  if (m.tipo === 'pase') {
    const de = puesto(m.de, salen, `${dónde} (pase, de)`);
    const a = puesto(m.a, salen, `${dónde} (pase, a)`);
    if (de === a) no(`${dónde}: una jugadora no puede pasarse a sí misma`);
    return { tipo: 'pase', de, a };
  }
  if (typeof m.tipo !== 'string' || !(TIPOS as readonly string[]).includes(m.tipo)) return no(`${dónde}: tipo de movimiento desconocido`);
  const mov: Movimiento = {
    tipo: m.tipo as (typeof TIPOS)[number],
    jugador: puesto(m.jugador, salen, `${dónde} (jugador)`),
    a: punto(m.a, `${dónde} (a)`),
  };
  if (m.por !== undefined && m.por !== null) mov.por = punto(m.por, `${dónde} (por)`);
  return mov;
}

/**
 * Formato que debe devolver Claude (solo JSON):
 * {"nombre","objetivo","minutos","material","jugadoras":{"1":[x,y],…},"balon":"1","pasos":[{"texto","movimientos":[…]}]}
 * Los movimientos son los de un Sistema: {tipo:"corte"|"bote"|"bloqueo",jugador,a:[x,y],por?:[x,y]} o {tipo:"pase",de,a}.
 */
export function validarEjercicio(crudo: string, id: string): Resultado {
  try {
    if (typeof crudo !== 'string') return fallo('la respuesta no es un texto');
    const x = extraer(crudo);
    if (!esObjeto(x)) return fallo('la respuesta no es un objeto JSON');

    const nombre = texto(x.nombre, 60, 'el nombre', true);
    const objetivo = texto(x.objetivo, 160, 'el objetivo', false);
    const material = texto(x.material, 100, 'el material', false);
    const min = x.minutos === undefined || x.minutos === null ? NaN : Number(x.minutos);
    const minutos = Number.isFinite(min) && min >= 1 && min <= 120 ? Math.round(min) : undefined;

    if (!esObjeto(x.jugadoras)) return fallo('faltan las jugadoras que salen y su posición');
    const claves = Object.keys(x.jugadoras);
    if (!claves.length) return fallo('no sale ninguna jugadora');
    if (claves.length > MAX_PUESTOS) return fallo(`salen más de ${MAX_PUESTOS} jugadoras`);
    const salen: Jugador[] = [];
    for (const k of claves) {
      if (!PUESTOS.includes(k as Jugador)) return fallo(`puesto desconocido: ${k.slice(0, 20)}`);
      salen.push(k as Jugador);
    }
    const inicio: Sistema['inicio'] = { ...RESERVA };
    for (const j of salen) inicio[j] = punto((x.jugadoras as Record<string, unknown>)[j], `la posición de la jugadora ${j}`);

    let balon: Jugador = salen[0];
    let sinBalon = false;
    if (x.balon === undefined || x.balon === null || x.balon === '') sinBalon = true;
    else balon = puesto(x.balon, salen, 'el balón');

    if (!Array.isArray(x.pasos) || !x.pasos.length) return fallo('faltan los pasos del ejercicio');
    if (x.pasos.length > MAX_PASOS) return fallo(`hay más de ${MAX_PASOS} pasos`);
    const pasos = x.pasos.map((p: unknown, i: number) => {
      const dónde = `paso ${i + 1}`;
      if (!esObjeto(p)) return no(`${dónde} no es válido`);
      const movs = p.movimientos === undefined ? [] : p.movimientos;
      if (!Array.isArray(movs)) return no(`${dónde}: los movimientos deben ser una lista`);
      if (movs.length > MAX_MOV_POR_PASO) return no(`${dónde} tiene demasiados movimientos`);
      return {
        texto: texto(p.texto, 120, `el texto del ${dónde}`, true),
        movimientos: movs.map((m, k) => leerMovimiento(m, salen, `${dónde}, movimiento ${k + 1}`)),
      };
    });

    const sistema: Sistema = {
      id,
      nombre,
      tipo: 'ataque',
      contra: 'ejercicio',
      nivelMinimo: 'minibasket',
      idea: objetivo,
      inicio,
      balon,
      pasos,
      lecturas: {},
      errores: [],
      ejercicios: [],
      propio: true,
      visibles: salen.length < MAX_PUESTOS ? [...salen] : undefined,
      sinBalon: sinBalon || undefined,
    };
    return { ok: true, sistema, minutos, material };
  } catch (e) {
    if (e instanceof Rechazo) return fallo(e.message);
    throw e;
  }
}
