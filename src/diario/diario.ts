// Diario del entrenador (opción A, elegida por Adam el 30/10): plantilla con dorsal grande y ficha con tres pestañas.
// Todo vive solo en este móvil y entra en la copia de seguridad. No hay datos reales en el código.
import { limpiarHabilidades, type HabilidadEquipo } from '../habilidades/habilidades';
import { limpiarRotacion, type Rotacion } from '../rotacion/rotacion';
import { limpiarReglas, type Reglas } from '../reglas/reglas';
import { refrescarNumeros } from './puestos';

const CLAVE = 'horns.diario';

export const POSICIONES = ['Base', 'Escolta', 'Alero', 'Ala-pívot', 'Pívot'] as const;
export type Posicion = (typeof POSICIONES)[number];

export interface Nota {
  /** AAAA-MM-DD */
  fecha: string;
  texto: string;
}

export interface Jugadora {
  id: string;
  equipoId: string;
  nombre: string;
  /** Texto: hay dorsales como «00». */
  numero: string;
  posicion: Posicion | '';
  fuertes: string;
  mejorar: string;
  /** Cómo juega. */
  forma: string;
  /** Cómo entrenarla. */
  entrenar: string;
  notas: Nota[];
  /** Lesión en curso (dato de salud: solo en este móvil; la copia de seguridad la deja fuera salvo que se pida). */
  lesion?: Lesion;
  /** Papel en el equipo: titular, rotación o especialista. */
  rol?: Rol;
}

export interface Lesion {
  /** AAAA-MM-DD */
  desde: string;
  nota: string;
  /** En duda: puede jugar, pero no se sabe. Sin esto, está lesionado y no juega. */
  duda?: boolean;
}

/** Formación (cadete femenino, mini…) o senior masculino. Sin dato, es formación. */
export type TipoEquipo = 'formacion' | 'senior';

/** Papel en el equipo (solo se usa en senior). */
export const ROLES = [['titular', 'Titular'], ['rotacion', 'Rotación'], ['especialista', 'Especialista']] as const;
export type Rol = (typeof ROLES)[number][0];
export const esRol = (x: unknown): x is Rol => ROLES.some(([id]) => id === x);

export interface Equipo {
  id: string;
  /** Categoría: «Cadete femenino». */
  nombre: string;
  /** Solo se guarda si es senior; sin dato, formación. */
  tipo?: TipoEquipo;
  forma: string;
  virtudes: string;
  trabajar: string;
  /** Cómo entrenarlo. */
  como: string;
  /** Quién hace cada puesto de la pizarra (1 a 5): id de la jugadora. */
  puestos?: Partial<Record<'1' | '2' | '3' | '4' | '5', string>>;
  /** Habilidades del equipo con su estado (fuerte, normal, a trabajar). */
  habilidades?: HabilidadEquipo[];
  /** Rotación del próximo partido: quién juega cada uno de los 4 cuartos (ids de jugadora). */
  rotacion?: Rotacion;
  /** Reglas de la competición del equipo; sin ellas, las de FIBA. */
  reglas?: Reglas;
}

export interface Diario {
  equipos: Equipo[];
  jugadoras: Jugadora[];
}

const nuevoId = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const nuevoEquipo = (nombre: string, tipo: TipoEquipo = 'formacion'): Equipo => ({ id: nuevoId('e'), nombre, ...(tipo === 'senior' ? { tipo } : {}), forma: '', virtudes: '', trabajar: '', como: '' });

export const nuevaJugadora = (equipoId: string, datos: Partial<Jugadora> = {}): Jugadora => ({
  id: nuevoId('j'),
  equipoId,
  nombre: '',
  numero: '',
  posicion: '',
  fuertes: '',
  mejorar: '',
  forma: '',
  entrenar: '',
  notas: [],
  ...datos,
});

const esTexto = (x: unknown) => typeof x === 'string';

export function esEquipo(e: unknown): e is Equipo {
  const x = e as Equipo;
  return !!x && ['id', 'nombre', 'forma', 'virtudes', 'trabajar', 'como'].every((k) => esTexto(x[k as keyof Equipo]));
}

export function esJugadora(j: unknown): j is Jugadora {
  const x = j as Jugadora;
  return (
    !!x &&
    ['id', 'equipoId', 'nombre', 'numero', 'fuertes', 'mejorar', 'forma', 'entrenar'].every((k) => esTexto(x[k as keyof Jugadora])) &&
    (x.posicion === '' || (POSICIONES as readonly string[]).includes(x.posicion)) &&
    Array.isArray(x.notas) &&
    x.notas.every((n) => esTexto(n?.fecha) && esTexto(n?.texto)) &&
    (x.lesion === undefined || (!!x.lesion && esTexto(x.lesion.desde) && esTexto(x.lesion.nota) && (x.lesion.duda === undefined || typeof x.lesion.duda === 'boolean'))) &&
    (x.rol === undefined || esRol(x.rol))
  );
}

