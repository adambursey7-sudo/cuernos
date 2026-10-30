// El ejercicio que ha dibujado Claude, como BORRADOR (boceto 1A): pizarra grande en movimiento y los pasos debajo.
// Nada se guarda hasta tocar «Guardar»; «Retocar» lo abre en el editor y «Pedir otra vez» vuelve al cuestionario.
import { useState } from 'react';
import { PizarraGrande } from '../pizarra/PizarraGrande';
import { guardarEjercicio, type Ejercicio } from '../recursos/guardarEjercicioIA';
import type { Ficha } from '../recursos/fichas';
import type { Cuestionario } from '../recursos/ia';
import type { Recurso } from '../recursos/recursos';

export function BorradorEjercicio({ e, cuestionario, recurso, retocar, otraVez, guardada }: {
  e: Ejercicio;
  cuestionario: Cuestionario;
  recurso?: Recurso;
  retocar: (e: Ejercicio) => void;
  otraVez: () => void;
  guardada: (f: Ficha) => void;
}) {
  const s = e.sistema;
  const [guardado, setGuardado] = useState<Ficha | null>(null);
  const [error, setError] = useState('');
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
      <PizarraGrande sistema={s} conPasos />
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
