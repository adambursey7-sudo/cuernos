import { useState } from 'react';
import { Pista } from '../pizarra/Pista';
import { SISTEMAS } from '../sistemas/datos';
import { aplicarColores, leerColores, NOMBRES_COLOR, PALETAS, type Colores } from '../temas';

const CAMPOS = Object.keys(NOMBRES_COLOR) as (keyof Colores)[];
const igual = (a: Colores, b: Colores) => CAMPOS.every((k) => a[k].toLowerCase() === b[k].toLowerCase());

export function Ajustes() {
  const [c, setC] = useState(leerColores);
  const poner = (n: Colores) => {
    setC(n);
    aplicarColores(n);
  };

  return (
    <section className="pantalla">
      <h1 className="titulo">Colores</h1>
      <div className="muestra">
        <Pista sistema={SISTEMAS[0]} t={2} />
      </div>
      <h2 className="sub">Paletas</h2>
      <div className="paletas">
        {PALETAS.map((p) => (
          <button key={p.id} className={igual(p, c) ? 'paleta on' : 'paleta'} onClick={() => poner({ ...p })}>
            <span className="franjas">
              {[p.pista, p.principal, p.jugadores, p.fondo].map((x, i) => <span key={i} style={{ background: x }} />)}
            </span>
            {p.nombre}
          </button>
        ))}
      </div>
      <h2 className="sub">Cambiar un color</h2>
      <div className="colores">
        {CAMPOS.map((k) => (
          <label key={k} className="color">
            <input id={'color-' + k} type="color" value={c[k]} onChange={(e) => poner({ ...c, [k]: e.target.value })} />
            {NOMBRES_COLOR[k]}
          </label>
        ))}
      </div>
      <button className="restaurar" onClick={() => poner({ ...PALETAS[0] })} disabled={igual(PALETAS[0], c)}>
        Volver a Parqué
      </button>
    </section>
  );
}
