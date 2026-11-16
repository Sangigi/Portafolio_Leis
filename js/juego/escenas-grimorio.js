/* ---------- BIT & BUGS · escenas-grimorio.js: escenarios del nivel GRIMORIO ---------- */
(() => {
  "use strict";
  const BB = window.BitBugs, S = BB.S;
  const { LICHE, RM, TAU, bandas, c2, disco, h, haz, linea, osc, rc } = BB;
  Object.assign(BB, { aro, ladrillos, sprFx });

  /* ---------- Escenarios del nivel GRIMORIO (fantasía oscura): siete, uno por tramo ---------- */
  // Puntos repartidos en un círculo (los sellos mágicos) y un sprite pintado en grande sobre el lienzo de efectos
  function aro(c, x, y, r, n, a0, g = 1) { for (let i = 0; i < n; i++) { const a = a0 + (i / n) * TAU; rc(c, x + Math.cos(a) * r, y + Math.sin(a) * r, g, g); } }
  function sprFx(rows, x, y, s, mapa) { rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== ".") rc(mapa[r[i]], x + i * s, y + j * s, s, s); }); }
  // Muro de ladrillo que puede correr hacia abajo (v) y aclararse hacia las orillas
  function ladrillos(base, v, claro, cx) {
    for (let j = -1; j * 8 < S.FH + 8; j++) {
      const fila = Math.floor(v / 8) - j, y = j * 8 + (v % 8), par = ((fila % 2) + 2) % 2;
      for (let i = -1; i * 16 < S.FW; i++) {
        const x = i * 16 + par * 8, d = cx == null ? 0 : Math.abs(x + 8 - cx) / (S.FW / 2);
        rc(osc(base, claro + 0.3 * d * d + 0.16 * h(i * 7 + fila * 13)), x, y, 15, 7);
      }
    }
  }
  const ESCENAS_G = [
    // 1. EL GRIMORIO: la página se llena de runas y un sello late en el centro
    (e) => {
      rc("#07040d", 0, 0, S.FW, S.FH);
      const filas = Math.floor(S.FH / 5), escritas = Math.floor(S.ts * 4);
      for (let i = 0; i < filas && i <= escritas; i++) {
        let x = 6 + ((h(i) * 4) | 0) * 3;
        const segs = 4 + ((h(i + 0.5) * 14) | 0);
        for (let s = 0; s < segs && x < S.FW - 6; s++) { const l = 1 + ((h(i * 7 + s) * 4) | 0); rc(h(i * 3 + s + S.golpeN) < 0.1 ? "#c084ff" : h(i * 3 + s) < 0.3 ? "#3b1f63" : "#1b0f2b", x, 3 + i * 5, l, 3); x += l + 2; }
      }
      const k = Math.min(1, S.ts / e.sec[1]), r = 14 + k * 16 + S.pulso * 3;
      aro("#c084ff", e.cx, e.cy, r, 24, S.ts * 0.4, 2); aro("#ffd23b", e.cx, e.cy, r * 0.62, 12, -S.ts * 0.7, 1); aro("#5b2a8c", e.cx, e.cy, r * 1.35, 36, S.ts * 0.15, 1);
      c2.globalAlpha = k * 0.35; rc("#1b0733", 0, 0, S.FW, S.FH); c2.globalAlpha = 1;
    },
    // 2. BOSQUE MALDITO: luna menguante, tres capas de árboles muertos que pasan, niebla y luciérnagas
    () => {
      bandas(["#04070d", "#060d16", "#08141d", "#0a1a22"], 0, S.FH);
      disco("#cfd8e8", S.FW * 0.78, S.FH * 0.2, 9); disco("#060d16", S.FW * 0.78 + 4, S.FH * 0.2 - 3, 8);
      for (let capa = 0; capa < 3; capa++) {
        const c = ["#0c1c24", "#08131a", "#020608"][capa], paso = [26, 40, 58][capa], corre = S.ts * [2, 5, 9][capa], base = Math.floor(corre / paso);
        for (let j = -1; j < S.FW / paso + 2; j++) {
          const n = base + j, x = j * paso - (corre % paso) + h(n + capa * 9) * paso * 0.5, w = 2 + capa * 2, alto = S.FH * (0.5 + 0.18 * capa) + h(n * 3 + capa) * 22;
          rc(c, x, S.FH - alto, w, alto);
          for (let r = 0; r < 4; r++) { const dir = h(n + r * 5 + capa) > 0.5 ? 1 : -1, len = (5 + h(n * 3 + r) * 9) * (1 + capa * 0.6), y = S.FH - alto + 4 + r * (8 + capa * 4); linea(c, x + w / 2, y + len * 0.4, x + w / 2 + dir * len, y - len * 0.3); }
        }
      }
      c2.globalAlpha = 0.09;
      for (let i = 0; i < 5; i++) rc("#9fb4c8", ((S.ts * 5 * (i + 1) + h(i) * S.FW) % (S.FW + 90)) - 90, S.FH * (0.5 + i * 0.1), 90, 3);
      c2.globalAlpha = 1;
      if (!RM) for (let i = 0; i < 14; i++) if (Math.sin(S.ts * (1 + h(i)) + i * 2) > 0.2) rc(S.pulso > 0.6 ? "#f7ff4a" : "#8fd14f", h(i + 0.2) * S.FW + Math.sin(S.ts * 0.6 + i) * 5, S.FH * (0.3 + h(i + 0.7) * 0.6) + Math.cos(S.ts * 0.8 + i) * 3, 1, 1);
    },
    // 3. CATACUMBAS: muro de ladrillo, columnas con antorchas que laten y nichos con calaveras
    () => {
      rc("#0b0809", 0, 0, S.FW, S.FH);
      ladrillos("#4a3b33", 0, 0.2);
      for (let i = 0; i < 9; i++) { const x = Math.round(h(i) * (S.FW - 14)), y = Math.round(S.FH * (0.5 + h(i + 0.3) * 0.42)); rc("#050304", x, y, 12, 10); rc("#b9b3a3", x + 3, y + 2, 6, 5); rc("#b9b3a3", x + 4, y + 7, 4, 2); rc("#050304", x + 4, y + 4, 1, 2); rc("#050304", x + 7, y + 4, 1, 2); }
      const paso = Math.max(56, S.FW / 5);
      for (let x = paso / 2; x < S.FW; x += paso) {
        rc("#060405", x - 5, 0, 10, S.FH); rc("#15100f", x - 7, 0, 14, 4);
        const fy = S.FH * 0.3, f = RM ? 1 : ((S.t >> 2) + ((x * 7) | 0)) % 3;
        rc("#3a2a20", x - 1, fy, 3, 8); rc("#ff7a1a", x - 2, fy - 3 - f, 5, 3 + f); rc("#ffe14a", x - 1, fy - 2 - f, 3, 2 + f);
        haz("255,140,40", 0.1 + S.pulso * 0.1, x, 8, x, 80, fy - 4, fy + 70);
      }
    },
    // 4. JEFE LICHE.EXE: el liche flota arriba, con la corona puesta y los ojos encendidos; el salón late en rojo
    (e) => {
      bandas(["#0d0206", "#16040a", "#1f060d", "#16040a", "#0a0204"], 0, S.FH);
      const paso = Math.max(48, S.FW / 6);
      for (let x = paso / 2; x < S.FW; x += paso) { rc("#07020a", x - 4, 0, 8, S.FH); rc("#2a0a14", x - 6, S.FH * 0.12, 12, 2); }
      const s = Math.max(2, Math.round(Math.min(60, S.FW * 0.4, S.FH * 0.34) / 14)), lx = e.cx + Math.sin(S.ts * 1.1) * S.W * 0.3, ly = S.gy + S.H * 0.3 - S.pulso * 3 + Math.sin(S.ts * 2) * 2;
      haz("255,40,60", 0.14 + S.pulso * 0.14, lx, 14 * s, lx, S.FW * 0.7, ly, S.FH);
      const x0 = Math.round(lx - 6.5 * s), y0 = Math.round(ly - 7 * s);
      sprFx(LICHE, x0, y0, s, { Y: S.pulso > 0.6 ? "#fff36b" : "#ffd23b", M: "#3b1463", W: "#d9d3c3", K: "#07040d", C: S.pulso > 0.5 ? "#ffffff" : "#ff3b3b", Z: "#22093d" });
      aro("#ff3b3b", lx, ly, 9 * s + S.pulso * 4, 16, S.ts * 0.8, 1);
      if (!RM) for (let i = 0; i < 22; i++) rc(i % 3 ? "#ff7a1a" : "#ffe14a", h(i) * S.FW, S.FH - ((S.ts * (14 + h(i + 0.4) * 26) + h(i + 0.1) * S.FH) % S.FH), 1, 1);
    },
    // 5. LA TORRE: los muros corren hacia abajo mientras BIT sube; pasan ventanas con luz de luna y cadenas
    (e) => {
      rc("#05050a", 0, 0, S.FW, S.FH);
      const v = RM ? 0 : S.ts * (26 + S.energiaAhora * 26);
      ladrillos("#3d4257", v, 0.06, e.cx);
      for (let n = Math.floor((v - S.FH) / 130); n <= Math.floor(v / 130) + 1; n++) {
        const y = v - n * 130, lado = ((n % 2) + 2) % 2, x = lado ? S.FW * 0.86 : S.FW * 0.14;
        rc("#9fb4e8", x - 4, y, 8, 14); rc("#9fb4e8", x - 3, y - 2, 6, 2); rc("#05050a", x, y - 1, 1, 15);
        haz("160,190,255", 0.13, x, 8, e.cx, 70, y + 7, y + 80);
      }
      for (let i = 0; i < 3; i++) { const x = S.FW * (0.3 + i * 0.2); for (let y = -8 + ((v * 0.5) % 8); y < S.FH * (0.2 + h(i) * 0.3); y += 4) rc(y % 8 < 4 ? "#6b7088" : "#3a3f55", x + (Math.round(y / 4) % 2), y, 2, 3); }
    },
    // 6. LA HOGUERA: noche quieta, una espada clavada en la lumbre y chispas que suben
    (e) => {
      bandas(["#03040a", "#050814", "#080c1a", "#0a0f1e"], 0, S.FH);
      for (let i = 0; i < 50; i++) if (h(i + 0.9) > 0.5 || (S.t >> 4) % 2) rc(h(i + 0.3) > 0.8 ? "#ffffff" : "#5d6a8f", h(i) * S.FW, h(i + 0.5) * S.FH * 0.7, 1, 1);
      const x = e.cx, y = S.gy + S.H * 0.66;
      rc("#0d0f14", 0, y + 6, S.FW, S.FH);
      c2.globalAlpha = 0.1 + S.pulso * 0.05; disco("#ff7a1a", x, y, 34); c2.globalAlpha = 0.14; disco("#ffb13b", x, y, 20); c2.globalAlpha = 1;
      rc("#3a2a20", x - 9, y + 4, 18, 3); rc("#2a1c14", x - 6, y + 2, 12, 2);
      for (let i = -3; i <= 3; i++) { const a = (RM ? 5 : 4 + ((h(i + (S.t >> 2)) * 7) | 0)) * (1 - Math.abs(i) / 4.5); rc("#ff5a1a", x + i * 2 - 1, y + 2 - a, 2, a); rc("#ffd23b", x + i * 2 - 1, y + 2 - a * 0.55, 2, a * 0.55); }
      rc("#c9c6b8", x, y - 22, 1, 22); rc("#8f93a8", x - 3, y - 17, 7, 1); rc("#3a2a20", x, y - 26, 1, 4);
      haz("255,150,60", 0.1, x, 10, x, 90, y - 6, y - 80);
      if (!RM) for (let i = 0; i < 12; i++) { const k = (S.ts * (0.2 + h(i) * 0.2) + h(i + 0.3)) % 1; rc(k < 0.5 ? "#ffd23b" : "#ff5a1a", x + (h(i + 0.6) - 0.5) * 30 + Math.sin(S.ts * 2 + i) * 3, y - k * 70, 1, 1); }
    },
    // 7. EL SELLO: el círculo mágico se cierra sobre el libro, cada vez más encendido
    (e) => {
      const k = Math.min(1, Math.max(0, (S.ts - e.sec[0]) / (e.sec[1] - e.sec[0])));
      rc("#0a0514", 0, 0, S.FW, S.FH);
      const R0 = Math.min(S.FW, S.FH) * (0.46 - k * 0.1) + S.pulso * 3, oro = S.pulso > 0.6 || k > 0.85;
      for (let i = 0; i < 6; i++) { const a = S.ts * 0.5 + (i / 6) * TAU, b = a + TAU / 3; linea(oro ? "#ffd23b" : "#7a3fc0", e.cx + Math.cos(a) * R0, e.cy + Math.sin(a) * R0, e.cx + Math.cos(b) * R0, e.cy + Math.sin(b) * R0); }
      aro(oro ? "#fff36b" : "#c084ff", e.cx, e.cy, R0, 48, S.ts * 0.5, 2); aro("#ffd23b", e.cx, e.cy, R0 * 0.72, 24, -S.ts * 0.9, 1); aro("#5b2a8c", e.cx, e.cy, R0 * 1.25, 60, S.ts * 0.2, 1); aro("#c084ff", e.cx, e.cy, R0 * 0.4, 12, S.ts * 1.6, 2);
      for (let i = 0; i < 6; i++) { const a = -S.ts * 0.3 + (i / 6) * TAU; haz("192,132,255", 0.05 + k * 0.1 + S.pulso * 0.05, e.cx + Math.cos(a) * S.FW * 0.5, 16, e.cx, 4, 0, e.cy); }
      if (!RM) for (let i = 0; i < 26; i++) { const a = h(i) * TAU + S.ts * 0.4, d = ((1 - ((S.ts * (0.25 + h(i + 0.5) * 0.3) + h(i + 0.2)) % 1)) * S.FW) / 2; rc(i % 3 ? "#c084ff" : "#ffd23b", e.cx + Math.cos(a) * d, e.cy + Math.sin(a) * d, 1, 1); }
      c2.globalAlpha = k * k * 0.25; rc("#ffd23b", 0, 0, S.FW, S.FH); c2.globalAlpha = 1;
    },
  ];

  Object.assign(BB, { ESCENAS_G });
})();
