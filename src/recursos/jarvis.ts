// Conexión con Jarvis (el asistente del PC de Adam) para «Pedir a Claude». Horns no tiene servidor: habla con Jarvis
// por Tailscale, con una clave propia que solo abre /api/horns/* (no el resto de Jarvis).
// La clave se guarda solo en este móvil y NO entra en la copia de seguridad.
const CLAVE = 'horns.jarvis';

export interface Conexion {
  /** Origen de Jarvis, sin barra final: https://nombre.tailnet.ts.net */
  url: string;
  token: string;
}

export class ErrorJarvis extends Error {
  constructor(mensaje: string, readonly reemparejar = false) {
    super(mensaje);
  }
}

/** Solo el nombre de Tailscale (https://….ts.net) o este mismo PC; devuelve el origen limpio. */
export function direccionValida(entrada: string): string | undefined {
  let t = entrada.trim();
  if (!t) return undefined;
  if (!/^[a-z]+:\/\//i.test(t)) t = `https://${t}`;
  try {
    const u = new URL(t);
    const local = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
    if (u.username || u.password) return undefined;
    if (u.protocol === 'https:' && u.hostname.endsWith('.ts.net')) return u.origin;
    if (u.protocol === 'http:' && local) return u.origin;
  } catch {
    /* mal escrita */
  }
  return undefined;
}

export function leerConexion(): Conexion | undefined {
  try {
    const x = JSON.parse(localStorage.getItem(CLAVE) ?? 'null') as Partial<Conexion> | null;
    const url = x && typeof x.url === 'string' ? direccionValida(x.url) : undefined;
    return url && typeof x?.token === 'string' && x.token ? { url, token: x.token } : undefined;
  } catch {
    return undefined;
  }
}

export function guardarConexion(c: Conexion): boolean {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(c));
    return true;
  } catch {
    return false;
  }
}

export function olvidarConexion(): void {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    /* nada que borrar */
  }
}

const SIN_JARVIS = 'No llego a Jarvis. ¿Está el PC encendido, con Jarvis abierto y Tailscale conectado en el móvil?';

async function llamar(c: { url: string; token?: string }, ruta: string, cuerpo?: unknown, ms = 15000): Promise<Record<string, unknown>> {
  const ctl = new AbortController();
  const corte = setTimeout(() => ctl.abort(), ms);
  let r: Response;
  try {
    r = await fetch(c.url + ruta, {
      method: cuerpo === undefined ? 'GET' : 'POST',
      headers: { ...(c.token ? { Authorization: `Bearer ${c.token}` } : {}), ...(cuerpo === undefined ? {} : { 'Content-Type': 'application/json' }) },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal: ctl.signal,
      referrerPolicy: 'no-referrer',
      credentials: 'omit',
    });
  } catch {
    throw new ErrorJarvis(SIN_JARVIS);
  } finally {
    clearTimeout(corte);
  }
  let datos: Record<string, unknown> = {};
  try {
    datos = (await r.json()) as Record<string, unknown>;
  } catch {
    /* sin cuerpo */
  }
  if (r.status === 401) throw new ErrorJarvis('Jarvis ya no reconoce este móvil: vuelve a conectar con un código nuevo.', true);
  if (!r.ok) throw new ErrorJarvis(typeof datos.error === 'string' && datos.error ? datos.error : 'Jarvis no pudo con esto.');
  return datos;
}

/** Cambia el código de 6 cifras (que Jarvis enseña en el PC) por la clave de Horns y la guarda. */
export async function emparejar(direccion: string, codigo: string): Promise<Conexion> {
  const url = direccionValida(direccion);
  if (!url) throw new ErrorJarvis('Esa dirección no vale. Es la de Jarvis en Tailscale: empieza por https:// y acaba en .ts.net');
  const cod = codigo.replace(/\s/g, '');
  if (!/^\d{6}$/.test(cod)) throw new ErrorJarvis('El código son 6 cifras.');
  const d = await llamar({ url }, '/api/horns/pair', { code: cod });
  if (typeof d.token !== 'string' || !d.token) throw new ErrorJarvis('Jarvis no contestó como se esperaba.');
  const c = { url, token: d.token };
  if (!guardarConexion(c)) throw new ErrorJarvis('El móvil no deja guardar la conexión: libera espacio e inténtalo otra vez.');
  return c;
}

/** Manda el texto a Claude (vía Jarvis). Devuelve el número de la petición. */
export async function enviar(c: Conexion, prompt: string): Promise<string> {
  const d = await llamar(c, '/api/horns/ask', { prompt });
  if (typeof d.id !== 'string' || !d.id) throw new ErrorJarvis('Jarvis no contestó como se esperaba.');
  return d.id;
}

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Espera la respuesta (mira cada pocos segundos, hasta 6 minutos). `parar()` true corta la espera. */
export async function esperar(c: Conexion, id: string, parar: () => boolean = () => false, cada = 2500, tope = 6 * 60_000): Promise<string> {
  const fin = Date.now() + tope;
  let fallos = 0;
  while (Date.now() < fin) {
    if (parar()) throw new ErrorJarvis('Cancelado.');
    try {
      const d = await llamar(c, `/api/horns/result?id=${encodeURIComponent(id)}`);
      fallos = 0;
      if (d.status === 'lista' && typeof d.a === 'string') return d.a;
      if (d.status === 'error') throw new ErrorJarvis(typeof d.error === 'string' && d.error ? d.error : 'Claude no pudo contestar.');
    } catch (e) {
      // un corte de cobertura no tira la espera: se reintenta unas veces
      if (!(e instanceof ErrorJarvis) || e.reemparejar || e.message !== SIN_JARVIS || ++fallos >= 5) throw e;
    }
    await dormir(cada);
  }
  throw new ErrorJarvis('Claude tarda demasiado. Inténtalo de nuevo en un rato.');
}
