import { useState } from 'react';
import { Editor } from './editor/Editor';
import { buscarEjercicio } from './ejercicios/ejercicios';
import { Ajustes } from './pantallas/Ajustes';
import { Ejercicio } from './pantallas/Ejercicio';
import { Ejercicios } from './pantallas/Ejercicios';
import { Inicio } from './pantallas/Inicio';
import { Sistema } from './pantallas/Sistema';
import { Sistemas } from './pantallas/Sistemas';
import { buscarSistema } from './sistemas/almacen';
import type { Sistema as SistemaDatos } from './sistemas/tipos';

type Pestana = 'inicio' | 'jugadas' | 'ejercicios' | 'sesiones' | 'ajustes';

const PESTANAS: { id: Pestana; nombre: string }[] = [
  { id: 'inicio', nombre: 'Inicio' },
  { id: 'jugadas', nombre: 'Jugadas' },
  { id: 'ejercicios', nombre: 'Ejercicios' },
  { id: 'sesiones', nombre: 'Sesiones' },
  { id: 'ajustes', nombre: 'Ajustes' },
];

/** En el editor: `null` = no se edita; `{}` = jugada nueva; `{ base }` = editar una propia o duplicar una del libro. */
type Edicion = { base?: SistemaDatos } | null;

export function App() {
  const [pestana, setPestana] = useState<Pestana>('inicio');
  // La jugada abierta queda encima de Inicio o de Jugadas; al volver se ve la pestaña desde la que se abrió.
  const [abierto, setAbierto] = useState<{ id: string; paso: number } | null>(null);
  const [edicion, setEdicion] = useState<Edicion>(null);
  const sistema = abierto ? buscarSistema(abierto.id) : undefined;
  const abrir = (id: string, paso = 0) => setAbierto({ id, paso });
  // El ejercicio abierto queda encima de su lista (o de Inicio); desde él se puede ir a su sistema.
  const [ejercicioId, setEjercicioId] = useState<string | null>(null);
  const ejercicio = ejercicioId ? buscarEjercicio(ejercicioId) : undefined;

  let contenido;
  if (pestana === 'sesiones')
    contenido = (
      <section className="pantalla">
        <h1 className="titulo">Sesiones</h1>
        <p className="vacio">Aquí se planificarán los entrenamientos de cada equipo: arrastrar ejercicios, tiempos y material.</p>
      </section>
    );
  else if (pestana === 'ajustes') contenido = <Ajustes />;
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
  else if (pestana === 'inicio')
    contenido = (
      <Inicio abrir={abrir} abrirEjercicio={setEjercicioId} crear={() => setEdicion({})} verTodas={() => setPestana('jugadas')} verEjercicios={() => setPestana('ejercicios')} />
    );
  else if (pestana === 'ejercicios') contenido = <Ejercicios abrir={setEjercicioId} />;
  else contenido = <Sistemas abrir={abrir} crear={() => setEdicion({})} />;

  return (
    <div className="app">
      <main>{contenido}</main>
      <nav className="pestanas">
        {PESTANAS.map((p) => (
          <button key={p.id} className={p.id === pestana ? 'on' : ''} onClick={() => { setPestana(p.id); setAbierto(null); setEdicion(null); setEjercicioId(null); }}>
            {p.nombre}
          </button>
        ))}
      </nav>
    </div>
  );
}
