// Inicio de club (interfaz C, elegida por Adam el 29/10): «Seguir donde lo dejaste» y colecciones que se deslizan de lado.
import type { ReactNode } from 'react';
import { usuarioActual } from '../Acceso';
import { IconoBiblioteca, IconoCronometro } from '../Iconos';
import { Pista } from '../pizarra/Pista';
import { crearAudio } from './Entrenando';
import { todosLosEjercicios } from '../ejercicios/ejercicios';
import { buscarSistema, todosLosSistemas } from '../sistemas/almacen';
import type { Sistema } from '../sistemas/tipos';
import { leerUltima } from '../ultima';
import { hoy, leerDiario } from '../diario/diario';
import { leerSesiones } from '../sesiones/sesiones';
import { DIAS, diaSemana, lunesDe, sumarDias } from '../temporada/fechas';
import { cuando, siguiente } from '../temporada/siguiente';
import { agendaDia, leerTemporadas, temporadaDe } from '../temporada/temporada';
import { Tele } from './Tele';

/** «Esta semana» (lunes a domingo) del primer equipo, con sus partidos y entrenos. Al tocar un día se abre en Equipo → Temporada. */
function EstaSemana({ verDia, abrirSesion }: { verDia: (fecha: string) => void; abrirSesion: (id: string) => void }) {
  const equipo = leerDiario().equipos[0];
  const t = equipo ? temporadaDe(leerTemporadas(), equipo.id) : undefined;
  if (!equipo || !t) return null;
  const hoyTexto = hoy();
  const lunes = lunesDe(hoyTexto);
  const sesiones = leerSesiones();
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i)).map((fecha) => ({ fecha, items: agendaDia(t, fecha).filter((i) => !i.cancelado) }));
  const con = dias.filter((d) => d.items.length);
  return (
    <section className="coleccion semana" aria-label="Esta semana">
      <div className="coleccion-cabeza">
        <h2 className="sub">Esta semana</h2>
        <button className="ver-todas" onClick={() => verDia(hoyTexto)}>Ver mes</button>
      </div>
      {con.length === 0 && <p className="vacio">No hay nada apuntado esta semana.</p>}
      <ul className="lista">
        {con.flatMap((d) => d.items.map((i) => {
          const s = i.sesionId ? sesiones.find((x) => x.id === i.sesionId) : undefined;
          return (
            <li key={i.clave} className={`tp-semana ${i.tipo}${d.fecha < hoyTexto ? ' pasado' : ''}${d.fecha === hoyTexto ? ' hoy' : ''}`}>
              <button className="tp-item-boton" onClick={() => verDia(d.fecha)}>
                <span className="chip pequeno">{DIAS[diaSemana(d.fecha)]} {Number(d.fecha.slice(8))}</span>
                <span className="datos">
                  <b>{i.tipo === 'partido' ? `Partido · ${i.titulo || 'sin rival'}` : i.titulo || 'Entreno'}</b>
                  <span className="meta">{i.hora}{i.evento?.tipo === 'partido' ? (i.evento.casa === false ? ' · fuera' : ' · casa') : ''}</span>
                </span>
              </button>
              {s && <button className="chip pequeno" onClick={() => abrirSesion(s.id)}>Abrir sesión: {s.nombre} →</button>}
            </li>
          );
        }))}
      </ul>
    </section>
  );
}

