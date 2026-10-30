// Cronómetro de pista (2.4): pantalla grande para mirar de lejos, con aviso de sonido al cambiar de ejercicio
// y el siguiente a la vista. Cuenta con la hora del reloj, así no se atrasa si el móvil frena la página.
import { useEffect, useRef, useState } from 'react';
import { TIPOS } from '../ejercicios/ejercicios';
import { inicioDe, posicion, reloj } from '../sesiones/cronometro';
import { total, tituloBloque, type Sesion } from '../sesiones/sesiones';
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

const nombreTipo = (id: string) => TIPOS.find((t) => t.id === id)?.nombre ?? '';

export function Entrenando({ s, salir, audio: ctx }: { s: Sesion; salir: () => void; audio: Audio }) {
  const [base, setBase] = useState(0); // segundos ya contados cuando se pausó
  const [desde, setDesde] = useState<number | null>(Date.now()); // hora a la que arrancó; null = en pausa
  const [, pulso] = useState(0);
  const [sonido, setSonido] = useState(true);
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

  const actual = p.i >= 0 ? s.bloques[p.i] : undefined;
  const sig = p.i >= 0 ? s.bloques[p.i + 1] : undefined;
  const e = actual && tituloBloque(actual.ejercicio);
  const eSig = sig && tituloBloque(sig.ejercicio);
  const poco = !p.acabada && p.resto <= 60;

  return (
    <div className={`entrenando ${actual ? `tipo-${actual.tipo}` : ''}`} role="dialog" aria-label="Cronómetro de la sesión">
      <div className="ent-arriba">
        <button onClick={salir} aria-label="Salir del cronómetro">✕</button>
        <span className="cuenta">{p.acabada ? s.bloques.length : p.i + 1} / {s.bloques.length}</span>
        <span className="meta">Quedan {horas(Math.ceil(p.restoTotal / 60))}</span>
        <button onClick={() => { setSonido(!sonido); audio.current?.resume().catch(() => {}); }} aria-pressed={sonido} aria-label="Sonido">{sonido ? '🔔' : '🔕'}</button>
      </div>

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
          <p className="ent-nombre">{e ?? 'Ejercicio que ya no existe'}</p>
        </div>
      )}

      <div className="ent-siguiente">
        {sig ? (
          <>
            <span className="meta">Después · {sig.minutos}′ · {nombreTipo(sig.tipo)}</span>
            <b>{eSig ?? 'Ejercicio que ya no existe'}</b>
          </>
        ) : (
          <span className="meta">{p.acabada ? 'Buen trabajo.' : 'Es el último ejercicio.'}</span>
        )}
      </div>

      <div className="ent-mandos">
        <button onClick={atras} aria-label="Ejercicio anterior">⏮</button>
        <button className="grande" onClick={pausar} aria-label={desde === null ? 'Seguir' : 'Pausa'}>{desde === null ? '▶' : '⏸'}</button>
        <button onClick={() => ir(p.i + 1 >= s.bloques.length ? total(s) * 60 : inicioDe(s, p.i + 1))} disabled={p.acabada} aria-label="Ejercicio siguiente">⏭</button>
      </div>
    </div>
  );
}
