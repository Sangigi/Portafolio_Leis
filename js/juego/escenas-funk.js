/* ---------- BIT & BUGS · escenas-funk.js: escenarios del nivel FUTURE FUNK y sus herramientas (tramas, planetas, fuego) ---------- */
(() => {
  "use strict";
  const BB = window.BitBugs, S = BB.S;
  const { ESCENAS, ESCENAS_G, FUENTE, RM, TAU, aro, c2, disco, h, haz, linea, poligono, rc, tiras } = BB;
  Object.assign(BB, { anilloDe, anilloOrbita, brasas, casete, casetera, cieloTramado, cine, cintaEn, cinturon, ciudad, ciudadPaseo, engrane, esfera, estrellasF, fabrica, flama, glifo, hileraFuego, lucesDisco, lunaF, mancha, maquina, multiverso, mundoPuerta, orbita, palmeras, pasillo, recuerdo, rejilla, solRetro, trama });

  /* ---------- Escenarios del nivel FUTURE FUNK ----------
     Pixel art de consola de 8 bits: muy pocos colores por escena (azules de noche, o el morado al naranja del ocaso, más
     negro, un naranja de acento y blanco), degradados hechos con trama en vez de mezclas suaves, siluetas grandes en negro
     con un filo de luz, cielo con pocas estrellas y franjas negras de cine arriba y abajo. */
  // Las tramas (degradados punteados) se pintan una sola vez en un lienzo guardado y luego solo se copian
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  S.tramas = {};
  const rgbDe = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  function trama(clave, w, hh, pintar) {
    const k = `${clave}|${w}|${hh}`;
    if (!S.tramas[k]) {
      const cv = document.createElement("canvas");
      cv.width = w; cv.height = hh;
      const x = cv.getContext("2d"), im = x.createImageData(w, hh);
      pintar(im.data, w, hh);
      x.putImageData(im, 0, 0);
      S.tramas[k] = cv;
    }
    return S.tramas[k];
  }
  // El cielo: los colores van de arriba abajo y entre uno y el siguiente se mezclan con trama
  function cieloTramado(cols, y0, y1) {
    const hh = Math.max(1, Math.round(y1 - y0));
    c2.drawImage(trama(`c${cols.join("")}`, S.FW, hh, (d, w, alto) => {
      const C = cols.map(rgbDe), n = C.length - 1;
      for (let y = 0; y < alto; y++) {
        const f = (y / alto) * n, i = Math.min(n - 1, Math.floor(f)), fr = f - i;
        for (let x = 0; x < w; x++) { const c = fr * 16 > BAYER[(x & 3) + (y & 3) * 4] + 0.5 ? C[i + 1] : C[i], p = (y * w + x) * 4; d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2]; d[p + 3] = 255; }
      }
    }), 0, Math.round(y0));
  }
  // Una mancha de un solo color hecha de puntos: fn(x, y) (de 0 a 1 en cada eje) dice qué tan tupida va en cada lugar
  function mancha(clave, c, fn, dx = 0) {
    const img = trama(`m${clave}${c}`, S.FW, S.FH, (d, w, alto) => {
      const C = rgbDe(c);
      for (let y = 0; y < alto; y++) for (let x = 0; x < w; x++) if (fn(x / w, y / alto) * 16 > BAYER[(x & 3) + (y & 3) * 4] + 0.5) { const p = (y * w + x) * 4; d[p] = C[0]; d[p + 1] = C[1]; d[p + 2] = C[2]; d[p + 3] = 255; }
    });
    c2.drawImage(img, -dx, 0); if (dx) c2.drawImage(img, S.FW - dx, 0);
  }
  const PF = { k: "#000010", n1: "#0c0c6c", n2: "#1c1cb4", n3: "#2c64e4", n4: "#5cb0fc", o1: "#e86c10", o2: "#fca44c", b: "#ffffff" };
  const NOCHE_F = [PF.n1, PF.n1, PF.n2, PF.n2, PF.n3], OCASO_F = ["#18084c", "#4c1088", "#a0247c", "#e4505c", "#fc9c4c", "#fcd87c"], ALBA_F = ["#4c1088", "#a0247c", "#e4505c", "#fc9c4c", "#fcd87c", "#fcf4c4"];
  // Las laderas de luz punteada que suben por los dos costados, y las franjas negras de cine
  const laderas = (c) => mancha("lad", c, (x, y) => Math.max(0, (y - 0.12 - Math.min(x, 1 - x) * 1.7) * 1.5));
  const resplandor = (clave, c, cx, cy, r) => mancha(`r${clave}`, c, (x, y) => Math.max(0, 1 - Math.hypot((x - cx) * (S.FW / S.FH), y - cy) / r));
  // Un planeta que gira: una esfera con franjas y una mancha, iluminada desde (lx, ly) y sombreada con trama. La forma
  // se calcula una vez; el dibujo solo se rehace cuando el giro avanza un paso
  const esferas = {};
  function esfera(clave, r, cols, franjas, lx, ly, giro) {
    const w = r * 2 + 1, k = `${clave}|${r}`;
    let P = esferas[k];
    if (!P) {
      const cv = document.createElement("canvas"); cv.width = cv.height = w;
      const x2 = cv.getContext("2d"), lon = new Float32Array(w * w), luz = new Float32Array(w * w), nl = Math.hypot(lx, ly, 0.62);
      for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) { const dx = (x - r) / r, dy = (y - r) / r, q = dx * dx + dy * dy, z = Math.sqrt(Math.max(0, 1 - q)); lon[y * w + x] = q > 1 ? 99 : Math.atan2(dx, z); luz[y * w + x] = Math.max(0, (dx * lx + dy * ly + z * 0.62) / nl) * 0.82 + 0.04; }
      P = esferas[k] = { cv, x2, im: x2.createImageData(w, w), lon, luz, C: cols.map(rgbDe), paso: null };
    }
    const paso = Math.round(giro / 0.04);
    if (paso !== P.paso) {
      P.paso = paso;
      const g = paso * 0.04, d = P.im.data, n = P.C.length - 1;
      for (let y = 0; y < w; y++) {
        const dy = (y - r) / r;
        for (let x = 0; x < w; x++) {
          const i = y * w + x, lo = P.lon[i];
          if (lo === 99) continue;
          const L = lo + g, dl = (((L - 1) % TAU) + TAU) % TAU - Math.PI;
          const v = Math.max(0, Math.min(0.999, P.luz[i] + Math.sin(dy * franjas + Math.sin(L * 3 + dy * 4) * 0.9) * 0.12 + Math.sin(L * 2 + dy * 2.5) * Math.cos(dy * 3 + L) * 0.1 + Math.exp(-(dl * dl * 5 + (dy - 0.3) * (dy - 0.3) * 28)) * 0.3)) * n, j = Math.floor(v);
          const c = (v - j) * 16 > BAYER[(x & 3) + (y & 3) * 4] + 0.5 ? P.C[j + 1] : P.C[j], p = i * 4;
          d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2]; d[p + 3] = 255;
        }
      }
      P.x2.putImageData(P.im, 0, 0);
    }
    return P.cv;
  }
  // El anillo de un planeta, por columnas: la mitad de atrás (antes de pintar el planeta) o la de delante (después)
  function anilloDe(px, py, r, frente, cIn, cOut, cInD, cOutD, incl) {
    const a = r * 2.05, b = r * 0.4, ai = r * 1.4, bi = (b * ai) / a, g2 = r < 20 ? 1 : 2;
    for (let dx = -Math.round(a); dx <= a; dx += g2) {
      const yo = b * Math.sqrt(Math.max(0, 1 - (dx / a) ** 2)), yi = Math.abs(dx) < ai ? bi * Math.sqrt(1 - (dx / ai) ** 2) : 0, g = yo - yi, yc = py + dx * incl;
      if (frente) { rc(cIn, px + dx, yc + yi, g2, g * 0.4); rc(cOut, px + dx, yc + yi + g * 0.52, g2, g * 0.48 + 1); }
      else { rc(cInD, px + dx, yc - yi - g * 0.4, g2, g * 0.4); rc(cOutD, px + dx, yc - yo, g2, g * 0.48); }
    }
  }
  // La casetera en reversa. R.casete = [[espera, traba], ...] en segundos, y se repite hasta acabar el tramo: la cinta
  // corre hacia atrás durante la espera y se queda trabada lo que dure la traba. Devuelve si está trabada, cuánto lleva
  // de esa traba (0 a 1) y cuánta cinta ha corrido en total
  function cintaEn(en) {
    const P = S.R.casete && S.R.casete.length ? S.R.casete : [[1, 0.5]], ciclo = P.reduce((s, x) => s + x[0] + x[1], 0), libre = P.reduce((s, x) => s + x[0], 0), n = Math.floor(en / ciclo);
    let x = en - n * ciclo, corrida = n * libre, k = 0;
    for (const [esp, tr] of P) { if (x < esp) return { traba: false, k: 0, corrida: corrida + x, n: n * P.length + k }; corrida += esp; x -= esp; if (x < tr) return { traba: true, k: x / tr, corrida, n: n * P.length + k }; x -= tr; k++; }
    return { traba: false, k: 0, corrida, n: 0 };
  }
  // Un recuerdo: uno de los escenarios del nivel, en chiquito, dentro de un cuadro de la cinta
  function recuerdo(k, x, y, w, hh) {
    c2.save(); c2.beginPath(); c2.rect(x, y, w, hh); c2.clip();
    const X = (f) => x + w * f, Y = (f) => y + hh * f;
    switch (((k % 9) + 9) % 9) {
      case 0: rc("#4c1088", x, y, w, hh); rc("#e4505c", x, Y(0.3), w, hh); rc("#fc9c4c", x, Y(0.55), w, hh); disco("#fcf4c4", X(0.5), Y(0.8), hh * 0.32); rc("#18084c", x, Y(0.8), w, hh); break;
      case 1: rc("#0c0c6c", x, y, w, hh); for (let i = 0; i < 6; i++) { const a = hh * (0.25 + h(i + 0.3) * 0.4); rc("#000010", X(i / 6), Y(0.75) - a, w / 6 + 1, a); rc("#fca44c", X(i / 6) + 2, Y(0.75) - a + 2, 1, 1); } rc("#1c1cb4", x, Y(0.75), w, hh); for (let i = 0; i < 4; i++) rc("#fcd87c", X(0.1 + i * 0.25), Y(0.87), w * 0.1, 1); break;
      case 2: rc("#18084c", x, y, w, hh); rc("#000010", X(0.38), Y(0.1), w * 0.24, hh); for (let j = 0; j < 5; j++) rc(j % 2 ? "#00f6ff" : "#ff3fb4", X(0.42), Y(0.18 + j * 0.16), w * 0.16, 1); poligono("#fcd87c", 0.4, [[X(0.1), Y(1)], [X(0.3), y], [X(0.42), y]]); poligono("#00f6ff", 0.4, [[X(0.9), Y(1)], [X(0.7), y], [X(0.58), y]]); break;
      case 3: rc("#000010", x, y, w, hh); for (let j = 0; j < 3; j++) for (let i = 0; i < 5; i++) rc(["#ff3fb4", "#00f6ff", "#ffe14a", "#7dff3c"][(i + j * 2) % 4], X(0.08 + i * 0.18), Y(0.15 + j * 0.28), w * 0.11, hh * 0.16); break;
      case 4: rc("#2c3c54", x, y, w, hh); disco("#8f93a8", X(0.3), Y(0.55), hh * 0.3); disco("#2c3c54", X(0.3), Y(0.55), hh * 0.12); aro("#8f93a8", X(0.3), Y(0.55), hh * 0.36, 8, 0.3, 2); rc("#c9c6b8", X(0.62), y, w * 0.2, hh * 0.6); rc("#ffe14a", X(0.58), Y(0.6), w * 0.28, 2); rc("#14141f", x, Y(0.88), w, hh); break;
      case 5: rc("#12052a", x, y, w, hh); for (let i = 0; i < 6; i++) { const a = hh * (0.35 + h(i + 0.5) * 0.5), c = ["#7dff3c", "#c084ff", "#5cb0fc"][i % 3]; poligono(c, 1, [[X(i / 6), Y(1)], [X((i + 0.5) / 6), Y(1) - a], [X((i + 1) / 6), Y(1)]]); poligono("#ffe14a", 1, [[X((i + 0.3) / 6), Y(1)], [X((i + 0.5) / 6), Y(1) - a * 0.4], [X((i + 0.7) / 6), Y(1)]]); } break;
      case 6: rc("#a0247c", x, y, w, hh); for (let i = 0; i < 9; i++) { const a = hh * (0.2 + h(i + 0.1) * 0.5); rc(i % 2 ? "#00f6ff" : "#ffe14a", X(i / 9) + 1, Y(0.85) - a, w / 9 - 1, a); } rc("#05020f", X(0.4), Y(0.3), w * 0.2, hh); rc("#05020f", X(0.44), Y(0.12), w * 0.12, hh * 0.2); rc("#05020f", X(0.2), Y(0.7), w * 0.6, hh); break;
      case 7: rc("#05031c", x, y, w, hh); for (let i = 0; i < 9; i++) rc("#ffffff", X(h(i + 0.2)), Y(h(i + 0.7)), 1, 1); disco("#fc9c4c", X(0.45), Y(0.5), hh * 0.26); rc("#e4505c", X(0.45) - hh * 0.26, Y(0.45), hh * 0.52, 1); rc("#b8a8ff", X(0.45) - hh * 0.48, Y(0.56), hh * 0.96, 2); disco("#3cb4e4", X(0.85), Y(0.25), hh * 0.1); break;
      default: rc("#0c0634", x, y, w, hh); disco("#e4505c", X(0.25), Y(0.3), hh * 0.2); rc("#b8a8ff", X(0.25) - hh * 0.36, Y(0.33), hh * 0.72, 1); rc("#a8a4c4", x, Y(0.65), w, hh); rc("#e8e4f4", x, Y(0.65), w, 1); for (let i = 0; i < 3; i++) rc("#3c3864", X(0.15 + i * 0.3), Y(0.76 + (i % 2) * 0.1), w * 0.14, 2);
    }
    c2.restore();
  }
  // LA CASETERA: el casete, con la cinta de fuera. La cinta principal cruza la pantalla y en cada cuadro trae un recuerdo
  // (los escenarios del nivel); corre en reversa y se traba. Detrás, una red de cintas que nunca deja de moverse
  function casetera(e) {
    const en = Math.max(0, S.ts - e.sec[0]), K = RM ? { traba: false, k: 0, corrida: en, n: 0 } : cintaEn(en), tr = K.traba, u = Math.max(2, Math.round(Math.min(S.FW / 150, S.FH / 84))), mov = RM ? 2 : S.ts;
    const FONDO = tr ? "#8cb040" : "#a8c850", SOMBRA = tr ? "#6c9030" : "#8cb040", AZUL = "#4c7cac", MARINO = "#1c2444", CREMA = "#f4e4a4";
    rc(FONDO, 0, 0, S.FW, S.FH);
    for (let i = 0; i < 40; i++) rc(SOMBRA, h(i + 0.1) * S.FW, h(i + 0.6) * S.FH, 3 * u * (1 + (i % 3)), u);
    // La red de cintas del fondo: cada una ondula y corre a su aire, con sus marcas que avanzan
    for (let i = 0; i < 9; i++) {
      const base = S.FH * (0.08 + h(i + 0.3) * 0.84), pend = (h(i + 0.7) - 0.5) * 0.9, f = 0.012 + h(i + 0.2) * 0.02, v = (0.8 + h(i + 0.5) * 1.6) * (i % 2 ? 1 : -1), A = S.FH * (0.03 + h(i + 0.9) * 0.08), g = 2 + (i % 3), vel = (30 + h(i + 0.4) * 50) * (i % 2 ? 1 : -1);
      for (let x = 0; x < S.FW; x += 2) { const y = base + (x - S.FW / 2) * pend + Math.sin(x * f + mov * v + i) * A; rc(SOMBRA, x - 2, y + 3, 2, g); rc((((x + mov * vel) % 16) + 16) % 16 < 3 ? "#7ca4cc" : AZUL, x, y, 2, g); }
    }
    // El casete, arriba, del que cuelga la cinta: se va quedando atrás mientras seguimos la cinta
    const kw = 46 * u, kh = 29 * u, kx = Math.round(S.FW * 0.07 - en * S.FW * 0.035), ky = Math.round(S.FH * 0.12), yC = Math.round(e.cy), bh = Math.round(Math.min(S.FH * 0.22, 26 * u)), onda = (x) => Math.round(Math.sin(x * 0.011 + mov * 0.9) * S.FH * 0.035);
    for (const fx0 of [12, 33]) for (let y = ky + kh - u; y < yC + onda(kx + fx0 * u) - bh / 2; y += 2) rc(AZUL, kx + fx0 * u + Math.round(Math.sin(y * 0.07 + mov * 2 + fx0) * 2 * u), y, 3 * u, 2);
    rc(SOMBRA, kx - 2 * u, ky + 2 * u, kw, kh); rc(MARINO, kx, ky, kw, kh);
    rc(CREMA, kx + 3 * u, ky + 3 * u, kw - 6 * u, 16 * u); rc("#fcf4c4", kx + 4 * u, ky + 2 * u, kw - 8 * u, u); rc("#b4bc50", kx + 3 * u, ky + 7 * u, kw - 6 * u, 9 * u); rc(AZUL, kx + 3 * u, ky + 16 * u, kw - 6 * u, 4 * u);
    rc(MARINO, kx + 9 * u, ky + 8 * u, 24 * u, 7 * u); rc(AZUL, kx + 18 * u, ky + 9 * u, 3 * u, 5 * u); rc("#58a040", kx + 21 * u, ky + 9 * u, 3 * u, 5 * u);
    for (const d of [0, 1]) { const rx = kx + (13 + d * 16) * u, ry = ky + 11 * u + (u >> 1), g = -K.corrida * 6 + (tr ? Math.sin(S.t * 2.1) * 0.15 : 0); disco("#58a040", rx, ry, 2 * u + (u >> 1)); for (let i = 0; i < 4; i++) rc(MARINO, rx + Math.cos(g + i * TAU / 4) * 2 * u - (u >> 1), ry + Math.sin(g + i * TAU / 4) * 2 * u - (u >> 1), u, u); }
    (FUENTE.B || []).forEach((f, j) => { for (let q = 0; q < 3; q++) if (f[q] === "1") rc(CREMA, kx + (36 + q) * u, ky + (9 + j) * u, u, u); });
    rc("#141a34", kx + 10 * u, ky + 22 * u, 26 * u, 6 * u); for (let i = 0; i < 5; i++) rc(i === 2 ? "#e08c4c" : "#58a040", kx + (13 + i * 5) * u, ky + 25 * u, u, u);
    for (const [ax, ay] of [[1, 1], [44, 1], [1, 27], [44, 27]]) rc("#e08c4c", kx + ax * u, ky + ay * u, u, u);
    // La cinta principal: cuadros con recuerdos que corren hacia atrás (y se frenan cuando se traba)
    const fw = Math.round(bh * 1.45), corre = K.corrida * 110 + (tr ? Math.sin(S.t * 1.9) * 2 : 0), k0 = Math.floor(-corre / fw) - 1;
    for (let k = k0; (k - k0 - 2) * fw < S.FW; k++) {
      const x = Math.round(k * fw + corre), y = yC + onda(x) - (bh >> 1);
      rc(SOMBRA, x - 2 * u, y + 2 * u, fw, bh); rc(MARINO, x, y, fw, bh); rc(AZUL, x, y + u, fw, u); rc(AZUL, x, y + bh - 2 * u, fw, u);
      for (let i = 0; i < 4; i++) { rc(FONDO, x + Math.round((i + 0.3) * fw / 4), y + 3 * u, 2 * u, u); rc(FONDO, x + Math.round((i + 0.3) * fw / 4), y + bh - 4 * u, 2 * u, u); }
      recuerdo(k, x + 2 * u, y + 5 * u, fw - 4 * u, bh - 10 * u);
      if (tr) { c2.globalAlpha = 0.35; rc("#ff3fb4", x + 2 * u, y + 5 * u, fw - 4 * u, bh - 10 * u); c2.globalAlpha = 1; }
    }
    // La señal de reversa, y trabada: la imagen se corre en tiras y cruzan rayas de mala señal
    if (!tr || (S.t >> 1) % 2) for (let k = 0; k < 2; k++) for (let i = 0; i < 4; i++) rc(tr ? "#ff3fb4" : MARINO, S.FW - 16 * u + k * 5 * u + i * u, Math.round(S.FH * 0.14) + (3 - i) * u, u, (i * 2 + 1) * u);
    if (tr) { tiras(7, 18, K.n * 5.3 + (S.t >> 2)); for (let i = 0; i < 4; i++) { c2.globalAlpha = 0.5; rc(i % 2 ? "#ffffff" : "#ff3fb4", 0, h(K.n + i + (S.t >> 2) * 0.3) * S.FH, S.FW, 1 + (i % 2)); c2.globalAlpha = 1; } }
    cine();
  }
  // Una piedra del anillo: un bulto irregular, con luz de un lado, sombra del otro y algún cráter. Se pinta una vez
  const piedra = (v) => trama(`pd${v}`, 25, 25, (d, w) => {
    const C = ["#1c1420", "#4c3c44", "#8c7c74", "#c4b49c", "#f4e8cc"].map(rgbDe);
    for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
      const dx = (x - 12) / 12, dy = (y - 12) / 12, a = Math.atan2(dy, dx), r = Math.hypot(dx, dy), tope = 0.7 + 0.16 * Math.sin(a * 3 + v * 2) + 0.1 * Math.sin(a * 5 + v * 5) + 0.05 * Math.sin(a * 9 + v);
      if (r > tope) continue;
      const hoyo = Math.hypot(dx - 0.2 * Math.cos(v * 3), dy - 0.2 * Math.sin(v * 3)) < 0.2 ? -0.3 : 0, q = Math.max(0, Math.min(0.999, 0.5 - (dx + dy) * 0.42 + hoyo + (h(x * 3.1 + y * 7.3 + v) - 0.5) * 0.18)) * 4, i = Math.floor(q);
      const c = (q - i) * 16 > BAYER[(x & 3) + (y & 3) * 4] + 0.5 ? C[i + 1] : C[i], p = (y * w + x) * 4;
      d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2]; d[p + 3] = 255;
    }
  });
  // EL CINTURON: caminando sobre el anillo de un planeta gigante. El anillo es el suelo: sus franjas corren hacia el
  // horizonte, donde asoma el planeta, girando; las piedras y los trozos de hielo vienen hacia nosotros a cada paso
  function cinturon(e) {
    const mov = RM ? 3 : Math.max(0, S.ts - e.sec[0]), paso = RM ? 0 : Math.round(Math.abs(Math.sin(S.ts * Math.PI * 2)) * 2), yH = Math.round(Math.min(S.FH * 0.62, S.gy + S.H * 0.6)) + paso, cx = Math.round(S.FW / 2 + (RM ? 0 : Math.sin(S.ts * Math.PI) * 2)), r = Math.round(S.FH * 0.23);
    cieloTramado(["#02010c", "#05031c", "#0a0630", "#141048", "#241a5c"], 0, yH);
    mancha("neb2", "#0c5c8c", (x, y) => Math.max(0, Math.sin(x * 3.1 + 2 + Math.sin(y * 5 + 1) * 1.2) * Math.sin(y * 5 - x * 3) - 0.45) * 0.8);
    mancha("neb3", "#a0247c", (x, y) => Math.max(0, Math.sin(x * 4 - 1 + Math.sin(y * 6 + 2)) * Math.sin(y * 3.3 + x * 4 + 1) - 0.6) * 0.9);
    for (let i = 0; i < 80; i++) if (RM || ((S.t >> 3) + i) % 9) rc(["#ffffff", "#ffd8a8", "#b8a8ff", "#7cf4ff"][i % 4], h(i + 0.1) * S.FW, h(i + 0.6) * yH, 1, 1);
    // Otro anillo, lejano, que cruza el cielo en arco, y dos lunas
    for (let x = 0; x < S.FW; x += 2) { const f = x / S.FW - 0.5, y = S.FH * 0.12 + f * f * S.FH * 0.5; rc("#5c4ca8", x, y, 2, 2); rc("#b8a8ff", x, y + 3, 2, 1); if ((x + Math.floor(mov * 20)) % 9 < 2) rc("#ffffff", x, y + 1, 1, 1); }
    disco("#8c8ca8", Math.round(S.FW * 0.14), Math.round(S.FH * 0.3), 5); disco("#e8e4f4", Math.round(S.FW * 0.14) - 1, Math.round(S.FH * 0.3) - 1, 3); disco("#e4505c", Math.round(S.FW * 0.9), Math.round(S.FH * 0.2), 3);
    // El planeta gigante sale por el horizonte, girando (se pinta a la mitad de tamaño y se agranda: sale más pixelado)
    c2.drawImage(esfera("cin", r, ["#04142c", "#0c3c6c", "#1c7c9c", "#4cc4b4", "#a4f4c4", "#f4fff0"], 13, -0.5, -0.5, mov * 0.25), cx - r * 2, yH - Math.round(r * 2.9), r * 4 + 2, r * 4 + 2);
    // El suelo: las franjas del anillo, que se juntan en el horizonte
    rc("#1c1830", 0, yH, S.FW, S.FH - yH);
    const F = [["#3c3454", -1.9, -1.2], ["#c4b49c", -1.2, -0.75], ["#f4e8cc", -0.75, -0.6], ["#8c7c74", -0.6, -0.12], ["#e8dcc0", -0.12, 0.3], ["#1c1830", 0.3, 0.42], ["#c4b49c", 0.42, 0.95], ["#6c5c64", 0.95, 1.35], ["#f4e8cc", 1.35, 1.5], ["#3c3454", 1.5, 2.2]];
    for (const [c, a, b] of F) poligono(c, 1, [[cx + a * 4, yH], [cx + b * 4, yH], [cx + b * S.FW * 0.62, S.FH], [cx + a * S.FW * 0.62, S.FH]]);
    // Rayas que cruzan el suelo y se acercan con cada paso; más oscuro al fondo
    for (let i = 0; i < 9; i++) { const p = ((i + mov * 1.6) % 9) / 9, y = yH + p * p * (S.FH - yH); c2.globalAlpha = 0.25; rc("#1c1830", 0, y, S.FW, 1 + p * 2); c2.globalAlpha = 1; }
    for (let i = 0; i < 5; i++) { c2.globalAlpha = 0.5 - i * 0.1; rc("#05031c", 0, yH + i * 3, S.FW, 3); c2.globalAlpha = 1; }
    rc("#f4fff0", 0, yH, S.FW, 1);
    // Piedras y trozos de hielo sobre el anillo
    const lista = [];
    for (let i = 0; i < 26; i++) { const f = mov * 0.42 + h(i + 0.4), n = Math.floor(f); lista.push({ i, p: f - n, l: (h(i * 1.3 + n * 5.1) - 0.5) * 2.4 }); }
    lista.sort((u, v) => u.p - v.p);
    for (const { i, p, l } of lista) {
      const q = p * p, y = yH + q * (S.FH - yH) * 1.05, x = cx + l * (4 + q * S.FW * 0.62), lado = Math.max(2, Math.round(2 + q * S.FH * 0.16 * (0.5 + h(i))));
      if (i % 3 === 0) { rc("#7cf4ff", x - lado / 2, y - lado * 0.7, lado * 0.7, lado * 0.7); rc("#ffffff", x - lado / 2, y - lado * 0.7, lado * 0.7, 1); rc("#2c6480", x - lado / 2, y - 1, lado * 0.7, 1); }
      else c2.drawImage(piedra(i % 5), Math.round(x - lado / 2), Math.round(y - lado * 0.8), lado, lado);
    }
    // Destellos del hielo, con el golpe
    if (!RM) for (let i = 0; i < 16; i++) { const k = i + S.golpeN * 0.37; if (h(k) > 0.6) { const x = Math.round(h(k + 0.2) * S.FW), y = Math.round(yH + 4 + h(k + 0.6) * (S.FH - yH) * 0.7); rc("#ffffff", x - 2, y, 5, 1); rc("#ffffff", x, y - 2, 1, 5); } }
    cine();
  }
  // MULTIVERSO: un túnel de universos. Marcos de colores, cada uno con su forma, nacen al fondo, crecen girando y nos
  // pasan de largo; entre ellos flotan ventanas a otros mundos (los escenarios del nivel) y, al fondo de todo, 2018.
  // R.apagon = [tramo, segundos]: en los últimos segundos los marcos se apagan uno a uno y todo queda a oscuras
  function multiverso(e) {
    const en = Math.max(0, S.ts - e.sec[0]), mov = RM ? 5 : en, dur = e.sec[1] - e.sec[0], AP = S.R.apagon ? S.R.apagon[1] : 7, osc = Math.max(0, Math.min(1, (en - (dur - AP)) / AP));
    const PAL = ["#ff8ad8", "#7cf4ff", "#ffe14a", "#b48cff", "#7dffb4", "#ffb06c", "#5cb0fc"], LADOS = [4, 6, 3, 5, 8, 4, 6], N = 9, vel = 0.2, diag = Math.hypot(S.FW, S.FH);
    const cx = e.cx + (RM ? 0 : Math.sin(mov * 0.7) * S.FW * 0.03), cy = e.cy + (RM ? 0 : Math.cos(mov * 0.9) * S.FH * 0.03), mod = (a, b) => ((a % b) + b) % b;
    const marcos = [];
    for (let k = 0; k < N; k++) { const f = mov * vel + k / N, n = Math.floor(f); marcos.push({ p: f - n, B: n * N - k }); }
    marcos.sort((u, v) => v.p - u.p);
    const tono = (B) => (h(B * 0.77) < osc * 1.2 ? "#0a0618" : PAL[mod(B, PAL.length)]);
    rc(tono(marcos[0].B - 1), 0, 0, S.FW, S.FH);
    for (const { p, B } of marcos) {
      const r = (0.025 + Math.pow(p, 2.3) * 0.95) * diag, n = LADOS[mod(B, LADOS.length)], a0 = (RM ? 0 : mov * 0.35 * (mod(B, 2) ? 1 : -1)) + B * 0.9, pts = [];
      for (let i = 0; i < n; i++) { const a = a0 + (i / n) * TAU; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.8]); }
      poligono(tono(B), 1, pts);
      c2.strokeStyle = h(B * 0.77) < osc * 1.2 ? "#2a2440" : "#ffffff"; c2.lineWidth = p > 0.5 ? 2 : 1; c2.beginPath(); pts.forEach(([x, y], i) => (i ? c2.lineTo(x, y) : c2.moveTo(x, y))); c2.closePath(); c2.stroke();
      // Cada marco trae su adorno: rayas hacia el centro desde las esquinas
      if (p > 0.25) { c2.globalAlpha = 0.5; for (const [x, y] of pts) linea("#ffffff", x, y, cx + (x - cx) * 0.86, cy + (y - cy) * 0.86); c2.globalAlpha = 1; }
    }
    c2.lineWidth = 1;
    // Una trama de puntos blancos encima, para que los colores no queden planos
    mancha("mvT", "#ffffff", (x, y) => Math.max(0, Math.sin(x * TAU * 3 + Math.sin(y * 9) * 1.4) * Math.sin(y * 7 + Math.sin(x * TAU * 2) * 2) - 0.3) * 0.5, Math.round(mod(mov * 18, S.FW)));
    // 2018, al fondo del túnel
    { const b = Math.max(2, Math.round(S.FH * 0.035 * (1 + (RM ? 0 : S.pulso * 0.15)))), x0 = Math.round(cx - 7.5 * b), y0 = Math.round(cy - 2.5 * b);
      for (const [c, o] of [["#1c0634", Math.max(1, b >> 1)], ["#ffffff", 0]]) { c2.globalAlpha = (o ? 0.6 : 0.95) * (1 - osc); [..."2018"].forEach((ch, q) => (FUENTE[ch] || []).forEach((f, j) => { for (let k = 0; k < 3; k++) if (f[k] === "1") rc(c, x0 + q * 4 * b + k * b + o, y0 + j * b + o, b, b); })); }
      c2.globalAlpha = 1; }
    // Las ventanas a otros mundos: salen del fondo y se nos vienen encima, cada una hacia un lado
    const vent = [];
    for (let i = 0; i < 7; i++) { const f = mov * 0.17 + i / 7, n = Math.floor(f); vent.push({ i, n, p: f - n, a: h(i * 2.3 + n * 4.1) * TAU }); }
    vent.sort((u, v) => u.p - v.p);
    const cerca = vent[vent.length - 1].i;
    for (const { i, n, p, a } of vent) {
      if (p < 0.08 || h(i + n * 1.9) < osc * 1.3) continue;
      const w = Math.round(6 + Math.pow(p, 2.4) * S.FW * 0.3), hh = Math.round(w * 0.66), d = Math.pow(p, 1.8) * diag * 0.62, x = Math.round(cx + Math.cos(a) * d - w / 2), y = Math.round(cy + Math.sin(a) * d * 0.75 - hh / 2);
      rc("#05020f", x - 2, y - 2, w + 4, hh + 4); rc("#ffffff", x - 1, y - 1, w + 2, hh + 2);
      // La ventana que ya viene más cerca deja ver un mundo de verdad (un escenario de este nivel o de los anteriores,
      // la órbita o el pasillo de puertas); las demás, un recuerdo en chiquito
      if (i === cerca) mundoPuerta(i + n * 3, e, x, y, w, hh, 0, 0); else recuerdo(i + n * 3, x, y, w, hh);
    }
    if (!RM) for (let i = 0; i < 26; i++) { const q = i + S.golpeN * 0.37; if (h(q) < 0.5 + osc * 0.5) continue; const x = Math.round(h(q + 0.2) * S.FW), y = Math.round(h(q + 0.6) * S.FH), s = 1 + Math.round(S.pulso * 2); rc("#ffffff", x - s, y, s * 2 + 1, 1); rc("#ffffff", x, y - s, 1, s * 2 + 1); }
    // El apagón
    if (osc > 0) { c2.globalAlpha = Math.min(1, osc * 1.05); rc("#000000", 0, 0, S.FW, S.FH); c2.globalAlpha = 1; }
    cine();
  }
  // EN ORBITA (ya no es un tramo: sale como uno de los mundos del multiverso y en los flashazos del arcade): el planeta
  // al centro y su anillo dando vueltas alrededor de la terminal. anilloOrbita pinta una mitad del
  // anillo (la de atrás o la de delante) con sus piedras; la de delante se pinta además dentro de la terminal (dibuja()),
  // para que el anillo le pase por enfrente
  function anilloOrbita(pone, frente) {
    const cx = S.gx + S.W / 2, cy = S.gy + S.H * 0.46, r = Math.round(S.FH * 0.2), a = Math.min(S.FW * 0.49, r * 3.1), b = a * 0.3, incl = -0.12, giro = RM ? 0 : S.ts * 0.45, paso = 1.3 / a;
    const BANDAS = [[1, "#5c4ca8"], [0.96, "#b8a8ff"], [0.9, "#fcd87c"], [0.84, "#fce8a4"], [0.76, "#a0782c"], [0.7, "#fcd87c"]];
    for (let q = frente ? 0 : Math.PI; q < (frente ? Math.PI : TAU); q += paso) {
      const co = Math.cos(q), si = Math.sin(q);
      for (const [f, c] of BANDAS) { if (h(Math.floor((q + giro * (1.3 - f * 0.4)) * 40) * 0.37 + f) < 0.2) continue; pone(S.pulso > 0.6 && f === 0.84 ? "#ffffff" : c, cx + co * a * f, cy + si * b * f + co * a * f * incl, 2, 2); }
    }
    for (let i = 0; i < 16; i++) {
      const q = (h(i + 0.2) * TAU + giro * (0.8 + h(i) * 0.7)) % TAU, f = 0.7 + h(i + 0.5) * 0.34;
      if (Math.sin(q) > 0 !== frente) continue;
      const g = Math.max(2, Math.round((3 + h(i + 0.8) * 5) * (0.7 + Math.sin(q) * 0.3))), x = cx + Math.cos(q) * a * f - g / 2, y = cy + Math.sin(q) * b * f + Math.cos(q) * a * f * incl - g / 2;
      if (i % 4 === 0) { pone("#7cf4ff", x, y, g, g); pone("#ffffff", x, y, g, 1); } else { pone("#8c7c74", x, y, g, g); pone("#f4e8cc", x, y, g, 1); pone("#4c3c44", x, y + g - 1, g, 1); }
    }
  }
  function orbita(e) {
    const mov = RM ? 3 : Math.max(0, S.ts - e.sec[0]), cx = Math.round(S.gx + S.W / 2), cy = Math.round(S.gy + S.H * 0.46), r = Math.round(S.FH * 0.2), diag = Math.hypot(S.FW, S.FH);
    cieloTramado(["#02010c", "#0a0630", "#141048", "#0a0630", "#02010c"], 0, S.FH);
    mancha("neb2", "#0c5c8c", (x, y) => Math.max(0, Math.sin(x * 3.1 + 2 + Math.sin(y * 5 + 1) * 1.2) * Math.sin(y * 5 - x * 3) - 0.45) * 0.8);
    mancha("neb3", "#a0247c", (x, y) => Math.max(0, Math.sin(x * 4 - 1 + Math.sin(y * 6 + 2)) * Math.sin(y * 3.3 + x * 4 + 1) - 0.6) * 0.9);
    // Las estrellas giran con nosotros: cada una deja un rastro corto
    for (let i = 0; i < 110; i++) { const a0 = h(i) * TAU + mov * 0.07, d = 14 + h(i + 0.4) * diag * 0.62, c = ["#ffffff", "#b8a8ff", "#7cf4ff", "#ffd8a8"][i % 4]; for (let k = 0; k < (RM ? 1 : 4); k++) rc(c, cx + Math.cos(a0 - k * 0.008) * d, cy + Math.sin(a0 - k * 0.008) * d * 0.7, 1, 1); }
    // Dos lunas en sus órbitas: una ancha y lenta, otra cerca y rápida
    const lunas = [[1.25, 0.2, "#e8e4f4", "#8c8ca8", 6], [0.52, -0.9, "#7cf4ff", "#2c6480", 3]].map(([f, vel, c1, c2b, g], i) => { const q = mov * vel + i * 2, a = Math.min(S.FW * 0.49, r * 3.1); return { q, x: cx + Math.cos(q) * a * f, y: cy + Math.sin(q) * a * 0.3 * f + Math.cos(q) * a * f * 0.1, c1, c2b, g }; });
    const luna = (l) => { disco(l.c2b, Math.round(l.x), Math.round(l.y), l.g); disco(l.c1, Math.round(l.x) - 1, Math.round(l.y) - 1, l.g - 2); };
    lunas.filter((l) => Math.sin(l.q) <= 0).forEach(luna);
    anilloOrbita(rc, false);
    const m = Math.max(4, r >> 1);
    c2.drawImage(esfera("orb", m, ["#1c0638", "#4c1088", "#a0247c", "#e4505c", "#fc9c4c", "#fcd87c", "#fff4c4"], 11, -0.5, -0.45, mov * 0.3), cx - m * 2, cy - m * 2, m * 4 + 2, m * 4 + 2);
    anilloOrbita(rc, true);
    lunas.filter((l) => Math.sin(l.q) > 0).forEach(luna);
    // Un cometa de vez en cuando
    if (!RM) { const n = Math.floor(S.ts / 3.1), p = (S.ts / 3.1 - n) / 0.3; if (p < 1) { const x = S.FW * (0.1 + h(n + 0.3) * 0.8) + p * S.FW * 0.2, y = S.FH * (0.12 + h(n + 0.7) * 0.2) + p * S.FH * 0.1; linea("#7a3fc0", x - 26, y - 12, x - 14, y - 6.5); linea("#7cf4ff", x - 14, y - 6.5, x - 5, y - 2.3); linea("#ffffff", x - 5, y - 2.3, x, y); rc("#ffffff", x - 1, y - 1, 3, 3); } }
    cine();
  }
  // EL PASILLO DE PUERTAS (ya no es un tramo: sale como uno de los mundos del multiverso y en los flashazos del arcade).
  // Al fondo viene una puerta grande que deja ver otro mundo (un escenario de
  // este nivel o de los anteriores); crece hasta que la cruzamos, con un fogonazo, y el pasillo cambia de colores: ya
  // estamos en otro universo. A los lados pasan más puertas, y 2018 brilla sobre el horizonte.
  // R.puertas = segundos entre puerta y puerta · R.apagon = [tramo, segundos]: al final las puertas se cierran y se apaga todo
  const PORTALES = () => [[ESCENAS, 1], [ESCENAS_G, 1], [ESCENAS_F, 6], [ESCENAS, 2], [ESCENAS_G, 2], [ESCENAS, 6], [ESCENAS_F, 9], [ESCENAS_G, 5], [ESCENAS, 7], [ESCENAS_F, 2], [ESCENAS_F, 14], [ESCENAS_F, 15]];
  const portalMal = {};
  S.portalHondo = 0;
  function mundoPuerta(k, e, x, y, w, hh, dx, dy) {
    const L = PORTALES(), i = ((k % L.length) + L.length) % L.length;
    // Un mundo dentro de otro mundo no: ahí va un recuerdo
    if (portalMal[i] || S.portalHondo) { recuerdo(k, x, y, w, hh); return; }
    S.portalHondo++;
    c2.save(); c2.beginPath(); c2.rect(x, y, w, hh); c2.clip(); c2.translate(dx, dy);
    // Si el escenario de otro nivel no se deja pintar aquí, esa puerta enseña un recuerdo en chiquito y ya no se intenta más
    try { L[i][0][L[i][1]]({ cx: e.cx, cy: e.cy, suelo: e.suelo, sec: S.R.sec[Math.min(L[i][1], S.R.sec.length - 1)] }); c2.restore(); }
    catch (err) { portalMal[i] = 1; for (let n = 0; n < 6; n++) c2.restore(); }
    S.portalHondo--;
    c2.globalAlpha = 1; c2.globalCompositeOperation = "source-over";
  }
  function pasillo(e) {
    const en = Math.abs(S.ts - e.sec[0]), osc = 0, T = S.R.puertas || 3;
    const mov = RM ? T * 0.55 : en, f = mov / T, n = Math.floor(f), p = f - n, mod = (a, b) => ((a % b) + b) % b;
    const U = [{ cielo: ["#05020f", "#18084c", "#4c1088", "#a0247c", "#ff8ad8"], rej: "#ff3fb4", piso: "#0c0634", neon: "#7cf4ff", rgb: "124,244,255" },
      { cielo: ["#010c0c", "#04282c", "#0c5c5c", "#1c9c8c", "#7dffb4"], rej: "#7dff3c", piso: "#021414", neon: "#ffe14a", rgb: "255,225,74" },
      { cielo: ["#0c0402", "#3c1408", "#8c2c10", "#e4701c", "#ffe14a"], rej: "#ffb000", piso: "#1c0804", neon: "#ff3fb4", rgb: "255,63,180" },
      { cielo: ["#02041c", "#081c5c", "#1c4cc4", "#5cb0fc", "#d8f4ff"], rej: "#7cf4ff", piso: "#040a2c", neon: "#ffffff", rgb: "255,255,255" },
      { cielo: ["#0c0208", "#3c0418", "#8c0c2c", "#e4245c", "#ffb0c4"], rej: "#ff5a4a", piso: "#14040c", neon: "#7dff3c", rgb: "125,255,60" }][mod(n, 5)];
    const yH = Math.round(Math.min(S.FH * 0.64, S.gy + S.H * 0.62)), cx = Math.round(e.cx), bajo = S.FH - yH;
    cieloTramado(U.cielo, 0, yH);
    for (let i = 0; i < 70; i++) if (RM || ((S.t >> 3) + i) % 7) rc(i % 3 ? "#ffffff" : U.neon, h(i + 0.1 + n) * S.FW, h(i + 0.6 + n) * yH, 1, 1);
    // Rayos que giran desde la puerta del fondo, y cintas de luz que ondulan en el cielo
    for (let i = 0; i < 14; i++) { const a = (RM ? 0 : en * 0.3) + (i * TAU) / 14, L = S.FW + S.FH; poligono(i % 2 ? "#ffffff" : U.neon, 0.07 + (RM ? 0 : S.pulso * 0.08), [[cx, yH - 4], [cx + Math.cos(a) * L, yH - 4 + Math.sin(a) * L], [cx + Math.cos(a + TAU / 40) * L, yH - 4 + Math.sin(a + TAU / 40) * L]]); }
    for (let k = 0; k < 3; k++) for (let x = 0; x < S.FW; x += 2) { const y = S.FH * (0.16 + k * 0.07) + Math.sin(x * 0.02 + en * (0.8 + k * 0.3) + k * 2) * S.FH * 0.04; c2.globalAlpha = 0.5; rc(k % 2 ? U.rej : U.neon, x, y, 2, 2 + k); c2.globalAlpha = 1; }
    // 2018, enorme, sobre el horizonte: late con el golpe
    { const b = Math.max(3, Math.round(S.FH * 0.06)), x0 = cx - Math.round(7.5 * b), y0 = yH - 7 * b - Math.round(S.pulso * 2);
      for (const [c, o, al] of [["#05020f", Math.max(1, b >> 2), 0.8], [U.neon, 0, 0.9], ["#ffffff", -1, S.pulso * 0.6]]) { c2.globalAlpha = al * (1 - osc); [..."2018"].forEach((ch, q) => (FUENTE[ch] || []).forEach((fl, j) => { for (let k = 0; k < 3; k++) if (fl[k] === "1") rc(c, x0 + q * 4 * b + k * b + o, y0 + j * b + o, b - (o < 0 ? 0 : 1), b - (o < 0 ? 0 : 1)); })); }
      c2.globalAlpha = 1; }
    // El piso: rejilla de neón que corre hacia nosotros, con dos rieles de luz a los lados del pasillo
    rc(U.piso, 0, yH, S.FW, bajo);
    for (let i = 0; i < 10; i++) { const k = ((i + mov * 3.2) % 10) / 10, y = yH + k * k * bajo; rc(U.rej, 0, y, S.FW, k > 0.6 ? 2 : 1); }
    for (let i = -10; i <= 10; i++) linea(U.rej, cx + i * 8, yH, cx + i * S.FW * 0.17, S.FH);
    for (const d of [-1, 1]) { poligono(U.neon, 0.9, [[cx + d * 5, yH], [cx + d * 7, yH], [cx + d * S.FW * 0.46, S.FH], [cx + d * S.FW * 0.4, S.FH]]); poligono("#ffffff", 0.5, [[cx + d * 5.5, yH], [cx + d * 6, yH], [cx + d * S.FW * 0.425, S.FH], [cx + d * S.FW * 0.415, S.FH]]); }
    rc("#ffffff", 0, yH, S.FW, 1);
    // Las puertas de los lados: pasan de largo, cada una con su mundo y su reflejo en el piso
    const lados = [];
    for (let i = 0; i < 8; i++) { const g = mov / 2.6 + i / 8, m = Math.floor(g); lados.push({ i, m, q: g - m }); }
    lados.sort((u, v) => u.q - v.q);
    for (const { i, m, q } of lados) {
      const d = i % 2 ? 1 : -1, w = Math.round(5 + Math.pow(q, 2.4) * S.FW * 0.17), hh = Math.round(w * 1.6), x = Math.round(cx + d * (S.FW * 0.035 + Math.pow(q, 2) * S.FW * 0.6) - w / 2), y = Math.round(yH + Math.pow(q, 2.3) * bajo * 1.15 - hh);
      poligono(U.neon, 0.22, [[x, y + hh], [x + w, y + hh], [x + w * 1.4, y + hh * 1.7], [x - w * 0.4, y + hh * 1.7]]);
      rc("#05020f", x - 2, y - 2, w + 4, hh + 2); rc(mod(i + m, 2) ? U.neon : U.rej, x - 1, y - 1, w + 2, hh + 1);
      if (h(i + m * 1.3) < osc * 1.6) rc("#0a0618", x, y, w, hh); else recuerdo(i + m * 3 + n, x, y, w, hh);
    }
    // La puerta del fondo: crece hasta llenar la pantalla; por ella se ve el mundo siguiente
    const w = Math.round(S.FW * (0.05 + Math.pow(p, 3.2) * 1.6)), hh = Math.round(w * 1.5), base = Math.round(yH + Math.pow(p, 3.2) * bajo * 1.5), x = Math.round(cx - w / 2), y = base - hh, marco = Math.max(1, Math.round(w * 0.035));
    haz(U.rgb, 0.5, cx, w, cx, w * 2.4, base, Math.min(S.FH, base + bajo));
    rc("#05020f", x - marco * 3, y - marco * 3, w + marco * 6, hh + marco * 3); rc(U.neon, x - marco * 2, y - marco * 2, w + marco * 4, hh + marco * 2); rc("#ffffff", x - marco, y - marco, w + marco * 2, hh + marco);
    mundoPuerta(n, e, x, y, w, hh, Math.round((cx - e.cx) * 1), Math.round((y + hh * 0.5 - e.cy) * (1 - Math.min(1, w / S.FW))));
    // En el apagón la puerta se cierra: dos hojas que se juntan en medio
    if (osc > 0) { const c = Math.min(1, osc * 2.2), hoja = Math.ceil((w / 2) * c); rc("#0a0618", x, y, hoja, hh); rc("#0a0618", x + w - hoja, y, hoja, hh); rc("#2a2440", x + hoja - 1, y, 1, hh); rc("#2a2440", x + w - hoja, y, 1, hh); }
    // Chispas que salen de la puerta, y destellos con el golpe
    if (!RM && osc < 0.5) for (let i = 0; i < 26; i++) { const g = (h(i + 0.3) + en * (0.5 + h(i) * 0.8)) % 1, a = h(i + n * 0.7) * TAU, d = w * 0.5 + g * S.FW * 0.4, px = cx + Math.cos(a) * d, py = y + hh / 2 + Math.sin(a) * d * 0.8; rc(i % 2 ? "#ffffff" : U.neon, px, py, g < 0.5 ? 2 : 1, g < 0.5 ? 2 : 1); }
    if (!RM) for (let i = 0; i < 24; i++) { const q = i + S.golpeN * 0.37; if (h(q) < 0.55 + osc * 0.45) continue; const sx = Math.round(h(q + 0.2) * S.FW), sy = Math.round(h(q + 0.6) * S.FH), s = 1 + Math.round(S.pulso * 2); rc("#ffffff", sx - s, sy, s * 2 + 1, 1); rc("#ffffff", sx, sy - s, 1, s * 2 + 1); }
    // El fogonazo de cruzar la puerta
    if (!RM && n > 0 && osc === 0 && p < 0.09) { c2.globalAlpha = 1 - p / 0.09; rc("#ffffff", 0, 0, S.FW, S.FH); c2.globalAlpha = 1; }
    if (osc > 0) { c2.globalAlpha = Math.min(1, osc * 1.05); rc("#000000", 0, 0, S.FW, S.FH); c2.globalAlpha = 1; }
    cine();
  }
  // La ciudad, recorriéndola: tres filas de edificios que pasan a distinta velocidad, con ventanas amarillas y azules que
  // chispean; brillantina que cae, reflectores, la calle con sus farolas y el reflejo de todo en el piso mojado
  function ciudadPaseo(e) {
    const mov = RM ? 3 : S.ts - e.sec[0], yH = Math.round(Math.min(S.FH * 0.74, S.gy + S.H * 0.72)), AM = "#ffe14a", AZ = "#5cb0fc", tic = RM ? 0 : Math.floor(S.ts * 8);
    cieloTramado(["#020418", "#04083c", "#0c1c7c", "#1c4cc4", "#3c8ce4", "#fcd87c"], 0, yH);
    // La luna amarilla y los reflectores, uno azul y uno amarillo
    disco("#fcd87c", Math.round(S.FW * 0.78), Math.round(S.FH * 0.24), Math.round(S.FH * 0.07)); disco("#fff4c4", Math.round(S.FW * 0.78) - 2, Math.round(S.FH * 0.24) - 2, Math.round(S.FH * 0.055));
    if (!RM) [["255,225,74", 0.2, 0.8, 0], ["92,176,252", 0.42, 1.1, 2], ["255,225,74", 0.63, 0.9, 4], ["92,176,252", 0.86, 1.2, 1]].forEach(([rgb, f, vel, des]) => haz(rgb, 0.3 + S.pulso * 0.2, S.FW * f, 4, S.FW * f + Math.sin(S.ts * vel + des) * S.FW * 0.25, 30, yH, S.FH * 0.09));
    // La brillantina: motas que caen despacio y titilan; con cada golpe, algunas se abren en cruz
    for (let i = 0; i < 90; i++) {
      if (!RM && h(i + tic * 0.61) < 0.4) continue;
      const x = Math.round(((h(i + 0.2) * S.FW + mov * (3 + h(i + 0.4) * 9)) % S.FW)), y = Math.round(S.FH * 0.09 + ((h(i + 0.6) * S.FH + mov * (4 + h(i + 0.8) * 10)) % (yH - S.FH * 0.09))), c = [AM, AZ, "#ffffff", "#7cf4ff", "#fcd87c"][i % 5];
      if (i % 6 === 0 && S.pulso > 0.4) { const g = 1 + Math.round(S.pulso * 2); rc(c, x - g, y, g * 2 + 1, 1); rc(c, x, y - g, 1, g * 2 + 1); } else rc(c, x, y, 1, 1);
    }
    // Las tres filas de edificios, de la más lejana a la más cercana
    for (const [capa, ancho, vel, cuerpo, filo, altoMax, umbral] of [[0, 13, 5, "#0c1c6c", "#1c4cc4", 0.2, 0.82], [1, 19, 13, "#06103c", "#3c8ce4", 0.3, 0.7], [2, 29, 30, "#020418", AZ, 0.42, 0.58]]) {
      const corre = mov * vel, k0 = Math.floor(corre / ancho);
      for (let k = k0; (k - k0 - 1) * ancho < S.FW; k++) {
        const x = Math.round(k * ancho - corre), q = k * 1.37 + capa * 51.3, a = Math.round((0.35 + h(q) * 0.65) * altoMax * yH + (h(q + 0.4) > 0.8 ? altoMax * yH * 0.3 : 0)), y = yH - a;
        rc(cuerpo, x, y, ancho, a); rc(filo, x, y, 1, a); rc(filo, x, y, ancho >> 1, 1);
        if (h(q + 0.4) > 0.8) { rc(cuerpo, x + (ancho >> 1), y - 6, 1, 6); if ((S.t >> 4) % 2) rc(AM, x + (ancho >> 1), y - 7, 1, 1); }
        if (capa && h(q + 0.7) > 0.72) rc(k % 2 ? AM : AZ, x + 3, y + 4, ancho - 6, 2);
        const pasoX = capa === 2 ? 5 : 4, pasoY = capa === 2 ? 6 : 5;
        for (let j = 0; j * pasoY < a - 12; j++) for (let i = 0; (i + 1) * pasoX < ancho - 2; i++) {
          const v = h(q + j * 7.1 + i * 3.3);
          if (v < umbral) continue;
          // Cada ventana es amarilla o azul; de pronto una chispea en blanco, como brillantina
          const chispa = !RM && h(q + j * 1.7 + i * 2.9 + tic * 0.83) > 0.94, wx = x + 3 + i * pasoX, wy = y + 9 + j * pasoY;
          rc(chispa ? "#ffffff" : v * 97 % 1 > 0.45 ? AM : AZ, wx, wy, capa === 2 ? 3 : 2, capa === 2 ? 3 : 2);
          if (chispa && capa) { rc("#ffffff", wx - 2, wy + 1, 7, 1); rc("#ffffff", wx + 1, wy - 2, 1, 7); }
        }
      }
    }
    // El piso mojado: el reflejo de las luces en rayitas que tiemblan, y las líneas de la calle
    cieloTramado(["#0c1c6c", "#06103c", "#020418", "#020418"], yH, S.FH);
    rc(AZ, 0, yH, S.FW, 1);
    for (let i = 0; i < 70; i++) { const x = Math.round(((h(i + 0.3) * S.FW - mov * 30) % S.FW + S.FW) % S.FW), y = yH + 2 + Math.round(h(i + 0.5) * (S.FH - yH) * 0.5), l = 2 + Math.round(h(i + 0.7 + tic * 0.2) * 7); c2.globalAlpha = 0.35 + h(i + tic * 0.4) * 0.5; rc(i % 2 ? AM : AZ, x, y, 1, l); c2.globalAlpha = 1; }
    const yC = Math.round(yH + (S.FH - yH) * 0.62);
    for (let x = -((mov * 90) % 28); x < S.FW; x += 28) rc(AM, x, yC, 14, 2);
    // Las farolas pasan rápido en primer plano, cada una con su charco de luz
    for (let x = -((mov * 90) % 150) + 60; x < S.FW + 40; x += 150) { const X = Math.round(x); haz("255,225,74", 0.45, X + 8, 4, X + 8, 46, yH - 34, yC); rc("#020418", X, yH - 36, 2, yC - yH + 36); rc("#020418", X, yH - 37, 10, 2); rc("#fff4c4", X + 6, yH - 35, 5, 2); }
    cine();
  }
  function cine() { const a = Math.round(S.FH * 0.09); rc("#000000", 0, 0, S.FW, a); rc("#000000", 0, S.FH - a, S.FW, a); }
  // Pocas estrellas: puntos sueltos y alguna en cruz, que titila
  function estrellasF(n, yMax, c) {
    for (let i = 0; i < n; i++) {
      const x = Math.round(h(i + 0.13) * S.FW), y = Math.round(S.FH * 0.1 + h(i + 0.57) * yMax);
      if (i % 5 === 0) { if (RM || (S.t >> 4) % 3 !== i % 3) { rc(c, x - 1, y, 3, 1); rc(c, x, y - 1, 1, 3); } } else rc(c, x, y, 1, 1);
    }
  }
  // La luna, gordita y de orillas a escalón
  function lunaF(x, y, r) { for (let dy = -r; dy <= r; dy++) { const w = Math.min(r, Math.round((r - Math.abs(dy)) * 1.6 + r * 0.45)); rc(PF.b, x - w, y + dy, w * 2, 1); } }
  // El piso en rejilla, con las líneas que se acercan
  function rejilla(c, yH, fondo) {
    rc(fondo, 0, yH, S.FW, S.FH - yH);
    for (let i = 0; i < 9; i++) { const k = (i + (RM ? 0 : (S.ts * 0.9) % 1)) / 9, y = yH + k * k * (S.FH - yH); rc(c, 0, y, S.FW, 1); }
    for (let i = -8; i <= 8; i++) linea(c, S.FW / 2 + i * 9, yH, S.FW / 2 + i * 34, S.FH);
  }
  // El sol: un disco de dos tonos cortado por franjas del color del cielo
  function solRetro(c1, c2b, cA, x, y, r) {
    for (let dy = -r; dy <= r; dy++) { const w = Math.round(Math.sqrt(r * r - dy * dy)); rc(dy > r * 0.1 ? c2b : c1, x - w, y + dy, w * 2, 1); }
    for (let i = 1; i < 6; i++) rc(cA, x - r, y + r - i * i * 0.8 - 1, r * 2, Math.max(1, Math.round(i * 0.55)));
  }
  // La ciudad en silueta: negra, con un filo de luz a la izquierda de cada edificio y pocas ventanas encendidas
  function ciudad(yH, alto, filo, luces, codigo) {
    for (let i = 0; i < 16; i++) {
      const x = Math.round(i * (S.FW / 16)), w = Math.ceil(S.FW / 16), a = Math.round((8 + h(i + 0.2) * 24) * alto + (i % 5 === 2 ? 14 * alto : 0));
      // Rota: cada edificio es una columna de letras verdes que cambian sin parar
      if (codigo) {
        rc("#000800", x, yH - a, w, a); rc("#3fff8a", x, yH - a, 1, a); rc("#3fff8a", x, yH - a, w, 1);
        const paso = Math.floor(S.ts * 12);
        for (let k = 0; k * 6 < a - 6; k++) for (let j = 0; j * 4 < w - 4; j++) { const q = h(i * 13 + k * 7 + j * 3 + paso * 0.61); if (q > 0.35) glifo("01<>/#$%=+*X"[(q * 97) % 12 | 0], x + 2 + j * 4, yH - a + 3 + k * 6, q > 0.9 ? "#ffffff" : q > 0.6 ? "#3fff8a" : "#1d7a45"); }
        continue;
      }
      rc(PF.k, x, yH - a, w, a); rc(filo, x, yH - a, 1, a); rc(filo, x, yH - a, w * 0.5, 1);
      if (i % 5 === 2) { rc(PF.k, x + w / 2 - 1, yH - a - 7, 2, 7); if ((S.t >> 4) % 2) rc(luces[1], x + w / 2 - 1, yH - a - 8, 2, 1); }
      for (let k = 0; k < a / 6 - 1; k++) for (let j = 0; j < 2; j++) if (h(i * 9 + k * 3 + j + (S.golpeN >> 3)) > 0.7) rc(luces[(i + k + j) % luces.length], x + 3 + j * 5, yH - a + 4 + k * 6, 2, 3);
    }
  }
  // Palmeras en primer plano: silueta negra con el filo de las hojas iluminado
  function palmeras(yH, lugares, filo) {
    lugares.forEach(([fx, alto], i) => {
      const x = Math.round(S.FW * fx), y = yH + 6, m = RM ? 0 : Math.sin(S.ts * 1.2 + i) * 2, cima = y - alto;
      for (let k = 0; k < alto; k++) rc(PF.k, x + Math.round(Math.sin(k * 0.05 + i) * 4), y - k, 3 + (k < 6 ? 1 : 0), 1);
      const cx2 = x + Math.round(Math.sin(alto * 0.05 + i) * 4) + 1;
      for (let k = -3; k <= 3; k++) {
        const largo = alto * 0.42, ex = cx2 + k * largo * 0.36 + m, ey = cima + Math.abs(k) * largo * 0.24 - (3 - Math.abs(k)) * 2;
        for (let g = 0; g < 3; g++) linea(PF.k, cx2, cima + g, ex, ey + g + 1);
        linea(filo, cx2, cima - 1, ex, ey);
      }
      rc(PF.k, cx2 - 2, cima, 5, 4);
    });
  }
  // El casete gigante del arranque y del lado B: silueta negra con filo de luz, dos carretes que giran y el avance de la cinta
  function casete(e, ladoB) {
    cieloTramado(NOCHE_F, 0, S.FH);
    laderas(PF.n3);
    estrellasF(26, S.FH * 0.5, PF.b);
    lunaF(Math.round(S.FW * 0.82), Math.round(S.FH * 0.24), 6);
    const w = Math.round(Math.min(160, S.FW * 0.62)), hh = Math.round(w * 0.6), x = Math.round(e.cx - w / 2), y = Math.round(e.cy - hh / 2), filo = ladoB ? PF.n4 : PF.o2;
    rc(PF.k, x, y, w, hh); rc(filo, x, y, w, 1); rc(filo, x + w - 1, y, 1, hh); rc(ladoB ? PF.n3 : PF.o1, x + w - 2, y + 2, 1, hh - 2);
    rc(PF.n1, x + 10, y + 9, w - 20, Math.round(hh * 0.5)); rc(PF.n2, x + 10, y + 9, w - 20, 1);
    for (const lado of [-1, 1]) {
      const cx2 = Math.round(e.cx + lado * w * 0.22), cy2 = Math.round(y + 9 + hh * 0.25), g = S.ts * (ladoB ? -3 : 2) * lado;
      disco(PF.k, cx2, cy2, 12); aro(PF.b, cx2, cy2, 9, 6, g, 2); aro(filo, cx2, cy2, 4, 4, -g, 1);
    }
    rc(PF.n2, x + 12, y + hh - 13, w - 24, 4); rc(filo, x + 12, y + hh - 13, Math.round((w - 24) * Math.min(1, Math.max(0, (S.ts - e.sec[0]) / (e.sec[1] - e.sec[0])))), 4);
    for (let i = 0; i < 4; i++) rc(PF.n2, x + 8 + i * ((w - 20) / 3), y + hh - 5, 4, 2);
    cine();
  }
  // Cada tantos segundos la ciudad "se rompe" un instante y se ve como código verde
  const glitchCiudad = () => !RM && h(Math.floor(S.ts * 1.5) * 0.731) < 0.2;
  // Una letra de la fuente chica (3×5) en el lienzo de efectos
  function glifo(ch, x, y, c) { c2.fillStyle = c; (FUENTE[ch] || []).forEach((r, j) => { for (let i = 0; i < 3; i++) if (r[i] === "1") c2.fillRect(x + i, y + j, 1, 1); }); }
  // Luces de discoteca de los 90 detrás de la ciudad: cuatro reflectores que barren el cielo y cambian de color con el golpe
  function lucesDisco(yH) {
    const cols = [PF.n4, "#e4505c", "#fcd87c", "#a0247c"];
    for (let i = 0; i < 4; i++) {
      const x = S.FW * (0.14 + i * 0.24), a = -Math.PI / 2 + Math.sin(S.ts * 1.1 + i * 1.9) * 0.55, largo = S.FH * 0.9, c = cols[(i + S.golpeN) % 4];
      poligono(c, 0.2 + S.pulso * 0.14, [[x, yH], [x + Math.cos(a - 0.07) * largo, yH + Math.sin(a - 0.07) * largo], [x + Math.cos(a + 0.07) * largo, yH + Math.sin(a + 0.07) * largo]]);
      const px = x + Math.cos(a) * S.FH * 0.42, py = yH + Math.sin(a) * S.FH * 0.42; rc(c, px - 2, py, 5, 1); rc(c, px, py - 2, 1, 5);
    }
    // Destellos de bola de espejos repartidos por el cielo
    if (!RM) for (let i = 0; i < 18; i++) if (h(i + S.golpeN * 0.37) > 0.6) rc(cols[i % 4], h(i + 0.2) * S.FW, S.FH * 0.1 + h(i + 0.7) * (yH - S.FH * 0.2), 2, 2);
  }
  // Un engrane: disco con dientes, un aro de luz punteado, rayos y eje
  function engrane(x, y, r, n, ang, c, filo) {
    x = Math.round(x); y = Math.round(y);
    for (let i = 0; i < n; i++) { const a = ang + (i / n) * TAU; rc(c, x + Math.cos(a) * (r + 2) - 2, y + Math.sin(a) * (r + 2) - 2, 5, 5); rc(filo, x + Math.cos(a) * (r + 4), y + Math.sin(a) * (r + 4), 1, 1); }
    disco(c, x, y, r);
    aro(filo, x, y, r - 1, Math.max(12, n * 3), ang, 1); aro(filo, x, y, r * 0.55, n, -ang, 1);
    for (let i = 0; i < 4; i++) { const a = ang + (i / 4) * TAU; linea(filo, x + Math.cos(a) * 3, y + Math.sin(a) * 3, x + Math.cos(a) * (r * 0.55), y + Math.sin(a) * (r * 0.55)); }
    disco(filo, x, y, 2);
  }
  /* El fuego, dibujado a mano: lenguas con contorno oscuro, cuerpo, luz y corazón amarillo (O, A, B, C), que se mecen
     renglón por renglón; brasas sueltas que suben y bolas de fuego que cruzan en diagonal dejando estela. */
  const LLAMA = ["......O.......", ".....OAO......", ".....OAAO.....", "....OAAAO.....", "....OABAO.....", "...OAABAAO....", "...OABBBAO.O..", "..OAABBBAAOAO.", "..OABBCBBAOAO.", ".OAABBCCBAAAO.", ".OABBCCCBBAAO.", "OAABBCCCCBBAO.", "OABBCCCCCBBAAO", "OABBCCCCCCBBAO", "OABBBCCCCCBBAO", "OAABBCCCCBBBAO", ".OABBBCCCBBAO.", ".OAABBBBBBAAO."];
  const LLAMITA = ["...O......", "..OAO..O..", "..OAAOOAO.", ".OABAOABAO", ".OABBABBAO", "OABBCBBCAO", "OABCCBCCBO", "OABCCCCCBO", "OABBCCCBBO", ".OABBBBBO.", ".OAABBBAO.", "..OOOOOO.."];
  const BRASA = [[".A.", "ABA", ".A."], ["AA.", "ABA", ".AA"], ["A"], [".AA", "ABA", "AA."]];
  const FUEGOS = {
    morado: { O: "#2a0a4a", A: "#7a3fc0", B: "#c084ff", C: "#fcd87c" },
    verde: { O: "#063a1c", A: "#1d9a55", B: "#3fff8a", C: "#fcf4c4" },
    azul: { O: "#0c0c6c", A: "#2c64e4", B: "#5cb0fc", C: "#ffffff" },
    amarillo: { O: "#6a4a00", A: "#e0a010", B: "#fcd87c", C: "#ffffff" },
    // Versiones apagadas, para el fuego del fondo
    fondoM: { O: "#1a0630", A: "#3a1466", B: "#5a2a8c", C: "#7a3fc0" },
    fondoV: { O: "#04200f", A: "#0c4a26", B: "#167a40", C: "#1d9a55" },
    fondoA: { O: "#06063a", A: "#14227a", B: "#1c3cb4", C: "#2c64e4" },
  };
  // Una llama: base en (x, yBase), a escala s, con sus colores. fase desfasa su vaivén; el vaivén crece hacia la punta
  function flama(spr, x, yBase, s, pal, fase, espejo) {
    const alto = spr.length, ancho = spr[0].length, lat = RM ? 0 : 1;
    for (let j = 0; j < alto; j++) {
      const r = spr[j], k = 1 - j / alto, dx = Math.round(Math.sin(S.ts * 6 + fase + k * 3.2) * k * 2.2 * lat + Math.sin(S.ts * 11 + fase * 2 + k * 5) * k * 0.9 * lat) * s, y = yBase - (alto - j) * s;
      let i = 0;
      while (i < ancho) {
        const ch = r[espejo ? ancho - 1 - i : i];
        if (ch === ".") { i++; continue; }
        let n = 1;
        while (i + n < ancho && r[espejo ? ancho - 1 - i - n : i + n] === ch) n++;
        rc(pal[ch], x + i * s + dx, y, n * s, s);
        i += n;
      }
    }
  }
  // Una hilera de llamas a lo ancho: tamaños y colores alternados, unas en espejo, y laten con el golpe
  function hileraFuego(yBase, s, paso, colores, semilla, grande) {
    for (let i = -1; i * paso < S.FW + paso; i++) {
      const q = h(i * 3.7 + semilla), spr = grande && q > 0.3 ? LLAMA : LLAMITA, pal = FUEGOS[colores[((i % colores.length) + colores.length) % colores.length]];
      flama(spr, Math.round(i * paso + (q - 0.5) * paso * 0.5), yBase + Math.round(q * 4 * s) - Math.round(S.pulso * 2 * s * (i & 1)), s + (q > 0.82 ? 1 : 0), pal, i * 1.7 + semilla, q > 0.5);
    }
  }
  // Brasas que se desprenden y suben meciéndose
  function brasas(n, yBase, alto) {
    if (RM) return;
    for (let i = 0; i < n; i++) {
      const f = (S.ts * (0.18 + h(i) * 0.25) + h(i + 0.3)) % 1, x = h(i + 0.6) * S.FW + Math.sin(S.ts * 2 + i) * 6, y = yBase - f * alto, pal = FUEGOS[["morado", "verde", "azul"][i % 3]], spr = BRASA[i % 4];
      if (f > 0.9 && (S.t >> 1) % 2) continue;
      spr.forEach((r, j) => { for (let k = 0; k < r.length; k++) if (r[k] !== ".") rc(r[k] === "B" ? pal.C : f < 0.5 ? pal.B : pal.A, x + k, y + j, 1, 1); });
    }
  }

  // La nave de la fábrica. fuego = arde
  function fabrica(e, fuego) {
    const yB = Math.round(Math.min(S.FH * 0.9, e.suelo)), ang = (S.golpeN + (RM ? 0 : 1 - S.pulso)) * 0.13, metal = "#3a4058", claro = "#8f93a8", sombra = "#1c2030";
    if (fuego) {
      // El aire del incendio: del azul noche al vino, con grandes aros punteados que se pierden al fondo
      cieloTramado(["#10063a", "#2a0a4a", "#4a1466", "#7a1c5c", "#a0244c"], 0, S.FH);
      mancha("aros", "#7a1c5c", (x, y) => { const X = x * (S.FW / S.FH); let m = 0; for (const [cx, cy, r] of [[0.5 * (S.FW / S.FH), 0.42, 0.34], [0.12 * (S.FW / S.FH), 0.3, 0.26], [0.9 * (S.FW / S.FH), 0.62, 0.3]]) { const d = Math.hypot(X - cx, y - cy); if (d < r) m = Math.max(m, d > r * 0.72 ? 0.42 : d > r * 0.5 ? 0.12 : d > r * 0.3 ? 0.3 : 0.1); } return m; });
    } else {
      rc(PF.k, 0, 0, S.FW, S.FH);
      mancha("fab", PF.n1, (x, y) => Math.max(0, 0.8 - Math.abs(y - 0.45) * 1.8));
    }
    // La pared: placas remachadas y, arriba, una hilera de ventanas con vidrios rotos
    for (let j = 0; j < 4; j++) for (let i = 0; i < S.FW / 38 + 1; i++) { const x = i * 38 - (j % 2) * 19, y = Math.round(S.FH * 0.2 + j * 26); rc(sombra, x, y, 37, 1); rc(sombra, x, y, 1, 26); rc(metal, x + 3, y + 3, 1, 1); rc(metal, x + 33, y + 3, 1, 1); }
    for (let i = 0; i < S.FW / 30 + 1; i++) { const x = i * 30 + 4; rc(sombra, x, S.FH * 0.11, 24, 14); for (let k = 0; k < 6; k++) if (h(i * 7 + k) > 0.45) rc(fuego ? "#7a3fc0" : PF.n2, x + 1 + (k % 3) * 8, S.FH * 0.11 + 1 + Math.floor(k / 3) * 7, 7, 6); rc(metal, x, S.FH * 0.11, 24, 1); }
    // Engranes de todos tamaños, cada uno arrastrando al de junto, y la banda que los une
    const fl = fuego ? "#3fff8a" : PF.n4, fl2 = fuego ? "#fcd87c" : PF.o2;
    linea(metal, S.FW * 0.2, S.FH * 0.44 - 30, S.FW * 0.5, S.FH * 0.26 - 13); linea(metal, S.FW * 0.2, S.FH * 0.44 + 30, S.FW * 0.5, S.FH * 0.26 + 13);
    engrane(S.FW * 0.2, S.FH * 0.44, 30, 12, ang, PF.n1, fl);
    engrane(S.FW * 0.2 + 43, S.FH * 0.44 + 26, 17, 8, -ang * 1.7 + 0.2, PF.n2, fl2);
    engrane(S.FW * 0.2 - 30, S.FH * 0.44 + 34, 12, 6, -ang * 2.4, PF.n2, fl);
    engrane(S.FW * 0.8, S.FH * 0.4, 25, 10, -ang, PF.n1, fl);
    engrane(S.FW * 0.8 - 35, S.FH * 0.4 + 25, 14, 7, ang * 1.75, PF.n2, fl2);
    engrane(S.FW * 0.8 + 30, S.FH * 0.4 + 22, 10, 6, ang * 2.5, PF.n2, fl);
    engrane(S.FW * 0.5, S.FH * 0.26, 13, 6, ang * 2, PF.n1, fl);
    engrane(S.FW * 0.5 + 21, S.FH * 0.26 + 13, 9, 5, -ang * 2.8, PF.n2, PF.b);
    // Tubería del techo con juntas, llaves de paso, un manómetro y fugas de vapor
    rc(sombra, 0, S.FH * 0.17, S.FW, 6); rc(metal, 0, S.FH * 0.17, S.FW, 1);
    for (let x = 14; x < S.FW; x += 46) { rc(metal, x, S.FH * 0.17 - 1, 4, 8); rc(claro, x, S.FH * 0.17 - 1, 1, 8); if ((x / 46 | 0) % 2) { rc(metal, x + 1, S.FH * 0.17 + 7, 2, 6); aro(PF.o1, x + 2, S.FH * 0.17 + 16, 4, 8, S.ts * 0.5, 1); } }
    disco(sombra, S.FW * 0.62, S.FH * 0.17 + 16, 7); aro(claro, S.FW * 0.62, S.FH * 0.17 + 16, 6, 14, 0, 1); linea(PF.o2, S.FW * 0.62, S.FH * 0.17 + 16, S.FW * 0.62 + Math.cos(-2.4 + S.energiaAhora * 2.6) * 5, S.FH * 0.17 + 16 + Math.sin(-2.4 + S.energiaAhora * 2.6) * 5);
    if (!RM) for (let i = 0; i < 3; i++) { const x = 16 + (((S.golpeN >> 2) + i * 2) % Math.max(1, Math.floor(S.FW / 46))) * 46, f = (S.ts * 1.4 + i * 0.37) % 1; for (let j = 0; j < 4; j++) rc(j % 2 ? PF.b : claro, x + Math.sin(f * 6 + j) * 3 + j, S.FH * 0.17 + 7 + f * 22 + j * 3, 2, 2); }
    // Cadenas con gancho que se mecen, y cables colgando
    for (let i = 0; i < 3; i++) { const x0 = S.FW * (0.34 + i * 0.16), largo = 26 + i * 9, m = Math.sin(S.ts * 1.2 + i * 2) * 4; for (let k = 0; k < largo; k += 3) rc(k % 6 ? claro : metal, x0 + (m * k) / largo, S.FH * 0.09 + k, 2, 2); rc(PF.o1, x0 + m - 1, S.FH * 0.09 + largo, 4, 2); rc(PF.o1, x0 + m + 2, S.FH * 0.09 + largo + 2, 1, 3); }
    for (let i = 0; i < 4; i++) { const xa = S.FW * (0.08 + i * 0.26), xb = xa + 30; for (let k = 0; k <= 10; k++) rc(sombra, xa + (xb - xa) * (k / 10), S.FH * 0.09 + Math.sin((k / 10) * 3.14) * (6 + i * 2), 3, 1); }
    // A la izquierda, una caldera con mirilla; a la derecha, una consola con dos monitores de fósforo verde
    const cx0 = Math.round(S.FW * 0.03);
    rc(metal, cx0, yB - 46, 24, 46); rc(claro, cx0, yB - 46, 1, 46); rc(sombra, cx0 + 23, yB - 46, 1, 46); rc(metal, cx0 + 3, yB - 50, 18, 4); rc(sombra, cx0 + 8, yB - 58, 4, 8);
    for (let k = 0; k < 4; k++) { rc(sombra, cx0, yB - 40 + k * 11, 24, 1); rc(claro, cx0 + 3, yB - 38 + k * 11, 1, 1); rc(claro, cx0 + 20, yB - 38 + k * 11, 1, 1); }
    rc(PF.k, cx0 + 8, yB - 30, 8, 12); rc(fuego ? "#3fff8a" : PF.o1, cx0 + 9, yB - 22 - Math.round(S.pulso * 4), 6, 3 + Math.round(S.pulso * 4)); rc(PF.o1, cx0 + 2, yB - 12, 3, 2); rc(PF.o1, cx0 + 17, yB - 44, 4, 1);
    const kx = Math.round(S.FW * 0.87);
    rc(metal, kx, yB - 16, 36, 16); rc(claro, kx, yB - 16, 36, 1); rc(sombra, kx + 2, yB - 12, 32, 1);
    for (let k = 0; k < 6; k++) rc((S.golpeN + k) % 3 ? sombra : k % 2 ? PF.o2 : "#3fff8a", kx + 3 + k * 5, yB - 9, 3, 2);
    for (let m = 0; m < 2; m++) { const x = kx + 1 + m * 18; rc(sombra, x, yB - 32, 16, 15); rc(claro, x, yB - 32, 16, 1); rc("#001a08", x + 2, yB - 30, 12, 10); for (let r = 0; r < 3; r++) rc("#3fff8a", x + 3, yB - 29 + r * 3, 3 + ((h(m * 7 + r + (S.golpeN >> 1)) * 7) | 0), 1); if ((S.t >> 3) % 2) rc("#3fff8a", x + 11, yB - 23, 2, 1); }
    // Las prensas del fondo: bajan de golpe con cada tiempo y sueltan chispas
    for (let i = 0; i < 3; i++) {
      const x = Math.round(S.FW * (0.32 + i * 0.16)), baja = Math.round(((S.golpeN + i) % 2 ? S.pulso : 0) * 14);
      rc(sombra, x - 9, yB - 50, 3, 50); rc(sombra, x + 16, yB - 50, 3, 50); rc(metal, x - 11, yB - 54, 32, 6); rc(claro, x - 11, yB - 54, 32, 1);
      rc(claro, x + 3, yB - 48, 4, 14 + baja); rc(metal, x - 4, yB - 34 + baja, 18, 9); rc(claro, x - 4, yB - 34 + baja, 18, 1);
      for (let k = 0; k < 18; k += 4) rc((k >> 2) % 2 ? "#ffe14a" : PF.k, x - 4 + k, yB - 27 + baja, Math.min(4, 18 - k), 2);
      rc(metal, x - 6, yB - 8, 22, 8); rc(claro, x - 6, yB - 8, 22, 1);
      if (!RM && baja > 10) for (let k = 0; k < 5; k++) rc(k % 2 ? "#ffe14a" : PF.b, x + 5 + (h(k + S.golpeN) - 0.5) * 26, yB - 10 - h(k + 0.4 + S.golpeN) * 8, 1, 1);
    }
    // La banda transportadora, a la altura del piso de la terminal: rodillos, patas y cajas que pasan
    rc(sombra, 0, yB, S.FW, 5); rc(fuego ? "#3fff8a" : PF.o2, 0, yB, S.FW, 1);
    for (let x = -((S.ts * 24) % 12); x < S.FW; x += 12) { rc(metal, x, yB + 1, 6, 1); disco(metal, x + 3, yB + 8, 3); rc(claro, x + 2, yB + 6, 1, 1); }
    for (let x = 10; x < S.FW; x += 44) { rc(sombra, x, yB + 11, 3, S.FH); rc(metal, x, yB + 11, 1, S.FH); }
    for (let i = 0; i < 6; i++) { const x = Math.round(S.FW + 20 - ((S.ts * 24 + (i * (S.FW + 40)) / 6) % (S.FW + 40))), a = 9 + (i % 3) * 3; rc(i % 2 ? PF.o1 : metal, x, yB - a, 12, a); rc(i % 2 ? PF.o2 : claro, x, yB - a, 12, 1); rc(PF.k, x + 5, yB - a + 2, 2, a - 3); }
    // Abandono: telarañas en las esquinas y óxido salpicado
    for (const [x0, d] of [[0, 1], [S.FW - 1, -1]]) for (let k = 1; k < 5; k++) { linea(sombra, x0, S.FH * 0.09 + k * 6, x0 + d * k * 6, S.FH * 0.09); linea(metal, x0 + d * k * 5, S.FH * 0.09 + 1, x0 + d * 2, S.FH * 0.09 + k * 5); }
    for (let i = 0; i < 40; i++) rc(i % 3 ? "#7a3a10" : PF.o1, h(i + 0.31) * S.FW, S.FH * 0.2 + h(i + 0.77) * (yB - S.FH * 0.2), 1 + (i % 2), 1);
    if (fuego) {
      // El incendio: una hilera de llamas grandes al fondo, fuego prendido en las prensas y la caldera, dos hileras
      // al frente, brasas que suben y bolas de fuego que cruzan
      // Detrás de las máquinas, una sola hilera apagada (sin amarillo) para que no compita con lo que pasa en la terminal;
      // el fuego vivo queda abajo y en las orillas, como marco. El amarillo se guarda para lo que sí hace daño
      hileraFuego(yB + 4, 2, 34, ["fondoM", "fondoA", "fondoM", "fondoV"], 1, true);
      flama(LLAMITA, cx0 + 6, yB - 56, 1, FUEGOS.verde, 4, false); flama(LLAMA, kx + 8, yB - 30, 1, FUEGOS.morado, 5, true);
      hileraFuego(Math.min(S.FH, yB + 22), 2, 22, ["verde", "morado", "azul", "morado"], 7, true);
      hileraFuego(Math.min(S.FH + 6, yB + 34), 3, 34, ["azul", "verde", "morado"], 13, false);
      brasas(18, yB, S.FH * 0.45);
    }
    cine();
  }
  // Una maquinita de arcade: marquesina encendida, pantalla con su juego, tablero con palanca y botones, y puerta de monedas
  function maquina(x, yBase, s, n) {
    const X = Math.round(x), Y = Math.round(yBase - 30 * s), r = (c, a, b, w, hh) => rc(c, X + a * s, Y + b * s, w * s, hh * s);
    const v = ((n % 4) + 4) % 4, cuerpo = [PF.n3, PF.n2, "#a0247c", PF.n3][v], claro = [PF.n4, PF.n3, "#e4505c", PF.n4][v], oscuro = [PF.n2, PF.n1, "#4c1088", PF.n2][v], pant = ["#a0247c", PF.o1, PF.n1, "#18084c"][v], tinta = ["#fcd87c", PF.b, PF.n4, PF.o2][v];
    r(PF.k, -1, -1, 18, 32);
    r(cuerpo, 1, 0, 14, 5); r(claro, 1, 0, 14, 1);
    r((S.golpeN + n) % 2 ? tinta : claro, 3, 1, 10, 3); r(PF.k, 5, 2, 6, 1);
    r(cuerpo, 0, 5, 16, 12); r(claro, 0, 5, 1, 12); r(oscuro, 15, 5, 1, 12);
    r(PF.k, 2, 6, 12, 10); r(pant, 3, 7, 10, 8);
    // El juego en pantalla: tres marcianitos que bajan y una nave que dispara
    const f = RM ? 0 : (S.t >> 4) + n * 3;
    for (let i = 0; i < 3; i++) r(tinta, 4 + i * 3 + (f % 2), 8 + (Math.floor(f / 2) % 3), 2, 1);
    r(PF.b, 5 + (f % 6), 13, 2, 1); if (f % 3 === 0) r(PF.b, 6 + (f % 6), 10, 1, 2);
    r(claro, -1, 17, 18, 1); r(cuerpo, -1, 18, 18, 2); r(oscuro, -1, 20, 18, 1);
    r(PF.k, 4, 15, 1, 3); r("#e4505c", 3, 14, 3, 2);
    r(PF.o2, 9, 18, 2, 1); r(PF.b, 12, 18, 2, 1); r("#e4505c", 12, 16, 1, 1);
    r(oscuro, 1, 21, 14, 9); r(cuerpo, 1, 21, 1, 9); r(PF.n1, 2, 22, 12, 1);
    r(PF.k, 6, 24, 4, 4); r(PF.o2, 7, 25, 1, 1); r(claro, 9, 26, 1, 1);
    for (let i = 0; i < 3; i++) r(PF.n1, 3 + i * 4, 29, 2, 1);
  }
  const ESCENAS_F = [
    // 1. ASCENSO: BIT sube por el cielo hacia la luna. Empieza despacio, entre nubes; al final va a la velocidad de la luz,
    //    las estrellas se vuelven rayas, la luna aparece enorme al centro y todo se va a blanco para dar paso al atardecer
    (e) => {
      const dur = e.sec[1] - e.sec[0], k = Math.min(1, Math.max(0, (S.ts - e.sec[0]) / dur)), vel = 6 + 900 * Math.pow(k, 5), dist = RM ? 0 : 6 * S.ts + 150 * dur * Math.pow(k, 6);
      cieloTramado(k < 0.35 ? NOCHE_F : k < 0.7 ? [PF.k, PF.n1, PF.n1, PF.n2] : [PF.k, PF.k, PF.k, PF.n1], 0, S.FH);
      if (k < 0.3) laderas(PF.n3);
      // Las nubes se quedan abajo
      for (let i = 0; i < 6; i++) { const w = 60 + h(i) * 60, x = h(i + 0.3) * (S.FW + 40) - 40, y = S.FH * (0.62 + h(i + 0.6) * 0.3) + dist * (1 + h(i) * 0.6); if (y < S.FH) { rc(PF.k, x, y, w, S.FH); rc(PF.k, x + 10, y - 5, w - 24, 5); rc(PF.n4, x, y, 10, 1); rc(PF.n4, x + 10, y - 5, w - 24, 1); } }
      // Las estrellas pasan hacia abajo: puntos al principio, rayas cada vez más largas después
      for (let i = 0; i < 70; i++) {
        const par = 0.3 + h(i + 0.2) * 0.9, x = Math.round(h(i) * S.FW), y = (h(i + 0.5) * S.FH + dist * par) % S.FH, largo = Math.max(1, Math.min(S.FH * 0.7, vel * par * 0.035));
        rc(i % 6 === 0 ? PF.n4 : PF.b, x, y - largo, 1, largo);
        if (largo < 2 && i % 7 === 0 && (RM || (S.t >> 4) % 3 !== i % 3)) { rc(PF.b, x - 1, y - 1, 3, 1); rc(PF.b, x, y - 2, 1, 3); }
      }
      // La luna crece al centro, con su resplandor punteado y rayos de velocidad que salen de ella
      if (k > 0.7) {
        const q = (k - 0.7) / 0.3, r = Math.round(2 + q * q * Math.min(S.FW, S.FH) * 0.3), mx = Math.round(e.cx), my = Math.round(S.FH * 0.4);
        if (q > 0.35) resplandor(`as${q > 0.7 ? 2 : 1}`, q > 0.7 ? PF.n4 : PF.n3, 0.5, 0.4, q > 0.7 ? 0.62 : 0.4);
        if (!RM) for (let i = 0; i < 46; i++) { const a = h(i + 0.9) * TAU, f = (S.ts * (1.5 + h(i) * 2) + h(i + 0.4)) % 1, r0 = r + 4 + f * S.FW * 0.6, r1 = r0 + 6 + q * 40 * f; linea(i % 4 ? PF.b : PF.n4, mx + Math.cos(a) * r0, my + Math.sin(a) * r0, mx + Math.cos(a) * r1, my + Math.sin(a) * r1); }
        lunaF(mx, my, r);
        if (r > 8) { rc(PF.n4, mx - r * 0.45, my - r * 0.3, r * 0.28, r * 0.16); rc(PF.n4, mx + r * 0.3, my + r * 0.25, r * 0.22, r * 0.14); rc(PF.n4, mx - r * 0.1, my + r * 0.5, r * 0.16, r * 0.1); }
        // El gran destello: la pantalla se llena de blanco en cuatro pasos de trama
        if (q > 0.86) { const f = (q - 0.86) / 0.14; if (f > 0.75) rc(PF.b, 0, 0, S.FW, S.FH); else mancha(`fl${Math.floor(f * 4)}`, PF.b, () => [0.3, 0.55, 0.8][Math.floor(f * 4)]); }
      }
      cine();
    },
    // 2. ATARDECER: el sol se mete en el mar; dos palmeras enormes en primer plano
    (e) => {
      const yH = Math.round(S.FH * 0.64), k = Math.min(1, Math.max(0, (S.ts - e.sec[0]) / (e.sec[1] - e.sec[0])));
      cieloTramado(OCASO_F, 0, yH);
      estrellasF(12, S.FH * 0.2, PF.b);
      // El sol va saliendo del mar poco a poco a lo largo del tramo
      solRetro("#fcd87c", "#fc9c4c", "#e4505c", Math.round(S.FW * 0.5), Math.round(yH - 4 - k * 18), Math.round(24 + S.pulso * 2));
      rc("#18084c", 0, yH, S.FW, S.FH - yH);
      mancha("mar", "#e4505c", (x, y) => (y < 0.64 ? 0 : Math.max(0, 0.9 - Math.abs(x - 0.5) * 5 - (y - 0.64) * 1.2)));
      for (let i = 0; i < 9; i++) { const y = yH + 3 + i * i * 0.9; rc("#fc9c4c", S.FW * 0.5 - 16 + h(i + (S.t >> 4)) * 26, y, 5 + h(i) * 6, 1); }
      rc("#4c1088", 0, yH, S.FW, 1);
      palmeras(yH + 8, [[0.1, 62], [0.2, 40], [0.86, 70], [0.95, 44]], "#fc9c4c");
      rc(PF.k, 0, yH + 12, S.FW * 0.3, S.FH); rc(PF.k, S.FW * 0.76, yH + 14, S.FW, S.FH);
      cine();
    },
    // 3. AUTOPISTA: la carretera corre hacia ti, con la ciudad en silueta contra el ocaso y luces de disco detrás
    () => {
      const yH = Math.round(S.FH * 0.6), gl = glitchCiudad();
      cieloTramado(OCASO_F, 0, yH);
      solRetro("#fcd87c", "#fc9c4c", "#e4505c", Math.round(S.FW * 0.5), yH - 4, Math.round(22 + S.pulso * 3));
      lucesDisco(yH);
      ciudad(yH, 0.9, "#a0247c", ["#fcd87c", "#fc9c4c"], gl);
      rejilla(gl ? "#3fff8a" : "#a0247c", yH, PF.k);
      rc(gl ? "#3fff8a" : "#fc9c4c", 0, yH, S.FW, 1);
      for (let i = 0; i < 6; i++) { const k = (i + (RM ? 0 : (S.ts * 1.8) % 1)) / 6, y = yH + k * k * (S.FH - yH); rc("#fcd87c", S.FW / 2 - 1 - k * 2, y, 2 + k * 4, 2 + k * 5); }
      for (const lado of [-1, 1]) for (let i = 0; i < 3; i++) { const k = (i + (RM ? 0 : (S.ts * 0.9) % 1)) / 3, y = yH + k * k * (S.FH - yH), x = S.FW / 2 + lado * (40 + k * k * S.FW * 0.5); rc(PF.k, x, y - 12 - k * 34, 2 + k * 2, 12 + k * 34); rc("#fcd87c", x - 2, y - 14 - k * 34, 6 + k * 3, 2); }
      if (gl) tiras(4, 10, Math.floor(S.ts * 14));
      cine();
    },
    // 4. EL RASCACIELOS: la cámara sube por la fachada de un edificio en plena fiesta. Sus ventanas laten con la música,
    //    cada tanto el edificio se rompe en código verde, y la luna lo mira todo desde atrás
    (e) => {
      const k = Math.min(1, Math.max(0, (S.ts - e.sec[0]) / (e.sec[1] - e.sec[0]))), sube = RM ? 0 : (S.ts - e.sec[0]) * (26 + 44 * k), gl = glitchCiudad();
      cieloTramado(NOCHE_F, 0, S.FH);
      laderas(PF.n3);
      estrellasF(26, S.FH * 0.7, PF.b);
      const mx = Math.round(S.FW * 0.75), my = Math.round(S.FH * 0.3);
      resplandor("ras", PF.n4, 0.75, 0.3, 0.3);
      lunaF(mx, my, 15); rc(PF.n4, mx - 7, my - 5, 4, 3); rc(PF.n4, mx + 5, my + 4, 3, 2); rc(PF.n4, mx - 2, my + 8, 3, 2);
      lucesDisco(S.FH);
      // Los edificios de los lados, más lejos: pasan más despacio
      for (const [x0, x1] of [[0, S.FW * 0.2], [S.FW * 0.86, S.FW]]) {
        rc(PF.k, x0, 0, x1 - x0, S.FH); rc(PF.n3, x1 === S.FW ? x0 : x1 - 1, 0, 1, S.FH);
        for (let r = -1; r < S.FH / 9 + 1; r++) { const n = Math.floor((sube * 0.45) / 9) - r, y = r * 9 + ((sube * 0.45) % 9); for (let i = 0; (i + 1) * 6 < x1 - x0; i++) if (h(n * 7.3 + i * 3.1 + x0) > 0.62) rc(h(n + i) > 0.5 ? PF.n3 : PF.o1, x0 + 3 + i * 6, y, 3, 4); }
      }
      // El edificio del centro: piso por piso, con cornisas y ventanas de colores que cambian con el golpe
      const bx = Math.round(S.FW * 0.3), bw = Math.round(S.FW * 0.38), alto = 13, cols = Math.max(4, Math.floor((bw - 8) / 9));
      rc(gl ? "#000800" : "#04041c", bx, 0, bw, S.FH); rc(gl ? "#3fff8a" : PF.n4, bx, 0, 1, S.FH); rc(gl ? "#1d7a45" : PF.n2, bx + bw - 1, 0, 1, S.FH);
      for (let r = -1; r < S.FH / alto + 1; r++) {
        const n = Math.floor(sube / alto) - r, y = Math.round(r * alto + (sube % alto));
        if (gl) { const paso = Math.floor(S.ts * 12); for (let i = 0; i * 4 < bw - 6; i++) for (let j = 0; j < 2; j++) { const q = h(n * 13.7 + i * 3.3 + j * 7.1 + paso * 0.61); if (q > 0.3) glifo("01<>/#$%=+*X"[(q * 97) % 12 | 0], bx + 3 + i * 4, y + 1 + j * 6, q > 0.9 ? "#ffffff" : q > 0.6 ? "#3fff8a" : "#1d7a45"); } continue; }
        rc(((n % 6) + 6) % 6 === 0 ? PF.n3 : PF.n1, bx + 1, y + alto - 2, bw - 2, ((n % 6) + 6) % 6 === 0 ? 2 : 1);
        for (let i = 0; i < cols; i++) {
          const q = h(n * 5.3 + i * 9.7 + (S.golpeN >> 1) * 0.37), fiesta = h(n * 2.1 + i) > 0.55, x = bx + 5 + Math.round((i * (bw - 10)) / cols);
          rc(!fiesta ? (q > 0.8 ? PF.n2 : PF.n1) : q > 0.72 ? PF.b : q > 0.5 ? PF.o2 : q > 0.3 ? "#e4505c" : PF.n3, x, y + 2, 6, 7);
          if (fiesta && q > 0.5) rc(PF.k, x + 2 + ((S.golpeN + i) % 2), y + 5, 2, 4);
        }
      }
      // Un letrero de neón vertical trepa por la orilla
      if (!gl) for (let r = -1; r < S.FH / 20 + 1; r++) { const y = r * 20 + (sube % 20); rc((S.golpeN + r) % 2 ? "#e4505c" : PF.o2, bx - 5, y, 3, 12); }
      if (gl) tiras(4, 10, Math.floor(S.ts * 14));
      cine();
    },
    // 5. ARCADE: un recorrido de izquierda a derecha por el salón; dos filas de maquinitas pasan a distinta velocidad
    () => {
      const yH = Math.round(S.FH * 0.72), cam = RM ? 0 : S.ts * 26;
      rc("#04041c", 0, 0, S.FW, S.FH);
      mancha("arc", PF.n1, (x, y) => Math.max(0, 0.8 - Math.abs(y - 0.4) * 2.2));
      // La pared del fondo: tubos de neón y carteles que pasan despacio
      for (let i = -1; i < S.FW / 70 + 1; i++) { const n = Math.floor(cam * 0.3 / 70) + i, x = n * 70 - cam * 0.3; rc((S.golpeN + n) % 2 ? PF.o1 : PF.n3, x + 8, S.FH * 0.14, 40, 2); rc(PF.n1, x + 16, S.FH * 0.2, 24, 16); rc(PF.n2, x + 16, S.FH * 0.2, 24, 1); rc(((n % 3) + 3) % 3 ? PF.n3 : PF.o2, x + 20, S.FH * 0.2 + 4, 16, 8); }
      // Fila de atrás (chicas) y fila de adelante (grandes)
      for (let i = -1; i < S.FW / 26 + 1; i++) { const n = Math.floor(cam * 0.6 / 26) + i; maquina(n * 26 - cam * 0.6, yH - 6, 1, n); }
      for (let j = 0; j < 6; j++) for (let i = -1; i < S.FW / 14 + 2; i++) { const n = Math.floor(cam / 14) + i; if ((((n + j) % 2) + 2) % 2) rc(PF.n1, n * 14 - cam, yH + j * 8, 14, 8); }
      rc(PF.n3, 0, yH, S.FW, 1);
      for (let i = -1; i < S.FW / 50 + 1; i++) { const n = Math.floor(cam / 50) + i; maquina(n * 50 - cam + 6, yH + 14, 2, n + 7); }
      cine();
    },
    // 6. LA FABRICA: abandonada, de los noventa. Sin lámparas: solo máquinas. La banda transportadora queda a ras del piso
    //    de la terminal, y las prensas del fondo golpean con la música
    (e) => fabrica(e, false),
    // 7. FABRICA EN LLAMAS: la misma nave, ardiendo en verde, morado y azul con puntas amarillas
    (e) => fabrica(e, true),
    // 8. JEFE DJ.EXE: la silueta del DJ, quieta tras sus tornamesas, y detrás todo el espectáculo: el cielo cambia de
    //    color cada compás, rayos que giran, un muro de luces que sube con la música, reflectores, láseres y destellos
    (e) => {
      const u = Math.max(2, Math.round(Math.min(S.FW / 110, S.FH / 62))), cx = Math.round(e.cx), my = Math.round(Math.min(S.FH * 0.82, S.gy + S.H * 0.8)), techo = Math.round(S.FH * 0.09);
      const CIELOS = [["#1c0648", "#4c1088", "#a0247c", "#ff3fb4", "#ffc46c"], ["#060a4c", "#0c2a9c", "#1c64d4", "#00b4e4", "#7cf4ff"], ["#2a0648", "#6a0c98", "#c81e9c", "#ff5a9c", "#ffe14a"]];
      cieloTramado(CIELOS[RM ? 0 : (S.golpeN >> 2) % 3], 0, my);
      // Los rayos que giran desde detrás del DJ
      const oy = my - 27 * u, L = S.FW + S.FH;
      for (let i = 0; i < 12; i++) { const a = (RM ? 0 : S.ts * 0.35) + (i * TAU) / 12; poligono(i % 2 ? "#ffffff" : "#ffe14a", 0.08 + (RM ? 0 : S.pulso * 0.1), [[cx, oy], [cx + Math.cos(a) * L, oy + Math.sin(a) * L], [cx + Math.cos(a + TAU / 30) * L, oy + Math.sin(a + TAU / 30) * L]]); }
      // El muro de luces: columnas de focos que suben y bajan con la música, del cian al rosa y al amarillo
      const pasoX = 4 * u, cols = Math.ceil(S.FW / pasoX) + 1, filas = Math.max(4, Math.floor((my - techo) * 0.62 / (2 * u)));
      for (let i = 0; i < cols; i++) {
        const d = Math.abs(i - (cols >> 1)), v = (0.3 + S.energiaAhora * 0.6) * (0.35 + 0.65 * Math.abs(Math.sin((RM ? 1 : S.ts) * (2.2 + (d % 7) * 0.41) + d * 1.3))) * (0.65 + S.pulso * 0.35), n = Math.max(1, Math.round(v * filas));
        for (let j = 0; j < n; j++) { const f = j / filas; rc(j === n - 1 ? "#ffffff" : f < 0.4 ? "#00f6ff" : f < 0.7 ? "#ff3fb4" : "#ffe14a", cx + (i - (cols >> 1)) * pasoX - u, my - (j + 1) * 2 * u, 3 * u, u); }
      }
      // Reflectores que barren desde el techo y la bola de espejos
      if (!RM) [["0,246,255", 0.08, 1.1, 0], ["255,63,180", 0.24, 0.9, 2], ["125,255,60", 0.4, 1.3, 4], ["255,225,74", 0.6, 1.2, 1], ["255,63,180", 0.76, 1, 3], ["0,246,255", 0.92, 0.8, 5]].forEach(([rgb, fx0, vel, des]) => haz(rgb, 0.5 + S.pulso * 0.25, S.FW * fx0, 3, S.FW * fx0 + Math.sin(S.ts * vel + des) * S.FW * 0.3, 10 * u, techo, S.FH));
      { const bx = cx, by = techo + 6 * u, r = 4 * u; rc("#5c5c70", bx, techo, 1, 2 * u); disco("#8c8ca0", bx, by, r); for (let i = 0; i < 16; i++) { const a = h(i + 0.3) * TAU, d = Math.sqrt(h(i + 0.8)) * (r - u); if (h(i + (S.golpeN >> 1) * 0.43) > 0.45) rc(["#ffffff", "#00f6ff", "#ff3fb4", "#ffe14a"][i % 4], bx + Math.cos(a) * d, by + Math.sin(a) * d, u, u); } }
      // Los reflectores con que ataca: bajan del techo al carril que van a golpear
      for (const a of S.ataques) if (a.dj && S.ts >= a.t0) { const x = S.gx + a.c * S.LW + S.LW / 2; haz(a.hecho ? "255,255,255" : "0,246,255", a.hecho ? 0.9 : 0.3, x, 3, x, S.LW, techo, S.gy + 9); }
      // Destellos que cambian de lugar con cada golpe
      for (let i = 0; i < 30; i++) { const q = i + S.golpeN * 0.37; if (h(q) < 0.45) continue; const x = Math.round(h(q + 0.2) * S.FW), y = Math.round(techo + h(q + 0.6) * (my - techo) * 0.8), g = RM ? 1 : 1 + Math.round(S.pulso * 2), c = i % 3 ? "#ffffff" : "#ffe14a"; rc(c, x - g, y, g * 2 + 1, 1); rc(c, x, y - g, 1, g * 2 + 1); }
      if (!RM && S.pulso > 0.7) { c2.globalAlpha = (S.pulso - 0.7) * 0.4; rc("#ffffff", 0, 0, S.FW, my); c2.globalAlpha = 1; }
      // La onda de neón, en rosa y cian, que crece con la energía y con cada golpe
      const amp = (0.25 + S.energiaAhora * 0.75) * (0.3 + S.pulso * 0.7) * S.FH * 0.22, yo = Math.round(my - 15 * u);
      const onda = (x) => { let y = 0; for (const p of [0.13, 0.87]) { const d = (x / S.FW - p) * 15 + Math.sin(S.ts * 1.7 + p * 9) * 0.4; y += -Math.sin(d * 3.1) * Math.exp(-d * d * 1.3); } return y * amp; };
      for (const [c, dy, g] of [["#12052a", 1, 6], ["#ff3fb4", 3, 2], ["#00f6ff", 0, 2]]) { let ya = onda(0); for (let x = 0; x < S.FW; x += 2) { const yb = onda(x + 2); rc(c, x, yo + dy + Math.min(ya, yb) - (g >> 1), 2, Math.abs(yb - ya) + g); ya = yb; } }
      // El DJ: quieto, con las manos en los discos
      const P2 = [-9, 8, -13, 13, 9, 8, 13, 13], tx = cx, ty = my - 21 * u;
      const snap = (v) => Math.round(v / u) * u;
      const brazo = (c, x0, y0, x1, y1, ox, oy2) => { const pasos = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / u)); for (let i = 0; i <= pasos; i++) rc(c, snap(x0 + ((x1 - x0) * i) / pasos) - u + ox, snap(y0 + ((y1 - y0) * i) / pasos) - u + oy2, 2 * u + (i === pasos ? u : 0), 2 * u + (i === pasos ? u : 0)); };
      const figura = (c, ox, oy2) => {
        rc(c, tx - 3 * u + ox, ty - 9 * u + oy2, 6 * u, 7 * u); rc(c, tx - 2 * u + ox, ty - 10 * u + oy2, 4 * u, u); rc(c, tx - u + ox, ty - 2 * u + oy2, 2 * u, 3 * u);
        for (let r = 0; r < 20; r++) { const w = r < 2 ? 5 + r : r < 9 ? 7 - (r - 2) * 0.3 : 4.8; rc(c, tx - Math.round(w * u) + ox, ty + r * u + oy2, Math.round(w * u) * 2, u); }
        brazo(c, tx - 6 * u, ty + u, tx + P2[0] * u, ty + P2[1] * u, ox, oy2); brazo(c, tx + P2[0] * u, ty + P2[1] * u, tx + P2[2] * u, ty + P2[3] * u, ox, oy2);
        brazo(c, tx + 6 * u, ty + u, tx + P2[4] * u, ty + P2[5] * u, ox, oy2); brazo(c, tx + P2[4] * u, ty + P2[5] * u, tx + P2[6] * u, ty + P2[7] * u, ox, oy2);
      };
      figura("#00f6ff", -1, -1); figura("#ff3fb4", 1, 0); figura("#05020f", 0, 0);
      rc("#05020f", tx - 3 * u, ty - 11 * u, 6 * u, u); rc("#00f6ff", tx - 4 * u, ty - 7 * u, u, 3 * u); rc("#ff3fb4", tx + 3 * u, ty - 7 * u, u, 3 * u);
      // La pista: losetas que se encienden por turnos
      rc("#12052a", 0, my, S.FW, S.FH - my);
      for (let j = 0; j < 3; j++) for (let i = 0; i * 6 * u < S.FW; i++) { const q = h(i * 7 + j * 13 + (S.golpeN >> 1) * 0.71); if (q > 0.5) { c2.globalAlpha = 0.25 + q * 0.3; rc(["#ff3fb4", "#00f6ff", "#7a3fc0", "#ffe14a"][(i + j) % 4], i * 6 * u, my + j * 2 * u + 1, 6 * u - 1, 2 * u - 1); c2.globalAlpha = 1; } }
      rc("#ffffff", 0, my, S.FW, 1);
      // La mesa y el equipo: dos tornamesas con su disco girando y, en medio, la mezcladora con sus luces
      for (const d of [-1, 1]) {
        const x = cx + d * 15 * u, w = 17 * u, y = my - 3 * u, px = x - d * u, py = y - 3 * u;
        rc("#05020f", x - w / 2 - 1, y - 6 * u - 1, w + 2, 9 * u + 2);
        rc("#c4c4d4", x - w / 2, y - 6 * u, w, 6 * u); rc("#e8e8f4", x - w / 2, y - 6 * u, w, 1); rc("#8c8ca0", x - w / 2, y, w, 3 * u); rc("#5c5c70", x - w / 2, y + 2 * u, w, u);
        rc("#5c5c70", x - w / 2 + 2 * u, y + u, 6 * u, 1); rc("#05020f", x - w / 2 + u, my, 2 * u, u); rc("#05020f", x + w / 2 - 3 * u, my, 2 * u, u);
        for (let r = -2; r <= 2; r++) { const half = [4, 5.5, 6, 5.5, 4][r + 2] * u; rc(Math.abs(r) === 2 ? "#3c3c50" : "#14141f", px - half, py + r * u - (u >> 1), half * 2, u); }
        rc("#8c8ca0", px - 4 * u, py - (u >> 1), 8 * u, 1); rc(d < 0 ? "#00f6ff" : "#ff3fb4", px - u, py - (u >> 1), 2 * u, u);
        const a = (RM ? 1 : S.ts * 5) * d; rc("#ffffff", px + Math.cos(a) * 4 * u, py + Math.sin(a) * 1.5 * u - (u >> 1), u, Math.max(1, u >> 1));
        linea("#e8e8f4", x + d * (w / 2 - 2 * u), y - 5 * u, px + d * 3 * u, py); rc("#5c5c70", x + d * (w / 2 - 2 * u) - u, y - 6 * u + 1, 2 * u, 2 * u);
      }
      rc("#05020f", cx - 6 * u - 1, my - 8 * u - 1, 12 * u + 2, 8 * u + 2); rc("#d4d4e4", cx - 6 * u, my - 8 * u, 12 * u, 5 * u); rc("#a8a8bc", cx - 6 * u, my - 3 * u, 12 * u, 3 * u); rc("#ffffff", cx - 6 * u, my - 8 * u, 12 * u, 1);
      for (let i = 0; i < 4; i++) { rc("#5c5c70", cx - 5 * u + i * 3 * u, my - 7 * u, u, u); rc("#8c8ca0", cx - 5 * u + i * 3 * u, my - 5 * u, 2 * u, 1); }
      for (let i = 0; i < 6; i++) { const lv = Math.round(espectro12(i) * 5); for (let j = 0; j < 3; j++) rc(j < lv ? (j === 2 ? "#ff3fb4" : "#00f6ff") : "#5c5c70", cx - 5 * u + i * 2 * u, my - u - j * (u - (u > 2 ? 1 : 0)) - 1, u, Math.max(1, u - 1)); }
      cine();
    },
    // 8. ENTRE PLANETAS: BIT sube por el espacio. Las estrellas caen como rayas y los planetas entran por arriba, girando,
    //    y se quedan atrás por abajo: los de más cerca, más grandes y más rápidos
    (e) => {
      const mov = RM ? 4 : Math.abs(S.ts - e.sec[0]);
      cieloTramado(["#02010c", "#05031c", "#0c0634", "#120840", "#05031c"], 0, S.FH);
      mancha("neb1", "#4c1088", (x, y) => Math.max(0, Math.sin(x * 5 + Math.sin(y * 7) * 1.5) * Math.sin(y * 4.2 + x * 2.5) - 0.25) * 0.9);
      mancha("neb2", "#0c5c8c", (x, y) => Math.max(0, Math.sin(x * 3.1 + 2 + Math.sin(y * 5 + 1) * 1.2) * Math.sin(y * 5 - x * 3) - 0.45) * 0.8);
      for (let i = 0; i < 130; i++) { const prof = 0.15 + h(i + 0.3) * 0.85; rc(["#ffffff", "#b8a8ff", "#7cf4ff", "#ffd8a8"][i % 4], h(i) * S.FW, (h(i + 0.5) * S.FH + mov * prof * 150) % S.FH, 1, RM ? 1 : 1 + prof * prof * 14); }
      const MUNDOS = [["vF", ["#0c1c2c", "#2c6480", "#7cc4d8", "#d8f4ff", "#ffffff"], 6, 0, 0.05], ["vD", ["#1c0404", "#6c1410", "#c83c1c", "#fc9c4c", "#fcd87c"], 5, 0, 0.075], ["vC", ["#04140c", "#0c4c2c", "#1c9c4c", "#7dff3c", "#e4ffa8"], 9, 0, 0.11], ["vE", ["#0c0634", "#3a0c78", "#7a3fc0", "#c084ff", "#f0d8ff"], 13, 1, 0.15], ["vB", ["#020a2c", "#0c2a9c", "#1c64d4", "#3cb4e4", "#a8f0ff", "#ffffff"], 7, 0, 0.21], ["vA", ["#1c0638", "#4c1088", "#a0247c", "#e4505c", "#fc9c4c", "#fcd87c", "#fff4c4"], 11, 1, 0.3]];
      MUNDOS.forEach((m, j) => {
        const r = Math.max(4, Math.round(S.FH * m[4])), f = mov / (8.5 - j * 0.9) + h(j + 0.6), n = Math.floor(f), alto = S.FH + r * 5, x = Math.round(S.FW * (0.08 + h(j * 3.1 + n * 7.7) * 0.84)), y = Math.round(-r * 2.5 + (f - n) * alto), aro2 = (fr) => m[3] && anilloDe(x, y, r, fr, j === 3 ? "#f0d8ff" : "#fcd87c", j === 3 ? "#7cf4ff" : "#b8a8ff", j === 3 ? "#5c4ca8" : "#a0782c", j === 3 ? "#2c6480" : "#5c4ca8", j === 3 ? 0.25 : -0.2);
        aro2(false); c2.drawImage(esfera(m[0], r, m[1], m[2], -0.4, 0.55, mov * (0.5 + j * 0.13)), x - r, y - r); aro2(true);
      });
      // Piedras sueltas que pasan rápido hacia abajo
      for (let i = 0; i < 9; i++) { const f = mov / (1.2 + h(i) * 1.5) + h(i + 0.4), n = Math.floor(f), g = 2 + Math.round(h(i + 0.2) * 5), x = h(i + n * 1.7) * S.FW, y = (f - n) * (S.FH + 20) - 10; rc("#3c3864", x, y, g, g); rc("#a8a4c4", x, y + g - 1, g, 1); }
      cine();
    },
    // 9. LA LUNA: el suelo lunar pasa despacio, con sus cráteres; en el cielo, un gigante con anillos y un planeta azul
    //    con su luna, los dos girando. Al rato (R.luna[0]) se prenden las estrellas y, más tarde (R.luna[1]), todo se
    //    empieza a romper al ritmo, como si se le despegaran las texturas, hasta que acaba el tramo
    (e) => {
      const yH = Math.round(Math.min(S.FH * 0.76, S.gy + S.H * 0.74)), r1 = Math.round(S.FH * 0.27), r2 = Math.round(S.FH * 0.085), mov = RM ? 30 : S.ts, en = S.ts - e.sec[0], LU = S.R.luna || [14, 25, 2];
      const tG = en - LU[1], bg = Math.floor(tG * (LU[2] || 2)), roto = !RM && tG >= 0 && tG * (LU[2] || 2) - bg < 0.42, fz = roto ? 0.35 + 0.65 * Math.min(1, tG / Math.max(1, e.sec[1] - e.sec[0] - LU[1])) : 0;
      cieloTramado(["#02010c", "#05031c", "#0c0634", "#1a0a4c", "#2c1264"], 0, yH);
      mancha("neb1", "#4c1088", (x, y) => Math.max(0, Math.sin(x * 5 + Math.sin(y * 7) * 1.5) * Math.sin(y * 4.2 + x * 2.5) - 0.25) * 0.9);
      mancha("neb2", "#0c5c8c", (x, y) => Math.max(0, Math.sin(x * 3.1 + 2 + Math.sin(y * 5 + 1) * 1.2) * Math.sin(y * 5 - x * 3) - 0.45) * 0.8);
      mancha("neb3", "#a0247c", (x, y) => Math.max(0, Math.sin(x * 4 - 1 + Math.sin(y * 6 + 2)) * Math.sin(y * 3.3 + x * 4 + 1) - 0.6) * 0.9);
      // Las estrellas: se prenden una tras otra, cada una con su destello; rotas, se ven dobles, en cian y rosa
      const tE = en - LU[0];
      if (tE >= 0) {
        for (let i = 0; i < 200; i++) {
          const f = h(i + 0.21), via = i < 150, x = Math.round(via ? f * S.FW : h(i + 0.13) * S.FW), y = Math.round(via ? S.FH * 0.66 - f * S.FH * 0.62 + (h(i + 0.77) - 0.5) * (h(i + 0.5) + 0.2) * S.FH * 0.3 : S.FH * 0.1 + h(i + 0.57) * yH * 0.8), edad = tE - h(i + 0.9) * 1.6;
          if (y >= yH || edad < 0) continue;
          const c = ["#ffffff", "#b8a8ff", "#7cf4ff", "#ffd8a8"][i % 4];
          if (roto) { const d = Math.round(2 + fz * 6 * h(i + bg)); rc("#00f6ff", x - d, y, 1, 1); rc("#ff3fb4", x + d, y + (i % 3) - 1, 1, 1); continue; }
          if (edad < 0.3 && !RM) { rc("#ffffff", x - 3, y, 7, 1); rc("#ffffff", x, y - 3, 1, 7); }
          else if (!via && i % 3 === 0) { if (RM || (S.t >> 4) % 3 !== i % 3) { rc(c, x - 1, y, 3, 1); rc(c, x, y - 1, 1, 3); } }
          else if (RM || ((S.t >> 3) + i) % 11) rc(c, x, y, 1, 1);
        }
        if (!RM && tE > 2 && !roto) { const n = Math.floor(S.ts / 2.6), p = (S.ts / 2.6 - n) / 0.28; if (p < 1) { const x = S.FW * (0.15 + h(n + 0.3) * 0.7) + p * S.FW * 0.22, y = S.FH * (0.12 + h(n + 0.7) * 0.22) + p * S.FH * 0.1; linea("#7a3fc0", x - 26, y - 12, x - 14, y - 6.5); linea("#7cf4ff", x - 14, y - 6.5, x - 5, y - 2.3); linea("#ffffff", x - 5, y - 2.3, x, y); rc("#ffffff", x - 1, y - 1, 3, 3); } }
      }
      // El sol, asomando tras el horizonte: su resplandor y sus destellos en cruz
      const sx = Math.round(S.FW * 0.67), largo = S.FW * (0.2 + S.pulso * 0.06);
      resplandor(`solL${yH}`, "#fc9c4c", 0.67, yH / S.FH, 0.42); resplandor(`solM${yH}`, "#fcf4c4", 0.67, yH / S.FH, 0.17);
      rc("#fcf4c4", sx - largo, yH - 2, largo * 2, 1); rc("#ffffff", sx - largo * 0.5, yH - 3, largo, 2); linea("#fcd87c", sx - 30, yH - 32, sx + 30, yH + 28); linea("#fcd87c", sx + 30, yH - 32, sx - 30, yH + 28); disco("#ffffff", sx, yH - 1, 6);
      // Un planeta roto: se parte en tajadas que se separan y se corren de lado, y le salen parches de textura perdida
      const pinta = (cv, x, y, r, sem) => {
        if (!roto) { c2.drawImage(cv, x - r, y - r); return; }
        const w = r * 2 + 1, n = 6, alto = Math.ceil(w / n);
        for (let i = 0; i < n; i++) c2.drawImage(cv, 0, i * alto, w, alto, x - r + Math.round((h(sem + i + bg * 1.3) - 0.5) * r * 1.1 * fz), y - r + i * alto + Math.round((i - (n - 1) / 2) * fz * 5), w, alto);
        for (let k = 0; k < 3; k++) { const g = Math.max(2, r >> 3), qx = x + Math.round((h(sem + k + bg * 0.7) - 0.5) * r * 1.5), qy = y + Math.round((h(sem + k + bg * 0.9 + 3) - 0.5) * r * 1.5), m = 2 + Math.floor(h(sem + k + bg) * 3); for (let u = 0; u < m; u++) for (let v = 0; v < m; v++) rc((u + v) % 2 ? "#ff00ff" : "#000000", qx + u * g, qy + v * g, g, g); }
      };
      // El planeta azul y su luna, que le da vueltas
      const ex = Math.round(S.FW * 0.84), ey = Math.round(S.FH * 0.27), am = mov * 0.5, lx2 = ex + Math.cos(am) * r2 * 2.1, ly2 = ey + Math.sin(am) * r2 * 0.5, lunita = () => { disco("#8c8ca8", lx2, ly2, 3); disco("#e8e4f4", lx2 - 1, ly2 + 1, 2); };
      if (Math.sin(am) < 0) lunita();
      pinta(esfera("lB", r2, ["#020a2c", "#0c2a9c", "#1c64d4", "#3cb4e4", "#a8f0ff", "#ffffff"], 7, -0.35, 0.75, mov * 0.45), ex, ey, r2, 40);
      if (Math.sin(am) >= 0) lunita();
      // El gigante y su anillo, que pasa por detrás y por delante, con un brillo que lo recorre
      const px = Math.round(S.FW * 0.2), py = Math.round(S.FH * 0.37 + (RM ? 0 : Math.sin(S.ts * 0.3) * 2)), a = r1 * 2.05, b = r1 * 0.4, ai = r1 * 1.4, bi = (b * ai) / a, incl = -0.2, ox = roto ? Math.round((h(bg + 0.5) - 0.5) * 24 * fz) : 0;
      anilloDe(px + ox, py, r1, false, "#fcd87c", "#b8a8ff", "#a0782c", "#5c4ca8", incl);
      pinta(esfera("lA", r1, ["#1c0638", "#4c1088", "#a0247c", "#e4505c", "#fc9c4c", "#fcd87c", "#fff4c4"], 11, 0.55, 0.5, mov * 0.22), px, py, r1, 10);
      anilloDe(px - ox, py, r1, true, "#fcd87c", "#b8a8ff", "#a0782c", "#5c4ca8", incl);
      { const q = mov * 0.6, x = px + Math.cos(q) * (a + ai) / 2, y = py + Math.cos(q) * (a + ai) / 2 * incl + Math.sin(q) * (b + bi) / 2; if (Math.sin(q) > 0 || Math.abs(Math.cos(q)) * (a + ai) / 2 > r1) { rc("#ffffff", x - 3, y, 7, 1); rc("#ffffff", x, y - 3, 1, 7); } }
      // El suelo lunar: claro en el horizonte y oscuro al frente, con dos sierras al fondo
      cieloTramado(["#e8e4f4", "#a8a4c4", "#6c6890", "#3c3864", "#1c1840", "#0c0a24"], yH, S.FH);
      for (let x = 0; x < S.FW; x += 2) {
        const x1 = x + mov * 2, a1 = 3 + 6 * Math.abs(Math.sin(x1 * 0.021) + Math.sin(x1 * 0.057 + 1) * 0.6), x2 = x + mov * 5 + 400, a2 = 1 + 4 * Math.abs(Math.sin(x2 * 0.03 + 2) + Math.sin(x2 * 0.083) * 0.5);
        rc("#3c3864", x, yH - a1, 2, a1 + 1); rc("#fcd87c", x, yH - a1, 2, 1); rc("#6c6890", x, yH - a2 + 2, 2, a2 + 1); rc("#e8e4f4", x, yH - a2 + 2, 2, 1);
      }
      // Los cráteres y las piedras: los de más cerca, más grandes y más rápidos
      for (let i = 0; i < 16; i++) {
        const k = (i + 0.5) / 16, y = Math.round(yH + 6 + k * k * (S.FH - yH) * 0.82), rx = 5 + k * 30, ry = Math.max(2, Math.round(rx * 0.26)), ancho = S.FW + 160, x = Math.round(((((h(i + 0.9) * ancho - mov * (5 + k * 34)) % ancho) + ancho) % ancho) - 80);
        if (i % 4 === 3) { const g = Math.round(2 + k * 5); rc("#0c0a24", x, y - g, g * 2, g); rc("#e8e4f4", x + 1, y - g, g * 2 - 2, 1); rc("#0c0a24", x + g, y, g * 2, 1); continue; }
        for (let dy = -ry; dy <= ry; dy++) { const w = Math.round(rx * Math.sqrt(1 - (dy / ry) ** 2)); rc(k < 0.4 ? "#e8e4f4" : "#a8a4c4", x - w - 1, y + dy + 1, w * 2 + 2, 1); }
        for (let dy = -ry; dy <= ry; dy++) { const w = Math.round(rx * Math.sqrt(1 - (dy / ry) ** 2)); rc(dy < -ry * 0.2 ? "#0c0a24" : k < 0.4 ? "#3c3864" : "#1c1840", x - w, y + dy, w * 2, 1); }
      }
      // Roto: toda la imagen se corre en tiras, y unas franjas de textura perdida cruzan el suelo
      if (roto) { tiras(Math.round(4 + fz * 8), 6 + fz * 26, bg * 3.7); for (let k = 0; k < 2; k++) { const y = yH + Math.round(h(bg + k + 0.2) * (S.FH - yH) * 0.8), g = 4; for (let x = Math.round(h(bg + k) * S.FW * 0.6), n = 0; n < 10 + fz * 14; n++, x += g) for (let v = 0; v < 2; v++) rc((n + v) % 2 ? "#ff00ff" : "#000000", x, y + v * g, g, g); } }
      cine();
    },
    // 10. LA CASETERA: la cinta va en reversa y se traba a cada rato (el ritmo de las trabas está en R.casete)
    (e) => casetera(e),
    // 11. CIUDAD DE BRILLANTINA: de vuelta en la ciudad, ahora recorriéndola; luces amarillas y azules que chispean
    (e) => ciudadPaseo(e),
    // 12. EL CINTURON: caminando sobre el anillo de un planeta gigante
    (e) => cinturon(e),
    // 13. MULTIVERSO: un túnel de universos, con 2018 al fondo; al final se apagan las luces
    (e) => multiverso(e),
    // 14 y 15 no son tramos: la órbita y el pasillo de puertas, que salen como mundos del multiverso y en los flashazos
    (e) => orbita(e),
    (e) => pasillo(e),
  ];
  // Las barras del DJ: suben y bajan con la energía y el golpe
  const espectro12 = (i) => Math.max(0.05, (0.3 + S.energiaAhora * 0.5) * (0.4 + 0.6 * Math.abs(Math.sin(S.ts * (2 + i * 0.37) + i))) * (0.6 + S.pulso * 0.4));

  Object.assign(BB, { ALBA_F, BAYER, BRASA, ESCENAS_F, FUEGOS, LLAMA, LLAMITA, NOCHE_F, OCASO_F, PF, PORTALES, esferas, espectro12, glitchCiudad, laderas, piedra, portalMal, resplandor, rgbDe });
})();
