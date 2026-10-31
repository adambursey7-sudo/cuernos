// Estadística rápida en directo (senior): puntos y faltas por jugador con botones grandes, y aviso de faltas.
import { avisosFaltas, estadoFaltas, ponerFalta, sumarPuntos, totalPuntos, type Directo } from '../temporada/directo';
import type { Evento } from '../temporada/temporada';

export function EnDirecto({ e, jugadoras, poner }: { e: Evento; jugadoras: { id: string; nombre: string; numero?: string | number }[]; poner: (c: Partial<Evento>) => void }) {
  const d = e.directo;
  const cambiar = (nuevo: Directo) => poner({ directo: nuevo, resultado: { a: totalPuntos(nuevo), c: e.resultado?.c ?? 0 } });
  const avisos = avisosFaltas(d);
  const nombre = (id: string) => jugadoras.find((j) => j.id === id)?.nombre || 'Sin nombre';
  if (jugadoras.length === 0) return null;
  return (
    <details className="en-directo">
      <summary>Partido en directo{d ? ` · ${totalPuntos(d)} puntos` : ''}</summary>
      {avisos.length > 0 && (
        <p className="aviso" aria-live="polite">
          {avisos.map((a) => `${nombre(a.id)} ${a.estado === 'fuera' ? 'está fuera (5 faltas)' : 'tiene 4 faltas'}`).join(' · ')}
        </p>
      )}
      <ul className="lista">
        {jugadoras.map((j) => {
          const l = d?.[j.id] ?? { p: 0, f: 0 };
          return (
            <li key={j.id} className="fila-directo">
              <span className="nombre">{j.numero ? `#${j.numero} ` : ''}{j.nombre || 'Sin nombre'}</span>
              <span className="meta">{l.p} pts · {l.f} faltas{estadoFaltas(l.f) === 'ok' ? '' : ' ⚠'}</span>
              <span className="fila-chips">
                {[1, 2, 3].map((n) => <button key={n} className="chip" aria-label={`+${n} a ${j.nombre}`} onClick={() => cambiar(sumarPuntos(d, j.id, n))}>+{n}</button>)}
                <button className="chip" aria-label={`Quitar un punto a ${j.nombre}`} onClick={() => cambiar(sumarPuntos(d, j.id, -1))}>−1</button>
                <button className="chip" aria-label={`Falta de ${j.nombre}`} onClick={() => cambiar(ponerFalta(d, j.id, 1))}>Falta</button>
                <button className="chip" aria-label={`Quitar falta a ${j.nombre}`} onClick={() => cambiar(ponerFalta(d, j.id, -1))}>−F</button>
              </span>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