/** «Lo siguiente»: el próximo partido o entreno, con su sesión a un toque. Si no hay nada, invita a apuntarlo. */
function LoSiguiente({ verDia, abrirSesion }: { verDia: (fecha: string) => void; abrirSesion: (id: string) => void }) {
  const hoyTexto = hoy();
  const equipo = leerDiario().equipos[0];
  const t = equipo ? temporadaDe(leerTemporadas(), equipo.id) : undefined;
  const ahora = new Date().toTimeString().slice(0, 5);
  const item = t ? siguiente(t, hoyTexto, ahora) : undefined;
  if (!item) {
    return (
      <section className="siguiente vacio-card" aria-label="Lo siguiente">
        <span className="rotulo">Lo siguiente</span>
        <b className="titulo-sig">Aún no hay nada apuntado</b>
        <span className="meta">Apunta tus entrenos y partidos y aquí verás siempre el próximo.</span>
        <button className="accion-sig" onClick={() => verDia(hoyTexto)}>{equipo ? 'Apuntar un entreno' : 'Crear mi equipo'}</button>
      </section>
    );
  }
  const sesion = item.sesionId ? leerSesiones().find((x) => x.id === item.sesionId) : undefined;
  const partido = item.tipo === 'partido';
  return (
    <section className={`siguiente ${item.tipo}`} aria-label="Lo siguiente">
      <span className="rotulo">Lo siguiente</span>
      <div className="cuando"><b>{cuando(item.fecha, hoyTexto)}</b><span className="hora">{item.hora}</span></div>
      <b className="titulo-sig">{partido ? `Partido · ${item.titulo || 'sin rival'}` : item.titulo || 'Entreno'}</b>
      <span className="meta">
        {partido && item.evento ? (item.evento.casa === false ? 'Fuera' : 'En casa') : equipo?.nombre}
        {item.evento?.lugar ? ` · ${item.evento.lugar}` : ''}
      </span>
      {sesion ? (
        <button className="accion-sig" onClick={() => abrirSesion(sesion.id)}>Abrir sesión: {sesion.nombre}</button>
      ) : (
        <button className="accion-sig suave" onClick={() => verDia(item.fecha)}>Ver el día</button>
      )}
    </section>
  );
}

function Coleccion({ titulo, verTodas, children }: { titulo: string; verTodas?: () => void; children: ReactNode }) {
  return (
    <section className="coleccion" aria-label={titulo}>
      <div className="coleccion-cabeza">
        <h2 className="sub">{titulo}</h2>
        {verTodas && <button className="ver-todas" onClick={verTodas}>Ver todas</button>}
      </div>
      <ul className="carrusel">{children}</ul>
    </section>
  );
}

function TarjetaJugada({ s, abrir }: { s: Sistema; abrir: () => void }) {
  return (
    <li>
      <button className="tarjeta-col" onClick={abrir}>
        <span className="mini"><Pista sistema={s} t={0} /></span>
        <span className="nombre">{s.nombre}</span>
        <span className="meta">{s.pasos.length} {s.pasos.length === 1 ? 'paso' : 'pasos'}{s.borrador ? ' · borrador' : ''}</span>
      </button>
    </li>
  );
}

/** La sesión con ejercicios que toca hoy en el primer equipo (si la hay): el cronómetro de pista la abre sin pasar por la lista. */
function sesionDeHoy(): string | undefined {
  const equipo = leerDiario().equipos[0];
  const t = equipo ? temporadaDe(leerTemporadas(), equipo.id) : undefined;
  if (!t) return undefined;
  const sesiones = leerSesiones();
  return agendaDia(t, hoy()).find((i) => !i.cancelado && i.sesionId && sesiones.some((s) => s.id === i.sesionId && s.bloques.length > 0))?.sesionId;
}

