// Informe a la plantilla (copiar el mensaje), convocatoria para las familias y plan de partido en papel o PDF. En lo que se comparte, sin nombres de jugadores.
import { useState } from 'react';
import type { Jugadora } from '../diario/diario';
import { mensajeConvocatoria } from '../equipo/familias';
import { datosTarjeta, tarjetaPng, compartirImagen } from '../compartir/tarjetaResultado';
import { hojaPartido } from '../temporada/hojaPartido';
import { leerDiario } from '../diario/diario';
import { leerEquipoActivo } from '../equipo/equipos';
import { reglasDe } from '../reglas/reglas';
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
  const tarjeta = async () => {
    const eq = leerEquipoActivo();
    const d = eq ? datosTarjeta(eq, e, jugadoras) : undefined;
    if (!d) { setAviso('Apunta primero el resultado para hacer la tarjeta.'); return; }
    try {
      const r = await compartirImagen(await tarjetaPng(d), 'resultado-horns.png');
      setAviso(r === 'guardado' ? 'Tarjeta guardada en el móvil: solo lleva dorsales.' : r === 'enviado' ? 'Tarjeta enviada.' : '');
    } catch {
      setAviso('No se ha podido crear la tarjeta.');
    }
  };
  const hoja = (nombres: boolean) => {
    const eq = leerEquipoActivo();
    const reglas = reglasDe(eq);
    const todas = leerDiario().jugadoras.filter((j) => j.equipoId === eq?.id);
    const html = hojaPartido(e, equipo, jugadoras.length ? jugadoras : todas, { nombres, faltas: reglas.faltas, cuartos: reglas.periodos });
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    if (!window.open(url, '_blank')) setAviso('El navegador ha bloqueado la hoja.');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };
  return (
    <div className="fila-chips" role="group" aria-label="Compartir el partido">
      <button className="chip" onClick={() => void copiar(mensajePartido(e, equipo), 'Mensaje copiado. Pégalo en el grupo.')}>Copiar mensaje a la plantilla</button>
      <button className="chip" onClick={() => void copiar(mensajeConvocatoria(e, equipo, jugadoras), 'Convocatoria copiada, con dorsales y sin nombres.')}>Copiar convocatoria para las familias</button>
      <button className="chip" onClick={imprimir}>⎙ Plan en PDF</button>
      <button className="chip" onClick={() => hoja(false)}>⎙ Hoja del partido (dorsales)</button>
      <button className="chip" onClick={() => hoja(true)}>⎙ Hoja con nombres</button>
      <button className="chip" onClick={() => void tarjeta()} disabled={!e.resultado}>Tarjeta del resultado (imagen)</button>
      {aviso && <span className="meta" aria-live="polite">{aviso}</span>}
    </div>
  );
}
