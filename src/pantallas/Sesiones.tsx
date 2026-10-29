// Sesiones, opción B · Línea de tiempo (elegida por Adam el 29/10): los ejercicios en orden, cada uno con su color por tipo
// y una altura que sigue a sus minutos. Se guardan por equipo (categoría, sin nombres) solo en este móvil.
import { useState } from 'react';
import { TIPOS, buscarEjercicio, filtrar, todosLosEjercicios, type Ejercicio } from '../ejercicios/ejercicios';
import { Pista } from '../pizarra/Pista';
import { Entrenando, crearAudio } from './Entrenando';
import {
  DURACIONES, PASO_MINUTOS, bloqueDe, conMinutos, conTipo, diferencia, guardarSesiones, huerfanos, inicios, leerSesiones, mover, nuevaSesion, quitar,
  reparto, total, type Sesion,
} from '../sesiones/sesiones';

/** «1 h 15 min», «45 min». */
export function horas(m: number): string {
  const h = Math.floor(Math.abs(m) / 60);
  const r = Math.abs(m) % 60;
  return h ? `${h} h${r ? ` ${r} min` : ''}` : `${r} min`;
}

function Reparto({ s }: { s: Sesion }) {
  const t = total(s);
  if (t === 0) return <div className="reparto vacia" aria-hidden />;
  return (
    <div className="reparto" role="img" aria-label={reparto(s).map((r) => `${r.nombre} ${r.minutos} minutos`).join(', ')}>
      {reparto(s).map((r) => <span key={r.id} className={`tipo-${r.id}`} style={{ flexGrow: r.minutos }} />)}
    </div>
  );
}

function Estado({ s }: { s: Sesion }) {
  const d = diferencia(s);
  const clase = d < 0 ? 'estado pasa' : d === 0 ? 'estado justo' : 'estado';
  return (
    <p className={clase} aria-live="polite">
      <b>{horas(total(s))}</b> de {horas(s.duracion)} ·{' '}
      {d < 0 ? `te pasas ${horas(d)}` : d === 0 ? 'justo' : `quedan ${horas(d)}`}
    </p>
  );
}

