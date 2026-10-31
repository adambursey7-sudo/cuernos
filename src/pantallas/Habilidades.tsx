// Habilidades del equipo (vuelta 5 del loop Diario, opción A de los bocetos): «Nuestras virtudes» y «A trabajar»,
// y dentro de cada habilidad su estado, cómo se entrena y los ejercicios y jugadas de la biblioteca que la trabajan.
import { useState } from 'react';
import type { Equipo } from '../diario/diario';
import { ejerciciosDeHabilidad, loMasFlojo, sesionDeLoFlojo, sistemasDeHabilidad } from '../habilidades/biblioteca';
import { esSenior } from '../diario/tipo';
import { categoriaDeEquipo, guardarFiltroEdad, leerFiltroEdad, porEdad, tocaPriorizar } from '../habilidades/edad';
import { Radar } from './Radar';
import {
  CATALOGO, ESTADOS, alternarEtiqueta, etiquetasDe, guardarEtiquetas, leerEtiquetas, nombreDeHabilidad, nuevaHabilidad, type Estado, type HabilidadEquipo,
} from '../habilidades/habilidades';
import { bloqueDe, guardarSesiones, leerSesiones } from '../sesiones/sesiones';
import type { Ejercicio } from '../ejercicios/ejercicios';

const sinLista = (hs: HabilidadEquipo[]) => CATALOGO.filter((c) => !hs.some((h) => h.id === c.id));

/** Elegir ejercicios y meterlos al final de una sesión (un toque por sesión, como en las fichas). */
function AnadirVarios({ ejercicios }: { ejercicios: Ejercicio[] }) {
  const [abierto, setAbierto] = useState(false);
  const [marcados, setMarcados] = useState<string[]>(() => ejercicios.map((e) => e.id));
  const [aviso, setAviso] = useState('');
  const sesiones = abierto ? leerSesiones() : [];
  const elegidos = ejercicios.filter((e) => marcados.includes(e.id));

  const poner = (id: string) => {
    const todas = leerSesiones();
    const s = todas.find((x) => x.id === id);
    const nuevas = todas.map((x) => (x.id === id ? { ...x, bloques: [...x.bloques, ...elegidos.map((e) => bloqueDe(e.id, e.minutos, e.tipo))] } : x));
    setAviso(guardarSesiones(nuevas) ? `Añadidos ${elegidos.length} a «${s?.nombre ?? 'la sesión'}».` : 'El móvil no deja guardar: libera espacio e inténtalo otra vez.');
    setAbierto(false);
  };

  if (ejercicios.length === 0) return null;
  return (
    <div>
      <button className="secundario ancho" onClick={() => { setAviso(''); setAbierto(!abierto); }} aria-expanded={abierto}>Añadir a una sesión</button>
      {abierto && (
        <>
          <p className="meta">Ejercicios a meter</p>
          <ul className="lista">
            {ejercicios.map((e) => (
              <li key={e.id}>
                <label className="hab-fila">
                  <input type="checkbox" checked={marcados.includes(e.id)} onChange={(ev) => setMarcados(ev.target.checked ? [...marcados, e.id] : marcados.filter((x) => x !== e.id))} />
                  <span className="rec-texto">{e.formato} {e.nombre}</span>
                </label>
              </li>
            ))}
          </ul>
          <p className="meta">¿A qué sesión?</p>
          {sesiones.length === 0 ? (
            <p className="vacio">Aún no tienes sesiones. Crea una en la pestaña Sesiones y vuelve.</p>
          ) : (
            <ul className="lista">
              {sesiones.map((s) => (
                <li key={s.id}><button className="hab-fila" disabled={elegidos.length === 0} onClick={() => poner(s.id)}><span className="rec-texto">{s.nombre}</span><span className="chip pequeno">{s.equipo}</span></button></li>
              ))}
            </ul>
          )}
        </>
      )}
      {aviso && <p className="aviso" role="status">{aviso}</p>}
    </div>
  );
}

