/* ---------- BIT & BUGS · ritmo.js: modo ritmo, audio, arranque, cierre, cuenta, resultado, daño y vidas ---------- */
(() => {
  "use strict";
  const BB = window.BitBugs, S = BB.S;
  const { $, DIFS, DISCOS, DM, FK, G, LOGROS, P, RM, SND, T, UIA, aEl, audios, aviso, bip, bitY, btnEncender, c2, carriles, cierraOrden, cierraVentana, cmd, creditoHtml, ctx, discoHtml, el, entraMsg, ganaBytes, guarda, guardaTramos, hud, idC, kRango, kRec, kb, lee, leeJ, leeTramos, lienzo, mmss, msg, nomSec, pasaAResultado, piso, rompeVentanas, seis, silueta, tactil, telon, tiemposTeles, viste, xBit } = BB;
  Object.assign(BB, { castigo, detieneAudio, dibujaMuerte, empezarRitmo, errorAudio, falla, finPractica, finRitmo, golpeado, maldito, muereBit, pierdeVida, ponAudio, precalienta, resultado, tCancion });

  /* ---------- 9. Modo ritmo: audio, arranque, final, daño y vidas ---------- */
  function detieneAudio() {
    S.intentoN++;
    if (!S.audio) return;
    S.audio.pause();
    try { S.audio.currentTime = 0; } catch (e) { /* aún sin datos */ }
  }
  // El segundo de la canción que suena ahora. El <audio> avisa su tiempo a saltitos: entre aviso y aviso se estima con el reloj
  function tCancion() {
    if (!S.audio) return 0;
    const a = S.audio.currentTime;
    if (a !== S.ultA) { S.ultA = a; S.ultP = performance.now(); }
    return a + (S.audio.paused ? 0 : Math.min(0.25, (performance.now() - S.ultP) / 1000));
  }
  function errorAudio() {
    if (el.hidden || S.modo !== "ritmo" || S.estado !== "cargando") return;
    S.estado = "fin";
    aviso(`<p class="jm-t jm-rojo">ERROR</p><p>${T("No se pudo cargar la canción.", "The song could not be loaded.")}</p>
      <p class="jm-b"><button type="button" data-j="titulo">${kb("M")}${T("DISCOS", "DISKS")}</button><button type="button" data-j="salir">${kb("ESC")}${T("SALIR", "QUIT")}</button></p>`);
  }
  // desde / guardado: para reintentar un escenario sin repetir toda la canción
  /* Mientras carga la canción se pinta una vez, fuera de la vista, cada escenario del nivel: así sus tramas, manchas y
     planetas (que se calculan pixel por pixel la primera vez) quedan guardados y el cambio de escenario no da tirones.
     Solo FUTURE FUNK, cuyos escenarios no tocan el estado del juego. Se hace de una vez, detrás del letrero de carga */
  S.calientes = "";
  function precalienta() {
    if (!FK() || RM) return;
    const clave = `${idC()}|${S.FW}x${S.FH}`;
    if (S.calientes === clave) return;
    S.calientes = clave;
    for (let i = 0; i < BB.ESCENAS_F.length; i++) {
      c2.save();
      try { BB.ESCENAS_F[i]({ cx: S.gx + S.W / 2, cy: S.gy + S.H * 0.5, suelo: S.gy + piso(), sec: S.R.sec[i] || S.R.sec[0] }); } catch (e) { /* ese se calcula al llegar */ }
      c2.restore();
    }
    c2.clearRect(0, 0, S.FW, S.FH);
  }
  function empezarRitmo(desde, guardado) {
    if (!S.R) return;
    desde = typeof desde === "number" ? desde : 0;
    detieneAudio();
    telon();
    S.cierre = null; S.negro = false; S.destello = 0; S.nuevaCancion = null;
    if (S.filtroPuesto) { S.filtroPuesto = ""; lienzo.style.filter = ""; }
    S.modo = "ritmo";
    S.estado = "cargando";
    S.pts = 0; S.t = 0; S.objs = []; S.textos = []; S.grietas = []; S.destellos = []; S.anillos = [];
    S.bit = { c: carriles >> 1, x: xBit(carriles >> 1), y: bitY() }; S.fantasmas = []; S.chispas = []; S.boca = "n"; S.bocaT = 0; S.mensaje = ""; S.nuevoRecord = false;
    S.ondas = []; S.punch = 0; S.fiebre = 0; S.burbujas = []; S.ataques = []; S.rayoN = 0; S.iman = 0; S.llenaT = 0; S.llenaAviso = false; S.gatoFrente = 0; S.vuela = false; S.vueloAviso = false; S.vx = S.vy = 0;
    S.celdas = [0, 0, 0, 0, 0]; S.pistaT = desde > 0 ? 0 : 420; S.atrapadosPista = 0; cierraVentana();
    cierraOrden(); S.dichos = {};
    S.groove = 0; S.grooveT = 0; S.grooveFx = 0; S.lateral = false; S.latK = 0;
    // Los cambios de fila forzados del tramo lateral: desde R.teles[0], varias tandas [cada cuántos segundos, cuántas veces]
    S.teles = S.R.lateral != null ? tiemposTeles(S.R.sec[S.R.lateral][1] - 0.25) : []; S.teleI = 0; S.raro = ""; S.aplastando = false; S.aplastado = false; S.golpeY = 0; S.quemada = null; S.calor = 0; S.pisonN = 0; S.djN = 0; S.djLibre = 0; S.R._chT = null; S.gatoUlt = -999; S.vNota = 0;
    S.trabaI = 0; while (S.R.trabas && S.trabaI < S.R.trabas.length && S.R.trabas[S.trabaI][0] < desde + 1.2) S.trabaI++;
    while (S.teleI < S.teles.length && S.teles[S.teleI] < desde) S.teleI++;
    S.luz = S.luzVis = 0.75; S.campanas = guardado && guardado.campanas ? guardado.campanas : 0; S.escudo = guardado && guardado.escudo ? guardado.escudo : 0; S.res = null; S.finModo = ""; S.finN++; S.cred = desde > 0 ? -1 : 0;
    S.tramos = guardado && guardado.tramos ? JSON.parse(guardado.tramos) : S.R.sec.map(() => [0, 0]);
    S.ts = desde; S.tAcierto = null; S.tFallo = null; S.ultA = -1; S.rI = 0; S.rG = 0; S.golpeN = 0; S.pulso = 0; S.secI = -1; S.cambio = 0; S.combo = 0; S.maxCombo = 0; S.atrapados = 0; S.giro = 0; S.vGiro = 0.3; S.energiaAhora = 0;
    S.ecos = []; S.dano = 0; S.interferencia = 0; S.agachaT = 0; S.peligro = 0; S.peligroVis = 0; S.muerto = false; S.muerteIni = 0; S.foto = null; S.jefeAviso = false; S.desdeIni = desde; S.zoom = 1;
    if (guardado) { S.pts = guardado.pts; S.maxCombo = guardado.maxCombo; S.atrapados = guardado.atrapados; }
    // Dificultad: vidas completas (también al reintentar un tramo), memoria del jefe y las notas que tocan
    S.D = DIFS[S.dif];
    S.JEFE_TOPE = S.D.tope;
    S.vidasR = S.D.vidas; S.fallosVida = 0; S.invul = 0; S.vidaFx = 0; S.colaV = [];
    S.continues = guardado ? (guardado.cont || 0) + 1 : 0;
    S.recordR = +(lee(kRec(S.dif)) || 0);
    BB.preparaNotas();
    // Se saltan las notas y los bombos anteriores al punto de arranque
    while (S.rI * 3 < S.R.notas.length && S.R.notas[S.rI * 3] / 1000 < desde + 1.2) S.rI++;
    while (S.rG < S.R.golpes.length && S.R.golpes[S.rG] < desde * 100) S.rG++;
    S.golpeN = S.rG;
    S.gatoX = S.focoX = S.gx + S.W / 2; S.gatoY = S.focoY = S.gy + S.H * 0.5; S.gatoTam = 1; S.gatoQuieto = true; S.estela = [];
    BB.pideGato();
    hud();
    aviso(`<p class="jm-t">♪</p><p>${T("Cargando la canción...", "Loading the song...")}</p>`);
    precalienta();
    // Cada canción tiene su propio <audio>. Si la canción sigue después del nivel (R.sigue), al acabarse vuelve a ese punto
    S.audio = audios[idC()];
    if (!S.audio) {
      const a = (S.audio = audios[idC()] = new Audio(S.R.archivo));
      a.preload = "auto";
      a.addEventListener("ended", () => {
        if (a !== S.audio || el.hidden) return;
        if (S.modo === "ritmo" && S.estado === "jugando") { if (S.prueba) BB.volverAlEditor(); else if (S.practica != null) finRitmo(); else BB.empiezaCierre(); }
        else if (S.R.sigue && (S.estado === "fin" || S.estado === "cierre")) { try { a.currentTime = S.R.dur; } catch (e) { /* se queda en silencio */ } a.play().catch(() => {}); }
      });
      a.addEventListener("error", errorAudio);
    }
    S.audio.volume = S.R.volumen;
    S.audio.muted = !!(SND.silencio && SND.silencio());
    if (desde > 0) { try { S.audio.currentTime = desde; } catch (e) { /* aún sin datos: se ajusta al sonar */ } }
    const intento = S.intentoN;
    // play() va aquí, dentro del clic o la tecla: así el navegador deja sonar
    let p;
    try { p = S.audio.play(); } catch (e) { errorAudio(); return; }
    (p && p.then ? p : Promise.resolve()).then(() => {
      if (intento !== S.intentoN || el.hidden || S.modo !== "ritmo" || S.estado !== "cargando") return;
      if (desde > 0 && Math.abs(S.audio.currentTime - desde) > 1) { try { S.audio.currentTime = desde; } catch (e) { /* sigue desde donde pueda */ } }
      S.estado = "jugando";
      aviso("");
      S.ult = 0;
      if (S.cred < 0) ponAudio("esquina");
      if (P() && !guardado) P().cuenta("juego-ritmo");
    }).catch(() => { if (intento === S.intentoN) errorAudio(); });
  }
  /* El final del modo ritmo, en dos pasos:
     1. La cuenta: los premios aparecen renglón por renglón, cada uno con una nota más aguda. Los que no se ganaron
        salen apagados, para que se vea qué faltó. Cualquier tecla la salta.
     2. El resultado: el rango pegado en el disquete, cuántos bugs faltaron para el siguiente rango, la cinta de la
        canción pintada tramo por tramo (el más flojo, resaltado y listo para practicarse) y los logros. */
  const RANGOS = [["S", 95], ["A", 85], ["B", 70], ["C", 50], ["D", 0]];
  function finRitmo() {
    if (S.practica != null) { finPractica(); return; }
    ganaBytes(S.pts / 150);
    cierraVentana();
    cierraOrden();
    S.estado = "fin"; S.finModo = "conteo";
    S.objs = [];
    // Si la canción sigue después del nivel, se queda sonando de fondo, más bajito
    if (S.audio) { if (S.R.sigue) S.audio.volume = S.R.volumen * 0.6; else S.audio.pause(); }
    const total = S.totalNotas, ok = Math.min(S.atrapados, total), pct = Math.min(100, Math.round((ok / total) * 100));
    const rI2 = RANGOS.findIndex((r) => pct >= r[1]), rango = RANGOS[rI2][0];
    const filas = [[`BUGS ${ok}/${total}`, S.pts, true], [`${T("VIDAS", "LIVES")} ${S.vidasR} x 500`, S.vidasR * 500, S.vidasR > 0], [`COMBO MAX ${S.maxCombo} x 10`, S.maxCombo * 10, S.maxCombo > 0],
      [T("SIN REINTENTOS", "NO RETRIES"), 2000, S.continues === 0], [T("PLENO: NI UNO CAIDO", "FULL CLEAR: NONE DROPPED"), 5000, ok === total]];
    S.pts = filas.reduce((s, f) => s + (f[2] ? f[1] : 0), 0);
    const antes = S.recordR;
    if (S.pts > S.recordR) { S.recordR = S.pts; S.nuevoRecord = true; guarda(kRec(S.dif), String(S.recordR)); }
    const viejo = lee(kRango(S.dif));
    if (!viejo || "DCBAS".indexOf(rango) > "DCBAS".indexOf(viejo)) guarda(kRango(S.dif), rango);
    guardaTramos(0, S.R.sec.length);
    const tengo = leeJ("bitBugsLogros", {}), nuevos = [], tj = S.tramos[S.JEFE];
    const gana = (k, si) => { if (si && !tengo[k]) { tengo[k] = 1; nuevos.push(k); } };
    gana("primera", true); gana("limpio", S.continues === 0); gana("combo100", S.maxCombo >= 100); gana("intacto", S.vidasR === S.D.vidas && S.continues === 0);
    gana("jefe", !!tj && tj[1] > 0 && tj[0] >= tj[1]); gana("rangoS", rango === "S"); gana("dificil", S.dif === "dificil");
    gana("tripleS", ["facil", "medio", "dificil"].every((d) => lee(kRango(d)) === "S"));
    if (nuevos.length) guarda("bitBugsLogros", JSON.stringify(tengo));
    S.res = { total, ok, pct, rango, rI2, antes, nuevos, tengo, peor: -1 };
    hud();
    const n = ++S.finN;
    aviso(`<p class="jm-t jm-t2">${G() ? T("¡GRIMORIO SELLADO!", "GRIMOIRE SEALED!") : DM() ? T("¡PUEBLO A SALVO!", "TOWN SAVED!") : FK() ? T("¡PISTA CONQUISTADA!", "DANCE FLOOR CONQUERED!") : T("¡VIRUS ELIMINADO!", "VIRUS REMOVED!")}</p>
      <div class="jf-cuenta">${filas.map((f) => `<p class="jf-f${f[2] ? "" : " jf-no"}" hidden><span>${f[0]}</span><b>${f[2] ? `+${f[1]}` : "- - -"}</b></p>`).join("")}<p class="jf-f jf-tot" hidden><span>TOTAL</span><b>${seis(S.pts)}</b></p></div>
      <p class="jf-gris">${tactil ? T("Toca para saltar", "Tap to skip") : T("Pulsa una tecla para saltar", "Press any key to skip")}</p>`);
    entraMsg();
    const fs = [...msg.querySelectorAll(".jf-f")];
    fs.forEach((f, i) => setTimeout(() => {
      if (n !== S.finN || S.finModo !== "conteo") return;
      f.hidden = false;
      const ultima = i === fs.length - 1;
      if (f.classList.contains("jf-no")) bip(180, 0, 0.06, "square", 0.03);
      else bip(523.25 * Math.pow(2, (i * 2) / 12), 0, ultima ? 0.25 : 0.08, "square", 0.04);
      if (ultima) setTimeout(() => { if (n === S.finN && S.finModo === "conteo") pasaAResultado(); }, 900);
    }, 350 + i * 380));
  }
  function resultado() {
    if (!S.res) return;
    S.finModo = "resultado"; S.finN++;
    const { total, ok, pct, rango, rI2, nuevos, tengo } = S.res;
    // Qué faltó para el siguiente rango, y qué tan cerca quedó
    let falta, barra = 100;
    if (rI2 > 0) {
      const [sig, th] = RANGOS[rI2 - 1], nec = Math.max(1, Math.ceil(((th - 0.5) * total) / 100) - ok);
      falta = T(`Te faltaron <b>${nec}</b> bugs para la <b>${sig}</b>`, `<b>${nec}</b> more bugs for rank <b>${sig}</b>`);
      barra = Math.max(4, ((pct - RANGOS[rI2][1]) / (th - RANGOS[rI2][1])) * 100);
    } else falta = ok < total ? T(`Rango máximo. Te faltaron <b>${total - ok}</b> para el pleno`, `Top rank. <b>${total - ok}</b> short of a full clear`) : T("Rango máximo y pleno: impecable.", "Top rank and full clear: flawless.");
    // La cinta, tramo por tramo, y cuál fue el más flojo
    let peor = -1, peorP = 100;
    const pc = S.R.sec.map((_, j) => { const [a, b] = S.tramos[j] || [0, 0], p = b ? Math.min(100, Math.round((a / b) * 100)) : 100; if (b && p < peorP) { peorP = p; peor = j; } return p; });
    S.res.peor = peor;
    const seg = S.R.sec.map((x, j) => `<span style="flex:${Math.round(x[1] - x[0])}" class="jc-s ${pc[j] >= 90 ? "jc-v" : pc[j] >= 70 ? "jc-y" : "jc-r"}${j === peor ? " jm-sel" : ""}" title="${nomSec(j)} ${pc[j]}%">${j === S.JEFE ? T("JEFE", "BOSS") : j + 1}</span>`).join("");
    const reto = LOGROS.find((l) => !tengo[l[0]]);
    const rec = S.nuevoRecord ? `<span class="jm-nuevo">${T("¡NUEVO RECORD!", "NEW HIGH SCORE!")}${S.res.antes ? ` +${S.pts - S.res.antes}` : ""}</span>` : `<span class="jf-gris">RECORD ${seis(S.recordR)} · ${T("te faltaron", "short by")} ${S.recordR - S.pts}</span>`;
    aviso(`<div class="jf">
        <div class="jf-a">${discoHtml(DISCOS.indexOf(S.dif), "jf-sello", rango)}</div>
        <div class="jf-b">
          <p class="jm-p">${T("PUNTOS", "SCORE")} ${seis(S.pts)}<br>${rec}</p>
          <p class="jf-falta">${falta}</p><div class="jf-bar"><i style="width:${barra}%"></i></div>
          <div class="jc jc-fin">${seg}</div>
          <p class="jf-gris">${peor >= 0 ? T(`Tu tramo más flojo: ${peor + 1} · ${nomSec(peor)} (${peorP}%)`, `Weakest section: ${peor + 1} · ${nomSec(peor)} (${peorP}%)`) : T("Ni un tramo flojo.", "Not one weak section.")}</p>
          ${nuevos.map((k) => { const l = LOGROS.find((x) => x[0] === k); return `<p class="jf-logro">★ ${T("LOGRO", "BADGE")}: ${T(l[1], l[2])}</p>`; }).join("")}
          ${S.nuevaCancion ? `<p class="jf-logro jf-nueva">★ ${T("NUEVA CANCION", "NEW SONG")}: ${S.nuevaCancion.titulo}</p>` : ""}
          ${reto ? `<p class="jf-reto">${T("SIGUIENTE RETO", "NEXT CHALLENGE")}: <b>${T(reto[1], reto[2])}</b> · ${T(reto[3], reto[4])}</p>` : ""}
        </div>
      </div>
      <p class="jm-b"><button type="button" data-j="otra">${kb("R")}${T("OTRA VEZ", "AGAIN")}</button>${peor >= 0 ? `<button type="button" data-j="flojo">${kb("J")}${T("PRACTICAR TRAMO", "PRACTICE SECTION")} ${peor + 1}</button>` : ""}<button type="button" data-j="titulo">${kb("M")}${T("DISCOS", "DISKS")}</button>${btnEncender()}<button type="button" data-j="salir">${kb("ESC")}${T("SALIR", "QUIT")}</button></p>
      <p class="jd-can"><span>${creditoHtml()}</span></p>`);
    // El sello del rango cae sobre el disco
    bip(110, 55, 0.18, "square", 0.07); [523, 659, 784, 1047, 1319].slice(0, 5 - rI2).forEach((f, i) => bip(f, 0, 0.12, "square", 0.04, 0.12 + i * 0.09));
  }
  function finPractica() {
    cierraVentana();
    cierraOrden();
    S.estado = "fin"; S.finModo = "practica";
    S.objs = [];
    if (S.audio) S.audio.pause();
    const i = S.practica, [a, b] = S.tramos[i] || [0, 0], p = b ? Math.min(100, Math.round((a / b) * 100)) : 100, antes = leeTramos()[i];
    guardaTramos(i, i + 1);
    hud();
    [523, 659, 784].forEach((f, k) => bip(f, 0, 0.1, "square", 0.04, k * 0.09));
    setTimeout(entraMsg, 0);
    aviso(`<p class="jm-t jm-t2">${T("TRAMO COMPLETO", "SECTION CLEAR")}</p>
      <p class="jc-n">${i + 1} · ${nomSec(i)}</p>
      <p class="jm-rango ${p >= 90 ? "jf-v" : p >= 70 ? "" : "jm-rojo"}">${p}%</p>
      <p class="jm-p">BUGS ${Math.min(a, b)}/${b}${antes != null && p > antes ? `<br><span class="jm-nuevo">${T("¡MEJOR MARCA!", "NEW BEST!")} +${p - antes}%</span>` : antes != null ? `<br>${T("MEJOR", "BEST")} ${Math.max(p, antes)}%` : ""}</p>
      <p class="jm-b"><button type="button" data-j="otra">${kb("R")}${T("OTRA VEZ", "AGAIN")}</button><button type="button" data-j="tramos">${kb("N")}${T("TRAMOS", "SECTIONS")}</button><button type="button" data-j="titulo">${kb("M")}${T("DISCOS", "DISKS")}</button></p>`);
  }
  // La ventanita AUDIO.EXE con el crédito de la canción: se abre al centro y luego se guarda abajo a la derecha
  function ponAudio(donde) {
    if (!donde || !S.rectL || !S.R) { aEl.hidden = true; aEl.dataset.d = ""; return; }
    $(".ja-t", aEl).textContent = `♪ ${S.R.titulo || ""}`;
    $(".ja-a", aEl).textContent = S.R.artista || "";
    $(".ja-d", aEl).textContent = `${mmss(S.R.dur)} · ${S.R.sec[0][3]} BPM`;
    aEl.hidden = false;
    aEl.dataset.d = donde;
    aEl.className = `j-audio ${donde}`;
    const centro = donde === "centro";
    aEl.style.left = `${centro ? S.rectL.left + S.rectL.width / 2 : Math.min(S.rectL.right + 14, window.innerWidth - 4)}px`;
    // Guardada, cuelga por fuera de la esquina de abajo a la derecha: así no tapa el piso ni a BIT
    aEl.style.top = `${centro ? S.rectL.top + S.rectL.height * 0.45 : Math.min(S.rectL.bottom + 5, window.innerHeight - 30)}px`;
  }
  // BIT cae: se quedó sin vidas o GATO.EXE llenó la memoria. Se puede reintentar desde el inicio de ese escenario
  // La muerte de BIT: se cuelga como programa. Un fogonazo, se parte en tiras cian y rosa, se vuelve una ventanita de
  // error y la ventana se cierra hasta quedar en nada. Dura poco menos de segundo y medio; luego sale el mensaje
  S.muerteIni = 0;
  // Mientras dura la animación, la pantalla no se oscurece todavía
  const muriendo = () => S.muerto && S.muerteIni > 0 && performance.now() - S.muerteIni < 1500;
  function dibujaMuerte() {
    const k = (performance.now() - S.muerteIni) / 1000, X = Math.round(S.bit.x), Y = Math.round(S.bit.y), sp = P() ? viste(P().bitSprite(0, false, "o")) : [];
    const px = (c, x, y, w, hh) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(hh))); };
    if (k < 0.12) { ctx.globalAlpha = 1 - k / 0.14; px("#ffffff", 0, 0, S.W, S.H); ctx.globalAlpha = 1; silueta(sp, X, Y, "#030303"); return; }
    if (k < 0.55) {
      const f = Math.min(1, (k - 0.12) / 0.25), paso = Math.floor(k * 22);
      sp.forEach((r, j) => {
        const off = Math.round((BB.h(j * 1.7 + paso * 0.61) - 0.5) * 18 * f);
        if (j % 3 === 0) px("#00f6ff", X + off - 5 * f, Y + j, 10, 1); else if (j % 3 === 1) px("#ff3fb4", X + off + 6 * f, Y + j, 10, 1);
        for (let i = 0; i < r.length; i++) if (r[i] !== ".") px(S.col[r[i]] || "#FFD319", X + i + off, Y + j, 1, 1);
      });
      return;
    }
    // La ventanita de error, donde estaba BIT
    const vx = Math.max(1, Math.min(S.W - 27, X - 8)), vy = Math.max(10, Math.min(piso() - 23, Y - 9));
    if (k < 1.0) {
      const s = k < 0.61 ? 0.6 : 1, w = Math.round(26 * s), hh = Math.round(22 * s), x = vx + ((26 - w) >> 1), y = vy + ((22 - hh) >> 1);
      px("#030303", x - 1, y - 1, w + 2, hh + 2); px("#c9c6b8", x, y, w, hh); px("#3D7BFF", x, y, w, 4); px("#FF3D3D", x + w - 4, y + 1, 3, 2); px("#030303", x + 1, y + 5, w - 2, hh - 6);
      if (s === 1 && (k < 0.7 || Math.floor(k * 10) % 2)) { const ex = x + 10, ey = y + 8; for (let i = 0; i < 6; i++) { px("#FF3D3D", ex + i, ey + i, 1, 1); px("#FF3D3D", ex + 5 - i, ey + i, 1, 1); px("#FF3D3D", ex + i + 1, ey + i, 1, 1); } px("#c9c6b8", x + 7, y + 17, 12, 2); }
      return;
    }
    if (k < 1.18) { const q = (k - 1.0) / 0.18, hh = Math.max(1, Math.round(22 * (1 - q))); px("#c9c6b8", vx - 2 * q, vy + 11 - hh / 2, 26 + 4 * q, hh); px("#ffffff", vx + 4, vy + 11, 18, 1); return; }
    if (k < 1.5) {
      const q = (k - 1.18) / 0.32, w = Math.max(1, Math.round(30 * (1 - q)));
      px("#ffffff", vx + 13 - w / 2, vy + 11, w, 1);
      for (let i = 0; i < 9; i++) px(i % 2 ? "#00f6ff" : "#ff3fb4", vx + 13 + (BB.h(i + 0.3) - 0.5) * 40 * q, vy + 11 + (BB.h(i + 0.7) - 0.5) * 26 * q + q * q * 8, 1, 1);
    }
  }
  function muereBit() {
    S.estado = "fin"; S.finModo = "crash"; S.cierre = null;
    if (S.practica == null) ganaBytes(S.pts / 300);
    S.muerto = true;
    if (S.audio) S.audio.pause();
    if (S.practica == null) guardaTramos(0, S.secI);
    S.objs = [];
    SND.play("terminar");
    if (!RM) { S.temblor = 16; S.interferencia = 30; }
    hud();
    cierraVentana();
    cierraOrden();
    const ini = RM || !P() ? 0 : performance.now();
    S.muerteIni = ini;
    if (ini) { bip(220, 50, 0.3, "sawtooth", 0.07); [0.14, 0.22, 0.3, 0.38, 0.46].forEach((d, i) => bip(900 - i * 130, 0, 0.04, "square", 0.035, d)); bip(880, 0, 0.09, "square", 0.05, 0.56); bip(587, 0, 0.16, "square", 0.05, 0.66); bip(300, 40, 0.25, "sine", 0.06, 1.0); }
    // El mensaje sale cuando termina la animación (si para entonces ya se reintentó, no sale)
    const muestra = () => { if (S.muerteIni !== ini || S.estado !== "fin" || !S.muerto) return; setTimeout(entraMsg, 0);
    aviso(`<p class="jm-t jm-rojo">CRASH</p>
      <p>${S.vidasR <= 0 || !UIA() ? `*** ${T("SIN VIDAS", "OUT OF LIVES")} ***<br>${T("BIT.EXE dejó de responder.", "BIT.EXE stopped responding.")}` : `*** ${T("MEMORIA LLENA", "OUT OF MEMORY")} ***<br>${T("GATO.EXE saturó la memoria y BIT.EXE dejó de responder.", "CAT.EXE flooded the memory and BIT.EXE stopped responding.")}`}</p>
      <p class="jm-p">${T("PUNTOS", "SCORE")} ${seis(S.pts)}</p>
      <p class="jm-b"><button type="button" data-j="jefe">${kb("R")}${T("REINTENTAR TRAMO", "RETRY SECTION")}</button><button type="button" data-j="titulo">${kb("M")}${T("DISCOS", "DISKS")}</button>${btnEncender()}<button type="button" data-j="salir">${kb("ESC")}${T("SALIR", "QUIT")}</button></p>`); };
    if (ini) setTimeout(muestra, 1500); else muestra();
  }
  // Reintentar: desde el inicio del escenario donde cayó, con los puntos que traía al llegar ahí
  const reintenta = () => (S.foto && S.foto.t > 2 ? empezarRitmo(S.foto.t - 1.9, S.foto) : empezarRitmo(0, { pts: 0, maxCombo: 0, atrapados: 0, cont: S.continues }));
  // Fallar se tiene que sentir: sacudida, BIT lastimado, el carril en rojo, interferencia y la música se hunde un instante
  function falla(o) {
    S.tFallo = S.ts;
    S.destellos.push({ x: o.x, vida: 30 });
    S.boca = "o"; S.bocaT = 45;
    S.dano = 26;
    if (!RM) { S.temblor = 11; S.interferencia = 12; }
    bip(170, 45, 0.3, "sawtooth", 0.075);
    bip(90, 40, 0.22, "square", 0.05, 0.03);
    castigo();
    if (G()) S.luz = Math.max(0.1, S.luz - 0.2);
    // Fuera del jefe del gato (ahí lo que se llena es la memoria), cada tantos bugs caídos cuestan una vida
    if ((S.secI !== S.JEFE || !UIA()) && ++S.fallosVida >= S.D.paso) { S.fallosVida = 0; pierdeVida(); }
  }
  // BIT pierde una vida y queda un instante a salvo, para que una mala racha no se las lleve todas de golpe
  function pierdeVida() {
    // Probando un mapa desde el editor no se pierden vidas: se puede recorrer completo
    if (S.prueba) return;
    if (S.invul > 0 || (S.fiebre > S.ts && !S.vuela) || S.vidasR <= 0) return;
    // La armadura aguanta el golpe en lugar de la vida
    if (S.escudo > 0) {
      S.escudo--; S.invul = S.D.invul; S.vidaFx = 40;
      bip(1400, 500, 0.15, "square", 0.06); bip(700, 0, 0.1, "triangle", 0.05, 0.05);
      S.textos.push({ txt: T("ARMADURA", "ARMOR"), x: S.bit.x + 5, y: S.bit.y - 4, vida: 50, max: 50, c: "#7dd3fc", e: 1 });
      return;
    }
    S.vidasR--;
    S.invul = S.D.invul;
    S.vidaFx = 40;
    if (!RM) { S.temblor = 16; S.interferencia = 18; }
    bip(440, 110, 0.35, "sawtooth", 0.08);
    bip(220, 55, 0.4, "square", 0.06, 0.05);
    S.textos.push({ txt: T("-1 VIDA", "-1 LIFE"), x: S.bit.x + 5, y: S.bit.y - 4, vida: 50, max: 50, c: "#ff4d4d", e: 1 });
    hud();
  }
  // Lo que cuesta fallar un bug o comerse un rayo: la música baja apenas, se pierde el combo y, con el jefe, se llena la memoria
  function castigo(rayo) {
    if (S.audio && !S.audio.muted) { S.audio.volume = S.R.volumen * 0.72; S.agachaT = 9; }
    rompeVentanas();
    S.combo = 0;
    if (S.secI === S.JEFE && !rayo && UIA()) {
      S.peligro = Math.min(S.JEFE_TOPE, S.peligro + 1);
      if (S.peligro === S.JEFE_TOPE - 2) cmd("MEM", "MEM", "ALERTA: memoria casi llena", "WARNING: memory almost full");
    }
    hud();
  }
  // Nivel GRIMORIO: BIT tocó un bug maldito. Pierde el combo y parte de su luz, y cuenta como un bug caído
  function maldito(o, nombre) {
    S.boca = "o"; S.bocaT = 45;
    S.dano = 26;
    if (!RM) { S.temblor = 11; S.interferencia = 10; }
    bip(140, 50, 0.3, "sawtooth", 0.07); bip(70, 40, 0.25, "square", 0.05, 0.04);
    S.textos.push({ txt: nombre || T("MALDITO", "CURSED"), x: o.x + 5, y: o.y, vida: 45, max: 45, c: "#d44bff", e: 1 });
    castigo(true);
    S.luz = Math.max(0.1, S.luz - 0.25);
    if (++S.fallosVida >= S.D.paso) { S.fallosVida = 0; pierdeVida(); }
  }
  // Un rayo del gato alcanzó a BIT
  function golpeado() {
    S.boca = "o"; S.bocaT = 45;
    S.dano = 26;
    if (!RM) { S.temblor = 12; S.interferencia = 10; }
    bip(900, 80, 0.22, "sawtooth", 0.07);
    bip(60, 40, 0.25, "square", 0.05, 0.02);
    // Un rayo siempre cuesta una vida entera
    castigo(true);
    pierdeVida();
  }

  Object.assign(BB, { RANGOS, muriendo, reintenta });
})();