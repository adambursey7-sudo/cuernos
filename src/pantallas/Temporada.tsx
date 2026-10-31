// Temporada y calendario (tramo 3 del loop Diario). Elegido por Adam el 30/10: vive dentro de Equipo; fases arriba, calendario del mes,
// hoja del día desde abajo (con «Abrir día» a pantalla completa), entrenos fijos de la semana, partidos sueltos o en lista y .ics.
import { useEffect, useMemo, useRef, useState } from 'react';
import { hoy, type Equipo, type Jugadora } from '../diario/diario';
import { palabras } from '../diario/tipo';
import { leerSesiones } from '../sesiones/sesiones';
import { DIAS, DIAS_LARGOS, corta, cuadriculaMes, mesDe, nombreMes, sumarMeses } from '../temporada/fechas';
import { escribirIcs } from '../temporada/ics';
import {
  ETIQUETAS_BIEN, ETIQUETAS_MAL, notasDelBalance,
  agendaDia, cambiarFijoDia, faseDe, guardarEvento, guardarFase, guardarFijo, guardarTemporada, guardarTemporadas, itemsParaIcs, leerTemporadas, marcasDia,
  nuevaFase, nuevaTemporada, nuevoEvento, nuevoFijo, ponerAsistencia, quitarEvento, quitarFase, quitarFijo, temporadaDe, temporadaPorDefecto,
  type Evento, type Fase, type Item, type Temporada as TemporadaDatos, type TipoEvento,
} from '../temporada/temporada';
import { ImportarCalendario } from './ImportarCalendario';
import { InformeRivalEditor } from './InformeRival';

const TIPOS: { id: TipoEvento; nombre: string }[] = [{ id: 'partido', nombre: 'Partido' }, { id: 'entreno', nombre: 'Entreno' }, { id: 'otro', nombre: 'Otro' }];
const NOMBRES_FASE = ['Pretemporada', 'Liga', 'Parón', 'Fase final'];
const MINUTOS = [45, 60, 75, 90, 120];
const colorFase = (i: number) => `hsl(${(i * 67 + 20) % 360} 55% 58%)`;

type Vista = 'mes' | 'fases' | 'fijos' | 'importar';

function Atras({ volver, titulo }: { volver: () => void; titulo: string }) {
  return (
    <div className="cabecera">
      <button className="atras" onClick={volver} aria-label="Volver al calendario">‹</button>
      <h2 className="nombre-sistema">{titulo}</h2>
    </div>
  );
}

