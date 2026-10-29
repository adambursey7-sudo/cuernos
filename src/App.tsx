import { useState } from 'react';
import { Editor } from './editor/Editor';
import { Ajustes } from './pantallas/Ajustes';
import { Sistema } from './pantallas/Sistema';
import { Sistemas } from './pantallas/Sistemas';
import { buscarSistema } from './sistemas/almacen';
import type { Sistema as SistemaDatos } from './sistemas/tipos';

type Pestana = 'sistemas' | 'ejercicios' | 'sesiones' | 'ajustes';

const PESTANAS: { id: Pestana; nombre: string }[] = [
  { id: 'sistemas', nombre: 'Sistemas' },
  { id: 'ejercicios', nombre: 'Ejercicios' },
  { id: 'sesiones', nombre: 'Sesiones' },
  { id: 'ajustes', nombre: 'Colores' },
];

const EN_CAMINO: Record<'ejercicios' | 'sesiones', string> = {
  ejercicios: 'Aquí saldrán los ejercicios de cada sistema, de 2x0 a 5x5, ordenados por nivel. De momento están dentro de cada sistema, al final de su ficha.',
  sesiones: 'Aquí se planificarán los entrenamientos de cada equipo: arrastrar ejercicios, tiempos y material.',
};

/** En el editor: `null` = no se edita; `{}` = jugada nueva; `{ base }` = editar una propia o duplicar una del libro. */
type Edicion = { base?: SistemaDatos } | null;

export function App() {
  const [pestana, setPestana] = useState<Pestana>('sistemas');
  const [abierto, setAbierto] = useState<string | null>(null);
  const [edicion, setEdicion] = useState<Edicion>(null);
  const sistema = abierto ? buscarSistema(abierto) : undefined;

  let contenido;
  if (pestana === 'sistemas' && edicion)
    contenido = (
      <Editor
        key={edicion.base?.id ?? 'nueva'}
        base={edicion.base}
        cerrar={() => setEdicion(null)}
        guardado={(id) => { setEdicion(null); setAbierto(id); }}
      />
    );
  else if (pestana === 'sistemas')
    contenido = sistema ? (
      <Sistema key={sistema.id} s={sistema} volver={() => setAbierto(null)} editar={(base) => setEdicion({ base })} />
    ) : (
      <Sistemas abrir={setAbierto} crear={() => setEdicion({})} />
    );
  else if (pestana === 'ajustes') contenido = <Ajustes />;
  else
    contenido = (
      <section className="pantalla">
        <h1 className="titulo">{pestana === 'ejercicios' ? 'Ejercicios' : 'Sesiones'}</h1>
        <p className="vacio">{EN_CAMINO[pestana]}</p>
      </section>
    );

  return (
    <div className="app">
      <main>{contenido}</main>
      <nav className="pestanas">
        {PESTANAS.map((p) => (
          <button key={p.id} className={p.id === pestana ? 'on' : ''} onClick={() => { setPestana(p.id); if (p.id === 'sistemas') { setAbierto(null); setEdicion(null); } }}>
            {p.nombre}
          </button>
        ))}
      </nav>
    </div>
  );
}
