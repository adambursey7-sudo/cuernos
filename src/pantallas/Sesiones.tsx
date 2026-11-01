// Sesiones, opción B · Línea de tiempo (elegida por Adam el 29/10): los ejercicios en orden, cada uno con su color por tipo
// y una altura que sigue a sus minutos. Se guardan por equipo (categoría, sin nombres) solo en este móvil.
import { PLANTILLAS, desdePlantilla, type Plantilla } from '../sesiones/plantillas';
import { useEffect, useRef, useState } from 'react';
import { INTENSIDADES, cargaSesion, intensidadDe, intensidadMedia, materialDeSesion, moverBloqueA, nombreIntensidad } from '../sesiones/plan';
import { TIPOS, buscarEjercicio, filtrar, todosLosEjercicios, type Ejercicio } from '../ejercicios/ejercicios';
import { MiniPizarra } from '../pizarra/MiniPizarra';
import { Pista } from '../pizarra/Pista';
import { buscarSistema } from '../sistemas/almacen';
import { fichaDeBloque, idBloqueFicha, leerFichas, type Ficha } from '../recursos/fichas';
import { Entrenando, crearAudio } from './Entrenando';
import { useAvisoDeshacer } from '../ui/Toast';
import {
  DURACIONES, PASO_MINUTOS, bloqueDe, conMinutos, conTipo, diferencia, guardarSesiones, huerfanos, inicios, leerSesiones, mover, nuevaSesion, quitar,
  reparto, sesionesDe, total, tituloBloque, type Sesion,
} from '../sesiones/sesiones';
import { leerDiario } from '../diario/diario';
import { leerEquipoActivo } from '../equipo/equipos';

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

