// Conexiones opcionales (loop Herramienta diaria, tramo 5). Las claves se guardan SOLO en este móvil, en su propia clave,
// y nunca entran en la copia de seguridad. Nada se envía a ningún servicio sin que el entrenador lo pida y vea el texto.
export const CLAVE_CONEXIONES = 'horns.conexiones';

export type Proveedor = 'jarvis' | 'gemini';

export interface Conexiones {
  /** Quién contesta cuando se pide algo a la IA. Sin elegir, el primero que esté configurado. */
  proveedor?: Proveedor;
  gemini?: { clave: string; modelo: string };
}

export const MODELO_GEMINI = 'gemini-flash-latest';

/** Las claves de Gemini son una sola palabra de letras, cifras, guiones y subrayados. */
export const claveValida = (c: string) => /^[A-Za-z0-9_-]{20,200}$/.test(c.trim());
const modeloValido = (m: string) => /^[a-z0-9][a-z0-9.-]{2,60}$/i.test(m.trim());

export function leerConexiones(): Conexiones {
  try {
    const x = JSON.parse(localStorage.getItem(CLAVE_CONEXIONES) ?? 'null') as Partial<Conexiones> | null;
    const g = x?.gemini;
    const gemini = g && typeof g.clave === 'string' && claveValida(g.clave) ? { clave: g.clave.trim(), modelo: typeof g.modelo === 'string' && modeloValido(g.modelo) ? g.modelo.trim() : MODELO_GEMINI } : undefined;
    return { ...(x?.proveedor === 'jarvis' || x?.proveedor === 'gemini' ? { proveedor: x.proveedor } : {}), ...(gemini ? { gemini } : {}) };
  } catch {
    return {};
  }
}

/** Falso si el móvil no deja guardar. Una clave mal escrita no se guarda. */
export function guardarConexiones(c: Conexiones): boolean {
  const limpia: Conexiones = {
    ...(c.proveedor ? { proveedor: c.proveedor } : {}),
    ...(c.gemini && claveValida(c.gemini.clave) ? { gemini: { clave: c.gemini.clave.trim(), modelo: modeloValido(c.gemini.modelo) ? c.gemini.modelo.trim() : MODELO_GEMINI } } : {}),
  };
  try {
    if (!limpia.proveedor && !limpia.gemini) localStorage.removeItem(CLAVE_CONEXIONES);
    else localStorage.setItem(CLAVE_CONEXIONES, JSON.stringify(limpia));
    return true;
  } catch {
    return false;
  }
}

/** «AIza…x3Qk» para enseñar que hay una clave sin enseñarla entera. */
export const enmascarar = (clave: string) => (clave.length <= 10 ? '••••' : `${clave.slice(0, 4)}…${clave.slice(-4)}`);
