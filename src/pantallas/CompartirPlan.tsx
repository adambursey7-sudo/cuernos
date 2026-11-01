// Informe a la plantilla (copiar el mensaje), convocatoria para las familias y plan de partido en papel o PDF. En lo que se comparte, sin nombres de jugadores.
import { useState } from 'react';
import type { Jugadora } from '../diario/diario';
import { mensajeConvocatoria } from '../equipo/familias';
import { hojaPlan, mensajePartido } from '../temporada/mensaje';
import type { Evento } from '../temporada/temporada';

export function CompartirPlan({ e, equipo, jugadoras = [] }: { e: Evento; equipo: string; jugadoras?: Jugadora[] }) {
  const [aviso, setAviso] = useState('');
  const copiar = async (texto: string, ok: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setAviso(ok);
    } catch {
      setAviso('Este móvil no deja copiar.');
    }
  };
  const imprimir = () => {
    // Hoja aparte (ya con el texto escapado): se abre y se imprime o guarda en PDF desde el navegador.
    const url = URL.createObjectURL(new Blob([hojaPlan(e, equipo)], { type: 'text/html' }));
    if (!window.open(url, '_blank')) setAviso('El navegador ha bloqueado la hoja.');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };
  return (
    <div className="fila-chips" role="group" aria-label="Compartir el partido">
      <button className="chip" onClick={() => void copiar(mensajePartido(e, equipo), 'Mensaje copiado. Pégalo en el grupo.')}>Copiar mensaje a la plantilla</button>
      <button className="chip" onClick={() => void copiar(mensajeConvocatoria(e, equipo, jugadoras), 'Convocatoria copiada, con dorsales y sin nombres.')}>Copiar convocatoria para las familias</button>
      <button className="chip" onClick={imprimir}>⎙ Plan en PDF</button>
      {aviso && <span className="meta" aria-live="polite">{aviso}</span>}
    </div>
  );
}