export function Inicio({ abrir, abrirEjercicio, crear, verTodas, verEjercicios, verDia, abrirSesion, verSesiones, empezarHoy }: {
  verSesiones: () => void;
  empezarHoy: (id: string, audio: ReturnType<typeof crearAudio>) => void;
  verDia: (fecha: string) => void;
  abrirSesion: (id: string) => void;
  abrir: (id: string, paso?: number) => void;
  abrirEjercicio: (id: string) => void;
  crear: () => void;
  verTodas: () => void;
  verEjercicios: () => void;
}) {
  const lista = todosLosSistemas();
  const mias = lista.filter((s) => s.propio);
  const libro = lista.filter((s) => !s.propio);
  const ataque = libro.filter((s) => s.tipo === 'ataque');
  const defensa = libro.filter((s) => s.tipo === 'defensa');
  const ejercicios = todosLosEjercicios().filter((e) => !e.sistema.propio);

  // Si la última jugada se borró, o es la primera vez, se propone empezar por la primera del libro.
  const ultima = leerUltima();
  const seguida = ultima ? buscarSistema(ultima.id) : undefined;
  const sigue = seguida ? { s: seguida, paso: Math.min(ultima!.paso, seguida.pasos.length - 1) } : lista[0] ? { s: lista[0], paso: 0 } : undefined;

  return (
    <section className="pantalla inicio">
      <h1 className="saludo">Coach {usuarioActual() ?? "Adam"}</h1>

      {leerDiario().equipos[0] ? <Tele verDia={verDia} abrirSesion={abrirSesion} /> : <LoSiguiente verDia={verDia} abrirSesion={abrirSesion} />}

      <div className="atajos">
        <button onClick={() => { const hoyId = sesionDeHoy(); if (hoyId) empezarHoy(hoyId, crearAudio()); else verSesiones(); }}><span className="burbuja-atajo"><IconoCronometro /></span>Cronómetro</button>
        <button onClick={crear}><span className="burbuja-atajo"><IconoBiblioteca /></span>Pizarra</button>
      </div>

      {sigue && (
        <button className="seguir" onClick={() => abrir(sigue.s.id, sigue.paso)}>
          <span className="mini"><Pista sistema={sigue.s} t={sigue.paso + 1} /></span>
          <span className="datos">
            <span className="rotulo">{seguida ? 'Seguir donde lo dejaste' : 'Para empezar'}</span>
            <span className="nombre">{sigue.s.nombre}</span>
            <span className="paso-de">Paso {sigue.paso + 1} de {sigue.s.pasos.length}</span>
          </span>
        </button>
      )}

      <EstaSemana verDia={verDia} abrirSesion={abrirSesion} />

      {mias.length === 0 ? (
        <button className="nueva-ancha" onClick={crear}>
          <span className="mas" aria-hidden="true">+</span>
          <span className="datos">
            <span className="nombre">Nueva jugada</span>
            <span className="meta">Dibújala con el dedo y se guarda en «Mis jugadas»</span>
          </span>
        </button>
      ) : (
        <Coleccion titulo="Mis jugadas" verTodas={verTodas}>
          <li>
            <button className="tarjeta-col nueva-col" onClick={crear}>
              <span className="mas" aria-hidden="true">+</span>
              <span className="nombre">Nueva jugada</span>
            </button>
          </li>
          {mias.map((s) => <TarjetaJugada key={s.id} s={s} abrir={() => abrir(s.id)} />)}
        </Coleccion>
      )}

      {ataque.length > 0 && (
        <Coleccion titulo="Ataque" verTodas={verTodas}>
          {ataque.map((s) => <TarjetaJugada key={s.id} s={s} abrir={() => abrir(s.id)} />)}
        </Coleccion>
      )}

      {defensa.length > 0 && (
        <Coleccion titulo="Defensa" verTodas={verTodas}>
          {defensa.map((s) => <TarjetaJugada key={s.id} s={s} abrir={() => abrir(s.id)} />)}
        </Coleccion>
      )}

      {ejercicios.length > 0 && (
        <Coleccion titulo="Ejercicios" verTodas={verEjercicios}>
          {ejercicios.map((e) => (
            <li key={e.id}>
              <button className="tarjeta-col ejercicio" onClick={() => abrirEjercicio(e.id)}>
                <span className="formato">{e.formato || '·'}</span>
                <span className="texto-ejercicio">{e.nombre}</span>
                <span className="meta">De {e.sistema.nombre}</span>
              </button>
            </li>
          ))}
        </Coleccion>
      )}
    </section>
  );
}
