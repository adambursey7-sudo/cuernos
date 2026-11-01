// Carga de entrenamiento por semana (loop Pro, tramo 8): una barra por semana con los minutos y la carga, coloreada por fase de la temporada,
// con los partidos marcados y la semana actual resaltada. SVG a mano.
import { hoy } from '../diario/diario';
import { leerSesiones } from '../sesiones/sesiones';
import { volumenSemanal } from '../sesiones/plan';
import { lunesDe, sumarDias } from '../temporada/fechas';
import type { Temporada } from '../temporada/temporada';

const COLORES_FASE = ['#5aa9ff', '#4cc26a', '#ffb020', '#c58fd0', '#6fd3d3', '#e5508a'];
const W = 340;
const H = 130;
const SEMANAS_ATRAS = 4;
const SEMANAS = 16;

export function CargaSemanal({ t }: { t: Temporada | undefined }) {
  const hoyTexto = hoy();
  const lunesHoy = lunesDe(hoyTexto);
  const semanas = volumenSemanal(t, leerSesiones(), sumarDias(lunesHoy, -7 * SEMANAS_ATRAS), SEMANAS).filter((s) => t && s.lunes >= lunesDe(t.inicio) && s.lunes <= t.fin);
  if (!t || semanas.every((s) => s.minutos === 0 && s.partidos === 0)) {
    return <p className="vacio">Cuando haya entrenos apuntados verás aquí cuánta carga lleva cada semana.</p>;
  }
  const max = Math.max(1, ...semanas.map((s) => s.carga));
  const ancho = (W - 12) / semanas.length;
  const fases = [...new Map(semanas.flatMap((s) => (s.fase ? [[s.fase.id, s.fase] as const] : []))).values()];
  const colorDe = (id?: string) => (id ? COLORES_FASE[fases.findIndex((f) => f.id === id) % COLORES_FASE.length] : 'var(--principal)');
  const actual = semanas.find((s) => s.lunes === lunesHoy);
  return (
    <section className="carga-semanal" aria-label="Carga de entrenamiento por semana">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Carga por semana: ${semanas.map((s) => `${s.lunes.slice(8)}/${s.lunes.slice(5, 7)} ${s.minutos} minutos`).join(', ')}`}>
        <line x1="6" x2={W - 6} y1={H - 22} y2={H - 22} className="rejilla" />
        {semanas.map((s, i) => {
          const x = 6 + i * ancho;
          const alto = (s.carga / max) * (H - 50);
          return (
            <g key={s.lunes} className={s.lunes === lunesHoy ? 'hoy' : ''}>
              <rect x={x + 2} y={H - 22 - alto} width={ancho - 4} height={Math.max(alto, s.minutos ? 2 : 0)} rx="3" fill={colorDe(s.fase?.id)} opacity={s.lunes < lunesHoy ? 0.55 : 0.95} />
              {s.partidos > 0 && <circle cx={x + ancho / 2} cy={H - 22 - alto - 7} r="3.4" className="punto-partido" />}
              {(i % 4 === 0 || s.lunes === lunesHoy) && <text x={x + ancho / 2} y={H - 8} textAnchor="middle" className="eje">{s.lunes.slice(8)}/{s.lunes.slice(5, 7)}</text>}
            </g>
          );
        })}
      </svg>
      <p className="leyenda-carga">
        <i className="punto-partido" /> Partido
        {fases.map((f, i) => <span key={f.id}><i style={{ background: COLORES_FASE[i % COLORES_FASE.length] }} /> {f.nombre || 'Fase'}</span>)}
        {fases.length === 0 && <span className="meta">Sin fases: crea las fases de la temporada para ver su carga por colores.</span>}
      </p>
      {actual && <p className="meta">Esta semana: <b>{actual.entrenos}</b> {actual.entrenos === 1 ? 'entreno' : 'entrenos'} · <b>{actual.minutos}</b> min · carga <b>{actual.carga}</b> u{actual.partidos ? ` · ${actual.partidos} ${actual.partidos === 1 ? 'partido' : 'partidos'}` : ''}</p>}
    </section>
  );
}
