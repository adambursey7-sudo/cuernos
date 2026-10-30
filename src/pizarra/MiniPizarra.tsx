// Miniatura de pizarra que se mueve: solo mientras se ve en pantalla, en bucle y despacio. Con «reducir movimiento»
// (o sin IntersectionObserver) queda quieta en el final de la jugada. Al tocarla se abre lo de siempre (lo decide quien la usa).
import { useEffect, useRef, useState } from 'react';
import type { Sistema } from '../sistemas/tipos';
import { momentoDelBucle } from './bucle';
import { Pista } from './Pista';

/** Cada cuánto se redibuja una miniatura (ms): suficiente para verla fluida y ligero para una lista larga. */
const CADA = 70;

const quieto = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches || typeof IntersectionObserver === 'undefined';
  } catch {
    return true;
  }
};

export function MiniPizarra({ sistema, className = 'mini' }: { sistema: Sistema; className?: string }) {
  const total = sistema.pasos.length;
  const caja = useRef<HTMLSpanElement>(null);
  const [t, setT] = useState(total);
  const [parada] = useState(quieto);

  useEffect(() => {
    const el = caja.current;
    if (parada || !el) return;
    let raf = 0;
    let visible = false;
    let inicio = 0;
    let ultimo = 0;
    const tick = (ahora: number) => {
      if (!inicio) inicio = ahora;
      if (ahora - ultimo >= CADA) {
        ultimo = ahora;
        setT(momentoDelBucle(ahora - inicio, total));
      }
      raf = requestAnimationFrame(tick);
    };
    const observador = new IntersectionObserver(([entrada]) => {
      const ahora = entrada.isIntersecting;
      if (ahora === visible) return;
      visible = ahora;
      cancelAnimationFrame(raf);
      if (visible) { inicio = 0; raf = requestAnimationFrame(tick); } else setT(total);
    });
    observador.observe(el);
    return () => { observador.disconnect(); cancelAnimationFrame(raf); };
  }, [parada, total]);

  return <span ref={caja} className={className}><Pista sistema={sistema} t={t} /></span>;
}
