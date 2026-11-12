// Hojas que se abren encima de la pantalla (filtros, el día de la temporada…), para quien usa teclado o lector de pantalla:
// al abrirse, el foco entra en la hoja; Escape la cierra; al cerrarse, el foco vuelve a donde estaba.
import { useEffect, useRef } from 'react';

/** ¿La hoja es lo que se ve arriba del todo? (si hay otra pantalla encima, como el partido en directo, Escape no es para ella). */
function estaEncima(hoja: HTMLElement): boolean {
  const r = hoja.getBoundingClientRect();
  const arriba = document.elementFromPoint(r.left + r.width / 2, r.top + Math.min(r.height / 2, 40));
  return !arriba || hoja.contains(arriba);
}

export function useHoja<T extends HTMLElement>(abierta: boolean, cerrar: () => void) {
  const ref = useRef<T | null>(null);
  const ultimoCerrar = useRef(cerrar);
  ultimoCerrar.current = cerrar;
  useEffect(() => {
    if (!abierta) return;
    const antes = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const hoja = ref.current;
    if (hoja && !hoja.contains(document.activeElement)) {
      if (!hoja.hasAttribute('tabindex')) hoja.setAttribute('tabindex', '-1');
      hoja.focus({ preventScroll: true });
    }
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      const h = ref.current;
      if (!h || !estaEncima(h)) return;
      ultimoCerrar.current();
    };
    window.addEventListener('keydown', tecla);
    return () => {
      window.removeEventListener('keydown', tecla);
      // El foco vuelve al botón que abrió la hoja; nunca a un campo de texto (en el móvil sacaría el teclado sin venir a cuento).
      if (antes && antes.tagName === 'BUTTON' && document.contains(antes)) antes.focus({ preventScroll: true });
    };
  }, [abierta]);
  return ref;
}
