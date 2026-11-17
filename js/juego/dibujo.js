/* ---------- BIT & BUGS · dibujo.js: el dibujo del recuadro del juego (BIT, bugs, ataques, piso y barra) ---------- */
(() => {
  "use strict";
  const BB = window.BitBugs, S = BB.S;
  const { ANTIVIRUS, APAGA_BLANCO, BH, BICHOS, BW, CAFE, CAMPANA, CAMPANAS_ESCUDO, CRIA, DM, ESPECIES, FK, G, GROOVE_MAX, GUSANO_CUERPO, MUTA, MUTA_D, MUTA_F, MUTA_G, ORO_MAPA, P, PACKS, RM, RUNA, SANDE, SKINS, T, TONOS_COMBO, UIA, azar, cajaRect, cajaS, carriles, chispazo, contorno, ctx, dibujaLlave, dibujaMuerte, dibujaOrden, filaY, flamaCtx, fogonazo, h2, letras, lienzo, multi, muriendo, nivelCombo, pinta, piso, pison, ponLibre, quiereLibre, rotulo, silueta, tactil, viste } = BB;
  Object.assign(BB, { dibuja });

  /* ---------- 12. Dibujo del recuadro del juego ---------- */
  function dibuja() {
    const ritmo = S.modo === "ritmo" && S.estado !== "cargando" && S.secI >= 0;
    ponLibre(quiereLibre());
    // El blanco del destello también tapa al juego (BIT, bugs y textos) y se aclara con él, al mismo paso que la escena
    { const ch0 = ritmo && S.estado === "jugando" ? chispazo() : null, velo = ch0 ? Math.min(1, (ch0.d - ch0.e) / APAGA_BLANCO) : 0; if (velo !== S.veloPuesto) { S.veloPuesto = velo; lienzo.style.opacity = velo ? (1 - velo).toFixed(3) : ""; } }
    ctx.save();
    // En ritmo el recuadro es una ventana: el escenario se ve a través, apenas oscurecido para que los bugs resalten
    if (ritmo) ctx.clearRect(0, 0, S.W, S.H);
    ctx.fillStyle = S.modoLibre ? "rgba(0,0,0,0)" : ritmo ? (FK() && S.R.pisones && S.secI === S.R.pisones[1] ? "rgba(2,2,8,.8)" : "rgba(2,4,10,.56)") : S.col.F;
    ctx.fillRect(0, 0, S.W, S.H);
    // Por dentro es una terminal: renglones de barrido y una guía tenue entre carriles
    ctx.fillStyle = "rgba(0,0,0,.16)";
    if (!S.modoLibre) for (let y = 9; y < piso(); y += 2) ctx.fillRect(0, y, S.W, 1);
    if (S.lateral) { ctx.fillStyle = "rgba(255,255,255,.06)"; for (let c = 0; c < carriles - 1; c++) for (let x = 12; x < S.W; x += 4) ctx.fillRect(x, Math.round((filaY(c) + filaY(c + 1)) / 2) + 6, 2, 1); }
    else if (!S.vuela) { ctx.fillStyle = "rgba(255,255,255,.06)"; for (let c = 1; c < carriles; c++) for (let y = 11; y < piso(); y += 4) ctx.fillRect(Math.round(c * S.LW), y, 1, 2); }
    // El multiplicador de la racha, enorme y tenue al fondo del recuadro: va detrás de todo, así que no tapa nada
    if (ritmo && S.estado === "jugando" && nivelCombo() > 0) {
      const nv = nivelCombo(), k = S.W > 150 ? 9 : 6, txt = `X${multi()}`;
      ctx.save();
      ctx.translate(Math.round(S.W / 2 - (txt.length * 4 - 1) * k / 2), Math.round(9 + (piso() - 9) * 0.5 - 2.5 * k));
      ctx.scale(k, k);
      ctx.globalAlpha = Math.min(0.3, 0.11 + S.punch * 0.1);
      letras(txt, 0, 0, TONOS_COMBO[Math.min(nv, TONOS_COMBO.length - 1)]);
      ctx.restore();
    }
    if (S.temblor) ctx.translate(S.temblor % 2 ? 1 : -1, 0);
    // El azote del pisón: todo brinca hacia abajo y rebota
    if (S.golpeY > 0) ctx.translate(0, S.golpeY > 6 ? 3 : S.golpeY > 3 ? -2 : S.golpeY % 2 ? 1 : 0);
    // La memoria que GATO.EXE va llenando: celdas que suben desde el piso, verdes, luego amarillas, luego rojas
    if (ritmo && S.peligroVis > 0.03) {
      const alto = piso() - 9, pct = Math.min(1, S.peligroVis / S.JEFE_TOPE), hp = alto * pct, cima = piso() - hp, tw = S.W / 10;
      const alerta = S.peligro >= S.JEFE_TOPE - 2, base = pct < 0.38 ? S.col.V : pct < 0.68 ? S.col.Y : S.col.R;
      ctx.save();
      ctx.beginPath(); ctx.rect(0, cima, S.W, hp); ctx.clip();
      for (let j = 0; piso() - j * 6 > cima; j++) for (let i = 0; i < 10; i++) {
        ctx.fillStyle = alerta && (S.t >> 2) % 2 ? BB.osc(S.col.R, 0.9) : BB.osc(base, h2(i * 7 + j * 13 + (S.golpeN >> 1)) < 0.2 ? 0.75 : 0.42);
        ctx.fillRect(Math.round(i * tw), piso() - (j + 1) * 6, Math.ceil(tw) - 1, 5);
      }
      ctx.restore();
      ctx.fillStyle = S.dano > 0 ? "#ffffff" : base;
      ctx.fillRect(0, Math.round(cima), S.W, 1);
      // Cuánta memoria va ocupada, y la línea donde el programa truena
      ctx.fillStyle = "rgba(0,0,0,.7)";
      ctx.fillRect(1, Math.round(cima) - 8, 35, 7);
      letras(`M:${Math.round((S.peligro / S.JEFE_TOPE) * 100)}%`, 3, Math.round(cima) - 7, alerta ? "R" : "W");
      ctx.fillStyle = alerta && (S.t >> 2) % 2 ? "#ffffff" : S.col.R;
      for (let x = (S.t >> 2) % 6; x < S.W; x += 6) ctx.fillRect(x, 10, 3, 1);
    }
    // Los rayos del gato: primero una franja que avisa (cada vez más marcada), luego el rayo
    // (en el GRIMORIO son columnas de fuego, en naranja)
    const cA = UIA() ? "#ff2e7e" : FK() ? "#00f6ff" : "#ff7a1a", rA = UIA() ? "255,46,126" : FK() ? "0,246,255" : "255,122,26";
    for (const a of S.ataques) {
      const k = Math.min(1, (S.ts - a.t0) / (a.t1 - a.t0));
      const [x, y, w, hh] = a.tipo === "v" ? [Math.round(a.c * S.LW) + 1, 9, Math.round(S.LW) - 1, piso() - 9] : a.tipo === "x" ? [Math.round(a.x) - 8, 9, 16, piso() - 9] : [0, Math.round(a.y) - 7, S.W, 14];
      // (el tercero del triple no se ve hasta que pega el primero)
      if (S.ts < a.t0) continue;
      if (a.pison) { pison(a, Math.max(0, k), x, w); continue; }
      if (!a.hecho) {
        // El aviso: una franja tenue con el centro que se va llenando; cuando se llena del todo, cae el golpe
        ctx.fillStyle = `rgba(${rA},.1)`;
        ctx.fillRect(x, y, w, hh);
        ctx.fillStyle = `rgba(${rA},.3)`;
        if (a.tipo === "h") ctx.fillRect(x, Math.round(y + (hh / 2) * (1 - k)), w, Math.max(1, Math.round(hh * k)));
        else ctx.fillRect(Math.round(x + (w / 2) * (1 - k)), y, Math.max(1, Math.round(w * k)), hh);
        ctx.fillStyle = (S.t >> 2) % 2 ? cA : "#ffffff";
        if (a.tipo === "h") { for (let i = (S.t >> 1) % 6; i < S.W; i += 6) { ctx.fillRect(i, y, 3, 1); ctx.fillRect(i, y + hh - 1, 3, 1); } }
        else { for (let i = 9 + ((S.t >> 1) % 6); i < piso(); i += 6) { ctx.fillRect(x, i, 1, 3); ctx.fillRect(x + w - 1, i, 1, 3); } }
        rotulo("!", a.tipo === "h" ? 8 : x + w / 2, a.tipo === "h" ? y + 11 : 22, (S.t >> 2) % 2 ? "#ffffff" : cA);
      } else {
        const edad = (S.ts - a.t1) / 0.24;
        ctx.globalAlpha = Math.max(0, 1 - edad);
        // El golpe: un fogonazo blanco y luego el color
        ctx.fillStyle = edad < 0.35 ? "#ffffff" : cA;
        ctx.fillRect(x, y, w, hh);
        ctx.fillStyle = edad < 0.35 ? cA : UIA() ? "#ffffff" : FK() ? "#ff3fb4" : "#ffe14a";
        // El rayo en zigzag
        if (a.tipo === "h") { let yy = y + hh / 2; for (let i = 0; i < S.W; i += 4) { const ny = y + 2 + Math.random() * (hh - 4); ctx.fillRect(i, Math.round(Math.min(yy, ny)), 4, Math.max(2, Math.round(Math.abs(ny - yy)))); yy = ny; } }
        else { let xx = x + w / 2; for (let i = 9; i < piso(); i += 4) { const nx = x + 2 + Math.random() * (w - 4); ctx.fillRect(Math.round(Math.min(xx, nx)), i, Math.max(2, Math.round(Math.abs(nx - xx))), 4); xx = nx; } }
        ctx.globalAlpha = 1;
      }
    }
    const MU = G() ? MUTA_G : DM() ? MUTA_D : FK() ? MUTA_F : MUTA;
    for (const o of S.objs) {
      let sp, mp = null, ox = 0;
      const cuadro = (S.t >> 3) % 2;
      if (o.tipo === "cafe") sp = CAFE;
      else if (o.tipo === "anti") sp = ANTIVIRUS;
      else if (S.modo !== "ritmo") { sp = ESPECIES[o.e || "A"][cuadro]; mp = o.tipo === "oro" ? ORO_MAPA : null; }
      else if (o.tipo === "cria") sp = CRIA;
      else if (BICHOS[o.tipo]) {
        const b = BICHOS[o.tipo], av = 1 - (o.tn - S.ts) / o.d;
        sp = o.tipo === "gusano" && o.seg ? GUSANO_CUERPO : b.sp;
        mp = b.m;
        // El troyano tramposo enseña los ojos rojos a media caída; el de verdad los tiene dorados siempre
        if (b === BICHOS.troya) mp = { R: o.tipo === "troya" && av > 0.38 && av < 0.8 && (S.t >> 2) % 2 ? "#ff3d3d" : "Y", Q: "Q" };
        // Tras el primer toque, el acorazado ya no trae casco
        if (o.tipo === "acorazado" && o.golpe) mp = { G: "N", W: "N", Z: "#8a4a10" };
        // El fantasma se desvanece a media caída y vuelve a verse al llegar
        if (o.tipo === "fantasma") ctx.globalAlpha = av < 0.2 ? 1 : av < 0.3 ? 1 - (av - 0.2) * 9.6 : av < 0.74 ? 0.04 : Math.min(1, 0.04 + (av - 0.74) * 12);
        // La polilla avisa hacia dónde va a brincar
        if (o.tipo === "polilla" && (S.t >> 2) % 2) { const n = Math.floor((o.tn - S.ts) / (60 / S.R.sec[o.s][3])); if (n > 0) { const d = n % 2 ? -o.dirP : o.dirP; ctx.fillStyle = "#ff3fb4"; ctx.fillRect(Math.round(o.x) + (d > 0 ? 12 : -4), Math.round(o.y) + 3, 3, 3); } }
        // El rayo que une a los gemelos
        if (o.tipo === "gemelo" && !o.libre && o.par && !o.par.fuera && !o.cogido && !o.par.cogido) { ctx.fillStyle = (S.t >> 1) % 2 ? "#ffffff" : "#38BDF8"; const xa = Math.min(o.x, o.par.x) + BW, xb = Math.max(o.x, o.par.x); for (let x = xa; x < xb; x += 3) ctx.fillRect(Math.round(x), Math.round(o.y) + 4 + ((x + S.t) % 2 | 0), 2, 1); }
        // El gemelo que espera parpadea: queda poco
        if (o.cuelga && (S.t >> 1) % 2) mp = { C: "#ffffff" };
      }
      else if (o.tipo === "mal") { sp = ESPECIES.G[cuadro]; mp = { R: (S.t >> 3) % 2 ? "#d44bff" : "#a259ff", Z: "#3a0d5c", K: "#ffffff" }; }
      else if (o.tipo === "arco" && G()) { sp = RUNA; mp = { R: SANDE[(S.t >> 2) % SANDE.length] }; }
      else if (o.tipo === "bono") { sp = ESPECIES[MU[o.s][0] === "R" ? "RSU"[Math.floor(o.tn * 7.3) % 3] : S.packI > 0 ? PACKS[S.packI][3] : MU[o.s][0]][cuadro]; mp = { R: SANDE[((S.t >> 2) + ((o.tn * 7) | 0)) % SANDE.length], Z: "#ffffff" }; }
      else {
        const [esp0, m0] = MU[o.s], roca = esp0 === "R" && o.tipo !== "glitch", pk = !roca && o.tipo === "bug" && S.packI > 0 ? PACKS[S.packI] : null;
        // Las piedras salen de tres formas; el pack de la tienda cambia a los bugs comunes (menos en los tramos de piedras)
        const esp = roca ? "RSU"[Math.floor(o.tn * 7.3) % 3] : pk ? pk[3] : esp0, m = pk ? pk[4] : m0;
        sp = ESPECIES[o.tipo === "glitch" ? "D" : esp][cuadro];
        // Algunas piedras vienen ardiendo: una cola de fuego naranja, azul o verde, hacia donde vienen
        if (roca && !RM) { const q = Math.floor(o.tn * 13.7) % 5; if (q < 3) { const F = [["#ffffff", "#ffe14a", "#ff8a1a", "#ff3d3d"], ["#ffffff", "#7cf4ff", "#3d9bff", "#3a3fc0"], ["#ffffff", "#b4ff7c", "#3fdc5a", "#1c7c4c"]][q];
          for (let k = 0; k < 9; k++) { const w = Math.max(1, 9 - k - (((S.t >> 1) + k) % 2) * 2), dx = Math.round(Math.sin((S.t + k * 3) * 0.5 + o.tn) * (k > 3 ? 1.5 : 0.5)); ctx.fillStyle = F[k < 2 ? 0 : k < 4 ? 1 : k < 7 ? 2 : 3]; ctx.globalAlpha = k < 6 ? 0.9 : 0.55; if (o.lat) ctx.fillRect(Math.round(o.x) + 9 + k * 2, Math.round(o.y) + 4 - (w >> 1) + dx, 2, w); else ctx.fillRect(Math.round(o.x) + 5 - (w >> 1) + dx, Math.round(o.y) + 1 - k * 2, w, 2); }
          ctx.globalAlpha = 1; } }
        // Especiales: dorado; arcoíris, que cambia de color sin parar; glitch, blanco y tembloroso
        mp = o.tipo === "oro" ? ORO_MAPA : o.tipo === "arco" ? { R: SANDE[(S.t >> 2) % SANDE.length], Z: "#ffffff" } : o.tipo === "glitch" ? { R: "W", Z: "C" } : m;
        if (o.tipo === "glitch" && !RM && (S.t >> 1) % 3 === 0) ox = Math.random() < 0.5 ? -1 : 1;
      }
      // En ritmo, un contorno negro con la forma del bug para que se distinga sobre cualquier escenario
      // Lo raro: los que llegan son BITs
      if (S.raro === "bicho" && P()) { sp = P().bitSprite(-1, false, o.tipo === "bug" ? "n" : "o"); mp = null; }
      if (ritmo && o.tipo !== "cria") contorno(sp, o.x + ox, o.y);
      // El maldito lleva un aura morada que late
      if (o.tipo === "mal") { ctx.fillStyle = `rgba(212,75,255,${(S.t >> 2) % 2 ? 0.34 : 0.18})`; ctx.fillRect(Math.round(o.x) - 2, Math.round(o.y) - 2, BW + 4, BH + 4); }
      pinta(sp, o.x + ox, o.y, mp);
      ctx.globalAlpha = 1;
      // La bomba chispea por la mecha
      if (o.tipo === "bomba" && !RM && S.t % 3 === 0) S.chispas.push({ x: o.x + 7, y: o.y, vx: azar(-0.6, 0.6), vy: -0.8, vida: 7, c: S.t % 2 ? "#ffe14a" : "#ffffff", g: 1 });
      // El glitch avisa hacia dónde va a brincar
      if (o.tipo === "glitch" && !o.salto && (S.t >> 2) % 2) { const d = o.c2 > o.c ? 1 : -1; ctx.fillStyle = "#00f6ff"; ctx.fillRect(Math.round(o.x) + (d > 0 ? 12 : -4), Math.round(o.y) + 3, 3, 3); ctx.fillRect(Math.round(o.x) + (d > 0 ? 15 : -5), Math.round(o.y) + 4, 1, 1); }
      // Dorados y arcoíris sueltan destellos
      if ((o.tipo === "oro" || o.tipo === "arco") && !RM && S.t % 4 === 0) S.chispas.push({ x: o.x + Math.random() * BW, y: o.y + Math.random() * BH, vx: 0, vy: -0.4, vida: 8, c: o.tipo === "oro" ? "#ffe14a" : SANDE[S.t % SANDE.length], g: 1 });
    }
    for (const b of S.burbujas) { ctx.fillStyle = "#bfe9ff"; ctx.fillRect(Math.round(b.x), Math.round(b.y), b.g, b.g); }
    // Ondas cuadradas que se abren donde se atrapó un bug
    for (const f of S.ondas) {
      const k = 1 - f.vida / f.max, r = Math.round(3 + k * f.r * 2), X = Math.round(f.x), Y = Math.round(f.y);
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = k < 0.25 ? "#ffffff" : f.c;
      ctx.fillRect(X - r, Y - r, r * 2, 1); ctx.fillRect(X - r, Y + r, r * 2 + 1, 1); ctx.fillRect(X - r, Y - r, 1, r * 2); ctx.fillRect(X + r, Y - r, 1, r * 2);
      ctx.globalAlpha = 1;
    }
    for (const c of S.chispas) { ctx.fillStyle = S.col[c.c] || c.c; ctx.fillRect(Math.round(c.x), Math.round(c.y), c.g || 1, c.g || 1); }
    for (const x of S.textos) if (x.vida > 8 || x.vida % 2) rotulo(x.txt, x.x, x.y, S.col[x.c] || x.c, x.vida > (x.max || 40) - 5 ? (x.e || 1) * 1.5 : x.e || 1);
    // La barra de la ventana: el juego corre dentro de una terminal abierta, C:\BIT.EXE (en vuelo libre no hay barra)
    if (S.modoLibre) dibujaOrden(); else {
    ctx.fillStyle = "#c9c6b8";
    ctx.fillRect(0, 0, S.W, 8);
    // Con tensión, hasta el título de la ventana se corrompe por instantes
    let titulo2 = "C:\\BIT.EXE";
    if (ritmo && S.tension > 0 && h2(Math.floor(S.ts * 9)) < S.tension * 0.55) titulo2 = [...titulo2].map((ch, i) => (h2(Math.floor(S.ts * 9) * 3 + i) < 0.4 ? "X%:01E>."[(h2(i + Math.floor(S.ts * 9)) * 8) | 0] : ch)).join("");
    letras(titulo2, 3, 2, "K");
    // Las vidas de BIT, en la barra de su terminal: corazones rojos; los perdidos, grises. El recién perdido o ganado parpadea
    if (ritmo) for (let i = 0; i < S.D.vidas; i++) {
      const hx = S.W - 32 - i * 6, viva = i < S.vidasR, cambia = S.vidaFx > 0 && (i === S.vidasR || i === S.vidasR - 1) && (S.t >> 2) % 2;
      ctx.fillStyle = cambia ? "#ffffff" : viva ? S.col.R : "#8f8c80";
      ctx.fillRect(hx, 2, 2, 2); ctx.fillRect(hx + 3, 2, 2, 2); ctx.fillRect(hx, 3, 5, 2); ctx.fillRect(hx + 1, 5, 3, 1); ctx.fillRect(hx + 2, 6, 1, 1);
    }
    for (let i = 0; i < 3; i++) { ctx.fillStyle = S.col.F; ctx.fillRect(S.W - 8 - i * 8, 1, 6, 6); ctx.fillStyle = "#c9c6b8"; ctx.fillRect(S.W - 6 - i * 8, i === 2 ? 5 : 3, 2, i === 2 ? 1 : 2); }
    ctx.fillStyle = S.col.F;
    ctx.fillRect(0, 8, S.W, 1);
    for (const g of S.grietas) { ctx.fillStyle = g.vida % 4 < 2 ? S.col.R : "#c9c6b8"; ctx.fillRect(g.x - 1, 6, 5, 3); }
    dibujaOrden();
    // Créditos del arranque: la terminal teclea cómo inicializa la canción, renglón por renglón
    if (ritmo && S.cred >= 0 && S.cred < 100 && S.estado === "jugando") {
      const ls = [`C:\\>PLAY ${S.R.archivo.split("/").pop().toUpperCase()}`, T("CREANDO OBJETO CANCION ...", "CREATING SONG OBJECT ..."), T(`CARGANDO ${S.totalNotas} BUGS ...`, `LOADING ${S.totalNotas} BUGS ...`), T(`SINCRONIZANDO A ${S.R.sec[0][3]} BPM ...`, `SYNCING TO ${S.R.sec[0][3]} BPM ...`)];
      ctx.fillStyle = "rgba(0,0,0,.82)";
      ctx.fillRect(0, 9, S.W, 31);
      ls.forEach((l, i) => {
        const n = Math.floor((S.cred - i * 20) * 1.8);
        if (n <= 0) return;
        letras(l.slice(0, n), 3, 11 + i * 7, i ? "G" : "W");
        if (i && n > l.length + 6) letras("OK", 3 + (l.length + 1) * 4, 11 + i * 7, "V");
      });
    }
    // En ritmo, la orilla de abajo de la barra marca cuánto va de la canción
    if (ritmo) { ctx.fillStyle = S.col.Y; ctx.fillRect(0, 8, Math.round((S.W * S.ts) / S.R.dur), 1); }
    }
    // El piso es la línea de comandos: una casilla entre corchetes por carril. La de BIT va encendida,
    // late con el bombo y se pone verde un instante al atrapar
    const py = piso();
    if (!S.modoLibre) {
      ctx.fillStyle = "#0c0f1a";
      ctx.fillRect(0, py, S.W, S.H - py);
      ctx.fillStyle = S.col.G;
      ctx.fillRect(0, py, S.W, 1);
    }
    if (S.lateral) {
      // En el tramo lateral las casillas van en columna, a la izquierda: una por fila, encendida la de BIT
      ctx.fillStyle = "#3a4058"; for (let x = (S.t >> 1) % 8; x < S.W; x += 8) ctx.fillRect(x, py + 3, 4, 1);
      ctx.fillStyle = "#0c0f1a"; ctx.fillRect(0, 9, 10, py - 9);
      ctx.fillStyle = S.col.G; ctx.fillRect(10, 9, 1, py - 9);
      for (let c = 0; c < carriles; c++) {
        const y0 = filaY(c) - 1, act = c === S.bit.c, ok = S.celdas[c] > 0;
        ctx.fillStyle = ok ? S.col.V : act ? (S.grooveFx > 3 ? "#00f6ff" : S.pulso > 0.7 ? "#ffffff" : S.col.Y) : "#3a4058";
        ctx.fillRect(2, y0, 6, 1); ctx.fillRect(2, y0, 1, 3); ctx.fillRect(7, y0, 1, 3); ctx.fillRect(2, y0 + 13, 6, 1); ctx.fillRect(2, y0 + 11, 1, 3); ctx.fillRect(7, y0 + 11, 1, 3);
        if (act || ok) ctx.fillRect(4, y0 + 4, 2, 6);
      }
    }
    else if (S.vuela) { if (!S.modoLibre) { ctx.fillStyle = "#3a4058"; for (let x = (S.t >> 1) % 8; x < S.W; x += 8) ctx.fillRect(x, py + 3, 4, 1); } }
    else for (let c = 0; c < carriles; c++) {
      const x0 = Math.round(c * S.LW), w = Math.round(S.LW), ok = S.celdas[c] > 0, lado = ritmo && S.iman > S.ts && Math.abs(c - S.bit.c) === 1 && (S.iman - S.ts > 1 || (S.t >> 2) % 2), act = c === S.bit.c || lado;
      ctx.fillStyle = ok ? S.col.V : lado ? S.col.C : c === S.bit.c && S.grooveFx > 3 ? "#00f6ff" : act ? (ritmo && S.pulso > 0.7 ? "#ffffff" : S.col.Y) : "#3a4058";
      ctx.fillRect(x0 + 2, py + 2, 1, 4); ctx.fillRect(x0 + 2, py + 2, 3, 1); ctx.fillRect(x0 + 2, py + 5, 3, 1);
      ctx.fillRect(x0 + w - 3, py + 2, 1, 4); ctx.fillRect(x0 + w - 5, py + 2, 3, 1); ctx.fillRect(x0 + w - 5, py + 5, 3, 1);
      if (act || ok) ctx.fillRect(x0 + 6, py + 3, w - 12, 2);
    }
    for (const d of S.destellos) {
      // El carril donde cayó el bug: una columna roja que se apaga hacia arriba y el piso parpadeando
      const cxl = Math.round(Math.floor((d.x + 5) / S.LW) * S.LW) + 1, anc = Math.round(S.LW) - 1;
      if (ritmo && !RM) { const g = ctx.createLinearGradient(0, piso(), 0, piso() - S.H * 0.7); g.addColorStop(0, `rgba(255,40,60,${Math.min(0.55, d.vida / 30)})`); g.addColorStop(1, "rgba(255,40,60,0)"); ctx.fillStyle = g; ctx.fillRect(cxl, 9, anc, piso() - 9); }
      if (d.vida % 6 < 3) { ctx.fillStyle = S.col.R; ctx.fillRect(cxl, piso(), anc, S.H - piso()); }
    }
    // BIT mira hacia el bug más cercano al piso
    let cerca = null;
    for (const o of S.objs) if (o.tipo !== "cafe" && (!cerca || o.y > cerca.y)) cerca = o;
    const dx = cerca ? cerca.x + 5 - (S.bit.x + 5) : 0;
    if (S.muerteIni && S.muerto) dibujaMuerte();
    if (P() && !(S.muerteIni && S.muerto)) {
      if (SKINS[S.skinI][5]) SKINS[S.skinI][5]();
      let sprite = viste(P().bitSprite(dx < -8 ? -1 : dx > 8 ? 1 : 0, S.parpadeo > 0, S.boca));
      // Lo raro: BIT convertido en bug, un BIT en cada fila, BIT al triple, o BIT fuera de la terminal (ahí lo pinta el fondo)
      if (S.raro === "bicho") sprite = ESPECIES.A[(S.t >> 3) % 2];
      if (S.raro === "clones") for (let c = 0; c < carriles; c++) if (c !== S.bit.c) { contorno(sprite, S.bit.x, filaY(c)); pinta(sprite, S.bit.x, filaY(c)); }
      const transformado = S.raro === "gigante" || S.raro === "fuera";
      if (transformado) { ctx.save(); if (S.raro === "fuera") ctx.translate(-90, 0); else { ctx.translate(S.bit.x + 5, S.bit.y + 6); ctx.scale(2.6, 2.6); ctx.translate(-(S.bit.x + 5), -(S.bit.y + 6)); } }
      for (const f of S.fantasmas) { ctx.globalAlpha = (f.vida / 6) * 0.45; pinta(sprite, f.x, S.bit.y); }
      // La estela: copias de BIT en un solo color que suman luz y se apagan una tras otra, de la más vieja a la más nueva
      ctx.globalCompositeOperation = "lighter";
      for (const f of S.ecos) { ctx.globalAlpha = Math.pow(f.vida / f.max, 1.4) * 0.85; silueta(sprite, f.x, f.y, f.c); }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      // Al atrapar da un brinquito; al frenar se aplasta; en ritmo, además, late con el bombo
      const yb = S.bit.y + (S.aplasta > 2 && !S.vuela ? 1 : 0) - (S.brinco > 3 ? 2 : S.brinco > 0 ? 1 : 0) - (ritmo && S.estado === "jugando" && S.pulso > 0.7 && !S.vuela ? 1 : 0);
      // Mientras corre al otro carril se estira; recién aterrizado, se ensancha
      // Aplastado por el pisón queda hecho una tortilla
      let ex = S.aplastado ? 1.7 : RM || S.vuela || S.lateral ? 1 : S.estira ? 1.3 : S.aplasta > 3 ? 1.15 : 1, ey = S.aplastado ? 0.18 : RM || S.vuela || S.lateral ? 1 : S.estira ? 0.84 : S.aplasta > 3 ? 0.9 : 1;
      // Apachurrado a propósito (flecha abajo): se ensancha y se achata, y vuelve con un rebote
      if (S.apach > 0 && !S.aplastado) { const kA = Math.sin((S.apach / 18) * Math.PI) * (S.apach > 12 ? 1 : 0.75 + 0.25 * Math.cos(S.apach * 1.4)); ex *= 1 + kA * 0.5; ey *= 1 - kA * 0.52; }
      ctx.save();
      if (ex !== 1) { ctx.translate(S.bit.x + 5, yb + 12); ctx.scale(ex, ey); ctx.translate(-(S.bit.x + 5), -(yb + 12)); }
      if (ritmo) contorno(sprite, S.bit.x, yb);
      // Lastimado parpadea en rojo; recién atrapó, brilla en blanco
      if (S.invul > 0 && S.dano <= 0 && (S.t >> 1) % 2) { /* a salvo un instante: parpadea */ }
      else if (S.dano > 0 && S.dano % 6 < 3) silueta(sprite, S.bit.x, yb, S.col.R);
      else if (S.brillo > 1) silueta(sprite, S.bit.x, yb, "#ffffff");
      else pinta(sprite, S.bit.x, yb);
      ctx.restore();
      // Recién empezó a volar: cuatro flechas alrededor recuerdan que se mueve en todas direcciones
      if (S.vuela && S.ts < S.R.sec[S.VUELO][0] + 5.5 && (S.t >> 3) % 2) {
        const X = Math.round(S.bit.x) + 5, Y = Math.round(yb) + 6;
        ctx.fillStyle = "#00f6ff";
        for (let i = 0; i < 3; i++) {
          ctx.fillRect(X - 2 + i, Y - 12 - i, 5 - i * 2, 1); ctx.fillRect(X - 2 + i, Y + 11 + i, 5 - i * 2, 1);
          ctx.fillRect(X - 12 - i, Y - 2 + i, 1, 5 - i * 2); ctx.fillRect(X + 11 + i, Y - 2 + i, 1, 5 - i * 2);
        }
      }
      // En FUTURE FUNK, BIT lleva audífonos; con el groove al máximo, le brillan
      if (ritmo && FK()) {
        const X = Math.round(S.bit.x), Y = Math.round(yb), c = S.groove >= GROOVE_MAX && (S.t >> 2) % 2 ? "#ffffff" : "#ff3fb4";
        ctx.fillStyle = "#05030f"; ctx.fillRect(X, Y - 2, 10, 1); ctx.fillRect(X - 1, Y - 1, 1, 3); ctx.fillRect(X + 10, Y - 1, 1, 3);
        ctx.fillStyle = c; ctx.fillRect(X - 2, Y + 2, 2, 4); ctx.fillRect(X + 10, Y + 2, 2, 4);
        ctx.fillStyle = "#00f6ff"; ctx.fillRect(X - 2, Y + 3, 1, 2); ctx.fillRect(X + 11, Y + 3, 1, 2);
      }
      // En DOOM CROSSING: en el pueblo lleva una hojita en la cabeza; en el infierno, casco y hombreras. Con escudo, un marco azul
      if (ritmo && DM()) {
        const X = Math.round(S.bit.x), Y = Math.round(yb), m = BB.mundoVis();
        if (m === "p") { ctx.fillStyle = "#3fbf5a"; ctx.fillRect(X + 4, Y - 3, 3, 2); ctx.fillRect(X + 6, Y - 4, 2, 1); ctx.fillStyle = "#1d6b4a"; ctx.fillRect(X + 4, Y - 1, 1, 1); }
        else { ctx.fillStyle = "#3f6b2a"; ctx.fillRect(X + 1, Y - 3, 8, 1); ctx.fillRect(X, Y - 2, 10, 2); ctx.fillRect(X - 2, Y + 5, 2, 3); ctx.fillRect(X + 10, Y + 5, 2, 3); ctx.fillStyle = "#7ddc6b"; ctx.fillRect(X + 2, Y - 2, 6, 1); }
        if (S.escudo > 0 && ((S.t >> 3) % 2 || S.escudo > 1)) { ctx.fillStyle = "#7dd3fc"; ctx.fillRect(X - 3, Y - 5, 16, 1); ctx.fillRect(X - 3, Y + 12, 16, 1); ctx.fillRect(X - 3, Y - 5, 1, 18); ctx.fillRect(X + 12, Y - 5, 1, 18); }
      }
      // En el GRIMORIO, BIT va de capucha y con su linterna; en la torre le salen alas de murciélago
      if (ritmo && G()) {
        const X = Math.round(S.bit.x), Y = Math.round(yb);
        ctx.fillStyle = "#3b1463";
        ctx.fillRect(X + 1, Y - 3, 8, 1); ctx.fillRect(X, Y - 2, 10, 2); ctx.fillRect(X - 1, Y - 1, 1, 6); ctx.fillRect(X + 10, Y - 1, 1, 6);
        ctx.fillStyle = "#6b3aa8";
        ctx.fillRect(X + 2, Y - 2, 6, 1);
        if (S.vuela) {
          const al = (S.t >> 3) % 2;
          ctx.fillStyle = "#3b1463";
          ctx.fillRect(X - 5, Y + 2 + al, 4, 2); ctx.fillRect(X - 8, Y + 1 + al * 2, 3, 2); ctx.fillRect(X - 4, Y + 4 + al, 3, 1);
          ctx.fillRect(X + 11, Y + 2 + al, 4, 2); ctx.fillRect(X + 15, Y + 1 + al * 2, 3, 2); ctx.fillRect(X + 11, Y + 4 + al, 3, 1);
        }
        ctx.fillStyle = "#8f93a8";
        ctx.fillRect(X + 12, Y + 5, 1, 2);
        ctx.fillStyle = S.luzVis > 0.3 || (S.t >> 2) % 2 ? "#ffe14a" : "#7a5a14";
        ctx.fillRect(X + 11, Y + 7, 3, 3);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(X + 12, Y + 8, 1, 1);
      }
      // Bajo el agua, BIT lleva escafandra: casco de cristal, visor, tanque y manguera
      if (ritmo && UIA() && S.secI === 2) {
        const X = Math.round(S.bit.x), Y = Math.round(yb);
        ctx.fillStyle = "rgba(160,220,255,.22)";
        ctx.fillRect(X - 1, Y - 2, 12, 11);
        ctx.fillStyle = "#bfe9ff";
        ctx.fillRect(X, Y - 3, 10, 1); ctx.fillRect(X - 2, Y - 1, 1, 9); ctx.fillRect(X + 11, Y - 1, 1, 9); ctx.fillRect(X - 1, Y - 2, 1, 1); ctx.fillRect(X + 10, Y - 2, 1, 1); ctx.fillRect(X - 1, Y + 8, 1, 1); ctx.fillRect(X + 10, Y + 8, 1, 1); ctx.fillRect(X, Y + 9, 10, 1);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(X + 1, Y - 1, 3, 1); ctx.fillRect(X + 1, Y, 1, 2);
        ctx.fillStyle = S.col.G;
        ctx.fillRect(X - 5, Y + 2, 3, 7);
        ctx.fillStyle = "#ffd23b";
        ctx.fillRect(X - 5, Y + 1, 3, 1); ctx.fillRect(X - 4, Y - 3, 1, 4); ctx.fillRect(X - 4, Y - 4, 4, 1);
        if (S.estado === "jugando" && S.t % 26 === 0 && !RM) S.burbujas.push({ x: X + 12 + Math.random() * 2, y: Y - 4, vida: 70, g: Math.random() < 0.3 ? 2 : 1 });
      }
      if (transformado) ctx.restore();
    }
    // GRIMORIO: la oscuridad. Solo se ve bien lo que alcanza la linterna; de lo demás apenas brillan los ojos.
    // El jefe alumbra su salón, así que ahí la oscuridad es más leve; en el primer tramo todavía no cae
    if (ritmo && G() && S.secI > 0 && S.estado === "jugando") {
      const entra = Math.min(1, (S.ts - S.R.sec[1][0]) / 2.5), tope = (S.secI === S.JEFE ? 0.45 : S.secI === 5 ? 0.3 : 0.8) * entra;
      const cxL = Math.round(S.bit.x) + 5, cyL = Math.round(S.bit.y) + 5, r = 16 + Math.min(1.8, S.luzVis) * S.W * 0.36 + (S.pulso > 0.7 ? 1 : 0);
      const g = ctx.createRadialGradient(cxL, cyL, 0, cxL, cyL, r + 22);
      // Tres anillos de sombra con bordes duros, como luz pixelada
      const k1 = r / (r + 22), k2 = (r + 10) / (r + 22);
      g.addColorStop(0, "rgba(255,200,110,.10)"); g.addColorStop(k1 * 0.55, "rgba(255,200,110,.10)"); g.addColorStop(k1 * 0.55, "rgba(255,200,110,.05)"); g.addColorStop(k1, "rgba(255,200,110,.05)"); g.addColorStop(k1, `rgba(2,1,6,${tope * 0.45})`); g.addColorStop(k2, `rgba(2,1,6,${tope * 0.45})`); g.addColorStop(k2, `rgba(2,1,6,${tope * 0.75})`); g.addColorStop(0.999, `rgba(2,1,6,${tope * 0.75})`); g.addColorStop(1, `rgba(2,1,6,${tope})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 9, S.W, piso() - 9);
      for (const o of S.objs) {
        if (Math.hypot(o.x + 5 - cxL, o.y + 4 - cyL) < r + 8) continue;
        ctx.fillStyle = o.tipo === "mal" ? "#d44bff" : o.tipo === "oro" || o.tipo === "bono" ? "#ffe14a" : o.tipo === "arco" ? SANDE[(S.t >> 2) % SANDE.length] : "#ff5a4a";
        ctx.fillRect(Math.round(o.x) + 3, Math.round(o.y) + 4, 1, 1); ctx.fillRect(Math.round(o.x) + 7, Math.round(o.y) + 4, 1, 1);
      }
      // Cuánta luz queda, en la orilla izquierda
      ctx.fillStyle = "rgba(0,0,0,.7)"; ctx.fillRect(1, 11, 4, 22);
      ctx.fillStyle = S.luz < 0.3 && (S.t >> 2) % 2 ? S.col.R : "#ffe14a"; const hl = Math.round(Math.min(1, S.luz) * 20); ctx.fillRect(2, 12 + 20 - hl, 2, hl);
    }
    // La casilla quemada: arde en amarillo (el color del peligro en este nivel); las de junto se ven calientes.
    // Sobre BIT, una barrita dice cuánto le falta para tostarse
    if (ritmo && S.quemada && S.estado === "jugando") {
      const x0 = Math.round(S.quemada.c * S.LW), w = Math.round(S.LW), py = piso(), acaba = S.quemada.hasta - S.ts < 0.7 && (S.t >> 2) % 2;
      // (las casillas de junto ya no queman: no se marcan)
      if (!acaba) { ctx.fillStyle = "rgba(255,225,74,.2)"; ctx.fillRect(x0 + 1, 9, w - 1, py - 9); for (let i = 0; i < 3; i++) flamaCtx(BB.LLAMITA, x0 + Math.round((w - 10) / 2) + (i - 1) * Math.round(w / 3.4), py + (i === 1 ? 0 : 1), BB.FUEGOS.amarillo, i * 2.3); }
      ctx.fillStyle = "#ffe14a"; ctx.fillRect(x0 + 1, py, w - 1, 2);
    }
    if (ritmo && S.calor > 0.04 && S.estado === "jugando") {
      const X = Math.round(S.bit.x), Y = Math.round(S.bit.y) - 7;
      ctx.fillStyle = "#000000"; ctx.fillRect(X - 2, Y - 1, 14, 4);
      ctx.fillStyle = S.calor > 0.65 && (S.t >> 1) % 2 ? "#ffffff" : S.calor > 0.5 ? S.col.R : "#ffe14a"; ctx.fillRect(X - 1, Y, Math.round(12 * S.calor), 2);
    }
    // FUTURE FUNK: el medidor de groove, en la orilla izquierda: ocho escalones que se encienden de rosa a cian
    if (ritmo && FK() && S.estado === "jugando") {
      ctx.fillStyle = "rgba(0,0,0,.7)"; ctx.fillRect(1, 11, 7, 30);
      letras("G", 3, 12, S.groove >= GROOVE_MAX ? "#00f6ff" : "W");
      for (let i = 0; i < GROOVE_MAX; i++) { ctx.fillStyle = i < S.groove ? (S.grooveFx > 4 ? "#ffffff" : i >= 5 ? "#00f6ff" : "#ff3fb4") : "#3a4058"; ctx.fillRect(2, 38 - i * 3, 5, 2); }
    }
    // DOOM CROSSING: las campanas juntadas (se llenan hasta valer un escudo) y los escudos que ya se tienen, en la orilla izquierda
    if (ritmo && DM() && S.estado === "jugando") {
      ctx.fillStyle = "rgba(0,0,0,.7)"; ctx.fillRect(1, 11, 9, 34);
      pinta(CAMPANA, 3, 12, null);
      const hl = Math.round((Math.min(S.campanas, CAMPANAS_ESCUDO) / CAMPANAS_ESCUDO) * 18);
      ctx.fillStyle = "#3a4058"; ctx.fillRect(4, 19, 3, 18); ctx.fillStyle = S.campanas >= CAMPANAS_ESCUDO && (S.t >> 2) % 2 ? "#ffffff" : "#ffe14a"; ctx.fillRect(4, 19 + 18 - hl, 3, hl);
      for (let i = 0; i < 2; i++) { ctx.fillStyle = i < S.escudo ? "#7dd3fc" : "#3a4058"; ctx.fillRect(2 + i * 4, 39, 3, 4); }
    }
    // Con fiebre, el marco del recuadro corre en colores
    if (ritmo && S.fiebre > S.ts) {
      for (let i = 0; i < S.W; i += 4) { ctx.fillStyle = SANDE[((i >> 2) + (S.t >> 1)) % SANDE.length]; ctx.fillRect(i, 9, 4, 1); ctx.fillRect(S.W - 4 - i, piso() - 1, 4, 1); }
      const falta = (S.fiebre - S.ts) / 7;
      ctx.fillStyle = "#ff3fb4";
      ctx.fillRect(0, 10, Math.round(S.W * falta), 1);
    }
    // Al arrancar en el teléfono se van encendiendo, uno por uno, los carriles que se pueden tocar
    if (S.pistaT > 0 && S.estado === "jugando" && !S.vuela && tactil && (S.pistaT > 40 || S.pistaT % 6 < 3)) {
      const c = (S.t >> 4) % carriles;
      ctx.fillStyle = "rgba(255,225,74,.13)";
      ctx.fillRect(Math.round(c * S.LW) + 1, 9, Math.round(S.LW) - 1, piso() - 9);
    }
    ctx.restore();
    // El gato, cuando su vuelta lo trae por delante de la terminal: se pinta encima del recuadro, en el mismo lugar que en
    // el escenario (contando el acercamiento de la cámara). Con el jefe y en el vuelo va más transparente para no tapar los bugs
    if (ritmo && UIA() && S.gatoOk && S.gatoFrente > 0.5 && S.estado === "jugando" && BB.gatoSeVe() && BB.limpieza() <= 0) {
      const lado = Math.max(2, Math.round(Math.min(64, S.FW * 0.42, S.FH * 0.36) * S.gatoTam * (1 + S.pulso * 0.07) * S.zoom));
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 9, S.W, piso() - 9); ctx.clip();
      ctx.imageSmoothingEnabled = false;
      BB.pintaGato(S.gatoX * S.zoom + S.focoX * (1 - S.zoom) - S.gx, S.gatoY * S.zoom + S.focoY * (1 - S.zoom) - S.gy, lado, S.gatoQuieto ? null : S.giro, (S.secI === S.JEFE || S.vuela ? 0.5 : 0.9) * Math.min(1, (S.gatoFrente - 0.5) * 4), ctx);
      ctx.restore();
    }
    if (ritmo && S.estado === "cierre" && S.cierre) dibujaLlave();
    // En pausa o al terminar, el recuadro se oscurece para que se lea el mensaje
    if (ritmo && S.estado !== "jugando" && S.estado !== "cierre" && !muriendo()) { ctx.fillStyle = "rgba(0,0,0,.72)"; ctx.fillRect(0, 0, S.W, S.H); }
    // Los destellos del nivel también ciegan la terminal y a BIT
    if (ritmo && S.estado === "jugando") { const fg = fogonazo(); if (fg > 0.01) { ctx.fillStyle = `rgba(255,255,255,${Math.min(1, fg).toFixed(3)})`; ctx.fillRect(0, 0, S.W, S.H); } }
    // El fogonazo con que aparecen los resultados
    if (S.destello > 0) { ctx.fillStyle = `rgba(255,255,255,${S.destello / 26})`; ctx.fillRect(0, 0, S.W, S.H); }
    // Al fallar, las orillas del recuadro se encienden en rojo
    if (ritmo && S.dano > 0 && !RM) {
      const a = (S.dano / 26) * 0.5;
      for (const [x0, y0, x1, y1] of [[0, 0, 14, 0], [S.W, 0, S.W - 14, 0]]) {
        const g = ctx.createLinearGradient(x0, y0, x1, y1);
        g.addColorStop(0, `rgba(255,30,50,${a})`); g.addColorStop(1, "rgba(255,30,50,0)");
        ctx.fillStyle = g;
        ctx.fillRect(Math.min(x0, x1), 9, 14, piso() - 9);
      }
    }
    // Interferencia en la terminal: tiras de la imagen que se corren, una copia desfasada y líneas de barrido que brincan.
    // Entre más tensión (el error, el jefe con la memoria llena, la lluvia de código), más seguido y más fuerte
    let brincaX = 0;
    // Cada vez que el recuadro da un golpe fuerte (un bicho especial, varios seguidos, subir de nivel de combo), la imagen
    // se descompone un instante: dos tiras se corren de lado y aparece una copia desfasada
    if (ritmo && !RM && S.punch > 0.7 && S.estado === "jugando") {
      for (let i = 0; i < 2; i++) { const yy = 9 + Math.floor(h2(S.t * 3 + i) * (S.H - 20)), hh = 3 + Math.floor(h2(S.t * 5 + i) * 8), dxx = Math.round((h2(S.t * 7 + i) - 0.5) * S.punch * 10); ctx.drawImage(lienzo, 0, yy, S.W, hh, dxx, yy, S.W, hh); }
      ctx.globalAlpha = Math.min(0.3, S.punch * 0.15); ctx.globalCompositeOperation = "lighter"; ctx.drawImage(lienzo, Math.round(S.punch * 1.5), 0); ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
      if (S.punch > 1.4) brincaX = (S.t >> 1) % 2 ? -2 : 2;
    }
    if (ritmo && S.tension > 0 && S.estado === "jugando") {
      const paso = Math.floor(S.ts * 22);
      if (h2(paso) < S.tension * 0.55) for (let i = 0; i < 1 + Math.floor(S.tension * 3); i++) {
        const yy = 9 + Math.floor(h2(paso * 3 + i) * (S.H - 12)), hh = 2 + Math.floor(h2(paso * 5 + i) * 7), dxx = Math.round((h2(paso * 7 + i) - 0.5) * S.tension * 22);
        ctx.drawImage(lienzo, 0, yy, S.W, hh, dxx, yy, S.W, hh);
      }
      if (h2(paso + 7) < S.tension * 0.3) { ctx.globalAlpha = 0.22; ctx.globalCompositeOperation = "lighter"; ctx.drawImage(lienzo, 2 + Math.round(S.tension * 2), 0); ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1; }
      if (h2(paso + 13) < S.tension * 0.3) { ctx.fillStyle = "rgba(255,255,255,.13)"; ctx.fillRect(0, Math.floor(h2(paso + 2) * S.H), S.W, 2); }
      if (h2(paso + 21) < S.tension * 0.22) brincaX = h2(paso) < 0.5 ? -2 : 2;
    }
    const tenso = ritmo && S.tension > 0.6 && S.estado === "jugando";
    if (lienzo.classList.contains("tenso") !== tenso) lienzo.classList.toggle("tenso", tenso);
    // El recuadro da un golpecito al atrapar y late en las partes fuertes
    const esc = RM || S.estado !== "jugando" ? 1 : 1 + S.punch * 0.016 + (ritmo && (S.R.fuerte || [1, S.JEFE, 7]).includes(S.secI) ? S.pulso * 0.016 : 0);
    // La terminal también se mueve: en el tramo lateral se encoge un poco y se va a la izquierda (sin llegar a la orilla),
    // y justo antes, con el recuadro que se lleva todo, el negro la va tapando (se recorta) hasta dejar solo a BIT
    const cs = ritmo ? cajaS() : 1, kLat = ritmo && S.estado !== "fin" ? S.latK : 0;
    const filtro = !ritmo || S.estado !== "jugando" ? "" : S.raro === "neg" ? "invert(1)" : S.raro === "codigo" ? "grayscale(1) sepia(1) hue-rotate(70deg) saturate(5)" : "";
    if (filtro !== S.filtroPuesto) { S.filtroPuesto = filtro; lienzo.style.filter = filtro; }
    // El recorte de la terminal: lo que queda fuera del recuadro no se ve. Y durante el destello del jefe, desaparece
    const recorte = cs < 1 ? (() => { const [x0, y0, w0, h0] = cajaRect(cs), p = (v) => `${(Math.max(0, Math.min(1, v)) * 100).toFixed(1)}%`; return `inset(${p((y0 - S.gy) / S.H)} ${p(1 - (x0 + w0 - S.gx) / S.W)} ${p(1 - (y0 + h0 - S.gy) / S.H)} ${p((x0 - S.gx) / S.W)})`; })() : "";
    if (recorte !== S.recortePuesto) { S.recortePuesto = recorte; lienzo.style.clipPath = recorte; }
    if (kLat > 0.002) {
      const libre = S.rect0 ? Math.max(0, S.rect0.left - window.innerWidth * 0.05) : 0, sLat = 1 - 0.14 * kLat;
      lienzo.style.transformOrigin = "";
      const giro = S.raro === "espejo" ? " scaleX(-1)" : S.raro === "cabeza" ? " rotate(180deg)" : S.raro === "ladeo" ? " rotate(9deg)" : S.raro === "mini" ? " scale(0.6)" : "";
      lienzo.style.transform = `translateX(${(brincaX - libre * kLat).toFixed(1)}px) scale(${(esc * sLat).toFixed(4)})${giro}`;
      S.rectL = lienzo.getBoundingClientRect();
      S.movida = true;
    } else {
      if (S.movida) { S.movida = false; lienzo.style.transformOrigin = ""; S.rectL = S.rect0 || S.rectL; }
      lienzo.style.transform = esc > 1.0005 || brincaX ? `translateX(${brincaX}px) scale(${esc.toFixed(4)})` : "";
    }
    if (!ritmo && S.mensaje && S.mensajeT % 20 > 4) {
      ctx.font = `8px "Press Start 2P"`;
      ctx.textAlign = "center";
      ctx.fillStyle = /BUG/.test(S.mensaje) ? S.col.R : S.col.Y;
      ctx.fillText(S.mensaje, S.W / 2, Math.round(S.H * 0.42));
    }
  }
})();
