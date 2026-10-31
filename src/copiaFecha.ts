// Cuándo se hizo la última copia de seguridad, para avisar si hace mucho.
const CLAVE = 'horns.copia.fecha';
const SIETE_DIAS = 7 * 24 * 60 * 60 * 1000;

export const ultimaCopia = (): number | null => {
  try { const v = Number(localStorage.getItem(CLAVE)); return v > 0 ? v : null; } catch { return null; }
};
export const anotarCopia = () => { try { localStorage.setItem(CLAVE, String(Date.now())); } catch { /* sin almacenamiento: no se avisa */ } };

/** Días desde la última copia (Infinity si nunca), o null si todavía no toca avisar. */
export const diasSinCopia = (ahora = Date.now()): number | null => {
  const u = ultimaCopia();
  if (u === null) return Infinity;
  return ahora - u > SIETE_DIAS ? Math.floor((ahora - u) / 86_400_000) : null;
};
