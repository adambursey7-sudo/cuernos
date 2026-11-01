// Convocatoria y quinteto inicial de un partido. Las lesionadas aparecen marcadas, pero la decisión es del entrenador.
import { estaFuera, type Jugadora } from '../diario/diario';
import type { Evento } from '../temporada/temporada';

export function ConvocatoriaPartido({ e, jugadoras, poner }: { e: Evento; jugadoras: Jugadora[]; poner: (c: Partial<Evento>) => void }) {
  if (jugadoras.length === 0) return null;
  const conv = e.convocados;
  const quinteto = e.quinteto ?? [];
  const convocado = (id: string) => (conv ? conv.includes(id) : false);
  const ponerConvocados = (ids: string[] | undefined) => poner({ convocados: ids, quinteto: ids ? quinteto.filter((q) => ids.includes(q)) : e.quinteto });
  const alternarConv = (id: string) => {
    const base = conv ?? [];
    ponerConvocados(base.includes(id) ? base.filter((x) => x !== id) : [...base, id].slice(0, 20));
  };
  const alternarQuinteto = (id: string) => {
    if (quinteto.includes(id)) poner({ quinteto: quinteto.filter((x) => x !== id) });
    else if (quinteto.length < 5) poner({ quinteto: [...quinteto, id] });
  };
  const aptos = jugadoras.filter((j) => !estaFuera(j)).map((j) => j.id).slice(0, 20);
  return (
    <div className="conv-partido">
      <h4 className="sub">Convocatoria{conv ? ` · ${conv.length}` : ''}</h4>
      <div className="niveles filtro" role="group" aria-label="Convocados">
        {jugadoras.map((j) => (
          <button key={j.id} className={convocado(j.id) ? 'chip on' : 'chip'} aria-pressed={convocado(j.id)} onClick={() => alternarConv(j.id)} title={j.nombre}>
            #{j.numero || '–'}{estaFuera(j) ? ' ✚' : ''}
          </button>
        ))}
      </div>
      <div className="fila-chips">
        <button className="chip pequeno" onClick={() => ponerConvocados(aptos)}>Todos los disponibles</button>
        {conv && <button className="chip pequeno" onClick={() => ponerConvocados(undefined)}>Quitar convocatoria</button>}
      </div>
      {conv && conv.length > 0 && (
        <>
          <h4 className="sub">Quinteto inicial · {quinteto.length}/5</h4>
          <div className="niveles filtro" role="group" aria-label="Quinteto inicial">
            {jugadoras.filter((j) => conv.includes(j.id)).map((j) => (
              <button key={j.id} className={quinteto.includes(j.id) ? 'chip on' : 'chip'} aria-pressed={quinteto.includes(j.id)} disabled={!quinteto.includes(j.id) && quinteto.length >= 5} onClick={() => alternarQuinteto(j.id)} title={j.nombre}>
                #{j.numero || '–'}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
