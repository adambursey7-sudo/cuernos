// Barra «partido en directo»: si hay un partido empezado y sin terminar, queda a mano encima del menú para volver a él con un toque.
import { useEffect, useState } from 'react';
import { hoy } from '../diario/diario';
import { sumarDias } from '../temporada/fechas';
import { leerEquipoActivo } from '../equipo/equipos';
import { totalPuntos } from '../temporada/directo';
import { leerTemporadas, temporadaDe, type Evento } from '../temporada/temporada';
import { nombreCuarto } from './vivo';

/** El partido empezado y sin terminar del equipo activo (el último, si por error hubiera dos). */
export function partidoEnCurso(): Evento | undefined {
  const equipo = leerEquipoActivo();
  const t = equipo ? temporadaDe(leerTemporadas(), equipo.id) : undefined;
  // Un partido empezado hace días y abandonado no deja la barra puesta para siempre.
  const desde = sumarDias(hoy(), -1);
  return t?.eventos.filter((e) => e.tipo === 'partido' && e.fecha >= desde && e.vivo && !e.vivo.fin && (e.vivo.cronologia.length > 0 || e.vivo.corre)).sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
}

export function BarraDirecto({ abrir }: { abrir: (id: string) => void }) {
  const [e, setE] = useState<Evento | undefined>(partidoEnCurso);
  useEffect(() => {
    const firma = (x?: Evento) => (x?.vivo ? `${x.id}|${x.vivo.cuarto}|${x.vivo.cronologia.length}` : '');
    const id = setInterval(() => setE((antes) => { const ahora = partidoEnCurso(); return firma(ahora) === firma(antes) ? antes : ahora; }), 2000);
    return () => clearInterval(id);
  }, []);
  if (!e?.vivo) return null;
  return (
    <button className="barra-directo" onClick={() => abrir(e.id)} aria-label={`Seguir el partido en directo contra ${e.titulo || 'el rival'}`}>
      <i aria-hidden="true" />
      <span>En directo · {nombreCuarto(e.vivo.cuarto)} · {totalPuntos(e.directo)}–{e.vivo.cronologia.reduce((n, j) => n + (j.tipo === 'rival' ? j.v ?? 0 : 0), 0)} · Seguir</span>
    </button>
  );
}
