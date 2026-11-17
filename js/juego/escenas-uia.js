/* ---------- BIT & BUGS · escenas-uia.js: escenarios del nivel u i a Cat ---------- */
(() => {
  "use strict";
  const BB = window.BitBugs, S = BB.S;
  const { RM, T, TAU, bandas, c2, disco, espectro, h, haz, linea, osc, poligono, rc, texto, tiras } = BB;

  const ESCENAS = [
    // 1. ARRANQUE: la consola corre sus comandos... hasta que GATO.EXE la tumba con un error crítico
    (e) => {
      rc(S.col.F, 0, 0, S.FW, S.FH);
      const tErr = S.R.error, roto = S.ts >= tErr, tt = Math.min(S.ts, tErr);
      const filas = Math.floor(S.FH / 4), escritas = Math.floor(tt * 6), off = Math.max(0, escritas - filas + 2);
      for (let i = 0; i < filas; i++) {
        const n = i + off;
        if (n > escritas) break;
        // Cada renglón es un comando: su > y luego lo que contesta la consola
        rc(roto ? S.col.R : S.col.W, 3, 2 + i * 4, 2, 2);
        let x = 8 + ((h(n) * 3) | 0) * 4;
        const segs = 1 + ((h(n + 0.5) * 7) | 0);
        for (let s = 0; s < segs && x < S.FW - 6; s++) {
          let l = 4 + ((h(n * 7 + s) * 24) | 0);
          if (n === escritas && !roto) l = Math.min(l, ((tt * 6) % 1) * 140 - s * 20);
          if (l < 1) break;
          const verde = h(n * 3 + s) < 0.3;
          // Conforme se acerca el error, algunos renglones ya salen en rojo
          const malo = roto ? h(n + s + S.golpeN) < 0.7 : S.ts > tErr - 4 && h(n * 5 + s) < (S.ts - (tErr - 4)) / 8;
          rc(malo ? osc(S.col.R, roto ? 0.75 : 0.55) : verde ? (S.pulso > 0.5 ? S.col.V : "#1d5c3f") : S.col.D, x, 2 + i * 4, Math.min(l, S.FW - 3 - x), 2);
          x += l + 3;
        }
        if (n === escritas && !roto && (S.t >> 3) % 2) rc(S.col.W, Math.min(x, S.FW - 5), 2 + i * 4, 2, 2);
      }
      if (!roto) { rc("rgba(65,184,131,.07)", 0, (S.ts * 34) % (S.FH + 10) - 8, S.FW, 8); return; }
      // El error crítico: todo en rojo, la imagen rota y el aviso con el culpable
      const edad = S.ts - tErr;
      if (!RM) tiras(7, 14, Math.floor(S.ts * 14));
      c2.globalAlpha = RM ? 0.2 : 0.14 + 0.1 * ((S.t >> 2) % 2);
      rc("#ff0030", 0, 0, S.FW, S.FH);
      c2.globalAlpha = 1;
      const an = Math.min(S.FW - 8, 132), al = 36, bx = Math.round(e.cx - an / 2), by = Math.round(Math.max(6, S.gy + S.H * 0.14));
      if (edad > 0.08) {
        rc("#000000", bx + 3, by + 3, an, al);
        rc((S.t >> 3) % 2 || RM ? S.col.R : "#7a0018", bx, by, an, al);
        rc("#000000", bx + 2, by + 2, an - 4, al - 4);
        texto(S.col.R, T("ERROR CRITICO", "CRITICAL ERROR"), e.cx, by + 15);
        if (edad > 0.45) texto(S.col.W, "GATO.EXE", e.cx, by + 28);
      }
    },
    // 2. CIUDAD NEON: sol de rayas, edificios de lado a lado y una rejilla que avanza con el compás hasta el borde de la pantalla
    (e) => {
      const hy = Math.round(S.gy + S.H * 0.6), cx = e.cx;
      bandas(["#0d0221", "#150430", "#1b0638", "#2d0a4e", "#4a0f5e", "#6b1560"], 0, hy);
      for (let i = 0; i < 60; i++) if (h(i + Math.floor(S.ts * 2 + h(i) * 9)) > 0.2) rc(i % 9 === 0 ? S.col.C : "#8a6fb0", h(i) * S.FW, h(i + 0.5) * hy * 0.7, 1, 1);
      const r = Math.round(Math.min(S.FW * 0.17, S.FH * 0.3) + S.pulso * 2);
      for (let dy = -r; dy <= 0; dy++) {
        const w = Math.round(Math.sqrt(r * r - dy * dy)), y = hy + dy, f = -dy / r;
        if (f < 0.6 && (y + (S.t >> 3)) % 4 === 0) continue;
        rc(f > 0.66 ? S.col.Y : f > 0.33 ? S.col.N : S.col.P, cx - w, y, w * 2, 1);
      }
      // El espectro de la música sale del horizonte, detrás de los edificios: barras finas que suben y bajan suave,
      // rosas abajo y cian en la punta, más altas hacia las orillas para no pelear con el sol
      for (let x = 1, i = 0; x < S.FW; x += 4, i++) {
        const lejos = Math.min(1, Math.abs(x - cx) / (S.FW * 0.5)), meta2 = Math.abs(x - cx) < r + 3 ? 0 : (0.12 + 0.88 * S.vu) * (0.3 + 0.7 * h(i * 1.7 + S.golpeN)) * (0.35 + 0.65 * lejos);
        espectro[i] = (espectro[i] || 0) + (meta2 - (espectro[i] || 0)) * 0.22;
        const alto = espectro[i] * S.FH * 0.34;
        if (alto < 1) continue;
        rc(osc(S.col.P, 0.75), x, hy - alto, 3, alto);
        rc(S.col.M, x, hy - alto, 3, Math.min(alto, alto * 0.45));
        rc(S.col.C, x, hy - alto, 3, 1);
      }
      for (let x = 0, i = 0; x < S.FW; i++) {
        const w = 6 + ((h(i) * 9) | 0), alto = Math.abs(x + w / 2 - cx) < r ? 3 + ((h(i + 0.3) * 3) | 0) : 6 + ((h(i + 0.3) * S.FH * 0.2) | 0);
        rc("#150a2e", x, hy - alto, w, alto);
        for (let wy = hy - alto + 2; wy < hy - 1; wy += 3) for (let wx = x + 1; wx < x + w - 1; wx += 3) if (h(i * 13 + wx * 7 + wy) < 0.45) rc(h(i + wx + wy + (S.golpeN >> 2)) < 0.6 ? S.col.Y : "#5a3d1e", wx, wy, 1, 1);
        x += w + 1;
      }
      rc("#0a0118", 0, hy, S.FW, S.FH - hy);
      for (let j = -16; j <= 16; j++) linea("#5a2a9c", cx + j * 5, hy, cx + j * S.FW * 0.2, S.FH);
      const fase = ((S.ts * e.sec[3]) / 60) % 1;
      for (let k = 0; k < 8; k++) { const pp = (k + fase) / 8; rc(k % 2 ? S.col.M : S.col.P, 0, hy + (S.FH - hy) * pp * pp, S.FW, 1); }
      rc(S.col.P, 0, hy, S.FW, 1);
    },
    // 3. BAJO EL AGUA: la música suena tapada. Los rayos entran desde arriba de la pantalla y se pierden en el fondo
    () => {
      bandas(["#0f4c82", "#0b3d6e", "#0a3260", "#082650", "#061b3d", "#04122b"], 0, S.FH);
      // La superficie, ondulando arriba
      c2.fillStyle = "rgba(190,233,255,.5)";
      for (let x = 0; x < S.FW; x++) c2.fillRect(x, Math.round(1.5 + Math.sin(x * 0.15 + S.ts * 2) * 1.2 + Math.sin(x * 0.4 - S.ts * 3) * 0.8), 1, 1);
      for (let i = 0; i < 8; i++) {
        const x0 = (S.FW * (i + 0.5)) / 8 + S.FW * 0.12 + Math.sin(S.ts * 0.3 + i * 1.7) * S.FW * 0.05, ancho = 5 + h(i) * 11;
        const brillo = Math.max(0.03, 0.13 + 0.09 * Math.sin(S.ts * 0.9 + i * 2.3) + S.pulso * 0.06);
        haz("150,215,255", brillo, x0, ancho, x0 - S.FH * 0.42 + Math.sin(S.ts * 0.4 + i) * 5, ancho * 3.2, 0, S.FH * (0.75 + 0.2 * h(i + 0.4)));
      }
      rc("#0a2a3d", 0, S.FH - 3, S.FW, 3);
      for (let x = 3, i = 0; x < S.FW; x += 9 + ((h(i) * 9) | 0), i++) {
        const alto = 9 + ((h(i + 0.2) * S.FH * 0.16) | 0);
        for (let j = 0; j < alto; j++) rc(j % 4 < 2 ? "#1f7a5a" : "#17604a", x + Math.round(Math.sin(S.ts * 2 + j * 0.35 + i) * (j / alto) * 3), S.FH - 3 - j, 2, 1);
      }
      // Un cardumen que cruza y peces sueltos
      const tramo = S.FW + 80, xc = ((S.ts * 16) % tramo) - 40, yc = S.FH * 0.3 + Math.sin(S.ts * 0.6) * S.FH * 0.08;
      for (let i = 0; i < 16; i++) rc("#9fdcff", xc + h(i) * 34 + Math.sin(S.ts * 3 + i) * 1.5, yc + h(i + 0.5) * 16 + Math.cos(S.ts * 2.4 + i * 2) * 1.5, 2, 1);
      for (let i = 0; i < 5; i++) {
        const dir = i % 2 ? 1 : -1, tr = S.FW + 30;
        let x = (S.ts * (9 + i * 4) + h(i) * tr) % tr;
        if (dir < 0) x = tr - x;
        x -= 15;
        const y = S.FH * (0.14 + 0.16 * i) + Math.sin(S.ts * 1.5 + i) * 2, c = i % 3 === 0 ? S.col.Y : S.col.N;
        rc(c, x, y, 5, 3);
        rc(c, dir > 0 ? x - 2 : x + 5, y + ((S.t >> 3) % 2), 2, 2);
        rc(S.col.K, dir > 0 ? x + 3 : x + 1, y + 1, 1, 1);
      }
      for (let i = 0; i < 38; i++) {
        const g = i % 4 === 0 ? 2 : 1;
        rc("#7fd4ff", h(i) * S.FW + Math.sin(S.ts * 1.6 + i * 2) * 3, S.FH - ((S.ts * (7 + h(i + 0.3) * 16) + h(i + 0.7) * S.FH) % S.FH), g, g);
      }
    },
    // 4. DESPEGUE: las estrellas salen del centro y aceleran por toda la pantalla mientras la canción sube
    (e) => {
      rc("#05030f", 0, 0, S.FW, S.FH);
      const L = e.sec[1] - e.sec[0], seg = Math.max(0, S.ts - e.sec[0]), k = Math.min(1, seg / L);
      const fase = 0.12 * seg + (0.5 * seg * seg * seg) / (L * L), radio = Math.hypot(S.FW, S.FH) / 2 + 8;
      for (let i = 0; i < 130; i++) {
        const a = h(i) * TAU, d = (h(i + 0.5) + fase * (0.6 + h(i + 0.8) * 0.8)) % 1, r = d * d * radio + 6, largo = 1 + k * k * 18 * d + S.pulso * 2;
        const c = d < 0.3 ? "#555a77" : i % 5 === 0 ? S.col.C : i % 7 === 0 ? S.col.Y : "#ffffff";
        linea(c, e.cx + Math.cos(a) * r, e.cy + Math.sin(a) * r, e.cx + Math.cos(a) * (r - largo), e.cy + Math.sin(a) * (r - largo));
      }
    },
    // 5. JEFE, GATO.EXE satura la memoria. El fondo va apagado y en azules para que se lea el recuadro:
    //    lo único rosa en pantalla es lo que hace daño (el rayo que carga y cae)
    (e) => {
      const FONDO = "#070b1c", CELDA = "#0d1330", VIVA = "#25337a", ROSA = "#ff2e7e";
      rc(FONDO, 0, 0, S.FW, S.FH);
      // La memoria: una cuadrícula de celdas; entre más llena va, más se encienden
      for (let y = 4, j = 0; y < S.FH; y += 10, j++) for (let x = 4, i = 0; x < S.FW; x += 14, i++) rc(h(i * 7 + j * 13 + (S.golpeN >> 1)) < 0.05 + S.peligro * 0.025 ? VIVA : CELDA, x, y, 10, 6);
      // Con cada bombo sale un aro del gato, apenas visible
      S.anillos.forEach((tg) => {
        const edad = S.ts - tg;
        if (edad < 0 || edad > 0.9) return;
        const r = 18 + edad * 170;
        c2.globalAlpha = (1 - edad / 0.9) * 0.55;
        for (let i = 0; i < 44; i++) { const a = (i * TAU) / 44; rc(VIVA, S.gatoX + Math.cos(a) * r, S.gatoY + Math.sin(a) * r * 0.8, 2, 2); }
        c2.globalAlpha = 1;
      });
      // Cuando el gato carga un rayo, un aro rosa se cierra sobre él: es la señal de que viene el golpe
      const carga = S.ataques.find((a) => !a.hecho);
      if (carga) {
        const k = Math.min(1, (S.ts - carga.t0) / (carga.t1 - carga.t0)), r = Math.min(64, S.FW * 0.42, S.FH * 0.36) * (1.15 - 0.55 * k);
        for (let i = 0; i < 18; i++) { const a = S.ts * 3 + (i * TAU) / 18; rc(i % 2 ? ROSA : "#ffffff", S.gatoX + Math.cos(a) * r - 1, S.gatoY + Math.sin(a) * r - 1, 3, 3); }
      }
      // Con la memoria casi llena, la pantalla late en rojo
      if (S.peligro >= S.JEFE_TOPE - 3) { c2.globalAlpha = 0.06 + 0.05 * (S.peligro - (S.JEFE_TOPE - 3)) + 0.08 * S.pulso; rc("#ff0030", 0, 0, S.FW, S.FH); c2.globalAlpha = 1; }
    },
    // 6. NOCHE EN CALMA: la canción descansa. Luna, nubes de orilla a orilla, cerros y luciérnagas
    () => {
      bandas(["#060920", "#070b22", "#0a1030", "#0e173f", "#131f4f", "#1a2a60"], 0, S.FH);
      for (let i = 0; i < 110; i++) if (h(i + Math.floor(S.ts * 1.5 + h(i + 0.9) * 7)) > 0.25) rc(i % 6 === 0 ? S.col.Y : "#cfd6ff", h(i) * S.FW, h(i + 0.5) * S.FH * 0.8, 1, 1);
      const mx = Math.round(S.FW * 0.84), my = Math.round(S.FH * 0.17);
      c2.globalAlpha = 0.08; disco("#f1edcf", mx, my, 15); c2.globalAlpha = 0.12; disco("#f1edcf", mx, my, 12); c2.globalAlpha = 1;
      disco("#f1edcf", mx, my, 9);
      rc("#d4cfa8", mx - 4, my - 3, 3, 2); rc("#d4cfa8", mx + 2, my + 2, 3, 2); rc("#d4cfa8", mx - 1, my + 5, 2, 1);
      // Una estrella fugaz cada tanto
      const tf = S.ts % 5.5;
      if (tf < 0.5) { const x0 = S.FW * (0.15 + h(Math.floor(S.ts / 5.5)) * 0.5) + tf * 90, y0 = S.FH * 0.08 + tf * 40; linea("#ffffff", x0, y0, x0 - 9, y0 - 4); }
      for (let i = 0; i < 8; i++) {
        const tr = S.FW + 70, x = ((S.ts * (2.5 + i * 1.1) + h(i) * tr) % tr) - 55, y = 8 + h(i + 0.2) * S.FH * 0.5, c = i % 2 ? "#2a3970" : "#35478a";
        rc(c, x, y, 30, 4); rc(c, x + 6, y - 3, 16, 3); rc(c, x + 13, y + 4, 22, 2);
      }
      for (let x = 0; x < S.FW; x++) { const alto = 16 + Math.sin(x * 0.045 + 1) * 8 + Math.sin(x * 0.11) * 3; rc("#0d1a45", x, S.FH - alto, 1, alto); }
      for (let x = 0; x < S.FW; x++) { const alto = 8 + Math.sin(x * 0.07) * 4 + Math.sin(x * 0.19 + 2) * 2; rc("#0a1330", x, S.FH - alto, 1, alto); }
      for (let i = 0; i < 16; i++) if (Math.sin(S.ts * 2 + i * 1.7) > 0) rc(S.col.Y, h(i) * S.FW + Math.sin(S.ts * 0.7 + i) * 8, S.FH - 12 - h(i + 0.3) * S.FH * 0.3 + Math.cos(S.ts * 0.9 + i * 2) * 4, 1, 1);
    },
    // 7. LLUVIA DE CODIGO: cae por toda la pantalla, cada vez más rápido hasta el último estribillo
    (e) => {
      rc("#020a05", 0, 0, S.FW, S.FH);
      const L = e.sec[1] - e.sec[0], seg = Math.max(0, S.ts - e.sec[0]), fase = seg + (seg * seg) / L;
      const TONOS = ["#d9ffe6", S.col.V, "#2a8a5f", "#1d5c3f", "#123a28", "#0b2419"];
      for (let c = 0; c * 5 < S.FW; c++) {
        const cab = ((fase * (16 + h(c) * 26) + h(c + 0.4) * (S.FH + 70)) % (S.FH + 70)) - 10;
        for (let j = 0; j < 12; j++) {
          const y = Math.round(cab - j * 5);
          if (y < -4 || y > S.FH) continue;
          c2.fillStyle = TONOS[j < 1 ? 0 : Math.min(5, 1 + (j >> 1))];
          const bits = (h(c * 31 + j * 17 + Math.floor(fase * 3 + h(c) * 9) * 7) * 4096) | 0;
          for (let b = 0; b < 12; b++) if ((bits >> b) & 1) c2.fillRect(c * 5 + 1 + (b % 3), y + ((b / 3) | 0), 1, 1);
        }
      }
    },
    // 8. HIPERESPACIO: rayos que giran desde el centro hasta las esquinas, anillos con cada bombo y colores que cambian cada cuatro
    (e) => {
      const pares = [[S.col.P, S.col.M], [S.col.B, S.col.C], [S.col.N, S.col.R], [S.col.V, S.col.C]], par = pares[RM ? 0 : (S.golpeN >> 2) % 4];
      const a0 = S.ts * (RM ? 0.25 : 1.3), n = 14, radio = Math.hypot(S.FW, S.FH), cx = e.cx, cy = e.cy;
      rc(osc(par[1], 0.28), 0, 0, S.FW, S.FH);
      for (let i = 0; i < n; i += 2) {
        const a = a0 + (i * TAU) / n, b = a0 + ((i + 1) * TAU) / n;
        poligono(osc(par[0], 0.45), 1, [[cx, cy], [cx + Math.cos(a) * radio, cy + Math.sin(a) * radio], [cx + Math.cos(b) * radio, cy + Math.sin(b) * radio]]);
      }
      for (let i = 0; i < 50; i++) {
        const a = h(i) * TAU, d = (h(i + 0.5) + S.ts * 1.4 * (0.6 + h(i + 0.2))) % 1, r = d * d * radio * 0.6 + 8, largo = 2 + d * 10;
        linea("#ffffff", cx + Math.cos(a) * r, cy + Math.sin(a) * r, cx + Math.cos(a) * (r - largo), cy + Math.sin(a) * (r - largo));
      }
      if (!RM) for (const tg of S.anillos) {
        const edad = S.ts - tg;
        if (edad < 0 || edad > 0.7) continue;
        const rx = 8 + edad * 260, ry = rx * 0.6;
        c2.globalAlpha = (1 - edad / 0.7) * 0.6;
        rc("#ffffff", cx - rx, cy - ry, rx * 2, 1); rc("#ffffff", cx - rx, cy + ry, rx * 2, 1);
        rc("#ffffff", cx - rx, cy - ry, 1, ry * 2); rc("#ffffff", cx + rx, cy - ry, 1, ry * 2);
        c2.globalAlpha = 1;
      }
    },
    // 9. ABISMO: la canción se hunde. Ondas lentas de lado a lado, plancton y un resto de luz que ya casi no llega
    () => {
      bandas(["#030714", "#02040c", "#030714", "#040a1c"], 0, S.FH);
      for (let i = 0; i < 3; i++) { const x0 = S.FW * (0.25 + i * 0.3) + Math.sin(S.ts * 0.2 + i) * 8; haz("70,120,200", 0.07 + S.pulso * 0.04, x0, 8, x0 - S.FH * 0.3, 30, 0, S.FH * 0.6); }
      for (let w = 0; w < 5; w++) {
        const yb = S.FH * (0.2 + w * 0.16), amp = 2 + S.energiaAhora * 8 + S.pulso * 2.5;
        c2.fillStyle = ["#1b4a8a", "#174079", "#143663", "#102c52", "#0d2444"][w];
        for (let x = 0; x < S.FW; x++) c2.fillRect(x, Math.round(yb + Math.sin(x * 0.07 + S.ts * (1.2 - w * 0.2) + w * 2) * amp + Math.sin(x * 0.21 - S.ts) * 1.5), 1, 1);
      }
      for (let i = 0; i < 46; i++) rc(i % 5 === 0 ? "#6f9bd8" : "#3b5a8f", h(i) * S.FW + Math.sin(S.ts * 0.6 + i) * 4, S.FH - ((S.ts * (2 + h(i + 0.3) * 5) + h(i + 0.7) * S.FH) % S.FH), 1, 1);
    },
    // 10. LIMPIEZA: el antivirus borra a GATO.EXE renglón por renglón; al llegar a 100 %, virus eliminado
    (e) => {
      rc("#020805", 0, 0, S.FW, S.FH);
      const k = BB.limpieza(), listo = k >= 1;
      // Renglones de registro que suben
      for (let i = 0; i < S.FH / 4 + 1; i++) {
        const n = i + Math.floor(S.ts * 5);
        let x = 3;
        for (let s = 0; s < 1 + ((h(n + 0.5) * 6) | 0) && x < S.FW - 6; s++) { const l = 4 + ((h(n * 7 + s) * 22) | 0); rc(h(n * 3 + s) < 0.35 ? "#143d2b" : "#0c1f17", x, i * 4 - ((S.ts * 20) % 4), Math.min(l, S.FW - 3 - x), 2); x += l + 3; }
      }
      const an = Math.min(S.FW - 12, 150), bx = Math.round(e.cx - an / 2), ty = Math.round(Math.max(22, S.gy + S.H * 0.2));
      rc("rgba(0,0,0,.6)", bx - 4, ty - 12, an + 8, 34);
      if (listo) texto((S.t >> 3) % 2 || RM ? S.col.V : "#d9ffe6", T("VIRUS ELIMINADO", "VIRUS REMOVED"), e.cx, ty);
      else texto(S.col.W, T("LIMPIANDO GATO.EXE", "CLEANING CAT.EXE"), e.cx, ty);
      // La barra de avance, por segmentos
      rc(S.col.G, bx, ty + 6, an, 9);
      rc("#020805", bx + 1, ty + 7, an - 2, 7);
      const segs = Math.floor((an - 4) / 5);
      for (let i = 0; i < Math.round(segs * k); i++) rc(listo ? S.col.V : i % 2 ? "#2a8a5f" : S.col.V, bx + 2 + i * 5, ty + 8, 4, 5);
      texto(listo ? S.col.V : S.col.Y, `${Math.round(k * 100)}%`, e.cx, ty + 28);
      if (listo && !RM) { const edad = S.ts - (S.R.sec[9][0] + S.R.limpia); if (edad < 0.5) { c2.globalAlpha = (1 - edad / 0.5) * 0.6; rc("#d9ffe6", 0, 0, S.FW, S.FH); c2.globalAlpha = 1; } }
    },
  ];

  Object.assign(BB, { ESCENAS });
})();
