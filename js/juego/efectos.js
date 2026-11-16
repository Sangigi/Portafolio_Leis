/* ---------- BIT & BUGS · efectos.js: el gato, el lienzo de efectos (escenario de cada cuadro) y el bucle principal ---------- */
(() => {
  "use strict";
  const BB = window.BitBugs, S = BB.S;
  const { APAGA_BLANCO, DM, ESCENAS, ESCENAS_F, ESCENAS_G, FK, FONDOS_FLASH, G, P, RM, SANDE, TAU, UIA, c2, cajaRect, cajaS, chispazo, dibuja, escenaDoom, flashesPasados, fogonazo, fx, h, linea, muriendo, paso, piso, rayo, rc, sprFx, tiras } = BB;
  Object.assign(BB, { bucle, corona, dibujaCierreFx, dibujaFx, dibujaGato, pasoGato, pideGato, pintaGato, rayosDelGato });

  /* ---------- El gato: quieto cuando la canción calla, girando cuando suena ----------
     La hoja images/juego/gato-uia.png trae 6 cuadros de 64 px: 0 = parado, 1 a 5 = una vuelta.
     La vuelta dura más o menos según la energía de la canción, y el gato se pasea distinto en cada escenario. */
  const gatoHoja = new Image();
  S.gatoOk = false; S.gatoPedido = false; S.gatoX = 0; S.gatoY = 0; S.gatoTam = 1; S.gatoQuieto = true; S.estela = [];
  // En sus vueltas el gato pasa por detrás de la terminal y por delante: gatoFrente va de 0 (detrás) a 1 (delante)
  S.gatoFrente = 0;
  gatoHoja.onload = () => { S.gatoOk = true; };
  function pideGato() { if (!S.gatoPedido && S.R && S.R.gato) { S.gatoPedido = true; gatoHoja.src = S.R.gato; } }
  function pasoGato() {
    // En el GRIMORIO no hay gato: la cámara, en la calma, se va a la hoguera
    if (!UIA()) { S.gatoX = S.gx + S.W / 2; S.gatoY = S.gy + S.H * 0.6; return; }
    const cx = S.gx + S.W / 2, cy = S.gy + S.H * 0.5, sec = S.R.sec[S.secI], k = Math.min(1, Math.max(0, (S.ts - sec[0]) / (sec[1] - sec[0])));
    const base = Math.min(64, S.FW * 0.42, S.FH * 0.36);
    let x = cx, y = cy, tam = 1;
    switch (S.secI) {
      case 0: y = S.gy + S.H * 0.66; break;                                                                        // aparece bajo el aviso de error
      case 1: x = cx + Math.sin(S.ts * 0.8) * S.FW * 0.3; y = S.gy + S.H * 0.6 - base * 0.3; break;                  // camina por el horizonte, frente al sol
      case 2: x = cx + Math.sin(S.ts * 0.35) * S.FW * 0.33; y = cy + Math.sin(S.ts * 0.9) * S.FH * 0.13; break;       // flota
      case 3: tam = 0.45 + k * k * 1.1; x = cx + (RM ? 0 : Math.sin(S.ts * 31) * k * 2); y = cy + (RM ? 0 : Math.cos(S.ts * 27) * k * 2); break; // se acerca
      case 4: x = cx + Math.sin(S.ts * 1.1) * S.W * 0.3; y = S.gy + S.H * 0.32 - S.pulso * 3; tam = 1.05 + S.peligro * 0.05; break; // el jefe: arriba, creciendo con la pista
      case 5: x = S.FW * 0.3 + Math.sin(S.ts * 0.3) * S.FW * 0.16; y = S.FH * 0.3 + Math.cos(S.ts * 0.4) * 7; tam = 0.85; break; // pasea por el cielo
      case 6: x = cx + Math.sin(S.ts * 0.9) * S.FW * 0.3; y = cy + Math.sin(S.ts * 1.8) * S.FH * 0.17; break;          // dibuja un ocho
      case 7: x = cx + Math.cos(S.ts * 2.2) * S.FW * 0.27; y = cy + Math.sin(S.ts * 2.2) * S.FH * 0.22; tam = 1.1; break; // da vueltas alrededor del centro
      case 8: x = cx + Math.sin(S.ts * 0.25) * S.FW * 0.22; y = cy + Math.sin(S.ts * 0.5) * S.FH * 0.1; tam = 0.9; break; // se hunde despacio
      case 9: y = S.gy + S.H * 0.6; break;                                                                         // quieto mientras lo limpian
      default: break;
    }
    // La profundidad de la vuelta: un rato detrás (más chico) y un rato delante (más grande). En el arranque y la limpieza, siempre detrás
    const alFrente = S.secI > 0 && S.secI < S.R.sec.length - 1 && !S.gatoQuieto && Math.sin(S.ts * 0.85 + 1) > 0.25;
    S.gatoFrente += ((alFrente ? 1 : 0) - S.gatoFrente) * 0.08;
    tam *= 0.9 + S.gatoFrente * 0.28;
    const lento = 0.09;
    S.gatoX += (x - S.gatoX) * lento;
    S.gatoY += (y - S.gatoY) * lento;
    S.gatoTam += (tam - S.gatoTam) * 0.1;
    // Con la canción en silencio se queda parado; cuando vuelve, gira
    if (S.gatoQuieto ? S.energiaAhora > 0.31 : S.energiaAhora < 0.24) S.gatoQuieto = !S.gatoQuieto;
    if (S.secI === 7 && !RM && S.t % 3 === 0) { S.estela.push([S.gatoX, S.gatoY, S.giro]); if (S.estela.length > 5) S.estela.shift(); }
    else if (S.secI !== 7 && S.estela.length) S.estela = [];
  }
  function pintaGato(x, y, lado, vuelta, alfa, c = c2) {
    const dib = (f, a) => { c.globalAlpha = a; c.drawImage(gatoHoja, f * 64, 0, 64, 64, Math.round(x - lado / 2), Math.round(y - lado / 2), lado, lado); };
    if (vuelta == null) dib(0, alfa);
    else {
      const f = (((vuelta * 5) % 5) + 5) % 5, i = Math.floor(f);
      dib(1 + i, alfa);
      // En las vueltas lentas, un cuadro se funde con el siguiente para que no se vea a saltos
      if (S.vGiro < 1.3 && !RM) dib(1 + ((i + 1) % 5), alfa * (f - i));
    }
    c.globalAlpha = 1;
  }
  // Cuánto lleva la limpieza del final, de 0 a 1
  const limpieza = () => (S.secI === 9 ? Math.min(1, Math.max(0, (S.ts - S.R.sec[9][0] - 0.6) / (S.R.limpia - 0.6))) : 0);
  // En el arranque el gato todavía no se ve: solo se asoma un instante antes de tumbar la consola
  const gatoSeVe = () => S.secI > 0 || S.ts >= S.R.error || (!RM && S.R.asomos.some((a) => S.ts >= a && S.ts < a + 0.09));
  function dibujaGato() {
    if (!S.gatoOk || !gatoSeVe()) return;
    const base = Math.min(64, S.FW * 0.42, S.FH * 0.36), lado = Math.max(2, Math.round(base * S.gatoTam * (1 + S.pulso * 0.07)));
    c2.imageSmoothingEnabled = false;
    S.estela.forEach(([x, y, g], i) => pintaGato(x, y, lado, g, 0.1 + i * 0.07));
    const k = limpieza();
    if (k >= 1) return;
    if (k > 0) {
      // La limpieza lo borra de arriba hacia abajo: una línea verde lo recorre y suelta pixeles
      const arriba = S.gatoY - lado / 2, corte = arriba + lado * k;
      c2.save();
      c2.beginPath(); c2.rect(S.gatoX - lado, corte, lado * 2, lado * (1 - k) + 2); c2.clip();
      pintaGato(S.gatoX + (RM ? 0 : Math.round((h(Math.floor(S.ts * 12)) - 0.5) * 3)), S.gatoY, lado, S.gatoQuieto ? null : S.giro, 1);
      c2.restore();
      rc(S.col.V, S.gatoX - lado / 2 - 3, corte, lado + 6, 1);
      if (!RM) for (let i = 0; i < 16; i++) rc(i % 3 ? S.col.V : "#d9ffe6", S.gatoX - lado / 2 + h(i) * lado, corte - ((S.ts * 34 + h(i + 0.3) * 22) % 22), 1, 1);
      return;
    }
    pintaGato(S.gatoX, S.gatoY, lado, S.gatoQuieto ? null : S.giro, S.secI === 8 ? 0.8 : 1);
    if (S.secI === S.JEFE || S.secI === S.VUELO) corona(lado);
  }
  // La corona de rayos del gato cuando ataca: cinco picos de electricidad que no dejan de moverse
  function corona(lado) {
    const y0 = S.gatoY - lado * 0.42, ancho = lado * 0.5, tiembla = RM ? 0 : 1;
    let px = S.gatoX - ancho / 2, py = y0;
    for (let i = 1; i <= 10; i++) {
      const nx = S.gatoX - ancho / 2 + (ancho * i) / 10, pico = i % 2 ? 7 + (i === 5 ? 4 : 0) + S.pulso * 3 + Math.random() * 3 * tiembla : 0, ny = y0 - pico;
      linea(i % 4 < 2 ? "#fff36b" : "#ffffff", px, py, nx, ny);
      px = nx; py = ny;
    }
    rc("#fff36b", S.gatoX - ancho / 2, y0 + 1, ancho, 1);
    if (!RM) for (let i = 0; i < 4; i++) rc(i % 2 ? "#00f6ff" : "#ffffff", S.gatoX + (Math.random() - 0.5) * lado * 0.8, y0 - Math.random() * 14, 1, 1);
  }
  // Los rayos salen de la corona: una chispa fina mientras avisa y el rayo entero cuando cae
  function rayosDelGato() {
    if (!S.gatoOk || !S.ataques.length) return;
    const lado = Math.min(64, S.FW * 0.42, S.FH * 0.36) * S.gatoTam, ox = S.gatoX, oy = S.gatoY - lado * 0.5;
    for (const a of S.ataques) {
      const [dx, dy] = a.tipo === "v" ? [S.gx + a.c * S.LW + S.LW / 2, S.gy + 9] : a.tipo === "x" ? [S.gx + a.x, S.gy + 9] : [S.gx, S.gy + a.y];
      if (!a.hecho) { if (!RM && (S.t >> 1) % 2) rayo(ox, oy, dx, dy, "#ff2e7e", 1); }
      else { rayo(ox, oy, dx, dy, "#ff2e7e", 3); rayo(ox, oy, dx, dy, "#ffffff", 2); }
    }
  }

  // Todo lo que va en el lienzo de efectos: escenario, gato y, encima, destellos y apagón
  S.fxLimpio = true;
  function dibujaFx() {
    const activo = S.modo === "ritmo" && S.estado !== "cargando" && S.secI >= 0;
    if (!activo) { if (!S.fxLimpio) { c2.clearRect(0, 0, S.FW, S.FH); fx.style.transform = ""; S.fxLimpio = true; } return; }
    S.fxLimpio = false;
    c2.globalAlpha = 1;
    if (S.estado === "cierre" && S.cierre) { dibujaCierreFx(); return; }
    // Tras el cierre, el escenario se queda apagado detrás de los resultados
    if (S.negro && S.estado === "fin") { fx.style.transform = ""; rc("#000000", 0, 0, S.FW, S.FH); if (S.destello > 0) { c2.globalAlpha = S.destello / 26; rc("#ffffff", 0, 0, S.FW, S.FH); c2.globalAlpha = 1; } return; }
    const esc = { cx: S.gx + S.W / 2, cy: S.gy + S.H * 0.5, suelo: S.gy + piso(), sec: S.R.sec[S.secI] };
    const cs = cajaS();
    if (cs < 1) {
      // El recuadro que se lleva todo: nada se encoge; el negro se va cerrando desde las orillas hasta BIT, con su marco
      // blanco, y al final se cierra del todo: pantalla en negro
      ESCENAS_F[S.secI](esc);
      const [x0, y0, w0, h0] = cajaRect(cs);
      rc("#000000", 0, 0, S.FW, y0); rc("#000000", 0, y0 + h0, S.FW, S.FH - y0 - h0); rc("#000000", 0, y0, x0, h0); rc("#000000", x0 + w0, y0, S.FW - x0 - w0, h0);
      if (w0 > 2 && h0 > 2) { rc("#ffffff", x0, y0, w0, 1); rc("#ffffff", x0, y0 + h0 - 1, w0, 1); rc("#ffffff", x0, y0, 1, h0); rc("#ffffff", x0 + w0 - 1, y0, 1, h0); } else rc("#000000", 0, 0, S.FW, S.FH);
    } else if (DM()) escenaDoom(esc);
    else if (FK() && S.lateral && flashesPasados() > 0) { const i = FONDOS_FLASH[(flashesPasados() - 1) % FONDOS_FLASH.length]; ESCENAS_F[i]({ ...esc, sec: S.R.sec[i] || S.R.sec[S.secI] }); }
    else (G() ? ESCENAS_G : FK() ? ESCENAS_F : ESCENAS)[S.secI](esc);
    // Lo raro "fuera": BIT está al lado de la terminal, por fuera, a la altura de su fila
    if (S.raro === "fuera" && S.lateral && P() && S.rectL) {
      const k = S.rectL.height / (S.H * S.escala), x = Math.max(1, Math.round((S.rectL.left - S.fxIzq) / S.escala - 15)), y = Math.round((S.rectL.top - S.fxArr) / S.escala + S.bit.y * k);
      const spr = P().bitSprite(1, S.parpadeo > 0, S.boca);
      c2.fillStyle = "#000000"; spr.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== ".") c2.fillRect(x + i - 1, y + j - 1, 3, 3); });
      sprFx(spr, x, y, 1, S.col);
      if ((S.t >> 2) % 2) { rc("#ffffff", x - 3, y - 3, 3, 1); rc("#ffffff", x - 3, y - 3, 1, 3); rc("#ffffff", x + 11, y + 14, 3, 1); rc("#ffffff", x + 13, y + 12, 1, 3); }
    }
    if (UIA()) { dibujaGato(); rayosDelGato(); }
    // Con fiebre, una lluvia de destellos de colores por toda la pantalla
    if (S.fiebre > S.ts && !RM) for (let i = 0; i < 26; i++) rc(SANDE[(i + (S.t >> 2)) % SANDE.length], h(i) * S.FW, (h(i + 0.5) * S.FH + S.ts * (30 + h(i + 0.2) * 50)) % S.FH, 2, 2);
    // El destello al cambiar de escenario y el fogonazo del despegue
    if (!RM && S.cambio > 0 && !DM()) { c2.globalAlpha = (S.cambio / 26) * 0.55; rc("#ffffff", 0, 0, S.FW, S.FH); c2.globalAlpha = 1; }
    if (!RM && UIA() && S.secI === 3 && S.ts > 98.86) { c2.globalAlpha = Math.min(1, (S.ts - 98.86) / 1.96) * 0.5; rc("#ffffff", 0, 0, S.FW, S.FH); c2.globalAlpha = 1; }
    { const fg = S.estado === "jugando" ? fogonazo() : 0; if (fg > 0.01) { c2.globalAlpha = Math.min(1, fg); rc("#ffffff", 0, 0, S.FW, S.FH); c2.globalAlpha = 1; } }
    // Las chispas sobre el blanco: salen del centro, titilan y al final se apagan con él
    { const ch = S.estado === "jugando" ? chispazo() : null; if (ch && ch.e >= 0) {
      const alfa = Math.min(1, (ch.d - ch.e) / APAGA_BLANCO), sale = 1 - Math.pow(1 - Math.min(1, ch.e / (ch.d * 0.8)), 3), cx = S.gx + S.W / 2, cy = S.gy + S.H * 0.5, cols = ["#ff3fb4", "#00c8e8", "#ffb000", "#7a3fc0"];
      c2.globalAlpha = alfa; rc("#ffffff", 0, 0, S.FW, S.FH);
      for (let i = 0; i < 130; i++) {
        if (!RM && h(i + (S.t >> 2) * 0.37) < 0.22) continue;
        const a = h(i) * TAU, d = (0.06 + h(i + 0.3) * 0.94) * Math.hypot(S.FW, S.FH) * 0.55 * sale, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.8, g = h(i + 0.6) < 0.25 ? 2 : 1, c = cols[i % 4];
        if (i % 3 === 0) { rc(c, x - 2 * g, y, 5 * g, g); rc(c, x, y - 2 * g, g, 5 * g); } else rc(c, x, y, 2 * g, 2 * g);
      }
      c2.globalAlpha = 1;
    } }
    // Al fallar un bug: la imagen se rompe en tiras y se tiñe de rojo
    if (S.interferencia > 0 && !RM) { tiras(5, 10, S.t); c2.globalAlpha = (S.interferencia / 12) * 0.2; rc("#ff0030", 0, 0, S.FW, S.FH); c2.globalAlpha = 1; }
    // La cámara: el lienzo de efectos se acerca un poco hacia su foco; el recuadro del juego apenas late
    // (con el azote del pisón, el fondo también brinca)
    const azote = S.golpeY > 0 && !RM ? (S.golpeY > 6 ? 3 : S.golpeY > 3 ? -2 : S.golpeY % 2 ? 1 : 0) * S.escala : 0;
    fx.style.transform = S.zoom > 1.001 ? `translate(${(S.focoX * (1 - S.zoom) * S.escala).toFixed(2)}px,${(S.focoY * (1 - S.zoom) * S.escala + azote).toFixed(2)}px) scale(${S.zoom.toFixed(4)})` : azote ? `translateY(${azote}px)` : "";
    // El apagón final: la pantalla entera se cierra en una línea y la línea en un punto
    const falta = S.R.dur - S.ts;
    if (G()) {
      // El grimorio se cierra: las dos tapas llegan al centro justo en el último golpe
      if (S.secI === S.R.sec.length - 1 && falta < 1.6) {
        const k = 1 - Math.max(0, falta) / 1.6, ancho = (S.FW / 2) * k * k;
        rc("#1a0f08", 0, 0, ancho, S.FH); rc("#1a0f08", S.FW - ancho, 0, ancho + 1, S.FH);
        rc("#ffd23b", ancho - 2, 0, 2, S.FH); rc("#ffd23b", S.FW - ancho, 0, 2, S.FH);
        for (let y = 6; y < S.FH; y += 14) { rc("#3a2414", ancho - 12, y, 6, 2); rc("#3a2414", S.FW - ancho + 6, y, 6, 2); }
      }
    } else if (UIA() && S.secI === S.R.sec.length - 1 && falta < 3) {
      const k = 1 - Math.max(0, falta) / 3, mitad = Math.max(1, (S.FH / 2) * (1 - k) * (1 - k));
      rc(S.col.F, 0, 0, S.FW, S.FH / 2 - mitad);
      rc(S.col.F, 0, S.FH / 2 + mitad, S.FW, S.FH / 2 - mitad + 1);
      if (k > 0.75) { const ancho = (S.FW / 2) * (1 - (k - 0.75) / 0.25); rc(S.col.F, 0, 0, S.FW / 2 - ancho, S.FH); rc(S.col.F, S.FW / 2 + ancho, 0, S.FW / 2 - ancho + 1, S.FH); }
    }
    // En pausa o al terminar, todo se oscurece para que se lea el mensaje
    if (S.estado !== "jugando" && !muriendo()) rc("rgba(0,0,0,.74)", 0, 0, S.FW, S.FH);
  }
  // El cierre en el lienzo de efectos: fogonazo, estrellas del color del nivel que salen del centro y titilan, y negro
  function dibujaCierreFx() {
    const k = S.cierre, T0 = k.t, cx = S.gx + S.W / 2, cy = S.gy + S.H * 0.5;
    fx.style.transform = "";
    rc("#000000", 0, 0, S.FW, S.FH);
    const cols = G() ? ["#c084ff", "#ffd23b", "#ffffff", "#7a3fc0"] : DM() ? ["#ff5a4a", "#7dff3c", "#ffd23b", "#ffffff"] : FK() ? ["#ff3fb4", "#00f6ff", "#ffd23b", "#ffffff"] : ["#00f6ff", "#ff3fb4", "#ffe14a", "#ffffff"];
    const p = Math.min(1, T0 / 150), sale = 1 - Math.pow(1 - p, 3), alfa = T0 < 80 ? 1 : Math.max(0, 1 - (T0 - 80) / 70);
    if (alfa > 0) {
      c2.globalAlpha = alfa;
      for (let i = 0; i < 110; i++) {
        if (!RM && h(i + (T0 >> 2) * 0.37) < 0.22) continue;
        const a = h(i) * TAU, d = (0.06 + h(i + 0.3) * 0.94) * Math.hypot(S.FW, S.FH) * 0.55 * sale, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.8, g = h(i + 0.6) < 0.2 ? 2 : 1, c = cols[i % 4];
        // Estrellas de cuatro puntas; en el nivel del gato, mezcladas con pixeles sueltos
        if (G() || i % 3 === 0) { rc(c, x - 2 * g, y, 5 * g, g); rc(c, x, y - 2 * g, g, 5 * g); } else rc(c, x, y, 2 * g, 2 * g);
      }
      c2.globalAlpha = 1;
    }
    if (T0 < 18) { c2.globalAlpha = 1 - T0 / 18; rc("#ffffff", 0, 0, S.FW, S.FH); c2.globalAlpha = 1; }
    if (k.fase === "fin") { c2.globalAlpha = Math.min(1, k.tt / 13); rc("#ffffff", 0, 0, S.FW, S.FH); c2.globalAlpha = 1; }
  }
  function bucle(ahora) {
    S.raf = requestAnimationFrame(bucle);
    S.acum += Math.min(100, ahora - (S.ult || ahora));
    S.ult = ahora;
    while (S.acum >= 1000 / 60) { paso(); S.acum -= 1000 / 60; }
    dibuja();
    dibujaFx();
  }

  Object.assign(BB, { gatoHoja, gatoSeVe, limpieza });
})();
