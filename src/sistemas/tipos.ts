// Coordenadas de media pista FIBA en decímetros: x de 0 a 150 (ancho), y de 0 a 140 (fondo → medio campo).
// La canasta está en (75, 12).
export type Punto = [number, number];
export type Jugador = '1' | '2' | '3' | '4' | '5';
export type Nivel = 'minibasket' | 'infantil' | 'cadete' | 'junior' | 'senior';

export type Movimiento =
  | { tipo: 'corte' | 'bote' | 'bloqueo'; jugador: Jugador; a: Punto; por?: Punto }
  | { tipo: 'pase'; de: Jugador; a: Jugador };

export interface Paso {
  texto: string;
  movimientos: Movimiento[];
  /** Algo de la ficha que Adam aún tiene que confirmar. */
  revisar?: boolean;
}

export interface Sistema {
  id: string;
  nombre: string;
  tipo: 'ataque' | 'defensa';
  contra: string;
  nivelMinimo: Nivel;
  idea: string;
  inicio: Record<Jugador, Punto>;
  balon: Jugador;
  pasos: Paso[];
  lecturas: Partial<Record<Nivel, string>>;
  errores: string[];
  ejercicios: string[];
  borrador?: boolean;
  /** Creado por el entrenador en el editor (se guarda en su móvil). */
  propio?: boolean;
  /** Solo se dibujan estos jugadores (la pizarra de un ejercicio 2x0 o 3x3). Sin él, los cinco. */
  visibles?: Jugador[];
  /** El balón lo tiene alguien que no sale en el ejercicio: no se dibuja. */
  sinBalon?: boolean;
}

export const NIVELES: { id: Nivel; nombre: string }[] = [
  { id: 'minibasket', nombre: 'Minibasket' },
  { id: 'infantil', nombre: 'Infantil' },
  { id: 'cadete', nombre: 'Cadete' },
  { id: 'junior', nombre: 'Júnior' },
  { id: 'senior', nombre: 'Sénior' },
];
