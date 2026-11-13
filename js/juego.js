/* ---------- BIT VS BUGS: el minijuego del GAME OVER ----------
   Sale al contestar N en el CONTINUE? (tecla J o el botón). Los bugs se escapan del CRT y BIT los atrapa
   antes de que lleguen a producción. El récord se guarda en este navegador. */
(() => {
  "use strict";
  const doc = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SND = window.Sonidos || { play() {}, silencio: () => true };
  const P = () => window.Portafolio;
  const T = (es, en) => (doc.lang === "en" ? en : es);
  const pig = (v) => getComputedStyle(doc).getPropertyValue(v).trim();
  const azar = (a, b) => a + Math.random() * (b - a);
  const lee = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const guarda = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* solo esta visita */ } };
  // En pantallas táctiles no tiene caso mostrar [R], [Y], [ESC]...
  const tactil = window.matchMedia("(pointer: coarse)").matches;
  const kb = (k) => (tactil ? "" : `[${k}] `);

  const CORAZON = [".RR.RR.", "RWRRRRR", "RRRRRRR", ".RRRRR.", "..RRR..", "...R..."];
  const CORAZON_VACIO = CORAZON.map((f) => f.replace(/[RW]/g, "G"));
  const BUG = [
    [".G...G.", "..RRR..", "GRWZRRG", ".RRZRR.", "GRRZRRG", ".RRZRR.", "..R.R.."],
    ["G.....G", ".GRRRG.", ".RWZRR.", "GRRZRRG", ".RRZRR.", "GRRZRRG", "..R.R.."],
  ];
  const ORO = BUG.map((f) => f.map((r) => r.replace(/R/g, "Y").replace(/Z/g, "Q")));
  const CAFE = ["..W..W..", "...W..W.", "WWWWWW..", "WQQQQWWW", "WQQQQW.W", "WQQQQWWW", ".WWWW..."];
  // Números de 3×5 para los "+10" que flotan
  const FUENTE = {
    0: ["111", "101", "101", "101", "111"], 1: ["010", "110", "010", "010", "111"], 2: ["111", "001", "111", "100", "111"], 3: ["111", "001", "111", "001", "111"],
    4: ["101", "101", "111", "001", "001"], 5: ["111", "100", "111", "001", "111"], 6: ["111", "100", "111", "101", "111"], 7: ["111", "001", "010", "010", "010"],
    8: ["111", "101", "111", "101", "111"], 9: ["111", "101", "111", "001", "111"], "+": ["000", "010", "111", "010", "000"],
  };
  const svg = (rows, px) => (P() ? P().svg(rows, px) : "");

  const el = document.createElement("div");
  el.className = "juego";
  el.hidden = true;
  el.tabIndex = -1;
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", "BIT VS BUGS");
  el.innerHTML = `
    <div class="juego-hud">
      <span><span>PUNTOS</span> <b class="j-pts">000000</b></span>
      <span><span>RECORD</span> <b class="j-rec">000000</b></span>
      <span>VERSION <b class="j-ver">v1.0</b></span>
      <span class="j-vidas" role="img"></span>
    </div>
    <div class="juego-marco"><canvas class="juego-lienzo"></canvas><div class="juego-msg" aria-live="polite"></div></div>
    <p class="juego-ayuda">← → o A D para mover · P pausa · ESC salir</p>`;
  document.body.appendChild(el);
  const lienzo = $("canvas", el), ctx = lienzo.getContext("2d"), marco = $(".juego-marco", el), msg = $(".juego-msg", el);
  const ptsEl = $(".j-pts", el), recEl = $(".j-rec", el), verEl = $(".j-ver", el), vidasEl = $(".j-vidas", el);

  let W = 200, H = 140, escala = 4, col = {}, raf = 0, ult = 0, acum = 0;
  let estado = "titulo", pts = 0, vidas = 3, nivel = 0, t = 0, sig = 0, objs = [], textos = [], grietas = [], destellos = [];
  let bit = { x: 95, v: 0 }, izq = false, der = false, meta = null, boca = "n", bocaT = 0, parpadeo = 0, temblor = 0, mensaje = "", mensajeT = 0;
  let record = +(lee("bitBugsRecord") || 0), nuevoRecord = false, codigo = [], deApagado = false, bloqueamos = false, volverA = null;
  const piso = () => H - 4, bitY = () => piso() - 12;

  // Sonidos de 8 bits hechos al vuelo (respetan el botón de sonido del sitio)
  let ac = null;
  function bip(f1, f2, dur, tipo = "square", vol = 0.05, retraso = 0) {
    if (SND.silencio && SND.silencio()) return;
    try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    const t0 = ac.currentTime + retraso, o = ac.createOscillator(), g = ac.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(f1, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(ac.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  // El área de juego se adapta a la pantalla: más alta en el teléfono, más ancha en la computadora
  function medir() {
    const r = marco.getBoundingClientRect();
    W = r.width > 700 ? 200 : 140;
    H = Math.max(110, Math.min(240, Math.round((W * r.height) / r.width)));
    escala = Math.min(r.width / W, r.height / H);
    if (escala >= 3) escala = Math.floor(escala);
    lienzo.width = W;
    lienzo.height = H;
    lienzo.style.width = `${Math.floor(W * escala)}px`;
    lienzo.style.height = `${Math.floor(H * escala)}px`;
    bit.x = Math.min(bit.x, W - 10);
    // Renglones de "código" en el borde del CRT, de donde se escapan los bugs
    codigo = [];
    for (const yy of [2, 4, 6]) {
      let x = 2 + ((Math.random() * 6) | 0);
      while (x < W - 4) { const l = 3 + ((Math.random() * 14) | 0); codigo.push([x, yy, Math.min(l, W - 3 - x)]); x += l + 2 + ((Math.random() * 3) | 0); }
    }
  }
  const leeCol = () => {
    col = {
      W: pig("--p-blanco"), Y: pig("--p-amarillo"), R: pig("--p-rojo"), G: pig("--p-gris"), K: pig("--p-negro"), Q: pig("--amarillo-oscuro"),
      Z: pig("--rojo-oscuro"), D: pig("--p-gris-osc"), F: pig("--p-negro"),
    };
  };
  function pinta(rows, x, yy) {
    const X = Math.round(x), Y = Math.round(yy);
    rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const c = r[i]; if (c === ".") continue; ctx.fillStyle = col[c]; ctx.fillRect(X + i, Y + j, 1, 1); } });
  }
  function letras(txt, x, yy, c) {
    ctx.fillStyle = col[c];
    [...txt].forEach((ch, k) => (FUENTE[ch] || []).forEach((r, j) => { for (let i = 0; i < 3; i++) if (r[i] === "1") ctx.fillRect(Math.round(x) + k * 4 + i, Math.round(yy) + j, 1, 1); }));
  }
  const seis = (n) => String(n).padStart(6, "0");
  function hud() {
    ptsEl.textContent = seis(pts);
    recEl.textContent = seis(Math.max(record, pts));
    verEl.textContent = `v1.${nivel}`;
    vidasEl.innerHTML = [0, 1, 2].map((i) => svg(i < vidas ? CORAZON : CORAZON_VACIO, 2)).join("");
    vidasEl.setAttribute("aria-label", `${T("Vidas", "Lives")}: ${vidas}`);
  }
  function aviso(html) { msg.innerHTML = html; msg.hidden = !html; }
  function titulo() {
    estado = "titulo";
    aviso(`<p class="jm-t">BIT VS BUGS</p>
      <p>${T("Los bugs se escapan del CRT.<br>Atrápalos antes de que lleguen a producción.", "The bugs are escaping from the CRT.<br>Catch them before they reach production.")}</p>
      <p class="jm-x">${svg(BUG[0], 3)}<span>+10</span> ${svg(ORO[0], 3)}<span>+50</span> ${svg(CAFE, 3)}<span>+1 ${T("vida", "life")}</span></p>
      <p class="jm-b"><button type="button" data-j="empezar">${tactil ? T("TOCA PARA EMPEZAR", "TAP TO START") : `[${T("ESPACIO", "SPACE")}] ${T("EMPEZAR", "START")}`}</button></p>`);
  }
  function empezar() {
    estado = "jugando";
    pts = 0; vidas = 3; nivel = 0; t = 0; sig = 40; objs = []; textos = []; grietas = []; destellos = [];
    bit = { x: W / 2 - 5, v: 0 }; boca = "n"; bocaT = 0; mensaje = ""; nuevoRecord = false;
    aviso("");
    hud();
    bip(392, 0, 0.08); bip(523, 0, 0.08, "square", 0.05, 0.09); bip(659, 0, 0.12, "square", 0.05, 0.18);
    if (P()) P().cuenta("juego");
  }
  function fin() {
    estado = "fin";
    SND.play("terminar");
    if (pts > record) { record = pts; nuevoRecord = true; guarda("bitBugsRecord", String(record)); }
    hud();
    aviso(`<p class="jm-t jm-rojo">GAME OVER</p>
      <p>${T("3 bugs llegaron a producción.", "3 bugs reached production.")}</p>
      <p class="jm-p">${T("PUNTOS", "SCORE")} ${seis(pts)}${nuevoRecord ? `<br><span class="jm-nuevo">${T("¡NUEVO RECORD!", "NEW HIGH SCORE!")}</span>` : ""}</p>
      <p class="jm-b"><button type="button" data-j="empezar">${kb("R")}${T("OTRA VEZ", "AGAIN")}</button>${deApagado ? `<button type="button" data-j="encender">${kb("Y")}${T("ENCENDER CONSOLA", "POWER ON")}</button>` : ""}<button type="button" data-j="salir">${kb("ESC")}${T("SALIR", "QUIT")}</button></p>`);
  }
  function pausa(on) {
    if (on && estado === "jugando") { estado = "pausa"; aviso(`<p class="jm-t">${T("PAUSA", "PAUSED")}</p><p class="jm-b"><button type="button" data-j="seguir">${kb("P")}${T("SEGUIR", "RESUME")}</button></p>`); }
    else if (!on && estado === "pausa") { estado = "jugando"; aviso(""); ult = 0; }
  }
  msg.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-j]");
    if (!b) return;
    ({ empezar, encender: () => cerrar(true), salir: () => cerrar(false), seguir: () => pausa(false) })[b.dataset.j]();
  });

  function nace() {
    const r = Math.random();
    const tipo = vidas < 3 && r < 0.05 ? "cafe" : r < 0.13 ? "oro" : "bug";
    const v = (0.42 + nivel * 0.07) * (tipo === "oro" ? 1.45 : tipo === "cafe" ? 0.8 : 1) * azar(0.85, 1.15);
    const x = 2 + Math.random() * (W - 12);
    objs.push({ tipo, x, y: 1, v, f: azar(0, 6) });
    grietas.push({ x: Math.round(x + 2), vida: 16 });
  }
  function paso() {
    t++;
    if (mensajeT > 0 && --mensajeT === 0) mensaje = "";
    if (bocaT > 0 && --bocaT === 0) boca = "n";
    if (temblor > 0) temblor--;
    if (--parpadeo < -150) parpadeo = 6;
    grietas.forEach((g) => g.vida--); grietas = grietas.filter((g) => g.vida > 0);
    destellos.forEach((d) => d.vida--); destellos = destellos.filter((d) => d.vida > 0);
    textos.forEach((x) => { x.y -= 0.35; x.vida--; }); textos = textos.filter((x) => x.vida > 0);
    if (estado !== "jugando") return;
    // BIT: teclado o puntero
    const tope = 2.3 + nivel * 0.12;
    if (izq || der) { meta = null; bit.v = Math.max(-tope, Math.min(tope, bit.v + (der ? 0.5 : 0) - (izq ? 0.5 : 0))); }
    else if (meta != null) { const d = meta - (bit.x + 5); bit.v = Math.abs(d) < 1 ? 0 : Math.sign(d) * Math.min(Math.abs(d) * 0.35, 3.4); }
    else bit.v *= 0.6;
    bit.x = Math.max(0, Math.min(W - 10, bit.x + bit.v));
    // Bugs: cada versión salen más seguido y más rápido
    if (--sig <= 0) { nace(); sig = Math.max(20, 60 - nivel * 5) * azar(0.7, 1.2); }
    const by = bitY();
    for (const o of objs) {
      o.y += o.v;
      if (o.tipo !== "cafe") { o.f += 0.1; o.x = Math.max(0, Math.min(W - 7, o.x + Math.sin(o.f) * 0.15)); }
      const ancho = o.tipo === "cafe" ? 8 : 7;
      if (o.y + 6 >= by + 1 && o.y <= by + 7 && o.x + ancho - 1 >= bit.x && o.x <= bit.x + 9) {
        o.fuera = true;
        if (o.tipo === "cafe") { vidas = Math.min(3, vidas + 1); textos.push({ txt: "+1", x: o.x, y: o.y - 4, vida: 40, c: "R" }); bip(523, 0, 0.09); bip(784, 0, 0.12, "square", 0.05, 0.1); }
        else {
          const n = o.tipo === "oro" ? 50 : 10;
          const antes = Math.floor(pts / 100);
          pts += n;
          textos.push({ txt: `+${n}`, x: o.x, y: o.y - 4, vida: 40, c: o.tipo === "oro" ? "Y" : "W" });
          bip(o.tipo === "oro" ? 880 : 660, o.tipo === "oro" ? 1760 : 990, o.tipo === "oro" ? 0.16 : 0.08);
          if (Math.floor(pts / 100) > antes) {
            nivel = Math.floor(pts / 100);
            mensaje = T(`LANZAMIENTO v1.${nivel}`, `RELEASE v1.${nivel}`);
            mensajeT = 90;
            [523, 659, 784, 1047].forEach((f, i) => bip(f, 0, 0.09, "square", 0.04, 0.12 + i * 0.08));
          }
        }
        boca = "s"; bocaT = 24;
        hud();
      } else if (o.y + 6 >= piso()) {
        o.fuera = true;
        if (o.tipo === "cafe") continue;
        vidas--;
        destellos.push({ x: o.x, vida: 30 });
        mensaje = T("¡BUG EN PRODUCCION!", "BUG IN PRODUCTION!");
        mensajeT = 70;
        boca = "o"; bocaT = 45;
        if (!RM) temblor = 10;
        bip(180, 70, 0.3, "sawtooth", 0.06);
        hud();
        if (vidas <= 0) { fin(); break; }
      }
    }
    objs = objs.filter((o) => !o.fuera);
  }
  function dibuja() {
    ctx.save();
    ctx.fillStyle = col.F;
    ctx.fillRect(0, 0, W, H);
    if (temblor) ctx.translate(temblor % 2 ? 1 : -1, 0);
    for (const o of objs) {
      if (o.tipo === "cafe") pinta(CAFE, o.x, o.y);
      else pinta((o.tipo === "oro" ? ORO : BUG)[(t >> 3) % 2], o.x, o.y);
    }
    for (const x of textos) if (x.vida > 10 || x.vida % 2) letras(x.txt, x.x, x.y, x.c);
    // El borde del CRT, con su código: los bugs salen de ahí
    ctx.fillStyle = col.D;
    ctx.fillRect(0, 0, W, 9);
    ctx.fillStyle = col.G;
    for (const [x, yy, l] of codigo) ctx.fillRect(x, yy, l, 1);
    if ((t >> 4) % 2) { ctx.fillStyle = col.Y; ctx.fillRect(W - 6, 5, 2, 2); }
    for (const g of grietas) { ctx.fillStyle = g.vida % 4 < 2 ? col.R : col.F; ctx.fillRect(g.x, 7, 3, 2); }
    // Producción: el piso
    ctx.fillStyle = col.D;
    ctx.fillRect(0, piso(), W, H - piso());
    ctx.fillStyle = col.G;
    for (let x = (t >> 2) % 4; x < W; x += 4) ctx.fillRect(x, piso() + 1, 2, 1);
    for (const d of destellos) if (d.vida % 6 < 3) { ctx.fillStyle = col.R; ctx.fillRect(Math.round(d.x) - 4, piso(), 15, H - piso()); }
    // BIT mira hacia el bug más cercano al piso
    let cerca = null;
    for (const o of objs) if (o.tipo !== "cafe" && (!cerca || o.y > cerca.y)) cerca = o;
    const dx = cerca ? cerca.x + 3 - (bit.x + 5) : 0;
    if (P()) pinta(P().bitSprite(dx < -8 ? -1 : dx > 8 ? 1 : 0, parpadeo > 0, boca), bit.x, bitY());
    ctx.restore();
    if (mensaje && mensajeT % 20 > 4) {
      ctx.font = `8px "Press Start 2P"`;
      ctx.textAlign = "center";
      ctx.fillStyle = /BUG/.test(mensaje) ? col.R : col.Y;
      ctx.fillText(mensaje, W / 2, Math.round(H * 0.42));
    }
  }
  function bucle(ts) {
    raf = requestAnimationFrame(bucle);
    acum += Math.min(100, ts - (ult || ts));
    ult = ts;
    while (acum >= 1000 / 60) { paso(); acum -= 1000 / 60; }
    dibuja();
  }

  // Puntero: el mouse guía a BIT al moverse sobre el juego; en el teléfono, arrastrando el dedo
  lienzo.addEventListener("pointerdown", (e) => { lienzo.setPointerCapture(e.pointerId); mueve(e); if (estado === "titulo") empezar(); });
  lienzo.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse" || e.buttons) mueve(e); });
  function mueve(e) { const r = lienzo.getBoundingClientRect(); meta = ((e.clientX - r.left) / r.width) * W; }

  // Teclado: mientras el juego está abierto, todas las teclas son suyas
  function teclas(e) {
    if (el.hidden) return;
    const k = e.key.toLowerCase();
    const flechaIzq = k === "arrowleft" || k === "a", flechaDer = k === "arrowright" || k === "d";
    if (e.type === "keyup") { if (flechaIzq) izq = false; if (flechaDer) der = false; return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    e.stopPropagation();
    e.preventDefault();
    if (flechaIzq) izq = true;
    else if (flechaDer) der = true;
    else if (k === "escape") { if (estado === "jugando") pausa(true); else cerrar(false); }
    else if (k === "p") pausa(estado === "jugando");
    else if (estado === "titulo" && (k === " " || k === "enter")) empezar();
    else if (estado === "pausa" && (k === " " || k === "enter")) pausa(false);
    else if (estado === "fin" && (k === "r" || k === " " || k === "enter")) empezar();
    else if (estado === "fin" && k === "y" && deApagado) cerrar(true);
  }
  window.addEventListener("keydown", teclas, true);
  window.addEventListener("keyup", teclas, true);
  const alSalir = () => pausa(true);
  document.addEventListener("visibilitychange", () => { if (document.hidden && !el.hidden) pausa(true); });

  function abrir() {
    if (!el.hidden) return;
    deApagado = !!(P() && P().consola.apagada());
    volverA = document.activeElement;
    bloqueamos = !doc.classList.contains("lock");
    doc.classList.add("lock");
    el.hidden = false;
    leeCol();
    medir();
    hud();
    titulo();
    izq = der = false;
    meta = null;
    ult = 0;
    raf = requestAnimationFrame(bucle);
    window.addEventListener("resize", medir);
    window.addEventListener("blur", alSalir);
    el.focus({ preventScroll: true });
  }
  // encender = Y: cierra el juego y vuelve a encender la consola
  function cerrar(encender) {
    el.hidden = true;
    cancelAnimationFrame(raf);
    raf = 0;
    estado = "titulo";
    window.removeEventListener("resize", medir);
    window.removeEventListener("blur", alSalir);
    if (bloqueamos) doc.classList.remove("lock");
    if (encender && deApagado && P()) P().consola.encender();
    else if (volverA && volverA.isConnected) volverA.focus({ preventScroll: true });
  }

  window.Juego = { abrir, abierto: () => !el.hidden };
})();
