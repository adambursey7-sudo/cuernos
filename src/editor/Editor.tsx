// Editor «arrastra y dibuja» (elegido por Adam el 29/10): primero se coloca a los cinco; luego, en cada paso, el camino
// que hace el dedo con un jugador es su flecha y el movimiento se adivina (se cambia tocando la etiqueta). El pase se hace
// arrastrando el balón a un compañero. Todo se guarda en el móvil.
import { useEffect, useRef, useState } from 'react';
import { enCamino, foto, inicios } from '../pizarra/animar';
import { Pista } from '../pizarra/Pista';
import { guardarMio } from '../sistemas/almacen';
import { FAMILIAS, NIVELES, type Familia, type Jugador, type Nivel, type Punto, type Sistema } from '../sistemas/tipos';
import { adivinar, ajustarCurva, cambiarTipo, dentro, duplicarPaso, fijarTipo, limpiar, mover, moverPaso, nuevoBorrador, opcionesDe, pasar, ponerFamilia, PLANTILLAS, quitarMovimiento, quitarPaso, quitarPase, reordenarPaso } from './editar';

const JUGADORES: Jugador[] = ['1', '2', '3', '4', '5'];
/** Distancia (en dm de pista) para agarrar a un jugador con el dedo y para que el arrastre cuente. */
const AGARRE = 12;
const MINIMO = 4;
/** Radio (dm) para agarrar el balón, que va pegado al jugador que lo lleva. */
const AGARRE_BALON = 7;
const NOMBRE = { corte: 'Corte', bote: 'Bote', bloqueo: 'Bloqueo' } as const;

/** Lo que se arrastra: un jugador (con el camino que hace el dedo) o el balón para pasarlo. */
interface Arrastre {
  jugador: Jugador | 'balon';
  camino: Punto[];
}

