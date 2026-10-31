// Informe del rival dentro del partido (vuelta 7, A+B): etiquetas, dos cajas de texto y «Pasar a sesión» con ejercicios de la biblioteca.
import { useState } from 'react';
import { nombreDeHabilidad, nuevaHabilidad } from '../habilidades/habilidades';
import { ejerciciosDeHabilidad, sesionDeLoFlojo } from '../habilidades/biblioteca';
import { categoriaDeEquipo, leerFiltroEdad, porEdad } from '../habilidades/edad';
import { guardarSesiones, leerSesiones } from '../sesiones/sesiones';
import { habilidadesContra, informeAnterior, informeVacio, RASGOS_RIVAL, type InformeRival } from '../temporada/rival';
import type { Evento } from '../temporada/temporada';

interface Props {
  e: Evento;
  eventos: Evento[];
  equipo: string;
  poner: (c: Partial<Evento>) => void;
  /** Guarda la sesión creada y la enlaza al partido. */
  enlazar: (sesionId: string) => void;
}

export function InformeRivalEditor({ e, eventos, equipo, poner, enlazar }: Props) {
  const [aviso, setAviso] = useState('');
  const r = e.rival ?? informeVacio();
  const cambiar = (c: Partial<InformeRival>) => poner({ rival: { ...r, ...c } });
  const anterior = e.rival ? undefined : informeAnterior(eventos, e);
  const contra = habilidadesContra(r.rasgos);
  const { flojos, quitadas } = porEdad(
    contra.map((id) => ({ h: nuevaHabilidad(nombreDeHabilidad([], id), id), ejercicios: ejerciciosDeHabilidad(id) })),
    categoriaDeEquipo(equipo), leerFiltroEdad(),
  );
  const hay = flojos.reduce((n, f) => n + f.ejercicios.length, 0);

  const pasarASesion = () => {
    const s = sesionDeLoFlojo(equipo, flojos);
    if (!s) return setAviso('No hay ejercicios en la biblioteca para esto todavía.');
    const sesion = { ...s, nombre: `Antes del partido${e.titulo ? ` vs ${e.titulo}` : ''}` };
    if (!guardarSesiones([...leerSesiones(), sesion])) return setAviso('El móvil no deja guardar: libera espacio e inténtalo otra vez.');
    enlazar(sesion.id);
    setAviso(`Creada la sesión «${sesion.nombre}» y enlazada a este partido.`);
  };

  return (
    <div className="informe-rival">
      <h3 className="sub">Informe del rival</h3>
      {anterior && <button className="chip" onClick={() => poner({ rival: anterior })}>Copiar el informe de la otra vez contra {e.titulo}</button>}
      <div className="niveles filtro" role="group" aria-label="Cómo juega el rival">
        {RASGOS_RIVAL.map((x) => {
          const on = r.rasgos.includes(x.id);
          return <button key={x.id} className={on ? 'chip on' : 'chip'} aria-pressed={on} onClick={() => cambiar({ rasgos: on ? r.rasgos.filter((y) => y !== x.id) : [...r.rasgos, x.id] })}>{x.nombre}</button>;
        })}
      </div>
      <label className="campo-diario"><span>A quién vigilar (solo dorsal)</span>
        <textarea rows={2} value={r.vigilar} maxLength={300} placeholder="La 7 tira de lejos…" onChange={(ev) => cambiar({ vigilar: ev.target.value })} /></label>
      <label className="campo-diario"><span>Qué haremos</span>
        <textarea rows={2} value={r.haremos} maxLength={300} placeholder="Cerrar el rebote…" onChange={(ev) => cambiar({ haremos: ev.target.value })} /></label>
      {r.rasgos.length > 0 && (
        <>
          <span className="meta">Para esto conviene trabajar: {flojos.map((f) => f.h.nombre).join(', ') || 'nada por ahora'} ({hay} {hay === 1 ? 'ejercicio' : 'ejercicios'} en la biblioteca).{quitadas.length > 0 && ` Fuera por edad: ${quitadas.join(', ')}.`}</span>
          <button className="principal ancho" disabled={hay === 0} onClick={pasarASesion}>Pasar a sesión</button>
        </>
      )}
      {aviso && <span className="meta" role="status">{aviso}</span>}
    </div>
  );
}
