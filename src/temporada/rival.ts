// Informe del rival (vuelta 7, A+B elegida por Adam): etiquetas de cómo juega + dos cajas de texto.
// Solo en este móvil y dentro de la copia. A quien vigilar, por dorsal: nada de nombres de menores.

export interface InformeRival {
  /** Ids de RASGOS_RIVAL que se cumplen. */
  rasgos: string[];
  /** A quién vigilar (dorsal y por qué). */
  vigilar: string;
  /** Qué haremos nosotras. */
  haremos: string;
}

/** Cada rasgo del rival lleva las habilidades (ids de CATALOGO) que conviene entrenar contra él. */
export const RASGOS_RIVAL: { id: string; nombre: string; entrenar: string[] }[] = [
  { id: 'zona', nombre: 'Defensa en zona', entrenar: ['tiro', 'pase'] },
  { id: 'hombre', nombre: 'Hombre a hombre', entrenar: ['uno', 'bloqueos'] },
  { id: 'presion', nombre: 'Presión en toda la pista', entrenar: ['pase', 'fundamentos'] },
  { id: 'rapido', nombre: 'Ritmo rápido', entrenar: ['transicion'] },
  { id: 'lento', nombre: 'Ritmo lento', entrenar: ['presion'] },
  { id: 'rebote', nombre: 'Fuertes en rebote', entrenar: ['reb-def'] },
  { id: 'triple', nombre: 'Tiran de lejos', entrenar: ['ayudas'] },
  { id: 'dentro', nombre: 'Fuertes dentro', entrenar: ['ayudas', 'reb-def'] },
];

export const informeVacio = (): InformeRival => ({ rasgos: [], vigilar: '', haremos: '' });

/** Un informe sin nada escrito ni marcado no se guarda. */
export const informeVacioDe = (r: InformeRival | undefined) => !r || (r.rasgos.length === 0 && !r.vigilar.trim() && !r.haremos.trim());

export function limpiarInforme(x: unknown): InformeRival | undefined {
  const r = x as InformeRival | null | undefined;
  if (!r || typeof r !== 'object') return undefined;
  const validos = new Set(RASGOS_RIVAL.map((s) => s.id));
  const rasgos = Array.isArray(r.rasgos) ? [...new Set(r.rasgos.filter((s): s is string => typeof s === 'string' && validos.has(s)))] : [];
  const texto = (t: unknown) => (typeof t === 'string' ? t : '');
  const limpio = { rasgos, vigilar: texto(r.vigilar), haremos: texto(r.haremos) };
  return informeVacioDe(limpio) ? undefined : limpio;
}

/** Habilidades que conviene trabajar contra estos rasgos, sin repetir y por orden de aparición. */
export const habilidadesContra = (rasgos: string[]): string[] => [
  ...new Set(rasgos.flatMap((id) => RASGOS_RIVAL.find((s) => s.id === id)?.entrenar ?? [])),
];

const mismoRival = (a: string, b: string) => a.trim().length > 0 && a.trim().toLowerCase() === b.trim().toLowerCase();

/** El último informe hecho contra el mismo rival en otro partido (para reutilizarlo en la vuelta). */
export function informeAnterior<E extends { id: string; fecha: string; tipo: string; titulo: string; rival?: InformeRival }>(
  eventos: E[],
  actual: E,
): InformeRival | undefined {
  return eventos
    .filter((e) => e.id !== actual.id && e.tipo === 'partido' && mismoRival(e.titulo, actual.titulo) && !informeVacioDe(e.rival))
    .sort((a, b) => b.fecha.localeCompare(a.fecha))[0]?.rival;
}
