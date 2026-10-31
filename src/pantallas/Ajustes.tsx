import { useState } from 'react';
import { cerrarSesion, usuarioActual } from '../Acceso';
import { introActiva, ponerIntroActiva } from '../Intro';
import { EspaciosCancha } from './EspaciosCancha';
import { Pista } from '../pizarra/Pista';
import { guardarDiario, juntarDiario, leerDiario } from '../diario/diario';
import { anotarCopia } from '../copiaFecha';
import { armarCopia, juntar, leerCopia } from '../copia';
import { guardarReflexiones, juntarReflexiones, leerReflexiones } from '../diario/reflexion';
import { guardarEtiquetas, leerEtiquetas } from '../habilidades/habilidades';
import { guardarFichas, juntarFichas, leerFichas } from '../recursos/fichas';
import { guardarRecursos, juntarRecursos, leerRecursos } from '../recursos/recursos';
import { guardarTemporadas, juntarTemporadas, leerTemporadas } from '../temporada/temporada';
import { guardarTodosMios, leerMios } from '../sistemas/almacen';
import { guardarSesiones, juntarSesiones, leerSesiones } from '../sesiones/sesiones';
import { guardarEspacios, leerEspacios } from '../sistemas/espacios';
import { guardarFavoritos, leerFavoritos } from '../favoritos';
import { SISTEMAS } from '../sistemas/datos';
import { aplicarLectura, ESCALAS, leerLectura, NOMBRES_LETRA, type Letra } from '../preferencias';
import { aplicarColores, leerColores, NOMBRES_COLOR, PALETAS, type Colores } from '../temas';

const CAMPOS = Object.keys(NOMBRES_COLOR) as (keyof Colores)[];
const igual = (a: Colores, b: Colores) => CAMPOS.every((k) => a[k].toLowerCase() === b[k].toLowerCase());

