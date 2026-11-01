// Panel de inicio (loop Pro, tramo 2): el equipo activo marca la pantalla con su escudo y su color.
// Arriba el próximo partido o entreno con cuenta atrás; debajo, accesos rápidos, estado del equipo y último resultado.
import { useEffect, useState } from 'react';
import { hoy, leerDiario, plantilla } from '../diario/diario';
import { colorLegible } from '../equipo/modelo';
import { EscudoEquipo } from '../equipo/EscudoEquipo';
import { leerEquipoActivo } from '../equipo/equipos';
import { asistenciaSemana, balance, cuentaAtras, haceCuanto, jugados, racha, textoRacha } from '../estadistica/resumen';
import { IconoConvocatoria, IconoLista, IconoPartido } from '../Iconos';
import { leerSesiones } from '../sesiones/sesiones';
import { sumarDias } from '../temporada/fechas';
import { cuando, siguiente } from '../temporada/siguiente';
import { agendaDia, leerTemporadas, temporadaDe, type Item } from '../temporada/temporada';
import { aspectoClaro, leerColores, paraClaro, textoSobre } from '../temas';
import { Anillo } from '../ui/Anillo';
import { Vacio } from '../ui/Vacio';
import { ModoTele } from './Tele';
import { pedirPartido } from '../partido/abrir';

/** Color del equipo que se lee en el aspecto actual (en claro se oscurece lo justo). */
function acentoDe(color: string | undefined): React.CSSProperties | undefined {
  if (!color) return undefined;
  const base = colorLegible(color);
  const principal = aspectoClaro() ? paraClaro({ ...leerColores(), principal: base }).principal : base;
  return { '--principal': principal, '--sobre-principal': textoSobre(principal) } as React.CSSProperties;
}

/** Primer entreno (no cancelado) de los próximos 14 días, para «Pasar lista». */
function proximoEntreno(t: NonNullable<ReturnType<typeof temporadaDe>>, desde: string): Item | undefined {
  for (let i = 0; i <= 14; i++) {
    const it = agendaDia(t, sumarDias(desde, i)).find((x) => x.tipo === 'entreno' && !x.cancelado);
    if (it) return it;
  }
  return undefined;
}

function Hero({ item, ahora, verDia, abrirSesion }: { item: Item; ahora: Date; verDia: (f: string) => void; abrirSesion: (id: string) => void }) {
  const c = cuentaAtras(item.fecha, item.hora, ahora);
  const sesion = item.sesionId ? leerSesiones().find((x) => x.id === item.sesionId) : undefined;
  const partido = item.tipo === 'partido';
  return (
    <section className="hero" aria-label="Lo siguiente">
      <span className="rotulo">{partido ? 'Próximo partido' : 'Próximo entreno'} · {cuando(item.fecha, hoy())} · {item.hora}</span>
      <h2>{partido ? item.titulo || 'Sin rival' : item.titulo || 'Entreno'}</h2>
      <p className="donde">
        {partido && item.evento ? (item.evento.casa === false ? 'Fuera' : 'En casa') : ''}
        {item.evento?.lugar ? `${partido ? ' · ' : ''}${item.evento.lugar}` : ''}
      </p>
      {c.enMarcha ? (
        <span className="en-marcha">En marcha ahora</span>
      ) : (
        <div className="cuenta" role="timer" aria-label={`Faltan ${c.dias} días, ${c.horas} horas y ${c.minutos} minutos`}>
          <span><b>{c.dias}</b><small>días</small></span>
          <span><b>{c.horas}</b><small>horas</small></span>
          <span><b>{c.minutos}</b><small>min</small></span>
        </div>
      )}
      <div className="hero-botones">
        {sesion && <button className="fuerte" onClick={() => abrirSesion(sesion.id)}>Abrir sesión</button>}
        <button className={sesion ? '' : 'fuerte'} onClick={() => verDia(item.fecha)}>Ver el día</button>
      </div>
    </section>
  );
}

