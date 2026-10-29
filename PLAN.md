# App de baloncesto para entrenadores — enfoque y plan de trabajo

Nombre: **Cuernos** (29/10). Empezado el 23/10/2026; se empezó a programar el 29/10 (ver `CLAUDE.md`).

Bocetos: https://claude.ai/artifact/1WyTMNX34sbgD2uvhbTnL8

---

## 1. Para qué la queremos

Que un entrenador tenga **todo su baloncesto en un sitio** y que la IA le ahorre el trabajo pesado:

- **Su libro de jugadas**: sistemas de ataque y de defensa, dibujados y animados, con sus variantes.
- **Generar en vez de dibujar**: escribe o dice «cuernos» y le sale el sistema, ya adaptado a su equipo y a su nivel.
- **Ejercicios para cada sistema**: progresión de 2x0 a 5x5, distinta para minibasket, infantil, cadete, júnior o sénior.
- **Planificar**: sesiones, semanas y temporada por equipo, con los ejercicios arrastrados desde la biblioteca.
- **Compartir**: con su ayudante, con el club y, más adelante, con los jugadores.

La idea que la diferencia de las apps que ya existen (pizarras vacías como FastDraw, XOs o Coach's Clipboard): **biblioteca revisada + generador con IA + planificador por niveles, todo junto**.

## 2. Para quién (de dentro hacia fuera)

| Círculo | Quién | Qué saca |
|---|---|---|
| 1. Núcleo | Entrenador de cantera y club (Adam el primero) | Sistemas, ejercicios y sesiones en minutos |
| 2. Club | Coordinador deportivo | Que todas las categorías trabajen los mismos conceptos, cada una a su nivel; ver qué entrena cada equipo |
| 3. Staff | Ayudante, preparador físico, fisio, delegado, material y mantenimiento | Cada uno ve lo suyo: cargas, lesiones, material, pistas y horarios |
| 4. Jugadores y familias | Jugadores (y familias si son menores) | Ver su jugada animada, tareas y convocatorias |
| 5. Gran escala | Otros clubes, federaciones, campus, colegios (Educación Física) | La misma herramienta con su propia metodología |

Se empieza por el círculo 1 y no se pasa al siguiente hasta que el anterior funcione en la pista de verdad.

## 3. Cómo entra la inteligencia artificial

La IA **no inventa jugadas desde cero** (se equivoca con bloqueos y espacios). Trabaja sobre una **base de sistemas revisada a mano** y hace esto:

1. **Entender lo que se pide**: «cuernos para cadete femenino que tira poco de tres».
2. **Elegir y adaptar** el sistema de la base: variante, colocación, lecturas sencillas o complejas según el nivel.
3. **Generar los ejercicios** de progresión para ese sistema y ese nivel.
4. **Montar la sesión o la semana** con tiempos, material y número de jugadores.
5. **Explicarlo** con el lenguaje de cada edad (para la charla o para mandar a los jugadores).
6. Más adelante: preparar al rival (*scouting*), hablarle en la pista con la voz y aprender del estilo del entrenador.

Por ahora queda fuera: análisis de vídeo tipo Hudl y estadísticas en directo.

## 4. Confidencialidad (apuntado para más adelante)

- Los sistemas son el «secreto» de cada equipo: quién los ve y con quién se comparten.
- Hay **menores**: protección de datos (RGPD y LOPDGDD), permiso de las familias.
- Lesiones y estado físico son **datos de salud**: solo fisio, preparador y entrenador.
- **Roles y permisos** por persona (entrenador, coordinador, staff, jugador, familia).
- Qué datos se mandan a la IA y cuáles no (nunca nombres de menores ni datos de salud).

## 5. Plan de trabajo

### Ahora, hasta después de las prácticas (poco a poco, un rato al día)
- [x] Enfoque, público y plan (este documento)
- [x] Primeros bocetos de pantallas
- [x] Prompts escritos (`PROMPTS.md`)
- [x] Ficha de ejemplo: cuernos (`sistemas/cuernos.md`)
- [ ] Un sistema más a la semana en `sistemas/` (lista en `sistemas/README.md`)
- [ ] Mejorar un boceto cuando haya una idea nueva
- [ ] Probar los prompts con Claude a mano, con equipos reales del club

### Fase 1 — Prototipo solo para Adam
Pizarra animada en el móvil + 5 sistemas + generador de ejercicios por nivel.

### Fase 2 — Usarla con un equipo de verdad
Biblioteca propia, planificador de sesiones y fichas para imprimir o mandar.

### Fase 3 — El club
Coordinador y staff, roles y permisos, confidencialidad resuelta.

### Fase 4 — Fuera del club
Otros clubes, campus y federaciones; decidir si se vende y cómo.

## 6. Decisiones pendientes
- ~~Nombre de la app~~ → Cuernos, estilo Marcador, colores Parqué editables (29/10).
- Solo móvil o también tablet y ordenador (la pizarra en tablet luce mucho).
- Gratis para el club y de pago para fuera, o de pago desde el principio.
- Si los sistemas se pueden compartir entre clubes o cada uno guarda los suyos.
