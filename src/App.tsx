import { useEffect, useRef, useState } from 'react';
import { Marca } from './Logo';
import { Editor } from './editor/Editor';
import { buscarEjercicio } from './ejercicios/ejercicios';
import { IconoBiblioteca, IconoEquipo, IconoHoy, IconoMas, IconoSesiones } from './Iconos';
import { Ajustes } from './pantallas/Ajustes';
import { Biblioteca, type Rama } from './pantallas/Biblioteca';
import { Ejercicio } from './pantallas/Ejercicio';
import { Equipo } from './pantallas/Equipo';
import { Inicio } from './pantallas/Inicio';
import { Sesiones } from './pantallas/Sesiones';
import { Sistema } from './pantallas/Sistema';
import { primerEnlace } from './recursos/recursos';
import { buscarSistema } from './sistemas/almacen';
import type { Sistema as SistemaDatos } from './sistemas/tipos';

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

/** En el editor: `null` = no se edita; `{}` = jugada nueva; `{ base }` = editar una propia o duplicar una del libro. */
type Edicion = { base?: SistemaDatos } | null;

export function App() {
  const [entrante] = useState(enlaceDeLaDireccion);   // un enlace compartido a la app abre Recursos con ese enlace
  const [pestana, setPestana] = useState<Pestana>(entrante ? 'biblioteca' : 'hoy');
  const [rama, setRama] = useState<Rama>(entrante ? 'ejercicios' : 'jugadas');
  // La jugada abierta queda encima de Hoy o de la Biblioteca; al volver se ve la pestaña desde la que se abrió.
  const [abierto, setAbierto] = useState<{ id: string; paso: number } | null>(null);
  const [edicion, setEdicion] = useState<Edicion>(null);
  const sistema = abierto ? buscarSistema(abierto.id) : undefined;
  const abrir = (id: string, paso = 0) => setAbierto({ id, paso });
  // El ejercicio abierto queda encima de su lista (o de Inicio); desde él se puede ir a su sistema.
  const [ejercicioId, setEjercicioId] = useState<string | null>(null);
  // La sesión abierta se recuerda aquí para volver a ella tras mirar un ejercicio.
  const [sesionId, setSesionId] = useState<string | null>(null);
  const ejercicio = ejercicioId ? buscarEjercicio(ejercicioId) : undefined;
  // Un día de la temporada abierto desde Inicio («Esta semana»): lleva a Equipo → Temporada en ese día.
  const [fechaAbrir, setFechaAbrir] = useState<string | undefined>();
  const abrirSesion = (id: string) => { setPestana('sesiones'); setSesionId(id); setEjercicioId(null); };
  const irABiblioteca = (r: Rama) => { setRama(r); setPestana('biblioteca'); };
  const verDia = (fecha: string) => { setFechaAbrir(fecha); setPestana('equipo'); };

  let contenido;
  if (pestana === 'sesiones' && !ejercicio) contenido = <Sesiones abrirEjercicio={setEjercicioId} abierta={sesionId} abrir={setSesionId} />;
  else if (pestana === 'equipo') contenido = <Equipo key={fechaAbrir ?? 'sin-fecha'} ir={irABiblioteca} fecha={fechaAbrir} abrirSesion={abrirSesion} />;
  else if (pestana === 'mas') contenido = <><header className="cabecera-app"><Marca className="marca-cabecera" /></header><Ajustes /></>;
  else if (edicion)
    contenido = (
      <Editor
        key={edicion.base?.id ?? 'nueva'}
        base={edicion.base}
        cerrar={() => setEdicion(null)}
        guardado={(id) => { setEdicion(null); abrir(id); }}
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
        <header className="cabecera-app"><Marca className="marca-cabecera" /></header>
        <Inicio verDia={verDia} abrirSesion={abrirSesion} verSesiones={() => { setSesionId(null); setPestana('sesiones'); }} abrir={abrir} abrirEjercicio={setEjercicioId} crear={() => setEdicion({})} verTodas={() => irABiblioteca('jugadas')} verEjercicios={() => irABiblioteca('ejercicios')} />
      </>
    );
  else contenido = <Biblioteca rama={rama} cambiar={setRama} abrir={abrir} abrirEjercicio={setEjercicioId} crear={() => setEdicion({})} enlaceInicial={entrante} />;

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
      <main key={pestana} className="entra">{contenido}</main>
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
