// Salud y lesiones (loop Herramienta diaria, tramo 3). PRIVACIDAD:
//  - Todo vive en su propia clave del móvil (`horns.salud`), separada del diario. Solo este fichero la lee o la escribe.
//  - Nunca entra en la copia de seguridad, en un enlace, en lo que se manda a Claude ni en ninguna hoja para familias.
//    El diario guardado jamás lleva lesiones: `guardarDiario` las manda aquí y las quita del diario.
//  - Los detalles médicos (tipo, grado, notas, evolución) se pueden cifrar con un PIN. El resumen (baja, duda, fechas,
//    restricciones de carga) queda sin cifrar porque la convocatoria y la rotación lo necesitan.
import { cifrar, derivar, descifrar, esCifrado, nuevaSal, type Cifrado } from './cifrado';

export const CLAVE_SALUD = 'horns.salud';

export type Estado = 'baja' | 'duda';
export type Grado = '' | 'leve' | 'moderada' | 'grave';
export const GRADOS: { id: Exclude<Grado, ''>; nombre: string }[] = [
  { id: 'leve', nombre: 'Leve' },
  { id: 'moderada', nombre: 'Moderada' },
  { id: 'grave', nombre: 'Grave' },
];

export interface Detalle {
  tipo: string;
  grado: Grado;
  /** Restricciones explicadas con palabras. */
  nota: string;
  evolucion: { fecha: string; texto: string }[];
}

export interface Resumen {
  id: string;
  jugadoraId: string;
  activo: boolean;
  estado: Estado;
  /** Fecha de la baja, AAAA-MM-DD. */
  desde: string;
  /** Vuelta estimada. */
  vuelta?: string;
  /** Alta médica. */
  alta?: string;
  /** Fase de la vuelta progresiva (índice de FASES_VUELTA). */
  fase: number;
  /** Restricciones de carga. */
  sinContacto: boolean;
  maxMinutos?: number;
}

export interface Parte extends Resumen {
  detalle: Detalle | Cifrado;
}

interface Almacen {
  v: 1;
  pin?: { sal: string; prueba: Cifrado };
  partes: Parte[];
}

/** Vuelta progresiva, orientativa: la pauta real la marca el médico o el fisio. */
export const FASES_VUELTA = [
  { nombre: 'Reposo y tratamiento', texto: 'Sin entrenar con el equipo. Sigue lo que diga su médico o fisio.' },
  { nombre: 'Trabajo individual', texto: 'Movilidad, bote y tiro sin oposición, sin saltos fuertes ni contacto.' },
  { nombre: 'Con el grupo, sin contacto', texto: 'Entrena sistemas y 5x0 con minutos limitados; sin contacto.' },
  { nombre: 'Contacto parcial', texto: 'Juego reducido con contacto controlado y minutos limitados.' },
  { nombre: 'Alta', texto: 'Vuelta completa con el alta médica.' },
] as const;

