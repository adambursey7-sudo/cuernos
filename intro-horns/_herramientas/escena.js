// Dibujos de la intro (túnel): cada cuadro es un SVG 540x960 (9:16). Sirve para la página de bocetos y para las imágenes de referencia.
(function () {
  const ROSA = '#e5508a', VERDE = '#1f9d63', NARANJA = '#f26b1d', CREMA = '#fff8ee', NAVY = '#1e2a44';
  const CUERNO = 'M14 4C10 46 22 86 50 88C78 86 90 46 86 4C80 38 70 64 50 66C30 64 20 38 14 4Z';
  const VP = { x: 270, y: 430 };

  const ICONOS = {
    balon: () => `<circle r="40" fill="${NARANJA}" stroke="#7a2e08" stroke-width="3"/><path d="M-40 0H40M0 -40V40M-28 -28Q0 0 -28 28M28 -28Q0 0 28 28" fill="none" stroke="#7a2e08" stroke-width="3"/>`,
    silbato: () => `<rect x="-38" y="-14" width="60" height="30" rx="14" fill="#c9ced8" stroke="#555d70" stroke-width="3"/><circle cx="22" cy="0" r="20" fill="#c9ced8" stroke="#555d70" stroke-width="3"/><rect x="-44" y="-8" width="14" height="10" fill="#555d70"/><circle cx="22" cy="0" r="6" fill="#555d70"/>`,
    libreta: () => `<rect x="-30" y="-42" width="60" height="84" rx="5" fill="${VERDE}" stroke="#0c4a2e" stroke-width="3"/><rect x="-22" y="-30" width="44" height="6" fill="${CREMA}" opacity=".8"/><rect x="-22" y="-16" width="44" height="3" fill="${CREMA}" opacity=".6"/><rect x="-22" y="-6" width="44" height="3" fill="${CREMA}" opacity=".6"/>`,
    cronometro: () => `<circle r="36" fill="#e9edf4" stroke="#555d70" stroke-width="5"/><rect x="-6" y="-50" width="12" height="12" fill="#555d70"/><path d="M0 0V-24M0 0L16 8" stroke="${NAVY}" stroke-width="5" stroke-linecap="round"/>`,
    cono: () => `<path d="M-30 40H30L10 -38H-10Z" fill="${NARANJA}" stroke="#7a2e08" stroke-width="3"/><rect x="-38" y="38" width="76" height="8" rx="3" fill="#7a2e08"/><path d="M-17 4H17M-24 22H24" stroke="${CREMA}" stroke-width="6"/>`,
    pizarra: () => `<rect x="-52" y="-36" width="104" height="72" rx="5" fill="#d9a066" stroke="${NAVY}" stroke-width="5"/><path d="M-30 -12Q0 20 30 -14" fill="none" stroke="${NAVY}" stroke-width="3"/><circle cx="-30" cy="-12" r="6" fill="${NAVY}"/><circle cx="30" cy="-14" r="6" fill="${ROSA}"/>`,
    boli: () => `<rect x="-6" y="-48" width="12" height="80" rx="5" fill="${ROSA}" stroke="#7c1c46" stroke-width="3"/><path d="M-6 32L0 48L6 32Z" fill="${NAVY}"/>`,
    tablet: () => `<rect x="-40" y="-52" width="80" height="104" rx="9" fill="#2b3550" stroke="#9aa3b8" stroke-width="4"/><rect x="-32" y="-44" width="64" height="88" rx="3" fill="#d9a066"/><circle cx="-8" cy="-6" r="6" fill="${NAVY}"/><circle cx="14" cy="14" r="6" fill="${ROSA}"/>`,
    pdf: () => `<path d="M-34 -46H14L34 -26V46H-34Z" fill="${CREMA}" stroke="#7a8296" stroke-width="3"/><path d="M14 -46V-26H34" fill="#d6d0c4" stroke="#7a8296" stroke-width="3"/><rect x="-28" y="8" width="38" height="20" rx="3" fill="#d23a2e"/><text x="-9" y="23" font-size="14" font-weight="700" text-anchor="middle" fill="#fff" font-family="sans-serif">PDF</text>`,
    calendario: () => `<rect x="-44" y="-40" width="88" height="82" rx="7" fill="${CREMA}" stroke="#7a8296" stroke-width="3"/><rect x="-44" y="-40" width="88" height="22" rx="7" fill="${ROSA}"/><path d="M-26 -50V-34M26 -50V-34" stroke="#555d70" stroke-width="6" stroke-linecap="round"/><path d="M-30 -2H30M-30 16H30M-30 32H30M-10 -12V40M12 -12V40" stroke="#a7aebd" stroke-width="2"/>`,
    camisetaR: () => `<path d="M-20 -44L-48 -26L-36 -4L-26 -10V44H26V-10L36 -4L48 -26L20 -44Q0 -30 -20 -44Z" fill="${ROSA}" stroke="#7c1c46" stroke-width="3"/><circle cy="0" r="12" fill="none" stroke="${CREMA}" stroke-width="4"/>`,
    camisetaV: () => `<path d="M-20 -44L-48 -26L-36 -4L-26 -10V44H26V-10L36 -4L48 -26L20 -44Q0 -30 -20 -44Z" fill="${VERDE}" stroke="#0c4a2e" stroke-width="3"/><circle cy="0" r="12" fill="none" stroke="${CREMA}" stroke-width="4"/>`,
    botella: () => `<rect x="-14" y="-36" width="28" height="78" rx="12" fill="#8fd0f0" stroke="#3b7da0" stroke-width="3"/><rect x="-8" y="-50" width="16" height="16" rx="3" fill="${ROSA}"/><rect x="-14" y="-6" width="28" height="22" fill="${CREMA}" opacity=".7"/>`,
    canasta: () => `<rect x="-6" y="-10" width="12" height="130" fill="#8b93a6"/><rect x="-60" y="-80" width="120" height="80" rx="4" fill="${CREMA}" stroke="#555d70" stroke-width="4"/><rect x="-24" y="-30" width="48" height="30" fill="none" stroke="${ROSA}" stroke-width="4"/><ellipse cx="0" cy="8" rx="30" ry="7" fill="none" stroke="${NARANJA}" stroke-width="6"/><path d="M-28 10L-18 50M28 10L18 50M0 12V52" stroke="${CREMA}" stroke-width="2" opacity=".8"/>`,
  };
  const o = (t, x, y, s = 1, r = 0, op = 1) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})" opacity="${op}">${ICONOS[t]()}</g>`;

  function tunel() {
    let s = `<rect width="540" height="960" fill="#0d1424"/>`;
    for (let k = 0; k < 9; k++) {
      const r = 1.9 * Math.pow(0.6, k), w = 300 * r, h = 520 * r;
      s += `<rect x="${VP.x - w}" y="${VP.y - h}" width="${2 * w}" height="${2 * h}" rx="${40 * r}" fill="${k % 2 ? '#18223a' : '#202d4a'}" stroke="${NARANJA}" stroke-opacity="${0.12 + 0.07 * k}" stroke-width="${Math.max(1, 5 * r)}"/>`;
    }
    for (let i = -4; i <= 4; i++) s += `<path d="M${VP.x + i * 130} 960L${VP.x + i * 6} ${VP.y + 40}" stroke="#d9a066" stroke-opacity=".28" stroke-width="2"/>`;
    return s + `<ellipse cx="${VP.x}" cy="${VP.y}" rx="90" ry="150" fill="url(#luz)"/>`;
  }
  const defs = `<defs><radialGradient id="luz"><stop offset="0" stop-color="#fff8ee" stop-opacity=".9"/><stop offset=".35" stop-color="${NARANJA}" stop-opacity=".55"/><stop offset="1" stop-color="${NARANJA}" stop-opacity="0"/></radialGradient></defs>`;

  function O(cx, cy, s, ab = 0, opacidad = 1) {
    const ap = 0.54;
    return `<g transform="translate(${cx} ${cy}) scale(${s}) translate(-50 -50)" opacity="${opacidad}"><path d="${CUERNO}" fill="${NARANJA}" transform="translate(0 ${50 - 4 * ap + ab}) scale(1 ${ap})"/><path d="${CUERNO}" fill="${NARANJA}" transform="translate(0 ${50 + 4 * ap - ab}) scale(1 ${-ap})"/><circle cx="50" cy="50" r="10" fill="${CREMA}"/></g>`;
  }

  // hombre visto de espaldas, corriendo (sudadera rosa del cole, pantalón oscuro)
  function hombre(x, y, s, rot = 0, paso = 0) {
    const a = paso ? 22 : -22;
    return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
      <path d="M-14 40L${-14 - a} 118" stroke="#1b2236" stroke-width="22" stroke-linecap="round"/><path d="M14 40L${14 + a} 118" stroke="#1b2236" stroke-width="22" stroke-linecap="round"/>
      <ellipse cx="${-14 - a}" cy="122" rx="14" ry="8" fill="${CREMA}"/><ellipse cx="${14 + a}" cy="122" rx="14" ry="8" fill="${CREMA}"/>
      <path d="M-30 -30L-52 ${10 + a}" stroke="${ROSA}" stroke-width="18" stroke-linecap="round"/><path d="M30 -30L52 ${10 - a}" stroke="${ROSA}" stroke-width="18" stroke-linecap="round"/>
      <path d="M-34 -34Q-36 -50 0 -52Q36 -50 34 -34L30 46H-30Z" fill="${ROSA}"/>
      <circle cx="0" cy="-58" r="20" fill="#e5508a" opacity=".85"/><circle cx="0" cy="-64" r="15" fill="#3b2a22"/>
      <circle cx="0" cy="8" r="13" fill="none" stroke="${CREMA}" stroke-width="3"/>
    </g>`;
  }

  function cara(x, y, s) { // primer plano de perfil, sonriendo hacia la derecha
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <path d="M-120 200Q-130 80 -90 20Q-60 -40 0 -40Q70 -40 78 20L84 60L100 72L82 90L90 104Q86 134 40 138Q10 150 20 200Z" fill="#e0a77f"/>
      <path d="M-100 40Q-110 -30 -40 -50Q30 -62 70 -22Q30 -26 6 -4Q-20 10 -50 8Q-70 30 -100 40Z" fill="#2a1c16"/><path d="M10 130Q50 150 84 108L90 104Q40 140 -20 120Z" fill="#2a1c16" opacity=".45"/>
      <path d="M-150 260Q-120 150 -40 150L60 200L200 330V420H-150Z" fill="${ROSA}"/>
      <circle cx="48" cy="38" r="5" fill="#2a1c16"/><path d="M36 22Q50 16 66 24" stroke="#3b2a22" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M50 100Q70 118 90 98" stroke="#7a2e08" stroke-width="5" fill="none" stroke-linecap="round"/>
    </g>`;
  }

  // letras H, R, N, S: pos final; modo según la versión
  const LETRAS = [['H', 105], ['R', 322], ['N', 404], ['S', 482]];
  function letras(modo, p) {
    let s = '';
    const fy = VP.y + 22;
    LETRAS.forEach(([c, fx], i) => {
      const font = `font-family="Graduate,Impact,serif" font-size="92" text-anchor="middle" fill="${CREMA}"`;
      if (modo === 'vuelan') {
        const dx = [(-190), 200, (-150), 190][i] * (1 - p), dy = [-260, -230, 260, 240][i] * (1 - p), rot = [-40, 30, -25, 35][i] * (1 - p);
        s += `<g opacity="${0.35 + 0.65 * p}"><path d="M${fx + dx * 1.6} ${fy + dy * 1.6}L${fx + dx} ${fy + dy}" stroke="${NARANJA}" stroke-width="4" opacity=".6"/><text transform="translate(${fx + dx} ${fy + dy}) rotate(${rot})" ${font}>${c}</text></g>`;
      } else if (modo === 'giran') {
        const sx = Math.max(0.08, Math.abs(Math.cos((1 - p) * Math.PI * (1 + i * 0.3))));
        s += `<g transform="translate(${fx} ${fy}) scale(${sx} 1)" opacity="${0.3 + 0.7 * p}"><text ${font}>${c}</text></g>`;
      } else if (modo === 'objetos') {
        const it = [['pdf', 'boli'], ['cono', 'silbato'], ['libreta', 'botella'], ['balon', 'cronometro']][i];
        s += `<text x="${fx}" y="${fy}" ${font} fill="none" stroke="${CREMA}" stroke-width="2" stroke-dasharray="6 5" opacity="${1 - p * 0.9}">${c}</text>`;
        s += `<g opacity="${Math.min(1, p * 1.4)}" fill="${CREMA}"><text x="${fx}" y="${fy}" ${font} opacity="${p}">${c}</text></g>`;
        s += o(it[0], fx - 14, fy - 40 - 90 * (1 - p), 0.34, -10, 1 - p * 0.7) + o(it[1], fx + 16, fy - 28 - 70 * (1 - p), 0.3, 12, 1 - p * 0.7);
      } else if (modo === 'luz') {
        s += `<text x="${fx}" y="${fy}" ${font} fill="none" stroke="${NARANJA}" stroke-width="5" stroke-dasharray="300" stroke-dashoffset="${300 * (1 - p)}" style="filter:drop-shadow(0 0 8px ${NARANJA})">${c}</text><text x="${fx}" y="${fy}" ${font} opacity="${Math.max(0, p * 2 - 1)}">${c}</text>`;
      } else if (modo === 'pasan') {
        const lado = i % 2 ? 1 : -1, sc = 0.55 + 0.45 * p, px = fx + lado * 190 * (1 - p), py = fy + (i < 2 ? -140 : 150) * (1 - p);
        s += `<g transform="translate(${px} ${py}) scale(${sc}) skewY(${lado * 16 * (1 - p)})" opacity="${0.4 + 0.6 * p}"><text ${font}>${c}</text></g>`;
      }
    });
    return s;
  }

  function cuadro(f) {
    let s = defs + tunel();
    const T = f.tunel !== false;
    if (f.objs) f.objs.forEach((a) => (s += o(...a)));
    if (f.o) s += O(...f.o);
    if (f.hombre) s += hombre(...f.hombre);
    if (f.cara) s += cara(...f.cara);
    if (f.letras) s += letras(...f.letras);
    if (f.flash) s += `<rect width="540" height="960" fill="url(#luz)" opacity="${f.flash}"/>`;
    if (!T) return s;
    return s;
  }

  const CUADROS = {
    // plano 1: entra en el túnel
    uno: { o: [270, 430, 0.5], hombre: [270, 700, 0.95, 0, 0], objs: [['balon', 90, 300, 0.8, 0], ['silbato', 450, 380, 0.7, 20], ['libreta', 60, 620, 0.8, -15], ['camisetaV', 470, 600, 0.9, 10], ['cono', 150, 130, 0.6, 20, .8], ['boli', 420, 160, 0.7, 35, .8]] },
    // final del 1 / inicio del 2: corre, ya hay más cosas
    dos: { o: [270, 430, 0.9], hombre: [270, 650, 0.8, 0, 1], objs: [['balon', 80, 250, 1.1, 0], ['pizarra', 440, 280, 1.1, 14], ['cronometro', 110, 520, 0.95, -10], ['tablet', 470, 560, 1, 12], ['pdf', 200, 160, 0.8, -25, .85], ['botella', 360, 130, 0.8, 30, .85], ['calendario', 60, 760, 1, 8], ['balon', 500, 800, 1.2, 0]] },
    // final del 2: esquiva
    tres: { o: [270, 430, 1.4], hombre: [300, 640, 0.75, -9, 0], objs: [['canasta', 100, 290, 1.5, -6], ['balon', 460, 220, 1.5, 0], ['cono', 440, 600, 1.4, 20], ['camisetaR', 90, 640, 1.2, -18], ['balon', 220, 840, 1.6, 0], ['pizarra', 470, 790, 1.2, -12], ['silbato', 150, 120, 0.9, 12, .85]] },
    // plano 3: primer plano, sonríe al ver la O
    cara: { cara: [190, 470, 1.4], o: [470, 330, 0.8], objs: [['balon', 420, 770, 1.4, 0, .9], ['boli', 90, 130, 0.8, 30, .8]], flash: 0.2 },
    // plano 4 inicio: la O gigante, él corre hacia la luz
    cuatro: { o: [270, 430, 3.2, 8], hombre: [270, 640, 0.55, 0, 1], objs: [['balon', 70, 180, 1.1, 0, .8], ['cono', 480, 210, 1, 20, .8], ['camisetaV', 60, 760, 1, -10, .8], ['pdf', 490, 760, 1, 10, .8]], flash: 0.3 },
  };

  window.Escena = {
    cuadro,
    svg: (f, id) => `<svg viewBox="0 0 540 960" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${id || 'boceto'}">${cuadro(typeof f === 'string' ? CUADROS[f] : f)}</svg>`,
    CUADROS,
    O, hombre, letras, ICONOS, o,
  };
})();