function Detalle({ e, h, cambiar, quitar, volver, abrirEjercicio, abrirSistema }: {
  e: Equipo; h: HabilidadEquipo; cambiar: (e: Equipo) => void; quitar: () => void; volver: () => void;
  abrirEjercicio: (id: string) => void; abrirSistema: (id: string) => void;
}) {
  const [seguro, setSeguro] = useState(false);
  const ejercicios = ejerciciosDeHabilidad(h.id);
  const jugadas = sistemasDeHabilidad(h.id);
  const poner = (c: Partial<HabilidadEquipo>) => cambiar({ ...e, habilidades: (e.habilidades ?? []).map((x) => (x.id === h.id ? { ...x, ...c } : x)) });
  return (
    <section className="pantalla ficha-jugadora">
      <div className="cabecera">
        <button className="atras" onClick={volver} aria-label="Volver a las habilidades">‹</button>
        <h2 className="nombre-sistema">{h.nombre}</h2>
      </div>
      <div className="niveles filtro" role="group" aria-label="Estado de la habilidad">
        {ESTADOS.map((s) => <button key={s.id} className={h.estado === s.id ? `chip on estado-${s.id}` : 'chip'} aria-pressed={h.estado === s.id} onClick={() => poner({ estado: s.id })}>{s.nombre}</button>)}
      </div>
      <div className="niveles filtro" role="group" aria-label="Nivel de 1 a 5">
        <span className="meta">Nivel</span>
        {[1, 2, 3, 4, 5].map((n) => <button key={n} className={h.nivel === n ? 'chip on' : 'chip'} aria-pressed={h.nivel === n} onClick={() => poner({ nivel: h.nivel === n ? undefined : n })}>{n}</button>)}
      </div>
      <label className="campo-diario">
        <span>Cómo la entrenamos</span>
        <textarea value={h.como} rows={4} onChange={(ev) => poner({ como: ev.target.value })} placeholder="Qué ejercicios, cuánto y cuándo" />
      </label>
      <h3 className="sub">Ejercicios</h3>
      {ejercicios.length === 0 && <p className="vacio">Aún no hay ejercicios con esta etiqueta. Etiquétalos desde el ejercicio.</p>}
      <ul className="lista">
        {ejercicios.map((x) => <li key={x.id}><button className="hab-fila" onClick={() => abrirEjercicio(x.id)}><span className="rec-texto">{x.formato} {x.nombre}</span><span className="chip pequeno">ejercicio</span></button></li>)}
      </ul>
      {jugadas.length > 0 && (
        <>
          <h3 className="sub">Jugadas</h3>
          <ul className="lista">
            {jugadas.map((s) => <li key={s.id}><button className="hab-fila" onClick={() => abrirSistema(s.id)}><span className="rec-texto">{s.nombre}</span><span className="chip pequeno">jugada</span></button></li>)}
          </ul>
        </>
      )}
      <AnadirVarios key={ejercicios.map((x) => x.id).join()} ejercicios={ejercicios} />
      <div className="peligro">
        {seguro ? (
          <>
            <button className="chip" onClick={() => setSeguro(false)}>No quitar</button>
            <button className="chip on" onClick={quitar}>Sí, quitar la habilidad</button>
          </>
        ) : (
          <button className="chip" onClick={() => setSeguro(true)}>Quitar habilidad</button>
        )}
      </div>
    </section>
  );
}

