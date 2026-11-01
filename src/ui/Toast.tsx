// Aviso corto con «Deshacer»: borrar algo se hace sin preguntar y se puede volver atrás unos segundos.
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

export function useAvisoDeshacer(segundos = 6): { avisar: (texto: string, deshacer: () => void) => void; aviso: ReactNode } {
  const [actual, setActual] = useState<{ texto: string; deshacer: () => void } | null>(null);
  const reloj = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cerrar = useCallback(() => { clearTimeout(reloj.current); setActual(null); }, []);
  const avisar = useCallback((texto: string, deshacer: () => void) => {
    clearTimeout(reloj.current);
    setActual({ texto, deshacer });
    reloj.current = setTimeout(() => setActual(null), segundos * 1000);
  }, [segundos]);
  useEffect(() => () => clearTimeout(reloj.current), []);
  const aviso = actual && (
    <div className="toast" role="status" aria-live="polite">
      <span>{actual.texto}</span>
      <button onClick={() => { actual.deshacer(); cerrar(); }}>Deshacer</button>
    </div>
  );
  return { avisar, aviso };
}
