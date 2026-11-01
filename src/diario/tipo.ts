// Palabras según el equipo: en femenino se habla de jugadoras; en masculino, de jugadores.
// El tipo (formación o senior) decide qué herramientas hay; el género, cómo se escribe.
import { esFemenino } from '../equipo/modelo';
import type { Equipo } from './diario';

export const esSenior = (e?: Pick<Equipo, 'tipo'>) => e?.tipo === 'senior';

export interface Palabras {
  jugadora: string;
  jugadoras: string;
  Jugadora: string;
  Jugadoras: string;
  nueva: string;
  entrenarla: string;
  lesionada: string;
  todas: string;
}

const FEMENINO: Palabras = { jugadora: 'jugadora', jugadoras: 'jugadoras', Jugadora: 'Jugadora', Jugadoras: 'Jugadoras', nueva: 'Jugadora nueva', entrenarla: 'Cómo entrenarla', lesionada: 'Lesionada', todas: 'Han venido todas' };
const MASCULINO: Palabras = { jugadora: 'jugador', jugadoras: 'jugadores', Jugadora: 'Jugador', Jugadoras: 'Jugadores', nueva: 'Jugador nuevo', entrenarla: 'Cómo entrenarlo', lesionada: 'Lesionado', todas: 'Han venido todos' };

export const palabras = (e?: Pick<Equipo, 'tipo' | 'genero'>): Palabras => (esFemenino(e) ? FEMENINO : MASCULINO);
