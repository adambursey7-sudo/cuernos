// Mis ejercicios: lista, ficha leída (como la C de los bocetos) y editor por pasos cortos con el vídeo a mano (la B, elegida por Adam).
import { useState } from 'react';
import { NIVELES } from '../sistemas/tipos';
import { buscarSistema, todosLosSistemas } from '../sistemas/almacen';
import { MiniPizarra } from '../pizarra/MiniPizarra';
import { PizarraGrande } from '../pizarra/PizarraGrande';
import { CATEGORIAS, fichaCompleta, guardarFichas, leerFichas, nuevaFicha, pasosDe, type Ficha } from '../recursos/fichas';
import { leerRecursos } from '../recursos/recursos';
import { coleccionesDe, etiquetasDeTexto, filtrarOrganizables, type Filtro } from '../recursos/organizar';
import { BarraFiltro, CampoColeccion, Estrella, FILTRO_VACIO } from './Organizar';
import { AnadirASesion } from './AnadirASesion';
import { enviarTexto, textoColeccion, textoFicha } from '../recursos/compartirTexto';

const AVISO_ENVIO = { enviado: '', copiado: 'Texto copiado. Pégalo donde quieras.', nada: '' } as const;

/** La pizarra de una ficha, si la tiene y todavía existe. */
const pizarraDe = (f: Ficha) => (f.sistemaId ? buscarSistema(f.sistemaId) : undefined);

const PASOS = ['Básico', 'Cómo se juega', 'Coaching', 'Extras'] as const;

