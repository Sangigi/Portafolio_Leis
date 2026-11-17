/* ---------- BIT & BUGS · personal.js: modo personalizado, paso 1: SELECCIONA TU MÚSICA ---------- */
/* El jugador carga una canción desde su dispositivo (MP3, WAV u OGG). Nada se sube: el archivo se lee en el navegador y
   se guarda en este mismo navegador (IndexedDB) para volver a abrirlo sin buscarlo de nuevo. De cada canción se guarda
   el archivo, su nombre, duración, tamaño y la forma de onda ya calculada (120 barras), para dibujarla al instante.
   Con la canción elegida: CREAR MAPA abre el editor de ritmo (editor.js); si ya tiene mapa, JUGAR la juega y EDITAR MAPA
   lo abre de nuevo. */
(() => {
  "use strict";
  const BB = window.BitBugs, S = BB.S;
  const { $, T, bip, el, msg, kb, tactil, irA, titulo, aviso, mmss } = BB;
  Object.assign(BB, { personal, pintaPersonal, mueveP, accionP, editaP, cargaArchivo, borraP, escuchaP, paraP });

  const TIPOS = /\.(mp3|wav|ogg|oga)$/i, MAX_MB = 40, MAX_MIN = 10, BARRAS = 120;
  S.pLista = []; S.pSel = 0; S.pVisto = false; S.pNota = ""; S.pBorrar = -1; S.pCargando = false; S.pDb = null; S.pAudio = null; S.pUrl = ""; S.pRaf = 0;

  /* ---------- Guardado en el navegador (IndexedDB). Si no se puede (modo privado), quedan solo en esta visita ---------- */
  function db() {
    if (S.pDb) return S.pDb;
    S.pDb = new Promise((ok, mal) => {
      if (!window.indexedDB) { mal(new Error("sin IndexedDB")); return; }
      // Versión 2: además de las canciones, los escenarios que crea el jugador (escenarios.js)
      const r = indexedDB.open("bitBugs", 2);
      r.onupgradeneeded = () => { for (const n of ["canciones", "escenarios"]) if (!r.result.objectStoreNames.contains(n)) r.result.createObjectStore(n, { keyPath: "id" }); };
      r.onsuccess = () => ok(r.result);
      r.onerror = () => mal(r.error);
    }).catch((e) => { S.pDb = null; throw e; });
    return S.pDb;
  }
  const almacen = (modo, n = "canciones") => db().then((d) => d.transaction(n, modo).objectStore(n));
  // Para escenarios.js: leer, guardar y borrar en cualquier almacén
  BB.idb = { todas: (n) => almacen("readonly", n).then((s) => pide(s.getAll())), guarda: (n, x) => almacen("readwrite", n).then((s) => pide(s.put(x))), borra: (n, id) => almacen("readwrite", n).then((s) => pide(s.delete(id))) };
  const pide = (rq) => new Promise((ok, mal) => { rq.onsuccess = () => ok(rq.result); rq.onerror = () => mal(rq.error); });
  const leeTodas = () => almacen("readonly").then((s) => pide(s.getAll())).then((l) => l.sort((a, b) => b.fecha - a.fecha));
  const guardaUna = (c) => almacen("readwrite").then((s) => pide(s.put(c)));
  const borraUna = (id) => almacen("readwrite").then((s) => pide(s.delete(id)));
  BB.guardaCancion = guardaUna;
  // Las canciones del jugador con mapa, para la fila de canciones del título
  BB.cargaMias = () => leeTodas().then((l) => { S.pLista = l; S.misMapas = l.filter(conMapa).sort((a, b) => a.fecha - b.fecha); if (S.selMia && !S.misMapas.some((c) => c.id === S.selMia)) { S.selMia = null; if (S.R && S.R.personal) BB.ponCancion(S.cancionI); } else if (S.selMia && S.estado === "titulo") BB.eligeMia(S.selMia); }).catch(() => {});
  // Elegir en el título una canción del jugador: queda como la canción en juego, con sus discos de dificultad
  BB.eligeMia = (id) => {
    const c = (S.misMapas || []).find((x) => x.id === id) || S.pLista.find((x) => x.id === id);
    if (!c || !conMapa(c)) return;
    if (S.miaUrl) URL.revokeObjectURL(S.miaUrl);
    S.miaUrl = URL.createObjectURL(c.archivo);
    BB.ponPersonal(BB.construyeR(c, JSON.parse(JSON.stringify(c.mapa)), S.miaUrl));
    S.selMia = id;
  };

  /* ---------- El selector de archivo (oculto) y soltar el archivo encima ---------- */
  const entrada = document.createElement("input");
  entrada.type = "file";
  entrada.accept = ".mp3,.wav,.ogg,.oga,audio/mpeg,audio/wav,audio/x-wav,audio/ogg";
  entrada.hidden = true;
  el.appendChild(entrada);
  entrada.addEventListener("change", () => { const f = entrada.files && entrada.files[0]; entrada.value = ""; if (f) cargaArchivo(f); });
  el.addEventListener("dragover", (e) => { if (S.estado !== "personal") return; e.preventDefault(); const z = $(".jp-zona", msg); if (z) z.classList.add("encima"); });
  el.addEventListener("dragleave", (e) => { if (S.estado !== "personal" || el.contains(e.relatedTarget)) return; const z = $(".jp-zona", msg); if (z) z.classList.remove("encima"); });
  el.addEventListener("drop", (e) => { if (S.estado !== "personal") return; e.preventDefault(); const f = e.dataTransfer && e.dataTransfer.files[0]; if (f) cargaArchivo(f); else pintaPersonal(); });

  /* ---------- La pantalla ---------- */
  // pSel: 0 es la casilla "+ CARGAR"; de ahí en adelante, las canciones guardadas
  function personal() {
    S.estado = "personal"; S.pNota = ""; S.pBorrar = -1;
    BB.paraPrevia();
    pintaPersonal();
    leeTodas().then((l) => { S.pLista = l; if (S.pSel > l.length || (S.pSel === 0 && l.length && !S.pVisto)) S.pSel = l.length ? 1 : 0; S.pVisto = true; if (S.estado === "personal") pintaPersonal(); })
      .catch(() => { S.pNota = T("Este navegador no deja guardar canciones: solo se quedan mientras esté abierta la página.", "This browser can't store songs: they only last while the page is open."); if (S.estado === "personal") pintaPersonal(); });
  }
  const cancion = () => (S.pSel > 0 ? S.pLista[S.pSel - 1] : null);
  const megas = (b) => `${(b / 1048576).toFixed(b < 10485760 ? 1 : 0)} MB`;
  function pintaPersonal() {
    if (S.estado !== "personal") return;
    const c = cancion();
    const fichas = S.pLista.map((x, i) => `<button type="button" class="jp-c${S.pSel === i + 1 ? " jm-sel" : ""}${S.pBorrar === i + 1 ? " jp-borra" : ""}" data-pc="${i + 1}"><b>${limpia(x.nombre)}</b><i>${mmss(x.dur)} · ${x.mapa && x.mapa.notas.length ? `${x.mapa.notas.length} BUGS` : x.ext.toUpperCase()}</i></button>`).join("");
    const det = c
      ? `<div class="jp-det"><canvas class="jp-onda" width="${BARRAS * 3}" height="48"></canvas>
          <p class="jp-dato"><b>${limpia(c.nombre)}</b> · ${mmss(c.dur)} · ${megas(c.tam)} · ${c.ext.toUpperCase()}</p></div>`
      : `<p class="jp-dato jp-gris">${T("Elige una canción guardada o carga una nueva.", "Pick a saved song or load a new one.")}</p>`;
    aviso(`<p class="jm-t jm-t2">${T("TU MUSICA", "YOUR MUSIC")}</p>
      <p class="jp-local">${T("REPRODUCCION LOCAL · el archivo no se sube: se lee y se queda en este navegador", "LOCAL PLAYBACK · the file is never uploaded: it is read and kept in this browser")}</p>
      <button type="button" class="jp-zona${S.pSel === 0 ? " jm-sel" : ""}${S.pCargando ? " cargando" : ""}" data-j="pcargar"><b>${S.pCargando ? T("LEYENDO...", "READING...") : `+ ${T("SELECCIONAR ARCHIVO", "SELECT FILE")}`}</b><i>${tactil ? "" : T("o arrástralo aquí · ", "or drop it here · ")}MP3 · WAV · OGG · ${T(`hasta ${MAX_MIN} min`, `up to ${MAX_MIN} min`)}</i></button>
      <div class="jk-caja jk-act"><p class="jk-paso"><b>${S.pLista.length}</b> ${T("TUS CANCIONES", "YOUR SONGS")}</p>${S.pLista.length ? `<div class="jp-fila">${fichas}</div>` : `<p class="jp-gris">${T("Todavía no hay ninguna.", "None yet.")}</p>`}</div>
      ${det}
      <p class="jd-info jp-nota">${S.pNota || (S.pBorrar > 0 ? T("¿Borrarla de este navegador? Vuelve a pulsar BORRAR para confirmar.", "Delete it from this browser? Press DELETE again to confirm.") : "")}</p>
      <p class="jm-b jm-uno">${c ? (conMapa(c) ? `<button type="button" class="jm-prim" data-j="pjugar">${kb("ENTER")}${T("JUGAR", "PLAY")}</button>` : `<button type="button" class="jm-prim" data-j="pmapa">${kb("ENTER")}${T("CREAR MAPA", "MAKE MAP")}</button>`) : `<button type="button" class="jm-prim" data-j="pcargar">${kb("ENTER")}${T("CARGAR CANCION", "LOAD SONG")}</button>`}</p>
      <p class="jm-b jm-dos">${c && conMapa(c) ? `<button type="button" data-j="pmapa">${kb("E")}${T("EDITAR MAPA", "EDIT MAP")}</button>` : ""}${c ? `<button type="button" data-j="pescucha">${kb(T("ESPACIO", "SPACE"))}${S.pAudio && !S.pAudio.paused ? T("PAUSA", "PAUSE") : T("ESCUCHAR", "LISTEN")}</button><button type="button" data-j="pborra">${kb(T("SUPR", "DEL"))}${T("BORRAR", "DELETE")}</button>` : ""}<button type="button" data-j="pescenas">${kb("S")}${T("MIS ESCENARIOS", "MY SCENES")}</button><button type="button" data-j="titulo">${kb("ESC")}${T("VOLVER", "BACK")}</button></p>
      ${tactil ? "" : `<p class="jf-gris">← → ${T("elige", "choose")}</p>`}`);
    if (c) dibujaOnda();
  }
  const conMapa = (c) => !!(c && c.mapa && c.mapa.notas && c.mapa.notas.length);
  const limpia = (s) => String(s).replace(/[<>&"]/g, (ch) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[ch]);

  // La forma de onda: barras amarillas; lo ya escuchado, en verde. Un toque sobre ella salta a ese punto
  function dibujaOnda() {
    const cv = $(".jp-onda", msg), c = cancion();
    if (!cv || !c) return;
    const x = cv.getContext("2d"), hh = cv.height, avance = S.pAudio && S.pUrl === c.id && c.dur ? S.pAudio.currentTime / c.dur : 0;
    x.clearRect(0, 0, cv.width, hh);
    c.picos.forEach((v, i) => { const a = Math.max(2, Math.round(v * (hh - 4))); x.fillStyle = i / c.picos.length < avance ? "#41B883" : "#FFD319"; x.fillRect(i * 3, Math.round((hh - a) / 2), 2, a); });
    if (avance > 0) { x.fillStyle = "#ffffff"; x.fillRect(Math.round(avance * cv.width), 0, 1, hh); }
  }
  msg.addEventListener("click", (e) => {
    if (S.estado !== "personal") return;
    const pc = e.target.closest("[data-pc]");
    if (pc) { const i = +pc.dataset.pc; if (i === S.pSel) accionP(); else { S.pSel = i; S.pBorrar = -1; S.pNota = ""; paraP(); bip(880, 0, 0.03, "square", 0.03); pintaPersonal(); } return; }
    const cv = e.target.closest(".jp-onda"), c = cancion();
    if (cv && c) { const r = cv.getBoundingClientRect(), f = (e.clientX - r.left) / r.width; escuchaP(true); if (S.pAudio) S.pAudio.currentTime = f * c.dur; }
  });

  /* ---------- Cargar un archivo: revisar, leer, calcular su forma de onda y guardarlo ---------- */
  function cargaArchivo(f) {
    if (S.pCargando) return;
    const ext = (f.name.match(TIPOS) || [])[1];
    const no = (es, en) => { S.pCargando = false; S.pNota = T(es, en); bip(160, 110, 0.18, "square", 0.05); pintaPersonal(); };
    if (!ext && !/^audio\/(mpeg|mp3|wav|x-wav|wave|ogg)$/.test(f.type)) { no("Ese archivo no es MP3, WAV ni OGG.", "That file is not MP3, WAV or OGG."); return; }
    if (f.size > MAX_MB * 1048576) { no(`Pesa ${megas(f.size)}: el límite es ${MAX_MB} MB.`, `It weighs ${megas(f.size)}: the limit is ${MAX_MB} MB.`); return; }
    S.pCargando = true; S.pNota = ""; pintaPersonal();
    const Ctx = window.AudioContext || window.webkitAudioContext;
    f.arrayBuffer()
      // decodeAudioData avisa por callback (Safari viejo) o por promesa (los demás): se atienden las dos
      .then((ab) => new Promise((ok, mal) => { const ac = new Ctx(); let cerrado = false; const fin = () => { if (cerrado) return; cerrado = true; const c = ac.close && ac.close(); if (c && c.catch) c.catch(() => {}); }; const pr = ac.decodeAudioData(ab, (b) => { ok(b); fin(); }, (er) => { mal(er); fin(); }); if (pr && pr.catch) pr.catch((er) => { mal(er); fin(); }); }))
      .then((b) => {
        if (b.duration > MAX_MIN * 60 + 1) { no(`Dura ${mmss(b.duration)}: el límite es de ${MAX_MIN} minutos.`, `It lasts ${mmss(b.duration)}: the limit is ${MAX_MIN} minutes.`); return; }
        if (b.duration < 10) { no("Es muy corta: necesita al menos 10 segundos.", "It's too short: it needs at least 10 seconds."); return; }
        const c = { id: `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, nombre: f.name.replace(/\.[^.]+$/, "").slice(0, 60) || "cancion", ext: ext || f.type.split("/")[1].replace("x-", "").replace("mpeg", "mp3"), tam: f.size, dur: b.duration, fecha: Date.now(), picos: picos(b), archivo: f };
        S.pLista.unshift(c); S.pSel = 1; S.pCargando = false;
        S.pNota = T("Lista: se guardó en este navegador.", "Ready: saved in this browser.");
        [523, 659, 784, 1047].forEach((fr, i) => bip(fr, 0, 0.08, "square", 0.04, i * 0.05));
        pintaPersonal();
        guardaUna(c).catch(() => { S.pNota = T("Lista, pero este navegador no la pudo guardar: solo durará esta visita.", "Ready, but this browser couldn't store it: it only lasts this visit."); pintaPersonal(); });
      })
      .catch(() => no("No se pudo leer el audio: puede que el archivo esté dañado o que el navegador no lo soporte.", "The audio couldn't be read: the file may be damaged or unsupported by this browser."));
  }
  // La forma de onda: el pico de cada uno de los 120 pedazos de la canción, de 0 a 1
  function picos(b) {
    const d = b.getChannelData(0), d2 = b.numberOfChannels > 1 ? b.getChannelData(1) : null, n = d.length, out = [], paso = Math.max(1, Math.floor(n / BARRAS / 400));
    let max = 0;
    for (let i = 0; i < BARRAS; i++) {
      let m = 0; const a = Math.floor((i * n) / BARRAS), z = Math.floor(((i + 1) * n) / BARRAS);
      for (let j = a; j < z; j += paso) { const v = Math.abs(d[j]) + (d2 ? Math.abs(d2[j]) : 0); if (v > m) m = v; }
      out.push(m); if (m > max) max = m;
    }
    return out.map((v) => Math.round((max ? v / max : 0) * 100) / 100);
  }

  /* ---------- Escuchar, elegir, borrar ---------- */
  function escuchaP(forzar) {
    const c = cancion();
    if (!c) return;
    if (S.pAudio && S.pUrl === c.id) { if (S.pAudio.paused || forzar) S.pAudio.play().catch(() => {}); else S.pAudio.pause(); pintaPersonal(); return; }
    paraP();
    const url = URL.createObjectURL(c.archivo), a = new Audio(url);
    S.pAudio = a; S.pUrl = c.id; a._url = url; a.volume = 0.8;
    a.addEventListener("ended", () => pintaPersonal());
    a.play().catch(() => {});
    const anima = () => { if (S.pAudio !== a) return; if (S.estado !== "personal" || el.hidden) { paraP(); return; } dibujaOnda(); S.pRaf = requestAnimationFrame(anima); };
    S.pRaf = requestAnimationFrame(anima);
    pintaPersonal();
  }
  function paraP() {
    cancelAnimationFrame(S.pRaf);
    if (S.pAudio) { try { S.pAudio.pause(); } catch (e) { /* nada */ } URL.revokeObjectURL(S.pAudio._url); }
    S.pAudio = null; S.pUrl = "";
  }
  function mueveP(d) {
    const n = S.pLista.length + 1;
    S.pSel = (S.pSel + d + n) % n; S.pBorrar = -1; S.pNota = "";
    paraP(); bip(880, 0, 0.03, "square", 0.03); pintaPersonal();
  }
  // ENTER: en "+ CARGAR" abre el selector; sobre una canción con mapa, la juega; si no tiene, abre el editor
  function accionP() {
    if (S.pSel === 0) { entrada.click(); return; }
    const c = cancion();
    if (conMapa(c)) juegaP(c); else editaP();
  }
  function editaP() {
    const c = cancion();
    if (!c) return;
    paraP(); bip(660, 990, 0.06, "triangle", 0.04);
    irA(() => BB.abreEditor(c));
  }
  // Jugar la canción del jugador con su mapa, en la dificultad elegida en el título
  function juegaP(c) {
    paraP();
    const url = URL.createObjectURL(c.archivo);
    irA(() => { BB.ponPersonal(BB.construyeR(c, JSON.parse(JSON.stringify(c.mapa)), url)); S.prueba = false; S.practica = null; S.D = BB.DIFS[S.dif] || BB.DIFS.medio; BB.empezarRitmo(); });
  }
  function borraP() {
    const c = cancion();
    if (!c) return;
    if (S.pBorrar !== S.pSel) { S.pBorrar = S.pSel; S.pNota = ""; bip(330, 220, 0.1, "square", 0.04); pintaPersonal(); return; }
    paraP();
    S.pLista.splice(S.pSel - 1, 1);
    S.pSel = Math.min(S.pSel, S.pLista.length); S.pBorrar = -1;
    S.pNota = T("Borrada de este navegador.", "Deleted from this browser.");
    bip(300, 80, 0.2, "sawtooth", 0.04);
    borraUna(c.id).catch(() => {});
    pintaPersonal();
  }
  // Los botones de esta pantalla
  BB.accionesP = { pcargar: () => entrada.click(), pmapa: editaP, pjugar: accionP, pescucha: () => escuchaP(), pborra: borraP, pescenas: () => { paraP(); BB.abreEscenas({ volver: () => { S.estado = "personal"; irA(() => BB.personal()); } }); } };
  // Al salir de la pantalla, se calla
  BB.salePersonal = () => { paraP(); S.pBorrar = -1; };
  BB.irPersonal = () => irA(personal);
  BB.volverDePersonal = () => { paraP(); irA(titulo); };
})();