/** Deja solo lo válido (también al cargar una copia): sin equipo no hay jugadoras. */
export function limpiar(d: unknown): Diario {
  const x = d as Partial<Diario> | null;
  const validos = Array.isArray(x?.equipos) ? x!.equipos.filter(esEquipo) : [];
  const ids = new Set(validos.map((e) => e.id));
  const jugadoras = Array.isArray(x?.jugadoras) ? x!.jugadoras.filter((j) => esJugadora(j) && ids.has(j.equipoId)) : [];
  const equipos = validos.map(({ habilidades, rotacion, tipo, reglas, ...e }): Equipo => {
    const suyas = new Set(jugadoras.filter((j) => j.equipoId === e.id).map((j) => j.id));
    const r = limpiarRotacion(rotacion, suyas);
    const rg = limpiarReglas(reglas);
    return { ...e, ...(rg ? { reglas: rg } : {}), ...(tipo === 'senior' ? { tipo } : {}), ...(habilidades === undefined ? {} : { habilidades: limpiarHabilidades(habilidades) }), ...(r ? { rotacion: r } : {}) };
  });
  return { equipos, jugadoras };
}

export function leerDiario(): Diario {
  try {
    return limpiar(JSON.parse(localStorage.getItem(CLAVE) ?? '{}'));
  } catch {
    return { equipos: [], jugadoras: [] };
  }
}

/** Devuelve false si el móvil no deja guardar. */
export function guardarDiario(d: Diario): boolean {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(limpiar(d)));
    refrescarNumeros();
    return true;
  } catch {
    return false;
  }
}

/** Plantilla ordenada por dorsal (los sin número, al final). */
export function plantilla(d: Diario, equipoId: string): Jugadora[] {
  const n = (j: Jugadora) => (/^\d+$/.test(j.numero) ? Number(j.numero) : 1000);
  return d.jugadoras.filter((j) => j.equipoId === equipoId).sort((a, b) => n(a) - n(b) || a.nombre.localeCompare(b.nombre, 'es'));
}

/** Otra jugadora del mismo equipo con ese dorsal (para avisar, no para impedirlo). */
export const repetida = (d: Diario, j: Jugadora): Jugadora | undefined =>
  j.numero ? d.jugadoras.find((x) => x.equipoId === j.equipoId && x.id !== j.id && x.numero === j.numero) : undefined;

export const guardarJugadora = (d: Diario, j: Jugadora): Diario => ({
  ...d,
  jugadoras: d.jugadoras.some((x) => x.id === j.id) ? d.jugadoras.map((x) => (x.id === j.id ? j : x)) : [...d.jugadoras, j],
});

export const guardarEquipo = (d: Diario, e: Equipo): Diario => ({
  ...d,
  equipos: d.equipos.some((x) => x.id === e.id) ? d.equipos.map((x) => (x.id === e.id ? e : x)) : [...d.equipos, e],
});

export const quitarJugadora = (d: Diario, id: string): Diario => ({ ...d, jugadoras: d.jugadoras.filter((j) => j.id !== id) });

export const quitarEquipo = (d: Diario, id: string): Diario => ({
  equipos: d.equipos.filter((e) => e.id !== id),
  jugadoras: d.jugadoras.filter((j) => j.equipoId !== id),
});

/** Junta lo de una copia con lo actual: si coincide el id, gana la copia (salvo la lesión, las habilidades y el tipo de equipo: si la copia no los trae, se conservan los de este móvil). */
export function juntarDiario(actual: Diario, copia: Diario): Diario {
  const eq = new Set(copia.equipos.map((e) => e.id));
  const ju = new Set(copia.jugadoras.map((j) => j.id));
  return {
    equipos: [
      ...actual.equipos.filter((e) => !eq.has(e.id)),
      ...copia.equipos.map((e) => {
        const mio = actual.equipos.find((x) => x.id === e.id);
        return { ...e, ...(e.tipo || !mio?.tipo ? {} : { tipo: mio.tipo }), ...(e.habilidades || !mio?.habilidades ? {} : { habilidades: mio.habilidades }), ...(e.rotacion || !mio?.rotacion ? {} : { rotacion: mio.rotacion }), ...(e.reglas || !mio?.reglas ? {} : { reglas: mio.reglas }) };
      }),
    ],
    jugadoras: [
      ...actual.jugadoras.filter((j) => !ju.has(j.id)),
      ...copia.jugadoras.map((j) => {
        const mia = actual.jugadoras.find((x) => x.id === j.id);
        return j.lesion || !mia?.lesion ? j : { ...j, lesion: mia.lesion };
      }),
    ],
  };
}

/** El diario sin datos de salud (para la copia de seguridad por defecto). */
export const sinSalud = (d: Diario): Diario => ({ ...d, jugadoras: d.jugadoras.map(({ lesion: _quitada, ...resto }) => resto) });

/** Fuera de juego: lesionado de verdad (el que está en duda cuenta como disponible). */
export const estaFuera = (j: Jugadora) => !!j.lesion && !j.lesion.duda;

/** Cuántos de la plantilla pueden jugar (sin lesión en curso; los que están en duda, sí). */
export const disponibles = (js: Jugadora[]) => js.filter((j) => !estaFuera(j)).length;

export const hoy = () => {
  const f = new Date();
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
};
