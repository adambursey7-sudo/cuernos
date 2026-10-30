// Ejercicio hecho por Claude: comprueba el texto que devuelve y lo convierte en un Sistema propio (borrador).
// Función pura, sin pantalla. Si algo no encaja devuelve el motivo en castellano; el mismo motivo se le repite
// a Claude en el reintento. Claude solo propone ejercicios (técnica, juegos reducidos): nunca se guarda solo.
import { espacioMasCercano, pegarAEspacio, type Espacio } from '../sistemas/espacios';
import type { Jugador, Movimiento, Punto, Sistema } from '../sistemas/tipos';

/** Dos jugadoras a menos de esto (decímetros) al empezar se pisan. */
const DISTANCIA_MINIMA = 8;
/** Un pase entre jugadoras a menos de esto no es un pase. */
const PASE_MINIMO = 12;

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
 * Las reglas del balón (guía de la pista): solo quien lo tiene pasa y bota; quien lo tiene y sigue con él no «corta»
 * (sería andar); un pase no puede ser entre dos jugadoras casi pegadas. Los pases de un paso se leen en orden.
 * Devuelve el motivo, o '' si todo encaja. Se salta si el balón lo tiene alguien que no sale (sinBalon).
 */
function reglasDelBalon(pasos: { movimientos: Movimiento[] }[], inicio: Sistema['inicio'], balon: Jugador): string {
  const pos = { ...inicio };
  let tiene = balon;
  for (let i = 0; i < pasos.length; i++) {
    const alEmpezar = tiene;
    for (const m of pasos[i].movimientos) {
      if (m.tipo !== 'pase') continue;
      if (m.de !== tiene) return `paso ${i + 1}: la jugadora ${m.de} pasa sin tener el balón`;
      const [x, y] = pos[m.de];
      if (Math.hypot(x - pos[m.a][0], y - pos[m.a][1]) < PASE_MINIMO) return `paso ${i + 1}: el pase de ${m.de} a ${m.a} es entre jugadoras casi pegadas`;
      tiene = m.a;
    }
    for (const m of pasos[i].movimientos) {
      if (m.tipo === 'pase') continue;
      if (m.tipo === 'bote' && m.jugador !== alEmpezar && m.jugador !== tiene) return `paso ${i + 1}: la jugadora ${m.jugador} bota sin tener el balón`;
      if (m.tipo === 'corte' && m.jugador === alEmpezar && tiene === alEmpezar) return `paso ${i + 1}: la jugadora ${m.jugador} corta con el balón en las manos (debería botar)`;
    }
    for (const m of pasos[i].movimientos) if (m.tipo !== 'pase') pos[m.jugador] = m.a;
  }
  return '';
}

/**
 * Formato que debe devolver Claude (solo JSON):
 * {"nombre","objetivo","minutos","material","jugadoras":{"1":[x,y],…},"balon":"1","pasos":[{"texto","movimientos":[…]}]}
 * Los movimientos son los de un Sistema: {tipo:"corte"|"bote"|"bloqueo",jugador,a:[x,y],por?:[x,y]} o {tipo:"pase",de,a}.
 */
export function validarEjercicio(crudo: string, id: string, espacios?: Espacio[]): Resultado {
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

    // Con los espacios del entrenador, la jugadora que queda a medias se coloca en el espacio más cercano.
    if (espacios?.length) {
      for (const j of salen) inicio[j] = pegarAEspacio(inicio[j], espacios);
      const ocupados = new Map<string, Jugador>();
      for (const j of salen) {
        const e = espacioMasCercano(inicio[j], espacios);
        if (e.punto[0] !== inicio[j][0] || e.punto[1] !== inicio[j][1]) continue;
        const otra = ocupados.get(e.id);
        if (otra) return fallo(`las jugadoras ${otra} y ${j} empiezan en el mismo espacio (${e.nombre})`);
        ocupados.set(e.id, j);
      }
    }
    for (let a = 0; a < salen.length; a++) {
      for (let b = a + 1; b < salen.length; b++) {
        const p = inicio[salen[a]];
        const q = inicio[salen[b]];
        if (Math.hypot(p[0] - q[0], p[1] - q[1]) < DISTANCIA_MINIMA) return fallo(`las jugadoras ${salen[a]} y ${salen[b]} empiezan demasiado juntas`);
      }
    }

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

    if (espacios?.length) {
      for (const p of pasos) {
        for (const m of p.movimientos) if (m.tipo !== 'pase') m.a = pegarAEspacio(m.a, espacios);
      }
    }
    const roto = !sinBalon && reglasDelBalon(pasos, inicio, balon);
    if (roto) return fallo(roto);

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
