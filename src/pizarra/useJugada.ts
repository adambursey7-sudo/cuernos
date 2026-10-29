// Reloj de la jugada: anima de un momento a otro (un paso, o la jugada entera) a la velocidad elegida.
import { useEffect, useRef, useState } from 'react';
import { pasoDe } from './animar';

export const SEGUNDOS_POR_PASO = 1.6;
export const VELOCIDADES = [0.5, 1, 2] as const;

export function useJugada(total: number, pasoInicial = 0) {
  // t = 1 deja el primer paso dibujado y acabado.
  const [t, setT] = useState(() => Math.min(Math.max(pasoInicial, 0), total - 1) + 1);
  const [hasta, setHasta] = useState<number | null>(null);
  const [velocidad, setVelocidad] = useState<number>(1);
  const ultimo = useRef(0);

  useEffect(() => {
    if (hasta === null) return;
    let raf = 0;
    ultimo.current = performance.now();
    const tick = (ahora: number) => {
      const dt = ((ahora - ultimo.current) / 1000 / SEGUNDOS_POR_PASO) * velocidad;
      ultimo.current = ahora;
      setT((v) => Math.min(v + dt, hasta));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hasta, velocidad]);

  useEffect(() => {
    if (hasta !== null && t >= hasta) setHasta(null);
  }, [t, hasta]);

  const reproducir = (desde: number, fin: number) => {
    setT(desde);
    setHasta(fin);
  };

  return {
    t,
    paso: pasoDe(t, total),
    jugando: hasta !== null,
    velocidad,
    /** Anima el paso siguiente (si ya se estaba animando uno, lo da por acabado). */
    siguiente() {
      const base = Math.floor((hasta ?? t) + 1e-6);
      if (base >= total) return;
      reproducir(base, base + 1);
    },
    /** Salta al paso anterior ya dibujado, sin animar. */
    anterior() {
      setHasta(null);
      setT(Math.max(1, pasoDe(t, total)));
    },
    /** La jugada entera desde el principio. */
    todo() {
      reproducir(0, total);
    },
    cambiarVelocidad() {
      setVelocidad((v) => VELOCIDADES[(VELOCIDADES.indexOf(v as (typeof VELOCIDADES)[number]) + 1) % VELOCIDADES.length]);
    },
    reiniciar() {
      setHasta(null);
      setT(1);
    },
  };
}
