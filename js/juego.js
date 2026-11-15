/* ---------- BIT & BUGS: el minijuego del GAME OVER ----------
   Sale al contestar N en el CONTINUE? (tecla J o el botón). Tiene dos modos:
   - CLASICO: los bugs se escapan del CRT y BIT los atrapa antes de que lleguen a producción.
   - RITMO: los bugs caen al compás de "u i a Cat" (mapa en js/ritmo-uia.js); el escenario cambia con la
     canción y ocupa toda la pantalla, no solo el recuadro del juego. Un gato (images/juego/gato-uia.png) se
     pasea por el fondo y gira más rápido o más lento según la música. No se pierde: al final hay nota.
   BIT se mueve por 5 carriles, de un salto por toque: nada de deslizarse.
   La canción cuenta una historia: la consola arranca, GATO.EXE la tumba con un error crítico, a media
   canción hay un JEFE (cada bug que cae sube la pista de colores y, si se llena, BIT muere) y al final
   el antivirus limpia al gato.
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

  const el = document.createElement("div");
  el.className = "juego";
  el.hidden = true;
  el.tabIndex = -1;
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", "BIT & BUGS");
  el.innerHTML = `
    <canvas class="juego-fx" aria-hidden="true"></canvas>
    <div class="juego-hud">
      <span><span>PUNTOS</span> <b class="j-pts">000000</b></span>
      <span><span>RECORD</span> <b class="j-rec">000000</b></span>
      <span><span class="j-ver-k">VERSION</span> <b class="j-ver">v1.0</b></span>
      <span class="j-vidas" role="img"></span>
    </div>
    <div class="juego-marco"><canvas class="juego-lienzo"></canvas><div class="juego-msg" aria-live="polite"></div></div>
    <p class="juego-ayuda">← → o A D para mover · P pausa · ESC salir</p>`;
  document.body.appendChild(el);
  const lienzo = $(".juego-lienzo", el), ctx = lienzo.getContext("2d"), fx = $(".juego-fx", el), c2 = fx.getContext("2d"), marco = $(".juego-marco", el), msg = $(".juego-msg", el);
  const ptsEl = $(".j-pts", el), recEl = $(".j-rec", el), verEl = $(".j-ver", el), verK = $(".j-ver-k", el), vidasEl = $(".j-vidas", el);

  let W = 200, H = 140, escala = 4, col = {}, raf = 0, ult = 0, acum = 0;
  let estado = "titulo", pts = 0, vidas = 3, nivel = 0, t = 0, sig = 0, objs = [], textos = [], grietas = [], destellos = [];
  let bit = { c: 5, x: 105 }, izq = false, der = false, meta = null, boca = "n", bocaT = 0, parpadeo = 0, temblor = 0, mensaje = "", mensajeT = 0;
  let record = +(lee("bitBugsRecord") || 0), nuevoRecord = false, codigo = [], deApagado = false, bloqueamos = false, volverA = null;
  const piso = () => H - 4, bitY = () => piso() - 12;
  // Carriles: BIT y los bugs van por 5 columnas (pocas, para que cada salto cuente)
  const carriles = 5;
  let LW = 40;
  const xBit = (c) => Math.round(c * LW + LW / 2 - 5), xBug = (c) => Math.round(c * LW + LW / 2 - 3.5);
  let dirTecla = 0, rep = 0, fantasmas = [], chispas = [], aplasta = 0;
  // Ecos de colores que BIT deja al saltar en las partes fuertes de la canción
  const ECOS_FUERTE = ["#00f0ff", "#ff2bd6", "#7dff3c", "#ffe14a"], ECOS_CALMA = ["#6fb7ff", "#b08cff"];
  let ecos = [], ecoN = 0;
  // Fallar un bug: sacudida, BIT lastimado, interferencia en el escenario y la música se apaga un instante
  let dano = 0, interferencia = 0, agachaT = 0;
  // El jefe (escenario 5): cada bug que cae sube la pista; si llega a JEFE_TOPE, BIT muere. Cada bug atrapado la baja
  const JEFE = 4, JEFE_TOPE = 8, JEFE_BAJA = 0.34;
  let peligro = 0, peligroVis = 0, muerto = false, foto = null, jefeAviso = false, desdeIni = 0;
  // Cámara del escenario: un acercamiento leve que late en las partes fuertes y sigue al gato en las tranquilas
  let zoom = 1, focoX = 0, focoY = 0;
  // El lienzo de efectos cubre toda la pantalla, con el mismo tamaño de pixel que el juego
  let FW = 320, FH = 180, gx = 60, gy = 20;
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
    LW = W / carriles;
    bit.c = Math.min(bit.c, carriles - 1);
    bit.x = xBit(bit.c);
    // El lienzo de efectos se alinea pixel con pixel con el del juego
    const rl = lienzo.getBoundingClientRect();
    gx = Math.round(rl.left / escala);
    gy = Math.round(rl.top / escala);
    const izq0 = rl.left - gx * escala, arr0 = rl.top - gy * escala;
    FW = Math.ceil((window.innerWidth - izq0) / escala) + 1;
    FH = Math.ceil((window.innerHeight - arr0) / escala) + 1;
    fx.width = FW;
    fx.height = FH;
    fx.style.left = `${izq0}px`;
    fx.style.top = `${arr0}px`;
    fx.style.width = `${FW * escala}px`;
    fx.style.height = `${FH * escala}px`;
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
    };
  };
  function pinta(rows, x, yy) {
    const X = Math.round(x), Y = Math.round(yy);
    rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const c = r[i]; if (c === ".") continue; ctx.fillStyle = col[c]; ctx.fillRect(X + i, Y + j, 1, 1); } });
  }
  // El sprite pintado de un solo color, y su contorno negro de un pixel
  function silueta(rows, x, yy, c) {
    const X = Math.round(x), Y = Math.round(yy);
    ctx.fillStyle = c;
    rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== ".") ctx.fillRect(X + i, Y + j, 1, 1); });
  }
  function contorno(rows, x, yy) {
    const X = Math.round(x), Y = Math.round(yy);
    ctx.fillStyle = "#000000";
    rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== ".") ctx.fillRect(X + i - 1, Y + j - 1, 3, 3); });
  }
  function letras(txt, x, yy, c) {
    ctx.fillStyle = col[c];
    [...txt].forEach((ch, k) => (FUENTE[ch] || []).forEach((r, j) => { for (let i = 0; i < 3; i++) if (r[i] === "1") ctx.fillRect(Math.round(x) + k * 4 + i, Math.round(yy) + j, 1, 1); }));
  }
  const seis = (n) => String(n).padStart(6, "0");
  function hud() {
    el.classList.toggle("ritmo", modo === "ritmo");
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
    objs = []; textos = []; grietas = []; destellos = []; fantasmas = []; chispas = []; ecos = []; mensaje = "";
    muerto = false; peligro = peligroVis = 0; dano = 0; interferencia = 0;
    hud();
    aviso(`<p class="jm-t">BIT &amp; BUGS</p>
      <p>${T("Los bugs se escapan del CRT.<br>Atrápalos antes de que lleguen a producción.", "The bugs are escaping from the CRT.<br>Catch them before they reach production.")}</p>
      <p class="jm-x">${svg(BUG[0], 3)}<span>+10</span> ${svg(ORO[0], 3)}<span>+50</span> ${svg(CAFE, 3)}<span>+1 ${T("vida", "life")}</span></p>
      <p class="jm-b jm-modos"><button type="button" data-j="empezar">${kb("1")}${T("CLASICO", "CLASSIC")}</button>${R ? `<button type="button" data-j="ritmo">${kb("2")}${T("RITMO", "RHYTHM")} ♪ U I A CAT</button>` : ""}</p>
      ${R ? `<p class="jm-nota">${T("RITMO: los bugs caen al compás de la canción. Casi 4 minutos, con un jefe a la mitad: ahí sí se puede perder.", "RHYTHM: bugs fall to the beat of the song. Almost 4 minutes, with a boss halfway: that's where you can lose.")}</p>` : ""}`);
  }
  function empezar() {
    detieneAudio();
    modo = "clasico";
    estado = "jugando";
    pts = 0; vidas = 3; nivel = 0; t = 0; sig = 40; objs = []; textos = []; grietas = []; destellos = [];
    bit = { c: carriles >> 1, x: xBit(carriles >> 1) }; fantasmas = []; chispas = []; ecos = []; dano = 0; boca = "n"; bocaT = 0; mensaje = ""; nuevoRecord = false;
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
    ({ empezar, ritmo: () => empezarRitmo(), jefe: reintentaJefe, titulo, encender: () => cerrar(true), salir: () => cerrar(false), seguir: () => pausa(false) })[b.dataset.j]();
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
  // desde / guardado: para reintentar al jefe sin repetir toda la canción
  function empezarRitmo(desde, guardado) {
    if (!R) return;
    desde = typeof desde === "number" ? desde : 0;
    detieneAudio();
    modo = "ritmo";
    estado = "cargando";
    pts = 0; t = 0; objs = []; textos = []; grietas = []; destellos = []; anillos = [];
    bit = { c: carriles >> 1, x: xBit(carriles >> 1) }; fantasmas = []; chispas = []; boca = "n"; bocaT = 0; mensaje = ""; nuevoRecord = false;
    ts = desde; ultA = -1; rI = 0; rG = 0; golpeN = 0; pulso = 0; secI = -1; cambio = 0; combo = 0; maxCombo = 0; atrapados = 0; giro = 0; vGiro = 0.3; energiaAhora = 0;
    ecos = []; dano = 0; interferencia = 0; agachaT = 0; peligro = 0; peligroVis = 0; muerto = false; foto = null; jefeAviso = false; desdeIni = desde; zoom = 1;
    if (guardado) { pts = guardado.pts; maxCombo = guardado.maxCombo; atrapados = guardado.atrapados; }
    // Se saltan las notas y los bombos anteriores al punto de arranque
    while (rI * 3 < R.notas.length && R.notas[rI * 3] / 1000 < desde + 0.5) rI++;
    while (rG < R.golpes.length && R.golpes[rG] < desde * 100) rG++;
    golpeN = rG;
    gatoX = focoX = gx + W / 2; gatoY = focoY = gy + H * 0.5; gatoTam = 1; gatoQuieto = true; estela = [];
    pideGato();
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
    if (desde > 0) { try { audio.currentTime = desde; } catch (e) { /* aún sin datos: se ajusta al sonar */ } }
    const intento = intentoN;
    // play() va aquí, dentro del clic o la tecla: así el navegador deja sonar
    let p;
    try { p = audio.play(); } catch (e) { errorAudio(); return; }
    (p && p.then ? p : Promise.resolve()).then(() => {
      if (intento !== intentoN || el.hidden || modo !== "ritmo" || estado !== "cargando") return;
      if (desde > 0 && Math.abs(audio.currentTime - desde) > 1) { try { audio.currentTime = desde; } catch (e) { /* sigue desde donde pueda */ } }
      estado = "jugando";
      aviso("");
      ult = 0;
      if (P() && !guardado) P().cuenta("juego-ritmo");
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
    aviso(`<p class="jm-t">${T("¡VIRUS ELIMINADO!", "VIRUS REMOVED!")}</p>
      <p class="jm-rango jm-r${rango}">${rango}</p>
      <p class="jm-p">${T("PUNTOS", "SCORE")} ${seis(pts)}<br>BUGS ${atrapados}/${total} · ${pct}%<br>COMBO MAX ${maxCombo}${nuevoRecord ? `<br><span class="jm-nuevo">${T("¡NUEVO RECORD!", "NEW HIGH SCORE!")}</span>` : ""}</p>
      ${botonesFin("ritmo")}`);
  }
  // El jefe llenó la pista: BIT muere. Se puede reintentar desde el arranque del jefe, con los puntos que se traían
  function muereBit() {
    estado = "fin";
    muerto = true;
    if (audio) audio.pause();
    objs = [];
    SND.play("terminar");
    if (!RM) { temblor = 16; interferencia = 30; }
    hud();
    aviso(`<p class="jm-t jm-rojo">GAME OVER</p>
      <p>${T("GATO.EXE llenó la pista.", "CAT.EXE filled the floor.")}</p>
      <p class="jm-p">${T("PUNTOS", "SCORE")} ${seis(pts)}</p>
      <p class="jm-b"><button type="button" data-j="jefe">${kb("R")}${T("REINTENTAR JEFE", "RETRY BOSS")}</button><button type="button" data-j="titulo">${kb("M")}${T("MODOS", "MODES")}</button>${deApagado ? `<button type="button" data-j="encender">${kb("Y")}${T("ENCENDER CONSOLA", "POWER ON")}</button>` : ""}<button type="button" data-j="salir">${kb("ESC")}${T("SALIR", "QUIT")}</button></p>`);
  }
  const reintentaJefe = () => empezarRitmo(R.sec[JEFE][0] - 1.9, foto || { pts: 0, maxCombo: 0, atrapados: 0 });
  // Fallar se tiene que sentir: sacudida, BIT lastimado, el carril en rojo, interferencia y la música se hunde un instante
  function falla(o) {
    destellos.push({ x: o.x, vida: 30 });
    boca = "o"; bocaT = 45;
    dano = 26;
    if (!RM) { temblor = 11; interferencia = 12; }
    bip(170, 45, 0.3, "sawtooth", 0.075);
    bip(90, 40, 0.22, "square", 0.05, 0.03);
    if (audio && !audio.muted) { audio.volume = R.volumen * 0.3; agachaT = 12; }
    if (combo >= 10) { mensaje = T("COMBO ROTO", "COMBO LOST"); mensajeT = 60; }
    combo = 0;
    if (secI === JEFE) {
      peligro = Math.min(JEFE_TOPE, peligro + 1);
      if (peligro >= JEFE_TOPE - 2 && peligro < JEFE_TOPE) { mensaje = T("¡PELIGRO!", "DANGER!"); mensajeT = 50; }
    }
    hud();
  }
  // Qué tan fuerte va la canción en este segundo (0 a 1), suavizado entre muestra y muestra
  function energia(seg) {
    const E = R.energia, x = Math.max(0, Math.min(E.length - 1.001, seg * 2)), i = Math.floor(x), f = x - i;
    return ((+E[i]) * (1 - f) + (+E[i + 1]) * f) / 9;
  }
  const seccionDe = (seg) => { let i = 0; while (i < R.sec.length - 1 && seg >= R.sec[i][1]) i++; return i; };
  function pasoRitmo() {
    ts = tCancion() + R.desfase;
    // Al reintentar al jefe, se espera a que el audio brinque a su punto
    if (ts < desdeIni - 1) return;
    if (ts >= R.dur - 0.05) { finRitmo(); return; }
    if (agachaT > 0 && --agachaT === 0 && audio) audio.volume = R.volumen;
    // Cambio de escenario
    const s = seccionDe(ts);
    if (s !== secI) {
      // Salir vivo del jefe da premio
      if (secI === JEFE && s === JEFE + 1) { pts += 1000; peligro = 0; textos.push({ txt: "+1000", x: W / 2 - 10, y: H * 0.5, vida: 70, c: "Y" }); [659, 784, 1047, 1319].forEach((f, i) => bip(f, 0, 0.1, "square", 0.04, i * 0.08)); }
      secI = s;
      cambio = 26;
      mensaje = `${s + 1}/${R.sec.length} ${T(R.sec[s][4], R.sec[s][5])}`;
      mensajeT = 120;
      // Punto de control: lo que se llevaba al llegar al jefe
      if (s === JEFE) { foto = { pts, maxCombo, atrapados }; peligro = 0; jefeAviso = false; }
      hud();
    }
    if (cambio > 0) cambio--;
    if (secI === JEFE && !jefeAviso && ts > R.sec[JEFE][0] + 2.2) { jefeAviso = true; mensaje = T("NO DEJES CAER NI UNO", "DON'T DROP A SINGLE ONE"); mensajeT = 99; }
    peligroVis += (peligro - peligroVis) * 0.2;
    // La cámara: late en las partes fuertes, crece en las subidas y sigue al gato en las tranquilas
    const fuerte = [1, JEFE, 7].includes(secI), sube = secI === 3 || secI === 6, calma = [2, 5, 8].includes(secI);
    const kSec = Math.min(1, Math.max(0, (ts - R.sec[secI][0]) / (R.sec[secI][1] - R.sec[secI][0])));
    const zObj = RM ? 1 : fuerte ? 1.02 + pulso * 0.04 : sube ? 1.01 + kSec * 0.03 + pulso * 0.018 : calma ? 1.045 : 1;
    zoom += (zObj - zoom) * (fuerte || sube ? 0.3 : 0.03);
    focoX += ((calma ? gatoX : gx + W / 2) - focoX) * 0.04;
    focoY += ((calma ? gatoY : gy + H / 2) - focoY) * 0.04;
    // El escenario late con cada bombo
    pulso *= 0.88;
    while (rG < R.golpes.length && R.golpes[rG] <= ts * 100) { rG++; golpeN++; pulso = 1; anillos.push(ts); if (anillos.length > 4) anillos.shift(); }
    // El gato gira según la energía de la canción: de un cuarto de vuelta por segundo a casi tres
    energiaAhora = energia(ts);
    vGiro += (0.22 + energiaAhora * energiaAhora * 2.7 - vGiro) * 0.07;
    giro += vGiro / 60 + pulso * 0.003;
    moverBit();
    pasoGato();
    // Cada bug sale con el tiempo justo para llegar a BIT en su nota
    const N = R.notas;
    while (rI * 3 < N.length) {
      const tn = N[rI * 3] / 1000, d = R.sec[seccionDe(tn)][2];
      if (tn - d > ts) break;
      const fx = N[rI * 3 + 1] / 100;
      const c = Math.round(fx * (carriles - 1));
      objs.push({ tipo: N[rI * 3 + 2] ? "oro" : "bug", c, tn, d, x: xBug(c), y: 0 });
      grietas.push({ x: xBug(c) + 2, vida: 16 });
      rI++;
    }
    const by = bitY(), y0 = 3, yT = by - 3;
    for (const o of objs) {
      o.c = Math.min(o.c, carriles - 1);
      o.x = xBug(o.c);
      o.y = y0 + (yT - y0) * (1 - (o.tn - ts) / o.d);
      if (o.y + 6 >= by + 1 && o.y <= by + 7 && o.c === bit.c) {
        o.fuera = true;
        atrapa(o);
        bip(o.tipo === "oro" ? 1568 : 1175, 0, 0.03, "square", 0.018);
        combo++; atrapados++;
        if (combo > maxCombo) maxCombo = combo;
        const n = (o.tipo === "oro" ? 50 : 10) * multi();
        pts += n;
        textos.push({ txt: `+${n}`, x: o.x, y: o.y - 4, vida: 34, c: o.tipo === "oro" ? "Y" : "W" });
        if (o.tipo === "oro") bip(880, 1760, 0.12, "square", 0.03);
        if (combo % 50 === 0) { mensaje = `COMBO ${combo}!`; mensajeT = 80; }
        boca = "s"; bocaT = 24;
        if (secI === JEFE) peligro = Math.max(0, peligro - JEFE_BAJA);
        hud();
      } else if (o.y + 6 >= piso()) {
        o.fuera = true;
        falla(o);
        if (peligro >= JEFE_TOPE) { muereBit(); return; }
      }
    }
    objs = objs.filter((o) => !o.fuera);
  }

  function nace() {
    const r = Math.random();
    const tipo = vidas < 3 && r < 0.05 ? "cafe" : r < 0.13 ? "oro" : "bug";
    const v = (0.42 + nivel * 0.07) * (tipo === "oro" ? 1.45 : tipo === "cafe" ? 0.8 : 1) * azar(0.85, 1.15);
    const c = (Math.random() * carriles) | 0;
    objs.push({ tipo, c, x: xBug(c), y: 1, v });
    grietas.push({ x: xBug(c) + 2, vida: 16 });
  }
  // BIT salta de carril en carril: un salto por toque y, si dejas la tecla, sigue saltando rápido.
  // Con el mouse o el dedo, brinca directo al carril que señalas.
  function saltaA(c) {
    c = Math.max(0, Math.min(carriles - 1, c));
    if (c === bit.c) return;
    const x0 = bit.x;
    bit.c = c;
    bit.x = xBit(c);
    aplasta = 4;
    if (RM) return;
    // En ritmo, el salto deja ecos de colores a lo largo del camino: más y más vivos cuanto más fuerte va la canción
    const fuerza = modo !== "ritmo" || secI < 0 ? 0 : [1, JEFE, 7].includes(secI) ? 3 : [3, 6].includes(secI) ? 2 : secI === 0 || secI === 9 ? 0 : 1;
    if (!fuerza) { fantasmas.push({ x: x0, vida: 6 }); return; }
    const n = fuerza === 3 ? 5 : fuerza === 2 ? 4 : 2, pal = fuerza === 1 ? ECOS_CALMA : ECOS_FUERTE;
    for (let i = 0; i < n; i++) { const vida = (fuerza === 1 ? 16 : 9) + i * 4; ecos.push({ x: x0 + ((bit.x - x0) * i) / n, vida, max: vida, c: pal[ecoN++ % pal.length] }); }
    if (ecos.length > 40) ecos.splice(0, ecos.length - 40);
  }
  function moverBit() {
    if (dirTecla) { meta = null; if (--rep <= 0) { saltaA(bit.c + dirTecla); rep = 5; } }
    else if (meta != null) saltaA(Math.floor(meta / LW));
  }
  // Al atrapar: chispas del color del bug y BIT se aplasta un instante
  function atrapa(o) {
    aplasta = 5;
    if (RM) return;
    for (let i = 0; i < 7; i++) chispas.push({ x: o.x + 3, y: o.y + 4, vx: azar(-1.4, 1.4), vy: azar(-1.9, -0.3), vida: 12 + ((Math.random() * 8) | 0), c: o.tipo === "oro" ? "Y" : o.tipo === "cafe" ? "W" : i % 2 ? "R" : "W" });
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
    fantasmas.forEach((f) => f.vida--); fantasmas = fantasmas.filter((f) => f.vida > 0);
    ecos.forEach((f) => f.vida--); ecos = ecos.filter((f) => f.vida > 0);
    if (dano > 0) dano--;
    if (interferencia > 0) interferencia--;
    chispas.forEach((c) => { c.x += c.vx; c.y += c.vy; c.vy += 0.16; c.vida--; }); chispas = chispas.filter((c) => c.vida > 0);
    if (aplasta > 0) aplasta--;
    if (estado !== "jugando") return;
    if (modo === "ritmo") { pasoRitmo(); return; }
    moverBit();
    // Bugs: cada versión salen más seguido y más rápido
    if (--sig <= 0) { nace(); sig = Math.max(20, 60 - nivel * 5) * azar(0.7, 1.2); }
    const by = bitY();
    for (const o of objs) {
      o.y += o.v;
      o.c = Math.min(o.c, carriles - 1);
      o.x = xBug(o.c);
      if (o.y + 6 >= by + 1 && o.y <= by + 7 && o.c === bit.c) {
        o.fuera = true;
        atrapa(o);
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
    const ritmo = modo === "ritmo" && estado !== "cargando" && secI >= 0;
    ctx.save();
    // En ritmo el recuadro es una ventana: el escenario se ve a través, apenas oscurecido para que los bugs resalten
    if (ritmo) ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = ritmo ? "rgba(0,0,0,.34)" : col.F;
    ctx.fillRect(0, 0, W, H);
    if (temblor) ctx.translate(temblor % 2 ? 1 : -1, 0);
    // La pista del jefe: losetas de colores que suben desde el piso con cada bug que cae
    if (ritmo && peligroVis > 0.03) {
      const PAL = [col.P, col.C, col.Y, col.M, col.V, col.N], alto = piso() - 9, hp = Math.min(alto, (alto * peligroVis) / JEFE_TOPE), cima = piso() - hp, tw = W / 10;
      const alerta = peligro >= JEFE_TOPE - 2;
      ctx.save();
      ctx.beginPath(); ctx.rect(0, cima, W, hp); ctx.clip();
      for (let j = 0; piso() - j * 6 > cima; j++) for (let i = 0; i < 10; i++) {
        ctx.fillStyle = alerta && (t >> 2) % 2 ? osc(col.R, (i + j) % 2 ? 0.55 : 0.85) : osc(PAL[(i * 3 + j * 5 + golpeN) % 6], (i + j + golpeN) % 2 ? 0.38 : 0.78);
        ctx.fillRect(Math.round(i * tw), piso() - (j + 1) * 6, Math.ceil(tw) - 1, 5);
      }
      ctx.restore();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, Math.round(cima), W, 1);
      // La línea que no se debe tocar
      ctx.fillStyle = alerta && (t >> 2) % 2 ? "#ffffff" : col.R;
      for (let x = (t >> 2) % 6; x < W; x += 6) ctx.fillRect(x, 10, 3, 1);
    }
    for (const o of objs) {
      const sp = o.tipo === "cafe" ? CAFE : (o.tipo === "oro" ? ORO : BUG)[(t >> 3) % 2];
      // En ritmo, un contorno negro con la forma del bug para que se distinga sobre cualquier escenario
      if (ritmo) contorno(sp, o.x, o.y);
      pinta(sp, o.x, o.y);
    }
    for (const c of chispas) { ctx.fillStyle = col[c.c]; ctx.fillRect(Math.round(c.x), Math.round(c.y), 1, 1); }
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
    // Marcas de los carriles en el piso; el de BIT, encendido
    ctx.fillStyle = col.F;
    for (let c = 1; c < carriles; c++) ctx.fillRect(Math.round(c * LW), piso(), 1, H - piso());
    ctx.fillStyle = col.Y;
    ctx.fillRect(Math.round(bit.c * LW) + 1, piso(), Math.round(LW) - 1, 1);
    for (const d of destellos) {
      // El carril donde cayó el bug: una columna roja que se apaga hacia arriba y el piso parpadeando
      const cxl = Math.round(Math.floor((d.x + 3) / LW) * LW) + 1, anc = Math.round(LW) - 1;
      if (ritmo && !RM) { const g = ctx.createLinearGradient(0, piso(), 0, piso() - H * 0.7); g.addColorStop(0, `rgba(255,40,60,${Math.min(0.55, d.vida / 30)})`); g.addColorStop(1, "rgba(255,40,60,0)"); ctx.fillStyle = g; ctx.fillRect(cxl, 9, anc, piso() - 9); }
      if (d.vida % 6 < 3) { ctx.fillStyle = col.R; ctx.fillRect(cxl, piso(), anc, H - piso()); }
    }
    // BIT mira hacia el bug más cercano al piso
    let cerca = null;
    for (const o of objs) if (o.tipo !== "cafe" && (!cerca || o.y > cerca.y)) cerca = o;
    const dx = cerca ? cerca.x + 3 - (bit.x + 5) : 0;
    if (P()) {
      // La estela de cada salto, y BIT: se aplasta un pixel al caer o atrapar, y en ritmo brinca con cada bombo
      const sprite = P().bitSprite(dx < -8 ? -1 : dx > 8 ? 1 : 0, parpadeo > 0, boca);
      for (const f of fantasmas) { ctx.globalAlpha = (f.vida / 6) * 0.45; pinta(sprite, f.x, bitY()); }
      // Ecos de un solo color que se quedan atrás un momento
      for (const f of ecos) { ctx.globalAlpha = (f.vida / f.max) * 0.75; silueta(sprite, f.x, bitY(), f.c); }
      ctx.globalAlpha = 1;
      const yb = bitY() + (aplasta > 2 ? 1 : 0) - (ritmo && estado === "jugando" && pulso > 0.7 ? 1 : 0);
      if (ritmo) contorno(sprite, bit.x, yb);
      // Lastimado: parpadea en rojo
      if (dano > 0 && dano % 6 < 3) silueta(sprite, bit.x, yb, col.R);
      else pinta(sprite, bit.x, yb);
    }
    ctx.restore();
    // En pausa o al terminar, el recuadro se oscurece para que se lea el mensaje
    if (ritmo && estado !== "jugando") { ctx.fillStyle = "rgba(0,0,0,.72)"; ctx.fillRect(0, 0, W, H); }
    // Al fallar, las orillas del recuadro se encienden en rojo
    if (ritmo && dano > 0 && !RM) {
      const a = (dano / 26) * 0.5;
      for (const [x0, y0, x1, y1] of [[0, 0, 14, 0], [W, 0, W - 14, 0]]) {
        const g = ctx.createLinearGradient(x0, y0, x1, y1);
        g.addColorStop(0, `rgba(255,30,50,${a})`); g.addColorStop(1, "rgba(255,30,50,0)");
        ctx.fillStyle = g;
        ctx.fillRect(Math.min(x0, x1), 9, 14, piso() - 9);
      }
    }
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

  /* ---------- Escenarios del modo ritmo: uno por cada parte de la canción ----------
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
  const bandas = (cols, ya, yb) => cols.forEach((c, i) => rc(c, 0, ya + ((yb - ya) * i) / cols.length, FW, (yb - ya) / cols.length + 1));
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
      const y = Math.floor(h(semilla + i) * FH), alto = 2 + Math.floor(h(semilla + i + 0.5) * 9), dx = Math.round((h(semilla + i + 0.8) - 0.5) * 2 * fuerza);
      c2.drawImage(fx, 0, y, FW, alto, dx, y, FW, alto);
    }
  }
  const rgbDe = (hex) => { const n = parseInt(hex.slice(1), 16); return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`; };
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
    // 1. ARRANQUE: la consola corre sus comandos... hasta que GATO.EXE la tumba con un error crítico
    (e) => {
      rc(col.F, 0, 0, FW, FH);
      const tErr = R.error, roto = ts >= tErr, tt = Math.min(ts, tErr);
      const filas = Math.floor(FH / 4), escritas = Math.floor(tt * 6), off = Math.max(0, escritas - filas + 2);
      for (let i = 0; i < filas; i++) {
        const n = i + off;
        if (n > escritas) break;
        // Cada renglón es un comando: su > y luego lo que contesta la consola
        rc(roto ? col.R : col.W, 3, 2 + i * 4, 2, 2);
        let x = 8 + ((h(n) * 3) | 0) * 4;
        const segs = 1 + ((h(n + 0.5) * 7) | 0);
        for (let s = 0; s < segs && x < FW - 6; s++) {
          let l = 4 + ((h(n * 7 + s) * 24) | 0);
          if (n === escritas && !roto) l = Math.min(l, ((tt * 6) % 1) * 140 - s * 20);
          if (l < 1) break;
          const verde = h(n * 3 + s) < 0.3;
          // Conforme se acerca el error, algunos renglones ya salen en rojo
          const malo = roto ? h(n + s + golpeN) < 0.7 : ts > tErr - 4 && h(n * 5 + s) < (ts - (tErr - 4)) / 8;
          rc(malo ? osc(col.R, roto ? 0.75 : 0.55) : verde ? (pulso > 0.5 ? col.V : "#1d5c3f") : col.D, x, 2 + i * 4, Math.min(l, FW - 3 - x), 2);
          x += l + 3;
        }
        if (n === escritas && !roto && (t >> 3) % 2) rc(col.W, Math.min(x, FW - 5), 2 + i * 4, 2, 2);
      }
      if (!roto) { rc("rgba(65,184,131,.07)", 0, (ts * 34) % (FH + 10) - 8, FW, 8); return; }
      // El error crítico: todo en rojo, la imagen rota y el aviso con el culpable
      const edad = ts - tErr;
      if (!RM) tiras(7, 14, Math.floor(ts * 14));
      c2.globalAlpha = RM ? 0.2 : 0.14 + 0.1 * ((t >> 2) % 2);
      rc("#ff0030", 0, 0, FW, FH);
      c2.globalAlpha = 1;
      const an = Math.min(FW - 8, 132), al = 36, bx = Math.round(e.cx - an / 2), by = Math.round(Math.max(6, gy + H * 0.14));
      if (edad > 0.08) {
        rc("#000000", bx + 3, by + 3, an, al);
        rc((t >> 3) % 2 || RM ? col.R : "#7a0018", bx, by, an, al);
        rc("#000000", bx + 2, by + 2, an - 4, al - 4);
        texto(col.R, T("ERROR CRITICO", "CRITICAL ERROR"), e.cx, by + 15);
        if (edad > 0.45) texto(col.W, "GATO.EXE", e.cx, by + 28);
      }
    },
    // 2. CIUDAD NEON: sol de rayas, edificios de lado a lado y una rejilla que avanza con el compás hasta el borde de la pantalla
    (e) => {
      const hy = Math.round(gy + H * 0.6), cx = e.cx;
      bandas(["#0d0221", "#150430", "#1b0638", "#2d0a4e", "#4a0f5e", "#6b1560"], 0, hy);
      for (let i = 0; i < 60; i++) if (h(i + Math.floor(ts * 2 + h(i) * 9)) > 0.2) rc(i % 9 === 0 ? col.C : "#8a6fb0", h(i) * FW, h(i + 0.5) * hy * 0.7, 1, 1);
      const r = Math.round(Math.min(FW * 0.17, FH * 0.3) + pulso * 2);
      for (let dy = -r; dy <= 0; dy++) {
        const w = Math.round(Math.sqrt(r * r - dy * dy)), y = hy + dy, f = -dy / r;
        if (f < 0.6 && (y + (t >> 3)) % 4 === 0) continue;
        rc(f > 0.66 ? col.Y : f > 0.33 ? col.N : col.P, cx - w, y, w * 2, 1);
      }
      for (let x = 0, i = 0; x < FW; i++) {
        const w = 6 + ((h(i) * 9) | 0), alto = Math.abs(x + w / 2 - cx) < r ? 3 + ((h(i + 0.3) * 3) | 0) : 6 + ((h(i + 0.3) * FH * 0.2) | 0);
        rc("#150a2e", x, hy - alto, w, alto);
        for (let wy = hy - alto + 2; wy < hy - 1; wy += 3) for (let wx = x + 1; wx < x + w - 1; wx += 3) if (h(i * 13 + wx * 7 + wy) < 0.45) rc(h(i + wx + wy + (golpeN >> 2)) < 0.6 ? col.Y : "#5a3d1e", wx, wy, 1, 1);
        x += w + 1;
      }
      rc("#0a0118", 0, hy, FW, FH - hy);
      for (let j = -16; j <= 16; j++) linea("#5a2a9c", cx + j * 5, hy, cx + j * FW * 0.2, FH);
      const fase = ((ts * e.sec[3]) / 60) % 1;
      for (let k = 0; k < 8; k++) { const pp = (k + fase) / 8; rc(k % 2 ? col.M : col.P, 0, hy + (FH - hy) * pp * pp, FW, 1); }
      rc(col.P, 0, hy, FW, 1);
    },
    // 3. BAJO EL AGUA: la música suena tapada. Los rayos entran desde arriba de la pantalla y se pierden en el fondo
    () => {
      bandas(["#0f4c82", "#0b3d6e", "#0a3260", "#082650", "#061b3d", "#04122b"], 0, FH);
      // La superficie, ondulando arriba
      c2.fillStyle = "rgba(190,233,255,.5)";
      for (let x = 0; x < FW; x++) c2.fillRect(x, Math.round(1.5 + Math.sin(x * 0.15 + ts * 2) * 1.2 + Math.sin(x * 0.4 - ts * 3) * 0.8), 1, 1);
      for (let i = 0; i < 8; i++) {
        const x0 = (FW * (i + 0.5)) / 8 + FW * 0.12 + Math.sin(ts * 0.3 + i * 1.7) * FW * 0.05, ancho = 5 + h(i) * 11;
        const brillo = Math.max(0.03, 0.13 + 0.09 * Math.sin(ts * 0.9 + i * 2.3) + pulso * 0.06);
        haz("150,215,255", brillo, x0, ancho, x0 - FH * 0.42 + Math.sin(ts * 0.4 + i) * 5, ancho * 3.2, 0, FH * (0.75 + 0.2 * h(i + 0.4)));
      }
      rc("#0a2a3d", 0, FH - 3, FW, 3);
      for (let x = 3, i = 0; x < FW; x += 9 + ((h(i) * 9) | 0), i++) {
        const alto = 9 + ((h(i + 0.2) * FH * 0.16) | 0);
        for (let j = 0; j < alto; j++) rc(j % 4 < 2 ? "#1f7a5a" : "#17604a", x + Math.round(Math.sin(ts * 2 + j * 0.35 + i) * (j / alto) * 3), FH - 3 - j, 2, 1);
      }
      // Un cardumen que cruza y peces sueltos
      const tramo = FW + 80, xc = ((ts * 16) % tramo) - 40, yc = FH * 0.3 + Math.sin(ts * 0.6) * FH * 0.08;
      for (let i = 0; i < 16; i++) rc("#9fdcff", xc + h(i) * 34 + Math.sin(ts * 3 + i) * 1.5, yc + h(i + 0.5) * 16 + Math.cos(ts * 2.4 + i * 2) * 1.5, 2, 1);
      for (let i = 0; i < 5; i++) {
        const dir = i % 2 ? 1 : -1, tr = FW + 30;
        let x = (ts * (9 + i * 4) + h(i) * tr) % tr;
        if (dir < 0) x = tr - x;
        x -= 15;
        const y = FH * (0.14 + 0.16 * i) + Math.sin(ts * 1.5 + i) * 2, c = i % 3 === 0 ? col.Y : col.N;
        rc(c, x, y, 5, 3);
        rc(c, dir > 0 ? x - 2 : x + 5, y + ((t >> 3) % 2), 2, 2);
        rc(col.K, dir > 0 ? x + 3 : x + 1, y + 1, 1, 1);
      }
      for (let i = 0; i < 38; i++) {
        const g = i % 4 === 0 ? 2 : 1;
        rc("#7fd4ff", h(i) * FW + Math.sin(ts * 1.6 + i * 2) * 3, FH - ((ts * (7 + h(i + 0.3) * 16) + h(i + 0.7) * FH) % FH), g, g);
      }
    },
    // 4. DESPEGUE: las estrellas salen del centro y aceleran por toda la pantalla mientras la canción sube
    (e) => {
      rc("#05030f", 0, 0, FW, FH);
      const L = e.sec[1] - e.sec[0], seg = Math.max(0, ts - e.sec[0]), k = Math.min(1, seg / L);
      const fase = 0.12 * seg + (0.5 * seg * seg * seg) / (L * L), radio = Math.hypot(FW, FH) / 2 + 8;
      for (let i = 0; i < 130; i++) {
        const a = h(i) * TAU, d = (h(i + 0.5) + fase * (0.6 + h(i + 0.8) * 0.8)) % 1, r = d * d * radio + 6, largo = 1 + k * k * 18 * d + pulso * 2;
        const c = d < 0.3 ? "#555a77" : i % 5 === 0 ? col.C : i % 7 === 0 ? col.Y : "#ffffff";
        linea(c, e.cx + Math.cos(a) * r, e.cy + Math.sin(a) * r, e.cx + Math.cos(a) * (r - largo), e.cy + Math.sin(a) * (r - largo));
      }
    },
    // 5. JEFE, GATO.EXE: figuras planas de un solo color que avisan y golpean con cada bombo
    (e) => {
      const ROSA = "#ff2e7e", FONDO = "#0a0f24";
      rc(FONDO, 0, 0, FW, FH);
      for (let y = 6; y < FH; y += 12) for (let x = 6; x < FW; x += 12) rc(pulso > 0.5 ? "#2b3568" : "#161d40", x, y, 1, 1);
      // Círculos en las orillas que laten por turnos
      [[0.08, 0.22, 15], [0.92, 0.3, 19], [0.06, 0.8, 21], [0.94, 0.8, 14], [0.3, 0.02, 9], [0.72, 0.98, 12]].forEach(([px, py, r0], i) => {
        const late = (i + golpeN) % 2 ? pulso : pulso * 0.3, rr = Math.round(r0 * (FW < 200 ? 0.6 : 1) * (0.78 + 0.5 * late));
        disco(ROSA, Math.round(FW * px), Math.round(FH * py), rr);
        disco(FONDO, Math.round(FW * px), Math.round(FH * py), Math.round(rr * 0.5 * (1 - late)));
      });
      // Filas de cuadros que cruzan de lado a lado
      for (let i = 0; i < 9; i++) {
        const dir = i % 2 ? 1 : -1, tramo = FW + 24, y = FH * (0.07 + 0.108 * i);
        for (let k = 0; k < 3; k++) {
          let x = (ts * (46 + i * 5) + h(i) * tramo + k * 46) % tramo;
          if (dir < 0) x = tramo - x;
          rc("#7a1740", x - 12 - dir * 7, y + 1, 5, 3);
          rc(ROSA, x - 12, y, 5, 5);
        }
      }
      // Barras: una línea fina avisa dónde va a caer la siguiente; con el bombo, golpea de lado a lado
      const barra = (g, grosor, c, alfa) => {
        c2.globalAlpha = alfa;
        if (g % 2) rc(c, h(g * 1.7) * FW - grosor / 2, 0, grosor, FH);
        else rc(c, 0, h(g * 1.7) * FH - grosor / 2, FW, grosor);
        c2.globalAlpha = 1;
      };
      if (rG < R.golpes.length) { const falta = R.golpes[rG] / 100 - ts; if (falta < 0.5 && falta > 0) barra(rG, 1 + (1 - falta / 0.5) * 2, ROSA, 0.25 + 0.3 * (1 - falta / 0.5)); }
      anillos.forEach((tg, i) => {
        const edad = ts - tg, g = rG - (anillos.length - i);
        if (edad >= 0 && edad < 0.32) barra(g, 2 + (1 - edad / 0.32) * (FW < 200 ? 9 : 16), edad < 0.05 ? "#ffffff" : ROSA, 1);
      });
      // Una sierra de cuadros gira alrededor del gato: más cerrada y más rápida cuanto más sube la pista
      const base = Math.min(64, FW * 0.42, FH * 0.36), rs = base * 0.72 + pulso * 4 - peligro, n = 14;
      for (let i = 0; i < n; i++) {
        const a = ts * (2.2 + peligro * 0.25) + (i * TAU) / n;
        rc(i % 2 ? ROSA : "#ffffff", gatoX + Math.cos(a) * rs - 2, gatoY + Math.sin(a) * rs - 2, 4, 4);
      }
      // Con la pista alta, toda la pantalla late en rojo
      if (peligro >= JEFE_TOPE - 3) { c2.globalAlpha = 0.08 + 0.05 * (peligro - (JEFE_TOPE - 3)) + 0.1 * pulso; rc("#ff0030", 0, 0, FW, FH); c2.globalAlpha = 1; }
    },
    // 6. NOCHE EN CALMA: la canción descansa. Luna, nubes de orilla a orilla, cerros y luciérnagas
    () => {
      bandas(["#060920", "#070b22", "#0a1030", "#0e173f", "#131f4f", "#1a2a60"], 0, FH);
      for (let i = 0; i < 110; i++) if (h(i + Math.floor(ts * 1.5 + h(i + 0.9) * 7)) > 0.25) rc(i % 6 === 0 ? col.Y : "#cfd6ff", h(i) * FW, h(i + 0.5) * FH * 0.8, 1, 1);
      const mx = Math.round(FW * 0.84), my = Math.round(FH * 0.17);
      c2.globalAlpha = 0.08; disco("#f1edcf", mx, my, 15); c2.globalAlpha = 0.12; disco("#f1edcf", mx, my, 12); c2.globalAlpha = 1;
      disco("#f1edcf", mx, my, 9);
      rc("#d4cfa8", mx - 4, my - 3, 3, 2); rc("#d4cfa8", mx + 2, my + 2, 3, 2); rc("#d4cfa8", mx - 1, my + 5, 2, 1);
      // Una estrella fugaz cada tanto
      const tf = ts % 5.5;
      if (tf < 0.5) { const x0 = FW * (0.15 + h(Math.floor(ts / 5.5)) * 0.5) + tf * 90, y0 = FH * 0.08 + tf * 40; linea("#ffffff", x0, y0, x0 - 9, y0 - 4); }
      for (let i = 0; i < 8; i++) {
        const tr = FW + 70, x = ((ts * (2.5 + i * 1.1) + h(i) * tr) % tr) - 55, y = 8 + h(i + 0.2) * FH * 0.5, c = i % 2 ? "#2a3970" : "#35478a";
        rc(c, x, y, 30, 4); rc(c, x + 6, y - 3, 16, 3); rc(c, x + 13, y + 4, 22, 2);
      }
      for (let x = 0; x < FW; x++) { const alto = 16 + Math.sin(x * 0.045 + 1) * 8 + Math.sin(x * 0.11) * 3; rc("#0d1a45", x, FH - alto, 1, alto); }
      for (let x = 0; x < FW; x++) { const alto = 8 + Math.sin(x * 0.07) * 4 + Math.sin(x * 0.19 + 2) * 2; rc("#0a1330", x, FH - alto, 1, alto); }
      for (let i = 0; i < 16; i++) if (Math.sin(ts * 2 + i * 1.7) > 0) rc(col.Y, h(i) * FW + Math.sin(ts * 0.7 + i) * 8, FH - 12 - h(i + 0.3) * FH * 0.3 + Math.cos(ts * 0.9 + i * 2) * 4, 1, 1);
    },
    // 7. LLUVIA DE CODIGO: cae por toda la pantalla, cada vez más rápido hasta el último estribillo
    (e) => {
      rc("#020a05", 0, 0, FW, FH);
      const L = e.sec[1] - e.sec[0], seg = Math.max(0, ts - e.sec[0]), fase = seg + (seg * seg) / L;
      const TONOS = ["#d9ffe6", col.V, "#2a8a5f", "#1d5c3f", "#123a28", "#0b2419"];
      for (let c = 0; c * 5 < FW; c++) {
        const cab = ((fase * (16 + h(c) * 26) + h(c + 0.4) * (FH + 70)) % (FH + 70)) - 10;
        for (let j = 0; j < 12; j++) {
          const y = Math.round(cab - j * 5);
          if (y < -4 || y > FH) continue;
          c2.fillStyle = TONOS[j < 1 ? 0 : Math.min(5, 1 + (j >> 1))];
          const bits = (h(c * 31 + j * 17 + Math.floor(fase * 3 + h(c) * 9) * 7) * 4096) | 0;
          for (let b = 0; b < 12; b++) if ((bits >> b) & 1) c2.fillRect(c * 5 + 1 + (b % 3), y + ((b / 3) | 0), 1, 1);
        }
      }
    },
    // 8. HIPERESPACIO: rayos que giran desde el centro hasta las esquinas, anillos con cada bombo y colores que cambian cada cuatro
    (e) => {
      const pares = [[col.P, col.M], [col.B, col.C], [col.N, col.R], [col.V, col.C]], par = pares[RM ? 0 : (golpeN >> 2) % 4];
      const a0 = ts * (RM ? 0.25 : 1.3), n = 14, radio = Math.hypot(FW, FH), cx = e.cx, cy = e.cy;
      rc(osc(par[1], 0.28), 0, 0, FW, FH);
      for (let i = 0; i < n; i += 2) {
        const a = a0 + (i * TAU) / n, b = a0 + ((i + 1) * TAU) / n;
        poligono(osc(par[0], 0.45), 1, [[cx, cy], [cx + Math.cos(a) * radio, cy + Math.sin(a) * radio], [cx + Math.cos(b) * radio, cy + Math.sin(b) * radio]]);
      }
      for (let i = 0; i < 50; i++) {
        const a = h(i) * TAU, d = (h(i + 0.5) + ts * 1.4 * (0.6 + h(i + 0.2))) % 1, r = d * d * radio * 0.6 + 8, largo = 2 + d * 10;
        linea("#ffffff", cx + Math.cos(a) * r, cy + Math.sin(a) * r, cx + Math.cos(a) * (r - largo), cy + Math.sin(a) * (r - largo));
      }
      if (!RM) for (const tg of anillos) {
        const edad = ts - tg;
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
      bandas(["#030714", "#02040c", "#030714", "#040a1c"], 0, FH);
      for (let i = 0; i < 3; i++) { const x0 = FW * (0.25 + i * 0.3) + Math.sin(ts * 0.2 + i) * 8; haz("70,120,200", 0.07 + pulso * 0.04, x0, 8, x0 - FH * 0.3, 30, 0, FH * 0.6); }
      for (let w = 0; w < 5; w++) {
        const yb = FH * (0.2 + w * 0.16), amp = 2 + energiaAhora * 8 + pulso * 2.5;
        c2.fillStyle = ["#1b4a8a", "#174079", "#143663", "#102c52", "#0d2444"][w];
        for (let x = 0; x < FW; x++) c2.fillRect(x, Math.round(yb + Math.sin(x * 0.07 + ts * (1.2 - w * 0.2) + w * 2) * amp + Math.sin(x * 0.21 - ts) * 1.5), 1, 1);
      }
      for (let i = 0; i < 46; i++) rc(i % 5 === 0 ? "#6f9bd8" : "#3b5a8f", h(i) * FW + Math.sin(ts * 0.6 + i) * 4, FH - ((ts * (2 + h(i + 0.3) * 5) + h(i + 0.7) * FH) % FH), 1, 1);
    },
    // 10. LIMPIEZA: el antivirus borra a GATO.EXE renglón por renglón; al llegar a 100 %, virus eliminado
    (e) => {
      rc("#020805", 0, 0, FW, FH);
      const k = limpieza(), listo = k >= 1;
      // Renglones de registro que suben
      for (let i = 0; i < FH / 4 + 1; i++) {
        const n = i + Math.floor(ts * 5);
        let x = 3;
        for (let s = 0; s < 1 + ((h(n + 0.5) * 6) | 0) && x < FW - 6; s++) { const l = 4 + ((h(n * 7 + s) * 22) | 0); rc(h(n * 3 + s) < 0.35 ? "#143d2b" : "#0c1f17", x, i * 4 - ((ts * 20) % 4), Math.min(l, FW - 3 - x), 2); x += l + 3; }
      }
      const an = Math.min(FW - 12, 150), bx = Math.round(e.cx - an / 2), ty = Math.round(Math.max(22, gy + H * 0.2));
      rc("rgba(0,0,0,.6)", bx - 4, ty - 12, an + 8, 34);
      if (listo) texto((t >> 3) % 2 || RM ? col.V : "#d9ffe6", T("VIRUS ELIMINADO", "VIRUS REMOVED"), e.cx, ty);
      else texto(col.W, T("LIMPIANDO GATO.EXE", "CLEANING CAT.EXE"), e.cx, ty);
      // La barra de avance, por segmentos
      rc(col.G, bx, ty + 6, an, 9);
      rc("#020805", bx + 1, ty + 7, an - 2, 7);
      const segs = Math.floor((an - 4) / 5);
      for (let i = 0; i < Math.round(segs * k); i++) rc(listo ? col.V : i % 2 ? "#2a8a5f" : col.V, bx + 2 + i * 5, ty + 8, 4, 5);
      texto(listo ? col.V : col.Y, `${Math.round(k * 100)}%`, e.cx, ty + 28);
      if (listo && !RM) { const edad = ts - (R.sec[9][0] + R.limpia); if (edad < 0.5) { c2.globalAlpha = (1 - edad / 0.5) * 0.6; rc("#d9ffe6", 0, 0, FW, FH); c2.globalAlpha = 1; } }
    },
  ];

  /* ---------- El gato: quieto cuando la canción calla, girando cuando suena ----------
     La hoja images/juego/gato-uia.png trae 6 cuadros de 64 px: 0 = parado, 1 a 5 = una vuelta.
     La vuelta dura más o menos según la energía de la canción, y el gato se pasea distinto en cada escenario. */
  const gatoHoja = new Image();
  let gatoOk = false, gatoPedido = false, gatoX = 0, gatoY = 0, gatoTam = 1, gatoQuieto = true, estela = [];
  gatoHoja.onload = () => { gatoOk = true; };
  function pideGato() { if (!gatoPedido && R && R.gato) { gatoPedido = true; gatoHoja.src = R.gato; } }
  function pasoGato() {
    const cx = gx + W / 2, cy = gy + H * 0.5, sec = R.sec[secI], k = Math.min(1, Math.max(0, (ts - sec[0]) / (sec[1] - sec[0])));
    const base = Math.min(64, FW * 0.42, FH * 0.36);
    let x = cx, y = cy, tam = 1;
    switch (secI) {
      case 0: y = gy + H * 0.66; break;                                                                        // aparece bajo el aviso de error
      case 1: x = cx + Math.sin(ts * 0.8) * FW * 0.3; y = gy + H * 0.6 - base * 0.3; break;                  // camina por el horizonte, frente al sol
      case 2: x = cx + Math.sin(ts * 0.35) * FW * 0.33; y = cy + Math.sin(ts * 0.9) * FH * 0.13; break;       // flota
      case 3: tam = 0.45 + k * k * 1.1; x = cx + (RM ? 0 : Math.sin(ts * 31) * k * 2); y = cy + (RM ? 0 : Math.cos(ts * 27) * k * 2); break; // se acerca
      case 4: x = cx + Math.sin(ts * 1.1) * W * 0.3; y = gy + H * 0.32 - pulso * 3; tam = 1.05 + peligro * 0.05; break; // el jefe: arriba, creciendo con la pista
      case 5: x = FW * 0.3 + Math.sin(ts * 0.3) * FW * 0.16; y = FH * 0.3 + Math.cos(ts * 0.4) * 7; tam = 0.85; break; // pasea por el cielo
      case 6: x = cx + Math.sin(ts * 0.9) * FW * 0.3; y = cy + Math.sin(ts * 1.8) * FH * 0.17; break;          // dibuja un ocho
      case 7: x = cx + Math.cos(ts * 2.2) * FW * 0.27; y = cy + Math.sin(ts * 2.2) * FH * 0.22; tam = 1.1; break; // da vueltas alrededor del centro
      case 8: x = cx + Math.sin(ts * 0.25) * FW * 0.22; y = cy + Math.sin(ts * 0.5) * FH * 0.1; tam = 0.9; break; // se hunde despacio
      case 9: y = gy + H * 0.6; break;                                                                         // quieto mientras lo limpian
      default: break;
    }
    const lento = 0.09;
    gatoX += (x - gatoX) * lento;
    gatoY += (y - gatoY) * lento;
    gatoTam += (tam - gatoTam) * 0.1;
    // Con la canción en silencio se queda parado; cuando vuelve, gira
    if (gatoQuieto ? energiaAhora > 0.31 : energiaAhora < 0.24) gatoQuieto = !gatoQuieto;
    if (secI === 7 && !RM && t % 3 === 0) { estela.push([gatoX, gatoY, giro]); if (estela.length > 5) estela.shift(); }
    else if (secI !== 7 && estela.length) estela = [];
  }
  function pintaGato(x, y, lado, vuelta, alfa) {
    const dib = (f, a) => { c2.globalAlpha = a; c2.drawImage(gatoHoja, f * 64, 0, 64, 64, Math.round(x - lado / 2), Math.round(y - lado / 2), lado, lado); };
    if (vuelta == null) dib(0, alfa);
    else {
      const f = (((vuelta * 5) % 5) + 5) % 5, i = Math.floor(f);
      dib(1 + i, alfa);
      // En las vueltas lentas, un cuadro se funde con el siguiente para que no se vea a saltos
      if (vGiro < 1.3 && !RM) dib(1 + ((i + 1) % 5), alfa * (f - i));
    }
    c2.globalAlpha = 1;
  }
  // Cuánto lleva la limpieza del final, de 0 a 1
  const limpieza = () => (secI === 9 ? Math.min(1, Math.max(0, (ts - R.sec[9][0] - 0.6) / (R.limpia - 0.6))) : 0);
  // En el arranque el gato todavía no se ve: solo se asoma un instante antes de tumbar la consola
  const gatoSeVe = () => secI > 0 || ts >= R.error || (!RM && R.asomos.some((a) => ts >= a && ts < a + 0.09));
  function dibujaGato() {
    if (!gatoOk || !gatoSeVe()) return;
    const base = Math.min(64, FW * 0.42, FH * 0.36), lado = Math.max(2, Math.round(base * gatoTam * (1 + pulso * 0.07)));
    c2.imageSmoothingEnabled = false;
    estela.forEach(([x, y, g], i) => pintaGato(x, y, lado, g, 0.1 + i * 0.07));
    const k = limpieza();
    if (k >= 1) return;
    if (k > 0) {
      // La limpieza lo borra de arriba hacia abajo: una línea verde lo recorre y suelta pixeles
      const arriba = gatoY - lado / 2, corte = arriba + lado * k;
      c2.save();
      c2.beginPath(); c2.rect(gatoX - lado, corte, lado * 2, lado * (1 - k) + 2); c2.clip();
      pintaGato(gatoX + (RM ? 0 : Math.round((h(Math.floor(ts * 12)) - 0.5) * 3)), gatoY, lado, gatoQuieto ? null : giro, 1);
      c2.restore();
      rc(col.V, gatoX - lado / 2 - 3, corte, lado + 6, 1);
      if (!RM) for (let i = 0; i < 16; i++) rc(i % 3 ? col.V : "#d9ffe6", gatoX - lado / 2 + h(i) * lado, corte - ((ts * 34 + h(i + 0.3) * 22) % 22), 1, 1);
      return;
    }
    pintaGato(gatoX, gatoY, lado, gatoQuieto ? null : giro, secI === 8 ? 0.8 : 1);
  }

  // Todo lo que va en el lienzo de efectos: escenario, gato y, encima, destellos y apagón
  let fxLimpio = true;
  function dibujaFx() {
    const activo = modo === "ritmo" && estado !== "cargando" && secI >= 0;
    if (!activo) { if (!fxLimpio) { c2.clearRect(0, 0, FW, FH); fx.style.transform = ""; lienzo.style.transform = ""; fxLimpio = true; } return; }
    fxLimpio = false;
    c2.globalAlpha = 1;
    ESCENAS[secI]({ cx: gx + W / 2, cy: gy + H * 0.5, suelo: gy + piso(), sec: R.sec[secI] });
    dibujaGato();
    // El destello al cambiar de escenario y el fogonazo del despegue
    if (!RM && cambio > 0) { c2.globalAlpha = (cambio / 26) * 0.55; rc("#ffffff", 0, 0, FW, FH); c2.globalAlpha = 1; }
    if (!RM && secI === 3 && ts > 98.86) { c2.globalAlpha = Math.min(1, (ts - 98.86) / 1.96) * 0.5; rc("#ffffff", 0, 0, FW, FH); c2.globalAlpha = 1; }
    // Al fallar un bug: la imagen se rompe en tiras y se tiñe de rojo
    if (interferencia > 0 && !RM) { tiras(5, 10, t); c2.globalAlpha = (interferencia / 12) * 0.2; rc("#ff0030", 0, 0, FW, FH); c2.globalAlpha = 1; }
    // La cámara: el lienzo de efectos se acerca un poco hacia su foco; el recuadro del juego apenas late
    fx.style.transform = zoom > 1.001 ? `translate(${(focoX * (1 - zoom) * escala).toFixed(2)}px,${(focoY * (1 - zoom) * escala).toFixed(2)}px) scale(${zoom.toFixed(4)})` : "";
    lienzo.style.transform = !RM && estado === "jugando" && [1, JEFE, 7].includes(secI) ? `scale(${(1 + pulso * 0.012).toFixed(4)})` : "";
    // El apagón final: la pantalla entera se cierra en una línea y la línea en un punto
    const falta = R.dur - ts;
    if (secI === R.sec.length - 1 && falta < 3) {
      const k = 1 - Math.max(0, falta) / 3, mitad = Math.max(1, (FH / 2) * (1 - k) * (1 - k));
      rc(col.F, 0, 0, FW, FH / 2 - mitad);
      rc(col.F, 0, FH / 2 + mitad, FW, FH / 2 - mitad + 1);
      if (k > 0.75) { const ancho = (FW / 2) * (1 - (k - 0.75) / 0.25); rc(col.F, 0, 0, FW / 2 - ancho, FH); rc(col.F, FW / 2 + ancho, 0, FW / 2 - ancho + 1, FH); }
    }
    // En pausa o al terminar, todo se oscurece para que se lea el mensaje
    if (estado !== "jugando") rc("rgba(0,0,0,.74)", 0, 0, FW, FH);
  }
  function bucle(ahora) {
    raf = requestAnimationFrame(bucle);
    acum += Math.min(100, ahora - (ult || ahora));
    ult = ahora;
    while (acum >= 1000 / 60) { paso(); acum -= 1000 / 60; }
    dibuja();
    dibujaFx();
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
    if (e.type === "keyup") {
      if (flechaIzq) izq = false;
      if (flechaDer) der = false;
      if (flechaIzq || flechaDer) { dirTecla = der ? 1 : izq ? -1 : 0; rep = 6; }
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    e.stopPropagation();
    e.preventDefault();
    if (flechaIzq || flechaDer) {
      // Cada toque es un salto inmediato; dejar la tecla apretada repite el salto
      if (e.repeat) return;
      if (flechaIzq) izq = true; else der = true;
      dirTecla = flechaIzq ? -1 : 1;
      rep = 9;
      if (estado === "jugando") { meta = null; saltaA(bit.c + dirTecla); }
    }
    else if (k === "escape") { if (estado === "jugando") pausa(true); else cerrar(false); }
    else if (k === "p") pausa(estado === "jugando");
    else if (estado === "titulo" && (k === "1" || k === " " || k === "enter")) empezar();
    else if (estado === "titulo" && k === "2") empezarRitmo();
    else if (estado === "pausa" && (k === " " || k === "enter")) pausa(false);
    else if ((estado === "pausa" || estado === "fin") && k === "m") titulo();
    else if (estado === "fin" && (k === "r" || k === " " || k === "enter")) (modo !== "ritmo" ? empezar : muerto ? reintentaJefe : empezarRitmo)();
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
    dirTecla = 0;
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
    fx.style.transform = "";
    lienzo.style.transform = "";
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