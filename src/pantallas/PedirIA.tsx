// «Pedir a Claude» (tramo 4): cuestionario corto → texto completo a la vista → envío por Jarvis → borrador de ficha.
// Nada sale del móvil hasta que se toca «Enviar a Claude», y siempre con el texto completo delante.
import { useEffect, useRef, useState } from 'react';
import { borradorDeRespuesta, construirEncargoEjercicio, construirPrompt, guardarBase, leerBase, MAX_PROMPT, PROMPT_BASE, type Cuestionario } from '../recursos/ia';
import { emparejar, enviar, ErrorJarvis, esperar, leerConexion, olvidarConexion, type Conexion } from '../recursos/jarvis';
import type { Ficha } from '../recursos/fichas';
import type { Ejercicio } from '../recursos/guardarEjercicioIA';
import { pedirEjercicio } from '../recursos/pedirEjercicio';
import { CUESTIONARIO_NORMAL, elegir, esOtro, PREGUNTAS, type Pregunta } from '../recursos/opcionesEjercicio';
import { nombreRecurso, type Recurso } from '../recursos/recursos';
import { nuevoId } from '../sistemas/almacen';
import { leerEspacios } from '../sistemas/espacios';
import { BorradorEjercicio } from './BorradorEjercicio';

export function PedirIA({ recurso, borrador, retocar, guardada }: {
  recurso?: Recurso;
  borrador: (f: Ficha) => void;
  /** Abre el ejercicio dibujado en el editor de la pizarra; la ficha se crea al guardar allí. */
  retocar: (e: Ejercicio, c: Cuestionario, recurso?: Recurso) => void;
  guardada: (f: Ficha) => void;
}) {
  const [con, setCon] = useState<Conexion | undefined>(leerConexion);
  const [c, setC] = useState<Cuestionario>(CUESTIONARIO_NORMAL);
  const [base, setBase] = useState(leerBase);
  const [fase, setFase] = useState<'escribir' | 'esperando'>('escribir');
  const [error, setError] = useState('');
  const [abiertas, setAbiertas] = useState<string[]>([]);   // preguntas con «Otro» abierto
  const [hecho, setHecho] = useState<Ejercicio | undefined>();
  const cancelado = useRef(false);
  useEffect(() => () => { cancelado.current = true; }, []);   // al salir de la pantalla se deja de esperar

  const prompt = construirPrompt(base, c, recurso);
  const encargo = construirEncargoEjercicio(c, recurso, undefined, leerEspacios());
  const largoTexto = prompt.length > MAX_PROMPT;
  const largoDibujo = encargo.length > MAX_PROMPT;

  const fallo = (e: unknown) => {
    if (e instanceof ErrorJarvis && e.reemparejar) { olvidarConexion(); setCon(undefined); }
    setError(e instanceof Error ? e.message : 'Algo falló. Inténtalo otra vez.');
    setFase('escribir');
  };

  // Ficha de solo texto (la de siempre): el texto base y su borrador de ficha.
  const mandar = async () => {
    if (!con) return;
    cancelado.current = false;
    setError('');
    setFase('esperando');
    try {
      const id = await enviar(con, prompt);
      const respuesta = await esperar(con, id, () => cancelado.current);
      if (cancelado.current) return;
      borrador(borradorDeRespuesta(respuesta, c, recurso));
    } catch (e) {
      fallo(e);
    }
  };

  // Ejercicio con pizarra: Claude lo dibuja, se comprueba y se enseña como borrador (no se guarda).
  const dibujar = async () => {
    if (!con) return;
    cancelado.current = false;
    setError('');
    setFase('esperando');
    try {
      const r = await pedirEjercicio(con, c, nuevoId(), recurso, undefined, () => cancelado.current);
      if (cancelado.current) return;
      if (!r.ok) {
        setError(`Claude no ha podido dibujarlo (${r.motivo}). Puedes probar otra vez o pedir la ficha de solo texto.`);
        return setFase('escribir');
      }
      setHecho(r);
      setFase('escribir');
    } catch (e) {
      fallo(e);
    }
  };

  if (!con) return <Conectar listo={setCon} aviso={error} />;

  if (hecho) return <BorradorEjercicio e={hecho} cuestionario={c} recurso={recurso} retocar={(e) => retocar(e, c, recurso)} otraVez={() => setHecho(undefined)} guardada={guardada} />;

  if (fase === 'esperando') {
    return (
      <section className="pantalla" aria-live="polite">
        <p className="aviso">Claude está dibujando el ejercicio… puede tardar un minuto.</p>
        <button className="secundario ancho" onClick={() => { cancelado.current = true; }}>Cancelar</button>
      </section>
    );
  }

  return (
    <>
      {recurso && <p className="meta">Partiendo de: {nombreRecurso(recurso)}</p>}
      {PREGUNTAS.map((p) => <Fila key={p.k} p={p} valor={c[p.k]} abierta={abiertas.includes(p.k) || esOtro(p, c[p.k])}
        elegir={(o) => { setAbiertas(abiertas.filter((k) => k !== p.k)); setC(elegir(c, p, o)); }}
        otro={() => { setAbiertas([...abiertas, p.k]); setC({ ...c, [p.k]: '' }); }}
        escribir={(v) => setC({ ...c, [p.k]: v })} />)}
      <label className="campo-diario">
        <span>Algo más (si quieres)</span>
        <textarea id="ia-notas" rows={2} value={c.notas} maxLength={600} placeholder="Sin nombres de jugadoras" onChange={(e) => setC({ ...c, notas: e.target.value })} />
      </label>
      <details className="campo-diario">
        <summary>Texto base de la ficha de texto (puedes cambiarlo)</summary>
        <textarea id="ia-base" rows={10} value={base} maxLength={4000} onChange={(e) => { setBase(e.target.value); guardarBase(e.target.value); }} />
        <button className="secundario" onClick={() => { setBase(PROMPT_BASE); guardarBase(PROMPT_BASE); }}>Volver al texto original</button>
      </details>
      <details className="campo-diario">
        <summary>Ver el texto completo que se enviará</summary>
        <pre className="ia-previa" id="ia-previa">{encargo}</pre>
      </details>
      <p className="aviso">Al enviar, este texto sale de tu móvil hacia tu PC (Jarvis) y de allí a Claude. Revisa que no lleve nombres de jugadoras ni datos personales.</p>
      {largoDibujo && <p className="aviso" role="alert">El texto es demasiado largo ({encargo.length} de {MAX_PROMPT} letras): acorta tus respuestas.</p>}
      {!largoDibujo && largoTexto && <p className="aviso" role="alert">Para la ficha de texto, el texto base es demasiado largo ({prompt.length} de {MAX_PROMPT} letras).</p>}
      {error && <p className="aviso" role="alert">{error}</p>}
      <button className="principal ancho" onClick={dibujar} disabled={largoDibujo}>Dibujar el ejercicio con Claude</button>
      <button className="secundario ancho" onClick={mandar} disabled={largoTexto}>Solo la ficha de texto</button>
      <p className="meta">Lo que conteste Claude llega como borrador: lo revisas y lo guardas tú. <button className="enlace" onClick={() => { olvidarConexion(); setCon(undefined); }}>Desconectar de Jarvis</button></p>
    </>
  );
}

