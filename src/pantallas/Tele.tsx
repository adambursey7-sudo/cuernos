// «Tele de equipo» (vuelta 5, estilo 1 de Adam): el inicio como un marcador con el próximo partido y entreno,
// el equipo de un vistazo (virtudes y a trabajar) y un «Modo tele» a pantalla completa para enseñarlo al equipo con el móvil enchufado a una tele.
import { useEffect, useRef, useState } from 'react';
import { Marca } from '../Logo';
import { disponibles, hoy, plantilla, leerDiario, type Equipo } from '../diario/diario';
import { leerEquipoActivo } from '../equipo/equipos';
import { leerSesiones } from '../sesiones/sesiones';
import { DIAS, diaSemana, lunesDe, sumarDias } from '../temporada/fechas';
import { cuando, siguiente } from '../temporada/siguiente';
import { agendaDia, leerTemporadas, temporadaDe, type Item } from '../temporada/temporada';
import { Radar } from './Radar';

const MAX_CHIPS = 3;

function datos(equipo: Equipo) {
  const t = temporadaDe(leerTemporadas(), equipo.id);
  const hoyTexto = hoy();
  const proximo = t ? siguiente(t, hoyTexto, new Date().toTimeString().slice(0, 5)) : undefined;
  const lunes = lunesDe(hoyTexto);
  const semana: Item[] = t ? Array.from({ length: 7 }, (_, i) => agendaDia(t, sumarDias(lunes, i)).filter((x) => !x.cancelado)).flat() : [];
  const hs = equipo.habilidades ?? [];
  const js = plantilla(leerDiario(), equipo.id);
  return { hoyTexto, proximo, semana, hs, js, fuertes: hs.filter((h) => h.estado === 'fuerte'), flojas: hs.filter((h) => h.estado === 'trabajar') };
}

const titulo = (i: Item) => (i.tipo === 'partido' ? `Partido · ${i.titulo || 'sin rival'}` : i.titulo || 'Entreno');

/** Pantalla grande: logo, próximo partido o entreno, la semana y el equipo. Se cierra con la ✕ o con Escape. */
export function ModoTele({ equipo, cerrar }: { equipo: Equipo; cerrar: () => void }) {
  const { hoyTexto, proximo, semana, hs, fuertes, flojas } = datos(equipo);
  const cierre = useRef(cerrar);
  cierre.current = cerrar;
  useEffect(() => {
    const tecla = (ev: KeyboardEvent) => { if (ev.key === 'Escape') cierre.current(); };
    window.addEventListener('keydown', tecla);
    // Pantalla completa si el navegador la deja (en el iPhone no siempre): si no, la capa ya tapa la app.
    void document.documentElement.requestFullscreen?.().catch(() => undefined);
    return () => {
      window.removeEventListener('keydown', tecla);
      if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => undefined);
    };
  }, []);
  return (
    <div className="modo-tele" role="dialog" aria-modal="true" aria-label="Modo tele">
      <button className="cerrar-tele" onClick={cerrar} aria-label="Cerrar el modo tele">✕</button>
      <Marca className="marca-tele" />
      <h1 className="tele-equipo">{equipo.nombre}</h1>
      {proximo ? (
        <div className="tele-marcador">
          <b className="tele-cuando">{cuando(proximo.fecha, hoyTexto)}</b>
          <span className="tele-hora">{proximo.hora}</span>
          <span className="tele-titulo">{titulo(proximo)}{proximo.tipo === 'partido' && proximo.evento ? (proximo.evento.casa === false ? ' · fuera' : ' · casa') : ''}</span>
        </div>
      ) : (
        <p className="tele-titulo">Aún no hay nada apuntado</p>
      )}
      {proximo?.tipo === 'partido' && proximo.evento?.plan && (
        <div className="tele-columnas"><div><h2>Plan de partido</h2><p>{proximo.evento.plan}</p></div></div>
      )}
      {semana.length > 0 && (
        <ul className="tele-semana">
          {semana.map((i) => <li key={i.clave}><span>{DIAS[diaSemana(i.fecha)]} {Number(i.fecha.slice(8))}</span> {titulo(i)} <i>{i.hora}</i></li>)}
        </ul>
      )}
      {(fuertes.length > 0 || flojas.length > 0) && (
        <div className="tele-columnas">
          <div><h2>Nuestras virtudes</h2><ul>{fuertes.map((h) => <li key={h.id} className="bien">{h.nombre}</li>)}</ul></div>
          <div><h2>A trabajar</h2><ul>{flojas.map((h) => <li key={h.id} className="mal">{h.nombre}</li>)}</ul></div>
        </div>
      )}
      {hs.filter((h) => h.nivel !== undefined).length >= 3 && <div className="tele-radar"><Radar habilidades={hs} /></div>}
    </div>
  );
}

export function Tele({ verDia, abrirSesion }: { verDia: (fecha: string) => void; abrirSesion: (id: string) => void }) {
  const [tele, setTele] = useState(false);
  const equipo = leerEquipoActivo();
  if (!equipo) return null;
  const { hoyTexto, proximo, js, fuertes, flojas } = datos(equipo);
  const sesion = proximo?.sesionId ? leerSesiones().find((x) => x.id === proximo.sesionId) : undefined;
  const lesionadas = js.some((j) => j.lesion);
  return (
    <section className={`tele ${proximo?.tipo ?? ''}`} aria-label="Tele de equipo">
      <div className="tele-cabeza">
        <span className="rotulo">{equipo.nombre}</span>
        {lesionadas && <span className="chip pequeno">{disponibles(js)}/{js.length} disponibles</span>}
      </div>
      {proximo ? (
        <>
          <div className="cuando"><b>{cuando(proximo.fecha, hoyTexto)}</b><span className="hora">{proximo.hora}</span></div>
          <b className="titulo-sig">{titulo(proximo)}</b>
          <span className="meta">
            {proximo.tipo === 'partido' && proximo.evento ? (proximo.evento.casa === false ? 'Fuera' : 'En casa') : 'Entreno'}
            {proximo.evento?.lugar ? ` · ${proximo.evento.lugar}` : ''}
          </span>
        </>
      ) : (
        <>
          <b className="titulo-sig">Aún no hay nada apuntado</b>
          <span className="meta">Apunta tus entrenos y partidos y aquí verás siempre el próximo.</span>
        </>
      )}
      {(fuertes.length > 0 || flojas.length > 0) && (
        <div className="tele-chips" aria-label="El equipo de un vistazo">
          {fuertes.slice(0, MAX_CHIPS).map((h) => <span key={h.id} className="et bien">{h.nombre}</span>)}
          {flojas.slice(0, MAX_CHIPS).map((h) => <span key={h.id} className="et mal">{h.nombre}</span>)}
        </div>
      )}
      <div className="tele-botones">
        {proximo && (sesion
          ? <button className="accion-sig" onClick={() => abrirSesion(sesion.id)}>Abrir sesión: {sesion.nombre}</button>
          : <button className="accion-sig suave" onClick={() => verDia(proximo.fecha)}>Ver el día</button>)}
        <button className="accion-sig suave" onClick={() => setTele(true)}>Modo tele</button>
      </div>
      {tele && <ModoTele equipo={equipo} cerrar={() => setTele(false)} />}
    </section>
  );
}
