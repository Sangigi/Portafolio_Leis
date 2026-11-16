/* ---------- BIT & BUGS · clasico.js: movimiento de BIT y el modo clásico ---------- */
(() => {
  "use strict";
  const BB = window.BitBugs, S = BB.S;
  const { BH, FK, GROOVE_MAX, RM, SANDE, T, azar, bip, bitY, carriles, cmd, ctx, filaY, fin, hud, pasoCierre, pasoOrden, pasoRitmo, piso, rotulo, tactil, xBit, xBug } = BB;
  Object.assign(BB, { alCompas, atrapa, dejaEstela, flamaCtx, fuerzaEstela, moverBit, nace, paso, pison, saltaA });

  /* ---------- 11. Movimiento de BIT y el paso del modo clásico ---------- */
  // Modo clásico: nace un bug en un carril al azar
  function nace() {
    const r = Math.random();
    const tipo = S.vidas < 3 && r < 0.05 ? "cafe" : r < 0.13 ? "oro" : "bug";
    const v = (0.42 + S.nivel * 0.07) * (tipo === "oro" ? 1.45 : tipo === "cafe" ? 0.8 : 1) * azar(0.85, 1.15);
    const c = (Math.random() * carriles) | 0;
    S.objs.push({ tipo, c, x: xBug(c), y: 1, v, e: "ABCDE"[S.nivel % 5] });
    S.grietas.push({ x: xBug(c) + 4, vida: 16 });
  }
  // BIT salta de carril en carril: un salto por toque y, si dejas la tecla, sigue saltando rápido.
  // Con el mouse o el dedo, brinca directo al carril que señalas.
  function saltaA(c) {
    c = Math.max(0, Math.min(carriles - 1, c));
    if (c === S.bit.c || S.aplastando) return;
    if (FK() && S.modo === "ritmo" && S.estado === "jugando" && !S.vuela) alCompas();
    // Donde arrancó el salto queda una copia que tarda más en irse
    const f = fuerzaEstela();
    if (!RM) { if (f >= 2) S.ecos.push({ x: S.bit.x, y: S.bit.y, vida: 30, max: 30, c: SANDE[0] }); else if (!f) S.fantasmas.push({ x: S.bit.x, vida: 6 }); }
    S.bit.c = c;
    S.estira = 1;
  }
  // FUTURE FUNK: si el salto cae a menos de una décima de segundo de un golpe de la música, sube el groove
  function alCompas() {
    const g = S.R.golpes;
    let mejor = 9;
    for (let i = Math.max(0, S.rG - 2); i < Math.min(g.length, S.rG + 2); i++) mejor = Math.min(mejor, Math.abs(g[i] / 100 - S.ts));
    if (mejor > 0.1) return;
    S.grooveT = S.ts; S.grooveFx = 9;
    bip(2600, 0, 0.02, "square", 0.018); bip(1300, 0, 0.03, "triangle", 0.02);
    if (S.groove < GROOVE_MAX && ++S.groove === GROOVE_MAX) {
      S.textos.push({ txt: "GROOVE x2", x: S.W / 2, y: S.H * 0.4, vida: 60, max: 60, c: "#00f6ff", e: 1.5 });
      [659, 880, 1109, 1319].forEach((f, i) => bip(f, 0, 0.09, "square", 0.035, i * 0.05));
    }
    if (!RM) for (let i = 0; i < 6; i++) S.chispas.push({ x: S.bit.x + 5, y: S.bit.y + 11, vx: azar(-1.8, 1.8), vy: azar(-1.6, -0.4), vida: 12, c: i % 2 ? "#00f6ff" : "#ff3fb4", g: 1 });
  }
  // Qué tanta estela deja BIT: 0 nada, 1 corta y azul (partes tranquilas), 2 larga, 3 larga y a todo color (estribillos, vuelo, fiebre)
  function fuerzaEstela() {
    if (S.modo !== "ritmo" || S.secI < 0) return 0;
    if (S.vuela || S.fiebre > S.ts || (FK() && S.groove >= GROOVE_MAX)) return 3;
    return (S.R.fuerte || [1, S.JEFE]).includes(S.secI) ? 3 : (S.R.sube || [3, 6]).includes(S.secI) ? 2 : S.secI === 0 || S.secI === S.R.sec.length - 1 ? 0 : 1;
  }
  function dejaEstela() {
    const f = fuerzaEstela();
    if (!f || RM) return;
    const vida = f === 3 ? 24 : f === 2 ? 17 : 10;
    S.ecos.push({ x: S.bit.x, y: S.bit.y, vida, max: vida, c: f === 1 ? SANDE[1 + (S.ecoN++ % 3)] : SANDE[S.ecoN++ % SANDE.length] });
    if (S.ecos.length > 70) S.ecos.splice(0, S.ecos.length - 70);
  }
  function moverBit() {
    if (S.vuela) {
      // Vuelo libre: flechas o WASD en las cuatro direcciones, o seguir al puntero
      const tope = S.W > 150 ? 3.1 : 2.4, ax = (S.der ? 1 : 0) - (S.izq ? 1 : 0), ay = (S.aba ? 1 : 0) - (S.arr ? 1 : 0);
      if (ax || ay) { S.meta = null; S.vx = Math.max(-tope, Math.min(tope, S.vx + ax * 0.75)); S.vy = Math.max(-tope, Math.min(tope, S.vy + ay * 0.75)); }
      else if (S.meta != null) { S.vx = Math.max(-4.5, Math.min(4.5, (S.meta - 5 - S.bit.x) * 0.3)); S.vy = Math.max(-4.5, Math.min(4.5, (S.metaY - 6 - S.bit.y) * 0.3)); }
      if (!ax && S.meta == null) S.vx *= 0.72;
      if (!ay && S.meta == null) S.vy *= 0.72;
      // En vuelo libre (sin terminal) el campo es la pantalla entera, menos las franjas negras de arriba y de abajo
      const borde = S.modoLibre ? Math.round(S.FH * 0.09) + 2 : 0;
      S.bit.x = Math.max(0, Math.min(S.W - 10, S.bit.x + S.vx));
      S.bit.y = Math.max(S.modoLibre ? borde : 12, Math.min(S.modoLibre ? S.H - borde - 12 : bitY(), S.bit.y + S.vy));
      S.bit.c = Math.max(0, Math.min(carriles - 1, Math.floor((S.bit.x + 5) / S.LW)));
      if (Math.abs(S.vx) + Math.abs(S.vy) > 0.7 && S.t % 2 === 0) dejaEstela();
      return;
    }
    // Mientras lo aplastan no hay control: BIT camina solo al carril del centro y ahí se queda
    if (S.aplastando) { S.meta = null; S.metaY = null; S.dirTecla = 0; S.bit.c = carriles >> 1; }
    if (S.lateral) {
      // Tramo lateral: BIT se queda a la izquierda y cambia de fila; el dedo o el mouse lo llevan a la fila que señalan
      if (S.meta != null && S.metaY != null) saltaA(Math.round((S.metaY - 6 - filaY(0)) / ((piso() - 28) / (carriles - 1))));
      const ty = filaY(S.bit.c), dy = ty - S.bit.y;
      if (Math.abs(dy) > 0.5) { S.bit.y = Math.abs(dy) <= 7 ? ty : S.bit.y + Math.sign(dy) * 7; dejaEstela(); if (S.bit.y === ty) S.aplasta = 5; }
      S.bit.x += (14 - S.bit.x) * 0.3;
      if (Math.abs(14 - S.bit.x) < 0.6) S.bit.x = 14;
      return;
    }
    if (S.dirTecla) { S.meta = null; if (--S.rep <= 0) { saltaA(S.bit.c + S.dirTecla); S.rep = 11; } }
    else if (S.meta != null) saltaA(Math.floor(S.meta / S.LW));
    // El salto es una carrera corta de dos o tres cuadros hasta el carril nuevo, dejando estela
    const tx = xBit(S.bit.c), d = tx - S.bit.x, v = Math.max(5, S.LW / 3);
    if (d) {
      // Dos copias por cuadro: la estela sale tupida aunque el salto dure un instante
      const x0 = S.bit.x;
      S.bit.x = Math.abs(d) <= v ? tx : S.bit.x + Math.sign(d) * v;
      const x1 = S.bit.x;
      S.bit.x = (x0 + x1) / 2; dejaEstela();
      S.bit.x = x1; dejaEstela();
      // Al llegar frena de golpe: se aplasta y levanta polvo
      if (x1 === tx) {
        S.estira = 0; S.aplasta = 5;
        if (!RM) for (let i = 0; i < 4; i++) S.chispas.push({ x: tx + (i % 2 ? 9 : 0), y: S.bit.y + 11, vx: (i % 2 ? 1 : -1) * azar(0.4, 1.3), vy: azar(-0.9, -0.2), vida: 9, c: "#8f93a8", g: 1 });
      }
    }
    const dy = bitY() - S.bit.y;
    S.bit.y = Math.abs(dy) < 1 ? bitY() : S.bit.y + dy * 0.3;
  }
  // Al atrapar: onda, pedazos de color que saltan, BIT brilla y se aplasta, y la cámara da un golpecito
  function atrapa(o, color, fuerza = 1) {
    S.aplasta = 5;
    S.brillo = 3;
    S.brinco = 6;
    S.punch = Math.min(2, S.punch + 0.55 * fuerza);
    if (RM) return;
    S.ondas.push({ x: o.x + 5, y: o.y + 4, vida: 10, max: 10, c: color, r: 5 + fuerza * 3 });
    for (let i = 0; i < 9 + fuerza * 5; i++) S.chispas.push({ x: o.x + 5, y: o.y + 4, vx: azar(-2.3, 2.3), vy: azar(-3, -0.4), vida: 14 + ((Math.random() * 10) | 0), c: i % 3 === 0 ? "#ffffff" : color, g: i % 2 ? 2 : 1 });
  }
  function paso() {
    S.t++;
    if (S.mensajeT > 0 && --S.mensajeT === 0) S.mensaje = "";
    if (S.bocaT > 0 && --S.bocaT === 0) S.boca = "n";
    if (S.temblor > 0) S.temblor--;
    if (--S.parpadeo < -150) S.parpadeo = 6;
    S.grietas.forEach((g) => g.vida--); S.grietas = S.grietas.filter((g) => g.vida > 0);
    S.destellos.forEach((d) => d.vida--); S.destellos = S.destellos.filter((d) => d.vida > 0);
    // Los puntos saltan de golpe y luego flotan
    S.textos.forEach((x) => { x.y -= x.vida > (x.max || 40) - 6 ? 1.6 : 0.3; x.vida--; }); S.textos = S.textos.filter((x) => x.vida > 0);
    S.fantasmas.forEach((f) => f.vida--); S.fantasmas = S.fantasmas.filter((f) => f.vida > 0);
    S.ecos.forEach((f) => f.vida--); S.ecos = S.ecos.filter((f) => f.vida > 0);
    S.ondas.forEach((f) => f.vida--); S.ondas = S.ondas.filter((f) => f.vida > 0);
    S.burbujas.forEach((b) => { b.y -= 0.45; b.x += Math.sin((S.t + b.vida) * 0.2) * 0.3; b.vida--; }); S.burbujas = S.burbujas.filter((b) => b.vida > 0 && b.y > 10);
    if (S.brillo > 0) S.brillo--;
    if (S.brinco > 0) S.brinco--;
    for (let i = 0; i < S.celdas.length; i++) if (S.celdas[i] > 0) S.celdas[i]--;
    S.punch *= 0.8;
    if (S.dano > 0) S.dano--;
    if (S.interferencia > 0) S.interferencia--;
    S.chispas.forEach((c) => { c.x += c.vx; c.y += c.vy; c.vy += 0.16; c.vida--; }); S.chispas = S.chispas.filter((c) => c.vida > 0);
    if (S.aplasta > 0) S.aplasta--;
    if (S.destello > 0) S.destello--;
    if (S.grooveFx > 0) S.grooveFx--;
    if (S.golpeY > 0) S.golpeY--;
    S.latK += ((S.lateral && S.estado !== "titulo" ? 1 : 0) - S.latK) * 0.1;
    if (S.estado === "cierre" && S.cierre) { pasoCierre(); return; }
    if (S.estado !== "jugando") return;
    if (S.modo === "ritmo") { pasoRitmo(); return; }
    if (S.pistaT > 0 && --S.pistaT === 280) { if (tactil) cmd("BIT.EXE", "BIT.EXE", "OK: toca un carril o desliza", "OK: tap a lane or slide", "controles"); else cmd("BIT.EXE", "BIT.EXE", "OK: flechas o A/D, un salto por toque", "OK: arrows or A/D, one hop per tap", "controles"); }
    pasoOrden();
    moverBit();
    // Bugs: cada versión salen más seguido y más rápido
    if (--S.sig <= 0) { nace(); S.sig = Math.max(20, 60 - S.nivel * 5) * azar(0.7, 1.2); }
    const by = bitY();
    for (const o of S.objs) {
      o.y += o.v;
      o.x = xBug(o.c);
      if (o.y + BH >= by + 1 && o.y <= by + 9 && o.c === S.bit.c) {
        o.fuera = true;
        atrapa(o, o.tipo === "oro" ? "#ffe14a" : o.tipo === "cafe" ? "#ffffff" : S.col.R, o.tipo === "bug" ? 1 : 2);
        if (o.tipo === "cafe") { S.vidas = Math.min(3, S.vidas + 1); S.textos.push({ txt: "+1", x: o.x + 5, y: o.y, vida: 40, max: 40, c: S.col.R, e: 1 }); bip(523, 0, 0.09); bip(784, 0, 0.12, "square", 0.05, 0.1); }
        else {
          const n = o.tipo === "oro" ? 50 : 10;
          const antes = Math.floor(S.pts / 100);
          S.pts += n;
          S.textos.push({ txt: `+${n}`, x: o.x + 5, y: o.y, vida: 40, max: 40, c: o.tipo === "oro" ? S.col.Y : S.col.W, e: 1 });
          bip(o.tipo === "oro" ? 880 : 660, o.tipo === "oro" ? 1760 : 990, o.tipo === "oro" ? 0.16 : 0.08);
          if (Math.floor(S.pts / 100) > antes) {
            S.nivel = Math.floor(S.pts / 100);
            S.mensaje = T(`LANZAMIENTO v1.${S.nivel}`, `RELEASE v1.${S.nivel}`);
            S.mensajeT = 90;
            [523, 659, 784, 1047].forEach((f, i) => bip(f, 0, 0.09, "square", 0.04, 0.12 + i * 0.08));
          }
        }
        S.boca = "s"; S.bocaT = 24;
        hud();
      } else if (o.y + BH >= piso()) {
        o.fuera = true;
        if (o.tipo === "cafe") continue;
        S.vidas--;
        S.destellos.push({ x: o.x, vida: 30 });
        S.mensaje = T("¡BUG EN PRODUCCION!", "BUG IN PRODUCTION!");
        S.mensajeT = 70;
        S.boca = "o"; S.bocaT = 45;
        if (!RM) S.temblor = 10;
        bip(180, 70, 0.3, "sawtooth", 0.06);
        hud();
        if (S.vidas <= 0) { fin(); break; }
      }
    }
    S.objs = S.objs.filter((o) => !o.fuera);
  }

  // Un pisón de la fábrica: cuelga arriba mientras avisa (franjas amarillas y negras en su casilla), cae hasta el piso
  // en su golpe y vuelve a subir; los de la escena del aplastamiento se quedan abajo
  function pison(a, k, x, w) {
    const py = piso(), abajo = a.hecho, edad = abajo ? S.ts - a.t1 : 0, alto = 12, tope = py - alto, falta = a.t1 - S.ts;
    const trabado = a.traba && !abajo && S.ts >= a.traba - 0.09;
    let yy;
    // Entre el primer golpe y el segundo del triple: rebota alto y vuelve a caer
    const repite = abajo && a.t2 && !a.hecho2;
    if (repite) { const f = a.t2 - S.ts; yy = edad < 0.05 ? tope : f < 0.06 ? tope - (Math.max(0, f) / 0.06) * 18 : tope - Math.min(18, ((edad - 0.05) / 0.09) * 18); }
    else if (abajo) yy = a.queda || edad < 0.05 ? tope : edad < 0.12 ? tope - 3 : edad < 0.2 ? tope : tope - ((edad - 0.2) / 0.22) * (tope - 10);
    // Trabado: se queda a medio camino dando brincos, como un disco rayado, y cae de golpe al final
    else if (trabado) yy = falta < 0.07 ? tope - (falta / 0.07) * (tope * 0.5) : 10 + (tope - 10) * 0.42 + ((S.t >> 1) % 3) * 3 - 3;
    // Normal: cuelga, se echa para atrás un instante y cae en las últimas centésimas, para tocar el piso justo en el golpe
    else { const f = a.traba ? a.traba - 0.09 - S.ts : falta; yy = f < 0.07 ? 7 + (1 - Math.max(0, f) / 0.07) * ((a.traba ? 10 + (tope - 10) * 0.42 : tope) - 7) : f < 0.24 ? 10 + k * k * 8 - (1 - (f - 0.07) / 0.17) * 5 : 10 + k * k * 8; }
    yy = Math.max(7, Math.round(yy));
    if (repite) { for (let i = 0; i < w; i += 4) { ctx.fillStyle = ((i >> 2) + (S.t >> 1)) % 2 ? "#ffe14a" : "#000000"; ctx.fillRect(x + i, py - 2, Math.min(4, w - i), 2); } ctx.fillStyle = "rgba(255,225,74,.22)"; ctx.fillRect(x, 9, w, py - 9); }
    if (!abajo) {
      ctx.fillStyle = `rgba(255,225,74,${(0.07 + 0.17 * Math.min(1, k)).toFixed(3)})`; ctx.fillRect(x, 9, w, py - 9);
      for (let i = 0; i < w; i += 4) { ctx.fillStyle = ((i >> 2) + (S.t >> 2)) % 2 ? "#ffe14a" : "#000000"; ctx.fillRect(x + i, py - 2, Math.min(4, w - i), 2); }
      // La sombra en el piso se cierra conforme se acerca el golpe
      const ws = Math.round((w - 4) * Math.min(1, 0.35 + 0.65 * k)); ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(x + ((w - ws) >> 1), py - 4, ws, 2);
      rotulo(trabado ? "?" : "!", x + w / 2, py - 8, (S.t >> 2) % 2 ? "#ffffff" : "#ffe14a");
    }
    const m = x + (w >> 1);
    const cabeza = (dx, c1, c2x, solo) => {
      ctx.fillStyle = c2x; ctx.fillRect(m - 2 + dx, 9, 5, Math.max(0, yy - 9));
      if (!solo) { ctx.fillStyle = "#8f93a8"; ctx.fillRect(m - 2 + dx, 9, 1, Math.max(0, yy - 9)); ctx.fillStyle = "#000000"; ctx.fillRect(x + dx, yy - 1, w, alto + 2); }
      ctx.fillStyle = c1; ctx.fillRect(x + 1 + dx, yy, w - 2, alto);
    };
    // Trabado deja dos copias de colores a los lados, como imagen con falla
    if (trabado && !RM) { ctx.globalAlpha = 0.55; cabeza(-3, "#00f6ff", "#00f6ff", true); cabeza(3, "#ff3fb4", "#ff3fb4", true); ctx.globalAlpha = 1; }
    cabeza(0, "#3a4058", "#565c78");
    ctx.fillStyle = "#8f93a8"; ctx.fillRect(x + 1, yy, w - 2, 2); ctx.fillRect(x + 1, yy, 1, alto);
    ctx.fillStyle = "#565c78"; ctx.fillRect(x + 4, yy + 4, 2, 2); ctx.fillRect(x + w - 6, yy + 4, 2, 2);
    for (let i = 0; i < w - 2; i += 4) { ctx.fillStyle = (i >> 2) % 2 ? "#ffe14a" : "#111111"; ctx.fillRect(x + 1 + i, yy + alto - 3, Math.min(4, w - 2 - i), 3); }
    // El azote: un destello a ras del piso que se abre hacia los lados
    if (abajo && edad < 0.14) { const e2 = Math.round((edad / 0.14) * 16); ctx.fillStyle = edad < 0.06 ? "#ffffff" : "#ffe14a"; ctx.fillRect(x - e2, py - 1, w + e2 * 2, edad < 0.06 ? 3 : 1); }
  }
  // Una llama dentro del recuadro del juego (para la casilla quemada)
  function flamaCtx(spr, x, yBase, pal, fase) {
    const alto = spr.length;
    for (let j = 0; j < alto; j++) { const r = spr[j], k = 1 - j / alto, dx = RM ? 0 : Math.round(Math.sin(S.ts * 7 + fase + k * 3.2) * k * 2); for (let i = 0; i < r.length; i++) if (r[i] !== ".") { ctx.fillStyle = pal[r[i]]; ctx.fillRect(x + i + dx, yBase - alto + j, 1, 1); } }
  }
})();