function Fila({ p, valor, abierta, elegir, otro, escribir }: {
  p: Pregunta; valor: string; abierta: boolean; elegir: (o: string) => void; otro: () => void; escribir: (v: string) => void;
}) {
  return (
    <div className="campo-diario" role="group" aria-label={p.nombre}>
      <span>{p.nombre}</span>
      <div className="fila-chips">
        {p.opciones.map((o) => <button key={o} className={!abierta && valor === o ? 'chip on' : 'chip'} aria-pressed={!abierta && valor === o} onClick={() => elegir(o)}>{o}</button>)}
        <button className={abierta ? 'chip on' : 'chip'} aria-pressed={abierta} onClick={otro}>Otro</button>
      </div>
      {abierta && <input id={`ia-${p.k}`} value={valor} maxLength={200} autoFocus placeholder="Escríbelo aquí" onChange={(e) => escribir(e.target.value)} />}
    </div>
  );
}

function Conectar({ listo, aviso }: { listo: (c: Conexion) => void; aviso: string }) {
  const [direccion, setDireccion] = useState('');
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState(aviso);
  const [ocupado, setOcupado] = useState(false);

  const conectar = async () => {
    setOcupado(true);
    setError('');
    try {
      listo(await emparejar(direccion, codigo));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo conectar.');
      setOcupado(false);
    }
  };

  return (
    <>
      <p className="meta">Para pedirle fichas a Claude, Horns usa tu Jarvis (el del PC). Se conecta una sola vez:</p>
      <ol className="meta">
        <li>En el PC, en la carpeta de Jarvis, ejecuta <b>python mobile_server.py --code</b>. Te da un código de 6 cifras (vale 10 minutos).</li>
        <li>Escribe aquí la dirección de Jarvis en Tailscale (la misma que usas en su app del móvil) y el código.</li>
      </ol>
      <label className="campo-diario"><span>Dirección de Jarvis</span><input id="ia-dir" value={direccion} onChange={(e) => setDireccion(e.target.value)} inputMode="url" autoCapitalize="none" autoCorrect="off" placeholder="nombre.tu-red.ts.net" /></label>
      <label className="campo-diario"><span>Código</span><input id="ia-cod" value={codigo} onChange={(e) => setCodigo(e.target.value)} inputMode="numeric" maxLength={7} placeholder="123456" /></label>
      {error && <p className="aviso" role="alert">{error}</p>}
      <button className="principal ancho" onClick={conectar} disabled={ocupado || !direccion.trim() || !codigo.trim()}>{ocupado ? 'Conectando…' : 'Conectar'}</button>
      <p className="meta">La clave que te da Jarvis solo sirve para esto y se queda en este móvil; no entra en la copia de seguridad.</p>
    </>
  );
}
