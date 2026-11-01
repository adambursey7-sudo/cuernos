// Viajes y logística (loop Herramienta diaria, tramo 4): lo que hace falta para un partido fuera. Vive dentro del partido
// (Evento.viaje), así que viaja con la temporada y con la copia. Convocados por dorsal; en lo que va a las familias no hay
// gastos ni nombres. Sin dependencias: no importa la temporada para no hacer ciclos.
export interface Material {
  id: string;
  texto: string;
  llevado: boolean;
}

export interface Gasto {
  id: string;
  concepto: string;
  euros: number;
}

export interface Viaje {
  transporte: string;
  /** Dónde se queda y a qué hora (texto libre). */
  encuentro: string;
  /** Hora de vuelta HH:MM. */
  vuelta?: string;
  alojamiento: string;
  comidas: string;
  material: Material[];
  gastos: Gasto[];
  notas: string;
}

export const MATERIAL_HABITUAL = ['Equipaciones', 'Botiquín', 'Balones', 'Agua', 'Pizarra y rotuladores', 'Licencias y acta'];

let n = 0;
const nuevoId = (p: string) => `${p}${Date.now().toString(36)}${(n++).toString(36)}`;
const texto = (x: unknown, max: number) => (typeof x === 'string' ? x.slice(0, max) : '');
const esHora = (x: unknown): x is string => typeof x === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(x);

export const nuevoViaje = (): Viaje => ({ transporte: '', encuentro: '', alojamiento: '', comidas: '', material: MATERIAL_HABITUAL.map((t) => ({ id: nuevoId('m'), texto: t, llevado: false })), gastos: [], notas: '' });
export const nuevoGasto = (): Gasto => ({ id: nuevoId('g'), concepto: '', euros: 0 });
export const nuevoMaterial = (t = ''): Material => ({ id: nuevoId('m'), texto: t, llevado: false });

const vacio = (v: Viaje) => !v.transporte.trim() && !v.encuentro.trim() && !v.vuelta && !v.alojamiento.trim() && !v.comidas.trim() && !v.notas.trim() && v.gastos.length === 0 && v.material.every((m) => !m.llevado) && v.material.length === MATERIAL_HABITUAL.length && v.material.every((m, i) => m.texto === MATERIAL_HABITUAL[i]);

/** Deja solo un viaje válido; un viaje sin nada rellenado no se guarda. */
export function limpiarViaje(x: unknown): Viaje | undefined {
  const v = x as Partial<Viaje> | null;
  if (!v || typeof v !== 'object') return undefined;
  const material = Array.isArray(v.material)
    ? v.material.filter((m): m is Material => !!m && typeof m.id === 'string' && typeof m.texto === 'string' && m.texto.trim() !== '').slice(0, 40).map((m) => ({ id: m.id, texto: texto(m.texto, 60), llevado: m.llevado === true }))
    : [];
  const gastos = Array.isArray(v.gastos)
    ? v.gastos.filter((g): g is Gasto => !!g && typeof g.id === 'string' && Number.isFinite(g.euros) && g.euros >= 0).slice(0, 40).map((g) => ({ id: g.id, concepto: texto(g.concepto, 60), euros: Math.round(Math.min(100000, g.euros) * 100) / 100 }))
    : [];
  const limpio: Viaje = {
    transporte: texto(v.transporte, 80), encuentro: texto(v.encuentro, 120), ...(esHora(v.vuelta) ? { vuelta: v.vuelta } : {}),
    alojamiento: texto(v.alojamiento, 120), comidas: texto(v.comidas, 160), material, gastos, notas: texto(v.notas, 400),
  };
  return vacio(limpio) ? undefined : limpio;
}

export const totalGastos = (v: Pick<Viaje, 'gastos'> | undefined) => Math.round((v?.gastos ?? []).reduce((s, g) => s + g.euros, 0) * 100) / 100;

/** Lo que toca poner por persona si se reparte entre los viajeros (0 viajeros: no se reparte). */
export const gastoPorPersona = (v: Pick<Viaje, 'gastos'> | undefined, viajeros: number) => (viajeros > 0 ? Math.round((totalGastos(v) / viajeros) * 100) / 100 : 0);

export const materialPendiente = (v: Pick<Viaje, 'material'> | undefined) => (v?.material ?? []).filter((m) => !m.llevado).map((m) => m.texto);

export const euros = (n: number) => `${n.toFixed(2).replace('.', ',')} €`;

/** Mensaje para el grupo de familias: salida, punto de encuentro, transporte, comidas y convocados por dorsal. Sin gastos ni material. */
export function mensajeViaje(p: { equipo: string; rival: string; fecha: string; hora: string; lugar: string; salida?: string; convocados: string[] }, v: Viaje | undefined): string {
  const dorsales = [...p.convocados].sort((a, b) => Number(a) - Number(b) || a.localeCompare(b));
  return [
    `${p.equipo} · viaje a ${p.lugar || p.rival || 'el partido'}`,
    `Partido contra ${p.rival || 'el rival'}: ${p.fecha} a las ${p.hora}`,
    p.salida ? `Salida: ${p.salida}${v?.encuentro ? ` en ${v.encuentro}` : ''}` : v?.encuentro ? `Punto de encuentro: ${v.encuentro}` : '',
    v?.transporte ? `Transporte: ${v.transporte}` : '',
    v?.vuelta ? `Vuelta prevista: ${v.vuelta}` : '',
    v?.alojamiento ? `Alojamiento: ${v.alojamiento}` : '',
    v?.comidas ? `Comidas: ${v.comidas}` : '',
    dorsales.length ? `Viajan: ${dorsales.map((d) => `#${d}`).join(', ')}` : '',
    v?.notas ? v.notas : '',
  ].filter(Boolean).join('\n');
}
