// Planificador (loop Pro, tramo 8): intensidad y carga de cada sesión, material, plantillas de semana y volumen semanal de la temporada.
// Todo se calcula con lo que ya hay; la carga se mide en «unidades» = minutos × intensidad (1 suave, 2 media, 3 alta; sin dato, media).
import { sumarDias } from '../temporada/fechas';
import { agendaDia, nuevoFijo, quitarFijo, faseDe, type EntrenoFijo, type Fase, type Temporada } from '../temporada/temporada';
import type { Bloque, Sesion } from './sesiones';

export type Intensidad = 1 | 2 | 3;
export const INTENSIDADES: readonly [Intensidad, string][] = [[1, 'Suave'], [2, 'Media'], [3, 'Alta']];
export const esIntensidad = (x: unknown): x is Intensidad => x === 1 || x === 2 || x === 3;
export const intensidadDe = (b: Pick<Bloque, 'intensidad'>): Intensidad => b.intensidad ?? 2;

export const cargaBloque = (b: Bloque): number => b.minutos * intensidadDe(b);
export const cargaSesion = (s: Pick<Sesion, 'bloques'>): number => s.bloques.reduce((n, b) => n + cargaBloque(b), 0);

/** Intensidad media de la sesión, de 1 a 3, ponderada por minutos. Sin bloques, nada. */
export function intensidadMedia(s: Pick<Sesion, 'bloques'>): number | undefined {
  const min = s.bloques.reduce((n, b) => n + b.minutos, 0);
  return min ? Math.round((cargaSesion(s) / min) * 10) / 10 : undefined;
}

export const nombreIntensidad = (m: number): string => (m < 1.5 ? 'Suave' : m < 2.5 ? 'Media' : 'Alta');

/** Material de la sesión: el de sus ejercicios (separado por comas) más el que se añada a mano, sin repetir. */
export function materialDeSesion(s: Pick<Sesion, 'bloques'> & { material?: string }, materialDe: (ejercicioId: string) => string[]): string[] {
  const todo = [...s.bloques.flatMap((b) => materialDe(b.ejercicio)), ...(s.material ?? '').split(',')];
  const vistos = new Map<string, string>();
  for (const m of todo.map((x) => x.trim()).filter(Boolean)) if (!vistos.has(m.toLowerCase())) vistos.set(m.toLowerCase(), m);
  return [...vistos.values()];
}

/** Mueve el bloque `de` a la posición `a` (arrastrar y soltar). */
export function moverBloqueA(s: Sesion, de: number, a: number): Sesion {
  if (de === a || de < 0 || a < 0 || de >= s.bloques.length || a >= s.bloques.length) return s;
  const bloques = [...s.bloques];
  const [b] = bloques.splice(de, 1);
  bloques.splice(a, 0, b);
  return { ...s, bloques };
}

export interface PlantillaSemana {
  id: string;
  nombre: string;
  idea: string;
  entrenos: { dia: number; hora: string; minutos: number; objetivo: string }[];
}

export const PLANTILLAS_SEMANA: PlantillaSemana[] = [
  { id: 'dos', nombre: 'Dos entrenos y partido', idea: 'Martes y jueves; el partido, el fin de semana.', entrenos: [{ dia: 1, hora: '19:00', minutos: 90, objetivo: 'Trabajo de la semana' }, { dia: 3, hora: '19:00', minutos: 75, objetivo: 'Preparar el partido' }] },
  { id: 'tres', nombre: 'Tres entrenos', idea: 'Lunes, miércoles y viernes con la víspera más suave.', entrenos: [{ dia: 0, hora: '19:00', minutos: 90, objetivo: 'Carga: fundamentos y tiro' }, { dia: 2, hora: '19:00', minutos: 90, objetivo: 'Táctica y juego de equipo' }, { dia: 4, hora: '19:00', minutos: 60, objetivo: 'Activación (víspera)' }] },
  { id: 'cuatro', nombre: 'Cuatro entrenos', idea: 'Para equipos de más nivel: dos fuertes, uno táctico y uno de víspera.', entrenos: [{ dia: 0, hora: '20:00', minutos: 90, objetivo: 'Carga física y fundamentos' }, { dia: 1, hora: '20:00', minutos: 90, objetivo: 'Táctica' }, { dia: 3, hora: '20:00', minutos: 90, objetivo: 'Preparar el partido' }, { dia: 4, hora: '19:30', minutos: 60, objetivo: 'Activación (víspera)' }] },
  { id: 'descarga', nombre: 'Semana de descarga', idea: 'Menos minutos y más suaves: después de una semana dura o en exámenes.', entrenos: [{ dia: 1, hora: '19:00', minutos: 60, objetivo: 'Descarga: técnica y tiro' }, { dia: 3, hora: '19:00', minutos: 60, objetivo: 'Descarga: juego libre y repaso' }] },
];

/**
 * Cambia los entrenos que se repiten cada semana (toda la temporada) por los de la plantilla.
 * Si un día ya tenía entreno se conserva su id (así no se pierden sus cambios de un día, sesiones ni listas), con su pista y vestuario;
 * los días que dejan de entrenar se quitan con todo lo que colgaba de ellos.
 */
export function aplicarPlantillaSemana(t: Temporada, p: PlantillaSemana): Temporada {
  const dias = new Set(p.entrenos.map((e) => e.dia));
  let limpia = t;
  for (const f of t.fijos) if (!dias.has(f.dia)) limpia = quitarFijo(limpia, f.id);
  const fijos: EntrenoFijo[] = p.entrenos.map((e) => {
    const antes = t.fijos.find((f) => f.dia === e.dia);
    return { ...(antes ?? nuevoFijo(e.dia)), dia: e.dia, hora: e.hora, minutos: e.minutos, objetivo: e.objetivo };
  });
  return { ...limpia, fijos };
}

export interface SemanaCarga {
  lunes: string;
  /** Minutos de entreno programados y carga en unidades. */
  minutos: number;
  carga: number;
  entrenos: number;
  partidos: number;
  fase?: Fase;
}

/** Volumen de cada semana de la temporada: los entrenos con su sesión (si la tienen) y los partidos que hay. */
export function volumenSemanal(t: Temporada | undefined, sesiones: Sesion[], desdeLunes: string, semanas: number): SemanaCarga[] {
  if (!t) return [];
  return Array.from({ length: semanas }, (_, w) => {
    const lunes = sumarDias(desdeLunes, 7 * w);
    let minutos = 0, carga = 0, entrenos = 0, partidos = 0;
    for (let d = 0; d < 7; d++) {
      for (const it of agendaDia(t, sumarDias(lunes, d))) {
        if (it.cancelado) continue;
        if (it.tipo === 'partido') { partidos++; continue; }
        if (it.tipo !== 'entreno') continue;
        const s = it.sesionId ? sesiones.find((x) => x.id === it.sesionId) : undefined;
        const m = s && s.bloques.length ? s.bloques.reduce((n, b) => n + b.minutos, 0) : it.fijo?.minutos ?? 60;
        minutos += m;
        carga += s && s.bloques.length ? cargaSesion(s) : m * 2;
        entrenos++;
      }
    }
    return { lunes, minutos, carga, entrenos, partidos, fase: faseDe(t, lunes) };
  });
}
