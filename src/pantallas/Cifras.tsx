// Cifras del equipo (loop Pro, tramo 5): anillos de progreso, tendencias, récords, comparar dos partidos y mapa de tiros de la temporada.
import { useState } from 'react';
import type { Equipo, Jugadora } from '../diario/diario';
import { hoy } from '../diario/diario';
import { asistenciaSemana } from '../estadistica/resumen';
import {
  METRICAS_EQUIPO, METRICAS_JUGADORA, asistenciaPorSemana, compararPartidos, filasPartidos, ganaLinea, hace, partidosDe, pct, rachaAsistencia, recordsEquipo, recordsJugadora, serieEquipo,
  valorJugadora, type MetricaEquipo, type MetricaJugadora,
} from '../estadistica/progreso';
import { PanelMapa } from '../partido/MapaTiros';
import { tirosDeEventos, resumenTiros } from '../partido/mapa';
import { corta } from '../temporada/fechas';
import { leerTemporadas, temporadaDe } from '../temporada/temporada';
import { CargaSemanal } from './CargaSemanal';
import { Anillo } from '../ui/Anillo';
import { Grafica } from '../ui/Grafica';
import { Vacio } from '../ui/Vacio';

const dm = (f: string) => `${f.slice(8)}/${f.slice(5, 7)}`;