function Selector({ elegir, elegirFicha, cerrar }: { elegir: (e: Ejercicio) => void; elegirFicha: (f: Ficha) => void; cerrar: () => void }) {
  const todos = todosLosEjercicios();
  const fichas = leerFichas();
  const [propios, setPropios] = useState(false);
  const [sistema, setSistema] = useState<string | undefined>();
  const sistemas = [...new Map(todos.map((e) => [e.sistema.id, e.sistema.nombre])).entries()];
  const lista = propios ? [] : filtrar(todos, { sistema });
  return (
    <div className="selector" role="dialog" aria-label="Añadir un ejercicio">
      <div className="cabecera">
        <button className="atras" onClick={cerrar} aria-label="Cerrar">‹</button>
        <h2 className="nombre-sistema">Añadir ejercicio</h2>
      </div>
      <div className="niveles filtro" role="group" aria-label="Sistema">
        <button className={sistema || propios ? 'chip' : 'chip on'} aria-pressed={!sistema && !propios} onClick={() => { setSistema(undefined); setPropios(false); }}>Todos</button>
        {fichas.length > 0 && <button className={propios ? 'chip on' : 'chip'} aria-pressed={propios} onClick={() => setPropios(!propios)}>Mis ejercicios</button>}
        {sistemas.map(([id, nombre]) => (
          <button key={id} className={id === sistema ? 'chip on' : 'chip'} aria-pressed={id === sistema} onClick={() => { setPropios(false); setSistema(id === sistema ? undefined : id); }}>{nombre}</button>
        ))}
      </div>
      <ul className="lista">
        {(propios || !sistema) && fichas.map((f) => (
          <li key={f.id}>
            <button className="tarjeta tarjeta-ejercicio" onClick={() => elegirFicha(f)}>
              {f.sistemaId && buscarSistema(f.sistemaId) && <MiniPizarra sistema={buscarSistema(f.sistemaId)!} />}
              <span className="datos">
                <span className="formato">Mis ejercicios</span>
                <span className="texto-ejercicio">{f.nombre}</span>
                <span className="meta">{[f.coleccion, f.categoria, `${f.minutos || 10}′`].filter(Boolean).join(' · ')}</span>
              </span>
            </button>
          </li>
        ))}
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

function Editor({ s, cambiar, volver, abrirEjercicio, arranque, gastado }: {
  s: Sesion; cambiar: (s: Sesion) => void; volver: () => void; abrirEjercicio: (id: string) => void;
  arranque: ReturnType<typeof crearAudio> | null; gastado: () => void;
}) {
  const [anadiendo, setAnadiendo] = useState(false);
  // Si llega un audio ya creado (botón Cronómetro de Inicio), el cronómetro arranca directamente.
  const [cronometro, setCronometro] = useState<ReturnType<typeof crearAudio> | false>(arranque ?? false);
  useEffect(() => { if (arranque) gastado(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const { avisar, aviso } = useAvisoDeshacer();
  // La sesión tal como está en el momento de deshacer: así solo vuelve el ejercicio quitado y no se pisan otros cambios.
  const ultima = useRef(s);
  ultima.current = s;
  const desde = inicios(s);
  const perdidos = huerfanos(s);
  // Reordenar arrastrando el asa de un bloque hasta otro.
  const arrastre = useRef<{ de: number; activo: boolean; x: number; y: number } | null>(null);
  const [sobre, setSobre] = useState<number | null>(null);
  const blancoDe = (x: number, y: number) => {
    const el = (document.elementFromPoint(x, y) as HTMLElement | null)?.closest<HTMLElement>('[data-bloque]');
    return el ? Number(el.dataset.bloque) : null;
  };
  const material = materialDeSesion(s, (id) => buscarEjercicio(id)?.material ?? fichaDeBloque(id)?.material.split(',') ?? []);
  const media = intensidadMedia(s);

  if (cronometro !== false) return <Entrenando s={s} audio={cronometro} salir={() => { cronometro?.close().catch(() => {}); setCronometro(false); }} />;

  if (anadiendo)
    return (
      <Selector
        cerrar={() => setAnadiendo(false)}
        elegir={(e) => { cambiar({ ...s, bloques: [...s.bloques, bloqueDe(e.id, e.minutos, e.tipo)] }); setAnadiendo(false); }}
        elegirFicha={(f) => { cambiar({ ...s, bloques: [...s.bloques, bloqueDe(idBloqueFicha(f), f.minutos || 10, 'tecnica')] }); setAnadiendo(false); }}
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
      {media !== undefined && (
        <dl className="resumen-sesion" aria-label="Resumen de la sesión">
          <div><dt>Intensidad</dt><dd>{nombreIntensidad(media)}</dd></div>
          <div><dt>Carga</dt><dd>{cargaSesion(s)} u</dd></div>
          <div><dt>Bloques</dt><dd>{s.bloques.length}</dd></div>
        </dl>
      )}
      <div className="dos-botones">
        <label className="campo-diario"><span>Pista</span><input value={s.pista ?? ''} maxLength={60} placeholder="Pista 1" onChange={(ev) => cambiar({ ...s, pista: ev.target.value || undefined })} /></label>
        <label className="campo-diario"><span>Material extra</span><input value={s.material ?? ''} maxLength={200} placeholder="Petos, cronómetro" onChange={(ev) => cambiar({ ...s, material: ev.target.value || undefined })} /></label>
      </div>
      {material.length > 0 && <p className="meta"><b>Material:</b> {material.join(' · ')}</p>}
      {perdidos > 0 && <p className="aviso">{perdidos === 1 ? 'Un ejercicio ya no existe' : `${perdidos} ejercicios ya no existen`} (era de una jugada que borraste): quítalo{perdidos === 1 ? '' : 's'}.</p>}

      {s.bloques.length === 0 ? (
        <p className="vacio">Aún no hay ejercicios. Añade el primero: el calentamiento suele ir arriba.</p>
      ) : (
        <ol className="linea">
          {s.bloques.map((b, i) => {
            const e = buscarEjercicio(b.ejercicio);
            const titulo = tituloBloque(b.ejercicio);
            return (
              <li key={i} data-bloque={i} className={`bloque tipo-${b.tipo}${sobre === i ? ' sobre' : ''}`} style={{ minHeight: `${Math.max(76, b.minutos * 4)}px` }}>
                <span className="hora">{horas(desde[i])}</span>
                <div className="cuerpo">
                  {e ? (
                    <button className="titulo-bloque" onClick={() => abrirEjercicio(e.id)}>
                      {e.formato && <span className="formato">{e.formato}</span>} {e.nombre}
                    </button>
                  ) : titulo ? (
                    <span className="titulo-bloque">{titulo}</span>
                  ) : (
                    <span className="titulo-bloque perdido">Ejercicio que ya no existe</span>
                  )}
                  <div className="fila-chips">
                    <button className="chip" onClick={() => cambiar(conMinutos(s, i, b.minutos - PASO_MINUTOS))} aria-label="Cinco minutos menos">−5</button>
                    <b className="minutos">{b.minutos}′</b>
                    <button className="chip" onClick={() => cambiar(conMinutos(s, i, b.minutos + PASO_MINUTOS))} aria-label="Cinco minutos más">+5</button>
                    <button className="chip asa" aria-label="Arrastrar para cambiar de sitio" style={{ touchAction: 'none' }}
                      onPointerDown={(ev) => { ev.currentTarget.setPointerCapture(ev.pointerId); arrastre.current = { de: i, activo: false, x: ev.clientX, y: ev.clientY }; }}
                      onPointerMove={(ev) => { const a = arrastre.current; if (!a) return; if (!a.activo && Math.hypot(ev.clientX - a.x, ev.clientY - a.y) > 8) a.activo = true; if (a.activo) setSobre(blancoDe(ev.clientX, ev.clientY)); }}
                      onPointerUp={(ev) => { const a = arrastre.current; arrastre.current = null; setSobre(null); if (a?.activo) { const a2 = blancoDe(ev.clientX, ev.clientY); if (a2 !== null) cambiar(moverBloqueA(s, a.de, a2)); } }}
                      onPointerCancel={() => { arrastre.current = null; setSobre(null); }}>≡</button>
                    <button className="chip" onClick={() => cambiar(mover(s, i, -1))} disabled={i === 0} aria-label="Subir">▲</button>
                    <button className="chip" onClick={() => cambiar(mover(s, i, 1))} disabled={i === s.bloques.length - 1} aria-label="Bajar">▼</button>
                    <button className="chip" onClick={() => { const quitado = b; const pos = i; cambiar(quitar(s, i)); avisar('Ejercicio quitado', () => { const hoy = ultima.current; const bloques = [...hoy.bloques]; bloques.splice(Math.min(pos, bloques.length), 0, quitado); cambiar({ ...hoy, bloques }); }); }} aria-label="Quitar de la sesión">✕</button>
                  </div>
                  <input className="objetivo-bloque" value={b.objetivo ?? ''} maxLength={80} placeholder="Objetivo de este bloque" aria-label="Objetivo del bloque" onChange={(ev) => cambiar({ ...s, bloques: s.bloques.map((x, j) => (j === i ? { ...x, objetivo: ev.target.value || undefined } : x)) })} />
                  <div className="fila-chips" role="group" aria-label="Intensidad">
                    {INTENSIDADES.map(([n, nombre]) => (
                      <button key={n} className={intensidadDe(b) === n ? 'chip pequeno on' : 'chip pequeno'} aria-pressed={intensidadDe(b) === n} onClick={() => cambiar({ ...s, bloques: s.bloques.map((x, j) => (j === i ? { ...x, intensidad: n } : x)) })}>{nombre}</button>
                    ))}
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
      {aviso}
      {s.bloques.length > 0 && <button className="principal ancho empezar" onClick={() => setCronometro(crearAudio())}>▶ Empezar el entrenamiento</button>}
    </section>
  );
}

/** Los equipos con sesiones más los creados en Equipo. */

export function Sesiones({ abrirEjercicio, abierta, abrir: setAbierta, arranque = null, gastado = () => {} }: {
  abrirEjercicio: (id: string) => void; abierta: string | null; abrir: (id: string | null) => void;
  arranque?: ReturnType<typeof crearAudio> | null; gastado?: () => void;
}) {
  const [todas, setTodas] = useState<Sesion[]>(() => leerSesiones());
  // Los equipos del diario van primero (el activo, elegido); detrás, nombres de sesiones antiguas sin equipo en el diario.
  const equiposDiario = leerDiario().equipos;
  const [equipo, setEquipo] = useState<string | undefined>(() => leerEquipoActivo()?.nombre ?? leerSesiones()[0]?.equipo);
  const [borrando, setBorrando] = useState<string | null>(null);
  const [nuevoEquipo, setNuevoEquipo] = useState('');
  const [fallo, setFallo] = useState(false);

  const poner = (lista: Sesion[]) => {
    setTodas(lista);
    setFallo(!guardarSesiones(lista));
  };
  const equipos = [...new Set([...equiposDiario.map((e) => e.nombre), ...todas.map((s) => s.equipo)])];
  const sesion = todas.find((s) => s.id === abierta);

  if (sesion)
    return (
      <Editor
        key={sesion.id}
        s={sesion}
        volver={() => setAbierta(null)}
        abrirEjercicio={abrirEjercicio}
        arranque={arranque}
        gastado={gastado}
        cambiar={(n) => poner(todas.map((x) => (x.id === n.id ? n : x)))}
      />
    );

  const crear = (nombreEquipo: string, plantilla?: Plantilla) => {
    const dueño = equiposDiario.find((e) => e.nombre === nombreEquipo);
    const base = plantilla ? desdePlantilla(plantilla, nombreEquipo) : nuevaSesion(nombreEquipo);
    const s = dueño ? { ...base, equipoId: dueño.id } : base;
    poner([...todas, s]);
    setEquipo(nombreEquipo);
    setAbierta(s.id);
  };
  const eqDiario = equiposDiario.find((e) => e.nombre === equipo);
  const delEquipo = eqDiario ? sesionesDe(todas, eqDiario) : todas.filter((s) => s.equipo === equipo);
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
                  {borrando === s.id ? (
                    <span className="fila-chips">
                      <button className="chip on" onClick={() => { poner(todas.filter((x) => x.id !== s.id)); setBorrando(null); }}>Sí, borrar</button>
                      <button className="chip" onClick={() => setBorrando(null)}>No</button>
                    </span>
                  ) : (
                    <button className="chip borrar" aria-label={`Borrar ${s.nombre}`} onClick={() => setBorrando(s.id)}>✕</button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <button className="principal ancho" onClick={() => crear(equipo)}>+ Nueva sesión de {equipo}</button>
          <div className="niveles filtro" role="group" aria-label="Plantillas">
            {PLANTILLAS.map((p) => (
              <button key={p.id} className="chip" title={p.idea} onClick={() => crear(equipo, p)}>+ {p.nombre}</button>
            ))}
          </div>
        </>
      )}

      <form
        className="nuevo-equipo"
        onSubmit={(ev) => {
          ev.preventDefault();
          if (nombreLimpio) { crear(nombreLimpio); setNuevoEquipo(''); }
        }}
      >
        <label htmlFor="equipo">{equipos.length ? 'Otro equipo' : 'Primero, ¿qué equipo entrenas? (o créalo en Equipo)'}</label>
        <div className="fila-chips">
          <input id="equipo" value={nuevoEquipo} maxLength={30} placeholder="Cadete femenino" onChange={(ev) => setNuevoEquipo(ev.target.value)} />
          <button className="chip on" disabled={!nombreLimpio}>Crear</button>
        </div>
        <p className="meta">Pon la categoría, no nombres de jugadores. Se guarda solo en este móvil.</p>
      </form>
    </section>
  );
}
