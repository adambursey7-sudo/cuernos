// Partido en directo (loop Pro, tramo 3): marcador grande, reloj y cuartos, en pista con minutos y faltas, registro con un toque,
// cambios arrastrando (o tocando), deshacer siempre a mano, cronología y resumen final con lo mejor de cada apartado.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { leerDiario, plantilla, type Jugadora } from '../diario/diario';
import { leerEquipoActivo } from '../equipo/equipos';
import { reglasDe } from '../reglas/reglas';
import { totalPuntos } from '../temporada/directo';
import { guardarEvento, guardarTemporada, guardarTemporadas, leerTemporadas, temporadaDe, type Evento } from '../temporada/temporada';
import { tocar } from '../ui/tacto';
import { MapaTiros, PanelMapa } from './MapaTiros';
import { esTriple, tirosDeVivo } from './mapa';
import {
  CATEGORIAS, TEXTO, TIEMPOS_MUERTOS, arrancar, boxScore, cambiar, cuartoSiguiente, deshacer, enBonus, estaFuera, faltasEquipo, mejores, minutos, nombreCuarto, nuevoVivo, parar,
  reabrir, registrar, reloj, restante, segundosCuarto, terminar, type Jugada, type Partido, type Tipo,
} from './vivo';

const nombreDe = (js: Jugadora[], id?: string) => js.find((j) => j.id === id);
const etiqueta = (j?: Jugadora) => (j ? `#${j.numero || '?'}` : '#?');

function inicial(e: Evento, roster: Jugadora[], duracion: number): Partido {
  const quinteto = (e.quinteto ?? []).filter((id) => roster.some((j) => j.id === id));
  const base = e.vivo ?? nuevoVivo(quinteto.length === 5 ? quinteto : roster.slice(0, 5).map((j) => j.id), duracion);
  // Si la plantilla cambió desde que se guardó (convocatoria, lesión), la pista se rehace con quien sigue disponible.
  const quedan = base.enPista.filter((id) => roster.some((j) => j.id === id));
  base.enPista = quedan.length < Math.min(5, roster.length) ? [...quedan, ...roster.filter((j) => !quedan.includes(j.id)).map((j) => j.id)].slice(0, 5) : quedan;
  return { directo: e.directo ?? {}, rival: e.resultado?.c ?? 0, vivo: base };
}

