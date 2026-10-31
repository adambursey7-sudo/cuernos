// Equipo (tramo 1 del loop Diario): plantilla con dorsal grande y ficha de cada jugadora con tres pestañas (opción A, Adam 30/10).
// Los datos viven solo en este móvil. La ficha se guarda sola al escribir.
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  POSICIONES, disponibles, guardarDiario, guardarEquipo, guardarJugadora, hoy, leerDiario, nuevaJugadora, nuevoEquipo, plantilla, quitarEquipo, quitarJugadora, repetida,
  type Diario, type Equipo as EquipoDatos, type Jugadora,
} from '../diario/diario';
import { NOMBRE_PUESTO, PUESTOS, rellenarPuestos } from '../diario/puestos';
import { leerTexto, textoDePdf, type Candidata } from '../diario/importar';
import { leerTemporadas, resumenAsistencia, temporadaDe } from '../temporada/temporada';
import { DiarioSesion } from './DiarioSesion';
import { Habilidades } from './Habilidades';
import { Rotacion } from './Rotacion';
import { Temporada } from './Temporada';

type Vista = { tipo: 'plantilla' } | { tipo: 'temporada' } | { tipo: 'habilidades' } | { tipo: 'rotacion' } | { tipo: 'diario' } | { tipo: 'equipo' } | { tipo: 'jugadora'; id: string } | { tipo: 'importar' };

function Campo({ etiqueta, valor, cambiar, filas = 3, ayuda }: { etiqueta: string; valor: string; cambiar: (v: string) => void; filas?: number; ayuda?: string }) {
  return (
    <label className="campo-diario">
      <span>{etiqueta}</span>
      <textarea value={valor} rows={filas} onChange={(ev) => cambiar(ev.target.value)} placeholder={ayuda} />
    </label>
  );
}

