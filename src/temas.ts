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
export function aplicarColores(c: Colores, guardar = true) {
  const raiz = document.documentElement.style;
  const texto = textoSobre(c.fondo);
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
    localStorage.setItem(CLAVE, JSON.stringify({ principal: c.principal, fondo: c.fondo, pista: c.pista, jugadores: c.jugadores }));
  } catch {
    /* sin almacenamiento: los colores duran hasta cerrar */
  }
}
