// Opciones del cuestionario de «Pedir a Claude» (boceto 3A): cada pregunta es una fila de botones con lo normal ya marcado.
// «Otro» abre un campo para escribir. El valor sigue siendo un texto, así que el encargo a Claude no cambia.
import { CUESTIONARIO_VACIO, type Cuestionario } from './ia';

export type CampoOpciones = 'objetivo' | 'jugadoras' | 'material' | 'minutos' | 'nivel' | 'espacio';

export interface Pregunta {
  k: CampoOpciones;
  nombre: string;
  opciones: string[];
  /** Si se puede quitar la marca (la pregunta es opcional). */
  opcional?: boolean;
}

export const PREGUNTAS: Pregunta[] = [
  { k: 'objetivo', nombre: '¿Qué trabajar?', opciones: ['Pase', 'Bote', 'Tiro', 'Defensa', 'Rebote', 'Contraataque', 'Calentamiento', 'Juego reducido'] },
  { k: 'jugadoras', nombre: 'Jugadoras', opciones: ['3', '4', '5', '6', '8', '10', '12'] },
  { k: 'material', nombre: 'Material', opciones: ['1 balón', 'Un balón por pareja', 'Un balón cada una', 'Conos', 'Sin material'] },
  { k: 'minutos', nombre: 'Minutos', opciones: ['5', '8', '10', '15', '20'] },
  { k: 'nivel', nombre: 'Nivel', opciones: ['Iniciación', 'Medio', 'Avanzado'] },
  { k: 'espacio', nombre: 'Espacio', opciones: ['Media pista', 'Pista entera', 'Un tercio de pista'] },
];

/** Lo normal en un entrenamiento: así basta con tocar «Dibujar» o cambiar una sola cosa. */
export const CUESTIONARIO_NORMAL: Cuestionario = {
  ...CUESTIONARIO_VACIO,
  objetivo: 'Pase',
  jugadoras: '5',
  material: '1 balón',
  minutos: '10',
  nivel: 'Medio',
  espacio: 'Media pista',
};

/** ¿Lo escrito en esta pregunta es algo propio («Otro») y no una de las opciones? */
export const esOtro = (p: Pregunta, valor: string): boolean => valor.trim() !== '' && !p.opciones.includes(valor);

/** Marca una opción; si ya estaba marcada y la pregunta es opcional, la quita. */
export function elegir(c: Cuestionario, p: Pregunta, opcion: string): Cuestionario {
  return { ...c, [p.k]: c[p.k] === opcion && p.opcional ? '' : opcion };
}