function Ficha({ d, j, cambiar, borrar, volver }: { d: Diario; j: Jugadora; cambiar: (j: Jugadora) => void; borrar: () => void; volver: () => void }) {
  const [pestana, setPestana] = useState<'perfil' | 'entrenar' | 'notas'>('perfil');
  const [seguro, setSeguro] = useState(false);
  const [nota, setNota] = useState('');
  const otra = repetida(d, j);
  const asis = useMemo(() => resumenAsistencia(temporadaDe(leerTemporadas(), j.equipoId), j.id), [j.equipoId, j.id]);
  const poner = (c: Partial<Jugadora>) => cambiar({ ...j, ...c });
  return (
    <section className="pantalla ficha-jugadora">
      <div className="cabecera">
        <button className="atras" onClick={volver} aria-label="Volver a la plantilla">‹</button>
        <span className="dorsal grande-dorsal" aria-hidden>{j.numero || '–'}</span>
        <h2 className="nombre-sistema">{j.nombre || 'Jugadora nueva'}</h2>
      </div>
      <div className="niveles filtro" role="tablist" aria-label="Apartados de la ficha">
        {([['perfil', 'Perfil'], ['entrenar', 'Entrenar'], ['notas', `Notas${j.notas.length ? ` (${j.notas.length})` : ''}`]] as const).map(([id, nombre]) => (
          <button key={id} role="tab" aria-selected={pestana === id} className={pestana === id ? 'chip on' : 'chip'} onClick={() => setPestana(id)}>{nombre}</button>
        ))}
      </div>

      {pestana === 'perfil' && (
        <>
          <div className="fila-campos">
            <label className="campo-diario nombre">
              <span>Nombre o apodo</span>
              <input value={j.nombre} maxLength={40} onChange={(ev) => poner({ nombre: ev.target.value })} autoComplete="off" />
            </label>
            <label className="campo-diario num">
              <span>Dorsal</span>
              <input value={j.numero} maxLength={2} inputMode="numeric" onChange={(ev) => poner({ numero: ev.target.value.replace(/\D/g, '') })} />
            </label>
          </div>
          {asis.de > 0 && <p className="meta">Asistencia: ha venido a <b>{asis.vino} de {asis.de}</b> entrenos con lista.</p>}
          {otra && <p className="aviso">El {j.numero} ya lo lleva {otra.nombre || 'otra jugadora'}.</p>}
          <div className="niveles filtro" role="group" aria-label="Posición">
            {POSICIONES.map((p) => (
              <button key={p} className={j.posicion === p ? 'chip on' : 'chip'} aria-pressed={j.posicion === p} onClick={() => poner({ posicion: j.posicion === p ? '' : p })}>{p}</button>
            ))}
          </div>
          <div className="lesion">
            <button className={j.lesion ? 'chip on estado-trabajar' : 'chip'} aria-pressed={!!j.lesion} onClick={() => poner({ lesion: j.lesion ? undefined : { desde: hoy(), nota: '' } })}>{j.lesion ? 'Lesionada' : 'Marcar lesión'}</button>
            {j.lesion && (
              <>
                <label className="campo-diario">
                  <span>Lesión · desde el {j.lesion.desde.split('-').reverse().join('/')}</span>
                  <textarea value={j.lesion.nota} rows={2} onChange={(ev) => poner({ lesion: { desde: j.lesion!.desde, nota: ev.target.value } })} placeholder="Qué le pasa y cuándo vuelve" />
                </label>
                <p className="meta">Dato de salud: solo está en este móvil. La copia de seguridad no lo incluye salvo que lo marques en Más.</p>
              </>
            )}
          </div>
          <Campo etiqueta="Puntos fuertes" valor={j.fuertes} cambiar={(fuertes) => poner({ fuertes })} ayuda="Lo que hace bien" />
          <Campo etiqueta="A mejorar" valor={j.mejorar} cambiar={(mejorar) => poner({ mejorar })} ayuda="Lo que le falta" />
          <Campo etiqueta="Cómo juega" valor={j.forma} cambiar={(forma) => poner({ forma })} ayuda="Su forma de jugar, su papel en el equipo" filas={4} />
        </>
      )}

      {pestana === 'entrenar' && (
        <>
          <Campo etiqueta="Cómo entrenarla" valor={j.entrenar} cambiar={(entrenar) => poner({ entrenar })} ayuda="Qué trabajar con ella y cómo" filas={7} />
          {j.mejorar && (
            <p className="meta">Lo que quieres mejorar: <b>{j.mejorar}</b></p>
          )}
        </>
      )}

      {pestana === 'notas' && (
        <>
          <label className="campo-diario">
            <span>Nota nueva · {hoy().split('-').reverse().join('/')}</span>
            <textarea value={nota} rows={3} onChange={(ev) => setNota(ev.target.value)} placeholder="Qué has visto hoy" />
          </label>
          <button className="principal ancho" disabled={!nota.trim()} onClick={() => { poner({ notas: [{ fecha: hoy(), texto: nota.trim() }, ...j.notas] }); setNota(''); }}>Guardar nota</button>
          <ul className="lista notas">
            {j.notas.map((n, i) => (
              <li key={`${n.fecha}${i}`} className="nota-jugadora">
                <span className="meta">{n.fecha.split('-').reverse().join('/')}</span>
                <p>{n.texto}</p>
                <button className="chip pequeno" onClick={() => poner({ notas: j.notas.filter((_, k) => k !== i) })}>Borrar</button>
              </li>
            ))}
          </ul>
          {j.notas.length === 0 && <p className="vacio">Aún no hay notas. Apunta lo que veas en entrenamientos y partidos.</p>}
        </>
      )}

      <div className="peligro">
        {seguro ? (
          <>
            <button className="chip" onClick={() => setSeguro(false)}>No borrar</button>
            <button className="chip on" onClick={borrar}>Sí, borrar esta ficha</button>
          </>
        ) : (
          <button className="chip" onClick={() => setSeguro(true)}>Borrar jugadora</button>
        )}
      </div>
    </section>
  );
}