function Selector({ elegir, cerrar }: { elegir: (e: Ejercicio) => void; cerrar: () => void }) {
  const todos = todosLosEjercicios();
  const [sistema, setSistema] = useState<string | undefined>();
  const sistemas = [...new Map(todos.map((e) => [e.sistema.id, e.sistema.nombre])).entries()];
  const lista = filtrar(todos, { sistema });
  return (
    <div className="selector" role="dialog" aria-label="Añadir un ejercicio">
      <div className="cabecera">
        <button className="atras" onClick={cerrar} aria-label="Cerrar">‹</button>
        <h2 className="nombre-sistema">Añadir ejercicio</h2>
      </div>
      <div className="niveles filtro" role="group" aria-label="Sistema">
        <button className={sistema ? 'chip' : 'chip on'} aria-pressed={!sistema} onClick={() => setSistema(undefined)}>Todos</button>
        {sistemas.map(([id, nombre]) => (
          <button key={id} className={id === sistema ? 'chip on' : 'chip'} aria-pressed={id === sistema} onClick={() => setSistema(id === sistema ? undefined : id)}>{nombre}</button>
        ))}
      </div>
      <ul className="lista">
        {lista.map((e) => (
          <li key={e.id}>
            <button className="tarjeta tarjeta-ejercicio" onClick={() => elegir(e)}>
              <span className="mini"><Pista sistema={e.pizarra ?? e.sistema} t={e.pizarra ? e.pizarra.pasos.length : 0} /></span>
              <span className="datos">
                <span className="formato">{e.formato || 'Ejercicio'}</span>
                <span className="texto-ejercicio">{e.nombre}</span>
                <span className="meta">{e.sistema.nombre} · {e.minutos}′</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Editor({ s, cambiar, volver, abrirEjercicio }: { s: Sesion; cambiar: (s: Sesion) => void; volver: () => void; abrirEjercicio: (id: string) => void }) {
  const [anadiendo, setAnadiendo] = useState(false);
  const [cronometro, setCronometro] = useState<ReturnType<typeof crearAudio> | false>(false);
  const desde = inicios(s);
  const perdidos = huerfanos(s);

  if (cronometro !== false) return <Entrenando s={s} audio={cronometro} salir={() => { cronometro?.close().catch(() => {}); setCronometro(false); }} />;

  if (anadiendo)
    return (
      <Selector
        cerrar={() => setAnadiendo(false)}
        elegir={(e) => { cambiar({ ...s, bloques: [...s.bloques, bloqueDe(e.id, e.minutos, e.tipo)] }); setAnadiendo(false); }}
      />
    );

  return (
    <section className="pantalla sesion">
      <div className="cabecera">
        <button className="atras" onClick={volver} aria-label="Volver a las sesiones">‹</button>
        <input className="nombre-sesion" value={s.nombre} maxLength={40} aria-label="Nombre de la sesión" onChange={(ev) => cambiar({ ...s, nombre: ev.target.value })} />
      </div>
      <p className="meta">{s.equipo}</p>
      <div className="niveles filtro" role="group" aria-label="Duración prevista">
        {DURACIONES.map((d) => (
          <button key={d} className={d === s.duracion ? 'chip on' : 'chip'} aria-pressed={d === s.duracion} onClick={() => cambiar({ ...s, duracion: d })}>{horas(d)}</button>
        ))}
      </div>
      <Estado s={s} />
      <Reparto s={s} />
      {perdidos > 0 && <p className="aviso">{perdidos === 1 ? 'Un ejercicio ya no existe' : `${perdidos} ejercicios ya no existen`} (era de una jugada que borraste): quítalo{perdidos === 1 ? '' : 's'}.</p>}

      {s.bloques.length === 0 ? (
        <p className="vacio">Aún no hay ejercicios. Añade el primero: el calentamiento suele ir arriba.</p>
      ) : (
        <ol className="linea">
          {s.bloques.map((b, i) => {
            const e = buscarEjercicio(b.ejercicio);
            return (
              <li key={i} className={`bloque tipo-${b.tipo}`} style={{ minHeight: `${Math.max(76, b.minutos * 4)}px` }}>
                <span className="hora">{horas(desde[i])}</span>
                <div className="cuerpo">
                  {e ? (
                    <button className="titulo-bloque" onClick={() => abrirEjercicio(e.id)}>
                      {e.formato && <span className="formato">{e.formato}</span>} {e.nombre}
                    </button>
                  ) : (
                    <span className="titulo-bloque perdido">Ejercicio que ya no existe</span>
                  )}
                  <div className="fila-chips">
                    <button className="chip" onClick={() => cambiar(conMinutos(s, i, b.minutos - PASO_MINUTOS))} aria-label="Cinco minutos menos">−5</button>
                    <b className="minutos">{b.minutos}′</b>
                    <button className="chip" onClick={() => cambiar(conMinutos(s, i, b.minutos + PASO_MINUTOS))} aria-label="Cinco minutos más">+5</button>
                    <button className="chip" onClick={() => cambiar(mover(s, i, -1))} disabled={i === 0} aria-label="Subir">▲</button>
                    <button className="chip" onClick={() => cambiar(mover(s, i, 1))} disabled={i === s.bloques.length - 1} aria-label="Bajar">▼</button>
                    <button className="chip" onClick={() => cambiar(quitar(s, i))} aria-label="Quitar de la sesión">✕</button>
                  </div>
                  <div className="fila-chips tipos" role="group" aria-label="Tipo de ejercicio">
                    {TIPOS.map((t) => (
                      <button key={t.id} className={t.id === b.tipo ? `chip pequeno on tipo-${t.id}` : 'chip pequeno'} aria-pressed={t.id === b.tipo} onClick={() => cambiar(conTipo(s, i, t.id))}>{t.nombre}</button>
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <button className="principal ancho" onClick={() => setAnadiendo(true)}>+ Añadir ejercicio</button>
      {s.bloques.length > 0 && <button className="principal ancho empezar" onClick={() => setCronometro(crearAudio())}>▶ Empezar el entrenamiento</button>}
    </section>
  );
}

export function Sesiones({ abrirEjercicio, abierta, abrir: setAbierta }: { abrirEjercicio: (id: string) => void; abierta: string | null; abrir: (id: string | null) => void }) {
  const [todas, setTodas] = useState<Sesion[]>(() => leerSesiones());
  const [equipo, setEquipo] = useState<string | undefined>(() => leerSesiones()[0]?.equipo);
  const [nuevoEquipo, setNuevoEquipo] = useState('');
  const [fallo, setFallo] = useState(false);

  const poner = (lista: Sesion[]) => {
    setTodas(lista);
    setFallo(!guardarSesiones(lista));
  };
  const equipos = [...new Set(todas.map((s) => s.equipo))];
  const sesion = todas.find((s) => s.id === abierta);

  if (sesion)
    return (
      <Editor
        key={sesion.id}
        s={sesion}
        volver={() => setAbierta(null)}
        abrirEjercicio={abrirEjercicio}
        cambiar={(n) => poner(todas.map((x) => (x.id === n.id ? n : x)))}
      />
    );

  const crear = (nombreEquipo: string) => {
    const s = nuevaSesion(nombreEquipo);
    poner([...todas, s]);
    setEquipo(nombreEquipo);
    setAbierta(s.id);
  };
  const delEquipo = todas.filter((s) => s.equipo === equipo);
  const nombreLimpio = nuevoEquipo.trim().slice(0, 30);

  return (
    <section className="pantalla">
      <h1 className="titulo">Sesiones</h1>
      {fallo && <p className="aviso">Este móvil no deja guardar: las sesiones se perderán al cerrar la app.</p>}

      {equipos.length > 0 && (
        <div className="niveles filtro" role="group" aria-label="Equipo">
          {equipos.map((q) => (
            <button key={q} className={q === equipo ? 'chip on' : 'chip'} aria-pressed={q === equipo} onClick={() => setEquipo(q)}>{q}</button>
          ))}
        </div>
      )}

      {equipo && (
        <>
          {delEquipo.length === 0 ? (
            <p className="vacio">Este equipo aún no tiene sesiones.</p>
          ) : (
            <ul className="lista">
              {delEquipo.map((s) => (
                <li key={s.id} className="tarjeta-sesion">
                  <button className="tarjeta sesion-resumen" onClick={() => setAbierta(s.id)}>
                    <span className="texto-ejercicio">{s.nombre}</span>
                    <span className="meta">{s.bloques.length} {s.bloques.length === 1 ? 'ejercicio' : 'ejercicios'} · {horas(total(s))} de {horas(s.duracion)}</span>
                    <Reparto s={s} />
                  </button>
                  <button className="chip borrar" aria-label={`Borrar ${s.nombre}`} onClick={() => poner(todas.filter((x) => x.id !== s.id))}>✕</button>
                </li>
              ))}
            </ul>
          )}
          <button className="principal ancho" onClick={() => crear(equipo)}>+ Nueva sesión de {equipo}</button>
        </>
      )}

      <form
        className="nuevo-equipo"
        onSubmit={(ev) => {
          ev.preventDefault();
          if (nombreLimpio) { crear(nombreLimpio); setNuevoEquipo(''); }
        }}
      >
        <label htmlFor="equipo">{equipos.length ? 'Otro equipo' : 'Primero, ¿qué equipo entrenas?'}</label>
        <div className="fila-chips">
          <input id="equipo" value={nuevoEquipo} maxLength={30} placeholder="Cadete femenino" onChange={(ev) => setNuevoEquipo(ev.target.value)} />
          <button className="chip on" disabled={!nombreLimpio}>Crear</button>
        </div>
        <p className="meta">Pon la categoría, no nombres de jugadores. Se guarda solo en este móvil.</p>
      </form>
    </section>
  );
}
