/* ---------- BIT & BUGS · ritmo-paso.js: modo ritmo, lo que pasa en cada cuadro (notas, bugs, ataques, tramos especiales) ---------- */
(() => {
  "use strict";
  const BB = window.BitBugs, S = BB.S;
  const { BH, BICHOS, BW, CAMPANAS_ESCUDO, CANCIONES, CRUCE, CRUCE_LENTO, DM, FK, G, GROOVE_MAX, JEFE_BAJA, LLAVE, RAROS, REPARTO, RM, SANDE, T, TONOS_COMBO, UIA, azar, bip, bitY, carriles, castigo, chispazo, cierraOrden, cierraVentana, cmd, cmdRes, contorno, ctx, esTrampa, falla, filaY, finRitmo, golpeado, grita, guarda, h2, hud, idC, lapsoYa, lee, maldito, muereBit, multi, mundoDe, nivelCombo, pasoOrden, pasoVentanas, pideVentanas, pierdeVida, pinta, piso, ponAudio, ponCancion, tCancion, tactil, tiemposTeles, xBit, xBug } = BB;
  Object.assign(BB, { armaMapa, ataqueDJ, casillaLibre, despejaBugs, dibujaLlave, empiezaCierre, energia, naceBicho, pasoCierre, pasoRitmo, peligroEn, preparaNotas, programaAtaque });

  /* ---------- 10. Modo ritmo: el paso de cada cuadro ---------- */
  // Qué tan fuerte va la canción en este segundo (0 a 1), suavizado entre muestra y muestra
  function energia(seg) {
    const E = S.R.energia, x = Math.max(0, Math.min(E.length - 1.001, seg * 2)), i = Math.floor(x), f = x - i;
    return ((+E[i]) * (1 - f) + (+E[i + 1]) * f) / 9;
  }
  // Arma la partida: quita los bugs que quedarían demasiado juntos para esta dificultad (en el vuelo, bastantes más,
  // porque ahí se persiguen de uno en uno) y reparte arcoíris extra en el vuelo, que es donde más se disfruta la fiebre
  function preparaNotas() {
    const N = S.R.notas, n = N.length / 3;
    S.activa = []; S.tipoRun = mapa.tipo.slice(); S.totalNotas = 0;
    let ult = -9, enVuelo = 0, aireHasta = 0;
    // Mientras a BIT lo cambian de fila a la fuerza (las poses del arcade) no llega ningún bug
    const poses = S.R.lateral != null ? tiemposTeles(S.R.sec[S.R.lateral][1] - 0.25) : [];
    for (let i = 0; i < n; i++) {
      const tn = N[i * 3] / 1000, sec = seccionDe(tn);
      // En un mapa hecho a mano salen todos, tal como se pusieron
      if (S.R.personal) { S.activa.push(true); S.totalNotas++; continue; }
      // No salen los que quedan muy juntos, ni los comunes que caerían en el aire que pidió un bicho con maña
      // Mientras la terminal se encoge, se muda de lado y vuelve, no cae nada
      const sl = S.R.lateral != null ? S.R.sec[S.R.lateral] : null, sc = S.R.caja != null ? S.R.sec[S.R.caja] : null;
      const mudanza = (sl && ((tn > sl[0] - 0.9 && tn < sl[0] + 1.5) || (tn > sl[1] - 0.3 && tn < sl[1] + 1.3))) || (sc && tn > sc[1] - 1.25 && tn < sc[1] + 0.7) || (S.R.aplastada && tn > S.R.aplastada[0] - 1 && tn < S.R.aplastada[0] + S.R.aplastada[1] * 5 + 1.6) || (S.R.chispas && tn > S.R.sec[S.R.chispas[0]][1] - 0.4 && tn < S.R.sec[S.R.chispas[0]][1] + S.R.chispas[1] + 0.8) || (poses.length && tn > poses[0] - 0.35 && tn < poses[poses.length - 1] + 0.8);
      if (mudanza || tn - ult < (sec === S.VUELO ? S.D.gapVuelo : S.D.gap) || (tn < aireHasta && S.tipoRun[i] === "bug")) { S.activa.push(false); continue; }
      S.activa.push(true);
      ult = tn;
      if (mapa.aire[i]) aireHasta = tn + mapa.aire[i] * S.D.vel;
      S.totalNotas++;
      if (sec === S.VUELO && ++enVuelo % S.D.arcoVuelo === 4) S.tipoRun[i] = "arco";
    }
    // El último bug del jefe (R.chispas): cae por el carril de en medio y es un bug común. Al atraparlo empieza el destello
    S.ultimoJefe = -1; S.R._tUlt = null;
    if (S.R.chispas) for (let i = n - 1; i >= 0; i--) { const tn = N[i * 3] / 1000; if (tn < S.R.sec[S.R.chispas[0]][0]) break; if (S.activa[i] && seccionDe(tn) === S.R.chispas[0]) { S.ultimoJefe = i; mapa.c[i] = carriles >> 1; S.tipoRun[i] = "bug"; S.R._tUlt = tn; break; } }
  }
  const seccionDe = (seg) => { let i = 0; while (i < S.R.sec.length - 1 && seg >= S.R.sec[i][1]) i++; return i; };
  // Los carriles de cada nota se reparten aquí para que BIT nunca se quede parado: casi cada bug obliga a saltar.
  // De paso se eligen los especiales: dorado (+50), arcoíris (fiebre x2), glitch (cambia de carril al caer) y antivirus (jefe).
  const mapa = { c: [], tipo: [], aire: [] };
  function armaMapa() {
    mapa.c = []; mapa.tipo = []; mapa.aire = [];
    // Las canciones del jugador (modo personalizado) traen su mapa hecho a mano: carril y tipo de cada bug
    if (S.R.personal) { mapa.c = S.R.pc.slice(); mapa.tipo = S.R.pt.slice(); mapa.aire = S.R.pc.map(() => 0); return; }
    let sem = 20261114;
    const rnd = () => { sem = (sem * 1664525 + 1013904223) >>> 0; return sem / 4294967296; };
    const N = S.R.notas, n = N.length / 3, calma = S.R.calma || [0, 2, 5, 8, 9], g = G(), fin = S.R.sec.length - 1;
    const reparto = REPARTO[idC()] || [];
    let c = 2, dir = 1, oros = 0, normales = 0, toca = false, turno = 0;
    for (let i = 0; i < n; i++) {
      const tn = N[i * 3] / 1000, dt = i ? tn - N[(i - 1) * 3] / 1000 : 9, dtSig = i < n - 1 ? N[(i + 1) * 3] / 1000 - tn : 9, sec = seccionDe(tn), cAntes = c;
      // Ráfagas muy rápidas: a veces repite carril; lo demás siempre se mueve, y más lejos cuanto más tiempo hay
      let paso = dt < 0.24 ? (rnd() < 0.45 ? 0 : 1) : dt < 0.42 ? 1 : dt < 0.7 ? (rnd() < 0.65 ? 1 : 2) : 1 + Math.floor(rnd() * 3);
      if (rnd() < 0.3) dir = -dir;
      let nc = c + dir * paso;
      if (nc < 0 || nc > carriles - 1) { dir = -dir; nc = c + dir * paso; }
      c = Math.max(0, Math.min(carriles - 1, nc));
      let tipo = "bug", aire = 0;
      // El arcoíris (el que desata la fiebre) nunca sale en los escenarios tranquilos
      if (N[i * 3 + 2]) tipo = ++oros % 3 === 0 && !calma.includes(sec) ? "arco" : "oro";
      else {
        normales++;
        if (sec === S.JEFE && UIA() && normales % 13 === 0) tipo = "anti";
        // GRIMORIO: el maldito cae justo donde BIT se quedó parado, para obligarlo a quitarse. Solo si hay tiempo de verlo
        else if (g && (sec === 2 || sec === 6) && i > 0 && dt > 0.55 && dtSig > 0.55 && normales % 6 === 0) { tipo = "mal"; c = cAntes; }
        else if (sec >= (UIA() ? 3 : 2) && sec !== fin && sec !== S.VUELO && dt > 0.3 && dtSig > 0.45 && normales % 11 === 0) tipo = "glitch";
        // Los bichos con maña: uno cada tantos bugs, pero solo donde hay aire antes y después para reaccionar
        if (normales % 8 === 5) toca = true;
        const lista = reparto[sec] || [];
        if (toca && tipo === "bug" && lista.length && sec !== S.VUELO && i > 0 && dt > 0.28) {
          // Cada uno pide su espacio: el gusano y los gemelos, tiempo después; el acorazado, más (tiene que rebotar);
          // el troyano tramposo, tiempo antes para verle los ojos. Se toma el primero de la lista al que le alcance
          const cabe = (k) => (k === "troya" ? dt > 0.5 && dtSig > 0.4 : k === "gemelo" ? dt > 0.4 : true);
          for (let k = 0; k < lista.length; k++) {
            const cual = lista[(turno + k) % lista.length];
            if (!cabe(cual)) continue;
            tipo = cual; turno += k + 1; toca = false;
            // Los que necesitan aire después (rebotar, correr por el gemelo, tragarse al gusano entero) lo piden:
            // los bugs comunes que caerían en ese rato no salen
            aire = { acorazado: 0.85, gemelo: 0.75, gusano: 0.6 }[cual] || 0;
            // El troyano tramposo cae donde BIT se quedó parado, igual que el maldito
            if (tipo === "troya") c = cAntes;
            break;
          }
        }
      }
      mapa.c.push(c);
      mapa.tipo.push(tipo);
      mapa.aire.push(aire);
    }
  }
  /* El cierre de un nivel. Al acabar la canción: un destello y estrellas del color del nivel que salen del centro y se
     desvanecen hasta dejar todo en negro. Entonces baja una llave por un carril y se queda en el piso: al recogerla, BIT la
     levanta, todo se apaga con otro destello y aparecen los resultados. */
  function empiezaCierre() {
    cierraVentana();
    cierraOrden();
    S.estado = "cierre";
    S.objs = []; S.ataques = []; S.vuela = false; S.fiebre = 0; S.iman = 0; S.tension = 0; S.zoom = 1; S.punch = 0; S.dano = 0; S.interferencia = 0;
    S.bit.c = Math.max(0, Math.min(carriles - 1, Math.floor((S.bit.x + 5) / S.LW)));
    if (S.audio && S.R.sigue) S.audio.volume = S.R.volumen * 0.6;
    S.cierre = { t: 0, fase: "luz", c: (S.bit.c + 2 + ((Math.random() * 2) | 0)) % carriles, y: 10, tt: 0 };
    S.negro = true;
    hud();
    [1047, 1319, 1568, 2093].forEach((f, i) => bip(f, 0, 0.3, "triangle", 0.04, i * 0.08));
  }
  function pasoCierre() {
    const k = S.cierre, suelo = bitY() + 1;
    k.t++;
    pasoOrden();
    if (k.fase === "luz" || k.fase === "llave") BB.moverBit();
    // Las canciones del jugador no traen llave (no abren nada): tras la luz y las estrellas, van directo a los resultados
    if (k.fase === "luz" && k.t > 150 && S.R.personal) { k.fase = "fin"; k.tt = 0; bip(2000, 200, 0.5, "sawtooth", 0.035); }
    if (k.fase === "luz" && k.t > 150) {
      k.fase = "llave";
      if (tactil) cmd("LLAVE.EXE", "KEY.EXE", "OK: toca la llave", "OK: tap the key"); else cmd("LLAVE.EXE", "KEY.EXE", "OK: recoge la llave", "OK: grab the key");
    }
    if (k.fase === "llave") {
      if (k.y < suelo) { k.y = Math.min(suelo, k.y + 0.9); if (k.y >= suelo) { bip(1568, 0, 0.08, "triangle", 0.05); bip(2093, 0, 0.14, "triangle", 0.04, 0.06); } }
      else if (k.t % 45 === 0) bip(1976, 0, 0.05, "sine", 0.02);
      if (k.y > suelo - 16 && S.bit.c === k.c && Math.abs(S.bit.x - xBit(k.c)) < 3) {
        k.fase = "toma"; k.tt = 0;
        // Recoger la llave es lo que abre la siguiente canción
        if (!S.R.personal && !lee(`bitBugsPaso_${idC()}`)) { guarda(`bitBugsPaso_${idC()}`, "1"); k.abre = CANCIONES[S.cancionI + 1] || null; }
        S.nuevaCancion = k.abre || null;
        S.boca = "s"; S.bocaT = 90;
        cierraOrden();
        [784, 988, 1175, 1568, 1976, 2349].forEach((f, i) => bip(f, 0, 0.14, "square", 0.04, i * 0.08));
      }
    } else if (k.fase === "toma") {
      S.brinco = 6;
      if (++k.tt > 64) { k.fase = "fin"; k.tt = 0; bip(2000, 200, 0.5, "sawtooth", 0.035); }
    } else if (k.fase === "fin" && ++k.tt > 20) { S.cierre = null; S.destello = 26; finRitmo(); }
  }
  function dibujaLlave() {
    const k = S.cierre;
    if (k.fase === "llave") {
      const enPiso = k.y >= bitY() + 1, x = xBit(k.c) + 1, y = Math.round(k.y + (enPiso ? Math.sin(S.t * 0.12) * 1.5 - 2 : 0));
      // Un haz de luz marca su carril
      ctx.fillStyle = `rgba(255,225,74,${0.09 + 0.05 * Math.sin(S.t * 0.2)})`;
      ctx.fillRect(Math.round(k.c * S.LW) + 1, 9, Math.round(S.LW) - 1, piso() - 9);
      contorno(LLAVE, x, y);
      pinta(LLAVE, x, y, (S.t >> 2) % 6 === 0 ? { Y: "W" } : null);
      if (!RM && S.t % 5 === 0) S.chispas.push({ x: x + azar(0, 7), y: y + azar(0, 10), vx: 0, vy: -1.2, vida: 9, c: "#ffe14a", g: 1 });
    } else if (k.fase === "toma") {
      // BIT la levanta sobre su cabeza, entre rayos que giran
      const p = Math.min(1, k.tt / 18), x = Math.round(S.bit.x) + 2, y = Math.round(S.bit.y - 6 - p * 12);
      for (let i = 0; i < 8; i++) {
        const a = S.t * 0.07 + (i / 8) * Math.PI * 2, r1 = 11 + p * 12 + Math.sin(S.t * 0.3 + i) * 2;
        ctx.fillStyle = i % 2 ? "#ffe14a" : "#ffffff";
        for (let r = 8; r < r1; r += 2) ctx.fillRect(Math.round(x + 3 + Math.cos(a) * r), Math.round(y + 5 + Math.sin(a) * r), 1, 1);
      }
      contorno(LLAVE, x, y);
      pinta(LLAVE, x, y, (S.t >> 1) % 2 ? { Y: "W" } : null);
    } else if (k.fase === "fin") { ctx.fillStyle = `rgba(255,255,255,${Math.min(1, k.tt / 13)})`; ctx.fillRect(0, 0, S.W, S.H); }
  }
  /* Justicia entre bugs y peligros de la fábrica: un bug nunca tiene que atraparse en una casilla donde está por caer un
     pisón o que sigue ardiendo. peligroEn dice si la casilla c es peligrosa alrededor del segundo tn; despejaBugs saca de
     ahí a los bugs que ya venían (se pasan a la casilla libre más cercana). */
  function peligroEn(c, tn) {
    if (S.quemada && S.quemada.c === c && tn < S.quemada.hasta + 0.35) return true;
    return S.ataques.some((a) => a.c === c && ((a.pison && !a.cine && tn > a.t1 - 0.55 && tn < (a.t2 || a.t1) + 0.5) || (a.dj && tn > a.t1 - 0.4 && tn < a.t1 + 0.3)));
  }
  function casillaLibre(c, tn) {
    for (let d = 1; d < carriles; d++) for (const k of [c - d, c + d]) if (k >= 0 && k < carriles && !peligroEn(k, tn)) return k;
    return c;
  }
  function despejaBugs() {
    if (!((S.R.pisones && S.R.pisones.includes(S.secI)) || (FK() && S.secI === S.JEFE)) || S.lateral) return;
    for (const o of S.objs) if (!o.fuera && !o.h && !o.lat && !o.finJefe && !esTrampa(o) && o.tn - S.ts > 0.4 && peligroEn(o.c, o.tn)) { const k = casillaLibre(o.c, o.tn); if (k !== o.c) { o.c = k; o.c2 = null; o.salto = true; if (o.cf != null) o.cf = k; } }
  }
  // Lo que trae cada bicho con maña al nacer: su aviso (solo la primera vez) y sus acompañantes.
  // libre = no es una nota de la canción: si se escapa no castiga ni cuenta
  function naceBicho(o) {
    const b = BICHOS[o.tipo];
    cmd(`${b.n}.EXE`, `${b.n}.EXE`, b.aviso[0], b.aviso[1], `bicho-${b.n}`);
    if (o.tipo === "gusano") { o.seg = 0; for (let k = 1; k < 3; k++) S.objs.push({ tipo: "gusano", seg: k, libre: true, c: o.c, tn: o.tn + k * 0.21, d: o.d, s: o.s, x: o.x, y: 0 }); }
    else if (o.tipo === "gemelo") { const c2 = o.c >= 2 ? o.c - 2 : o.c + 2, g = { tipo: "gemelo", libre: true, c: c2, tn: o.tn, d: o.d, s: o.s, x: xBug(c2), y: 0, par: o }; o.par = g; S.objs.push(g); S.grietas.push({ x: xBug(c2) + 4, vida: 16 }); }
    else if (o.tipo === "polilla") { o.cf = o.c; o.dirP = o.c === 0 ? 1 : o.c === carriles - 1 ? -1 : Math.floor(o.tn * 10) % 2 ? 1 : -1; o.salto = true; }
    else if (o.tipo === "nido") o.d *= 1.35;
  }
  function pasoRitmo() {
    S.ts = tCancion() + S.R.desfase;
    // Al reintentar al jefe, se espera a que el audio brinque a su punto
    if (S.ts < S.desdeIni - 1) return;
    if (S.practica != null && S.secI === S.practica && S.ts >= S.R.sec[S.practica][1] - 0.05) { finRitmo(); return; }
    if (S.ts >= S.R.dur - 0.05) { if (S.prueba) { BB.volverAlEditor(); return; } if (S.practica != null) finRitmo(); else empiezaCierre(); return; }
    // Los créditos del arranque: la terminal inicializa la canción, se abre AUDIO.EXE al centro y luego se guarda en la esquina
    if (S.cred >= 0) {
      S.cred++;
      if (S.cred % 20 === 1 && S.cred < 80) bip(1100, 0, 0.02, "square", 0.02);
      if (S.cred === 100) { ponAudio("centro"); bip(660, 0, 0.05, "triangle", 0.035); bip(990, 0, 0.08, "triangle", 0.03, 0.05); }
      if (S.cred === 185) { ponAudio("esquina"); S.cred = -1; }
    }
    // La linterna: en la hoguera se recarga sola; lo que se dibuja persigue suave al valor real
    if (G()) { if (S.secI === 5) S.luz = Math.min(1, S.luz + 0.006); S.luzVis += ((S.fiebre > S.ts ? 1.8 : S.luz) - S.luzVis) * 0.08; }
    if (S.agachaT > 0 && --S.agachaT === 0 && S.audio) S.audio.volume = S.R.volumen;
    if (S.apach > 0) S.apach--;
    if (S.invul > 0) S.invul--;
    if (S.vidaFx > 0) S.vidaFx--;
    // Cambio de escenario
    const s = seccionDe(S.ts);
    if (s !== S.secI) {
      // Salir vivo del jefe da premio
      if (S.secI === S.JEFE && s === S.JEFE + 1) { if (G()) cmd("SELLAR LICHE.EXE", "SEAL LICH.EXE", "COMPLETO: el liche cae +1000", "DONE: the lich falls +1000"); else if (DM()) cmd("KILL DEMONIO.EXE", "KILL DEMON.EXE", "COMPLETO: demonio fuera +1000", "DONE: demon gone +1000"); else if (FK()) cmd("STOP DJ.EXE", "STOP DJ.EXE", "COMPLETO: el DJ se rinde +1000", "DONE: the DJ gives up +1000"); else cmd("KILL GATO.EXE", "KILL CAT.EXE", "COMPLETO: memoria a salvo +1000", "DONE: memory safe +1000"); S.pts += 1000; S.peligro = 0; S.textos.push({ txt: "+1000", x: S.W / 2, y: S.H * 0.5, vida: 70, max: 70, c: "#ffe14a", e: 2 }); [659, 784, 1047, 1319].forEach((f, i) => bip(f, 0, 0.1, "square", 0.04, i * 0.08)); }
      S.secI = s;
      S.cambio = (S.R.sinDestello || []).includes(s) ? 0 : 26;
      S.corteSeco = (S.R.sinDestello || []).includes(s);
      // Punto de control al entrar a cada escenario: si BIT cae, se reintenta desde aquí
      S.foto = { t: S.R.sec[s][0], pts: S.pts, maxCombo: S.maxCombo, atrapados: S.atrapados, cont: S.continues, tramos: JSON.stringify(S.tramos), campanas: S.campanas, escudo: S.escudo };
      // DOOM CROSSING: al pasar del pueblo al infierno, las campanas se cobran como armadura (hasta dos escudos)
      if (DM() && mundoDe(s) === "i" && s > 0 && mundoDe(s - 1) !== "i") {
        const n = Math.min(2 - S.escudo, Math.floor(S.campanas / CAMPANAS_ESCUDO));
        if (n > 0) { S.escudo += n; S.campanas -= n * CAMPANAS_ESCUDO; cmd("ARMADURA.EXE", "ARMOR.EXE", `COMPLETO: ${n} escudo${n > 1 ? "s" : ""} por tus campanas`, `DONE: ${n} shield${n > 1 ? "s" : ""} for your bells`); [392, 523, 784].forEach((f, i) => bip(f, 0, 0.12, "square", 0.05, i * 0.07)); }
        else if (!S.escudo) cmd("ARMADURA.EXE", "ARMOR.EXE", "ALERTA: sin campanas no hay escudo", "WARNING: no bells, no shield");
      }
      if (s === S.JEFE) { S.peligro = 0; S.jefeAviso = false; S.llenaT = S.R.sec[s][0] + 7; S.llenaAviso = false; S.llenaN = 0; }
      // En el hiperespacio BIT vuela libre; al salir, vuelve a su carril
      if (s !== S.JEFE) S.peligro = 0;
      const yaVolaba = S.vuela;
      S.vuela = s === S.VUELO;
      if (S.vuela && !yaVolaba) { S.vx = S.vy = 0; S.vueloAviso = false; S.fantasmas = []; }
      else S.bit.c = Math.max(0, Math.min(carriles - 1, Math.floor((S.bit.x + 5) / S.LW)));
      // Entrar o salir del tramo lateral: BIT arranca en la fila (o el carril) de en medio
      const eraLateral = S.lateral;
      S.lateral = S.R.lateral === s;
      S.raro = ""; S.aplastando = false; S.aplastado = false; S.quemada = null; S.calor = 0;
      if (S.lateral !== eraLateral) { S.bit.c = carriles >> 1; S.meta = null; S.metaY = null; S.fantasmas = []; }
      if (S.lateral && !eraLateral) { if (tactil) cmd("LATERAL.EXE", "SIDEWAYS.EXE", "OK: toca arriba o abajo", "OK: tap up or down"); else cmd("LATERAL.EXE", "SIDEWAYS.EXE", "OK: ahora flechas arriba y abajo", "OK: now use up and down"); }
      S.ataques = [];
      hud();
    }
    if (S.cambio > 0) S.cambio--;
    // Al empezar a volar, BIT sube solo a media altura: así se entiende que ya no hay carriles
    if (S.vuela && !S.vueloAviso) { S.vueloAviso = true; S.vy = -3.2; if (tactil) cmdRes("COMPLETO: arrastra para volar", "DONE: drag to fly"); else cmdRes("COMPLETO: vuela con las 4 flechas", "DONE: fly with all 4 arrows"); }
    // La terminal escribe cada reto: el vuelo y el jefe, unos segundos antes de que empiecen
    if (S.pistaT === 290) { if (tactil) cmd("BIT.EXE", "BIT.EXE", "OK: toca un carril o desliza", "OK: tap a lane or slide", "controles"); else cmd("BIT.EXE", "BIT.EXE", "OK: flechas o A/D, un salto por toque", "OK: arrows or A/D, one hop per tap", "controles"); }
    if (S.R.sec[S.VUELO] && S.R.sec[S.VUELO][0] - S.ts < 6.6 && S.ts < S.R.sec[S.VUELO][0]) cmd(G() ? "ALAS.EXE" : "VUELO.EXE", G() ? "WINGS.EXE" : "FLIGHT.EXE", null, null, "prevuelo");
    if (G()) {
      const en = S.ts - S.R.sec[S.secI][0];
      if (S.secI === 1 && en > 1) cmd("LINTERNA.EXE", "LANTERN.EXE", "OK: cada bug aviva tu luz", "OK: every bug feeds your light", "luz");
      if (S.secI === 2 && en > 0.6) cmd("MALDITOS.EXE", "CURSED.EXE", "ALERTA: no toques los morados", "WARNING: do not touch the purple ones", "mal");
      if (S.R.sec[S.JEFE][0] - S.ts < 5.6 && S.ts < S.R.sec[S.JEFE][0]) cmd("LICHE.EXE /despertar", "LICH.EXE /awaken", null, null, "prejefe");
      if (S.secI === S.JEFE && !S.jefeAviso) { S.jefeAviso = true; cmdRes("ALERTA: sal de la runa de fuego", "WARNING: leave the fire rune"); }
      if (S.secI === 5 && en > 0.6) cmd("HOGUERA.EXE", "BONFIRE.EXE", "OK: descansa, tu luz vuelve", "OK: rest, your light returns", "hoguera");
      if (S.secI === 6 && en > 0.6) cmd("SELLO.EXE /cerrar", "SEAL.EXE /close", "sellando el grimorio...", "sealing the grimoire...", "sello");
    } else if (FK()) {
      const en = S.ts - S.R.sec[S.secI][0];
      if (S.secI === 0 && en > 6) cmd("GROOVE.EXE", "GROOVE.EXE", tactil ? "OK: toca con el golpe y vale mas" : "OK: salta con el golpe y vale mas", tactil ? "OK: tap on the beat for more" : "OK: hop on the beat for more", "groove");
      if (S.R.sec[S.JEFE][0] - S.ts < 5.6 && S.ts < S.R.sec[S.JEFE][0]) cmd("DJ.EXE /subir volumen", "DJ.EXE /volume up", null, null, "prejefe");
      if (S.secI === S.JEFE && !S.jefeAviso) { S.jefeAviso = true; cmdRes("ALERTA: sal de los reflectores", "WARNING: leave the spotlights"); }
      if (S.secI === 9 && en > 0.6) cmd("LUNA.EXE /alunizar", "MOON.EXE /land", "OK: respira y recupera vidas", "OK: breathe and win lives back", "ladoB");
      if (S.secI === 10 && en > 0.6) cmd("CINTA.EXE /rebobinar", "TAPE.EXE /rewind", "ERROR: la cinta se traba", "ERROR: the tape keeps jamming", "casetera");
      if (S.secI === 12 && en > 0.6) cmd("CINTURON.EXE /caminar", "BELT.EXE /walk", "ALERTA: lluvia de asteroides", "WARNING: asteroid shower", "saturno");
      if (S.secI === 13 && en > 0.6) cmd("MULTIVERSO.EXE", "MULTIVERSE.EXE", "ERROR: realidad no encontrada", "ERROR: reality not found", "multiverso");
      // Al final del tramo lateral, BIT es cambiado de fila a la fuerza, cada vez más seguido
      if (S.lateral && S.teleI < S.teles.length && S.ts >= S.teles[S.teleI]) {
        S.teleI++;
        let c = S.bit.c; while (c === S.bit.c) c = (Math.random() * carriles) | 0;
        if (!RM) { S.ecos.push({ x: S.bit.x, y: S.bit.y, vida: 22, max: 22, c: "#00f6ff" }); S.ecos.push({ x: S.bit.x + 2, y: S.bit.y, vida: 16, max: 16, c: "#ff3fb4" }); for (let i = 0; i < 8; i++) S.chispas.push({ x: S.bit.x + 5, y: filaY(c) + 6, vx: azar(-2, 2), vy: azar(-2, 1), vida: 12, c: i % 2 ? "#00f6ff" : "#ffffff", g: 1 }); }
        S.bit.c = c; S.bit.y = filaY(c); S.meta = null; S.metaY = null;
        // Y la situación cambia a la siguiente rareza de la lista
        S.raro = RAROS[(S.teleI - 1) % RAROS.length];
        S.punch = 1.5;
        bip(1800, 300, 0.06, "sawtooth", 0.04); bip(300, 1800, 0.05, "square", 0.03, 0.03);
      }
      // La escena del aplastamiento: BIT se queda quieto al centro y los pisones caen en las casillas 1, 5, 2, 4 y 3. No le quita vidas
      if (S.R.aplastada) {
        const [t0, cada] = S.R.aplastada;
        S.aplastando = S.ts >= t0 - 0.7 && S.secI === seccionDe(t0);
        if (S.aplastando && !S.dichos.aplasta) { S.dichos.aplasta = 1; S.ataques = []; [0, 4, 1, 3, 2].forEach((c, i) => S.ataques.push({ tipo: "v", c, t0: t0 + i * cada - 0.6, t1: t0 + i * cada, pison: true, cine: true, queda: true, ultimo: i === 4 })); cmd("PRENSA.EXE /todas", "PRESS.EXE /all", "ERROR: BIT.EXE esta en la linea", "ERROR: BIT.EXE is on the line"); }
      }
      // Las trabas de la canción (R.trabas): un pisón avisa como siempre, pero al ir a caer se queda trabado, temblando,
      // lo que dure la traba, y azota tarde. El que se regresa antes de tiempo, lo paga
      if (S.R.trabas && S.trabaI < S.R.trabas.length && S.R.pisones) {
        const [tr, dura] = S.R.trabas[S.trabaI];
        if (S.ts >= tr - 1.1) { S.trabaI++; if (S.R.pisones.includes(S.secI) && !S.aplastando && !S.lateral && S.ts < tr - 0.4) { S.ataques.push({ tipo: "v", c: S.bit.c, t0: S.ts, t1: tr + dura, traba: tr, pison: true }); despejaBugs(); cmd("PISON.EXE", "PRESS.EXE", "ERROR: no responde...", "ERROR: not responding...", "traba"); } }
      }
      for (const a of S.ataques) if (a.traba && !a.hecho && S.ts >= a.traba && S.t % 5 === 0) bip(520, 0, 0.03, "square", 0.035);
      // La casilla quemada: solo quema estando encima, y solo cuando la barrita se llena (cerca de un segundo); junto a ella
      // no pasa nada. Al salir, la barrita baja sola
      if (S.quemada && S.ts > S.quemada.hasta) S.quemada = null;
      S.calor = S.quemada && S.quemada.c === S.bit.c ? Math.min(1, S.calor + 1 / 58) : Math.max(0, S.calor - 1 / 45);
      if (S.calor >= 1 && S.invul <= 0) {
        S.calor = 0.25;
        S.boca = "o"; S.bocaT = 45; S.dano = 26;
        if (!RM) { S.temblor = 10; S.interferencia = 8; }
        bip(700, 120, 0.25, "sawtooth", 0.07);
        S.textos.push({ txt: T("QUEMADO", "BURNED"), x: S.bit.x + 5, y: S.bit.y - 6, vida: 45, max: 45, c: "#ffe14a", e: 1 });
        castigo(true); pierdeVida();
        if (S.vidasR <= 0) { muereBit(); return; }
      }
      // Con el primer flashazo todo vuelve a la normalidad (lo que sigue cambiando es el fondo)
      if (S.raro && S.R._flashT && S.ts >= S.R._flashT[0]) S.raro = "";
      // El groove se apaga solo si se deja de bailar
      if (S.groove > 0 && S.ts - S.grooveT > 2.4) { S.groove--; S.grooveT = S.ts - 1.2; }
    } else if (DM()) {
      const en = S.ts - S.R.sec[S.secI][0];
      if (S.secI === 1 && en > 0.8) cmd("CAMPANAS.EXE", "BELLS.EXE", "OK: 12 campanas = 1 escudo", "OK: 12 bells = 1 shield", "camp");
      if (S.R.sec[S.JEFE][0] - S.ts < 5.6 && S.ts < S.R.sec[S.JEFE][0]) cmd("DEMONIO.EXE /invocar", "DEMON.EXE /summon", null, null, "prejefe");
      if (S.secI === S.JEFE && !S.jefeAviso) { S.jefeAviso = true; cmdRes("ALERTA: sal de la columna de fuego", "WARNING: leave the fire column"); }
      if (S.secI === 3 && en > 0.6) cmd("PORTAL.EXE /bucle", "PORTAL.EXE /loop", "ALERTA: los mundos se turnan", "WARNING: the worlds take turns", "vaiven");
      if (S.secI === 8 && en > 0.6) cmd("MUNDOS.EXE /juntar", "WORLDS.EXE /merge", "ALERTA: los dos a la vez", "WARNING: both at once", "dos");
    } else if (UIA()) {
      if (S.ts > S.R.error + 0.4 && S.secI === 0) cmd("GATO.EXE", "CAT.EXE", "ERROR: proceso no autorizado", "ERROR: unauthorized process", "error");
      if (S.R.sec[S.JEFE][0] - S.ts < 5.6 && S.ts < S.R.sec[S.JEFE][0]) cmd("GATO.EXE /llenar memoria", "CAT.EXE /fill memory", null, null, "prejefe");
      if (S.secI === S.JEFE && !S.jefeAviso) { S.jefeAviso = true; cmdRes("ALERTA: que no caiga ni uno", "WARNING: do not drop any"); }
      // GATO.EXE no espera a que fallen: cada tanto teclea un comando y llena la memoria de golpe. Nunca la llena del todo
      // (eso solo pasa si además se caen bugs), pero obliga a bajarla atrapando seguido
      if (S.secI === S.JEFE && S.ts < S.R.sec[S.JEFE][1] - 4) {
        if (!S.llenaAviso && S.ts > S.llenaT - 1.7) { S.llenaAviso = true; const c = [["GATO.EXE /malloc 64MB", "CAT.EXE /malloc 64MB"], ["GATO.EXE /copiar *.*", "CAT.EXE /copy *.*"], ["GATO.EXE /abrir 99 ventanas", "CAT.EXE /open 99 windows"], ["GATO.EXE /fork", "CAT.EXE /fork"]][S.llenaN % 4]; cmd(c[0], c[1], null, null); }
        if (S.ts > S.llenaT) {
          const sube = Math.max(2, S.JEFE_TOPE * 0.34);
          S.peligro = Math.max(S.peligro, Math.min(S.JEFE_TOPE - 2, S.peligro + sube));
          cmdRes(`ALERTA: memoria +${Math.round((sube / S.JEFE_TOPE) * 100)}%, bajala`, `WARNING: memory +${Math.round((sube / S.JEFE_TOPE) * 100)}%, bring it down`);
          if (!RM) { S.temblor = 12; S.interferencia = 10; }
          S.punch = 2;
          bip(220, 880, 0.25, "sawtooth", 0.06); bip(110, 55, 0.3, "square", 0.05, 0.05);
          S.llenaN++; S.llenaAviso = false;
          S.llenaT = S.ts + 5.2 + h2(S.llenaN * 3.7) * 3.4;
        }
      }
      if (S.secI === 9 && BB.limpieza() >= 1) cmd("SCAN GATO.EXE", "SCAN CAT.EXE", "COMPLETO: virus eliminado", "DONE: virus removed", "limpio");
      if (S.secI === 9 && S.ts > S.R.sec[9][0] + 1.2) cmd("ANTIVIRUS.EXE /limpiar", "ANTIVIRUS.EXE /clean", "limpiando GATO.EXE...", "cleaning CAT.EXE...", "limpia");
    }
    pasoVentanas();
    pasoOrden();
    if (S.pistaT > 0) S.pistaT--;
    S.vu += ((0.25 + S.energiaAhora * 0.75) * (0.55 + 0.45 * S.pulso) - S.vu) * 0.3;
    S.peligroVis += (S.peligro - S.peligroVis) * 0.2;
    // La cámara: late en las partes fuertes, crece en las subidas y sigue al gato en las tranquilas
    const fuerte = (S.R.fuerte || [1, S.JEFE, 7]).includes(S.secI), sube = (S.R.sube || [3, 6]).includes(S.secI), calma = (S.R.tranquila || [2, 5, 8]).includes(S.secI);
    const kSec = Math.min(1, Math.max(0, (S.ts - S.R.sec[S.secI][0]) / (S.R.sec[S.secI][1] - S.R.sec[S.secI][0])));
    // En los estribillos el acercamiento es claro y late; en las subidas crece poco a poco; en la calma apenas se nota
    // En la calma, cada tanto la cámara se va con el gato y se le acerca un rato; el recuadro de BIT no se mueve, así que nunca lo tapa
    const visita = ((S.ts + 3) % 12) / 12, cerca = visita > 0.3 && visita < 0.72;
    const zObj = RM ? 1 : fuerte ? 1.06 + S.pulso * 0.055 : sube ? 1.015 + kSec * 0.06 + S.pulso * 0.02 : calma ? (cerca ? 1.2 : 1.05) : 1;
    // Tensión de la terminal: tras el error crítico, con el jefe (más cuanto más llena la memoria) y en la lluvia de código
    S.tension = RM ? 0 : !UIA() ? (S.secI === S.JEFE ? 0.3 : DM() && mundoDe(S.secI) === "x" ? 0.2 : 0) : S.secI === 0 && S.ts >= S.R.error ? 0.75 : S.secI === S.JEFE ? 0.28 + (S.peligro / S.JEFE_TOPE) * 0.72 : S.secI === 6 ? 0.22 + kSec * 0.33 : 0;
    // En los tramos que entran de golpe (R.sinDestello) la cámara no se acomoda poco a poco: brinca a su lugar
    if (S.corteSeco) { S.zoom = zObj; S.corteSeco = false; }
    S.zoom += (zObj - S.zoom) * (fuerte ? 0.22 : sube ? 0.2 : 0.025);
    S.focoX += ((calma ? S.gatoX : S.gx + S.W / 2) - S.focoX) * 0.04;
    S.focoY += ((calma ? S.gatoY : S.gy + S.H / 2) - S.focoY) * 0.04;
    // El escenario late con cada bombo
    S.pulso *= 0.88;
    while (S.rG < S.R.golpes.length && S.R.golpes[S.rG] <= S.ts * 100) { S.rG++; S.golpeN++; S.pulso = 1; S.anillos.push(S.ts); if (S.anillos.length > 4) S.anillos.shift(); programaAtaque(); }
    // El gato gira según la energía de la canción: de un cuarto de vuelta por segundo a casi tres
    S.energiaAhora = energia(S.ts);
    S.vGiro += (0.22 + S.energiaAhora * S.energiaAhora * 2.7 - S.vGiro) * 0.07;
    S.giro += S.vGiro / 60 + S.pulso * 0.003;
    BB.moverBit();
    BB.pasoGato();
    // Cada bug sale con el tiempo justo para llegar a BIT en su nota
    const N = S.R.notas;
    while (S.rI * 3 < N.length) {
      if (!S.activa[S.rI]) { S.rI++; continue; }
      const tn = N[S.rI * 3] / 1000, sec = seccionDe(tn), cruza = sec === S.VUELO, lat = S.R.lateral === sec;
      // En el vuelo los bugs no caen: cruzan el recuadro de lado, más despacio al principio para dar tiempo de agarrarle
      const cr = cruza ? (tn < S.R.sec[S.VUELO][0] + 6.5 ? CRUCE_LENTO : CRUCE) * S.D.vel : 0, d = cruza ? cr * 0.56 : S.R.sec[sec][2] * S.D.vel;
      if (tn - d > S.ts) break;
      const c = mapa.c[S.rI], enFiebre = S.fiebre > S.ts, tipo = enFiebre ? "bono" : S.tipoRun[S.rI];
      const o = { tipo, c, tn, d, s: sec, x: xBug(c), y: 0 };
      // Entran por la derecha; después del silencio a media sección, por la izquierda
      if (enFiebre) o.nota = true;
      if (cruza) { o.h = (!UIA() ? Math.floor((tn - S.R.sec[S.VUELO][0]) / 12) % 2 === 0 : tn < S.R.sec[S.VUELO][0] + 16.8) ? 1 : -1; o.cr = cr; o.x = o.h > 0 ? S.W + 2 : -BW - 2; if (S.R.vueloVertical) { o.v = true; o.y = -BH - 2; } }
      if (S.rI === S.ultimoJefe && !cruza) o.finJefe = true;
      // El glitch cambia de carril a media caída
      if (tipo === "glitch") o.c2 = c === 0 ? 1 : c === carriles - 1 ? c - 1 : c + (S.rI % 2 ? 1 : -1);
      // En la fábrica, si su casilla es peligrosa para cuando llegue, nace en la libre más cercana
      if (((S.R.pisones && S.R.pisones.includes(sec)) || (FK() && sec === S.JEFE)) && !lat && !cruza && !o.finJefe && !esTrampa(o) && peligroEn(o.c, tn)) { o.c = casillaLibre(o.c, tn); o.x = xBug(o.c); o.c2 = null; }
      S.objs.push(o);
      if (BICHOS[tipo]) naceBicho(o);
      // En el tramo lateral llegan de lado, por la fila que les toca
      if (lat) { o.lat = true; o.x = S.W + 2; o.y = filaY(c); for (const b of S.objs) if (b.tn >= tn && b.s === sec && !b.lat) { b.lat = true; b.x = S.W + 2; b.y = filaY(b.c); } }
      if (!cruza && !lat) S.grietas.push({ x: xBug(c) + 4, vida: 16 });
      S.rI++;
    }
    // Fiebre: lluvia de bugs dorados de premio cerca de BIT. No cuentan como fallo si se escapan
    if (S.fiebre > S.ts && S.t % (S.vuela ? 6 : 9) === 0) {
      const c = Math.max(0, Math.min(carriles - 1, S.bit.c + Math.round(azar(-2.4, 2.4)))), d = S.vuela ? CRUCE * 0.56 : 0.8;
      const o = { tipo: "bono", c, tn: S.ts + d, d, s: S.secI, x: xBug(c), y: 0 };
      if (S.lateral) { o.lat = true; o.x = S.W + 2; o.y = filaY(c); }
      if (S.vuela) { o.h = 1; o.cr = CRUCE; o.x = S.W + 2; if (S.R.vueloVertical) { o.v = true; o.y = -BH - 2; } }
      S.objs.push(o);
    }
    const by = bitY(), y0 = 2, yT = by - 5;
    // Cuando la cinta se traba (R.caseteTramo), los bugs que aún vienen lejos brincan un cuadro: en una traba hacia atrás
    // y en la siguiente hacia delante. Solo es lo que se ve: llegan a su hora de siempre, y a los que ya están por caer
    // (menos de medio segundo) no los toca
    let brinco = 0;
    if (!RM && S.R.caseteTramo === S.secI && S.R.casete) { const K = BB.cintaEn(S.ts - S.R.sec[S.secI][0]); if (K.traba) brinco = (K.n % 2 ? 0.09 : -0.09) * ((S.t >> 2) % 3 ? 1 : 0.6); }
    for (const o of S.objs) {
      const av0 = 1 - (o.tn - S.ts) / o.d, avance = brinco && o.tn - S.ts > 0.5 && av0 + brinco < 0.68 ? Math.max(0, av0 + brinco) : av0;
      if (o.c2 != null && !o.salto && avance > 0.52) { o.salto = true; o.c = o.c2; if (!RM) for (let i = 0; i < 6; i++) S.chispas.push({ x: o.x + 5, y: o.y + 4, vx: azar(-1.5, 1.5), vy: azar(-1, 1), vida: 10, c: "#00f6ff", g: 1 }); }
      if (o.v) {
        // En el vuelo hacia arriba (R.vueloVertical) caen desde lo alto y pasan por media altura justo en su nota
        o.y = piso() / 2 - BH / 2 - ((o.tn - S.ts) / o.cr) * piso();
        o.x = 6 + o.c * ((S.W - 12 - BW) / (carriles - 1)) + Math.sin(S.ts * 4 + o.tn * 3) * 3;
      } else if (o.h) {
        // Cruza de lado y pasa por el centro justo en su nota, ondulando un poco
        o.x = S.W / 2 - BW / 2 + ((o.h * (o.tn - S.ts)) / o.cr) * S.W;
        o.y = 15 + o.c * ((by - 15) / (carriles - 1)) + Math.sin(S.ts * 4 + o.tn * 3) * 3;
      } else {
        // La polilla cambia de carril con cada golpe y llega a su carril de verdad en el último
        if (o.tipo === "polilla") o.c = o.cf + (Math.max(0, Math.floor((o.tn - S.ts) / (60 / S.R.sec[o.s][3]))) % 2 ? o.dirP : 0);
        if (o.lat) {
          // De lado: viajan de la derecha hasta BIT; cambiar de carril es cambiar de fila
          const xx = o.cuelga ? 27 + Math.sin(S.ts * 22) : 26 + (S.W + 2 - 26) * (1 - avance);
          o.x = o.suave ? o.x + (xx - o.x) * 0.3 : xx;
          o.y += (filaY(o.c) - o.y) * (o.salto ? 0.5 : 1);
          o.latListo = true;
        } else
        o.x += (xBug(o.c) - o.x) * (o.salto ? 0.5 : 1);
        // El gemelo que espera se queda flotando a la altura de BIT; los que rebotan (acorazado, crías) se mueven suave
        const yy = o.cuelga ? yT - 3 + Math.sin(S.ts * 22) : y0 + (yT - y0) * avance;
        if (!o.lat) o.y = o.suave ? o.y + (yy - o.y) * 0.3 : yy;
      }
      // Se acabó la espera del gemelo: se va sin castigo
      if (o.cuelga && S.ts > o.cuelga) { o.fuera = true; S.textos.push({ txt: T("SE FUE", "GONE"), x: o.x + 5, y: o.y, vida: 34, max: 34, c: "#8f93a8", e: 1 }); continue; }
      // Con la ayuda del reloj, BIT alcanza también los carriles de al lado (las trampas no: esas hay que tocarlas a propósito)
      const alcance = S.iman > S.ts && !esTrampa(o) ? 1 : 0;
      const toca = !(o.noAntes > S.ts) && (S.vuela || o.h
        ? o.x < S.bit.x + 11 && o.x + BW > S.bit.x - 1 && o.y < S.bit.y + 12 && o.y + BH > S.bit.y - 1
        : o.lat ? S.lateral && o.x <= 27 && o.x + BW >= 13 && Math.abs(o.c - S.bit.c) <= alcance
        : o.y + BH >= by + 1 && o.y <= by + 9 && Math.abs(o.c - S.bit.c) <= alcance);
      if (toca && esTrampa(o)) {
        // El maldito y el troyano tramposo no se atrapan: tocarlos castiga
        o.fuera = true;
        S.tramos[o.s][1]++;
        maldito(o, o.tipo === "troya" ? T("TROYANO", "TROJAN") : null);
        if (S.vidasR <= 0) { muereBit(); return; }
      } else if (toca && o.tipo === "acorazado" && !o.golpe) {
        // Primer toque al acorazado: pierde el casco, rebota y vuelve a caer en el carril de al lado
        o.golpe = 1; o.suave = true; o.salto = true;
        o.c += o.c < 2 ? 1 : o.c > 2 ? -1 : Math.floor(o.tn * 10) % 2 ? 1 : -1;
        o.tn = S.ts + 0.66; o.d = 1.2; o.noAntes = S.ts + 0.34;
        S.pts += 5; S.aplasta = 5; S.punch = Math.min(2, S.punch + 0.6);
        bip(1500, 700, 0.08, "square", 0.05); bip(2100, 0, 0.04, "triangle", 0.04, 0.03);
        S.textos.push({ txt: "CLANK", x: o.x + 5, y: o.y, vida: 34, max: 34, c: "#c9c6b8", e: 1 });
        if (!RM) for (let i = 0; i < 8; i++) S.chispas.push({ x: o.x + 5, y: o.y + 2, vx: azar(-2, 2), vy: azar(-2.6, -0.6), vida: 14, c: "#c9c6b8", g: 1 });
        hud();
      } else if (toca) {
        o.fuera = true;
        if (o.finJefe) lapsoYa();
        const antes = nivelCombo();
        S.combo++;
        S.tAcierto = S.ts;
        if ((o.tipo !== "bono" || o.nota) && !o.libre && !o.cria) { S.atrapados++; S.tramos[o.s][0]++; S.tramos[o.s][1]++; }
        if (G()) S.luz = Math.min(1, S.luz + 0.07);
        // En el pueblo cada bug da una campana (el dorado, tres)
        if (DM() && mundoDe(o.s) !== "i" && !o.libre) S.campanas += o.tipo === "oro" ? 3 : 1;
        if (!o.h) S.celdas[o.c] = 9;
        if (S.pistaT > 40 && ++S.atrapadosPista >= 3) S.pistaT = 40;
        if (S.combo > S.maxCombo) S.maxCombo = S.combo;
        const nv = nivelCombo(), tono = TONOS_COMBO[Math.min(nv, TONOS_COMBO.length - 1)];
        // Los de premio valen cada vez más mientras dure la fiebre
        // Gusano: 10, 15 y el tercero 45 · troyano de verdad: 100 · gemelos: doble si se alcanzan los dos
        const pareja = o.tipo === "gemelo" && o.par && o.par.cogido;
        const base = o.tipo === "bono" ? Math.min(60, 15 + S.fiebreN * 3) : o.tipo === "oro" ? 50 : o.tipo === "arco" ? 100 : o.tipo === "anti" ? 30 : o.tipo === "glitch" ? 25
          : o.tipo === "gusano" ? [10, 15, 45][o.seg || 0] : o.tipo === "troyaOk" ? 100 : pareja ? 80 : BICHOS[o.tipo] ? BICHOS[o.tipo].pts : 10;
        // Los de premio no se multiplican por el combo, solo por la fiebre: si no, los puntos se disparan
        const n = Math.round(base * (o.tipo === "bono" ? 2 : multi()) * (FK() ? 1 + S.groove / GROOVE_MAX : 1));
        S.pts += n;
        if (S.fiebre > S.ts) { S.fiebreTotal += n; if (o.tipo === "bono") S.fiebreN++; }
        BB.atrapa(o, o.tipo === "oro" || o.tipo === "bono" ? "#ffe14a" : o.tipo === "arco" ? SANDE[S.t % SANDE.length] : o.tipo === "anti" ? "#41B883" : tono, o.tipo === "bug" ? 1 : 2);
        S.textos.push({ txt: `+${n}`, x: o.x + 5, y: o.y, vida: 38, max: 38, c: o.tipo === "bug" ? tono : "#ffe14a", e: o.tipo === "bug" ? 1 : 1.5 });
        // Cada bug suena un poco más agudo que el anterior: la escala sube con el combo y vuelve a empezar al fallar
        if (o.tipo === "bono") bip(660 * Math.pow(2, Math.min(S.fiebreN, 26) / 12), 0, 0.06, "square", 0.03);
        else bip(523.25 * Math.pow(2, [0, 2, 4, 7, 9][S.combo % 5] / 12 + Math.min(2, Math.floor(S.combo / 10))), 0, 0.07, "triangle", 0.045);
        if (o.tipo === "oro") bip(880, 1760, 0.12, "square", 0.03);
        if (o.tipo === "arco") {
          S.fiebre = S.ts + 7;
          S.fiebreN = 0; S.fiebreTotal = 0;
          // Mientras dure, TODO lo que cae es de premio: los que ya venían se convierten, no hay rayos y fallar no castiga
          for (const b of S.objs) if (b !== o && b.tipo !== "bono") { b.nota = !b.libre && !b.cria; b.tipo = "bono"; b.c2 = null; b.cuelga = 0; }
          if (!S.vuela) S.ataques = [];
          if (G()) cmd("RUNA.EXE", "RUNE.EXE", "COMPLETO: luz total, todo vale x2", "DONE: full light, everything counts x2"); else cmd("FIEBRE.EXE", "FEVER.EXE", "COMPLETO: todo vale x2", "DONE: everything counts x2");
          S.punch = 2;
          [659, 880, 1109, 1319, 1760].forEach((f, i) => bip(f, 0, 0.09, "square", 0.035, i * 0.05));
        } else if (o.tipo === "gemelo") {
          o.cogido = true;
          const g = o.par;
          if (pareja) { S.textos.push({ txt: T("¡PAREJA!", "PAIR!"), x: o.x + 5, y: o.y - 8, vida: 44, max: 44, c: "#38BDF8", e: 1.5 }); [784, 1175].forEach((f, i) => bip(f, 0, 0.09, "square", 0.04, i * 0.06)); }
          else if (g && !g.fuera) {
            // El otro espera un momento. Si se atrapó primero al acompañante, la nota ya cuenta como atrapada
            g.cuelga = S.ts + 0.55;
            if (o.libre) { g.libre = true; S.atrapados++; S.tramos[g.s][0]++; S.tramos[g.s][1]++; }
          }
        } else if (o.tipo === "bomba") {
          // Estalla: todo lo que haya en pantalla cuenta como atrapado (las trampas simplemente desaparecen)
          let n2 = 0;
          for (const b of S.objs) {
            if (b === o || b.fuera) continue;
            b.fuera = true;
            if (!esTrampa(b) && !b.libre && !b.cria && (b.tipo !== "bono" || b.nota)) { S.atrapados++; S.tramos[b.s][0]++; S.tramos[b.s][1]++; S.pts += 10; n2++; }
            else if (esTrampa(b)) { S.atrapados++; S.tramos[b.s][0]++; S.tramos[b.s][1]++; }
            if (!RM) for (let i = 0; i < 6; i++) S.chispas.push({ x: b.x + 5, y: b.y + 4, vx: azar(-2.5, 2.5), vy: azar(-2.5, 1), vida: 16, c: i % 2 ? "#ffe14a" : "#F28C28", g: 2 });
          }
          S.textos.push({ txt: n2 ? `BOOM +${n2 * 10}` : "BOOM", x: S.W / 2, y: S.H * 0.45, vida: 55, max: 55, c: "#F28C28", e: 2 });
          if (!RM) { S.temblor = 10; S.cambio = 12; }
          S.punch = 2;
          bip(160, 40, 0.4, "sawtooth", 0.09); bip(90, 30, 0.45, "square", 0.07, 0.02);
        } else if (o.tipo === "reloj") {
          S.iman = S.ts + 5;
          [988, 1319, 1976].forEach((f, i) => bip(f, 0, 0.09, "triangle", 0.045, i * 0.06));
        } else if (o.tipo === "anti") {
          S.peligro = Math.max(0, S.peligro - 2);
          cmd("ANTIVIRUS.EXE", "ANTIVIRUS.EXE", "COMPLETO: memoria liberada", "DONE: memory freed");
        } else if (nv > antes) {
          // Nivel de combo nuevo: el grito cae sobre BIT, con fanfarria y un golpe de cámara más fuerte
          grita(nv);
          S.punch = 2;
          [0, 4, 7, 12].forEach((st, i) => bip(523.25 * Math.pow(2, (st + nv) / 12), 0, 0.08, "square", 0.035, i * 0.045));
          if (!RM) for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; S.chispas.push({ x: S.bit.x + 5, y: S.bit.y + 4, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3 - 0.5, vida: 20, c: i % 2 ? tono : "#ffffff", g: 2 }); }
        }
        S.boca = "s"; S.bocaT = 24;
        // La epidemia de terminales: desde los 3 seguidos ya se nota, y crece rápido hasta el bum, bum, bum.
        // Con medida: 4 a 14 seguidos, una cada tres bugs · 15 a 39, una cada dos · 40 a 79, casi una por bug · 80 o más, una por bug
        S.ultN = n;
        const cuantas = S.combo < 4 ? 0 : S.combo < 15 ? (S.combo % 3 === 0 ? 1 : 0) : S.combo < 40 ? (S.combo % 2 === 0 ? 1 : 0) : S.combo < 80 ? (Math.random() < 0.7 ? 1 : 0) : 1;
        if (nv > antes) pideVentanas(1, "nivel");
        else if (o.tipo !== "bug" && o.tipo !== "bono") pideVentanas(1, "especial", o.tipo);
        else if (o.tipo === "bono") pideVentanas(Math.max(1, cuantas), "pts", n);
        else if (cuantas) pideVentanas(cuantas, Math.random() < 0.6 ? "combo" : "pts", n);
        // Cada tantos seguidos, BIT recupera una vida
        if (S.combo % S.D.regen === 0 && S.vidasR < S.D.vidas) { S.vidasR++; S.vidaFx = 40; S.textos.push({ txt: T("+1 VIDA", "+1 LIFE"), x: S.W / 2, y: S.H * 0.4, vida: 60, max: 60, c: "#41B883", e: 1 }); [784, 1047, 1319].forEach((f, i) => bip(f, 0, 0.1, "triangle", 0.05, i * 0.07)); }
        if (S.secI === S.JEFE) S.peligro = Math.max(0, S.peligro - JEFE_BAJA);
        hud();
      } else if (o.h ? S.ts - o.tn > o.cr * 0.56 : o.lat ? o.x < 9 : o.y + BH >= piso()) {
        o.fuera = true;
        // En vuelo libre (sin terminal) los que se escapan no castigan: ni vida, ni racha, ni cuentan como fallo
        if (S.modoLibre) continue;
        if (o.tipo === "bono" || o.libre) continue;
        // El reloj es de ayuda: si se escapa no pasa nada
        if (o.tipo === "reloj") { S.atrapados++; S.tramos[o.s][0]++; S.tramos[o.s][1]++; continue; }
        // El nido revienta en el piso: tres crías rebotan hacia arriba y vuelven a caer regadas
        if (o.tipo === "nido") {
          [-1, 0, 1].forEach((dc, k) => S.objs.push({ tipo: "cria", cria: true, suave: true, c: Math.max(0, Math.min(carriles - 1, o.c + dc)), tn: S.ts + 1.05 + k * 0.3, d: 1.5, s: o.s, x: o.x, y: o.y, lat: o.lat }));
          bip(300, 900, 0.15, "square", 0.05);
          if (!RM) for (let i = 0; i < 10; i++) S.chispas.push({ x: o.x + 5, y: o.y + 6, vx: azar(-2.2, 2.2), vy: azar(-3, -1), vida: 16, c: "#ECEBE4", g: 1 });
        }
        if (o.cria) { falla(o); if (S.vidasR <= 0) { muereBit(); return; } continue; }
        // Dejar pasar al maldito o al troyano tramposo es lo correcto: cuenta como atrapado
        if (esTrampa(o)) { S.atrapados++; S.tramos[o.s][0]++; S.tramos[o.s][1]++; S.pts += 5; bip(330, 0, 0.04, "triangle", 0.025); continue; }
        S.tramos[o.s][1]++;
        falla(o);
        if (S.peligro >= S.JEFE_TOPE || S.vidasR <= 0) { muereBit(); return; }
      }
    }
    S.objs = S.objs.filter((o) => !o.fuera);
    // Los rayos del gato caen justo en el bombo que avisaron
    for (const a of S.ataques) {
      // El segundo golpe del triple: el mismo pisón vuelve a azotar
      if (a.hecho && a.t2 && !a.hecho2 && S.ts >= a.t2) { a.hecho2 = true; a.t1 = a.t2; }
      else if (a.hecho || S.ts < a.t1) continue;
      a.hecho = true;
      if (a.pison) {
        // El pisón azota el piso: un golpe grave con su eco metálico, la pantalla brinca hacia abajo, se levanta polvo a
        // los lados y saltan chispas. En la fábrica en llamas, la casilla se queda ardiendo un rato
        bip(74, 30, 0.32, "sine", 0.13); bip(170, 55, 0.14, "square", 0.075); bip(2300, 900, 0.05, "square", 0.03); bip(140, 0, 0.05, "square", 0.04, 0.1); bip(110, 0, 0.04, "square", 0.025, 0.17);
        if (!RM) {
          S.golpeY = 9; S.temblor = Math.max(S.temblor, 5);
          const x0 = a.c * S.LW;
          for (let i = 0; i < 10; i++) S.chispas.push({ x: x0 + azar(2, S.LW - 2), y: piso() - 1, vx: azar(-2.4, 2.4), vy: azar(-3, -0.8), vida: 14, c: i % 2 ? "#ffe14a" : "#ffffff", g: 1 });
          for (let i = 0; i < 8; i++) { const lado = i % 2 ? 1 : -1; S.chispas.push({ x: x0 + (lado > 0 ? S.LW : 0), y: piso() - 2, vx: lado * azar(0.6, 2.2), vy: azar(-1.1, -0.2), vida: 16, c: "#8f93a8", g: 2 }); }
        }
        S.punch = 2;
        if (!a.cine && S.R.pisones && S.secI === S.R.pisones[1]) { S.quemada = { c: a.c, hasta: S.ts + 2.8 }; despejaBugs(); }
        if (a.cine) { if (a.ultimo) { S.aplastado = true; S.boca = "o"; S.bocaT = 200; } continue; }
      } else
      bip(1400, 200, 0.12, "sawtooth", 0.04);
      const da = a.tipo === "v" ? S.bit.c === a.c && !S.vuela : a.tipo === "x" ? Math.abs(S.bit.x + 5 - a.x) < 7.5 : Math.abs(S.bit.y + 6 - a.y) < 6.5;
      if (da && S.invul <= 0) { golpeado(); if (S.vidasR <= 0) { muereBit(); return; } }
    }
    S.ataques = S.ataques.filter((a) => a.queda || S.ts < a.t1 + (a.pison ? 0.3 : 0.24));
    // Se acaba la fiebre: la cuenta de lo ganado
    if (S.fiebre && S.ts > S.fiebre) {
      S.fiebre = 0;
      cmd(G() ? "RUNA.EXE /fin" : "FIEBRE.EXE /fin", G() ? "RUNE.EXE /end" : "FEVER.EXE /end", `COMPLETO: +${S.fiebreTotal} puntos`, `DONE: +${S.fiebreTotal} points`);
      [784, 988, 1175, 1568].forEach((f, i) => bip(f, 0, 0.1, "square", 0.035, i * 0.07));
      hud();
    }
  }
  // DJ.EXE improvisa con sus reflectores: va rotando seis figuras, y cada una avisa dos tiempos antes de pegar.
  // foco (donde esté BIT) · tijera (de las orillas al centro) · barrido (de un lado al otro) · ecualizador (todo menos un
  // carril) · estrobo (unos carriles y luego los otros) · abanico (del centro hacia fuera)
  const DJ_FIGS = ["foco", "tijera", "barrido", "ecualizador", "estrobo", "abanico"];
  function ataqueDJ(t1) {
    const fin = Math.min(S.R.sec[S.JEFE][1] - 1, (S.R._tUlt || 9e9) - 0.7);
    if (S.R._chT != null || S.ts < S.R.sec[S.JEFE][0] + 2 || S.ts < S.djLibre) return;
    const tiempo = 60 / (S.R.sec[S.JEFE][3] || 120), T = t1 + tiempo, n = carriles, b = S.bit.c, m = n >> 1;
    let fig = DJ_FIGS[S.djN % DJ_FIGS.length], g = [];
    if (fig === "tijera") { g = [[0, 0], [n - 1, 0], [1, tiempo], [n - 2, tiempo]]; cmd("TIJERA.EXE", "SCISSORS.EXE", "ALERTA: quedate en el centro", "WARNING: stay in the middle", "djTijera"); }
    else if (fig === "barrido") { const paso = S.dif === "dificil" ? tiempo / 2 : tiempo, d = b < m ? 1 : -1; for (let i = 0; i < n; i++) g.push([d > 0 ? i : n - 1 - i, i * paso]); cmd("BARRIDO.EXE", "SWEEP.EXE", "ALERTA: brinca a donde ya pego", "WARNING: hop to where it already hit", "djBarrido"); }
    else if (fig === "ecualizador") { const libre = b + (b === 0 ? 1 : b === n - 1 ? -1 : S.djN % 2 ? 1 : -1); for (let c = 0; c < n; c++) if (c !== libre) g.push([c, 0]); cmd("ECUALIZADOR.EXE", "EQUALIZER.EXE", "ALERTA: solo un carril queda libre", "WARNING: only one lane stays free", "djEcual"); }
    else if (fig === "estrobo") { for (let c = 0; c < n; c++) g.push([c, c % 2 === b % 2 ? 0 : tiempo]); cmd("ESTROBO.EXE", "STROBE.EXE", "ALERTA: cambia de carril con el golpe", "WARNING: switch lanes on the beat", "djEstrobo"); }
    else if (fig === "abanico") { g = [[m, 0], [m - 1, tiempo], [m + 1, tiempo]]; cmd("ABANICO.EXE", "FAN.EXE", "ALERTA: vete a las orillas", "WARNING: go to the edges", "djAbanico"); }
    // Si la figura ya no cabe antes del final, cierra con un foco
    if (!g.length || T + Math.max(...g.map((x) => x[1])) > fin) { fig = "foco"; g = [[b, 0]]; }
    const ult = T + Math.max(...g.map((x) => x[1]));
    if (ult > fin) return;
    for (const [c, dt] of g) S.ataques.push({ tipo: "v", c, t0: S.ts, t1: T + dt, dj: true });
    S.djN++; S.djLibre = ult - 0.12;
    bip(660, 990, 0.07, "square", 0.03);
    despejaBugs();
  }
  // Con cada bombo el gato puede apuntar un rayo: avisa ahora y cae con el bombo siguiente
  function programaAtaque() {
    // Con fiebre el jefe deja de disparar; en el vuelo no: ahí los rayos siguen igual
    if (S.rG >= S.R.golpes.length || (S.fiebre > S.ts && !S.vuela)) return;
    const t1 = S.R.golpes[S.rG] / 100;
    if (t1 - S.ts < 0.3 || t1 - S.ts > 0.9) return;
    if (S.secI === S.JEFE && FK()) ataqueDJ(t1);
    else if (S.secI === S.JEFE && S.ts > S.R.sec[S.JEFE][0] + 4.5 && S.golpeN % (UIA() ? 4 : 3) === 0) {
      // Con el jefe apunta al carril de BIT, salvo que ahí vaya a caer un bug en ese mismo instante
      const c = S.bit.c;
      if (S.objs.some((o) => (o.c === c || o.c2 === c) && Math.abs(o.tn - t1) < 0.3)) return;
      S.ataques.push({ tipo: "v", c, t0: S.ts, t1 });
      if (UIA()) cmd("RAYO.EXE", "BOLT.EXE", "ALERTA: sal de la franja rosa", "WARNING: leave the pink strip", "rayos");
    } else if (S.R.pisones && S.R.pisones.includes(S.secI) && !S.aplastando && !S.lateral && S.ts > S.R.sec[S.secI][0] + 2.5 && (!S.R.aplastada || S.ts < S.R.aplastada[0] - 2.2 || S.ts > S.R.aplastada[0] + 4) && !S.ataques.some((a) => a.traba && !a.hecho) && !(S.R.trabas || []).some((x) => Math.abs(x[0] - S.ts) < 1.6) && S.golpeN % Math.max(2, (S.dif === "facil" ? 6 : S.dif === "medio" ? 4 : 3) - (S.secI === S.R.pisones[0] ? 0 : 1)) === 0) {
      // Los pisones de la fábrica: avisan con franjas amarillas en la casilla de BIT y caen dos tiempos después.
      // En el segundo tramo de fábrica caen de dos en dos
      const t2 = S.rG + 1 < S.R.golpes.length && S.R.golpes[S.rG + 1] / 100 - S.ts < 1.5 ? S.R.golpes[S.rG + 1] / 100 : t1, c = S.bit.c;
      // Los bugs que iban a caer en esa casilla durante el golpe se hacen a un lado (despejaBugs); los que caen antes
      // se atrapan y da tiempo de salir
      // El triple (R.combo = [cada cuántos pisones, segundos entre golpe y golpe]): el pisón pega, vuelve a pegar al instante
      // en la misma casilla y, enseguida, cae otro en la de la izquierda o la de la derecha
      const triple = S.R.combo && ++S.pisonN % S.R.combo[0] === 0, dt = S.R.combo ? S.R.combo[1] : 0.25;
      if (triple) {
        const lado = c === 0 ? 1 : c === carriles - 1 ? -1 : Math.random() < 0.5 ? -1 : 1;
        S.ataques.push({ tipo: "v", c, t0: S.ts, t1: t2, t2: t2 + dt, pison: true });
        S.ataques.push({ tipo: "v", c: c + lado, t0: t2, t1: t2 + dt * 2, pison: true });
      } else {
        S.ataques.push({ tipo: "v", c, t0: S.ts, t1: t2, pison: true });
        if (S.secI !== S.R.pisones[0] && S.golpeN % 2 === 0) { const c2 = c + (c < carriles - 1 && (c === 0 || S.golpeN % 4 === 0) ? 1 : -1); S.ataques.push({ tipo: "v", c: c2, t0: S.ts, t1: t2, pison: true }); }
      }
      despejaBugs();
      cmd("PISON.EXE", "PRESS.EXE", "ALERTA: sal de la casilla amarilla", "WARNING: leave the yellow cell", "pisones");
    } else if (S.vuela && S.energiaAhora > 0.4 && S.ts > S.R.sec[S.VUELO][0] + 5 && !chispazo() && (!S.R.chispas || S.ts > S.R.sec[S.R.chispas[0]][1] + S.R.chispas[1] + 0.8) && S.golpeN % Math.max(1, S.D.rayoV - 1) === 0) {
      // En el vuelo los rayos no paran y van cambiando de figura: uno de arriba abajo donde esté BIT, uno de lado a lado,
      // la cruz (los dos a la vez), la jaula (dos a los lados: no te muevas), el pasillo (dos de lado a lado) y el barrido
      // (tres de arriba abajo que cruzan la pantalla uno tras otro)
      if (FK()) cmd("LASER.EXE", "LASER.EXE", "ALERTA: esquiva las franjas de luz", "WARNING: dodge the light strips", "rayosVuelo"); else if (!UIA()) cmd("FUEGO.EXE", "FIRE.EXE", "ALERTA: esquiva las franjas de fuego", "WARNING: dodge the fire strips", "rayosVuelo"); else cmd("RAYO.EXE", "BOLT.EXE", "ALERTA: esquiva las franjas rosas", "WARNING: dodge the pink strips", "rayosVuelo");
      // Avisan con dos golpes de anticipación (poco más de un segundo), para que dé tiempo de salir también con el dedo
      const tv = S.rG + 1 < S.R.golpes.length && S.R.golpes[S.rG + 1] / 100 - S.ts < 1.6 ? S.R.golpes[S.rG + 1] / 100 : t1;
      const bx = S.bit.x + 5, by = S.bit.y + 6, pon = (tipo, v, dt = 0) => S.ataques.push(tipo === "x" ? { tipo, x: Math.max(8, Math.min(S.W - 8, v)), t0: S.ts, t1: tv + dt } : { tipo, y: Math.max(18, Math.min(piso() - 8, v)), t0: S.ts, t1: tv + dt });
      switch (S.rayoN++ % 6) {
        case 0: pon("x", bx); break;
        case 1: pon("h", by); break;
        case 2: pon("x", bx); pon("h", by); break;
        case 3: pon("x", bx - 22); pon("x", bx + 22); break;
        case 4: pon("h", by - 19); pon("h", by + 19); break;
        default: { const d = bx < S.W / 2 ? 1 : -1; [0, 1, 2].forEach((n) => pon("x", S.W / 2 + d * (n - 1) * S.W * 0.32, n * 0.2)); }
      }
    }
  }

  Object.assign(BB, { DJ_FIGS, mapa, seccionDe });
})();