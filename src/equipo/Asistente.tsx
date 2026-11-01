// Asistente «Nuevo equipo»: cuatro pasos cortos, saltables y con vuelta atrás. Al final se crea el equipo con su plantilla y sus horarios.
import { useMemo, useState } from 'react';
import type { Equipo } from '../diario/diario';
import { leerTexto } from '../diario/importar';
import { DIAS_LARGOS, esFecha } from '../temporada/fechas';
import { temporadaPorDefecto } from '../temporada/temporada';
import { hoy } from '../diario/diario';
import { EscudoEquipo } from './EscudoEquipo';
import { equipoEjemplo, montarEquipo, problemasNuevoEquipo, type DatosNuevoEquipo, type EntrenoNuevo, type EquipoMontado } from './equipos';
import { FORMAS_ESCUDO, escudoPorDefecto, letrasDe, type Escudo, type Genero } from './modelo';

const CATEGORIAS = ['Premini', 'Mini', 'Infantil', 'Cadete', 'Júnior', 'Senior'];
const COLORES = ['#f2b134', '#e5483b', '#2f7de1', '#2fa866', '#8a4fd6', '#f2f2f2'];
const PASOS = ['Equipo', 'Temporada y horarios', 'Color y escudo', 'Plantilla'];

type Tipo = DatosNuevoEquipo['tipo'];

