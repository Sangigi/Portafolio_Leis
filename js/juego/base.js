/* ---------- BIT & BUGS: el minijuego del portafolio ----------
   Se abre desde su resultado en Habilidades (HTML, CSS o JS), con el botón JUGAR. Tiene dos modos:

   CLASICO  Los bugs se escapan y BIT los atrapa antes de que lleguen a producción. Tres vidas, cada vez más rápido.

   RITMO    Los bugs caen al compás de "u i a Cat" (el mapa de la canción está en js/ritmo-uia.js). La canción cuenta
            una historia en diez escenarios que ocupan toda la pantalla: la consola arranca, GATO.EXE la tumba con un
            error crítico, a media canción es el jefe (quiere saturar la memoria: cada bug que cae la llena y, si se
            llena, el programa truena), luego BIT vuela libre esquivando rayos y al final el antivirus limpia al gato.
            Hay tres dificultades, vidas, combos con multiplicador, bugs especiales (dorado, arcoíris que desata la
            fiebre, glitch y antivirus) y reintento desde el escenario donde se cae.

            Hay más de una canción: cada una vive en su archivo js/ritmo-*.js. El nivel GRIMORIO (fantasía oscura) trae
            sus propias reglas: una linterna que se aviva al atrapar y se apaga al fallar, bugs malditos que no hay que
            tocar, runas que iluminan todo, un liche que lanza columnas de fuego y una torre que se sube volando.

   PANTALLAS  El título es un estante de disquetes (A: clásico; B:, C: y D: las dificultades de la canción elegida).
              Desde un disco se entra al selector de tramos, para practicar un pedazo de la canción. Al terminar sale
              la cuenta de premios y luego el resultado: rango, lo que faltó para el siguiente, tramos y logros.

   En pantalla: el recuadro del juego es una terminal abierta (C:\\BIT.EXE) cuyo piso es la línea de comandos, con una
   casilla por carril. BIT se mueve por 5 carriles, de un salto por toque. Los avisos se escriben como comandos en el
   primer renglón de esa terminal, y los combos salen en ventanitas que se abren y cierran sobre su orilla.
   Los récords y la dificultad elegida se guardan en este navegador.

   Cómo está ordenado: el juego vive en la carpeta js/juego/, un archivo por tema, y se cargan en este orden
   (la lista está en index.html; las canciones js/ritmo-*.js van antes):
     base.js            utilidades, canciones elegidas y datos fijos (sprites, especies, niveles de combo, fuente chica)
     ventana.js         la ventana del juego que se agrega a la página y sus piezas
     estado.js          el estado de la partida, dificultades, bichos y reparto por canción
     avisos.js          sonido, medidas, dibujo básico, marcador, línea de comandos y ventanas de racha
     pantallas.js       título (canciones y disquetes), llave, probadita, tramos, pausa y fin del modo clásico
     tienda.js          bytes, skins de BIT y packs de bichos
     ritmo.js           modo ritmo: audio, arranque, cierre, cuenta, resultado, daño y vidas
     ritmo-paso.js      modo ritmo: lo que pasa en cada cuadro (notas, bugs, ataques, tramos especiales)
     clasico.js         movimiento de BIT y el modo clásico
     dibujo.js          el recuadro del juego (BIT, bugs, ataques, piso y barra)
     escenas-base.js    herramientas de dibujo para los escenarios
     escenas-*.js       los escenarios de cada nivel (uia, grimorio, doom, funk)
     efectos.js         el gato, el lienzo de efectos y el bucle principal
     entrada.js         teclado, puntero, abrir y cerrar (window.Juego)

   Cómo se comparten las cosas entre archivos (todo cuelga de window.BitBugs, aquí llamado BB):
     S.nombre   el estado que cambia durante el juego (S.ts, S.bit, S.combo...). Cualquier archivo lo lee y lo cambia.
     BB.nombre  las funciones y datos fijos. Cada archivo publica los suyos con Object.assign(BB, {...}) y toma los de
                los archivos anteriores al principio (const { ... } = BB). Si usa algo de un archivo que carga después,
                lo llama como BB.nombre(), que ya existe para cuando se juega. */
