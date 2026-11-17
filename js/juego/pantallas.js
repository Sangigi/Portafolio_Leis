/* ---------- BIT & BUGS · pantallas.js: título (canciones y disquetes), llave, probadita, tramos, pausa y fin del modo clásico ---------- */
(() => {
  "use strict";
  const BB = window.BitBugs, S = BB.S;
  const { $, CANCIONES, CORAZON, DIFS, LLAVE, LOGROS, P, RM, SND, T, bip, bitY, carriles, cierraOrden, cierraVentana, el, guarda, hud, kb, lee, msg, seis, svg, tactil, tiemposTeles, trEl, xBit } = BB;
  Object.assign(BB, { aviso, cambiaCancion, conDif, creditoHtml, discoHtml, eligeDisco, empezar, entraMsg, fin, guardaTramos, irA, jugar, paraPrevia, pasaAResultado, pausa, pintaTitulo, ponCancion, ponPrevia, practicar, sprUrl, telon, titulo, usaLlave, verTramos });

  /* ---------- 8. Pantallas: estante de disquetes, selector de tramos, pausa y final del modo clásico ---------- */
  function aviso(html) { msg.innerHTML = html; msg.hidden = !html; }
  /* Entre pantalla y pantalla no hay cortes: un telón de diez tiras entra desde los dos lados, cubre, y al abrirse
     el contenido nuevo llega en cascada (los disquetes caen a su estante uno por uno).
     irA(fn): cubre, cambia la pantalla con fn y abre. telon(): la pantalla ya cambió (al arrancar una partida el audio
     tiene que sonar dentro del mismo clic), así que empieza cubierto y solo se abre. */
  S.entraN = 0;
  function entraMsg() {
    if (RM) return;
    const n = ++S.entraN;
    msg.classList.remove("entra"); void msg.offsetWidth; msg.classList.add("entra");
    // Se quita sola: si no, cada vez que la pantalla se vuelve a pintar (al mover la selección) se repetiría la cascada
    setTimeout(() => { if (n === S.entraN) msg.classList.remove("entra"); }, 1100);
  }
  function irA(fn) {
    if (RM || el.hidden) { fn(); return; }
    if (S.enTrans) return;
    const n = ++S.transN;
    S.enTrans = true;
    trEl.className = "j-trans cubre";
    bip(196, 784, 0.22, "square", 0.022); bip(98, 392, 0.22, "triangle", 0.03);
    setTimeout(() => {
      if (n !== S.transN) return;
      S.enTrans = false;
      if (el.hidden) { trEl.className = "j-trans"; return; }
      fn();
      entraMsg();
      trEl.className = "j-trans abre";
      bip(784, 196, 0.24, "square", 0.02);
      setTimeout(() => { if (n === S.transN) trEl.className = "j-trans"; }, 460);
    }, 390);
  }
  function telon() {
    if (RM || el.hidden) return;
    const n = ++S.transN;
    S.enTrans = false;
    trEl.className = "j-trans tapado";
    void trEl.offsetWidth;
    trEl.className = "j-trans abre";
    bip(784, 196, 0.24, "square", 0.02);
    setTimeout(() => { if (n === S.transN) trEl.className = "j-trans"; }, 460);
  }
  // De la cuenta al resultado, también con telón
  function pasaAResultado() { if (S.finModo !== "conteo") return; S.finModo = "pasa"; irA(BB.resultado); }
  // Claves de lo que se guarda en este navegador, por canción y dificultad
  const idC = () => (S.R && S.R.id) || "uia";
  const kRec = (d) => (idC() === "uia" ? `bitBugsRitmoRecord_${d}` : `bitBugsRitmoRecord_${idC()}_${d}`);
  const kRango = (d) => `bitBugsRango_${idC()}_${d}`;
  const leeJ = (k, def) => { try { return JSON.parse(lee(k)) || def; } catch (e) { return def; } };
  const leeTramos = () => leeJ(`bitBugsTramos_${idC()}_${S.dif}`, []);
  const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const nomSec = (i) => T(S.R.sec[i][4], S.R.sec[i][5]);
  const btnEncender = () => (S.deApagado ? `<button type="button" data-j="encender">${kb("Y")}${T("ENCENDER CONSOLA", "POWER ON")}</button>` : "");
  // El crédito de la canción: el artista lleva enlace a su página
  function creditoHtml() {
    if (!S.R) return "";
    const a = S.R.artista ? (S.R.enlace ? `<a href="${S.R.enlace}" target="_blank" rel="noopener">${S.R.artista}</a>` : S.R.artista) : "";
    return `♪ ${S.R.titulo || ""}${a ? ` · ${a}` : ""}`;
  }

  /* El estante de disquetes: A: es el modo clásico y B:, C: y D: son las tres dificultades de la canción elegida.
     El disco elegido se levanta; su etiqueta lleva las vidas y, pegado encima, el mejor rango que se le ha sacado. */
  const DISCOS = ["clasico", "facil", "medio", "dificil"];
  // En qué fila del título está el teclado: 0 = canciones, 1 = discos
  S.filaSel = 1;
  function discoHtml(i, extra, rangoFijo) {
    const k = DISCOS[i], rit = i > 0, rango = rangoFijo || (rit && S.R ? lee(kRango(k)) : null);
    const nombre = rit ? T(DIFS[k].n[0], DIFS[k].n[1]) : T("CLASICO", "CLASSIC");
    const vid = Array.from({ length: rit ? DIFS[k].vidas : 3 }, () => svg(CORAZON, 2)).join("");
    return `<button type="button" class="jd jd-${k}${i === S.selDisco ? " jm-sel" : ""} ${extra || ""}" data-disco="${i}"><span class="jd-u">${"ABCD"[i]}:</span><span class="jd-met"></span><span class="jd-et"><b>${nombre}</b><i>${vid}</i><u>${rit ? S.R.corto || "RITMO" : "BIT.EXE"}</u></span>${rango ? `<em class="jd-r jm-r${rango}">${rango}</em>` : ""}</button>`;
  }
  function titulo() {
<<<<<<< HEAD
    // Si venía de una canción del jugador, el título vuelve a la canción del juego que estaba elegida
    S.prueba = false;
    if (S.R && S.R.personal) { if (S.selMia) BB.eligeMia(S.selMia); else ponCancion(S.cancionI); }
    // Las canciones del jugador que ya tienen mapa salen en la fila de canciones (se leen del navegador)
    if (BB.cargaMias) BB.cargaMias().then(() => { if (S.estado === "titulo") pintaTitulo(); });
=======
>>>>>>> origin/alt
    cierraVentana();
    cierraOrden();
    BB.detieneAudio();
    S.estado = "titulo";
    S.modo = "clasico";
    S.practica = null; S.finModo = ""; S.finN++; S.cierre = null; S.negro = false;
    S.objs = []; S.textos = []; S.grietas = []; S.destellos = []; S.fantasmas = []; S.chispas = []; S.ecos = []; S.ondas = []; S.ataques = []; S.burbujas = []; S.mensaje = "";
    S.vuela = false; S.fiebre = 0; S.combo = 0; S.bit.y = bitY();
    S.muerto = false; S.muerteIni = 0; S.peligro = S.peligroVis = 0; S.dano = 0; S.interferencia = 0;
    if (!S.R) S.selDisco = 0;
    hud();
    pintaTitulo();
  }
  // Una canción se abre al terminar la anterior y recoger su llave (la primera siempre está abierta)
  // Una canción se abre con la llave de la anterior. Tener la llave (haber terminado la anterior) no basta: hay que usarla
  // en el menú. Quien ya había jugado la canción antes de que existiera este paso la conserva abierta
  const idDe = (i) => CANCIONES[i].id || "uia";
<<<<<<< HEAD
  // La canción elegida en el título está abierta: las del jugador siempre lo están
  const abiertaSel = () => (S.R && S.R.personal ? true : cancionAbierta(S.cancionI));
  const limpiaT = (s) => String(s).replace(/[<>&"]/g, (ch) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[ch]);
  const mejorDe = (id) => ["dificil", "medio", "facil"].map((d) => lee(`bitBugsRango_${id}_${d}`)).filter(Boolean).sort((a, b) => "SABCD".indexOf(a) - "SABCD".indexOf(b))[0];
=======
>>>>>>> origin/alt
  const llaveLista = (i) => i > 0 && !!lee(`bitBugsPaso_${idDe(i - 1)}`);
  const conAvance = (i) => !!lee(`bitBugsPaso_${idDe(i)}`) || ["facil", "medio", "dificil"].some((d) => lee(`bitBugsRango_${idDe(i)}_${d}`));
  const cancionAbierta = (i) => i === 0 || (llaveLista(i) && (!!lee(`bitBugsAbre_${idDe(i)}`) || conAvance(i)));
  const porAbrir = (i) => llaveLista(i) && !cancionAbierta(i);
  // Un sprite de letras hecho imagen, para ponerlo en los menús
  const urls = {};
  function sprUrl(rows, pal) {
    const k = rows.join("") + JSON.stringify(pal);
    if (!urls[k]) { const cv = document.createElement("canvas"); cv.width = rows[0].length; cv.height = rows.length; const x = cv.getContext("2d"); rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== ".") { x.fillStyle = pal[r[i]] || S.col[r[i]] || "#ffffff"; x.fillRect(i, j, 1, 1); } }); urls[k] = cv.toDataURL(); }
    return urls[k];
  }

  /* ---------- Abrir una canción con la llave ----------
     La terminal corre UNLOCK.EXE: la llave entra al disquete, se leen y descifran sus sectores y, con un fogonazo, el
     disco se abre y aparece el nombre de la canción. Cualquier tecla o toque lo salta. */
  S.llaveI = 0; S.llaveFin = null;
  function usaLlave() {
    const i = S.cancionI, c = CANCIONES[i], nombre = `${(c.corto || c.titulo || "CANCION").toUpperCase().replace(/[^A-Z0-9]+/g, "_")}.DSK`;
    S.estado = "llave"; paraPrevia();
    const L = [`C:\\> UNLOCK.EXE B:\\${nombre}`, T("INSERTANDO LLAVE ........ OK", "INSERTING KEY ......... OK"), T("LEYENDO SECTORES  ", "READING SECTORS   "), T("DESCIFRANDO  ", "DECRYPTING   "), "CHECKSUM ................ OK"];
    aviso(`<div class="jl"><div class="jl-esc"><img class="jl-llave" src="${sprUrl(LLAVE, { Y: "#FFD319" })}" alt=""><div class="jl-disco"><span class="jl-meta"></span><span class="jl-ojo"></span><span class="jl-eti">? ? ?</span></div></div><pre class="jl-term"></pre><p class="jl-ok" hidden>*** ${T("ACCESO CONCEDIDO", "ACCESS GRANTED")} ***</p></div>`);
    const caja = $(".jl", msg), term = $(".jl-term", msg), eti = $(".jl-eti", msg), okEl = $(".jl-ok", msg), HEX = "0123456789ABCDEF", azarHex = (n) => Array.from({ length: n }, () => HEX[(Math.random() * 16) | 0] + HEX[(Math.random() * 16) | 0]).join(" ");
    let n = 0, hecho = false;
    S.llaveFin = () => { if (hecho) return; hecho = true; clearInterval(S.llaveI); S.llaveFin = null; guarda(`bitBugsAbre_${idDe(i)}`, "1"); irA(titulo); };
    if (RM) { term.textContent = L.join("\n"); okEl.hidden = false; eti.textContent = c.titulo; setTimeout(() => S.llaveFin && S.llaveFin(), 900); return; }
    bip(300, 600, 0.5, "square", 0.03);
    S.llaveI = setInterval(() => {
      if (el.hidden || S.estado !== "llave") { clearInterval(S.llaveI); S.llaveFin = null; return; }
      n++;
      // Los renglones se teclean uno tras otro; el tercero llena su barra y el cuarto revuelve números hasta el final
      const car = Math.max(0, (n - 16) * 3);
      let txt = "", resto = car;
      L.forEach((l, k) => {
        if (resto <= 0) return;
        let s = l.slice(0, resto);
        if (k === 2 && resto >= l.length) { const p = Math.min(10, Math.floor((resto - l.length) / 3)); s += `[${"#".repeat(p)}${".".repeat(10 - p)}] ${p * 10}%`; resto -= 30; }
        if (k === 3 && resto >= l.length) { s += n < 78 ? azarHex(6) : "4F 4B 20 42 49 54"; resto -= 24; }
        txt += (k ? "\n" : "") + s; resto -= l.length;
      });
      term.textContent = txt + ((n >> 2) % 2 ? "_" : "");
      if (n > 16 && n < 84 && n % 2 === 0) bip(1200 + ((n * 37) % 600), 0, 0.012, "square", 0.012);
      if (n === 18) { bip(140, 60, 0.14, "square", 0.07); bip(2400, 1200, 0.05, "square", 0.03, 0.02); }
      if (n > 40 && n < 78 && n % 6 === 0) bip(220 + (n - 40) * 14, 0, 0.05, "sawtooth", 0.02);
      // El fogonazo: el disco se abre y el nombre se va descifrando letra por letra
      if (n === 84) { caja.classList.add("jl-abre"); okEl.hidden = false; [523, 659, 784, 1047, 1319, 1568].forEach((f, k) => bip(f, 0, 0.14, "square", 0.05, k * 0.07)); bip(90, 40, 0.4, "sine", 0.09); }
      if (n >= 84) { const t0 = c.titulo, listos = Math.floor((n - 84) / 2); eti.textContent = [...t0].map((ch, k) => (k < listos || ch === " " ? ch : HEX[(Math.random() * 16) | 0])).join(""); }
      if (n > 84 + c.titulo.length * 2 + 28) S.llaveFin();
    }, 40);
  }
  /* ---------- La probadita de la canción ----------
     En el menú, medio segundo después de elegir una canción abierta empieza a sonar bajito desde su parte más fuerte
     (o desde R.previa, en segundos); a los 15 s vuelve a empezar. Se calla sola al salir del menú. */
  S.previa = null; S.previaT = 0; S.previaI = 0; S.previaId = "";
  function paraPrevia() { clearTimeout(S.previaT); clearInterval(S.previaI); S.previaId = ""; if (S.previa) { try { S.previa.pause(); } catch (e) { /* nada */ } S.previa = null; } }
  function ponPrevia() {
<<<<<<< HEAD
    if (S.estado !== "titulo" || !S.R || !abiertaSel() || S.selPersonal || (SND.silencio && SND.silencio())) { paraPrevia(); return; }
=======
    if (S.estado !== "titulo" || !S.R || !cancionAbierta(S.cancionI) || (SND.silencio && SND.silencio())) { paraPrevia(); return; }
>>>>>>> origin/alt
    const id = idC();
    if (S.previaId === id) return;
    paraPrevia(); S.previaId = id;
    S.previaT = setTimeout(() => {
      if (S.estado !== "titulo" || el.hidden || idC() !== id) return;
<<<<<<< HEAD
      const a = new Audio(S.R.archivo), ini = S.R.previa != null ? S.R.previa : (S.R.sec[(S.R.fuerte || [1])[0]] || S.R.sec[Math.min(1, S.R.sec.length - 1)])[0], vol = 0.42 * (S.R.volumen || 0.7);
=======
      const a = new Audio(S.R.archivo), ini = S.R.previa != null ? S.R.previa : S.R.sec[(S.R.fuerte || [1])[0]][0], vol = 0.42 * (S.R.volumen || 0.7);
>>>>>>> origin/alt
      let k = 0;
      S.previa = a; a.volume = 0; a.preload = "auto";
      a.addEventListener("loadedmetadata", () => { try { a.currentTime = ini; } catch (e) { /* desde el principio */ } a.play().catch(() => {}); }, { once: true });
      S.previaI = setInterval(() => {
        if (S.previa !== a || S.estado !== "titulo" || el.hidden || document.hidden) { try { a.pause(); } catch (e) { /* nada */ } clearInterval(S.previaI); if (S.previa === a) { S.previa = null; S.previaId = ""; } return; }
        const seg = a.currentTime - ini;
        k++;
        a.volume = Math.max(0, Math.min(1, Math.min(1, k / 10) * (seg > 13.5 ? 1 - (seg - 13.5) / 1.5 : 1) * vol));
        if (seg > 15) { try { a.currentTime = ini; } catch (e) { /* nada */ } k = 0; }
      }, 80);
    }, 500);
  }
  /* El título, en dos pasos que se leen de arriba abajo:
     1 · CANCION: una tarjeta por canción (las que faltan salen con candado y dicen qué hay que terminar)
     2 · DISCO: A: es el modo clásico y B:, C:, D: las dificultades de la canción elegida */
  function pintaTitulo() {
<<<<<<< HEAD
    const k = DISCOS[S.selDisco], rit = S.selDisco > 0, abierta = !S.R || abiertaSel();
    const conLlave = !!S.R && !S.R.personal && porAbrir(S.cancionI);
    const desc = S.selPersonal && S.filaSel === 0 ? T("Carga tu propia canción y arma su mapa de bugs. Se queda en este navegador: no se sube nada.", "Load your own song and build its bug map. It stays in this browser: nothing is uploaded.") : conLlave ? T("Tienes la llave de esta canción: ENTER para abrirla.", "You have this song's key: ENTER to open it.") : !abierta && rit ? T(`Bloqueada: termina ${CANCIONES[S.cancionI - 1].titulo} y recoge la llave.`, `Locked: finish ${CANCIONES[S.cancionI - 1].titulo} and grab the key.`) : {
=======
    const k = DISCOS[S.selDisco], rit = S.selDisco > 0, abierta = !S.R || cancionAbierta(S.cancionI);
    const conLlave = !!S.R && porAbrir(S.cancionI);
    const desc = conLlave ? T("Tienes la llave de esta canción: ENTER para abrirla.", "You have this song's key: ENTER to open it.") : !abierta && rit ? T(`Bloqueada: termina ${CANCIONES[S.cancionI - 1].titulo} y recoge la llave.`, `Locked: finish ${CANCIONES[S.cancionI - 1].titulo} and grab the key.`) : {
>>>>>>> origin/alt
      clasico: T("Sin música: los bugs se escapan del CRT. Tres vidas y cada vez más rápido.", "No music: the bugs escape from the CRT. Three lives, faster every time."),
      facil: T("5 vidas · bugs más lentos y espaciados · cada 3 caídos, una vida", "5 lives · slower, sparser bugs · every 3 dropped, one life"),
      medio: T("4 vidas · cada 2 bugs caídos, una vida", "4 lives · every 2 bugs dropped, one life"),
      dificil: T("3 vidas · bugs más rápidos · cada bug caído, una vida", "3 lives · faster bugs · every bug dropped, one life"),
    }[k];
    const rango = rit ? lee(kRango(k)) : null, rec = rit ? +(lee(kRec(k)) || 0) : S.record;
    const logros = Object.keys(leeJ("bitBugsLogros", {})).length;
    const tarjetas = CANCIONES.map((c, i) => {
      const ok = cancionAbierta(i), mejor = ["dificil", "medio", "facil"].map((d) => lee(`bitBugsRango_${c.id || "uia"}_${d}`)).filter(Boolean).sort((a, b) => "SABCD".indexOf(a) - "SABCD".indexOf(b))[0];
<<<<<<< HEAD
      return `<button type="button" class="jk jk-${c.tema || "uia"}${i === S.cancionI && !S.selPersonal && !S.selMia ? " jm-sel" : ""}${ok ? "" : " jk-x"}${porAbrir(i) ? " jk-llave" : ""}" data-can="${i}"><span class="jk-n">${String(i + 1).padStart(2, "0")}</span><span class="jk-p"></span><b>${ok ? c.titulo : "? ? ?"}</b><i>${ok ? `${c.artista || "-"} · ${mmss(c.dur)}` : porAbrir(i) ? T("TIENES LA LLAVE", "YOU HAVE THE KEY") : T("BLOQUEADA", "LOCKED")}</i>${mejor ? `<em class="jm-r${mejor}">${mejor}</em>` : ""}</button>`;
    }).join("") + (S.misMapas || []).map((c, j) => `<button type="button" class="jk jk-mia${S.selMia === c.id && !S.selPersonal ? " jm-sel" : ""}" data-mia="${c.id}"><span class="jk-n">${String(CANCIONES.length + j + 1).padStart(2, "0")}</span><span class="jk-p"></span><b>${limpiaT(c.nombre)}</b><i>${T("TU MUSICA", "YOUR MUSIC")} · ${c.mapa.notas.length} BUGS</i>${mejorDe(c.id) ? `<em class="jm-r${mejorDe(c.id)}">${mejorDe(c.id)}</em>` : ""}</button>`).join("") + `<button type="button" class="jk jk-personal${S.selPersonal ? " jm-sel" : ""}" data-j="personal"><span class="jk-n">+</span><span class="jk-p"></span><b>${T("TU MUSICA", "YOUR MUSIC")}</b><i>MP3 · WAV · OGG</i></button>`;
=======
      return `<button type="button" class="jk jk-${c.tema || "uia"}${i === S.cancionI ? " jm-sel" : ""}${ok ? "" : " jk-x"}${porAbrir(i) ? " jk-llave" : ""}" data-can="${i}"><span class="jk-n">${String(i + 1).padStart(2, "0")}</span><span class="jk-p"></span><b>${ok ? c.titulo : "? ? ?"}</b><i>${ok ? `${c.artista || "-"} · ${mmss(c.dur)}` : porAbrir(i) ? T("TIENES LA LLAVE", "YOU HAVE THE KEY") : T("BLOQUEADA", "LOCKED")}</i>${mejor ? `<em class="jm-r${mejor}">${mejor}</em>` : ""}</button>`;
    }).join("");
>>>>>>> origin/alt
    aviso(`<p class="jm-t jm-t2">BIT &amp; BUGS</p>
      ${S.R ? `<div class="jk-caja${S.filaSel === 0 ? " jk-act" : ""}"><p class="jk-paso"><b>1</b> ${T("CANCION", "SONG")}</p><div class="jk-fila">${tarjetas}</div>${abierta && S.R.enlace ? `<p class="jk-cred">${creditoHtml()} ↗</p>` : ""}</div>` : ""}
      <div class="jk-caja${S.filaSel === 1 || !S.R ? " jk-act" : ""}"><p class="jk-paso"><b>2</b> ${T("DISCO", "DISK")}</p><div class="jd-fila${abierta ? "" : " jd-cerrado"}">${DISCOS.map((_, i) => (i === 0 || S.R ? discoHtml(i) : "")).join("")}</div></div>
      <p class="jd-info">${desc}</p>
      <p class="jz-fila"><span class="jz">BYTES <b>${S.bytes}</b>${S.ultBytes ? ` <i>+${S.ultBytes}</i>` : ""}</span><span class="jz">RECORD <b>${seis(rec)}</b></span>${rit ? `<span class="jz">${T("RANGO", "RANK")} <b>${rango || "-"}</b></span><span class="jz">${T("LOGROS", "BADGES")} <b>${logros}/${LOGROS.length}</b></span>` : ""}</p>
<<<<<<< HEAD
      <p class="jm-b jm-uno">${S.selPersonal && S.filaSel === 0 ? `<button type="button" class="jm-prim" data-j="personal">${kb("ENTER")}${T("ELEGIR MUSICA", "CHOOSE MUSIC")}</button>` : conLlave ? `<button type="button" class="jm-prim" data-j="llave">${kb("ENTER")}${T("USAR LLAVE", "USE KEY")}</button>` : abierta || !rit ? `<button type="button" class="jm-prim" data-j="jugar">${kb("ENTER")}${T("JUGAR", "PLAY")}</button>` : ""}</p>
      <p class="jm-b jm-dos">${rit && abierta ? `<button type="button" data-j="tramos">${kb("N")}${T("TRAMOS", "SECTIONS")}</button>` : ""}<button type="button" data-j="tienda">${kb("T")}${T("TIENDA", "SHOP")}</button>${btnEncender()}<button type="button" data-j="salir">${kb("ESC")}${T("SALIR", "QUIT")}</button></p>
      ${tactil ? "" : `<p class="jf-gris">↑ ↓ ${T("cambia de fila", "switch row")} · ← → ${T("elige", "choose")}</p>`}`);
    // La tarjeta elegida, a la vista dentro de su fila (la fila se desliza si no caben todas)
    { const f = $(".jk-fila", msg), sel = f && $(".jk.jm-sel", f); if (sel) f.scrollLeft = Math.max(0, sel.offsetLeft - (f.clientWidth - sel.offsetWidth) / 2); }
=======
      <p class="jm-b jm-uno">${conLlave ? `<button type="button" class="jm-prim" data-j="llave">${kb("ENTER")}${T("USAR LLAVE", "USE KEY")}</button>` : abierta || !rit ? `<button type="button" class="jm-prim" data-j="jugar">${kb("ENTER")}${T("JUGAR", "PLAY")}</button>` : ""}</p>
      <p class="jm-b jm-dos">${rit && abierta ? `<button type="button" data-j="tramos">${kb("N")}${T("TRAMOS", "SECTIONS")}</button>` : ""}<button type="button" data-j="tienda">${kb("T")}${T("TIENDA", "SHOP")}</button>${btnEncender()}<button type="button" data-j="salir">${kb("ESC")}${T("SALIR", "QUIT")}</button></p>
      ${tactil ? "" : `<p class="jf-gris">↑ ↓ ${T("cambia de fila", "switch row")} · ← → ${T("elige", "choose")}</p>`}`);
>>>>>>> origin/alt
    ponPrevia();
  }
  // Primer toque: elige el disco. Segundo toque sobre el mismo: lo mete y arranca
  function eligeDisco(i, arranca) {
    i = (i + DISCOS.length) % DISCOS.length;
    if (!S.R) i = 0;
    if (i === S.selDisco && arranca && S.filaSel === 1) { jugar(); return; }
    S.selDisco = i; S.filaSel = 1;
    guarda("bitBugsDisco", String(i));
    bip(880, 0, 0.03, "square", 0.03);
    pintaTitulo();
  }
  function jugar() {
    S.practica = null;
<<<<<<< HEAD
    if (S.selPersonal && S.filaSel === 0) { BB.irPersonal(); return; }
    // Con la llave en la mano y la canción aún cerrada, ENTER la abre
    if (S.R && !S.R.personal && porAbrir(S.cancionI) && (S.filaSel === 0 || S.selDisco > 0)) { usaLlave(); return; }
    if (S.selDisco === 0) { empezar(); return; }
    // Una canción bloqueada no arranca: suena un "no" y la tarjeta lo explica
    if (!abiertaSel()) { bip(160, 110, 0.18, "square", 0.05); return; }
=======
    // Con la llave en la mano y la canción aún cerrada, ENTER la abre
    if (S.R && porAbrir(S.cancionI) && (S.filaSel === 0 || S.selDisco > 0)) { usaLlave(); return; }
    if (S.selDisco === 0) { empezar(); return; }
    // Una canción bloqueada no arranca: suena un "no" y la tarjeta lo explica
    if (!cancionAbierta(S.cancionI)) { bip(160, 110, 0.18, "square", 0.05); return; }
>>>>>>> origin/alt
    conDif(DISCOS[S.selDisco]);
  }
  function conDif(k) { S.dif = k; S.D = DIFS[k]; guarda("bitBugsDif", k); BB.empezarRitmo(); }
  // Cambiar de canción: los discos B:, C: y D: pasan a ser los de la otra canción
  function ponCancion(i) {
    BB.detieneAudio();
    S.cancionI = i;
    S.R = CANCIONES[i];
    S.JEFE = S.R.jefe != null ? S.R.jefe : 4;
    S.VUELO = S.R.vuelo != null ? S.R.vuelo : 7;
    // Si el tramo lateral acaba en flashazos, su final (y el arranque del tramo siguiente) se recorre hasta el último
    if (S.R.flashazos && S.R.lateral != null && !S.R._flashT) {
      const tt = tiemposTeles(9e9), base = tt.length ? tt[tt.length - 1] : S.R.sec[S.R.lateral][1];
      S.R._flashT = S.R.flashazos.map((f) => base + f);
      const fin = Math.min(S.R.sec[S.R.lateral + 1][1] - 4, Math.max(...S.R._flashT) + 0.45);
      S.R.sec[S.R.lateral][1] = fin; S.R.sec[S.R.lateral + 1][0] = fin;
    }
    // El tramo del aplastamiento termina en el instante en que cae el último pisón: ahí mismo va el flashazo y empieza el siguiente
    if (S.R.aplastada && !S.R._aplT) {
      S.R._aplT = S.R.aplastada[0] + S.R.aplastada[1] * 4;
      const k = BB.seccionDe(S.R.aplastada[0]);
      if (k < S.R.sec.length - 1) { S.R.sec[k][1] = S.R._aplT + 0.1; S.R.sec[k + 1][0] = S.R._aplT + 0.1; }
    }
    BB.armaMapa();
    guarda("bitBugsCancion", String(i));
  }
  function cambiaCancion(d, directo) {
<<<<<<< HEAD
    // La fila es: las canciones del juego, las del jugador que ya tienen mapa y al final la tarjeta + TU MUSICA
    if (directo == null) {
      const mias = S.misMapas || [], n = CANCIONES.length, pos = S.selPersonal ? n + mias.length : S.selMia ? n + Math.max(0, mias.findIndex((c) => c.id === S.selMia)) : S.cancionI;
      const nueva = Math.max(0, Math.min(n + mias.length, pos + d));
      if (nueva === pos) { if (S.filaSel !== 0) { S.filaSel = 0; pintaTitulo(); } return; }
      S.filaSel = 0; bip(660, 990, 0.06, "triangle", 0.04);
      if (nueva === n + mias.length) { S.selPersonal = true; BB.paraPrevia(); pintaTitulo(); return; }
      S.selPersonal = false;
      if (nueva >= n) { BB.eligeMia(mias[nueva - n].id); pintaTitulo(); return; }
      if (S.selMia) { S.selMia = null; ponCancion(nueva); pintaTitulo(); return; }
      directo = nueva;
    }
    S.selPersonal = false;
    if (S.selMia) { S.selMia = null; ponCancion(S.cancionI); }
    if (CANCIONES.length < 2) { pintaTitulo(); return; }
=======
    if (CANCIONES.length < 2) return;
>>>>>>> origin/alt
    const i = directo != null ? directo : Math.max(0, Math.min(CANCIONES.length - 1, S.cancionI + d));
    if (i === S.cancionI) { if (S.filaSel !== 0) { S.filaSel = 0; pintaTitulo(); } return; }
    S.filaSel = 0;
    ponCancion(i);
    bip(660, 990, 0.06, "triangle", 0.04);
    pintaTitulo();
  }

  /* El selector de tramos: la canción como una cinta, con cada tramo del largo que dura y pintado según el mejor
     resultado (verde 90% o más, amarillo 70%, rojo menos). Un tramo se abre al haber terminado el anterior. */
  const tramoAbierto = (best, j) => j === 0 || best[j - 1] != null || best[j] != null;
  function verTramos(i) {
<<<<<<< HEAD
    if (!S.R || S.selDisco === 0 || !abiertaSel()) return;
=======
    if (!S.R || S.selDisco === 0 || !cancionAbierta(S.cancionI)) return;
>>>>>>> origin/alt
    S.dif = DISCOS[S.selDisco]; S.D = DIFS[S.dif];
    S.estado = "tramos";
    const best = leeTramos();
    // De entrada apunta al tramo más flojo
    if (i == null) { i = 0; let peor = 101; S.R.sec.forEach((_, j) => { if (best[j] != null && best[j] < peor) { peor = best[j]; i = j; } }); }
    i = Math.max(0, Math.min(S.R.sec.length - 1, i));
    S.selTramo = i;
    const s = S.R.sec[i], p = best[i], ok = tramoAbierto(best, i);
    const seg = S.R.sec.map((x, j) => `<button type="button" data-tramo="${j}" style="flex:${Math.round(x[1] - x[0])}" class="jc-s ${!tramoAbierto(best, j) ? "jc-x" : best[j] == null ? "jc-0" : best[j] >= 90 ? "jc-v" : best[j] >= 70 ? "jc-y" : "jc-r"}${j === i ? " jm-sel" : ""}">${j === S.JEFE ? T("JEFE", "BOSS") : j + 1}</button>`).join("");
    aviso(`<p class="jc-cmd">C:\\&gt; SEEK <b>${S.R.corto || "RITMO"}</b> · ${T(S.D.n[0], S.D.n[1])}</p>
      <div class="jc-caja"><div class="jc">${seg}</div><div class="jc-reg"><span>0:00</span><span>${mmss(S.R.dur / 2)}</span><span>${mmss(S.R.dur)}</span></div></div>
      <p class="jc-n">${i + 1} · ${nomSec(i)} <span>${mmss(s[0])} ${T("A", "TO")} ${mmss(Math.min(s[1], S.R.dur))}</span></p>
      <p class="jd-info">${ok ? (S.R.pistas && S.R.pistas[i] ? T(S.R.pistas[i][0], S.R.pistas[i][1]) : "") : T("Bloqueado: primero termina el tramo anterior.", "Locked: finish the previous section first.")}</p>
      <p class="jm-p jd-rec">${!ok ? T("BLOQUEADO", "LOCKED") : p == null ? T("SIN JUGAR", "NOT PLAYED") : `${T("MEJOR", "BEST")} ${p}%`}</p>
      <p class="jm-b">${ok ? `<button type="button" data-j="practica">${kb("ENTER")}${T("PRACTICAR", "PRACTICE")}</button>` : ""}<button type="button" data-j="titulo">${kb("M")}${T("VOLVER", "BACK")}</button></p>`);
  }
  // Practicar un tramo: arranca un instante antes y termina cuando el tramo se acaba. No cuenta para el récord
  function practicar(i) {
    if (i == null) i = S.selTramo;
    if (!S.R || i < 0 || !tramoAbierto(leeTramos(), i)) return;
    S.practica = i;
    BB.empezarRitmo(i > 0 ? S.R.sec[i][0] - 1.9 : 0, { pts: 0, maxCombo: 0, atrapados: 0, cont: -1 });
  }
  // Guarda el mejor porcentaje de los tramos jugados (de 'desde' a 'hasta', sin incluir este último)
  function guardaTramos(desde, hasta) {
    const best = leeTramos();
    for (let j = desde; j < hasta && j < S.R.sec.length; j++) {
      const [a, b] = S.tramos[j] || [0, 0], p = b ? Math.round((a / b) * 100) : 100;
      if (best[j] == null || p > best[j]) best[j] = p;
    }
    guarda(`bitBugsTramos_${idC()}_${S.dif}`, JSON.stringify(best));
  }
  function empezar() {
    BB.detieneAudio();
    telon();
    S.modo = "clasico";
    S.estado = "jugando";
    S.pts = 0; S.vidas = 3; S.nivel = 0; S.t = 0; S.sig = 40; S.objs = []; S.textos = []; S.grietas = []; S.destellos = [];
    S.bit = { c: carriles >> 1, x: xBit(carriles >> 1), y: bitY() }; S.fantasmas = []; S.chispas = []; S.ecos = []; S.ondas = []; S.punch = 0; S.dano = 0; S.boca = "n"; S.bocaT = 0; S.mensaje = ""; S.nuevoRecord = false;
    aviso("");
    S.pistaT = 300; S.atrapadosPista = 0; S.celdas = [0, 0, 0, 0, 0]; cierraOrden(); S.dichos = {};
    hud();
    bip(392, 0, 0.08); bip(523, 0, 0.08, "square", 0.05, 0.09); bip(659, 0, 0.12, "square", 0.05, 0.18);
    if (P()) P().cuenta("juego");
  }
  function fin() {
    S.estado = "fin"; S.finModo = "clasico";
    SND.play("terminar");
    if (S.pts > S.record) { S.record = S.pts; S.nuevoRecord = true; guarda("bitBugsRecord", String(S.record)); }
    hud();
    aviso(`<p class="jm-t jm-rojo">GAME OVER</p>
      <p>${T("3 bugs llegaron a producción.", "3 bugs reached production.")}</p>
      <p class="jm-p">${T("PUNTOS", "SCORE")} ${seis(S.pts)}${S.nuevoRecord ? `<br><span class="jm-nuevo">${T("¡NUEVO RECORD!", "NEW HIGH SCORE!")}</span>` : ""}</p>
      ${botonesFin("empezar")}`);
  }
  const botonesFin = (otra) => `<p class="jm-b"><button type="button" data-j="${otra}">${kb("R")}${T("OTRA VEZ", "AGAIN")}</button><button type="button" data-j="titulo">${kb("M")}${T("DISCOS", "DISKS")}</button>${btnEncender()}<button type="button" data-j="salir">${kb("ESC")}${T("SALIR", "QUIT")}</button></p>`;
  function pausa(on) {
    if (on && S.estado === "jugando") {
      S.estado = "pausa";
      cierraOrden();
      if (S.modo === "ritmo" && S.audio) S.audio.pause();
      aviso(`<p class="jm-t">${T("PAUSA", "PAUSED")}</p><p class="jm-b"><button type="button" data-j="seguir">${kb("P")}${T("SEGUIR", "RESUME")}</button><button type="button" data-j="titulo">${kb("M")}${T("DISCOS", "DISKS")}</button></p>`);
    } else if (!on && S.estado === "pausa") {
      S.estado = "jugando"; aviso(""); S.ult = 0;
      if (S.modo === "ritmo" && S.audio) S.audio.play().catch(() => {});
    }
  }
  msg.addEventListener("click", (e) => {
    const d = e.target.closest("[data-disco]"), tr = e.target.closest("[data-tramo]"), b = e.target.closest("button[data-j]"), can = e.target.closest("[data-can]");
    if (S.estado === "llave") { if (S.llaveFin) S.llaveFin(); return; }
    const ti = e.target.closest("[data-tienda]");
    if (ti && S.estado === "tienda") { const [f, i] = ti.dataset.tienda.split(":").map(Number); if (S.tFila === f && S.tCol[f] === i) BB.compraTienda(); else { S.tFila = f; S.tCol[f] = i; S.tNota = ""; bip(880, 0, 0.03, "square", 0.03); BB.pintaTienda(); } return; }
    if (can && S.estado === "titulo") { cambiaCancion(0, +can.dataset.can); return; }
<<<<<<< HEAD
    const mia = e.target.closest("[data-mia]");
    if (mia && S.estado === "titulo") { S.selPersonal = false; S.filaSel = 0; if (S.selMia !== mia.dataset.mia) { BB.eligeMia(mia.dataset.mia); bip(660, 990, 0.06, "triangle", 0.04); } pintaTitulo(); return; }
    if (d && S.estado === "titulo") { eligeDisco(+d.dataset.disco, true); return; }
    if (tr && S.estado === "tramos") { if (+tr.dataset.tramo === S.selTramo) practicar(); else { bip(880, 0, 0.03, "square", 0.03); verTramos(+tr.dataset.tramo); } return; }
    if (!b) return;
    if (BB.accionesP && BB.accionesP[b.dataset.j] && S.estado === "personal") { BB.accionesP[b.dataset.j](); return; }
    if (b.dataset.j === "titulo" && S.estado === "personal") { BB.volverDePersonal(); return; }
    ({ empezar, jugar, llave: usaLlave, personal: () => { S.selPersonal = true; S.filaSel = 0; BB.irPersonal(); }, tienda: () => irA(BB.tienda), tcompra: BB.compraTienda, "can-": () => cambiaCancion(-1), "can+": () => cambiaCancion(1), tramos: () => irA(() => verTramos(S.practica)), practica: () => practicar(), flojo: () => practicar(S.res ? S.res.peor : 0),
=======
    if (d && S.estado === "titulo") { eligeDisco(+d.dataset.disco, true); return; }
    if (tr && S.estado === "tramos") { if (+tr.dataset.tramo === S.selTramo) practicar(); else { bip(880, 0, 0.03, "square", 0.03); verTramos(+tr.dataset.tramo); } return; }
    if (!b) return;
    ({ empezar, jugar, llave: usaLlave, tienda: () => irA(BB.tienda), tcompra: BB.compraTienda, "can-": () => cambiaCancion(-1), "can+": () => cambiaCancion(1), tramos: () => irA(() => verTramos(S.practica)), practica: () => practicar(), flojo: () => practicar(S.res ? S.res.peor : 0),
>>>>>>> origin/alt
      otra: () => (S.practica != null ? practicar(S.practica) : BB.empezarRitmo()), jefe: BB.reintenta, titulo: () => irA(titulo), encender: () => BB.cerrar(true), salir: () => BB.cerrar(false), seguir: () => pausa(false) })[b.dataset.j]();
  });
  // Durante la cuenta del final, un toque en cualquier parte la salta
  el.addEventListener("pointerdown", () => { if (S.estado === "fin" && S.finModo === "conteo") pasaAResultado(); });

<<<<<<< HEAD
  Object.assign(BB, { DISCOS, abiertaSel, mejorDe, botonesFin, btnEncender, cancionAbierta, conAvance, idC, idDe, kRango, kRec, leeJ, leeTramos, llaveLista, mmss, nomSec, porAbrir, tramoAbierto, urls });
})();
=======
  Object.assign(BB, { DISCOS, botonesFin, btnEncender, cancionAbierta, conAvance, idC, idDe, kRango, kRec, leeJ, leeTramos, llaveLista, mmss, nomSec, porAbrir, tramoAbierto, urls });
})();
>>>>>>> origin/alt
