// Conexiones y exportaciones (loop Herramienta diaria, tramo 5). Una pantalla en Más con tarjetas: la IA (Jarvis o clave de Gemini,
// todo opcional y solo en este móvil), mensajes para las familias con dorsales, y exportar a CSV, PDF y calendario.
import { useEffect, useRef, useState } from 'react';
import { claveValida, enmascarar, guardarConexiones, leerConexiones, MODELO_GEMINI, type Conexiones as Ajustes, type Proveedor } from '../conexiones/ajustes';
import { ErrorIA, preguntar, proveedorActivo } from '../conexiones/ia';
import { limpiarMensaje, nombresQueColan, prepararEnvio, promptFamilias } from '../conexiones/redactar';
import { hoy, leerDiario, plantilla } from '../diario/diario';
import { leerEquipoActivo } from '../equipo/equipos';
import { csvPartidos, csvPlantilla, csvEstadistica, hojaEstadistica } from '../exportar/exportar';
import { leerConexion } from '../recursos/jarvis';
import { semanaPasada, textoSemana } from '../estadistica/semanal';
import { leerSesiones } from '../sesiones/sesiones';
import { escribirIcs } from '../temporada/ics';
import { itemsParaIcs, leerTemporadas, temporadaDe } from '../temporada/temporada';

function descargar(texto: string, nombre: string, tipo: string) {
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(new Blob([texto], { type: tipo }));
  enlace.download = nombre;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(enlace.href), 60_000);
}

function abrirHoja(html: string): boolean {
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const ok = !!window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return ok;
}

