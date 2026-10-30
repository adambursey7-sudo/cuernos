// Tarjetas de bolsillo para imprimir (3.2, opción C): ocho por folio, para recortar. Se eligen las jugadas que entran.
import { useEffect, useState } from 'react';
import { Pista } from '../pizarra/Pista';
import { todosLosSistemas } from '../sistemas/almacen';
import type { Sistema } from '../sistemas/tipos';
import './imprimir.css';

const POR_FOLIO = 8;

export function Tarjetas({ inicial, volver }: { inicial: Sistema; volver: () => void }) {
  const todos = todosLosSistemas();
  const [elegidos, setElegidos] = useState<string[]>([inicial.id]);
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && volver();
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [volver]);

  const alternar = (id: string) => setElegidos((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
  const lista = todos.filter((s) => elegidos.includes(s.id));
  const folios: Sistema[][] = [];
  for (let i = 0; i < lista.length; i += POR_FOLIO) folios.push(lista.slice(i, i + POR_FOLIO));

  return (
    <section className="pantalla ficha-imprimir">
      <div className="no-imprimir ficha-barra">
        <button className="atras" onClick={volver} aria-label="Volver">‹</button>
        <button className="chip on" onClick={() => window.print()} disabled={lista.length === 0}>⎙ Imprimir o guardar PDF</button>
      </div>
      <fieldset className="no-imprimir elegir-tarjetas">
        <legend>Jugadas que entran ({lista.length})</legend>
        {todos.map((s) => (
          <label key={s.id}>
            <input type="checkbox" checked={elegidos.includes(s.id)} onChange={() => alternar(s.id)} /> {s.nombre}
          </label>
        ))}
      </fieldset>

      {folios.map((folio, n) => (
        <article className="papel folio-tarjetas" key={n}>
          {folio.map((s) => {
            const ultimo = s.pasos.length;
            return (
              <div className="carta" key={s.id}>
                <h3>{s.nombre}</h3>
                <div className="carta-pistas">
                  <Pista sistema={s} t={0.01} />
                  {ultimo > 1 && <Pista sistema={s} t={ultimo - 0.99} />}
                </div>
                <p>{s.idea}</p>
              </div>
            );
          })}
        </article>
      ))}
    </section>
  );
}
