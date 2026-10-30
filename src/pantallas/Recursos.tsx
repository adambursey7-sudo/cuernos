// Bandeja de recursos (opción A, elegida por Adam el 30/10): lista con estado. Aquí cae todo lo que guardas de internet.
import { useState } from 'react';
import {
  ESTADOS, NOMBRE_ORIGEN, guardarRecursos, leerRecursos, nombreRecurso, nuevoRecurso, primerEnlace, tituloYoutube,
  type Estado, type Recurso,
} from '../recursos/recursos';

type Abierto = { nuevo: true; enlace: string } | { id: string } | null;

function Miniatura({ r }: { r: Recurso }) {
  // Solo YouTube tiene miniatura (la oficial); el resto, un bloque del color de su origen.
  return r.miniatura ? <img className="rec-mini" src={r.miniatura} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <span className={`rec-mini ${r.origen}`} aria-hidden="true">{NOMBRE_ORIGEN[r.origen].slice(0, 2)}</span>;
}

export function Recursos({ enlaceInicial }: { enlaceInicial?: string }) {
  const [lista, setLista] = useState(leerRecursos);
  const [estado, setEstado] = useState<Estado>('nuevo');
  const [abierto, setAbierto] = useState<Abierto>(enlaceInicial ? { nuevo: true, enlace: enlaceInicial } : null);
  const [aviso, setAviso] = useState('');

  const poner = (nueva: Recurso[]) => {
    if (guardarRecursos(nueva)) setLista(nueva);
    else setAviso('El móvil no deja guardar: libera espacio e inténtalo otra vez.');
  };

  const pegar = async () => {
    try {
      const e = primerEnlace(await navigator.clipboard.readText());
      if (e) setAbierto({ nuevo: true, enlace: e });
      else setAviso('No hay ningún enlace copiado. Copia uno y vuelve a tocar.');
    } catch {
      setAbierto({ nuevo: true, enlace: '' });
    }
  };

  if (abierto && 'nuevo' in abierto) {
    return <Nuevo enlace={abierto.enlace} cancelar={() => setAbierto(null)} guardar={(r) => { poner([r, ...lista]); setEstado('nuevo'); setAbierto(null); }} />;
  }
  const r = abierto ? lista.find((x) => x.id === abierto.id) : undefined;
  if (r) {
    return <Detalle r={r} volver={() => setAbierto(null)} cambiar={(n) => poner(lista.map((x) => (x.id === n.id ? n : x)))} borrar={() => { poner(lista.filter((x) => x.id !== r.id)); setAbierto(null); }} />;
  }

  const visibles = lista.filter((x) => x.estado === estado);
  return (
    <>
      <div className="niveles filtro" role="group" aria-label="Estado">
        {ESTADOS.map((e) => {
          const n = lista.filter((x) => x.estado === e.id).length;
          return <button key={e.id} className={e.id === estado ? 'chip on' : 'chip'} aria-pressed={e.id === estado} onClick={() => setEstado(e.id)}>{e.nombre} {n}</button>;
        })}
      </div>
      <div className="rec-acciones">
        <button className="principal" onClick={pegar}>Pegar enlace copiado</button>
        <button className="secundario" onClick={() => setAbierto({ nuevo: true, enlace: '' })}>Escribir nota</button>
      </div>
      {aviso && <p className="aviso" role="status">{aviso}</p>}
      {visibles.length === 0 ? (
        <p className="vacio">{lista.length === 0 ? 'Aquí caerá lo que guardes de internet: vídeos de YouTube, reels, artículos o tus propias notas. Copia un enlace y toca «Pegar enlace copiado».' : 'No hay recursos en este estado.'}</p>
      ) : (
        <ul className="lista">
          {visibles.map((x) => (
            <li key={x.id}>
              <button className="rec-fila" onClick={() => setAbierto({ id: x.id })}>
                <Miniatura r={x} />
                <span className="rec-texto">{nombreRecurso(x)}</span>
                <span className="chip pequeno">{NOMBRE_ORIGEN[x.origen]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Nuevo({ enlace: inicial, cancelar, guardar }: { enlace: string; cancelar: () => void; guardar: (r: Recurso) => void }) {
  const [enlace, setEnlace] = useState(inicial);
  const [titulo, setTitulo] = useState('');
  const [nota, setNota] = useState('');
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const enviar = async () => {
    const e = enlace.trim() ? primerEnlace(enlace) : '';
    if (e === undefined) return setError('Ese enlace no vale. Tiene que empezar por http o https.');
    if (!e && !titulo.trim() && !nota.trim()) return setError('Escribe un enlace o una nota.');
    setOcupado(true);
    // YouTube da el título con su servicio oficial; si no responde, se queda el que escribas.
    const t = titulo.trim() || (e ? await tituloYoutube(e) : undefined) || '';
    guardar(nuevoRecurso({ enlace: e, titulo: t, nota }));
  };

  return (
    <section className="pantalla">
      <div className="cabecera">
        <button className="atras" onClick={cancelar} aria-label="Volver">‹</button>
        <h1 className="nombre-sistema">Guardar recurso</h1>
      </div>
      <label className="campo-diario"><span>Enlace (opcional si es una nota)</span><input id="rec-enlace" value={enlace} onChange={(e) => setEnlace(e.target.value)} inputMode="url" autoCapitalize="none" autoCorrect="off" placeholder="https://…" /></label>
      <label className="campo-diario"><span>Título</span><input id="rec-titulo" value={titulo} maxLength={200} onChange={(e) => setTitulo(e.target.value)} placeholder="En YouTube sale solo" /></label>
      <label className="campo-diario"><span>Descripción o nota</span><textarea id="rec-nota" rows={5} value={nota} maxLength={5000} onChange={(e) => setNota(e.target.value)} /></label>
      <p className="meta">Instagram, TikTok y las webs no se leen: escribe tú el título. El vídeo no se descarga; se abre con su enlace.</p>
      {error && <p className="aviso" role="alert">{error}</p>}
      <button className="principal ancho" onClick={enviar} disabled={ocupado}>{ocupado ? 'Guardando…' : 'Guardar'}</button>
    </section>
  );
}

function Detalle({ r, volver, cambiar, borrar }: { r: Recurso; volver: () => void; cambiar: (r: Recurso) => void; borrar: () => void }) {
  const [seguro, setSeguro] = useState(false);
  return (
    <section className="pantalla">
      <div className="cabecera">
        <button className="atras" onClick={volver} aria-label="Volver">‹</button>
        <h1 className="nombre-sistema">{nombreRecurso(r)}</h1>
      </div>
      {r.miniatura && <img className="rec-grande" src={r.miniatura} alt="" referrerPolicy="no-referrer" />}
      <p className="meta">{NOMBRE_ORIGEN[r.origen]} · guardado el {r.fecha}</p>
      {r.enlace && <a className="rec-enlace" href={r.enlace} target="_blank" rel="noopener noreferrer">Abrir el original ↗</a>}
      <div className="niveles filtro" role="group" aria-label="Estado">
        {ESTADOS.map((e) => <button key={e.id} className={e.id === r.estado ? 'chip on' : 'chip'} aria-pressed={e.id === r.estado} onClick={() => cambiar({ ...r, estado: e.id })}>{e.nombre}</button>)}
      </div>
      <label className="campo-diario"><span>Título</span><input id="rec-d-titulo" value={r.titulo} maxLength={200} onChange={(e) => cambiar({ ...r, titulo: e.target.value })} /></label>
      <label className="campo-diario"><span>Descripción o nota</span><textarea id="rec-d-nota" rows={6} value={r.nota} maxLength={5000} onChange={(e) => cambiar({ ...r, nota: e.target.value })} /></label>
      <label className="campo-diario"><span>Etiquetas (separadas por comas)</span><input id="rec-d-etq" defaultValue={r.etiquetas.join(', ')} onBlur={(e) => cambiar({ ...r, etiquetas: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} /></label>
      {seguro ? (
        <div className="rec-acciones"><button className="principal" onClick={borrar}>Sí, borrar</button><button className="secundario" onClick={() => setSeguro(false)}>No</button></div>
      ) : (
        <button className="secundario" onClick={() => setSeguro(true)}>Borrar recurso</button>
      )}
    </section>
  );
}
