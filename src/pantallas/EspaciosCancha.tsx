// «Espacios de la cancha» (boceto aprobado por Adam, 30/10): los 9 sitios donde juegan las jugadoras. Se arrastran con el
// dedo, se renombran y se guardan en este móvil; Claude los recibe con cada encargo. Solo nombres de sitios, nunca de personas.
import { useRef, useState } from 'react';
import { Cancha, Suelo } from '../pizarra/Cancha';
import { esExterior, espaciosDeSiempre, guardarEspacios, leerEspacios, MAX_NOMBRE, nombreLimpio, sujetarPunto, type Espacio } from '../sistemas/espacios';

const PASO = 2;

export function EspaciosCancha() {
  const [lista, setLista] = useState<Espacio[]>(leerEspacios);
  const [sel, setSel] = useState(0);
  const [aviso, setAviso] = useState('');
  const [cambios, setCambios] = useState(false);
  const arrastrando = useRef(-1);
  const svg = useRef<SVGSVGElement>(null);

  const poner = (i: number, parte: Partial<Espacio>) => {
    setLista((l) => l.map((e, k) => (k === i ? { ...e, ...parte } : e)));
    setCambios(true);
    setAviso('');
  };
  const mover = (i: number, dx: number, dy: number) => poner(i, { punto: sujetarPunto([lista[i].punto[0] + dx, lista[i].punto[1] + dy]) });

  const enPista = (ev: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    return sujetarPunto([((ev.clientX - r.left) / r.width) * 150, ((ev.clientY - r.top) / r.height) * 140]);
  };
  const agarrar = (ev: React.PointerEvent, i: number) => {
    arrastrando.current = i;
    setSel(i);
    svg.current?.setPointerCapture(ev.pointerId);
  };
  const guardar = () => {
    const ok = guardarEspacios(lista);
    setAviso(ok ? 'Guardado en este móvil.' : 'El móvil no deja guardar: libera espacio e inténtalo otra vez.');
    if (ok) setCambios(false);
  };

  return (
    <>
      <p className="meta">Arrastra un punto para moverlo y cambia su nombre. Claude usará estos sitios al dibujar tus ejercicios.</p>
      <div className="pizarra">
        <svg ref={svg} className="pista espacios" viewBox="0 0 150 140" role="group" aria-label="Media pista con los espacios"
          onPointerMove={(ev) => { if (arrastrando.current >= 0) poner(arrastrando.current, { punto: enPista(ev) }); }}
          onPointerUp={() => { arrastrando.current = -1; }} onPointerCancel={() => { arrastrando.current = -1; }}>
          <Suelo />
          <Cancha />
          {lista.map((e, i) => (
            <g key={e.id} className={`espacio ${esExterior(e.punto) ? 'fuera' : 'dentro'}${i === sel ? ' sel' : ''}`}>
              <circle cx={e.punto[0]} cy={e.punto[1]} r="4" onPointerDown={(ev) => agarrar(ev, i)} />
              <text x={e.punto[0]} y={e.punto[1] - 6} textAnchor="middle">{e.nombre}</text>
            </g>
          ))}
        </svg>
      </div>
      <div className="fila-espacios">
        {lista.map((e, i) => (
          <div key={e.id} className={i === sel ? 'fila-espacio sel' : 'fila-espacio'}>
            <span className={`punto ${esExterior(e.punto) ? 'fuera' : 'dentro'}`} aria-hidden="true" />
            <input value={e.nombre} maxLength={MAX_NOMBRE} aria-label={`Nombre del espacio ${i + 1}`} onFocus={() => setSel(i)}
              onChange={(ev) => poner(i, { nombre: ev.target.value })}
              onBlur={() => poner(i, { nombre: nombreLimpio(e.nombre) || espaciosDeSiempre()[i].nombre })} />
            <small>{e.punto[0]},{e.punto[1]}</small>
          </div>
        ))}
      </div>
      <div className="fila-chips" role="group" aria-label={`Mover ${lista[sel].nombre}`}>
        <button className="chip" onClick={() => mover(sel, -PASO, 0)} aria-label="A la izquierda">◀</button>
        <button className="chip" onClick={() => mover(sel, 0, -PASO)} aria-label="Hacia la canasta">▲</button>
        <button className="chip" onClick={() => mover(sel, 0, PASO)} aria-label="Hacia el medio campo">▼</button>
        <button className="chip" onClick={() => mover(sel, PASO, 0)} aria-label="A la derecha">▶</button>
      </div>
      {aviso && <p className="aviso" role="status">{aviso}</p>}
      <button className="principal ancho" onClick={guardar} disabled={!cambios}>Guardar</button>
      <button className="secundario ancho" onClick={() => { setLista(espaciosDeSiempre()); setCambios(true); setAviso(''); }}>Volver a los de siempre</button>
      <p className="meta">Rojos: fuera de la línea de tres (exteriores). Azules: dentro (interiores). Escribe solo nombres de sitios, nunca de personas. «Volver a los de siempre» no cambia nada hasta que pulses Guardar.</p>
    </>
  );
}
