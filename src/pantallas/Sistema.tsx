// Un sistema en la pizarra: número de paso enorme, pista, explicación y botones grandes para usarlo en la banda.
import { useRef, useState } from 'react';
import { Pista } from '../pizarra/Pista';
import { useJugada } from '../pizarra/useJugada';
import { SISTEMAS } from '../sistemas/datos';
import { NIVELES, type Nivel } from '../sistemas/tipos';
import { Presentacion } from './Presentacion';

const CLAVE_DEFENSA = 'cuernos.defensa';
/** Lo que hay que mover el dedo en horizontal (px) para que cuente como deslizar y no como toque. */
const DESLIZAR = 40;

function leerDefensa(): boolean {
  try {
    return localStorage.getItem(CLAVE_DEFENSA) !== 'no';
  } catch {
    return true;
  }
}

function guardarDefensa(si: boolean) {
  try {
    localStorage.setItem(CLAVE_DEFENSA, si ? 'si' : 'no');
  } catch {
    /* sin almacenamiento: vale solo hasta cerrar */
  }
}

export function Sistema({ id, volver }: { id: string; volver: () => void }) {
  const s = SISTEMAS.find((x) => x.id === id)!;
  const total = s.pasos.length;
  const niveles = NIVELES.slice(NIVELES.findIndex((n) => n.id === s.nivelMinimo));
  const [nivel, setNivel] = useState<Nivel>(niveles.some((n) => n.id === 'cadete') ? 'cadete' : niveles[0].id);
  const jugada = useJugada(total);
  const { paso, t } = jugada;
  const [conDefensa, setConDefensa] = useState(leerDefensa);
  const [presentando, setPresentando] = useState(false);
  const inicioDedo = useRef<number | null>(null);
  const cambiarDefensa = () => {
    setConDefensa(!conDefensa);
    guardarDefensa(!conDefensa);
  };
  const lectura = s.lecturas[nivel];

  if (presentando)
    return <Presentacion sistema={s} jugada={jugada} conDefensa={conDefensa} cambiarDefensa={cambiarDefensa} cerrar={() => setPresentando(false)} />;

  return (
    <section className="pantalla sistema">
      <div className="cabecera">
        <button className="atras" onClick={volver} aria-label="Volver a los sistemas">‹</button>
        <h1 className="nombre-sistema">{s.nombre}</h1>
      </div>
      <div className="niveles" role="tablist" aria-label="Nivel del equipo">
        {niveles.map((n) => (
          <button key={n.id} role="tab" aria-selected={n.id === nivel} className={n.id === nivel ? 'chip on' : 'chip'} onClick={() => setNivel(n.id)}>
            {n.nombre}
          </button>
        ))}
        <button className={conDefensa ? 'chip defensa on' : 'chip defensa'} aria-pressed={conDefensa} onClick={cambiarDefensa}>
          ✕ Defensa
        </button>
      </div>

      <div className="marcador-fila">
        <div className="marcador" aria-live="polite">
          <span className="numero">{paso + 1}</span>
          <span className="de">/ {total}</span>
        </div>
        <div className="extras">
          <button className="chip" onClick={() => jugada.cambiarVelocidad()} aria-label="Cambiar la velocidad">
            {String(jugada.velocidad).replace('.', ',')}×
          </button>
          <button className="chip" onClick={() => setPresentando(true)}>⛶ Presentar</button>
        </div>
      </div>
      <div
        className="pizarra"
        onPointerDown={(e) => (inicioDedo.current = e.clientX)}
        onPointerUp={(e) => {
          if (inicioDedo.current === null) return;
          const dx = e.clientX - inicioDedo.current;
          inicioDedo.current = null;
          if (dx < -DESLIZAR) jugada.siguiente();
          else if (dx > DESLIZAR) jugada.anterior();
        }}
      >
        <Pista sistema={s} t={t} conDefensa={conDefensa} />
      </div>
      <p className="explica">
        {s.pasos[paso].texto}
        {s.pasos[paso].revisar && <span className="aviso"> Por revisar</span>}
      </p>
      <div className="mandos">
        <button onClick={() => jugada.anterior()} disabled={t <= 1}>Atrás</button>
        <button onClick={() => jugada.todo()}>▶ Jugada</button>
        <button className="principal" onClick={() => jugada.siguiente()} disabled={t >= total}>Siguiente</button>
      </div>

      <div className="ficha">
        <h2>Idea</h2>
        <p>{s.idea}</p>
        <h2>Lectura en {NIVELES.find((n) => n.id === nivel)!.nombre.toLowerCase()}</h2>
        <p>{lectura ?? 'Esta ficha aún no tiene lectura para este nivel.'}</p>
        <h2>Errores típicos</h2>
        <ul>{s.errores.map((e) => <li key={e}>{e}</li>)}</ul>
        <h2>Ejercicios</h2>
        <ul>{s.ejercicios.map((e) => <li key={e}>{e}</li>)}</ul>
        <p className="pie">Contra defensa {s.contra}.</p>
      </div>
    </section>
  );
}