export function Cifras({ equipo, jugadoras }: { equipo: Equipo; jugadoras: Jugadora[] }) {
  const t = temporadaDe(leerTemporadas(), equipo.id);
  const hoyTexto = hoy();
  const filas = filasPartidos(t);
  const [metrica, setMetrica] = useState<MetricaEquipo>('puntos');
  const [quien, setQuien] = useState<string>('');
  const [metricaJ, setMetricaJ] = useState<MetricaJugadora>('p');
  const [cmpA, setCmpA] = useState<string>('');
  const [cmpB, setCmpB] = useState<string>('');

  if (filas.length === 0) {
    return <Vacio dibujo="grafico" titulo="Aún no hay partidos con resultado" texto="Cuando apuntes el resultado de un partido, o lo juegues en directo, aquí verás las tendencias, los récords y el mapa de tiros." />;
  }

  const ganados = filas.filter((f) => f.marca === 'G').length;
  const asis = asistenciaSemana(t, hoyTexto, jugadoras.length);
  const objetivos = equipo.objetivos ?? [];
  const hechos = objetivos.filter((o) => o.hecho).length;
  const tr = resumenTiros(tirosDeEventos(t?.eventos ?? []));
  const etiquetas = filas.map((f) => dm(f.fecha));

  const conDatos = jugadoras.filter((j) => partidosDe(t, j.id).length > 0);
  const jugadoraId = conDatos.some((j) => j.id === quien) ? quien : conDatos[0]?.id ?? '';
  const jugadora = jugadoras.find((j) => j.id === jugadoraId);
  const ps = jugadoraId ? partidosDe(t, jugadoraId) : [];
  const rs = rachaAsistencia(t, jugadoraId, hoyTexto);

  const a = filas.find((f) => f.id === cmpA) ?? filas[filas.length - 2] ?? filas[0];
  const b = filas.find((f) => f.id === cmpB) ?? filas[filas.length - 1];
  const lineas = compararPartidos(a, b);
  const fmt = (v: number | null, pc?: boolean) => (v === null ? '–' : `${v}${pc ? '%' : ''}`);

  return (
    <div className="cifras">
      <section className="anillos" aria-label="Progreso de la temporada">
        <div><Anillo pct={asis.pct} tam={68} etiqueta={asis.pct === null ? 'Sin lista esta semana' : `Asistencia de la semana ${asis.pct}%`} /><span>Asistencia<br />esta semana</span></div>
        <div><Anillo pct={pct(ganados, filas.length)} tam={68} etiqueta={`Victorias ${ganados} de ${filas.length}`} /><span>Victorias<br />{ganados} de {filas.length}</span></div>
        <div><Anillo pct={tr.efg} tam={68} etiqueta={tr.efg === null ? 'Sin tiros apuntados' : `Tiro efectivo ${tr.efg}%`} /><span>Tiro<br />efectivo</span></div>
        <div><Anillo pct={objetivos.length ? pct(hechos, objetivos.length) : null} tam={68} etiqueta={objetivos.length ? `Objetivos ${hechos} de ${objetivos.length}` : 'Sin objetivos'} /><span>Objetivos<br />{objetivos.length ? `${hechos} de ${objetivos.length}` : 'sin poner'}</span></div>
      </section>

      <section aria-label="Tendencia del equipo">
        <h2 className="sub">Tendencia del equipo</h2>
        <div className="niveles envuelto" role="group" aria-label="Qué medir">
          {METRICAS_EQUIPO.map(([id, nombre]) => <button key={id} className={metrica === id ? 'chip on' : 'chip'} aria-pressed={metrica === id} onClick={() => setMetrica(id)}>{nombre}</button>)}
        </div>
        <Grafica
          etiqueta={`Tendencia de ${METRICAS_EQUIPO.find(([id]) => id === metrica)![1]} en ${filas.length} partidos`}
          etiquetas={etiquetas}
          sufijo={metrica === 'tc' || metrica === 't3' || metrica === 'tl' ? '%' : ''}
          series={metrica === 'puntos'
            ? [{ nombre: 'A favor', color: 'var(--principal)', valores: serieEquipo(filas, 'puntos').map((p) => p.valor) }, { nombre: 'En contra', color: 'var(--tenue)', valores: serieEquipo(filas, 'recibidos').map((p) => p.valor) }]
            : [{ nombre: METRICAS_EQUIPO.find(([id]) => id === metrica)![1], color: 'var(--principal)', valores: serieEquipo(filas, metrica).map((p) => p.valor) }]}
        />
        {metrica === 'puntos' && <p className="leyenda-grafica"><i style={{ background: 'var(--principal)' }} /> A favor <i style={{ background: 'var(--tenue)' }} /> En contra</p>}
      </section>

      <section aria-label="Asistencia por semanas">
        <h2 className="sub">Asistencia por semanas</h2>
        <Grafica etiqueta="Asistencia a los entrenos de las últimas ocho semanas" sufijo="%" minimo={0}
          etiquetas={asistenciaPorSemana(t, hoyTexto, jugadoras.length).map((s) => dm(s.lunes))}
          series={[{ nombre: 'Asistencia', color: 'var(--ok)', valores: asistenciaPorSemana(t, hoyTexto, jugadoras.length).map((s) => s.pct) }]} />
      </section>

      <section aria-label="Carga de entrenamiento">
        <h2 className="sub">Carga de entrenamiento</h2>
        <CargaSemanal t={t} />
      </section>

      <section aria-label="Cada jugadora">
        <h2 className="sub">Cada jugadora</h2>
        {conDatos.length === 0 ? (
          <p className="vacio">Juega un partido en directo y aquí verás cómo evoluciona cada jugadora.</p>
        ) : (
          <>
            <div className="niveles envuelto" role="group" aria-label="Jugadora">
              {conDatos.map((j) => <button key={j.id} className={jugadoraId === j.id ? 'chip on' : 'chip'} aria-pressed={jugadoraId === j.id} onClick={() => setQuien(j.id)}>#{j.numero || '?'}</button>)}
            </div>
            <div className="niveles envuelto" role="group" aria-label="Qué medir">
              {METRICAS_JUGADORA.map(([id, nombre]) => <button key={id} className={metricaJ === id ? 'chip pequeno on' : 'chip pequeno'} aria-pressed={metricaJ === id} onClick={() => setMetricaJ(id)}>{nombre}</button>)}
            </div>
            <Grafica etiqueta={`${METRICAS_JUGADORA.find(([id]) => id === metricaJ)![1]} de ${jugadora?.nombre || 'la jugadora'} por partido`} sufijo={metricaJ === 'tc' ? '%' : ''} minimo={0}
              etiquetas={ps.map((p) => dm(p.fecha))} series={[{ nombre: 'Jugadora', color: 'var(--principal)', valores: ps.map((p) => valorJugadora(p, metricaJ)) }]} />
            <div className="racha-asis">
              <Anillo pct={pct(rs.vino, rs.de)} tam={64} grosor={7} etiqueta={`Ha ido a ${rs.vino} de ${rs.de} entrenos`} />
              <span><b>{rs.actual} {rs.actual === 1 ? 'entreno seguido' : 'entrenos seguidos'}</b><small>Su mejor racha: {rs.mejor}. Ha ido a {rs.vino} de {rs.de}.</small></span>
            </div>
            <ul className="records">
              {recordsJugadora(ps).map((r) => <li key={r.clave}><span>Récord de {r.nombre.toLowerCase()}</span><b>{r.valor}</b><small>{hace(r.fecha, hoyTexto)}</small></li>)}
            </ul>
          </>
        )}
      </section>

      <section aria-label="Comparar dos partidos">
        <h2 className="sub">Comparar dos partidos</h2>
        <div className="dos-botones">
          {([[a.id, setCmpA, 'Partido 1'], [b.id, setCmpB, 'Partido 2']] as const).map(([valor, poner, nombre]) => (
            <label key={nombre} className="campo-diario"><span>{nombre}</span>
              <select value={valor} onChange={(ev) => poner(ev.target.value)}>{filas.map((f) => <option key={f.id} value={f.id}>{corta(f.fecha)} · {f.rival}</option>)}</select>
            </label>
          ))}
        </div>
        <table className="comparar">
          <thead><tr><th scope="col"><span className="solo-lector">Dato</span></th><th scope="col">{dm(a.fecha)} {a.a}–{a.c}</th><th scope="col">{dm(b.fecha)} {b.a}–{b.c}</th></tr></thead>
          <tbody>
            {lineas.map((l) => {
              const g = ganaLinea(l);
              return <tr key={l.nombre}><th scope="row">{l.nombre}</th><td className={g === 'a' ? 'gana' : ''}>{fmt(l.a, l.porcentaje)}</td><td className={g === 'b' ? 'gana' : ''}>{fmt(l.b, l.porcentaje)}</td></tr>;
            })}
          </tbody>
        </table>
        <p className="meta">En verde, el mejor de los dos. Lo que sale con «–» no se apuntó en directo.</p>
      </section>

      <section aria-label="Récords del equipo">
        <h2 className="sub">Récords del equipo</h2>
        <ul className="records">
          {recordsEquipo(filas).map((r) => <li key={r.nombre}><span>{r.nombre}</span><b>{r.valor}</b><small>{r.detalle}</small></li>)}
        </ul>
      </section>

      <section aria-label="Mapa de tiros de la temporada">
        <h2 className="sub">Mapa de tiros de la temporada</h2>
        <PanelMapa tiros={tirosDeEventos(t?.eventos ?? [])} jugadoras={jugadoras} />
      </section>
    </div>
  );
}
