// Informe a la plantilla (copiar el mensaje) y plan de partido en papel o PDF. Sin nombres de jugadores.
import { useState } from 'react';
import { hojaPlan, mensajePartido } from '../temporada/mensaje';
import type { Evento } from '../temporada/temporada';

export function CompartirPlan({ e, equipo }: { e: Evento; equipo: string }) {
  const [aviso, setAviso] = useState('');
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(mensajePartido(e, equipo));
      setAviso('Mensaje copiado. Pégalo en el grupo.');
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
      <button className="chip" onClick={copiar}>Copiar mensaje a la plantilla</button>
      <button className="chip" onClick={imprimir}>⎙ Plan en PDF</button>
      {aviso && <span className="meta" aria-live="polite">{aviso}</span>}
    </div>
  );
}
