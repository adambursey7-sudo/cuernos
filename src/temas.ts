// Colores de la app (estilo Marcador). Un tema son solo cuatro colores que el entrenador puede cambiar;
// el resto (textos, líneas de la pista, zona) se saca de ellos para que siempre se lean.
export interface Colores {
  principal: string;
  fondo: string;
  pista: string;
  jugadores: string;
}

export interface Paleta extends Colores {
  id: string;
  nombre: string;
}

export const PALETAS: Paleta[] = [
  { id: 'parque', nombre: 'Parqué', principal: '#f26b1d', fondo: '#1e2a44', pista: '#d9a066', jugadores: '#1e2a44' },
  { id: 'noche', nombre: 'Noche de partido', principal: '#ffb020', fondo: '#0f1b2d', pista: '#1a2a42', jugadores: '#ffb020' },
  { id: 'tiza', nombre: 'Pizarra verde', principal: '#f2d35b', fondo: '#1d2b25', pista: '#24463a', jugadores: '#f2f1e8' },
  { id: 'club', nombre: 'Rosa y verde', principal: '#e5508a', fondo: '#22252b', pista: '#1f8a5b', jugadores: '#e5508a' },
];

export const NOMBRES_COLOR: Record<keyof Colores, string> = {
  principal: 'Color principal',
  fondo: 'Fondo',
  pista: 'Pista',
  jugadores: 'Jugadores',
};

/** Luminancia relativa (WCAG) de un color #rrggbb. */
export function luz(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/** Texto que se lee encima de un color: casi blanco o casi negro, el que más contraste dé. */
export function textoSobre(hex: string): string {
  const l = luz(hex);
  const claro = (luz('#fff8ee') + 0.05) / (l + 0.05);
  const oscuro = (l + 0.05) / (luz('#141a26') + 0.05);
  return claro >= oscuro ? '#fff8ee' : '#141a26';
}

/** Contraste WCAG entre dos colores #rrggbb (de 1 a 21). */
export function contraste(a: string, b: string): number {
  const [x, y] = [luz(a), luz(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const mezcla = (a: string, b: string, t: number): string => {
  const n = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [p, q] = [n(a), n(b)];
  return '#' + p.map((v, i) => Math.round(v + (q[i] - v) * t).toString(16).padStart(2, '0')).join('');
};

/** Aspecto de la app: oscuro (el de siempre), claro, o el que tenga el móvil. */
export type Aspecto = 'oscuro' | 'claro' | 'auto';
export const ASPECTOS: [Aspecto, string][] = [['oscuro', 'Oscuro'], ['claro', 'Claro'], ['auto', 'Como el móvil']];
const CLAVE_ASPECTO = 'horns.aspecto';
export const FONDO_CLARO = '#f4f2ec';

export function leerAspecto(): Aspecto {
  try {
    const v = localStorage.getItem(CLAVE_ASPECTO);
    return v === 'claro' || v === 'auto' ? v : 'oscuro';
  } catch {
    return 'oscuro';
  }
}

export function guardarAspecto(a: Aspecto) {
  try {
    localStorage.setItem(CLAVE_ASPECTO, a);
  } catch {
    /* sin almacenamiento: el aspecto dura hasta cerrar */
  }
}

export const esClaro = (a: Aspecto): boolean =>
  a === 'claro' || (a === 'auto' && typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: light)').matches);

/** Los mismos colores del equipo sobre fondo claro: el principal se oscurece lo justo para que el texto se lea (4,5 de contraste). */
export function paraClaro(c: Colores): Colores {
  let principal = c.principal;
  for (let i = 0; i < 12 && contraste(principal, FONDO_CLARO) < 4.5; i++) principal = mezcla(principal, '#000000', 0.12);
  return { ...c, fondo: FONDO_CLARO, principal };
}

const CLAVE = 'cuernos.colores';

export function leerColores(): Colores {
  // Se parte de Parqué y solo se aceptan los colores guardados que sean #rrggbb válidos.
  const c: Colores = { principal: PALETAS[0].principal, fondo: PALETAS[0].fondo, pista: PALETAS[0].pista, jugadores: PALETAS[0].jugadores };
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE) ?? '');
    for (const k of Object.keys(c) as (keyof Colores)[])
      if (typeof guardado?.[k] === 'string' && /^#[0-9a-f]{6}$/i.test(guardado[k])) c[k] = guardado[k];
  } catch {
    /* sin guardar o ilegible: Parqué */
  }
  return c;
}

/** `guardar = false` en el visor de un enlace: los colores del que envía no pisan los de quien lo abre. */
export function aplicarColores(guardado: Colores, guardar = true) {
  const claro = esClaro(leerAspecto());
  const c = claro ? paraClaro(guardado) : guardado;
  const el = document.documentElement;
  el.dataset.modo = claro ? 'claro' : 'oscuro';
  el.style.colorScheme = claro ? 'light' : 'dark';
  const raiz = el.style;
  const texto = textoSobre(c.fondo);
  // Colores de estado y sombras según el aspecto: los verdes y rojos claros solo se leen sobre fondo oscuro.
  raiz.setProperty('--principal-vivo', guardado.principal);   // el del equipo sin oscurecer: para las superficies que son siempre oscuras (tele)
  raiz.setProperty('--ok', claro ? '#1f8f45' : '#4cc26a');
  raiz.setProperty('--ok-texto', claro ? '#14663a' : '#9fe3b0');
  raiz.setProperty('--mal-texto', claro ? '#a3281e' : '#ffb3ab');
  raiz.setProperty('--aviso', claro ? '#9a5b00' : '#ffb020');
  raiz.setProperty('--sombra-1', claro ? '0 1px 2px #1a1a1f26, 0 2px 8px #1a1a1f12' : '0 1px 2px #0006, 0 2px 8px #0003');
  raiz.setProperty('--sombra-2', claro ? '0 2px 4px #1a1a1f22, 0 10px 28px #1a1a1f26' : '0 2px 4px #0007, 0 10px 28px #0006');
  raiz.setProperty('--principal', c.principal);
  raiz.setProperty('--sobre-principal', textoSobre(c.principal));
  raiz.setProperty('--fondo', c.fondo);
  raiz.setProperty('--texto', texto);
  raiz.setProperty('--pista', c.pista);
  raiz.setProperty('--lineas', textoSobre(c.pista) + 'b3');
  raiz.setProperty('--jugadores', c.jugadores);
  raiz.setProperty('--texto-jugadores', textoSobre(c.jugadores));
  raiz.setProperty('--flechas', textoSobre(c.pista));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', c.fondo);
  if (!guardar) return;
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ principal: guardado.principal, fondo: guardado.fondo, pista: guardado.pista, jugadores: guardado.jugadores }));
  } catch {
    /* sin almacenamiento: los colores duran hasta cerrar */
  }
}
