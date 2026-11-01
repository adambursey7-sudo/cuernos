// Familias y papeles: horarios de la semana por mensaje, calendario exportable (con recordatorio), hoja de cada jugador
// e informe de fin de temporada. En lo que va a un grupo solo hay dorsales; la hoja de cada jugador es para su familia.
import { useState } from 'react';
import { hoy, type Equipo, type Jugadora } from '../diario/diario';
import { hojaJugador, informeTemporada, mensajeSemana } from '../equipo/familias';
import { escribirIcs } from '../temporada/ics';
import { itemsParaIcs, type Temporada } from '../temporada/temporada';

const AVISOS: [number, string][] = [[0, 'Sin aviso'], [30, '30 min antes'], [60, '1 h antes'], [180, '3 h antes'], [1440, '1 día antes']];

function abrirHoja(html: string, tipo = 'text/html'): boolean {
  const url = URL.createObjectURL(new Blob([html], { type: tipo }));
  const ok = !!window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return ok;
}

function descargar(texto: string, nombre: string, tipo: string) {
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(new Blob([texto], { type: tipo }));
  enlace.download = nombre;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(enlace.href), 60_000);
}

export function Familias({ equipo, t, jugadoras, volver }: { equipo: Equipo; t: Temporada; jugadoras: Jugadora[]; volver: () => void }) {
  const [aviso, setAviso] = useState('');
  const [antes, setAntes] = useState(60);
  const nombreArchivo = `horns-${equipo.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'equipo'}`;

  const copiar = async (texto: string, ok: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setAviso(ok);
    } catch {
      setAviso('Este móvil no deja copiar.');
    }
  };

  return (
    <section className="pantalla">
      <div className="cabecera">
        <button className="atras" onClick={volver} aria-label="Volver al calendario">‹</button>
        <h2 className="nombre-sistema">Familias y papeles</h2>
      </div>
      {aviso && <p className="aviso-copia" role="status">{aviso}</p>}

      <div className="bloque-equipo">
        <h3 className="sub">Horarios por mensaje</h3>
        <p className="meta">Lo de esta semana, listo para pegar en el grupo.</p>
        <button className="secundario" onClick={() => void copiar(mensajeSemana(t, equipo.nombre, hoy()), 'Horarios de la semana copiados. Pégalos en el grupo.')}>Copiar horarios de la semana</button>
      </div>

      <div className="bloque-equipo">
        <h3 className="sub">Calendario para el móvil</h3>
        <p className="meta">Un archivo que se abre en el calendario del móvil. Los entrenos cancelados no salen.</p>
        <label className="campo-diario">
          <span>Recordatorio</span>
          <select value={antes} onChange={(ev) => setAntes(Number(ev.target.value))}>{AVISOS.map(([m, n]) => <option key={m} value={m}>{n}</option>)}</select>
        </label>
        <div className="dos-botones">
          <button className="secundario" onClick={() => descargar(escribirIcs(equipo.nombre, itemsParaIcs(t), { avisarMin: antes, sinEntrenos: true }), `${nombreArchivo}-partidos.ics`, 'text/calendar')}>Solo partidos (familias)</button>
          <button className="secundario" onClick={() => descargar(escribirIcs(equipo.nombre, itemsParaIcs(t), { avisarMin: antes }), `${nombreArchivo}-todo.ics`, 'text/calendar')}>Entrenos y partidos</button>
        </div>
      </div>

      <div className="bloque-equipo">
        <h3 className="sub">Hoja de cada jugador</h3>
        <p className="meta">Horarios, próximos partidos y asistencia. Para su familia: no lleva lesiones ni tus notas. Se abre aparte para imprimir o guardar en PDF.</p>
        {jugadoras.length === 0 && <p className="vacio">Aún no hay jugadores.</p>}
        <ul className="lista">
          {jugadoras.map((j) => (
            <li key={j.id}>
              <button className="fila-jugadora" onClick={() => { if (!abrirHoja(hojaJugador(j, equipo, t, hoy()))) setAviso('El navegador ha bloqueado la hoja.'); }}>
                <span className="dorsal" aria-hidden>{j.numero || '–'}</span>
                <span className="datos"><b>{j.nombre || 'Sin nombre'}</b></span>
                <span className="chip pequeno">⎙ Hoja</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="bloque-equipo">
        <h3 className="sub">Informe de fin de temporada</h3>
        <p className="meta">Resultados por competición, objetivos y asistencia.</p>
        <div className="dos-botones">
          <button className="secundario" onClick={() => void copiar(informeTemporada(equipo, t, jugadoras), 'Informe copiado.')}>Copiar informe</button>
          <button className="secundario" onClick={() => void copiar(informeTemporada(equipo, t, jugadoras, false), 'Informe copiado, solo con dorsales.')}>Copiar solo con dorsales</button>
        </div>
      </div>
    </section>
  );
}
