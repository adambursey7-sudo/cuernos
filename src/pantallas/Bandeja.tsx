// Bandeja de entrada (loop Herramienta diaria, tramo 2). Panel de tarjetas en una sola pantalla (opción B):
// se pega o se adjunta el material, se ordena en borradores y solo «Aceptar y repartir» guarda algo.
import { useEffect, useRef, useState } from 'react';
import { anonimizar, borradoresLocales, leerRespuesta, MAX_TEXTO, NOMBRE_TIPO, promptBandeja, repartir, type Borrador } from '../bandeja/bandeja';
import { textoDePdf } from '../diario/importar';
import { leerDiario, plantilla } from '../diario/diario';
import { leerEquipoActivo } from '../equipo/equipos';
import { anadirFicha } from '../recursos/guardarEjercicioIA';
import { ErrorIA, preguntar, proveedorActivo } from '../conexiones/ia';
import { RASGOS_RIVAL } from '../temporada/rival';
import { guardarEvento, guardarTemporadas, leerTemporadas, temporadaDe, type Evento } from '../temporada/temporada';

const MAX_ARCHIVO = 2_000_000;

export function Bandeja({ volver }: { volver: () => void }) {
  const equipo = leerEquipoActivo();
  const jugadoras = equipo ? plantilla(leerDiario(), equipo.id) : [];
  const [temporada, setTemporada] = useState(() => (equipo ? temporadaDe(leerTemporadas(), equipo.id) : undefined));
  const partidos = (temporada?.eventos ?? []).filter((e) => e.tipo === 'partido').sort((a, b) => b.fecha.localeCompare(a.fecha));
  const [partidoId, setPartidoId] = useState(partidos[0]?.id ?? '');
  const [texto, setTexto] = useState('');
  const [borradores, setBorradores] = useState<Borrador[] | null>(null);
  const [envio, setEnvio] = useState<{ texto: string; cambios: number } | null>(null);
  const [esperando, setEsperando] = useState(false);
  const [error, setError] = useState('');
  const [hecho, setHecho] = useState<{ repartidos: number; avisos: string[] } | null>(null);
  const cancelado = useRef(false);
  useEffect(() => () => { cancelado.current = true; }, []);
  const quien = proveedorActivo();
  const partido = partidos.find((p) => p.id === partidoId);

  const adjuntar = async (archivo: File | undefined) => {
    if (!archivo) return;
    setError('');
    if (archivo.size > MAX_ARCHIVO) return setError('Ese archivo es muy grande. Prueba con uno de menos de 2 MB.');
    try {
      const esPdf = /\.pdf$/i.test(archivo.name) || archivo.type === 'application/pdf';
      const esTexto = /\.(csv|tsv|txt)$/i.test(archivo.name) || archivo.type.startsWith('text/');
      if (!esPdf && !esTexto) return setError('Por ahora entran CSV, texto y PDF. Las hojas de Excel, expórtalas a CSV; las fotos y los vídeos aún no se leen aquí.');
      const dentro = esPdf ? await textoDePdf(archivo) : await archivo.text();
      setTexto((t) => [t.trim(), dentro.trim()].filter(Boolean).join('\n\n').slice(0, 20000));
    } catch {
      setError('No he podido leer ese archivo.');
    }
  };

  const ordenarAqui = () => {
    setError('');
    const l = borradoresLocales(texto);
    if (!l.length) return setError('Escribe, pega o adjunta algo primero.');
    setBorradores(l);
  };

  const prepararEnvio = () => {
    setError('');
    if (!texto.trim()) return setError('Escribe, pega o adjunta algo primero.');
    setEnvio(anonimizar(texto, jugadoras));
  };

  const mandarAClaude = async () => {
    if (!quien || !envio) return;
    cancelado.current = false;
    setEsperando(true);
    setError('');
    try {
      const respuesta = await preguntar(promptBandeja(envio.texto), () => cancelado.current);
      if (cancelado.current) return;
      const l = leerRespuesta(respuesta);
      if (!l.length) setError('Claude no ha sacado nada claro de esto. Prueba a ordenarlo aquí en el móvil o a pegar menos texto.');
      else { setBorradores(l); setEnvio(null); }
    } catch (e) {
      setError(e instanceof ErrorIA ? e.message : 'Algo falló. Inténtalo otra vez.');
    } finally {
      setEsperando(false);
    }
  };

  const cambiar = (id: string, c: Partial<Borrador>) => setBorradores((l) => l && l.map((b) => (b.id === id ? ({ ...b, ...c } as Borrador) : b)));

  const necesitaPartido = !!borradores?.some((b) => b.incluir && b.tipo !== 'ejercicio');
  const incluidos = borradores?.filter((b) => b.incluir).length ?? 0;

  const aceptar = () => {
    if (!borradores) return;
    if (necesitaPartido && (!equipo || !temporada || !partido)) return setError('Elige a qué partido va la estadística, las notas y el informe.');
    const r = repartir(borradores, (partido ?? ({} as Evento)), jugadoras);
    if (necesitaPartido && temporada && partido) {
      const nueva = guardarEvento(temporada, r.evento);
      const todas = leerTemporadas().map((t) => (t.equipoId === nueva.equipoId ? nueva : t));
      if (!guardarTemporadas(todas)) return setError('El móvil no deja guardar: libera espacio e inténtalo otra vez.');
      setTemporada(nueva);
    }
    for (const f of r.fichas) if (!anadirFicha(f)) return setError('El móvil no deja guardar el ejercicio: libera espacio e inténtalo otra vez.');
    setHecho({ repartidos: r.repartidos, avisos: r.avisos });
    setBorradores(null);
    setTexto('');
  };

  return (
    <section className="pantalla">
      <div className="titulo-fila">
        <h1 className="titulo">Bandeja de entrada</h1>
        <button className="nueva" onClick={volver}>Cerrar</button>
      </div>

      {hecho ? (
        <div className="siguiente">
          <b className="titulo-sig">Repartido: {hecho.repartidos} {hecho.repartidos === 1 ? 'borrador' : 'borradores'}</b>
          {hecho.avisos.map((a) => <span key={a} className="aviso">{a}</span>)}
          <button className="accion-sig" onClick={() => setHecho(null)}>Meter más cosas</button>
        </div>
      ) : borradores ? (
        <>
          <p className="meta">Esto es lo que he sacado. Nada está guardado todavía: quita lo que no quieras, corrige lo que haga falta y pulsa «Aceptar y repartir».</p>
          {necesitaPartido && (
            <label className="campo-diario"><span>¿A qué partido va?</span>
              <select value={partidoId} onChange={(e) => setPartidoId(e.target.value)}>
                {partidos.length === 0 && <option value="">No hay partidos en el calendario</option>}
                {partidos.map((p) => <option key={p.id} value={p.id}>{p.fecha} · {p.titulo || 'Partido'}</option>)}
              </select></label>
          )}
          {borradores.map((b) => (
            <details key={b.id} className="siguiente" open>
              <summary>
                <b>{NOMBRE_TIPO[b.tipo]}</b> {!b.incluir && <span className="meta">(no se guardará)</span>}
              </summary>
              <label className="campo-diario"><span>Incluir</span>
                <input type="checkbox" checked={b.incluir} onChange={(e) => cambiar(b.id, { incluir: e.target.checked })} /></label>
              {b.tipo === 'boxscore' && (
                <ul className="lista">
                  {b.filas.map((f, i) => (
                    <li key={i} className="meta">
                      #{f.dorsal} · {f.p} pts · {f.f} faltas{f.reb ? ` · ${f.reb} reb` : ''}{f.ast ? ` · ${f.ast} ast` : ''}{f.rob ? ` · ${f.rob} rob` : ''}{f.per ? ` · ${f.per} per` : ''}
                      <button className="chip" onClick={() => cambiar(b.id, { filas: b.filas.filter((_, k) => k !== i) } as Partial<Borrador>)}>Quitar</button>
                    </li>
                  ))}
                </ul>
              )}
              {b.tipo === 'notas' && (
                <label className="campo-diario"><span>Nota</span><textarea rows={4} value={b.texto} maxLength={4000} onChange={(e) => cambiar(b.id, { texto: e.target.value } as Partial<Borrador>)} /></label>
              )}
              {b.tipo === 'rival' && (
                <>
                  <p className="meta">{b.rasgos.map((r) => RASGOS_RIVAL.find((x) => x.id === r)?.nombre).filter(Boolean).join(' · ') || 'Sin rasgos marcados'}</p>
                  <label className="campo-diario"><span>A quién vigilar (solo dorsal)</span><textarea rows={2} value={b.vigilar} maxLength={400} onChange={(e) => cambiar(b.id, { vigilar: e.target.value } as Partial<Borrador>)} /></label>
                  <label className="campo-diario"><span>Qué haremos</span><textarea rows={2} value={b.haremos} maxLength={400} onChange={(e) => cambiar(b.id, { haremos: e.target.value } as Partial<Borrador>)} /></label>
                </>
              )}
              {b.tipo === 'ejercicio' && (
                <>
                  <label className="campo-diario"><span>Nombre</span><input value={b.titulo} maxLength={80} onChange={(e) => cambiar(b.id, { titulo: e.target.value })} /></label>
                  <label className="campo-diario"><span>Pasos (uno por línea)</span><textarea rows={4} value={b.pasos.join('\n')} onChange={(e) => cambiar(b.id, { pasos: e.target.value.split('\n').slice(0, 10) } as Partial<Borrador>)} /></label>
                  <p className="meta">Se guarda como ficha en Ejercicios. Es un borrador: revísalo antes de usarlo.</p>
                </>
              )}
            </details>
          ))}
          {error && <p className="aviso" role="alert">{error}</p>}
          <button className="principal ancho" disabled={incluidos === 0} onClick={aceptar}>Aceptar y repartir ({incluidos})</button>
          <button className="secundario ancho" onClick={() => setBorradores(null)}>Volver al texto</button>
        </>
      ) : envio ? (
        <>
          <p className="meta">Esto es lo que se enviará a la IA. {envio.cambios > 0 ? `He cambiado ${envio.cambios} ${envio.cambios === 1 ? 'nombre' : 'nombres'} por su dorsal.` : 'No he encontrado nombres de tu plantilla.'} Revísalo: si queda algún nombre, bórralo ahora.</p>
          <label className="campo-diario"><span>Texto que se envía</span>
            <textarea rows={8} value={envio.texto} maxLength={MAX_TEXTO} onChange={(e) => setEnvio({ ...envio, texto: e.target.value })} /></label>
          {error && <p className="aviso" role="alert">{error}</p>}
          <button className="principal ancho" disabled={esperando || !quien} onClick={mandarAClaude}>{esperando ? 'Leyendo…' : 'Enviar a la IA'}</button>
          {!quien && <p className="meta">Para usar la IA conecta Jarvis o pon una clave de Gemini en Más → Conexiones.</p>}
          <button className="secundario ancho" onClick={() => { cancelado.current = true; setEsperando(false); setEnvio(null); }}>Volver</button>
        </>
      ) : (
        <>
          <p className="meta">Pega o dicta el material del partido (estadística, acta, notas, informe del rival). Puedes adjuntar un CSV, un texto o un PDF. Sin conexión también se ordena.</p>
          <label className="campo-diario"><span>Material</span>
            <textarea rows={8} value={texto} maxLength={20000} placeholder="Dorsal;Pts;Faltas&#10;7;12;2&#10;…" onChange={(e) => setTexto(e.target.value)} /></label>
          <label className="chip">Adjuntar archivo
            <input type="file" accept=".csv,.tsv,.txt,.pdf,text/*,application/pdf" hidden onChange={(e) => { void adjuntar(e.target.files?.[0]); e.target.value = ''; }} /></label>
          {error && <p className="aviso" role="alert">{error}</p>}
          <button className="principal ancho" onClick={ordenarAqui}>Ordenar en el móvil</button>
          <button className="secundario ancho" onClick={prepararEnvio}>Ordenar con IA…</button>
          <p className="meta">Con la IA, antes de enviar te enseño el texto con los nombres cambiados por dorsales. Los menores nunca salen con nombre.</p>
        </>
      )}
    </section>
  );
}
