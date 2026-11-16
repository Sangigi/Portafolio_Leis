/* ---------- BIT & BUGS · entrada.js: teclado, puntero, abrir y cerrar el juego (window.Juego) ---------- */
(() => {
  "use strict";
  const BB = window.BitBugs, S = BB.S;
  const { P, RM, bip, bucle, cambiaCancion, cancionAbierta, cierraOrden, cierraVentana, compraTienda, detieneAudio, doc, el, eligeDisco, empezar, empezarRitmo, entraMsg, finRitmo, fx, hud, irA, jugar, leeCol, lienzo, medir, mueveTienda, pasaAResultado, pausa, pintaTitulo, practicar, reintenta, saltaA, tienda, titulo, verTramos } = BB;
  Object.assign(BB, { abrir, cerrar, mueve, teclas });

  /* ---------- 14. Teclado, puntero, abrir y cerrar ---------- */
  // Puntero: BIT brinca al carril que señala el mouse o el dedo; en el vuelo, lo sigue
  lienzo.addEventListener("pointerdown", (e) => { lienzo.setPointerCapture(e.pointerId); mueve(e); });
  lienzo.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse" || e.buttons) mueve(e); });
  function mueve(e) { const r = lienzo.getBoundingClientRect(); S.meta = ((e.clientX - r.left) / r.width) * S.W; S.metaY = ((e.clientY - r.top) / r.height) * S.H; }

  // Teclado: mientras el juego está abierto, todas las teclas son suyas
  function teclas(e) {
    if (el.hidden) return;
    const k = e.key.toLowerCase();
    const flechaIzq = k === "arrowleft" || k === "a", flechaDer = k === "arrowright" || k === "d";
    const flechaArr = k === "arrowup" || k === "w", flechaAba = k === "arrowdown" || k === "s";
    if (e.type === "keyup") {
      if (flechaIzq) S.izq = false;
      if (flechaDer) S.der = false;
      if (flechaIzq || flechaDer) { S.dirTecla = S.der ? 1 : S.izq ? -1 : 0; S.rep = 22; }
      if (flechaArr) S.arr = false;
      if (flechaAba) S.aba = false;
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    e.stopPropagation();
    e.preventDefault();
    // Durante la cuenta del final, cualquier tecla la salta
    if (S.enTrans) return;
    if (S.estado === "fin" && S.finModo === "conteo") { if (!e.repeat) pasaAResultado(); return; }
    if (S.estado === "llave") { if (!e.repeat && S.llaveFin) S.llaveFin(); return; }
    if (flechaIzq || flechaDer) {
      // Cada toque es un salto inmediato; dejar la tecla apretada repite el salto
      if (e.repeat) return;
      if (flechaIzq) S.izq = true; else S.der = true;
      S.dirTecla = flechaIzq ? -1 : 1;
      // Un toque = un salto. Solo si se deja la tecla apretada un buen rato (un tercio de segundo) empieza a repetir, y despacio
      S.rep = 22;
      if ((S.estado === "jugando" || S.estado === "cierre") && !S.vuela && !S.lateral) { S.meta = null; saltaA(S.bit.c + S.dirTecla); }
      else if (S.estado === "titulo") { if (S.filaSel === 0 && S.R) cambiaCancion(S.dirTecla); else eligeDisco(S.selDisco + S.dirTecla); }
      else if (S.estado === "tramos") { bip(880, 0, 0.03, "square", 0.03); verTramos(S.selTramo + S.dirTecla); }
      else if (S.estado === "tienda") mueveTienda(S.dirTecla, 0);
    }
    else if ((S.estado === "jugando" || S.estado === "cierre") && !S.vuela && k >= "1" && k <= "5" && k.length === 1) { S.meta = null; saltaA(+k - 1); }
    else if (S.estado === "titulo" && (flechaArr || flechaAba)) { if (S.R && S.filaSel !== (flechaArr ? 0 : 1)) { S.filaSel = flechaArr ? 0 : 1; bip(880, 0, 0.03, "square", 0.03); pintaTitulo(); } }
    else if (S.estado === "jugando" && S.lateral && (flechaArr || flechaAba)) { if (!e.repeat) { S.meta = null; S.metaY = null; saltaA(S.bit.c + (flechaArr ? -1 : 1)); } }
    else if (S.estado === "tienda" && (flechaArr || flechaAba)) mueveTienda(0, flechaArr ? -1 : 1);
    else if (S.estado === "tienda" && (k === " " || k === "enter")) compraTienda();
    else if (S.estado === "tienda" && (k === "m" || k === "t")) irA(titulo);
    else if (S.estado === "titulo" && k === "t") irA(tienda);
    // Flecha abajo en los carriles: BIT se apachurra un momento, de puro gusto
    else if (flechaAba && S.estado === "jugando" && S.modo === "ritmo" && !S.vuela && !S.lateral) { if (!e.repeat && S.apach <= 0 && !S.aplastado) { S.apach = 18; S.boca = "s"; S.bocaT = 26; S.parpadeo = 16; bip(430, 240, 0.07, "sine", 0.05); bip(240, 500, 0.11, "sine", 0.045, 0.1); if (!RM) S.chispas.push({ x: S.bit.x + 4, y: S.bit.y - 2, vx: 0, vy: -0.7, vida: 18, c: "#ff8ad8", g: 2 }); } }
    else if (flechaArr) S.arr = true;
    else if (flechaAba) S.aba = true;
    else if (k === "escape") { if (S.estado === "jugando") pausa(true); else if (S.estado === "tramos" || S.estado === "tienda") irA(titulo); else if (S.estado === "cierre") { S.cierre = null; finRitmo(); } else cerrar(false); }
    else if (k === "p") pausa(S.estado === "jugando");
    else if (S.estado === "titulo" && k >= "1" && k <= "4" && k.length === 1) { eligeDisco(+k - 1); jugar(); }
    else if (S.estado === "titulo" && (k === " " || k === "enter")) jugar();
    else if (S.estado === "titulo" && k === "n" && S.selDisco > 0 && cancionAbierta(S.cancionI)) irA(() => verTramos());
    else if (S.estado === "tramos" && (k === " " || k === "enter")) practicar();
    else if (S.estado === "tramos" && k === "m") irA(titulo);
    else if (S.estado === "pausa" && (k === " " || k === "enter")) pausa(false);
    else if ((S.estado === "pausa" || S.estado === "fin") && k === "m") irA(titulo);
    else if (S.estado === "fin" && (k === "r" || k === " " || k === "enter")) (S.modo !== "ritmo" ? empezar : S.muerto ? reintenta : S.practica != null ? () => practicar(S.practica) : empezarRitmo)();
    else if (S.estado === "fin" && S.finModo === "resultado" && k === "j" && S.res && S.res.peor >= 0) practicar(S.res.peor);
    else if (S.estado === "fin" && S.finModo === "practica" && k === "n") irA(() => verTramos(S.practica));
    else if (S.estado === "fin" && k === "y" && S.deApagado) cerrar(true);
  }
  window.addEventListener("keydown", teclas, true);
  window.addEventListener("keyup", teclas, true);
  const alSalir = () => pausa(true);
  document.addEventListener("visibilitychange", () => {
    if (el.hidden) return;
    if (document.hidden) pausa(true);
    // La música que sigue en la pantalla de resultados calla mientras la pestaña no se ve
    if (S.audio && S.estado === "fin" && S.finModo !== "crash" && S.R && S.R.sigue && S.practica == null) { if (document.hidden) S.audio.pause(); else S.audio.play().catch(() => {}); }
  });

  function abrir() {
    if (!el.hidden) return;
    S.deApagado = !!(P() && P().consola.apagada());
    S.volverA = document.activeElement;
    S.bloqueamos = !doc.classList.contains("lock");
    doc.classList.add("lock");
    el.hidden = false;
    leeCol();
    medir();
    hud();
    titulo();
    entraMsg();
    S.izq = S.der = S.arr = S.aba = false;
    S.dirTecla = 0;
    S.meta = null;
    S.ult = 0;
    S.raf = requestAnimationFrame(bucle);
    window.addEventListener("resize", medir);
    window.addEventListener("blur", alSalir);
    el.focus({ preventScroll: true });
  }
  // encender = Y: cierra el juego y vuelve a encender la consola
  function cerrar(encender) {
    cierraVentana();
    cierraOrden();
    detieneAudio();
    fx.style.transform = "";
    lienzo.style.transform = "";
    S.modo = "clasico";
    el.hidden = true;
    cancelAnimationFrame(S.raf);
    S.raf = 0;
    S.estado = "titulo";
    window.removeEventListener("resize", medir);
    window.removeEventListener("blur", alSalir);
    if (S.bloqueamos) doc.classList.remove("lock");
    if (encender && S.deApagado && P()) P().consola.encender();
    else if (S.volverA && S.volverA.isConnected) S.volverA.focus({ preventScroll: true });
  }

  window.Juego = { abrir, abierto: () => !el.hidden };

  Object.assign(BB, { alSalir });
})();
