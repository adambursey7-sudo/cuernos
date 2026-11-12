// Hojas que se abren encima de la pantalla (filtros, el día de la temporada…), para quien usa teclado o lector de pantalla:
// al abrirse, el foco entra en la hoja; Escape la cierra; al cerrarse, el foco vuelve a donde estaba.
import { useEffect, useRef } from 'react';

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
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); ultimoCerrar.current(); } };
    window.addEventListener('keydown', tecla);
    return () => {
      window.removeEventListener('keydown', tecla);
      if (antes && document.contains(antes)) antes.focus({ preventScroll: true });
    };
  }, [abierta]);
  return ref;
}
