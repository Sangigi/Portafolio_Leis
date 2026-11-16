/* ---------- BIT & BUGS · tienda.js: bytes, skins de BIT y packs de bichos ---------- */
(() => {
  "use strict";
  const BB = window.BitBugs, S = BB.S;
  const { ESPECIES, P, SANDE, SND, T, aviso, bip, el, guarda, kb, lee, leeCol, leeJ, msg, sprUrl, tactil } = BB;
  Object.assign(BB, { aplicaSkin, compraTienda, ganaBytes, mueveTienda, musicaTienda, pintaTienda, tienda });

  /* ---------- La tienda ----------
     Los BYTES se ganan jugando en ritmo (más al terminar la canción que al caer) y se gastan en skins para BIT y en
     bichos nuevos para los bugs comunes. Todo es de adorno: no cambia la dificultad.
     SKINS: [id, nombre, precio, colores que cambia (Y cuerpo, Q sombra, W ojos, K pupilas y boca)]
     PACKS: [id, nombre, precio, especie, colores] */
  /* SKINS: [id, nombre, precio, colores, dibujo encima, animación]
     colores: Y cuerpo, Q sombra, W ojos, K pupilas y boca; y "5" a "8", los colores propios del dibujo de encima
     dibujo encima: 12 renglones de 10 (como BIT); lo que no sea punto se pinta sobre él (corona, orejas, visor...)
     animación: una función que cambia los colores cuadro a cuadro (arcoíris, glitch, diamante) */
  const SKINS = [["clasico", "CLASICO", 0, null], ["menta", "MENTA", 150, { Y: "#7dffb4", Q: "#2c9c6c" }], ["chicle", "CHICLE", 150, { Y: "#ff8ad8", Q: "#b43c8c" }], ["hielo", "HIELO", 250, { Y: "#a8f0ff", Q: "#3c8cc4" }],
    ["sandia", "SANDIA", 350, { Y: "#ff5a6c", Q: "#1c9c4c", 5: "#2c0c14", 6: "#b4ff7c" }, ["..........", "..5...5...", ".....5...5", "..........", "..........", "..........", "..........", ".5....5...", "6666666666", "..........", "..........", ".........."]],
    ["lava", "LAVA", 400, { Y: "#ff5a2a", Q: "#8c1408", W: "#ffe14a" }], ["fantasma", "FANTASMA", 400, { Y: "#f4f4ff", Q: "#a8a8cc" }],
    ["zombie", "ZOMBIE", 450, { Y: "#8cc46c", Q: "#4c7c3c", W: "#ffe14a", 5: "#2c4c1c", 6: "#e4243c" }, ["..........", "......5.5.", ".....55555", "..........", "..........", "..........", "..........", "66........", "..........", "..........", "..........", ".........."]],
    ["ninja", "NINJA", 500, { Y: "#23233a", Q: "#101020", W: "#ffffff", K: "#ffffff", 5: "#ff3d3d" }, ["..........", "5555555555", ".........5", "..........", "..........", "..........", "..........", "..........", "..........", "..........", "..........", ".........."]],
    ["diablito", "DIABLITO", 500, { Y: "#e4243c", Q: "#7c0c1c", W: "#ffe14a", 5: "#f4f4ff" }, ["55......55", "5........5", "..........", "..........", "..........", "..........", "..........", "..........", "..........", "..........", "..........", ".........."]],
    ["noche", "NOCHE", 600, { Y: "#1c2444", Q: "#0c1024", W: "#7cf4ff", K: "#7cf4ff" }],
    ["robot", "ROBOT", 600, { Y: "#a8b0c4", Q: "#5c6480", W: "#7cf4ff", K: "#0c2a9c", 5: "#ff3d3d", 6: "#5c6480" }, ["....55....", "..........", "..........", "..........", "..........", "6........6", "..........", "..........", ".6......6.", "..........", "..........", ".........."]],
    ["gato", "GATO", 800, { Y: "#b8b0a8", Q: "#6c645c", 5: "#6c645c", 7: "#ffffff", 8: "#ff8ad8" }, ["55......55", "..........", "..........", "..........", "..........", "..778877..", "..........", "...7777...", "..........", "..........", "..........", ".........."]],
    ["astro", "ASTRONAUTA", 900, { Y: "#f4f4ff", Q: "#a8a8cc", W: "#7cf4ff", K: "#0c2a9c", 5: "#3d7bff", 6: "#ff3d3d" }, ["..........", "..........", ".55555555.", "5........5", "5........5", ".55555555.", "..........", "..........", "...66.....", "..........", "..........", ".........."]],
    ["dorado", "DORADO", 1000, { Y: "#f4a81a", Q: "#8c5008", W: "#ffffff", K: "#5c2c04", 5: "#fff4a8", 6: "#c87c10" }, ["..........", ".55.......", ".5........", "..........", "..........", "..........", "..........", "........6.", ".......66.", "..........", "..........", ".........."],
      () => { const k = (S.t >> 3) % 8; S.col[1] = k === 0 ? "#fff4a8" : k === 1 || k === 7 ? "#ffd84a" : "#f4a81a"; S.col[5] = k < 2 ? "#ffffff" : "#fff4a8"; }],
    ["rey", "REY", 1200, { Y: "#b48cff", Q: "#6c3cb4", 5: "#ffe14a", 6: "#ff3d3d" }, ["5.5.55.5.5", "5565565565", "..........", "..........", "..........", "..........", "..........", "..........", "..........", "..........", "..........", ".........."]],
    ["glitch", "GLITCH", 1300, { Y: "#00f6ff", Q: "#3a3fc0", W: "#ffffff" }, null, () => { const k = (S.t >> 2) % 5; S.col[1] = k === 0 ? "#ff3fb4" : k === 3 ? "#ffffff" : "#00f6ff"; S.col[2] = k === 0 ? "#7a1a6c" : "#3a3fc0"; }],
    ["arcoiris", "ARCOIRIS", 1500, { Y: "#ff3fb4", Q: "#6c3cb4", W: "#ffffff" }, null, () => { S.col[1] = SANDE[(S.t >> 3) % SANDE.length]; S.col[2] = SANDE[((S.t >> 3) + 2) % SANDE.length]; }],
    ["diamante", "DIAMANTE", 2000, { Y: "#a8f0ff", Q: "#5c9cd4", W: "#ffffff", 5: "#ffffff" }, ["..........", "..5.......", ".5........", "..........", "..........", "..........", "..........", ".......5..", "..........", "..........", "..........", ".........."], () => { S.col[1] = ["#a8f0ff", "#d8f8ff", "#7cf4ff", "#d8c8ff"][(S.t >> 4) % 4]; }]];
  const PACKS = [["original", "ORIGINAL", 0, "A", null], ["patos", "PATITOS", 300, "P1", { R: "#ffe14a", Z: "#ff8a1a", K: "#030303" }], ["ovnis", "OVNIS", 300, "P2", { R: "#b8a8ff", Z: "#7dff3c", W: "#ffffff", C: "#7cf4ff" }], ["disquetes", "DISQUETES", 500, "P3", { R: "#3d7bff", Z: "#c9c6b8", W: "#ECEBE4", K: "#030303" }]];
  S.bytes = +(lee("bitBugsBytes") || 0) || 0; S.compras = leeJ("bitBugsCompras", {}); S.ultBytes = 0; S.tFila = 0; S.tCol = [0, 0]; S.tNota = "";
  S.skinI = Math.max(0, SKINS.findIndex((s) => s[0] === lee("bitBugsSkin"))); S.packI = Math.max(0, PACKS.findIndex((s) => s[0] === lee("bitBugsPack")));
  const SK = { Y: "1", Q: "2", W: "3", K: "4" };
  function aplicaSkin() { const m = SKINS[S.skinI][3]; if (m) for (const k in m) S.col[SK[k] || k] = m[k]; }
  // BIT con una skin puesta: las letras que la skin cambia pasan a ser sus colores, y encima va su dibujo
  const visteCon = (sk, rows) => { const m = sk[3], ov = sk[4]; if (!m) return rows; return rows.map((r, j) => { let x = r.replace(/[YQWK]/g, (ch) => (m[ch] ? SK[ch] : ch)); if (ov && ov[j]) x = [...x].map((ch, i) => (ov[j][i] && ov[j][i] !== "." ? ov[j][i] : ch)).join(""); return x; }); };
  const viste = (rows) => visteCon(SKINS[S.skinI], rows);
  const palDe = (sk) => { const p = {}; for (const k in sk[3] || {}) p[SK[k] || k] = sk[3][k]; return p; };
  function ganaBytes(n) { n = Math.max(0, Math.floor(n)); S.ultBytes = n; if (n) { S.bytes += n; guarda("bitBugsBytes", String(S.bytes)); } }
  const tLista = () => (S.tFila === 0 ? SKINS : PACKS), tMio = (it) => it[2] === 0 || !!S.compras[it[0]];
  function tienda() { S.estado = "tienda"; S.tNota = ""; pintaTienda(); musicaTienda(); }
  // La música de la tienda: suena en bucle, bajito, mientras la tienda esté abierta, y se calla sola al salir
  S.musT = null; S.musI = 0;
  function musicaTienda() {
    if (S.musT || (SND.silencio && SND.silencio())) return;
    const a = new Audio("sonidos/tienda.mp3");
    let k = 0;
    S.musT = a; a.loop = true; a.volume = 0;
    a.play().catch(() => {});
    S.musI = setInterval(() => {
      const fuera = S.estado !== "tienda" || el.hidden || document.hidden;
      k = Math.max(0, Math.min(12, k + (fuera ? -3 : 1)));
      a.volume = (k / 12) * 0.38;
      if (fuera && k === 0) { try { a.pause(); } catch (e) { /* nada */ } clearInterval(S.musI); if (S.musT === a) S.musT = null; }
    }, 60);
  }
  function pintaTienda() {
    const carta = (it, f, i) => {
      const mio = tMio(it), puesto = (f === 0 ? S.skinI : S.packI) === i, img = f === 0 ? sprUrl(visteCon(it, P() ? P().bitSprite(0, false, "s") : ["Y"]), palDe(it)) : sprUrl(ESPECIES[it[3]][0], { ...(it[4] || {}) });
      return `<button type="button" class="jt${S.tFila === f && S.tCol[f] === i ? " jm-sel" : ""}${puesto ? " jt-eq" : ""}${mio ? "" : " jt-x"}" data-tienda="${f}:${i}"><img src="${img}" alt=""><b>${it[1]}</b><i>${puesto ? T("PUESTO", "EQUIPPED") : mio ? T("TUYO", "OWNED") : `${it[2]} B`}</i></button>`;
    };
    const it = tLista()[S.tCol[S.tFila]], mio = tMio(it);
    aviso(`<p class="jt-b"><span>TIENDA.EXE</span> · BYTES <b>${S.bytes}</b></p>
      <div class="jk-caja${S.tFila === 0 ? " jk-act" : ""}"><p class="jk-paso"><b>1</b> ${T("SKINS DE BIT", "BIT SKINS")}</p><div class="jt-fila">${SKINS.map((s, i) => carta(s, 0, i)).join("")}</div></div>
      <div class="jk-caja${S.tFila === 1 ? " jk-act" : ""}"><p class="jk-paso"><b>2</b> ${T("BICHOS", "BUGS")}</p><div class="jt-fila">${PACKS.map((s, i) => carta(s, 1, i)).join("")}</div></div>
      <p class="jd-info">${S.tNota || (mio ? T("Ya es tuyo: ENTER para ponerlo.", "Already yours: ENTER to equip it.") : S.bytes >= it[2] ? T(`Cuesta ${it[2]} bytes: ENTER para comprarlo.`, `Costs ${it[2]} bytes: ENTER to buy it.`) : T(`Te faltan ${it[2] - S.bytes} bytes. Se ganan jugando con música.`, `You need ${it[2] - S.bytes} more bytes. Earn them playing with music.`))}</p>
      <p class="jk-cred">♪ Kid Games Music · <a href="https://pixabay.com/es/users/chakong-39837526/" target="_blank" rel="noopener">CHAKONG</a> ↗</p>
      <p class="jm-b"><button type="button" data-j="tcompra">${kb("ENTER")}${mio ? T("PONER", "EQUIP") : T("COMPRAR", "BUY")}</button><button type="button" data-j="titulo">${kb("M")}${T("VOLVER", "BACK")}</button></p>
      ${tactil ? "" : `<p class="jf-gris">↑ ↓ ${T("cambia de fila", "switch row")} · ← → ${T("elige", "choose")}</p>`}`);
  }
  function mueveTienda(dx, dy) {
    if (dy && S.tFila === 0) {
      // Las skins ocupan varios renglones: arriba y abajo se mueven entre ellos; solo desde el último se baja a los bichos
      const bs = [...msg.querySelectorAll('[data-tienda^="0:"]')], porFila = Math.max(1, bs.filter((b) => b.offsetTop === bs[0].offsetTop).length), n = SKINS.length, i = S.tCol[0] + dy * porFila;
      if (i >= 0 && i < n) S.tCol[0] = i;
      else if (dy > 0 && Math.floor(S.tCol[0] / porFila) < Math.floor((n - 1) / porFila)) S.tCol[0] = n - 1;
      else if (dy > 0) S.tFila = 1;
    } else if (dy < 0 && S.tFila === 1) S.tFila = 0;
    if (dx) S.tCol[S.tFila] = Math.max(0, Math.min(tLista().length - 1, S.tCol[S.tFila] + dx));
    S.tNota = ""; bip(880, 0, 0.03, "square", 0.03); pintaTienda();
  }
  function compraTienda() {
    const i = S.tCol[S.tFila], it = tLista()[i];
    if (!tMio(it)) {
      if (S.bytes < it[2]) { bip(160, 110, 0.18, "square", 0.05); S.tNota = T(`Te faltan ${it[2] - S.bytes} bytes.`, `You need ${it[2] - S.bytes} more bytes.`); pintaTienda(); return; }
      S.bytes -= it[2]; guarda("bitBugsBytes", String(S.bytes)); S.compras[it[0]] = 1; guarda("bitBugsCompras", JSON.stringify(S.compras));
      [523, 659, 784, 1047, 1319].forEach((f, k) => bip(f, 0, 0.1, "square", 0.045, k * 0.06));
      S.tNota = T(`COMPRADO: ${it[1]} es tuyo.`, `BOUGHT: ${it[1]} is yours.`);
    } else { bip(784, 0, 0.06, "triangle", 0.05); bip(1175, 0, 0.1, "triangle", 0.04, 0.06); S.tNota = ""; }
    if (S.tFila === 0) { S.skinI = i; guarda("bitBugsSkin", it[0]); leeCol(); } else { S.packI = i; guarda("bitBugsPack", it[0]); }
    pintaTienda();
  }

  Object.assign(BB, { PACKS, SK, SKINS, palDe, tLista, tMio, viste, visteCon });
})();
