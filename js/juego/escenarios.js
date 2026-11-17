/* ---------- BIT & BUGS · escenarios.js: el EDITOR DE ESCENARIOS (capas + pintar a mano + animar) ---------- */
/* Dos vistas:
     CAPAS   la pila de capas del escenario (de atrás hacia adelante), su vista previa en vivo (late a 120 BPM y simula
             ataques, aciertos y fallos) y las propiedades de la capa elegida. Plantillas para empezar.
     PINTAR  para las capas PINTURA: un lienzo de pixel art con lápiz, borrador, línea, rectángulo, círculo, cubeta, gotero,
             mover, seleccionar (copiar, cortar, pegar, voltear) y mano; grosor, espejo, cuadrícula, papel cebolla, zoom
             (CTRL + rueda), luz del fondo y una paleta de 16 colores que se puede cambiar.
             Cada capa tiene ESTADOS (animaciones con nombre: REPOSO, ATAQUE...), cada uno con sus cuadros, la duración de
             cada cuadro en segundos, si va en bucle o una vez, y cuándo se usa en el juego (reposo, al atacar, al acertar,
             al fallar). Un HISTORIAL con nombre de cada acción permite regresar a cualquier punto.
   Lo que se hace aquí se guarda en el navegador (escenas-propias.js) y aparece en el editor de ritmo como "MIS ESCENARIOS". */