export function MisFichas({ nueva, alTerminar }: { nueva?: Ficha; alTerminar?: (f: Ficha) => void }) {
  const [lista, setLista] = useState(leerFichas);
  const [edicion, setEdicion] = useState<Ficha | undefined>(nueva);
  const [abierta, setAbierta] = useState<string | null>(null);
  const [aviso, setAviso] = useState('');
  const [filtro, setFiltro] = useState<Filtro>(FILTRO_VACIO);
  const compartirColeccion = async (nombre: string) => setAviso(AVISO_ENVIO[await enviarTexto(textoColeccion(nombre, lista.filter((x) => x.coleccion === nombre)))]);

  const poner = (n: Ficha[]) => {
    if (guardarFichas(n)) { setLista(n); setAviso(''); return true; }
    setAviso('El móvil no deja guardar: libera espacio e inténtalo otra vez.');
    return false;
  };

  if (edicion) {
    return (
      <Editor
        f={edicion}
        colecciones={coleccionesDe(lista)}
        cancelar={() => setEdicion(undefined)}
        guardar={(f) => {
          const existe = lista.some((x) => x.id === f.id);
          if (!poner(existe ? lista.map((x) => (x.id === f.id ? f : x)) : [f, ...lista])) return;
          setEdicion(undefined);
          setAbierta(f.id);
          alTerminar?.(f);
        }}
      />
    );
  }
  const f = lista.find((x) => x.id === abierta);
  if (f) return <Lectura f={f} cambiar={(n) => poner(lista.map((x) => (x.id === n.id ? n : x)))} volver={() => setAbierta(null)} editar={() => setEdicion(f)} borrar={() => { poner(lista.filter((x) => x.id !== f.id)); setAbierta(null); }} />;

  return (
    <>
      <button className="principal ancho" onClick={() => setEdicion(nuevaFicha())}>Nuevo ejercicio</button>
      {lista.length > 0 && <BarraFiltro lista={lista} filtro={filtro} cambiar={setFiltro} />}
      {filtro.coleccion && <button className="secundario ancho" onClick={() => compartirColeccion(filtro.coleccion!)}>Compartir «{filtro.coleccion}» como texto</button>}
      {aviso && <p className="aviso" role="status">{aviso}</p>}
      {lista.length === 0 ? (
        <p className="vacio">Aquí estarán tus ejercicios. Crea uno desde cero o abre un recurso guardado y toca «Convertir en ejercicio».</p>
      ) : (
        <ul className="lista">
          {filtrarOrganizables(lista, filtro, (x) => [x.nombre, x.objetivo, x.categoria, x.consejos, x.variantes, ...x.pasos]).map((x) => (
            <li key={x.id}>
              <button className={pizarraDe(x) ? 'rec-fila fi-fila con-mini' : 'rec-fila fi-fila'} onClick={() => setAbierta(x.id)}>
                {pizarraDe(x) && <MiniPizarra sistema={pizarraDe(x)!} className="mini fi-mini" />}
                <span className="texto-ejercicio">{x.favorita ? '★ ' : ''}{x.nombre}</span>
                <span className="meta">{[x.coleccion, x.categoria, x.minutos ? `${x.minutos}′` : '', x.jugadoras].filter(Boolean).join(' · ')}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Editor({ f: inicial, colecciones, cancelar, guardar }: { f: Ficha; colecciones: string[]; cancelar: () => void; guardar: (f: Ficha) => void }) {
  const [f, setF] = useState(inicial);
  const [paso, setPaso] = useState(0);
  const [error, setError] = useState('');
  const poner = (c: Partial<Ficha>) => setF({ ...f, ...c });
  const recurso = f.recursoId ? leerRecursos().find((r) => r.id === f.recursoId) : undefined;
  const campo = (id: string, etiqueta: string, valor: string, cambiar: (v: string) => void, filas = 0, max = 3000) => (
    <label className="campo-diario">
      <span>{etiqueta}</span>
      {filas ? <textarea id={id} rows={filas} value={valor} maxLength={max} onChange={(e) => cambiar(e.target.value)} /> : <input id={id} value={valor} maxLength={max} onChange={(e) => cambiar(e.target.value)} />}
    </label>
  );

  const siguiente = () => {
    if (paso === 0 && !f.nombre.trim()) return setError('Ponle un nombre al ejercicio.');
    setError('');
    if (paso < PASOS.length - 1) return setPaso(paso + 1);
    if (!fichaCompleta(f)) return setError('Ponle un nombre al ejercicio.');
    guardar({ ...f, pasos: f.pasos.length ? f.pasos : [''] });
  };

  return (
    <section className="pantalla">
      <div className="cabecera">
        <button className="atras" onClick={cancelar} aria-label="Cancelar">‹</button>
        <h1 className="nombre-sistema">Ejercicio · paso {paso + 1} de {PASOS.length}</h1>
      </div>
      <div className="niveles filtro" role="group" aria-label="Pasos">
        {PASOS.map((n, i) => <button key={n} className={i === paso ? 'chip on' : 'chip'} aria-pressed={i === paso} onClick={() => setPaso(i)}>{n}</button>)}
      </div>
      {f.fuente && (
        <a className="rec-enlace" href={f.fuente} target="_blank" rel="noopener noreferrer">{recurso?.origen === 'youtube' ? 'Ver el vídeo original ↗' : 'Abrir la fuente ↗'}</a>
      )}

      {paso === 0 && (
        <>
          {campo('fi-nombre', 'Nombre', f.nombre, (nombre) => poner({ nombre }), 0, 200)}
          {campo('fi-objetivo', 'Objetivo', f.objetivo, (objetivo) => poner({ objetivo }), 2)}
          <div className="niveles filtro" role="group" aria-label="Categoría">
            {CATEGORIAS.map((c) => <button key={c} className={f.categoria === c ? 'chip on' : 'chip'} aria-pressed={f.categoria === c} onClick={() => poner({ categoria: f.categoria === c ? '' : c })}>{c}</button>)}
          </div>
          <div className="niveles filtro" role="group" aria-label="Nivel">
            {NIVELES.map((n) => <button key={n.id} className={f.nivel === n.id ? 'chip on' : 'chip'} aria-pressed={f.nivel === n.id} onClick={() => poner({ nivel: f.nivel === n.id ? '' : n.id })}>{n.nombre}</button>)}
          </div>
          {campo('fi-edad', 'Edad', f.edad, (edad) => poner({ edad }), 0, 60)}
        </>
      )}

      {paso === 1 && (
        <>
          {campo('fi-jug', 'Número de jugadoras', f.jugadoras, (jugadoras) => poner({ jugadoras }), 0, 60)}
          {campo('fi-mat', 'Material', f.material, (material) => poner({ material }), 0, 300)}
          {campo('fi-esp', 'Espacio', f.espacio, (espacio) => poner({ espacio }), 0, 100)}
          <label className="campo-diario"><span>Duración (minutos)</span><input id="fi-min" type="number" inputMode="numeric" min={1} max={120} value={f.minutos} onChange={(e) => poner({ minutos: Number(e.target.value) || 0 })} /></label>
          <h2 className="sub">Cómo se juega</h2>
          {f.pasos.map((p, i) => (
            <label key={i} className="campo-diario">
              <span>{i + 1}.</span>
              <textarea id={`fi-paso-${i}`} rows={2} value={p} maxLength={500} onChange={(e) => poner({ pasos: f.pasos.map((x, j) => (j === i ? e.target.value : x)) })} />
            </label>
          ))}
          <div className="rec-acciones">
            <button className="secundario" onClick={() => poner({ pasos: [...f.pasos, ''] })}>+ Añadir paso</button>
            {f.pasos.length > 1 && <button className="secundario" onClick={() => poner({ pasos: f.pasos.slice(0, -1) })}>Quitar el último</button>}
          </div>
        </>
      )}

      {paso === 2 && (
        <>
          {campo('fi-cons', 'Consejos de coaching', f.consejos, (consejos) => poner({ consejos }), 5)}
          {campo('fi-var', 'Variantes y progresión', f.variantes, (variantes) => poner({ variantes }), 5)}
        </>
      )}

      {paso === 3 && (
        <>
        <Estrella activa={f.favorita} cambiar={() => poner({ favorita: !f.favorita })} />
        <CampoColeccion valor={f.coleccion} existentes={colecciones} cambiar={(coleccion) => poner({ coleccion })} />
        <label className="campo-diario"><span>Etiquetas (separadas por comas)</span><input id="fi-etq" defaultValue={f.etiquetas.join(', ')} onBlur={(e) => poner({ etiquetas: etiquetasDeTexto(e.target.value) })} /></label>
        <label className="campo-diario">
          <span>Pizarra (opcional)</span>
          <select id="fi-sis" value={f.sistemaId ?? ''} onChange={(e) => poner({ sistemaId: e.target.value || undefined })}>
            <option value="">Sin pizarra</option>
            {todosLosSistemas().map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </label>
        </>
      )}

      {error && <p className="aviso" role="alert">{error}</p>}
      <button className="principal ancho" onClick={siguiente}>{paso === PASOS.length - 1 ? 'Guardar ejercicio' : 'Siguiente'}</button>
    </section>
  );
}

function Lectura({ f, cambiar, volver, editar, borrar }: { f: Ficha; cambiar: (f: Ficha) => void; volver: () => void; editar: () => void; borrar: () => void }) {
  const [seguro, setSeguro] = useState(false);
  const [aviso, setAviso] = useState('');
  const pasos = pasosDe(f);
  const sistema = f.sistemaId ? todosLosSistemas().find((s) => s.id === f.sistemaId) : undefined;
  const nivel = NIVELES.find((n) => n.id === f.nivel)?.nombre;
  const dato = (n: string, v: string) => v && <div className="dato"><dt>{n}</dt><dd>{v}</dd></div>;
  return (
    <section className="pantalla ficha-ejercicio">
      <div className="cabecera">
        <button className="atras" onClick={volver} aria-label="Volver">‹</button>
        <h1 className="nombre-sistema">{f.nombre}</h1>
      </div>
      <p className="meta">{[f.coleccion, f.categoria, nivel, f.edad, f.minutos ? `${f.minutos}′` : ''].filter(Boolean).join(' · ')}</p>
      {f.objetivo && <p><b>Objetivo.</b> {f.objetivo}</p>}
      <dl className="datos">
        {dato('Jugadoras', f.jugadoras)}{dato('Material', f.material)}{dato('Espacio', f.espacio)}{dato('Pizarra', sistema?.nombre ?? '')}
      </dl>
      {sistema && <PizarraGrande key={sistema.id} sistema={sistema} />}
      {pasos.length > 0 && <><h2 className="sub">Cómo se juega</h2><ol>{pasos.map((p, i) => <li key={i}>{p}</li>)}</ol></>}
      {f.consejos && <><h2 className="sub">Consejos</h2><p className="fi-texto">{f.consejos}</p></>}
      {f.variantes && <><h2 className="sub">Variantes y progresión</h2><p className="fi-texto">{f.variantes}</p></>}
      {f.fuente && <p className="meta">Fuente: <a className="rec-enlace" href={f.fuente} target="_blank" rel="noopener noreferrer">{new URL(f.fuente).hostname.replace(/^www\./, '')} ↗</a></p>}
      {f.etiquetas.length > 0 && <p className="meta">{f.etiquetas.map((e) => `#${e}`).join(' ')}</p>}
      <Estrella activa={f.favorita} cambiar={() => cambiar({ ...f, favorita: !f.favorita })} />
      <AnadirASesion f={f} />
      <button className="secundario ancho" onClick={async () => setAviso(AVISO_ENVIO[await enviarTexto(textoFicha(f))])}>Compartir como texto</button>
      {aviso && <p className="aviso" role="status">{aviso}</p>}
      <div className="rec-acciones">
        <button className="principal" onClick={editar}>Editar</button>
        {seguro ? <button className="secundario" onClick={borrar}>Sí, borrar</button> : <button className="secundario" onClick={() => setSeguro(true)}>Borrar</button>}
      </div>
    </section>
  );
}
