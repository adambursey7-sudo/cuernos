// Lo que ve el jugador al abrir un enlace de jugada: sin pestañas ni editor, la jugada se mueve sola y se repite.
// Puede pararla, ir paso a paso y, si también usa Horns, guardarla en su móvil.
import { useEffect, useState } from 'react';
import { Marca } from '../Logo';
import { Pista } from '../pizarra/Pista';
import { useJugada } from '../pizarra/useJugada';
import { guardarMio, nuevoId } from '../sistemas/almacen';
import type { Compartida } from './enlace';
import './compartir.css';

/** Pausa al acabar la jugada antes de volver a empezar. */
const PAUSA_FINAL = 1800;
/** La app sin el enlace: la misma dirección quitando lo de detrás de «#». */
const APP = location.pathname;

export function Visor({ datos }: { datos: Compartida | 'roto' }) {
  if (datos === 'roto')
    return (
      <section className="visor roto">
        <Marca className="visor-marca" />
        <h1 className="visor-nombre">Este enlace no se abre</h1>
        <p className="vacio">Puede que se haya cortado al copiarlo. Pide a tu entrenador que te lo mande otra vez.</p>
        <a className="visor-boton" href={APP}>Abrir Horns</a>
      </section>
    );
  return <VisorJugada datos={datos} />;
}

function VisorJugada({ datos }: { datos: Compartida }) {
  const s = datos.sistema;
  const total = s.pasos.length;
  const jugada = useJugada(total, 0);
  const [solo, setSolo] = useState(true);
  const [conDefensa, setConDefensa] = useState(datos.conDefensa);
  const [guardada, setGuardada] = useState<'no' | 'si' | 'error'>('no');

  useEffect(() => {
    document.title = `${s.nombre} · Horns`;
  }, [s.nombre]);

  // Se repite sola: al acabar, una pausa y otra vez desde el principio.
  useEffect(() => {
    if (!solo || jugada.jugando) return;
    const espera = setTimeout(() => jugada.todo(), jugada.t >= total ? PAUSA_FINAL : 300);
    return () => clearTimeout(espera);
  }, [solo, jugada.jugando]);

  const aMano = (mover: () => void) => {
    setSolo(false);
    jugada.parar();
    mover();
  };
  const guardar = () => {
    try {
      guardarMio({ ...s, id: nuevoId(), propio: true });
      setGuardada('si');
    } catch {
      setGuardada('error');
    }
  };

  return (
    <section className="visor">
      <div className="visor-cabeza">
        <Marca className="visor-marca" />
        <span className="visor-cuenta" aria-live="polite">{jugada.paso + 1}<small> / {total}</small></span>
      </div>
      <h1 className="visor-nombre">{s.nombre}</h1>
      <div className="visor-pista">
        <Pista sistema={s} t={jugada.t} conDefensa={conDefensa} />
      </div>
      <p className="explica">{s.pasos[jugada.paso].texto}</p>
      <div className="visor-mandos">
        <button onClick={() => aMano(() => jugada.anterior())} disabled={jugada.t <= 1 && !solo} aria-label="Paso anterior">‹</button>
        {solo ? (
          <button className="principal" onClick={() => aMano(() => {})} aria-label="Parar">❚❚</button>
        ) : (
          <button className="principal" onClick={() => setSolo(true)} aria-label="Ver la jugada entera">▶</button>
        )}
        <button onClick={() => aMano(() => jugada.siguiente())} disabled={jugada.t >= total && !solo} aria-label="Paso siguiente">›</button>
      </div>
      <div className="fila-chips visor-extras">
        <button className="chip" onClick={() => jugada.cambiarVelocidad()} aria-label="Cambiar la velocidad">
          {String(jugada.velocidad).replace('.', ',')}×
        </button>
        <button className={conDefensa ? 'chip defensa on' : 'chip defensa'} aria-pressed={conDefensa} onClick={() => setConDefensa(!conDefensa)}>
          ✕ Defensa
        </button>
      </div>
      {datos.delLibro ? (
        <a className="visor-boton" href={APP}>Abrir Horns</a>
      ) : guardada === 'si' ? (
        <a className="visor-boton hecho" href={APP}>Guardada · abrir Horns</a>
      ) : (
        <button className="visor-boton" onClick={guardar}>Guardar en mi Horns</button>
      )}
      {guardada === 'error' && <p className="error">Este móvil no deja guardar. Prueba fuera del modo privado.</p>}
    </section>
  );
}