(() => {
  "use strict";
  const BB = (window.BitBugs = { S: {} }), S = BB.S;

  const doc = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SND = window.Sonidos || { play() {}, silencio: () => true };
  const P = () => window.Portafolio;
  const T = (es, en) => (doc.lang === "en" ? en : es);
  const pig = (v) => getComputedStyle(doc).getPropertyValue(v).trim();
  const azar = (a, b) => a + Math.random() * (b - a);
  const lee = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const guarda = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* solo esta visita */ } };
  // En pantallas táctiles no tiene caso mostrar [R], [Y], [ESC]...
  const tactil = window.matchMedia("(pointer: coarse)").matches;
  const kb = (k) => (tactil ? "" : `[${k}] `);
  // Las canciones del modo ritmo (cada una en su archivo js/ritmo-*.js). R es la elegida; G() dice si es el nivel GRIMORIO
  // Las que traen oculta: true (niveles sin terminar) no aparecen en el juego
  const CANCIONES = [window.RitmoUIA, window.RitmoGrimorio, window.RitmoFunk, window.RitmoDoom].filter((c) => c && !c.oculta);
  S.cancionI = Math.max(0, Math.min(CANCIONES.length - 1, +(lee("bitBugsCancion") || 0) || 0)); S.R = CANCIONES[S.cancionI] || null;
  const G = () => !!S.R && S.R.tema === "grimorio";
  // UIA() = el nivel del gato (el que no trae tema) · DM() = el nivel DOOM CROSSING
  const UIA = () => !!S.R && !S.R.tema, DM = () => !!S.R && S.R.tema === "doom", FK = () => !!S.R && S.R.tema === "funk";

  /* ---------- 1. Datos fijos: sprites, especies, niveles de combo y fuente chica ---------- */

  const CORAZON = [".RR.RR.", "RWRRRRR", "RRRRRRR", ".RRRRR.", "..RRR..", "...R..."];
  const CORAZON_VACIO = CORAZON.map((f) => f.replace(/[RW]/g, "G"));
  // Los bugs: cinco especies de 11×9, cada una con dos cuadros (R cuerpo, Z sombra, W ojos, K pupila, G patas).
  // En ritmo, cada escenario trae su especie y sus colores (MUTA); en clásico cambian con cada versión.
  const ESPECIES = {
    // Catarina
    A: [["..G.....G..", "...G...G...", "..RRRRRRR..", "GRRWRRRWRRG", ".RRKRZRKRR.", "GRRRRZRRRRG", ".RRZRZRZRR.", "G.RRRZRRR.G", "...RR.RR..."],
        ["...G...G...", "...G...G...", "..RRRRRRR..", ".RRWRRRWRR.", "GRRKRZRKRRG", ".RRRRZRRRR.", "GRRZRZRZRRG", "..RRRZRRR..", "..RR...RR.."]],
    // Araña
    B: [["G...G.G...G", ".G..G.G..G.", "..GRRRRRG..", "..RWKRKWR..", "GGRRRRRRRGG", "..RRZRZRR..", ".GRRRRRRRG.", "G..RRZRR..G", "G.........G"],
        [".G..G.G..G.", "..G.G.G.G..", "..GRRRRRG..", "..RWKRKWR..", ".GRRRRRRRG.", "G.RRZRZRR.G", "..RRRRRRR..", ".G.RRZRR.G.", ".G.......G."]],
    // Mosca
    C: [["WW.......WW", "WWW.....WWW", ".WWRRRRRWW.", "..RWKRKWR..", "..RRRRRRR..", ".GRZZZZZRG.", "..RRRRRRR..", ".G.RZZZR.G.", "....R.R...."],
        ["...........", "WW.......WW", "WWWRRRRRWWW", ".WRWKRKWRW.", "..RRRRRRR..", ".GRZZZZZRG.", "..RRRRRRR..", ".G.RZZZR.G.", "....R.R...."]],
    // Virus de picos
    D: [["R...R.R...R", ".R..RRR..R.", "..RRRRRRR..", "RRRWWRWWRRR", "..RWKRKWR..", "RRRRRRRRRRR", "..RRZZZRR..", ".R.RRRRR.R.", "R...R.R...R"],
        [".R..R.R..R.", "..R.RRR.R..", "..RRRRRRR..", ".RRWWRWWRR.", "R.RKWRWKR.R", ".RRRRRRRRR.", "R.RRZZZRR.R", "..RRRRRRR..", ".R..R.R..R."]],
    // Medusa
    E: [["...RRRRR...", "..RRRRRRR..", ".RRWRRRWRR.", ".RRKRRRKRR.", ".RRRRRRRRR.", "..RZRZRZR..", "..R.R.R.R..", ".R..R.R..R.", ".R.R...R.R."],
        ["...RRRRR...", "..RRRRRRR..", ".RRWRRRWRR.", ".RRKRRRKRR.", ".RRRRRRRRR.", "..RZRZRZR..", "..R.R.R.R..", "..R.R.R.R..", "...R.R.R..."]],
  };
  const ORO_MAPA = { R: "Y", Z: "Q" };
  // Por escenario: especie y cambio de colores
  const MUTA = [["A", null], ["B", { R: "P", Z: "M" }], ["E", { R: "C", Z: "B" }], ["C", { R: "N", Z: "R" }], ["D", { R: "C", Z: "B" }],
    ["C", { R: "Y", Z: "V", W: "C" }], ["D", { R: "V", Z: "D" }], ["B", { R: "C", Z: "M", G: "W" }], ["E", { R: "M", Z: "B" }], ["A", { R: "G", Z: "D" }]];
  // Antivirus: solo sale con el jefe y libera dos filas de memoria
  // Nivel GRIMORIO: murciélago (F), calavera (G), ojo (H) y fuego fatuo (I). Cada escenario del nivel trae su especie (MUTA_G)
  Object.assign(ESPECIES, {
    // Los asteroides (R, S y U): en los tramos planetarios de FUTURE FUNK los bugs comunes son piedras, de tres formas,
    // con su lado de luz (W, L), su sombra (Z), sus cráteres (K) y, la tercera, una veta de cristal (C)
    R: [["...RRRRR...", ".RWWLLRRRR.", "RWWLRRRKRRR", "RWLRRRKKRZR", "RLRRRRRRRZR", "RRRKRRRRZZR", ".RRRRRRZZZ.", "..RZZZZZZ..", "....ZZZ...."], ["....RRRR...", "..RWWLRRRR.", ".RWLRRRRRRR", "RWLRRKKRRZR", "RLRRRKRRRZR", "RRRRRRRRZZR", ".RRKRRRZZZ.", "..RRZZZZZ..", "...ZZZZ...."]],
    S: [["...........", "..RRRRRR...", ".RWWLRRRRR.", "RWLRRRRKRRR", "RLRRKRRRRZZ", "RRRRRRRRZZZ", ".RRRRKRZZZ.", "..RZZZZZZ..", "..........."], ["...........", "...RRRRRR..", ".RRWWLRRRR.", "RWWLRRRRKRR", "RLRRRKRRRZZ", "RRRRRRRRZZZ", ".RRKRRRZZZ.", "...ZZZZZ...", "..........."]],
    U: [["....RR.....", "...RWWR....", "..RWLRRR...", ".RWLRRKRR..", "RLRRCRRRZR.", "RRRCCRRZZR.", ".RRRCRZZZ..", "..RRZZZZ...", "...ZZZ....."], ["....RR.....", "...RWWR....", "..RWLRRR...", ".RWLRRKRR..", "RLRRWRRRZR.", "RRRCWRRZZR.", ".RRRCRZZZ..", "..RRZZZZ...", "...ZZZ....."]],
    // Los bichos de la tienda: patitos (P1), ovnis (P2) y disquetes (P3)
    P1: [["...RRR.....", "..RRRRR....", "..RKRRRZZ..", "..RRRRRZZZ.", "R..RRRR....", "RRRRRRRRR..", "RRRRRRRRRR.", ".RRRRRRRR..", "..RRRRRR..."], ["...RRR.....", "..RRRRR....", "..RKRRRZ...", "..RRRRRZZZ.", "...RRRR....", "RRRRRRRRR..", "RRRRRRRRRR.", ".RRRRRRRR..", "..RRRRRR..."]],
    P2: [["....WWW....", "...WCCCW...", "..WCCCCCW..", ".RRRRRRRRR.", "RRZRRZRRZRR", ".RRRRRRRRR.", "...Z...Z...", "..Z.....Z..", "..........."], ["....WWW....", "...WCCCW...", "..WCCCCCW..", ".RRRRRRRRR.", "RZRRZRRZRRR", ".RRRRRRRRR.", "...Z...Z...", "...Z...Z...", "..........."]],
    P3: [["RRRRRRRRRR.", "RRZZZZZKRRR", "RRZZZZZKRRR", "RRZZZZZZRRR", "RRRRRRRRRRR", "RWWWWWWWWWR", "RWKKKKKKWWR", "RWWWWWWWWWR", "RWKKKKWWWWR"], ["RRRRRRRRRR.", "RRZZZZKZRRR", "RRZZZZKZRRR", "RRZZZZZZRRR", "RRRRRRRRRRR", "RWWWWWWWWWR", "RWKKKKWWWWR", "RWWWWWWWWWR", "RWKKKKKKWWR"]],
    F: [["R.........R", "RR.......RR", "RRR.R.R.RRR", "RRRRRRRRRRR", "RZRRWRWRRZR", "R.RRKRKRR.R", "...RRRRR...", "....RZR....", "...G...G..."],
        ["...........", "....R.R....", "...RRRRR...", ".RRRWRWRRR.", "RRRRKRKRRRR", "RZRRRRRRRZR", "R..RRZRR..R", "R...G.G...R", "..........."]],
    G: [["..RRRRRRR..", ".RRRRRRRRR.", "RRKKRRRKKRR", "RRKKRRRKKRR", "RRRRRKRRRRR", ".RRRRRRRRR.", "..RZRZRZR..", "..R.R.R.R..", "..........."],
        ["..RRRRRRR..", ".RRRRRRRRR.", "RRKKRRRKKRR", "RRKWRRRKWRR", "RRRRRKRRRRR", ".RRRRRRRRR.", "..Z.Z.Z.Z..", "..RZRZRZR..", "..R.R.R.R.."]],
    H: [["...RRRRR...", ".RRWWWWWRR.", "RRWWWWWWWRR", "RWWWZZZWWWR", "RWWWZKZWWWR", "RWWWZZZWWWR", "RRWWWWWWWRR", ".RRWWWWWRR.", "..G.RRR.G.."],
        ["...RRRRR...", ".RRWWWWWRR.", "RRWWWWWWWRR", "RWWWWZZZWWR", "RWWWWZKZWWR", "RWWWWZZZWWR", "RRWWWWWWWRR", ".RRWWWWWRR.", ".G..RRR..G."]],
    I: [[".....R.....", "....RR.....", "...RRRR....", "..RRZZRR...", ".RRZZZZRR..", ".RRZWZWZRR.", ".RRZZZZZRR.", "..RRZZZRR..", "...RRRRR..."],
        ["......R....", ".....RR....", "....RRRR...", "...RRZZRR..", "..RRZZZZRR.", ".RRZWZWZRR.", ".RRZZZZZRR.", "..RRZZZRR..", "...RRRRR..."]],
  });
  // Nivel DOOM CROSSING: mariposa (J) para el pueblo y diablillo (L) para el infierno, y qué especie trae cada tramo
  Object.assign(ESPECIES, {
    J: [["PP.......PP", "PPP..K..PPP", "PPPP.K.PPPP", "PPZPPKPPZPP", ".PPPPKPPPP.", "..PPPKPPP..", ".PPZPKPZPP.", ".PPP.K.PPP.", "..P.....P.."],
        ["..P.....P..", "..PP.K.PP..", "..PPPKPPP..", "..PZPKPZP..", "...PPKPP...", "...PPKPP...", "..PZPKPZP..", "..PP.K.PP..", "..........."]],
    L: [["R.........R", "RR.......RR", ".RRRRRRRRR.", ".RWWRRRWWR.", ".RKWRRRWKR.", ".RRRRRRRRR.", ".RRWKWKWRR.", "..RRRRRRR..", "..RR...RR.."],
        ["R.........R", "RR.......RR", ".RRRRRRRRR.", ".RWWRRRWWR.", ".RWKRRRKWR.", ".RRRRRRRRR.", ".RRKWKWKRR.", "..RRRRRRR..", "...R...R..."]],
  });
  const MUTA_D = [["J", { P: "#ff9ad5", Z: "W", K: "W" }], ["J", { P: "#7dd3fc", Z: "W", K: "W" }], ["L", null], ["A", { R: "#ffb13b", Z: "N" }], ["G", { R: "R", Z: "Z" }],
    ["J", { P: "#c084ff", Z: "W", K: "W" }], ["H", { R: "R", Z: "Y" }], ["L", { R: "N", Z: "R" }], ["L", null], ["J", { P: "#ffd23b", Z: "W", K: "W" }]];
  const DEMONIO = ["R...........R", "RR.........RR", "RRR.WWWWW.RRR", ".RRWWWWWWWRR.", "..WWWWWWWWW..", "..WKKWWWKKW..", "..WKYWWWYKW..", "..WWWWKWWWW..", "...WWKWKWW...", "...WKWKWKW...", "...WWWWWWW...", "....W.W.W...."];
  const CAMPANA = ["..Y..", ".YYY.", ".YYY.", "YYYYY", "..Y.."];
  // Nivel FUTURE FUNK: las especies de siempre, en colores de neón
  const MUTA_F = [["I", { R: "#ff3fb4", Z: "W" }], ["J", { P: "#ffb86b", Z: "W", K: "W" }], ["A", { R: "#ff3fb4", Z: "#8a2a8a" }], ["B", { R: "#00f6ff", Z: "B" }], ["C", { R: "#ffd23b", Z: "N" }], ["E", { R: "#c084ff", Z: "M" }],
    ["D", { R: "#3fff8a", Z: "V" }], ["H", { R: "#ff3fb4", Z: "#00f6ff" }], ["R", { R: "#b8a8c8", Z: "#5c4c7c", W: "#ffffff", L: "#e0d4f0", K: "#2c1c44", C: "#7cf4ff" }], ["R", { R: "#c4c0d4", Z: "#6c6890", W: "#ffffff", L: "#e4e0f0", K: "#3c3864", C: "#ffe14a" }], ["A", { R: "#ffd23b", Z: "N" }], ["B", { R: "#5cb0fc", Z: "B" }], ["R", { R: "#c4b49c", Z: "#6c5c64", W: "#fff8dc", L: "#e4d8bc", K: "#2c2420", C: "#7dff3c" }], ["H", { R: "#ffffff", Z: "#ff3fb4" }]];
  const MUTA_G = [["I", { R: "C", Z: "W" }], ["F", { R: "R", Z: "Z" }], ["G", { R: "W", Z: "G" }], ["H", { R: "N", Z: "R" }], ["F", { R: "B", Z: "#1c2f6b" }], ["I", { R: "N", Z: "Y" }], ["H", { R: "Y", Z: "M" }]];
  // La runa (en este nivel hace de arcoíris: ilumina todo y desata la fiebre) y el liche, que se dibuja en grande en el escenario
  const RUNA = ["....RRR....", "...R.R.R...", "..R..R..R..", ".R..RRR..R.", ".R.R.R.R.R.", ".R..RRR..R.", "..R..R..R..", "...R.R.R...", "....RRR...."];
  const LICHE = ["....YYYYY....", "...Y.Y.Y.Y...", "...MMMMMMM...", "..MMWWWWWMM..", "..MWWWWWWWM..", "..MWKKWKKWM..", "..MWKCWKCWM..", "..MWWWKWWWM..", "..MMWKWKWMM..", "..MMMWWWMMM..", ".MMMMMMMMMMM.", "MMMZMMMMMZMMM", "MMZZMMMMMZZMM", "M.ZZZMMMZZZ.M"];
  // Logros: [clave, nombre ES, nombre EN, cómo se gana ES, EN]
  const LOGROS = [
    ["primera", "PRIMER DISCO", "FIRST DISK", "termina una canción", "finish a song"],
    ["limpio", "DE UN TIRON", "ONE TAKE", "termina sin reintentos", "finish with no retries"],
    ["combo100", "COMBO 100", "COMBO 100", "atrapa 100 seguidos", "catch 100 in a row"],
    ["intacto", "INTACTO", "UNTOUCHED", "termina con todas las vidas", "finish with every life"],
    ["jefe", "JEFE PERFECTO", "PERFECT BOSS", "pasa al jefe sin dejar caer ninguno", "beat the boss without dropping any"],
    ["rangoS", "RANGO S", "S RANK", "saca una S", "get an S"],
    ["dificil", "SIN MIEDO", "FEARLESS", "termina un disco DIFICIL", "finish a HARD disk"],
    ["tripleS", "TRIPLE S", "TRIPLE S", "saca S en los tres discos de una canción", "get S on all three disks of a song"],
  ];
  /* Bichos con maña: cada uno cambia lo que hay que hacer. sp = su dibujo (11×9) · m = sus colores · pts = lo que vale
     · aviso = lo que escribe la terminal la primera vez que sale uno (ES, EN) */
  const BICHOS = {
    // Cae en tres pedazos por el mismo carril: hay que quedarse quieto. El tercero vale triple
    gusano: { n: "GUSANO", pts: 10, m: { V: "#7dff3c", Z: "#2f8a1a" }, aviso: ["OK: no te muevas, son tres", "OK: hold still, there are three"],
      sp: ["...........", "..VVV......", ".VWVWV.....", ".VVVVVVV...", "..VVZVVVVV.", "....VVZVVVV", "......VVZVV", ".......VVV.", "..........."] },
    // Parece dorado. Si a media caída enseña los ojos rojos (troya), es trampa y no se toca; si no (troyaOk), vale +100
    troya: { n: "TROYANO", pts: 0, m: { Q: "Q" }, aviso: ["ALERTA: con ojos rojos no tocar", "WARNING: red eyes, do not touch"],
      sp: ["..G.....G..", "...G...G...", "..YYYYYYY..", "GYYRYYYRYYG", ".YYKYQYKYY.", "GYYYYQYYYYG", ".YYQYQYQYY.", "G.YYYQYYY.G", "...YY.YY..."] },
    // Dos unidos por un rayo en carriles distintos: al atrapar uno, el otro espera medio segundo. Si se alcanza, valen doble
    gemelo: { n: "GEMELOS", pts: 20, m: null, aviso: ["OK: atrapa uno y corre por el otro", "OK: catch one, dash for the other"],
      sp: [".CC.....CC.", "CWCC...CCWC", "CKCC...CCKC", "CCCCWWWCCCC", ".CC.WWW.CC.", "CCCCWWWCCCC", "C.CC...CC.C", "C..C...C..C", "..........."] },
    // Con casco: el primer toque lo hace rebotar al carril de al lado; el segundo lo atrapa
    acorazado: { n: "ACORAZADO", pts: 40, m: { G: "#c9c6b8", Z: "#8a4a10" }, aviso: ["OK: hay que atraparlo dos veces", "OK: it takes two catches"],
      sp: ["..GGGGGGG..", ".GGGWGWGGG.", "GGGGGGGGGGG", "GNNNNNNNNNG", ".NWNNNNNWN.", ".NKNNZNNKN.", "GNNNNZNNNNG", ".NNZNZNZNN.", "..NN...NN.."] },
    // Se ve al salir y al llegar; en medio desaparece
    fantasma: { n: "FANTASMA", pts: 25, m: { W: "#dce6ff" }, aviso: ["ALERTA: recuerda su carril", "WARNING: remember its lane"],
      sp: ["...WWWWW...", "..WWWWWWW..", ".WWKWWWKWW.", ".WWKWWWKWW.", ".WWWWWWWWW.", ".WWWWKWWWW.", ".WWWWWWWWW.", ".WW.WWW.WW.", ".W...W...W."] },
    // Al atraparla estalla y se lleva todo lo que haya en pantalla
    bomba: { n: "BOMBA", pts: 30, m: { K: "#565c78", G: "#c9c6b8" }, aviso: ["OK: atrapala y limpia todo", "OK: catch it to clear the screen"],
      sp: [".......Y...", "......N....", ".....G.....", "...KKKKK...", "..KKWKKKK..", ".KKWKKKKKK.", ".KKKKKKKKK.", "..KKKKKKK..", "...KKKKK..."] },
    // Baja en zigzag: cambia de carril con cada golpe de la música
    polilla: { n: "POLILLA", pts: 25, m: null, aviso: ["ALERTA: cambia de carril al golpe", "WARNING: it switches lanes on beat"],
      sp: ["M.........M", "MM.......MM", "MMM.PPP.MMM", "MMMMPWPMMMM", ".MMMPKPMMM.", "..MMPPPMM..", "...M.P.M...", "....P.P....", "..........."] },
    // Un huevo lento: si toca el piso, suelta tres crías que rebotan y vuelven a caer
    nido: { n: "NIDO", pts: 50, m: null, aviso: ["ALERTA: que no toque el piso", "WARNING: keep it off the floor"],
      sp: ["....WWW....", "...WWWWW...", "..WWWVWWW..", "..WWVVWWW..", ".WWWWWWVWW.", ".WWVWWWWWW.", ".WWWWWVWWW.", "..WWWWWWW..", "...WWWWW..."] },
    // De ayuda: por unos segundos BIT atrapa también los carriles de al lado. No castiga si se escapa
    reloj: { n: "RELOJ", pts: 20, m: null, aviso: ["OK: ayuda, atrapas 3 carriles", "OK: help, you catch 3 lanes"],
      sp: ["...CCCCC...", "..CWWWWWC..", ".CWWWKWWWC.", ".CWWWKWWWC.", ".CWWWKKKWC.", ".CWWWWWWWC.", ".CWWWWWWWC.", "..CWWWWWC..", "...CCCCC..."] },
  };
  BICHOS.troyaOk = BICHOS.troya;
  const GUSANO_CUERPO = ["...........", "...........", "...VVVVV...", "..VVVVVVV..", "..VVZVZVV..", "..VVVVVVV..", "...VVVVV...", "...........", "..........."];
  const CRIA = ["...........", "...........", "...........", "....VVV....", "...VWVWV...", "...VVVVV...", "....V.V....", "...........", "..........."];
  // Qué bichos con maña salen en cada tramo de cada canción (se van turnando). En el vuelo no sale ninguno
  const REPARTO = {
    uia: [[], ["gusano", "polilla"], ["fantasma", "nido"], ["gemelo", "acorazado", "troya", "gusano"], ["bomba", "polilla", "bomba"], ["fantasma", "reloj", "nido"], ["gemelo", "troyaOk", "acorazado", "troya"], [], ["fantasma", "nido", "reloj"], []],
    grimorio: [[], ["gusano", "polilla"], ["gemelo", "acorazado"], ["bomba", "polilla", "acorazado"], [], ["nido", "reloj"], ["gemelo", "bomba", "polilla", "troyaOk"]],
    funk: [[], ["gusano", "reloj"], ["polilla", "gemelo", "bomba"], ["gemelo", "troya", "polilla", "gusano"], ["bomba", "acorazado", "troyaOk", "polilla"], ["fantasma", "nido", "reloj"], ["gusano", "gemelo", "troya", "acorazado"], ["bomba", "polilla", "bomba"], [], ["reloj"], ["gusano", "reloj", "troyaOk"], ["polilla", "bomba"], [], ["bomba", "gemelo", "polilla", "troyaOk", "acorazado"]],
    doom: [[], ["gusano", "troyaOk", "nido"], ["polilla", "acorazado", "bomba"], ["gemelo", "troya", "polilla", "gusano"], ["bomba", "acorazado", "gemelo", "troyaOk"], ["reloj", "fantasma"], ["bomba", "polilla"], [], ["bomba", "gemelo", "polilla", "troyaOk"], ["reloj"]],
  };
  const esTrampa = (o) => o.tipo === "mal" || o.tipo === "troya";
  const ANTIVIRUS = ["..WWWWWWW..", ".WWWWVWWWW.", "WWWWWVWWWWW", "WWWWWVWWWWW", "WWVVVVVVVWW", "WWWWWVWWWWW", "WWWWWVWWWWW", ".WWWWVWWWW.", "..WWWWWWW.."];
  const BUG = ESPECIES.A;
  const ORO = BUG.map((f) => f.map((fila) => fila.replace(/R/g, "Y").replace(/Z/g, "Q")));
  const BW = 11, BH = 9;
  // Niveles de combo: al llegar a cada uno sube el multiplicador medio punto y salta su letrero
  const NIVELES = [[5, "BIEN", "NICE"], [10, "GENIAL", "GREAT"], [15, "SUPER", "SUPER"], [20, "BRUTAL", "BRUTAL"], [30, "MEGA", "MEGA"], [40, "ULTRA", "ULTRA"],
    [50, "HIPER", "HYPER"], [75, "BESTIAL", "SAVAGE"], [100, "IMPARABLE", "UNSTOPPABLE"], [150, "LEGENDARIO", "LEGENDARY"], [200, "DIVINO", "GODLIKE"], [300, "BIT SUPREMO", "BIT SUPREME"]];
  // El grito de cada nivel de racha: la palabra que cae de golpe sobre BIT (igual en los dos idiomas, como en las maquinitas)
  const GRITOS = ["NICE", "GREAT!", "COMBO!", "AMAZING!", "WOW ?!!", "EXCEPTIONAL", "INSANE!!", "UNREAL ?!?!", "UNSTOPPABLE", "LEGENDARY", "GODLIKE ?!!", "BIT SUPREME"];
  const TONOS_COMBO = ["#ffffff", "#38BDF8", "#41B883", "#ffe14a", "#F28C28", "#ff3fb4", "#A259FF", "#ff4d4d", "#00f6ff", "#7dff3c", "#ffd23b", "#ffffff", "#ff2e7e"];
  // Los colores de la estela de BIT, en orden
  const SANDE = ["#00f6ff", "#00a2ff", "#6a5cff", "#c84bff", "#ff3fb4", "#ff5a4a", "#ffb13b", "#f7ff4a", "#5dff7a"];
  const CAFE = ["..W..W..", "...W..W.", "WWWWWW..", "WQQQQWWW", "WQQQQW.W", "WQQQQWWW", ".WWWW..."];
  const FUENTE = {};
  // Letras, números y signos de 3×5: cada uno son 15 unos y ceros, renglón por renglón
  Object.entries({
    0: "111101101101111", 1: "010110010010111", 2: "111001111100111", 3: "111001111001111", 4: "101101111001001", 5: "111100111001111", 6: "111100111101111", 7: "111001010010010", 8: "111101111101111", 9: "111101111001111",
    A: "010101111101101", B: "110101110101110", C: "111100100100111", D: "110101101101110", E: "111100110100111", F: "111100110100100", G: "011100101101011", H: "101101111101101", I: "111010010010111",
    J: "001001001101010", K: "101101110101101", L: "100100100100111", M: "101111111101101", N: "110101101101101", O: "010101101101010", P: "110101110100100", Q: "010101101110011", R: "110101110101101",
    S: "011100010001110", T: "111010010010010", U: "101101101101111", V: "101101101101010", W: "101101111111101", X: "101101010101101", Y: "101101010010010", Z: "111001010100111",
    "+": "000010111010000", "-": "000000111000000", ".": "000000000000010", ":": "000010000010000", "\\": "100100010001001", ">": "100010001010100", "/": "001001010100100", "%": "101001010100101",
    "!": "010010010000010", "_": "000000000000111", ",": "000000000010100", "?": "110001010000010", "=": "000111000111000", "'": "010010000000000", "*": "000101010101000",
  }).forEach(([k, v]) => { FUENTE[k] = [0, 3, 6, 9, 12].map((i) => v.slice(i, i + 3)); });
  const svg = (rows, px) => (P() ? P().svg(rows, px) : "");

  Object.assign(BB, { $, ANTIVIRUS, BH, BICHOS, BUG, BW, CAFE, CAMPANA, CANCIONES, CORAZON, CORAZON_VACIO, CRIA, DEMONIO, DM, ESPECIES, FK, FUENTE, G, GRITOS, GUSANO_CUERPO, LICHE, LOGROS, MUTA, MUTA_D, MUTA_F, MUTA_G, NIVELES, ORO, ORO_MAPA, P, REPARTO, RM, RUNA, SANDE, SND, T, TONOS_COMBO, UIA, azar, doc, esTrampa, guarda, kb, lee, pig, svg, tactil });
})();
