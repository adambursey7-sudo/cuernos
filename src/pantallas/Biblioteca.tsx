// Biblioteca (opción A de Adam, 30/10): ramas arriba y, debajo, la lista de cada una. Hoy: Jugadas y Ejercicios;
// Juegos y Recursos se añaden en sus tramos.
import { Marca } from '../Logo';
import { Ejercicios } from './Ejercicios';
import { Sistemas } from './Sistemas';

export type Rama = 'jugadas' | 'ejercicios';

const RAMAS: { id: Rama; nombre: string }[] = [
  { id: 'jugadas', nombre: 'Jugadas' },
  { id: 'ejercicios', nombre: 'Ejercicios' },
];

export function Biblioteca({ rama, cambiar, abrir, abrirEjercicio, crear }: {
  rama: Rama;
  cambiar: (r: Rama) => void;
  abrir: (id: string) => void;
  abrirEjercicio: (id: string) => void;
  crear: () => void;
}) {
  return (
    <>
      <header className="cabecera-app">
        <Marca className="marca-cabecera" />
        <div className="ramas" role="tablist" aria-label="Biblioteca">
          {RAMAS.map((r) => (
            <button key={r.id} role="tab" aria-selected={r.id === rama} className={r.id === rama ? 'on' : ''} onClick={() => cambiar(r.id)}>
              {r.nombre}
            </button>
          ))}
        </div>
      </header>
      {rama === 'jugadas' ? <Sistemas abrir={abrir} crear={crear} /> : <Ejercicios abrir={abrirEjercicio} />}
    </>
  );
}
