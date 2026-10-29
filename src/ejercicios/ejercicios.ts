// Biblioteca de ejercicios (opción A, elegida por Adam el 29/10): sale de las líneas «Ejercicios relacionados» de cada ficha.
// De la ficha: formato, jugadores, sistema y nivel. Lo demás (tipo, tiempo, material y pizarra) va marcado como borrador.
import { inicios } from '../pizarra/animar';
import { todosLosSistemas } from '../sistemas/almacen';
import { NIVELES, type Jugador, type Nivel, type Sistema } from '../sistemas/tipos';
import { BORRADORES, type Borrador } from './borradores';

export type TipoEjercicio = 'tactica' | 'tecnica' | 'defensa' | 'drill';

/** Los cuatro tipos de Adam; cada uno tendrá su color en la línea de tiempo de la sesión. */
export const TIPOS: { id: TipoEjercicio; nombre: string }[] = [
  { id: 'tactica', nombre: 'Táctica' },
  { id: 'tecnica', nombre: 'Técnica individual' },
  { id: 'defensa', nombre: 'Defensa' },
  { id: 'drill', nombre: 'Drills' },
];

export interface Ejercicio {
  id: string;
  /** «2x0», «3x3»…; vacío si la línea de la ficha no empieza por un formato. */
  formato: string;
  /** La línea de la ficha sin el formato: «Bloqueo directo y continuación». */
  nombre: string;
  sistema: Sistema;
  nivel: Nivel;
  atacantes?: number;
  defensores?: number;
  tipo: TipoEjercicio;
  minutos: number;
  material: string[];
  /** La pizarra del sistema recortada a los jugadores y pasos del ejercicio. */
  pizarra?: Sistema;
  /** Qué datos son borrador (no salen de la ficha) y tiene que revisar Adam. */
  porRevisar: ('tipo' | 'tiempo' | 'material' | 'pizarra')[];
}

const FORMATO = /^(\d)\s?x\s?(\d)\s*/i;

/** Tiempo de partida según el formato (borrador): los de pocos jugadores, más cortos. */
function minutosDe(atacantes?: number, defensores?: number): number {
  if (atacantes === undefined) return 10;
  if (atacantes === 5 && defensores === 5) return 15;
  if (defensores === 0 && atacantes < 5) return 8;
  return 10;
}

/** Pizarra del ejercicio: empieza donde están todos al llegar a su primer paso y solo enseña a sus jugadores. */
export function pizarraDe(s: Sistema, b: Borrador, id: string, nombre: string): Sistema | undefined {
  const [desde, hasta] = b.pasos ?? [0, s.pasos.length - 1];
  if (desde < 0 || hasta >= s.pasos.length || desde > hasta) return undefined;
  const vis = b.jugadores;
  const ve = (j: Jugador) => !vis || vis.includes(j);
  const pasos = s.pasos
    .slice(desde, hasta + 1)
    .map((p) => ({ ...p, movimientos: p.movimientos.filter((m) => (m.tipo === 'pase' ? ve(m.de) && ve(m.a) : ve(m.jugador))) }))
    // Un paso en el que no se mueve nadie del ejercicio sobra (en el sistema completo se dejan, porque llevan texto).
    .filter((p) => !vis || p.movimientos.length > 0);
  if (pasos.length === 0) return undefined;
  const marca = inicios(s)[desde];
  return { ...s, id, nombre, inicio: marca.pos, balon: marca.balon, pasos, visibles: vis, sinBalon: !ve(marca.balon) };
}

export function ejerciciosDe(s: Sistema): Ejercicio[] {
  return s.ejercicios.map((linea, i) => {
    const f = FORMATO.exec(linea);
    const atacantes = f ? Number(f[1]) : undefined;
    const defensores = f ? Number(f[2]) : undefined;
    const resto = (f ? linea.slice(f[0].length) : linea).replace(/\.$/, '');
    const nombre = resto.charAt(0).toUpperCase() + resto.slice(1);
    const id = `${s.id}~${i}`;
    const b = BORRADORES[`${s.id}|${linea}`];
    const pizarra = b ? pizarraDe(s, b, id, nombre) : undefined;
    return {
      id,
      formato: f ? `${atacantes}x${defensores}` : '',
      nombre,
      sistema: s,
      nivel: s.nivelMinimo,
      atacantes,
      defensores,
      // Todos los de las fichas son de un sistema de ataque: táctica hasta que Adam diga otra cosa.
      tipo: 'tactica',
      minutos: minutosDe(atacantes, defensores),
      material: defensores ? ['Balones', 'Petos'] : ['Balones'],
      pizarra,
      porRevisar: ['tipo', 'tiempo', 'material', ...(pizarra ? (['pizarra'] as const) : [])],
    };
  });
}

/** Los ejercicios del libro y de las jugadas propias, en el orden de las fichas. */
export const todosLosEjercicios = (): Ejercicio[] => todosLosSistemas().flatMap(ejerciciosDe);

export const buscarEjercicio = (id: string) => todosLosEjercicios().find((e) => e.id === id);

const orden = (n: Nivel) => NIVELES.findIndex((x) => x.id === n);

export interface Filtro {
  formato?: string;
  sistema?: string;
  /** Nivel del equipo: salen los ejercicios que valen desde ese nivel o antes. */
  nivel?: Nivel;
}

export function filtrar(lista: Ejercicio[], f: Filtro): Ejercicio[] {
  return lista.filter(
    (e) =>
      (!f.formato || e.formato === f.formato) &&
      (!f.sistema || e.sistema.id === f.sistema) &&
      (!f.nivel || orden(e.nivel) <= orden(f.nivel)),
  );
}

/** Formatos que hay en la lista, de menos a más jugadores en pista (2x0, 3x0, 2x2, 5x0, 3x3, 5x5). */
export function formatos(lista: Ejercicio[]): string[] {
  const peso = new Map<string, number>();
  for (const e of lista) if (e.formato) peso.set(e.formato, (e.atacantes ?? 0) + (e.defensores ?? 0) + (e.atacantes ?? 0) / 10);
  return [...peso.entries()].sort((a, b) => a[1] - b[1]).map(([f]) => f);
}
