// Biblioteca de ejercicios, opción A · Lista con filtros (elegida por Adam el 29/10): formato, sistema y nivel arriba.
import { useState } from 'react';
import { filtrar, formatos, todosLosEjercicios, type Ejercicio, type Filtro } from '../ejercicios/ejercicios';
import { Pista } from '../pizarra/Pista';
import { NIVELES } from '../sistemas/tipos';

const nombreNivel = (id: string) => NIVELES.find((n) => n.id === id)?.nombre ?? id;

/** «2 jug.» o «2 contra 2». */
export function jugadoresDe(e: Ejercicio): string | undefined {
  if (e.atacantes === undefined) return undefined;
  return e.defensores ? `${e.atacantes} contra ${e.defensores}` : `${e.atacantes} jug.`;
}

function Chips<T extends string>({ etiqueta, todos, opciones, valor, cambiar }: {
  etiqueta: string;
  todos: string;
  opciones: { id: T; nombre: string }[];
  valor?: T;
  cambiar: (v?: T) => void;
}) {
  return (
    <div className="niveles filtro" role="group" aria-label={etiqueta}>
      <button className={valor ? 'chip' : 'chip on'} aria-pressed={!valor} onClick={() => cambiar(undefined)}>{todos}</button>
      {opciones.map((o) => (
        <button key={o.id} className={o.id === valor ? 'chip on' : 'chip'} aria-pressed={o.id === valor} onClick={() => cambiar(o.id === valor ? undefined : o.id)}>
          {o.nombre}
        </button>
      ))}
    </div>
  );
}

export function TarjetaEjercicio({ e, abrir }: { e: Ejercicio; abrir: () => void }) {
  return (
    <button className="tarjeta tarjeta-ejercicio" onClick={abrir}>
      <span className="mini">
        <Pista sistema={e.pizarra ?? e.sistema} t={e.pizarra ? e.pizarra.pasos.length : 0} />
      </span>
      <span className="datos">
        <span className="formato">{e.formato || 'Ejercicio'}</span>
        <span className="texto-ejercicio">{e.nombre}</span>
        <span className="meta">
          {[e.sistema.nombre, `desde ${nombreNivel(e.nivel).toLowerCase()}`, jugadoresDe(e), `${e.minutos}′`].filter(Boolean).join(' · ')}
        </span>
        {e.porRevisar.length > 0 && <span className="aviso">Borrador por revisar</span>}
      </span>
    </button>
  );
}

export function Ejercicios({ abrir }: { abrir: (id: string) => void }) {
  const todos = todosLosEjercicios();
  const [f, setF] = useState<Filtro>({});
  const lista = filtrar(todos, f);
  const sistemas = [...new Map(todos.map((e) => [e.sistema.id, e.sistema.nombre])).entries()].map(([id, nombre]) => ({ id, nombre }));

  return (
    <section className="pantalla">
      <h1 className="titulo">Ejercicios</h1>
      <div className="filtros">
        <Chips etiqueta="Formato" todos="Todos" opciones={formatos(todos).map((x) => ({ id: x, nombre: x }))} valor={f.formato} cambiar={(formato) => setF({ ...f, formato })} />
        <Chips etiqueta="Sistema" todos="Todos los sistemas" opciones={sistemas} valor={f.sistema} cambiar={(sistema) => setF({ ...f, sistema })} />
        <Chips etiqueta="Nivel del equipo" todos="Cualquier nivel" opciones={NIVELES} valor={f.nivel} cambiar={(nivel) => setF({ ...f, nivel })} />
      </div>
      <p className="meta" aria-live="polite">{lista.length} {lista.length === 1 ? 'ejercicio' : 'ejercicios'}</p>
      {lista.length === 0 ? (
        <p className="vacio">No hay ejercicios con estos filtros. Quita alguno para ver más.</p>
      ) : (
        <ul className="lista">
          {lista.map((e) => <li key={e.id}><TarjetaEjercicio e={e} abrir={() => abrir(e.id)} /></li>)}
        </ul>
      )}
    </section>
  );
}
