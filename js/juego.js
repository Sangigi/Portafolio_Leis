/* ---------- BIT & BUGS: el minijuego del GAME OVER ----------
   Sale al contestar N en el CONTINUE? (tecla J o el botón). Tiene dos modos:
   - CLASICO: los bugs se escapan del CRT y BIT los atrapa antes de que lleguen a producción.
   - RITMO: los bugs caen al compás de "u i a Cat" (mapa en js/ritmo-uia.js); el escenario cambia con la
     canción y ocupa toda la pantalla, no solo el recuadro del juego. Un gato (images/juego/gato-uia.png) se
     pasea por el fondo y gira más rápido o más lento según la música. No se pierde: al final hay nota.
   BIT se mueve por 5 carriles, de un salto por toque. En el hiperespacio vuela libre y esquiva rayos.
   Los bugs cambian de especie con cada escenario y hay especiales: dorado, arcoíris (fiebre x2), glitch y antivirus.
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
  // Los bugs: cinco especies de 11×9, cada una con dos cuadros (R cuerpo, Z sombra, W ojos, K pupila, G patas).
  // En ritmo, cada escenario trae su especie y sus colores (MUTA); en clásico cambian con cada versión.
  const ESPECIES = {
    // Catarina
    A: [["..G.....G..", "...G...G...", "..RRRRRRR..", "GRRWRRRWRRG", ".RRKRZRKRR.", "GRRRRZRRRRG", ".RRZRZRZRR.", "G.RRRZRRR.G", "...RR.RR..."],
        ["...G...G...", "...G...G...", "..RRRRRRR..", ".RRWRRRWRR.", "GRRKRZRKRRG", ".RRRRZRRRR.", "GRRZRZRZRRG", "..RRRZRRR..", "..RR...RR.."]],
    // Araña
    B: [["G...G.G...G", ".G..G.G..G.", "..GRRRRRG..", "..RWKRKWR..", "GGRRRRRRRGG", "..RRZRZRR..", ".GRRRRRRRG.", "G..RRZRR..G", "G.........G"],
        [".G..G.G..G.", "..G.G.G.G..", "..GRRRRRG..", "..RWKRKWR..", ".GRRRRRRRG.", "G.RRZRZRR.G", "..RRRRRRR..", ".G.RRZRR.G.", ".G.......G."]],
    // Mosca
    C: [["WW.......WW", "WWW.....WWW", ".WWRRRRRWW.", "..RWKRKWR..", "..RRRRRRR..", ".GRZZZZZRG.", "..RRRRRRR..", ".G.RZZZR.G.", "....R.R...."],
        ["...........", "WW.......WW", "WWWRRRRRWWW", ".WRWKRKWRW.", "..RRRRRRR..", ".GRZZZZZRG.", "..RRRRRRR..", ".G.RZZZR.G.", "....R.R...."]],
    // Virus de picos
    D: [["R...R.R...R", ".R..RRR..R.", "..RRRRRRR..", "RRRWWRWWRRR", "..RWKRKWR..", "RRRRRRRRRRR", "..RRZZZRR..", ".R.RRRRR.R.", "R...R.R...R"],
        [".R..R.R..R.", "..R.RRR.R..", "..RRRRRRR..", ".RRWWRWWRR.", "R.RKWRWKR.R", ".RRRRRRRRR.", "R.RRZZZRR.R", "..RRRRRRR..", ".R..R.R..R."]],
    // Medusa
    E: [["...RRRRR...", "..RRRRRRR..", ".RRWRRRWRR.", ".RRKRRRKRR.", ".RRRRRRRRR.", "..RZRZRZR..", "..R.R.R.R..", ".R..R.R..R.", ".R.R...R.R."],
        ["...RRRRR...", "..RRRRRRR..", ".RRWRRRWRR.", ".RRKRRRKRR.", ".RRRRRRRRR.", "..RZRZRZR..", "..R.R.R.R..", "..R.R.R.R..", "...R.R.R..."]],
  };
  const ORO_MAPA = { R: "Y", Z: "Q" };
  // Por escenario: especie y cambio de colores
  const MUTA = [["A", null], ["B", { R: "P", Z: "M" }], ["E", { R: "C", Z: "B" }], ["C", { R: "N", Z: "R" }], ["D", { R: "P", Z: "R" }],
    ["C", { R: "Y", Z: "V", W: "C" }], ["D", { R: "V", Z: "D" }], ["B", { R: "C", Z: "M", G: "W" }], ["E", { R: "M", Z: "B" }], ["A", { R: "G", Z: "D" }]];
  // Antivirus: solo sale con el jefe y baja la pista dos filas
  const ANTIVIRUS = ["..WWWWWWW..", ".WWWWVWWWW.", "WWWWWVWWWWW", "WWWWWVWWWWW", "WWVVVVVVVWW", "WWWWWVWWWWW", "WWWWWVWWWWW", ".WWWWVWWWW.", "..WWWWWWW.."];
  const BUG = ESPECIES.A;
  const ORO = BUG.map((f) => f.map((fila) => fila.replace(/R/g, "Y").replace(/Z/g, "Q")));
  const BW = 11, BH = 9;
  // Niveles de combo: al llegar a cada uno sube el multiplicador medio punto y salta su letrero
  const NIVELES = [[5, "BIEN", "NICE"], [10, "GENIAL", "GREAT"], [15, "SUPER", "SUPER"], [20, "BRUTAL", "BRUTAL"], [30, "MEGA", "MEGA"], [40, "ULTRA", "ULTRA"],
    [50, "HIPER", "HYPER"], [75, "BESTIAL", "SAVAGE"], [100, "IMPARABLE", "UNSTOPPABLE"], [150, "LEGENDARIO", "LEGENDARY"], [200, "DIVINO", "GODLIKE"], [300, "BIT SUPREMO", "BIT SUPREME"]];
  const TONOS_COMBO = ["#ffffff", "#38BDF8", "#41B883", "#ffe14a", "#F28C28", "#ff3fb4", "#A259FF", "#ff4d4d", "#00f6ff", "#7dff3c", "#ffd23b", "#ffffff", "#ff2e7e"];
  // Los colores de la estela de BIT, en orden
  const SANDE = ["#00f6ff", "#00a2ff", "#6a5cff", "#c84bff", "#ff3fb4", "#ff5a4a", "#ffb13b", "#f7ff4a", "#5dff7a"];
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
  let bit = { c: 2, x: 95, y: 120 }, izq = false, der = false, meta = null, boca = "n", bocaT = 0, parpadeo = 0, temblor = 0, mensaje = "", mensajeT = 0;
  let record = +(lee("bitBugsRecord") || 0), nuevoRecord = false, codigo = [], deApagado = false, bloqueamos = false, volverA = null;
  const piso = () => H - 4, bitY = () => piso() - 12;
  // Carriles: BIT y los bugs van por 5 columnas (pocas, para que cada salto cuente)
  const carriles = 5;
  let LW = 40;
  const xBit = (c) => Math.round(c * LW + LW / 2 - 5), xBug = (c) => Math.round(c * LW + LW / 2 - 5.5);
  let dirTecla = 0, rep = 0, fantasmas = [], chispas = [], aplasta = 0;
  // La estela de BIT: copias de colores que se quedan atrás al moverse en las partes fuertes
  let ecos = [], ecoN = 0;
  // Lo sabroso de atrapar: ondas, brillo, golpe de cámara, el número de combo que brinca y el letrero de cada nivel
  let ondas = [], brillo = 0, punch = 0, comboPop = 0, logro = null, fiebre = 0, burbujas = [];
  // Vuelo libre (escenario 8): BIT deja los carriles y se mueve por todo el recuadro
  const VUELO = 7;
  let vuela = false, arr = false, aba = false, metaY = null, vx = 0, vy = 0, vueloAviso = false;
  // Ataques del gato: rayos que avisan y caen con el siguiente bombo
  let ataques = [];
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
  // mapa: cambia unas letras por otras (los colores de cada especie)
  function pinta(rows, x, yy, mapa) {
    const X = Math.round(x), Y = Math.round(yy);
    rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const c = r[i]; if (c === ".") continue; ctx.fillStyle = col[(mapa && mapa[c]) || c] || (mapa && mapa[c]); ctx.fillRect(X + i, Y + j, 1, 1); } });
  }
  // Texto con la fuente pixelada y borde negro, para los puntos que saltan y los letreros
  function rotulo(txt, x, y, c, escala = 1) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(escala, escala);
    ctx.font = `8px "Press Start 2P"`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#000000";
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ctx.fillText(txt, dx, dy);
    ctx.fillStyle = c;
    ctx.fillText(txt, 0, 0);
    ctx.restore();
  }
  // Azar que no cambia dentro del mismo cuadro (para los efectos de interferencia)
  const h2 = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
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
  // Cada nivel de combo alcanzado suma medio punto al multiplicador; con fiebre, todo vale el doble
  const nivelCombo = () => { let n = 0; while (n < NIVELES.length && combo >= NIVELES[n][0]) n++; return n; };
  const multi = () => (1 + nivelCombo() * 0.5) * (fiebre > ts ? 2 : 1);
  function aviso(html) { msg.innerHTML = html; msg.hidden = !html; }
  function titulo() {
    detieneAudio();
    estado = "titulo";
    modo = "clasico";
    objs = []; textos = []; grietas = []; destellos = []; fantasmas = []; chispas = []; ecos = []; ondas = []; ataques = []; burbujas = []; logro = null; mensaje = "";
    vuela = false; fiebre = 0; combo = 0; bit.y = bitY();
    muerto = false; peligro = peligroVis = 0; dano = 0; interferencia = 0;
    hud();
    aviso(`<p class="jm-t">BIT &amp; BUGS</p>
      <p>${T("Los bugs se escapan del CRT.<br>Atrápalos antes de que lleguen a producción.", "The bugs are escaping from the CRT.<br>Catch them before they reach production.")}</p>
      <p class="jm-x">${svg(BUG[0], 3)}<span>+10</span> ${svg(ORO[0], 3)}<span>+50</span> ${svg(CAFE, 3)}<span>+1 ${T("vida", "life")}</span></p>
      <p class="jm-b jm-modos"><button type="button" data-j="empezar">${kb("1")}${T("CLASICO", "CLASSIC")}</button>${R ? `<button type="button" data-j="ritmo">${kb("2")}${T("RITMO", "RHYTHM")} ♪ U I A CAT</button>` : ""}</p>
      ${R ? `<p class="jm-nota">${T("RITMO: bugs al compás de la canción, combos, un jefe que lanza rayos y un tramo donde BIT vuela.", "RHYTHM: bugs to the beat of the song, combos, a boss that throws lightning and a stretch where BIT flies.")}</p>` : ""}`);
  }
  function empezar() {
    detieneAudio();
    modo = "clasico";
    estado = "jugando";
    pts = 0; vidas = 3; nivel = 0; t = 0; sig = 40; objs = []; textos = []; grietas = []; destellos = [];
    bit = { c: carriles >> 1, x: xBit(carriles >> 1), y: bitY() }; fantasmas = []; chispas = []; ecos = []; ondas = []; logro = null; punch = 0; dano = 0; boca = "n"; bocaT = 0; mensaje = ""; nuevoRecord = false;
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
    bit = { c: carriles >> 1, x: xBit(carriles >> 1), y: bitY() }; fantasmas = []; chispas = []; boca = "n"; bocaT = 0; mensaje = ""; nuevoRecord = false;
    ondas = []; logro = null; punch = 0; comboPop = 0; fiebre = 0; burbujas = []; ataques = []; vuela = false; vueloAviso = false; vx = vy = 0;
    ts = desde; ultA = -1; rI = 0; rG = 0; golpeN = 0; pulso = 0; secI = -1; cambio = 0; combo = 0; maxCombo = 0; atrapados = 0; giro = 0; vGiro = 0.3; energiaAhora = 0;
    ecos = []; dano = 0; interferencia = 0; agachaT = 0; peligro = 0; peligroVis = 0; muerto = false; foto = null; jefeAviso = false; desdeIni = desde; zoom = 1;
    if (guardado) { pts = guardado.pts; maxCombo = guardado.maxCombo; atrapados = guardado.atrapados; }
    // Se saltan las notas y los bombos anteriores al punto de arranque
    while (rI * 3 < R.notas.length && R.notas[rI * 3] / 1000 < desde + 1.2) rI++;
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
    castigo();
  }
  // Lo que cuesta fallar un bug o comerse un rayo: la música baja apenas, se pierde el combo y, con el jefe, sube la pista
  function castigo() {
    if (audio && !audio.muted) { audio.volume = R.volumen * 0.72; agachaT = 9; }
    if (combo >= 10) { logro = { txt: T("COMBO ROTO", "COMBO LOST"), vida: 50, max: 50, c: "#ff4d4d" }; }
    combo = 0;
    if (secI === JEFE) {
      peligro = Math.min(JEFE_TOPE, peligro + 1);
      if (peligro >= JEFE_TOPE - 2 && peligro < JEFE_TOPE) { mensaje = T("¡PELIGRO!", "DANGER!"); mensajeT = 50; }
    }
    hud();
  }
  // Un rayo del gato alcanzó a BIT
  function golpeado() {
    boca = "o"; bocaT = 45;
    dano = 26;
    if (!RM) { temblor = 12; interferencia = 10; }
    bip(900, 80, 0.22, "sawtooth", 0.07);
    bip(60, 40, 0.25, "square", 0.05, 0.02);
    if (secI !== JEFE) { pts = Math.max(0, pts - 50); textos.push({ txt: "-50", x: bit.x + 5, y: bit.y - 2, vida: 40, max: 40, c: "#ff4d4d", e: 1 }); }
    castigo();
  }
  // Qué tan fuerte va la canción en este segundo (0 a 1), suavizado entre muestra y muestra
  function energia(seg) {
    const E = R.energia, x = Math.max(0, Math.min(E.length - 1.001, seg * 2)), i = Math.floor(x), f = x - i;
    return ((+E[i]) * (1 - f) + (+E[i + 1]) * f) / 9;
  }
  const seccionDe = (seg) => { let i = 0; while (i < R.sec.length - 1 && seg >= R.sec[i][1]) i++; return i; };
  // Los carriles de cada nota se reparten aquí para que BIT nunca se quede parado: casi cada bug obliga a saltar.
  // De paso se eligen los especiales: dorado (+50), arcoíris (fiebre x2), glitch (cambia de carril al caer) y antivirus (jefe).
  const mapa = { c: [], tipo: [] };
  if (R) {
    let sem = 20261114;
    const rnd = () => { sem = (sem * 1664525 + 1013904223) >>> 0; return sem / 4294967296; };
    const N = R.notas, n = N.length / 3;
    let c = 2, dir = 1, oros = 0, normales = 0;
    for (let i = 0; i < n; i++) {
      const tn = N[i * 3] / 1000, dt = i ? tn - N[(i - 1) * 3] / 1000 : 9, dtSig = i < n - 1 ? N[(i + 1) * 3] / 1000 - tn : 9, sec = seccionDe(tn);
      // Ráfagas muy rápidas: a veces repite carril; lo demás siempre se mueve, y más lejos cuanto más tiempo hay
      let paso = dt < 0.24 ? (rnd() < 0.45 ? 0 : 1) : dt < 0.42 ? 1 : dt < 0.7 ? (rnd() < 0.65 ? 1 : 2) : 1 + Math.floor(rnd() * 3);
      if (rnd() < 0.3) dir = -dir;
      let nc = c + dir * paso;
      if (nc < 0 || nc > carriles - 1) { dir = -dir; nc = c + dir * paso; }
      c = Math.max(0, Math.min(carriles - 1, nc));
      mapa.c.push(c);
      let tipo = "bug";
      if (N[i * 3 + 2]) tipo = ++oros % 3 === 0 ? "arco" : "oro";
      else {
        normales++;
        if (sec === JEFE && normales % 13 === 0) tipo = "anti";
        else if (sec >= 3 && sec !== 9 && sec !== VUELO && dt > 0.3 && dtSig > 0.45 && normales % 11 === 0) tipo = "glitch";
      }
      mapa.tipo.push(tipo);
    }
  }
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
      if (secI === JEFE && s === JEFE + 1) { pts += 1000; peligro = 0; textos.push({ txt: "+1000", x: W / 2, y: H * 0.5, vida: 70, max: 70, c: "#ffe14a", e: 2 }); [659, 784, 1047, 1319].forEach((f, i) => bip(f, 0, 0.1, "square", 0.04, i * 0.08)); }
      secI = s;
      cambio = 26;
      mensaje = `${s + 1}/${R.sec.length} ${T(R.sec[s][4], R.sec[s][5])}`;
      mensajeT = 120;
      // Punto de control: lo que se llevaba al llegar al jefe
      if (s === JEFE) { foto = { pts, maxCombo, atrapados }; peligro = 0; jefeAviso = false; }
      // En el hiperespacio BIT vuela libre; al salir, vuelve a su carril
      vuela = s === VUELO;
      if (vuela) { vx = vy = 0; vueloAviso = false; }
      else bit.c = Math.max(0, Math.min(carriles - 1, Math.floor((bit.x + 5) / LW)));
      ataques = [];
      hud();
    }
    if (cambio > 0) cambio--;
    if (vuela && !vueloAviso && ts > R.sec[VUELO][0] + 2.1) { vueloAviso = true; logro = { txt: T("¡VUELA LIBRE!", "FLY FREE!"), vida: 110, max: 110, c: "#00f6ff" }; }
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
    while (rG < R.golpes.length && R.golpes[rG] <= ts * 100) { rG++; golpeN++; pulso = 1; anillos.push(ts); if (anillos.length > 4) anillos.shift(); programaAtaque(); }
    // El gato gira según la energía de la canción: de un cuarto de vuelta por segundo a casi tres
    energiaAhora = energia(ts);
    vGiro += (0.22 + energiaAhora * energiaAhora * 2.7 - vGiro) * 0.07;
    giro += vGiro / 60 + pulso * 0.003;
    moverBit();
    pasoGato();
    // Cada bug sale con el tiempo justo para llegar a BIT en su nota
    const N = R.notas;
    while (rI * 3 < N.length) {
      const tn = N[rI * 3] / 1000, sec = seccionDe(tn), d = R.sec[sec][2];
      if (tn - d > ts) break;
      const c = mapa.c[rI], tipo = mapa.tipo[rI];
      const o = { tipo, c, tn, d, s: sec, x: xBug(c), y: 0 };
      // El glitch cambia de carril a media caída
      if (tipo === "glitch") o.c2 = c === 0 ? 1 : c === carriles - 1 ? c - 1 : c + (rI % 2 ? 1 : -1);
      objs.push(o);
      grietas.push({ x: xBug(c) + 4, vida: 16 });
      rI++;
    }
    const by = bitY(), y0 = 2, yT = by - 5;
    for (const o of objs) {
      const avance = 1 - (o.tn - ts) / o.d;
      if (o.c2 != null && !o.salto && avance > 0.52) { o.salto = true; o.c = o.c2; if (!RM) for (let i = 0; i < 6; i++) chispas.push({ x: o.x + 5, y: o.y + 4, vx: azar(-1.5, 1.5), vy: azar(-1, 1), vida: 10, c: "#00f6ff", g: 1 }); }
      o.x += (xBug(o.c) - o.x) * (o.salto ? 0.5 : 1);
      o.y = y0 + (yT - y0) * avance;
      const toca = vuela
        ? o.x < bit.x + 11 && o.x + BW > bit.x - 1 && o.y < bit.y + 12 && o.y + BH > bit.y - 1
        : o.y + BH >= by + 1 && o.y <= by + 9 && o.c === bit.c;
      if (toca) {
        o.fuera = true;
        const antes = nivelCombo();
        combo++; atrapados++;
        if (combo > maxCombo) maxCombo = combo;
        const nv = nivelCombo(), tono = TONOS_COMBO[Math.min(nv, TONOS_COMBO.length - 1)];
        const base = o.tipo === "oro" ? 50 : o.tipo === "arco" ? 100 : o.tipo === "anti" ? 30 : o.tipo === "glitch" ? 25 : 10;
        const n = Math.round(base * multi());
        pts += n;
        atrapa(o, o.tipo === "oro" ? "#ffe14a" : o.tipo === "arco" ? SANDE[t % SANDE.length] : o.tipo === "anti" ? "#41B883" : tono, o.tipo === "bug" ? 1 : 2);
        textos.push({ txt: `+${n}`, x: o.x + 5, y: o.y, vida: 38, max: 38, c: o.tipo === "bug" ? tono : "#ffe14a", e: o.tipo === "bug" ? 1 : 1.5 });
        // Cada bug suena un poco más agudo que el anterior: la escala sube con el combo y vuelve a empezar al fallar
        bip(523.25 * Math.pow(2, [0, 2, 4, 7, 9][combo % 5] / 12 + Math.min(2, Math.floor(combo / 10))), 0, 0.07, "triangle", 0.045);
        if (o.tipo === "oro") bip(880, 1760, 0.12, "square", 0.03);
        if (o.tipo === "arco") {
          fiebre = ts + 7;
          logro = { txt: T("¡FIEBRE x2!", "FEVER x2!"), vida: 90, max: 90, c: "#ff3fb4", arco: true };
          [659, 880, 1109, 1319, 1760].forEach((f, i) => bip(f, 0, 0.09, "square", 0.035, i * 0.05));
        } else if (o.tipo === "anti") {
          peligro = Math.max(0, peligro - 2);
          logro = { txt: T("ANTIVIRUS -2", "ANTIVIRUS -2"), vida: 60, max: 60, c: "#41B883" };
        } else if (nv > antes) {
          // Nivel de combo nuevo: letrero, fanfarria y un golpe de cámara más fuerte
          logro = { txt: `${T(NIVELES[nv - 1][1], NIVELES[nv - 1][2])} x${1 + nv * 0.5}`, vida: 80, max: 80, c: tono };
          punch = 2;
          [0, 4, 7, 12].forEach((st, i) => bip(523.25 * Math.pow(2, (st + nv) / 12), 0, 0.08, "square", 0.035, i * 0.045));
          if (!RM) for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; chispas.push({ x: bit.x + 5, y: bit.y + 4, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3 - 0.5, vida: 20, c: i % 2 ? tono : "#ffffff", g: 2 }); }
        }
        boca = "s"; bocaT = 24;
        if (secI === JEFE) peligro = Math.max(0, peligro - JEFE_BAJA);
        hud();
      } else if (o.y + BH >= piso()) {
        o.fuera = true;
        falla(o);
        if (peligro >= JEFE_TOPE) { muereBit(); return; }
      }
    }
    objs = objs.filter((o) => !o.fuera);
    // Los rayos del gato caen justo en el bombo que avisaron
    for (const a of ataques) {
      if (a.hecho || ts < a.t1) continue;
      a.hecho = true;
      bip(1400, 200, 0.12, "sawtooth", 0.04);
      const da = a.tipo === "v" ? bit.c === a.c && !vuela : a.tipo === "x" ? Math.abs(bit.x + 5 - a.x) < 10 : Math.abs(bit.y + 6 - a.y) < 9;
      if (da) { golpeado(); if (peligro >= JEFE_TOPE) { muereBit(); return; } }
    }
    ataques = ataques.filter((a) => ts < a.t1 + 0.24);
    if (fiebre && ts > fiebre) { fiebre = 0; hud(); }
  }
  // Con cada bombo el gato puede apuntar un rayo: avisa ahora y cae con el bombo siguiente
  function programaAtaque() {
    if (rG >= R.golpes.length) return;
    const t1 = R.golpes[rG] / 100;
    if (t1 - ts < 0.3 || t1 - ts > 0.9) return;
    if (secI === JEFE && ts > R.sec[JEFE][0] + 4.5 && golpeN % 4 === 0) {
      // Con el jefe apunta al carril de BIT, salvo que ahí vaya a caer un bug en ese mismo instante
      const c = bit.c;
      if (objs.some((o) => (o.c === c || o.c2 === c) && Math.abs(o.tn - t1) < 0.3)) return;
      ataques.push({ tipo: "v", c, t0: ts, t1 });
    } else if (vuela && energiaAhora > 0.5 && ts > R.sec[VUELO][0] + 4 && golpeN % 3 === 0) {
      // En el hiperespacio alterna: un rayo de lado a lado a la altura de BIT, o uno de arriba abajo donde esté
      ataques.push((golpeN / 3) % 2 ? { tipo: "h", y: bit.y + 6, t0: ts, t1 } : { tipo: "x", x: bit.x + 5, t0: ts, t1 });
    }
  }

  function nace() {
    const r = Math.random();
    const tipo = vidas < 3 && r < 0.05 ? "cafe" : r < 0.13 ? "oro" : "bug";
    const v = (0.42 + nivel * 0.07) * (tipo === "oro" ? 1.45 : tipo === "cafe" ? 0.8 : 1) * azar(0.85, 1.15);
    const c = (Math.random() * carriles) | 0;
    objs.push({ tipo, c, x: xBug(c), y: 1, v, e: "ABCDE"[nivel % 5] });
    grietas.push({ x: xBug(c) + 4, vida: 16 });
  }
  // BIT salta de carril en carril: un salto por toque y, si dejas la tecla, sigue saltando rápido.
  // Con el mouse o el dedo, brinca directo al carril que señalas.
  function saltaA(c) {
    c = Math.max(0, Math.min(carriles - 1, c));
    if (c === bit.c) return;
    // Donde arrancó el salto queda una copia que tarda más en irse
    const f = fuerzaEstela();
    if (!RM) { if (f >= 2) ecos.push({ x: bit.x, y: bit.y, vida: 30, max: 30, c: SANDE[0] }); else if (!f) fantasmas.push({ x: bit.x, vida: 6 }); }
    bit.c = c;
    aplasta = 4;
  }
  // Qué tanta estela deja BIT: 0 nada, 1 corta y azul (partes tranquilas), 2 larga, 3 larga y a todo color (estribillos, vuelo, fiebre)
  function fuerzaEstela() {
    if (modo !== "ritmo" || secI < 0) return 0;
    if (vuela || fiebre > ts) return 3;
    return [1, JEFE].includes(secI) ? 3 : [3, 6].includes(secI) ? 2 : secI === 0 || secI === 9 ? 0 : 1;
  }
  function dejaEstela() {
    const f = fuerzaEstela();
    if (!f || RM) return;
    const vida = f === 3 ? 24 : f === 2 ? 17 : 10;
    ecos.push({ x: bit.x, y: bit.y, vida, max: vida, c: f === 1 ? SANDE[1 + (ecoN++ % 3)] : SANDE[ecoN++ % SANDE.length] });
    if (ecos.length > 70) ecos.splice(0, ecos.length - 70);
  }
  function moverBit() {
    if (vuela) {
      // Vuelo libre: flechas o WASD en las cuatro direcciones, o seguir al puntero
      const tope = W > 150 ? 3.1 : 2.4, ax = (der ? 1 : 0) - (izq ? 1 : 0), ay = (aba ? 1 : 0) - (arr ? 1 : 0);
      if (ax || ay) { meta = null; vx = Math.max(-tope, Math.min(tope, vx + ax * 0.75)); vy = Math.max(-tope, Math.min(tope, vy + ay * 0.75)); }
      else if (meta != null) { vx = Math.max(-4.5, Math.min(4.5, (meta - 5 - bit.x) * 0.3)); vy = Math.max(-4.5, Math.min(4.5, (metaY - 6 - bit.y) * 0.3)); }
      if (!ax && meta == null) vx *= 0.72;
      if (!ay && meta == null) vy *= 0.72;
      bit.x = Math.max(0, Math.min(W - 10, bit.x + vx));
      bit.y = Math.max(12, Math.min(bitY(), bit.y + vy));
      bit.c = Math.max(0, Math.min(carriles - 1, Math.floor((bit.x + 5) / LW)));
      if (Math.abs(vx) + Math.abs(vy) > 0.7 && t % 2 === 0) dejaEstela();
      return;
    }
    if (dirTecla) { meta = null; if (--rep <= 0) { saltaA(bit.c + dirTecla); rep = 5; } }
    else if (meta != null) saltaA(Math.floor(meta / LW));
    // El salto es una carrera corta de dos o tres cuadros hasta el carril nuevo, dejando estela
    const tx = xBit(bit.c), d = tx - bit.x, v = Math.max(5, LW / 3);
    if (d) {
      // Dos copias por cuadro: la estela sale tupida aunque el salto dure un instante
      const x0 = bit.x;
      bit.x = Math.abs(d) <= v ? tx : bit.x + Math.sign(d) * v;
      const x1 = bit.x;
      bit.x = (x0 + x1) / 2; dejaEstela();
      bit.x = x1; dejaEstela();
    }
    const dy = bitY() - bit.y;
    bit.y = Math.abs(dy) < 1 ? bitY() : bit.y + dy * 0.3;
  }
  // Al atrapar: onda, pedazos de color que saltan, BIT brilla y se aplasta, y la cámara da un golpecito
  function atrapa(o, color, fuerza = 1) {
    aplasta = 5;
    brillo = 3;
    comboPop = 7;
    punch = Math.min(2, punch + 0.55 * fuerza);
    if (RM) return;
    ondas.push({ x: o.x + 5, y: o.y + 4, vida: 10, max: 10, c: color, r: 5 + fuerza * 3 });
    for (let i = 0; i < 9 + fuerza * 5; i++) chispas.push({ x: o.x + 5, y: o.y + 4, vx: azar(-2.3, 2.3), vy: azar(-3, -0.4), vida: 14 + ((Math.random() * 10) | 0), c: i % 3 === 0 ? "#ffffff" : color, g: i % 2 ? 2 : 1 });
  }
  function paso() {
    t++;
    if (mensajeT > 0 && --mensajeT === 0) mensaje = "";
    if (bocaT > 0 && --bocaT === 0) boca = "n";
    if (temblor > 0) temblor--;
    if (--parpadeo < -150) parpadeo = 6;
    grietas.forEach((g) => g.vida--); grietas = grietas.filter((g) => g.vida > 0);
    destellos.forEach((d) => d.vida--); destellos = destellos.filter((d) => d.vida > 0);
    // Los puntos saltan de golpe y luego flotan
    textos.forEach((x) => { x.y -= x.vida > (x.max || 40) - 6 ? 1.6 : 0.3; x.vida--; }); textos = textos.filter((x) => x.vida > 0);
    fantasmas.forEach((f) => f.vida--); fantasmas = fantasmas.filter((f) => f.vida > 0);
    ecos.forEach((f) => f.vida--); ecos = ecos.filter((f) => f.vida > 0);
    ondas.forEach((f) => f.vida--); ondas = ondas.filter((f) => f.vida > 0);
    burbujas.forEach((b) => { b.y -= 0.45; b.x += Math.sin((t + b.vida) * 0.2) * 0.3; b.vida--; }); burbujas = burbujas.filter((b) => b.vida > 0 && b.y > 10);
    if (brillo > 0) brillo--;
    if (comboPop > 0) comboPop--;
    punch *= 0.8;
    if (logro && --logro.vida <= 0) logro = null;
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
      o.x = xBug(o.c);
      if (o.y + BH >= by + 1 && o.y <= by + 9 && o.c === bit.c) {
        o.fuera = true;
        atrapa(o, o.tipo === "oro" ? "#ffe14a" : o.tipo === "cafe" ? "#ffffff" : col.R, o.tipo === "bug" ? 1 : 2);
        if (o.tipo === "cafe") { vidas = Math.min(3, vidas + 1); textos.push({ txt: "+1", x: o.x + 5, y: o.y, vida: 40, max: 40, c: col.R, e: 1 }); bip(523, 0, 0.09); bip(784, 0, 0.12, "square", 0.05, 0.1); }
        else {
          const n = o.tipo === "oro" ? 50 : 10;
          const antes = Math.floor(pts / 100);
          pts += n;
          textos.push({ txt: `+${n}`, x: o.x + 5, y: o.y, vida: 40, max: 40, c: o.tipo === "oro" ? col.Y : col.W, e: 1 });
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
      } else if (o.y + BH >= piso()) {
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
    // El número del combo, enorme y tenue al fondo: brinca con cada bug
    if (ritmo && combo >= 3 && estado === "jugando") {
      ctx.save();
      ctx.globalAlpha = 0.2 + comboPop * 0.035;
      ctx.translate(W / 2, Math.round(H * 0.56));
      const e = (W > 150 ? 4 : 3) + comboPop * 0.22;
      ctx.scale(e, e);
      ctx.font = `8px "Press Start 2P"`;
      ctx.textAlign = "center";
      ctx.fillStyle = TONOS_COMBO[Math.min(nivelCombo(), TONOS_COMBO.length - 1)];
      ctx.fillText(String(combo), 0, 4);
      ctx.restore();
    }
    // Los rayos del gato: primero una franja que avisa (cada vez más marcada), luego el rayo
    for (const a of ataques) {
      const k = Math.min(1, (ts - a.t0) / (a.t1 - a.t0));
      const [x, y, w, hh] = a.tipo === "v" ? [Math.round(a.c * LW) + 1, 9, Math.round(LW) - 1, piso() - 9] : a.tipo === "x" ? [Math.round(a.x) - 8, 9, 16, piso() - 9] : [0, Math.round(a.y) - 7, W, 14];
      if (!a.hecho) {
        ctx.fillStyle = `rgba(255,225,74,${0.08 + 0.22 * k})`;
        ctx.fillRect(x, y, w, hh);
        ctx.fillStyle = (t >> 2) % 2 ? "#ffe14a" : "#ffffff";
        if (a.tipo === "h") { for (let i = (t >> 1) % 6; i < W; i += 6) { ctx.fillRect(i, y, 3, 1); ctx.fillRect(i, y + hh - 1, 3, 1); } }
        else { for (let i = 9 + ((t >> 1) % 6); i < piso(); i += 6) { ctx.fillRect(x, i, 1, 3); ctx.fillRect(x + w - 1, i, 1, 3); } }
        rotulo("!", a.tipo === "h" ? 8 : x + w / 2, a.tipo === "h" ? y + 11 : 22, "#ffe14a");
      } else {
        const edad = (ts - a.t1) / 0.24;
        ctx.globalAlpha = Math.max(0, 1 - edad);
        ctx.fillStyle = "#fff36b";
        ctx.fillRect(x, y, w, hh);
        ctx.fillStyle = "#ffffff";
        // El rayo en zigzag
        if (a.tipo === "h") { let yy = y + hh / 2; for (let i = 0; i < W; i += 4) { const ny = y + 2 + Math.random() * (hh - 4); ctx.fillRect(i, Math.round(Math.min(yy, ny)), 4, Math.max(2, Math.round(Math.abs(ny - yy)))); yy = ny; } }
        else { let xx = x + w / 2; for (let i = 9; i < piso(); i += 4) { const nx = x + 2 + Math.random() * (w - 4); ctx.fillRect(Math.round(Math.min(xx, nx)), i, Math.max(2, Math.round(Math.abs(nx - xx))), 4); xx = nx; } }
        ctx.globalAlpha = 1;
      }
    }
    for (const o of objs) {
      let sp, mp = null, ox = 0;
      const cuadro = (t >> 3) % 2;
      if (o.tipo === "cafe") sp = CAFE;
      else if (o.tipo === "anti") sp = ANTIVIRUS;
      else if (modo !== "ritmo") { sp = ESPECIES[o.e || "A"][cuadro]; mp = o.tipo === "oro" ? ORO_MAPA : null; }
      else {
        const [esp, m] = MUTA[o.s];
        sp = ESPECIES[o.tipo === "glitch" ? "D" : esp][cuadro];
        // Especiales: dorado; arcoíris, que cambia de color sin parar; glitch, blanco y tembloroso
        mp = o.tipo === "oro" ? ORO_MAPA : o.tipo === "arco" ? { R: SANDE[(t >> 2) % SANDE.length], Z: "#ffffff" } : o.tipo === "glitch" ? { R: "W", Z: "C" } : m;
        if (o.tipo === "glitch" && !RM && (t >> 1) % 3 === 0) ox = Math.random() < 0.5 ? -1 : 1;
      }
      // En ritmo, un contorno negro con la forma del bug para que se distinga sobre cualquier escenario
      if (ritmo) contorno(sp, o.x + ox, o.y);
      pinta(sp, o.x + ox, o.y, mp);
      // El glitch avisa hacia dónde va a brincar
      if (o.tipo === "glitch" && !o.salto && (t >> 2) % 2) { const d = o.c2 > o.c ? 1 : -1; ctx.fillStyle = "#00f6ff"; ctx.fillRect(Math.round(o.x) + (d > 0 ? 12 : -4), Math.round(o.y) + 3, 3, 3); ctx.fillRect(Math.round(o.x) + (d > 0 ? 15 : -5), Math.round(o.y) + 4, 1, 1); }
      // Dorados y arcoíris sueltan destellos
      if ((o.tipo === "oro" || o.tipo === "arco") && !RM && t % 4 === 0) chispas.push({ x: o.x + Math.random() * BW, y: o.y + Math.random() * BH, vx: 0, vy: -0.4, vida: 8, c: o.tipo === "oro" ? "#ffe14a" : SANDE[t % SANDE.length], g: 1 });
    }
    for (const b of burbujas) { ctx.fillStyle = "#bfe9ff"; ctx.fillRect(Math.round(b.x), Math.round(b.y), b.g, b.g); }
    // Ondas cuadradas que se abren donde se atrapó un bug
    for (const f of ondas) {
      const k = 1 - f.vida / f.max, r = Math.round(3 + k * f.r * 2), X = Math.round(f.x), Y = Math.round(f.y);
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = k < 0.25 ? "#ffffff" : f.c;
      ctx.fillRect(X - r, Y - r, r * 2, 1); ctx.fillRect(X - r, Y + r, r * 2 + 1, 1); ctx.fillRect(X - r, Y - r, 1, r * 2); ctx.fillRect(X + r, Y - r, 1, r * 2);
      ctx.globalAlpha = 1;
    }
    for (const c of chispas) { ctx.fillStyle = col[c.c] || c.c; ctx.fillRect(Math.round(c.x), Math.round(c.y), c.g || 1, c.g || 1); }
    for (const x of textos) if (x.vida > 8 || x.vida % 2) rotulo(x.txt, x.x, x.y, col[x.c] || x.c, x.vida > (x.max || 40) - 5 ? (x.e || 1) * 1.5 : x.e || 1);
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
    // Marcas de los carriles en el piso; el de BIT, encendido (volando no hay carriles)
    if (!vuela) {
      ctx.fillStyle = col.F;
      for (let c = 1; c < carriles; c++) ctx.fillRect(Math.round(c * LW), piso(), 1, H - piso());
      ctx.fillStyle = col.Y;
      ctx.fillRect(Math.round(bit.c * LW) + 1, piso(), Math.round(LW) - 1, 1);
    }
    for (const d of destellos) {
      // El carril donde cayó el bug: una columna roja que se apaga hacia arriba y el piso parpadeando
      const cxl = Math.round(Math.floor((d.x + 5) / LW) * LW) + 1, anc = Math.round(LW) - 1;
      if (ritmo && !RM) { const g = ctx.createLinearGradient(0, piso(), 0, piso() - H * 0.7); g.addColorStop(0, `rgba(255,40,60,${Math.min(0.55, d.vida / 30)})`); g.addColorStop(1, "rgba(255,40,60,0)"); ctx.fillStyle = g; ctx.fillRect(cxl, 9, anc, piso() - 9); }
      if (d.vida % 6 < 3) { ctx.fillStyle = col.R; ctx.fillRect(cxl, piso(), anc, H - piso()); }
    }
    // BIT mira hacia el bug más cercano al piso
    let cerca = null;
    for (const o of objs) if (o.tipo !== "cafe" && (!cerca || o.y > cerca.y)) cerca = o;
    const dx = cerca ? cerca.x + 5 - (bit.x + 5) : 0;
    if (P()) {
      const sprite = P().bitSprite(dx < -8 ? -1 : dx > 8 ? 1 : 0, parpadeo > 0, boca);
      for (const f of fantasmas) { ctx.globalAlpha = (f.vida / 6) * 0.45; pinta(sprite, f.x, bit.y); }
      // La estela: copias de BIT en un solo color que suman luz y se apagan una tras otra, de la más vieja a la más nueva
      ctx.globalCompositeOperation = "lighter";
      for (const f of ecos) { ctx.globalAlpha = Math.pow(f.vida / f.max, 1.4) * 0.85; silueta(sprite, f.x, f.y, f.c); }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      const yb = bit.y + (aplasta > 2 && !vuela ? 1 : 0) - (ritmo && estado === "jugando" && pulso > 0.7 && !vuela ? 1 : 0);
      if (ritmo) contorno(sprite, bit.x, yb);
      // Lastimado parpadea en rojo; recién atrapó, brilla en blanco
      if (dano > 0 && dano % 6 < 3) silueta(sprite, bit.x, yb, col.R);
      else if (brillo > 1) silueta(sprite, bit.x, yb, "#ffffff");
      else pinta(sprite, bit.x, yb);
      // Bajo el agua, BIT lleva escafandra: casco de cristal, visor, tanque y manguera
      if (ritmo && secI === 2) {
        const X = Math.round(bit.x), Y = Math.round(yb);
        ctx.fillStyle = "rgba(160,220,255,.22)";
        ctx.fillRect(X - 1, Y - 2, 12, 11);
        ctx.fillStyle = "#bfe9ff";
        ctx.fillRect(X, Y - 3, 10, 1); ctx.fillRect(X - 2, Y - 1, 1, 9); ctx.fillRect(X + 11, Y - 1, 1, 9); ctx.fillRect(X - 1, Y - 2, 1, 1); ctx.fillRect(X + 10, Y - 2, 1, 1); ctx.fillRect(X - 1, Y + 8, 1, 1); ctx.fillRect(X + 10, Y + 8, 1, 1); ctx.fillRect(X, Y + 9, 10, 1);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(X + 1, Y - 1, 3, 1); ctx.fillRect(X + 1, Y, 1, 2);
        ctx.fillStyle = col.G;
        ctx.fillRect(X - 5, Y + 2, 3, 7);
        ctx.fillStyle = "#ffd23b";
        ctx.fillRect(X - 5, Y + 1, 3, 1); ctx.fillRect(X - 4, Y - 3, 1, 4); ctx.fillRect(X - 4, Y - 4, 4, 1);
        if (estado === "jugando" && t % 26 === 0 && !RM) burbujas.push({ x: X + 12 + Math.random() * 2, y: Y - 4, vida: 70, g: Math.random() < 0.3 ? 2 : 1 });
      }
    }
    // El letrero del nivel de combo (o fiebre, o combo roto): entra grande y se asienta
    if (logro && estado === "jugando") {
      const k = 1 - logro.vida / logro.max, e = k < 0.08 ? 2 : k < 0.16 ? 1.5 : 1, ancho = logro.txt.length * 8 * e;
      const cabe = ancho > W - 6 ? (W - 6) / (logro.txt.length * 8) : e;
      if (logro.vida > 12 || logro.vida % 4 < 2) {
        const yl = Math.round(H * 0.29), c = logro.arco ? SANDE[(t >> 2) % SANDE.length] : logro.c;
        if (!RM && k < 0.3) { rotulo(logro.txt, W / 2 - 2, yl, "#ff2e7e", cabe); rotulo(logro.txt, W / 2 + 2, yl, "#00f6ff", cabe); }
        rotulo(logro.txt, W / 2, yl, c, cabe);
      }
    }
    // Con fiebre, el marco del recuadro corre en colores
    if (ritmo && fiebre > ts) {
      for (let i = 0; i < W; i += 4) { ctx.fillStyle = SANDE[((i >> 2) + (t >> 1)) % SANDE.length]; ctx.fillRect(i, 9, 4, 1); ctx.fillRect(W - 4 - i, piso() - 1, 4, 1); }
      const falta = (fiebre - ts) / 7;
      ctx.fillStyle = "#ff3fb4";
      ctx.fillRect(0, 10, Math.round(W * falta), 1);
    }
    // La advertencia del jefe: sale rota, con los colores separados y tiras corridas
    if (ritmo && secI === JEFE && estado === "jugando") {
      const tj = ts - R.sec[JEFE][0];
      if (tj > 0.25 && tj < 3.6) {
        const paso = Math.floor(ts * 16), lineas = T(["¡¡NO DEJES", "CAER NI UNO!!"], ["DON'T DROP", "A SINGLE ONE!!"]), y0 = Math.round(H * 0.47);
        if (RM || h2(paso) > 0.1) {
          ctx.fillStyle = "rgba(0,0,0,.72)";
          ctx.fillRect(0, y0 - 13, W, 31);
          lineas.forEach((txt, i) => {
            const corre = RM ? 0 : h2(paso + i * 7) < 0.3 ? Math.round((h2(paso * 3 + i) - 0.5) * 10) : 0, sep = RM ? 0 : 1 + Math.round(h2(paso + 3) * 2);
            rotulo(txt, W / 2 + corre - sep, y0 + i * 12, "#ff2e7e");
            rotulo(txt, W / 2 + corre + sep, y0 + i * 12, "#00f6ff");
            rotulo(txt, W / 2 + corre, y0 + i * 12, "#ffffff");
          });
          if (!RM) for (let i = 0; i < 3; i++) { const yy = y0 - 12 + Math.floor(h2(paso * 5 + i) * 28), dxx = Math.round((h2(paso * 9 + i) - 0.5) * 14); ctx.drawImage(lienzo, 0, yy, W, 3, dxx, yy, W, 3); }
        }
      }
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
    }
    // El recuadro da un golpecito al atrapar y late en las partes fuertes
    const esc = RM || estado !== "jugando" ? 1 : 1 + punch * 0.016 + (ritmo && [1, JEFE, 7].includes(secI) ? pulso * 0.012 : 0);
    lienzo.style.transform = esc > 1.0005 ? `scale(${esc.toFixed(4)})` : "";
    if (!ritmo && mensaje && mensajeT % 20 > 4) {
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
  // Pistones: barras que salen de las orillas de la pantalla y se estiran con cada bombo, cada una a su manera
  function pistones(punta, cuerpo) {
    const hueco = gx - 5, huecoV = gy - 4;
    if (hueco >= 10) for (let i = 0, y = 5; y < FH - 6; y += 12, i++) {
      const li = hueco * (0.1 + 0.9 * pulso * (0.3 + 0.7 * h(i + golpeN))), ld = hueco * (0.1 + 0.9 * pulso * (0.3 + 0.7 * h(i + 50 + golpeN)));
      rc(cuerpo, 0, y, li, 7); rc(punta, li - 2, y, 2, 7);
      rc(cuerpo, FW - ld, y, ld, 7); rc(punta, FW - ld, y, 2, 7);
    }
    // En el teléfono casi no hay orillas a los lados: salen de arriba
    else if (huecoV >= 10) for (let i = 0, x = 3; x < FW - 6; x += 12, i++) {
      const l = huecoV * (0.1 + 0.9 * pulso * (0.3 + 0.7 * h(i + golpeN)));
      rc(cuerpo, x, 0, 7, l); rc(punta, x, l - 2, 7, 2);
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
      pistones(col.Y, osc(col.P, 0.45));
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
      pistones("#ffffff", osc(col.C, 0.3 + 0.5 * k));
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
      // Pistones rosas en las orillas, al compás
      pistones("#ffffff", ROSA);
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
      pistones("#d9ffe6", osc(col.V, 0.6));
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
      pistones("#ffffff", osc(par[0], 0.85));
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
    if (secI === JEFE || secI === VUELO) corona(lado);
  }
  // La corona de rayos del gato cuando ataca: cinco picos de electricidad que no dejan de moverse
  function corona(lado) {
    const y0 = gatoY - lado * 0.42, ancho = lado * 0.5, tiembla = RM ? 0 : 1;
    let px = gatoX - ancho / 2, py = y0;
    for (let i = 1; i <= 10; i++) {
      const nx = gatoX - ancho / 2 + (ancho * i) / 10, pico = i % 2 ? 7 + (i === 5 ? 4 : 0) + pulso * 3 + Math.random() * 3 * tiembla : 0, ny = y0 - pico;
      linea(i % 4 < 2 ? "#fff36b" : "#ffffff", px, py, nx, ny);
      px = nx; py = ny;
    }
    rc("#fff36b", gatoX - ancho / 2, y0 + 1, ancho, 1);
    if (!RM) for (let i = 0; i < 4; i++) rc(i % 2 ? "#00f6ff" : "#ffffff", gatoX + (Math.random() - 0.5) * lado * 0.8, y0 - Math.random() * 14, 1, 1);
  }
  // Los rayos salen de la corona: una chispa fina mientras avisa y el rayo entero cuando cae
  function rayosDelGato() {
    if (!gatoOk || !ataques.length) return;
    const lado = Math.min(64, FW * 0.42, FH * 0.36) * gatoTam, ox = gatoX, oy = gatoY - lado * 0.5;
    for (const a of ataques) {
      const [dx, dy] = a.tipo === "v" ? [gx + a.c * LW + LW / 2, gy + 9] : a.tipo === "x" ? [gx + a.x, gy + 9] : [gx, gy + a.y];
      if (!a.hecho) { if (!RM && (t >> 1) % 2) rayo(ox, oy, dx, dy, "#fff36b", 1); }
      else { rayo(ox, oy, dx, dy, "#00f6ff", 3); rayo(ox, oy, dx, dy, "#ffffff", 2); }
    }
  }

  // Todo lo que va en el lienzo de efectos: escenario, gato y, encima, destellos y apagón
  let fxLimpio = true;
  function dibujaFx() {
    const activo = modo === "ritmo" && estado !== "cargando" && secI >= 0;
    if (!activo) { if (!fxLimpio) { c2.clearRect(0, 0, FW, FH); fx.style.transform = ""; fxLimpio = true; } return; }
    fxLimpio = false;
    c2.globalAlpha = 1;
    ESCENAS[secI]({ cx: gx + W / 2, cy: gy + H * 0.5, suelo: gy + piso(), sec: R.sec[secI] });
    dibujaGato();
    rayosDelGato();
    // Con fiebre, una lluvia de destellos de colores por toda la pantalla
    if (fiebre > ts && !RM) for (let i = 0; i < 26; i++) rc(SANDE[(i + (t >> 2)) % SANDE.length], h(i) * FW, (h(i + 0.5) * FH + ts * (30 + h(i + 0.2) * 50)) % FH, 2, 2);
    // El destello al cambiar de escenario y el fogonazo del despegue
    if (!RM && cambio > 0) { c2.globalAlpha = (cambio / 26) * 0.55; rc("#ffffff", 0, 0, FW, FH); c2.globalAlpha = 1; }
    if (!RM && secI === 3 && ts > 98.86) { c2.globalAlpha = Math.min(1, (ts - 98.86) / 1.96) * 0.5; rc("#ffffff", 0, 0, FW, FH); c2.globalAlpha = 1; }
    // Al fallar un bug: la imagen se rompe en tiras y se tiñe de rojo
    if (interferencia > 0 && !RM) { tiras(5, 10, t); c2.globalAlpha = (interferencia / 12) * 0.2; rc("#ff0030", 0, 0, FW, FH); c2.globalAlpha = 1; }
    // La cámara: el lienzo de efectos se acerca un poco hacia su foco; el recuadro del juego apenas late
    fx.style.transform = zoom > 1.001 ? `translate(${(focoX * (1 - zoom) * escala).toFixed(2)}px,${(focoY * (1 - zoom) * escala).toFixed(2)}px) scale(${zoom.toFixed(4)})` : "";
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
  function mueve(e) { const r = lienzo.getBoundingClientRect(); meta = ((e.clientX - r.left) / r.width) * W; metaY = ((e.clientY - r.top) / r.height) * H; }

  // Teclado: mientras el juego está abierto, todas las teclas son suyas
  function teclas(e) {
    if (el.hidden) return;
    const k = e.key.toLowerCase();
    const flechaIzq = k === "arrowleft" || k === "a", flechaDer = k === "arrowright" || k === "d";
    const flechaArr = k === "arrowup" || k === "w", flechaAba = k === "arrowdown" || k === "s";
    if (e.type === "keyup") {
      if (flechaIzq) izq = false;
      if (flechaDer) der = false;
      if (flechaIzq || flechaDer) { dirTecla = der ? 1 : izq ? -1 : 0; rep = 6; }
      if (flechaArr) arr = false;
      if (flechaAba) aba = false;
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
      if (estado === "jugando" && !vuela) { meta = null; saltaA(bit.c + dirTecla); }
    }
    else if (flechaArr) arr = true;
    else if (flechaAba) aba = true;
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
    izq = der = arr = aba = false;
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