function FichaEquipo({ e, jugadoras, cambiar, borrar, volver, ir }: { e: EquipoDatos; jugadoras: Jugadora[]; cambiar: (e: EquipoDatos) => void; borrar: () => void; volver: () => void; ir: (t: 'ejercicios' | 'jugadas') => void }) {
  const [seguro, setSeguro] = useState(false);
  return (
    <section className="pantalla ficha-jugadora">
      <div className="cabecera">
        <button className="atras" onClick={volver} aria-label="Volver a la plantilla">‹</button>
        <h2 className="nombre-sistema">{e.nombre}</h2>
      </div>
      <label className="campo-diario">
        <span>Nombre del equipo</span>
        <input value={e.nombre} maxLength={40} onChange={(ev) => cambiar({ ...e, nombre: ev.target.value })} />
      </label>
      <Campo etiqueta="Forma de jugar" valor={e.forma} cambiar={(forma) => cambiar({ ...e, forma })} ayuda="Cómo quieres que juegue el equipo" filas={4} />
      <Campo etiqueta="Virtudes del equipo" valor={e.virtudes} cambiar={(virtudes) => cambiar({ ...e, virtudes })} ayuda="En qué es bueno" />
      <Campo etiqueta="A trabajar" valor={e.trabajar} cambiar={(trabajar) => cambiar({ ...e, trabajar })} ayuda="Lo que hay que mejorar" />
      <Campo etiqueta="Cómo entrenarlo" valor={e.como} cambiar={(como) => cambiar({ ...e, como })} ayuda="Qué tipo de ejercicios y sistemas, y cuánto" filas={5} />
      <div className="puestos">
        <h2 className="sub">Quién es quién en la pizarra</h2>
        <p className="meta">Cada puesto de las jugadas (1 a 5) con la jugadora que lo hace. En la pizarra puedes enseñar su dorsal en vez del puesto.</p>
        {PUESTOS.map((p) => (
          <label key={p} className="puesto">
            <span className="dorsal" aria-hidden>{p}</span>
            <span className="meta">{NOMBRE_PUESTO[p]}</span>
            <select value={e.puestos?.[p] ?? ''} onChange={(ev) => cambiar({ ...e, puestos: { ...e.puestos, [p]: ev.target.value || undefined } })} aria-label={`Quién hace el puesto ${p}, ${NOMBRE_PUESTO[p]}`}>
              <option value="">Sin elegir</option>
              {jugadoras.map((j) => <option key={j.id} value={j.id}>{j.numero ? `#${j.numero}` : '#–'} {j.nombre}</option>)}
            </select>
          </label>
        ))}
        <button className="secundario" onClick={() => cambiar(rellenarPuestos({ equipos: [e], jugadoras }, e))}>Rellenar según su posición</button>
      </div>
      <div className="dos-botones">
        <button className="secundario" onClick={() => ir('ejercicios')}>Buscar ejercicios</button>
        <button className="secundario" onClick={() => ir('jugadas')}>Buscar jugadas</button>
      </div>
      <div className="peligro">
        {seguro ? (
          <>
            <button className="chip" onClick={() => setSeguro(false)}>No borrar</button>
            <button className="chip on" onClick={borrar}>Sí, borrar equipo y plantilla</button>
          </>
        ) : (
          <button className="chip" onClick={() => setSeguro(true)}>Borrar equipo</button>
        )}
      </div>
    </section>
  );
}