function Entrada({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return <label className="campo-diario"><span>{etiqueta}</span>{children}</label>;
}

function EditorFase({ f, cambiar, borrar, volver }: { f: Fase; cambiar: (f: Fase) => void; borrar: () => void; volver: () => void }) {
  return (
    <section className="pantalla">
      <Atras volver={volver} titulo={f.nombre || 'Fase nueva'} />
      <div className="niveles filtro" role="group" aria-label="Nombres típicos">
        {NOMBRES_FASE.map((n) => <button key={n} className={f.nombre === n ? 'chip on' : 'chip'} onClick={() => cambiar({ ...f, nombre: n, sinEntreno: n === 'Parón' ? true : f.sinEntreno })}>{n}</button>)}
      </div>
      <Entrada etiqueta="Nombre"><input value={f.nombre} maxLength={40} onChange={(ev) => cambiar({ ...f, nombre: ev.target.value })} /></Entrada>
      <div className="dos-botones">
        <Entrada etiqueta="Desde"><input type="date" value={f.desde} onChange={(ev) => ev.target.value && cambiar({ ...f, desde: ev.target.value, hasta: f.hasta < ev.target.value ? ev.target.value : f.hasta })} /></Entrada>
        <Entrada etiqueta="Hasta"><input type="date" value={f.hasta} min={f.desde} onChange={(ev) => ev.target.value && cambiar({ ...f, hasta: ev.target.value })} /></Entrada>
      </div>
      <Entrada etiqueta="Objetivo"><textarea rows={2} value={f.objetivo} placeholder="Qué quieres conseguir en esta fase" onChange={(ev) => cambiar({ ...f, objetivo: ev.target.value })} /></Entrada>
      <Entrada etiqueta="Qué trabajar"><textarea rows={3} value={f.trabajar} placeholder="Defensa, transición…" onChange={(ev) => cambiar({ ...f, trabajar: ev.target.value })} /></Entrada>
      <label className="marca-linea"><input type="checkbox" checked={!!f.sinEntreno} onChange={(ev) => cambiar({ ...f, sinEntreno: ev.target.checked || undefined })} /> Sin entrenos (parón): no salen los entrenos fijos</label>
      <button className="chip" onClick={borrar}>Borrar fase</button>
    </section>
  );
}

function EditorFijos({ t, cambiar, volver }: { t: TemporadaDatos; cambiar: (t: TemporadaDatos) => void; volver: () => void }) {
  return (
    <section className="pantalla">
      <Atras volver={volver} titulo="Entrenos de cada semana" />
      <p className="meta">Se repiten toda la temporada. Los festivos y los parones los quitan solos; un día suelto se cancela o se cambia desde el calendario.</p>
      {t.fijos.length === 0 && <p className="vacio">Todavía no hay ninguno.</p>}
      <ul className="lista">
        {[...t.fijos].sort((a, b) => a.dia - b.dia || a.hora.localeCompare(b.hora)).map((f) => (
          <li key={f.id} className="tp-fijo">
            <select aria-label="Día" value={f.dia} onChange={(ev) => cambiar(guardarFijo(t, { ...f, dia: Number(ev.target.value) }))}>
              {DIAS_LARGOS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
            <input type="time" aria-label="Hora" value={f.hora} onChange={(ev) => ev.target.value && cambiar(guardarFijo(t, { ...f, hora: ev.target.value }))} />
            <select aria-label="Duración" value={f.minutos} onChange={(ev) => cambiar(guardarFijo(t, { ...f, minutos: Number(ev.target.value) }))}>
              {(MINUTOS.includes(f.minutos) ? MINUTOS : [...MINUTOS, f.minutos].sort((a, b) => a - b)).map((m) => <option key={m} value={m}>{m} min</option>)}
            </select>
            <button className="chip" aria-label="Quitar este entreno" onClick={() => cambiar(quitarFijo(t, f.id))}>✕</button>
          </li>
        ))}
      </ul>
      <button className="principal ancho" onClick={() => cambiar(guardarFijo(t, nuevoFijo(0)))}>＋ Entreno de la semana</button>
    </section>
  );
}

const alternarEn = (lista: string[] | undefined, x: string) => (lista?.includes(x) ? lista.filter((y) => y !== x) : [...(lista ?? []), x]);

function Hoja({ t, fecha, completa, alternar, cerrar, cambiar, abrirSesion, equipo, jugadoras, anotar }: {
  anotar: (notas: { id: string; texto: string }[]) => void; jugadoras: Jugadora[]; t: TemporadaDatos; fecha: string; completa: boolean; alternar: () => void; cerrar: () => void; cambiar: (t: TemporadaDatos) => void; abrirSesion: (id: string) => void; equipo: Equipo;
}) {
  const pal = palabras(equipo);
  const [edita, setEdita] = useState<string | null>(null);
  const [lista, setLista] = useState<string | null>(null);
  const items = agendaDia(t, fecha);
  const fase = faseDe(t, fecha);
  const sesiones = leerSesiones().filter((s) => s.equipo === equipo.nombre);
  const item = items.find((i) => i.clave === edita);

  const añadir = (tipo: TipoEvento) => {
    const e = nuevoEvento(fecha, tipo);
    cambiar(guardarEvento(t, e));
    setEdita(e.id);
  };
  // Un partido o un evento sin nombre no sirve: al cerrar el editor se tira.
  const cerrarEditor = () => {
    const e = item?.evento;
    if (e && e.tipo !== 'entreno' && !e.titulo.trim()) cambiar(quitarEvento(t, e.id));
    setEdita(null);
  };

  const selector = (valor: string | undefined, poner: (id: string | undefined) => void) => (
    <Entrada etiqueta="Sesión de entrenamiento">
      <select value={valor ?? ''} onChange={(ev) => poner(ev.target.value || undefined)}>
        <option value="">Ninguna</option>
        {sesiones.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        {valor && !sesiones.some((s) => s.id === valor) && <option value={valor}>(sesión de otro equipo o borrada)</option>}
      </select>
      {valor && sesiones.some((s) => s.id === valor) && <button className="chip pequeno" onClick={() => abrirSesion(valor)}>Abrir la sesión →</button>}
      {sesiones.length === 0 && <span className="meta">Aún no hay sesiones de {equipo.nombre}: créalas en la pestaña Sesiones.</span>}
    </Entrada>
  );

  const editor = (it: Item) => {
    const e = it.evento;
    if (!e) {
      // Entreno fijo en un día concreto.
      return (
        <div className="tp-editor">
          <h3 className="sub">Entreno de este día</h3>
          <Entrada etiqueta="Hora"><input type="time" value={it.hora} onChange={(ev) => ev.target.value && cambiar(cambiarFijoDia(t, it, { hora: ev.target.value === it.fijo?.hora ? undefined : ev.target.value }))} /></Entrada>
          {selector(it.sesionId, (id) => cambiar(cambiarFijoDia(t, it, { sesionId: id })))}
          <div className="dos-botones">
            <button className="secundario" onClick={() => { cambiar(cambiarFijoDia(t, it, { cancelado: !it.cancelado || undefined })); setEdita(null); }}>{it.cancelado ? 'Volver a ponerlo' : 'Cancelar este día'}</button>
            <button className="principal" onClick={() => setEdita(null)}>Hecho</button>
          </div>
        </div>
      );
    }
    const poner = (c: Partial<Evento>) => cambiar(guardarEvento(t, { ...e, ...c }));
    return (
      <div className="tp-editor">
        <div className="niveles filtro" role="group" aria-label="Qué es">
          {TIPOS.map((x) => <button key={x.id} className={e.tipo === x.id ? 'chip on' : 'chip'} aria-pressed={e.tipo === x.id} onClick={() => poner({ tipo: x.id, casa: x.id === 'partido' ? e.casa ?? true : undefined, libre: x.id === 'otro' ? e.libre : undefined })}>{x.nombre}</button>)}
        </div>
        <Entrada etiqueta={e.tipo === 'partido' ? 'Rival' : 'Nombre'}>
          <input value={e.titulo} maxLength={60} placeholder={e.tipo === 'partido' ? 'Ejemplo CB' : e.tipo === 'entreno' ? 'Entreno' : 'Festivo, reunión…'} onChange={(ev) => poner({ titulo: ev.target.value })} />
        </Entrada>
        <div className="dos-botones">
          <Entrada etiqueta="Hora"><input type="time" value={e.hora} onChange={(ev) => ev.target.value && poner({ hora: ev.target.value })} /></Entrada>
          <Entrada etiqueta="Fecha"><input type="date" value={e.fecha} onChange={(ev) => ev.target.value && poner({ fecha: ev.target.value })} /></Entrada>
        </div>
        {e.tipo === 'partido' && (
          <div className="niveles filtro" role="group" aria-label="Casa o fuera">
            <button className={e.casa !== false ? 'chip on' : 'chip'} aria-pressed={e.casa !== false} onClick={() => poner({ casa: true })}>Casa</button>
            <button className={e.casa === false ? 'chip on' : 'chip'} aria-pressed={e.casa === false} onClick={() => poner({ casa: false })}>Fuera</button>
          </div>
        )}
        <Entrada etiqueta="Pabellón o lugar"><input value={e.lugar} maxLength={60} placeholder="(opcional)" onChange={(ev) => poner({ lugar: ev.target.value })} /></Entrada>
        {e.tipo === 'otro' && <label className="marca-linea"><input type="checkbox" checked={!!e.libre} onChange={(ev) => poner({ libre: ev.target.checked || undefined })} /> Sin entreno ese día (festivo)</label>}
        {e.tipo !== 'otro' && selector(e.sesionId, (id) => poner({ sesionId: id }))}
        {e.tipo === 'partido' && <InformeRivalEditor e={e} eventos={t.eventos} equipo={equipo.nombre} poner={poner} enlazar={(id) => poner({ sesionId: id })} />}
        {e.tipo === 'partido' && (
          <>
            <div className="dos-botones">
              <Entrada etiqueta="Puntos nuestros"><input inputMode="numeric" value={e.resultado?.a ?? ''} onChange={(ev) => poner({ resultado: puntos(ev.target.value, e.resultado?.c) })} /></Entrada>
              <Entrada etiqueta="Puntos rival"><input inputMode="numeric" value={e.resultado?.c ?? ''} onChange={(ev) => poner({ resultado: puntos(e.resultado?.a, ev.target.value) })} /></Entrada>
            </div>
            <Entrada etiqueta="Qué funcionó">
              <div className="niveles filtro" role="group" aria-label="Qué funcionó">
                {ETIQUETAS_BIEN.map((x) => { const on = !!e.bien?.includes(x); return <button key={x} className={on ? 'chip on' : 'chip'} aria-pressed={on} onClick={() => poner({ bien: alternarEn(e.bien, x) })}>{x}</button>; })}
              </div>
            </Entrada>
            <Entrada etiqueta="Qué falló">
              <div className="niveles filtro" role="group" aria-label="Qué falló">
                {ETIQUETAS_MAL.map((x) => { const on = !!e.mal?.includes(x); return <button key={x} className={on ? 'chip on' : 'chip'} aria-pressed={on} onClick={() => poner({ mal: alternarEn(e.mal, x) })}>{x}</button>; })}
              </div>
            </Entrada>
            <Entrada etiqueta="A quién mirar">
              <div className="niveles filtro asis-chips" role="group" aria-label="A quién mirar">
                {jugadoras.map((j) => { const on = !!e.mirar?.includes(j.id); return <button key={j.id} className={on ? 'chip on' : 'chip'} aria-pressed={on} onClick={() => poner({ mirar: alternarEn(e.mirar, j.id) })}>{j.numero ? `#${j.numero} ` : ''}{j.nombre || 'Sin nombre'}</button>; })}
              </div>
            </Entrada>
            <Entrada etiqueta="Frase corta (opcional)">
              <input value={e.balance} maxLength={140} placeholder="Ejemplo: mucho mejor en defensa de balón" onChange={(ev) => poner({ balance: ev.target.value })} />
            </Entrada>
            {(() => {
              const pendientes = notasDelBalance(e, jugadoras.map((j) => j.id));
              const hechas = (e.mirar ?? []).filter((id) => e.pasadas?.includes(id)).length;
              return (
                <>
                  <button className="principal ancho" disabled={pendientes.length === 0} onClick={() => { anotar(pendientes); poner({ pasadas: [...new Set([...(e.pasadas ?? []), ...pendientes.map((n) => n.id)])] }); }}>
                    {pendientes.length ? `Pasar a las fichas (${pendientes.length})` : 'Pasar a las fichas'}
                  </button>
                  {hechas > 0 && <span className="meta">Ya está en la ficha de {hechas} {hechas === 1 ? pal.jugadora : pal.jugadoras}.</span>}
                </>
              );
            })()}
          </>
        )}
        <div className="dos-botones">
          <button className="secundario" onClick={() => { cambiar(quitarEvento(t, e.id)); setEdita(null); }}>Borrar</button>
          <button className="principal" onClick={cerrarEditor}>Hecho</button>
        </div>
      </div>
    );
  };

  return (
    <div className={completa || item ? 'tp-hoja completa' : 'tp-hoja'} role="dialog" aria-label={`Día ${corta(fecha)}`}>
      <div className="tp-hoja-cabeza">
        <h2 className="nombre-sistema">{corta(fecha)}</h2>
        {fase && <span className="et bien">{fase.nombre || 'Fase'}</span>}
        <button className="chip" onClick={alternar} aria-pressed={completa}>{completa ? 'Reducir' : 'Abrir día'}</button>
        <button className="chip" onClick={() => { cerrarEditor(); cerrar(); }} aria-label="Cerrar">✕</button>
      </div>
      {fase && (fase.objetivo || fase.trabajar) && <p className="meta">{[fase.objetivo && `Objetivo: ${fase.objetivo}`, fase.trabajar && `Trabajar: ${fase.trabajar}`].filter(Boolean).join(' · ')}</p>}
      {item ? editor(item) : (
        <>
          {items.length === 0 && <p className="vacio">Nada apuntado este día.</p>}
          <ul className="lista">
            {items.map((i) => {
              const s = i.sesionId ? sesiones.find((x) => x.id === i.sesionId) : undefined;
              const e = i.evento;
              return (
                <li key={i.clave} className={`tp-item ${i.tipo}${i.cancelado ? ' cancelado' : ''}`}>
                  <button className="tp-item-boton" onClick={() => setEdita(i.clave)}>
                    <span className="chip pequeno">{i.hora}</span>
                    <span className="datos">
                      <b>{i.tipo === 'partido' ? `Partido · ${i.titulo || 'sin rival'}` : i.titulo || (i.tipo === 'entreno' ? 'Entreno' : 'Evento')}</b>
                      <span className="meta">
                        {[e?.tipo === 'partido' && (e.casa === false ? 'Fuera' : 'Casa'), e?.resultado && `${e.resultado.a}–${e.resultado.c}`, e?.lugar, i.cancelado && 'cancelado', e?.libre && 'sin entreno'].filter(Boolean).join(' · ') || 'Toca para editar'}
                      </span>
                    </span>
                  </button>
                  {s && <button className="chip pequeno" onClick={() => abrirSesion(s.id)}>{i.tipo === 'partido' ? 'Antes' : 'Sesión'}: {s.nombre} →</button>}
                  {i.tipo === 'entreno' && !i.cancelado && jugadoras.length > 0 && (() => {
                    const vinieron = t.asistencia?.[i.clave];
                    const abierta = lista === i.clave;
                    const poner = (ids: string[] | null) => cambiar(ponerAsistencia(t, i.clave, ids));
                    return (
                      <div className="asistencia">
                        <button className="chip pequeno" aria-expanded={abierta} onClick={() => setLista(abierta ? null : i.clave)}>
                          Asistencia: {vinieron ? `${vinieron.length} de ${jugadoras.length}` : 'pasar lista'}
                        </button>
                        {abierta && (
                          <>
                            <div className="niveles filtro asis-chips" role="group" aria-label="Quién ha venido">
                              {jugadoras.map((j) => {
                                const esta = !!vinieron?.includes(j.id);
                                return <button key={j.id} className={esta ? 'chip on' : 'chip'} aria-pressed={esta} onClick={() => poner(esta ? (vinieron ?? []).filter((x) => x !== j.id) : [...(vinieron ?? []), j.id])}>{j.numero ? `#${j.numero} ` : ''}{j.nombre || 'Sin nombre'}</button>;
                              })}
                            </div>
                            <div className="dos-botones">
                              <button className="chip" onClick={() => poner(jugadoras.map((j) => j.id))}>{pal.todas}</button>
                              <button className="chip" onClick={() => poner(null)}>Borrar lista</button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()}
                  {e?.tipo === 'partido' && e.balance && completa && <p className="nota-jugadora">{e.balance}</p>}
                </li>
              );
            })}
          </ul>
          <div className="niveles filtro" role="group" aria-label="Añadir">
            {TIPOS.map((x) => <button key={x.id} className="chip" onClick={() => añadir(x.id)}>＋ {x.nombre}</button>)}
          </div>
        </>
      )}
    </div>
  );
}

function puntos(a: string | number | undefined, c: string | number | undefined): { a: number; c: number } | undefined {
  const n = (v: string | number | undefined) => (v === undefined || v === '' ? NaN : Number(String(v).replace(/\D/g, '')));
  const x = n(a);
  const y = n(c);
  if (Number.isNaN(x) && Number.isNaN(y)) return undefined;
  return { a: Number.isNaN(x) ? 0 : x, c: Number.isNaN(y) ? 0 : y };
}

export function Temporada({ equipo, jugadoras, fechaInicial, abrirSesion, anotar }: { equipo: Equipo; jugadoras: Jugadora[]; fechaInicial?: string; abrirSesion: (id: string) => void; anotar: (notas: { id: string; texto: string }[]) => void }) {
  const [lista, setLista] = useState<TemporadaDatos[]>(leerTemporadas);
  const [vista, setVista] = useState<Vista>('mes');
  const [mes, setMes] = useState(() => `${mesDe(fechaInicial ?? hoy())}-01`);
  const [dia, setDia] = useState<string | null>(fechaInicial ?? null);
  const [completa, setCompleta] = useState(false);
  const [faseId, setFaseId] = useState<string | null>(null);
  const [fallo, setFallo] = useState(false);
  const [rango, setRango] = useState(() => temporadaPorDefecto(hoy()));
  const primera = useRef(true);
  const t = temporadaDe(lista, equipo.id);
  const hoyTexto = hoy();

  useEffect(() => {
    if (primera.current) { primera.current = false; return; }
    setFallo(!guardarTemporadas(lista));
  }, [lista]);

  const cambiar = (n: TemporadaDatos) => setLista((l) => guardarTemporada(l, n));
  const marcas = useMemo(() => (t ? new Map(cuadriculaMes(mes).flat().filter((f): f is string => !!f).map((f) => [f, marcasDia(t, f)])) : new Map()), [t, mes]);

  if (!t)
    return (
      <section className="pantalla">
        <p className="vacio">Apunta aquí las fases de la temporada, los partidos y los entrenos de {equipo.nombre}. Se guarda solo en este móvil.</p>
        <div className="dos-botones">
          <Entrada etiqueta="Empieza"><input type="date" value={rango.inicio} onChange={(ev) => ev.target.value && setRango({ ...rango, inicio: ev.target.value, fin: rango.fin < ev.target.value ? ev.target.value : rango.fin })} /></Entrada>
          <Entrada etiqueta="Termina"><input type="date" value={rango.fin} min={rango.inicio} onChange={(ev) => ev.target.value && setRango({ ...rango, fin: ev.target.value })} /></Entrada>
        </div>
        <button className="principal ancho" onClick={() => cambiar(nuevaTemporada(equipo.id, rango.inicio, rango.fin))}>Crear la temporada</button>
      </section>
    );

  if (vista === 'fijos') return <EditorFijos t={t} cambiar={cambiar} volver={() => setVista('mes')} />;
  if (vista === 'importar') return <ImportarCalendario t={t} volver={() => setVista('mes')} guardar={(n) => { cambiar(n); setVista('mes'); }} />;
  const fase = faseId ? t.fases.find((f) => f.id === faseId) : undefined;
  if (vista === 'fases' && fase)
    return <EditorFase f={fase} cambiar={(f) => cambiar(guardarFase(t, f))} borrar={() => { cambiar(quitarFase(t, fase.id)); setFaseId(null); setVista('mes'); }} volver={() => { setFaseId(null); setVista('mes'); }} />;

  const exportar = () => {
    const texto = escribirIcs(equipo.nombre, itemsParaIcs(t));
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(new Blob([texto], { type: 'text/calendar' }));
    enlace.download = `horns-temporada-${t.inicio.slice(0, 4)}-${t.fin.slice(0, 4)}.ics`;
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(enlace.href), 60_000);
  };

  const total = Math.max(1, Date.parse(t.fin) - Date.parse(t.inicio));
  const faseHoy = faseDe(t, hoyTexto);
  const semanas = cuadriculaMes(mes);
  const nuevaFaseEnMes = () => {
    const f = nuevaFase(mes > t.inicio ? mes : t.inicio, t.fin);
    cambiar(guardarFase(t, f));
    setFaseId(f.id);
    setVista('fases');
  };

  return (
    <section className="pantalla tp">
      <h2 className="sub">Temporada {t.inicio.slice(2, 4)}/{t.fin.slice(2, 4)}</h2>
      {fallo && <p className="aviso">El móvil no deja guardar: libera espacio o haz una copia.</p>}
      {t.fases.length > 0 && (
        <div className="tp-fases" role="group" aria-label="Fases de la temporada">
          {t.fases.map((f, i) => (
            <button key={f.id} className="tp-fase" style={{ flexGrow: Math.max(1, Date.parse(f.hasta) - Date.parse(f.desde)) / total * 100, background: colorFase(i) }} onClick={() => { setFaseId(f.id); setVista('fases'); }}>
              {f.nombre || 'Fase'}
            </button>
          ))}
        </div>
      )}
      {faseHoy && <p className="meta"><b>{faseHoy.nombre || 'Fase'}</b>{faseHoy.objetivo ? ` · Objetivo: ${faseHoy.objetivo}` : ''}{faseHoy.trabajar ? ` · Trabajar: ${faseHoy.trabajar}` : ''}</p>}
      <div className="tp-mes">
        <button className="chip" onClick={() => setMes(sumarMeses(mes, -1))} aria-label="Mes anterior">‹</button>
        <h3>{nombreMes(mes)}</h3>
        <button className="chip" onClick={() => setMes(sumarMeses(mes, 1))} aria-label="Mes siguiente">›</button>
      </div>
      <div className="tp-cal" role="grid" aria-label={nombreMes(mes)}>
        {DIAS.map((d) => <span key={d} className="tp-dia-nombre">{d.slice(0, 1).toUpperCase()}</span>)}
        {semanas.flat().map((f, i) => {
          if (!f) return <span key={`h${i}`} />;
          const m = marcas.get(f);
          const cls = ['tp-celda', m?.partido && 'partido', m?.entreno && 'entreno', m?.otro && 'otro', f === hoyTexto && 'hoy', f === dia && 'sel', (f < t.inicio || f > t.fin) && 'fuera'].filter(Boolean).join(' ');
          return <button key={f} className={cls} onClick={() => setDia(f)} aria-label={corta(f)}>{Number(f.slice(8))}</button>;
        })}
      </div>
      <p className="mini-leyenda"><span className="punto partido" /> partido · <span className="punto entreno" /> entreno · <span className="punto otro" /> otro</p>
      <div className="dos-botones">
        <button className="secundario" onClick={nuevaFaseEnMes}>＋ Fase</button>
        <button className="secundario" onClick={() => setVista('fijos')}>Entrenos de la semana</button>
        <button className="secundario" onClick={() => setVista('importar')}>Importar lista o .ics</button>
        <button className="secundario" onClick={exportar}>Exportar .ics</button>
      </div>
      {dia && <div className="tp-hueco" aria-hidden />}
      {dia && (
        <Hoja
          key={dia}
          t={t}
          fecha={dia}
          completa={completa}
          alternar={() => setCompleta(!completa)}
          cerrar={() => { setDia(null); setCompleta(false); }}
          cambiar={cambiar}
          abrirSesion={abrirSesion}
          equipo={equipo}
          jugadoras={jugadoras}
          anotar={anotar}
        />
      )}
    </section>
  );
}
