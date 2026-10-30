// Editor «arrastra y dibuja» (elegido por Adam el 29/10): primero se coloca a los cinco; luego, en cada paso, el camino
// que hace el dedo con un jugador es su flecha y el movimiento se adivina (se cambia tocando la etiqueta). El pase se hace
// arrastrando el balón a un compañero. Todo se guarda en el móvil.
import { useRef, useState } from 'react';
import { enCamino, foto, inicios } from '../pizarra/animar';
import { Pista } from '../pizarra/Pista';
import { guardarMio } from '../sistemas/almacen';
import { NIVELES, type Jugador, type Nivel, type Punto, type Sistema } from '../sistemas/tipos';
import { adivinar, ajustarCurva, cambiarTipo, dentro, limpiar, mover, nuevoBorrador, opcionesDe, pasar } from './editar';

const JUGADORES: Jugador[] = ['1', '2', '3', '4', '5'];
/** Distancia (en dm de pista) para agarrar a un jugador con el dedo y para que el arrastre cuente. */
const AGARRE = 12;
const MINIMO = 4;
/** Radio (dm) para agarrar el balón, que va pegado al jugador que lo lleva. */
const AGARRE_BALON = 5;
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
  const [error, setError] = useState('');
  const capa = useRef<SVGSVGElement>(null);

  const actual = Math.max(0, b.pasos.length - 1);
  const marcas = inicios(b);
  // Lo que se ve: al colocar, la posición de partida; en los pasos, el final del paso en curso con sus flechas.
  const vista: Sistema = colocando ? { ...b, pasos: [{ texto: '', movimientos: [] }] } : b;
  const t = colocando ? 0 : b.pasos.length;
  const ahora = colocando ? marcas[0] : marcas[b.pasos.length];
  const alEmpezar = marcas[actual];
  const pasoActual = b.pasos[actual];
  // Bota quien tenía el balón al empezar el paso, salvo que ya lo haya pasado.
  const conBalon = (j: Jugador) => j === alEmpezar.balon && !pasoActual?.movimientos.some((m) => m.tipo === 'pase');

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
    if (pasando) return;
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
    if (Math.hypot(hasta[0] - camino[0][0], hasta[1] - camino[0][1]) < MINIMO) return;
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
    cambiarPaso((p) => mover(p, jugador, tipo, hasta, ajustarCurva(recorrido)));
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

      <div className="fase">
        {colocando ? (
          <span>Colocación: arrastra a cada jugador a su sitio y toca quién lleva el balón.</span>
        ) : (
          <span>
            <b>Paso {actual + 1}</b> · dibuja con el dedo el camino de cada jugador. Para pasar, arrastra el balón a un compañero. Toca la etiqueta de una flecha para cambiar el movimiento.
          </span>
        )}
      </div>

      <div className="lienzo">
        <Pista sistema={vista} t={t} numeros={null} />
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
              {arrastre.jugador !== 'balon' && <circle className="fantasma" cx={arrastre.camino.at(-1)![0]} cy={arrastre.camino.at(-1)![1]} r="7.5" />}
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
          <select id="nivel-jugada" value={b.nivelMinimo} onFocus={recordar} onChange={(e) => setB({ ...b, nivelMinimo: e.target.value as Nivel })}>
            {NIVELES.map((n) => <option key={n.id} value={n.id}>{nombreNivel(n.id)}</option>)}
          </select>
        </label>
        <button className="guardar" onClick={guardar}>Guardar jugada</button>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}