function Importar({ equipoId, existentes, crear, volver }: { equipoId: string; existentes: string[]; crear: (c: Candidata[]) => void; volver: () => void }) {
  const [texto, setTexto] = useState('');
  const [lista, setLista] = useState<(Candidata & { ok: boolean })[] | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [leyendo, setLeyendo] = useState(false);
  const leer = (t: string) => {
    const r = leerTexto(t);
    setLista(r.map((c) => ({ ...c, ok: true })));
    setMensaje(r.length ? '' : 'No he encontrado jugadoras. Hace falta un dorsal y un nombre en cada línea.');
  };
  const subir = async (archivo: File | undefined) => {
    if (!archivo) return;
    setLeyendo(true);
    setMensaje('');
    try {
      const t = /\.pdf$/i.test(archivo.name) || archivo.type === 'application/pdf' ? await textoDePdf(archivo) : await archivo.text();
      setTexto(t);
      leer(t);
    } catch {
      setMensaje('No he podido leer ese archivo. Si es un PDF escaneado (una foto), copia el texto y pégalo aquí.');
    } finally {
      setLeyendo(false);
    }
  };
  const yaEsta = (c: Candidata) => existentes.includes(`${c.numero}|${c.nombre.trim().toLowerCase()}`);
  const elegidas = lista?.filter((c) => c.ok && c.nombre.trim() && !yaEsta(c)) ?? [];
  return (
    <section className="pantalla ficha-jugadora" data-equipo={equipoId}>
      <div className="cabecera">
        <button className="atras" onClick={volver} aria-label="Volver a la plantilla">‹</button>
        <h2 className="nombre-sistema">Importar plantilla</h2>
      </div>
      <p className="meta">Sube un PDF, un CSV o un texto con el dorsal y el nombre de cada jugadora. Se lee en tu móvil; no se manda a ningún sitio.</p>
      <label className="subir-archivo">
        <input type="file" accept=".pdf,.csv,.txt,text/plain,text/csv,application/pdf" onChange={(ev) => { void subir(ev.target.files?.[0]); ev.target.value = ''; }} />
        {leyendo ? 'Leyendo…' : 'Elegir PDF o archivo'}
      </label>
      <Campo etiqueta="O pega aquí la lista" valor={texto} cambiar={setTexto} filas={5} ayuda={'4 Ejemplo Uno Base\n7 Ejemplo Dos Alero'} />
      <button className="principal ancho" disabled={!texto.trim()} onClick={() => leer(texto)}>Leer lista</button>
      {mensaje && <p className="aviso">{mensaje}</p>}
      {lista && lista.length > 0 && (
        <>
          <h3 className="sub">Vista previa</h3>
          <ul className="lista">
            {lista.map((c, i) => (
              <li key={i} className="fila-previa">
                <input type="checkbox" checked={c.ok} aria-label={`Crear a ${c.nombre}`} onChange={(ev) => setLista(lista.map((x, k) => (k === i ? { ...x, ok: ev.target.checked } : x)))} />
                <input className="p-num" value={c.numero} inputMode="numeric" maxLength={2} aria-label="Dorsal" onChange={(ev) => setLista(lista.map((x, k) => (k === i ? { ...x, numero: ev.target.value.replace(/\D/g, '') } : x)))} />
                <input className="p-nom" value={c.nombre} aria-label="Nombre" onChange={(ev) => setLista(lista.map((x, k) => (k === i ? { ...x, nombre: ev.target.value } : x)))} />
                <span className="meta">{yaEsta(c) ? 'Ya está' : c.posicion}</span>
              </li>
            ))}
          </ul>
          <button className="principal ancho" disabled={elegidas.length === 0} onClick={() => crear(elegidas)}>
            Crear {elegidas.length} {elegidas.length === 1 ? 'jugadora' : 'jugadoras'}
          </button>
        </>
      )}
    </section>
  );
}

function Apartados({ ver, vista }: { ver: (v: 'plantilla' | 'habilidades' | 'rotacion' | 'diario' | 'temporada') => void; vista: 'plantilla' | 'habilidades' | 'rotacion' | 'diario' | 'temporada' }) {
  return (
    <div className="niveles filtro" role="tablist" aria-label="Apartados del equipo">
      {([['plantilla', 'Plantilla'], ['habilidades', 'Habilidades'], ['rotacion', 'Rotación'], ['diario', 'Diario'], ['temporada', 'Temporada']] as const).map(([id, nombre]) => (
        <button key={id} role="tab" aria-selected={vista === id} className={vista === id ? 'chip on' : 'chip'} onClick={() => ver(id)}>{nombre}</button>
      ))}
    </div>
  );
}

