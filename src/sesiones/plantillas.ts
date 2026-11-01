// Plantillas de sesión de 90 minutos para senior y planificación de la semana según el partido.
// Rellenan huecos con ejercicios de la biblioteca (los de senior primero); lo que no encuentran se queda sin poner.
import { todosLosEjercicios, type Ejercicio, type TipoEjercicio } from '../ejercicios/ejercicios';
import { bloqueDe, nuevaSesion, type Sesion } from './sesiones';

interface Hueco {
  etiqueta: string;
  tipo: TipoEjercicio;
  minutos: number;
  /** Sistemas de la biblioteca donde buscar, por orden. Vacío: cualquiera. */
  sistemas: string[];
  formato?: string;
}

export interface Plantilla {
  id: string;
  nombre: string;
  idea: string;
  huecos: Hueco[];
}

export const PLANTILLAS: Plantilla[] = [
  {
    id: 'normal',
    nombre: 'Sesión de 90 minutos',
    idea: 'Calentamiento, tiro, lectura en pocos jugadores, juego de equipo y final de partido.',
    huecos: [
      { etiqueta: 'Calentamiento', tipo: 'drill', minutos: 15, sistemas: ['motion'], formato: '3x3' },
      { etiqueta: 'Tiro y bloqueo', tipo: 'tecnica', minutos: 15, sistemas: ['bloqueo-directo'], formato: '2x0' },
      { etiqueta: '2x2 con reglas de lectura', tipo: 'tactica', minutos: 20, sistemas: ['bloqueo-directo'], formato: '2x2' },
      { etiqueta: 'Sistema de la semana', tipo: 'tactica', minutos: 20, sistemas: [] },
      { etiqueta: 'Situación de partido', tipo: 'defensa', minutos: 10, sistemas: ['zona-2-3'] },
      { etiqueta: 'Final de partido', tipo: 'tactica', minutos: 10, sistemas: ['final-ultimo-tiro'] },
    ],
  },
  {
    id: 'activacion',
    nombre: 'Activación (víspera)',
    idea: 'Corta y con poca carga: repasar lo que se juega mañana.',
    huecos: [
      { etiqueta: 'Calentamiento', tipo: 'drill', minutos: 15, sistemas: ['motion'] },
      { etiqueta: 'Repaso de jugadas', tipo: 'tactica', minutos: 25, sistemas: [] },
      { etiqueta: 'Balón parado', tipo: 'tactica', minutos: 20, sistemas: ['ato-banda'] },
    ],
  },
];

/** Qué cargar según los días que faltan para el partido (sábado o domingo). */
export function cargaSegunPartido(dias: number): { nivel: 'alta' | 'media' | 'baja'; texto: string } {
  if (dias <= 1) return { nivel: 'baja', texto: 'Activación: jugadas que se usan en el partido, sin carga.' };
  if (dias === 2) return { nivel: 'media', texto: 'Plan de partido: defensas y ataques del rival, balón parado.' };
  return { nivel: 'alta', texto: 'Trabajo fuerte: ejercicios de lectura y situaciones, juego de equipo.' };
}

export function desdePlantilla(p: Plantilla, equipo: string, lista: Ejercicio[] = todosLosEjercicios()): Sesion {
  const base = nuevaSesion(equipo, p.nombre);
  const usados = new Set<string>();
  const bloques = p.huecos.flatMap((h) => {
    const candidatos = (h.sistemas.length ? h.sistemas.flatMap((s) => lista.filter((e) => e.sistema.id === s)) : lista).filter((e) => !usados.has(e.id));
    const e = (h.formato && candidatos.find((x) => x.formato === h.formato)) || candidatos[0];
    if (!e) return [];
    usados.add(e.id);
    return [bloqueDe(e.id, h.minutos, h.tipo)];
  });
  return { ...base, duracion: p.huecos.reduce((a, h) => a + h.minutos, 0), bloques };
}
