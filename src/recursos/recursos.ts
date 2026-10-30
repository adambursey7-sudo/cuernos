// Recursos de internet (bandeja, opción A elegida por Adam el 30/10): enlaces, vídeos y notas que se guardan para revisar.
// Todo vive solo en este móvil. Los enlaces se validan (solo http/https) y nunca se ejecuta nada de lo pegado.
const CLAVE = 'horns.recursos';

export const ESTADOS = [
  { id: 'nuevo', nombre: 'Sin revisar' },
  { id: 'revisado', nombre: 'Revisados' },
  { id: 'convertido', nombre: 'Convertidos' },
] as const;
export type Estado = (typeof ESTADOS)[number]['id'];

export type Origen = 'youtube' | 'instagram' | 'tiktok' | 'web' | 'nota';
export const NOMBRE_ORIGEN: Record<Origen, string> = { youtube: 'YouTube', instagram: 'Instagram', tiktok: 'TikTok', web: 'Web', nota: 'Nota' };

export interface Recurso {
  id: string;
  /** Vacío si es una nota. Siempre http o https. */
  enlace: string;
  titulo: string;
  origen: Origen;
  /** Descripción o notas del entrenador. */
  nota: string;
  etiquetas: string[];
  estado: Estado;
  /** AAAA-MM-DD */
  fecha: string;
  /** Solo YouTube: miniatura oficial. */
  miniatura?: string;
}

const MAX_TEXTO = 5000;

/** Devuelve la URL limpia si es http o https; si no, undefined (javascript:, data:, file:… no valen). */
export function enlaceValido(texto: string): string | undefined {
  const t = texto.trim();
  if (!t || /\s/.test(t) || t.length > 2000) return undefined;
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(t) || /^(javascript|data|file|mailto|tel):/i.test(t) ? t : `https://${t}`);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return undefined;
    if (!u.hostname.includes('.')) return undefined;
    return u.href;
  } catch {
    return undefined;
  }
}

/** Saca el primer enlace de un texto pegado (lo que comparte el móvil suele traer una frase y el enlace). */
export function primerEnlace(texto: string): string | undefined {
  for (const trozo of texto.split(/\s+/)) {
    const e = /^https?:\/\//i.test(trozo) ? enlaceValido(trozo) : undefined;
    if (e) return e;
  }
  return enlaceValido(texto);
}

export function origenDe(enlace: string): Origen {
  let host: string;
  try {
    host = new URL(enlace).hostname.replace(/^(www|m)\./, '');
  } catch {
    return 'nota';
  }
  if (host === 'youtu.be' || host === 'youtube.com' || host.endsWith('.youtube.com')) return 'youtube';
  if (host === 'instagram.com' || host.endsWith('.instagram.com')) return 'instagram';
  if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) return 'tiktok';
  return 'web';
}

/** Id del vídeo de YouTube (solo letras, números, guion y guion bajo: se usa para la miniatura). */
export function idYoutube(enlace: string): string | undefined {
  try {
    const u = new URL(enlace);
    const host = u.hostname.replace(/^(www|m)\./, '');
    let id: string | null = null;
    if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
    else if (host === 'youtube.com') id = u.searchParams.get('v') ?? /^\/(?:shorts|embed|live)\/([^/]+)/.exec(u.pathname)?.[1] ?? null;
    return id && /^[\w-]{11}$/.test(id) ? id : undefined;
  } catch {
    return undefined;
  }
}

export const miniaturaYoutube = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;

const nuevoId = () => `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const hoy = () => new Date().toISOString().slice(0, 10);

export function nuevoRecurso(datos: { enlace?: string; titulo?: string; nota?: string }): Recurso {
  const enlace = datos.enlace ? (enlaceValido(datos.enlace) ?? '') : '';
  const origen = enlace ? origenDe(enlace) : 'nota';
  const yt = origen === 'youtube' ? idYoutube(enlace) : undefined;
  return {
    id: nuevoId(),
    enlace,
    titulo: (datos.titulo ?? '').trim().slice(0, 200),
    origen,
    nota: (datos.nota ?? '').slice(0, MAX_TEXTO),
    etiquetas: [],
    estado: 'nuevo',
    fecha: hoy(),
    miniatura: yt ? miniaturaYoutube(yt) : undefined,
  };
}

/** Título de un vídeo de YouTube con su servicio oficial (oEmbed). Si falla, undefined: el entrenador lo escribe. */
export async function tituloYoutube(enlace: string): Promise<string | undefined> {
  if (!idYoutube(enlace)) return undefined;
  try {
    const r = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(enlace)}`);
    if (!r.ok) return undefined;
    const t = (await r.json())?.title;
    return typeof t === 'string' ? t.slice(0, 200) : undefined;
  } catch {
    return undefined;
  }
}

export const nombreRecurso = (r: Recurso) => r.titulo || (r.enlace ? new URL(r.enlace).hostname.replace(/^www\./, '') : 'Nota sin título');

const ESTADOS_ID: string[] = ESTADOS.map((e) => e.id);

/** Deja solo los recursos con forma correcta; un enlace malo se descarta, no se arregla. */
export function limpiarRecursos(datos: unknown): Recurso[] {
  if (!Array.isArray(datos)) return [];
  const vistos = new Set<string>();
  const sal: Recurso[] = [];
  const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');
  for (const x of datos as Partial<Recurso>[]) {
    if (!x || typeof x.id !== 'string' || vistos.has(x.id)) continue;
    const enlace = typeof x.enlace === 'string' && x.enlace ? enlaceValido(x.enlace) : '';
    if (enlace === undefined) continue;
    if (!enlace && !texto(x.titulo, 200) && !texto(x.nota, MAX_TEXTO)) continue;
    const origen = enlace ? origenDe(enlace) : 'nota';
    const yt = origen === 'youtube' ? idYoutube(enlace) : undefined;
    vistos.add(x.id);
    sal.push({
      id: x.id.slice(0, 40),
      enlace,
      titulo: texto(x.titulo, 200),
      origen,
      nota: texto(x.nota, MAX_TEXTO),
      etiquetas: Array.isArray(x.etiquetas) ? x.etiquetas.filter((e): e is string => typeof e === 'string').map((e) => e.trim().slice(0, 30)).filter(Boolean).slice(0, 20) : [],
      estado: ESTADOS_ID.includes(x.estado as string) ? (x.estado as Estado) : 'nuevo',
      fecha: /^\d{4}-\d{2}-\d{2}$/.test(String(x.fecha)) ? String(x.fecha) : hoy(),
      miniatura: yt ? miniaturaYoutube(yt) : undefined,
    });
  }
  return sal;
}

export function leerRecursos(): Recurso[] {
  try {
    return limpiarRecursos(JSON.parse(localStorage.getItem(CLAVE) ?? '[]'));
  } catch {
    return [];
  }
}

/** Guarda todos los recursos; devuelve false si el móvil no deja guardar. */
export function guardarRecursos(lista: Recurso[]): boolean {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(limpiarRecursos(lista)));
    return true;
  } catch {
    return false;
  }
}

/** Junta los recursos de una copia con los que ya hay: si coinciden, gana la copia. */
export function juntarRecursos(actuales: Recurso[], deLaCopia: Recurso[]): Recurso[] {
  const ids = new Set(deLaCopia.map((r) => r.id));
  return [...actuales.filter((r) => !ids.has(r.id)), ...deLaCopia];
}
