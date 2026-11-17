/* ---------- BIT & BUGS · estado.js: el estado de la partida y las reglas fijas (dificultades, bichos, reparto por canción) ---------- */
(() => {
  "use strict";
  const BB = window.BitBugs, S = BB.S;
  const { RM, ctx, lee, lienzo } = BB;
  Object.assign(BB, { lapsoYa, ponLibre, tiemposTeles });

  /* ---------- 3. Estado de la partida ---------- */
<<<<<<< HEAD
  // La tarjeta "+ TU MUSICA" del título está elegida (en vez de una canción)
  S.selPersonal = false;
  // Canción del jugador elegida en el título (su id), y las que ya tienen mapa (salen en la fila de canciones)
  S.selMia = null; S.misMapas = []; S.miaUrl = "";
  // Probando un mapa desde el editor de ritmo (al acabar o con ESC se vuelve al editor)
  S.prueba = false;
=======
>>>>>>> origin/alt
  // Medidas: el recuadro del juego (W × H pixeles propios, a 'escala' pixeles de pantalla cada uno), su lugar en la
  // pantalla (rectL) y el lienzo de efectos, que cubre todo con el mismo tamaño de pixel (FW × FH; el recuadro empieza en gx, gy)
  S.W = 200; S.H = 140; S.escala = 4; S.col = {}; S.rectL = null;
  S.FW = 320; S.FH = 180; S.gx = 60; S.gy = 20;
  // El piso es la línea de comandos de la terminal: una franja de 7 pixeles con una casilla por carril
  const piso = () => S.H - 7, bitY = () => piso() - 12;
  // Carriles: BIT y los bugs van por 5 columnas (pocas, para que cada salto cuente)
  const carriles = 5;
  S.LW = 40;
  const xBit = (c) => Math.round(c * S.LW + S.LW / 2 - 5), xBug = (c) => Math.round(c * S.LW + S.LW / 2 - 5.5);

  // El reloj del juego y en qué pantalla está: "titulo", "dificultad", "cargando", "jugando", "pausa" o "fin"
  S.raf = 0; S.ult = 0; S.acum = 0; S.t = 0;
  S.modo = "clasico"; S.estado = "titulo"; S.deApagado = false; S.bloqueamos = false; S.volverA = null;

  // Común a los dos modos: puntos, lo que hay en pantalla y BIT
  S.pts = 0; S.nuevoRecord = false; S.objs = []; S.textos = []; S.grietas = []; S.destellos = []; S.chispas = []; S.ondas = []; S.fantasmas = [];
  S.bit = { c: 2, x: 95, y: 120 }; S.boca = "n"; S.bocaT = 0; S.parpadeo = 0; S.temblor = 0;
  // Controles: teclas apretadas, repetición al mantenerlas y hacia dónde apunta el mouse o el dedo
  S.izq = false; S.der = false; S.arr = false; S.aba = false; S.dirTecla = 0; S.rep = 0; S.meta = null; S.metaY = null;
  // Cómo se siente BIT: se aplasta al frenar, se estira al correr, brilla y brinca al atrapar; el recuadro da un golpecito (punch)
  S.aplasta = 0; S.estira = 0; S.brillo = 0; S.brinco = 0; S.punch = 0;
  // Casillas del piso que se encienden al atrapar, y la pista de controles del arranque
  S.celdas = [0, 0, 0, 0, 0]; S.pistaT = 0; S.atrapadosPista = 0;

  // Modo clásico: vidas, versión (nivel), cuánto falta para el siguiente bug, récord y su letrero central
  S.vidas = 3; S.nivel = 0; S.sig = 0; S.record = +(lee("bitBugsRecord") || 0); S.mensaje = ""; S.mensajeT = 0;

  // Modo ritmo: la canción. ts = segundo que suena; rI y rG = siguiente nota y siguiente bombo; secI = escenario actual
  const audios = {};
  S.audio = null; S.intentoN = 0; S.ts = 0; S.ultA = -1; S.ultP = 0; S.desdeIni = 0;
  S.rI = 0; S.rG = 0; S.golpeN = 0; S.pulso = 0; S.secI = -1; S.cambio = 0; S.energiaAhora = 0; S.vu = 0; S.anillos = [];
  // Qué notas salen en esta partida (según la dificultad) y de qué tipo
  S.activa = []; S.tipoRun = []; S.totalNotas = 0;
  // Racha y premios
  S.combo = 0; S.maxCombo = 0; S.atrapados = 0; S.recordR = 0;
  // Fiebre (hasta qué segundo dura): mientras tanto todo es de premio y cada bug vale más que el anterior
  S.fiebre = 0; S.fiebreN = 0; S.fiebreTotal = 0;
  // La estela de BIT: copias de colores que se quedan atrás al moverse en las partes fuertes
  S.ecos = []; S.ecoN = 0; S.burbujas = [];

  /* Dificultad del modo ritmo. vidas: cuántas tiene BIT · paso: cuántos bugs caídos cuestan una vida · regen: cada cuántos
     seguidos recupera una · vel: cuánto tarda en caer un bug (más = más lento) · gap / gapVuelo: separación mínima entre bugs
     (los que quedan más juntos no salen) · tope: filas de memoria del jefe · rayo / rayoV: cada cuántos bombos dispara el gato
     (jefe / vuelo) · invul: cuadros a salvo tras perder una vida · arcoVuelo: cada cuántos bugs del vuelo sale un arcoíris */
  const DIFS = {
    facil: { n: ["FACIL", "EASY"], vidas: 5, paso: 3, regen: 25, vel: 1.18, gap: 0.34, gapVuelo: 0.66, tope: 10, rayo: 5, rayoV: 4, invul: 100, arcoVuelo: 18 },
    medio: { n: ["MEDIO", "NORMAL"], vidas: 4, paso: 2, regen: 35, vel: 1, gap: 0, gapVuelo: 0.54, tope: 8, rayo: 4, rayoV: 3, invul: 75, arcoVuelo: 23 },
    dificil: { n: ["DIFICIL", "HARD"], vidas: 3, paso: 1, regen: 45, vel: 0.86, gap: 0, gapVuelo: 0.42, tope: 6, rayo: 3, rayoV: 2, invul: 55, arcoVuelo: 29 },
  };
  S.dif = DIFS[lee("bitBugsDif")] ? lee("bitBugsDif") : "medio"; S.D = DIFS[S.dif];
  // Vidas de BIT en ritmo, bugs caídos desde la última vida perdida, cuadros a salvo, reintentos y el parpadeo del corazón
  S.vidasR = 4; S.fallosVida = 0; S.invul = 0; S.continues = 0; S.vidaFx = 0;
  // Fallar un bug: BIT lastimado, interferencia en el escenario y la música baja un instante
  S.dano = 0; S.interferencia = 0; S.agachaT = 0; S.apach = 0; S.veloPuesto = 0; S.vNota = 0; S.gatoUlt = -999;
  // Si BIT cayó, y el punto de control del escenario donde iba (para reintentar desde ahí)
  S.muerto = false; S.foto = null;

  // El jefe (escenario 5): GATO.EXE llena la memoria. Cada bug que cae sube una fila; al llegar a JEFE_TOPE, el programa truena.
  // Cada bug atrapado la baja JEFE_BAJA. peligroVis es lo que se dibuja, que persigue suave al valor real
  const JEFE_BAJA = 0.34;
  S.JEFE = 4; S.JEFE_TOPE = 8; S.peligro = 0; S.peligroVis = 0; S.jefeAviso = false;
  // Vuelo libre (escenario 8): BIT deja los carriles y se mueve por todo el recuadro; los bugs cruzan de lado
  const CRUCE = 3.3, CRUCE_LENTO = 4.3;
  S.VUELO = 7;
  S.vuela = false; S.vx = 0; S.vy = 0; S.vueloAviso = false;
  // Ataques del gato: rayos que avisan y caen con el siguiente bombo
  S.ataques = []; S.rayoN = 0;
  // Hasta qué segundo dura la ayuda del reloj (BIT atrapa también los carriles de al lado)
  S.iman = 0;
  // El jefe del gato también llena la memoria por su cuenta: cuándo toca el siguiente llenado y si ya lo anunció
  S.llenaT = 0; S.llenaAviso = false; S.llenaN = 0;

  // La línea de comandos dentro de la terminal de BIT (C:\\>VUELO.EXE ... COMPLETO) y lo que ya se avisó una vez
  S.orden = null; S.dichos = {};
  // Ventanas de combo: las que esperan turno, los puntos del último bug y cuándo sonó el último premio
  S.colaV = []; S.ultN = 10; S.vUltSon = 0;
  // Qué tan tensa está la terminal (0 a 1): con tensión, la propia ventana de BIT se llena de interferencia
  S.tension = 0;
  // Cámara del escenario: un acercamiento que late en las partes fuertes y sigue al gato en las tranquilas
  S.zoom = 1; S.focoX = 0; S.focoY = 0; S.corteSeco = false; S.recortePuesto = ""; S.ultimoJefe = -1;
  // El gato: cuánto lleva girado y a qué velocidad. El espectro del horizonte de la Ciudad Neón
  S.giro = 0; S.vGiro = 0.3;
  // Nivel GRIMORIO: la luz de la linterna de BIT (0 a 1; lo que se dibuja la persigue suave)
  S.luz = 0.75; S.luzVis = 0.75;
  // Nivel DOOM CROSSING: las campanas que se juntan en el pueblo y los escudos que compran al entrar al infierno
  const CAMPANAS_ESCUDO = 12;
  S.campanas = 0; S.escudo = 0;
  const mundoDe = (i) => (S.R.mundos ? S.R.mundos[i] : "");
  // Nivel FUTURE FUNK: el groove (0 a 8). Sube con cada salto que cae en el golpe de la música y hace que cada bug valga más
  // (hasta el doble); si se deja de bailar, baja solo. grooveT = segundo del último salto al compás · grooveFx = su destello
  const GROOVE_MAX = 8;
  S.groove = 0; S.grooveT = 0; S.grooveFx = 0;
  /* El tramo lateral (R.lateral): la terminal se encoge y se va a la izquierda, BIT se mueve de arriba abajo por cinco filas
     y los bugs le llegan de lado, desde la derecha. latK va de 0 a 1 mientras la terminal se acomoda.
     teles = los segundos en que BIT es cambiado de fila a la fuerza (R.teles) y teleI por cuál va */
  S.lateral = false; S.latK = 0; S.teles = []; S.teleI = 0; S.rect0 = null; S.movida = false;
  /* Lo raro: con cada cambio de fila forzado la situación se vuelve otra cosa (raro dice cuál; "" = todo normal):
       neg       los colores de la terminal se invierten        bicho    controlas a un bug y los que llegan son BITs
       espejo    la terminal se ve en espejo                    fuera    BIT se sale de la terminal y sigue jugando desde afuera
       gigante   BIT crece al triple                            cabeza   la terminal se pone de cabeza
       clones    hay un BIT en cada fila                        codigo   todo se vuelve verde, como código
       ladeo     la terminal se ladea                           mini     la terminal se encoge
     Van en este orden, uno por cambio, y se repiten si hay más cambios que la lista. */
  const RAROS = ["neg", "bicho", "espejo", "fuera", "gigante", "cabeza", "clones", "codigo", "ladeo", "bicho", "mini", "fuera", "espejo", "gigante", "cabeza", "clones"];
  // Los escenarios por los que brinca el fondo con cada flashazo del final del arcade (números de tramo)
  const FONDOS_FLASH = [1, 14, 3, 6, 15, 10, 8, 5, 14, 9];
  S.raro = ""; S.filtroPuesto = ""; S.fxIzq = 0; S.fxArr = 0;
  // Los pisones de la fábrica (R.pisones = en qué tramos caen). aplastando = corre la escena en que aplastan a BIT (R.aplastada)
  // y él no se puede mover; aplastado = ya le cayó el último encima
  S.aplastando = false; S.aplastado = false;
  // golpeY = la sacudida vertical cuando un pisón azota el piso · trabaI = por cuál "traba" de la canción va (R.trabas)
  // quemada = la casilla que quedó ardiendo tras un pisón { c, hasta } · calor = cuánto se ha tostado BIT (0 a 1)
  S.golpeY = 0; S.trabaI = 0; S.quemada = null; S.calor = 0; S.pisonN = 0; S.djN = 0; S.djLibre = 0;
  // Los segundos de los cambios de fila (R.teles) y de los flashazos que les siguen (R.flashazos, contados desde el último cambio)
  function tiemposTeles(fin) { const r = []; if (S.R.teles && S.R.lateral != null) { let tt = S.R.teles[0]; for (const [cada, n] of S.R.teles[1]) for (let i = 0; i < n && tt < fin; i++) { r.push(tt); tt += cada; } } return r; }
  const flashesPasados = () => { let n = 0; for (const f of (S.R && S.R._flashT) || []) if (S.ts >= f) n++; return n; };
  const filaY = (c) => Math.round(14 + c * ((piso() - 28) / (carriles - 1)));
  // Los destellos que lo ciegan todo, fondo, terminal y BIT (R.destellos: [tramo que termina en blanco, segundos de subida]):
  // devuelve qué tan blanco va (0 a 1). Sube despacio y al final de golpe; ya en el tramo siguiente se apaga en medio segundo
  // R.chispas = [tramo, segundos]: al acabar ese tramo todo se va a blanco y saltan chispas, como al terminar un nivel.
  // La terminal solo se ciega un instante; el fondo se queda en blanco los segundos que diga y luego deja ver lo que sigue
  const chispazo = () => { if (!S.R || !S.R.chispas || S.modo !== "ritmo") return null; const fin = S.R.sec[S.R.chispas[0]][1], ini = S.R._chT != null ? S.R._chT : fin; return S.ts >= ini && S.ts < fin + S.R.chispas[1] ? { e: S.ts - ini, d: fin + S.R.chispas[1] - ini } : null; };
  // El lapso del destello: empieza en el instante en que BIT atrapa el último bug del jefe (o, si se le va, al acabar el
  // tramo). Mientras dura no hay terminal, ni bugs, ni rayos: BIT vuela libre por toda la pantalla. La terminal vuelve
  // un momento antes de que se apague el blanco
  const lapso = () => !!chispazo();
  // Lo que tarda el blanco en apagarse al final del lapso. El juego (BIT incluido) se aclara al mismo paso
  const APAGA_BLANCO = 2.6;
  /* VUELO LIBRE (R.vueloLibre): desde que empieza el destello y durante todo el tramo de vuelo, la terminal deja de ser
     el contenedor. El lienzo del juego se estira a la pantalla entera y no pinta ni su fondo, ni su barra, ni su piso:
     BIT, los bugs y los rayos usan toda la escena. Al acabar el tramo, todo vuelve a la terminal. */
  S.modoLibre = false; S.libre0 = null;
  const quiereLibre = () => !!(S.R && S.R.vueloLibre && !RM && S.modo === "ritmo" && S.secI >= 0 && (S.estado === "jugando" || S.estado === "pausa") && (chispazo() || S.secI === S.VUELO));
  function ponLibre(on) {
    if (on === S.modoLibre) return;
    S.modoLibre = on;
    if (on) {
      S.libre0 = { W: S.W, H: S.H, gx: S.gx, gy: S.gy, w: lienzo.style.width, h: lienzo.style.height };
      lienzo.width = S.FW; lienzo.height = S.FH;
      Object.assign(lienzo.style, { position: "fixed", left: `${S.fxIzq}px`, top: `${S.fxArr}px`, width: `${S.FW * S.escala}px`, height: `${S.FH * S.escala}px`, boxShadow: "none", transform: "", clipPath: "" });
      S.bit.x += S.gx; S.bit.y += S.gy; if (S.meta != null) { S.meta += S.gx; S.metaY += S.gy; }
      S.W = S.FW; S.H = S.FH; S.gx = 0; S.gy = 0;
    } else {
      const o = S.libre0;
      lienzo.width = o.W; lienzo.height = o.H;
      Object.assign(lienzo.style, { position: "", left: "", top: "", width: o.w, height: o.h, boxShadow: "" });
      S.W = o.W; S.H = o.H; S.gx = o.gx; S.gy = o.gy; S.meta = null;
      S.bit.x = Math.max(0, Math.min(S.W - 10, S.bit.x - S.gx)); S.bit.y = Math.max(12, Math.min(bitY(), S.bit.y - S.gy));
    }
    S.LW = S.W / carriles; S.recortePuesto = "";
    ctx.imageSmoothingEnabled = false;
  }
  function lapsoYa() {
    if (S.R._chT != null || !S.R.chispas) return;
    S.R._chT = S.ts; S.ataques = [];
    if (!S.vuela) { S.vuela = true; S.vx = S.vy = 0; S.vueloAviso = false; S.fantasmas = []; }
    [523, 784, 1047, 1568].forEach((f, i) => BB.bip(f, 0, 0.16, "square", 0.045, i * 0.05));
  }
  const fogonazo = () => {
    if (!S.R || !S.R.destellos || S.modo !== "ritmo") return 0;
    // El flashazo del aplastamiento: blanco total en el instante del último pisón
    if (S.R._aplT && S.ts >= S.R._aplT - 0.02 && S.ts < S.R._aplT + 0.6) return S.ts < S.R._aplT + 0.1 ? 1 : 1 - (S.ts - S.R._aplT - 0.1) / 0.5;
    // Los flashazos del final del arcade: blancos de un instante
    for (const f of S.R._flashT || []) if (S.ts >= f && S.ts < f + 0.26) return 1 - (S.ts - f) / 0.26;
    // R.blancos = [[tramo, segundo dentro del tramo], ...]: fogonazos blancos sueltos, de un instante
    for (const [i, seg] of S.R.blancos || []) { const f = S.R.sec[i][0] + seg; if (S.ts >= f && S.ts < f + 0.6) return 1 - (S.ts - f) / 0.6; }
    if (chispazo()) return 0;
    for (const [i, sube] of S.R.destellos) { const fin = S.R.sec[i][1]; if (S.ts > fin - sube && S.ts <= fin) return Math.pow((S.ts - (fin - sube)) / sube, 3); if (S.ts > fin && S.ts < fin + 0.55) return 1 - (S.ts - fin) / 0.55; }
    return 0;
  };
  // El recuadro que se lleva todo al final del tramo R.caja: de 1 (pantalla completa) a casi 0
  const cajaS = () => {
    if (RM || !S.R || S.R.caja == null || S.modo !== "ritmo" || S.estado !== "jugando" || S.secI !== S.R.caja) return 1;
    const falta = S.R.sec[S.secI][1] - S.ts;
    // Se cierra del todo: un instante antes de acabar el tramo ya no queda nada, la pantalla está en negro
    return falta > 1.1 ? 1 : falta < 0.18 ? 0 : Math.pow((falta - 0.18) / 0.92, 1.6);
  };
  // El rectángulo del recuadro en el lienzo de efectos: [x, y, ancho, alto], cerrándose sobre BIT
  const cajaRect = (cs) => { const bx = S.gx + S.bit.x + 5, by2 = S.gy + S.bit.y + 6; return [Math.round(bx * (1 - cs)), Math.round(by2 * (1 - cs)), Math.round(S.FW * cs), Math.round(S.FH * cs)]; };
  // Pantallas: disco elegido en el estante, tramo elegido en la cinta, tramo que se practica (null = canción entera),
  // en qué va la pantalla final ("conteo", "resultado", "practica", "crash", "clasico") y sus datos
  S.selDisco = Math.max(0, Math.min(3, +(lee("bitBugsDisco") || 0) || 0)); S.selTramo = 0; S.practica = null; S.finModo = ""; S.finN = 0; S.res = null;
  // Bugs atrapados y totales de cada tramo [ok, total], y los créditos del arranque (cuadros desde que empezó; -1 = ya pasaron)
  S.tramos = []; S.cred = -1;
  // El cierre de un nivel: destello con estrellas, todo a negro y la llave que hay que recoger para ver los resultados.
  // cierre = { t: cuadros que lleva, fase: "luz" | "llave" | "toma" | "fin", c: carril de la llave, y: su altura, tt: cuadros de la fase }
  // negro = el escenario se queda apagado detrás de los resultados · destello = el fogonazo con que aparecen
  S.cierre = null; S.negro = false; S.destello = 0; S.nuevaCancion = null;
  // El telón entre pantallas: mientras cubre, no se atienden teclas
  S.enTrans = false; S.transN = 0;
  const LLAVE = [".YYYYY.", "YY...YY", "Y.....Y", "YY...YY", ".YYYYY.", "...Y...", "...Y...", "...YYY.", "...Y...", "...YYY.", "...Y..."];
  const espectro = [];

  Object.assign(BB, { APAGA_BLANCO, CAMPANAS_ESCUDO, CRUCE, CRUCE_LENTO, DIFS, FONDOS_FLASH, GROOVE_MAX, JEFE_BAJA, LLAVE, RAROS, audios, bitY, cajaRect, cajaS, carriles, chispazo, espectro, filaY, flashesPasados, fogonazo, lapso, mundoDe, piso, quiereLibre, xBit, xBug });
<<<<<<< HEAD
})();
=======
})();
>>>>>>> origin/alt
