// Vídeo de entrada: el túnel que acaba en el logo de HORNS. Sale una vez al día, se salta con un toque y se apaga en Ajustes.
// Si el vídeo no carga (sin conexión) o el móvil no lo deja arrancar, se cierra solo y la app se abre igual.
import { useEffect, useRef, useState } from 'react';

const CLAVE_OFF = 'horns.intro.off';
const CLAVE_DIA = 'horns.intro.dia';

const hoy = () => new Date().toLocaleDateString('sv-SE');
const leer = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const poner = (k: string, v: string | null) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* sin almacenamiento: no pasa nada */ } };

export const introActiva = () => leer(CLAVE_OFF) !== '1';
export const ponerIntroActiva = (si: boolean) => poner(CLAVE_OFF, si ? null : '1');
const tocaHoy = () => introActiva() && leer(CLAVE_DIA) !== hoy();

export function Intro({ terminar }: { terminar: () => void }) {
  const [saliendo, setSaliendo] = useState(false);
  const [sonido, setSonido] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const cerrar = () => {
    poner(CLAVE_DIA, hoy());
    setSaliendo(true);
    setTimeout(terminar, 350);
  };

  // Si a los 2 s el vídeo no ha arrancado (ahorro de batería, sin red), seguimos sin él.
  useEffect(() => {
    const t = setTimeout(() => { if (video.current && video.current.paused) cerrar(); }, 2000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`intro${saliendo ? ' sale' : ''}`} role="dialog" aria-label="Entrada a HORNS">
      <video
        ref={video}
        src={`${import.meta.env.BASE_URL}intro.mp4`}
        autoPlay
        muted={!sonido}
        playsInline
        preload="auto"
        onEnded={cerrar}
        onError={cerrar}
      />
      <div className="intro-botones">
        <button onClick={() => { setSonido((s) => !s); void video.current?.play(); }} aria-label={sonido ? 'Quitar sonido' : 'Poner sonido'}>{sonido ? '🔊' : '🔇'}</button>
        <button onClick={cerrar}>Saltar</button>
      </div>
    </div>
  );
}

/** Pone la intro sobre la app cuando toca (una vez al día). */
export function ConIntro({ children }: { children: React.ReactNode }) {
  const [ver, setVer] = useState(tocaHoy);
  return (
    <>
      {children}
      {ver && <Intro terminar={() => setVer(false)} />}
    </>
  );
}
