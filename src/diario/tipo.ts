// Palabras según el tipo de equipo: en formación se habla de jugadoras; en senior masculino, de jugadores.
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

const FORMACION: Palabras = { jugadora: 'jugadora', jugadoras: 'jugadoras', Jugadora: 'Jugadora', Jugadoras: 'Jugadoras', nueva: 'Jugadora nueva', entrenarla: 'Cómo entrenarla', lesionada: 'Lesionada', todas: 'Han venido todas' };
const SENIOR: Palabras = { jugadora: 'jugador', jugadoras: 'jugadores', Jugadora: 'Jugador', Jugadoras: 'Jugadores', nueva: 'Jugador nuevo', entrenarla: 'Cómo entrenarlo', lesionada: 'Lesionado', todas: 'Han venido todos' };

export const palabras = (e?: Pick<Equipo, 'tipo'>): Palabras => (esSenior(e) ? SENIOR : FORMACION);
