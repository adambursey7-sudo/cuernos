// Partes de la ficha del equipo que salen del «equipo completo»: género y categoría, color y escudo, cuerpo técnico,
// objetivos y las acciones sobre el equipo entero (copiar de otro, duplicar, cerrar la temporada, copia de seguridad).
import { useState } from 'react';
import { armarCopia, recortarAEquipo } from '../copia';
import { hoy, type Diario, type Equipo } from '../diario/diario';
import { guardarSesiones, leerSesiones } from '../sesiones/sesiones';
import { guardarTemporadas, leerTemporadas, type Temporada } from '../temporada/temporada';
import { leerReflexiones } from '../diario/reflexion';
import { leerColores } from '../temas';
import { anotarCopia } from '../copiaFecha';
import { EscudoEquipo } from './EscudoEquipo';
import { HEREDAR_TODO, cerrarTemporada, duplicarEquipo, equipoSiguienteTemporada, heredarDe, resumenArchivada, type QueHeredar } from './equipos';
import { FORMAS_ESCUDO, PAPELES, esPapel, escudoPorDefecto, letrasDe, type Genero } from './modelo';

const COLORES = ['#f2b134', '#e5483b', '#2f7de1', '#2fa866', '#8a4fd6', '#f2f2f2'];
const nuevoId = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** Femenino o masculino, categoría, color y escudo. */
export function IdentidadEquipo({ e, cambiar }: { e: Equipo; cambiar: (e: Equipo) => void }) {
  const escudo = e.escudo ?? escudoPorDefecto(e.nombre);
  const genero: Genero = e.genero ?? (e.tipo === 'senior' ? 'm' : 'f');
  return (
    <div className="bloque-equipo">
      <div className="cabecera-equipo">
        <EscudoEquipo nombre={e.nombre} escudo={e.escudo} color={e.color} tam={56} />
        <div>
          <div className="nombre">{e.nombre}</div>
          <span className="meta">{[e.categoria, e.temporada].filter(Boolean).join(' · ') || 'Sin categoría'}</span>
        </div>
      </div>
      <div className="niveles filtro" role="group" aria-label="Femenino o masculino">
        {([['f', 'Femenino'], ['m', 'Masculino']] as const).map(([id, n]) => <button key={id} className={genero === id ? 'chip on' : 'chip'} aria-pressed={genero === id} onClick={() => cambiar({ ...e, genero: id })}>{n}</button>)}
      </div>
      <label className="campo-diario">
        <span>Categoría</span>
        <input value={e.categoria ?? ''} maxLength={30} placeholder="Cadete, Senior A…" onChange={(ev) => { const { categoria: _c, ...resto } = e; cambiar(ev.target.value ? { ...resto, categoria: ev.target.value } : resto); }} />
      </label>
      <label className="campo-diario">
        <span>Temporada</span>
        <input value={e.temporada ?? ''} maxLength={12} placeholder="2026-27" onChange={(ev) => { const { temporada: _t, ...resto } = e; cambiar(ev.target.value ? { ...resto, temporada: ev.target.value } : resto); }} />
      </label>
      <div className="niveles filtro" role="group" aria-label="Color del equipo">
        {COLORES.map((c) => <button key={c} className={e.color === c ? 'chip on' : 'chip'} aria-pressed={e.color === c} aria-label={`Color ${c}`} onClick={() => cambiar({ ...e, color: c })} style={{ background: c, minWidth: 44, minHeight: 44 }} />)}
        <input type="color" value={e.color ?? '#f2b134'} aria-label="Otro color" onChange={(ev) => cambiar({ ...e, color: ev.target.value })} />
      </div>
      <div className="niveles filtro" role="group" aria-label="Forma del escudo">
        {FORMAS_ESCUDO.map(([id, n]) => <button key={id} className={escudo.forma === id ? 'chip on' : 'chip'} aria-pressed={escudo.forma === id} onClick={() => cambiar({ ...e, escudo: { ...escudo, forma: id } })}>{n}</button>)}
      </div>
      <label className="campo-diario">
        <span>Letras del escudo (hasta 3)</span>
        <input value={escudo.letras} maxLength={3} placeholder={letrasDe(e.nombre)} onChange={(ev) => cambiar({ ...e, escudo: { ...escudo, letras: ev.target.value.toUpperCase() } })} />
      </label>
    </div>
  );
}

