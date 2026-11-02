// Estadística avanzada de la temporada (loop Herramienta diaria, tramo 4): +/- y valoración, quintetos más usados,
// tendencia de la diferencia de puntos y valoración por edad. Jugadores por dorsal; solo con partidos apuntados en directo.
import type { Jugadora } from '../diario/diario';
import { quintetosMasUsados, resumenAvanzado, sentido, tendencia, valoracionPorEdad } from '../estadistica/avanzada';
import type { FilaPartido } from '../estadistica/progreso';
import type { Temporada } from '../temporada/temporada';
import { Grafica } from '../ui/Grafica';

const dorsal = (js: Jugadora[], id: string) => `#${js.find((j) => j.id === id)?.numero || '–'}`;
const mm = (n: number) => (n > 0 ? `+${n}` : `${n}`);
const reloj = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function Avanzadas({ t, jugadoras, filas }: { t: Temporada | undefined; jugadoras: Jugadora[]; filas: FilaPartido[] }) {
  const av = resumenAvanzado(t);
  const quintetos = quintetosMasUsados((t?.eventos ?? []).filter((e) => e.tipo === 'partido'));
  const dif = filas.map((f) => f.a - f.c);
  const media = tendencia(dif);
  const sube = sentido(media);
  const hoyAnyo = new Date().getFullYear();
  const porEdad = valoracionPorEdad(av, Object.fromEntries(jugadoras.map((j) => [j.id, j.nacimiento])), hoyAnyo);

  if (av.length === 0) {
    return (
      <section aria-label="Estadística avanzada">
        <h2 className="sub">Avanzadas</h2>
        <p className="vacio">Aquí saldrán el +/-, la valoración y los quintetos cuando apuntes un partido en directo.</p>
      </section>
    );
  }
  return (
    <section aria-label="Estadística avanzada">
      <h2 className="sub">Avanzadas</h2>
      <p className="meta">Valoración = puntos + rebotes + asistencias + robos − pérdidas − tiros fallados − faltas. El +/- es la diferencia de puntos con ella en pista.</p>
      <table className="comparar">
        <thead><tr><th scope="col">Jugador</th><th scope="col">PJ</th><th scope="col">Min</th><th scope="col">+/-</th><th scope="col">Val.</th><th scope="col">Val./40</th></tr></thead>
        <tbody>
          {av.map((a) => (
            <tr key={a.id}><th scope="row">{dorsal(jugadoras, a.id)}</th><td>{a.partidos}</td><td>{Math.round(a.seg / 60)}</td><td>{mm(a.mm)}</td><td>{a.val}</td><td>{a.val40 ?? '–'}</td></tr>
          ))}
        </tbody>
      </table>
      <p className="meta">Val./40 solo sale con 10 minutos o más jugados.</p>

      <h3 className="sub">Quintetos más usados</h3>
      <ul className="lista">
        {quintetos.map((q) => (
          <li key={q.jugadores.join()} className="meta">{q.jugadores.map((id) => dorsal(jugadoras, id)).join(' ')} · {reloj(q.seg)} juntos · {q.a}–{q.c} ({mm(q.dif)})</li>
        ))}
        {quintetos.length === 0 && <li className="meta">Aún no hay un quinteto completo con tiempo.</li>}
      </ul>

      <h3 className="sub">Tendencia de la temporada</h3>
      <Grafica etiqueta="Diferencia de puntos, media de los últimos 3 partidos" etiquetas={filas.map((f) => f.fecha.slice(8) + '/' + f.fecha.slice(5, 7))} series={[{ nombre: 'Diferencia (media de 3)', color: 'var(--principal)', valores: media }]} />
      <p className="meta">{sube === 'sube' ? 'La diferencia va a mejor.' : sube === 'baja' ? 'La diferencia va a peor.' : 'La diferencia se mantiene.'}</p>

      {porEdad.length > 0 && (
        <>
          <h3 className="sub">Valoración por edad</h3>
          <ul className="lista">{porEdad.map((e) => <li key={e.edad} className="meta">{e.edad} años · {e.jugadoras} {e.jugadoras === 1 ? 'jugador' : 'jugadores'} · {e.val40} por 40 min</li>)}</ul>
        </>
      )}
    </section>
  );
}
