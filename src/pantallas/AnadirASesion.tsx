// «Añadir a una sesión»: en el móvil arrastrar es incómodo, así que se elige la sesión con un toque y el ejercicio entra al final.
import { useState } from 'react';
import { idBloqueFicha, type Ficha } from '../recursos/fichas';
import { bloqueDe, guardarSesiones, leerSesiones } from '../sesiones/sesiones';

export function AnadirASesion({ f }: { f: Ficha }) {
  const [abierto, setAbierto] = useState(false);
  const [aviso, setAviso] = useState('');
  const sesiones = abierto ? leerSesiones() : [];

  const poner = (id: string) => {
    const todas = leerSesiones();
    const nuevas = todas.map((s) => (s.id === id ? { ...s, bloques: [...s.bloques, bloqueDe(idBloqueFicha(f), f.minutos || 10, 'tecnica')] } : s));
    const s = todas.find((x) => x.id === id);
    setAviso(guardarSesiones(nuevas) ? `Añadido a «${s?.nombre ?? 'la sesión'}» (${s?.equipo ?? ''}). Cambia su tipo desde la sesión.` : 'El móvil no deja guardar: libera espacio e inténtalo otra vez.');
    setAbierto(false);
  };

  return (
    <div>
      <button className="secundario ancho" onClick={() => { setAviso(''); setAbierto(!abierto); }} aria-expanded={abierto}>Añadir a una sesión</button>
      {abierto && (sesiones.length === 0 ? (
        <p className="vacio">Aún no tienes sesiones. Crea una en la pestaña Sesiones y vuelve.</p>
      ) : (
        <ul className="lista">
          {sesiones.map((s) => (
            <li key={s.id}><button className="rec-fila" onClick={() => poner(s.id)}><span className="rec-texto">{s.nombre}</span><span className="chip pequeno">{s.equipo}</span></button></li>
          ))}
        </ul>
      ))}
      {aviso && <p className="aviso" role="status">{aviso}</p>}
    </div>
  );
}
