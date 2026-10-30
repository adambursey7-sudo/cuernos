// Cronómetro de pista (2.4): pantalla grande para mirar de lejos, con aviso de sonido al cambiar de ejercicio
// y el siguiente a la vista. Cuenta con la hora del reloj, así no se atrasa si el móvil frena la página.
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { TIPOS, buscarEjercicio } from '../ejercicios/ejercicios';
import { inicioDe, posicion, reloj } from '../sesiones/cronometro';
import { total, type Sesion } from '../sesiones/sesiones';
import { sinMovimiento } from '../preferencias';
import { Pista } from '../pizarra/Pista';
import { useJugada } from '../pizarra/useJugada';
import type { Sistema } from '../sistemas/tipos';
import { horas } from './Sesiones';

type Audio = AudioContext | null;

/** Hay que llamarla dentro del toque de «Empezar»: si no, el móvil deja el audio dormido. */
export function crearAudio(): Audio {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    const ctx = Ctx ? new Ctx() : null;
    ctx?.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

function pitidos(ctx: Audio, veces: number) {
  if (!ctx) return;
  for (let k = 0; k < veces; k++) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const t = ctx.currentTime + k * 0.28;
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.22);
  }
}

/** Tercer panel: la pizarra del ejercicio que toca, a lo grande; tocar la pista pasa al paso siguiente. */
function PanelPizarra({ pizarra, defensa }: { pizarra?: Sistema; defensa: boolean }) {
  const jugada = useJugada(pizarra?.pasos.length ?? 1);
  if (!pizarra) return <p className="vacio">Este ejercicio no tiene pizarra.</p>;
  const n = pizarra.pasos.length;
  return (
    <>
      <button className="ent-pista" onClick={() => (jugada.t >= n ? jugada.todo() : jugada.siguiente())} aria-label="Paso siguiente">
        <Pista sistema={pizarra} t={jugada.t} conDefensa={defensa} alto={260} />
      </button>
      <p className="ent-paso"><b>{jugada.paso + 1}/{n}</b> {pizarra.pasos[jugada.paso].texto}</p>
      <div className="ent-pizarra-mandos">
        <button onClick={() => jugada.anterior()} disabled={jugada.t <= 1}>Atrás</button>
        <button onClick={() => jugada.todo()}>▶ Todo</button>
      </div>
    </>
  );
}

const nombreTipo = (id: string) => TIPOS.find((t) => t.id === id)?.nombre ?? '';

