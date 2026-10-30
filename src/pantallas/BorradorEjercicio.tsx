// El ejercicio que ha dibujado Claude, como BORRADOR (boceto 1A): pizarra grande en movimiento y los pasos debajo.
// Nada se guarda hasta tocar «Guardar»; «Retocar» lo abre en el editor y «Pedir otra vez» vuelve al cuestionario.
import { useEffect, useState } from 'react';
import { Pista } from '../pizarra/Pista';
import { useJugada } from '../pizarra/useJugada';
import { guardarEjercicio, type Ejercicio } from '../recursos/guardarEjercicioIA';
import type { Ficha } from '../recursos/fichas';
import type { Cuestionario } from '../recursos/ia';
import type { Recurso } from '../recursos/recursos';

const sinMovimiento = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

export function BorradorEjercicio({ e, cuestionario, recurso, retocar, otraVez, guardada }: {
  e: Ejercicio;
  cuestionario: Cuestionario;
  recurso?: Recurso;
  retocar: (e: Ejercicio) => void;
  otraVez: () => void;
  guardada: (f: Ficha) => void;
}) {
  const s = e.sistema;
  const total = s.pasos.length;
  const jugada = useJugada(total);
  const [guardado, setGuardado] = useState<Ficha | null>(null);
  const [error, setError] = useState('');
  // Con «reducir movimiento» la pizarra queda quieta y se avanza con los botones.
  useEffect(() => {
    if (!sinMovimiento()) jugada.todo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const guardar = () => {
    const r = guardarEjercicio(e, cuestionario, recurso);
    if (!r.ok) return setError(r.motivo);
    setGuardado(r.ficha);
    guardada(r.ficha);
  };

  return (
    <section className="pantalla borrador-ia">
      <p className="meta">Borrador de Claude · {guardado ? 'guardado' : 'sin guardar'}</p>
      <h2 className="sub">{s.nombre}</h2>
      <p className="meta">{[e.minutos ? `${e.minutos}′` : '', `${s.visibles?.length ?? 5} jugadoras`, e.material].filter(Boolean).join(' · ')}</p>
      <div className="pizarra"><Pista sistema={s} t={jugada.t} /></div>
      <div className="mandos">
        <button onClick={() => jugada.anterior()} disabled={jugada.t <= 1}>Atrás</button>
        <button onClick={() => jugada.todo()}>▶ Ver</button>
        <button onClick={() => jugada.siguiente()} disabled={jugada.t >= total}>Siguiente</button>
      </div>
      <ol className="pasos-borrador">
        {s.pasos.map((p, i) => (
          <li key={i} className={i === jugada.paso ? 'on' : ''}>{p.texto}</li>
        ))}
      </ol>
      {error && <p className="aviso" role="alert">{error}</p>}
      {guardado ? (
        <p className="aviso" role="status">Guardado en Mis ejercicios.</p>
      ) : (
        <>
          <button className="principal ancho" onClick={guardar}>Guardar</button>
          <div className="fila-chips">
            <button className="secundario" onClick={() => retocar(e)}>Retocar en el editor</button>
            <button className="secundario" onClick={otraVez}>Pedir otra vez</button>
          </div>
        </>
      )}
      <p className="meta">Claude puede equivocarse: míralo moverse antes de guardarlo. No se guarda nada hasta que lo toques.</p>
    </section>
  );
}