export function Panel({ verDia, abrirSesion }: { verDia: (fecha: string) => void; abrirSesion: (id: string) => void }) {
  const [tele, setTele] = useState(false);
  // Cada 30 segundos se repinta todo el panel: la cuenta atrás avanza y, al pasar un partido, «lo siguiente» cambia solo.
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  const equipo = leerEquipoActivo();
  if (!equipo) {
    return <Vacio dibujo="gente" titulo="Aún no tienes equipo" texto="Crea tu equipo en la pestaña Equipo y aquí verás el próximo partido, la racha y la asistencia." />;
  }
  const t = temporadaDe(leerTemporadas(), equipo.id);
  const hoyTexto = hoy();
  const item = t ? siguiente(t, hoyTexto, ahora.toTimeString().slice(0, 5)) : undefined;
  const js = jugados(t);
  const bal = balance(js);
  const r = racha(js);
  const ultimo = js[js.length - 1];
  const jugadoras = plantilla(leerDiario(), equipo.id).length;
  const asis = asistenciaSemana(t, hoyTexto, jugadoras);
  const entreno = t ? proximoEntreno(t, hoyTexto) : undefined;
  // El partido del día que ya se terminó en directo no vuelve a salir como «el siguiente».
  const partido = t ? t.eventos.filter((e) => e.tipo === 'partido' && e.fecha >= hoyTexto && !e.vivo?.fin).sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora))[0] : undefined;
  return (
    <div className="panel" style={acentoDe(equipo.color)}>
      <div className="panel-equipo">
        <EscudoEquipo nombre={equipo.nombre} escudo={equipo.escudo} color={equipo.color} tam={52} />
        <div>
          <h1>{equipo.nombre}</h1>
          <span className="meta">{[equipo.categoria, equipo.temporada].filter(Boolean).join(' · ') || 'Tu equipo'}</span>
        </div>
      </div>

      {item ? (
        <Hero item={item} ahora={ahora} verDia={verDia} abrirSesion={abrirSesion} />
      ) : (
        <Vacio dibujo="calendario" titulo="Aún no hay nada apuntado" texto="Apunta tus entrenos y partidos y aquí verás siempre el próximo, con cuenta atrás." accion="Apuntar un entreno" alPulsar={() => verDia(hoyTexto)} />
      )}

      <div className="rapidos">
        <button onClick={() => verDia((entreno ?? { fecha: hoyTexto }).fecha)}><span className="burbuja-atajo"><IconoLista /></span>Pasar lista</button>
        <button onClick={() => (partido ? pedirPartido(partido.id) : verDia(hoyTexto))}><span className="burbuja-atajo"><IconoPartido /></span>Empezar partido</button>
        <button onClick={() => verDia((partido ?? { fecha: hoyTexto }).fecha)}><span className="burbuja-atajo"><IconoConvocatoria /></span>Ver convocatoria</button>
      </div>

      <section className="estado-equipo" aria-label="Estado del equipo">
        <div className="ficha-dato">
          <span className="rotulo">Racha</span>
          {r ? <b>{r.n} {r.marca}</b> : <b>–</b>}
          <div className="puntos-racha" aria-hidden="true">{js.slice(-5).map((j) => <i key={j.evento.id} className={j.marca} />)}</div>
          <small>{textoRacha(r)}</small>
        </div>
        <div className="ficha-dato">
          <span className="rotulo">Balance</span>
          <b>{bal.g}–{bal.p}</b>
          <small className={bal.dif > 0 ? 'positivo' : bal.dif < 0 ? 'negativo' : ''}>{bal.jugados ? `${bal.dif > 0 ? '+' : ''}${bal.dif} puntos` : 'Sin partidos'}</small>
        </div>
        <div className="ficha-dato">
          <span className="rotulo">Asistencia</span>
          <Anillo pct={asis.pct} tam={56} grosor={7} etiqueta={asis.pct === null ? 'Sin lista esta semana' : `Asistencia de la semana: ${asis.pct}%`} />
          <small>{asis.pct === null ? 'Esta semana' : `${asis.sesiones} ${asis.sesiones === 1 ? 'entreno' : 'entrenos'}`}</small>
        </div>
      </section>

      {ultimo && (
        <section className="ultimo" aria-label="Último resultado">
          <span className={`marca-resultado ${ultimo.marca}`} aria-label={ultimo.marca === 'G' ? 'Ganado' : ultimo.marca === 'P' ? 'Perdido' : 'Empate'}>{ultimo.marca}</span>
          <span>
            <b>{ultimo.evento.titulo || 'Sin rival'}</b>
            <span className="meta">{haceCuanto(ultimo.evento.fecha, hoyTexto)}{ultimo.evento.jornada ? ` · jornada ${ultimo.evento.jornada}` : ''}</span>
          </span>
          <span className="marcador-chico">{ultimo.a}–{ultimo.c}</span>
        </section>
      )}

      <button className="secundario" onClick={() => setTele(true)}>Modo tele</button>
      {tele && <ModoTele equipo={equipo} cerrar={() => setTele(false)} />}
    </div>
  );
}
