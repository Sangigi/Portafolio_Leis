/* ---------- BIT & BUGS: el minijuego del GAME OVER ----------
   Sale al contestar N en el CONTINUE? (tecla J o el botón). Tiene dos modos:
   - CLASICO: los bugs se escapan del CRT y BIT los atrapa antes de que lleguen a producción.
   - RITMO: los bugs caen al compás de "u i a Cat" (mapa en js/ritmo-uia.js); el escenario cambia con la
     canción y al fondo gira un gato, más rápido o más lento según la música. No se pierde: al final hay nota.
   Los récords se guardan en este navegador. */
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
  const R = window.RitmoUIA || null;

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
  // El gato que gira al fondo del modo ritmo: de lado, de frente y de espaldas (A gris, S rayas, W blanco, p rosa)
  const GATO_LADO = [
    "SS................A..A..",
    ".AS...............AA.AA.",
    "..A..............AAAAAAA",
    "..A..............AAAKAAW",
    "..AA.............AAAAAWp",
    "..AAAAAAAAAAAAAAAAAAAWW.",
    "..AASAAASAAASAAAAAAAA...",
    "..AASAAASAAASAAAAAAAW...",
    "..AAAAAAAAAAAAAAAAAWW...",
    "..AAAAAAAAAAAAAAAAWW....",
    "..AAAAWWWWWWWWWAAAA.....",
    "..AAA.AA......AAA.AA....",
    "..AA..AA......AA..AA....",
    "..AA..AA......AA..AA....",
    "..AA..AA......AA..AA....",
    "..WW..WW......WW..WW....",
  ];
  const GATO_FRENTE = [
    ".AA.......AA.",
    ".ApA.....ApA.",
    ".AAAAAAAAAAA.",
    ".AASAASAASAA.",
    ".AKKAAAAAKKA.",
    ".AAAAApAAAAA.",
    "..AAWWWWWAA..",
    "...AAWWWAA...",
    "..AAAWWWAAA..",
    "..AAAWWWAAA..",
    "..AAAWWWAAA..",
    "..AAAAWAAAA..",
    "..AA.AAA.AA..",
    "..AA.....AA..",
    "..AA.....AA..",
    "..WW.....WW..",
  ];
  const GATO_ATRAS = [
    ".AA.......AA.",
    ".AAA.....AAA.",
    ".AAAAAAAAAAA.",
    ".AASAASAASAA.",
    ".AAAAAAAAAAA.",
    ".AAAAAAAAAAA.",
    "..AAAAAAAAA..",
    "...AASASAA...",
    "..AAAAAAAAA..",
    "..AASASASAA..",
    "..AAAAAAAAA..",
    "..AAAASAAAA..",
    "..AA.ASA.AA..",
    "..AA..S..AA..",
    "..AA..S..AA..",
    "..WW.....WW..",
  ];
  let gatoListo = false;
  const gatoImg = {};

  const el = document.createElement("div");
  el.className = "juego";
  el.hidden = true;
  el.tabIndex = -1;
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", "BIT & BUGS");
  el.innerHTML = `
    <div class="juego-hud">
      <span><span>PUNTOS</span> <b class="j-pts">000000</b></span>
      <span><span>RECORD</span> <b class="j-rec">000000</b></span>
      <span><span class="j-ver-k">VERSION</span> <b class="j-ver">v1.0</b></span>
      <span class="j-vidas" role="img"></span>
    </div>
    <div class="juego-marco"><canvas class="juego-lienzo"></canvas><div class="juego-msg" aria-live="polite"></div></div>
    <p class="juego-ayuda">← → o A D para mover · P pausa · ESC salir</p>`;
  document.body.appendChild(el);
  const lienzo = $("canvas", el), ctx = lienzo.getContext("2d"), marco = $(".juego-marco", el), msg = $(".juego-msg", el);
  const ptsEl = $(".j-pts", el), recEl = $(".j-rec", el), verEl = $(".j-ver", el), verK = $(".j-ver-k", el), vidasEl = $(".j-vidas", el);

  let W = 200, H = 140, escala = 4, col = {}, raf = 0, ult = 0, acum = 0;
  let estado = "titulo", pts = 0, vidas = 3, nivel = 0, t = 0, sig = 0, objs = [], textos = [], grietas = [], destellos = [];
  let bit = { x: 95, v: 0 }, izq = false, der = false, meta = null, boca = "n", bocaT = 0, parpadeo = 0, temblor = 0, mensaje = "", mensajeT = 0;
  let record = +(lee("bitBugsRecord") || 0), nuevoRecord = false, codigo = [], deApagado = false, bloqueamos = false, volverA = null;
  const piso = () => H - 4, bitY = () => piso() - 12;
  // Modo ritmo
  let modo = "clasico", audio = null, intentoN = 0, ts = 0, ultA = -1, ultP = 0, rI = 0, rG = 0, golpeN = 0, pulso = 0, secI = -1, cambio = 0;
  let combo = 0, maxCombo = 0, atrapados = 0, giro = 0, vGiro = 0.3, energiaAhora = 0, anillos = [];
  let recordR = +(lee("bitBugsRitmoRecord") || 0);

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
      B: pig("--p-azul"), C: pig("--p-cian"), P: pig("--p-rosa"), M: pig("--p-morado"), N: pig("--p-naranja"), V: pig("--p-verde"),
      // El gato del modo ritmo
      A: "#b9bcc8", S: "#6f7386", p: "#e58fa6",
    };
    gatoListo = false;
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
    if (modo === "ritmo") {
      recEl.textContent = seis(Math.max(recordR, pts));
      verK.textContent = "BPM";
      verEl.textContent = R.sec[Math.max(0, secI)][3];
      vidasEl.innerHTML = `<span class="j-combo">COMBO <b>${String(combo).padStart(3, "0")}</b> <i>x${multi()}</i></span>`;
      vidasEl.setAttribute("aria-label", `Combo: ${combo}`);
      return;
    }
    recEl.textContent = seis(Math.max(record, pts));
    verK.textContent = "VERSION";
    verEl.textContent = `v1.${nivel}`;
    vidasEl.innerHTML = [0, 1, 2].map((i) => svg(i < vidas ? CORAZON : CORAZON_VACIO, 2)).join("");
    vidasEl.setAttribute("aria-label", `${T("Vidas", "Lives")}: ${vidas}`);
  }
  // En ritmo, cada 10 bugs seguidos sube el multiplicador (hasta x4)
  const multi = () => 1 + Math.min(3, Math.floor(combo / 10));
  function aviso(html) { msg.innerHTML = html; msg.hidden = !html; }
  function titulo() {
    detieneAudio();
    estado = "titulo";
    modo = "clasico";
    objs = []; textos = []; grietas = []; destellos = []; mensaje = "";
    hud();
    aviso(`<p class="jm-t">BIT &amp; BUGS</p>
      <p>${T("Los bugs se escapan del CRT.<br>Atrápalos antes de que lleguen a producción.", "The bugs are escaping from the CRT.<br>Catch them before they reach production.")}</p>
      <p class="jm-x">${svg(BUG[0], 3)}<span>+10</span> ${svg(ORO[0], 3)}<span>+50</span> ${svg(CAFE, 3)}<span>+1 ${T("vida", "life")}</span></p>
      <p class="jm-b jm-modos"><button type="button" data-j="empezar">${kb("1")}${T("CLASICO", "CLASSIC")}</button>${R ? `<button type="button" data-j="ritmo">${kb("2")}${T("RITMO", "RHYTHM")} ♪ U I A CAT</button>` : ""}</p>
      ${R ? `<p class="jm-nota">${T("RITMO: los bugs caen al compás de la canción. Dura casi 4 minutos y no se pierde.", "RHYTHM: bugs fall to the beat of the song. It lasts almost 4 minutes and you can't lose.")}</p>` : ""}`);
  }
  function empezar() {
    detieneAudio();
    modo = "clasico";
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
      ${botonesFin("empezar")}`);
  }
  const botonesFin = (otra) => `<p class="jm-b"><button type="button" data-j="${otra}">${kb("R")}${T("OTRA VEZ", "AGAIN")}</button><button type="button" data-j="titulo">${kb("M")}${T("MODOS", "MODES")}</button>${deApagado ? `<button type="button" data-j="encender">${kb("Y")}${T("ENCENDER CONSOLA", "POWER ON")}</button>` : ""}<button type="button" data-j="salir">${kb("ESC")}${T("SALIR", "QUIT")}</button></p>`;
  function pausa(on) {
    if (on && estado === "jugando") {
      estado = "pausa";
      if (modo === "ritmo" && audio) audio.pause();
      aviso(`<p class="jm-t">${T("PAUSA", "PAUSED")}</p><p class="jm-b"><button type="button" data-j="seguir">${kb("P")}${T("SEGUIR", "RESUME")}</button><button type="button" data-j="titulo">${kb("M")}${T("MODOS", "MODES")}</button></p>`);
    } else if (!on && estado === "pausa") {
      estado = "jugando"; aviso(""); ult = 0;
      if (modo === "ritmo" && audio) audio.play().catch(() => {});
    }
  }
  msg.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-j]");
    if (!b) return;
    ({ empezar, ritmo: empezarRitmo, titulo, encender: () => cerrar(true), salir: () => cerrar(false), seguir: () => pausa(false) })[b.dataset.j]();
  });

  /* ---------- Modo ritmo: la canción manda ---------- */
  function detieneAudio() {
    intentoN++;
    if (!audio) return;
    audio.pause();
    try { audio.currentTime = 0; } catch (e) { /* aún sin datos */ }
  }
  // El segundo de la canción que suena ahora. El <audio> avisa su tiempo a saltitos: entre aviso y aviso se estima con el reloj
  function tCancion() {
    if (!audio) return 0;
    const a = audio.currentTime;
    if (a !== ultA) { ultA = a; ultP = performance.now(); }
    return a + (audio.paused ? 0 : Math.min(0.25, (performance.now() - ultP) / 1000));
  }
  function errorAudio() {
    if (el.hidden || modo !== "ritmo" || estado !== "cargando") return;
    estado = "fin";
    aviso(`<p class="jm-t jm-rojo">ERROR</p><p>${T("No se pudo cargar la canción.", "The song could not be loaded.")}</p>
      <p class="jm-b"><button type="button" data-j="titulo">${kb("M")}${T("MODOS", "MODES")}</button><button type="button" data-j="salir">${kb("ESC")}${T("SALIR", "QUIT")}</button></p>`);
  }
  function empezarRitmo() {
    if (!R) return;
    detieneAudio();
    modo = "ritmo";
    estado = "cargando";
    pts = 0; t = 0; objs = []; textos = []; grietas = []; destellos = []; anillos = [];
    bit = { x: W / 2 - 5, v: 0 }; boca = "n"; bocaT = 0; mensaje = ""; nuevoRecord = false;
    ts = 0; ultA = -1; rI = 0; rG = 0; golpeN = 0; pulso = 0; secI = -1; cambio = 0; combo = 0; maxCombo = 0; atrapados = 0; giro = 0; vGiro = 0.3; energiaAhora = 0;
    hud();
    aviso(`<p class="jm-t">♪</p><p>${T("Cargando la canción...", "Loading the song...")}</p>`);
    if (!audio) {
      audio = new Audio(R.archivo);
      audio.preload = "auto";
      audio.addEventListener("ended", () => { if (modo === "ritmo" && estado === "jugando") finRitmo(); });
      audio.addEventListener("error", errorAudio);
    }
    audio.volume = R.volumen;
    audio.muted = !!(SND.silencio && SND.silencio());
    const intento = intentoN;
    // play() va aquí, dentro del clic o la tecla: así el navegador deja sonar
    let p;
    try { p = audio.play(); } catch (e) { errorAudio(); return; }
    (p && p.then ? p : Promise.resolve()).then(() => {
      if (intento !== intentoN || el.hidden || modo !== "ritmo" || estado !== "cargando") return;
      estado = "jugando";
      aviso("");
      ult = 0;
      if (P()) P().cuenta("juego-ritmo");
    }).catch(() => { if (intento === intentoN) errorAudio(); });
  }
  function finRitmo() {
    estado = "fin";
    if (audio) audio.pause();
    objs = [];
    const total = R.notas.length / 3, pct = Math.round((atrapados / total) * 100);
    const rango = pct >= 95 ? "S" : pct >= 85 ? "A" : pct >= 70 ? "B" : pct >= 50 ? "C" : "D";
    if (pts > recordR) { recordR = pts; nuevoRecord = true; guarda("bitBugsRitmoRecord", String(recordR)); }
    hud();
    [523, 659, 784, 1047, 1319].forEach((f, i) => bip(f, 0, 0.12, "square", 0.04, i * 0.1));
    aviso(`<p class="jm-t">${T("¡CANCION COMPLETA!", "SONG CLEAR!")}</p>
      <p class="jm-rango jm-r${rango}">${rango}</p>
      <p class="jm-p">${T("PUNTOS", "SCORE")} ${seis(pts)}<br>BUGS ${atrapados}/${total} · ${pct}%<br>COMBO MAX ${maxCombo}${nuevoRecord ? `<br><span class="jm-nuevo">${T("¡NUEVO RECORD!", "NEW HIGH SCORE!")}</span>` : ""}</p>
      ${botonesFin("ritmo")}`);
  }
  // Qué tan fuerte va la canción en este segundo (0 a 1), suavizado entre muestra y muestra
  function energia(seg) {
    const E = R.energia, x = Math.max(0, Math.min(E.length - 1.001, seg * 2)), i = Math.floor(x), f = x - i;
    return ((+E[i]) * (1 - f) + (+E[i + 1]) * f) / 9;
  }
  const seccionDe = (seg) => { let i = 0; while (i < R.sec.length - 1 && seg >= R.sec[i][1]) i++; return i; };
  function pasoRitmo() {
    ts = tCancion() + R.desfase;
    if (ts >= R.dur - 0.05) { finRitmo(); return; }
    // Cambio de escenario
    const s = seccionDe(ts);
    if (s !== secI) {
      secI = s;
      cambio = 26;
      mensaje = `${s + 1}/${R.sec.length} ${T(R.sec[s][4], R.sec[s][5])}`;
      mensajeT = 120;
      hud();
    }
    if (cambio > 0) cambio--;
    // El escenario late con cada bombo
    pulso *= 0.88;
    while (rG < R.golpes.length && R.golpes[rG] <= ts * 100) { rG++; golpeN++; pulso = 1; anillos.push(ts); if (anillos.length > 4) anillos.shift(); }
    // El gato gira según la energía de la canción: de un cuarto de vuelta por segundo a casi tres
    energiaAhora = energia(ts);
    vGiro += (0.22 + energiaAhora * energiaAhora * 2.7 - vGiro) * 0.07;
    giro += vGiro / 60 + pulso * 0.003;
    moverBit(3);
    // Cada bug sale con el tiempo justo para llegar a BIT en su nota
    const N = R.notas;
    while (rI * 3 < N.length) {
      const tn = N[rI * 3] / 1000, d = R.sec[seccionDe(tn)][2];
      if (tn - d > ts) break;
      const fx = N[rI * 3 + 1] / 100;
      objs.push({ tipo: N[rI * 3 + 2] ? "oro" : "bug", fx, tn, d, x: 0, y: 0 });
      grietas.push({ x: Math.round(2 + fx * (W - 11) + 2), vida: 16 });
      rI++;
    }
    const by = bitY(), y0 = 3, yT = by - 3;
    for (const o of objs) {
      o.x = 2 + o.fx * (W - 11);
      o.y = y0 + (yT - y0) * (1 - (o.tn - ts) / o.d);
      if (o.y + 6 >= by + 1 && o.y <= by + 7 && o.x + 6 >= bit.x - 1 && o.x <= bit.x + 10) {
        o.fuera = true;
        combo++; atrapados++;
        if (combo > maxCombo) maxCombo = combo;
        const n = (o.tipo === "oro" ? 50 : 10) * multi();
        pts += n;
        textos.push({ txt: `+${n}`, x: o.x, y: o.y - 4, vida: 34, c: o.tipo === "oro" ? "Y" : "W" });
        if (o.tipo === "oro") bip(880, 1760, 0.12, "square", 0.03);
        if (combo % 50 === 0) { mensaje = `COMBO ${combo}!`; mensajeT = 80; }
        boca = "s"; bocaT = 24;
        hud();
      } else if (o.y + 6 >= piso()) {
        o.fuera = true;
        destellos.push({ x: o.x, vida: 18 });
        if (combo >= 10) { boca = "o"; bocaT = 40; if (!RM) temblor = 6; bip(180, 70, 0.2, "sawtooth", 0.04); }
        combo = 0;
        hud();
      }
    }
    objs = objs.filter((o) => !o.fuera);
  }

  function nace() {
    const r = Math.random();
    const tipo = vidas < 3 && r < 0.05 ? "cafe" : r < 0.13 ? "oro" : "bug";
    const v = (0.42 + nivel * 0.07) * (tipo === "oro" ? 1.45 : tipo === "cafe" ? 0.8 : 1) * azar(0.85, 1.15);
    const x = 2 + Math.random() * (W - 12);
    objs.push({ tipo, x, y: 1, v, f: azar(0, 6) });
    grietas.push({ x: Math.round(x + 2), vida: 16 });
  }
  // BIT: teclado o puntero
  function moverBit(tope) {
    if (izq || der) { meta = null; bit.v = Math.max(-tope, Math.min(tope, bit.v + (der ? 0.5 : 0) - (izq ? 0.5 : 0))); }
    else if (meta != null) { const d = meta - (bit.x + 5); bit.v = Math.abs(d) < 1 ? 0 : Math.sign(d) * Math.min(Math.abs(d) * 0.35, 3.4); }
    else bit.v *= 0.6;
    bit.x = Math.max(0, Math.min(W - 10, bit.x + bit.v));
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
    if (modo === "ritmo") { pasoRitmo(); return; }
    moverBit(2.3 + nivel * 0.12);
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
    const ritmo = modo === "ritmo" && estado !== "cargando" && secI >= 0;
    if (ritmo) { escena(); gato(); escenaEncima(); }
    for (const o of objs) {
      // En ritmo, una sombra detrás de cada bug para que se distinga sobre cualquier escenario
      if (ritmo) { ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fillRect(Math.round(o.x) - 1, Math.round(o.y) - 1, 9, 9); }
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
    // En ritmo, la orilla de abajo del CRT marca cuánto va de la canción
    if (ritmo) { ctx.fillStyle = col.Y; ctx.fillRect(0, 8, Math.round((W * ts) / R.dur), 1); }
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
    // En ritmo BIT brinca un pixel con cada bombo
    if (ritmo) { ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fillRect(Math.round(bit.x) - 1, bitY() - 1, 12, 13); }
    if (P()) pinta(P().bitSprite(dx < -8 ? -1 : dx > 8 ? 1 : 0, parpadeo > 0, boca), bit.x, bitY() - (ritmo && estado === "jugando" && pulso > 0.7 ? 1 : 0));
    ctx.restore();
    if (ritmo && estado !== "jugando") { ctx.fillStyle = "rgba(0,0,0,.74)"; ctx.fillRect(0, 0, W, H); }
    if (ritmo && estado === "jugando" && mensaje && (mensajeT > 100 ? mensajeT % 6 < 3 : true)) {
      // Nombre del escenario (o el combo), arriba y en dos renglones para que quepa en el teléfono
      const partes = /^\d+\//.test(mensaje) ? [mensaje.slice(0, mensaje.indexOf(" ")), mensaje.slice(mensaje.indexOf(" ") + 1)] : [mensaje];
      ctx.font = `8px "Press Start 2P"`;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,0,0,.6)";
      ctx.fillRect(0, 12, W, partes.length * 11 + 5);
      partes.forEach((txt, i) => { ctx.fillStyle = i === 0 && partes.length > 1 ? col.W : col.Y; ctx.fillText(txt, W / 2, 23 + i * 11); });
    } else if (!ritmo && mensaje && mensajeT % 20 > 4) {
      ctx.font = `8px "Press Start 2P"`;
      ctx.textAlign = "center";
      ctx.fillStyle = /BUG/.test(mensaje) ? col.R : col.Y;
      ctx.fillText(mensaje, W / 2, Math.round(H * 0.42));
    }
  }

  /* ---------- Escenarios del modo ritmo: uno por cada parte de la canción ---------- */
  const TAU = Math.PI * 2;
  // Azar que no cambia de un cuadro a otro: cada estrella, burbuja o edificio cae siempre en su lugar
  const h = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const rc = (c, x, y, w, hh) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(hh))); };
  function linea(c, x0, y0, x1, y1) {
    ctx.fillStyle = c;
    const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    for (let i = 0; i <= n; i++) ctx.fillRect(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), 1, 1);
  }
  const bandas = (cols, ya, yb) => cols.forEach((c, i) => rc(c, 0, ya + ((yb - ya) * i) / cols.length, W, (yb - ya) / cols.length + 1));
  function disco(c, x, y, r) { for (let dy = -r; dy <= r; dy++) { const w = Math.round(Math.sqrt(r * r - dy * dy)); rc(c, x - w, y + dy, w * 2, 1); } }
  function poligono(c, alfa, pts) {
    ctx.globalAlpha = alfa;
    ctx.fillStyle = c;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.fill();
    ctx.globalAlpha = 1;
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
  const ESCENAS = [
    // 1. ARRANQUE: la terminal escribe código
    (Y0, Y1, A) => {
      const filas = Math.floor(A / 4), escritas = Math.floor(ts * 5), off = Math.max(0, escritas - filas + 2);
      for (let i = 0; i < filas; i++) {
        const n = i + off;
        if (n > escritas) break;
        let x = 3 + ((h(n) * 4) | 0) * 4;
        const segs = 1 + ((h(n + 0.5) * 4) | 0);
        for (let s = 0; s < segs && x < W - 6; s++) {
          let l = 4 + ((h(n * 7 + s) * 20) | 0);
          if (n === escritas) l = Math.min(l, ((ts * 5) % 1) * 60 - s * 14);
          if (l < 1) break;
          const verde = h(n * 3 + s) < 0.3;
          rc(verde ? (pulso > 0.5 ? col.V : "#1d5c3f") : col.D, x, Y0 + 3 + i * 4, Math.min(l, W - 3 - x), 2);
          x += l + 3;
        }
        if (n === escritas && (t >> 3) % 2) rc(col.W, Math.min(x, W - 5), Y0 + 3 + i * 4, 2, 2);
      }
    },
    // 2. CIUDAD NEON: sol de rayas, edificios y un piso de rejilla que avanza con el compás
    (Y0, Y1, A, cx, cy, sec) => {
      const hy = Math.round(Y0 + A * 0.6);
      bandas(["#0d0221", "#1b0638", "#2d0a4e", "#4a0f5e", "#6b1560"], Y0, hy);
      for (let i = 0; i < 22; i++) rc("#8a6fb0", h(i) * W, Y0 + h(i + 0.5) * (hy - Y0) * 0.6, 1, 1);
      const r = Math.round(Math.min(W * 0.22, A * 0.36) + pulso * 1.5);
      for (let dy = -r; dy <= 0; dy++) {
        const w = Math.round(Math.sqrt(r * r - dy * dy)), y = hy + dy, f = -dy / r;
        if (f < 0.6 && (y + (t >> 3)) % 4 === 0) continue;
        rc(f > 0.66 ? col.Y : f > 0.33 ? col.N : col.P, cx - w, y, w * 2, 1);
      }
      for (let x = 0, i = 0; x < W; i++) {
        const w = 6 + ((h(i) * 8) | 0), alto = Math.abs(x + w / 2 - cx) < r ? 3 + ((h(i + 0.3) * 3) | 0) : 5 + ((h(i + 0.3) * A * 0.22) | 0);
        rc("#150a2e", x, hy - alto, w, alto);
        for (let wy = hy - alto + 2; wy < hy - 1; wy += 3) for (let wx = x + 1; wx < x + w - 1; wx += 3) if (h(i * 13 + wx * 7 + wy) < 0.45) rc(h(i + wx + wy + (golpeN >> 2)) < 0.6 ? col.Y : "#5a3d1e", wx, wy, 1, 1);
        x += w + 1;
      }
      rc("#0a0118", 0, hy, W, Y1 - hy);
      for (let j = -9; j <= 9; j++) linea("#5a2a9c", cx + j * 4, hy, cx + j * W * 0.17, Y1);
      const fase = ((ts * sec[3]) / 60) % 1;
      for (let k = 0; k < 6; k++) { const pp = (k + fase) / 6; rc(col.M, 0, hy + (Y1 - hy) * pp * pp, W, 1); }
      rc(col.P, 0, hy, W, 1);
    },
    // 3. BAJO EL AGUA: la música suena tapada; rayos de luz, algas, peces y burbujas
    (Y0, Y1, A) => {
      bandas(["#0b3d6e", "#0a3260", "#082650", "#061b3d", "#04122b"], Y0, Y1);
      for (let i = 0; i < 3; i++) {
        const x = W * (0.2 + i * 0.32) + Math.sin(ts * 0.5 + i) * 6, d = A * 0.4;
        poligono("#9fdcff", 0.07 + pulso * 0.05, [[x, Y0], [x + 12, Y0], [x + 20 - d, Y1], [x - 6 - d, Y1]]);
      }
      for (let x = 4, i = 0; x < W; x += 11 + ((h(i) * 8) | 0), i++) {
        const alto = 8 + ((h(i + 0.2) * A * 0.18) | 0);
        for (let j = 0; j < alto; j++) rc(j % 4 < 2 ? "#1f7a5a" : "#17604a", x + Math.round(Math.sin(ts * 2 + j * 0.35 + i) * (j / alto) * 3), Y1 - 1 - j, 2, 1);
      }
      for (let i = 0; i < 3; i++) {
        const dir = i % 2 ? 1 : -1, tramo = W + 30;
        let x = (ts * (9 + i * 4) + h(i) * tramo) % tramo;
        if (dir < 0) x = tramo - x;
        x -= 15;
        const y = Y0 + A * (0.18 + 0.2 * i) + Math.sin(ts * 1.5 + i) * 2;
        rc(col.N, x, y, 5, 3);
        rc(col.N, dir > 0 ? x - 2 : x + 5, y + ((t >> 3) % 2), 2, 2);
        rc(col.K, dir > 0 ? x + 3 : x + 1, y + 1, 1, 1);
      }
      for (let i = 0; i < 16; i++) {
        const g = i % 4 === 0 ? 2 : 1;
        rc("#7fd4ff", h(i) * W + Math.sin(ts * 1.6 + i * 2) * 3, Y1 - ((ts * (7 + h(i + 0.3) * 14) + h(i + 0.7) * A) % A), g, g);
      }
    },
    // 4. DESPEGUE: las estrellas aceleran mientras la canción sube
    (Y0, Y1, A, cx, cy, sec) => {
      rc("#05030f", 0, Y0, W, A);
      const L = sec[1] - sec[0], seg = Math.max(0, ts - sec[0]), k = Math.min(1, seg / L);
      const fase = 0.12 * seg + (0.5 * seg * seg * seg) / (L * L), radio = Math.hypot(W, A) / 2 + 6;
      for (let i = 0; i < 70; i++) {
        const a = h(i) * TAU, d = (h(i + 0.5) + fase * (0.6 + h(i + 0.8) * 0.8)) % 1, r = d * d * radio + 5, largo = 1 + k * k * 12 * d + pulso * 2;
        const c = d < 0.3 ? "#555a77" : i % 5 === 0 ? col.C : i % 7 === 0 ? col.Y : "#ffffff";
        linea(c, cx + Math.cos(a) * r, cy + Math.sin(a) * r, cx + Math.cos(a) * (r - largo), cy + Math.sin(a) * (r - largo));
      }
    },
    // 5. PISTA DISCO: losetas que cambian con cada bombo, reflectores y un ecualizador en la pared
    (Y0, Y1, A, cx) => {
      rc("#12041f", 0, Y0, W, A);
      const PAL = [col.P, col.C, col.Y, col.M, col.V, col.N], fy = Math.round(Y0 + A * 0.7);
      for (let i = 0; i * 10 < W; i++) {
        const alto = (0.15 + energiaAhora * (0.3 + 0.7 * h(i * 5 + golpeN))) * A * 0.36 * (0.7 + 0.3 * pulso);
        rc(osc(PAL[i % 6], 0.42), i * 10 + 2, fy - alto, 7, alto);
      }
      for (let i = 0; i < 4; i++) {
        const x0 = W * (0.12 + i * 0.25), x1 = x0 + Math.tan(Math.sin(ts * 1.4 + i * 1.9) * 0.55) * A;
        poligono(PAL[(i + (golpeN >> 2)) % 6], 0.13, [[x0 - 1, Y0], [x0 + 1, Y0], [x1 + 12, Y1], [x1 - 12, Y1]]);
      }
      for (let j = 0; fy + j * 5 < Y1; j++) for (let i = 0; i * 10 < W; i++) rc(osc(PAL[(i * 3 + j * 5 + golpeN) % 6], (i + j + golpeN) % 2 ? 0.2 : 0.5), i * 10, fy + j * 5, 9, 4);
      rc(col.G, cx, Y0, 1, 6);
      disco("#8f93a8", Math.round(cx), Y0 + 11, 5);
      rc("#d8dbe8", cx - 3, Y0 + 8, 2, 2);
      for (let i = 0; i < 5; i++) if (h(i + golpeN) < 0.6) rc("#ffffff", cx - 5 + h(i + golpeN * 3) * 10, Y0 + 7 + h(i * 7 + golpeN) * 8, 1, 1);
    },
    // 6. NOCHE EN CALMA: la canción descansa; luna, nubes y luciérnagas
    (Y0, Y1, A) => {
      bandas(["#070b22", "#0a1030", "#0e173f", "#131f4f", "#1a2a60"], Y0, Y1);
      for (let i = 0; i < 45; i++) if (h(i + Math.floor(ts * 1.5 + h(i + 0.9) * 7)) > 0.25) rc(i % 6 === 0 ? col.Y : "#cfd6ff", h(i) * W, Y0 + h(i + 0.5) * A * 0.75, 1, 1);
      const mx = Math.round(W * 0.82), my = Math.round(Y0 + A * 0.2);
      disco("#f1edcf", mx, my, 7);
      rc("#d4cfa8", mx - 3, my - 2, 2, 2);
      rc("#d4cfa8", mx + 2, my + 2, 2, 1);
      for (let i = 0; i < 5; i++) {
        const tramo = W + 60, x = ((ts * (2.5 + i * 1.3) + h(i) * tramo) % tramo) - 50, y = Y0 + 8 + h(i + 0.2) * A * 0.5, c = i % 2 ? "#2a3970" : "#35478a";
        rc(c, x, y, 26, 4); rc(c, x + 5, y - 3, 14, 3); rc(c, x + 12, y + 4, 18, 2);
      }
      for (let x = 0; x < W; x++) { const alto = 6 + Math.sin(x * 0.07) * 4 + Math.sin(x * 0.19 + 2) * 2; rc("#0a1330", x, Y1 - alto, 1, alto); }
      for (let i = 0; i < 8; i++) if (Math.sin(ts * 2 + i * 1.7) > 0) rc(col.Y, h(i) * W + Math.sin(ts * 0.7 + i) * 8, Y1 - 10 - h(i + 0.3) * A * 0.3 + Math.cos(ts * 0.9 + i * 2) * 4, 1, 1);
    },
    // 7. LLUVIA DE CODIGO: cae cada vez más rápido hasta el último estribillo
    (Y0, Y1, A, cx, cy, sec) => {
      rc("#020a05", 0, Y0, W, A);
      const L = sec[1] - sec[0], seg = Math.max(0, ts - sec[0]), fase = seg + (seg * seg) / L;
      const TONOS = ["#d9ffe6", col.V, "#2a8a5f", "#1d5c3f", "#123a28", "#0b2419"];
      for (let c = 0; c * 5 < W; c++) {
        const cab = ((fase * (16 + h(c) * 26) + h(c + 0.4) * (A + 60)) % (A + 60)) - 10;
        for (let j = 0; j < 10; j++) {
          const y = Math.round(Y0 + cab - j * 5);
          if (y < Y0 - 4 || y > Y1) continue;
          ctx.fillStyle = TONOS[j < 1 ? 0 : Math.min(5, 1 + (j >> 1))];
          const bits = (h(c * 31 + j * 17 + Math.floor(fase * 3 + h(c) * 9) * 7) * 4096) | 0;
          for (let b = 0; b < 12; b++) if ((bits >> b) & 1) ctx.fillRect(c * 5 + 1 + (b % 3), y + ((b / 3) | 0), 1, 1);
        }
      }
    },
    // 8. HIPERESPACIO: rayos que giran, anillos con cada bombo y colores que cambian cada cuatro
    (Y0, Y1, A, cx, cy) => {
      const pares = [[col.P, col.M], [col.B, col.C], [col.N, col.R], [col.V, col.C]], par = pares[RM ? 0 : (golpeN >> 2) % 4];
      const a0 = ts * (RM ? 0.25 : 1.3), n = 12, radio = Math.hypot(W, A);
      rc(osc(par[1], 0.28), 0, Y0, W, A);
      for (let i = 0; i < n; i += 2) {
        const a = a0 + (i * TAU) / n, b = a0 + ((i + 1) * TAU) / n;
        poligono(osc(par[0], 0.42), 1, [[cx, cy], [cx + Math.cos(a) * radio, cy + Math.sin(a) * radio], [cx + Math.cos(b) * radio, cy + Math.sin(b) * radio]]);
      }
      for (let i = 0; i < 24; i++) {
        const a = h(i) * TAU, d = (h(i + 0.5) + ts * 1.4 * (0.6 + h(i + 0.2))) % 1, r = d * d * radio * 0.6 + 8, largo = 2 + d * 7;
        linea("#ffffff", cx + Math.cos(a) * r, cy + Math.sin(a) * r, cx + Math.cos(a) * (r - largo), cy + Math.sin(a) * (r - largo));
      }
      if (!RM) for (const tg of anillos) {
        const edad = ts - tg;
        if (edad < 0 || edad > 0.6) continue;
        const rx = 8 + edad * 130, ry = rx * 0.62;
        ctx.globalAlpha = (1 - edad / 0.6) * 0.55;
        rc("#ffffff", cx - rx, cy - ry, rx * 2, 1); rc("#ffffff", cx - rx, cy + ry, rx * 2, 1);
        rc("#ffffff", cx - rx, cy - ry, 1, ry * 2); rc("#ffffff", cx + rx, cy - ry, 1, ry * 2);
        ctx.globalAlpha = 1;
      }
    },
    // 9. ABISMO: la canción se hunde; ondas lentas y plancton
    (Y0, Y1, A) => {
      bandas(["#02040c", "#030714", "#040a1c"], Y0, Y1);
      for (let w = 0; w < 3; w++) {
        const yb = Y0 + A * (0.28 + w * 0.2), amp = 2 + energiaAhora * 7 + pulso * 2;
        ctx.fillStyle = ["#1b4a8a", "#143663", "#0d2444"][w];
        for (let x = 0; x < W; x++) ctx.fillRect(x, Math.round(yb + Math.sin(x * 0.09 + ts * (1.2 - w * 0.3) + w * 2) * amp + Math.sin(x * 0.23 - ts) * 1.5), 1, 1);
      }
      for (let i = 0; i < 22; i++) rc("#3b5a8f", h(i) * W + Math.sin(ts * 0.6 + i) * 4, Y1 - ((ts * (2 + h(i + 0.3) * 5) + h(i + 0.7) * A) % A), 1, 1);
    },
    // 10. APAGANDO: carta de ajuste, y al final la imagen se cierra como un CRT
    (Y0, Y1, A) => {
      const cols = ["#ffffff", col.Y, col.C, col.V, col.P, col.R, col.B], bw = W / 7;
      for (let i = 0; i < 7; i++) {
        rc(osc(cols[i], 0.3 + pulso * 0.07), i * bw, Y0, bw + 1, A * 0.72);
        rc(osc(cols[6 - i], 0.18), i * bw, Y0 + A * 0.72, bw + 1, A * 0.1);
      }
      bandas(["#0c0c10", "#16161c", "#22222b", "#16161c"], Y0 + A * 0.82, Y1);
      rc("rgba(255,255,255,.07)", 0, Y0 + ((ts * 26) % A), W, 2);
    },
  ];
  function escena() {
    const Y0 = 9, Y1 = piso(), A = Y1 - Y0;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, Y0, W, A);
    ctx.clip();
    ESCENAS[secI](Y0, Y1, A, W / 2, Y0 + A * 0.5, R.sec[secI]);
    ctx.restore();
  }
  // Lo que va encima del gato: el destello al cambiar de escenario, el fogonazo del despegue y el apagón final
  function escenaEncima() {
    const Y0 = 9, Y1 = piso(), A = Y1 - Y0;
    if (!RM && cambio > 0) { ctx.globalAlpha = (cambio / 26) * 0.55; rc("#ffffff", 0, Y0, W, A); ctx.globalAlpha = 1; }
    if (!RM && secI === 3 && ts > 98.86) { ctx.globalAlpha = Math.min(1, (ts - 98.86) / 1.96) * 0.5; rc("#ffffff", 0, Y0, W, A); ctx.globalAlpha = 1; }
    const falta = R.dur - ts;
    if (secI === R.sec.length - 1 && falta < 3) {
      const k = 1 - Math.max(0, falta) / 3, mitad = Math.max(1, (A / 2) * (1 - k) * (1 - k));
      rc(col.F, 0, Y0, W, A / 2 - mitad);
      rc(col.F, 0, Y0 + A / 2 + mitad, W, A / 2 - mitad + 1);
      if (k > 0.75) { const ancho = (W / 2) * (1 - (k - 0.75) / 0.25); rc(col.F, 0, Y0, W / 2 - ancho, A); rc(col.F, W / 2 + ancho, Y0, W / 2 - ancho + 1, A); }
    }
  }
  // El gato: gira sobre sí mismo como en una tornamesa. Los sprites se dibujan una vez y luego se estiran según el ángulo
  function preparaGato() {
    const hazlo = (rows, espejo) => {
      const c = document.createElement("canvas");
      c.width = rows[0].length;
      c.height = rows.length;
      const g = c.getContext("2d");
      rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { if (r[i] === ".") continue; g.fillStyle = col[r[i]]; g.fillRect(espejo ? r.length - 1 - i : i, j, 1, 1); } });
      return c;
    };
    gatoImg.lado = hazlo(GATO_LADO, false);
    gatoImg.ladoEsp = hazlo(GATO_LADO, true);
    gatoImg.frente = hazlo(GATO_FRENTE, false);
    gatoImg.atras = hazlo(GATO_ATRAS, false);
    gatoListo = true;
  }
  function gato() {
    if (!gatoListo) preparaGato();
    const Y0 = 9, A = piso() - Y0, e = 2, cx = W / 2;
    const pie = Math.round(Y0 + A * 0.66) - (pulso > 0.6 ? 1 : 0);
    const s = Math.sin(giro * TAU), c = Math.cos(giro * TAU);
    let img, w;
    if (Math.abs(s) > 0.38) { img = s > 0 ? gatoImg.lado : gatoImg.ladoEsp; w = Math.max(8, Math.round(img.width * e * Math.abs(s))); }
    else { img = c > 0 ? gatoImg.frente : gatoImg.atras; w = img.width * e; }
    const alto = img.height * e;
    ctx.fillStyle = "rgba(0,0,0,.45)";
    ctx.fillRect(Math.round(cx - 8 * e), pie - 1, 16 * e, e + 1);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, Math.round(cx - w / 2), pie - alto, w, alto);
  }
  function bucle(ahora) {
    raf = requestAnimationFrame(bucle);
    acum += Math.min(100, ahora - (ult || ahora));
    ult = ahora;
    while (acum >= 1000 / 60) { paso(); acum -= 1000 / 60; }
    dibuja();
  }

  // Puntero: el mouse guía a BIT al moverse sobre el juego; en el teléfono, arrastrando el dedo
  lienzo.addEventListener("pointerdown", (e) => { lienzo.setPointerCapture(e.pointerId); mueve(e); });
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
    else if (estado === "titulo" && (k === "1" || k === " " || k === "enter")) empezar();
    else if (estado === "titulo" && k === "2") empezarRitmo();
    else if (estado === "pausa" && (k === " " || k === "enter")) pausa(false);
    else if ((estado === "pausa" || estado === "fin") && k === "m") titulo();
    else if (estado === "fin" && (k === "r" || k === " " || k === "enter")) (modo === "ritmo" ? empezarRitmo : empezar)();
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
    detieneAudio();
    modo = "clasico";
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