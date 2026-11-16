/* ---------- BIT & BUGS · avisos.js: sonido, medidas, dibujo básico, marcador, línea de comandos y ventanas de racha ---------- */
(() => {
  "use strict";
  const BB = window.BitBugs, S = BB.S;
  const { $, BICHOS, CORAZON, CORAZON_VACIO, FUENTE, GRITOS, NIVELES, RM, SND, T, TONOS_COMBO, VENT, aEl, carriles, ctx, el, fx, gEl, lienzo, marco, pig, ponLibre, ptsEl, recEl, svg, verEl, verK, vidasEl, xBit } = BB;
  Object.assign(BB, { abreCombo, bip, cierraOrden, cierraVentana, cmd, cmdRes, contorno, dibujaOrden, grita, hud, letras, lugaresVentana, medir, pasoOrden, pasoVentanas, pideVentanas, pinta, rompeVentanas, rotulo, silueta });

  /* ---------- 4. Sonido, medidas y dibujo básico ---------- */
  // Sonidos de 8 bits hechos al vuelo (respetan el botón de sonido del sitio)
  S.ac = null;
  function bip(f1, f2, dur, tipo = "square", vol = 0.05, retraso = 0) {
    if (SND.silencio && SND.silencio()) return;
    try { S.ac = S.ac || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    const t0 = S.ac.currentTime + retraso, o = S.ac.createOscillator(), g = S.ac.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(f1, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(S.ac.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  // El área de juego se adapta a la pantalla: más alta en el teléfono, más ancha en la computadora
  function medir() {
    if (S.modoLibre) ponLibre(false);
    const r = marco.getBoundingClientRect();
    S.W = r.width > 700 ? 200 : 140;
    S.H = Math.max(110, Math.min(240, Math.round((S.W * r.height) / r.width)));
    S.escala = Math.min(r.width / S.W, r.height / S.H);
    if (S.escala >= 3) S.escala = Math.floor(S.escala);
    lienzo.width = S.W;
    lienzo.height = S.H;
    lienzo.style.width = `${Math.floor(S.W * S.escala)}px`;
    lienzo.style.height = `${Math.floor(S.H * S.escala)}px`;
    S.LW = S.W / carriles;
    S.bit.c = Math.min(S.bit.c, carriles - 1);
    S.bit.x = xBit(S.bit.c);
    // El lienzo de efectos se alinea pixel con pixel con el del juego
    lienzo.style.transform = ""; lienzo.style.transformOrigin = "";
    const rl = lienzo.getBoundingClientRect();
    S.rectL = rl; S.rect0 = rl;
    S.gx = Math.round(rl.left / S.escala);
    S.gy = Math.round(rl.top / S.escala);
    const izq0 = rl.left - S.gx * S.escala, arr0 = rl.top - S.gy * S.escala;
    S.FW = Math.ceil((window.innerWidth - izq0) / S.escala) + 1;
    S.FH = Math.ceil((window.innerHeight - arr0) / S.escala) + 1;
    fx.width = S.FW;
    fx.height = S.FH;
    S.fxIzq = izq0; S.fxArr = arr0;
    fx.style.left = `${izq0}px`;
    fx.style.top = `${arr0}px`;
    fx.style.width = `${S.FW * S.escala}px`;
    fx.style.height = `${S.FH * S.escala}px`;
    if (!aEl.hidden) BB.ponAudio(aEl.dataset.d);
    // Las tramas guardadas dependen del tamaño del lienzo: al cambiar, se vuelven a pintar
    S.tramas = {}; S.calientes = "";
  }
  // Si el marcador cambia de alto (en el teléfono ocupa dos renglones en ritmo), el recuadro se vuelve a medir
  if (window.ResizeObserver) new ResizeObserver(() => { if (!el.hidden) medir(); }).observe(marco);
  const leeCol = () => {
    S.col = {
      W: pig("--p-blanco"), Y: pig("--p-amarillo"), R: pig("--p-rojo"), G: pig("--p-gris"), K: pig("--p-negro"), Q: pig("--amarillo-oscuro"),
      Z: pig("--rojo-oscuro"), D: pig("--p-gris-osc"), F: pig("--p-negro"),
      B: pig("--p-azul"), C: pig("--p-cian"), P: pig("--p-rosa"), M: pig("--p-morado"), N: pig("--p-naranja"), V: pig("--p-verde"),
    };
    BB.aplicaSkin();
  };
  // mapa: cambia unas letras por otras (los colores de cada especie)
  function pinta(rows, x, yy, mapa) {
    const X = Math.round(x), Y = Math.round(yy);
    rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const c = r[i]; if (c === ".") continue; ctx.fillStyle = S.col[(mapa && mapa[c]) || c] || (mapa && mapa[c]); ctx.fillRect(X + i, Y + j, 1, 1); } });
  }
  // Texto con la fuente pixelada y borde negro, para los puntos que saltan
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
    ctx.fillStyle = S.col[c] || c;
    [...txt].forEach((ch, k) => (FUENTE[ch] || []).forEach((r, j) => { for (let i = 0; i < 3; i++) if (r[i] === "1") ctx.fillRect(Math.round(x) + k * 4 + i, Math.round(yy) + j, 1, 1); }));
  }
  /* ---------- 5. Marcador: puntos, récord, BPM o versión, y las vidas ---------- */
  const seis = (n) => String(n).padStart(6, "0");
  function hud() {
    el.classList.toggle("ritmo", S.modo === "ritmo");
    ptsEl.textContent = seis(S.pts);
    if (S.modo === "ritmo") {
      recEl.textContent = seis(Math.max(S.recordR, S.pts));
      verK.textContent = "BPM";
      verEl.textContent = S.R.sec[Math.max(0, S.secI)][3];
      vidasEl.innerHTML = Array.from({ length: S.D.vidas }, (_, i) => svg(i < S.vidasR ? CORAZON : CORAZON_VACIO, 2)).join("") + `<span class="j-combo"><i>x${multi()}</i></span>`;
      vidasEl.setAttribute("aria-label", `${T("Vidas", "Lives")}: ${S.vidasR}. Combo: ${S.combo}`);
      return;
    }
    recEl.textContent = seis(Math.max(S.record, S.pts));
    verK.textContent = "VERSION";
    verEl.textContent = `v1.${S.nivel}`;
    vidasEl.innerHTML = [0, 1, 2].map((i) => svg(i < S.vidas ? CORAZON : CORAZON_VACIO, 2)).join("");
    vidasEl.setAttribute("aria-label", `${T("Vidas", "Lives")}: ${S.vidas}`);
  }
  /* ---------- 6. La línea de comandos de la terminal ----------
     Los avisos se escriben dentro de la propia terminal de BIT, en el primer renglón, como un comando:
       C:\\>VUELO.EXE_          (se teclea letra por letra, en blanco)
       COMPLETO: VUELA CON LAS 4 FLECHAS   (el resultado, en verde; los errores y alertas, en rojo)
     cmd(...) teclea el comando y enseguida da su resultado. Si el resultado va en null, el comando se queda esperando
     hasta que cmdRes(...) lo complete: así el vuelo y el jefe se anuncian unos segundos antes de empezar. */
  const limpiaTxt = (txt) => txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[¡¿]/g, "").toUpperCase();
  const esMal = (txt) => /^(ERROR|ALERTA|WARNING)/.test(txt);
  function cmd(es, en, resEs, resEn, clave) {
    if (S.estado !== "jugando" && S.estado !== "cierre") return;
    if (clave) { if (S.dichos[clave]) return; S.dichos[clave] = 1; }
    const res = resEs == null ? null : limpiaTxt(T(resEs, resEn));
    S.orden = { cmd: limpiaTxt(`C:\\>${T(es, en)}`), n: 0, res, mal: res ? esMal(res) : false, fin: null };
    bip(1200, 0, 0.02, "square", 0.02); bip(900, 0, 0.02, "square", 0.02, 0.05);
  }
  function cmdRes(es, en) {
    const res = limpiaTxt(T(es, en));
    if (!S.orden) S.orden = { cmd: "", n: 999, res, mal: esMal(res), fin: null };
    else { S.orden.res = res; S.orden.mal = esMal(res); }
    S.orden.fin = S.orden.n;
    bip(660, 0, 0.05, "triangle", 0.035); bip(990, 0, 0.08, "triangle", 0.03, 0.05);
  }
  function pasoOrden() {
    if (!S.orden) return;
    S.orden.n++;
    // Con resultado ya dado: aparece al terminar de teclear y se queda unos cuatro segundos
    if (S.orden.res != null) {
      if (S.orden.fin == null && S.orden.n > S.orden.cmd.length / 0.7 + 16) { S.orden.fin = S.orden.n; bip(660, 0, 0.04, "triangle", 0.03); }
      if (S.orden.fin != null && S.orden.n > S.orden.fin + 240) S.orden = null;
    }
  }
  function cierraOrden() { S.orden = null; }
  function dibujaOrden() {
    if (!S.orden || (S.estado !== "jugando" && S.estado !== "cierre")) return;
    const cabe = Math.floor((S.W - 6) / 4), listo = S.orden.res != null && S.orden.fin != null;
    const txt = listo ? S.orden.res : S.orden.cmd.slice(0, Math.floor(S.orden.n * 0.7)) + ((S.t >> 3) % 2 ? "_" : "");
    ctx.fillStyle = "rgba(0,0,0,.82)";
    ctx.fillRect(0, 9, S.W, 9);
    // Recién llega el resultado, parpadea un instante
    if (listo && S.orden.n - S.orden.fin < 16 && (S.t >> 1) % 2) return;
    letras(txt.slice(0, cabe), 3, 11, listo ? (S.orden.mal ? "#ff4d4d" : "#41B883") : "#ffffff");
  }

  /* ---------- 7. Las ventanas de combo ----------
     Ventanitas de terminal que se abren un momento sobre la orilla de la terminal de BIT
     (montadas en el borde, nunca en medio) y se cierran solas. Al principio sale una de vez en cuando; conforme crece
     la racha salen más seguido y caben más a la vez, hasta parecer una lluvia de terminales. Unas traen la cuenta del
     combo, otras los puntos; las de nivel nuevo y bug arcoíris salen en colores. Cada una suena a premio. */
  function lugaresVentana() {
    const r = S.rectL, ancho = r.left >= 170, L = [];
    // Con espacio a los lados: dieciséis puntos alrededor del marco. En el teléfono: solo arriba y abajo, para no tapar carriles
    if (ancho) {
      for (let i = 0; i < 5; i++) { L.push([r.left, r.top + r.height * (0.12 + i * 0.19)]); L.push([r.right, r.top + r.height * (0.2 + i * 0.19)]); }
      for (let i = 0; i < 3; i++) { L.push([r.left + r.width * (0.18 + i * 0.32), r.top - (i === 1 ? 8 : 0)]); L.push([r.left + r.width * (0.2 + i * 0.3), r.bottom + (i === 1 ? 10 : 0)]); }
    } else {
      for (let i = 0; i < 4; i++) L.push([r.left + r.width * (0.14 + i * 0.24), r.top - (i % 2 ? 8 : 0)]);
      for (let i = 0; i < 3; i++) L.push([r.left + r.width * (0.2 + i * 0.3), r.bottom + 12]);
    }
    return L;
  }
  // Cuántas caben a la vez según la racha: desde los 3 seguidos ya son dos, y de ahí sube rápido
  const cupoVentanas = () => (S.rectL && S.rectL.left >= 170 ? (S.combo < 5 ? 1 : S.combo < 20 ? 2 : S.combo < 50 ? 3 : 4) : S.combo < 10 ? 1 : S.combo < 40 ? 2 : 3);
  // Los gatos que de vez en cuando se asoman en una ventana de racha
  const GATOS = ["girando", "rapido", "buzo", "aplauso", "lover"];
  // Salen por turnos, sin repetir hasta que hayan pasado los cinco (el primero de todos, el buzo)
  S.bolsaG = ["girando", "aplauso", "lover", "rapido", "buzo"];
  const otroGato = () => { if (!S.bolsaG.length) S.bolsaG = GATOS.slice().sort(() => Math.random() - 0.5); return S.bolsaG.pop(); };
  // Pide una o varias ventanas: salen escalonadas, con unos cuadros entre una y otra
  function pideVentanas(n, clase, dato) {
    let espera = 0;
    for (let i = 0; i < n; i++) { S.colaV.push({ T: espera, clase: i ? (Math.random() < 0.5 ? "pts" : "combo") : clase, dato }); espera += 4 + ((Math.random() * 9) | 0); }
    if (S.colaV.length > 14) S.colaV.splice(0, S.colaV.length - 14);
  }
  // clase: "combo" (la cuenta), "pts" (puntos), "nivel" (nivel nuevo, en colores), "especial" (bug especial; el arcoíris, en colores)
  function abreCombo(clase, dato) {
    if (S.modo !== "ritmo" || S.estado !== "jugando" || !S.rectL) return;
    const abiertas = VENT.filter((v) => v.T > 0), cupo = cupoVentanas();
    // Si ya no cabe otra, la más vieja brinca de lugar: con mucha acción casi ni alcanza a abrirse
    const v = abiertas.length < cupo ? VENT.find((x) => x.T <= 0) : abiertas.reduce((a, b) => (b.T < a.T ? b : a));
    const L = lugaresVentana(), ocupados = abiertas.filter((x) => x !== v).map((x) => x.lugar);
    let lugar = (Math.random() * L.length) | 0;
    for (let i = 0; i < L.length && (ocupados.includes(lugar) || lugar === v.lugar); i++) lugar = (lugar + 1) % L.length;
    v.lugar = lugar;
    const nv = nivelCombo(), arco = clase === "nivel" || dato === "arco" || S.fiebre > S.ts;
    // El gato: casi siempre al subir de nivel de racha, a veces con un bug especial y muy rara vez porque sí; nunca dos seguidos
    const conGato = !RM && S.t - S.gatoUlt > 270 && (clase === "nivel" ? Math.random() < 0.7 : clase === "especial" ? Math.random() < 0.25 : S.combo >= 20 && Math.random() < 0.06);
    v.el.className = `j-ventana${S.rectL.left >= 170 ? "" : " chica"}${arco ? " arco" : ""}${clase === "pts" && !conGato ? " mini" : ""}${conGato ? " gato" : ""}`;
    if (conGato) { S.gatoUlt = S.t; v.gato.src = `images/gatos/${otroGato()}.webp`; }
    if (arco) v.el.style.removeProperty("--c"); else v.el.style.setProperty("--c", clase === "especial" ? "#ffe14a" : TONOS_COMBO[Math.min(nv, TONOS_COMBO.length - 1)]);
    if (clase === "pts") { v.tit.textContent = "SCORE.EXE"; v.num.textContent = `+${typeof dato === "number" ? dato : S.ultN}`; v.txt.textContent = seis(S.pts); }
    else if (clase === "nivel") { v.tit.textContent = "NIVEL.EXE"; v.num.textContent = `x${multi()}`; v.txt.textContent = T(NIVELES[nv - 1][1], NIVELES[nv - 1][2]); }
    else if (clase === "especial") { v.tit.textContent = "BONUS.EXE"; v.num.textContent = { oro: "+50", arco: "x2", anti: "MEM-", glitch: "+25" }[dato] || (BICHOS[dato] ? `+${typeof S.ultN === "number" ? S.ultN : ""}` : "+"); v.txt.textContent = { oro: T("DORADO", "GOLDEN"), arco: T("FIEBRE", "FEVER"), anti: "ANTIVIRUS", glitch: "GLITCH" }[dato] || (BICHOS[dato] ? BICHOS[dato].n : ""); }
    else { v.tit.textContent = "COMBO.EXE"; v.num.textContent = S.combo; v.txt.textContent = (nv ? `${T(NIVELES[nv - 1][1], NIVELES[nv - 1][2])} x${multi()}` : `x${multi()}`) + (S.secI === S.JEFE ? ` · MEM ${Math.round((S.peligro / S.JEFE_TOPE) * 100)}%` : ""); }
    v.el.hidden = false;
    const [x, y] = L[lugar], w = v.el.offsetWidth || 136, hh = v.el.offsetHeight || 60;
    v.el.style.left = `${Math.round(Math.max(w / 2 + 6, Math.min(window.innerWidth - w / 2 - 6, x)))}px`;
    v.el.style.top = `${Math.round(Math.max(hh / 2 + 6, Math.min(window.innerHeight - hh / 2 - 6, y)))}px`;
    if (!RM) { void v.el.offsetWidth; v.el.classList.add("abre"); }
    // Juegan con los tiempos: unas apenas parpadean, la mayoría dura un segundo y pico, y algunas se quedan un buen rato
    const azarT = Math.random();
    v.T = azarT < 0.3 ? 20 + ((Math.random() * 18) | 0) : azarT < 0.8 ? 55 + ((Math.random() * 45) | 0) : 130 + ((Math.random() * 70) | 0);
    if (conGato) v.T = Math.max(v.T, 120);
    // Premio para el oído: cada ventana sube un escalón de una escala alegre; mientras la racha siga, la melodía sigue
    // subiendo (al romperse vuelve a empezar). Subir de nivel suena a acorde. Muy juntas, solo suena la primera
    if (S.t - S.vUltSon > 8) {
      const f0 = 523.25 * Math.pow(2, [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24][S.vNota++ % 11] / 12);
      if (clase === "nivel") [0, 4, 7, 12].forEach((st, i) => bip(f0 * Math.pow(2, st / 12), 0, 0.1, "triangle", 0.04, i * 0.04));
      else { bip(f0, 0, 0.07, "triangle", 0.042); bip(f0 * 2, 0, 0.13, "sine", 0.026, 0.045); }
      if (conGato) bip(f0 * 3, f0 * 4, 0.12, "sine", 0.03, 0.12);
    }
    S.vUltSon = S.t;
  }
  // Al romperse el combo, las que estén abiertas se ponen rojas y se cierran
  function rompeVentanas() {
    S.colaV = []; S.vNota = 0;
    for (const v of VENT) if (v.T > 0) { v.el.classList.remove("arco"); v.el.classList.add("rota"); v.txt.textContent = T("COMBO ROTO", "COMBO LOST"); v.T = Math.min(v.T, 26); }
  }
  function pasoVentanas() {
    for (const v of VENT) if (v.T > 0 && --v.T === 0) v.el.hidden = true;
    for (const q of S.colaV) q.T--;
    while (S.colaV.length && S.colaV[0].T <= 0) { const q = S.colaV.shift(); abreCombo(q.clase, q.dato); }
  }
  /* El grito de racha: al subir de nivel de combo pasa un listón con la palabra. No sale siempre en el mismo sitio: cada vez
     elige un lugar distinto de la terminal (nunca encima de BIT, y de preferencia del lado contrario), algo ladeado, y se va
     en un segundo. El material del listón sube con la racha: papel, bronce, plata, oro y arcoíris.
     El multiplicador, en cambio, se queda en grande al fondo del recuadro mientras dure la racha (lo pinta dibuja()). */
  S.gritoN = 0; S.gritoLugar = -1;
  const LUGARES_GRITO = [[0.24, 0.24], [0.76, 0.24], [0.2, 0.42], [0.8, 0.42], [0.5, 0.36], [0.27, 0.64], [0.73, 0.64]];
  function grita(nv) {
    if (!S.rectL || nv < 1) return;
    const n = ++S.gritoN, queda = Math.min(1.3, 0.85 + nv * 0.04);
    // Los lugares del lado donde está BIT y a su altura quedan fuera; tampoco se repite el anterior
    const ladoBit = (S.bit.x + 5) / S.W, libres = LUGARES_GRITO.map((_, i) => i).filter((i) => i !== S.gritoLugar && !(LUGARES_GRITO[i][1] > 0.5 && Math.abs(LUGARES_GRITO[i][0] - ladoBit) < 0.3));
    S.gritoLugar = libres[(Math.random() * libres.length) | 0];
    const [lx, ly] = LUGARES_GRITO[S.gritoLugar];
    $("b", gEl).textContent = GRITOS[Math.min(nv, GRITOS.length) - 1];
    $("em", gEl).textContent = `x${1 + nv * 0.5}`;
    gEl.className = `j-grito g-${nv < 3 ? "papel" : nv < 5 ? "bronce" : nv < 7 ? "plata" : nv < 10 ? "oro" : "arco"}`;
    gEl.style.setProperty("--q", `${queda}s`);
    gEl.style.setProperty("--rot", `${(Math.random() * 10 - 5).toFixed(1)}deg`);
    gEl.style.left = `${S.rectL.left + S.rectL.width * lx}px`;
    gEl.style.top = `${S.rectL.top + S.rectL.height * ly}px`;
    // Se reinicia la animación aunque el grito anterior siga en pantalla
    gEl.hidden = true; void gEl.offsetWidth; gEl.hidden = false;
    setTimeout(() => { if (n === S.gritoN) gEl.hidden = true; }, (0.16 + queda + 0.22) * 1000);
  }
  function cierraVentana() { S.gritoN++; gEl.hidden = true; BB.ponAudio(null); S.colaV = []; for (const v of VENT) { v.el.hidden = true; v.T = 0; v.lugar = -1; } }
  // Cada nivel de combo alcanzado suma medio punto al multiplicador; con fiebre, todo vale el doble
  const nivelCombo = () => { let n = 0; while (n < NIVELES.length && S.combo >= NIVELES[n][0]) n++; return n; };
  const multi = () => (1 + nivelCombo() * 0.5) * (S.fiebre > S.ts ? 2 : 1);

  Object.assign(BB, { GATOS, LUGARES_GRITO, cupoVentanas, esMal, h2, leeCol, limpiaTxt, multi, nivelCombo, otroGato, seis });
})();
