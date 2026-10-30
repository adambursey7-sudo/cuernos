// Biblioteca (opción A de Adam, 30/10): ramas arriba, buscador siempre a la vista, favoritos y los filtros en una hoja.
// Hoy: Jugadas y Ejercicios; Juegos y Recursos se añaden en sus tramos.
import { useState } from 'react';
import { formatos, todosLosEjercicios, type Filtro } from '../ejercicios/ejercicios';
import { alternarFavorito, leerFavoritos } from '../favoritos';
import { Marca } from '../Logo';
import { NIVELES } from '../sistemas/tipos';
import { Chips, Ejercicios } from './Ejercicios';
import { Sistemas, type FiltroJugadas } from './Sistemas';

export type Rama = 'jugadas' | 'ejercicios';

const RAMAS: { id: Rama; nombre: string }[] = [
  { id: 'jugadas', nombre: 'Jugadas' },
  { id: 'ejercicios', nombre: 'Ejercicios' },
];

const TIPOS = [
  { id: 'ataque' as const, nombre: 'Ataque' },
  { id: 'defensa' as const, nombre: 'Defensa' },
];

export function Biblioteca({ rama, cambiar, abrir, abrirEjercicio, crear }: {
  rama: Rama;
  cambiar: (r: Rama) => void;
  abrir: (id: string) => void;
  abrirEjercicio: (id: string) => void;
  crear: () => void;
}) {
  const [q, setQ] = useState('');
  const [soloFavoritos, setSoloFavoritos] = useState(false);
  const [hoja, setHoja] = useState(false);
  const [favoritos, setFavoritos] = useState(leerFavoritos);
  const [jugadas, setJugadas] = useState<FiltroJugadas>({});
  const [ejercicios, setEjercicios] = useState<Filtro>({});

  const activos = rama === 'jugadas' ? Object.values(jugadas).filter(Boolean).length : Object.values(ejercicios).filter(Boolean).length;
  const quitarFiltros = () => { setQ(''); setSoloFavoritos(false); setJugadas({}); setEjercicios({}); };
  const alternar = (id: string) => setFavoritos((l) => alternarFavorito(l, id));

  const todos = todosLosEjercicios();
  const sistemas = [...new Map(todos.map((e) => [e.sistema.id, e.sistema.nombre])).entries()].map(([id, nombre]) => ({ id, nombre }));

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
        <div className="busqueda">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={rama === 'jugadas' ? 'Buscar una jugada' : 'Buscar un ejercicio'}
            aria-label="Buscar"
            enterKeyHint="search"
          />
          <button className={soloFavoritos ? 'boton-filtro on' : 'boton-filtro'} aria-pressed={soloFavoritos} onClick={() => setSoloFavoritos(!soloFavoritos)}>
            Favoritos
          </button>
          <button className={activos ? 'boton-filtro on' : 'boton-filtro'} aria-haspopup="dialog" onClick={() => setHoja(true)}>
            Filtros{activos ? ` · ${activos}` : ''}
          </button>
        </div>
      </header>

      {rama === 'jugadas' ? (
        <Sistemas abrir={abrir} crear={crear} q={q} soloFavoritos={soloFavoritos} filtro={jugadas} favoritos={favoritos} alternarFavorito={alternar} quitarFiltros={quitarFiltros} />
      ) : (
        <Ejercicios abrir={abrirEjercicio} q={q} soloFavoritos={soloFavoritos} filtro={ejercicios} favoritos={favoritos} alternarFavorito={alternar} quitarFiltros={quitarFiltros} />
      )}

      {hoja && (
        <div className="velo" onClick={() => setHoja(false)}>
          <div className="hoja" role="dialog" aria-modal="true" aria-label="Filtros" onClick={(e) => e.stopPropagation()}>
            <div className="hoja-cabeza">
              <h2 className="sub">Filtros</h2>
              <button className="ver-todas" onClick={() => { setJugadas({}); setEjercicios({}); }}>Quitar todos</button>
            </div>
            {rama === 'jugadas' ? (
              <>
                <Chips etiqueta="Tipo" todos="Ataque y defensa" opciones={TIPOS} valor={jugadas.tipo} cambiar={(tipo) => setJugadas({ ...jugadas, tipo })} />
                <Chips etiqueta="Nivel del equipo" todos="Cualquier nivel" opciones={NIVELES} valor={jugadas.nivel} cambiar={(nivel) => setJugadas({ ...jugadas, nivel })} />
              </>
            ) : (
              <>
                <Chips etiqueta="Formato" todos="Todos" opciones={formatos(todos).map((x) => ({ id: x, nombre: x }))} valor={ejercicios.formato} cambiar={(formato) => setEjercicios({ ...ejercicios, formato })} />
                <Chips etiqueta="Sistema" todos="Todos los sistemas" opciones={sistemas} valor={ejercicios.sistema} cambiar={(sistema) => setEjercicios({ ...ejercicios, sistema })} />
                <Chips etiqueta="Nivel del equipo" todos="Cualquier nivel" opciones={NIVELES} valor={ejercicios.nivel} cambiar={(nivel) => setEjercicios({ ...ejercicios, nivel })} />
              </>
            )}
            <button className="accion-sig" onClick={() => setHoja(false)}>Ver resultados</button>
          </div>
        </div>
      )}
    </>
  );
}