export function Editor({ base, cerrar, guardado }: { base?: Sistema; cerrar: () => void; guardado: (id: string) => void }) {
  const [b, setB] = useState<Sistema>(() => nuevoBorrador(base));
  const [historial, setHistorial] = useState<Sistema[]>([]);
  const [colocando, setColocando] = useState(b.pasos.length === 0);
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const [pasando, setPasando] = useState(false);
  // Paso que se está editando (se puede volver a cualquiera), jugador marcado y reproducción del paso (0 a 1).
  const [selecc, setSelecc] = useState(Math.max(0, b.pasos.length - 1));
  const [elegido, setElegido] = useState<Jugador | null>(null);
  const [viendo, setViendo] = useState<number | null>(null);
  const [error, setError] = useState('');
  const capa = useRef<SVGSVGElement>(null);
  // Arrastrar una pestaña de paso a otro sitio la reordena; un toque sin arrastre la abre como siempre.
  const tira = useRef<{ n: number; x: number; activo: boolean } | null>(null);
  const [llevando, setLlevando] = useState<number | null>(null);
  const acabaDeLlevar = useRef(false);

  const actual = Math.min(selecc, Math.max(0, b.pasos.length - 1));
  const marcas = inicios(b);
  // Lo que se ve: al colocar, la posición de partida; en los pasos, el final del paso en curso con sus flechas.
  const vista: Sistema = colocando ? { ...b, pasos: [{ texto: '', movimientos: [] }] } : b;
  const t = colocando ? 0 : viendo !== null ? actual + Math.max(0.01, viendo) : actual + 1;
  const ahora = colocando ? marcas[0] : marcas[actual + 1];
  const alEmpezar = marcas[actual];
  const pasoActual = b.pasos[actual];
  // Bota quien tenía el balón al empezar el paso, salvo que ya lo haya pasado.
  const conBalon = (j: Jugador) => j === alEmpezar.balon && !pasoActual?.movimientos.some((m) => m.tipo === 'pase');

  useEffect(() => {
    if (viendo === null) return;
    const inicio = performance.now();
    let raf = 0;
    const tick = (ahoraMs: number) => {
      const k = (ahoraMs - inicio) / 1600;
      if (k >= 1) return setViendo(null);
      setViendo(k);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // Solo al empezar y al acabar: el avance (viendo) no debe reiniciar el reloj.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viendo === null]);

  const cambiar = (n: Sistema) => {
    setHistorial((h) => [...h.slice(-30), b]);
    setB(n);
    setError('');
  };
  // Al empezar a escribir (nombre, texto, nivel) se guarda cómo estaba, para que Deshacer no pise lo escrito.
  const recordar = () => setHistorial((h) => [...h.slice(-30), b]);
  const cambiarPaso = (f: (p: Sistema['pasos'][number]) => Sistema['pasos'][number]) =>
    cambiar({ ...b, pasos: b.pasos.map((p, i) => (i === actual ? f(p) : p)) });

  const aPista = (e: React.PointerEvent): Punto => {
    const m = capa.current!.getScreenCTM()!.inverse();
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m);
    return dentro([p.x, p.y]);
  };

  const agarrar = (e: React.PointerEvent) => {
    if (pasando || viendo !== null) return;
    const p = aPista(e);
    const empezar = (jugador: Arrastre['jugador'], desde: Punto) => {
      capa.current!.setPointerCapture(e.pointerId);
      setArrastre({ jugador, camino: [desde] });
    };
    if (!colocando) {
      const f = foto(vista, t);
      const balon: Punto = [f.balon[0] + 5, f.balon[1] - 5];
      if (Math.hypot(balon[0] - p[0], balon[1] - p[1]) < AGARRE_BALON) return empezar('balon', balon);
    }
    let mejor: Jugador | null = null;
    let cerca = AGARRE;
    for (const j of JUGADORES) {
      const d = Math.hypot(ahora.pos[j][0] - p[0], ahora.pos[j][1] - p[1]);
      if (d < cerca) [mejor, cerca] = [j, d];
    }
    if (mejor) empezar(mejor, ahora.pos[mejor]);
    else setElegido(null);
  };

  const arrastrar = (e: React.PointerEvent) => {
    if (!arrastre) return;
    const p = aPista(e);
    const ultimo = arrastre.camino[arrastre.camino.length - 1];
    // Un punto cada poco más de un decímetro basta para sacar la curva.
    if (Math.hypot(p[0] - ultimo[0], p[1] - ultimo[1]) > 1.5) setArrastre({ ...arrastre, camino: [...arrastre.camino, p] });
  };

  const soltar = () => {
    if (!arrastre) return;
    setArrastre(null);
    const { jugador, camino } = arrastre;
    const hasta = camino[camino.length - 1];
    if (Math.hypot(hasta[0] - camino[0][0], hasta[1] - camino[0][1]) < MINIMO) {
      // Un toque marca al jugador: la barra de abajo deja elegir qué hace.
      if (jugador !== 'balon' && !colocando) setElegido(jugador);
      return;
    }
    if (jugador === 'balon') {
      // Pase: el balón se suelta encima de un compañero.
      const receptor = JUGADORES.find((j) => j !== alEmpezar.balon && Math.hypot(ahora.pos[j][0] - hasta[0], ahora.pos[j][1] - hasta[1]) < AGARRE);
      if (receptor) cambiarPaso((p) => pasar(p, alEmpezar.balon, receptor));
      return;
    }
    if (colocando) return cambiar({ ...b, inicio: { ...b.inicio, [jugador]: hasta } });
    // El movimiento sale desde donde estaba al empezar el paso, aunque ya se hubiera movido en este mismo paso.
    const recorrido = [alEmpezar.pos[jugador], ...camino.slice(1)];
    const companeros = JUGADORES.filter((j) => j !== jugador).map((j) => ahora.pos[j]);
    const tipo = adivinar(conBalon(jugador), hasta, companeros);
    setElegido(jugador);
    cambiarPaso((p) => mover(p, jugador, tipo, hasta, ajustarCurva(recorrido)));
  };

  const bajarPaso = (e: React.PointerEvent, n: number) => { e.currentTarget.setPointerCapture(e.pointerId); tira.current = { n, x: e.clientX, activo: false }; acabaDeLlevar.current = false; };
  const moverPasoDedo = (e: React.PointerEvent) => {
    const a = tira.current;
    if (!a) return;
    if (!a.activo && Math.abs(e.clientX - a.x) > 10) { a.activo = true; setLlevando(a.n); }
  };
  const soltarPaso = (e: React.PointerEvent) => {
    const a = tira.current;
    tira.current = null;
    setLlevando(null);
    if (!a?.activo) return;
    acabaDeLlevar.current = true;
    const destino = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest<HTMLElement>('[data-paso]')?.dataset.paso;
    if (destino === undefined) return;
    cambiar(reordenarPaso(b, a.n, Number(destino)));
    setSelecc(Number(destino));
    setElegido(null);
  };

  const guardar = () => {
    const final = limpiar(b);
    if (!final.pasos.length) return setError('Añade al menos un movimiento antes de guardar.');
    try {
      guardarMio(final);
      guardado(final.id);
    } catch {
      setError('El móvil no ha dejado guardar. Revisa que Safari no esté en navegación privada.');
    }
  };

  const nombreNivel = (n: Nivel) => NIVELES.find((x) => x.id === n)!.nombre;

  return (
    <section className="pantalla editor">
      <div className="cabecera">
        <button className="atras" onClick={cerrar} aria-label="Salir sin guardar">‹</button>
        <input id="nombre-jugada" className="nombre-editable" value={b.nombre} onFocus={recordar} onChange={(e) => setB({ ...b, nombre: e.target.value })} aria-label="Nombre de la jugada" />
      </div>

      <div className="tira-pasos" role="tablist" aria-label="Pasos de la jugada">
        <button role="tab" aria-selected={colocando} className={colocando ? 'chip on' : 'chip'} onClick={() => { setColocando(true); setElegido(null); setViendo(null); }}>Colocar</button>
        {b.pasos.map((_, n) => (
          <button key={n} role="tab" data-paso={n} aria-selected={!colocando && n === actual} className={`${!colocando && n === actual ? 'chip on' : 'chip'}${llevando === n ? ' llevando' : ''}`} style={{ touchAction: 'pan-y' }}
            onPointerDown={(e) => bajarPaso(e, n)} onPointerMove={moverPasoDedo} onPointerUp={soltarPaso} onPointerCancel={() => { tira.current = null; setLlevando(null); }}
            onClick={() => { if (acabaDeLlevar.current) { acabaDeLlevar.current = false; return; } setColocando(false); setSelecc(n); setElegido(null); setPasando(false); setViendo(null); }}>
            {n + 1}
          </button>
        ))}
        {!colocando && (
          <button className="chip" onClick={() => setViendo(0)} disabled={!pasoActual?.movimientos.length || viendo !== null} aria-label="Ver este paso en movimiento">▶ Ver</button>
        )}
      </div>

      {!colocando && b.pasos.length > 0 && (
        <div className="fila-chips" role="group" aria-label="Este paso">
          <button className="chip pequeno" onClick={() => { cambiar(duplicarPaso(b, actual)); setSelecc(actual + 1); setElegido(null); }}>⧉ Duplicar</button>
          <button className="chip pequeno" disabled={actual === 0} onClick={() => { cambiar(moverPaso(b, actual, -1)); setSelecc(actual - 1); }} aria-label="Mover el paso antes">◀ Antes</button>
          <button className="chip pequeno" disabled={actual >= b.pasos.length - 1} onClick={() => { cambiar(moverPaso(b, actual, 1)); setSelecc(actual + 1); }} aria-label="Mover el paso después">Después ▶</button>
          <button className="chip pequeno" disabled={b.pasos.length <= 1} onClick={() => { cambiar(quitarPaso(b, actual)); setSelecc(Math.max(0, actual - 1)); setElegido(null); }}>🗑 Quitar paso</button>
        </div>
      )}

      <div className="fase">
        {colocando ? (
          <span>Elige una colocación o arrastra a cada jugador a su sitio. Toca el círculo del balón para decir quién lo lleva.</span>
        ) : elegido ? (
          <span><b>Jugador {elegido}</b> · elige qué hace, o arrástralo otra vez.</span>
        ) : (
          <span><b>Paso {actual + 1}</b> · arrastra a un jugador: lo que dibujes es su movimiento. Arrastra el número del paso para cambiarlo de sitio.</span>
        )}
      </div>

      {colocando && (
        <div className="fila-chips" role="group" aria-label="Colocaciones listas">
          {PLANTILLAS.map((pl) => (
            <button key={pl.id} className="chip pequeno" onClick={() => cambiar({ ...b, inicio: structuredClone(pl.inicio), balon: pl.balon })}>{pl.nombre}</button>
          ))}
        </div>
      )}

      <div className="lienzo">
        <Pista sistema={vista} t={t} numeros={null} />
        {!colocando && elegido && !arrastre && (
          <svg className="capa marca" viewBox="0 0 150 140" aria-hidden>
            <circle className="elegido" cx={ahora.pos[elegido][0]} cy={ahora.pos[elegido][1]} r="10.5" />
          </svg>
        )}
        <svg
          ref={capa}
          className="capa"
          viewBox="0 0 150 140"
          onPointerDown={agarrar}
          onPointerMove={arrastrar}
          onPointerUp={soltar}
          onPointerCancel={() => setArrastre(null)}
        >
          {arrastre && (
            <>
              <path className="guia" d={'M' + arrastre.camino.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join('L')} />
              {arrastre.jugador !== 'balon' && (
                <g transform={`translate(${arrastre.camino.at(-1)![0]} ${arrastre.camino.at(-1)![1]})`}>
                  <circle className="viva" r="8.5" />
                  <text className="viva-num">{arrastre.jugador}</text>
                </g>
              )}
            </>
          )}
          {colocando &&
            JUGADORES.map((j) => (
              <circle
                key={j}
                className={j === b.balon ? 'tocar-balon con' : 'tocar-balon'}
                cx={b.inicio[j][0] + 5}
                cy={b.inicio[j][1] - 5}
                r="4"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  cambiar({ ...b, balon: j });
                }}
              />
            ))}
        </svg>
        {/* Etiqueta en mitad de cada flecha: tocarla cambia el movimiento si la app no lo ha adivinado bien. */}
        {!colocando &&
          !arrastre &&
          pasoActual?.movimientos.map((m) => {
            if (m.tipo === 'pase') return null;
            const [x, y] = enCamino(alEmpezar.pos[m.jugador], m.a, 0.5, m.por);
            return (
              <button
                key={'etiqueta' + m.jugador}
                className={`etiqueta-flecha ${m.tipo}`}
                style={{ left: `${(x / 150) * 100}%`, top: `${(y / 140) * 100}%` }}
                onClick={() => cambiarPaso((p) => cambiarTipo(p, m.jugador, opcionesDe(conBalon(m.jugador))))}
                aria-label={`${NOMBRE[m.tipo]} del ${m.jugador}: tocar para cambiarlo`}
              >
                {NOMBRE[m.tipo]}
              </button>
            );
          })}
      </div>

      {!colocando && elegido && !pasando && (
        <div className="fila-chips barra-jugador" role="group" aria-label={`Qué hace el jugador ${elegido}`}>
          {(['corte', 'bote', 'bloqueo'] as const).filter((x) => opcionesDe(conBalon(elegido)).includes(x)).map((x) => {
            const m = pasoActual?.movimientos.find((y) => y.tipo !== 'pase' && y.jugador === elegido);
            return (
              <button key={x} className={m?.tipo === x ? 'chip on' : 'chip'} disabled={!m} onClick={() => cambiarPaso((p) => fijarTipo(p, elegido, x))}>
                {NOMBRE[x]}
              </button>
            );
          })}
          {conBalon(elegido) && <button className="chip" onClick={() => setPasando(true)}>Pase a…</button>}
          <button className="chip" disabled={!pasoActual?.movimientos.some((y) => y.tipo !== 'pase' && y.jugador === elegido)} onClick={() => cambiarPaso((p) => quitarMovimiento(p, elegido))} aria-label={`Borrar el movimiento del ${elegido}`}>🗑</button>
        </div>
      )}
      {!colocando && pasoActual?.movimientos.some((m) => m.tipo === 'pase') && !pasando && (
        <div className="fila-chips"><button className="chip" onClick={() => cambiarPaso(quitarPase)}>Quitar el pase de este paso</button></div>
      )}

      {pasando && (
        <div className="fila-chips pase">
          <span>¿A quién pasa el {alEmpezar.balon}?</span>
          {JUGADORES.filter((j) => j !== alEmpezar.balon).map((j) => (
            <button key={j} className="chip on" onClick={() => { cambiarPaso((p) => pasar(p, alEmpezar.balon, j)); setPasando(false); }}>
              {j}
            </button>
          ))}
          <button className="chip" onClick={() => setPasando(false)}>Cancelar</button>
        </div>
      )}

      {!colocando && (
        <input
          id="texto-paso"
          className="texto-paso-editor"
          value={b.pasos[actual]?.texto ?? ''}
          placeholder="Qué pasa en este paso"
          onFocus={recordar}
          onChange={(e) => setB({ ...b, pasos: b.pasos.map((p, i) => (i === actual ? { ...p, texto: e.target.value } : p)) })}
          aria-label="Explicación del paso"
        />
      )}

      <div className="herramientas">
        <button onClick={() => { const h = historial.at(-1); if (h) { setB(h); setHistorial(historial.slice(0, -1)); setColocando(h.pasos.length === 0); setElegido(null); setSelecc(Math.max(0, h.pasos.length - 1)); } }} disabled={!historial.length}>
          ↶ Deshacer
        </button>
        {colocando ? (
          <button className="principal" onClick={() => { if (!b.pasos.length) cambiar({ ...b, pasos: [{ texto: '', movimientos: [] }] }); setSelecc(0); setColocando(false); }}>
            {b.pasos.length ? 'Seguir con los pasos' : 'Empezar pasos'}
          </button>
        ) : (
          <button className="principal" onClick={() => { cambiar({ ...b, pasos: [...b.pasos, { texto: '', movimientos: [] }] }); setSelecc(b.pasos.length); setElegido(null); }} disabled={!b.pasos[b.pasos.length - 1]?.movimientos.length}>
            + Paso
          </button>
        )}
      </div>

      <div className="ajustes-jugada">
        <label>
          Categoría
          <select id="familia-jugada" value={b.familia ?? ''} onFocus={recordar} onChange={(ev) => setB(ponerFamilia(b, (ev.target.value || undefined) as Familia | undefined))}>
            <option value="">Sin categoría</option>
            {FAMILIAS.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
          </select>
        </label>
        <label>
          Desde
          <select id="nivel-jugada" value={b.nivelMinimo} onFocus={recordar} onChange={(e) => setB({ ...b, nivelMinimo: e.target.value as Nivel })}>
            {NIVELES.map((n) => <option key={n.id} value={n.id}>{nombreNivel(n.id)}</option>)}
          </select>
        </label>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="barra-guardar"><button className="guardar" onClick={guardar}>Guardar jugada</button></div>
    </section>
  );
}