export function Asistente({ existentes, crear, cancelar }: { existentes: Pick<Equipo, 'nombre'>[]; crear: (m: EquipoMontado) => void; cancelar?: () => void }) {
  const [paso, setPaso] = useState(0);
  const porDefecto = useMemo(() => temporadaPorDefecto(hoy()), []);
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [genero, setGenero] = useState<Genero>('f');
  const [tipo, setTipo] = useState<Tipo>('formacion');
  const [inicio, setInicio] = useState(porDefecto.inicio);
  const [fin, setFin] = useState(porDefecto.fin);
  const [entrenos, setEntrenos] = useState<EntrenoNuevo[]>([]);
  const [color, setColor] = useState(COLORES[0]);
  const [forma, setForma] = useState<Escudo['forma']>('redondo');
  const [letras, setLetras] = useState('');
  const [lista, setLista] = useState('');

  const escudo: Escudo = { forma, letras: letras.trim() ? letras : escudoPorDefecto(nombre).letras };
  const datos: DatosNuevoEquipo = { nombre, categoria, genero, tipo, inicio, fin, color, escudo, entrenos, lista };
  const problemas = problemasNuevoEquipo(datos, existentes);
  const candidatas = leerTexto(lista);
  const palabra = genero === 'f' ? 'jugadoras' : 'jugadores';
  const repetido = !!nombre.trim() && existentes.some((e) => e.nombre.trim().toLowerCase() === nombre.trim().toLowerCase());

  const alternarDia = (dia: number) => setEntrenos((l) => (l.some((e) => e.dia === dia) ? l.filter((e) => e.dia !== dia) : [...l, { dia, hora: '18:30', minutos: 90 }].sort((a, b) => a.dia - b.dia)));
  const cambiarEntreno = (dia: number, c: Partial<EntrenoNuevo>) => setEntrenos((l) => l.map((e) => (e.dia === dia ? { ...e, ...c } : e)));
  const fechasOk = esFecha(inicio) && esFecha(fin) && fin >= inicio;
  const puedeSeguir = paso === 0 ? !!nombre.trim() && !repetido : paso === 1 ? fechasOk : true;

  return (
    <section className="pantalla asistente" aria-label="Nuevo equipo">
      <div className="pasos-puntos" aria-hidden>{PASOS.map((p, i) => <i key={p} className={i <= paso ? 'on' : ''} />)}</div>
      <div><span className="paso-num" aria-hidden>{paso + 1}</span> <span className="meta">de {PASOS.length} · {PASOS[paso]}</span></div>

      {paso === 0 && (
        <>
          <h1 className="titulo">Nuevo equipo</h1>
          <label className="campo-diario">
            <span>¿Cómo se llama?</span>
            <input value={nombre} maxLength={40} placeholder="Cadete femenino A" onChange={(ev) => setNombre(ev.target.value)} autoComplete="off" />
          </label>
          <div className="niveles filtro" role="group" aria-label="Categoría">
            {CATEGORIAS.map((c) => (
              <button key={c} className={categoria === c ? 'chip on' : 'chip'} aria-pressed={categoria === c} onClick={() => { setCategoria(categoria === c ? '' : c); if (c === 'Senior') setTipo('senior'); else if (tipo === 'senior' && categoria === 'Senior') setTipo('formacion'); }}>{c}</button>
            ))}
          </div>
          <div className="niveles filtro" role="group" aria-label="Femenino o masculino">
            {([['f', 'Femenino'], ['m', 'Masculino']] as const).map(([id, n]) => <button key={id} className={genero === id ? 'chip on' : 'chip'} aria-pressed={genero === id} onClick={() => setGenero(id)}>{n}</button>)}
          </div>
          <div className="niveles filtro" role="group" aria-label="Tipo de equipo">
            {([['formacion', 'Formación'], ['senior', 'Senior']] as const).map(([id, n]) => <button key={id} className={tipo === id ? 'chip on' : 'chip'} aria-pressed={tipo === id} onClick={() => setTipo(id)}>{n}</button>)}
          </div>
          <p className="meta">{tipo === 'senior' ? 'Senior: con roles, estado de cada jugador, liga y plan de partido.' : 'Formación: con fichas para trabajar a cada jugador y la guía por edad.'}</p>
          {repetido && <p className="aviso">Ya tienes un equipo con ese nombre.</p>}
          <button className="secundario ancho" onClick={() => crear(equipoEjemplo(hoy(), genero, tipo))}>Probar con un equipo de ejemplo</button>
        </>
      )}

      {paso === 1 && (
        <>
          <h1 className="titulo">Temporada y horarios</h1>
          <div className="dos-botones">
            <label className="campo-diario"><span>Empieza</span><input type="date" value={inicio} onChange={(ev) => setInicio(ev.target.value)} /></label>
            <label className="campo-diario"><span>Termina</span><input type="date" value={fin} onChange={(ev) => setFin(ev.target.value)} /></label>
          </div>
          {!fechasOk && <p className="aviso">Pon una fecha de inicio y otra de fin, y que el fin sea después del inicio.</p>}
          <p className="meta">¿Qué días entrenáis? Puedes dejarlo para más tarde.</p>
          <div className="niveles filtro" role="group" aria-label="Días de entreno">
            {DIAS_LARGOS.map((d, i) => <button key={d} className={entrenos.some((e) => e.dia === i) ? 'chip on' : 'chip'} aria-pressed={entrenos.some((e) => e.dia === i)} onClick={() => alternarDia(i)}>{d.slice(0, 3)}</button>)}
          </div>
          {entrenos.map((e) => (
            <div key={e.dia} className="fila-entreno">
              <span className="dia">{DIAS_LARGOS[e.dia]}</span>
              <label className="campo-diario"><span>Hora</span><input type="time" value={e.hora} onChange={(ev) => cambiarEntreno(e.dia, { hora: ev.target.value || e.hora })} /></label>
              <label className="campo-diario"><span>Minutos</span><input type="number" inputMode="numeric" min={30} max={180} step={15} value={e.minutos} onChange={(ev) => cambiarEntreno(e.dia, { minutos: Math.min(180, Math.max(30, Number(ev.target.value) || 90)) })} /></label>
              <label className="campo-diario"><span>Pista</span><input value={e.pista ?? ''} maxLength={40} placeholder="Pista 1" onChange={(ev) => cambiarEntreno(e.dia, { pista: ev.target.value || undefined })} /></label>
              <label className="campo-diario"><span>Vestuario</span><input value={e.vestuario ?? ''} maxLength={40} placeholder="2" onChange={(ev) => cambiarEntreno(e.dia, { vestuario: ev.target.value || undefined })} /></label>
            </div>
          ))}
        </>
      )}

      {paso === 2 && (
        <>
          <h1 className="titulo">Color y escudo</h1>
          <div className="escudo-grande"><EscudoEquipo nombre={nombre || 'Equipo'} escudo={escudo} color={color} tam={96} /></div>
          <div className="niveles filtro" role="group" aria-label="Color del equipo">
            {COLORES.map((c) => <button key={c} className={color === c ? 'chip on' : 'chip'} aria-pressed={color === c} aria-label={`Color ${c}`} onClick={() => setColor(c)} style={{ background: c, minWidth: 44, minHeight: 44 }} />)}
            <input type="color" value={color} aria-label="Otro color" onChange={(ev) => setColor(ev.target.value)} />
          </div>
          <div className="niveles filtro" role="group" aria-label="Forma del escudo">
            {FORMAS_ESCUDO.map(([id, n]) => <button key={id} className={forma === id ? 'chip on' : 'chip'} aria-pressed={forma === id} onClick={() => setForma(id)}>{n}</button>)}
          </div>
          <label className="campo-diario"><span>Letras (hasta 3)</span><input value={letras} maxLength={3} placeholder={letrasDe(nombre) || 'HQ'} onChange={(ev) => setLetras(ev.target.value.toUpperCase())} /></label>
        </>
      )}

      {paso === 3 && (
        <>
          <h1 className="titulo">Plantilla</h1>
          <p className="meta">Pega la lista de {palabra}: un dorsal y un nombre por línea (puedes añadir la posición). Si copias desde Excel, también vale. Puedes saltarte esto y añadirlos después.</p>
          <label className="campo-diario">
            <span>Lista</span>
            <textarea value={lista} rows={6} placeholder={'4 Ejemplo Uno Base\n7 Ejemplo Dos Alero'} onChange={(ev) => setLista(ev.target.value)} />
          </label>
          {lista.trim() && <p className="meta">{candidatas.length ? `Se crearán ${Math.min(candidatas.length, 30)} ${palabra}.` : `No he encontrado ${palabra}: hace falta un dorsal y un nombre en cada línea.`}</p>}
          {problemas.length > 0 && <p className="aviso">{problemas[0]}</p>}
        </>
      )}

      <div className="botones-asistente">
        {paso > 0 ? <button className="secundario" onClick={() => setPaso(paso - 1)}>Atrás</button> : <button className="secundario" onClick={cancelar} disabled={!cancelar}>Cancelar</button>}
        {paso < PASOS.length - 1 ? (
          <button className="principal" disabled={!puedeSeguir} onClick={() => setPaso(paso + 1)}>Siguiente</button>
        ) : (
          <button className="principal" disabled={problemas.length > 0} onClick={() => crear(montarEquipo(datos))}>Crear equipo</button>
        )}
      </div>
      {paso > 0 && paso < PASOS.length - 1 && <button className="chip" onClick={() => setPaso(paso + 1)}>Saltar este paso</button>}
      {paso === PASOS.length - 1 && !lista.trim() && <p className="meta">Sin lista, el equipo se crea sin {palabra}.</p>}
    </section>
  );
}
