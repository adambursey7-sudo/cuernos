// Elegir el equipo con el que se trabaja. Con un solo equipo no se pinta: no hay nada que elegir.
import type { Equipo } from '../diario/diario';
import { EscudoEquipo } from './EscudoEquipo';

export function SelectorEquipo({ equipos, activo, elegir }: { equipos: Equipo[]; activo: string; elegir: (id: string) => void }) {
  if (equipos.length < 2) return null;
  return (
    <div className="selector-equipo" role="group" aria-label="Equipo">
      {equipos.map((e) => (
        <button key={e.id} className={e.id === activo ? 'chip on' : 'chip'} aria-pressed={e.id === activo} onClick={() => elegir(e.id)}>
          <EscudoEquipo nombre={e.nombre} escudo={e.escudo} color={e.color} tam={20} />
          <span>{e.nombre}</span>
        </button>
      ))}
    </div>
  );
}