export function Habilidades({ e, cambiar, abrirEjercicio, abrirSistema, abrirSesion }: {
  e: Equipo; cambiar: (e: Equipo) => void; abrirEjercicio: (id: string) => void; abrirSistema: (id: string) => void; abrirSesion: (id: string) => void;
}) {
  const hs = e.habilidades ?? [];
  const [abierta, setAbierta] = useState<string | null>(null);
  const [todas, setTodas] = useState(false);
  const [nueva, setNueva] = useState('');
  const [aviso, setAviso] = useState('');
  const [filtroEdad, setFiltroEdad] = useState(leerFiltroEdad);
  const categoria = categoriaDeEquipo(e.nombre);
  const poner = (habilidades: HabilidadEquipo[]) => cambiar({ ...e, habilidades });
  const alternarFiltro = () => { guardarFiltroEdad(!filtroEdad); setFiltroEdad(!filtroEdad); };
  const h = hs.find((x) => x.id === abierta);

  if (h)
    return (
      <Detalle e={e} h={h} cambiar={cambiar} volver={() => setAbierta(null)} abrirEjercicio={abrirEjercicio} abrirSistema={abrirSistema}
        quitar={() => { poner(hs.filter((x) => x.id !== h.id)); setAbierta(null); }} />
    );

  const anadirCatalogo = (id: string) => { const c = CATALOGO.find((x) => x.id === id); if (c) poner([...hs, nuevaHabilidad(c.nombre, c.id)]); };
  const anadirPropia = () => { if (!nueva.trim()) return; poner([...hs, nuevaHabilidad(nueva)]); setNueva(''); };
  const grupo = (estado: Estado) => hs.filter((x) => x.estado === estado);
  const fila = (x: HabilidadEquipo) => {
    const n = ejerciciosDeHabilidad(x.id).length;
    return (
      <li key={x.id}>
        <button className="hab-fila" onClick={() => setAbierta(x.id)}>
          <span className="rec-texto">{x.nombre}{tocaPriorizar(categoria, x.id) && <span title={`Toca priorizar en ${categoria?.nombre}`} aria-label={`Toca priorizar en ${categoria?.nombre}`}> ★</span>}</span>
          <span className={`chip pequeno estado-${x.estado}`}>{n} {n === 1 ? 'ejercicio' : 'ejercicios'}</span>
        </button>
      </li>
    );
  };
  const normales = grupo('normal');
  const { flojos: flojas, quitadas } = porEdad(loMasFlojo(hs), categoria, filtroEdad);
  const montar = () => {
    const sesion = sesionDeLoFlojo(e.nombre, flojas);
    if (!sesion) return;
    if (guardarSesiones([...leerSesiones(), sesion])) abrirSesion(sesion.id);
    else setAviso('El móvil no deja guardar: libera espacio e inténtalo otra vez.');
  };

  return (
    <div className="habilidades">
      {categoria ? (
        <div className="guia-edad">
          <p className="meta">{categoria.nombre}: toca priorizar {categoria.prioridad.map((id) => nombreDeHabilidad(hs, id)).join(', ')} (★).</p>
          {categoria.masAdelante.length > 0 && (
            <button className="chip" aria-pressed={filtroEdad} onClick={alternarFiltro}>{filtroEdad ? '✓ ' : ''}Dejar fuera de las sesiones lo que viene más adelante</button>
          )}
          {quitadas.length > 0 && <p className="meta">Fuera por edad: {quitadas.join(', ')}.</p>}
        </div>
      ) : (
        <p className="meta">{esSenior(e) ? 'En un equipo senior la guía por edad no se aplica: las habilidades se ordenan por lo que toca trabajar.' : 'Si pones la categoría en el nombre del equipo (Premini, Mini, Infantil, Cadete, Júnior), aquí aparece qué toca priorizar a esa edad.'}</p>
      )}
      {flojas.length > 0 && (
        <div className="lo-flojo">
          <h2 className="sub">Para esta semana</h2>
          <ul className="lista">
            {flojas.map(({ h: x, ejercicios }) => <li key={x.id}><button className="hab-fila" onClick={() => setAbierta(x.id)}><span className="rec-texto">{x.nombre}</span><span className="chip pequeno estado-trabajar">{ejercicios.length} {ejercicios.length === 1 ? 'ejercicio' : 'ejercicios'}</span></button></li>)}
          </ul>
          <button className="principal ancho" disabled={flojas.every((f) => f.ejercicios.length === 0)} onClick={montar}>Montar sesión con esto</button>
          {aviso && <p className="aviso" role="status">{aviso}</p>}
        </div>
      )}
      <h2 className="sub">Nuestras virtudes</h2>
      {grupo('fuerte').length === 0 ? <p className="vacio">Marca como «Fuerte» lo que tu equipo hace bien.</p> : <ul className="lista">{grupo('fuerte').map(fila)}</ul>}
      <h2 className="sub">A trabajar</h2>
      {grupo('trabajar').length === 0 ? <p className="vacio">Marca como «A trabajar» lo que le falta.</p> : <ul className="lista">{grupo('trabajar').map(fila)}</ul>}
      {normales.length > 0 && (
        <>
          <button className="secundario" onClick={() => setTodas(!todas)} aria-expanded={todas}>{todas ? 'Ocultar las normales' : `Ver las normales (${normales.length})`}</button>
          {todas && <ul className="lista">{normales.map(fila)}</ul>}
        </>
      )}
      {hs.some((x) => x.nivel !== undefined) && (<><h2 className="sub">Radar del equipo</h2><Radar habilidades={hs} /></>)}
      {hs.length === 0 && <p className="vacio">Empieza con la lista de partida (12 habilidades de base) y marca cuáles son fuertes y cuáles hay que trabajar.</p>}
      {sinLista(hs).length > 0 && (
        <>
          <h3 className="sub">Añadir</h3>
          <div className="niveles filtro envuelto" role="group" aria-label="Añadir habilidad">
            {sinLista(hs).map((c) => <button key={c.id} className="chip" onClick={() => anadirCatalogo(c.id)}>＋ {c.nombre}</button>)}
          </div>
        </>
      )}
      <label className="campo-diario">
        <span>Otra habilidad</span>
        <input value={nueva} maxLength={40} placeholder="Defensa del pick & roll…" onChange={(ev) => setNueva(ev.target.value)} onKeyDown={(ev) => ev.key === 'Enter' && anadirPropia()} />
      </label>
      <button className="secundario" disabled={!nueva.trim()} onClick={anadirPropia}>Añadir habilidad</button>
    </div>
  );
}