/** Entrenador, ayudante, delegado, fisio… Datos de adultos: solo en el móvil y en la copia. */
export function CuerpoTecnico({ e, cambiar }: { e: Equipo; cambiar: (e: Equipo) => void }) {
  const staff = e.staff ?? [];
  const poner = (l: NonNullable<Equipo['staff']>) => { const { staff: _s, ...resto } = e; cambiar(l.length ? { ...resto, staff: l } : resto); };
  return (
    <div className="bloque-equipo">
      <h2 className="sub">Cuerpo técnico</h2>
      {staff.length === 0 && <p className="meta">Entrenador, ayudante, delegado, fisio… Apúntalos para tener su teléfono a mano.</p>}
      {staff.map((s) => (
        <div key={s.id} className="fila-staff">
          <input value={s.nombre} maxLength={40} aria-label="Nombre" placeholder="Nombre" onChange={(ev) => poner(staff.map((x) => (x.id === s.id ? { ...x, nombre: ev.target.value } : x)))} />
          <button className="chip" aria-label={`Quitar a ${s.nombre || 'esta persona'}`} onClick={() => poner(staff.filter((x) => x.id !== s.id))}>✕</button>
          <input value={s.contacto ?? ''} maxLength={60} aria-label="Teléfono o correo" placeholder="Teléfono o correo" inputMode="tel" onChange={(ev) => poner(staff.map((x) => (x.id === s.id ? { ...x, contacto: ev.target.value || undefined } : x)))} />
          <div className="papel" role="group" aria-label="Papel">
            {PAPELES.map(([id, n]) => <button key={id} className={s.papel === id ? 'chip on pequeno' : 'chip pequeno'} aria-pressed={s.papel === id} onClick={() => esPapel(id) && poner(staff.map((x) => (x.id === s.id ? { ...x, papel: id } : x)))}>{n}</button>)}
          </div>
        </div>
      ))}
      {staff.length < 12 && <button className="secundario" onClick={() => poner([...staff, { id: nuevoId('s'), nombre: '', papel: staff.length === 0 ? 'entrenador' : 'ayudante' }])}>＋ Persona del cuerpo técnico</button>}
    </div>
  );
}

/** Objetivos del equipo para la temporada, con casilla de cumplido. */
export function Objetivos({ e, cambiar }: { e: Equipo; cambiar: (e: Equipo) => void }) {
  const lista = e.objetivos ?? [];
  const [texto, setTexto] = useState('');
  const poner = (l: NonNullable<Equipo['objetivos']>) => { const { objetivos: _o, ...resto } = e; cambiar(l.length ? { ...resto, objetivos: l } : resto); };
  const añadir = () => { if (texto.trim() && lista.length < 20) { poner([...lista, { id: nuevoId('o'), texto: texto.trim().slice(0, 120) }]); setTexto(''); } };
  return (
    <div className="bloque-equipo">
      <h2 className="sub">Objetivos de la temporada{lista.length ? ` · ${lista.filter((o) => o.hecho).length}/${lista.length}` : ''}</h2>
      {lista.map((o) => (
        <label key={o.id} className={o.hecho ? 'objetivo hecho' : 'objetivo'}>
          <input type="checkbox" checked={!!o.hecho} onChange={(ev) => poner(lista.map((x) => (x.id === o.id ? { ...x, hecho: ev.target.checked || undefined } : x)))} />
          <span>{o.texto}</span>
          <button className="chip pequeno" aria-label={`Quitar el objetivo ${o.texto}`} onClick={(ev) => { ev.preventDefault(); poner(lista.filter((x) => x.id !== o.id)); }}>✕</button>
        </label>
      ))}
      <div className="fila-staff">
        <input value={texto} maxLength={120} placeholder="Ejemplo: defender sin faltas tontas" aria-label="Objetivo nuevo" onChange={(ev) => setTexto(ev.target.value)} onKeyDown={(ev) => ev.key === 'Enter' && añadir()} />
        <button className="secundario" disabled={!texto.trim()} onClick={añadir}>Añadir</button>
      </div>
    </div>
  );
}

const ROTULOS: [keyof QueHeredar, string][] = [['horarios', 'Horarios de entreno'], ['sesiones', 'Sesiones'], ['reglas', 'Reglas de competición'], ['forma', 'Forma de jugar y habilidades'], ['objetivos', 'Objetivos']];

