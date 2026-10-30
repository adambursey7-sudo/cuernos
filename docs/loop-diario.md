# Loop «Diario del entrenador»

Pedido por Adam el 30/10/2026. Trabaja en `C:\dev\baloncesto-t-diario`, rama `loop/diario` (sacada de `main`, que ya tiene todo lo anterior y está publicada). Lo aprobado se une a `main` y se publica con `sh scripts/publicar.sh`.

## El proyecto
Horns pasa de ser una biblioteca de jugadas a ser el **cuaderno del entrenador**: lo que hoy se apunta en una libreta, hecho en el móvil y enlazado con las pizarras.

1. **Plantilla y fichas de jugadoras:** nombre (o apodo), número, posición, puntos fuertes, a mejorar, forma de jugar, cómo entrenarla, notas con fecha.
2. **Equipo:** forma de jugar, virtudes del equipo, qué hay que trabajar y cómo entrenarlo.
3. **Dorsales en las pizarras:** en lugar de 1–5, cada círculo lleva el número de la jugadora que hace ese puesto en ese equipo.
4. **Sistemas propios** con el editor ya hecho, pero pensando en el equipo (quién es la 1, quién es la 5).
5. **Temporada:** fases con objetivos, calendario con partidos, entrenamientos y sesiones enlazadas, semana a semana.
6. **Pasarlo a una IA:** exportar un dosier de texto (plantilla, virtudes, calendario) para pegar en Claude u otra IA y pedirle planificación, sesiones o ejercicios; e importar lo que devuelva.

## Reglas del loop
1. **Diseño antes de programar:** cada pantalla nueva tiene 2 o 3 formas con boceto, ventajas e inconvenientes en `docs/loop-diario/bocetos.html`. Se pregunta a Adam y esa parte no se programa hasta que conteste; lo que no dependa de ella sí avanza.
2. **Bocetos cada vuelta:** entrada nueva arriba con capturas reales (tamaño iPhone), «Hecho» y «Mejorable». Lo mejorable lo arregla el loop por su cuenta si no es decisión de diseño. Al final, boceto de «Cambios» y «Mejoras para el próximo loop».
3. **Todo en el móvil, sin cuentas:** los datos viven en el móvil (localStorage) y entran en la **copia de seguridad** (`src/copia.ts`, versión 2 que sigue leyendo las copias viejas).
4. **Privacidad (el repo y la web son públicos):** ningún nombre ni dato de jugadora real en el código, tests, capturas ni bocetos; solo datos de ejemplo inventados y marcados. Las fichas no salen del móvil salvo que Adam exporte. Datos de salud: de momento no hay campo (se decide con Adam más adelante).
5. **Cada vuelta:** `npm test` y `npm run build` sin errores; capturas con `scripts/capturas.mjs`. La IA no inventa jugadas ni ejercicios: lo que venga de una IA entra como **borrador** hasta que Adam lo confirme.
6. Ligero para el portátil: sin librerías pesadas, calendario hecho a mano.
7. **Al cerrar cada tramo:** `/code-review low` (`medium` si toca el dosier y los datos de personas), entrada de cierre en bocetos, aviso a Adam por Telegram (corto, sin rutas) y parar hasta su visto bueno.
8. Servidor de pruebas en el puerto 5314.

## Tramo 1: plantilla y fichas
- [ ] 1.1 **Diseño** (bocetos A/B/C de la ficha y de la plantilla) → Adam elige.
- [ ] 1.2 Modelo de datos y guardado (`src/diario/`): jugadora (id, nombre, número, posición, puntos fuertes, a mejorar, forma de jugar, cómo entrenarla, notas con fecha) y equipo (nombre, categoría, forma de jugar, virtudes, a trabajar). Varios equipos. Tests de guardado, número repetido y copia de seguridad.
- [ ] 1.3 Pestaña **Equipo**: lista de la plantilla, alta, edición y baja de jugadora; ficha según lo elegido.
- [ ] 1.4 Ficha del equipo: forma de jugar, virtudes y cómo entrenarlas, con enlace a ejercicios y sistemas de la biblioteca que las trabajan.
- [ ] 1.5 Copia de seguridad con plantilla y equipo; revisión y entrada en bocetos; parar.

## Tramo 2: dorsales en las pizarras
- [ ] 2.1 **Diseño** (A/B/C de cómo se asignan los números) → Adam elige.
- [ ] 2.2 «Quién es quién» por equipo: la 1, 2, 3, 4 y 5 de cada sistema con su jugadora.
- [ ] 2.3 Los círculos de la pizarra, el GIF, la hoja de compartir y la ficha A4 enseñan el número elegido (con interruptor 1–5 / dorsales).
- [ ] 2.4 Editor de sistemas propios con los puestos del equipo; revisión; parar.

## Tramo 3: temporada y calendario
- [ ] 3.1 **Diseño** (A/B/C de la planificación) → Adam elige.
- [ ] 3.2 Temporada: fechas de inicio y fin, fases con objetivo (pretemporada, liga, parón…) y qué trabajar en cada una.
- [ ] 3.3 Calendario: partidos (rival, casa/fuera, hora, resultado), entrenamientos fijos de la semana, festivos; las sesiones ya hechas se enlazan al día.
- [ ] 3.4 Vista semana y vista mes; hoy; el cronómetro de pista abre la sesión del día.
- [ ] 3.5 Entrada de balance de partido (qué funcionó, a quién mirar) que cuelga de la ficha de la jugadora; revisión; parar.

## Tramo 4: pasarlo a una IA
- [ ] 4.1 **Diseño** (A: dosier de texto para pegar y archivo para importar; B: llamar a una API desde la app, con clave y coste) → Adam elige. Recomendación: A, sin coste, sin claves y sin datos viajando solos.
- [ ] 4.2 Botón «Preparar para la IA»: crea un texto con plantilla, virtudes, calendario y la petición («hazme la planificación de octubre», «sesiones para trabajar el 1x1») y se copia o se guarda como `.txt`. Opción de **quitar los nombres** y dejar solo número y posición.
- [ ] 4.3 Importar lo que devuelve la IA: formato fijo (JSON) que la propia IA recibe en el dosier; se muestra una vista previa y entra como **borrador** marcado.
- [ ] 4.4 Aviso claro antes de exportar de que son datos de personas (menores) y que se pegan en una IA externa; revisión de seguridad (`/security-review`) y cierre del loop con el boceto final de Cambios y Mejoras.

## Después (no entra en este loop)
Fotos de las jugadoras, estadísticas de partido en directo, asistencia a entrenamientos (existe el script del calendario de Cadete aparte), compartir la plantilla con el staff, datos de salud y confidencialidad por círculos (ver `PLAN.md`).
