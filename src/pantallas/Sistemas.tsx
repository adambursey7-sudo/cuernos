import { useState } from 'react';
import { Pista } from '../pizarra/Pista';
import { JugadaVideo } from './JugadaVideo';
import { coincide } from '../favoritos';
import { todosLosSistemas } from '../sistemas/almacen';
import { alternarSemana, leerSemana } from '../sistemas/libro';
import { type Dificultad, type Familia, type Nivel, type Sistema, FAMILIAS, NIVELES } from '../sistemas/tipos';

const nombreNivel = (id: string) => NIVELES.find((n) => n.id === id)?.nombre ?? id;
const orden = (n: Nivel) => NIVELES.findIndex((x) => x.id === n);

export interface FiltroJugadas {
  nivel?: Nivel;
  tipo?: 'ataque' | 'defensa';
  familia?: Familia;
  semana?: boolean;
  dificultad?: Dificultad;
}

/** Grupo del libro en el que sale una jugada: su familia, o ataque/defensa si no tiene. */
export const grupoDe = (s: Sistema) => FAMILIAS.find((f) => f.id === (s.familia ?? s.tipo))?.nombre ?? 'Otras';

/** Agrupa conservando el orden del libro (FAMILIAS) y, dentro, el de la lista. */
export function agrupar(lista: Sistema[]): { nombre: string; jugadas: Sistema[] }[] {
  const por = new Map<string, Sistema[]>();
  for (const f of FAMILIAS) por.set(f.nombre, []);
  for (const s of lista) {
    const g = grupoDe(s);
    por.set(g, [...(por.get(g) ?? []), s]);
  }
  return [...por.entries()].filter(([, l]) => l.length > 0).map(([nombre, jugadas]) => ({ nombre, jugadas }));
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
  const [semana, setSemana] = useState(leerSemana);
  const [video, setVideo] = useState(false);
  const [version, setVersion] = useState(0);
  const abierto = !!(q || soloFavoritos || Object.values(filtro).some(Boolean));
  const lista = todosLosSistemas().filter(
    (s) =>
      coincide(q, s.nombre, s.idea, s.contra) &&
      (!soloFavoritos || favoritos.includes(`j:${s.id}`)) &&
      (!filtro.tipo || s.tipo === filtro.tipo) &&
      (!filtro.familia || s.familia === filtro.familia) &&
      (!filtro.semana || semana.includes(s.id)) &&
      (!filtro.dificultad || s.dificultad === filtro.dificultad) &&
      (!filtro.nivel || orden(s.nivelMinimo) <= orden(filtro.nivel)),
  );
  if (video) return <JugadaVideo volver={() => setVideo(false)} guardada={() => setVersion(version + 1)} />;
  return (
    <section className="pantalla" data-v={version}>
      <div className="titulo-fila">
        <h1 className="titulo">Jugadas</h1>
        <button className="nueva" onClick={crear}>+ Nueva jugada</button>
      </div>
      <button className="chip" onClick={() => setVideo(true)}>▶ Jugada desde un vídeo</button>
      <p className="meta" aria-live="polite">{lista.length} {lista.length === 1 ? 'jugada' : 'jugadas'}</p>
      {lista.length === 0 ? (
        <SinResultados favoritos={soloFavoritos && !q} que="jugada" quitarFiltros={quitarFiltros} />
      ) : (
        agrupar(lista).map((g) => (
          <details key={g.nombre} className="grupo-jugadas" open={abierto || g.jugadas.length <= 4}>
            <summary><b>{g.nombre}</b> <span className="meta">{g.jugadas.length}</span></summary>
            <ul className="lista">
              {g.jugadas.map((s) => (
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
                      {semana.includes(s.id) && <span className="mia">Esta semana</span>}
                      {(s.borrador || s.revisar) && <span className="aviso">Borrador por revisar</span>}
                    </span>
                  </button>
                  <Estrella puesta={favoritos.includes(`j:${s.id}`)} alternar={() => alternarFavorito(`j:${s.id}`)} nombre={s.nombre} />
                  <button className={semana.includes(s.id) ? 'boton-filtro on' : 'boton-filtro'} aria-pressed={semana.includes(s.id)} aria-label={`Esta semana: ${s.nombre}`} onClick={() => setSemana((l) => alternarSemana(l, s.id))}>Semana</button>
                </li>
              ))}
            </ul>
          </details>
        ))
      )}
    </section>
  );
}