(() => {
  "use strict";
  const BB = window.BitBugs, S = BB.S;
  const { $, T, bip, el, tactil, irA } = BB;
  Object.assign(BB, { abreEscenas, teclaEscenas });

  const PALETA = ["#000000", "#1d2b53", "#7e2553", "#008751", "#ab5236", "#5f574f", "#c2c3c7", "#fff1e8", "#ff004d", "#ffa300", "#ffec27", "#00e436", "#29adff", "#83769c", "#ff77a8", "#ffccaa"];
  const NOMBRES = { cielo: "CIELO", astro: "ASTRO", estrellas: "ESTRELLAS", fondo: "FONDO", silueta: "SILUETA", piso: "PISO", efecto: "EFECTO", pintura: "PINTURA" };
  // Cuándo se usa cada estado en el juego
  // Cuándo se usa cada estado en el juego: [id, nombre, explicación, grupo, número que pide (etiqueta, mínimo, máximo, por omisión)]
  const USOS = [
    ["reposo", T("REPOSO", "IDLE"), T("Siempre que no pasa nada más. Va en bucle.", "Whenever nothing else happens. Loops."), 0],
    ["ataque", T("AL ATACAR", "ON ATTACK"), T("Cuando sale un ataque del jefe (en tramos JEFE).", "When a boss attack starts (BOSS sections)."), 1],
    ["acierto", T("AL ACERTAR", "ON HIT"), T("Cada vez que atrapas un bug.", "Every time you catch a bug."), 1],
    ["fallo", T("AL FALLAR", "ON MISS"), T("Cada vez que se te escapa uno.", "Every time one gets away."), 1],
    ["combo", T("COMBO", "COMBO"), T("Cuando el combo llega a un múltiplo del número (10, 20, 30...).", "When the combo reaches a multiple of the number (10, 20, 30...)."), 1, [T("CADA", "EVERY"), 2, 200, 10]],
    ["golpes", T("CADA N GOLPES", "EVERY N BEATS"), T("Al ritmo: cada tantos golpes de la música (4 = cada compás).", "To the beat: every so many beats (4 = every bar)."), 2, [T("CADA", "EVERY"), 1, 64, 4]],
    ["tramo", T("AL EMPEZAR TRAMO", "SECTION START"), T("Cuando aparece el escenario (al empezar su tramo).", "When the scene appears (its section starts)."), 2],
    ["energia", T("MUSICA FUERTE", "LOUD MUSIC"), T("Mientras la canción suene fuerte (energía de 1 a 9: más alto = solo en lo más fuerte).", "While the song is loud (energy 1 to 9: higher = only the loudest parts)."), 2, [T("DESDE", "FROM"), 1, 9, 7]],
    ["evento", T("EVENTO", "EVENT"), T("Solo cuando tú lo pongas: en el editor de ritmo, ★ EVENTOS, eliges este estado y el segundo exacto (tecla V).", "Only when you place it: in the rhythm editor, ★ EVENTS, pick this state and the exact second (V key)."), 3],
    ["libre", T("SIN USO", "UNUSED"), T("No sale en el juego (borrador).", "Not shown in game (draft)."), 3]];
  const GRUPOS = [T("SIEMPRE", "ALWAYS"), T("REACCIONES", "REACTIONS"), T("RITMO", "RHYTHM"), T("TU DECIDES", "YOUR CALL")];
  // Lo que se puede ajustar de cada capa: [propiedad, tipo, etiqueta, opciones]
  const PROPS = {
    cielo: [["c", "cols", "COLORES (ARRIBA A ABAJO)"], ["estilo", "sel", "ESTILO", ["trama", "liso", "franjas", "lleno"]]],
    astro: [["forma", "sel", "FORMA", ["sol", "luna", "planeta"]], ["c", "cols", "COLORES"], ["x", "rango", "LUGAR DE LADO"], ["y", "rango", "ALTURA"], ["r", "rango", "TAMAÑO", [0.04, 0.45]], ["late", "si", "LATE CON EL GOLPE"]],
    estrellas: [["n", "rango", "CANTIDAD"], ["c", "col", "COLOR"], ["titila", "si", "TITILAN"], ["fugaces", "si", "ESTRELLAS FUGACES"]],
    fondo: [["forma", "sel", "FORMA", ["montanas", "colinas", "dunas"]], ["c", "col", "COLOR"], ["alto", "rango", "ALTURA", [0.05, 0.7]], ["desliza", "rango", "SE DESLIZA", [0, 1.5]]],
    silueta: [["forma", "sel", "FORMA", ["ciudad", "torres", "fabrica", "palmeras", "arboles", "crateres"]], ["c", "cols", "CUERPO · FILO · LUCES"], ["alto", "rango", "ALTURA", [0.1, 0.9]], ["dens", "rango", "DENSIDAD", [0.1, 0.85]], ["desliza", "rango", "SE DESLIZA", [0, 2]], ["luces", "sel", "VENTANAS", ["parpadean", "fijas", "no"]]],
    piso: [["forma", "sel", "FORMA", ["rejilla", "liso", "agua"]], ["c", "cols", "FONDO · LINEAS"], ["alto", "rango", "ALTURA", [0.05, 0.6]], ["vel", "rango", "VELOCIDAD", [0, 2]]],
    efecto: [["forma", "sel", "FORMA", ["reflectores", "lluvia", "nieve", "burbujas", "chispas", "codigo", "confeti"]], ["c", "col", "COLOR"], ["n", "rango", "CANTIDAD"], ["late", "si", "LATE CON EL GOLPE"]],
    pintura: [["x", "rango", "LUGAR DE LADO"], ["y", "rango", "ALTURA EN PANTALLA"], ["alto", "rango", "TAMAÑO", [0.05, 1.3]], ["mov", "sel", "MOVIMIENTO", ["nada", "flota", "late", "rebota"]], ["rep", "si", "REPETIR DE LADO (FONDO)"], ["desliza", "rango", "SE DESLIZA", [0, 2]], ["jefe", "si", "JEFE: SE SACUDE Y DESTELLA AL ATACAR"]],
  };
  const PLANTILLAS = {
    neon: ["NEON", (c) => [c("cielo", { c: ["#18084c", "#4c1088", "#a0247c", "#fc9c4c"] }), c("astro"), c("estrellas", { n: 0.3 }), c("silueta"), c("piso"), c("efecto", { forma: "reflectores", c: "#ff3fb4" })]],
    noche: ["NOCHE", (c) => [c("cielo", { c: ["#000010", "#0c0c6c", "#1c1cb4", "#2c64e4"] }), c("astro", { forma: "luna", c: ["#fff1e8", "#c2c3c7"], x: 0.8, y: 0.25, r: 0.08, late: false }), c("estrellas", { n: 0.7, fugaces: true }), c("fondo", { c: "#0c0c6c" }), c("silueta", { forma: "arboles", c: ["#000010", "#2c64e4", "#ffec27"], luces: "no" }), c("piso", { forma: "liso", c: ["#000010", "#1c1cb4"] })]],
    espacio: ["ESPACIO", (c) => [c("cielo", { c: ["#02010c", "#0c0634", "#1a0a4c", "#2c1264"], estilo: "lleno" }), c("estrellas", { n: 1, fugaces: true }), c("astro", { forma: "planeta", c: ["#fcd87c", "#a0247c"], x: 0.3, y: 0.4, r: 0.22, late: false }), c("efecto", { forma: "chispas", c: "#7cf4ff", n: 0.3 })]],
    bosque: ["BOSQUE", (c) => [c("cielo", { c: ["#04140c", "#0c3c2c", "#1c6c4c", "#7dffb4"] }), c("astro", { forma: "luna", c: ["#e4ffa8", "#7dffb4"], x: 0.7, y: 0.3, r: 0.1, late: false }), c("fondo", { forma: "colinas", c: "#0c3c2c" }), c("silueta", { forma: "arboles", c: ["#020a06", "#3fdc5a", "#ffec27"], alto: 0.55, luces: "no" }), c("piso", { forma: "liso", c: ["#020a06", "#3fdc5a"] }), c("efecto", { forma: "chispas", c: "#ffec27", n: 0.3, late: false })]],
    fabrica: ["FABRICA", (c) => [c("cielo", { c: ["#1c0404", "#6c1410", "#c83c1c", "#fc9c4c"], estilo: "franjas" }), c("silueta", { forma: "fabrica", c: ["#14141f", "#c83c1c", "#ffa300"] }), c("piso", { forma: "liso", c: ["#14141f", "#ffa300"] }), c("efecto", { forma: "chispas", c: "#ffa300", n: 0.7 })]],
  };
  // Herramientas: [id, icono, nombre, tecla]
  const HERRS = [["lapiz", "✎", T("LAPIZ", "PENCIL"), "B"], ["borra", "⌫", T("BORRADOR", "ERASER"), "E"], ["linea", "╱", T("LINEA", "LINE"), "L"], ["rect", "▭", T("RECTANGULO", "RECTANGLE"), "R"],
    ["rectl", "■", T("RECT. LLENO", "FILLED RECT"), "F"], ["circ", "◯", T("CIRCULO", "CIRCLE"), "O"], ["cubeta", "◍", T("CUBETA", "BUCKET"), "G"], ["gotero", "◉", T("GOTERO", "PICKER"), "I"],
    ["selec", "⬚", T("SELECCIONAR", "SELECT"), "S"], ["mover", "✥", T("MOVER TODO", "MOVE ALL"), "M"], ["mano", "✋", T("MANO (VISTA)", "HAND (VIEW)"), "H"]];
  const NOM_H = Object.fromEntries(HERRS.map((h) => [h[0], h[2]]));
  const ATAJOS = [["B E L R F O G I S M H", T("herramientas", "tools")], ["1 … 9", T("colores de la paleta", "palette colors")], [T("ALT + CLIC", "ALT + CLICK"), T("gotero rápido", "quick picker")], ["[  ]", T("grosor", "brush size")],
    ["X", T("espejo", "mirror")], ["K", T("centrar el dibujo", "center the drawing")], ["C", T("cuadrícula", "grid")], ["U", T("papel cebolla", "onion skin")], [T("CTRL + RUEDA  ·  +  −", "CTRL + WHEEL  ·  +  −"), T("acercar y alejar", "zoom in and out")], ["0", T("ajustar a la vista", "fit to view")],
    [T("RUEDA  ·  ESPACIO + ARRASTRAR", "WHEEL  ·  SPACE + DRAG"), T("mover la vista", "pan the view")], ["CTRL+Z  ·  CTRL+Y", T("deshacer y rehacer", "undo and redo")], ["CTRL + C  X  V", T("copiar, cortar, pegar", "copy, cut, paste")],
    [T("CTRL+A  ·  SUPR", "CTRL+A  ·  DEL"), T("seleccionar todo · borrar selección", "select all · delete selection")], ["SHIFT+H  ·  SHIFT+V", T("voltear (selección o cuadro)", "flip (selection or frame)")],
    ["←  →  ·  ,  .", T("cuadro anterior y siguiente", "previous and next frame")], ["N  ·  CTRL+D", T("cuadro nuevo · duplicar cuadro", "new frame · duplicate frame")], ["P", T("ver la animación", "play animation")],
    ["ENTER", T("soltar la selección", "drop the selection")], ["ESC", T("quitar selección · volver a capas", "deselect · back to layers")], [T("ARRASTRAR O PEGAR UNA IMAGEN", "DRAG OR PASTE AN IMAGE"), T("importarla al cuadro", "import it into the frame")], ["V", T("(editor de ritmo) evento en ese segundo", "(rhythm editor) event at that second")], ["CTRL+S", T("guardar", "save")]];
  const ZOOMS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 56, 64];

  /* ---------- Estado del editor ---------- */
  const leeLuz = () => { try { const v = parseFloat(localStorage.getItem("bbLuzLienzo")); return Number.isFinite(v) ? v : 0.08; } catch (e) { return 0.08; } };
  const X = { esc: null, vista: "capas", sel: 0, volver: null, raf: 0, HC: [], hci: 0, guardaT: 0, t0: performance.now(), disp: {}, juega: true, ayuda: false,
    // Pintar
    herr: "lapiz", grosor: 1, espejo: false, cuad: true, cebolla: true, col: 7, est: [], ei: 0, fi: 0, H: [], hi: 0, anima: false, trazo: null,
    combo: 0, energia: 3, evento: null, zoom: 0, pan: { x: 0, y: 0 }, tamAl: "cuadro", ancla: 4, luz: leeLuz(), espacio: false, selR: null, flot: null, clip: null, punteros: new Map(), pinch: null };
  S.escEd = X;
  const raiz = document.createElement("div");
  raiz.className = "je jx";
  raiz.hidden = true;
  el.appendChild(raiz);

  // Abre el editor de escenarios. o: { eid: escenario a abrir, volver: qué hacer al salir (recibe el id del escenario) }
  function abreEscenas(o = {}) {
    X.volver = o.volver || null;
    BB.cargaEscenas().then((l) => {
      let e = o.eid && l.find((x) => x.id === o.eid);
      if (!e) e = l[l.length - 1] || null;
      if (!e) { e = BB.escenarioNuevo(); BB.guardaEscena(e); }
      ponEscena(e);
      S.estado = "escenas"; S.modo = "clasico";
      BB.aviso(""); el.classList.add("je-on"); raiz.hidden = false;
      X.vista = "capas"; arma();
      cancelAnimationFrame(X.raf);
      const cuadro = () => { if (S.estado !== "escenas" || el.hidden) return; dibuja(); X.raf = requestAnimationFrame(cuadro); };
      X.raf = requestAnimationFrame(cuadro);
    });
  }
  function ponEscena(e) {
    X.esc = JSON.parse(JSON.stringify(e)); X.esc.capas.forEach(BB.normaliza); X.esc.paleta = X.esc.paleta || PALETA.slice();
    X.sel = Math.max(0, Math.min(X.sel, X.esc.capas.length - 1));
    X.HC = [{ n: T("ABRIR", "OPEN"), j: JSON.stringify(X.esc) }]; X.hci = 0;
  }
  function sale() {
    if (X.vista === "pintar") guardaCuadros();
    guardaYa();
    cancelAnimationFrame(X.raf);
    raiz.hidden = true; el.classList.remove("je-on");
    const fn = X.volver, eid = X.esc && X.esc.id;
    if (fn) fn(eid); else { S.estado = "titulo"; irA(BB.titulo); }
  }

  /* ---------- Historial de CAPAS (cada cambio con su nombre; los que se repiten seguidos se juntan) ---------- */
  function anotaC(n, clave) {
    const ult = X.HC[X.hci], j = JSON.stringify(X.esc);
    X.HC.length = X.hci + 1;
    if (clave && ult && ult.clave === clave && (Date.now() - ult.cuando < 1500 || clave.startsWith("pintar"))) { ult.j = j; ult.cuando = Date.now(); }
    else { X.HC.push({ n, j, clave, cuando: Date.now() }); if (X.HC.length > 80) X.HC.splice(1, 1); X.hci = X.HC.length - 1; }
    clearTimeout(X.guardaT); X.guardaT = setTimeout(guardaYa, 800);
  }
  function cambia(n, fn, clave) { fn(); anotaC(n, clave); pinta(); }
  function irHC(i) {
    if (i < 0 || i >= X.HC.length) { bip(160, 110, 0.1, "square", 0.03); return; }
    X.hci = i; X.esc = JSON.parse(X.HC[i].j); X.sel = Math.max(0, Math.min(X.sel, X.esc.capas.length - 1));
    clearTimeout(X.guardaT); X.guardaT = setTimeout(guardaYa, 800); pinta();
  }
  function guardaYa(aviso) { clearTimeout(X.guardaT); if (!X.esc) return; BB.guardaEscena(JSON.parse(JSON.stringify(X.esc))).then(() => { if (aviso) nota(T("Guardado en este navegador.", "Saved in this browser.")); }).catch(() => nota(T("No se pudo guardar: exporta el escenario para no perderlo.", "Couldn't save: export the scene so you don't lose it."))); }
  const nota = (txt) => { const p = $(".jx-nota", raiz); if (p) p.textContent = txt; };
  const limpia = (s) => String(s).replace(/[<>&"]/g, (ch) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[ch]);
  const k = (txt) => (tactil ? "" : `[${txt}] `);
  const kbd = (txt) => (tactil || !txt ? "" : `<kbd>${txt}</kbd>`);
  const historial = (lista, i, accion) => `<p class="je-tit">${T("HISTORIAL", "HISTORY")}</p><div class="jx-hist">${lista.map((h, j) => `<button type="button" class="jx-h${j === i ? " on" : j > i ? " fut" : ""}" data-x="${accion}" data-v="${j}">${j + 1}. ${limpia(h.n)}</button>`).join("")}</div>`;

  /* ---------- La pantalla ---------- */
  function arma() {
    const lista = S.misEscenas.map((e) => `<option value="${e.id}"${e.id === X.esc.id ? " selected" : ""}>${limpia(e.nombre)}</option>`).join("");
    raiz.innerHTML = `
      <div class="je-bar"><span>C:\\BIT.EXE · ${T("EDITOR DE ESCENARIOS", "SCENE EDITOR")}</span><button type="button" data-x="salir">${k("ESC")}${X.volver ? T("VOLVER", "BACK") : T("SALIR", "EXIT")}</button></div>
      <div class="je-trans">
        <span class="je-k">${T("ESCENARIO", "SCENE")}</span><select class="je-in jx-lista" aria-label="${T("Escenario", "Scene")}">${lista}</select>
        <input class="je-in je-nom jx-nom" maxlength="20" value="${limpia(X.esc.nombre)}" aria-label="${T("Nombre", "Name")}">
        <button type="button" class="je-b" data-x="nuevo">+ ${T("NUEVO", "NEW")}</button><button type="button" class="je-b" data-x="duplica">${T("DUPLICAR", "DUPLICATE")}</button><button type="button" class="je-b" data-x="borraesc">${T("BORRAR", "DELETE")}</button>
        <button type="button" class="je-b" data-x="exporta">${T("EXPORTAR", "EXPORT")}</button><button type="button" class="je-b" data-x="importa">${T("IMPORTAR", "IMPORT")}</button>
        <button type="button" class="je-b je-y" data-x="guardar">${k("CTRL+S")}${T("GUARDAR", "SAVE")}</button>
      </div>
      <div class="jx-cuerpo"></div>
      <p class="je-ayuda jx-nota"></p>`;
    $(".jx-lista", raiz).addEventListener("change", (e) => { if (X.vista === "pintar") guardaCuadros(); guardaYa(); const n = S.misEscenas.find((x) => x.id === e.target.value); if (n) { ponEscena(n); X.vista = "capas"; arma(); } });
    $(".jx-nom", raiz).addEventListener("change", (e) => { X.esc.nombre = e.target.value.trim().toUpperCase().slice(0, 20) || "SIN NOMBRE"; anotaC(T("Renombrar escenario", "Rename scene")); });
    pinta();
  }
  // Repintar los paneles sin que se pierda el lugar donde iba cada uno (en el teléfono, toda la pantalla se desliza)
  function pinta() {
    if (S.estado !== "escenas" && raiz.hidden) return;
    const cu = $(".jx-cuerpo", raiz);
    if (!cu) return;
    const st = raiz.scrollTop, vista = cu.dataset.vista, pan = [...cu.querySelectorAll(".je-panel")].map((p) => p.scrollTop);
    pintaVista(cu);
    raiz.scrollTop = st;
    if (vista === X.vista) cu.querySelectorAll(".je-panel").forEach((p, i) => { p.scrollTop = pan[i] || 0; });
    cu.dataset.vista = X.vista;
    cu.querySelectorAll(".jx-hist").forEach((h) => { const on = h.querySelector(".on"); if (on) h.scrollTop = on.offsetTop - h.clientHeight + on.offsetHeight + 4; });
  }
  function pintaVista(cu) {
    if (X.vista === "pintar") { pintaPintar(cu); return; }
    const e = X.esc, c = e.capas[X.sel];
    cu.className = "jx-cuerpo jx-capas";
    cu.innerHTML = `
      <div class="je-panel"><p class="je-tit">${T("CAPAS · DE ATRAS ADELANTE", "LAYERS · BACK TO FRONT")}</p>
        ${e.capas.map((x, i) => `<div class="jx-capa${i === X.sel ? " on" : ""}"><button type="button" class="jx-ojo" data-x="ojo" data-v="${i}" aria-label="${T("Mostrar u ocultar", "Show or hide")}">${x.on ? "◉" : "○"}</button><button type="button" class="jx-cn" data-x="capa" data-v="${i}">${i + 1} ${NOMBRES[x.k]}<i>${x.forma || (x.k === "pintura" ? `${x.estados.length} ${x.estados.length === 1 ? T("ESTADO", "STATE") : T("ESTADOS", "STATES")}${x.jefe ? " · JEFE" : ""}` : "")}</i></button></div>`).join("")}
        <p class="je-fila"><button type="button" class="je-b" data-x="sube">${T("SUBIR", "UP")}</button><button type="button" class="je-b" data-x="baja">${T("BAJAR", "DOWN")}</button><button type="button" class="je-b" data-x="quita">${k(T("SUPR", "DEL"))}${T("QUITAR", "REMOVE")}</button></p>
        <p class="je-k">+ ${T("CAPA", "LAYER")}</p><p class="je-fila">${Object.keys(NOMBRES).map((n) => `<button type="button" class="je-b${n === "pintura" ? " je-y" : ""}" data-x="agrega" data-v="${n}">${NOMBRES[n]}</button>`).join("")}</p>
        <p class="je-k">${T("PLANTILLAS (REEMPLAZAN LAS CAPAS)", "TEMPLATES (REPLACE LAYERS)")}</p><p class="je-fila">${Object.entries(PLANTILLAS).map(([n, [t]]) => `<button type="button" class="je-b" data-x="plantilla" data-v="${n}">${t}</button>`).join("")}</p>
        <p class="je-fila"><button type="button" class="je-b" data-x="cdeshaz">${k("CTRL+Z")}${T("DESHACER", "UNDO")}</button><button type="button" class="je-b" data-x="crehaz">${k("CTRL+Y")}${T("REHACER", "REDO")}</button></p>
        ${historial(X.HC, X.hci, "hc")}
      </div>
      <div class="jx-prev"><canvas class="jx-vista" width="320" height="180"></canvas>
        <p class="je-fila"><button type="button" class="je-b${X.juega ? " on" : ""}" data-x="juega">${X.juega ? "❚❚" : "▶"} ${T("MOVIMIENTO", "MOTION")}</button><span class="je-k">${T("VISTA PREVIA · LATE A 120 BPM", "PREVIEW · PULSES AT 120 BPM")}</span></p>
        <p class="je-fila"><span class="je-k">${T("SIMULAR", "SIMULATE")}</span><button type="button" class="je-b" data-x="disp" data-v="ataque">⚡ ${T("ATAQUE", "ATTACK")}</button><button type="button" class="je-b" data-x="disp" data-v="acierto">✓ ${T("ACIERTO", "HIT")}</button><button type="button" class="je-b" data-x="disp" data-v="fallo">✗ ${T("FALLO", "MISS")}</button><button type="button" class="je-b" data-x="disp" data-v="tramo">▶ ${T("TRAMO", "SECTION")}</button></p>
        <p class="je-fila"><span class="je-k">COMBO <b class="jx-combo">${X.combo || 0}</b></span><span class="je-k">${T("ENERGIA", "ENERGY")}</span><input type="range" class="jx-rango jx-energ" min="0" max="9" step="1" value="${X.energia}" aria-label="${T("Energía de la música", "Music energy")}"><b class="je-k jx-energv">${X.energia}</b></p>
        ${(() => { const ns = [...new Set(e.capas.filter((x) => x.k === "pintura").flatMap((x) => x.estados.filter((q) => q.uso !== "reposo").map((q) => q.n)))]; return ns.length ? `<p class="je-fila"><span class="je-k">★ ${T("EVENTO", "EVENT")}</span>${ns.map((n) => `<button type="button" class="je-b" data-x="evento" data-v="${limpia(n)}">${limpia(n)}</button>`).join("")}</p>` : ""; })()}</div>
      <div class="je-panel jx-props">${c ? props(c) : ""}</div>`;
    cu.querySelectorAll("[data-p]").forEach((inp) => inp.addEventListener("input", (ev) => cambiaProp(ev.target)));
    { const en = $(".jx-energ", cu); if (en) en.addEventListener("input", () => { X.energia = +en.value; $(".jx-energv", cu).textContent = X.energia; }); }
  }
  function props(c) {
    const lista = PROPS[c.k] || [];
    return `<p class="je-tit">${NOMBRES[c.k]}</p>` + (c.k === "pintura" ? `<p class="je-fila"><button type="button" class="je-b je-y" data-x="pintar">✎ ${k("ENTER")}${T("PINTAR Y ANIMAR", "PAINT AND ANIMATE")}</button><span class="je-k">${c.w} × ${c.h} · ${c.estados.map((q) => limpia(q.n)).join(" · ")}</span></p>` : "")
      + lista.map(([p, tipo, et, op]) => {
        const v = c[p];
        if (tipo === "sel") return `<p class="je-k">${et}</p><p class="je-fila">${op.map((o) => `<button type="button" class="je-b${v === o ? " on" : ""}" data-x="prop" data-p2="${p}" data-v="${o}">${o.toUpperCase()}</button>`).join("")}</p>`;
        if (tipo === "si") return `<p class="je-fila"><button type="button" class="je-b${v ? " on" : ""}" data-x="prop" data-p2="${p}" data-v="${v ? "0" : "1"}" data-b="1">${v ? "■" : "□"} ${et}</button></p>`;
        if (tipo === "col") return `<p class="je-k">${et}</p><p class="je-fila"><input type="color" class="jx-col" data-p="${p}" value="${v}"></p>`;
        if (tipo === "cols") return `<p class="je-k">${et}</p><p class="je-fila">${v.map((cc, i) => `<input type="color" class="jx-col" data-p="${p}" data-i="${i}" value="${cc}">`).join("")}</p>`;
        const [mn, mx, st] = op || [0, 1, 0.01];
        return `<p class="je-k">${et} <b>${Math.round(((v - mn) / (mx - mn)) * 100)}%</b></p><input type="range" class="jx-rango" data-p="${p}" min="${mn}" max="${mx}" step="${st || 0.01}" value="${v}">`;
      }).join("");
  }
  function cambiaProp(inp) {
    const c = X.esc.capas[X.sel], p = inp.dataset.p;
    if (!c) return;
    const v = inp.type === "range" ? +inp.value : inp.value;
    if (inp.dataset.i != null) c[p][+inp.dataset.i] = v; else c[p] = v;
    if (inp.type === "range") { const b = inp.previousElementSibling && inp.previousElementSibling.querySelector("b"); if (b) b.textContent = Math.round(((v - +inp.min) / (+inp.max - +inp.min)) * 100) + "%"; }
    // Arrastrar un control es UN cambio en el historial (no uno por cada paso)
    anotaC(`${NOMBRES[c.k]}: ${T("ajustar", "adjust")} ${p}`, `${X.sel}:${p}:${inp.dataset.i}`);
    const h = $(".jx-hist", raiz); if (h) { h.innerHTML = X.HC.map((q, j) => `<button type="button" class="jx-h${j === X.hci ? " on" : j > X.hci ? " fut" : ""}" data-x="hc" data-v="${j}">${j + 1}. ${limpia(q.n)}</button>`).join(""); h.scrollTop = h.scrollHeight; }
  }

  /* ---------- Acciones ---------- */
  function accion(a, v, b) {
    const e = X.esc, i = X.sel;
    switch (a) {
      case "salir": sale(); break;
      case "guardar": if (X.vista === "pintar") guardaCuadros(); guardaYa(true); break;
      case "nuevo": if (X.vista === "pintar") guardaCuadros(); guardaYa(); { const n = BB.escenarioNuevo(); BB.guardaEscena(n).then(() => { ponEscena(n); X.vista = "capas"; arma(); }); } break;
      case "duplica": if (X.vista === "pintar") guardaCuadros(); guardaYa(); { const n = JSON.parse(JSON.stringify(e)); n.id = BB.escenarioNuevo().id; n.nombre = `${e.nombre} 2`.slice(0, 20); n.fecha = Date.now(); BB.guardaEscena(n).then(() => { ponEscena(n); X.vista = "capas"; arma(); nota(T("Duplicado.", "Duplicated.")); }); } break;
      case "borraesc":
        if (b.dataset.seguro !== "1") { b.dataset.seguro = "1"; b.textContent = T("¿SEGURO? BORRAR", "SURE? DELETE"); b.classList.add("on"); return; }
        BB.borraEscena(e.id).then(() => BB.cargaEscenas()).then((l) => { let n = l[l.length - 1]; if (!n) { n = BB.escenarioNuevo(); BB.guardaEscena(n); } ponEscena(n); X.vista = "capas"; arma(); nota(T("Escenario borrado.", "Scene deleted.")); });
        break;
      case "exporta": exporta(); break;
      case "importa": entradaJson.click(); break;
      case "capa": X.sel = +v; pinta(); break;
      case "ojo": cambia(e.capas[+v].on ? T("Ocultar capa", "Hide layer") : T("Mostrar capa", "Show layer"), () => { e.capas[+v].on = !e.capas[+v].on; }); break;
      case "sube": if (i < e.capas.length - 1) { X.sel = i + 1; cambia(T("Subir capa", "Move layer up"), () => { const [c] = e.capas.splice(i, 1); e.capas.splice(i + 1, 0, c); }); } break;
      case "baja": if (i > 0) { X.sel = i - 1; cambia(T("Bajar capa", "Move layer down"), () => { const [c] = e.capas.splice(i, 1); e.capas.splice(i - 1, 0, c); }); } break;
      case "quita": if (e.capas.length > 1) { const n = NOMBRES[e.capas[i].k]; X.sel = Math.max(0, i - 1); cambia(`${T("Quitar", "Remove")} ${n}`, () => e.capas.splice(i, 1)); } break;
      case "agrega": X.sel = i + 1; cambia(`${T("Agregar", "Add")} ${NOMBRES[v]}`, () => { e.capas.splice(i + 1, 0, BB.capaNueva(v)); }); if (v === "pintura") nota(T("Capa nueva: toca PINTAR Y ANIMAR para dibujarla.", "New layer: tap PAINT AND ANIMATE to draw it.")); break;
      case "plantilla": X.sel = 0; cambia(`${T("Plantilla", "Template")} ${PLANTILLAS[v][0]}`, () => { const pintadas = e.capas.filter((c) => c.k === "pintura"); e.capas = PLANTILLAS[v][1]((kk, o) => Object.assign(BB.capaNueva(kk), o || {})).concat(pintadas); }); break;
      case "prop": { const c = e.capas[i]; cambia(`${NOMBRES[c.k]}: ${b.dataset.p2}`, () => { c[b.dataset.p2] = b.dataset.b ? v === "1" : v; }); } break;
      case "cdeshaz": irHC(X.hci - 1); break;
      case "crehaz": irHC(X.hci + 1); break;
      case "hc": irHC(+v); break;
      case "juega": X.juega = !X.juega; if (!X.juega) X.tPausa = (performance.now() - X.t0) / 1000; else X.t0 = performance.now() - (X.tPausa || 0) * 1000; pinta(); break;
      case "disp": X.disp[v] = ahora(); if (v === "ataque") bip(900, 80, 0.2, "sawtooth", 0.05); if (v === "acierto") X.combo = (X.combo || 0) + 1; if (v === "fallo") X.combo = 0; { const cb = $(".jx-combo", raiz); if (cb) cb.textContent = X.combo || 0; } break;
      case "evento": X.evento = { n: v, t: ahora() }; break;
      case "pintar": entraPintar(); break;
      // Pintar
      case "herr": ponHerr(v); break;
      case "grosor": X.grosor = +v; pinta(); break;
      case "espejo": X.espejo = !X.espejo; pinta(); break;
      case "cuad": X.cuad = !X.cuad; pinta(); break;
      case "cebolla": X.cebolla = !X.cebolla; pinta(); break;
      case "ayuda": X.ayuda = !X.ayuda; pinta(); break;
      case "color": X.col = +v; pinta(); break;
      case "pdeshaz": irH(X.hi - 1); break;
      case "prehaz": irH(X.hi + 1); break;
      case "h": irH(+v); break;
      case "plimpia": sinSel(); { const im = cuadro(); X.est[X.ei].frames[X.fi].im = new ImageData(im.width, im.height); } anota(T("Limpiar cuadro", "Clear frame")); break;
      case "pimagen": entradaImg.click(); break;
      case "imp": accionImp(v); break;
      case "imppal": { const cs = (IMP.res || procesa()).colores.slice(0, 16); cs.forEach((c, i) => { X.esc.paleta[i] = c; }); nota(T(`Paleta: ${cs.length} colores de la imagen.`, `Palette: ${cs.length} colors from the image.`)); clearTimeout(X.guardaT); X.guardaT = setTimeout(guardaYa, 800); pinta(); } break;
      case "impok": aplicaImportar(); break;
      case "impno": X.imp = false; pinta(); break;
      case "zoom": zoomA(v === "+" ? 1 : v === "-" ? -1 : 0); break;
      case "cuadro": irCuadro(X.ei, +v); break;
      case "cnuevo": sinSel(); { const fr = X.est[X.ei].frames, d = fr[X.fi].d; fr.splice(X.fi + 1, 0, { im: new ImageData(cuadro().width, cuadro().height), d }); X.fi++; } anota(T("Nuevo cuadro", "New frame")); break;
      case "cdup": sinSel(); { const fr = X.est[X.ei].frames; fr.splice(X.fi + 1, 0, { ...fr[X.fi] }); X.fi++; } anota(T("Duplicar cuadro", "Duplicate frame")); break;
      case "cborra": { const fr = X.est[X.ei].frames; if (fr.length > 1) { sinSel(); fr.splice(X.fi, 1); X.fi = Math.max(0, X.fi - 1); anota(T("Borrar cuadro", "Delete frame")); } } break;
      case "cizq": case "cder": { const fr = X.est[X.ei].frames, d = a === "cizq" ? -1 : 1, j = X.fi + d; if (j >= 0 && j < fr.length) { const [q] = fr.splice(X.fi, 1); fr.splice(j, 0, q); X.fi = j; anota(T("Mover cuadro", "Move frame")); } } break;
      case "durtodos": { const fr = X.est[X.ei].frames, d = fr[X.fi].d; fr.forEach((f) => { f.d = d; }); anota(`${T("Duración a todos", "Duration to all")}: ${d}s`); } break;
      case "estado": irCuadro(+v, 0); break;
      case "enuevo": sinSel(); { const n = BB.estadoNuevo(`${T("ESTADO", "STATE")} ${X.est.length + 1}`, "libre"); X.est.push({ ...n, frames: [{ im: new ImageData(capaP().w, capaP().h), d: 0.15 }] }); X.ei = X.est.length - 1; X.fi = 0; } anota(T("Nuevo estado", "New state")); break;
      case "edup": sinSel(); { const q = X.est[X.ei]; X.est.splice(X.ei + 1, 0, { ...q, n: `${q.n} 2`.slice(0, 14), uso: "libre", frames: q.frames.map((f) => ({ ...f })) }); X.ei++; X.fi = 0; } anota(T("Duplicar estado", "Duplicate state")); break;
      case "eborra": if (X.est.length > 1) { sinSel(); const n = X.est[X.ei].n; X.est.splice(X.ei, 1); X.ei = Math.max(0, X.ei - 1); X.fi = 0; if (!X.est.some((q) => q.uso === "reposo")) X.est[0].uso = "reposo"; anota(`${T("Borrar estado", "Delete state")} ${n}`); } break;
      case "euso": { const q = X.est[X.ei], u = USOS.find((x) => x[0] === v); if (v === "reposo") X.est.forEach((o) => { if (o !== q && o.uso === "reposo") o.uso = "libre"; }); q.uso = v; if (v === "reposo" || v === "energia") q.loop = true; if (u[4] && !(q.p >= u[4][1])) q.p = u[4][3]; anota(`${q.n}: ${USOS.find((u) => u[0] === v)[1]}`); } break;
      case "eloop": { const q = X.est[X.ei]; q.loop = !q.loop; anota(`${q.n}: ${q.loop ? T("en bucle", "loop") : T("una vez", "once")}`); } break;
      case "egolpe": { const q = X.est[X.ei]; q.golpe = !q.golpe; anota(`${q.n}: ${q.golpe ? T("al ritmo", "to the beat") : T("por segundos", "by seconds")}`); } break;
      case "anima": X.anima = !X.anima; X.tAnima = performance.now(); pinta(); break;
      case "luzp": X.luz = +v; guardaLuz(); pinta(); break;
      case "tam": { const [w, hh] = v.split("x").map(Number); cambiaTam(w, hh); } break;
      case "tamok": cambiaTam(+$(".jx-tw", raiz).value, +$(".jx-th", raiz).value); break;
      case "tamal": X.tamAl = v; pinta(); break;
      case "ancla": X.ancla = +v; pinta(); break;
      case "centra": centra("centro", false); break;
      case "centraq": centra("centro", true); break;
      case "piso": centra("piso", false); break;
      case "listo": guardaCuadros(); X.vista = "capas"; pinta(); break;
    }
  }
  raiz.addEventListener("click", (ev) => { const b = ev.target.closest("[data-x]"); if (!b || b.disabled) return; accion(b.dataset.x, b.dataset.v, b); });
  const ahora = () => (X.juega ? (performance.now() - X.t0) / 1000 : X.tPausa || 0);
  function guardaLuz() { try { localStorage.setItem("bbLuzLienzo", String(X.luz)); } catch (e) { /* nada */ } }
  // Exportar e importar un escenario (con sus dibujos) como .json
  function exporta() {
    if (X.vista === "pintar") guardaCuadros();
    guardaYa();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ formato: "bitbugs-escenario", version: 2, escenario: X.esc })], { type: "application/json" }));
    a.download = `${X.esc.nombre.replace(/[^\w\-]+/g, "_")}.escenario.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    nota(T("Escenario exportado.", "Scene exported."));
  }
  const entradaJson = Object.assign(document.createElement("input"), { type: "file", accept: ".json,application/json", hidden: true });
  el.appendChild(entradaJson);
  const srcOk = (x) => typeof x === "string" && (x === "" || x.startsWith("data:image/png"));
  entradaJson.addEventListener("change", () => {
    const f = entradaJson.files && entradaJson.files[0]; entradaJson.value = "";
    if (!f) return;
    f.text().then((txt) => {
      const d = JSON.parse(txt), e = d && d.escenario;
      if (d.formato !== "bitbugs-escenario" || !e || !Array.isArray(e.capas)) throw new Error("formato");
      e.capas = e.capas.filter((c) => c && NOMBRES[c.k]).map((c) => {
        const n = Object.assign(BB.capaNueva(c.k), c);
        if (c.k !== "pintura") return n;
        if (!Array.isArray(n.estados)) { n.frames = (c.frames || []).filter(srcOk); delete n.estados; BB.normaliza(n); }
        n.estados = n.estados.filter((q) => q && Array.isArray(q.frames)).map((q) => ({ n: String(q.n || "ESTADO").toUpperCase().slice(0, 14), uso: USOS.some((u) => u[0] === q.uso) ? q.uso : "libre", ...(+q.p > 0 ? { p: Math.min(200, Math.round(+q.p)) } : {}), loop: !!q.loop, golpe: !!q.golpe,
          frames: q.frames.filter((fr) => fr && srcOk(fr.src)).map((fr) => ({ src: fr.src, d: Math.max(0.02, Math.min(5, +fr.d || 0.15)), ...(fr.w > 0 && fr.h > 0 ? { w: Math.min(400, Math.round(fr.w)), h: Math.min(400, Math.round(fr.h)) } : {}) })) })).filter((q) => q.frames.length);
        if (!n.estados.length) n.estados = [BB.estadoNuevo()];
        return n;
      });
      e.id = BB.escenarioNuevo().id; e.fecha = Date.now(); e.nombre = String(e.nombre || "IMPORTADO").toUpperCase().slice(0, 20);
      return BB.guardaEscena(e).then(() => { ponEscena(e); X.vista = "capas"; arma(); nota(T("Escenario importado.", "Scene imported.")); });
    }).catch(() => { nota(T("Ese archivo no es un escenario de BIT & BUGS.", "That file is not a BIT & BUGS scene.")); bip(160, 110, 0.18, "square", 0.05); });
  });

  /* ---------- PINTAR: estados, cuadros e historial ---------- */
  const capaP = () => X.esc.capas[X.sel];
  const cuadro = () => X.est[X.ei].frames[X.fi].im;
  const copia = (im) => new ImageData(new Uint8ClampedArray(im.data), im.width, im.height);
  // Las imágenes no se cambian nunca en su lugar: cada acción trabaja sobre una copia. Así el historial solo guarda
  // referencias (cuesta poco) y puede regresar a cualquier punto
  const escribe = () => { const f = X.est[X.ei].frames[X.fi]; f.im = copia(f.im); return f.im; };
  const foto = () => ({ est: X.est.map((q) => ({ ...q, frames: q.frames.map((f) => ({ ...f })) })), ei: X.ei, fi: X.fi, w: capaP().w, h: capaP().h });
  function anota(n) {
    X.H.length = X.hi + 1;
    X.H.push({ n, s: foto() });
    if (X.H.length > 100) X.H.splice(1, 1);
    X.hi = X.H.length - 1;
    marcaSucio(); pinta();
  }
  function irH(i) {
    if (i < 0 || i >= X.H.length) { bip(160, 110, 0.1, "square", 0.03); return; }
    X.hi = i; X.selR = null; X.flot = null;
    const s = X.H[i].s, c = capaP();
    X.est = s.est.map((q) => ({ ...q, frames: q.frames.map((f) => ({ ...f })) })); X.ei = Math.min(s.ei, X.est.length - 1); X.fi = Math.min(s.fi, X.est[X.ei].frames.length - 1);
    c.w = s.w; c.h = s.h;
    marcaSucio(); pinta();
  }
  let sucio = false;
  function marcaSucio() { sucio = true; clearTimeout(X.guardaT); X.guardaT = setTimeout(() => { if (X.vista === "pintar") guardaCuadros(); guardaYa(); }, 1500); }
  function irCuadro(ei, fi) { sinSel(); X.ei = Math.max(0, Math.min(X.est.length - 1, ei)); X.fi = Math.max(0, Math.min(X.est[X.ei].frames.length - 1, fi)); pinta(); }
  function sinSel() { X.selR = null; X.flot = null; }
  function ponHerr(h) { if (h !== "selec") X.flot = null; X.herr = h; pinta(); }

  function entraPintar() {
    const c = capaP();
    if (!c || c.k !== "pintura") return;
    BB.normaliza(c);
    X.vista = "pintar"; X.ei = Math.max(0, c.estados.findIndex((q) => q.uso === "reposo")); X.fi = 0; X.anima = false; X.zoom = 0; X.pan = { x: 0, y: 0 }; sinSel();
    X.est = c.estados.map((q) => ({ n: q.n, uso: q.uso, p: q.p, loop: q.loop, golpe: q.golpe, frames: q.frames.map((f) => ({ im: new ImageData(f.w || c.w, f.h || c.h), d: f.d || 0.15 })) }));
    X.H = []; X.hi = -1;
    // Los cuadros guardados se decodifican (tardan un instante)
    const carga = [];
    c.estados.forEach((q, i) => q.frames.forEach((f, j) => { if (!f.src) return; carga.push(new Promise((ok) => { const im = new Image(); im.onload = () => { const w = f.w || im.naturalWidth || c.w, hh = f.h || im.naturalHeight || c.h, cv = Object.assign(document.createElement("canvas"), { width: w, height: hh }), x = cv.getContext("2d"); x.drawImage(im, 0, 0); X.est[i].frames[j].im = x.getImageData(0, 0, w, hh); srcs.set(X.est[i].frames[j].im, f.src); ok(); }; im.onerror = ok; im.src = f.src; })); }));
    Promise.all(carga).then(() => { X.H = [{ n: T("ABRIR", "OPEN"), s: foto() }]; X.hi = 0; sucio = false; pinta(); });
    pinta();
  }
  // De vuelta a la capa: cada cuadro se guarda como PNG (los que no cambiaron reusan el que ya tenían)
  const srcs = new WeakMap();
  function srcDe(im) {
    if (srcs.has(im)) return srcs.get(im);
    let s = "";
    if (im.data.some((v, i) => i % 4 === 3 && v)) { const cv = Object.assign(document.createElement("canvas"), { width: im.width, height: im.height }); cv.getContext("2d").putImageData(im, 0, 0); s = cv.toDataURL("image/png"); }
    srcs.set(im, s); return s;
  }
  function guardaCuadros() {
    const c = capaP();
    if (!c || c.k !== "pintura" || !X.est.length) return;
    const antes = JSON.stringify(c.estados);
    c.estados = X.est.map((q) => ({ n: q.n, uso: q.uso, ...(q.p ? { p: q.p } : {}), loop: q.loop, golpe: q.golpe, frames: q.frames.map((f) => ({ src: srcDe(f.im), d: f.d, w: f.im.width, h: f.im.height })) }));
    if (sucio || JSON.stringify(c.estados) !== antes) anotaC(`${T("Pintar", "Paint")}: ${NOMBRES.pintura} ${X.sel + 1}`, `pintar${X.sel}`);
    sucio = false;
  }
  // Cambiar el tamaño del lienzo: solo a ESTE CUADRO, a ESTE ESTADO o a TODA LA CAPA. Lo dibujado no se corta a ciegas:
  // se acomoda según el ANCLA (centro, arriba, abajo, una esquina...). La escala en el juego la marca el tamaño de la capa,
  // así que un cuadro más grande se ve más grande (no se encoge)
  function cambiaTam(w, hh) {
    const c = capaP();
    w = Math.max(4, Math.min(400, Math.round(w) || 0)); hh = Math.max(4, Math.min(400, Math.round(hh) || 0));
    if (!w || !hh) return;
    const ax = X.ancla % 3, ay = Math.floor(X.ancla / 3);
    const ajusta = (im) => {
      if (im.width === w && im.height === hh) return im;
      const n = new ImageData(w, hh), dx = ax === 0 ? 0 : ax === 1 ? Math.floor((w - im.width) / 2) : w - im.width, dy = ay === 0 ? 0 : ay === 1 ? Math.floor((hh - im.height) / 2) : hh - im.height;
      sella(n, im, dx, dy); return n;
    };
    sinSel();
    const lista = X.tamAl === "cuadro" ? [X.est[X.ei].frames[X.fi]] : X.tamAl === "estado" ? X.est[X.ei].frames : X.est.flatMap((q) => q.frames);
    lista.forEach((f) => { f.im = ajusta(f.im); });
    if (X.tamAl === "capa") { c.w = w; c.h = hh; }
    X.zoom = 0; X.pan = { x: 0, y: 0 };
    anota(`${T("Lienzo", "Canvas")} ${w}×${hh} (${{ cuadro: T("cuadro", "frame"), estado: T("estado", "state"), capa: T("capa", "layer") }[X.tamAl]})`);
  }
  // Centrar el dibujo: el del cuadro, o el de todo el estado con el mismo desplazamiento para que la animación no brinque.
  // "piso" lo centra de lado y lo apoya abajo (para personajes de pie)
  function caja(im) { let a = im.width, b = im.height, c = -1, d = -1; for (let y = 0; y < im.height; y++) for (let x = 0; x < im.width; x++) if (im.data[(y * im.width + x) * 4 + 3]) { if (x < a) a = x; if (x > c) c = x; if (y < b) b = y; if (y > d) d = y; } return c < 0 ? null : { x0: a, y0: b, x1: c + 1, y1: d + 1 }; }
  function desplaza(im, dx, dy) { if (!dx && !dy) return im; const n = new ImageData(im.width, im.height); sella(n, im, dx, dy); return n; }
  function centra(modo, soloCuadro) {
    const fr = soloCuadro ? [X.est[X.ei].frames[X.fi]] : X.est[X.ei].frames;
    // La caja de todos, medida desde el centro de cada cuadro
    let u = null;
    fr.forEach((f) => { const k2 = caja(f.im); if (!k2) return; const cx = f.im.width / 2, cy = f.im.height / 2, q = { x0: k2.x0 - cx, x1: k2.x1 - cx, y0: k2.y0 - cy, y1: k2.y1 - cy }; u = u ? { x0: Math.min(u.x0, q.x0), x1: Math.max(u.x1, q.x1), y0: Math.min(u.y0, q.y0), y1: Math.max(u.y1, q.y1) } : q; });
    if (!u) { nota(T("No hay nada dibujado que centrar.", "Nothing drawn to center.")); return; }
    sinSel();
    fr.forEach((f) => { const dx = Math.round(-(u.x0 + u.x1) / 2), dy = modo === "piso" ? Math.floor(f.im.height / 2 - u.y1) : Math.round(-(u.y0 + u.y1) / 2); f.im = desplaza(f.im, dx, dy); });
    anota(`${modo === "piso" ? T("Apoyar abajo", "Rest on floor") : T("Centrar", "Center")} (${soloCuadro ? T("cuadro", "frame") : T("estado", "state")})`);
  }
  const TAMS = [["160x90", "160×90"], ["128x128", "128×128"], ["96x96", "96×96"], ["64x64", "64×64"], ["48x48", "48×48"], ["32x32", "32×32"], ["16x16", "16×16"]];

  function pintaPintar(cu) {
    const c = capaP(), pal = X.esc.paleta, q = X.est[X.ei], f = q.frames[X.fi], im = f.im, total = q.frames.reduce((a, x) => a + x.d, 0);
    cu.className = "jx-cuerpo jx-pintar";
    cu.innerHTML = `
      <div class="je-panel"><p class="je-tit">${T("HERRAMIENTAS", "TOOLS")}</p>
        <div class="jx-herrs">${HERRS.map(([id, ic, n, tk]) => `<button type="button" class="je-b${X.herr === id ? " on" : ""}" data-x="herr" data-v="${id}" title="${n}${tactil ? "" : ` (${tk})`}"><span class="jx-hn">${ic} ${n}</span>${kbd(tk)}</button>`).join("")}</div>
        <p class="je-k">${T("GROSOR", "SIZE")} ${tactil ? "" : "<kbd>[</kbd><kbd>]</kbd>"}</p><p class="je-fila">${[1, 2, 3, 5].map((g) => `<button type="button" class="je-b${X.grosor === g ? " on" : ""}" data-x="grosor" data-v="${g}">${g}px</button>`).join("")}</p>
        <p class="je-fila"><button type="button" class="je-b${X.espejo ? " on" : ""}" data-x="espejo">${T("ESPEJO", "MIRROR")}${kbd("X")}</button><button type="button" class="je-b${X.cuad ? " on" : ""}" data-x="cuad">${T("CUADRICULA", "GRID")}${kbd("C")}</button><button type="button" class="je-b${X.cebolla ? " on" : ""}" data-x="cebolla">${T("CEBOLLA", "ONION")}${kbd("U")}</button></p>
        <p class="je-k">${T("PALETA · DOBLE TOQUE PARA CAMBIAR UN COLOR", "PALETTE · DOUBLE TAP TO CHANGE A COLOR")}</p>
        <div class="jx-pal"><button type="button" class="jx-sw jx-tr${X.col === -1 ? " on" : ""}" data-x="color" data-v="-1" title="${T("Transparente", "Transparent")}"></button>${pal.map((cc, i) => `<button type="button" class="jx-sw${X.col === i ? " on" : ""}" data-x="color" data-v="${i}" style="background:${cc}" title="${cc}${i < 9 && !tactil ? ` (${i + 1})` : ""}"></button>`).join("")}</div>
        <input type="color" class="jx-colsel" value="${X.col >= 0 ? pal[X.col] : "#000000"}" aria-label="${T("Cambiar el color elegido", "Change the chosen color")}">
        <p class="je-k">${T("ACOMODAR EL DIBUJO", "ARRANGE THE DRAWING")}</p>
        <p class="je-fila"><button type="button" class="je-b" data-x="centra" title="${T("Centra todo el estado (mismo desplazamiento en cada cuadro)", "Centers the whole state (same shift on every frame)")}">⊕ ${T("CENTRAR", "CENTER")}${kbd("K")}</button><button type="button" class="je-b" data-x="centraq">⊕ ${T("SOLO ESTE CUADRO", "THIS FRAME ONLY")}</button><button type="button" class="je-b" data-x="piso" title="${T("Centra de lado y lo apoya en el borde de abajo", "Centers sideways and rests it on the bottom edge")}">⊥ ${T("APOYAR ABAJO", "REST ON FLOOR")}</button></p>
        <p class="je-fila"><button type="button" class="je-b" data-x="plimpia">${T("LIMPIAR CUADRO", "CLEAR FRAME")}</button><button type="button" class="je-b" data-x="pimagen">${T("IMPORTAR IMAGEN", "IMPORT IMAGE")}</button></p>
        ${tactil ? `<p class="je-k">${T("DOS DEDOS: PELLIZCA PARA ACERCAR Y ARRASTRA PARA MOVER LA VISTA", "TWO FINGERS: PINCH TO ZOOM, DRAG TO PAN")}</p>` : `<p class="je-fila"><button type="button" class="je-b${X.ayuda ? " on" : ""}" data-x="ayuda">? ${T("ATAJOS DE TECLADO", "KEYBOARD SHORTCUTS")}</button></p>`}
        ${X.ayuda && !tactil ? `<div class="jx-atajos">${ATAJOS.map(([a, b]) => `<p><kbd>${a}</kbd> ${b}</p>`).join("")}</div>` : ""}
        <p class="je-fila"><button type="button" class="je-b" data-x="pdeshaz">${k("CTRL+Z")}${T("DESHACER", "UNDO")}</button><button type="button" class="je-b" data-x="prehaz">${k("CTRL+Y")}${T("REHACER", "REDO")}</button></p>
        ${historial(X.H, X.hi, "h")}
      </div>
      <div class="jx-centro">
        <div class="je-fila jx-vbar"><button type="button" class="je-b" data-x="zoom" data-v="-">−</button><span class="je-k jx-zoomv">×${X.lpM ? X.lpM.z : 1}</span><button type="button" class="je-b" data-x="zoom" data-v="+">+</button><button type="button" class="je-b" data-x="zoom" data-v="0">${T("AJUSTAR", "FIT")}${kbd("0")}</button>
          <span class="je-k">${T("LUZ DEL FONDO", "BACKGROUND LIGHT")}</span><input type="range" class="jx-rango jx-luz" min="0" max="1" step="0.01" value="${X.luz}" aria-label="${T("Luz del fondo", "Background light")}">
          ${[0.05, 0.35, 0.7, 1].map((l) => `<button type="button" class="jx-luzb" data-x="luzp" data-v="${l}" style="background:${grisDe(l)}" title="${Math.round(l * 100)}%"></button>`).join("")}
          <span class="je-k jx-pos"></span></div>
        <div class="jx-lienzo-caja"><canvas class="jx-lienzo"></canvas></div>
      </div>
      <div class="je-panel"><p class="je-tit">${T("ESTADOS", "STATES")}</p>
        <div class="jx-estados">${X.est.map((x, i) => `<button type="button" class="jx-est${i === X.ei ? " on" : ""}" data-x="estado" data-v="${i}"><b>${limpia(x.n)}</b><i>${(USOS.find((u) => u[0] === x.uso) || USOS[9])[1]}${x.p && USOS.find((u) => u[0] === x.uso && u[4]) ? " " + x.p : ""} · ${x.loop ? "⟳" : "→"} · ${x.frames.length}</i></button>`).join("")}</div>
        <p class="je-fila"><button type="button" class="je-b" data-x="enuevo">+ ${T("ESTADO", "STATE")}</button><button type="button" class="je-b" data-x="edup">${T("DUPLICAR", "DUPLICATE")}</button><button type="button" class="je-b" data-x="eborra"${X.est.length > 1 ? "" : " disabled"}>${T("BORRAR", "DELETE")}</button></p>
        <p class="je-k">${T("NOMBRE", "NAME")} <input class="je-in jx-enom" maxlength="14" value="${limpia(q.n)}" aria-label="${T("Nombre del estado", "State name")}"></p>
        <p class="je-tit">${T("¿CUANDO SALE EN EL JUEGO?", "WHEN DOES IT PLAY?")}</p>
        ${GRUPOS.map((g, gi) => `<p class="je-k">${g}</p><p class="je-fila">${USOS.filter((u) => u[3] === gi).map(([u, n, d]) => `<button type="button" class="je-b${q.uso === u ? " on" : ""}" data-x="euso" data-v="${u}" title="${d}">${n}</button>`).join("")}</p>`).join("")}
        ${(() => { const u = USOS.find((x) => x[0] === q.uso) || USOS[0]; return `<p class="jx-uso">${u[2]}${u[4] ? ` <span class="je-k">${u[4][0]} <input type="number" class="je-in jx-ep" min="${u[4][1]}" max="${u[4][2]}" value="${q.p || u[4][3]}"></span>` : ""}${X.est.filter((o) => o.uso === q.uso).length > 1 && q.uso !== "libre" ? `<br><span class="je-k">${T("Hay varios con este uso: se turnan.", "Several share this use: they take turns.")}</span>` : ""}</p>`; })()}
        <p class="je-fila"><button type="button" class="je-b${q.loop ? " on" : ""}" data-x="eloop">${q.loop ? `⟳ ${T("EN BUCLE", "LOOP")}` : `→ ${T("UNA VEZ", "ONCE")}`}</button><button type="button" class="je-b${q.golpe ? " on" : ""}" data-x="egolpe">${q.golpe ? "■" : "□"} ${T("UN CUADRO POR GOLPE", "ONE FRAME PER BEAT")}</button></p>
        <p class="je-tit">${T("CUADROS", "FRAMES")} · ${X.fi + 1}/${q.frames.length} · ${total.toFixed(2)}s</p>
        <div class="jx-cuadros">${q.frames.map((x, i) => `<button type="button" class="jx-cq${i === X.fi ? " on" : ""}" data-x="cuadro" data-v="${i}"><canvas width="${x.im.width}" height="${x.im.height}" data-cq="${i}"></canvas><i>${i + 1} · ${q.golpe ? "♪" : x.d + "s"}</i></button>`).join("")}</div>
        <p class="je-fila"><button type="button" class="je-b" data-x="cnuevo">+ ${T("NUEVO", "NEW")}${kbd("N")}</button><button type="button" class="je-b" data-x="cdup">${T("DUPLICAR", "DUPLICATE")}${kbd("CTRL+D")}</button><button type="button" class="je-b" data-x="cborra">${T("BORRAR", "DELETE")}</button><button type="button" class="je-b" data-x="cizq" title="${T("Mover a la izquierda", "Move left")}">◀</button><button type="button" class="je-b" data-x="cder" title="${T("Mover a la derecha", "Move right")}">▶</button></p>
        <p class="je-k">${T("DURA ESTE CUADRO", "THIS FRAME LASTS")} <input type="number" class="je-in jx-dur" min="0.02" max="5" step="0.01" value="${f.d}" aria-label="${T("Segundos", "Seconds")}"${q.golpe ? " disabled" : ""}> s <button type="button" class="je-b" data-x="durtodos"${q.golpe ? " disabled" : ""}>${T("A TODOS", "TO ALL")}</button></p>
        <p class="je-fila"><button type="button" class="je-b${X.anima ? " on" : ""}" data-x="anima">${X.anima ? "❚❚" : "▶"} ${T("VER", "PLAY")} ${limpia(q.n)}${kbd("P")}</button></p>
        <canvas class="jx-anim" width="${im.width}" height="${im.height}"></canvas>
        <p class="je-tit">${T("LIENZO", "CANVAS")} · ${im.width}×${im.height}${im.width !== c.w || im.height !== c.h ? ` <span class="je-k">(${T("CAPA", "LAYER")} ${c.w}×${c.h})</span>` : ""}</p>
        <p class="je-k">${T("CAMBIAR EL TAMAÑO DE", "RESIZE")}</p>
        <p class="je-fila">${[["cuadro", T("ESTE CUADRO", "THIS FRAME")], ["estado", T("ESTE ESTADO", "THIS STATE")], ["capa", T("TODA LA CAPA", "WHOLE LAYER")]].map(([v, n]) => `<button type="button" class="je-b${X.tamAl === v ? " on" : ""}" data-x="tamal" data-v="${v}">${n}</button>`).join("")}</p>
        <div class="jx-tamfila"><div class="jx-ancla" title="${T("Desde dónde crece o se recorta", "Where it grows or crops from")}">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<button type="button" class="${X.ancla === i ? "on" : ""}" data-x="ancla" data-v="${i}" aria-label="${T("Ancla", "Anchor")} ${i + 1}"></button>`).join("")}</div>
          <div><p class="je-k">${T("ANCHO", "WIDTH")} <input type="number" class="je-in jx-tw" min="4" max="400" value="${im.width}"> ${T("ALTO", "HEIGHT")} <input type="number" class="je-in jx-th" min="4" max="400" value="${im.height}"></p>
          <p class="je-fila"><button type="button" class="je-b je-y" data-x="tamok">${T("APLICAR", "APPLY")}</button></p></div></div>
        <p class="je-fila">${TAMS.map(([v, n]) => `<button type="button" class="je-b${`${im.width}x${im.height}` === v ? " on" : ""}" data-x="tam" data-v="${v}">${n}</button>`).join("")}</p>
        <p class="je-fila"><button type="button" class="je-b je-v" data-x="listo">✓ ${T("LISTO", "DONE")}${kbd("ESC")}</button></p>
      </div>`;
    const sel = $(".jx-colsel", cu);
    sel.addEventListener("input", () => { if (X.col < 0) return; X.esc.paleta[X.col] = sel.value; const sw = cu.querySelector(`.jx-sw[data-v="${X.col}"]`); if (sw) sw.style.background = sel.value; });
    sel.addEventListener("change", () => { clearTimeout(X.guardaT); X.guardaT = setTimeout(guardaYa, 800); });
    cu.querySelectorAll(".jx-sw").forEach((b) => b.addEventListener("dblclick", () => { if (+b.dataset.v >= 0) sel.click(); }));
    $(".jx-luz", cu).addEventListener("input", (e) => { X.luz = +e.target.value; guardaLuz(); fondoCaja(); });
    { const ep = $(".jx-ep", cu); if (ep) ep.addEventListener("change", () => { const u = USOS.find((x) => x[0] === q.uso)[4], v = Math.max(u[1], Math.min(u[2], Math.round(+ep.value) || u[3])); if (v !== q.p) { q.p = v; anota(`${q.n}: ${u[0].toLowerCase()} ${v}`); } }); }
    $(".jx-enom", cu).addEventListener("change", (e) => { const v = e.target.value.trim().toUpperCase().slice(0, 14); if (v && v !== q.n) { q.n = v; anota(`${T("Renombrar estado", "Rename state")}: ${v}`); } });
    $(".jx-dur", cu).addEventListener("change", (e) => { const v = Math.round(Math.max(0.02, Math.min(5, +e.target.value || 0.15)) * 100) / 100; if (v !== f.d) { f.d = v; anota(`${T("Duración", "Duration")} ${T("cuadro", "frame")} ${X.fi + 1}: ${v}s`); } });
    X.lp = $(".jx-lienzo", cu);
    fondoCaja();
    if (X.imp && IMP.src) {
      cu.insertAdjacentHTML("beforeend", panelImportar()); pintaVistaImp();
      const num = (sel, op, mn, mx) => { const n = $(sel, cu); if (n) n.addEventListener("change", () => { IMP.o[op] = Math.max(mn, Math.min(mx, Math.round(+n.value) || mn)); pinta(); }); };
      num(".jx-impk", "esc", 1, 64); num(".jx-impc1", "cols", 1, 32); num(".jx-impf1", "filas", 1, 32);
      const tl = $(".jx-imptol", cu); if (tl) tl.addEventListener("change", () => { IMP.o.tol = +tl.value; pinta(); });
    }
    const cs = $(".jx-cuadros", cu), on = cs && cs.querySelector(".on"); if (on) cs.scrollLeft = on.offsetLeft - cs.clientWidth / 2;
  }
  // La luz del fondo del lienzo: de negro a blanco, para ver bien los pixeles en cualquier pantalla
  function grisDe(l, d = 0) { const v = Math.round(Math.max(0, Math.min(255, l * 255 + d))); return `rgb(${v},${v},${Math.min(255, v + 6)})`; }
  function fondoCaja() { const b = $(".jx-lienzo-caja", raiz); if (b) b.style.background = grisDe(X.luz, X.luz > 0.5 ? -18 : 6); }

  /* ---------- Pintar pixeles ---------- */
  const dentroSel = (x, y) => !X.selR || X.herr === "selec" || (x >= X.selR.x && y >= X.selR.y && x < X.selR.x + X.selR.w && y < X.selR.y + X.selR.h);
  function punto(im, x, y, col) {
    const g = X.grosor, o = Math.floor((g - 1) / 2);
    for (let dy = 0; dy < g; dy++) for (let dx = 0; dx < g; dx++) for (const xx of X.espejo ? [x + dx - o, im.width - 1 - (x + dx - o)] : [x + dx - o]) {
      const yy = y + dy - o;
      if (xx < 0 || yy < 0 || xx >= im.width || yy >= im.height || !dentroSel(xx, yy)) continue;
      const p = (yy * im.width + xx) * 4;
      if (!col) { im.data[p + 3] = 0; continue; }
      im.data[p] = col[0]; im.data[p + 1] = col[1]; im.data[p + 2] = col[2]; im.data[p + 3] = 255;
    }
  }
  function linea(im, x0, y0, x1, y1, col) { const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy; for (let n = 0; n < 4000; n++) { punto(im, x0, y0, col); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } }
  function rect(im, x0, y0, x1, y1, col, lleno) { const [a, b] = [Math.min(x0, x1), Math.max(x0, x1)], [c, d] = [Math.min(y0, y1), Math.max(y0, y1)]; for (let y = c; y <= d; y++) for (let x = a; x <= b; x++) if (lleno || y === c || y === d || x === a || x === b) punto(im, x, y, col); }
  function circ(im, x0, y0, x1, y1, col) { const rx = Math.abs(x1 - x0) / 2, ry = Math.abs(y1 - y0) / 2, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, n = Math.max(16, Math.round((rx + ry) * 4)); let px = null, py = null; for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2, x = Math.round(cx + Math.cos(a) * rx), y = Math.round(cy + Math.sin(a) * ry); if (px != null) linea(im, px, py, x, y, col); px = x; py = y; } }
  function cubeta(im, x, y, col) {
    const w = im.width, hh = im.height, d = im.data, p0 = (y * w + x) * 4, base = [d[p0], d[p0 + 1], d[p0 + 2], d[p0 + 3]];
    const igual = (p) => (base[3] === 0 ? d[p + 3] === 0 : d[p] === base[0] && d[p + 1] === base[1] && d[p + 2] === base[2] && d[p + 3] === base[3]);
    if (col && base[3] && base[0] === col[0] && base[1] === col[1] && base[2] === col[2]) return false;
    if (!col && !base[3]) return false;
    const pila = [[x, y]], visto = new Uint8Array(w * hh);
    while (pila.length) { const [a, b] = pila.pop(); if (a < 0 || b < 0 || a >= w || b >= hh || !dentroSel(a, b)) continue; const i = b * w + a; if (visto[i]) continue; visto[i] = 1; const p = i * 4; if (!igual(p)) continue; if (col) { d[p] = col[0]; d[p + 1] = col[1]; d[p + 2] = col[2]; d[p + 3] = 255; } else d[p + 3] = 0; pila.push([a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]); }
    return true;
  }
  const rgbDe = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  const colorAct = () => (X.col < 0 ? null : rgbDe(X.esc.paleta[X.col]));
  // Recortes y sellos (para la selección)
  function recorte(im, r) { const n = new ImageData(r.w, r.h); for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) { const sx = r.x + x, sy = r.y + y; if (sx < 0 || sy < 0 || sx >= im.width || sy >= im.height) continue; const a = (sy * im.width + sx) * 4, b = (y * r.w + x) * 4; for (let j = 0; j < 4; j++) n.data[b + j] = im.data[a + j]; } return n; }
  function borraArea(im, r) { for (let y = Math.max(0, r.y); y < Math.min(im.height, r.y + r.h); y++) for (let x = Math.max(0, r.x); x < Math.min(im.width, r.x + r.w); x++) im.data[(y * im.width + x) * 4 + 3] = 0; }
  function sella(im, src, ox, oy) { for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) { const b = (y * src.width + x) * 4; if (!src.data[b + 3]) continue; const tx = ox + x, ty = oy + y; if (tx < 0 || ty < 0 || tx >= im.width || ty >= im.height) continue; const a = (ty * im.width + tx) * 4; for (let j = 0; j < 4; j++) im.data[a + j] = src.data[b + j]; } }
  function voltea(im, horiz) { const n = new ImageData(im.width, im.height); for (let y = 0; y < im.height; y++) for (let x = 0; x < im.width; x++) { const sx = horiz ? im.width - 1 - x : x, sy = horiz ? y : im.height - 1 - y, a = (sy * im.width + sx) * 4, b = (y * im.width + x) * 4; for (let j = 0; j < 4; j++) n.data[b + j] = im.data[a + j]; } return n; }
  // Levanta lo seleccionado: queda flotando sobre el cuadro hasta soltarlo (lo de abajo no se pierde mientras se mueve)
  function levanta(duplica) {
    if (X.flot || !X.selR) return;
    const base = copia(cuadro()), im = recorte(base, X.selR);
    if (!duplica) borraArea(base, X.selR);
    X.flot = { im, base, x: X.selR.x, y: X.selR.y };
  }
  function reSella() { const f = X.est[X.ei].frames[X.fi], n = copia(X.flot.base); sella(n, X.flot.im, X.flot.x, X.flot.y); f.im = n; X.selR = { x: X.flot.x, y: X.flot.y, w: X.flot.im.width, h: X.flot.im.height }; }
  function copiaSel() { const r0 = X.selR || { x: 0, y: 0 }; X.clipPos = { x: r0.x, y: r0.y }; X.clip = X.flot ? copia(X.flot.im) : recorte(cuadro(), X.selR || { x: 0, y: 0, w: cuadro().width, h: cuadro().height }); nota(T("Copiado.", "Copied.")); }
  function cortaSel() { if (!X.selR) return; copiaSel(); borraSel(T("Cortar", "Cut")); }
  function borraSel(n = T("Borrar selección", "Delete selection")) {
    if (!X.selR) return;
    if (X.flot) { X.est[X.ei].frames[X.fi].im = copia(X.flot.base); X.flot = null; }
    else borraArea(escribe(), X.selR);
    X.selR = null; anota(n);
  }
  function pega() {
    if (!X.clip) { nota(T("No hay nada copiado.", "Nothing copied.")); return; }
    X.flot = null;
    const r = X.selR || X.clipPos || { x: 0, y: 0 };
    X.flot = { im: copia(X.clip), base: copia(cuadro()), x: Math.min(r.x, cuadro().width - 1), y: Math.min(r.y, cuadro().height - 1) };
    reSella(); X.herr = "selec"; anota(T("Pegar", "Paste"));
  }
  function volteaTodo(horiz) {
    const n = horiz ? T("Voltear horizontal", "Flip horizontal") : T("Voltear vertical", "Flip vertical");
    if (X.selR) { levanta(false); X.flot.im = voltea(X.flot.im, horiz); reSella(); anota(n); return; }
    X.est[X.ei].frames[X.fi].im = voltea(cuadro(), horiz); anota(n);
  }

  /* ---------- Puntero: dibujar, seleccionar, mover la vista, pellizcar ---------- */
  function aPixel(ev) { const r = X.lp.getBoundingClientRect(), m = X.lpM; if (!m) return [0, 0]; return [Math.floor((ev.clientX - r.left - m.ox) / m.z), Math.floor((ev.clientY - r.top - m.oy) / m.z)]; }
  const enLienzo = (x, y) => { const im = cuadro(); return x >= 0 && y >= 0 && x < im.width && y < im.height; };
  function gotero(x, y) {
    const im = cuadro(), p = (y * im.width + x) * 4;
    if (!im.data[p + 3]) X.col = -1;
    else { const hex = "#" + [0, 1, 2].map((j) => im.data[p + j].toString(16).padStart(2, "0")).join(""); let i = X.esc.paleta.indexOf(hex); if (i < 0) { i = X.col >= 0 ? X.col : 0; X.esc.paleta[i] = hex; } X.col = i; }
  }
  raiz.addEventListener("pointerdown", (ev) => {
    if (X.vista !== "pintar" || ev.target !== X.lp || X.hi < 0) return;
    ev.preventDefault(); X.lp.setPointerCapture(ev.pointerId);
    X.punteros.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    // Dos dedos: pellizcar para acercar y arrastrar para mover la vista (se cancela el trazo que iba)
    if (X.punteros.size === 2) {
      if (X.trazo && X.trazo.antes) X.est[X.ei].frames[X.fi].im = X.trazo.antes;
      X.trazo = null; const [a, b] = [...X.punteros.values()];
      X.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: X.lpM.z, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, pan: { ...X.pan } };
      return;
    }
    const [x, y] = aPixel(ev);
    if (X.espacio || ev.button === 1 || X.herr === "mano") { X.trazo = { mano: true, sx: ev.clientX, sy: ev.clientY, pan: { ...X.pan } }; return; }
    if (X.herr === "gotero" || (ev.altKey && X.herr !== "selec")) { if (enLienzo(x, y)) { gotero(x, y); if (X.herr === "gotero") X.herr = "lapiz"; pinta(); } return; }
    if (X.herr === "selec") {
      const r = X.selR;
      if (r && x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h) { const nuevo = !X.flot; levanta(ev.altKey); X.trazo = { selMueve: true, x0: x, y0: y, fx: X.flot.x, fy: X.flot.y, nuevo, alt: ev.altKey }; return; }
      X.flot = null; X.selR = null;
      const cx = Math.max(0, Math.min(cuadro().width - 1, x)), cy = Math.max(0, Math.min(cuadro().height - 1, y));
      X.trazo = { selNueva: true, x0: cx, y0: cy }; X.selR = { x: cx, y: cy, w: 1, h: 1 }; return;
    }
    X.flot = null;
    const col = X.herr === "borra" || ev.button === 2 ? null : colorAct(), antes = cuadro();
    if (X.herr === "cubeta") { if (enLienzo(x, y)) { const im = escribe(); if (cubeta(im, x, y, col)) anota(NOM_H.cubeta); else X.est[X.ei].frames[X.fi].im = antes; } return; }
    const im = escribe();
    X.trazo = { x0: x, y0: y, x, y, col, antes, base: antes.data };
    if (X.herr === "lapiz" || X.herr === "borra") punto(im, x, y, col);
  });
  raiz.addEventListener("pointermove", (ev) => {
    if (X.vista !== "pintar") return;
    if (X.punteros.has(ev.pointerId)) X.punteros.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (X.pinch && X.punteros.size === 2) {
      const [a, b] = [...X.punteros.values()], d = Math.hypot(a.x - b.x, a.y - b.y), z = Math.max(1, Math.min(64, Math.round(X.pinch.z * d / X.pinch.d)));
      ponZoom(z, X.pinch.cx, X.pinch.cy); X.pan.x += (a.x + b.x) / 2 - X.pinch.cx; X.pan.y += (a.y + b.y) / 2 - X.pinch.cy; X.pinch.cx = (a.x + b.x) / 2; X.pinch.cy = (a.y + b.y) / 2;
      return;
    }
    if (ev.target === X.lp || X.trazo) { const [x, y] = aPixel(ev), p = $(".jx-pos", raiz); if (p) p.textContent = X.lpM && enLienzo(x, y) ? `${x}, ${y}` : ""; }
    const tr = X.trazo;
    if (!tr) return;
    if (tr.mano) { X.pan = { x: tr.pan.x + ev.clientX - tr.sx, y: tr.pan.y + ev.clientY - tr.sy }; return; }
    const [x, y] = aPixel(ev);
    if (tr.selNueva) { const im = cuadro(), cx = Math.max(0, Math.min(im.width - 1, x)), cy = Math.max(0, Math.min(im.height - 1, y)); X.selR = { x: Math.min(tr.x0, cx), y: Math.min(tr.y0, cy), w: Math.abs(cx - tr.x0) + 1, h: Math.abs(cy - tr.y0) + 1 }; return; }
    if (tr.selMueve) { X.flot.x = tr.fx + x - tr.x0; X.flot.y = tr.fy + y - tr.y0; reSella(); tr.movio = true; return; }
    if (x === tr.x && y === tr.y) return;
    const im = cuadro();
    if (X.herr === "lapiz" || X.herr === "borra") linea(im, tr.x, tr.y, x, y, tr.col);
    else if (X.herr === "mover") { const dx = x - tr.x0, dy = y - tr.y0, w = im.width, hh = im.height; im.data.fill(0); for (let yy = 0; yy < hh; yy++) for (let xx = 0; xx < w; xx++) { const sx = xx - dx, sy = yy - dy; if (sx < 0 || sy < 0 || sx >= w || sy >= hh) continue; const a = (sy * w + sx) * 4, b = (yy * w + xx) * 4; for (let j = 0; j < 4; j++) im.data[b + j] = tr.base[a + j]; } }
    else { im.data.set(tr.base); if (X.herr === "linea") linea(im, tr.x0, tr.y0, x, y, tr.col); else if (X.herr === "circ") circ(im, tr.x0, tr.y0, x, y, tr.col); else rect(im, tr.x0, tr.y0, x, y, tr.col, X.herr === "rectl"); }
    tr.x = x; tr.y = y;
  });
  const fin = (ev) => {
    X.punteros.delete(ev.pointerId);
    if (X.pinch) { if (X.punteros.size < 2) X.pinch = null; return; }
    const tr = X.trazo; X.trazo = null;
    if (!tr || tr.mano) return;
    if (tr.selNueva) { if (X.selR && X.selR.w * X.selR.h <= 1) X.selR = null; pinta(); return; }
    if (tr.selMueve) { if (tr.movio || tr.alt) anota(tr.alt ? T("Duplicar selección", "Duplicate selection") : T("Mover selección", "Move selection")); else if (tr.nuevo) X.flot = null; return; }
    // Si el trazo no cambió nada, no cuenta en el historial
    const im = cuadro();
    if (tr.antes && im.data.every((v, i) => v === tr.antes.data[i])) { X.est[X.ei].frames[X.fi].im = tr.antes; return; }
    anota(NOM_H[X.herr] || X.herr);
  };
  raiz.addEventListener("pointerup", fin);
  raiz.addEventListener("pointercancel", fin);
  raiz.addEventListener("contextmenu", (ev) => { if (ev.target === X.lp) ev.preventDefault(); });
  // Rueda: mueve la vista · CTRL + rueda (o pellizco del touchpad): acerca y aleja donde está el puntero
  raiz.addEventListener("wheel", (ev) => {
    if (X.vista !== "pintar" || !ev.target.closest(".jx-lienzo-caja")) return;
    ev.preventDefault();
    if (ev.ctrlKey || ev.metaKey) { zoomA(ev.deltaY < 0 ? 1 : -1, ev.clientX, ev.clientY); return; }
    X.pan.x -= ev.shiftKey ? ev.deltaY : ev.deltaX; X.pan.y -= ev.shiftKey ? 0 : ev.deltaY;
  }, { passive: false });
  function ponZoom(z, px, py) {
    const m = X.lpM, r = X.lp && X.lp.getBoundingClientRect();
    if (!m || !r) { X.zoom = z; return; }
    // El pixel bajo el puntero se queda donde está
    const ax = px != null ? px - r.left : r.width / 2, ay = py != null ? py - r.top : r.height / 2, ux = (ax - m.ox) / m.z, uy = (ay - m.oy) / m.z;
    X.zoom = z;
    const c = { w: cuadro().width, h: cuadro().height }, ox0 = Math.floor((r.width - c.w * z) / 2), oy0 = Math.floor((r.height - c.h * z) / 2);
    X.pan = { x: ax - ux * z - ox0, y: ay - uy * z - oy0 };
  }
  function zoomA(dir, px, py) {
    if (!X.lpM) return;
    if (!dir) { X.zoom = 0; X.pan = { x: 0, y: 0 }; return; }
    const z = X.lpM.z, n = dir > 0 ? ZOOMS.find((v) => v > z) || 64 : [...ZOOMS].reverse().find((v) => v < z) || 1;
    ponZoom(n, px, py);
  }
  /* ---------- IMPORTAR IMAGEN: lo más fiel posible ----------
     1. Si la imagen es pixel art agrandado (cada pixel es un bloque de N×N), lo detecta y toma un pixel por bloque, del
        centro del bloque: se recupera el dibujo original exacto, sin colores mezclados.
     2. Opcional: quitar el color de fondo (desde las orillas), y transparencia limpia (cada pixel es visible o no).
     3. Tamaño: EXACTO (el cuadro toma el tamaño de la imagen) o AJUSTAR al cuadro (nítido o suavizado).
     4. Colores: los exactos de la imagen, o pasados a la paleta del escenario; y sus colores se pueden volver la paleta.
     5. Hojas de sprites: columnas × filas se vuelven cuadros, con el mismo recorte para que la animación no brinque.
     Se abre con el botón IMPORTAR IMAGEN, arrastrando una imagen al lienzo o pegándola (CTRL+V). */
  const entradaImg = Object.assign(document.createElement("input"), { type: "file", accept: "image/*", hidden: true });
  el.appendChild(entradaImg);
  entradaImg.addEventListener("change", () => { const f = entradaImg.files && entradaImg.files[0]; entradaImg.value = ""; if (f) abreImportar(f); });
  const IMP = { src: null, nombre: "", o: { tam: "exacto", esc: 0, fondo: false, tol: 24, alfa: true, umbral: 128, recorta: true, muestreo: "pixel", col: "exactos", cols: 1, filas: 1, destino: "este" }, res: null };
  function abreImportar(f) {
    if (!/^image\//.test(f.type)) { nota(T("Eso no es una imagen.", "That's not an image.")); return; }
    const url = URL.createObjectURL(f), im = new Image();
    im.onload = () => {
      // Una foto enorme se achica antes (máximo 2048): para pixel art nunca hace falta tanto
      const k2 = Math.min(1, 2048 / Math.max(im.naturalWidth, im.naturalHeight)), w = Math.max(1, Math.round(im.naturalWidth * k2)), hh = Math.max(1, Math.round(im.naturalHeight * k2));
      const cv = Object.assign(document.createElement("canvas"), { width: w, height: hh }), x = cv.getContext("2d", { willReadFrequently: true });
      x.imageSmoothingEnabled = k2 < 1; x.drawImage(im, 0, 0, w, hh);
      IMP.src = x.getImageData(0, 0, w, hh); IMP.nombre = f.name || "imagen"; IMP.achicada = k2 < 1; IMP.o.esc = 0; IMP.o.cols = 1; IMP.o.filas = 1;
      IMP.det = detectaEscala(IMP.src);
      URL.revokeObjectURL(url); X.imp = true; pinta();
    };
    im.onerror = () => { URL.revokeObjectURL(url); nota(T("No se pudo abrir esa imagen.", "That image couldn't be opened.")); };
    im.src = url;
  }
  const mismo = (d, a, b, tol) => Math.abs(d[a] - d[b]) <= tol && Math.abs(d[a + 1] - d[b + 1]) <= tol && Math.abs(d[a + 2] - d[b + 2]) <= tol && Math.abs(d[a + 3] - d[b + 3]) <= tol * 2;
  const mcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
  // El tamaño de bloque: el máximo común divisor de lo que miden los tramos de un mismo color (sin contar las orillas)
  function detectaEscala(im) {
    const { width: w, height: hh, data: d } = im, tol = 6;
    let g = 0, n = 0;
    const mide = (largo, otro, idx) => {
      for (let j = 0; j < otro; j += Math.max(1, Math.floor(otro / 160))) {
        let ini = 0;
        for (let i = 1; i <= largo; i++) {
          if (i < largo && mismo(d, idx(ini, j), idx(i, j), tol)) continue;
          if (ini > 0 && i < largo) { g = mcd(i - ini, g); n++; if (g === 1) return; }
          ini = i;
        }
      }
    };
    mide(w, hh, (i, j) => (j * w + i) * 4); if (g !== 1) mide(hh, w, (i, j) => (i * w + j) * 4);
    const k = n > 3 && g > 1 ? Math.min(g, 64) : 1;
    // Dónde empiezan los bloques: lo que sobra al principio de cada renglón y columna
    const corre = (largo, otro, idx) => { const c = new Map(); for (let j = 0; j < otro; j += Math.max(1, Math.floor(otro / 60))) { let i = 1; while (i < largo && mismo(d, idx(0, j), idx(i, j), tol)) i++; if (i < largo) { const r = i % k; c.set(r, (c.get(r) || 0) + 1); } } let mejor = 0, cu = -1; c.forEach((v, r) => { if (v > cu) { cu = v; mejor = r; } }); return mejor; };
    return { k, ox: k > 1 ? corre(w, hh, (i, j) => (j * w + i) * 4) : 0, oy: k > 1 ? corre(hh, w, (i, j) => (i * w + j) * 4) : 0 };
  }
  // Quitar el fondo: el color más común de las 4 esquinas, rellenando desde las orillas (lo de adentro del mismo color se queda)
  function quitaFondo(im, tol) {
    const { width: w, height: hh } = im, d = im.data, esq = [0, w - 1, (hh - 1) * w, hh * w - 1].map((i) => i * 4);
    const cuenta = esq.map((a) => esq.filter((b) => mismo(d, a, b, 10)).length), ref = esq[cuenta.indexOf(Math.max(...cuenta))], base = [d[ref], d[ref + 1], d[ref + 2], d[ref + 3]];
    if (base[3] === 0) return;
    const ok = (p) => d[p + 3] && Math.abs(d[p] - base[0]) <= tol && Math.abs(d[p + 1] - base[1]) <= tol && Math.abs(d[p + 2] - base[2]) <= tol;
    const visto = new Uint8Array(w * hh), pila = [];
    for (let x = 0; x < w; x++) pila.push(x, (hh - 1) * w + x); for (let y = 0; y < hh; y++) pila.push(y * w, y * w + w - 1);
    while (pila.length) { const i = pila.pop(); if (visto[i]) continue; visto[i] = 1; const p = i * 4; if (!ok(p)) continue; d[p + 3] = 0; const x = i % w, y = (i / w) | 0; if (x > 0) pila.push(i - 1); if (x < w - 1) pila.push(i + 1); if (y > 0) pila.push(i - w); if (y < hh - 1) pila.push(i + w); }
  }
  // Un pixel por bloque, tomado del centro del bloque
  function porBloques(im, k, ox, oy) {
    if (k <= 1) return copia(im);
    const ex = ox > 0 ? 1 : 0, ey = oy > 0 ? 1 : 0, w = Math.ceil((im.width - ox) / k) + ex, hh = Math.ceil((im.height - oy) / k) + ey, n = new ImageData(w, hh);
    for (let j = 0; j < hh; j++) for (let i = 0; i < w; i++) {
      const x0 = ox + (i - ex) * k, y0 = oy + (j - ey) * k, sx = Math.max(0, Math.min(im.width - 1, Math.max(x0, 0) + Math.floor((Math.min(x0 + k, im.width) - Math.max(x0, 0)) / 2))), sy = Math.max(0, Math.min(im.height - 1, Math.max(y0, 0) + Math.floor((Math.min(y0 + k, im.height) - Math.max(y0, 0)) / 2)));
      const a = (sy * im.width + sx) * 4, b = (j * w + i) * 4; for (let q = 0; q < 4; q++) n.data[b + q] = im.data[a + q];
    }
    return n;
  }
  // Cambiar de tamaño: nítido (el pixel del centro) o suavizado (promedio del área, respetando lo transparente)
  function reescala(im, w, hh, suave) {
    const n = new ImageData(w, hh), fx = im.width / w, fy = im.height / hh, d = im.data;
    for (let j = 0; j < hh; j++) for (let i = 0; i < w; i++) {
      const b = (j * w + i) * 4;
      if (!suave || (fx <= 1 && fy <= 1)) { const sx = Math.min(im.width - 1, Math.floor((i + 0.5) * fx)), sy = Math.min(im.height - 1, Math.floor((j + 0.5) * fy)), a = (sy * im.width + sx) * 4; for (let q = 0; q < 4; q++) n.data[b + q] = d[a + q]; continue; }
      let r = 0, g = 0, bl = 0, al = 0, cnt = 0;
      for (let y = Math.floor(j * fy); y < Math.min(im.height, Math.ceil((j + 1) * fy)); y++) for (let x = Math.floor(i * fx); x < Math.min(im.width, Math.ceil((i + 1) * fx)); x++) { const a = (y * im.width + x) * 4, aa = d[a + 3]; r += d[a] * aa; g += d[a + 1] * aa; bl += d[a + 2] * aa; al += aa; cnt++; }
      if (al) { n.data[b] = r / al; n.data[b + 1] = g / al; n.data[b + 2] = bl / al; n.data[b + 3] = al / cnt; }
    }
    return n;
  }
  function cajaDe(lista) { let u = null; for (const im of lista) { const k2 = caja(im); if (k2) u = u ? { x0: Math.min(u.x0, k2.x0), y0: Math.min(u.y0, k2.y0), x1: Math.max(u.x1, k2.x1), y1: Math.max(u.y1, k2.y1) } : k2; } return u; }
  const aPaleta = (im, pal) => { const P = pal.map(rgbDe), d = im.data; for (let p = 0; p < d.length; p += 4) { if (!d[p + 3]) continue; let m = 1e9, c = P[0]; for (const q of P) { const dr = d[p] - q[0], dg = d[p + 1] - q[1], db = d[p + 2] - q[2], v = dr * dr * 3 + dg * dg * 4 + db * db * 2; if (v < m) { m = v; c = q; } } d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2]; } };
  const coloresDe = (lista) => { const c = new Map(); for (const im of lista) for (let p = 0; p < im.data.length; p += 4) if (im.data[p + 3]) { const hex = "#" + [0, 1, 2].map((j) => im.data[p + j].toString(16).padStart(2, "0")).join(""); c.set(hex, (c.get(hex) || 0) + 1); } return [...c.entries()].sort((a, b) => b[1] - a[1]).map((x) => x[0]); };
  // Todo el proceso, con las opciones elegidas: devuelve los cuadros listos
  function procesa() {
    const o = IMP.o, im = copia(IMP.src), aviso = [];
    if (o.fondo) quitaFondo(im, o.tol);
    const k = o.esc || IMP.det.k, base = porBloques(im, k, IMP.det.ox % k, IMP.det.oy % k);
    if (o.alfa) for (let p = 3; p < base.data.length; p += 4) base.data[p] = base.data[p] >= o.umbral ? 255 : 0;
    // Hoja de sprites: celdas iguales
    const cols = Math.max(1, Math.min(32, o.cols)), filas = Math.max(1, Math.min(32, o.filas)), cw = Math.floor(base.width / cols), ch = Math.floor(base.height / filas);
    let celdas = [];
    for (let j = 0; j < filas; j++) for (let i = 0; i < cols; i++) celdas.push(recorte(base, { x: i * cw, y: j * ch, w: cw, h: ch }));
    if (celdas.length > 1) celdas = celdas.filter((c) => caja(c));
    if (!celdas.length) celdas = [base];
    // Recortar lo vacío alrededor (el mismo recorte para todas las celdas)
    if (o.recorta) { const u = cajaDe(celdas); if (u) celdas = celdas.map((c) => recorte(c, { x: u.x0, y: u.y0, w: u.x1 - u.x0, h: u.y1 - u.y0 })); }
    // Tamaño
    const fw = cuadro().width, fh = cuadro().height;
    if (o.tam === "ajustar") {
      const f = Math.min(fw / celdas[0].width, fh / celdas[0].height), w = Math.max(1, Math.round(celdas[0].width * f)), hh = Math.max(1, Math.round(celdas[0].height * f));
      celdas = celdas.map((c) => { const r = reescala(c, w, hh, o.muestreo === "suave"), n = new ImageData(fw, fh); sella(n, r, Math.floor((fw - w) / 2), Math.floor((fh - hh) / 2)); return n; });
    } else if (celdas[0].width > 400 || celdas[0].height > 400) {
      const f = 400 / Math.max(celdas[0].width, celdas[0].height); celdas = celdas.map((c) => reescala(c, Math.max(1, Math.round(c.width * f)), Math.max(1, Math.round(c.height * f)), true));
      aviso.push(T("Era muy grande: se achicó a 400 como máximo.", "It was too big: shrunk to 400 max."));
    }
    if (o.alfa && o.muestreo === "suave") celdas.forEach((c) => { for (let p = 3; p < c.data.length; p += 4) c.data[p] = c.data[p] >= o.umbral ? 255 : 0; });
    if (o.col === "paleta") celdas.forEach((c) => aPaleta(c, X.esc.paleta));
    return { celdas, k, aviso, colores: coloresDe(celdas) };
  }
  function panelImportar() {
    const o = IMP.o, r = IMP.res = procesa(), c0 = r.celdas[0], b = (op, v, txt, tit) => `<button type="button" class="je-b${String(o[op]) === String(v) ? " on" : ""}" data-x="imp" data-v="${op}:${v}"${tit ? ` title="${tit}"` : ""}>${txt}</button>`;
    return `<div class="jx-imp" role="dialog" aria-label="${T("Importar imagen", "Import image")}"><div class="je-panel jx-impc">
      <p class="je-tit">${T("IMPORTAR IMAGEN", "IMPORT IMAGE")} · ${limpia(IMP.nombre)}</p>
      <div class="jx-impg"><div><canvas class="jx-impv"></canvas>
        <p class="jx-uso">${T("Original", "Original")} ${IMP.src.width}×${IMP.src.height}${IMP.achicada ? "*" : ""} · ${IMP.det.k > 1 ? `<b>${T("pixel art agrandado ×", "upscaled pixel art ×")}${IMP.det.k}</b>` : T("sin bloques detectados", "no blocks detected")} → ${r.celdas.length > 1 ? `${r.celdas.length} ${T("cuadros de", "frames of")} ` : ""}<b>${c0.width}×${c0.height}</b> · ${r.colores.length} ${T("colores", "colors")}${r.aviso.length ? `<br>${r.aviso.join(" ")}` : ""}</p></div>
      <div>
        <p class="je-k">${T("TAMAÑO DE BLOQUE (1 PIXEL DEL DIBUJO = N PIXELES DE LA IMAGEN)", "BLOCK SIZE (1 ART PIXEL = N IMAGE PIXELS)")}</p>
        <p class="je-fila">${b("esc", 0, `${T("AUTO", "AUTO")} ×${IMP.det.k}`)}${[1, 2, 3, 4, 8].map((n) => b("esc", n, "×" + n)).join("")}<input type="number" class="je-in jx-impk" min="1" max="64" value="${o.esc || IMP.det.k}" aria-label="${T("Bloque", "Block")}"></p>
        <p class="je-k">${T("TAMAÑO", "SIZE")}</p>
        <p class="je-fila">${b("tam", "exacto", T("EXACTO (EL CUADRO TOMA SU TAMAÑO)", "EXACT (FRAME TAKES ITS SIZE)"))}${b("tam", "ajustar", `${T("AJUSTAR A", "FIT TO")} ${cuadro().width}×${cuadro().height}`)}</p>
        ${o.tam === "ajustar" ? `<p class="je-fila">${b("muestreo", "pixel", T("NITIDO", "SHARP"))}${b("muestreo", "suave", T("SUAVIZADO (FOTOS)", "SMOOTH (PHOTOS)"))}</p>` : ""}
        <p class="je-fila">${b("recorta", !o.recorta, `${o.recorta ? "■" : "□"} ${T("RECORTAR LO VACIO ALREDEDOR", "TRIM EMPTY BORDER")}`)}</p>
        <p class="je-k">${T("FONDO Y TRANSPARENCIA", "BACKGROUND AND TRANSPARENCY")}</p>
        <p class="je-fila">${b("fondo", !o.fondo, `${o.fondo ? "■" : "□"} ${T("QUITAR COLOR DE FONDO", "REMOVE BACKGROUND COLOR")}`)}${o.fondo ? `<span class="je-k">${T("TOLERANCIA", "TOLERANCE")}</span><input type="range" class="jx-rango jx-imptol" min="0" max="120" value="${o.tol}">` : ""}</p>
        <p class="je-fila">${b("alfa", !o.alfa, `${o.alfa ? "■" : "□"} ${T("TRANSPARENCIA LIMPIA", "CLEAN TRANSPARENCY")}`, T("Cada pixel queda visible o invisible, sin medios tonos", "Every pixel is either visible or not, no half tones"))}</p>
        <p class="je-k">${T("COLORES", "COLORS")}</p>
        <p class="je-fila">${b("col", "exactos", T("EXACTOS DE LA IMAGEN", "EXACT FROM IMAGE"))}${b("col", "paleta", T("PASAR A LA PALETA", "MAP TO PALETTE"))}<button type="button" class="je-b" data-x="imppal" title="${T("Los 16 colores más usados de la imagen se vuelven la paleta", "The image's 16 most used colors become the palette")}">${T("USAR SUS COLORES EN LA PALETA", "USE ITS COLORS AS PALETTE")}</button></p>
        <p class="je-k">${T("HOJA DE SPRITES (SE PARTE EN CUADROS)", "SPRITE SHEET (SPLIT INTO FRAMES)")}</p>
        <p class="je-k">${T("COLUMNAS", "COLUMNS")} <input type="number" class="je-in jx-impc1" min="1" max="32" value="${o.cols}"> ${T("FILAS", "ROWS")} <input type="number" class="je-in jx-impf1" min="1" max="32" value="${o.filas}"></p>
        <p class="je-k">${T("PONERLA EN", "PUT IT IN")}</p>
        <p class="je-fila">${b("destino", "este", T("ESTE CUADRO", "THIS FRAME"))}${b("destino", "nuevos", T("CUADROS NUEVOS", "NEW FRAMES"))}</p>
        <p class="je-fila"><button type="button" class="je-b je-v" data-x="impok">✓ ${T("IMPORTAR", "IMPORT")}</button><button type="button" class="je-b" data-x="impno">${T("CANCELAR", "CANCEL")}</button></p>
      </div></div></div></div>`;
  }
  function accionImp(v) {
    const [op, val] = v.split(":"), o = IMP.o;
    o[op] = val === "true" ? true : val === "false" ? false : /^\d+$/.test(val) ? +val : val;
    pinta();
  }
  function aplicaImportar() {
    const r = IMP.res || procesa(), fr = X.est[X.ei].frames, d = fr[X.fi].d;
    sinSel();
    const nuevos = r.celdas.map((im) => ({ im, d }));
    if (IMP.o.destino === "este") { fr.splice(X.fi, 1, ...nuevos); } else { fr.splice(X.fi + 1, 0, ...nuevos); X.fi++; }
    X.imp = false; X.zoom = 0; X.pan = { x: 0, y: 0 };
    anota(r.celdas.length > 1 ? T(`Importar hoja (${r.celdas.length} cuadros)`, `Import sheet (${r.celdas.length} frames)`) : T("Importar imagen", "Import image"));
    nota(T(`Imagen importada: ${r.celdas[0].width}×${r.celdas[0].height}${r.k > 1 ? `, bloques de ×${r.k}` : ""}.`, `Image imported: ${r.celdas[0].width}×${r.celdas[0].height}${r.k > 1 ? `, ×${r.k} blocks` : ""}.`));
  }
  function pintaVistaImp() {
    const cv = $(".jx-impv", raiz), r = IMP.res;
    if (!cv || !r) return;
    const n = r.celdas.length, w = r.celdas[0].width, hh = r.celdas[0].height, porFila = Math.min(n, Math.max(1, Math.floor(480 / (w + 2)))), filas = Math.ceil(n / porFila);
    const z = Math.max(1, Math.min(12, Math.floor(Math.min(480 / (porFila * (w + 2)), 300 / (filas * (hh + 2))))));
    cv.width = porFila * (w + 2) * z; cv.height = filas * (hh + 2) * z;
    const x = cv.getContext("2d"); x.imageSmoothingEnabled = false;
    r.celdas.forEach((im, i) => { const px = (i % porFila) * (w + 2) * z + z, py = Math.floor(i / porFila) * (hh + 2) * z + z; for (let yy = 0; yy < hh; yy += 4) for (let xx = 0; xx < w; xx += 4) { x.fillStyle = ((xx + yy) / 4) % 2 ? grisDe(X.luz, 22) : grisDe(X.luz, 10); x.fillRect(px + xx * z, py + yy * z, Math.min(4, w - xx) * z, Math.min(4, hh - yy) * z); } tela.width = w; tela.height = hh; telaX.putImageData(im, 0, 0); x.drawImage(tela, px, py, w * z, hh * z); });
  }
  // Arrastrar una imagen al lienzo, o pegarla
  raiz.addEventListener("dragover", (ev) => { if (X.vista === "pintar" && ev.dataTransfer && [...ev.dataTransfer.types].includes("Files")) ev.preventDefault(); });
  raiz.addEventListener("drop", (ev) => { if (X.vista !== "pintar") return; const f = ev.dataTransfer && ev.dataTransfer.files[0]; if (f) { ev.preventDefault(); abreImportar(f); } });
  document.addEventListener("paste", (ev) => {
    if (S.estado !== "escenas" || X.vista !== "pintar" || raiz.hidden) return;
    const it = [...((ev.clipboardData && ev.clipboardData.items) || [])].find((x) => x.type.startsWith("image/"));
    if (it) { ev.preventDefault(); abreImportar(it.getAsFile()); } else if (!X.clip) nota(T("No hay nada copiado.", "Nothing copied."));
  });

  /* ---------- Teclado ---------- */
  function teclaEscenas(ev) {
    const kk = ev.key.toLowerCase(), enCasilla = /^(input|textarea|select)$/i.test((ev.target && ev.target.tagName) || "") && ev.target.type !== "range" && ev.target.type !== "color";
    if (kk === " " && X.vista === "pintar" && !enCasilla) { ev.preventDefault(); ev.stopPropagation(); X.espacio = ev.type === "keydown"; if (X.lp) X.lp.style.cursor = X.espacio ? "grab" : ""; return; }
    if (ev.type !== "keydown") return;
    if (enCasilla) { if (kk === "enter" || kk === "escape") ev.target.blur(); return; }
    const ctrl = ev.ctrlKey || ev.metaKey, pin = X.vista === "pintar";
    if (ctrl && kk === "s") { ev.preventDefault(); if (pin) guardaCuadros(); guardaYa(true); return; }
    if (ctrl && (kk === "z" || kk === "y")) { ev.preventDefault(); const atras = kk === "z" && !ev.shiftKey; if (pin) irH(X.hi + (atras ? -1 : 1)); else irHC(X.hci + (atras ? -1 : 1)); return; }
    if (pin && ctrl) {
      if (kk === "c") { ev.preventDefault(); copiaSel(); }
      else if (kk === "x") { ev.preventDefault(); cortaSel(); }
      else if (kk === "v") { if (X.clip) { ev.preventDefault(); pega(); } /* si no, el navegador manda "paste": puede traer una imagen */ }
      else if (kk === "a") { ev.preventDefault(); X.flot = null; X.selR = { x: 0, y: 0, w: cuadro().width, h: cuadro().height }; X.herr = "selec"; pinta(); }
      else if (kk === "d") { ev.preventDefault(); accion("cdup"); }
      else if (kk === "=" || kk === "+" || kk === "-") { ev.preventDefault(); zoomA(kk === "-" ? -1 : 1); }
      else if (kk === "0") { ev.preventDefault(); zoomA(0); }
      return;
    }
    if (ctrl || ev.altKey) return;
    ev.preventDefault(); ev.stopPropagation();
    if (kk === "escape" && pin && X.imp) { X.imp = false; pinta(); return; }
    if (pin && X.imp) { if (kk === "enter") aplicaImportar(); return; }
    if (kk === "escape") { if (pin && X.selR) { sinSel(); pinta(); } else if (pin) accion("listo"); else sale(); return; }
    if (!pin) {
      if (kk === "arrowup" || kk === "arrowdown") { X.sel = Math.max(0, Math.min(X.esc.capas.length - 1, X.sel + (kk === "arrowup" ? -1 : 1))); pinta(); }
      else if (kk === "enter" && capaP() && capaP().k === "pintura") entraPintar();
      else if (kk === "delete") accion("quita");
      return;
    }
    if (X.hi < 0) return;
    if (ev.shiftKey && (kk === "h" || kk === "v")) { volteaTodo(kk === "h"); return; }
    const h2 = HERRS.find((x) => x[3].toLowerCase() === kk);
    if (h2) accion("herr", h2[0]);
    else if (kk === "x") accion("espejo");
    else if (kk === "k") accion("centra");
    else if (kk === "c") accion("cuad");
    else if (kk === "u") accion("cebolla");
    else if (kk === "n") accion("cnuevo");
    else if (kk === "p") accion("anima");
    else if (kk === "enter") { X.flot = null; X.selR = null; pinta(); }
    else if (kk === "delete" || kk === "backspace") borraSel();
    else if (kk === "[" || kk === "]") { const g = [1, 2, 3, 5], i = g.indexOf(X.grosor); X.grosor = g[Math.max(0, Math.min(3, i + (kk === "]" ? 1 : -1)))]; pinta(); }
    else if (kk === "+" || kk === "=" || kk === "-") zoomA(kk === "-" ? -1 : 1);
    else if (kk === "0") zoomA(0);
    else if (kk === "arrowleft" || kk === "," || kk === "arrowright" || kk === ".") irCuadro(X.ei, X.fi + (kk === "arrowleft" || kk === "," ? -1 : 1));
    else if (kk === "arrowup" || kk === "arrowdown") irCuadro(X.ei + (kk === "arrowup" ? -1 : 1), 0);
    else if (kk >= "1" && kk <= "9" && kk.length === 1) accion("color", String(+kk - 1));
  }

  /* ---------- Dibujo de cada cuadro de pantalla ---------- */
  function dibujaCuadro(cv, im) { const x = cv.getContext("2d"); x.clearRect(0, 0, cv.width, cv.height); x.putImageData(im, 0, 0); }
  const tela = document.createElement("canvas"), telaX = tela.getContext("2d");
  // El cuadro que toca en la animación del estado (por segundos o por golpe)
  function cuadroAnim(q, t) {
    const n = q.frames.length;
    if (q.golpe) return Math.floor(t * 2) % n;
    const total = q.frames.reduce((a, f) => a + f.d, 0), largo = q.loop ? total : total + 0.6;
    let tt = t % largo, i = 0;
    while (i < n - 1 && tt >= q.frames[i].d) { tt -= q.frames[i].d; i++; }
    return i;
  }
  function dibuja() {
    const t = ahora(), golpe = Math.floor(t * 2), pulso = Math.max(0, 1 - (t * 2 - golpe) * 2.2);
    if (X.vista === "capas") {
      const cv = $(".jx-vista", raiz), d = (k2) => (X.disp[k2] != null && t >= X.disp[k2] ? t - X.disp[k2] : null);
      if (cv) BB.pintaEscenario(X.esc, cv.getContext("2d"), cv.width, cv.height, { t, pulso, golpe, ataque: d("ataque"), ataqueDur: 0.6, acierto: d("acierto"), fallo: d("fallo"),
        tGolpe: (t * 2 % 1) / 2, combo: X.combo, tramo: d("tramo"), energia: X.energia, eventos: X.evento && t >= X.evento.t ? [{ n: X.evento.n, dt: t - X.evento.t, d: 0 }] : [] });
      return;
    }
    const cv = X.lp;
    if (!cv || !capaP() || !X.est.length) return;
    const im = cuadro(), c = { w: im.width, h: im.height }, r = cv.getBoundingClientRect(), dp = Math.min(2, window.devicePixelRatio || 1);
    if (!r.width || !r.height) return;
    if (cv.width !== Math.round(r.width * dp) || cv.height !== Math.round(r.height * dp)) { cv.width = Math.round(r.width * dp); cv.height = Math.round(r.height * dp); }
    const x = cv.getContext("2d"); x.setTransform(dp, 0, 0, dp, 0, 0); x.imageSmoothingEnabled = false;
    const ajuste = Math.max(1, Math.floor(Math.min(r.width / c.w, r.height / c.h))), z = X.zoom || ajuste;
    const ox = Math.floor((r.width - c.w * z) / 2 + (X.zoom ? X.pan.x : 0)), oy = Math.floor((r.height - c.h * z) / 2 + (X.zoom ? X.pan.y : 0));
    if (!X.lpM || X.lpM.z !== z) { const zv = $(".jx-zoomv", raiz); if (zv) zv.textContent = `×${z}`; }
    X.lpM = { z, ox, oy };
    x.clearRect(0, 0, r.width, r.height);
    // Cuadritos de lo transparente, con la luz elegida
    const l = X.luz, ca = grisDe(l, l > 0.5 ? -10 : 10), cb = grisDe(l, l > 0.5 ? -24 : 22), paso = 4;
    for (let yy = 0; yy < c.h; yy += paso) for (let xx = 0; xx < c.w; xx += paso) { x.fillStyle = ((xx + yy) / paso) % 2 ? cb : ca; x.fillRect(ox + xx * z, oy + yy * z, Math.min(paso, c.w - xx) * z, Math.min(paso, c.h - yy) * z); }
    if (tela.width !== c.w || tela.height !== c.h) { tela.width = c.w; tela.height = c.h; }
    // Papel cebolla: el cuadro anterior del mismo estado, tenue
    const fr = X.est[X.ei].frames;
    if (X.cebolla && X.fi > 0 && fr[X.fi - 1]) { const pv = fr[X.fi - 1].im, t2 = Object.assign(document.createElement("canvas"), { width: pv.width, height: pv.height }); t2.getContext("2d").putImageData(pv, 0, 0); x.globalAlpha = 0.28; x.drawImage(t2, ox + Math.floor((c.w - pv.width) / 2) * z, oy + Math.floor((c.h - pv.height) / 2) * z, pv.width * z, pv.height * z); x.globalAlpha = 1; }
    telaX.putImageData(im, 0, 0); x.drawImage(tela, ox, oy, c.w * z, c.h * z);
    const linea2 = l > 0.5 ? "rgba(0,0,0,.16)" : "rgba(255,255,255,.09)";
    if (X.cuad && z >= 5) { x.fillStyle = linea2; for (let xx = 0; xx <= c.w; xx++) x.fillRect(ox + xx * z, oy, 1, c.h * z); for (let yy = 0; yy <= c.h; yy++) x.fillRect(ox, oy + yy * z, c.w * z, 1); }
    if (X.espejo) { x.fillStyle = "rgba(0,200,255,.7)"; x.fillRect(ox + (c.w * z) / 2, oy, 1, c.h * z); }
    x.strokeStyle = l > 0.5 ? "#555a6e" : "#3a4058"; x.lineWidth = 1; x.strokeRect(ox - 0.5, oy - 0.5, c.w * z + 1, c.h * z + 1);
    // La selección: hormigas que caminan
    if (X.selR) {
      const s = X.selR; x.save(); x.lineWidth = 1; x.setLineDash([4, 4]);
      x.strokeStyle = "#000000"; x.lineDashOffset = -(performance.now() / 60) % 8; x.strokeRect(ox + s.x * z + 0.5, oy + s.y * z + 0.5, s.w * z - 1, s.h * z - 1);
      x.strokeStyle = "#ffffff"; x.lineDashOffset = 4 - (performance.now() / 60) % 8; x.strokeRect(ox + s.x * z + 0.5, oy + s.y * z + 0.5, s.w * z - 1, s.h * z - 1); x.restore();
    }
    // Las miniaturas de los cuadros y la animación del estado
    raiz.querySelectorAll("[data-cq]").forEach((q) => { const i = +q.dataset.cq; if (fr[i] && (i === X.fi || q._im !== fr[i].im)) { if (q.width !== fr[i].im.width || q.height !== fr[i].im.height) { q.width = fr[i].im.width; q.height = fr[i].im.height; } dibujaCuadro(q, fr[i].im); q._im = fr[i].im; } });
    const an = $(".jx-anim", raiz);
    if (an) { const fi = X.anima ? cuadroAnim(X.est[X.ei], (performance.now() - (X.tAnima || 0)) / 1000) : X.fi; if (fr[fi]) { const q2 = fr[fi].im; if (an.width !== q2.width || an.height !== q2.height) { an.width = q2.width; an.height = q2.height; } dibujaCuadro(an, q2); an.style.background = grisDe(l); } }
  }
})();