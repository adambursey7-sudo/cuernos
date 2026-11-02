// Logística del viaje de un partido fuera (loop Herramienta diaria, tramo 4). Una sola tarjeta desplegable dentro del partido:
// transporte y comidas, lista de material con casillas y gastos con el reparto por persona. Convocados por dorsal.
import { useState } from 'react';
import type { Jugadora } from '../diario/diario';
import type { Evento } from '../temporada/temporada';
import { euros, gastoPorPersona, materialPendiente, mensajeViaje, nuevoGasto, nuevoMaterial, nuevoViaje, totalGastos, type Viaje } from '../viajes/viaje';

export function ViajePartido({ e, equipo, jugadoras, poner }: { e: Evento; equipo: string; jugadoras: Jugadora[]; poner: (c: Partial<Evento>) => void }) {
  const v = e.viaje ?? nuevoViaje();
  const [aviso, setAviso] = useState('');
  const cambiar = (c: Partial<Viaje>) => poner({ viaje: { ...v, ...c } });
  const viajeros = jugadoras.filter((j) => e.convocados?.includes(j.id)).map((j) => j.numero).filter(Boolean);
  const pendiente = materialPendiente(v);
  const total = totalGastos(v);

  const copiar = async () => {
    const texto = mensajeViaje({ equipo, rival: e.titulo, fecha: e.fecha.split('-').reverse().join('/'), hora: e.hora, lugar: e.lugar, salida: e.salida, convocados: viajeros }, e.viaje);
    try { await navigator.clipboard.writeText(texto); setAviso('Mensaje copiado, con dorsales y sin gastos.'); } catch { setAviso('Este móvil no deja copiar.'); }
  };

  return (
    <details className="viaje-partido">
      <summary><b>Viaje y logística</b> {pendiente.length > 0 && e.viaje ? <span className="meta">· falta llevar {pendiente.length}</span> : null}</summary>
      <label className="campo-diario"><span>Transporte</span><input value={v.transporte} maxLength={80} placeholder="Guagua del club, coches de familias…" onChange={(ev) => cambiar({ transporte: ev.target.value })} /></label>
      <label className="campo-diario"><span>Punto de encuentro</span><input value={v.encuentro} maxLength={120} placeholder="Puerta del pabellón" onChange={(ev) => cambiar({ encuentro: ev.target.value })} /></label>
      <div className="dos-botones">
        <label className="campo-diario"><span>Salida</span><input type="time" value={e.salida ?? ''} onChange={(ev) => poner({ salida: ev.target.value || undefined })} /></label>
        <label className="campo-diario"><span>Vuelta</span><input type="time" value={v.vuelta ?? ''} onChange={(ev) => cambiar({ vuelta: ev.target.value || undefined })} /></label>
      </div>
      <label className="campo-diario"><span>Alojamiento</span><input value={v.alojamiento} maxLength={120} placeholder="(si hay noche fuera)" onChange={(ev) => cambiar({ alojamiento: ev.target.value })} /></label>
      <label className="campo-diario"><span>Comidas</span><input value={v.comidas} maxLength={160} placeholder="Bocadillo en el viaje, comida en…" onChange={(ev) => cambiar({ comidas: ev.target.value })} /></label>

      <h4 className="sub">Viajan: {viajeros.length}</h4>
      <p className="meta">{viajeros.length ? viajeros.map((n) => `#${n}`).join(' ') : 'Marca antes la convocatoria del partido.'}</p>

      <h4 className="sub">Material</h4>
      <ul className="lista">
        {v.material.map((m) => (
          <li key={m.id} className="marca-linea">
            <label><input type="checkbox" checked={m.llevado} onChange={(ev) => cambiar({ material: v.material.map((x) => (x.id === m.id ? { ...x, llevado: ev.target.checked } : x)) })} /> {m.texto}</label>
            <button className="chip pequeno" aria-label={`Quitar ${m.texto}`} onClick={() => cambiar({ material: v.material.filter((x) => x.id !== m.id) })}>Quitar</button>
          </li>
        ))}
      </ul>
      <button className="chip" onClick={() => { const t = window.prompt('¿Qué más hay que llevar?')?.trim(); if (t) cambiar({ material: [...v.material, { ...nuevoMaterial(t) }] }); }}>+ Añadir material</button>

      <h4 className="sub">Gastos · {euros(total)}</h4>
      <ul className="lista">
        {v.gastos.map((g) => (
          <li key={g.id} className="dos-botones">
            <input aria-label="Concepto" value={g.concepto} maxLength={60} placeholder="Autobús" onChange={(ev) => cambiar({ gastos: v.gastos.map((x) => (x.id === g.id ? { ...x, concepto: ev.target.value } : x)) })} />
            <input aria-label="Euros" inputMode="decimal" value={g.euros || ''} placeholder="0" onChange={(ev) => cambiar({ gastos: v.gastos.map((x) => (x.id === g.id ? { ...x, euros: Math.max(0, Number(ev.target.value.replace(',', '.')) || 0) } : x)) })} />
            <button className="chip pequeno" aria-label="Quitar gasto" onClick={() => cambiar({ gastos: v.gastos.filter((x) => x.id !== g.id) })}>Quitar</button>
          </li>
        ))}
      </ul>
      <button className="chip" onClick={() => cambiar({ gastos: [...v.gastos, nuevoGasto()] })}>+ Añadir gasto</button>
      {total > 0 && viajeros.length > 0 && <p className="meta">Entre {viajeros.length} que viajan: {euros(gastoPorPersona(v, viajeros.length))} por persona.</p>}

      <label className="campo-diario"><span>Notas</span><textarea rows={2} maxLength={400} value={v.notas} placeholder="Para las familias o para ti" onChange={(ev) => cambiar({ notas: ev.target.value })} /></label>
      <button className="chip" onClick={() => void copiar()}>Copiar el aviso del viaje para las familias</button>
      {aviso && <p className="meta" role="status">{aviso}</p>}
    </details>
  );
}
