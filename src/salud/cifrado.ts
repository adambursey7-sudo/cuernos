// Cifrado del parte de salud con el PIN del entrenador (loop Herramienta diaria, tramo 3).
// PBKDF2 (SHA-256) → AES-GCM, todo con la Web Crypto del propio móvil. El PIN no se guarda: solo una prueba cifrada.
export interface Cifrado {
  /** Vector de inicialización, en base64. */
  iv: string;
  /** Texto cifrado, en base64. */
  d: string;
}

const VUELTAS = 150_000;
const aB64 = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...(b instanceof Uint8Array ? b : new Uint8Array(b))));
const deB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export const nuevaSal = () => aB64(crypto.getRandomValues(new Uint8Array(16)));

export async function derivar(pin: string, sal: string): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: deB64(sal), iterations: VUELTAS, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function cifrar(valor: unknown, clave: CryptoKey): Promise<Cifrado> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const d = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, clave, new TextEncoder().encode(JSON.stringify(valor)));
  return { iv: aB64(iv), d: aB64(d) };
}

/** Devuelve el valor, o undefined si la clave no es la buena o el dato está estropeado. */
export async function descifrar<T>(c: Cifrado, clave: CryptoKey): Promise<T | undefined> {
  try {
    const d = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: deB64(c.iv) }, clave, deB64(c.d));
    return JSON.parse(new TextDecoder().decode(d)) as T;
  } catch {
    return undefined;
  }
}

export const esCifrado = (x: unknown): x is Cifrado => !!x && typeof x === 'object' && typeof (x as Cifrado).iv === 'string' && typeof (x as Cifrado).d === 'string';
