/* ---------- BIT & BUGS · editor.js: modo personalizado, paso 2: el EDITOR DE RITMO ---------- */
/* Se abre desde TU MUSICA con una canción del jugador. La vista es como se juega: los bugs bajan por los 5 carriles hacia
   la línea amarilla (la de BIT), que marca el momento que suena. Arriba, la canción completa con sus tramos.

   El mapa de cada canción se guarda junto con ella (IndexedDB, en personal.js):
     bpm, aj        tempo y ajuste de la rejilla (segundo del primer golpe)
     notas          [{ t: segundo, c: carril 0 a 4, k: tipo de bug }]
     tramos         [{ t: segundo en que empieza, n: nombre, k: normal | lateral | vuelo | jefe, e: escenario, v: velocidad }]
   Al jugar o probar, el mapa se convierte en una canción como las de js/ritmo-*.js (construyeR) con personal: true. */
(() => {
  "use strict";
  const BB = window.BitBugs, S = BB.S;
  const { $, T, bip, el, mmss, tactil, irA } = BB;
  Object.assign(BB, { abreEditor, teclaEditor, volverAlEditor, escenaPersonal, construyeR, ponPersonal });

  /* ---------- Catálogos ---------- */
  // Los bugs que se pueden poner: [tipo del juego, nombre, color]
  const BICHOS_ED = [["bug", "COMUN", "#FF3D3D"], ["oro", "DORADO", "#FFD319"], ["arco", "ARCOIRIS", "arco"], ["glitch", "GLITCH", "#ECEBE4"], ["gemelo", "GEMELOS", "#38BDF8"],
    ["bomba", "BOMBA", "#c9c6b8"], ["polilla", "POLILLA", "#c084ff"], ["acorazado", "ACORAZADO", "#8f93a8"], ["reloj", "RELOJ", "#7dffb4"]];
  // Los escenarios que se pueden elegir por tramo: [clave, lista, número, nombre]. Son los de los niveles del juego
  const ESC_ED = [["f0", "F", 0, "ASCENSO"], ["f1", "F", 1, "SALE EL SOL"], ["f2", "F", 2, "AUTOPISTA"], ["f3", "F", 3, "RASCACIELOS"], ["f4", "F", 4, "ARCADE"],
    ["f5", "F", 5, "FABRICA"], ["f6", "F", 6, "FABRICA EN LLAMAS"], ["f7", "F", 7, "DJ"], ["f8", "F", 8, "PLANETAS"], ["f9", "F", 9, "LA LUNA"], ["f10", "F", 10, "CASETERA"],
    ["f11", "F", 11, "BRILLANTINA"], ["f12", "F", 12, "CINTURON"], ["f13", "F", 13, "MULTIVERSO"], ["f14", "F", 14, "ORBITA"], ["f15", "F", 15, "PUERTAS"],
    ["u1", "U", 1, "CIUDAD NEON"], ["u2", "U", 2, "BAJO EL AGUA"], ["u3", "U", 3, "DESPEGUE"], ["u5", "U", 5, "NOCHE EN CALMA"], ["u6", "U", 6, "LLUVIA DE CODIGO"], ["u7", "U", 7, "HIPERESPACIO"], ["u8", "U", 8, "ABISMO"],
    ["g1", "G", 1, "BOSQUE MALDITO"], ["g2", "G", 2, "CATACUMBAS"], ["g4", "G", 4, "LA TORRE"], ["g5", "G", 5, "LA HOGUERA"]];
  const ESC_MAPA = Object.fromEntries(ESC_ED.map((x) => [x[0], x]));
  const TIPOS_TR = [["normal", "NORMAL"], ["lateral", "LATERAL"], ["vuelo", "VUELO"], ["jefe", "JEFE"]];
  const VEL = [[1.6, "LENTA"], [1.2, "NORMAL"], [0.95, "RAPIDA"]];
  const COL_TR = ["#3a3fc0", "#a0247c", "#c88c08", "#b4241c", "#1c7c9c", "#2c9c6c", "#7a3fc0", "#c84c10"];
  const lista = (l) => (l === "F" ? BB.ESCENAS_F : l === "G" ? BB.ESCENAS_G : BB.ESCENAS);

  /* ---------- El mapa ---------- */
  const mapaNuevo = (c) => ({ bpm: 120, aj: 0, notas: [], tramos: [{ t: 0, n: "INTRO", k: "normal", e: "f2", v: 1.2 }], v: 1 });
  const ordena = (m) => { m.notas.sort((a, b) => a.t - b.t || a.c - b.c); m.tramos.sort((a, b) => a.t - b.t); m.tramos[0].t = 0; m.eventos = (m.eventos || []).sort((a, b) => a.t - b.t); };
  const tramoEn = (m, t) => { let i = 0; while (i < m.tramos.length - 1 && t >= m.tramos[i + 1].t) i++; return i; };
  const finTramo = (m, i, dur) => (i < m.tramos.length - 1 ? m.tramos[i + 1].t : dur);

  // Convierte el mapa en una canción del juego (el formato de js/ritmo-*.js)
  function construyeR(c, m, url) {
    ordena(m);
    const dur = c.dur, tr = m.tramos, idx = (k) => tr.findIndex((x) => x.k === k);
    const sec = tr.map((x, i) => [x.t, finTramo(m, i, dur), x.v || 1.2, m.bpm, x.n || `TRAMO ${i + 1}`, x.n || `SECTION ${i + 1}`]);
    const notas = [], pc = [], pt = [];
    for (const n of m.notas) { if (n.t < 0.6 || n.t > dur - 0.2) continue; notas.push(Math.round(n.t * 1000), 0, 0); pc.push(n.c); pt.push(n.k); }
    const golpes = [], beat = 60 / (m.bpm || 120);
    for (let t = m.aj - Math.ceil(m.aj / beat) * beat; t < dur; t += beat) if (t >= 0) golpes.push(Math.round(t * 100));
    const jefe = idx("jefe"), vuelo = idx("vuelo"), lateral = idx("lateral");
    return {
      personal: true, tema: "personal", id: c.id, titulo: c.nombre, corto: c.nombre, artista: T("TU MUSICA", "YOUR MUSIC"), enlace: "",
      archivo: url, dur, volumen: 0.85, desfase: 0, sec, notas, pc, pt, golpes,
      energia: c.energia || "5".repeat(Math.ceil(dur * 2) + 2),
      jefe: jefe >= 0 ? jefe : 99, vuelo: vuelo >= 0 ? vuelo : 99, lateral: lateral >= 0 ? lateral : null,
      calma: [], fuerte: jefe >= 0 ? [jefe] : [], sube: [], tranquila: [], pistas: sec.map(() => ["", ""]),
      error: 9e9, asomos: [], escenas: tr.map((x) => x.e), eventos: (m.eventos || []).slice().sort((a, b) => a.t - b.t),
    };
  }
  // Pone la canción del jugador como la canción en juego (sin tocar la que está elegida en el título)
  function ponPersonal(R) {
    BB.detieneAudio();
    if (BB.audios && BB.audios[R.id]) { try { BB.audios[R.id].pause(); } catch (e) { /* nada */ } delete BB.audios[R.id]; }
    S.R = R; S.JEFE = R.jefe; S.VUELO = R.vuelo;
    BB.armaMapa();
  }
  // El escenario de cada tramo de una canción del jugador
  function escenaPersonal(esc) {
    const k = (S.R.escenas || [])[S.secI] || "", mia = k.startsWith("m:") && S.misEscenas.find((e) => e.id === k.slice(2));
    if (mia) {
      // Un escenario hecho por el jugador: late con la canción y su jefe ataca cuando sale un ataque
      let at = null, atD = 0;
      for (const a of S.ataques || []) { const d = S.ts - a.t0; if (d >= 0 && (at == null || d < at)) { at = d; atD = (a.t1 || a.t0) - a.t0; } }
      const desde = (k) => (S[k] != null && S.ts >= S[k] ? S.ts - S[k] : null);
      const c2 = BB.c2; c2.save(); c2.setTransform(1, 0, 0, 1, 0, 0); c2.globalAlpha = 1; c2.globalCompositeOperation = "source-over";
      try { BB.pintaEscenario(mia, c2, S.FW, S.FH, { t: S.ts, pulso: S.pulso || 0, golpe: S.golpeN || 0, ataque: at, ataqueDur: atD, acierto: desde("tAcierto"), fallo: desde("tFallo"),
        tGolpe: S.rG > 0 ? S.ts - S.R.golpes[S.rG - 1] / 100 : null, combo: S.combo || 0, tramo: S.R.sec[S.secI] ? S.ts - S.R.sec[S.secI][0] : null, energia: S.energiaAhora || 0,
        eventos: (S.R.eventos || []).filter((ev) => ev.t <= S.ts && S.ts - ev.t < 30).reverse().map((ev) => ({ n: ev.n, dt: S.ts - ev.t, d: ev.d })) }); } finally { c2.restore(); }
      return;
    }
    const x = ESC_MAPA[k] || ESC_MAPA.f2;
    try { lista(x[1])[x[2]]({ ...esc, sec: S.R.sec[S.secI] || S.R.sec[0] }); }
    catch (e) { const c2 = BB.c2; c2.setTransform(1, 0, 0, 1, 0, 0); c2.globalAlpha = 1; c2.globalCompositeOperation = "source-over"; c2.fillStyle = "#05060c"; c2.fillRect(0, 0, S.FW, S.FH); }
  }

  /* ---------- La pantalla del editor ---------- */
  const raiz = document.createElement("div");
  raiz.className = "je";
  raiz.hidden = true;
  el.appendChild(raiz);
  const E = { c: null, m: null, audio: null, url: "", cur: 0, ventana: 4, rej: 2, herr: "poner", rec: false, bicho: "bug", sel: null, tr: 0, des: [], reh: [], taps: [], vel: 1, raf: 0, guardaT: 0, arr: null, nota: "", miniT: {}, minis: 0 };
  S.ed = E;

  function abreEditor(c) {
    E.c = c; E.m = c.mapa ? JSON.parse(JSON.stringify(c.mapa)) : mapaNuevo(c);
    ordena(E.m);
    E.cur = Math.min(E.cur && E.c === c ? E.cur : 0, c.dur); E.sel = null; E.tr = 0; E.des = []; E.reh = []; E.rec = false; E.nota = "";
    if (E.url) URL.revokeObjectURL(E.url);
    E.url = URL.createObjectURL(c.archivo);
    E.audio = new Audio(E.url); E.audio.preservesPitch = true; E.audio.playbackRate = E.vel;
    S.estado = "editor"; S.modo = "clasico";
    BB.aviso("");
    el.classList.add("je-on");
    raiz.hidden = false;
    arma();
    if (!c.energia) energiaDe(c);
    cancelAnimationFrame(E.raf);
    const cuadro = () => { if (S.estado !== "editor" || el.hidden) { para(); return; } dibuja(); E.raf = requestAnimationFrame(cuadro); };
    E.raf = requestAnimationFrame(cuadro);
    pintaMinis();
    BB.cargaEscenas().then(() => pintaPaneles());
  }
  // El nombre de un escenario del catálogo o de los del jugador ("m:<id>")
  const nombreEsc = (k) => { if (k && k.startsWith("m:")) { const e = S.misEscenas.find((x) => x.id === k.slice(2)); return e ? e.nombre : ESC_MAPA.f2[3]; } return (ESC_MAPA[k] || ESC_MAPA.f2)[3]; };
  // Pasa al editor de escenarios y, al volver, pone el escenario en el tramo elegido
  function aEscenarios(eid) {
    const c = E.c, i = E.tr;
    cierraEditor(false);
    BB.abreEscenas({ eid, volver: (id) => { if (id && E.m.tramos[i]) { E.des.push(JSON.stringify(E.m)); E.m.tramos[i].e = `m:${id}`; } abreEditor(c); E.tr = i; pintaPaneles(); guardaYa(); } });
  }
  function cierraEditor(irAPersonal) {
    para(); cancelAnimationFrame(E.raf);
    guardaYa();
    raiz.hidden = true; el.classList.remove("je-on");
    if (irAPersonal) { S.estado = "personal"; irA(() => BB.personal()); }
  }
  // Regresa del modo prueba al editor, en el punto donde iba la canción
  function volverAlEditor() {
    const donde = S.ts;
    BB.detieneAudio();
    BB.cierraVentana(); BB.cierraOrden();
    S.prueba = false; S.modo = "clasico"; S.estado = "editor"; S.objs = []; S.ataques = []; S.vuela = false; S.lateral = false; S.latK = 0; S.fiebre = 0; S.negro = false; S.cierre = null;
    BB.ponCancion(S.cancionI);
    BB.hud();
    if (E.c) { E.cur = Math.max(0, Math.min(E.c.dur, donde || E.cur)); abreEditor(E.c); }
  }

  // La energía de la canción (de 0 a 9, cada medio segundo): mueve la cámara y los escenarios al jugar
  function energiaDe(c) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    c.archivo.arrayBuffer().then((ab) => new Promise((ok, mal) => { const ac = new Ctx(); let cerrado = false; const fin = () => { if (cerrado) return; cerrado = true; const p = ac.close && ac.close(); if (p && p.catch) p.catch(() => {}); }; const pr = ac.decodeAudioData(ab, (b) => { ok(b); fin(); }, (er) => { mal(er); fin(); }); if (pr && pr.catch) pr.catch((er) => { mal(er); fin(); }); }))
      .then((b) => {
        const d = b.getChannelData(0), paso = Math.floor(b.sampleRate / 2), n = Math.ceil(d.length / paso), rms = [];
        for (let i = 0; i < n; i++) { let s = 0, k = 0; for (let j = i * paso; j < Math.min(d.length, (i + 1) * paso); j += 8) { s += d[j] * d[j]; k++; } rms.push(Math.sqrt(s / Math.max(1, k))); }
        const max = Math.max(...rms) || 1;
        c.energia = rms.map((v) => Math.min(9, Math.round((v / max) * 9))).join("") + "0";
        BB.guardaCancion(c);
      }).catch(() => {});
  }

  /* ---------- Estructura de la pantalla ---------- */
  function arma() {
    raiz.innerHTML = `
      <div class="je-bar"><span>C:\\BIT.EXE · ${T("EDITOR DE RITMO", "RHYTHM EDITOR")} · ${limpia(E.c.nombre)}</span><button type="button" data-e="salir">${tactil ? "" : "[ESC] "}${T("SALIR", "EXIT")}</button></div>
      <div class="je-trans">
        <button type="button" class="je-b je-play" data-e="play"></button><span class="je-t"></span>
        <span class="je-k">${T("VELOCIDAD", "SPEED")}</span>${[0.5, 0.75, 1].map((v) => `<button type="button" class="je-b" data-e="vel" data-v="${v}">${v}x</button>`).join("")}
        <span class="je-k">${T("TEMPO", "TEMPO")}</span><input class="je-in je-bpm" type="number" min="40" max="300" step="0.1" aria-label="BPM"><span class="je-k">BPM</span><button type="button" class="je-b" data-e="tap">${tactil ? "" : "[T] "}TAP</button>
        <span class="je-k">${T("AJUSTE", "OFFSET")}</span><button type="button" class="je-b" data-e="aj" data-v="-0.01">-</button><span class="je-aj"></span><button type="button" class="je-b" data-e="aj" data-v="0.01">+</button><button type="button" class="je-b" data-e="ajaqui">${T("AQUI", "HERE")}</button>
        <span class="je-k">${T("REJILLA", "GRID")}</span>${[1, 2, 4, 8, 0].map((v) => `<button type="button" class="je-b" data-e="rej" data-v="${v}">${v ? `1/${v}` : T("LIBRE", "FREE")}</button>`).join("")}
        <span class="je-k">ZOOM</span><button type="button" class="je-b" data-e="zoom" data-v="1">-</button><button type="button" class="je-b" data-e="zoom" data-v="-1">+</button>
      </div>
      <canvas class="je-vista"></canvas>
      <div class="je-cuerpo">
        <div class="je-panel je-tramos"></div>
        <div class="je-carr"><canvas class="je-lienzo"></canvas></div>
        <div class="je-panel je-herr"></div>
      </div>
      <div class="je-pie">
        <button type="button" class="je-b je-v" data-e="probar">${tactil ? "" : "[P] "}${T("PROBAR DESDE AQUI", "TEST FROM HERE")}</button>
        <button type="button" class="je-b" data-e="deshacer">${tactil ? "" : "[CTRL+Z] "}${T("DESHACER", "UNDO")}</button><button type="button" class="je-b" data-e="rehacer">${T("REHACER", "REDO")}</button>
        <button type="button" class="je-b je-y" data-e="guardar">${tactil ? "" : "[CTRL+S] "}${T("GUARDAR", "SAVE")}</button><button type="button" class="je-b" data-e="exportar">${T("EXPORTAR", "EXPORT")} .JSON</button><button type="button" class="je-b" data-e="importar">${T("IMPORTAR", "IMPORT")}</button>
        <span class="je-stat"></span>
        <p class="je-ayuda"></p>
      </div>`;
    E.vista = $(".je-vista", raiz); E.lz = $(".je-lienzo", raiz);
    $(".je-bpm", raiz).addEventListener("change", (e) => { const v = Math.max(40, Math.min(300, +e.target.value || 120)); cambia(() => { E.m.bpm = Math.round(v * 10) / 10; }); });
    pintaPaneles();
  }
  const limpia = (s) => String(s).replace(/[<>&"]/g, (ch) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[ch]);
  // Lo que cambia con cada acción: botones encendidos, lista de tramos, herramientas y números
  function pintaPaneles() {
    if (S.estado !== "editor") return;
    const m = E.m, i = E.tr = Math.min(E.tr, m.tramos.length - 1), tr = m.tramos[i];
    raiz.querySelectorAll('[data-e="vel"]').forEach((b) => b.classList.toggle("on", +b.dataset.v === E.vel));
    raiz.querySelectorAll('[data-e="rej"]').forEach((b) => b.classList.toggle("on", +b.dataset.v === E.rej));
    const bpm = $(".je-bpm", raiz); if (document.activeElement !== bpm) bpm.value = m.bpm;
    $(".je-aj", raiz).textContent = `${m.aj >= 0 ? "+" : ""}${m.aj.toFixed(2)} s`;
    $(".je-tramos", raiz).innerHTML = `<p class="je-tit">${T("TRAMOS", "SECTIONS")}</p>` + m.tramos.map((x, j) => `<button type="button" class="je-tr${j === i ? " on" : ""}" data-e="tramo" data-v="${j}" style="--c:${COL_TR[j % COL_TR.length]}"><b>${limpia(x.n || `TRAMO ${j + 1}`)}</b><i>${mmss(x.t)} · ${T(TIPOS_TR.find((y) => y[0] === x.k)[1], x.k.toUpperCase())}</i></button>`).join("")
      + `<p class="je-fila"><button type="button" class="je-b" data-e="tramo+">+ ${T("TRAMO AQUI", "SECTION HERE")}</button><button type="button" class="je-b" data-e="tramo-"${i ? "" : " disabled"}>${T("BORRAR TRAMO", "DELETE SECTION")}</button></p>`;
    $(".je-herr", raiz).innerHTML = `<p class="je-tit">${T("HERRAMIENTAS", "TOOLS")}</p>
      <p class="je-fila"><button type="button" class="je-b je-rec${E.rec ? " on" : ""}" data-e="rec">● ${tactil ? "" : "[R] "}${T("GRABAR", "RECORD")}</button><button type="button" class="je-b${E.herr === "poner" ? " on" : ""}" data-e="herr" data-v="poner">${T("PONER", "PLACE")}</button><button type="button" class="je-b${E.herr === "borrar" ? " on" : ""}" data-e="herr" data-v="borrar">${T("BORRAR", "ERASE")}</button></p>
      <p class="je-k">${T("BUG AL PONER", "BUG TO PLACE")}</p>
      <p class="je-fila je-bichos">${BICHOS_ED.map(([k, n]) => `<button type="button" class="je-bi${E.bicho === k ? " on" : ""}" data-e="bicho" data-v="${k}" title="${n}"><canvas width="30" height="26" data-bicho="${k}"></canvas><i>${n}</i></button>`).join("")}</p>
      <p class="je-k">${T("TRAMO", "SECTION")} ${i + 1}: <input class="je-in je-nom" maxlength="18" value="${limpia(tr.n || "")}" aria-label="${T("Nombre del tramo", "Section name")}"> · ${mmss(tr.t)}-${mmss(finTramo(m, i, E.c.dur))}</p>
      <p class="je-fila">${TIPOS_TR.map(([k, n]) => `<button type="button" class="je-b${tr.k === k ? " on" : ""}" data-e="tipo" data-v="${k}">${n}</button>`).join("")}</p>
      <p class="je-fila"><span class="je-k">${T("CAIDA", "FALL")}</span>${VEL.map(([v, n]) => `<button type="button" class="je-b${(tr.v || 1.2) === v ? " on" : ""}" data-e="caida" data-v="${v}">${n}</button>`).join("")}</p>
      <p class="je-k">${T("ESCENARIO", "SCENE")}: <b>${limpia(nombreEsc(tr.e))}</b></p>
      <p class="je-k">${T("MIS ESCENARIOS", "MY SCENES")}</p>
      <div class="je-escs je-mias">${S.misEscenas.map((x) => `<button type="button" class="je-es${tr.e === `m:${x.id}` ? " on" : ""}" data-e="esc" data-v="m:${x.id}" title="${limpia(x.nombre)}"><img src="${BB.miniEscena(x)}" alt=""><i>${limpia(x.nombre)}</i></button>`).join("")}<button type="button" class="je-es je-esn" data-e="escnueva"><b>+</b><i>${T("NUEVO ESCENARIO", "NEW SCENE")}</i></button></div>
      ${String(tr.e).startsWith("m:") ? `<p class="je-fila"><button type="button" class="je-b je-y" data-e="esceditar">✎ ${T("EDITAR ESTE ESCENARIO", "EDIT THIS SCENE")}</button></p>` : ""}
      ${panelEventos(i)}
      <p class="je-k">${T("DEL JUEGO", "FROM THE GAME")}</p>
      <div class="je-escs">${ESC_ED.map(([k, , , n]) => `<button type="button" class="je-es${tr.e === k ? " on" : ""}" data-e="esc" data-v="${k}" title="${n}">${E.miniT[k] ? `<img src="${E.miniT[k]}" alt="">` : ""}<i>${n}</i></button>`).join("")}</div>`;
    $(".je-nom", raiz).addEventListener("change", (e) => cambia(() => { E.m.tramos[E.tr].n = e.target.value.trim().toUpperCase().slice(0, 18); }));
    { const sn = $(".je-evn", raiz), sd = $(".je-evd", raiz); if (sn) sn.addEventListener("change", () => { E.evN = sn.value; }); if (sd) sd.addEventListener("change", () => { E.evD = Math.max(0, Math.min(30, +sd.value || 0)); }); }
    raiz.querySelectorAll("[data-bicho]").forEach((cv) => sprite(cv.getContext("2d"), cv.dataset.bicho, 2, 2, 2));
    $(".je-stat", raiz).textContent = `${m.notas.length} BUGS · ${m.tramos.length} ${T("TRAMOS", "SECTIONS")} · ${E.c.dur ? (m.notas.length / E.c.dur * 60).toFixed(0) : 0} ${T("POR MINUTO", "PER MINUTE")}`;
    $(".je-ayuda", raiz).textContent = E.nota || (tactil
      ? T("Toca un carril para poner un bug · arrastra para moverte · GRABAR: toca los carriles mientras suena", "Tap a lane to place a bug · drag to scroll · RECORD: tap the lanes while it plays")
      : T("ESPACIO suena · 1 a 5 pone un bug donde va la canción · clic pone, arrastra mueve, clic derecho borra · rueda o ↑ ↓ se mueve · R graba", "SPACE plays · 1 to 5 places a bug at the playhead · click places, drag moves, right click erases · wheel or ↑ ↓ scrolls · R records"));
  }
  /* ---------- EVENTOS: hacer que un estado de tus escenarios pase en el segundo que tú digas ---------- */
  // Los nombres de estado que se pueden disparar: los de los escenarios propios que usa este mapa (menos REPOSO)
  function estadosDisponibles() {
    const ids = new Set(E.m.tramos.map((x) => String(x.e)).filter((k) => k.startsWith("m:")).map((k) => k.slice(2))), nombres = new Map();
    for (const e of S.misEscenas) if (ids.has(e.id)) for (const c of e.capas) if (c.k === "pintura") for (const q of c.estados || []) if (q.uso !== "reposo") nombres.set(q.n, (nombres.get(q.n) || 0) + (q.uso === "evento" ? 10 : 1));
    return [...nombres.keys()].sort((a, b) => nombres.get(b) - nombres.get(a) || a.localeCompare(b));
  }
  function panelEventos(i) {
    const m = E.m, nombres = estadosDisponibles(), t0 = m.tramos[i].t, t1 = finTramo(m, i, E.c.dur), aqui = (m.eventos || []).filter((ev) => ev.t >= t0 && ev.t < t1);
    if (!nombres.includes(E.evN)) E.evN = nombres[0] || "";
    return `<p class="je-k">★ ${T("EVENTOS DEL ESCENARIO", "SCENE EVENTS")}</p>` + (nombres.length
      ? `<p class="je-fila"><select class="je-in je-evn" aria-label="${T("Estado", "State")}">${nombres.map((n) => `<option${n === E.evN ? " selected" : ""}>${limpia(n)}</option>`).join("")}</select>
          <span class="je-k">${T("DURA", "LASTS")}</span><input type="number" class="je-in je-evd" min="0" max="30" step="0.1" value="${E.evD || 0}" title="${T("0 = lo que dura el estado", "0 = the state's own length")}"><span class="je-k">s</span>
          <button type="button" class="je-b je-y" data-e="ev+">+ ${tactil ? "" : "[V] "}${T("EVENTO AQUI", "EVENT HERE")}</button></p>
        <div class="je-evs">${aqui.length ? aqui.map((ev) => `<p class="je-ev"><button type="button" class="je-b" data-e="evir" data-v="${m.eventos.indexOf(ev)}">${mmss(ev.t)}.${Math.floor((ev.t % 1) * 10)}</button><b>★ ${limpia(ev.n)}</b><i>${ev.d ? ev.d + "s" : T("auto", "auto")}</i><button type="button" class="je-b" data-e="evx" data-v="${m.eventos.indexOf(ev)}" aria-label="${T("Quitar", "Remove")}">✕</button></p>`).join("") : `<p class="je-k">${T("Ninguno en este tramo.", "None in this section.")}</p>`}</div>`
      : `<p class="je-k">${T("Pon un escenario tuyo en algún tramo y crea en él un estado (por ejemplo con uso EVENTO). Aquí podrás decir en qué segundo pasa.", "Use one of your scenes in a section and give it a state (e.g. with use EVENT). Then pick here the second it happens.")}</p>`);
  }
  function nuevoEvento() {
    if (!E.evN) { E.nota = T("Primero crea un estado en uno de tus escenarios.", "First create a state in one of your scenes."); pintaPaneles(); return; }
    const t = Math.round(pega(ahora()) * 100) / 100, n = E.evN, d = E.evD || 0;
    cambia(() => { E.m.eventos = (E.m.eventos || []).filter((ev) => !(Math.abs(ev.t - t) < 0.01 && ev.n === n)); E.m.eventos.push({ t, n, d }); });
    E.nota = T(`Evento ★ ${n} en ${mmss(t)}.`, `Event ★ ${n} at ${mmss(t)}.`); bip(1200, 80, 0.06, "square", 0.03); pintaPaneles();
  }
  // Las miniaturas de los escenarios: cada uno se pinta un instante en el lienzo de efectos y se copia en chico
  function pintaMinis() {
    const pend = ESC_ED.filter((x) => !E.miniT[x[0]]);
    if (!pend.length) return;
    const uno = () => {
      const x = pend.shift();
      if (!x || S.estado !== "editor") return;
      const c2 = BB.c2, ts0 = S.ts, cv = document.createElement("canvas");
      cv.width = 96; cv.height = 54;
      try {
        S.ts = 14;
        c2.save(); lista(x[1])[x[2]]({ cx: S.FW / 2, cy: S.FH / 2, suelo: S.FH * 0.8, sec: [0, 40, 1.2, 120, "", ""] }); c2.restore();
        const w = Math.min(S.FW, S.FH * 16 / 9), hh = w * 9 / 16;
        cv.getContext("2d").drawImage(BB.fx, (S.FW - w) / 2, (S.FH - hh) / 2, w, hh, 0, 0, 96, 54);
        E.miniT[x[0]] = cv.toDataURL();
      } catch (e) { E.miniT[x[0]] = ""; }
      S.ts = ts0;
      c2.setTransform(1, 0, 0, 1, 0, 0); c2.globalAlpha = 1; c2.globalCompositeOperation = "source-over"; c2.clearRect(0, 0, S.FW, S.FH);
      const b = raiz.querySelector(`[data-e="esc"][data-v="${x[0]}"]`);
      if (b && E.miniT[x[0]] && !b.querySelector("img")) b.insertAdjacentHTML("afterbegin", `<img src="${E.miniT[x[0]]}" alt="">`);
      setTimeout(uno, 16);
    };
    setTimeout(uno, 60);
  }
  // Un bug en chico: 7 × 5 cuadritos del color de su tipo
  // Los bugs se pintan igual que en el juego: la especie del tramo (MUTA), sus colores, los especiales y el contorno negro
  function sprite(x, k, px, py, s, alfa = 1, tramo = E.tr) {
    const { BICHOS, ESPECIES, MUTA, ORO_MAPA, SANDE } = BB, col = S.col || {};
    const [esp, m0] = MUTA[tramo] || MUTA[0], cuadro = (performance.now() / 133 >> 3) % 2;
    let sp, mp;
    if (BICHOS[k]) { sp = BICHOS[k].sp; mp = BICHOS[k].m; }
    else {
      sp = ESPECIES[k === "glitch" ? "D" : esp === "R" && k !== "glitch" ? "R" : esp][cuadro] || ESPECIES.A[0];
      mp = k === "oro" ? ORO_MAPA : k === "arco" ? { R: SANDE[(performance.now() / 66 >> 2) % SANDE.length], Z: "#ffffff" } : k === "glitch" ? { R: "W", Z: "C" } : m0;
    }
    x.globalAlpha = alfa;
    // Contorno
    x.fillStyle = "#000000";
    sp.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== ".") x.fillRect(px + (i - 1) * s, py + (j - 1) * s, s * 3, s * 3); });
    sp.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const c = r[i]; if (c === ".") continue; x.fillStyle = col[(mp && mp[c]) || c] || (mp && mp[c]) || "#ff3d3d"; x.fillRect(px + i * s, py + j * s, s, s); } });
    x.globalAlpha = 1;
  }
  const tramoDe = (t) => { const tr = E.m.tramos; let i = 0; while (i + 1 < tr.length && tr[i + 1].t <= t) i++; return i; };


  /* ---------- Tiempo, rejilla y reproducción ---------- */
  const ahora = () => (E.audio && !E.audio.paused ? E.audio.currentTime : E.cur);
  const paso = () => (E.rej ? 60 / E.m.bpm / E.rej : 0);
  const pega = (t) => { const g = paso(); return g ? E.m.aj + Math.round((t - E.m.aj) / g) * g : t; };
  function play(on) {
    if (!E.audio) return;
    if (on == null) on = E.audio.paused;
    if (on) { E.audio.currentTime = E.cur; E.audio.playbackRate = E.vel; E.audio.play().catch(() => {}); }
    else { E.cur = E.audio.currentTime; E.audio.pause(); E.rec = false; }
    pintaPaneles();
  }
  function para() { if (E.audio && !E.audio.paused) { E.cur = E.audio.currentTime; E.audio.pause(); } }
  function irT(t) { E.cur = Math.max(0, Math.min(E.c.dur, t)); if (E.audio && !E.audio.paused) E.audio.currentTime = E.cur; }

  /* ---------- Cambios, deshacer y guardado ---------- */
  function cambia(fn, sinPintar) {
    E.des.push(JSON.stringify(E.m)); if (E.des.length > 80) E.des.shift();
    E.reh = [];
    fn(); ordena(E.m);
    E.nota = "";
    clearTimeout(E.guardaT); E.guardaT = setTimeout(guardaYa, 900);
    if (!sinPintar) pintaPaneles(); else $(".je-stat", raiz).textContent = `${E.m.notas.length} BUGS · ${E.m.tramos.length} ${T("TRAMOS", "SECTIONS")}`;
  }
  function deshacer(atras) {
    const de = atras ? E.des : E.reh, a = atras ? E.reh : E.des;
    if (!de.length) { bip(160, 110, 0.12, "square", 0.04); return; }
    a.push(JSON.stringify(E.m)); E.m = JSON.parse(de.pop()); E.sel = null;
    clearTimeout(E.guardaT); E.guardaT = setTimeout(guardaYa, 900);
    bip(atras ? 520 : 660, 0, 0.05, "square", 0.03); pintaPaneles();
  }
  function guardaYa(aviso) {
    clearTimeout(E.guardaT);
    if (!E.c) return;
    E.c.mapa = JSON.parse(JSON.stringify(E.m));
    BB.guardaCancion(E.c).then(() => { if (aviso) { E.nota = T("Guardado en este navegador.", "Saved in this browser."); pintaPaneles(); } })
      .catch(() => { if (aviso) { E.nota = T("No se pudo guardar en este navegador: exporta el mapa para no perderlo.", "Couldn't save in this browser: export the map so you don't lose it."); pintaPaneles(); } });
  }
  function exporta() {
    const datos = { formato: "bitbugs-mapa", version: 1, cancion: { nombre: E.c.nombre, dur: Math.round(E.c.dur * 100) / 100 }, bpm: E.m.bpm, aj: E.m.aj, tramos: E.m.tramos, eventos: E.m.eventos || [],
      notas: E.m.notas.map((n) => [Math.round(n.t * 1000) / 1000, n.c, n.k]) };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(datos)], { type: "application/json" }));
    a.download = `${E.c.nombre.replace(/[^\w\-]+/g, "_")}.bitbugs.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    E.nota = T("Mapa exportado: guárdalo para importarlo en otro navegador.", "Map exported: keep it to import it in another browser."); pintaPaneles();
  }
  const entradaJson = document.createElement("input");
  entradaJson.type = "file"; entradaJson.accept = ".json,application/json"; entradaJson.hidden = true;
  el.appendChild(entradaJson);
  entradaJson.addEventListener("change", () => {
    const f = entradaJson.files && entradaJson.files[0]; entradaJson.value = "";
    if (!f) return;
    f.text().then((txt) => {
      const d = JSON.parse(txt);
      if (d.formato !== "bitbugs-mapa" || !Array.isArray(d.notas) || !Array.isArray(d.tramos) || !d.tramos.length) throw new Error("formato");
      const tiposOk = new Set(BICHOS_ED.map((x) => x[0])), tiposTr = new Set(TIPOS_TR.map((x) => x[0]));
      cambia(() => {
        E.m.bpm = Math.max(40, Math.min(300, +d.bpm || 120)); E.m.aj = Math.max(-2, Math.min(2, +d.aj || 0));
        E.m.notas = d.notas.filter((n) => Array.isArray(n) && n[0] >= 0 && n[0] <= E.c.dur).map((n) => ({ t: +n[0], c: Math.max(0, Math.min(4, n[1] | 0)), k: tiposOk.has(n[2]) ? n[2] : "bug" }));
        E.m.tramos = d.tramos.filter((x) => x && x.t >= 0 && x.t < E.c.dur).map((x) => ({ t: +x.t, n: String(x.n || "").toUpperCase().slice(0, 18), k: tiposTr.has(x.k) ? x.k : "normal", e: ESC_MAPA[x.e] || (String(x.e).startsWith("m:") && S.misEscenas.some((y) => `m:${y.id}` === x.e)) ? x.e : "f2", v: [1.6, 1.2, 0.95].includes(+x.v) ? +x.v : 1.2 }));
        if (!E.m.tramos.length) E.m.tramos = mapaNuevo().tramos;
        E.m.eventos = (Array.isArray(d.eventos) ? d.eventos : []).filter((x) => x && x.t >= 0 && x.t < E.c.dur && x.n).map((x) => ({ t: +x.t, n: String(x.n).toUpperCase().slice(0, 14), d: Math.max(0, Math.min(30, +x.d || 0)) }));
      });
      E.nota = T(`Mapa importado: ${E.m.notas.length} bugs.`, `Map imported: ${E.m.notas.length} bugs.`); pintaPaneles();
      if (d.cancion && Math.abs((d.cancion.dur || 0) - E.c.dur) > 2) { E.nota += T(" Ojo: era de una canción de otra duración.", " Heads up: it was made for a song of a different length."); pintaPaneles(); }
    }).catch(() => { E.nota = T("Ese archivo no es un mapa de BIT & BUGS.", "That file is not a BIT & BUGS map."); bip(160, 110, 0.18, "square", 0.05); pintaPaneles(); });
  });

  /* ---------- Acciones ---------- */
  function ponNota(t, c, sinSonido) {
    t = Math.max(0, Math.min(E.c.dur - 0.2, t));
    const ya = E.m.notas.find((n) => n.c === c && Math.abs(n.t - t) < 0.04);
    if (ya) { E.sel = ya; return; }
    const n = { t: Math.round(t * 1000) / 1000, c, k: E.bicho };
    cambia(() => E.m.notas.push(n), true);
    E.sel = n;
    if (!sinSonido) bip(660 + c * 110, 0, 0.04, "square", 0.03);
  }
  function quitaNota(n) { cambia(() => { E.m.notas = E.m.notas.filter((x) => x !== n); }, true); if (E.sel === n) E.sel = null; bip(300, 120, 0.06, "square", 0.03); }
  function nuevoTramo() {
    const t = Math.round(pega(ahora()) * 100) / 100;
    if (t < 1 || t > E.c.dur - 2 || E.m.tramos.some((x) => Math.abs(x.t - t) < 1)) { E.nota = T("Ahí no cabe otro tramo (deja al menos un segundo entre tramos).", "No room for another section there (keep at least one second between sections)."); bip(160, 110, 0.12, "square", 0.04); pintaPaneles(); return; }
    const prev = E.m.tramos[tramoEn(E.m, t)];
    cambia(() => E.m.tramos.push({ t, n: `TRAMO ${E.m.tramos.length + 1}`, k: "normal", e: prev.e, v: prev.v || 1.2 }));
    E.tr = tramoEn(E.m, t); pintaPaneles();
  }
  function accion(a, v, b) {
    const m = E.m, tr = m.tramos[E.tr];
    switch (a) {
      case "salir": cierraEditor(true); break;
      case "play": play(); break;
      case "vel": E.vel = +v; if (E.audio) E.audio.playbackRate = E.vel; pintaPaneles(); break;
      case "tap": tap(); break;
      case "aj": cambia(() => { m.aj = Math.round((m.aj + +v) * 100) / 100; }); break;
      case "ajaqui": cambia(() => { m.aj = Math.round(((ahora() % (60 / m.bpm)) + 60 / m.bpm) % (60 / m.bpm) * 100) / 100; }); E.nota = T("La rejilla ahora empieza en el golpe que está en la línea.", "The grid now starts on the beat at the line."); pintaPaneles(); break;
      case "rej": E.rej = +v; pintaPaneles(); break;
      case "zoom": E.ventana = Math.max(1.5, Math.min(12, E.ventana * (+v > 0 ? 1.4 : 1 / 1.4))); break;
      case "probar": probar(); break;
      case "deshacer": deshacer(true); break;
      case "rehacer": deshacer(false); break;
      case "guardar": guardaYa(true); break;
      case "exportar": guardaYa(); exporta(); break;
      case "importar": entradaJson.click(); break;
      case "tramo": E.tr = +v; irT(m.tramos[E.tr].t); pintaPaneles(); break;
      case "tramo+": nuevoTramo(); break;
      case "ev+": nuevoEvento(); break;
      case "evx": { const j = +v; cambia(() => { m.eventos.splice(j, 1); }); } break;
      case "evir": irT(m.eventos[+v].t); break;
      case "tramo-": if (E.tr > 0) { const i = E.tr; cambia(() => m.tramos.splice(i, 1)); E.tr = i - 1; pintaPaneles(); } break;
      case "rec": E.rec = !E.rec; if (E.rec && E.audio.paused) play(true); else pintaPaneles(); break;
      case "herr": E.herr = v; pintaPaneles(); break;
      case "bicho": E.bicho = v; if (E.sel) { const s = E.sel; cambia(() => { s.k = v; }); } else pintaPaneles(); break;
      case "tipo": {
        const k = v, ya = m.tramos.findIndex((x) => x.k === k);
        cambia(() => { if (k !== "normal" && ya >= 0 && ya !== E.tr) m.tramos[ya].k = "normal"; tr.k = k; });
        if (k !== "normal" && ya >= 0 && ya !== E.tr) { E.nota = T(`Solo puede haber un tramo ${k.toUpperCase()}: el anterior pasó a NORMAL.`, `There can only be one ${k.toUpperCase()} section: the previous one became NORMAL.`); pintaPaneles(); }
        break;
      }
      case "caida": cambia(() => { tr.v = +v; }); break;
      case "esc": cambia(() => { tr.e = v; }); break;
      case "escnueva": { const n = BB.escenarioNuevo(); BB.guardaEscena(n).then(() => aEscenarios(n.id)); } break;
      case "esceditar": aEscenarios(String(tr.e).slice(2)); break;
    }
  }
  raiz.addEventListener("click", (e) => { const b = e.target.closest("[data-e]"); if (!b || b.disabled) return; accion(b.dataset.e, b.dataset.v, b); });
  // TAP: el tempo sale de los últimos toques (se reinicia si pasan más de dos segundos sin tocar)
  function tap() {
    const t = performance.now() / 1000;
    if (E.taps.length && t - E.taps[E.taps.length - 1] > 2) E.taps = [];
    E.taps.push(t); if (E.taps.length > 9) E.taps.shift();
    bip(1200, 0, 0.03, "square", 0.03);
    if (E.taps.length >= 4) { const d = (E.taps[E.taps.length - 1] - E.taps[0]) / (E.taps.length - 1), bpm = Math.round(600 / d) / 10; if (bpm >= 40 && bpm <= 300) { E.m.bpm = bpm; clearTimeout(E.guardaT); E.guardaT = setTimeout(guardaYa, 900); } }
    E.nota = E.taps.length < 4 ? T(`Sigue tocando al ritmo... (${E.taps.length}/4)`, `Keep tapping to the beat... (${E.taps.length}/4)`) : T(`Tempo: ${E.m.bpm} BPM`, `Tempo: ${E.m.bpm} BPM`);
    pintaPaneles();
  }
  // Probar: arma la canción y la juega desde donde va la línea (sin perder vidas). ESC o el final regresan aquí
  function probar() {
    if (!E.m.notas.length) { E.nota = T("Pon al menos un bug antes de probar.", "Place at least one bug before testing."); bip(160, 110, 0.12, "square", 0.04); pintaPaneles(); return; }
    const desde = Math.max(0, ahora() - 1);
    para(); guardaYa();
    raiz.hidden = true; el.classList.remove("je-on");
    ponPersonal(construyeR(E.c, E.m, E.url));
    S.prueba = true; S.practica = null;
    BB.empezarRitmo(desde);
  }

  /* ---------- El teclado del editor ---------- */
  function teclaEditor(e) {
    const k = e.key.toLowerCase(), enCasilla = /^(input|textarea|select)$/i.test((e.target && e.target.tagName) || "");
    if (e.type !== "keydown") return;
    if (enCasilla) { if (k === "enter" || k === "escape") e.target.blur(); return; }
    if ((e.ctrlKey || e.metaKey) && k === "z") { e.preventDefault(); deshacer(!e.shiftKey); return; }
    if ((e.ctrlKey || e.metaKey) && k === "y") { e.preventDefault(); deshacer(false); return; }
    if ((e.ctrlKey || e.metaKey) && k === "s") { e.preventDefault(); guardaYa(true); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault(); e.stopPropagation();
    const g = paso() || 60 / E.m.bpm / 4;
    if (k === " ") play();
    else if (k >= "1" && k <= "5" && k.length === 1) ponNota(E.audio.paused ? pega(E.cur) : pega(E.audio.currentTime - 0.03), +k - 1);
    else if (k === "escape") cierraEditor(true);
    else if (k === "p") probar();
    else if (k === "r") accion("rec");
    else if (k === "t") tap();
    else if (k === "v") nuevoEvento();
    else if (k === "delete" || k === "backspace") { if (E.sel) quitaNota(E.sel); }
    else if (k === "arrowup" || k === "arrowdown") {
      const d = k === "arrowup" ? 1 : -1;
      if (E.sel && e.shiftKey) { const s = E.sel; cambia(() => { s.t = Math.max(0, Math.min(E.c.dur - 0.2, pega(s.t + d * g))); }, true); }
      else irT(pega(ahora()) + d * g);
    }
    else if ((k === "arrowleft" || k === "arrowright") && E.sel) { const s = E.sel, d = k === "arrowleft" ? -1 : 1; cambia(() => { s.c = Math.max(0, Math.min(4, s.c + d)); }, true); }
    else if (k === "+" || k === "=") accion("zoom", -1);
    else if (k === "-") accion("zoom", 1);
    else if (k === "[" || k === "]") accion("aj", k === "[" ? -0.01 : 0.01);
  }

  /* ---------- El puntero sobre los carriles y sobre la vista general ---------- */
  const medida = () => { const cv = E.lz, r = cv.getBoundingClientRect(); return { r, w: r.width, h: r.height, linea: r.height - 34, arriba: 6 }; };
  const yDe = (t, M) => M.linea - ((t - ahora()) / E.ventana) * (M.linea - M.arriba);
  const tDe = (y, M) => ahora() + ((M.linea - y) / (M.linea - M.arriba)) * E.ventana;
  function notaEn(px, py, M) {
    const c = Math.floor((px / M.w) * 5);
    let mejor = null, d0 = 12;
    for (const n of E.m.notas) { if (n.c !== c) continue; const d = Math.abs(yDe(n.t, M) - py); if (d < d0) { d0 = d; mejor = n; } }
    return mejor;
  }
  let toque = null;
  raiz.addEventListener("pointerdown", (e) => {
    if (e.target === E.vista) { const r = E.vista.getBoundingClientRect(); irT(((e.clientX - r.left) / r.width) * E.c.dur); toque = { vista: true }; E.vista.setPointerCapture(e.pointerId); return; }
    if (e.target !== E.lz) return;
    e.preventDefault();
    E.lz.setPointerCapture(e.pointerId);
    const M = medida(), px = e.clientX - M.r.left, py = e.clientY - M.r.top, c = Math.max(0, Math.min(4, Math.floor((px / M.w) * 5)));
    // Grabando mientras suena: cada toque en un carril pone un bug donde va la canción
    if (E.rec && E.audio && !E.audio.paused) { ponNota(pega(E.audio.currentTime - 0.03), c); return; }
    const n = notaEn(px, py, M);
    if (e.button === 2) { if (n) quitaNota(n); return; }
    if (n && E.herr === "borrar") { quitaNota(n); return; }
    if (n) { E.sel = n; toque = { nota: n, y0: py, x0: px, t0: n.t, c0: n.c, movio: false, antes: JSON.stringify(E.m) }; return; }
    toque = { vacio: true, y0: py, x0: px, cur0: ahora(), c, t: tDe(py, M), movio: false };
  });
  raiz.addEventListener("pointermove", (e) => {
    if (!toque) return;
    if (toque.vista) { if (e.buttons) { const r = E.vista.getBoundingClientRect(); irT(((e.clientX - r.left) / r.width) * E.c.dur); } return; }
    const M = medida(), px = e.clientX - M.r.left, py = e.clientY - M.r.top;
    if (toque.nota) {
      if (Math.abs(py - toque.y0) + Math.abs(px - toque.x0) < 4 && !toque.movio) return;
      toque.movio = true;
      toque.nota.t = Math.max(0, Math.min(E.c.dur - 0.2, pega(toque.t0 + ((toque.y0 - py) / (M.linea - M.arriba)) * E.ventana)));
      toque.nota.c = Math.max(0, Math.min(4, Math.floor((px / M.w) * 5)));
    } else if (toque.vacio) {
      if (Math.abs(py - toque.y0) > 8) toque.movio = true;
      if (toque.movio && E.audio.paused) irT(toque.cur0 - ((toque.y0 - py) / (M.linea - M.arriba)) * E.ventana);
    }
  });
  raiz.addEventListener("pointerup", () => {
    const tq = toque; toque = null;
    if (!tq || tq.vista) return;
    if (tq.nota && tq.movio) { E.des.push(tq.antes); E.reh = []; ordena(E.m); clearTimeout(E.guardaT); E.guardaT = setTimeout(guardaYa, 900); bip(520, 0, 0.03, "square", 0.025); }
    else if (tq.vacio && !tq.movio && E.herr === "poner") ponNota(pega(tq.t), tq.c);
  });
  raiz.addEventListener("contextmenu", (e) => { if (e.target === E.lz) e.preventDefault(); });
  raiz.addEventListener("wheel", (e) => {
    if (e.target !== E.lz && e.target !== E.vista) return;
    e.preventDefault();
    if (e.ctrlKey) { accion("zoom", e.deltaY > 0 ? 1 : -1); return; }
    irT(ahora() - (e.deltaY / 500) * E.ventana);
  }, { passive: false });

  /* ---------- Dibujo de cada cuadro ---------- */
  function ajusta(cv) {
    const r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1), w = Math.max(1, Math.round(r.width * d)), hh = Math.max(1, Math.round(r.height * d));
    if (cv.width !== w || cv.height !== hh) { cv.width = w; cv.height = hh; }
    const x = cv.getContext("2d"); x.setTransform(d, 0, 0, d, 0, 0); x.imageSmoothingEnabled = false;
    return { x, w: r.width, h: r.height };
  }
  function dibuja() {
    if (!E.c || raiz.hidden) return;
    const t = ahora(), m = E.m, dur = E.c.dur;
    $(".je-t", raiz).textContent = `${mmss(t)}.${Math.floor((t % 1) * 10)} / ${mmss(dur)}`;
    const pb = $(".je-play", raiz), sonando = E.audio && !E.audio.paused;
    if (pb.dataset.s !== String(sonando)) { pb.dataset.s = String(sonando); pb.textContent = `${tactil ? "" : "[ESPACIO] "}${sonando ? "❚❚ " + T("PAUSA", "PAUSE") : "▶ PLAY"}`.replace("[ESPACIO]", T("[ESPACIO]", "[SPACE]")); pb.classList.toggle("on", sonando); }
    if (sonando && E.audio.ended) play(false);
    // Vista general: tramos, forma de onda, bugs y el pedazo que se ve
    {
      const { x, w, h: hh } = ajusta(E.vista);
      x.fillStyle = "#0c0f1a"; x.fillRect(0, 0, w, hh);
      m.tramos.forEach((tr, i) => { const a = (tr.t / dur) * w, b = (finTramo(m, i, dur) / dur) * w; x.fillStyle = COL_TR[i % COL_TR.length]; x.fillRect(a, 0, b - a - 1, 5); if (i === E.tr) { x.fillStyle = "rgba(255,255,255,.06)"; x.fillRect(a, 5, b - a - 1, hh - 5); } });
      const p = E.c.picos || [], bw = w / Math.max(1, p.length);
      p.forEach((v, i) => { const a = Math.max(1, v * (hh - 16)); x.fillStyle = (i + 0.5) / p.length < t / dur ? "#41B883" : "#7a6a1c"; x.fillRect(i * bw, 7 + (hh - 16 - a) / 2, Math.max(1, bw - 1), a); });
      x.fillStyle = "#FF3D3D"; for (const n of m.notas) x.fillRect((n.t / dur) * w, hh - 6, 1, 5);
      x.fillStyle = "#ff3fb4"; for (const ev of m.eventos || []) x.fillRect((ev.t / dur) * w - 1, 0, 3, 7);
      const a = (t / dur) * w, b = ((t + E.ventana) / dur) * w;
      x.strokeStyle = "#ffffff"; x.lineWidth = 1; x.strokeRect(a + 0.5, 0.5, Math.max(2, b - a), hh - 1);
    }
    // Los carriles
    const { x, w, h: hh } = ajusta(E.lz), M = { w, h: hh, linea: hh - 34, arriba: 6 }, lw = w / 5;
    for (let c = 0; c < 5; c++) { x.fillStyle = c % 2 ? "#0a0c16" : "#070810"; x.fillRect(c * lw, 0, lw, hh); }
    const t0 = tDe(hh, M), t1 = tDe(0, M), beat = 60 / m.bpm, g = paso() || beat;
    // Eventos: una línea rosa punteada con su estrella y su nombre
    for (const ev of m.eventos || []) { if (ev.t < t0 || ev.t > t1) continue; const y = Math.round(yDe(ev.t, M)); x.fillStyle = "#ff3fb4"; for (let xx = 0; xx < w; xx += 6) x.fillRect(xx, y, 3, 1); x.font = '7px "Press Start 2P", monospace'; const txt = `★ ${ev.n}${ev.d ? ` ${ev.d}s` : ""}`; x.fillText(txt, w - x.measureText(txt).width - 6, y - 4); }
    // Tramos: su comienzo cruza los carriles con su color y su nombre
    m.tramos.forEach((tr, i) => { if (tr.t < t0 || tr.t > t1) return; const y = yDe(tr.t, M); x.fillStyle = COL_TR[i % COL_TR.length]; x.fillRect(0, y - 1, w, 3); x.font = '8px "Press Start 2P", monospace'; x.fillText(`${tr.n || i + 1} · ${tr.k.toUpperCase()}`, 4, y - 5); });
    // Rejilla: los compases (cada 4 golpes) fuertes, los golpes medios y las subdivisiones tenues
    for (let k = Math.ceil((t0 - m.aj) / g); m.aj + k * g <= t1; k++) {
      const tt = m.aj + k * g, y = Math.round(yDe(tt, M)) + 0.5, enBeat = Math.abs(((tt - m.aj) / beat) - Math.round((tt - m.aj) / beat)) < 0.001, comp = enBeat && Math.round((tt - m.aj) / beat) % 4 === 0;
      x.fillStyle = comp ? "#3a4058" : enBeat ? "#1f2333" : "#13151f"; x.fillRect(0, y, w, 1);
      if (comp) { x.fillStyle = "#3a4058"; x.font = '7px "Press Start 2P", monospace'; x.fillText(String(Math.round((tt - m.aj) / beat / 4) + 1), w - 18, y - 3); }
    }
    // Los bugs: los que ya pasaron, apagados; el elegido, con marco
    const s = Math.max(2, Math.min(4, Math.round(lw / 30)));
    for (const n of m.notas) {
      if (n.t < t0 - 0.2 || n.t > t1 + 0.2) continue;
      const y = yDe(n.t, M), px = n.c * lw + lw / 2 - 5.5 * s, py = y - 4.5 * s;
      sprite(x, n.k, px, py, s, n.t < t - 0.02 ? 0.35 : 1, tramoDe(n.t));
      if (n === E.sel) { x.strokeStyle = "#ffffff"; x.lineWidth = 2; x.strokeRect(px - 4, py - 4, 11 * s + 8, 9 * s + 8); }
    }
    // La línea de BIT (el momento que suena) y las casillas de los carriles
    x.fillStyle = E.rec ? "#FF3D3D" : "#FFD319"; x.fillRect(0, M.linea, w, 2);
    x.fillStyle = "#0c0f1a"; x.fillRect(0, M.linea + 2, w, hh - M.linea - 2);
    x.font = '8px "Press Start 2P", monospace';
    for (let c = 0; c < 5; c++) { x.fillStyle = "#7C8098"; x.fillText(`[ ${c + 1} ]`, c * lw + lw / 2 - 20, M.linea + 21); }
    if (E.rec) { x.fillStyle = (S.t >> 4) % 2 ? "#FF3D3D" : "#7a1a1a"; x.fillText(`● ${T("GRABANDO", "RECORDING")}`, 6, 16); }
  }
})();