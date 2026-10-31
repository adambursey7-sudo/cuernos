// Pantalla de acceso (falsa por ahora: solo existen Adam y Benja y nada sale del móvil).
// Al entrar suena una pequeña animación (los cuernos se abren y sale el saludo) y la app aparece por detrás.
import { useState } from 'react';
import { GlifoO } from './Logo';

const CLAVE = 'horns.acceso';
const USUARIOS: Record<string, string> = { Adam: '8520', Benja: '1234' };

const leer = () => { try { return localStorage.getItem(CLAVE); } catch { return null; } };
const poner = (v: string | null) => { try { if (v === null) localStorage.removeItem(CLAVE); else localStorage.setItem(CLAVE, v); } catch { /* sin almacenamiento: pedirá entrar cada vez */ } };

/** Usuario con la sesión abierta, o null. */
export const usuarioActual = () => { const u = leer(); return u !== null && u in USUARIOS ? u : null; };
export const cerrarSesion = () => { poner(null); location.reload(); };

export function ConAcceso({ children }: { children: React.ReactNode }) {
  const [dentro, setDentro] = useState(usuarioActual() !== null);
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [fallo, setFallo] = useState(false);
  const [nombre, setNombre] = useState('');
  const [fase, setFase] = useState<'pide' | 'entra' | 'fuera'>('pide');

  if (dentro) return <>{children}</>;

  const entrar = (ev: React.FormEvent) => {
    ev.preventDefault();
    const quien = Object.keys(USUARIOS).find((u) => u.toLowerCase() === usuario.trim().toLowerCase());
    if (!quien || clave !== USUARIOS[quien]) { setFallo(true); return; }
    poner(quien);
    setNombre(quien);
    setFase('entra');
    setTimeout(() => setFase('fuera'), 3500);
    setTimeout(() => setDentro(true), 3900);
  };

  return (
    <>
      {fase === 'fuera' && children}
      <div className={`acceso ${fase}`}>
        <div className="acceso-logo"><GlifoO className="acceso-o" /></div>
        {fase === 'pide' ? (
          <form className="acceso-form" onSubmit={entrar}>
            <h1 className="acceso-titulo">Horns</h1>
            <label>Usuario
              <input value={usuario} onChange={(e) => { setUsuario(e.target.value); setFallo(false); }} autoComplete="username" autoCapitalize="words" autoFocus />
            </label>
            <label>Contraseña
              <input type="password" inputMode="numeric" value={clave} onChange={(e) => { setClave(e.target.value); setFallo(false); }} autoComplete="current-password" />
            </label>
            {fallo && <p className="acceso-fallo" role="alert">Usuario o contraseña incorrectos</p>}
            <button type="submit">Entrar</button>
          </form>
        ) : (
          <p className="acceso-hola" role="status">Coach {nombre}</p>
        )}
      </div>
    </>
  );
}
