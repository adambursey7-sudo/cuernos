// Rotación del partido (vuelta 6, A+C): tabla de jugadoras por cuartos, con «Repartir» que la rellena y casillas para corregir.
// 4 cuartos de 10 minutos y 5 en pista. Las lesionadas quedan fuera. Se guarda en el equipo, en este móvil.
import { estaFuera, type Equipo, type Jugadora } from '../diario/diario';
import { palabras } from '../diario/tipo';
import { CUARTOS, EN_PISTA, alternar, cuartosIncompletos, minutos, repartir, vacia } from '../rotacion/rotacion';

export function Rotacion({ e, js, cambiar }: { e: Equipo; js: Jugadora[]; cambiar: (e: Equipo) => void }) {
  const r = e.rotacion ?? vacia();
  const sanas = js.filter((j) => !estaFuera(j));
  const w = palabras(e);
  const poner = (n: typeof r) => cambiar({ ...e, rotacion: n });
  const incompletos = cuartosIncompletos(r);
  const hayAlgo = r.some((q) => q.length > 0);
  const total = sanas.map((j) => minutos(r, j.id));
  const media = total.length ? total.reduce((a, b) => a + b, 0) / total.length : 0;

  if (js.length === 0) return <p className="vacio">Apunta antes a {w.jugadoras === 'jugadores' ? 'los jugadores' : 'las jugadoras'} en la plantilla para repartir los minutos.</p>;
  return (
    <div className="rotacion">
      <p className="meta">4 cuartos de 10 minutos · {EN_PISTA} en pista. Toca una casilla para cambiarla.</p>
      <div className="rot-tabla" role="table" aria-label="Rotación por cuartos">
        <div className="rot-fila rot-cab" role="row">
          <span />
          {Array.from({ length: CUARTOS }, (_, q) => <span key={q} role="columnheader">{q + 1}º</span>)}
          <span role="columnheader">Min</span>
        </div>
        {js.map((j) => {
          const m = minutos(r, j.id);
          const baja = estaFuera(j);
          return (
            <div key={j.id} className={baja ? 'rot-fila baja' : 'rot-fila'} role="row">
              <span className="dorsal" title={j.nombre || undefined}>{j.numero || '–'}</span>
              {Array.from({ length: CUARTOS }, (_, q) => {
                const juega = r[q].includes(j.id);
                return (
                  <button
                    key={q}
                    role="cell"
                    className={juega ? 'rot-casilla on' : 'rot-casilla'}
                    aria-pressed={juega}
                    aria-label={`${j.numero ? `Dorsal ${j.numero}` : w.Jugadora}, cuarto ${q + 1}: ${juega ? 'juega' : 'banquillo'}`}
                    disabled={baja && !juega}
                    onClick={() => poner(alternar(r, q, j.id))}
                  >{juega ? '■' : '□'}</button>
                );
              })}
              <span className={baja ? 'chip pequeno' : m < media * 0.6 ? 'chip pequeno estado-trabajar' : 'chip pequeno estado-fuerte'} role="cell">{baja ? 'lesión' : m}</span>
            </div>
          );
        })}
        <div className="rot-fila rot-pie" role="row">
          <span className="meta">En pista</span>
          {r.map((q, i) => <span key={i} role="cell" className={q.length === EN_PISTA ? 'rot-ok' : 'rot-mal'}>{q.length}/{EN_PISTA}</span>)}
          <span />
        </div>
      </div>
      {hayAlgo && incompletos.length > 0 && <p className="aviso" role="status">{incompletos.length === 1 ? `El ${incompletos[0] + 1}º cuarto no` : `Los cuartos ${incompletos.map((i) => `${i + 1}º`).join(', ')} no`} tienen {EN_PISTA} en pista.</p>}
      {sanas.length < EN_PISTA && <p className="aviso" role="status">Solo hay {sanas.length} {w.jugadoras} disponibles: no se pueden llenar los {EN_PISTA} puestos.</p>}
      <div className="niveles filtro">
        <button className="chip on" onClick={() => poner(repartir(sanas.map((j) => j.id)))}>{hayAlgo ? 'Repartir de nuevo' : 'Repartir'}</button>
        {hayAlgo && <button className="chip" onClick={() => poner(vacia())}>Vaciar</button>}
      </div>
    </div>
  );
}
