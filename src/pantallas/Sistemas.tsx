import { Pista } from '../pizarra/Pista';
import { coincide } from '../favoritos';
import { todosLosSistemas } from '../sistemas/almacen';
import { NIVELES, type Nivel } from '../sistemas/tipos';

const nombreNivel = (id: string) => NIVELES.find((n) => n.id === id)?.nombre ?? id;
const orden = (n: Nivel) => NIVELES.findIndex((x) => x.id === n);

export interface FiltroJugadas {
  nivel?: Nivel;
  tipo?: 'ataque' | 'defensa';
}

export function Estrella({ puesta, alternar, nombre }: { puesta: boolean; alternar: () => void; nombre: string }) {
  return (
    <button className={puesta ? 'estrella on' : 'estrella'} aria-pressed={puesta} aria-label={`Favorito: ${nombre}`} onClick={alternar}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.6 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.8 1-5.9L3.5 9.8l5.9-.8z" /></svg>
    </button>
  );
}

/** Aviso cuando la búsqueda o los filtros no dejan nada: dice qué pasa y ofrece quitarlos. */
export function SinResultados({ favoritos, que, quitarFiltros }: { favoritos: boolean; que: string; quitarFiltros: () => void }) {
  return (
    <div className="siguiente vacio-card">
      <b className="titulo-sig">{favoritos ? `Aún no tienes ${que}s favorit${que === "jugada" ? "as" : "os"}` : `No sale ning${que === "jugada" ? "una" : "ún"} ${que}`}</b>
      <span className="meta">{favoritos ? 'Toca la estrella para tenerlos aquí a mano.' : 'Prueba con otra palabra o quita los filtros.'}</span>
      <button className="accion-sig suave" onClick={quitarFiltros}>Quitar filtros</button>
    </div>
  );
}

export function Sistemas({ abrir, crear, q, soloFavoritos, filtro, favoritos, alternarFavorito, quitarFiltros }: {
  abrir: (id: string) => void;
  crear: () => void;
  q: string;
  soloFavoritos: boolean;
  filtro: FiltroJugadas;
  favoritos: string[];
  alternarFavorito: (id: string) => void;
  quitarFiltros: () => void;
}) {
  const lista = todosLosSistemas().filter(
    (s) =>
      coincide(q, s.nombre, s.idea, s.contra) &&
      (!soloFavoritos || favoritos.includes(`j:${s.id}`)) &&
      (!filtro.tipo || s.tipo === filtro.tipo) &&
      (!filtro.nivel || orden(s.nivelMinimo) <= orden(filtro.nivel)),
  );
  return (
    <section className="pantalla">
      <div className="titulo-fila">
        <h1 className="titulo">Jugadas</h1>
        <button className="nueva" onClick={crear}>+ Nueva jugada</button>
      </div>
      <p className="meta" aria-live="polite">{lista.length} {lista.length === 1 ? 'jugada' : 'jugadas'}</p>
      {lista.length === 0 ? (
        <SinResultados favoritos={soloFavoritos && !q} que="jugada" quitarFiltros={quitarFiltros} />
      ) : (
        <ul className="lista">
          {lista.map((s) => (
            <li key={s.id} className="con-estrella">
              <button className="tarjeta" onClick={() => abrir(s.id)}>
                <span className="mini">
                  <Pista sistema={s} t={0} />
                </span>
                <span className="datos">
                  <span className="nombre">{s.nombre}</span>
                  <span className="meta">
                    Desde {nombreNivel(s.nivelMinimo).toLowerCase()} · {s.pasos.length} {s.pasos.length === 1 ? 'paso' : 'pasos'}
                  </span>
                  {s.propio && <span className="mia">Mía</span>}
                  {s.borrador && <span className="aviso">Borrador por revisar</span>}
                </span>
              </button>
              <Estrella puesta={favoritos.includes(`j:${s.id}`)} alternar={() => alternarFavorito(`j:${s.id}`)} nombre={s.nombre} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
