// Una sola puerta para pedir texto a una IA: Jarvis (el PC de Adam) o Gemini (clave propia). El texto que llega aquí YA
// debe ir sin nombres (la pantalla lo enseña antes de enviar). Sin conexión o sin configurar, falla con un mensaje claro.
import { enviar, esperar, ErrorJarvis, leerConexion } from '../recursos/jarvis';
import { leerConexiones, type Conexiones, type Proveedor } from './ajustes';

export class ErrorIA extends Error {}

/** Quién contestaría ahora mismo, o undefined si no hay nada configurado. */
export function proveedorActivo(c: Conexiones = leerConexiones(), jarvis = !!leerConexion()): Proveedor | undefined {
  if (c.proveedor === 'gemini' && c.gemini) return 'gemini';
  if (c.proveedor === 'jarvis' && jarvis) return 'jarvis';
  if (jarvis) return 'jarvis';
  if (c.gemini) return 'gemini';
  return undefined;
}

const SIN_RED = 'No hay conexión. Esto necesita internet; lo demás de la app sigue funcionando.';

/** Extrae el texto de la respuesta de Gemini (partes de la primera candidata). */
export function textoDeGemini(r: unknown): string {
  const partes = (r as { candidates?: { content?: { parts?: { text?: unknown }[] } }[] })?.candidates?.[0]?.content?.parts;
  return Array.isArray(partes) ? partes.map((p) => (typeof p?.text === 'string' ? p.text : '')).join('').trim() : '';
}

export async function preguntarGemini(clave: string, modelo: string, prompt: string, ms = 45_000): Promise<string> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new ErrorIA(SIN_RED);
  const ctl = new AbortController();
  const corte = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': clave },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      signal: ctl.signal,
      referrerPolicy: 'no-referrer',
      credentials: 'omit',
    });
    if (r.status === 400 || r.status === 403) throw new ErrorIA('Gemini no acepta esa clave. Revísala en Conexiones.');
    if (r.status === 429) throw new ErrorIA('Gemini dice que ya has gastado el cupo. Prueba más tarde.');
    if (!r.ok) throw new ErrorIA('Gemini no pudo contestar. Inténtalo otra vez.');
    const texto = textoDeGemini(await r.json());
    if (!texto) throw new ErrorIA('Gemini no ha devuelto nada.');
    return texto;
  } catch (e) {
    if (e instanceof ErrorIA) throw e;
    throw new ErrorIA(SIN_RED);
  } finally {
    clearTimeout(corte);
  }
}

/** Pide texto a la IA elegida. `parar()` devuelve true para cortar la espera (solo Jarvis). */
export async function preguntar(prompt: string, parar: () => boolean = () => false): Promise<string> {
  const quien = proveedorActivo();
  if (!quien) throw new ErrorIA('Aún no hay ninguna IA conectada. Conecta Jarvis o pon una clave de Gemini en Más → Conexiones.');
  if (quien === 'gemini') {
    const g = leerConexiones().gemini!;
    return preguntarGemini(g.clave, g.modelo, prompt);
  }
  const c = leerConexion()!;
  try {
    return await esperar(c, await enviar(c, prompt), parar);
  } catch (e) {
    throw e instanceof ErrorJarvis ? new ErrorIA(e.message) : e;
  }
}
