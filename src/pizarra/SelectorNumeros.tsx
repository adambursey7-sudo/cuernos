// Interruptor de la pizarra: enseña los puestos 1–5 o los dorsales de un equipo (toca para pasar al siguiente).
import { useState } from 'react';
import { leerDiario } from '../diario/diario';
import { elegirEquipoActivo, equipoActivo, equiposConPuestos } from '../diario/puestos';

export function SelectorNumeros({ className = 'chip', cambio }: { className?: string; cambio?: () => void }) {
  const [activo, setActivo] = useState(equipoActivo);
  const equipos = equiposConPuestos(leerDiario());
  if (!equipos.length) return null;
  const sigue = () => {
    const i = equipos.findIndex((e) => e.id === activo);
    const nuevo = equipos[i + 1]?.id ?? (i === -1 ? equipos[0].id : '');
    elegirEquipoActivo(nuevo);
    setActivo(nuevo);
    cambio?.();
  };
  const equipo = equipos.find((e) => e.id === activo);
  return (
    <button className={equipo ? `${className} on` : className} onClick={sigue} aria-label={equipo ? `Se enseñan los dorsales de ${equipo.nombre}. Tocar para cambiar` : 'Se enseñan los puestos 1 a 5. Tocar para ver los dorsales'}>
      {equipo ? `# ${equipo.nombre}` : '1–5'}
    </button>
  );
}
