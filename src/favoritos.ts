// Favoritos: las jugadas y ejercicios marcados con la estrella (solo en este móvil). Cada id lleva su tipo delante: «j:» o «e:».
const CLAVE = 'horns.favoritos';

export function leerFavoritos(): string[] {
  try {
    const l = JSON.parse(localStorage.getItem(CLAVE) ?? '[]');
    return Array.isArray(l) ? l.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** Devuelve la lista nueva con el id puesto o quitado y la guarda. */
export function alternarFavorito(lista: string[], id: string): string[] {
  const nueva = lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id];
  try {
    localStorage.setItem(CLAVE, JSON.stringify(nueva));
  } catch {
    /* sin almacenamiento: dura hasta cerrar la app */
  }
  return nueva;
}

/** Quita acentos y mayúsculas para que «defensa» encuentre «Defensa» y «junior» a «Júnior». */
export const plano = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const coincide = (q: string, ...textos: (string | undefined)[]) => {
  const buscado = plano(q.trim());
  return !buscado || plano(textos.filter(Boolean).join(' ')).includes(buscado);
};

/** Junta los favoritos de una copia con los que ya hay y los guarda. Falso si el móvil no deja. */
export function guardarFavoritos(lista: string[]): boolean {
  try {
    localStorage.setItem(CLAVE, JSON.stringify([...new Set(lista)]));
    return true;
  } catch {
    return false;
  }
}
