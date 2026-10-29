# Horns (app de baloncesto para entrenadores; antes «Cuernos»)

PWA (React + Vite, como English Lab) para el móvil. Plan y público en `PLAN.md`; fichas de sistemas en `sistemas/*.md`.

## Decisiones de Adam (29/10)
- Nombre **Horns** (antes Cuernos; la jugada «Cuernos» sigue igual). Logo HORNS: la O son dos cuernos afilados enfrentados con un balón (`src/Logo.tsx`) (`public/icono.svg`; PNG con `node scripts/capturas.mjs iconos`).
- Estilo **Marcador**: fondo oscuro, número de paso enorme en Graduate, botones grandes para la banda. Texto en Atkinson Hyperlegible.
- Colores: empieza con **Parqué** y el entrenador cambia los cuatro colores (principal, fondo, pista, jugadores) en la pestaña Colores. Textos, líneas y flechas se calculan solos para que se lean (`src/temas.ts`).
- Bocetos de la identidad: https://claude.ai/artifact/V3hUwLX7fjL6V16JQLBfzZ (`bocetos/identidad.html`).

## Cómo está hecho
- `src/sistemas/datos.ts`: sistemas pasados a mano desde las fichas (la IA no inventa jugadas). Coordenadas de media pista en decímetros, canasta en (75, 12). Movimientos: corte, bote, bloqueo (con `por` para curvas) y pase. `revisar: true` = paso que Adam tiene que confirmar.
- `src/pizarra/animar.ts`: posición de jugadores y balón en el momento `t` (t = 2 es «paso 2 acabado»); `Pista.tsx` la dibuja con flechas recortadas para que el jugador no tape la punta.
- `src/pantallas/`: Inicio (interfaz C: seguir donde lo dejaste, guardado en `src/ultima.ts`, y colecciones de lado), Sistemas (pestaña Jugadas), Sistema (pizarra paso a paso, niveles con su lectura, ficha), Ajustes (colores). Sesiones aún vacía; los ejercicios salen en Inicio y en la ficha.

## Comandos
- `npm run dev` (abierto a la wifi para probar en el iPhone), `npm run build`, `npm test`.
- Publicar: `sh scripts/publicar.sh` → https://adambursey7-sudo.github.io/cuernos/ (repo público adambursey7-sudo/cuernos; rama gh-pages).
- Capturas: `PLAYWRIGHT_CORE=<ruta a playwright-core> node scripts/capturas.mjs http://localhost:5310 <carpeta>` (playwright-core está en el scratchpad viejo de English Lab, ver su CLAUDE.md).

## Reglas
- Vídeos propios con menores: solo en local (`videos/` no se sube), sin nombres.
- Al añadir un sistema: ficha en `sistemas/` revisada por Adam → datos en `datos.ts` → `npm test` (comprueba que todo queda dentro de la pista).