export function Conexiones({ volver }: { volver: () => void }) {
  const equipo = leerEquipoActivo();
  const jugadoras = equipo ? plantilla(leerDiario(), equipo.id) : [];
  const t = equipo ? temporadaDe(leerTemporadas(), equipo.id) : undefined;
  const dorsales = Object.fromEntries(jugadoras.map((j) => [j.id, j.numero]));
  const archivo = (equipo?.nombre ?? 'horns').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'horns';

  const [aj, setAj] = useState<Ajustes>(leerConexiones);
  const [clave, setClave] = useState('');
  const [modelo, setModelo] = useState(aj.gemini?.modelo ?? MODELO_GEMINI);
  const [aviso, setAviso] = useState('');
  const jarvis = !!leerConexion();
  const quien = proveedorActivo(aj, jarvis);

  const guardar = (n: Ajustes) => { if (guardarConexiones(n)) { setAj(leerConexiones()); return true; } setAviso('El móvil no deja guardar: libera espacio e inténtalo otra vez.'); return false; };
  const ponerClave = () => {
    if (!claveValida(clave)) return setAviso('Esa clave no parece buena. Es una sola palabra de unas 39 letras y cifras.');
    if (guardar({ ...aj, gemini: { clave: clave.trim(), modelo } })) { setClave(''); setAviso('Clave guardada en este móvil.'); }
  };
  const elegir = (p: Proveedor | undefined) => guardar({ ...aj, proveedor: p });

  // ---- Mensaje para las familias ----
  const semana = equipo ? semanaPasada(t, leerSesiones(), hoy(), jugadoras.length) : undefined;
  const [hechos, setHechos] = useState(semana && equipo ? textoSemana(semana, equipo.nombre) : '');
  const [peticion, setPeticion] = useState('Resumen de la semana para las familias');
  const [envio, setEnvio] = useState<{ hechos: string; peticion: string; cambios: number } | null>(null);
  const [esperando, setEsperando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const cancelado = useRef(false);
  useEffect(() => () => { cancelado.current = true; }, []);

  const redactar = async () => {
    if (!envio) return;
    cancelado.current = false;
    setEsperando(true);
    setAviso('');
    try {
      const m = limpiarMensaje(await preguntar(promptFamilias(envio.hechos, envio.peticion), () => cancelado.current));
      const colados = nombresQueColan(m, jugadoras);
      setMensaje(m);
      setEnvio(null);
      if (colados.length) setAviso(`Ojo: el borrador trae nombres (${colados.join(', ')}). Cámbialos por el dorsal antes de pasarlo.`);
    } catch (e) {
      setAviso(e instanceof ErrorIA ? e.message : 'Algo falló. Inténtalo otra vez.');
    } finally {
      setEsperando(false);
    }
  };
  const copiar = async (texto: string, ok: string) => { try { await navigator.clipboard.writeText(texto); setAviso(ok); } catch { setAviso('Este móvil no deja copiar.'); } };

  // ---- Exportar ----
  const partidos = (t?.eventos ?? []).filter((e) => e.tipo === 'partido').sort((a, b) => b.fecha.localeCompare(a.fecha));
  const [partidoId, setPartidoId] = useState(partidos.find((p) => p.vivo)?.id ?? partidos[0]?.id ?? '');
  const partido = partidos.find((p) => p.id === partidoId);

  return (
    <section className="pantalla">
      <div className="cabecera">
        <button className="atras" onClick={volver} aria-label="Volver">‹</button>
        <h2 className="nombre-sistema">Conexiones y exportar</h2>
      </div>
      {aviso && <p className="aviso-copia" role="status">{aviso}</p>}

      <div className="bloque-equipo">
        <h3 className="sub">Inteligencia artificial</h3>
        <p className="meta">Es opcional: la app funciona igual sin esto. Las claves se quedan solo en este móvil y no van en la copia de seguridad. Nada se envía sin que veas antes el texto, y siempre con dorsales en vez de nombres.</p>
        <p className="meta">Ahora contesta: <b>{quien === 'jarvis' ? 'Jarvis (tu PC)' : quien === 'gemini' ? 'Gemini' : 'nadie todavía'}</b></p>
        <div className="niveles filtro" role="group" aria-label="Quién contesta">
          <button className={!aj.proveedor ? 'chip on' : 'chip'} aria-pressed={!aj.proveedor} onClick={() => elegir(undefined)}>El que esté</button>
          <button className={aj.proveedor === 'jarvis' ? 'chip on' : 'chip'} aria-pressed={aj.proveedor === 'jarvis'} disabled={!jarvis} onClick={() => elegir('jarvis')}>Jarvis{jarvis ? '' : ' (sin conectar)'}</button>
          <button className={aj.proveedor === 'gemini' ? 'chip on' : 'chip'} aria-pressed={aj.proveedor === 'gemini'} disabled={!aj.gemini} onClick={() => elegir('gemini')}>Gemini{aj.gemini ? '' : ' (sin clave)'}</button>
        </div>
        <p className="meta">Jarvis se conecta una vez desde Biblioteca → Ejercicios → Pedir a Claude.</p>
        {aj.gemini ? (
          <>
            <p className="meta">Clave de Gemini guardada: {enmascarar(aj.gemini.clave)} · modelo {aj.gemini.modelo}</p>
            <button className="secundario ancho" onClick={() => { if (guardar({ proveedor: aj.proveedor === 'gemini' ? undefined : aj.proveedor })) setAviso('Clave borrada de este móvil.'); }}>Borrar la clave</button>
          </>
        ) : (
          <>
            <label className="campo-diario"><span>Clave de Gemini (de Google AI Studio)</span>
              <input value={clave} onChange={(e) => setClave(e.target.value)} type="password" autoComplete="off" autoCapitalize="none" autoCorrect="off" placeholder="AIza…" /></label>
            <label className="campo-diario"><span>Modelo</span><input value={modelo} onChange={(e) => setModelo(e.target.value)} autoCapitalize="none" autoCorrect="off" /></label>
            <button className="secundario ancho" disabled={!clave.trim()} onClick={ponerClave}>Guardar la clave</button>
          </>
        )}
      </div>

      <div className="bloque-equipo">
        <h3 className="sub">Mensaje para las familias</h3>
        <p className="meta">{semana ? 'He puesto el resumen de la semana pasada.' : 'Escribe los datos que quieres que use.'} Solo dorsales, nunca nombres.</p>
        {!envio ? (
          <>
            <label className="campo-diario"><span>Datos del mensaje</span><textarea rows={5} maxLength={3000} value={hechos} onChange={(e) => setHechos(e.target.value)} placeholder="Partido del sábado a las 12:00 en…" /></label>
            <label className="campo-diario"><span>Qué quieres decir</span><input value={peticion} maxLength={200} onChange={(e) => setPeticion(e.target.value)} /></label>
            <button className="principal ancho" disabled={!hechos.trim()} onClick={() => setEnvio(prepararEnvio(hechos, peticion, jugadoras))}>{quien ? 'Redactar con IA…' : 'Ver cómo quedaría'}</button>
          </>
        ) : (
          <>
            <p className="meta">Esto es lo que se enviaría. {envio.cambios > 0 ? `Cambié ${envio.cambios} ${envio.cambios === 1 ? 'nombre' : 'nombres'} por su dorsal.` : 'No encontré nombres de tu plantilla.'} Si queda alguno, bórralo ahora.</p>
            <label className="campo-diario"><span>Datos</span><textarea rows={5} value={envio.hechos} onChange={(e) => setEnvio({ ...envio, hechos: e.target.value })} /></label>
            <label className="campo-diario"><span>Petición</span><input value={envio.peticion} onChange={(e) => setEnvio({ ...envio, peticion: e.target.value })} /></label>
            <button className="principal ancho" disabled={esperando || !quien} onClick={() => void redactar()}>{esperando ? 'Redactando…' : 'Enviar y redactar'}</button>
            {!quien && <p className="meta">Conecta Jarvis o pon una clave de Gemini arriba para redactar con IA. Mientras, puedes copiar los datos tal cual.</p>}
            <button className="secundario ancho" onClick={() => void copiar(envio.hechos, 'Datos copiados.')}>Copiar solo los datos</button>
            <button className="secundario ancho" onClick={() => { cancelado.current = true; setEsperando(false); setEnvio(null); }}>Volver</button>
          </>
        )}
        {mensaje && (
          <>
            <label className="campo-diario"><span>Borrador</span><textarea rows={6} value={mensaje} onChange={(e) => setMensaje(e.target.value)} /></label>
            <button className="chip" onClick={() => void copiar(mensaje, 'Mensaje copiado. Pégalo en el grupo.')}>Copiar mensaje</button>
          </>
        )}
      </div>

      <div className="bloque-equipo">
        <h3 className="sub">Exportar</h3>
        {!equipo ? <p className="vacio">Crea primero un equipo.</p> : (
          <>
            <p className="meta">Solo dorsales: sin nombres ni lesiones. El CSV se abre en Excel y en Hojas de cálculo.</p>
            <button className="secundario ancho" onClick={() => descargar(csvPartidos(t?.eventos ?? []), `${archivo}-partidos.csv`, 'text/csv')}>Partidos de la temporada (CSV)</button>
            <button className="secundario ancho" onClick={() => descargar(csvPlantilla(jugadoras), `${archivo}-plantilla.csv`, 'text/csv')}>Plantilla por dorsal (CSV)</button>
            {partidos.length > 0 && (
              <>
                <label className="campo-diario"><span>Estadística de un partido</span>
                  <select value={partidoId} onChange={(e) => setPartidoId(e.target.value)}>{partidos.map((p) => <option key={p.id} value={p.id}>{p.fecha} · {p.titulo || 'Partido'}{p.vivo ? '' : ' (sin directo)'}</option>)}</select></label>
                <div className="dos-botones">
                  <button className="secundario" disabled={!partido?.vivo} onClick={() => partido && descargar(csvEstadistica(partido, dorsales), `${archivo}-estadistica.csv`, 'text/csv')}>CSV</button>
                  <button className="secundario" disabled={!partido?.vivo} onClick={() => { if (partido && !abrirHoja(hojaEstadistica(partido, equipo.nombre, dorsales))) setAviso('El navegador ha bloqueado la hoja.'); }}>PDF (imprimir)</button>
                </div>
              </>
            )}
            {t && (
              <div className="dos-botones">
                <button className="secundario" onClick={() => descargar(escribirIcs(equipo.nombre, itemsParaIcs(t), { avisarMin: 60, sinEntrenos: true }), `${archivo}-partidos.ics`, 'text/calendar')}>Calendario: partidos (.ics)</button>
                <button className="secundario" onClick={() => descargar(escribirIcs(equipo.nombre, itemsParaIcs(t), { avisarMin: 60 }), `${archivo}-todo.ics`, 'text/calendar')}>Calendario: todo (.ics)</button>
              </div>
            )}
          </>
        )}
      </div>
      <button className="secundario ancho" onClick={volver}>Cerrar</button>
    </section>
  );
}
