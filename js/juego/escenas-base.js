/* ---------- BIT & BUGS · escenas-base.js: herramientas de dibujo para los escenarios (lienzo de efectos) ---------- */
(() => {
  "use strict";
  const BB = window.BitBugs, S = BB.S;
  const { c2, fx } = BB;
  Object.assign(BB, { disco, haz, linea, osc, poligono, rayo, texto, tiras });

  /* ---------- 13. Escenarios del modo ritmo: uno por cada parte de la canción ----------
     Se dibujan en el lienzo de efectos, que cubre toda la pantalla: el recuadro del juego es solo una ventana.
     e = { cx, cy: centro del recuadro · suelo: la línea del piso del juego · sec: la sección actual } */
  const TAU = Math.PI * 2;
  // Azar que no cambia de un cuadro a otro: cada estrella, burbuja o edificio cae siempre en su lugar
  const h = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const rc = (c, x, y, w, hh) => { c2.fillStyle = c; c2.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(hh))); };
  function linea(c, x0, y0, x1, y1) {
    c2.fillStyle = c;
    const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    for (let i = 0; i <= n; i++) c2.fillRect(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), 1, 1);
  }
  const bandas = (cols, ya, yb) => cols.forEach((c, i) => rc(c, 0, ya + ((yb - ya) * i) / cols.length, S.FW, (yb - ya) / cols.length + 1));
  function disco(c, x, y, r) { for (let dy = -r; dy <= r; dy++) { const w = Math.round(Math.sqrt(r * r - dy * dy)); rc(c, x - w, y + dy, w * 2, 1); } }
  function poligono(c, alfa, pts) {
    c2.globalAlpha = alfa;
    c2.fillStyle = c;
    c2.beginPath();
    pts.forEach(([x, y], i) => (i ? c2.lineTo(x, y) : c2.moveTo(x, y)));
    c2.fill();
    c2.globalAlpha = 1;
  }
  // Un haz de luz que suma brillo y se desvanece a lo largo: rayos de sol bajo el agua, reflectores de la disco
  function haz(rgb, brillo, x0, ancho0, x1, ancho1, y0, y1) {
    const g = c2.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, `rgba(${rgb},${brillo})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    c2.globalCompositeOperation = "lighter";
    c2.fillStyle = g;
    c2.beginPath();
    c2.moveTo(x0 - ancho0 / 2, y0); c2.lineTo(x0 + ancho0 / 2, y0); c2.lineTo(x1 + ancho1 / 2, y1); c2.lineTo(x1 - ancho1 / 2, y1);
    c2.fill();
    c2.globalCompositeOperation = "source-over";
  }
  function texto(c, txt, x, y) { c2.font = `8px "Press Start 2P"`; c2.textAlign = "center"; c2.fillStyle = c; c2.fillText(txt, Math.round(x), Math.round(y)); }
  // Tiras de la imagen que se corren de lado, como una señal con interferencia
  function tiras(n, fuerza, semilla) {
    for (let i = 0; i < n; i++) {
      const y = Math.floor(h(semilla + i) * S.FH), alto = 2 + Math.floor(h(semilla + i + 0.5) * 9), dx = Math.round((h(semilla + i + 0.8) - 0.5) * 2 * fuerza);
      c2.drawImage(fx, 0, y, S.FW, alto, dx, y, S.FW, alto);
    }
  }
  // Un rayo en zigzag entre dos puntos
  function rayo(x0, y0, x1, y1, c, grosor) {
    const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 7));
    let px = x0, py = y0;
    for (let i = 1; i <= n; i++) {
      const k = i / n, nx = x0 + (x1 - x0) * k + (i < n ? (Math.random() - 0.5) * 9 : 0), ny = y0 + (y1 - y0) * k + (i < n ? (Math.random() - 0.5) * 9 : 0);
      c2.fillStyle = c;
      const pasos = Math.max(1, Math.round(Math.max(Math.abs(nx - px), Math.abs(ny - py))));
      for (let j = 0; j <= pasos; j++) c2.fillRect(Math.round(px + ((nx - px) * j) / pasos), Math.round(py + ((ny - py) * j) / pasos), grosor, grosor);
      px = nx; py = ny;
    }
  }
  // Un color más apagado (f de 0 a 1), para que el fondo no le gane a los bugs
  const oscuros = {};
  function osc(hex, f) {
    const k = hex + f;
    if (!oscuros[k]) {
      const n = parseInt(hex.slice(1), 16);
      oscuros[k] = `rgb(${Math.round(((n >> 16) & 255) * f)},${Math.round(((n >> 8) & 255) * f)},${Math.round((n & 255) * f)})`;
    }
    return oscuros[k];
  }

  Object.assign(BB, { TAU, bandas, h, oscuros, rc });
})();
