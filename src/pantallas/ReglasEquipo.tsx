// Reglas de la competición del equipo: periodos, minutos, faltas y notas. Con plantillas para no escribir.
import { PLANTILLAS_REGLAS, REGLAS_FIBA, reglasDe, resumenReglas, sonFiba, type Reglas } from '../reglas/reglas';
import type { Equipo } from '../diario/diario';

export function ReglasEquipo({ e, cambiar }: { e: Equipo; cambiar: (e: Equipo) => void }) {
  const r = reglasDe(e);
  const poner = (n: Reglas) => {
    const { reglas: _antes, ...resto } = e;
    cambiar(sonFiba(n) ? resto : { ...resto, reglas: n });
  };
  const numero = (clave: 'periodos' | 'minutos' | 'faltas', min: number, max: number) => (
    <input
      type="number" inputMode="numeric" min={min} max={max} value={r[clave]}
      onChange={(ev) => { const v = Math.round(Number(ev.target.value)); if (v >= min && v <= max) poner({ ...r, [clave]: v }); }}
    />
  );
  return (
    <div className="reglas-equipo">
      <h2 className="sub">Reglas de la competición</h2>
      <p className="meta">Ahora: {resumenReglas(r)}. Cambian la rotación y las faltas del partido.</p>
      <div className="niveles filtro" role="group" aria-label="Plantillas de reglas">
        {PLANTILLAS_REGLAS.map((p) => {
          const on = p.reglas.periodos === r.periodos && p.reglas.minutos === r.minutos && p.reglas.faltas === r.faltas;
          return <button key={p.id} className={on ? 'chip on' : 'chip'} aria-pressed={on} onClick={() => poner({ ...p.reglas, ...(r.notas ? { notas: r.notas } : {}) })}>{p.nombre}</button>;
        })}
      </div>
      <div className="dos-botones">
        <label className="campo-diario"><span>Periodos</span>{numero('periodos', 1, 6)}</label>
        <label className="campo-diario"><span>Minutos de cada uno</span>{numero('minutos', 1, 20)}</label>
        <label className="campo-diario"><span>Faltas para quedar fuera</span>{numero('faltas', 3, 7)}</label>
      </div>
      <label className="campo-diario">
        <span>Notas de la competición</span>
        <textarea rows={3} maxLength={400} value={r.notas ?? ''} placeholder="Descansos, tiempos muertos, normas de la categoría…" onChange={(ev) => poner({ ...r, notas: ev.target.value || undefined })} />
      </label>
      {!sonFiba(r) && <button className="chip" onClick={() => poner(REGLAS_FIBA)}>Volver a FIBA</button>}
    </div>
  );
}
