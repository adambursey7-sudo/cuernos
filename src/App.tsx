import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Marca } from './Logo';
import { buscarEjercicio } from './ejercicios/ejercicios';
import { IconoBiblioteca, IconoEquipo, IconoHoy, IconoMas, IconoSesiones } from './Iconos';
import { Biblioteca, type Rama } from './pantallas/Biblioteca';
import { Ejercicio } from './pantallas/Ejercicio';
import { Esqueleto } from './ui/Vacio';
import { Inicio } from './pantallas/Inicio';
import { Sesiones } from './pantallas/Sesiones';
import type { crearAudio } from './pantallas/Entrenando';
import { Sistema } from './pantallas/Sistema';
import { anadirFicha, fichaDeEjercicio } from './recursos/guardarEjercicioIA';
import { primerEnlace } from './recursos/recursos';
import type { Ficha } from './recursos/fichas';
import { leerDiario } from './diario/diario';
import { equipoActivo, leerActivoId, ponerActivoId } from './equipo/equipos';
import { SelectorEquipo } from './equipo/SelectorEquipo';
import { alinearSesiones, guardarSesiones, leerSesiones } from './sesiones/sesiones';
import { buscarSistema } from './sistemas/almacen';
import type { Sistema as SistemaDatos } from './sistemas/tipos';

// Las pantallas más pesadas se cargan al abrirlas: la app arranca antes y se ve un esqueleto mientras llegan.
const Editor = lazy(() => import('./editor/Editor').then((m) => ({ default: m.Editor })));
const Ajustes = lazy(() => import('./pantallas/Ajustes').then((m) => ({ default: m.Ajustes })));
const Equipo = lazy(() => import('./pantallas/Equipo').then((m) => ({ default: m.Equipo })));

// Menú de abajo (opción A de Adam, 30/10): cinco apartados iguales.
function enlaceDeLaDireccion(): string | undefined {
  try {
    const q = new URLSearchParams(location.search);
    const e = primerEnlace(q.get('enlace') ?? q.get('url') ?? q.get('text') ?? '');
    if (e) history.replaceState(null, '', location.pathname + location.hash);
    return e;
  } catch {
    return undefined;
  }
}

type Pestana = 'hoy' | 'biblioteca' | 'sesiones' | 'equipo' | 'mas';

const PESTANAS: { id: Pestana; nombre: string; icono: () => React.JSX.Element }[] = [
  { id: 'hoy', nombre: 'Hoy', icono: IconoHoy },
  { id: 'biblioteca', nombre: 'Biblioteca', icono: IconoBiblioteca },
  { id: 'sesiones', nombre: 'Sesiones', icono: IconoSesiones },
  { id: 'equipo', nombre: 'Equipo', icono: IconoEquipo },
  { id: 'mas', nombre: 'Más', icono: IconoMas },
];

/** En el editor: `null` = no se edita; `{}` = jugada nueva; `{ base }` = editar una propia o duplicar una del libro; con `ficha`, al guardar se crea también esa ficha enlazada (ejercicio de Claude retocado). */
type Edicion = { base?: SistemaDatos; ficha?: Ficha } | null;

