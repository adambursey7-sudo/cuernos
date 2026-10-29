// Modo presentación (opción A, elegida por Adam): la pista ocupa toda la pantalla; tocar a la derecha anima el paso
// siguiente y a la izquierda vuelve al anterior. Los mandos se esconden a los 2,5 s y vuelven al tocar.
import { useEffect, useRef, useState } from 'react';
import { Pista } from '../pizarra/Pista';
import type { Sistema } from '../sistemas/tipos';
import type { useJugada } from '../pizarra/useJugada';

type Jugada = ReturnType<typeof useJugada>;

export function Presentacion({ sistema, jugada, conDefensa, cambiarDefensa, cerrar }: {
  sistema: Sistema;
  jugada: Jugada;
  conDefensa: boolean;
  cambiarDefensa: () => void;
  cerrar: () => void;
}) {
  const [mandos, setMandos] = useState(true);
  const reloj = useRef<number>(0);
  const total = sistema.pasos.length;

  const despertar = () => {
    setMandos(true);
    clearTimeout(reloj.current);
    reloj.current = window.setTimeout(() => setMandos(false), 2500);
  };

  useEffect(() => {
    despertar();
    // Pantalla completa y horizontal donde el navegador lo permita (en el iPhone, Safari no deja: se queda en la app).
    document.documentElement.requestFullscreen?.().catch(() => {});
    (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> })?.lock?.('landscape').catch(() => {});
    // Las teclas leen siempre la jugada del último dibujo (la del primero tendría el paso viejo).
    const teclas = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') ultima.current.jugada.siguiente();
      if (e.key === 'ArrowLeft') ultima.current.jugada.anterior();
      if (e.key === 'Escape') ultima.current.salir();
    };
    window.addEventListener('keydown', teclas);
    return () => {
      clearTimeout(reloj.current);
      window.removeEventListener('keydown', teclas);
    };
  }, []);

  const salir = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    cerrar();
  };
  const ultima = useRef({ jugada, salir });
  ultima.current = { jugada, salir };

  return (
    <div className={mandos ? 'presentacion' : 'presentacion sin-mandos'} onPointerDown={despertar}>
      <div className="escenario">
        <Pista sistema={sistema} t={jugada.t} conDefensa={conDefensa} />
      </div>
      <button className="zona-toque izquierda" aria-label="Paso anterior" onClick={() => jugada.anterior()} />
      <button className="zona-toque derecha" aria-label="Paso siguiente" onClick={() => jugada.siguiente()} />

      <div className="mandos-arriba">
        <button onClick={salir} aria-label="Salir de la presentación">✕</button>
        <span className="cuenta">{jugada.paso + 1} / {total}</span>
        <button onClick={() => jugada.todo()}>▶ Todo</button>
        <button onClick={() => jugada.cambiarVelocidad()}>{String(jugada.velocidad).replace('.', ',')}×</button>
        <button className={conDefensa ? 'on' : ''} aria-pressed={conDefensa} onClick={cambiarDefensa}>✕ Defensa</button>
      </div>
      <p className="texto-paso">{sistema.pasos[jugada.paso].texto}</p>
    </div>
  );
}