/** Acciones sobre el equipo entero. `cambiado` avisa a la pantalla para que vuelva a leer lo guardado. */
export function AccionesEquipo({ d, e, aplicar, elegir, cambiado }: { d: Diario; e: Equipo; aplicar: (d: Diario) => void; elegir: (id: string) => void; cambiado: () => void }) {
  const [aviso, setAviso] = useState('');
  const [heredando, setHeredando] = useState(false);
  const [de, setDe] = useState('');
  const [que, setQue] = useState<QueHeredar>(HEREDAR_TODO);
  const [cerrando, setCerrando] = useState(false);
  const otros = d.equipos.filter((x) => x.id !== e.id);
  const t = leerTemporadas().find((x) => x.equipoId === e.id);
  const guardado = (ok: boolean, bien: string) => setAviso(ok ? bien : 'El móvil no deja guardar: libera espacio e inténtalo otra vez.');

  const duplicar = () => {
    const r = duplicarEquipo(d, leerTemporadas(), leerSesiones(), e.id);
    if (!r) return;
    const ok = guardarSesiones([...leerSesiones(), ...r.sesiones]) && (!r.temporada || guardarTemporadas([...leerTemporadas(), r.temporada]));
    aplicar({ equipos: [...d.equipos, r.equipo], jugadoras: [...d.jugadoras, ...r.jugadoras] });
    guardado(ok, `Equipo copiado como «${r.equipo.nombre}», con su plantilla, horarios y sesiones.`);
    elegir(r.equipo.id);
  };

  const heredar = () => {
    const r = heredarDe(d, leerTemporadas(), leerSesiones(), de, e.id, que);
    if (!r) return;
    const ok = guardarSesiones(r.sesiones) && guardarTemporadas(r.temporadas);
    aplicar(r.diario);
    setHeredando(false);
    guardado(ok, 'Hecho. No he tocado lo que ya tenías escrito.');
    cambiado();
  };

  const cerrar = () => {
    if (!t) return;
    const etiqueta = e.temporada ?? '';
    const todas = leerTemporadas().map((x) => (x.equipoId === e.id ? cerrarTemporada(x, etiqueta) : x));
    const ok = guardarTemporadas(todas);
    aplicar({ ...d, equipos: d.equipos.map((x) => (x.id === e.id ? equipoSiguienteTemporada(x) : x)) });
    setCerrando(false);
    guardado(ok, 'Temporada cerrada y guardada en el historial. Empieza la siguiente con la misma plantilla y los mismos horarios.');
    cambiado();
  };

  const copiaEquipo = async () => {
    const todo = { diario: d, temporadas: leerTemporadas(), sesiones: leerSesiones(), reflexiones: leerReflexiones() };
    const solo = recortarAEquipo(e.id, todo);
    if (!solo) return;
    const nombre = `horns-${e.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'equipo'}-${hoy()}.json`;
    const archivo = new File([armarCopia([], leerColores(), solo.diario, solo.temporadas, [], [], false, undefined, solo.reflexiones, { sesiones: solo.sesiones })], nombre, { type: 'application/json' });
    if (navigator.canShare?.({ files: [archivo] })) {
      try {
        await navigator.share({ files: [archivo], title: `Copia de ${e.nombre}` });
        anotarCopia();
        setAviso('Copia de este equipo guardada. Se carga desde Más → Cargar copia.');
      } catch { /* cerró el menú sin guardar */ }
      return;
    }
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(archivo);
    enlace.download = nombre;
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(enlace.href), 60_000);
    anotarCopia();
    setAviso('Copia de este equipo descargada. Se carga desde Más → Cargar copia.');
  };

  return (
    <div className="bloque-equipo">
      <h2 className="sub">Este equipo entero</h2>
      {aviso && <p className="aviso-copia" role="status">{aviso}</p>}
      <div className="dos-botones">
        <button className="secundario" onClick={duplicar}>Duplicar equipo</button>
        <button className="secundario" onClick={() => void copiaEquipo()}>Copia de este equipo</button>
      </div>
      {otros.length > 0 && (
        <>
          <button className="secundario" onClick={() => { setHeredando(!heredando); setDe(otros[0].id); }}>Copiar lo de otro equipo</button>
          {heredando && (
            <div className="bloque-equipo">
              <label className="campo-diario">
                <span>Traer de</span>
                <select value={de} onChange={(ev) => setDe(ev.target.value)}>{otros.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}</select>
              </label>
              {ROTULOS.map(([k, n]) => (
                <label key={k} className="objetivo"><input type="checkbox" checked={que[k]} onChange={(ev) => setQue({ ...que, [k]: ev.target.checked })} /><span>{n}</span></label>
              ))}
              <p className="meta">No se copian ni jugadores ni partidos. Lo que ya tienes escrito se queda como está.</p>
              <button className="principal" disabled={!de} onClick={heredar}>Copiar a {e.nombre}</button>
            </div>
          )}
        </>
      )}
      {t && (
        <>
          <button className="secundario" onClick={() => setCerrando(!cerrando)}>Cerrar la temporada y empezar la siguiente</button>
          {cerrando && (
            <div className="bloque-equipo">
              <p className="meta">Lo jugado y la asistencia pasan al historial. Se queda la plantilla y los horarios, un año después; los partidos y la rotación empiezan vacíos.</p>
              <button className="principal" onClick={cerrar}>Sí, cerrar la temporada{e.temporada ? ` ${e.temporada}` : ''}</button>
            </div>
          )}
          <Historial t={t} />
        </>
      )}
    </div>
  );
}

function Historial({ t }: { t: Temporada }) {
  if (!t.anteriores?.length) return null;
  return (
    <div>
      <h3 className="sub">Temporadas anteriores</h3>
      <ul className="lista">{t.anteriores.map((a) => <li key={a.etiqueta + a.inicio} className="meta">{resumenArchivada(a)}</li>)}</ul>
    </div>
  );
}

