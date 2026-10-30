import { useState } from 'react';
import { introActiva, ponerIntroActiva } from '../Intro';
import { Pista } from '../pizarra/Pista';
import { guardarDiario, juntarDiario, leerDiario } from '../diario/diario';
import { armarCopia, juntar, leerCopia } from '../copia';
import { guardarFichas, juntarFichas, leerFichas } from '../recursos/fichas';
import { guardarRecursos, juntarRecursos, leerRecursos } from '../recursos/recursos';
import { guardarTemporadas, juntarTemporadas, leerTemporadas } from '../temporada/temporada';
import { guardarTodosMios, leerMios } from '../sistemas/almacen';
import { SISTEMAS } from '../sistemas/datos';
import { aplicarLectura, ESCALAS, leerLectura, NOMBRES_LETRA, type Letra } from '../preferencias';
import { aplicarColores, leerColores, NOMBRES_COLOR, PALETAS, type Colores } from '../temas';

const CAMPOS = Object.keys(NOMBRES_COLOR) as (keyof Colores)[];
const igual = (a: Colores, b: Colores) => CAMPOS.every((k) => a[k].toLowerCase() === b[k].toLowerCase());

export function Ajustes() {
  const [c, setC] = useState(leerColores);
  const [aviso, setAviso] = useState('');
  const [intro, setIntro] = useState(introActiva);
  const [lectura, setLectura] = useState(leerLectura);
  const leer = (n: typeof lectura) => { setLectura(n); aplicarLectura(n); };
  const poner = (n: Colores) => {
    setC(n);
    aplicarColores(n);
  };

  const descargar = () => {
    const mios = leerMios();
    const archivo = new Blob([armarCopia(mios, c, leerDiario(), leerTemporadas(), leerRecursos(), leerFichas())], { type: 'application/json' });
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(archivo);
    enlace.download = `horns-copia-${new Date().toISOString().slice(0, 10)}.json`;
    enlace.click();
    // Safari empieza la descarga más tarde: si se suelta el archivo enseguida, la copia sale vacía.
    setTimeout(() => URL.revokeObjectURL(enlace.href), 60_000);
    const njug = leerDiario().jugadoras.length;
    setAviso(`Copia descargada: ${mios.length} ${mios.length === 1 ? 'jugada' : 'jugadas'}, ${njug} ${njug === 1 ? 'jugadora' : 'jugadoras'} y tus colores.`);
  };

  const cargar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    try {
      const copia = leerCopia(await archivo.text());
      guardarTodosMios(juntar(leerMios(), copia.mios));
      if (copia.diario && !guardarDiario(juntarDiario(leerDiario(), copia.diario))) throw new Error('El móvil no deja guardar la plantilla: libera espacio e inténtalo otra vez.');
      if (copia.temporadas && !guardarTemporadas(juntarTemporadas(leerTemporadas(), copia.temporadas))) throw new Error('El móvil no deja guardar la temporada: libera espacio e inténtalo otra vez.');
      if (copia.recursos && !guardarRecursos(juntarRecursos(leerRecursos(), copia.recursos))) throw new Error('El móvil no deja guardar los recursos: libera espacio e inténtalo otra vez.');
      if (copia.fichas && !guardarFichas(juntarFichas(leerFichas(), copia.fichas))) throw new Error('El móvil no deja guardar las fichas: libera espacio e inténtalo otra vez.');
      if (copia.colores) poner(copia.colores);
      setAviso(`Copia cargada: ${copia.mios.length} ${copia.mios.length === 1 ? 'jugada' : 'jugadas'}${copia.diario ? `, ${copia.diario.jugadoras.length} jugadoras` : ''}${copia.colores ? ' y los colores' : ''}.`);
    } catch (err) {
      setAviso(err instanceof Error ? err.message : 'No se ha podido cargar la copia.');
    }
  };

  return (
    <section className="pantalla">
      <h1 className="titulo">Más</h1>
      <h2 className="sub">Entrada</h2>
      <label className="campo-diario">
        <span><input type="checkbox" checked={intro} onChange={(ev) => { setIntro(ev.target.checked); ponerIntroActiva(ev.target.checked); }} /> Vídeo de entrada al abrir la app (una vez al día)</span>
      </label>
      <h2 className="sub">Lectura</h2>
      <div className="letras" role="group" aria-label="Tamaño de letra">
        {(Object.keys(ESCALAS) as Letra[]).map((l) => (
          <button key={l} className={l === lectura.letra ? 'on' : ''} aria-pressed={l === lectura.letra} onClick={() => leer({ ...lectura, letra: l })} style={{ fontSize: `${ESCALAS[l]}rem` }}>
            {NOMBRES_LETRA[l]}
          </button>
        ))}
      </div>
      <label className="campo-diario">
        <span><input type="checkbox" checked={lectura.quieto} onChange={(ev) => leer({ ...lectura, quieto: ev.target.checked })} /> Reducir movimiento (sin animaciones)</span>
      </label>
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
      <p className="vacio">Tus jugadas y tu plantilla solo están en este móvil. La copia incluye los nombres de las jugadoras: guárdala donde no la vea nadie más. Descarga una copia para pasarlas a otro o por si se borra Safari.</p>
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
