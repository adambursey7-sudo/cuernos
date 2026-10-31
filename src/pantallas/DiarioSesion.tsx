// Diario de dos minutos (vuelta 5, idea de Coach Reflection): cuatro toques y tres frases tras el entreno.
import { useState } from 'react';
import { hoy, type Equipo } from '../diario/diario';
import { ANIMOS, guardarReflexiones, leerReflexiones, nuevaReflexion, recientes, vacia, type Reflexion } from '../diario/reflexion';

const fechaCorta = (f: string) => f.split('-').reverse().join('/');

export function DiarioSesion({ equipo }: { equipo: Equipo }) {
  const [todas, setTodas] = useState(leerReflexiones);
  const [borrador, setBorrador] = useState<Reflexion>(() => nuevaReflexion(equipo.id, hoy()));
  const [fallo, setFallo] = useState(false);
  const lista = recientes(todas, equipo.id);

  const guardar = () => {
    if (vacia(borrador)) return;
    const n = [borrador, ...todas];
    if (guardarReflexiones(n)) { setTodas(n); setBorrador(nuevaReflexion(equipo.id, hoy())); setFallo(false); }
    else setFallo(true);
  };
  const borrar = (id: string) => { const n = todas.filter((r) => r.id !== id); if (guardarReflexiones(n)) setTodas(n); else setFallo(true); };
  const campo = (k: 'funciono' | 'no' | 'proximo', etiqueta: string, ayuda: string) => (
    <label className="campo-diario">
      <span>{etiqueta}</span>
      <textarea value={borrador[k]} rows={2} onChange={(ev) => setBorrador({ ...borrador, [k]: ev.target.value })} placeholder={ayuda} />
    </label>
  );

  return (
    <div className="diario-sesion">
      <h2 className="sub">¿Cómo ha ido? · {fechaCorta(borrador.fecha)}</h2>
      <div className="niveles filtro envuelto" role="group" aria-label="Cómo ha ido">
        {ANIMOS.map((a) => <button key={a.id} className={borrador.animo === a.id ? 'chip on' : 'chip'} aria-pressed={borrador.animo === a.id} aria-label={a.nombre} onClick={() => setBorrador({ ...borrador, animo: a.id })}>{a.icono}</button>)}
      </div>
      {campo('funciono', 'Qué funcionó', 'La salida rápida…')}
      {campo('no', 'Qué no', 'El rebote…')}
      {campo('proximo', 'Para el próximo', 'Repetir 3x2…')}
      <p className="meta">Sin nombres de jugadoras: esto es del equipo.</p>
      {fallo && <p className="aviso">El móvil no deja guardar: libera espacio o haz una copia.</p>}
      <button className="principal ancho" disabled={vacia(borrador)} onClick={guardar}>Guardar</button>

      <h2 className="sub">Anteriores</h2>
      {lista.length === 0 && <p className="vacio">Aún no hay nada apuntado. Dos minutos después del entreno y listo.</p>}
      <ul className="lista notas">
        {lista.map((r) => (
          <li key={r.id} className="nota-jugadora">
            <span className="meta">{fechaCorta(r.fecha)} · {ANIMOS.find((a) => a.id === r.animo)?.icono}</span>
            {r.funciono && <p><b>Funcionó:</b> {r.funciono}</p>}
            {r.no && <p><b>No:</b> {r.no}</p>}
            {r.proximo && <p><b>Próximo:</b> {r.proximo}</p>}
            <button className="chip pequeno" onClick={() => borrar(r.id)}>Borrar</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
