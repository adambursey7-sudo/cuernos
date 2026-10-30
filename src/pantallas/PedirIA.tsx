// «Pedir a Claude» (tramo 4): cuestionario corto → texto completo a la vista → envío por Jarvis → borrador de ficha.
// Nada sale del móvil hasta que se toca «Enviar a Claude», y siempre con el texto completo delante.
import { useEffect, useRef, useState } from 'react';
import { borradorDeRespuesta, construirPrompt, CUESTIONARIO_VACIO, guardarBase, leerBase, MAX_PROMPT, PROMPT_BASE, type Cuestionario } from '../recursos/ia';
import { emparejar, enviar, ErrorJarvis, esperar, leerConexion, olvidarConexion, type Conexion } from '../recursos/jarvis';
import type { Ficha } from '../recursos/fichas';
import type { Ejercicio } from '../recursos/guardarEjercicioIA';
import { pedirEjercicio } from '../recursos/pedirEjercicio';
import { nombreRecurso, type Recurso } from '../recursos/recursos';
import { nuevoId } from '../sistemas/almacen';
import { BorradorEjercicio } from './BorradorEjercicio';

const CAMPOS: { k: keyof Cuestionario; nombre: string; ayuda?: string; largo?: boolean }[] = [
  { k: 'objetivo', nombre: '¿Qué quieres trabajar?', ayuda: 'Rebote, pase tras bote, defensa del bloqueo…', largo: true },
  { k: 'edad', nombre: 'Categoría o edad', ayuda: 'Infantil, 11-12 años' },
  { k: 'jugadoras', nombre: 'Cuántas jugadoras' },
  { k: 'minutos', nombre: 'Minutos disponibles' },
  { k: 'material', nombre: 'Material', ayuda: '2 balones, conos' },
  { k: 'espacio', nombre: 'Espacio', ayuda: 'Media pista' },
  { k: 'notas', nombre: 'Algo más que tenga en cuenta', largo: true },
];

export function PedirIA({ recurso, borrador, retocar, guardada }: {
  recurso?: Recurso;
  borrador: (f: Ficha) => void;
  /** Abre el ejercicio dibujado en el editor de la pizarra; la ficha se crea al guardar allí. */
  retocar: (e: Ejercicio, c: Cuestionario, recurso?: Recurso) => void;
  guardada: (f: Ficha) => void;
}) {
  const [con, setCon] = useState<Conexion | undefined>(leerConexion);
  const [c, setC] = useState<Cuestionario>(CUESTIONARIO_VACIO);
  const [base, setBase] = useState(leerBase);
  const [fase, setFase] = useState<'escribir' | 'esperando'>('escribir');
  const [error, setError] = useState('');
  const [hecho, setHecho] = useState<Ejercicio | undefined>();
  const cancelado = useRef(false);
  useEffect(() => () => { cancelado.current = true; }, []);   // al salir de la pantalla se deja de esperar

  const prompt = construirPrompt(base, c, recurso);
  const hayDatos = Object.values(c).some((v) => v.trim()) || !!recurso;
  const largo = prompt.length > MAX_PROMPT;

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
      {CAMPOS.map((f) => (
        <label key={f.k} className="campo-diario">
          <span>{f.nombre}</span>
          {f.largo
            ? <textarea id={`ia-${f.k}`} rows={3} value={c[f.k]} maxLength={f.k === 'notas' ? 600 : 200} placeholder={f.ayuda} onChange={(e) => setC({ ...c, [f.k]: e.target.value })} />
            : <input id={`ia-${f.k}`} value={c[f.k]} maxLength={200} placeholder={f.ayuda} onChange={(e) => setC({ ...c, [f.k]: e.target.value })} />}
        </label>
      ))}
      <details className="campo-diario">
        <summary>Texto base (puedes cambiarlo)</summary>
        <textarea id="ia-base" rows={10} value={base} maxLength={4000} onChange={(e) => { setBase(e.target.value); guardarBase(e.target.value); }} />
        <button className="secundario" onClick={() => { setBase(PROMPT_BASE); guardarBase(PROMPT_BASE); }}>Volver al texto original</button>
      </details>
      <div className="campo-diario">
        <span>Esto es lo que se enviará, completo</span>
        <pre className="ia-previa" id="ia-previa">{prompt}</pre>
      </div>
      <p className="aviso">Al enviar, este texto sale de tu móvil hacia tu PC (Jarvis) y de allí a Claude. Revisa que no lleve nombres de jugadoras ni datos personales.</p>
      {largo && <p className="aviso" role="alert">El texto es demasiado largo ({prompt.length} de {MAX_PROMPT} letras): acorta el texto base o tus respuestas.</p>}
      {error && <p className="aviso" role="alert">{error}</p>}
      <button className="principal ancho" onClick={dibujar} disabled={!hayDatos || largo}>Dibujar el ejercicio con Claude</button>
      <button className="secundario ancho" onClick={mandar} disabled={!hayDatos || largo}>Solo la ficha de texto</button>
      {!hayDatos && <p className="meta">Rellena al menos una cosa del cuestionario.</p>}
      <p className="meta">Lo que conteste Claude llega como borrador: lo revisas y lo guardas tú. <button className="enlace" onClick={() => { olvidarConexion(); setCon(undefined); }}>Desconectar de Jarvis</button></p>
    </>
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