const ahora = () => {
  const f = new Date();
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
};
const nuevoId = () => `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const esFecha = (x: unknown): x is string => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
const texto = (x: unknown, max: number) => (typeof x === 'string' ? x.slice(0, max) : '');

export const detalleVacio = (): Detalle => ({ tipo: '', grado: '', nota: '', evolucion: [] });

function limpiarDetalle(x: unknown): Detalle {
  const d = (x ?? {}) as Partial<Detalle>;
  return {
    tipo: texto(d.tipo, 120),
    grado: d.grado === 'leve' || d.grado === 'moderada' || d.grado === 'grave' ? d.grado : '',
    nota: texto(d.nota, 600),
    evolucion: Array.isArray(d.evolucion) ? d.evolucion.filter((e) => e && esFecha(e.fecha)).slice(-60).map((e) => ({ fecha: e.fecha, texto: texto(e.texto, 400) })) : [],
  };
}

function limpiarParte(x: unknown): Parte | undefined {
  const p = x as Partial<Parte> | null;
  if (!p || typeof p !== 'object' || typeof p.id !== 'string' || typeof p.jugadoraId !== 'string' || !esFecha(p.desde)) return undefined;
  return {
    id: p.id,
    jugadoraId: p.jugadoraId,
    activo: p.activo !== false,
    estado: p.estado === 'duda' ? 'duda' : 'baja',
    desde: p.desde,
    ...(esFecha(p.vuelta) ? { vuelta: p.vuelta } : {}),
    ...(esFecha(p.alta) ? { alta: p.alta } : {}),
    fase: Number.isInteger(p.fase) ? Math.min(FASES_VUELTA.length - 1, Math.max(0, p.fase!)) : 0,
    sinContacto: p.sinContacto === true,
    ...(Number.isFinite(p.maxMinutos) && p.maxMinutos! > 0 ? { maxMinutos: Math.min(180, Math.round(p.maxMinutos!)) } : {}),
    detalle: esCifrado(p.detalle) ? p.detalle : limpiarDetalle(p.detalle),
  };
}

function leer(): Almacen {
  try {
    const x = JSON.parse(localStorage.getItem(CLAVE_SALUD) ?? 'null') as Partial<Almacen> | null;
    const partes = Array.isArray(x?.partes) ? x!.partes.map(limpiarParte).filter((p): p is Parte => !!p) : [];
    const pin = x?.pin && typeof x.pin.sal === 'string' && esCifrado(x.pin.prueba) ? x.pin : undefined;
    return { v: 1, ...(pin ? { pin } : {}), partes };
  } catch {
    return { v: 1, partes: [] };
  }
}

function escribir(a: Almacen): boolean {
  try {
    localStorage.setItem(CLAVE_SALUD, JSON.stringify(a));
    return true;
  } catch {
    return false;
  }
}

// ---------- Resumen (sin PIN): lo que usan la convocatoria, la rotación y la plantilla ----------

const sinDetalle = ({ detalle: _d, ...r }: Parte): Resumen => r;

export const partesDe = (jugadoraId: string): Resumen[] =>
  leer().partes.filter((p) => p.jugadoraId === jugadoraId).sort((a, b) => b.desde.localeCompare(a.desde)).map(sinDetalle);

export const parteActivo = (jugadoraId: string): Resumen | undefined => partesDe(jugadoraId).find((p) => p.activo);

/** Lesiones en curso por jugadora: solo estado y fecha, nunca el diagnóstico. */
export function lesionesActivas(): Map<string, { desde: string; duda: boolean; sinContacto: boolean; maxMinutos?: number }> {
  const m = new Map<string, { desde: string; duda: boolean; sinContacto: boolean; maxMinutos?: number }>();
  for (const p of leer().partes) if (p.activo) m.set(p.jugadoraId, { desde: p.desde, duda: p.estado === 'duda', sinContacto: p.sinContacto, ...(p.maxMinutos ? { maxMinutos: p.maxMinutos } : {}) });
  return m;
}

/** Días de baja hasta hoy (o hasta el alta). */
export function diasDeBaja(r: Pick<Resumen, 'desde' | 'alta'>, hoy = ahora()): number {
  const t = (f: string) => Date.UTC(+f.slice(0, 4), +f.slice(5, 7) - 1, +f.slice(8, 10));
  return Math.max(0, Math.round((t(r.alta ?? hoy) - t(r.desde)) / 86_400_000));
}

/** Avisos de carga para una sesión de `minutos`: quién tiene restricción de contacto o de minutos. */
export function avisosDeCarga(minutos: number, activas = lesionesActivas()): { jugadoraId: string; texto: string }[] {
  const avisos: { jugadoraId: string; texto: string }[] = [];
  for (const [jugadoraId, l] of activas) {
    if (l.maxMinutos && minutos > l.maxMinutos) avisos.push({ jugadoraId, texto: `Máximo ${l.maxMinutos} min (la sesión dura ${minutos})` });
    else if (l.sinContacto) avisos.push({ jugadoraId, texto: 'Sin contacto' });
  }
  return avisos;
}

// ---------- Sincronización con el diario (el diario nunca guarda lesiones) ----------

export interface JugadoraConEstado {
  id: string;
  lesion?: { desde: string; nota?: string; duda?: boolean };
}

/** Pasa al almacén de salud el estado que trae el diario y borra los partes de jugadoras que ya no existen. */
export function sincronizarEstados(jugadoras: JugadoraConEstado[], { hoy = ahora(), completo = true } = {}): boolean {
  const a = leer();
  const ids = new Set(jugadoras.map((j) => j.id));
  let cambio = false;
  // Con la plantilla entera se limpian los partes de quien ya no existe; con una parte (migración), no.
  let partes = completo ? a.partes.filter((p) => { const sigue = ids.has(p.jugadoraId); if (!sigue) cambio = true; return sigue; }) : a.partes;
  for (const j of jugadoras) {
    const activo = partes.find((p) => p.jugadoraId === j.id && p.activo);
    if (j.lesion && esFecha(j.lesion.desde)) {
      const estado: Estado = j.lesion.duda ? 'duda' : 'baja';
      if (!activo) {
        // Con PIN no se guarda ninguna nota suelta sin cifrar: los detalles se rellenan ya desbloqueado.
        const detalle = j.lesion.nota?.trim() && !a.pin ? { ...detalleVacio(), nota: j.lesion.nota.trim() } : detalleVacio();
        partes = [...partes, { id: nuevoId(), jugadoraId: j.id, activo: true, estado, desde: j.lesion.desde, fase: 0, sinContacto: false, detalle }];
        cambio = true;
      } else if (activo.estado !== estado) {
        partes = partes.map((p) => (p === activo ? { ...p, estado } : p));
        cambio = true;
      }
    } else if (activo) {
      partes = partes.map((p) => (p === activo ? { ...p, activo: false, alta: hoy, fase: FASES_VUELTA.length - 1 } : p));
      cambio = true;
    }
  }
  return cambio ? escribir({ ...a, partes }) : true;
}

/** Para pintar la plantilla: pone `lesion` (solo estado y fecha) a quien tenga un parte en curso. */
export function conEstados<T extends { id: string }>(jugadoras: T[]): (T & { lesion?: { desde: string; nota: string; duda?: boolean } })[] {
  const l = lesionesActivas();
  return jugadoras.map((j) => {
    const x = l.get(j.id);
    return x ? { ...j, lesion: { desde: x.desde, nota: '', ...(x.duda ? { duda: true } : {}) } } : j;
  });
}

// ---------- Detalles médicos (con PIN opcional) ----------

let claveEnMemoria: CryptoKey | null = null;

export const hayPin = (): boolean => !!leer().pin;
export const desbloqueado = (): boolean => !hayPin() || !!claveEnMemoria;
export function bloquear(): void {
  claveEnMemoria = null;
}

export async function desbloquear(pin: string): Promise<boolean> {
  const a = leer();
  if (!a.pin) return true;
  const k = await derivar(pin, a.pin.sal);
  if ((await descifrar<string>(a.pin.prueba, k)) !== 'horns') return false;
  claveEnMemoria = k;
  return true;
}

/** Crea el PIN (o lo cambia, con la sesión ya desbloqueada) y cifra todos los detalles. */
export async function ponerPin(pin: string): Promise<boolean> {
  if (!/^\d{4,8}$/.test(pin)) return false;
  const a = leer();
  if (a.pin && !claveEnMemoria) return false;
  const detalles = new Map<string, Detalle>();
  for (const p of a.partes) {
    const d = esCifrado(p.detalle) ? await descifrar<Detalle>(p.detalle, claveEnMemoria!) : p.detalle;
    if (!d) return false;
    detalles.set(p.id, limpiarDetalle(d));
  }
  const sal = nuevaSal();
  const k = await derivar(pin, sal);
  const partes: Parte[] = [];
  for (const p of a.partes) partes.push({ ...p, detalle: await cifrar(detalles.get(p.id), k) });
  if (!escribir({ v: 1, pin: { sal, prueba: await cifrar('horns', k) }, partes })) return false;
  claveEnMemoria = k;
  return true;
}

/** Quita el PIN: con la sesión desbloqueada, los detalles vuelven a guardarse sin cifrar. */
export async function quitarPin(): Promise<boolean> {
  const a = leer();
  if (!a.pin) return true;
  if (!claveEnMemoria) return false;
  const partes: Parte[] = [];
  for (const p of a.partes) {
    const d = esCifrado(p.detalle) ? await descifrar<Detalle>(p.detalle, claveEnMemoria) : p.detalle;
    if (!d) return false;
    partes.push({ ...p, detalle: limpiarDetalle(d) });
  }
  if (!escribir({ v: 1, partes })) return false;
  claveEnMemoria = null;
  return true;
}

/** Los detalles de un parte, o 'bloqueado' si hay PIN y no se ha puesto. */
export async function abrirDetalle(parteId: string): Promise<Detalle | 'bloqueado' | undefined> {
  const p = leer().partes.find((x) => x.id === parteId);
  if (!p) return undefined;
  if (!esCifrado(p.detalle)) return limpiarDetalle(p.detalle);
  if (!claveEnMemoria) return 'bloqueado';
  const d = await descifrar<Detalle>(p.detalle, claveEnMemoria);
  return d ? limpiarDetalle(d) : 'bloqueado';
}

/** Guarda cambios del resumen y/o de los detalles de un parte. Falso si hay PIN sin desbloquear o el móvil no deja. */
export async function guardarParte(parteId: string, resumen: Partial<Omit<Resumen, 'id' | 'jugadoraId'>>, detalle?: Detalle): Promise<boolean> {
  const a = leer();
  const p = a.partes.find((x) => x.id === parteId);
  if (!p) return false;
  let nuevoDetalle: Detalle | Cifrado = p.detalle;
  if (detalle) {
    if (a.pin) {
      if (!claveEnMemoria) return false;
      nuevoDetalle = await cifrar(limpiarDetalle(detalle), claveEnMemoria);
    } else nuevoDetalle = limpiarDetalle(detalle);
  }
  const nuevo = limpiarParte({ ...p, ...resumen, detalle: nuevoDetalle });
  if (!nuevo) return false;
  return escribir({ ...a, partes: a.partes.map((x) => (x.id === parteId ? nuevo : x)) });
}

/** Borra todo el historial de salud de una jugadora. */
export function borrarSaludDe(jugadoraId: string): boolean {
  const a = leer();
  return escribir({ ...a, partes: a.partes.filter((p) => p.jugadoraId !== jugadoraId) });
}
