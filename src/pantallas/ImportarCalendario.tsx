// Traer partidos y entrenos al calendario: un .ics (Google Calendar, Apple, Outlook) o una lista pegada de jornadas.
// Siempre con vista previa: casillas, tipo, fecha y rival se corrigen antes de guardar. Se lee en el móvil; no se manda a ningún sitio.
import { useState } from 'react';
import { DIAS, corta, diaSemana } from '../temporada/fechas';
import { leerIcs, leerLista, type Candidata } from '../temporada/ics';
import { aplicarCandidatas, type Temporada, type TipoEvento } from '../temporada/temporada';

type Fila = Candidata & { ok: boolean };
const SIGUIENTE: Record<TipoEvento, TipoEvento> = { partido: 'entreno', entreno: 'otro', otro: 'partido' };
const NOMBRE: Record<TipoEvento, string> = { partido: 'Partido', entreno: 'Entreno', otro: 'Otro' };

export function ImportarCalendario({ t, volver, guardar }: { t: Temporada; volver: () => void; guardar: (t: Temporada) => void }) {
  const [texto, setTexto] = useState('');
  const [filas, setFilas] = useState<Fila[] | null>(null);
  const [mensaje, setMensaje] = useState('');

  const mostrar = (cs: Candidata[], vacio: string) => {
    // Los «otros» (cumpleaños, reuniones) vienen sin marcar: casi nunca son del equipo.
    setFilas(cs.map((c) => ({ ...c, ok: c.tipo !== 'otro' })));
    setMensaje(cs.length ? '' : vacio);
  };
  const subir = async (archivo: File | undefined) => {
    if (!archivo) return;
    try {
      mostrar(leerIcs(await archivo.text()), 'No he encontrado eventos en ese archivo. Tiene que ser un .ics.');
    } catch {
      setMensaje('No he podido leer ese archivo.');
    }
  };
  const poner = (i: number, c: Partial<Fila>) => setFilas((f) => f && f.map((x, k) => (k === i ? { ...x, ...c } : x)));
  const elegidas = (filas ?? []).filter((f) => f.ok && f.titulo.trim());

  return (
    <section className="pantalla">
      <div className="cabecera">
        <button className="atras" onClick={volver} aria-label="Volver al calendario">‹</button>
        <h2 className="nombre-sistema">Importar al calendario</h2>
      </div>
      <p className="meta">Elige un archivo .ics de tu calendario o pega la lista de jornadas de la federación. Lo que no esté claro sale con «?» para que lo repases.</p>
      <label className="subir-archivo">
        <input type="file" accept=".ics,text/calendar" onChange={(ev) => { void subir(ev.target.files?.[0]); ev.target.value = ''; }} />
        Elegir archivo .ics
      </label>
      <label className="campo-diario">
        <span>O pega la lista de jornadas</span>
        <textarea rows={5} value={texto} placeholder={'J1 13/10 11:00 Ejemplo CB (C)\nJ2 20/10 12:30 Ejemplo BC (F)'} onChange={(ev) => setTexto(ev.target.value)} />
      </label>
      <button className="principal ancho" disabled={!texto.trim()} onClick={() => mostrar(leerLista(texto, t.inicio), 'No he encontrado partidos. Hace falta al menos el rival o la fecha en cada línea.')}>Leer lista</button>
      {mensaje && <p className="aviso">{mensaje}</p>}
      {filas && filas.length > 0 && (
        <>
          <h3 className="sub">Vista previa · {filas.length}</h3>
          <ul className="lista">
            {filas.map((f, i) => (
              <li key={i} className="fila-previa tp-previa">
                <input type="checkbox" checked={f.ok} aria-label={`Importar ${f.titulo}`} onChange={(ev) => poner(i, { ok: ev.target.checked })} />
                <div className="tp-previa-cuerpo">
                  <div className="tp-previa-linea">
                    <button className="chip pequeno" onClick={() => poner(i, { tipo: SIGUIENTE[f.tipo], semanal: f.tipo === 'otro' ? f.semanal : undefined })} aria-label="Cambiar entre partido, entreno y otro">{NOMBRE[f.tipo]}</button>
                    {f.dudosa && <span className="chip pequeno r" title="Revísalo">?</span>}
                    <input className="p-nom" value={f.titulo} aria-label="Nombre" onChange={(ev) => poner(i, { titulo: ev.target.value })} />
                  </div>
                  <div className="tp-previa-linea">
                    {f.semanal ? <span className="meta">Cada {DIAS[diaSemana(f.fecha)]} · {f.hora}</span> : (
                      <>
                        <input type="date" value={f.fecha} aria-label="Fecha" onChange={(ev) => ev.target.value && poner(i, { fecha: ev.target.value, dudosa: false })} />
                        <input type="time" value={f.hora} aria-label="Hora" onChange={(ev) => ev.target.value && poner(i, { hora: ev.target.value })} />
                      </>
                    )}
                    {f.tipo === 'partido' && !f.semanal && (
                      <button className="chip pequeno" onClick={() => poner(i, { casa: f.casa === false, dudosa: false })} aria-label="Casa o fuera">{f.casa === false ? 'Fuera' : f.casa === true ? 'Casa' : 'Casa ?'}</button>
                    )}
                  </div>
                  {!f.semanal && <span className="meta">{corta(f.fecha)}</span>}
                </div>
              </li>
            ))}
          </ul>
          <button className="principal ancho" disabled={elegidas.length === 0} onClick={() => guardar(aplicarCandidatas(t, elegidas))}>
            Importar {elegidas.length}
          </button>
        </>
      )}
    </section>
  );
}
