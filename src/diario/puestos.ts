// «Quién es quién» (opción A, elegida por Adam el 30/10): cada equipo dice qué jugadora hace cada puesto (1–5) y la pizarra
// puede enseñar su dorsal en vez del puesto. Sin nombres en la pizarra: el GIF y la hoja se comparten con las familias.
import { leerDiario, type Diario, type Equipo, type Jugadora } from './diario';
import type { Jugador } from '../sistemas/tipos';

const CLAVE = 'horns.dorsales';
export const PUESTOS: Jugador[] = ['1', '2', '3', '4', '5'];
export const NOMBRE_PUESTO: Record<Jugador, string> = { '1': 'Base', '2': 'Escolta', '3': 'Alero', '4': 'Ala-pívot', '5': 'Pívot' };
export type Numeros = Record<Jugador, string>;

/** Quién hace cada puesto en un equipo (ids de jugadora que ya no existen se ignoran). */
export function puestosDe(d: Diario, e: Equipo): Partial<Record<Jugador, Jugadora>> {
  const sal: Partial<Record<Jugador, Jugadora>> = {};
  for (const p of PUESTOS) {
    const j = d.jugadoras.find((x) => x.id === e.puestos?.[p] && x.equipoId === e.id);
    if (j) sal[p] = j;
  }
  return sal;
}

/** Rellena los puestos que falten con la jugadora cuya posición coincide (una por puesto, la de dorsal más bajo). */
export function rellenarPuestos(d: Diario, e: Equipo): Equipo {
  const ocupadas = new Set(Object.values(e.puestos ?? {}));
  const puestos = { ...e.puestos };
  for (const p of PUESTOS) {
    if (puestos[p] && ocupadas.has(puestos[p]!)) continue;
    const j = d.jugadoras
      .filter((x) => x.equipoId === e.id && x.posicion === NOMBRE_PUESTO[p] && !ocupadas.has(x.id))
      .sort((a, b) => Number(a.numero || 1000) - Number(b.numero || 1000))[0];
    if (j) {
      puestos[p] = j.id;
      ocupadas.add(j.id);
    }
  }
  return { ...e, puestos };
}

/** Lo que se pinta en cada círculo: el dorsal del puesto, o el puesto si nadie lo hace o no tiene número. */
export function numerosDe(d: Diario, e: Equipo): Numeros {
  const q = puestosDe(d, e);
  return Object.fromEntries(PUESTOS.map((p) => [p, q[p]?.numero || p])) as Numeros;
}

export const hayPuestos = (e: Equipo) => PUESTOS.some((p) => e.puestos?.[p]);

// El equipo cuyos dorsales se enseñan ('' = los puestos 1–5). Se recuerda en el móvil.
let memo: Numeros | null | undefined;
export const refrescarNumeros = () => {
  memo = undefined;
};

export function equipoActivo(): string {
  try {
    return localStorage.getItem(CLAVE) ?? '';
  } catch {
    return '';
  }
}

export function elegirEquipoActivo(id: string) {
  try {
    localStorage.setItem(CLAVE, id);
  } catch {
    /* sin almacenamiento: vale hasta cerrar */
  }
  refrescarNumeros();
}

/** Los números que debe enseñar la pizarra ahora (null = los puestos 1–5). */
export function numerosActivos(): Numeros | null {
  if (memo !== undefined) return memo;
  const d = leerDiario();
  const e = d.equipos.find((x) => x.id === equipoActivo());
  memo = e && hayPuestos(e) ? numerosDe(d, e) : null;
  return memo;
}

/** Equipos que tienen «quién es quién» y se pueden enseñar en la pizarra. */
export const equiposConPuestos = (d: Diario) => d.equipos.filter(hayPuestos);
