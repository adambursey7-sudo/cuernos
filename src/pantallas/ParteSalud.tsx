// Parte de salud de una jugadora (opción A, loop Herramienta diaria): arriba solo un resumen de color y estado,
// y los detalles médicos se abren con doble toque (o con el PIN si lo hay). Todo vive en `salud/`, solo en este móvil.
import { useEffect, useRef, useState } from 'react';
import {
  abrirDetalle, bloquear, desbloquear, detalleVacio, diasDeBaja, FASES_VUELTA, GRADOS, guardarParte, hayPin, parteActivo, partesDe,
  ponerPin, quitarPin, type Detalle, type Resumen,
} from '../salud/salud';

const hoy = () => {
  const f = new Date();
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
};
const bonita = (f: string) => f.split('-').reverse().join('/');

export function ParteSalud({ jugadoraId }: { jugadoraId: string }) {
  const parte = parteActivo(jugadoraId);
  const historial = partesDe(jugadoraId).filter((p) => !p.activo);
  const [version, setVersion] = useState(0);
  const refrescar = () => setVersion((n) => n + 1);
  const [abierto, setAbierto] = useState(false);
  const ultimoToque = useRef(0);
  const [pin, setPin] = useState('');
  const [aviso, setAviso] = useState('');
  const [detalle, setDetalle] = useState<Detalle | null>(null);
  const [bloqueado, setBloqueado] = useState(false);
  const [entrada, setEntrada] = useState('');

  // Al cambiar de jugadora o de parte, los detalles se vuelven a ocultar.
  useEffect(() => { setAbierto(false); setDetalle(null); setAviso(''); }, [jugadoraId, parte?.id]);
  useEffect(() => () => bloquear(), []);

  const abrir = async () => {
    if (!parte) return;
    const d = await abrirDetalle(parte.id);
    if (d === 'bloqueado') { setBloqueado(true); setAbierto(true); return; }
    setBloqueado(false);
    setDetalle(d ?? detalleVacio());
    setAbierto(true);
  };
  const tocar = () => {
    const t = Date.now();
    if (t - ultimoToque.current < 600) { ultimoToque.current = 0; void abrir(); } else ultimoToque.current = t;
  };

  const quitarPantalla = () => { setAbierto(false); setDetalle(null); setBloqueado(false); setPin(''); bloquear(); };

  if (!parte) {
    if (historial.length === 0) return null;
    return <p className="meta">Sin lesión ahora. {historial.length} {historial.length === 1 ? 'parte anterior' : 'partes anteriores'}, solo en este móvil.</p>;
  }

  const fase = FASES_VUELTA[parte.fase] ?? FASES_VUELTA[0];
  const guardarResumen = async (c: Partial<Resumen>) => { if (!(await guardarParte(parte.id, c))) setAviso('No se pudo guardar.'); refrescar(); };
  const guardarTodo = async (d: Detalle, c: Partial<Resumen> = {}) => {
    setDetalle(d);
    if (!(await guardarParte(parte.id, c, d))) setAviso('No se pudo guardar. Si hay PIN, desbloquea primero.'); else setAviso('');
    refrescar();
  };

  return (
    <div className="parte-salud" data-v={version}>
      <button className={`chip ${parte.estado === 'baja' ? 'on estado-trabajar' : ''}`} onClick={tocar} aria-label="Resumen de salud: toca dos veces para ver el parte">
        <span aria-hidden>{parte.estado === 'baja' ? '● ' : '◐ '}</span>
        {parte.estado === 'baja' ? 'Baja' : 'En duda'} · {diasDeBaja(parte)} {diasDeBaja(parte) === 1 ? 'día' : 'días'}
        {parte.vuelta ? ` · vuelta ${bonita(parte.vuelta)}` : ''}
      </button>
      <p className="meta">{FASES_VUELTA.indexOf(fase) + 1} de {FASES_VUELTA.length}: {fase.nombre}{parte.sinContacto ? ' · sin contacto' : ''}{parte.maxMinutos ? ` · máx. ${parte.maxMinutos} min` : ''}</p>
      {!abierto && <p className="meta">Toca dos veces el resumen para ver el parte{hayPin() ? ' (pide el PIN)' : ''}. Solo está en este móvil y no va en ninguna copia.</p>}

      {abierto && bloqueado && (
        <div className="siguiente">
          <label className="campo-diario"><span>PIN del parte de salud</span>
            <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))} inputMode="numeric" type="password" autoComplete="off" placeholder="4 a 8 cifras" /></label>
          {aviso && <p className="aviso" role="alert">{aviso}</p>}
          <button className="principal ancho" disabled={pin.length < 4} onClick={async () => { if (await desbloquear(pin)) { setPin(''); setAviso(''); void abrir(); } else setAviso('Ese PIN no es.'); }}>Ver el parte</button>
          <button className="secundario ancho" onClick={quitarPantalla}>Cancelar</button>
        </div>
      )}

      {abierto && !bloqueado && detalle && (
        <div className="siguiente">
          <label className="campo-diario"><span>Qué le pasa</span>
            <input value={detalle.tipo} maxLength={120} placeholder="Tipo de lesión" onChange={(e) => setDetalle({ ...detalle, tipo: e.target.value })} onBlur={() => void guardarTodo(detalle)} /></label>
          <div className="niveles filtro" role="group" aria-label="Gravedad">
            {GRADOS.map((g) => (
              <button key={g.id} className={detalle.grado === g.id ? 'chip on' : 'chip'} aria-pressed={detalle.grado === g.id} onClick={() => void guardarTodo({ ...detalle, grado: detalle.grado === g.id ? '' : g.id })}>{g.nombre}</button>
            ))}
          </div>
          <label className="campo-diario"><span>Vuelta estimada</span>
            <input type="date" value={parte.vuelta ?? ''} onChange={(e) => void guardarResumen({ vuelta: e.target.value || undefined })} /></label>

          <h3 className="sub">Vuelta progresiva</h3>
          <div className="niveles filtro" role="group" aria-label="Fase de la vuelta">
            {FASES_VUELTA.map((f, i) => (
              <button key={f.nombre} className={parte.fase === i ? 'chip on' : 'chip'} aria-pressed={parte.fase === i} onClick={() => void guardarResumen({ fase: i, sinContacto: i >= 1 && i <= 2 ? true : i === 4 ? false : parte.sinContacto })}>{i + 1}. {f.nombre}</button>
            ))}
          </div>
          <p className="meta">{fase.texto} Es orientativo: la pauta la marca su médico o fisio.</p>

          <h3 className="sub">Control de carga</h3>
          <button className={parte.sinContacto ? 'chip on' : 'chip'} aria-pressed={parte.sinContacto} onClick={() => void guardarResumen({ sinContacto: !parte.sinContacto })}>Sin contacto</button>
          <label className="campo-diario"><span>Minutos máximos por sesión</span>
            <input type="number" inputMode="numeric" min={0} max={180} value={parte.maxMinutos ?? ''} placeholder="Sin límite" onChange={(e) => void guardarResumen({ maxMinutos: Number(e.target.value) > 0 ? Number(e.target.value) : undefined })} /></label>
          <label className="campo-diario"><span>Restricciones, con palabras</span>
            <textarea rows={2} maxLength={600} value={detalle.nota} placeholder="No saltar, no correr en cuesta…" onChange={(e) => setDetalle({ ...detalle, nota: e.target.value })} onBlur={() => void guardarTodo(detalle)} /></label>

          <h3 className="sub">Evolución</h3>
          <ul className="lista">
            {detalle.evolucion.slice().reverse().map((e, i) => <li key={i} className="meta">{bonita(e.fecha)} · {e.texto}</li>)}
            {detalle.evolucion.length === 0 && <li className="meta">Aún no hay notas de evolución.</li>}
          </ul>
          <label className="campo-diario"><span>Anotar cómo va</span>
            <input value={entrada} maxLength={400} placeholder="Sin dolor al trotar…" onChange={(e) => setEntrada(e.target.value)} /></label>
          <button className="secundario ancho" disabled={!entrada.trim()} onClick={() => { void guardarTodo({ ...detalle, evolucion: [...detalle.evolucion, { fecha: hoy(), texto: entrada.trim() }] }); setEntrada(''); }}>Añadir a la evolución</button>

          <h3 className="sub">PIN</h3>
          {hayPin() ? (
            <button className="secundario ancho" onClick={async () => setAviso((await quitarPin()) ? 'PIN quitado.' : 'No se pudo quitar el PIN.')}>Quitar el PIN</button>
          ) : (
            <>
              <label className="campo-diario"><span>Proteger el parte con un PIN (4 a 8 cifras)</span>
                <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))} inputMode="numeric" type="password" autoComplete="off" /></label>
              <button className="secundario ancho" disabled={pin.length < 4} onClick={async () => { setAviso((await ponerPin(pin)) ? 'PIN puesto: los detalles quedan cifrados. No lo olvides, no se puede recuperar.' : 'No se pudo poner el PIN.'); setPin(''); }}>Poner PIN</button>
            </>
          )}
          {aviso && <p className="aviso" role="status">{aviso}</p>}
          <button className="secundario ancho" onClick={quitarPantalla}>Ocultar el parte</button>
        </div>
      )}
    </div>
  );
}
