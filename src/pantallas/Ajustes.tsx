import { useState } from 'react';
import { Pista } from '../pizarra/Pista';
import { armarCopia, juntar, leerCopia } from '../copia';
import { guardarTodosMios, leerMios } from '../sistemas/almacen';
import { SISTEMAS } from '../sistemas/datos';
import { aplicarColores, leerColores, NOMBRES_COLOR, PALETAS, type Colores } from '../temas';

const CAMPOS = Object.keys(NOMBRES_COLOR) as (keyof Colores)[];
const igual = (a: Colores, b: Colores) => CAMPOS.every((k) => a[k].toLowerCase() === b[k].toLowerCase());

export function Ajustes() {
  const [c, setC] = useState(leerColores);
  const [aviso, setAviso] = useState('');
  const poner = (n: Colores) => {
    setC(n);
    aplicarColores(n);
  };

  const descargar = () => {
    const mios = leerMios();
    const archivo = new Blob([armarCopia(mios, c)], { type: 'application/json' });
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(archivo);
    enlace.download = `cuernos-copia-${new Date().toISOString().slice(0, 10)}.json`;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
    setAviso(`Copia descargada: ${mios.length} ${mios.length === 1 ? 'jugada' : 'jugadas'} y tus colores.`);
  };

  const cargar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    try {
      const copia = leerCopia(await archivo.text());
      guardarTodosMios(juntar(leerMios(), copia.mios));
      if (copia.colores) poner(copia.colores);
      setAviso(`Copia cargada: ${copia.mios.length} ${copia.mios.length === 1 ? 'jugada' : 'jugadas'}${copia.colores ? ' y los colores' : ''}.`);
    } catch (err) {
      setAviso(err instanceof Error ? err.message : 'No se ha podido cargar la copia.');
    }
  };

  return (
    <section className="pantalla">
      <h1 className="titulo">Ajustes</h1>
      <h2 className="sub">Colores</h2>
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

      <h2 className="sub">Copia de seguridad</h2>
      <p className="vacio">Tus jugadas solo están en este móvil. Descarga una copia para pasarlas a otro o por si se borra Safari.</p>
      <div className="copia">
        <button onClick={descargar}>Descargar copia</button>
        <label className="cargar">
          Cargar copia
          <input id="cargar-copia" type="file" accept="application/json,.json" onChange={cargar} />
        </label>
      </div>
      {aviso && <p className="aviso-copia" role="status">{aviso}</p>}
    </section>
  );
}