export function Ajustes() {
  const [c, setC] = useState(leerColores);
  const [aviso, setAviso] = useState('');
  const [intro, setIntro] = useState(introActiva);
  const [conSalud, setConSalud] = useState(false);
  const [verEspacios, setVerEspacios] = useState(false);
  const [lectura, setLectura] = useState(leerLectura);
  const leer = (n: typeof lectura) => { setLectura(n); aplicarLectura(n); };
  const poner = (n: Colores) => {
    setC(n);
    aplicarColores(n);
  };

  const descargar = async () => {
    const mios = leerMios();
    const nombre = `horns-copia-${new Date().toISOString().slice(0, 10)}.json`;
    const archivo = new File([armarCopia(mios, c, leerDiario(), leerTemporadas(), leerRecursos(), leerFichas(), conSalud, leerEtiquetas(), leerReflexiones(), leerSesiones(), leerEspacios(), leerFavoritos())], nombre, { type: 'application/json' });
    const njug = leerDiario().jugadoras.length;
    const resumen = `${mios.length} ${mios.length === 1 ? 'jugada' : 'jugadas'}, ${njug} ${njug === 1 ? 'jugadora' : 'jugadoras'} y tus colores`;
    // En el móvil se abre el menú de compartir (Drive, Archivos, AirDrop…); si no hay, se descarga.
    if (navigator.canShare?.({ files: [archivo] })) {
      try {
        await navigator.share({ files: [archivo], title: 'Copia de Horns' });
        anotarCopia();
        setAviso(`Copia guardada: ${resumen}.`);
      } catch { /* cerró el menú sin guardar: no se anota */ }
      return;
    }
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(archivo);
    enlace.download = nombre;
    enlace.click();
    // Safari empieza la descarga más tarde: si se suelta el archivo enseguida, la copia sale vacía.
    setTimeout(() => URL.revokeObjectURL(enlace.href), 60_000);
    anotarCopia();
    setAviso(`Copia descargada: ${resumen}.`);
  };

  const cargar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    let copia: ReturnType<typeof leerCopia>;
    try {
      copia = leerCopia(await archivo.text());
    } catch (err) {
      setAviso(err instanceof Error ? err.message : 'No se ha podido cargar la copia.');
      return;
    }
    if (copia.colores) poner(copia.colores);
    // Cada trozo se guarda por separado: si uno falla, se dice qué entró y qué no.
    const pasos: [string, () => boolean][] = [
      ['las jugadas', () => { guardarTodosMios(juntar(leerMios(), copia.mios)); return true; }],
      ['la plantilla', () => !copia.diario || guardarDiario(juntarDiario(leerDiario(), copia.diario))],
      ['la temporada', () => !copia.temporadas || guardarTemporadas(juntarTemporadas(leerTemporadas(), copia.temporadas))],
      ['los recursos', () => !copia.recursos || guardarRecursos(juntarRecursos(leerRecursos(), copia.recursos))],
      ['las fichas', () => !copia.fichas || guardarFichas(juntarFichas(leerFichas(), copia.fichas))],
      ['las etiquetas', () => !copia.etiquetas || guardarEtiquetas({ ...leerEtiquetas(), ...copia.etiquetas })],
      ['el diario', () => !copia.reflexiones || guardarReflexiones(juntarReflexiones(leerReflexiones(), copia.reflexiones))],
      ['las sesiones', () => !copia.sesiones || guardarSesiones(juntarSesiones(leerSesiones(), copia.sesiones))],
      ['los espacios de la cancha', () => !copia.espacios || guardarEspacios(copia.espacios)],
      ['los favoritos', () => !copia.favoritos || guardarFavoritos([...leerFavoritos(), ...copia.favoritos])],
    ];
    const hechos: string[] = [];
    for (const [nombre, paso] of pasos) {
      let bien = false;
      try { bien = paso(); } catch { /* cuenta como fallo */ }
      if (!bien) {
        setAviso(`Se cargó a medias. No pude guardar ${nombre}: libera espacio en el móvil y vuelve a cargar la copia.${hechos.length ? ` Sí entraron: ${hechos.join(', ')}.` : ''}`);
        return;
      }
      hechos.push(nombre);
    }
    setAviso(`Copia cargada: ${copia.mios.length} ${copia.mios.length === 1 ? 'jugada' : 'jugadas'}${copia.diario ? `, ${copia.diario.jugadoras.length} jugadoras` : ''}${copia.sesiones ? `, ${copia.sesiones.length} ${copia.sesiones.length === 1 ? 'sesión' : 'sesiones'}` : ''}${copia.colores ? ' y los colores' : ''}.`);
  };

  if (verEspacios)
    return (
      <section className="pantalla">
        <div className="cabecera">
          <button className="atras" onClick={() => { setVerEspacios(false); window.scrollTo(0, 0); }} aria-label="Volver a Más">‹</button>
          <h1 className="titulo">Espacios de la cancha</h1>
        </div>
        <EspaciosCancha />
      </section>
    );

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

      <h2 className="sub">Espacios de la cancha</h2>
      <p className="meta">Los 9 sitios donde juegan tus jugadoras. Claude los usa al dibujar tus ejercicios.</p>
      <button className="secundario ancho" onClick={() => { setVerEspacios(true); window.scrollTo(0, 0); }}>Ver y cambiar los espacios ›</button>

      <h2 className="sub">Copia de seguridad</h2>
      <p className="vacio">Tus jugadas y tu plantilla solo están en este móvil. La copia incluye los nombres de las jugadoras: guárdala donde no la vea nadie más. Guarda una copia (en Drive, Archivos…) para pasarlas a otro móvil o por si se borra Safari.</p>
      <label className="salud-copia">
        <input type="checkbox" checked={conSalud} onChange={(ev) => setConSalud(ev.target.checked)} />
        Incluir las lesiones (dato de salud)
      </label>
      <div className="copia">
        <button onClick={() => void descargar()}>Guardar copia</button>
        <label className="cargar">
          Cargar copia
          <input id="cargar-copia" type="file" accept="application/json,.json" onChange={cargar} />
        </label>
      </div>
      {aviso && <p className="aviso-copia" role="status">{aviso}</p>}

      <h2 className="sub">Sesión</h2>
      <p className="vacio">Entraste como {usuarioActual() ?? 'Adam'}.</p>
      <button className="restaurar" onClick={cerrarSesion}>Cerrar sesión</button>
    </section>
  );
}
