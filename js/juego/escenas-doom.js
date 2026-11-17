/* ---------- BIT & BUGS · escenas-doom.js: escenarios del nivel DOOM CROSSING (oculto) ---------- */
(() => {
  "use strict";
  const BB = window.BitBugs, S = BB.S;
  const { DEMONIO, ESPECIES, RM, TAU, aro, bandas, c2, disco, h, haz, linea, mundoDe, rc, sprFx } = BB;
  Object.assign(BB, { escenaDoom, infierno, mundoVideo, pareja, pasarela, portal, pueblo });

  /* ---------- Escenarios del nivel DOOM CROSSING ----------
     Dos mundos que se turnan: un pueblito de colores pastel y un infierno rojo. Los cambios de mundo caen en los mismos
     segundos que en el video oficial de la canción (R.cambios), y se hacen por un portal: un óvalo que crece desde el
     centro y deja ver el otro lado. Por el fondo corre la pareja del nivel, dos robots propios del juego: TANQUE, grande
     y de visor rosa, y ROBI, chico y redondo. En el pueblo pasean; en el infierno van mandando diablillos a volar. */
  const TANQUE = ["....MM......", "..SSSSSSSS..", "..SVVVVVVS..", "..SSSSSSSS..", ".SSSSSSSSSS.", "SSDSSSSSSDSS", "SS.SSCCSS.SS", "SS.SSSSSS.SS", "FF.SSSSSS.FF", "...SS..SS...", "...SS..SS...", "..DDD..DDD.."];
  const ROBI = ["...C....", "..WWWW..", ".WWWWWW.", ".WKWWKW.", ".WWWWWW.", ".WWKKWW.", "..WWWW..", "..C..C.."];
  const COL_DUO = { S: "#5a6b9a", D: "#2a3358", V: "#ff3fb4", C: "#00f6ff", F: "#ffd23b", M: "#ff3fb4", W: "#9be8ff", K: "#05030f" };
  // La pareja corriendo por el horizonte. modo: "p" pasean (con redes si caza), "i" a toda prisa, tirando diablillos
  function pareja(y, modo, caza) {
    const vel = modo === "i" ? 46 : 20, x = ((S.ts * vel) % (S.FW + 120)) - 60, paso = RM ? 0 : (S.t >> (modo === "i" ? 2 : 3)) % 2, s = 2;
    const ty = y - 12 * s + (paso && modo === "i" ? -1 : 0);
    sprFx(TANQUE.slice(0, 9), x, ty, s, COL_DUO);
    sprFx(TANQUE.slice(9), x + (paso ? s : 0), ty + 9 * s, s, COL_DUO);
    const rx = x - 26, ry = y - 8 * s - Math.abs(Math.sin(S.ts * (modo === "i" ? 9 : 5))) * 5;
    sprFx(ROBI, rx, ry, s, COL_DUO);
    if (caza) for (const [bx, by] of [[x + 20, ty - 6], [rx + 12, ry - 8]]) { linea("#ffd23b", bx - 6, by + 12, bx, by + 2); aro("#ffffff", bx + 2, by - 2, 4, 8, 0); }
    if (modo !== "i") return;
    // Tres diablillos se le echan encima y salen volando al compás
    for (let i = 0; i < 3; i++) {
      const f = (S.ts * 1.5 + i / 3) % 1, vuela = f > 0.62, k = vuela ? (f - 0.62) / 0.38 : 0;
      const dx = vuela ? x + 30 + k * 70 : x + 30 + (1 - f / 0.62) * 80, dy = vuela ? y - 12 - Math.sin(k * 3.1) * 44 : y - 10 - Math.abs(Math.sin(S.ts * 8 + i)) * 3;
      sprFx(ESPECIES.L[(S.t >> 2) % 2], dx, dy, 1, { R: vuela ? "#ffffff" : "#ff2a4a", W: "#ffd23b", K: "#05030f" });
      if (vuela && k < 0.25) { rc("#ffffff", x + 26, y - 16, 6, 2); rc("#ffd23b", x + 28, y - 18, 2, 6); }
    }
  }
  // El pueblo, a distintas horas: 0 amanecer, 1 día, 2 tarde, 3 noche, 4 nublado en rojo, 5 atardecer
  function pueblo(hora) {
    const noche = hora === 3, rojo = hora === 4;
    bandas([["#ffd9c2", "#ffe9c9", "#fff3d6", "#d8f3ff"], ["#7dd3fc", "#a5e3ff", "#c9f0ff", "#e6f9ff"], ["#ffb86b", "#ffcf8a", "#ffe2a8", "#fff0c9"], ["#0b1030", "#141a44", "#1d2658", "#2a3470"], ["#7a3b4a", "#a3505a", "#c9736b", "#e0a58a"], ["#ff7a59", "#ff9d6b", "#ffc27d", "#ffe0a3"]][hora], 0, S.FH);
    if (noche) for (let i = 0; i < 40; i++) if (h(i + 0.9) > 0.4 || (S.t >> 4) % 2) rc("#ffffff", h(i) * S.FW, h(i + 0.5) * S.FH * 0.5, 1, 1);
    disco(noche ? "#fff6d8" : rojo ? "#ff8a70" : "#fff6b0", S.FW * 0.78, S.FH * (hora === 5 ? 0.45 : 0.2), 9 + S.pulso * 1.5);
    for (let i = 0; i < 4; i++) {
      const x = ((S.ts * (3 + i) + h(i) * S.FW) % (S.FW + 60)) - 40, y = S.FH * (0.08 + h(i + 0.4) * 0.25), c = noche ? "#3a4680" : rojo ? "#8a4a55" : "#ffffff";
      rc(c, x, y, 26, 5); rc(c, x + 5, y - 3, 14, 4); rc(c, x + 8, y + 4, 16, 3);
    }
    const verde = noche ? ["#12402f", "#0c2f24"] : rojo ? ["#5a6b3a", "#44552c"] : ["#7ddc6b", "#4fbf5a"];
    const loma = (x, capa) => S.FH * (0.62 + capa * 0.12) + Math.sin((x + capa * 40) * 0.035 + capa) * 7 + Math.sin(x * 0.013 + 2) * 5;
    for (let capa = 0; capa < 2; capa++) {
      for (let x = 0; x < S.FW; x += 2) { const y = loma(x, capa); rc(verde[capa], x, y, 2, S.FH - y); }
      // Entre una loma y la otra: casitas de techos de colores y árboles redondos con fruta, que se mecen con el golpe
      if (capa === 0) for (let i = 0; i < 6; i++) {
        const x = Math.round(S.FW * (0.06 + i * 0.18) + h(i) * 12), y = Math.round(loma(x, 0)) + 2;
        if (i % 2) {
          const techo = ["#ff6b6b", "#5aa9ff", "#ffb13b"][i % 3];
          rc("#fff3d6", x - 7, y - 9, 14, 9);
          for (let k = 0; k < 5; k++) rc(techo, x - 9 + k * 2, y - 10 - k, 18 - k * 4, 1);
          rc("#8a5a3a", x - 2, y - 5, 4, 5); rc(noche ? "#ffe14a" : "#bfe9ff", x + 3, y - 7, 3, 3);
        } else {
          rc("#8a5a3a", x - 1, y - 8, 3, 8); disco(noche ? "#1d6b4a" : rojo ? "#6b7a3a" : "#3fbf5a", x, y - 13, 7 + (S.pulso > 0.6 ? 1 : 0));
          rc("#ff6b6b", x - 3, y - 14, 2, 2); rc("#ff6b6b", x + 2, y - 11, 2, 2);
        }
      }
    }
    for (let i = 0; i < 60; i++) rc(noche ? "#1a5a40" : rojo ? "#36451f" : "#3fa84c", h(i) * S.FW, S.FH * (0.76 + h(i + 0.2) * 0.23), 2, 1);
    if (!RM) for (let i = 0; i < 18; i++) rc(noche ? "#fff6b0" : i % 2 ? "#ffb3d9" : "#ffffff", (h(i) * S.FW + S.ts * (8 + h(i + 0.3) * 10)) % S.FW, (h(i + 0.5) * S.FH + S.ts * (10 + h(i + 0.1) * 8)) % S.FH, 1, 1);
  }
  // El infierno: cielo de sangre, un eclipse, sierras dentadas, un río de lava que late y pilares en llamas
  function infierno(nivel) {
    bandas(["#120004", "#2a0308", "#4a060c", "#7a0d0f", "#b3260f"], 0, S.FH * 0.72);
    rc("#1a0206", 0, S.FH * 0.7, S.FW, S.FH);
    disco("#ff3b1a", S.FW * 0.5, S.FH * 0.28, 14 + S.pulso * 2); disco("#120004", S.FW * 0.5, S.FH * 0.28, 10);
    for (let capa = 0; capa < 2; capa++) for (let x = 0; x < S.FW; x += 3) {
      const n = Math.floor(x / 3), y = S.FH * (0.52 + capa * 0.12) - Math.abs(((n * 7 + capa * 13) % 17) - 8) * (1.6 + capa) - h(n + capa) * 5;
      rc(capa ? "#0a0002" : "#2a0308", x, y, 3, S.FH - y);
    }
    const ly = S.FH * 0.82;
    for (let x = 0; x < S.FW; x += 2) { const y = ly + Math.sin(x * 0.05 + S.ts * 2) * 2; rc(S.pulso > 0.6 ? "#ffd23b" : "#ff7a1a", x, y, 2, 3); rc("#b3260f", x, y + 3, 2, S.FH - y); }
    for (let i = 0; i < 4; i++) {
      const x = S.FW * (0.12 + i * 0.25), f = RM ? 2 : ((S.t >> 2) + i) % 3;
      rc("#0a0002", x - 3, S.FH * 0.44, 6, S.FH * 0.4); rc("#2a0308", x - 5, S.FH * 0.44, 10, 2);
      rc("#ff7a1a", x - 2, S.FH * 0.44 - 4 - f, 5, 4 + f); rc("#ffe14a", x - 1, S.FH * 0.44 - 3 - f, 3, 2 + f);
    }
    if (!RM) for (let i = 0; i < 24 + nivel * 12; i++) rc(i % 3 ? "#ff7a1a" : "#ffe14a", h(i) * S.FW, S.FH - ((S.ts * (16 + h(i + 0.4) * 30) + h(i + 0.1) * S.FH) % S.FH), 1, 1);
    if (!RM && nivel && S.pulso > 0.85) { c2.globalAlpha = 0.12; rc("#ff2a1a", 0, 0, S.FW, S.FH); c2.globalAlpha = 1; }
  }
  // Un portal: óvalo por el que se ve la escena 'dentro', con su aro de chispas
  function portal(x, y, rx, dentro, e) {
    const ry = rx * 1.6;
    if (rx < 1) return;
    c2.save();
    c2.beginPath(); c2.ellipse(x, y, rx, ry, 0, 0, TAU); c2.clip();
    dentro(e);
    c2.restore();
    for (let i = 0; i < 40; i++) { const a = (i / 40) * TAU + S.ts * 2; rc(i % 3 ? "#ff2a4a" : i % 2 ? "#ffd23b" : "#ffffff", x + Math.cos(a) * (rx + (RM ? 0 : Math.random() * 2)), y + Math.sin(a) * (ry + (RM ? 0 : Math.random() * 2)), rx > 20 ? 2 : 1, rx > 20 ? 2 : 1); }
  }
  // La pasarela: cortinas a rayas y reflectores rosas que barren al compás
  function pasarela() {
    for (let x = 0; x < S.FW; x += 12) rc(x % 24 ? "#7a2a6b" : "#a33a8a", x, 0, 12, S.FH);
    rc("#3a1040", 0, S.FH * 0.7, S.FW, S.FH);
    for (let i = 0; i < 4; i++) { const x = S.FW * (0.15 + i * 0.23); haz("255,200,230", 0.16 + S.pulso * 0.12, x, 4, x + Math.sin(S.ts * 1.3 + i * 1.7) * S.FW * 0.2, 60, 0, S.FH * 0.7); }
    for (let i = 0; i < 24; i++) if ((S.t >> 3) % 3 === i % 3) rc("#ffffff", h(i) * S.FW, h(i + 0.5) * S.FH * 0.7, 1, 1);
  }
  const conPareja = (f, modo, caza) => (e) => { f(e); pareja(Math.round(S.FH * 0.66), modo, caza); };
  // Cada tramo trae sus dos caras [pueblo, infierno]; los que van sueltos (jefe, túnel, pantalla partida) son una sola escena
  const ESCENAS_D = [
    [conPareja(() => pueblo(0), "p"), conPareja(() => infierno(0), "i")],
    [conPareja(() => pueblo(1), "p"), conPareja(() => infierno(0), "i")],
    [conPareja(() => pueblo(1), "p"), conPareja(() => infierno(0), "i")],
    [conPareja(() => pueblo(2), "p", true), conPareja(() => infierno(1), "i")],
    [conPareja(() => pueblo(1), "p", true), conPareja(() => infierno(1), "i")],
    [conPareja(pasarela, "p"), conPareja(() => infierno(1), "i")],
    // JEFE DEMONIO.EXE: una calavera con cuernos flota sobre la lava, con los ojos encendidos
    (e) => {
      infierno(2);
      const s = Math.max(2, Math.round(Math.min(60, S.FW * 0.4, S.FH * 0.34) / 12)), lx = e.cx + Math.sin(S.ts * 1.2) * S.W * 0.3, ly = S.gy + S.H * 0.3 - S.pulso * 3 + Math.sin(S.ts * 2) * 2;
      haz("255,60,20", 0.14 + S.pulso * 0.14, lx, 13 * s, lx, S.FW * 0.7, ly, S.FH);
      sprFx(DEMONIO, Math.round(lx - 6.5 * s), Math.round(ly - 6 * s), s, { R: "#b3260f", W: "#e8e0d0", K: "#0a0002", Y: S.pulso > 0.5 ? "#ffffff" : "#ffd23b" });
    },
    // ENTRE DIMENSIONES: BIT vuela por el túnel entre los dos mundos; pasan portales por los que se asoma el pueblo
    (e) => {
      bandas(["#2a0308", "#4a060c", "#7a0d0f", "#b3260f", "#7a0d0f", "#4a060c", "#2a0308"], 0, S.FH);
      if (!RM) for (let i = 0; i < 40; i++) { const v = 60 + h(i) * 140, x = S.FW - ((S.ts * v + h(i + 0.3) * S.FW) % S.FW); rc(i % 4 ? "#ff7a1a" : "#ffe14a", x, h(i + 0.6) * S.FH, 3 + v / 40, 1); }
      for (let i = 0; i < 2; i++) { const x = S.FW + 50 - ((S.ts * 34 + i * (S.FW + 100) / 2) % (S.FW + 100)); portal(x, S.FH * (0.3 + i * 0.4), 16 + S.pulso * 2, () => pueblo(i ? 2 : 1), e); }
    },
    // DOS MUNDOS: la pantalla partida, el pueblo de un lado y el infierno del otro; la raya se mece con la música
    (e) => {
      const corte = e.cx + Math.sin(S.ts * 1.4) * S.FW * 0.12, inc = S.FH * 0.18;
      pueblo(1);
      c2.save();
      c2.beginPath(); c2.moveTo(corte + inc, 0); c2.lineTo(S.FW, 0); c2.lineTo(S.FW, S.FH); c2.lineTo(corte - inc, S.FH); c2.closePath(); c2.clip();
      infierno(1);
      c2.restore();
      linea(S.pulso > 0.6 ? "#ffffff" : "#ffd23b", corte + inc, 0, corte - inc, S.FH); linea("#0a0002", corte + inc + 1, 0, corte - inc + 1, S.FH);
    },
    [conPareja(() => pueblo(5), "p"), conPareja(() => infierno(0), "i")],
  ];
  // En qué mundo va el video en este segundo, y cuándo fue el último cambio y cuándo viene el siguiente
  function mundoVideo() {
    let m = 0, ult = -9, sig = 1e9;
    for (const c of S.R.cambios || []) { if (S.ts >= c) { m ^= 1; ult = c; } else { sig = c; break; } }
    return { m, ult, sig };
  }
  // El mundo que se ve ahora (para el traje de BIT): el del video en los tramos de dos caras; el del tramo en los demás
  const mundoVis = () => (Array.isArray(ESCENAS_D[S.secI]) ? (mundoVideo().m ? "i" : "p") : mundoDe(S.secI));
  // La escena del tramo. Al cambiar de mundo, el otro lado entra por un portal que crece desde el centro; si el cambio
  // viene tras un rato largo en el mismo mundo, un par de segundos antes ya se ve el portal abierto a la derecha
  function escenaDoom(e) {
    const par = ESCENAS_D[S.secI];
    if (!Array.isArray(par)) { par(e); return; }
    const { m, ult, sig } = mundoVideo(), en = S.ts - ult;
    if (!RM && en < 0.55) { par[m ^ 1](e); portal(e.cx, e.cy, Math.pow(en / 0.55, 2) * Math.hypot(S.FW, S.FH) * 0.5, par[m], e); return; }
    par[m](e);
    if (sig - S.ts < 2.5 && sig - ult > 6) portal(S.FW * 0.88, S.FH * 0.5, Math.min(12, (2.5 - (sig - S.ts)) * 8) + S.pulso * 1.5, par[m ^ 1], e);
  }

  Object.assign(BB, { COL_DUO, ESCENAS_D, ROBI, TANQUE, conPareja, mundoVis });
})();
