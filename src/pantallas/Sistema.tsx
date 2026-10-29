// Un sistema en la pizarra: número de paso enorme, pista, explicación y botones grandes para usarlo en la banda.
import { useEffect, useRef, useState } from 'react';
import { pasoDe } from '../pizarra/animar';
import { Pista } from '../pizarra/Pista';
import { SISTEMAS } from '../sistemas/datos';
import { NIVELES, type Nivel } from '../sistemas/tipos';

const SEGUNDOS_POR_PASO = 1.6;
const CLAVE_DEFENSA = 'cuernos.defensa';

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
  // t = 1 deja el primer paso dibujado y acabado; «Ver jugada» la anima desde el principio.
  const [t, setT] = useState(1);
  const [jugando, setJugando] = useState(false);
  const [conDefensa, setConDefensa] = useState(leerDefensa);
  const ultimo = useRef(0);
  const cambiarDefensa = () => {
    setConDefensa(!conDefensa);
    guardarDefensa(!conDefensa);
  };
  const paso = pasoDe(t, total);

  useEffect(() => {
    if (!jugando) return;
    let raf = 0;
    ultimo.current = performance.now();
    const tick = (ahora: number) => {
      const dt = (ahora - ultimo.current) / 1000 / SEGUNDOS_POR_PASO;
      ultimo.current = ahora;
      setT((v) => Math.min(v + dt, total));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [jugando, total]);

  useEffect(() => {
    if (jugando && t >= total) setJugando(false);
  }, [jugando, t, total]);

  const irA = (n: number) => {
    setJugando(false);
    setT(Math.max(1, Math.min(total, n + 1)));
  };
  const verJugada = () => {
    setT(0);
    setJugando(true);
  };
  const lectura = s.lecturas[nivel];

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

      <div className="marcador" aria-live="polite">
        <span className="numero">{paso + 1}</span>
        <span className="de">/ {total}</span>
      </div>
      <button className="pizarra" onClick={verJugada} aria-label="Ver la jugada entera">
        <Pista sistema={s} t={t} conDefensa={conDefensa} />
      </button>
      <p className="explica">
        {s.pasos[paso].texto}
        {s.pasos[paso].revisar && <span className="aviso"> Por revisar</span>}
      </p>
      <div className="mandos">
        <button onClick={() => irA(paso - 1)} disabled={paso === 0 && !jugando}>Atrás</button>
        <button onClick={verJugada}>▶ Jugada</button>
        <button className="principal" onClick={() => irA(paso + 1)} disabled={paso === total - 1 && t >= total}>Siguiente</button>
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