export function Entrenando({ s, salir, audio: ctx }: { s: Sesion; salir: () => void; audio: Audio }) {
  const [base, setBase] = useState(0); // segundos ya contados cuando se pausó
  const [desde, setDesde] = useState<number | null>(Date.now()); // hora a la que arrancó; null = en pausa
  const [, pulso] = useState(0);
  const [sonido, setSonido] = useState(true);
  const [panel, setPanel] = useState(1); // 0 sesión · 1 cronómetro · 2 pizarra
  const pistas = useRef<HTMLDivElement>(null);
  const yDedo = useRef<number | null>(null);
  const audio = useRef<Audio>(ctx);
  const anterior = useRef(0);

  const seg = base + (desde === null ? 0 : (Date.now() - desde) / 1000);
  const p = posicion(s, seg);

  // La pantalla se queda encendida mientras dura el entrenamiento.
  useEffect(() => {
    let cerrojo: { release: () => Promise<void> } | undefined;
    const pedir = () => (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<typeof cerrojo> } }).wakeLock?.request('screen').then((c) => { cerrojo = c; }).catch(() => {});
    pedir();
    const visible = () => { if (document.visibilityState === 'visible') pedir(); };
    document.addEventListener('visibilitychange', visible);
    return () => {
      document.removeEventListener('visibilitychange', visible);
      cerrojo?.release().catch(() => {});
      audio.current?.close().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (desde === null) return;
    const id = setInterval(() => pulso((n) => n + 1), 250);
    return () => clearInterval(id);
  }, [desde]);

  // Aviso al pasar de un ejercicio al siguiente (o al terminar): pitidos y vibración.
  const marca = p.acabada ? s.bloques.length : p.i;
  useEffect(() => {
    if (marca === anterior.current) return;
    const avanza = marca > anterior.current;
    anterior.current = marca;
    if (!avanza || desde === null) return;
    if (sonido) pitidos(audio.current, marca === s.bloques.length ? 3 : 2);
    navigator.vibrate?.(marca === s.bloques.length ? [300, 150, 300, 150, 300] : [300, 150, 300]);
  }, [marca, sonido, desde, s.bloques.length]);

  const ir = (seg2: number) => { anterior.current = posicion(s, seg2).i === -1 ? s.bloques.length : posicion(s, seg2).i; setBase(seg2); setDesde(desde === null ? null : Date.now()); };
  const pausar = () => { if (desde === null) { audio.current?.resume().catch(() => {}); setDesde(Date.now()); } else { setBase(seg); setDesde(null); } };

  // ⏮ vuelve al principio del ejercicio y, si ya estás al principio, al anterior.
  const atras = () => {
    const i = p.acabada ? s.bloques.length - 1 : p.i;
    const dentro = seg - inicioDe(s, i);
    ir(p.acabada || dentro > 3 ? inicioDe(s, i) : inicioDe(s, i - 1));
  };

  // Los paneles se deslizan de lado; empezamos en el del cronómetro.
  useEffect(() => { const c = pistas.current; if (c) c.scrollLeft = c.clientWidth; }, []);
  const ver = (n: number) => pistas.current?.scrollTo({ left: n * pistas.current.clientWidth, behavior: sinMovimiento() ? 'auto' : 'smooth' });
  const alDeslizar = () => { const c = pistas.current; if (c) setPanel(Math.round(c.scrollLeft / c.clientWidth)); };
  // Deslizar la barra de arriba hacia abajo cierra el modo banda.
  const abajoIni = (ev: PointerEvent) => { yDedo.current = ev.clientY; };
  const abajoFin = (ev: PointerEvent) => { if (yDedo.current !== null && ev.clientY - yDedo.current > 80) salir(); yDedo.current = null; };

  const actual = p.i >= 0 ? s.bloques[p.i] : undefined;
  const sig = p.i >= 0 ? s.bloques[p.i + 1] : undefined;
  const e = actual && buscarEjercicio(actual.ejercicio);
  const eSig = sig && buscarEjercicio(sig.ejercicio);
  const poco = !p.acabada && p.resto <= 60;

  return (
    <div className={`entrenando ${actual ? `tipo-${actual.tipo}` : ''}`} role="dialog" aria-label="Cronómetro de la sesión">
      <div className="ent-arriba" onPointerDown={abajoIni} onPointerUp={abajoFin}>
        <button onClick={salir} aria-label="Salir del cronómetro">✕</button>
        <span className="cuenta">{p.acabada ? s.bloques.length : p.i + 1} / {s.bloques.length}</span>
        <span className="meta">Quedan {horas(Math.ceil(p.restoTotal / 60))}</span>
        <button onClick={() => { setSonido(!sonido); audio.current?.resume().catch(() => {}); }} aria-pressed={sonido} aria-label="Sonido">{sonido ? '🔔' : '🔕'}</button>
      </div>

      <div className="ent-pistas" ref={pistas} onScroll={alDeslizar}>
        <div className="ent-panel" aria-label="Sesión">
          <ol className="ent-lista">
            {s.bloques.map((b, i) => {
              const ej = buscarEjercicio(b.ejercicio);
              const estado = i < (p.acabada ? s.bloques.length : p.i) ? 'hecho' : i === p.i ? 'ahora' : '';
              return (
                <li key={i}>
                  <button className={estado} onClick={() => { ir(inicioDe(s, i)); ver(1); }}>
                    <span className="min">{b.minutos}′</span>
                    <span>{ej ? `${ej.formato ? `${ej.formato} · ` : ''}${ej.nombre}` : 'Ejercicio que ya no existe'}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="ent-panel" aria-label="Cronómetro">
          {p.acabada ? (
            <div className="ent-centro">
              <p className="ent-tipo">Sesión terminada</p>
              <p className="ent-reloj">{horas(total(s))}</p>
              <p className="ent-nombre">{s.nombre}</p>
            </div>
          ) : (
            <div className="ent-centro">
              <p className="ent-tipo">{nombreTipo(actual!.tipo)}</p>
              <p className={poco ? 'ent-reloj poco' : 'ent-reloj'} aria-live="off">{reloj(p.resto)}</p>
              <p className="ent-nombre">{e ? `${e.formato ? `${e.formato} · ` : ''}${e.nombre}` : 'Ejercicio que ya no existe'}</p>
            </div>
          )}
          <div className="ent-siguiente">
            {sig ? (
              <>
                <span className="meta">Después · {sig.minutos}′ · {nombreTipo(sig.tipo)}</span>
                <b>{eSig ? `${eSig.formato ? `${eSig.formato} · ` : ''}${eSig.nombre}` : 'Ejercicio que ya no existe'}</b>
              </>
            ) : (
              <span className="meta">{p.acabada ? 'Buen trabajo.' : 'Es el último ejercicio.'}</span>
            )}
          </div>
        </div>

        <div className="ent-panel" aria-label="Pizarra">
          {e ? <PanelPizarra key={e.id} pizarra={e.pizarra} defensa={!!e.defensores} /> : <p className="vacio">No hay ejercicio ahora.</p>}
        </div>
      </div>

      <div className="ent-puntos" role="tablist" aria-label="Paneles">
        {['Sesión', 'Reloj', 'Pizarra'].map((n, i) => (
          <button key={n} role="tab" aria-selected={panel === i} className={panel === i ? 'on' : ''} onClick={() => ver(i)}>{n}</button>
        ))}
      </div>

      <div className="ent-mandos">
        <button onClick={atras} aria-label="Ejercicio anterior">⏮</button>
        <button className="grande" onClick={pausar} aria-label={desde === null ? 'Seguir' : 'Pausa'}>{desde === null ? '▶' : '⏸'}</button>
        <button onClick={() => ir(p.i + 1 >= s.bloques.length ? total(s) * 60 : inicioDe(s, p.i + 1))} disabled={p.acabada} aria-label="Ejercicio siguiente">⏭</button>
      </div>
    </div>
  );
}
