// Editor «arrastra y elige»: primero se coloca a los cinco; luego, en cada paso, se arrastra a un jugador y se elige
// qué movimiento ha sido. El pase va con su propio botón. Todo se guarda en el móvil.
import { useRef, useState } from 'react';
import { enCamino, inicios } from '../pizarra/animar';
import { Pista } from '../pizarra/Pista';
import { guardarMio } from '../sistemas/almacen';
import { NIVELES, type Jugador, type Nivel, type Punto, type Sistema } from '../sistemas/tipos';
import { curvar, dentro, limpiar, mover, nuevoBorrador, pasar, type TipoMovimiento } from './editar';

const JUGADORES: Jugador[] = ['1', '2', '3', '4', '5'];
/** Distancia (en dm de pista) para agarrar a un jugador con el dedo y para que el arrastre cuente. */
const AGARRE = 12;
const MINIMO = 4;

interface Arrastre {
  jugador: Jugador;
  desde: Punto;
  hasta: Punto;
}

export function Editor({ base, cerrar, guardado }: { base?: Sistema; cerrar: () => void; guardado: (id: string) => void }) {
  const [b, setB] = useState<Sistema>(() => nuevoBorrador(base));
  const [historial, setHistorial] = useState<Sistema[]>([]);
  const [colocando, setColocando] = useState(b.pasos.length === 0);
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const [eleccion, setEleccion] = useState<Arrastre | null>(null);
  const [pasando, setPasando] = useState(false);
  const [error, setError] = useState('');
  const capa = useRef<SVGSVGElement>(null);

  const actual = Math.max(0, b.pasos.length - 1);
  const marcas = inicios(b);
  // Lo que se ve: al colocar, la posición de partida; en los pasos, el final del paso en curso con sus flechas.
  const vista: Sistema = colocando ? { ...b, pasos: [{ texto: '', movimientos: [] }] } : b;
  const t = colocando ? 0 : b.pasos.length;
  const ahora = colocando ? marcas[0] : marcas[b.pasos.length];
  const alEmpezar = marcas[actual];

  const cambiar = (n: Sistema) => {
    setHistorial((h) => [...h.slice(-30), b]);
    setB(n);
    setError('');
  };
  const cambiarPaso = (f: (p: Sistema['pasos'][number]) => Sistema['pasos'][number]) =>
    cambiar({ ...b, pasos: b.pasos.map((p, i) => (i === actual ? f(p) : p)) });

  const aPista = (e: React.PointerEvent): Punto => {
    const m = capa.current!.getScreenCTM()!.inverse();
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m);
    return dentro([p.x, p.y]);
  };

  const agarrar = (e: React.PointerEvent) => {
    if (eleccion || pasando) return;
    const p = aPista(e);
    let mejor: Jugador | null = null;
    let cerca = AGARRE;
    for (const j of JUGADORES) {
      const d = Math.hypot(ahora.pos[j][0] - p[0], ahora.pos[j][1] - p[1]);
      if (d < cerca) [mejor, cerca] = [j, d];
    }
    if (!mejor) return;
    capa.current!.setPointerCapture(e.pointerId);
    setArrastre({ jugador: mejor, desde: ahora.pos[mejor], hasta: ahora.pos[mejor] });
  };

  const soltar = () => {
    if (!arrastre) return;
    setArrastre(null);
    const { jugador, hasta } = arrastre;
    if (Math.hypot(hasta[0] - arrastre.desde[0], hasta[1] - arrastre.desde[1]) < MINIMO) return;
    if (colocando) cambiar({ ...b, inicio: { ...b.inicio, [jugador]: hasta } });
    // El movimiento sale desde donde estaba al empezar el paso, aunque ya se hubiera movido en este mismo paso.
    else setEleccion({ jugador, desde: alEmpezar.pos[jugador], hasta });
  };

  const elegir = (tipo: TipoMovimiento) => {
    if (!eleccion) return;
    cambiarPaso((p) => mover(p, eleccion.jugador, tipo, eleccion.hasta));
    setEleccion(null);
  };

  const opciones: TipoMovimiento[] = eleccion
    ? eleccion.jugador === alEmpezar.balon
      ? ['bote', 'corte']
      : ['corte', 'bloqueo']
    : [];

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
        <input id="nombre-jugada" className="nombre-editable" value={b.nombre} onChange={(e) => setB({ ...b, nombre: e.target.value })} aria-label="Nombre de la jugada" />
      </div>

      <div className="fase">
        {colocando ? (
          <span>Colocación: arrastra a cada jugador a su sitio y toca quién lleva el balón.</span>
        ) : (
          <span>
            <b>Paso {actual + 1}</b> · arrastra a un jugador y elige qué ha hecho. Toca una flecha para curvarla.
          </span>
        )}
      </div>

      <div className="lienzo">
        <Pista sistema={vista} t={t} />
        <svg
          ref={capa}
          className="capa"
          viewBox="0 0 150 140"
          onPointerDown={agarrar}
          onPointerMove={(e) => arrastre && setArrastre({ ...arrastre, hasta: aPista(e) })}
          onPointerUp={soltar}
          onPointerCancel={() => setArrastre(null)}
        >
          {/* Zonas para tocar las flechas del paso y curvarlas (solo el tramo central, para no tapar al jugador). */}
          {!colocando &&
            !arrastre &&
            b.pasos[actual]?.movimientos.map((m) => {
              if (m.tipo === 'pase') return null;
              const de = alEmpezar.pos[m.jugador];
              const puntos = [0.15, 0.3, 0.45, 0.6, 0.75].map((k) => enCamino(de, m.a, k, m.por).map((n) => n.toFixed(1)).join(' '));
              return (
                <path
                  key={'curva' + m.jugador}
                  className="tocar-flecha"
                  d={'M' + puntos.join('L')}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    cambiarPaso((p) => curvar(p, m.jugador, de));
                  }}
                />
              );
            })}
          {arrastre && (
            <>
              <path className="guia" d={`M${arrastre.desde[0]} ${arrastre.desde[1]}L${arrastre.hasta[0]} ${arrastre.hasta[1]}`} />
              <circle className="fantasma" cx={arrastre.hasta[0]} cy={arrastre.hasta[1]} r="7.5" />
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
        {eleccion && <div className="marca-eleccion" style={{ left: `${(eleccion.hasta[0] / 150) * 100}%`, top: `${(eleccion.hasta[1] / 140) * 100}%` }} />}
      </div>

      {eleccion && (
        <div className="eleccion" role="dialog" aria-label={`Qué ha hecho el ${eleccion.jugador}`}>
          <span>¿Qué ha hecho el {eleccion.jugador}?</span>
          <div className="fila-chips">
            {opciones.map((o) => (
              <button key={o} className="chip on" onClick={() => elegir(o)}>
                {o === 'bote' ? 'Bote' : o === 'corte' ? 'Corte' : 'Bloqueo'}
              </button>
            ))}
            <button className="chip" onClick={() => setEleccion(null)}>Nada</button>
          </div>
        </div>
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
          onChange={(e) => setB({ ...b, pasos: b.pasos.map((p, i) => (i === actual ? { ...p, texto: e.target.value } : p)) })}
          aria-label="Explicación del paso"
        />
      )}

      <div className="herramientas">
        <button onClick={() => { const h = historial.at(-1); if (h) { setB(h); setHistorial(historial.slice(0, -1)); setColocando(h.pasos.length === 0); } }} disabled={!historial.length}>
          ↶ Deshacer
        </button>
        {colocando ? (
          <button className="principal" onClick={() => { cambiar({ ...b, pasos: [{ texto: '', movimientos: [] }] }); setColocando(false); }}>
            Empezar pasos
          </button>
        ) : (
          <>
            <button onClick={() => setPasando(true)}>Pase</button>
            <button onClick={() => cambiar({ ...b, pasos: [...b.pasos, { texto: '', movimientos: [] }] })} disabled={!b.pasos[actual]?.movimientos.length}>
              + Paso
            </button>
          </>
        )}
      </div>

      <div className="ajustes-jugada">
        <label>
          Desde
          <select id="nivel-jugada" value={b.nivelMinimo} onChange={(e) => setB({ ...b, nivelMinimo: e.target.value as Nivel })}>
            {NIVELES.map((n) => <option key={n.id} value={n.id}>{nombreNivel(n.id)}</option>)}
          </select>
        </label>
        <button className="guardar" onClick={guardar}>Guardar jugada</button>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}