export function PartidoVivo({ eventoId, salir }: { eventoId: string; salir: () => void }) {
  const equipo = leerEquipoActivo();
  const reglas = reglasDe(equipo);
  const [datos] = useState(() => {
    const t = equipo ? temporadaDe(leerTemporadas(), equipo.id) : undefined;
    const e = t?.eventos.find((x) => x.id === eventoId);
    if (!equipo || !t || !e) return undefined;
    const todas = plantilla(leerDiario(), equipo.id);
    const convocadas = e.convocados?.length ? todas.filter((j) => e.convocados!.includes(j.id)) : todas;
    const roster = convocadas.filter((j) => !j.lesion || j.lesion.duda);
    return { e, roster };
  });
  const roster = datos?.roster ?? [];
  const [p, setP] = useState<Partido | null>(() => (datos ? inicial(datos.e, roster, reglas.minutos) : null));
  const [ahora, setAhora] = useState(() => Date.now());
  const [sel, setSel] = useState<string | null>(() => p?.vivo.enPista[0] ?? null);
  const [entrando, setEntrando] = useState<string | null>(null);
  const [vista, setVista] = useState<'juego' | 'cronologia' | 'resumen'>(() => (p?.vivo.fin ? 'resumen' : 'juego'));
  const [confirmaFin, setConfirmaFin] = useState(false);
  // «Marcar tiros»: al apuntar un tiro de campo se toca en la pista dónde fue (se recuerda la elección).
  const [marcar, setMarcar] = useState(() => { try { return localStorage.getItem('horns.marcarTiros') === '1'; } catch { return false; } });
  const [pendiente, setPendiente] = useState<Tipo | null>(null);
  const [aviso, setAviso] = useState('');
  const [pestanaRes, setPestanaRes] = useState<'stats' | 'mapa'>('stats');
  useEffect(() => { if (!aviso) return; const id = setTimeout(() => setAviso(''), 2500); return () => clearTimeout(id); }, [aviso]);
  const corriendo = !!p?.vivo.corre;

  // El partido se guarda en la temporada a los 0,3 segundos de cada jugada (y al salir): si se cierra la app, no se pierde nada.
  const pendienteGuardar = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!p || !datos) return;
    const guardar = () => {
    pendienteGuardar.current = null;
    const lista = leerTemporadas();
    const t = temporadaDe(lista, equipo!.id);
    if (!t) return;
    const vivo = p.vivo;
    const hay = vivo.cronologia.length > 0 || vivo.segundos > 0 || vivo.corre;
    if (!hay) return;
    guardarTemporadas(guardarTemporada(lista, guardarEvento(t, { ...datos.e, ...(t.eventos.find((x) => x.id === eventoId) ?? {}), directo: p.directo, resultado: { a: totalPuntos(p.directo), c: p.rival }, vivo })));
    };
    pendienteGuardar.current = guardar;
    const id = setTimeout(guardar, 300);
    return () => clearTimeout(id);
  }, [p, datos, equipo, eventoId]);
  useEffect(() => () => pendienteGuardar.current?.(), []);

  // Reloj: se repinta cada cuarto de segundo mientras corre y se para solo al acabar el cuarto.
  useEffect(() => {
    if (!corriendo) return;
    const id = setInterval(() => setAhora(Date.now()), 250);
    return () => clearInterval(id);
  }, [corriendo]);
  useEffect(() => {
    if (p?.vivo.corre && restante(p.vivo, ahora) === 0) setP((x) => (x ? { ...x, vivo: parar(x.vivo, Date.now()) } : x));
  }, [ahora, p]);

  // La pantalla no se apaga mientras se juega.
  useEffect(() => {
    let cerrojo: { release: () => Promise<void> } | undefined;
    let cerrado = false;
    (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request('screen')
      .then((c) => { if (cerrado) void c.release().catch(() => undefined); else cerrojo = c; })
      .catch(() => undefined);
    return () => { cerrado = true; void cerrojo?.release().catch(() => undefined); };
  }, []);

  const hacer = useCallback((j: Omit<Jugada, 'n' | 'c' | 's'>) => { tocar(); setP((x) => (x ? registrar(x, j, Date.now()) : x)); }, []);
  const cambio = useCallback((entra: string, sale: string) => { setP((x) => (x ? cambiar(x, entra, sale, Date.now()) : x)); setEntrando(null); setSel(entra); }, []);

  // Arrastrar a una jugadora del banquillo hasta una de la pista.
  const arrastre = useRef<{ id: string; x: number; y: number; activo: boolean } | null>(null);
  const [fantasma, setFantasma] = useState<{ x: number; y: number; id: string } | null>(null);
  const bajar = (ev: React.PointerEvent, id: string) => { ev.currentTarget.setPointerCapture(ev.pointerId); arrastre.current = { id, x: ev.clientX, y: ev.clientY, activo: false }; };
  const mover = (ev: React.PointerEvent) => {
    const a = arrastre.current;
    if (!a) return;
    if (!a.activo && Math.hypot(ev.clientX - a.x, ev.clientY - a.y) > 10) a.activo = true;
    if (a.activo) setFantasma({ x: ev.clientX, y: ev.clientY, id: a.id });
  };
  const soltar = (ev: React.PointerEvent) => {
    const a = arrastre.current;
    arrastre.current = null;
    setFantasma(null);
    if (!a) return;
    if (!a.activo) { setEntrando((x) => (x === a.id ? null : a.id)); return; }
    const destino = (document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null)?.closest<HTMLElement>('[data-pista]')?.dataset.pista;
    if (destino) cambio(a.id, destino);
  };

  const orden = useMemo(() => new Map(roster.map((j, i) => [j.id, i])), [roster]);
  if (!datos || !p) {
    return <div className="vivo"><p className="vacio">No encuentro ese partido.</p><button className="principal" onClick={salir}>Volver</button></div>;
  }
  const v = p.vivo;
  const tope = reglas.faltas;
  const a = totalPuntos(p.directo);
  const fin = !!v.fin;
  const enPista = v.enPista.map((id) => nombreDe(roster, id)).filter((j): j is Jugadora => !!j);
  const banquillo = roster.filter((j) => !v.enPista.includes(j.id)).sort((x, y) => (orden.get(x.id) ?? 0) - (orden.get(y.id) ?? 0));
  const seg = segundosCuarto(v, ahora);
  const ultima = v.cronologia[v.cronologia.length - 1];
  const linea = (id: string) => p.directo[id] ?? { p: 0, f: 0 };
  const apuntar = (tipo: Tipo, extra: Partial<Jugada> = {}) => {
    if (!sel) return;
    if (marcar && (tipo === 'c2' || tipo === 'c3' || tipo === 'f2' || tipo === 'f3')) { setPendiente(tipo); return; }
    hacer({ tipo, j: sel, ...extra });
  };
  // La posición manda: si se toca dentro del arco es de 2 y fuera es de 3, aunque se hubiera pulsado otro botón.
  const ubicar = (x: number, y: number) => {
    if (!sel || !pendiente) return;
    const doble = esTriple(x, y) ? '3' : '2';
    const tipo = (pendiente[0] + doble) as Tipo;
    if (tipo !== pendiente) setAviso(doble === '3' ? 'Era un triple: apuntado de 3' : 'Era dentro del arco: apuntado de 2');
    hacer({ tipo, j: sel, x, y });
    setPendiente(null);
  };
  const textoJugada = (j: Jugada) => {
    const quien = j.tipo === 'rival' ? 'Rival' : j.tipo === 'tm' || j.tipo === 'cuarto' ? '' : j.tipo === 'cambio' ? `entra ${etiqueta(nombreDe(roster, j.j))}, sale ${etiqueta(nombreDe(roster, j.k))}` : etiqueta(nombreDe(roster, j.j));
    const que = j.tipo === 'rival' ? `+${j.v}` : j.tipo === 'cuarto' ? `Fin del ${nombreCuarto(j.v ?? 1)}` : j.tipo === 'cambio' ? '' : TEXTO[j.tipo];
    return [quien, que].filter(Boolean).join(' · ');
  };

  if (vista === 'cronologia') {
    return (
      <div className="vivo" role="dialog" aria-label="Cronología del partido">
        <header className="vivo-cab"><button className="atras" onClick={() => setVista('juego')} aria-label="Volver al partido">‹</button><b className="vivo-rival">Cronología</b></header>
        {v.cronologia.length === 0 && <p className="vacio">Todavía no hay jugadas.</p>}
        <ol className="cronologia">
          {[...v.cronologia].reverse().map((j) => (
            <li key={j.n} className={`cr-${j.tipo}`}><span className="cr-t">{nombreCuarto(j.c)} {reloj(Math.max(0, v.duracion * 60 - j.s))}</span><span>{textoJugada(j)}</span></li>
          ))}
        </ol>
      </div>
    );
  }

  if (vista === 'resumen') {
    const filas = boxScore(p.directo, v);
    const top = mejores(filas);
    const gano = a > p.rival;
    return (
      <div className="vivo" role="dialog" aria-label="Resumen del partido">
        <header className="vivo-cab"><button className="atras" onClick={salir} aria-label="Cerrar el resumen">‹</button><b className="vivo-rival">vs {datos.e.titulo || 'rival'}</b></header>
        <section className={`resumen-marcador ${gano ? 'G' : a < p.rival ? 'P' : ''}`} aria-label="Resultado final">
          <span>{gano ? 'Victoria' : a < p.rival ? 'Derrota' : 'Empate'}</span>
          <b>{a} – {p.rival}</b>
        </section>
        <div className="ramas" role="group" aria-label="Qué ver">
          <button className={pestanaRes === 'stats' ? 'on' : ''} aria-pressed={pestanaRes === 'stats'} onClick={() => setPestanaRes('stats')}>Estadística</button>
          <button className={pestanaRes === 'mapa' ? 'on' : ''} aria-pressed={pestanaRes === 'mapa'} onClick={() => setPestanaRes('mapa')}>Mapa de tiros</button>
        </div>
        {pestanaRes === 'mapa' ? <PanelMapa tiros={tirosDeVivo(v)} jugadoras={roster} /> : <>
        <section className="mejores" aria-label="Lo mejor del partido">
          {CATEGORIAS.map(([c, nombre]) => top[c].length > 0 && (
            <div key={c} className="mejor"><span className="rotulo">{nombre}</span><b>★ {top[c].map((id) => etiqueta(nombreDe(roster, id))).join(' ')}</b><small>{filas.find((f) => f.id === top[c][0])![c]}</small></div>
          ))}
        </section>
        <div className="tabla-box" role="region" aria-label="Estadística por jugadora" tabIndex={0}>
          <table>
            <thead><tr><th>Dorsal</th><th>Min</th><th>Pts</th><th>Reb</th><th>Asi</th><th>Rob</th><th>Per</th><th>Fal</th><th>TC</th></tr></thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.id}>
                  <th scope="row">{etiqueta(nombreDe(roster, f.id))}</th><td>{minutos(f.min)}</td>
                  <td className={top.p.includes(f.id) ? 'mej' : ''}>{f.p}</td><td className={top.reb.includes(f.id) ? 'mej' : ''}>{f.reb}</td>
                  <td className={top.ast.includes(f.id) ? 'mej' : ''}>{f.ast}</td><td className={top.rob.includes(f.id) ? 'mej' : ''}>{f.rob}</td>
                  <td>{f.per}</td><td>{f.f}</td><td>{f.tcI ? `${f.tcA}/${f.tcI}` : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>}
        <div className="dos-botones">
          <button className="secundario" onClick={() => { setP((x) => (x ? reabrir(x) : x)); setConfirmaFin(false); setVista('juego'); }}>Reabrir el partido</button>
          <button className="principal" onClick={salir}>Hecho</button>
        </div>
      </div>
    );
  }

  return (
    <div className="vivo" role="dialog" aria-label="Partido en directo">
      <header className="vivo-cab">
        <button className="atras" onClick={salir} aria-label="Salir del partido (se queda guardado)">‹</button>
        <b className="vivo-rival">vs {datos.e.titulo || 'rival'}</b>
        <button className="chip" onClick={() => setVista('cronologia')}>Jugadas</button>
      </header>

      <section className="vivo-marcador" aria-label="Marcador">
        <div className="eq"><span>{equipo!.nombre.slice(0, 14)}</span><b aria-label={`Nosotros ${a}`}>{a}</b></div>
        <div className="centro">
          <span className="cuarto">{nombreCuarto(v.cuarto)}</span>
          <b className={`reloj${restante(v, ahora) <= 60 ? ' poco' : ''}`} role="timer" aria-label={`Quedan ${reloj(restante(v, ahora))}`}>{reloj(restante(v, ahora))}</b>
          <button className={corriendo ? 'secundario' : 'principal'} disabled={fin} onClick={() => setP((x) => (x ? { ...x, vivo: x.vivo.corre ? parar(x.vivo, Date.now()) : arrancar(x.vivo, Date.now()) } : x))}>{corriendo ? 'Parar' : seg > 0 ? 'Seguir' : 'Empezar'}</button>
        </div>
        <div className="eq rival"><span>Rival</span><b aria-label={`Rival ${p.rival}`}>{p.rival}</b></div>
        <span className="mini-pad fila-rival"><em>Puntos del rival</em>{[1, 2, 3].map((n) => <button key={n} disabled={fin} onClick={() => hacer({ tipo: 'rival', v: n })} aria-label={`Rival suma ${n}`}>+{n}</button>)}</span>
      </section>

      <section className="vivo-estado" aria-label="Faltas y tiempos muertos">
        <div><span className="rotulo">Faltas {nombreCuarto(v.cuarto)}</span>
          <span className="puntitos" aria-label={`${faltasEquipo(v)} faltas de equipo`}>{Array.from({ length: 5 }, (_, i) => <i key={i} className={i < faltasEquipo(v) ? 'on' : ''} />)}{enBonus(v) && <em>Bonus</em>}</span></div>
        <div><span className="rotulo">Tiempos muertos</span>
          <span className="puntitos" aria-label={`${v.tm} de ${TIEMPOS_MUERTOS} tiempos muertos`}>{Array.from({ length: TIEMPOS_MUERTOS }, (_, i) => <i key={i} className={i < v.tm ? 'on' : ''} />)}</span></div>
        <button className="chip" disabled={fin || v.tm >= TIEMPOS_MUERTOS} onClick={() => hacer({ tipo: 'tm' })}>Tiempo muerto</button>
      </section>

      <section className="vivo-pista" aria-label="En pista">
        {enPista.map((j) => {
          const l = linea(j.id);
          const fuera = estaFuera(p.directo, j.id, tope);
          return (
            <button key={j.id} data-pista={j.id} className={`jug${sel === j.id ? ' sel' : ''}${entrando ? ' destino' : ''}${fuera ? ' fuera' : l.f === tope - 1 ? ' peligro' : ''}`} aria-pressed={sel === j.id}
              onClick={() => (entrando ? cambio(entrando, j.id) : setSel(j.id))}>
              <span className="dorsal">{j.numero || '?'}</span>
              <span className="jug-nombre">{j.nombre || 'Sin nombre'}</span>
              <span className="jug-datos"><b>{l.p}</b> pts · {l.f} f</span>
              <span className="jug-min">{minutos(v.min[j.id] ?? 0)} min</span>
            </button>
          );
        })}
      </section>

      <button className={marcar ? 'chip on' : 'chip'} aria-pressed={marcar} onClick={() => { const n = !marcar; setMarcar(n); try { localStorage.setItem('horns.marcarTiros', n ? '1' : '0'); } catch { /* sin almacenamiento */ } }}>Marcar tiros en la pista</button>
      {aviso && <p className="aviso" role="status">{aviso}</p>}
      <section className="vivo-pad" aria-label={sel ? `Apuntar a ${etiqueta(nombreDe(roster, sel))}` : 'Elige una jugadora'}>
        <div className="fila-pad puntos">
          {([['c1', '+1'], ['c2', '+2'], ['c3', '+3']] as const).map(([t, n]) => <button key={t} disabled={fin || !sel} onClick={() => apuntar(t)}>{n}</button>)}
          {([['f1', 'Falla 1'], ['f2', 'Falla 2'], ['f3', 'Falla 3']] as const).map(([t, n]) => <button key={t} className="falla" disabled={fin || !sel} onClick={() => apuntar(t)}>{n}</button>)}
        </div>
        <div className="fila-pad otras">
          {([['reb', 'Reb'], ['ast', 'Asi'], ['rob', 'Rob'], ['per', 'Per'], ['fal', 'Falta']] as const).map(([t, n]) => <button key={t} disabled={fin || !sel} onClick={() => apuntar(t)}>{n}</button>)}
        </div>
      </section>

      <section className="vivo-banquillo" aria-label="Banquillo">
        <span className="rotulo">{entrando ? `Toca a quién sustituye ${etiqueta(nombreDe(roster, entrando))}` : 'Banquillo · arrastra a la pista o toca y elige'}</span>
        <div className="banco">
          {banquillo.map((j) => (
            <button key={j.id} className={`ban${entrando === j.id ? ' sel' : ''}${estaFuera(p.directo, j.id, tope) ? ' fuera' : ''}`} disabled={fin || estaFuera(p.directo, j.id, tope)}
              onPointerDown={(ev) => bajar(ev, j.id)} onPointerMove={mover} onPointerUp={soltar} onPointerCancel={() => { arrastre.current = null; setFantasma(null); }}
              aria-label={`${j.nombre || 'Sin nombre'}, dorsal ${j.numero}. Toca y elige a quién sustituye`}>
              <b>{j.numero || '?'}</b><small>{linea(j.id).f} f</small>
            </button>
          ))}
          {banquillo.length === 0 && <span className="meta">No hay más jugadoras convocadas.</span>}
        </div>
      </section>

      <footer className="vivo-pie">
        <button className="secundario deshacer" disabled={!ultima || fin} onClick={() => setP((x) => (x ? deshacer(x, Date.now()) : x))}>↶ Deshacer{ultima ? `: ${textoJugada(ultima)}` : ''}</button>
        <button className="secundario" disabled={fin} onClick={() => setP((x) => (x ? cuartoSiguiente(x, Date.now()) : x))}>Siguiente cuarto</button>
        {confirmaFin
          ? <button className="principal" onClick={() => { setP((x) => (x ? terminar(x, Date.now()) : x)); setConfirmaFin(false); setVista('resumen'); }}>¿Terminar? Sí</button>
          : <button className="principal" disabled={fin} onClick={() => setConfirmaFin(true)}>Terminar</button>}
      </footer>
      {pendiente && (
        <div className="velo" onClick={() => setPendiente(null)}>
          <div className="hoja" onClick={(ev) => ev.stopPropagation()} role="dialog" aria-label="¿Desde dónde fue el tiro?">
            <div className="hoja-cabeza"><b>{etiqueta(nombreDe(roster, sel ?? undefined))} · {pendiente[0] === 'c' ? 'Canasta' : 'Fallo'}. Toca dónde fue</b></div>
            <MapaTiros tiros={tirosDeVivo(v).filter((t) => t.j === sel)} modo="puntos" alElegir={ubicar} etiqueta="Pista: toca el lugar del tiro" />
            <div className="dos-botones">
              <button className="secundario" onClick={() => { hacer({ tipo: pendiente, j: sel! }); setPendiente(null); }}>Sin lugar</button>
              <button className="secundario" onClick={() => setPendiente(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      {fantasma && <span className="fantasma" style={{ left: fantasma.x, top: fantasma.y }}>{nombreDe(roster, fantasma.id)?.numero || '?'}</span>}
    </div>
  );
}
