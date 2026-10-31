// Dentro de Biblioteca > Ejercicios: la lista de la biblioteca, «Mis ejercicios» (fichas propias), los recursos guardados
// de internet y «Pedir a Claude». La lista (con su buscador) la pinta Biblioteca y entra aquí como `lista`.
import { useState, type ReactNode } from 'react';
import { nuevaFicha, type Ficha } from '../recursos/fichas';
import type { Ejercicio } from '../recursos/guardarEjercicioIA';
import type { Cuestionario } from '../recursos/ia';
import { guardarRecursos, leerRecursos, type Recurso } from '../recursos/recursos';
import { MisFichas } from './Fichas';
import { PedirIA } from './PedirIA';
import type { Rama } from './Biblioteca';
import { Recursos } from './Recursos';

export type Vista = 'lista' | 'fichas' | 'recursos' | 'ia';

const VISTAS: [Vista, string][] = [['lista', 'Lista'], ['fichas', 'Mis ejercicios'], ['ia', 'Pedir a Claude']];

export function VistasEjercicios({ rama, cambiarRama, vista, cambiar, enlaceInicial, lista, retocar }: {
  rama: Rama;
  cambiarRama: (r: Rama) => void;
  vista: Vista;
  cambiar: (v: Vista) => void;
  enlaceInicial?: string;
  lista: ReactNode;
  retocar: (e: Ejercicio, c: Cuestionario, recurso?: Recurso) => void;
}) {
  // Al convertir un recurso se abre la ficha nueva con su título y su fuente; al guardarla el recurso pasa a «Convertido».
  const [desde, setDesde] = useState<Recurso | undefined>();
  // «Pedir a Claude» (con o sin recurso de partida) devuelve un borrador de ficha que se abre en el editor para revisarlo.
  const [iaDe, setIaDe] = useState<Recurso | undefined>();
  const [borrador, setBorrador] = useState<Ficha | undefined>();
  const convertir = (r: Recurso) => { setDesde(r); setBorrador(undefined); cambiarRama('ejercicios'); cambiar('fichas'); };
  const pedirIA = (r: Recurso) => { setIaDe(r); cambiarRama('ejercicios'); cambiar('ia'); };
  const terminada = (f: Ficha) => {
    if (!f.recursoId) return;
    guardarRecursos(leerRecursos().map((r) => (r.id === f.recursoId ? { ...r, estado: 'convertido' as const } : r)));
  };
  return (
    <>
      {rama === 'ejercicios' && <div className="niveles filtro rec-vistas" role="group" aria-label="Vista">
        {VISTAS.map(([id, nombre]) => (
          <button key={id} className={vista === id ? 'chip on' : 'chip'} aria-pressed={vista === id}
            onClick={() => { setDesde(undefined); setBorrador(undefined); if (id !== 'ia') setIaDe(undefined); cambiar(id); }}>{nombre}</button>
        ))}
      </div>}
      {vista === 'recursos' && <section className="pantalla"><h1 className="titulo">Recursos</h1><Recursos enlaceInicial={enlaceInicial} convertir={convertir} pedirIA={pedirIA} /></section>}
      {vista === 'fichas' && <section className="pantalla"><h1 className="titulo">Mis ejercicios</h1><MisFichas key={borrador?.id ?? desde?.id ?? 'sin'} nueva={borrador ?? (desde ? nuevaFicha(desde) : undefined)} alTerminar={terminada} /></section>}
      {vista === 'ia' && <section className="pantalla"><h1 className="titulo">Pedir a Claude</h1><PedirIA key={iaDe?.id ?? 'sin'} recurso={iaDe} borrador={(f) => { setBorrador(f); cambiar('fichas'); }} retocar={retocar} guardada={terminada} /></section>}
      {vista === 'lista' && lista}
    </>
  );
}