export function App() {
  const [entrante] = useState(enlaceDeLaDireccion);   // un enlace compartido a la app abre Recursos con ese enlace
  const [pestana, setPestana] = useState<Pestana>(entrante ? 'biblioteca' : 'hoy');
  const [rama, setRama] = useState<Rama>(entrante ? 'ejercicios' : 'jugadas');
  // La jugada abierta queda encima de Hoy o de la Biblioteca; al volver se ve la pestaña desde la que se abrió.
  const [abierto, setAbierto] = useState<{ id: string; paso: number } | null>(null);
  const [edicion, setEdicion] = useState<Edicion>(null);
  // Equipo con el que se trabaja: Hoy, Sesiones y Tele muestran los datos de este equipo.
  const [activoId, setActivoId] = useState(() => equipoActivo(leerDiario().equipos, leerActivoId())?.id ?? '');
  const elegirEquipo = (id: string) => { ponerActivoId(id); setActivoId(id); setSesionId(null); };
  const equipos = leerDiario().equipos;
  const sistema = abierto ? buscarSistema(abierto.id) : undefined;
  const abrir = (id: string, paso = 0) => setAbierto({ id, paso });
  // El ejercicio abierto queda encima de su lista (o de Inicio); desde él se puede ir a su sistema.
  const [ejercicioId, setEjercicioId] = useState<string | null>(null);
  // La sesión abierta se recuerda aquí para volver a ella tras mirar un ejercicio.
  const [sesionId, setSesionId] = useState<string | null>(null);
  // Las sesiones de antes (sin id de equipo) ganan el de su equipo al abrir la app; al renombrar un equipo lo hace la pantalla Equipo.
  useState(() => { const antes = leerSesiones(); const despues = alinearSesiones(antes, leerDiario().equipos); if (despues !== antes) guardarSesiones(despues); });
  const ejercicio = ejercicioId ? buscarEjercicio(ejercicioId) : undefined;
  // Un día de la temporada abierto desde Inicio («Esta semana»): lleva a Equipo → Temporada en ese día.
  const [fechaAbrir, setFechaAbrir] = useState<string | undefined>();
  const abrirSesion = (id: string) => { setPestana('sesiones'); setSesionId(id); setEjercicioId(null); };
  // Audio ya creado con el toque del botón de Inicio: la sesión de hoy arranca el cronómetro sola al abrirse.
  const [arranque, setArranque] = useState<ReturnType<typeof crearAudio> | null>(null);
  const empezarHoy = (id: string, audio: ReturnType<typeof crearAudio>) => { setArranque(audio); abrirSesion(id); };
  // Desde una habilidad del equipo se abre un ejercicio o una jugada de la biblioteca.
  const verEjercicio = (id: string) => { setPestana('biblioteca'); setEjercicioId(id); };
  const verSistema = (id: string) => { setPestana('biblioteca'); setEjercicioId(null); abrir(id); };
  const irABiblioteca = (r: Rama) => { setRama(r); setPestana('biblioteca'); };
  const verDia = (fecha: string) => { setFechaAbrir(fecha); setPestana('equipo'); };

  let contenido;
  if (pestana === 'sesiones' && !ejercicio) contenido = <Sesiones abrirEjercicio={setEjercicioId} abierta={sesionId} abrir={setSesionId} arranque={arranque} gastado={() => setArranque(null)} />;
  else if (pestana === 'equipo') contenido = <Equipo key={fechaAbrir ?? 'sin-fecha'} ir={irABiblioteca} fecha={fechaAbrir} abrirSesion={abrirSesion} abrirEjercicio={verEjercicio} abrirSistema={verSistema} activoId={activoId} elegir={elegirEquipo} />;
  else if (pestana === 'mas') contenido = <><header className="cabecera-app"><Marca className="marca-cabecera" /></header><Ajustes /></>;
  else if (edicion)
    contenido = (
      <Editor
        key={edicion.base?.id ?? 'nueva'}
        base={edicion.base}
        cerrar={() => setEdicion(null)}
        guardado={(id) => {
          const s = buscarSistema(id);
          if (edicion.ficha) anadirFicha({ ...edicion.ficha, sistemaId: id, ...(s ? { nombre: s.nombre, pasos: s.pasos.map((p) => p.texto) } : {}) });
          setEdicion(null);
          abrir(id);
        }}
      />
    );
  else if (ejercicio)
    contenido = (
      <Ejercicio
        key={ejercicio.id}
        e={ejercicio}
        volver={() => setEjercicioId(null)}
        verSistema={() => { setEjercicioId(null); abrir(ejercicio.sistema.id); }}
      />
    );
  else if (sistema)
    contenido = (
      <Sistema key={sistema.id} s={sistema} pasoInicial={abierto!.paso} volver={() => setAbierto(null)} editar={(base) => setEdicion({ base })} />
    );
  else if (pestana === 'hoy')
    contenido = (
      <>
        <header className="cabecera-app"><Marca className="marca-cabecera" /><SelectorEquipo equipos={equipos} activo={equipoActivo(equipos, activoId)?.id ?? ''} elegir={elegirEquipo} /></header>
        <Inicio empezarHoy={empezarHoy} verDia={verDia} abrirSesion={abrirSesion} verSesiones={() => { setSesionId(null); setPestana('sesiones'); }} abrir={abrir} abrirEjercicio={setEjercicioId} crear={() => setEdicion({})} verTodas={() => irABiblioteca('jugadas')} verEjercicios={() => irABiblioteca('ejercicios')} />
      </>
    );
  else contenido = <Biblioteca rama={rama} cambiar={setRama} abrir={abrir} abrirEjercicio={setEjercicioId} crear={() => setEdicion({})} retocar={(e, c, r) => setEdicion({ base: e.sistema, ficha: fichaDeEjercicio(e, c, r) })} enlaceInicial={entrante} />;

  // Sin conexión: la app funciona igual, solo se avisa.
  const [enLinea, setEnLinea] = useState(navigator.onLine);
  useEffect(() => {
    const poner = () => setEnLinea(navigator.onLine);
    window.addEventListener('online', poner);
    window.addEventListener('offline', poner);
    return () => { window.removeEventListener('online', poner); window.removeEventListener('offline', poner); };
  }, []);

  // Volver deslizando: un dedo que empieza en el borde izquierdo y avanza a la derecha cierra la pantalla abierta.
  const dedo = useRef<{ x: number; y: number } | null>(null);
  const atras = edicion ? undefined : ejercicio ? () => setEjercicioId(null) : sistema ? () => setAbierto(null) : pestana === 'sesiones' && sesionId ? () => setSesionId(null) : undefined;
  const tocar = (e: React.TouchEvent) => { const t = e.touches[0]; dedo.current = t.clientX < 28 ? { x: t.clientX, y: t.clientY } : null; };
  const soltar = (e: React.TouchEvent) => {
    const d = dedo.current;
    dedo.current = null;
    const t = e.changedTouches[0];
    if (d && atras && t.clientX - d.x > 80 && Math.abs(t.clientY - d.y) < 60) atras();
  };

  return (
    <div className="app" onTouchStart={tocar} onTouchEnd={soltar}>
      {!enLinea && <p className="sin-red" role="status">Sin conexión: todo sigue funcionando, menos abrir enlaces.</p>}
      <main key={pestana === 'equipo' ? pestana : `${pestana}-${activoId}`} className="entra"><Suspense fallback={<Esqueleto />}>{contenido}</Suspense></main>
      <nav className="pestanas" aria-label="Secciones">
        {PESTANAS.map((p) => (
          <button key={p.id} className={p.id === pestana ? 'on' : ''} aria-current={p.id === pestana ? 'page' : undefined} onClick={() => { setPestana(p.id); setFechaAbrir(undefined); setAbierto(null); setEdicion(null); setEjercicioId(null); setSesionId(null); }}>
            <span className="burbuja"><p.icono /></span>
            <span className="rotulo-pestana">{p.nombre}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