export function Equipo({ ir, fecha, abrirSesion, abrirEjercicio, abrirSistema }: { ir: (t: 'ejercicios' | 'jugadas') => void; fecha?: string; abrirSesion: (id: string) => void; abrirEjercicio: (id: string) => void; abrirSistema: (id: string) => void }) {
  const [d, setD] = useState<Diario>(leerDiario);
  const [activo, setActivo] = useState<string>(() => leerDiario().equipos[0]?.id ?? '');
  const [vista, setVista] = useState<Vista>(() => (fecha ? { tipo: 'temporada' } : { tipo: 'plantilla' }));
  const [nombre, setNombre] = useState('');
  const [fallo, setFallo] = useState(false);
  const primera = useRef(true);

  useEffect(() => {
    if (primera.current) { primera.current = false; return; }
    setFallo(!guardarDiario(d));
  }, [d]);

  const equipo = d.equipos.find((e) => e.id === activo) ?? d.equipos[0];

  const crearEquipo = () => {
    const n = nombre.trim();
    if (!n) return;
    const e = nuevoEquipo(n);
    setD(guardarEquipo(d, e));
    setActivo(e.id);
    setNombre('');
  };

  if (!equipo)
    return (
      <section className="pantalla">
        <h1 className="titulo">Equipo</h1>
        <p className="vacio">Aquí vive tu cuaderno: la plantilla, la ficha de cada jugadora y cómo juega y entrena tu equipo. Se guarda solo en este móvil.</p>
        <div className="nuevo-equipo">
          <label className="campo-diario">
            <span>¿Cómo se llama tu equipo?</span>
            <input value={nombre} maxLength={40} placeholder="Cadete femenino" onChange={(ev) => setNombre(ev.target.value)} onKeyDown={(ev) => ev.key === 'Enter' && crearEquipo()} />
          </label>
          <button className="principal ancho" disabled={!nombre.trim()} onClick={crearEquipo}>Crear equipo</button>
        </div>
      </section>
    );

  if (vista.tipo === 'jugadora') {
    const j = d.jugadoras.find((x) => x.id === vista.id);
    if (j)
      return <Ficha d={d} j={j} cambiar={(n) => setD(guardarJugadora(d, n))} borrar={() => { setD(quitarJugadora(d, j.id)); setVista({ tipo: 'plantilla' }); }} volver={() => { if (!j.nombre.trim() && !j.numero && !j.fuertes && !j.mejorar && !j.forma && !j.entrenar && j.notas.length === 0) setD(quitarJugadora(d, j.id)); setVista({ tipo: 'plantilla' }); }} />;
  }
  if (vista.tipo === 'equipo')
    return (
      <FichaEquipo
        e={equipo}
        jugadoras={plantilla(d, equipo.id)}
        cambiar={(e) => setD(guardarEquipo(d, e))}
        borrar={() => { const resto = d.equipos.filter((e) => e.id !== equipo.id); setD(quitarEquipo(d, equipo.id)); setActivo(resto[0]?.id ?? ''); setVista({ tipo: 'plantilla' }); }}
        volver={() => setVista({ tipo: 'plantilla' })}
        ir={ir}
      />
    );
  if (vista.tipo === 'importar')
    return (
      <Importar
        equipoId={equipo.id}
        existentes={plantilla(d, equipo.id).map((j) => `${j.numero}|${j.nombre.trim().toLowerCase()}`)}
        volver={() => setVista({ tipo: 'plantilla' })}
        crear={(cs) => {
          setD(cs.reduce((acc, c) => guardarJugadora(acc, nuevaJugadora(equipo.id, c)), d));
          setVista({ tipo: 'plantilla' });
        }}
      />
    );

  if (vista.tipo === 'habilidades')
    return (
      <section className="pantalla encabezado-equipo">
        <h1 className="titulo">Equipo</h1>
        <Apartados vista="habilidades" ver={(v) => setVista({ tipo: v })} />
        {d.equipos.length > 1 && (
          <div className="niveles filtro" role="group" aria-label="Equipo">
            {d.equipos.map((x) => <button key={x.id} className={x.id === equipo.id ? 'chip on' : 'chip'} aria-pressed={x.id === equipo.id} onClick={() => setActivo(x.id)}>{x.nombre}</button>)}
          </div>
        )}
        {fallo && <p className="aviso">El móvil no deja guardar: libera espacio o haz una copia.</p>}
        <Habilidades key={equipo.id} e={equipo} cambiar={(n) => setD(guardarEquipo(d, n))} abrirEjercicio={abrirEjercicio} abrirSistema={abrirSistema} abrirSesion={abrirSesion} />
      </section>
    );

  if (vista.tipo === 'rotacion')
    return (
      <section className="pantalla encabezado-equipo">
        <h1 className="titulo">Equipo</h1>
        <Apartados vista="rotacion" ver={(v) => setVista({ tipo: v })} />
        {d.equipos.length > 1 && (
          <div className="niveles filtro" role="group" aria-label="Equipo">
            {d.equipos.map((x) => <button key={x.id} className={x.id === equipo.id ? 'chip on' : 'chip'} aria-pressed={x.id === equipo.id} onClick={() => setActivo(x.id)}>{x.nombre}</button>)}
          </div>
        )}
        {fallo && <p className="aviso">El móvil no deja guardar: libera espacio o haz una copia.</p>}
        <Rotacion key={equipo.id} e={equipo} js={plantilla(d, equipo.id)} cambiar={(n) => setD(guardarEquipo(d, n))} />
      </section>
    );

  if (vista.tipo === 'diario')
    return (
      <section className="pantalla encabezado-equipo">
        <h1 className="titulo">Equipo</h1>
        <Apartados vista="diario" ver={(v) => setVista({ tipo: v })} />
        {d.equipos.length > 1 && (
          <div className="niveles filtro" role="group" aria-label="Equipo">
            {d.equipos.map((x) => <button key={x.id} className={x.id === equipo.id ? 'chip on' : 'chip'} aria-pressed={x.id === equipo.id} onClick={() => setActivo(x.id)}>{x.nombre}</button>)}
          </div>
        )}
        <DiarioSesion key={equipo.id} equipo={equipo} />
      </section>
    );

  if (vista.tipo === 'temporada')
    return (
      <>
        <section className="pantalla encabezado-equipo">
          <h1 className="titulo">Equipo</h1>
          <Apartados vista="temporada" ver={(v) => setVista({ tipo: v })} />
          {d.equipos.length > 1 && (
            <div className="niveles filtro" role="group" aria-label="Equipo">
              {d.equipos.map((e) => <button key={e.id} className={e.id === equipo.id ? 'chip on' : 'chip'} aria-pressed={e.id === equipo.id} onClick={() => setActivo(e.id)}>{e.nombre}</button>)}
            </div>
          )}
        </section>
        <Temporada key={equipo.id} equipo={equipo} jugadoras={plantilla(d, equipo.id)} fechaInicial={fecha} abrirSesion={abrirSesion}
          anotar={(ns) => setD((cur) => ns.reduce((acc, n) => {
            const j = acc.jugadoras.find((x) => x.id === n.id);
            return j ? guardarJugadora(acc, { ...j, notas: [{ fecha: hoy(), texto: n.texto }, ...j.notas] }) : acc;
          }, cur))} />
      </>
    );

  const jugadoras = plantilla(d, equipo.id);
  return (
    <section className="pantalla">
      <h1 className="titulo">Equipo</h1>
      <Apartados vista="plantilla" ver={(v) => setVista({ tipo: v })} />
      {d.equipos.length > 1 && (
        <div className="niveles filtro" role="group" aria-label="Equipo">
          {d.equipos.map((e) => (
            <button key={e.id} className={e.id === equipo.id ? 'chip on' : 'chip'} aria-pressed={e.id === equipo.id} onClick={() => setActivo(e.id)}>{e.nombre}</button>
          ))}
        </div>
      )}
      <button className="tarjeta-col resumen-equipo" onClick={() => setVista({ tipo: 'equipo' })}>
        <span className="nombre">{equipo.nombre}</span>
        <span className="meta">{equipo.forma || equipo.virtudes || 'Toca para escribir su forma de jugar, sus virtudes y cómo entrenarlo'}</span>
      </button>
      <h2 className="sub">Plantilla · {jugadoras.length}{jugadoras.some((j) => j.lesion) ? ` · ${disponibles(jugadoras)} disponibles` : ''}</h2>
      {fallo && <p className="aviso">El móvil no deja guardar: libera espacio o haz una copia.</p>}
      {jugadoras.length === 0 && <p className="vacio">Todavía no hay jugadoras. Añádelas una a una o importa la lista desde un PDF.</p>}
      <ul className="lista">
        {jugadoras.map((j) => (
          <li key={j.id}>
            <button className="fila-jugadora" onClick={() => setVista({ tipo: 'jugadora', id: j.id })}>
              <span className="dorsal" aria-hidden>{j.numero || '–'}</span>
              <span className="datos">
                <b>{j.nombre || 'Sin nombre'}</b>
                <span className="meta">{j.posicion || 'Sin posición'}</span>
              </span>
              {j.lesion && <span className="et mal">lesión</span>}
              {(j.fuertes || j.mejorar) && (
                <span className="etiquetas">
                  {j.fuertes && <span className="et bien">{j.fuertes.split(/[,\n.;]/)[0].trim()}</span>}
                  {j.mejorar && <span className="et mal">{j.mejorar.split(/[,\n.;]/)[0].trim()}</span>}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      <div className="dos-botones">
        <button className="principal" onClick={() => { const j = nuevaJugadora(equipo.id); setD(guardarJugadora(d, j)); setVista({ tipo: 'jugadora', id: j.id }); }}>＋ Jugadora</button>
        <button className="secundario" onClick={() => setVista({ tipo: 'importar' })}>Importar PDF o lista</button>
      </div>
      <div className="nuevo-equipo">
        <label className="campo-diario">
          <span>Otro equipo</span>
          <input value={nombre} maxLength={40} placeholder="Infantil, Mini…" onChange={(ev) => setNombre(ev.target.value)} onKeyDown={(ev) => ev.key === 'Enter' && crearEquipo()} />
        </label>
        <button className="secundario" disabled={!nombre.trim()} onClick={crearEquipo}>Añadir equipo</button>
      </div>
    </section>
  );
}
