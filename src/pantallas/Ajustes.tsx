import { useState } from 'react';
import { cerrarSesion, usuarioActual } from '../Acceso';
import { introActiva, ponerIntroActiva } from '../Intro';
import { Pista } from '../pizarra/Pista';
import { guardarDiario, juntarDiario, leerDiario } from '../diario/diario';
import { anotarCopia } from '../copiaFecha';
import { armarCopia, juntar, leerCopia, unirTextos } from '../copia';
import { guardarFavoritos, leerFavoritos } from '../favoritos';
import { guardarLista, leerLista, listasPropias } from '../equipo/porEquipo';
import { guardarSesiones, juntarSesiones, leerSesiones } from '../sesiones/sesiones';
import { guardarSemana, leerSemana } from '../sistemas/libro';
import { guardarReflexiones, juntarReflexiones, leerReflexiones } from '../diario/reflexion';
import { guardarEtiquetas, leerEtiquetas } from '../habilidades/habilidades';
import { guardarFichas, juntarFichas, leerFichas } from '../recursos/fichas';
import { guardarRecursos, juntarRecursos, leerRecursos } from '../recursos/recursos';
import { guardarTemporadas, juntarTemporadas, leerTemporadas } from '../temporada/temporada';
import { guardarTodosMios, leerMios } from '../sistemas/almacen';
import { SISTEMAS } from '../sistemas/datos';
import { aplicarLectura, ESCALAS, leerLectura, NOMBRES_LETRA, type Letra } from '../preferencias';
import { aplicarColores, ASPECTOS, guardarAspecto, leerAspecto, leerColores, NOMBRES_COLOR, PALETAS, type Colores } from '../temas';

const CAMPOS = Object.keys(NOMBRES_COLOR) as (keyof Colores)[];
const igual = (a: Colores, b: Colores) => CAMPOS.every((k) => a[k].toLowerCase() === b[k].toLowerCase());

export function Ajustes() {
  const [c, setC] = useState(leerColores);
  const [aspecto, setAspecto] = useState(leerAspecto);
  const [aviso, setAviso] = useState('');
  const [intro, setIntro] = useState(introActiva);
  const [conSalud, setConSalud] = useState(false);
  const [lectura, setLectura] = useState(leerLectura);
  const leer = (n: typeof lectura) => { setLectura(n); aplicarLectura(n); };
  const poner = (n: Colores) => {
    setC(n);
    aplicarColores(n);
  };

  const descargar = async () => {
    const mios = leerMios();
    const nombre = `horns-copia-${new Date().toISOString().slice(0, 10)}.json`;
    const sesiones = leerSesiones();
    const archivo = new File([armarCopia(mios, c, leerDiario(), leerTemporadas(), leerRecursos(), leerFichas(), conSalud, leerEtiquetas(), leerReflexiones(), { sesiones, favoritos: leerFavoritos(), semana: leerSemana(), porEquipo: { favoritos: listasPropias('favoritos'), semana: listasPropias('semana') } })], nombre, { type: 'application/json' });
    const njug = leerDiario().jugadoras.length;
    const nequ = leerDiario().equipos.length;
    const resumen = `${nequ} ${nequ === 1 ? 'equipo' : 'equipos'}, ${njug} ${njug === 1 ? 'jugador o jugadora' : 'jugadores y jugadoras'}, ${sesiones.length} ${sesiones.length === 1 ? 'sesión' : 'sesiones'}, ${mios.length} ${mios.length === 1 ? 'jugada' : 'jugadas'} y tus colores`;
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
    try {
      const copia = leerCopia(await archivo.text());
      guardarTodosMios(juntar(leerMios(), copia.mios));
      if (copia.diario && !guardarDiario(juntarDiario(leerDiario(), copia.diario))) throw new Error('El móvil no deja guardar la plantilla: libera espacio e inténtalo otra vez.');
      if (copia.temporadas && !guardarTemporadas(juntarTemporadas(leerTemporadas(), copia.temporadas))) throw new Error('El móvil no deja guardar la temporada: libera espacio e inténtalo otra vez.');
      if (copia.recursos && !guardarRecursos(juntarRecursos(leerRecursos(), copia.recursos))) throw new Error('El móvil no deja guardar los recursos: libera espacio e inténtalo otra vez.');
      if (copia.fichas && !guardarFichas(juntarFichas(leerFichas(), copia.fichas))) throw new Error('El móvil no deja guardar las fichas: libera espacio e inténtalo otra vez.');
      if (copia.etiquetas && !guardarEtiquetas({ ...leerEtiquetas(), ...copia.etiquetas })) throw new Error('El móvil no deja guardar las etiquetas: libera espacio e inténtalo otra vez.');
      if (copia.reflexiones && !guardarReflexiones(juntarReflexiones(leerReflexiones(), copia.reflexiones))) throw new Error('El móvil no deja guardar el diario: libera espacio e inténtalo otra vez.');
      if (copia.sesiones && !guardarSesiones(juntarSesiones(leerSesiones(), copia.sesiones))) throw new Error('El móvil no deja guardar las sesiones: libera espacio e inténtalo otra vez.');
      if (copia.favoritos) guardarFavoritos(unirTextos(leerFavoritos(), copia.favoritos));
      if (copia.semana) guardarSemana(unirTextos(leerSemana(), copia.semana));
      for (const lista of ['favoritos', 'semana'] as const)
        for (const [id, valor] of Object.entries(copia.porEquipo?.[lista] ?? {})) guardarLista(lista, unirTextos(leerLista(lista, id), valor), id);
      if (copia.colores) poner(copia.colores);
      const equiposCopia = copia.diario?.equipos.length ?? 0;
      setAviso(`Copia cargada: ${copia.mios.length} ${copia.mios.length === 1 ? 'jugada' : 'jugadas'}${copia.diario ? `, ${equiposCopia} ${equiposCopia === 1 ? 'equipo' : 'equipos'} con ${copia.diario.jugadoras.length} jugadores y jugadoras` : ''}${copia.sesiones?.length ? `, ${copia.sesiones.length} sesiones` : ''}${copia.colores ? ' y los colores' : ''}.`);
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
      <h2 className="sub">Aspecto</h2>
      <div className="letras" role="group" aria-label="Aspecto de la app">
        {ASPECTOS.map(([id, nombre]) => (
          <button key={id} className={id === aspecto ? 'on' : ''} aria-pressed={id === aspecto} onClick={() => { guardarAspecto(id); setAspecto(id); aplicarColores(leerColores(), false); }}>
            {nombre}
          </button>
        ))}
      </div>
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
