import { useState } from 'react';
import { Ajustes } from './pantallas/Ajustes';
import { Sistema } from './pantallas/Sistema';
import { Sistemas } from './pantallas/Sistemas';

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

export function App() {
  const [pestana, setPestana] = useState<Pestana>('sistemas');
  const [abierto, setAbierto] = useState<string | null>(null);

  return (
    <div className="app">
      <main>
        {pestana === 'sistemas' && (abierto ? <Sistema id={abierto} volver={() => setAbierto(null)} /> : <Sistemas abrir={setAbierto} />)}
        {(pestana === 'ejercicios' || pestana === 'sesiones') && (
          <section className="pantalla">
            <h1 className="titulo">{pestana === 'ejercicios' ? 'Ejercicios' : 'Sesiones'}</h1>
            <p className="vacio">{EN_CAMINO[pestana]}</p>
          </section>
        )}
        {pestana === 'ajustes' && <Ajustes />}
      </main>
      <nav className="pestanas">
        {PESTANAS.map((p) => (
          <button key={p.id} className={p.id === pestana ? 'on' : ''} onClick={() => { setPestana(p.id); if (p.id === 'sistemas') setAbierto(null); }}>
            {p.nombre}
          </button>
        ))}
      </nav>
    </div>
  );
}
