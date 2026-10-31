import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '@fontsource/graduate/400.css';
import './estilos.css';
import { aplicarColores, leerColores } from './temas';
import { aplicarLectura, leerLectura } from './preferencias';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { ConIntro } from './Intro';
import { ConAcceso } from './Acceso';
import { leerEnlace } from './compartir/enlace';
import { Visor } from './compartir/Visor';

// La app instalada se actualiza sola: busca versión nueva al abrirla y al volver a ella, y se recarga al tenerla.
registerSW({
  immediate: true,
  onRegisteredSW(_url, registro) {
    if (!registro) return;
    const buscar = () => void registro.update().catch(() => {});
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && buscar());
    setInterval(buscar, 60 * 60 * 1000);
  },
});

aplicarColores(leerColores());
aplicarLectura(leerLectura(), false);
const raiz = createRoot(document.getElementById('raiz')!);

// Un enlace de jugada (…#j= o …#p=) abre solo el visor, con los colores de quien la manda y sin guardarlos.
leerEnlace(location.hash)
  .then(
    (compartida) => {
      if (compartida?.colores) aplicarColores(compartida.colores, false);
      return compartida ? <Visor datos={compartida} /> : <ConIntro><ConAcceso><App /></ConAcceso></ConIntro>;
    },
    () => <Visor datos="roto" />,
  )
  .then((pantalla) => raiz.render(<StrictMode>{pantalla}</StrictMode>));

// Si se pega un enlace de jugada con Horns ya abierto, solo cambia lo de detrás de «#»: se vuelve a cargar para leerlo.
window.addEventListener('hashchange', () => {
  if (/^#(.*&)?[jp]=/.test(location.hash)) location.reload();
});