/** En un ejercicio o jugada: a qué habilidades ayuda (se cambian con un toque) y si el equipo las necesita. */
export function EtiquetasHabilidad({ id, texto, habilidades }: { id: string; texto: string; habilidades: HabilidadEquipo[] }) {
  const [manuales, setManuales] = useState(leerEtiquetas);
  const activas = etiquetasDe(id, texto, manuales);
  const opciones = [...CATALOGO.map((c) => ({ id: c.id, nombre: c.nombre })), ...habilidades.filter((h) => !CATALOGO.some((c) => c.id === h.id)).map((h) => ({ id: h.id, nombre: h.nombre }))];
  const alternar = (hab: string) => { const n = alternarEtiqueta(id, texto, hab, manuales); if (guardarEtiquetas(n)) setManuales(n); };
  const estadoDe = (hab: string) => habilidades.find((h) => h.id === hab)?.estado;
  const necesarias = activas.filter((a) => estadoDe(a) === 'trabajar');
  return (
    <div className="etiquetas-habilidad">
      <h3 className="sub">Habilidades que trabaja</h3>
      <div className="niveles filtro envuelto" role="group" aria-label="Habilidades que trabaja">
        {opciones.map((o) => <button key={o.id} className={activas.includes(o.id) ? 'chip on' : 'chip'} aria-pressed={activas.includes(o.id)} onClick={() => alternar(o.id)}>{o.nombre}</button>)}
      </div>
      {necesarias.length > 0 && <p className="meta">Tu equipo necesita trabajar: <b>{necesarias.map((n) => opciones.find((o) => o.id === n)?.nombre ?? n).join(', ')}</b>.</p>}
    </div>
  );
}
