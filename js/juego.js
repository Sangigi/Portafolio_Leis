/* ---------- BIT & BUGS: el minijuego del GAME OVER ----------
   Sale al contestar N en el CONTINUE? (tecla J o el botón). Tiene dos modos:

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

   Cómo está ordenado este archivo:
     1. Utilidades y datos fijos (sprites, especies, niveles de combo, fuente chica)
     2. La ventana del juego (lo que se agrega a la página) y sus piezas
     3. Estado de la partida
     4. Sonido, medidas y dibujo básico
     5. Marcador
     6. La línea de comandos de la terminal (avisos)
     7. Las ventanas de combo
     8. Pantallas: estante de disquetes, selector de tramos, pausa y final del modo clásico
     9. Modo ritmo: audio, arranque, final (cuenta y resultado), créditos, daño y vidas
    10. Modo ritmo: el paso de cada cuadro (notas, bugs, ataques)
    11. Movimiento de BIT y el paso del modo clásico
    12. Dibujo del recuadro del juego
    13. Escenarios del modo ritmo (los del gato y los del GRIMORIO), el gato y el lienzo de efectos
    14. Teclado, puntero, abrir y cerrar */
(() => {
  "use strict";
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
  let cancionI = Math.max(0, Math.min(CANCIONES.length - 1, +(lee("bitBugsCancion") || 0) || 0)), R = CANCIONES[cancionI] || null;
  const G = () => !!R && R.tema === "grimorio";
  // UIA() = el nivel del gato (el que no trae tema) · DM() = el nivel DOOM CROSSING
  const UIA = () => !!R && !R.tema, DM = () => !!R && R.tema === "doom", FK = () => !!R && R.tema === "funk";

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
    ["D", { R: "#3fff8a", Z: "V" }], ["H", { R: "#ff3fb4", Z: "#00f6ff" }], ["I", { R: "#9be8ff", Z: "W" }], ["J", { P: "#00f6ff", Z: "W", K: "W" }], ["A", { R: "#ffd23b", Z: "N" }]];
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
    funk: [[], ["gusano", "reloj"], ["polilla", "gemelo", "bomba"], ["gemelo", "troya", "polilla", "gusano"], ["bomba", "acorazado", "troyaOk", "polilla"], ["fantasma", "nido", "reloj"], ["gusano", "gemelo", "troya", "acorazado"], ["bomba", "polilla", "bomba"], ["fantasma", "nido", "reloj"], [], ["bomba", "gemelo", "polilla", "troyaOk", "acorazado"]],
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

  /* ---------- 2. La ventana del juego: marcador, recuadro, lienzo de efectos y ventanitas de combo ---------- */
  const el = document.createElement("div");
  el.className = "juego";
  el.hidden = true;
  el.tabIndex = -1;
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", "BIT & BUGS");
  el.innerHTML = `
    <canvas class="juego-fx" aria-hidden="true"></canvas>
    <div class="juego-hud">
      <span><span>PUNTOS</span> <b class="j-pts">000000</b></span>
      <span><span>RECORD</span> <b class="j-rec">000000</b></span>
      <span><span class="j-ver-k">VERSION</span> <b class="j-ver">v1.0</b></span>
      <span class="j-vidas" role="img"></span>
    </div>
    <div class="juego-marco"><canvas class="juego-lienzo"></canvas><div class="juego-msg" aria-live="polite"></div></div>
    <p class="juego-ayuda">← → o A D para mover · P pausa · ESC salir</p>
    <div class="j-ventana" hidden aria-hidden="true"><div class="jv-bar"><i></i><span>COMBO.EXE</span><em>x</em></div><div class="jv-c"><b class="jv-n">0</b><span class="jv-t"></span></div></div>
    <div class="j-trans" aria-hidden="true">${"<i></i>".repeat(10)}</div>
    <div class="j-grito" hidden aria-hidden="true"><em></em><b></b><i></i></div>
    <div class="j-audio" hidden aria-hidden="true"><div class="ja-bar"><i></i><span>AUDIO.EXE</span><em>x</em></div><div class="ja-c"><b class="ja-t"></b><span class="ja-a"></span><span class="ja-d"></span></div></div>`;
  document.body.appendChild(el);
  const lienzo = $(".juego-lienzo", el), ctx = lienzo.getContext("2d"), fx = $(".juego-fx", el), c2 = fx.getContext("2d"), marco = $(".juego-marco", el), msg = $(".juego-msg", el);
  // Doce ventanitas iguales: se usan las que hagan falta según la racha
  const vBase = $(".j-ventana", el), VENT = [];
  for (let i = 0; i < 12; i++) {
    const v = i ? vBase.cloneNode(true) : vBase;
    if (i) el.appendChild(v);
    VENT.push({ el: v, tit: $(".jv-bar span", v), num: $(".jv-n", v), txt: $(".jv-t", v), T: 0, lugar: -1 });
  }
  const aEl = $(".j-audio", el), gEl = $(".j-grito", el), trEl = $(".j-trans", el);
  const ptsEl = $(".j-pts", el), recEl = $(".j-rec", el), verEl = $(".j-ver", el), verK = $(".j-ver-k", el), vidasEl = $(".j-vidas", el);

  /* ---------- 3. Estado de la partida ---------- */
  // Medidas: el recuadro del juego (W × H pixeles propios, a 'escala' pixeles de pantalla cada uno), su lugar en la
  // pantalla (rectL) y el lienzo de efectos, que cubre todo con el mismo tamaño de pixel (FW × FH; el recuadro empieza en gx, gy)
  let W = 200, H = 140, escala = 4, col = {}, rectL = null;
  let FW = 320, FH = 180, gx = 60, gy = 20;
  // El piso es la línea de comandos de la terminal: una franja de 7 pixeles con una casilla por carril
  const piso = () => H - 7, bitY = () => piso() - 12;
  // Carriles: BIT y los bugs van por 5 columnas (pocas, para que cada salto cuente)
  const carriles = 5;
  let LW = 40;
  const xBit = (c) => Math.round(c * LW + LW / 2 - 5), xBug = (c) => Math.round(c * LW + LW / 2 - 5.5);

  // El reloj del juego y en qué pantalla está: "titulo", "dificultad", "cargando", "jugando", "pausa" o "fin"
  let raf = 0, ult = 0, acum = 0, t = 0;
  let modo = "clasico", estado = "titulo", deApagado = false, bloqueamos = false, volverA = null;

  // Común a los dos modos: puntos, lo que hay en pantalla y BIT
  let pts = 0, nuevoRecord = false, objs = [], textos = [], grietas = [], destellos = [], chispas = [], ondas = [], fantasmas = [];
  let bit = { c: 2, x: 95, y: 120 }, boca = "n", bocaT = 0, parpadeo = 0, temblor = 0;
  // Controles: teclas apretadas, repetición al mantenerlas y hacia dónde apunta el mouse o el dedo
  let izq = false, der = false, arr = false, aba = false, dirTecla = 0, rep = 0, meta = null, metaY = null;
  // Cómo se siente BIT: se aplasta al frenar, se estira al correr, brilla y brinca al atrapar; el recuadro da un golpecito (punch)
  let aplasta = 0, estira = 0, brillo = 0, brinco = 0, punch = 0;
  // Casillas del piso que se encienden al atrapar, y la pista de controles del arranque
  let celdas = [0, 0, 0, 0, 0], pistaT = 0, atrapadosPista = 0;

  // Modo clásico: vidas, versión (nivel), cuánto falta para el siguiente bug, récord y su letrero central
  let vidas = 3, nivel = 0, sig = 0, record = +(lee("bitBugsRecord") || 0), mensaje = "", mensajeT = 0;

  // Modo ritmo: la canción. ts = segundo que suena; rI y rG = siguiente nota y siguiente bombo; secI = escenario actual
  const audios = {};
  let audio = null, intentoN = 0, ts = 0, ultA = -1, ultP = 0, desdeIni = 0;
  let rI = 0, rG = 0, golpeN = 0, pulso = 0, secI = -1, cambio = 0, energiaAhora = 0, vu = 0, anillos = [];
  // Qué notas salen en esta partida (según la dificultad) y de qué tipo
  let activa = [], tipoRun = [], totalNotas = 0;
  // Racha y premios
  let combo = 0, maxCombo = 0, atrapados = 0, recordR = 0;
  // Fiebre (hasta qué segundo dura): mientras tanto todo es de premio y cada bug vale más que el anterior
  let fiebre = 0, fiebreN = 0, fiebreTotal = 0;
  // La estela de BIT: copias de colores que se quedan atrás al moverse en las partes fuertes
  let ecos = [], ecoN = 0, burbujas = [];

  /* Dificultad del modo ritmo. vidas: cuántas tiene BIT · paso: cuántos bugs caídos cuestan una vida · regen: cada cuántos
     seguidos recupera una · vel: cuánto tarda en caer un bug (más = más lento) · gap / gapVuelo: separación mínima entre bugs
     (los que quedan más juntos no salen) · tope: filas de memoria del jefe · rayo / rayoV: cada cuántos bombos dispara el gato
     (jefe / vuelo) · invul: cuadros a salvo tras perder una vida · arcoVuelo: cada cuántos bugs del vuelo sale un arcoíris */
  const DIFS = {
    facil: { n: ["FACIL", "EASY"], vidas: 5, paso: 3, regen: 25, vel: 1.18, gap: 0.34, gapVuelo: 0.66, tope: 10, rayo: 5, rayoV: 4, invul: 100, arcoVuelo: 18 },
    medio: { n: ["MEDIO", "NORMAL"], vidas: 4, paso: 2, regen: 35, vel: 1, gap: 0, gapVuelo: 0.54, tope: 8, rayo: 4, rayoV: 3, invul: 75, arcoVuelo: 23 },
    dificil: { n: ["DIFICIL", "HARD"], vidas: 3, paso: 1, regen: 45, vel: 0.86, gap: 0, gapVuelo: 0.42, tope: 6, rayo: 3, rayoV: 2, invul: 55, arcoVuelo: 29 },
  };
  let dif = DIFS[lee("bitBugsDif")] ? lee("bitBugsDif") : "medio", D = DIFS[dif];
  // Vidas de BIT en ritmo, bugs caídos desde la última vida perdida, cuadros a salvo, reintentos y el parpadeo del corazón
  let vidasR = 4, fallosVida = 0, invul = 0, continues = 0, vidaFx = 0;
  // Fallar un bug: BIT lastimado, interferencia en el escenario y la música baja un instante
  let dano = 0, interferencia = 0, agachaT = 0;
  // Si BIT cayó, y el punto de control del escenario donde iba (para reintentar desde ahí)
  let muerto = false, foto = null;

  // El jefe (escenario 5): GATO.EXE llena la memoria. Cada bug que cae sube una fila; al llegar a JEFE_TOPE, el programa truena.
  // Cada bug atrapado la baja JEFE_BAJA. peligroVis es lo que se dibuja, que persigue suave al valor real
  const JEFE_BAJA = 0.34;
  let JEFE = 4, JEFE_TOPE = 8, peligro = 0, peligroVis = 0, jefeAviso = false;
  // Vuelo libre (escenario 8): BIT deja los carriles y se mueve por todo el recuadro; los bugs cruzan de lado
  const CRUCE = 3.3, CRUCE_LENTO = 4.3;
  let VUELO = 7;
  let vuela = false, vx = 0, vy = 0, vueloAviso = false;
  // Ataques del gato: rayos que avisan y caen con el siguiente bombo
  let ataques = [], rayoN = 0;
  // Hasta qué segundo dura la ayuda del reloj (BIT atrapa también los carriles de al lado)
  let iman = 0;
  // El jefe del gato también llena la memoria por su cuenta: cuándo toca el siguiente llenado y si ya lo anunció
  let llenaT = 0, llenaAviso = false, llenaN = 0;

  // La línea de comandos dentro de la terminal de BIT (C:\\>VUELO.EXE ... COMPLETO) y lo que ya se avisó una vez
  let orden = null, dichos = {};
  // Ventanas de combo: las que esperan turno, los puntos del último bug y cuándo sonó el último premio
  let colaV = [], ultN = 10, vUltSon = 0;
  // Qué tan tensa está la terminal (0 a 1): con tensión, la propia ventana de BIT se llena de interferencia
  let tension = 0;
  // Cámara del escenario: un acercamiento que late en las partes fuertes y sigue al gato en las tranquilas
  let zoom = 1, focoX = 0, focoY = 0;
  // El gato: cuánto lleva girado y a qué velocidad. El espectro del horizonte de la Ciudad Neón
  let giro = 0, vGiro = 0.3;
  // Nivel GRIMORIO: la luz de la linterna de BIT (0 a 1; lo que se dibuja la persigue suave)
  let luz = 0.75, luzVis = 0.75;
  // Nivel DOOM CROSSING: las campanas que se juntan en el pueblo y los escudos que compran al entrar al infierno
  const CAMPANAS_ESCUDO = 12;
  let campanas = 0, escudo = 0;
  const mundoDe = (i) => (R.mundos ? R.mundos[i] : "");
  // Nivel FUTURE FUNK: el groove (0 a 8). Sube con cada salto que cae en el golpe de la música y hace que cada bug valga más
  // (hasta el doble); si se deja de bailar, baja solo. grooveT = segundo del último salto al compás · grooveFx = su destello
  const GROOVE_MAX = 8;
  let groove = 0, grooveT = 0, grooveFx = 0;
  /* El tramo lateral (R.lateral): la terminal se encoge y se va a la izquierda, BIT se mueve de arriba abajo por cinco filas
     y los bugs le llegan de lado, desde la derecha. latK va de 0 a 1 mientras la terminal se acomoda.
     teles = los segundos en que BIT es cambiado de fila a la fuerza (R.teles) y teleI por cuál va */
  let lateral = false, latK = 0, teles = [], teleI = 0, rect0 = null, movida = false;
  const filaY = (c) => Math.round(14 + c * ((piso() - 28) / (carriles - 1)));
  // Los destellos que lo ciegan todo, fondo, terminal y BIT (R.destellos: [tramo que termina en blanco, segundos de subida]):
  // devuelve qué tan blanco va (0 a 1). Sube despacio y al final de golpe; ya en el tramo siguiente se apaga en medio segundo
  const fogonazo = () => {
    if (!R || !R.destellos || modo !== "ritmo") return 0;
    for (const [i, sube] of R.destellos) { const fin = R.sec[i][1]; if (ts > fin - sube && ts <= fin) return Math.pow((ts - (fin - sube)) / sube, 3); if (ts > fin && ts < fin + 0.55) return 1 - (ts - fin) / 0.55; }
    return 0;
  };
  // El recuadro que se lleva todo al final del tramo R.caja: de 1 (pantalla completa) a casi 0
  const cajaS = () => {
    if (RM || !R || R.caja == null || modo !== "ritmo" || estado !== "jugando" || secI !== R.caja) return 1;
    const falta = R.sec[secI][1] - ts;
    return falta > 1.1 ? 1 : Math.max(0.06, Math.pow(Math.max(0, falta) / 1.1, 1.6));
  };
  // Pantallas: disco elegido en el estante, tramo elegido en la cinta, tramo que se practica (null = canción entera),
  // en qué va la pantalla final ("conteo", "resultado", "practica", "crash", "clasico") y sus datos
  let selDisco = Math.max(0, Math.min(3, +(lee("bitBugsDisco") || 0) || 0)), selTramo = 0, practica = null, finModo = "", finN = 0, res = null;
  // Bugs atrapados y totales de cada tramo [ok, total], y los créditos del arranque (cuadros desde que empezó; -1 = ya pasaron)
  let tramos = [], cred = -1;
  // El cierre de un nivel: destello con estrellas, todo a negro y la llave que hay que recoger para ver los resultados.
  // cierre = { t: cuadros que lleva, fase: "luz" | "llave" | "toma" | "fin", c: carril de la llave, y: su altura, tt: cuadros de la fase }
  // negro = el escenario se queda apagado detrás de los resultados · destello = el fogonazo con que aparecen
  let cierre = null, negro = false, destello = 0, nuevaCancion = null;
  // El telón entre pantallas: mientras cubre, no se atienden teclas
  let enTrans = false, transN = 0;
  const LLAVE = [".YYYYY.", "YY...YY", "Y.....Y", "YY...YY", ".YYYYY.", "...Y...", "...Y...", "...YYY.", "...Y...", "...YYY.", "...Y..."];
  const espectro = [];

  /* ---------- 4. Sonido, medidas y dibujo básico ---------- */
  // Sonidos de 8 bits hechos al vuelo (respetan el botón de sonido del sitio)
  let ac = null;
  function bip(f1, f2, dur, tipo = "square", vol = 0.05, retraso = 0) {
    if (SND.silencio && SND.silencio()) return;
    try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    const t0 = ac.currentTime + retraso, o = ac.createOscillator(), g = ac.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(f1, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(ac.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  // El área de juego se adapta a la pantalla: más alta en el teléfono, más ancha en la computadora
  function medir() {
    const r = marco.getBoundingClientRect();
    W = r.width > 700 ? 200 : 140;
    H = Math.max(110, Math.min(240, Math.round((W * r.height) / r.width)));
    escala = Math.min(r.width / W, r.height / H);
    if (escala >= 3) escala = Math.floor(escala);
    lienzo.width = W;
    lienzo.height = H;
    lienzo.style.width = `${Math.floor(W * escala)}px`;
    lienzo.style.height = `${Math.floor(H * escala)}px`;
    LW = W / carriles;
    bit.c = Math.min(bit.c, carriles - 1);
    bit.x = xBit(bit.c);
    // El lienzo de efectos se alinea pixel con pixel con el del juego
    lienzo.style.transform = ""; lienzo.style.transformOrigin = "";
    const rl = lienzo.getBoundingClientRect();
    rectL = rl; rect0 = rl;
    gx = Math.round(rl.left / escala);
    gy = Math.round(rl.top / escala);
    const izq0 = rl.left - gx * escala, arr0 = rl.top - gy * escala;
    FW = Math.ceil((window.innerWidth - izq0) / escala) + 1;
    FH = Math.ceil((window.innerHeight - arr0) / escala) + 1;
    fx.width = FW;
    fx.height = FH;
    fx.style.left = `${izq0}px`;
    fx.style.top = `${arr0}px`;
    fx.style.width = `${FW * escala}px`;
    fx.style.height = `${FH * escala}px`;
    if (!aEl.hidden) ponAudio(aEl.dataset.d);
    // Las tramas guardadas dependen del tamaño del lienzo: al cambiar, se vuelven a pintar
    tramas = {};
  }
  // Si el marcador cambia de alto (en el teléfono ocupa dos renglones en ritmo), el recuadro se vuelve a medir
  if (window.ResizeObserver) new ResizeObserver(() => { if (!el.hidden) medir(); }).observe(marco);
  const leeCol = () => {
    col = {
      W: pig("--p-blanco"), Y: pig("--p-amarillo"), R: pig("--p-rojo"), G: pig("--p-gris"), K: pig("--p-negro"), Q: pig("--amarillo-oscuro"),
      Z: pig("--rojo-oscuro"), D: pig("--p-gris-osc"), F: pig("--p-negro"),
      B: pig("--p-azul"), C: pig("--p-cian"), P: pig("--p-rosa"), M: pig("--p-morado"), N: pig("--p-naranja"), V: pig("--p-verde"),
    };
  };
  // mapa: cambia unas letras por otras (los colores de cada especie)
  function pinta(rows, x, yy, mapa) {
    const X = Math.round(x), Y = Math.round(yy);
    rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const c = r[i]; if (c === ".") continue; ctx.fillStyle = col[(mapa && mapa[c]) || c] || (mapa && mapa[c]); ctx.fillRect(X + i, Y + j, 1, 1); } });
  }
  // Texto con la fuente pixelada y borde negro, para los puntos que saltan
  function rotulo(txt, x, y, c, escala = 1) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(escala, escala);
    ctx.font = `8px "Press Start 2P"`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#000000";
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ctx.fillText(txt, dx, dy);
    ctx.fillStyle = c;
    ctx.fillText(txt, 0, 0);
    ctx.restore();
  }
  // Azar que no cambia dentro del mismo cuadro (para los efectos de interferencia)
  const h2 = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  // El sprite pintado de un solo color, y su contorno negro de un pixel
  function silueta(rows, x, yy, c) {
    const X = Math.round(x), Y = Math.round(yy);
    ctx.fillStyle = c;
    rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== ".") ctx.fillRect(X + i, Y + j, 1, 1); });
  }
  function contorno(rows, x, yy) {
    const X = Math.round(x), Y = Math.round(yy);
    ctx.fillStyle = "#000000";
    rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== ".") ctx.fillRect(X + i - 1, Y + j - 1, 3, 3); });
  }
  function letras(txt, x, yy, c) {
    ctx.fillStyle = col[c] || c;
    [...txt].forEach((ch, k) => (FUENTE[ch] || []).forEach((r, j) => { for (let i = 0; i < 3; i++) if (r[i] === "1") ctx.fillRect(Math.round(x) + k * 4 + i, Math.round(yy) + j, 1, 1); }));
  }
  /* ---------- 5. Marcador: puntos, récord, BPM o versión, y las vidas ---------- */
  const seis = (n) => String(n).padStart(6, "0");
  function hud() {
    el.classList.toggle("ritmo", modo === "ritmo");
    ptsEl.textContent = seis(pts);
    if (modo === "ritmo") {
      recEl.textContent = seis(Math.max(recordR, pts));
      verK.textContent = "BPM";
      verEl.textContent = R.sec[Math.max(0, secI)][3];
      vidasEl.innerHTML = Array.from({ length: D.vidas }, (_, i) => svg(i < vidasR ? CORAZON : CORAZON_VACIO, 2)).join("") + `<span class="j-combo"><i>x${multi()}</i></span>`;
      vidasEl.setAttribute("aria-label", `${T("Vidas", "Lives")}: ${vidasR}. Combo: ${combo}`);
      return;
    }
    recEl.textContent = seis(Math.max(record, pts));
    verK.textContent = "VERSION";
    verEl.textContent = `v1.${nivel}`;
    vidasEl.innerHTML = [0, 1, 2].map((i) => svg(i < vidas ? CORAZON : CORAZON_VACIO, 2)).join("");
    vidasEl.setAttribute("aria-label", `${T("Vidas", "Lives")}: ${vidas}`);
  }
  /* ---------- 6. La línea de comandos de la terminal ----------
     Los avisos se escriben dentro de la propia terminal de BIT, en el primer renglón, como un comando:
       C:\\>VUELO.EXE_          (se teclea letra por letra, en blanco)
       COMPLETO: VUELA CON LAS 4 FLECHAS   (el resultado, en verde; los errores y alertas, en rojo)
     cmd(...) teclea el comando y enseguida da su resultado. Si el resultado va en null, el comando se queda esperando
     hasta que cmdRes(...) lo complete: así el vuelo y el jefe se anuncian unos segundos antes de empezar. */
  const limpiaTxt = (txt) => txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[¡¿]/g, "").toUpperCase();
  const esMal = (txt) => /^(ERROR|ALERTA|WARNING)/.test(txt);
  function cmd(es, en, resEs, resEn, clave) {
    if (estado !== "jugando" && estado !== "cierre") return;
    if (clave) { if (dichos[clave]) return; dichos[clave] = 1; }
    const res = resEs == null ? null : limpiaTxt(T(resEs, resEn));
    orden = { cmd: limpiaTxt(`C:\\>${T(es, en)}`), n: 0, res, mal: res ? esMal(res) : false, fin: null };
    bip(1200, 0, 0.02, "square", 0.02); bip(900, 0, 0.02, "square", 0.02, 0.05);
  }
  function cmdRes(es, en) {
    const res = limpiaTxt(T(es, en));
    if (!orden) orden = { cmd: "", n: 999, res, mal: esMal(res), fin: null };
    else { orden.res = res; orden.mal = esMal(res); }
    orden.fin = orden.n;
    bip(660, 0, 0.05, "triangle", 0.035); bip(990, 0, 0.08, "triangle", 0.03, 0.05);
  }
  function pasoOrden() {
    if (!orden) return;
    orden.n++;
    // Con resultado ya dado: aparece al terminar de teclear y se queda unos cuatro segundos
    if (orden.res != null) {
      if (orden.fin == null && orden.n > orden.cmd.length / 0.7 + 16) { orden.fin = orden.n; bip(660, 0, 0.04, "triangle", 0.03); }
      if (orden.fin != null && orden.n > orden.fin + 240) orden = null;
    }
  }
  function cierraOrden() { orden = null; }
  function dibujaOrden() {
    if (!orden || (estado !== "jugando" && estado !== "cierre")) return;
    const cabe = Math.floor((W - 6) / 4), listo = orden.res != null && orden.fin != null;
    const txt = listo ? orden.res : orden.cmd.slice(0, Math.floor(orden.n * 0.7)) + ((t >> 3) % 2 ? "_" : "");
    ctx.fillStyle = "rgba(0,0,0,.82)";
    ctx.fillRect(0, 9, W, 9);
    // Recién llega el resultado, parpadea un instante
    if (listo && orden.n - orden.fin < 16 && (t >> 1) % 2) return;
    letras(txt.slice(0, cabe), 3, 11, listo ? (orden.mal ? "#ff4d4d" : "#41B883") : "#ffffff");
  }

  /* ---------- 7. Las ventanas de combo ----------
     Ventanitas de terminal que se abren un momento sobre la orilla de la terminal de BIT
     (montadas en el borde, nunca en medio) y se cierran solas. Al principio sale una de vez en cuando; conforme crece
     la racha salen más seguido y caben más a la vez, hasta parecer una lluvia de terminales. Unas traen la cuenta del
     combo, otras los puntos; las de nivel nuevo y bug arcoíris salen en colores. Cada una suena a premio. */
  function lugaresVentana() {
    const r = rectL, ancho = r.left >= 170, L = [];
    // Con espacio a los lados: dieciséis puntos alrededor del marco. En el teléfono: solo arriba y abajo, para no tapar carriles
    if (ancho) {
      for (let i = 0; i < 5; i++) { L.push([r.left, r.top + r.height * (0.12 + i * 0.19)]); L.push([r.right, r.top + r.height * (0.2 + i * 0.19)]); }
      for (let i = 0; i < 3; i++) { L.push([r.left + r.width * (0.18 + i * 0.32), r.top - (i === 1 ? 8 : 0)]); L.push([r.left + r.width * (0.2 + i * 0.3), r.bottom + (i === 1 ? 10 : 0)]); }
    } else {
      for (let i = 0; i < 4; i++) L.push([r.left + r.width * (0.14 + i * 0.24), r.top - (i % 2 ? 8 : 0)]);
      for (let i = 0; i < 3; i++) L.push([r.left + r.width * (0.2 + i * 0.3), r.bottom + 12]);
    }
    return L;
  }
  // Cuántas caben a la vez según la racha: desde los 3 seguidos ya son dos, y de ahí sube rápido
  const cupoVentanas = () => (rectL && rectL.left >= 170
    ? (combo < 3 ? 1 : combo < 8 ? 2 : combo < 15 ? 3 : combo < 30 ? 5 : combo < 60 ? 7 : combo < 100 ? 9 : 12)
    : combo < 3 ? 1 : combo < 10 ? 2 : combo < 30 ? 3 : combo < 80 ? 4 : 5);
  // Pide una o varias ventanas: salen escalonadas, con unos cuadros entre una y otra
  function pideVentanas(n, clase, dato) {
    let espera = 0;
    for (let i = 0; i < n; i++) { colaV.push({ T: espera, clase: i ? (Math.random() < 0.5 ? "pts" : "combo") : clase, dato }); espera += 4 + ((Math.random() * 9) | 0); }
    if (colaV.length > 14) colaV.splice(0, colaV.length - 14);
  }
  // clase: "combo" (la cuenta), "pts" (puntos), "nivel" (nivel nuevo, en colores), "especial" (bug especial; el arcoíris, en colores)
  function abreCombo(clase, dato) {
    if (modo !== "ritmo" || estado !== "jugando" || !rectL) return;
    const abiertas = VENT.filter((v) => v.T > 0), cupo = cupoVentanas();
    // Si ya no cabe otra, la más vieja brinca de lugar: con mucha acción casi ni alcanza a abrirse
    const v = abiertas.length < cupo ? VENT.find((x) => x.T <= 0) : abiertas.reduce((a, b) => (b.T < a.T ? b : a));
    const L = lugaresVentana(), ocupados = abiertas.filter((x) => x !== v).map((x) => x.lugar);
    let lugar = (Math.random() * L.length) | 0;
    for (let i = 0; i < L.length && (ocupados.includes(lugar) || lugar === v.lugar); i++) lugar = (lugar + 1) % L.length;
    v.lugar = lugar;
    const nv = nivelCombo(), arco = clase === "nivel" || dato === "arco" || fiebre > ts;
    v.el.className = `j-ventana${rectL.left >= 170 ? "" : " chica"}${arco ? " arco" : ""}${clase === "pts" ? " mini" : ""}`;
    if (arco) v.el.style.removeProperty("--c"); else v.el.style.setProperty("--c", clase === "especial" ? "#ffe14a" : TONOS_COMBO[Math.min(nv, TONOS_COMBO.length - 1)]);
    if (clase === "pts") { v.tit.textContent = "SCORE.EXE"; v.num.textContent = `+${typeof dato === "number" ? dato : ultN}`; v.txt.textContent = seis(pts); }
    else if (clase === "nivel") { v.tit.textContent = "NIVEL.EXE"; v.num.textContent = `x${multi()}`; v.txt.textContent = T(NIVELES[nv - 1][1], NIVELES[nv - 1][2]); }
    else if (clase === "especial") { v.tit.textContent = "BONUS.EXE"; v.num.textContent = { oro: "+50", arco: "x2", anti: "MEM-", glitch: "+25" }[dato] || (BICHOS[dato] ? `+${typeof ultN === "number" ? ultN : ""}` : "+"); v.txt.textContent = { oro: T("DORADO", "GOLDEN"), arco: T("FIEBRE", "FEVER"), anti: "ANTIVIRUS", glitch: "GLITCH" }[dato] || (BICHOS[dato] ? BICHOS[dato].n : ""); }
    else { v.tit.textContent = "COMBO.EXE"; v.num.textContent = combo; v.txt.textContent = (nv ? `${T(NIVELES[nv - 1][1], NIVELES[nv - 1][2])} x${multi()}` : `x${multi()}`) + (secI === JEFE ? ` · MEM ${Math.round((peligro / JEFE_TOPE) * 100)}%` : ""); }
    v.el.hidden = false;
    const [x, y] = L[lugar], w = v.el.offsetWidth || 136, hh = v.el.offsetHeight || 60;
    v.el.style.left = `${Math.round(Math.max(w / 2 + 6, Math.min(window.innerWidth - w / 2 - 6, x)))}px`;
    v.el.style.top = `${Math.round(Math.max(hh / 2 + 6, Math.min(window.innerHeight - hh / 2 - 6, y)))}px`;
    if (!RM) { void v.el.offsetWidth; v.el.classList.add("abre"); }
    // Juegan con los tiempos: unas apenas parpadean, la mayoría dura un segundo y pico, y algunas se quedan un buen rato
    const azarT = Math.random();
    v.T = azarT < 0.3 ? 20 + ((Math.random() * 18) | 0) : azarT < 0.8 ? 55 + ((Math.random() * 45) | 0) : 130 + ((Math.random() * 70) | 0);
    // Premio para el oído: tres notas brillantes que suben, más agudas con cada nivel. Si salen muy juntas, suena solo un toque
    const base = 783.99 * Math.pow(2, Math.min(nv, 12) / 12) * (clase === "pts" ? 1.26 : 1);
    if (t - vUltSon > 14) { bip(base, 0, 0.09, "triangle", 0.055); bip(base * 1.5, 0, 0.12, "triangle", 0.045, 0.055); bip(base * 2, 0, 0.2, "sine", 0.04, 0.11); bip(base * 4, 0, 0.05, "square", 0.01, 0.11); }
    else if (t - vUltSon > 4) bip(base * 2, 0, 0.06, "triangle", 0.022);
    vUltSon = t;
  }
  // Al romperse el combo, las que estén abiertas se ponen rojas y se cierran
  function rompeVentanas() {
    colaV = [];
    for (const v of VENT) if (v.T > 0) { v.el.classList.remove("arco"); v.el.classList.add("rota"); v.txt.textContent = T("COMBO ROTO", "COMBO LOST"); v.T = Math.min(v.T, 26); }
  }
  function pasoVentanas() {
    for (const v of VENT) if (v.T > 0 && --v.T === 0) v.el.hidden = true;
    for (const q of colaV) q.T--;
    while (colaV.length && colaV[0].T <= 0) { const q = colaV.shift(); abreCombo(q.clase, q.dato); }
  }
  /* El grito de racha: al subir de nivel de combo pasa un listón con la palabra. No sale siempre en el mismo sitio: cada vez
     elige un lugar distinto de la terminal (nunca encima de BIT, y de preferencia del lado contrario), algo ladeado, y se va
     en un segundo. El material del listón sube con la racha: papel, bronce, plata, oro y arcoíris.
     El multiplicador, en cambio, se queda en grande al fondo del recuadro mientras dure la racha (lo pinta dibuja()). */
  let gritoN = 0, gritoLugar = -1;
  const LUGARES_GRITO = [[0.24, 0.24], [0.76, 0.24], [0.2, 0.42], [0.8, 0.42], [0.5, 0.36], [0.27, 0.64], [0.73, 0.64]];
  function grita(nv) {
    if (!rectL || nv < 1) return;
    const n = ++gritoN, queda = Math.min(1.3, 0.85 + nv * 0.04);
    // Los lugares del lado donde está BIT y a su altura quedan fuera; tampoco se repite el anterior
    const ladoBit = (bit.x + 5) / W, libres = LUGARES_GRITO.map((_, i) => i).filter((i) => i !== gritoLugar && !(LUGARES_GRITO[i][1] > 0.5 && Math.abs(LUGARES_GRITO[i][0] - ladoBit) < 0.3));
    gritoLugar = libres[(Math.random() * libres.length) | 0];
    const [lx, ly] = LUGARES_GRITO[gritoLugar];
    $("b", gEl).textContent = GRITOS[Math.min(nv, GRITOS.length) - 1];
    $("em", gEl).textContent = `x${1 + nv * 0.5}`;
    gEl.className = `j-grito g-${nv < 3 ? "papel" : nv < 5 ? "bronce" : nv < 7 ? "plata" : nv < 10 ? "oro" : "arco"}`;
    gEl.style.setProperty("--q", `${queda}s`);
    gEl.style.setProperty("--rot", `${(Math.random() * 10 - 5).toFixed(1)}deg`);
    gEl.style.left = `${rectL.left + rectL.width * lx}px`;
    gEl.style.top = `${rectL.top + rectL.height * ly}px`;
    // Se reinicia la animación aunque el grito anterior siga en pantalla
    gEl.hidden = true; void gEl.offsetWidth; gEl.hidden = false;
    setTimeout(() => { if (n === gritoN) gEl.hidden = true; }, (0.16 + queda + 0.22) * 1000);
  }
  function cierraVentana() { gritoN++; gEl.hidden = true; ponAudio(null); colaV = []; for (const v of VENT) { v.el.hidden = true; v.T = 0; v.lugar = -1; } }
  // Cada nivel de combo alcanzado suma medio punto al multiplicador; con fiebre, todo vale el doble
  const nivelCombo = () => { let n = 0; while (n < NIVELES.length && combo >= NIVELES[n][0]) n++; return n; };
  const multi = () => (1 + nivelCombo() * 0.5) * (fiebre > ts ? 2 : 1);

  /* ---------- 8. Pantallas: estante de disquetes, selector de tramos, pausa y final del modo clásico ---------- */
  function aviso(html) { msg.innerHTML = html; msg.hidden = !html; }
  /* Entre pantalla y pantalla no hay cortes: un telón de diez tiras entra desde los dos lados, cubre, y al abrirse
     el contenido nuevo llega en cascada (los disquetes caen a su estante uno por uno).
     irA(fn): cubre, cambia la pantalla con fn y abre. telon(): la pantalla ya cambió (al arrancar una partida el audio
     tiene que sonar dentro del mismo clic), así que empieza cubierto y solo se abre. */
  let entraN = 0;
  function entraMsg() {
    if (RM) return;
    const n = ++entraN;
    msg.classList.remove("entra"); void msg.offsetWidth; msg.classList.add("entra");
    // Se quita sola: si no, cada vez que la pantalla se vuelve a pintar (al mover la selección) se repetiría la cascada
    setTimeout(() => { if (n === entraN) msg.classList.remove("entra"); }, 1100);
  }
  function irA(fn) {
    if (RM || el.hidden) { fn(); return; }
    if (enTrans) return;
    const n = ++transN;
    enTrans = true;
    trEl.className = "j-trans cubre";
    bip(196, 784, 0.22, "square", 0.022); bip(98, 392, 0.22, "triangle", 0.03);
    setTimeout(() => {
      if (n !== transN) return;
      enTrans = false;
      if (el.hidden) { trEl.className = "j-trans"; return; }
      fn();
      entraMsg();
      trEl.className = "j-trans abre";
      bip(784, 196, 0.24, "square", 0.02);
      setTimeout(() => { if (n === transN) trEl.className = "j-trans"; }, 460);
    }, 390);
  }
  function telon() {
    if (RM || el.hidden) return;
    const n = ++transN;
    enTrans = false;
    trEl.className = "j-trans tapado";
    void trEl.offsetWidth;
    trEl.className = "j-trans abre";
    bip(784, 196, 0.24, "square", 0.02);
    setTimeout(() => { if (n === transN) trEl.className = "j-trans"; }, 460);
  }
  // De la cuenta al resultado, también con telón
  function pasaAResultado() { if (finModo !== "conteo") return; finModo = "pasa"; irA(resultado); }
  // Claves de lo que se guarda en este navegador, por canción y dificultad
  const idC = () => (R && R.id) || "uia";
  const kRec = (d) => (idC() === "uia" ? `bitBugsRitmoRecord_${d}` : `bitBugsRitmoRecord_${idC()}_${d}`);
  const kRango = (d) => `bitBugsRango_${idC()}_${d}`;
  const leeJ = (k, def) => { try { return JSON.parse(lee(k)) || def; } catch (e) { return def; } };
  const leeTramos = () => leeJ(`bitBugsTramos_${idC()}_${dif}`, []);
  const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const nomSec = (i) => T(R.sec[i][4], R.sec[i][5]);
  const btnEncender = () => (deApagado ? `<button type="button" data-j="encender">${kb("Y")}${T("ENCENDER CONSOLA", "POWER ON")}</button>` : "");
  // El crédito de la canción: el artista lleva enlace a su página
  function creditoHtml() {
    if (!R) return "";
    const a = R.artista ? (R.enlace ? `<a href="${R.enlace}" target="_blank" rel="noopener">${R.artista}</a>` : R.artista) : "";
    return `♪ ${R.titulo || ""}${a ? ` · ${a}` : ""}`;
  }

  /* El estante de disquetes: A: es el modo clásico y B:, C: y D: son las tres dificultades de la canción elegida.
     El disco elegido se levanta; su etiqueta lleva las vidas y, pegado encima, el mejor rango que se le ha sacado. */
  const DISCOS = ["clasico", "facil", "medio", "dificil"];
  // En qué fila del título está el teclado: 0 = canciones, 1 = discos
  let filaSel = 1;
  function discoHtml(i, extra, rangoFijo) {
    const k = DISCOS[i], rit = i > 0, rango = rangoFijo || (rit && R ? lee(kRango(k)) : null);
    const nombre = rit ? T(DIFS[k].n[0], DIFS[k].n[1]) : T("CLASICO", "CLASSIC");
    const vid = Array.from({ length: rit ? DIFS[k].vidas : 3 }, () => svg(CORAZON, 2)).join("");
    return `<button type="button" class="jd jd-${k}${i === selDisco ? " jm-sel" : ""} ${extra || ""}" data-disco="${i}"><span class="jd-u">${"ABCD"[i]}:</span><span class="jd-met"></span><span class="jd-et"><b>${nombre}</b><i>${vid}</i><u>${rit ? R.corto || "RITMO" : "BIT.EXE"}</u></span>${rango ? `<em class="jd-r jm-r${rango}">${rango}</em>` : ""}</button>`;
  }
  function titulo() {
    cierraVentana();
    cierraOrden();
    detieneAudio();
    estado = "titulo";
    modo = "clasico";
    practica = null; finModo = ""; finN++; cierre = null; negro = false;
    objs = []; textos = []; grietas = []; destellos = []; fantasmas = []; chispas = []; ecos = []; ondas = []; ataques = []; burbujas = []; mensaje = "";
    vuela = false; fiebre = 0; combo = 0; bit.y = bitY();
    muerto = false; peligro = peligroVis = 0; dano = 0; interferencia = 0;
    if (!R) selDisco = 0;
    hud();
    pintaTitulo();
  }
  // Una canción se abre al terminar la anterior y recoger su llave (la primera siempre está abierta)
  const cancionAbierta = (i) => i === 0 || !!lee(`bitBugsPaso_${CANCIONES[i - 1].id || "uia"}`);
  /* El título, en dos pasos que se leen de arriba abajo:
     1 · CANCION: una tarjeta por canción (las que faltan salen con candado y dicen qué hay que terminar)
     2 · DISCO: A: es el modo clásico y B:, C:, D: las dificultades de la canción elegida */
  function pintaTitulo() {
    const k = DISCOS[selDisco], rit = selDisco > 0, abierta = !R || cancionAbierta(cancionI);
    const desc = !abierta && rit ? T(`Bloqueada: termina ${CANCIONES[cancionI - 1].titulo} y recoge la llave.`, `Locked: finish ${CANCIONES[cancionI - 1].titulo} and grab the key.`) : {
      clasico: T("Sin música: los bugs se escapan del CRT. Tres vidas y cada vez más rápido.", "No music: the bugs escape from the CRT. Three lives, faster every time."),
      facil: T("5 vidas · bugs más lentos y espaciados · cada 3 caídos, una vida", "5 lives · slower, sparser bugs · every 3 dropped, one life"),
      medio: T("4 vidas · cada 2 bugs caídos, una vida", "4 lives · every 2 bugs dropped, one life"),
      dificil: T("3 vidas · bugs más rápidos · cada bug caído, una vida", "3 lives · faster bugs · every bug dropped, one life"),
    }[k];
    const rango = rit ? lee(kRango(k)) : null, rec = rit ? +(lee(kRec(k)) || 0) : record;
    const logros = Object.keys(leeJ("bitBugsLogros", {})).length;
    const tarjetas = CANCIONES.map((c, i) => {
      const ok = cancionAbierta(i), mejor = ["dificil", "medio", "facil"].map((d) => lee(`bitBugsRango_${c.id || "uia"}_${d}`)).filter(Boolean).sort((a, b) => "SABCD".indexOf(a) - "SABCD".indexOf(b))[0];
      return `<button type="button" class="jk jk-${c.tema || "uia"}${i === cancionI ? " jm-sel" : ""}${ok ? "" : " jk-x"}" data-can="${i}"><span class="jk-n">${String(i + 1).padStart(2, "0")}</span><span class="jk-p"></span><b>${ok ? c.titulo : "? ? ?"}</b><i>${ok ? `${c.artista || "-"} · ${mmss(c.dur)}` : T("BLOQUEADA", "LOCKED")}</i>${mejor ? `<em class="jm-r${mejor}">${mejor}</em>` : ""}</button>`;
    }).join("");
    aviso(`<p class="jm-t jm-t2">BIT &amp; BUGS</p>
      ${R ? `<div class="jk-caja${filaSel === 0 ? " jk-act" : ""}"><p class="jk-paso"><b>1</b> ${T("CANCION", "SONG")}</p><div class="jk-fila">${tarjetas}</div>${abierta && R.enlace ? `<p class="jk-cred">${creditoHtml()} ↗</p>` : ""}</div>` : ""}
      <div class="jk-caja${filaSel === 1 || !R ? " jk-act" : ""}"><p class="jk-paso"><b>2</b> ${T("DISCO", "DISK")}</p><div class="jd-fila${abierta ? "" : " jd-cerrado"}">${DISCOS.map((_, i) => (i === 0 || R ? discoHtml(i) : "")).join("")}</div></div>
      <p class="jd-info">${desc}</p>
      <p class="jm-p jd-rec">RECORD ${seis(rec)}${rit ? ` · ${T("RANGO", "RANK")} ${rango || "-"} · ${T("LOGROS", "BADGES")} ${logros}/${LOGROS.length}` : ""}</p>
      <p class="jm-b">${abierta || !rit ? `<button type="button" data-j="jugar">${kb("ENTER")}${T("JUGAR", "PLAY")}</button>` : ""}${rit && abierta ? `<button type="button" data-j="tramos">${kb("N")}${T("TRAMOS", "SECTIONS")}</button>` : ""}${btnEncender()}<button type="button" data-j="salir">${kb("ESC")}${T("SALIR", "QUIT")}</button></p>
      ${tactil ? "" : `<p class="jf-gris">↑ ↓ ${T("cambia de fila", "switch row")} · ← → ${T("elige", "choose")}</p>`}`);
  }
  // Primer toque: elige el disco. Segundo toque sobre el mismo: lo mete y arranca
  function eligeDisco(i, arranca) {
    i = (i + DISCOS.length) % DISCOS.length;
    if (!R) i = 0;
    if (i === selDisco && arranca && filaSel === 1) { jugar(); return; }
    selDisco = i; filaSel = 1;
    guarda("bitBugsDisco", String(i));
    bip(880, 0, 0.03, "square", 0.03);
    pintaTitulo();
  }
  function jugar() {
    practica = null;
    if (selDisco === 0) { empezar(); return; }
    // Una canción bloqueada no arranca: suena un "no" y la tarjeta lo explica
    if (!cancionAbierta(cancionI)) { bip(160, 110, 0.18, "square", 0.05); return; }
    conDif(DISCOS[selDisco]);
  }
  function conDif(k) { dif = k; D = DIFS[k]; guarda("bitBugsDif", k); empezarRitmo(); }
  // Cambiar de canción: los discos B:, C: y D: pasan a ser los de la otra canción
  function ponCancion(i) {
    detieneAudio();
    cancionI = i;
    R = CANCIONES[i];
    JEFE = R.jefe != null ? R.jefe : 4;
    VUELO = R.vuelo != null ? R.vuelo : 7;
    armaMapa();
    guarda("bitBugsCancion", String(i));
  }
  function cambiaCancion(d, directo) {
    if (CANCIONES.length < 2) return;
    const i = directo != null ? directo : Math.max(0, Math.min(CANCIONES.length - 1, cancionI + d));
    if (i === cancionI) { if (filaSel !== 0) { filaSel = 0; pintaTitulo(); } return; }
    filaSel = 0;
    ponCancion(i);
    bip(660, 990, 0.06, "triangle", 0.04);
    pintaTitulo();
    // Cambiar de canción sí trae su entrada: los discos de la otra canción caen al estante
    entraMsg();
  }

  /* El selector de tramos: la canción como una cinta, con cada tramo del largo que dura y pintado según el mejor
     resultado (verde 90% o más, amarillo 70%, rojo menos). Un tramo se abre al haber terminado el anterior. */
  const tramoAbierto = (best, j) => j === 0 || best[j - 1] != null || best[j] != null;
  function verTramos(i) {
    if (!R || selDisco === 0 || !cancionAbierta(cancionI)) return;
    dif = DISCOS[selDisco]; D = DIFS[dif];
    estado = "tramos";
    const best = leeTramos();
    // De entrada apunta al tramo más flojo
    if (i == null) { i = 0; let peor = 101; R.sec.forEach((_, j) => { if (best[j] != null && best[j] < peor) { peor = best[j]; i = j; } }); }
    i = Math.max(0, Math.min(R.sec.length - 1, i));
    selTramo = i;
    const s = R.sec[i], p = best[i], ok = tramoAbierto(best, i);
    const seg = R.sec.map((x, j) => `<button type="button" data-tramo="${j}" style="flex:${Math.round(x[1] - x[0])}" class="jc-s ${!tramoAbierto(best, j) ? "jc-x" : best[j] == null ? "jc-0" : best[j] >= 90 ? "jc-v" : best[j] >= 70 ? "jc-y" : "jc-r"}${j === i ? " jm-sel" : ""}">${j === JEFE ? T("JEFE", "BOSS") : j + 1}</button>`).join("");
    aviso(`<p class="jc-cmd">C:\\&gt; SEEK <b>${R.corto || "RITMO"}</b> · ${T(D.n[0], D.n[1])}</p>
      <div class="jc-caja"><div class="jc">${seg}</div><div class="jc-reg"><span>0:00</span><span>${mmss(R.dur / 2)}</span><span>${mmss(R.dur)}</span></div></div>
      <p class="jc-n">${i + 1} · ${nomSec(i)} <span>${mmss(s[0])} ${T("A", "TO")} ${mmss(Math.min(s[1], R.dur))}</span></p>
      <p class="jd-info">${ok ? (R.pistas && R.pistas[i] ? T(R.pistas[i][0], R.pistas[i][1]) : "") : T("Bloqueado: primero termina el tramo anterior.", "Locked: finish the previous section first.")}</p>
      <p class="jm-p jd-rec">${!ok ? T("BLOQUEADO", "LOCKED") : p == null ? T("SIN JUGAR", "NOT PLAYED") : `${T("MEJOR", "BEST")} ${p}%`}</p>
      <p class="jm-b">${ok ? `<button type="button" data-j="practica">${kb("ENTER")}${T("PRACTICAR", "PRACTICE")}</button>` : ""}<button type="button" data-j="titulo">${kb("M")}${T("VOLVER", "BACK")}</button></p>`);
  }
  // Practicar un tramo: arranca un instante antes y termina cuando el tramo se acaba. No cuenta para el récord
  function practicar(i) {
    if (i == null) i = selTramo;
    if (!R || i < 0 || !tramoAbierto(leeTramos(), i)) return;
    practica = i;
    empezarRitmo(i > 0 ? R.sec[i][0] - 1.9 : 0, { pts: 0, maxCombo: 0, atrapados: 0, cont: -1 });
  }
  // Guarda el mejor porcentaje de los tramos jugados (de 'desde' a 'hasta', sin incluir este último)
  function guardaTramos(desde, hasta) {
    const best = leeTramos();
    for (let j = desde; j < hasta && j < R.sec.length; j++) {
      const [a, b] = tramos[j] || [0, 0], p = b ? Math.round((a / b) * 100) : 100;
      if (best[j] == null || p > best[j]) best[j] = p;
    }
    guarda(`bitBugsTramos_${idC()}_${dif}`, JSON.stringify(best));
  }
  function empezar() {
    detieneAudio();
    telon();
    modo = "clasico";
    estado = "jugando";
    pts = 0; vidas = 3; nivel = 0; t = 0; sig = 40; objs = []; textos = []; grietas = []; destellos = [];
    bit = { c: carriles >> 1, x: xBit(carriles >> 1), y: bitY() }; fantasmas = []; chispas = []; ecos = []; ondas = []; punch = 0; dano = 0; boca = "n"; bocaT = 0; mensaje = ""; nuevoRecord = false;
    aviso("");
    pistaT = 300; atrapadosPista = 0; celdas = [0, 0, 0, 0, 0]; cierraOrden(); dichos = {};
    hud();
    bip(392, 0, 0.08); bip(523, 0, 0.08, "square", 0.05, 0.09); bip(659, 0, 0.12, "square", 0.05, 0.18);
    if (P()) P().cuenta("juego");
  }
  function fin() {
    estado = "fin"; finModo = "clasico";
    SND.play("terminar");
    if (pts > record) { record = pts; nuevoRecord = true; guarda("bitBugsRecord", String(record)); }
    hud();
    aviso(`<p class="jm-t jm-rojo">GAME OVER</p>
      <p>${T("3 bugs llegaron a producción.", "3 bugs reached production.")}</p>
      <p class="jm-p">${T("PUNTOS", "SCORE")} ${seis(pts)}${nuevoRecord ? `<br><span class="jm-nuevo">${T("¡NUEVO RECORD!", "NEW HIGH SCORE!")}</span>` : ""}</p>
      ${botonesFin("empezar")}`);
  }
  const botonesFin = (otra) => `<p class="jm-b"><button type="button" data-j="${otra}">${kb("R")}${T("OTRA VEZ", "AGAIN")}</button><button type="button" data-j="titulo">${kb("M")}${T("DISCOS", "DISKS")}</button>${btnEncender()}<button type="button" data-j="salir">${kb("ESC")}${T("SALIR", "QUIT")}</button></p>`;
  function pausa(on) {
    if (on && estado === "jugando") {
      estado = "pausa";
      cierraOrden();
      if (modo === "ritmo" && audio) audio.pause();
      aviso(`<p class="jm-t">${T("PAUSA", "PAUSED")}</p><p class="jm-b"><button type="button" data-j="seguir">${kb("P")}${T("SEGUIR", "RESUME")}</button><button type="button" data-j="titulo">${kb("M")}${T("DISCOS", "DISKS")}</button></p>`);
    } else if (!on && estado === "pausa") {
      estado = "jugando"; aviso(""); ult = 0;
      if (modo === "ritmo" && audio) audio.play().catch(() => {});
    }
  }
  msg.addEventListener("click", (e) => {
    const d = e.target.closest("[data-disco]"), tr = e.target.closest("[data-tramo]"), b = e.target.closest("button[data-j]"), can = e.target.closest("[data-can]");
    if (can && estado === "titulo") { cambiaCancion(0, +can.dataset.can); return; }
    if (d && estado === "titulo") { eligeDisco(+d.dataset.disco, true); return; }
    if (tr && estado === "tramos") { if (+tr.dataset.tramo === selTramo) practicar(); else { bip(880, 0, 0.03, "square", 0.03); verTramos(+tr.dataset.tramo); } return; }
    if (!b) return;
    ({ empezar, jugar, "can-": () => cambiaCancion(-1), "can+": () => cambiaCancion(1), tramos: () => irA(() => verTramos(practica)), practica: () => practicar(), flojo: () => practicar(res ? res.peor : 0),
      otra: () => (practica != null ? practicar(practica) : empezarRitmo()), jefe: reintenta, titulo: () => irA(titulo), encender: () => cerrar(true), salir: () => cerrar(false), seguir: () => pausa(false) })[b.dataset.j]();
  });
  // Durante la cuenta del final, un toque en cualquier parte la salta
  el.addEventListener("pointerdown", () => { if (estado === "fin" && finModo === "conteo") pasaAResultado(); });

  /* ---------- 9. Modo ritmo: audio, arranque, final, daño y vidas ---------- */
  function detieneAudio() {
    intentoN++;
    if (!audio) return;
    audio.pause();
    try { audio.currentTime = 0; } catch (e) { /* aún sin datos */ }
  }
  // El segundo de la canción que suena ahora. El <audio> avisa su tiempo a saltitos: entre aviso y aviso se estima con el reloj
  function tCancion() {
    if (!audio) return 0;
    const a = audio.currentTime;
    if (a !== ultA) { ultA = a; ultP = performance.now(); }
    return a + (audio.paused ? 0 : Math.min(0.25, (performance.now() - ultP) / 1000));
  }
  function errorAudio() {
    if (el.hidden || modo !== "ritmo" || estado !== "cargando") return;
    estado = "fin";
    aviso(`<p class="jm-t jm-rojo">ERROR</p><p>${T("No se pudo cargar la canción.", "The song could not be loaded.")}</p>
      <p class="jm-b"><button type="button" data-j="titulo">${kb("M")}${T("DISCOS", "DISKS")}</button><button type="button" data-j="salir">${kb("ESC")}${T("SALIR", "QUIT")}</button></p>`);
  }
  // desde / guardado: para reintentar un escenario sin repetir toda la canción
  function empezarRitmo(desde, guardado) {
    if (!R) return;
    desde = typeof desde === "number" ? desde : 0;
    detieneAudio();
    telon();
    cierre = null; negro = false; destello = 0; nuevaCancion = null;
    modo = "ritmo";
    estado = "cargando";
    pts = 0; t = 0; objs = []; textos = []; grietas = []; destellos = []; anillos = [];
    bit = { c: carriles >> 1, x: xBit(carriles >> 1), y: bitY() }; fantasmas = []; chispas = []; boca = "n"; bocaT = 0; mensaje = ""; nuevoRecord = false;
    ondas = []; punch = 0; fiebre = 0; burbujas = []; ataques = []; rayoN = 0; iman = 0; llenaT = 0; llenaAviso = false; gatoFrente = 0; vuela = false; vueloAviso = false; vx = vy = 0;
    celdas = [0, 0, 0, 0, 0]; pistaT = desde > 0 ? 0 : 420; atrapadosPista = 0; cierraVentana();
    cierraOrden(); dichos = {};
    groove = 0; grooveT = 0; grooveFx = 0; lateral = false; latK = 0;
    // Los cambios de fila forzados del tramo lateral: desde R.teles[0], varias tandas [cada cuántos segundos, cuántas veces]
    teles = []; teleI = 0;
    if (R.teles && R.lateral != null) { let tt = R.teles[0]; const fin = R.sec[R.lateral][1] - 0.25; for (const [cada, n] of R.teles[1]) for (let i = 0; i < n && tt < fin; i++) { teles.push(tt); tt += cada; } while (teleI < teles.length && teles[teleI] < desde) teleI++; }
    luz = luzVis = 0.75; campanas = guardado && guardado.campanas ? guardado.campanas : 0; escudo = guardado && guardado.escudo ? guardado.escudo : 0; res = null; finModo = ""; finN++; cred = desde > 0 ? -1 : 0;
    tramos = guardado && guardado.tramos ? JSON.parse(guardado.tramos) : R.sec.map(() => [0, 0]);
    ts = desde; ultA = -1; rI = 0; rG = 0; golpeN = 0; pulso = 0; secI = -1; cambio = 0; combo = 0; maxCombo = 0; atrapados = 0; giro = 0; vGiro = 0.3; energiaAhora = 0;
    ecos = []; dano = 0; interferencia = 0; agachaT = 0; peligro = 0; peligroVis = 0; muerto = false; foto = null; jefeAviso = false; desdeIni = desde; zoom = 1;
    if (guardado) { pts = guardado.pts; maxCombo = guardado.maxCombo; atrapados = guardado.atrapados; }
    // Dificultad: vidas completas (también al reintentar un tramo), memoria del jefe y las notas que tocan
    D = DIFS[dif];
    JEFE_TOPE = D.tope;
    vidasR = D.vidas; fallosVida = 0; invul = 0; vidaFx = 0; colaV = [];
    continues = guardado ? (guardado.cont || 0) + 1 : 0;
    recordR = +(lee(kRec(dif)) || 0);
    preparaNotas();
    // Se saltan las notas y los bombos anteriores al punto de arranque
    while (rI * 3 < R.notas.length && R.notas[rI * 3] / 1000 < desde + 1.2) rI++;
    while (rG < R.golpes.length && R.golpes[rG] < desde * 100) rG++;
    golpeN = rG;
    gatoX = focoX = gx + W / 2; gatoY = focoY = gy + H * 0.5; gatoTam = 1; gatoQuieto = true; estela = [];
    pideGato();
    hud();
    aviso(`<p class="jm-t">♪</p><p>${T("Cargando la canción...", "Loading the song...")}</p>`);
    // Cada canción tiene su propio <audio>. Si la canción sigue después del nivel (R.sigue), al acabarse vuelve a ese punto
    audio = audios[idC()];
    if (!audio) {
      const a = (audio = audios[idC()] = new Audio(R.archivo));
      a.preload = "auto";
      a.addEventListener("ended", () => {
        if (a !== audio || el.hidden) return;
        if (modo === "ritmo" && estado === "jugando") { if (practica != null) finRitmo(); else empiezaCierre(); }
        else if (R.sigue && (estado === "fin" || estado === "cierre")) { try { a.currentTime = R.dur; } catch (e) { /* se queda en silencio */ } a.play().catch(() => {}); }
      });
      a.addEventListener("error", errorAudio);
    }
    audio.volume = R.volumen;
    audio.muted = !!(SND.silencio && SND.silencio());
    if (desde > 0) { try { audio.currentTime = desde; } catch (e) { /* aún sin datos: se ajusta al sonar */ } }
    const intento = intentoN;
    // play() va aquí, dentro del clic o la tecla: así el navegador deja sonar
    let p;
    try { p = audio.play(); } catch (e) { errorAudio(); return; }
    (p && p.then ? p : Promise.resolve()).then(() => {
      if (intento !== intentoN || el.hidden || modo !== "ritmo" || estado !== "cargando") return;
      if (desde > 0 && Math.abs(audio.currentTime - desde) > 1) { try { audio.currentTime = desde; } catch (e) { /* sigue desde donde pueda */ } }
      estado = "jugando";
      aviso("");
      ult = 0;
      if (cred < 0) ponAudio("esquina");
      if (P() && !guardado) P().cuenta("juego-ritmo");
    }).catch(() => { if (intento === intentoN) errorAudio(); });
  }
  /* El final del modo ritmo, en dos pasos:
     1. La cuenta: los premios aparecen renglón por renglón, cada uno con una nota más aguda. Los que no se ganaron
        salen apagados, para que se vea qué faltó. Cualquier tecla la salta.
     2. El resultado: el rango pegado en el disquete, cuántos bugs faltaron para el siguiente rango, la cinta de la
        canción pintada tramo por tramo (el más flojo, resaltado y listo para practicarse) y los logros. */
  const RANGOS = [["S", 95], ["A", 85], ["B", 70], ["C", 50], ["D", 0]];
  function finRitmo() {
    if (practica != null) { finPractica(); return; }
    cierraVentana();
    cierraOrden();
    estado = "fin"; finModo = "conteo";
    objs = [];
    // Si la canción sigue después del nivel, se queda sonando de fondo, más bajito
    if (audio) { if (R.sigue) audio.volume = R.volumen * 0.6; else audio.pause(); }
    const total = totalNotas, ok = Math.min(atrapados, total), pct = Math.min(100, Math.round((ok / total) * 100));
    const rI2 = RANGOS.findIndex((r) => pct >= r[1]), rango = RANGOS[rI2][0];
    const filas = [[`BUGS ${ok}/${total}`, pts, true], [`${T("VIDAS", "LIVES")} ${vidasR} x 500`, vidasR * 500, vidasR > 0], [`COMBO MAX ${maxCombo} x 10`, maxCombo * 10, maxCombo > 0],
      [T("SIN REINTENTOS", "NO RETRIES"), 2000, continues === 0], [T("PLENO: NI UNO CAIDO", "FULL CLEAR: NONE DROPPED"), 5000, ok === total]];
    pts = filas.reduce((s, f) => s + (f[2] ? f[1] : 0), 0);
    const antes = recordR;
    if (pts > recordR) { recordR = pts; nuevoRecord = true; guarda(kRec(dif), String(recordR)); }
    const viejo = lee(kRango(dif));
    if (!viejo || "DCBAS".indexOf(rango) > "DCBAS".indexOf(viejo)) guarda(kRango(dif), rango);
    guardaTramos(0, R.sec.length);
    const tengo = leeJ("bitBugsLogros", {}), nuevos = [], tj = tramos[JEFE];
    const gana = (k, si) => { if (si && !tengo[k]) { tengo[k] = 1; nuevos.push(k); } };
    gana("primera", true); gana("limpio", continues === 0); gana("combo100", maxCombo >= 100); gana("intacto", vidasR === D.vidas && continues === 0);
    gana("jefe", !!tj && tj[1] > 0 && tj[0] >= tj[1]); gana("rangoS", rango === "S"); gana("dificil", dif === "dificil");
    gana("tripleS", ["facil", "medio", "dificil"].every((d) => lee(kRango(d)) === "S"));
    if (nuevos.length) guarda("bitBugsLogros", JSON.stringify(tengo));
    res = { total, ok, pct, rango, rI2, antes, nuevos, tengo, peor: -1 };
    hud();
    const n = ++finN;
    aviso(`<p class="jm-t jm-t2">${G() ? T("¡GRIMORIO SELLADO!", "GRIMOIRE SEALED!") : DM() ? T("¡PUEBLO A SALVO!", "TOWN SAVED!") : FK() ? T("¡PISTA CONQUISTADA!", "DANCE FLOOR CONQUERED!") : T("¡VIRUS ELIMINADO!", "VIRUS REMOVED!")}</p>
      <div class="jf-cuenta">${filas.map((f) => `<p class="jf-f${f[2] ? "" : " jf-no"}" hidden><span>${f[0]}</span><b>${f[2] ? `+${f[1]}` : "- - -"}</b></p>`).join("")}<p class="jf-f jf-tot" hidden><span>TOTAL</span><b>${seis(pts)}</b></p></div>
      <p class="jf-gris">${tactil ? T("Toca para saltar", "Tap to skip") : T("Pulsa una tecla para saltar", "Press any key to skip")}</p>`);
    entraMsg();
    const fs = [...msg.querySelectorAll(".jf-f")];
    fs.forEach((f, i) => setTimeout(() => {
      if (n !== finN || finModo !== "conteo") return;
      f.hidden = false;
      const ultima = i === fs.length - 1;
      if (f.classList.contains("jf-no")) bip(180, 0, 0.06, "square", 0.03);
      else bip(523.25 * Math.pow(2, (i * 2) / 12), 0, ultima ? 0.25 : 0.08, "square", 0.04);
      if (ultima) setTimeout(() => { if (n === finN && finModo === "conteo") pasaAResultado(); }, 900);
    }, 350 + i * 380));
  }
  function resultado() {
    if (!res) return;
    finModo = "resultado"; finN++;
    const { total, ok, pct, rango, rI2, nuevos, tengo } = res;
    // Qué faltó para el siguiente rango, y qué tan cerca quedó
    let falta, barra = 100;
    if (rI2 > 0) {
      const [sig, th] = RANGOS[rI2 - 1], nec = Math.max(1, Math.ceil(((th - 0.5) * total) / 100) - ok);
      falta = T(`Te faltaron <b>${nec}</b> bugs para la <b>${sig}</b>`, `<b>${nec}</b> more bugs for rank <b>${sig}</b>`);
      barra = Math.max(4, ((pct - RANGOS[rI2][1]) / (th - RANGOS[rI2][1])) * 100);
    } else falta = ok < total ? T(`Rango máximo. Te faltaron <b>${total - ok}</b> para el pleno`, `Top rank. <b>${total - ok}</b> short of a full clear`) : T("Rango máximo y pleno: impecable.", "Top rank and full clear: flawless.");
    // La cinta, tramo por tramo, y cuál fue el más flojo
    let peor = -1, peorP = 100;
    const pc = R.sec.map((_, j) => { const [a, b] = tramos[j] || [0, 0], p = b ? Math.min(100, Math.round((a / b) * 100)) : 100; if (b && p < peorP) { peorP = p; peor = j; } return p; });
    res.peor = peor;
    const seg = R.sec.map((x, j) => `<span style="flex:${Math.round(x[1] - x[0])}" class="jc-s ${pc[j] >= 90 ? "jc-v" : pc[j] >= 70 ? "jc-y" : "jc-r"}${j === peor ? " jm-sel" : ""}" title="${nomSec(j)} ${pc[j]}%">${j === JEFE ? T("JEFE", "BOSS") : j + 1}</span>`).join("");
    const reto = LOGROS.find((l) => !tengo[l[0]]);
    const rec = nuevoRecord ? `<span class="jm-nuevo">${T("¡NUEVO RECORD!", "NEW HIGH SCORE!")}${res.antes ? ` +${pts - res.antes}` : ""}</span>` : `<span class="jf-gris">RECORD ${seis(recordR)} · ${T("te faltaron", "short by")} ${recordR - pts}</span>`;
    aviso(`<div class="jf">
        <div class="jf-a">${discoHtml(DISCOS.indexOf(dif), "jf-sello", rango)}</div>
        <div class="jf-b">
          <p class="jm-p">${T("PUNTOS", "SCORE")} ${seis(pts)}<br>${rec}</p>
          <p class="jf-falta">${falta}</p><div class="jf-bar"><i style="width:${barra}%"></i></div>
          <div class="jc jc-fin">${seg}</div>
          <p class="jf-gris">${peor >= 0 ? T(`Tu tramo más flojo: ${peor + 1} · ${nomSec(peor)} (${peorP}%)`, `Weakest section: ${peor + 1} · ${nomSec(peor)} (${peorP}%)`) : T("Ni un tramo flojo.", "Not one weak section.")}</p>
          ${nuevos.map((k) => { const l = LOGROS.find((x) => x[0] === k); return `<p class="jf-logro">★ ${T("LOGRO", "BADGE")}: ${T(l[1], l[2])}</p>`; }).join("")}
          ${nuevaCancion ? `<p class="jf-logro jf-nueva">★ ${T("NUEVA CANCION", "NEW SONG")}: ${nuevaCancion.titulo}</p>` : ""}
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
    estado = "fin"; finModo = "practica";
    objs = [];
    if (audio) audio.pause();
    const i = practica, [a, b] = tramos[i] || [0, 0], p = b ? Math.min(100, Math.round((a / b) * 100)) : 100, antes = leeTramos()[i];
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
    if (!donde || !rectL || !R) { aEl.hidden = true; aEl.dataset.d = ""; return; }
    $(".ja-t", aEl).textContent = `♪ ${R.titulo || ""}`;
    $(".ja-a", aEl).textContent = R.artista || "";
    $(".ja-d", aEl).textContent = `${mmss(R.dur)} · ${R.sec[0][3]} BPM`;
    aEl.hidden = false;
    aEl.dataset.d = donde;
    aEl.className = `j-audio ${donde}`;
    const centro = donde === "centro";
    aEl.style.left = `${centro ? rectL.left + rectL.width / 2 : Math.min(rectL.right + 14, window.innerWidth - 4)}px`;
    // Guardada, cuelga por fuera de la esquina de abajo a la derecha: así no tapa el piso ni a BIT
    aEl.style.top = `${centro ? rectL.top + rectL.height * 0.45 : Math.min(rectL.bottom + 5, window.innerHeight - 30)}px`;
  }
  // BIT cae: se quedó sin vidas o GATO.EXE llenó la memoria. Se puede reintentar desde el inicio de ese escenario
  function muereBit() {
    estado = "fin"; finModo = "crash"; cierre = null;
    muerto = true;
    if (audio) audio.pause();
    if (practica == null) guardaTramos(0, secI);
    objs = [];
    SND.play("terminar");
    if (!RM) { temblor = 16; interferencia = 30; }
    hud();
    cierraVentana();
    cierraOrden();
    setTimeout(entraMsg, 0);
    aviso(`<p class="jm-t jm-rojo">CRASH</p>
      <p>${vidasR <= 0 || !UIA() ? `*** ${T("SIN VIDAS", "OUT OF LIVES")} ***<br>${T("BIT.EXE dejó de responder.", "BIT.EXE stopped responding.")}` : `*** ${T("MEMORIA LLENA", "OUT OF MEMORY")} ***<br>${T("GATO.EXE saturó la memoria y BIT.EXE dejó de responder.", "CAT.EXE flooded the memory and BIT.EXE stopped responding.")}`}</p>
      <p class="jm-p">${T("PUNTOS", "SCORE")} ${seis(pts)}</p>
      <p class="jm-b"><button type="button" data-j="jefe">${kb("R")}${T("REINTENTAR TRAMO", "RETRY SECTION")}</button><button type="button" data-j="titulo">${kb("M")}${T("DISCOS", "DISKS")}</button>${btnEncender()}<button type="button" data-j="salir">${kb("ESC")}${T("SALIR", "QUIT")}</button></p>`);
  }
  // Reintentar: desde el inicio del escenario donde cayó, con los puntos que traía al llegar ahí
  const reintenta = () => (foto && foto.t > 2 ? empezarRitmo(foto.t - 1.9, foto) : empezarRitmo(0, { pts: 0, maxCombo: 0, atrapados: 0, cont: continues }));
  // Fallar se tiene que sentir: sacudida, BIT lastimado, el carril en rojo, interferencia y la música se hunde un instante
  function falla(o) {
    destellos.push({ x: o.x, vida: 30 });
    boca = "o"; bocaT = 45;
    dano = 26;
    if (!RM) { temblor = 11; interferencia = 12; }
    bip(170, 45, 0.3, "sawtooth", 0.075);
    bip(90, 40, 0.22, "square", 0.05, 0.03);
    castigo();
    if (G()) luz = Math.max(0.1, luz - 0.2);
    // Fuera del jefe del gato (ahí lo que se llena es la memoria), cada tantos bugs caídos cuestan una vida
    if ((secI !== JEFE || !UIA()) && ++fallosVida >= D.paso) { fallosVida = 0; pierdeVida(); }
  }
  // BIT pierde una vida y queda un instante a salvo, para que una mala racha no se las lleve todas de golpe
  function pierdeVida() {
    if (invul > 0 || (fiebre > ts && !vuela) || vidasR <= 0) return;
    // La armadura aguanta el golpe en lugar de la vida
    if (escudo > 0) {
      escudo--; invul = D.invul; vidaFx = 40;
      bip(1400, 500, 0.15, "square", 0.06); bip(700, 0, 0.1, "triangle", 0.05, 0.05);
      textos.push({ txt: T("ARMADURA", "ARMOR"), x: bit.x + 5, y: bit.y - 4, vida: 50, max: 50, c: "#7dd3fc", e: 1 });
      return;
    }
    vidasR--;
    invul = D.invul;
    vidaFx = 40;
    if (!RM) { temblor = 16; interferencia = 18; }
    bip(440, 110, 0.35, "sawtooth", 0.08);
    bip(220, 55, 0.4, "square", 0.06, 0.05);
    textos.push({ txt: T("-1 VIDA", "-1 LIFE"), x: bit.x + 5, y: bit.y - 4, vida: 50, max: 50, c: "#ff4d4d", e: 1 });
    hud();
  }
  // Lo que cuesta fallar un bug o comerse un rayo: la música baja apenas, se pierde el combo y, con el jefe, se llena la memoria
  function castigo(rayo) {
    if (audio && !audio.muted) { audio.volume = R.volumen * 0.72; agachaT = 9; }
    rompeVentanas();
    combo = 0;
    if (secI === JEFE && !rayo && UIA()) {
      peligro = Math.min(JEFE_TOPE, peligro + 1);
      if (peligro === JEFE_TOPE - 2) cmd("MEM", "MEM", "ALERTA: memoria casi llena", "WARNING: memory almost full");
    }
    hud();
  }
  // Nivel GRIMORIO: BIT tocó un bug maldito. Pierde el combo y parte de su luz, y cuenta como un bug caído
  function maldito(o, nombre) {
    boca = "o"; bocaT = 45;
    dano = 26;
    if (!RM) { temblor = 11; interferencia = 10; }
    bip(140, 50, 0.3, "sawtooth", 0.07); bip(70, 40, 0.25, "square", 0.05, 0.04);
    textos.push({ txt: nombre || T("MALDITO", "CURSED"), x: o.x + 5, y: o.y, vida: 45, max: 45, c: "#d44bff", e: 1 });
    castigo(true);
    luz = Math.max(0.1, luz - 0.25);
    if (++fallosVida >= D.paso) { fallosVida = 0; pierdeVida(); }
  }
  // Un rayo del gato alcanzó a BIT
  function golpeado() {
    boca = "o"; bocaT = 45;
    dano = 26;
    if (!RM) { temblor = 12; interferencia = 10; }
    bip(900, 80, 0.22, "sawtooth", 0.07);
    bip(60, 40, 0.25, "square", 0.05, 0.02);
    // Un rayo siempre cuesta una vida entera
    castigo(true);
    pierdeVida();
  }

  /* ---------- 10. Modo ritmo: el paso de cada cuadro ---------- */
  // Qué tan fuerte va la canción en este segundo (0 a 1), suavizado entre muestra y muestra
  function energia(seg) {
    const E = R.energia, x = Math.max(0, Math.min(E.length - 1.001, seg * 2)), i = Math.floor(x), f = x - i;
    return ((+E[i]) * (1 - f) + (+E[i + 1]) * f) / 9;
  }
  // Arma la partida: quita los bugs que quedarían demasiado juntos para esta dificultad (en el vuelo, bastantes más,
  // porque ahí se persiguen de uno en uno) y reparte arcoíris extra en el vuelo, que es donde más se disfruta la fiebre
  function preparaNotas() {
    const N = R.notas, n = N.length / 3;
    activa = []; tipoRun = mapa.tipo.slice(); totalNotas = 0;
    let ult = -9, enVuelo = 0, aireHasta = 0;
    for (let i = 0; i < n; i++) {
      const tn = N[i * 3] / 1000, sec = seccionDe(tn);
      // No salen los que quedan muy juntos, ni los comunes que caerían en el aire que pidió un bicho con maña
      // Mientras la terminal se encoge, se muda de lado y vuelve, no cae nada
      const sl = R.lateral != null ? R.sec[R.lateral] : null, sc = R.caja != null ? R.sec[R.caja] : null;
      const mudanza = (sl && ((tn > sl[0] - 0.9 && tn < sl[0] + 1.5) || (tn > sl[1] - 0.3 && tn < sl[1] + 1.3))) || (sc && tn > sc[1] - 1.25 && tn < sc[1] + 0.7);
      if (mudanza || tn - ult < (sec === VUELO ? D.gapVuelo : D.gap) || (tn < aireHasta && tipoRun[i] === "bug")) { activa.push(false); continue; }
      activa.push(true);
      ult = tn;
      if (mapa.aire[i]) aireHasta = tn + mapa.aire[i] * D.vel;
      totalNotas++;
      if (sec === VUELO && ++enVuelo % D.arcoVuelo === 4) tipoRun[i] = "arco";
    }
  }
  const seccionDe = (seg) => { let i = 0; while (i < R.sec.length - 1 && seg >= R.sec[i][1]) i++; return i; };
  // Los carriles de cada nota se reparten aquí para que BIT nunca se quede parado: casi cada bug obliga a saltar.
  // De paso se eligen los especiales: dorado (+50), arcoíris (fiebre x2), glitch (cambia de carril al caer) y antivirus (jefe).
  const mapa = { c: [], tipo: [], aire: [] };
  function armaMapa() {
    mapa.c = []; mapa.tipo = []; mapa.aire = [];
    let sem = 20261114;
    const rnd = () => { sem = (sem * 1664525 + 1013904223) >>> 0; return sem / 4294967296; };
    const N = R.notas, n = N.length / 3, calma = R.calma || [0, 2, 5, 8, 9], g = G(), fin = R.sec.length - 1;
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
        if (sec === JEFE && UIA() && normales % 13 === 0) tipo = "anti";
        // GRIMORIO: el maldito cae justo donde BIT se quedó parado, para obligarlo a quitarse. Solo si hay tiempo de verlo
        else if (g && (sec === 2 || sec === 6) && i > 0 && dt > 0.55 && dtSig > 0.55 && normales % 6 === 0) { tipo = "mal"; c = cAntes; }
        else if (sec >= (UIA() ? 3 : 2) && sec !== fin && sec !== VUELO && dt > 0.3 && dtSig > 0.45 && normales % 11 === 0) tipo = "glitch";
        // Los bichos con maña: uno cada tantos bugs, pero solo donde hay aire antes y después para reaccionar
        if (normales % 8 === 5) toca = true;
        const lista = reparto[sec] || [];
        if (toca && tipo === "bug" && lista.length && sec !== VUELO && i > 0 && dt > 0.28) {
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
  if (R) ponCancion(cancionI);
  /* El cierre de un nivel. Al acabar la canción: un destello y estrellas del color del nivel que salen del centro y se
     desvanecen hasta dejar todo en negro. Entonces baja una llave por un carril y se queda en el piso: al recogerla, BIT la
     levanta, todo se apaga con otro destello y aparecen los resultados. */
  function empiezaCierre() {
    cierraVentana();
    cierraOrden();
    estado = "cierre";
    objs = []; ataques = []; vuela = false; fiebre = 0; iman = 0; tension = 0; zoom = 1; punch = 0; dano = 0; interferencia = 0;
    bit.c = Math.max(0, Math.min(carriles - 1, Math.floor((bit.x + 5) / LW)));
    if (audio && R.sigue) audio.volume = R.volumen * 0.6;
    cierre = { t: 0, fase: "luz", c: (bit.c + 2 + ((Math.random() * 2) | 0)) % carriles, y: 10, tt: 0 };
    negro = true;
    hud();
    [1047, 1319, 1568, 2093].forEach((f, i) => bip(f, 0, 0.3, "triangle", 0.04, i * 0.08));
  }
  function pasoCierre() {
    const k = cierre, suelo = bitY() + 1;
    k.t++;
    pasoOrden();
    if (k.fase === "luz" || k.fase === "llave") moverBit();
    if (k.fase === "luz" && k.t > 150) {
      k.fase = "llave";
      if (tactil) cmd("LLAVE.EXE", "KEY.EXE", "OK: toca la llave", "OK: tap the key"); else cmd("LLAVE.EXE", "KEY.EXE", "OK: recoge la llave", "OK: grab the key");
    }
    if (k.fase === "llave") {
      if (k.y < suelo) { k.y = Math.min(suelo, k.y + 0.9); if (k.y >= suelo) { bip(1568, 0, 0.08, "triangle", 0.05); bip(2093, 0, 0.14, "triangle", 0.04, 0.06); } }
      else if (k.t % 45 === 0) bip(1976, 0, 0.05, "sine", 0.02);
      if (k.y > suelo - 16 && bit.c === k.c && Math.abs(bit.x - xBit(k.c)) < 3) {
        k.fase = "toma"; k.tt = 0;
        // Recoger la llave es lo que abre la siguiente canción
        if (!lee(`bitBugsPaso_${idC()}`)) { guarda(`bitBugsPaso_${idC()}`, "1"); k.abre = CANCIONES[cancionI + 1] || null; }
        nuevaCancion = k.abre || null;
        boca = "s"; bocaT = 90;
        cierraOrden();
        [784, 988, 1175, 1568, 1976, 2349].forEach((f, i) => bip(f, 0, 0.14, "square", 0.04, i * 0.08));
      }
    } else if (k.fase === "toma") {
      brinco = 6;
      if (++k.tt > 64) { k.fase = "fin"; k.tt = 0; bip(2000, 200, 0.5, "sawtooth", 0.035); }
    } else if (k.fase === "fin" && ++k.tt > 20) { cierre = null; destello = 26; finRitmo(); }
  }
  function dibujaLlave() {
    const k = cierre;
    if (k.fase === "llave") {
      const enPiso = k.y >= bitY() + 1, x = xBit(k.c) + 1, y = Math.round(k.y + (enPiso ? Math.sin(t * 0.12) * 1.5 - 2 : 0));
      // Un haz de luz marca su carril
      ctx.fillStyle = `rgba(255,225,74,${0.09 + 0.05 * Math.sin(t * 0.2)})`;
      ctx.fillRect(Math.round(k.c * LW) + 1, 9, Math.round(LW) - 1, piso() - 9);
      contorno(LLAVE, x, y);
      pinta(LLAVE, x, y, (t >> 2) % 6 === 0 ? { Y: "W" } : null);
      if (!RM && t % 5 === 0) chispas.push({ x: x + azar(0, 7), y: y + azar(0, 10), vx: 0, vy: -1.2, vida: 9, c: "#ffe14a", g: 1 });
    } else if (k.fase === "toma") {
      // BIT la levanta sobre su cabeza, entre rayos que giran
      const p = Math.min(1, k.tt / 18), x = Math.round(bit.x) + 2, y = Math.round(bit.y - 6 - p * 12);
      for (let i = 0; i < 8; i++) {
        const a = t * 0.07 + (i / 8) * Math.PI * 2, r1 = 11 + p * 12 + Math.sin(t * 0.3 + i) * 2;
        ctx.fillStyle = i % 2 ? "#ffe14a" : "#ffffff";
        for (let r = 8; r < r1; r += 2) ctx.fillRect(Math.round(x + 3 + Math.cos(a) * r), Math.round(y + 5 + Math.sin(a) * r), 1, 1);
      }
      contorno(LLAVE, x, y);
      pinta(LLAVE, x, y, (t >> 1) % 2 ? { Y: "W" } : null);
    } else if (k.fase === "fin") { ctx.fillStyle = `rgba(255,255,255,${Math.min(1, k.tt / 13)})`; ctx.fillRect(0, 0, W, H); }
  }
  // Lo que trae cada bicho con maña al nacer: su aviso (solo la primera vez) y sus acompañantes.
  // libre = no es una nota de la canción: si se escapa no castiga ni cuenta
  function naceBicho(o) {
    const b = BICHOS[o.tipo];
    cmd(`${b.n}.EXE`, `${b.n}.EXE`, b.aviso[0], b.aviso[1], `bicho-${b.n}`);
    if (o.tipo === "gusano") { o.seg = 0; for (let k = 1; k < 3; k++) objs.push({ tipo: "gusano", seg: k, libre: true, c: o.c, tn: o.tn + k * 0.21, d: o.d, s: o.s, x: o.x, y: 0 }); }
    else if (o.tipo === "gemelo") { const c2 = o.c >= 2 ? o.c - 2 : o.c + 2, g = { tipo: "gemelo", libre: true, c: c2, tn: o.tn, d: o.d, s: o.s, x: xBug(c2), y: 0, par: o }; o.par = g; objs.push(g); grietas.push({ x: xBug(c2) + 4, vida: 16 }); }
    else if (o.tipo === "polilla") { o.cf = o.c; o.dirP = o.c === 0 ? 1 : o.c === carriles - 1 ? -1 : Math.floor(o.tn * 10) % 2 ? 1 : -1; o.salto = true; }
    else if (o.tipo === "nido") o.d *= 1.35;
  }
  function pasoRitmo() {
    ts = tCancion() + R.desfase;
    // Al reintentar al jefe, se espera a que el audio brinque a su punto
    if (ts < desdeIni - 1) return;
    if (practica != null && secI === practica && ts >= R.sec[practica][1] - 0.05) { finRitmo(); return; }
    if (ts >= R.dur - 0.05) { if (practica != null) finRitmo(); else empiezaCierre(); return; }
    // Los créditos del arranque: la terminal inicializa la canción, se abre AUDIO.EXE al centro y luego se guarda en la esquina
    if (cred >= 0) {
      cred++;
      if (cred % 20 === 1 && cred < 80) bip(1100, 0, 0.02, "square", 0.02);
      if (cred === 100) { ponAudio("centro"); bip(660, 0, 0.05, "triangle", 0.035); bip(990, 0, 0.08, "triangle", 0.03, 0.05); }
      if (cred === 185) { ponAudio("esquina"); cred = -1; }
    }
    // La linterna: en la hoguera se recarga sola; lo que se dibuja persigue suave al valor real
    if (G()) { if (secI === 5) luz = Math.min(1, luz + 0.006); luzVis += ((fiebre > ts ? 1.8 : luz) - luzVis) * 0.08; }
    if (agachaT > 0 && --agachaT === 0 && audio) audio.volume = R.volumen;
    if (invul > 0) invul--;
    if (vidaFx > 0) vidaFx--;
    // Cambio de escenario
    const s = seccionDe(ts);
    if (s !== secI) {
      // Salir vivo del jefe da premio
      if (secI === JEFE && s === JEFE + 1) { if (G()) cmd("SELLAR LICHE.EXE", "SEAL LICH.EXE", "COMPLETO: el liche cae +1000", "DONE: the lich falls +1000"); else if (DM()) cmd("KILL DEMONIO.EXE", "KILL DEMON.EXE", "COMPLETO: demonio fuera +1000", "DONE: demon gone +1000"); else if (FK()) cmd("STOP DJ.EXE", "STOP DJ.EXE", "COMPLETO: el DJ se rinde +1000", "DONE: the DJ gives up +1000"); else cmd("KILL GATO.EXE", "KILL CAT.EXE", "COMPLETO: memoria a salvo +1000", "DONE: memory safe +1000"); pts += 1000; peligro = 0; textos.push({ txt: "+1000", x: W / 2, y: H * 0.5, vida: 70, max: 70, c: "#ffe14a", e: 2 }); [659, 784, 1047, 1319].forEach((f, i) => bip(f, 0, 0.1, "square", 0.04, i * 0.08)); }
      secI = s;
      cambio = 26;
      // Punto de control al entrar a cada escenario: si BIT cae, se reintenta desde aquí
      foto = { t: R.sec[s][0], pts, maxCombo, atrapados, cont: continues, tramos: JSON.stringify(tramos), campanas, escudo };
      // DOOM CROSSING: al pasar del pueblo al infierno, las campanas se cobran como armadura (hasta dos escudos)
      if (DM() && mundoDe(s) === "i" && s > 0 && mundoDe(s - 1) !== "i") {
        const n = Math.min(2 - escudo, Math.floor(campanas / CAMPANAS_ESCUDO));
        if (n > 0) { escudo += n; campanas -= n * CAMPANAS_ESCUDO; cmd("ARMADURA.EXE", "ARMOR.EXE", `COMPLETO: ${n} escudo${n > 1 ? "s" : ""} por tus campanas`, `DONE: ${n} shield${n > 1 ? "s" : ""} for your bells`); [392, 523, 784].forEach((f, i) => bip(f, 0, 0.12, "square", 0.05, i * 0.07)); }
        else if (!escudo) cmd("ARMADURA.EXE", "ARMOR.EXE", "ALERTA: sin campanas no hay escudo", "WARNING: no bells, no shield");
      }
      if (s === JEFE) { peligro = 0; jefeAviso = false; llenaT = R.sec[s][0] + 7; llenaAviso = false; llenaN = 0; }
      // En el hiperespacio BIT vuela libre; al salir, vuelve a su carril
      if (s !== JEFE) peligro = 0;
      vuela = s === VUELO;
      if (vuela) { vx = vy = 0; vueloAviso = false; fantasmas = []; }
      else bit.c = Math.max(0, Math.min(carriles - 1, Math.floor((bit.x + 5) / LW)));
      // Entrar o salir del tramo lateral: BIT arranca en la fila (o el carril) de en medio
      const eraLateral = lateral;
      lateral = R.lateral === s;
      if (lateral !== eraLateral) { bit.c = carriles >> 1; meta = null; metaY = null; fantasmas = []; }
      if (lateral && !eraLateral) { if (tactil) cmd("LATERAL.EXE", "SIDEWAYS.EXE", "OK: toca arriba o abajo", "OK: tap up or down"); else cmd("LATERAL.EXE", "SIDEWAYS.EXE", "OK: ahora flechas arriba y abajo", "OK: now use up and down"); }
      ataques = [];
      hud();
    }
    if (cambio > 0) cambio--;
    // Al empezar a volar, BIT sube solo a media altura: así se entiende que ya no hay carriles
    if (vuela && !vueloAviso) { vueloAviso = true; vy = -3.2; if (tactil) cmdRes("COMPLETO: arrastra para volar", "DONE: drag to fly"); else cmdRes("COMPLETO: vuela con las 4 flechas", "DONE: fly with all 4 arrows"); }
    // La terminal escribe cada reto: el vuelo y el jefe, unos segundos antes de que empiecen
    if (pistaT === 290) { if (tactil) cmd("BIT.EXE", "BIT.EXE", "OK: toca un carril o desliza", "OK: tap a lane or slide", "controles"); else cmd("BIT.EXE", "BIT.EXE", "OK: flechas o A/D, un salto por toque", "OK: arrows or A/D, one hop per tap", "controles"); }
    if (R.sec[VUELO][0] - ts < 6.6 && ts < R.sec[VUELO][0]) cmd(G() ? "ALAS.EXE" : "VUELO.EXE", G() ? "WINGS.EXE" : "FLIGHT.EXE", null, null, "prevuelo");
    if (G()) {
      const en = ts - R.sec[secI][0];
      if (secI === 1 && en > 1) cmd("LINTERNA.EXE", "LANTERN.EXE", "OK: cada bug aviva tu luz", "OK: every bug feeds your light", "luz");
      if (secI === 2 && en > 0.6) cmd("MALDITOS.EXE", "CURSED.EXE", "ALERTA: no toques los morados", "WARNING: do not touch the purple ones", "mal");
      if (R.sec[JEFE][0] - ts < 5.6 && ts < R.sec[JEFE][0]) cmd("LICHE.EXE /despertar", "LICH.EXE /awaken", null, null, "prejefe");
      if (secI === JEFE && !jefeAviso) { jefeAviso = true; cmdRes("ALERTA: sal de la runa de fuego", "WARNING: leave the fire rune"); }
      if (secI === 5 && en > 0.6) cmd("HOGUERA.EXE", "BONFIRE.EXE", "OK: descansa, tu luz vuelve", "OK: rest, your light returns", "hoguera");
      if (secI === 6 && en > 0.6) cmd("SELLO.EXE /cerrar", "SEAL.EXE /close", "sellando el grimorio...", "sealing the grimoire...", "sello");
    } else if (FK()) {
      const en = ts - R.sec[secI][0];
      if (secI === 0 && en > 6) cmd("GROOVE.EXE", "GROOVE.EXE", tactil ? "OK: toca con el golpe y vale mas" : "OK: salta con el golpe y vale mas", tactil ? "OK: tap on the beat for more" : "OK: hop on the beat for more", "groove");
      if (R.sec[JEFE][0] - ts < 5.6 && ts < R.sec[JEFE][0]) cmd("DJ.EXE /subir volumen", "DJ.EXE /volume up", null, null, "prejefe");
      if (secI === JEFE && !jefeAviso) { jefeAviso = true; cmdRes("ALERTA: sal del reflector", "WARNING: leave the spotlight"); }
      if (secI === 8 && en > 0.6) cmd("CINTA.EXE /lado B", "TAPE.EXE /side B", "OK: respira y recupera vidas", "OK: breathe and win lives back", "ladoB");
      // Al final del tramo lateral, BIT es cambiado de fila a la fuerza, cada vez más seguido
      if (lateral && teleI < teles.length && ts >= teles[teleI]) {
        teleI++;
        let c = bit.c; while (c === bit.c) c = (Math.random() * carriles) | 0;
        if (!RM) { ecos.push({ x: bit.x, y: bit.y, vida: 22, max: 22, c: "#00f6ff" }); ecos.push({ x: bit.x + 2, y: bit.y, vida: 16, max: 16, c: "#ff3fb4" }); for (let i = 0; i < 8; i++) chispas.push({ x: bit.x + 5, y: filaY(c) + 6, vx: azar(-2, 2), vy: azar(-2, 1), vida: 12, c: i % 2 ? "#00f6ff" : "#ffffff", g: 1 }); }
        bit.c = c; bit.y = filaY(c); meta = null; metaY = null;
        punch = 1.5;
        bip(1800, 300, 0.06, "sawtooth", 0.04); bip(300, 1800, 0.05, "square", 0.03, 0.03);
      }
      // El groove se apaga solo si se deja de bailar
      if (groove > 0 && ts - grooveT > 2.4) { groove--; grooveT = ts - 1.2; }
    } else if (DM()) {
      const en = ts - R.sec[secI][0];
      if (secI === 1 && en > 0.8) cmd("CAMPANAS.EXE", "BELLS.EXE", "OK: 12 campanas = 1 escudo", "OK: 12 bells = 1 shield", "camp");
      if (R.sec[JEFE][0] - ts < 5.6 && ts < R.sec[JEFE][0]) cmd("DEMONIO.EXE /invocar", "DEMON.EXE /summon", null, null, "prejefe");
      if (secI === JEFE && !jefeAviso) { jefeAviso = true; cmdRes("ALERTA: sal de la columna de fuego", "WARNING: leave the fire column"); }
      if (secI === 3 && en > 0.6) cmd("PORTAL.EXE /bucle", "PORTAL.EXE /loop", "ALERTA: los mundos se turnan", "WARNING: the worlds take turns", "vaiven");
      if (secI === 8 && en > 0.6) cmd("MUNDOS.EXE /juntar", "WORLDS.EXE /merge", "ALERTA: los dos a la vez", "WARNING: both at once", "dos");
    } else {
      if (ts > R.error + 0.4 && secI === 0) cmd("GATO.EXE", "CAT.EXE", "ERROR: proceso no autorizado", "ERROR: unauthorized process", "error");
      if (R.sec[JEFE][0] - ts < 5.6 && ts < R.sec[JEFE][0]) cmd("GATO.EXE /llenar memoria", "CAT.EXE /fill memory", null, null, "prejefe");
      if (secI === JEFE && !jefeAviso) { jefeAviso = true; cmdRes("ALERTA: que no caiga ni uno", "WARNING: do not drop any"); }
      // GATO.EXE no espera a que fallen: cada tanto teclea un comando y llena la memoria de golpe. Nunca la llena del todo
      // (eso solo pasa si además se caen bugs), pero obliga a bajarla atrapando seguido
      if (secI === JEFE && ts < R.sec[JEFE][1] - 4) {
        if (!llenaAviso && ts > llenaT - 1.7) { llenaAviso = true; const c = [["GATO.EXE /malloc 64MB", "CAT.EXE /malloc 64MB"], ["GATO.EXE /copiar *.*", "CAT.EXE /copy *.*"], ["GATO.EXE /abrir 99 ventanas", "CAT.EXE /open 99 windows"], ["GATO.EXE /fork", "CAT.EXE /fork"]][llenaN % 4]; cmd(c[0], c[1], null, null); }
        if (ts > llenaT) {
          const sube = Math.max(2, JEFE_TOPE * 0.34);
          peligro = Math.max(peligro, Math.min(JEFE_TOPE - 2, peligro + sube));
          cmdRes(`ALERTA: memoria +${Math.round((sube / JEFE_TOPE) * 100)}%, bajala`, `WARNING: memory +${Math.round((sube / JEFE_TOPE) * 100)}%, bring it down`);
          if (!RM) { temblor = 12; interferencia = 10; }
          punch = 2;
          bip(220, 880, 0.25, "sawtooth", 0.06); bip(110, 55, 0.3, "square", 0.05, 0.05);
          llenaN++; llenaAviso = false;
          llenaT = ts + 5.2 + h2(llenaN * 3.7) * 3.4;
        }
      }
      if (secI === 9 && limpieza() >= 1) cmd("SCAN GATO.EXE", "SCAN CAT.EXE", "COMPLETO: virus eliminado", "DONE: virus removed", "limpio");
      if (secI === 9 && ts > R.sec[9][0] + 1.2) cmd("ANTIVIRUS.EXE /limpiar", "ANTIVIRUS.EXE /clean", "limpiando GATO.EXE...", "cleaning CAT.EXE...", "limpia");
    }
    pasoVentanas();
    pasoOrden();
    if (pistaT > 0) pistaT--;
    vu += ((0.25 + energiaAhora * 0.75) * (0.55 + 0.45 * pulso) - vu) * 0.3;
    peligroVis += (peligro - peligroVis) * 0.2;
    // La cámara: late en las partes fuertes, crece en las subidas y sigue al gato en las tranquilas
    const fuerte = (R.fuerte || [1, JEFE, 7]).includes(secI), sube = (R.sube || [3, 6]).includes(secI), calma = (R.tranquila || [2, 5, 8]).includes(secI);
    const kSec = Math.min(1, Math.max(0, (ts - R.sec[secI][0]) / (R.sec[secI][1] - R.sec[secI][0])));
    // En los estribillos el acercamiento es claro y late; en las subidas crece poco a poco; en la calma apenas se nota
    // En la calma, cada tanto la cámara se va con el gato y se le acerca un rato; el recuadro de BIT no se mueve, así que nunca lo tapa
    const visita = ((ts + 3) % 12) / 12, cerca = visita > 0.3 && visita < 0.72;
    const zObj = RM ? 1 : fuerte ? 1.06 + pulso * 0.055 : sube ? 1.015 + kSec * 0.06 + pulso * 0.02 : calma ? (cerca ? 1.2 : 1.05) : 1;
    // Tensión de la terminal: tras el error crítico, con el jefe (más cuanto más llena la memoria) y en la lluvia de código
    tension = RM ? 0 : !UIA() ? (secI === JEFE ? 0.3 : DM() && mundoDe(secI) === "x" ? 0.2 : 0) : secI === 0 && ts >= R.error ? 0.75 : secI === JEFE ? 0.28 + (peligro / JEFE_TOPE) * 0.72 : secI === 6 ? 0.22 + kSec * 0.33 : 0;
    zoom += (zObj - zoom) * (fuerte ? 0.22 : sube ? 0.2 : 0.025);
    focoX += ((calma ? gatoX : gx + W / 2) - focoX) * 0.04;
    focoY += ((calma ? gatoY : gy + H / 2) - focoY) * 0.04;
    // El escenario late con cada bombo
    pulso *= 0.88;
    while (rG < R.golpes.length && R.golpes[rG] <= ts * 100) { rG++; golpeN++; pulso = 1; anillos.push(ts); if (anillos.length > 4) anillos.shift(); programaAtaque(); }
    // El gato gira según la energía de la canción: de un cuarto de vuelta por segundo a casi tres
    energiaAhora = energia(ts);
    vGiro += (0.22 + energiaAhora * energiaAhora * 2.7 - vGiro) * 0.07;
    giro += vGiro / 60 + pulso * 0.003;
    moverBit();
    pasoGato();
    // Cada bug sale con el tiempo justo para llegar a BIT en su nota
    const N = R.notas;
    while (rI * 3 < N.length) {
      if (!activa[rI]) { rI++; continue; }
      const tn = N[rI * 3] / 1000, sec = seccionDe(tn), cruza = sec === VUELO, lat = R.lateral === sec;
      // En el vuelo los bugs no caen: cruzan el recuadro de lado, más despacio al principio para dar tiempo de agarrarle
      const cr = cruza ? (tn < R.sec[VUELO][0] + 6.5 ? CRUCE_LENTO : CRUCE) * D.vel : 0, d = cruza ? cr * 0.56 : R.sec[sec][2] * D.vel;
      if (tn - d > ts) break;
      const c = mapa.c[rI], enFiebre = fiebre > ts, tipo = enFiebre ? "bono" : tipoRun[rI];
      const o = { tipo, c, tn, d, s: sec, x: xBug(c), y: 0 };
      // Entran por la derecha; después del silencio a media sección, por la izquierda
      if (enFiebre) o.nota = true;
      if (cruza) { o.h = (!UIA() ? Math.floor((tn - R.sec[VUELO][0]) / 12) % 2 === 0 : tn < R.sec[VUELO][0] + 16.8) ? 1 : -1; o.cr = cr; o.x = o.h > 0 ? W + 2 : -BW - 2; }
      // El glitch cambia de carril a media caída
      if (tipo === "glitch") o.c2 = c === 0 ? 1 : c === carriles - 1 ? c - 1 : c + (rI % 2 ? 1 : -1);
      objs.push(o);
      if (BICHOS[tipo]) naceBicho(o);
      // En el tramo lateral llegan de lado, por la fila que les toca
      if (lat) { o.lat = true; o.x = W + 2; o.y = filaY(c); for (const b of objs) if (b.tn >= tn && b.s === sec && !b.lat) { b.lat = true; b.x = W + 2; b.y = filaY(b.c); } }
      if (!cruza && !lat) grietas.push({ x: xBug(c) + 4, vida: 16 });
      rI++;
    }
    // Fiebre: lluvia de bugs dorados de premio cerca de BIT. No cuentan como fallo si se escapan
    if (fiebre > ts && t % (vuela ? 6 : 9) === 0) {
      const c = Math.max(0, Math.min(carriles - 1, bit.c + Math.round(azar(-2.4, 2.4)))), d = vuela ? CRUCE * 0.56 : 0.8;
      const o = { tipo: "bono", c, tn: ts + d, d, s: secI, x: xBug(c), y: 0 };
      if (lateral) { o.lat = true; o.x = W + 2; o.y = filaY(c); }
      if (vuela) { o.h = 1; o.cr = CRUCE; o.x = W + 2; }
      objs.push(o);
    }
    const by = bitY(), y0 = 2, yT = by - 5;
    for (const o of objs) {
      const avance = 1 - (o.tn - ts) / o.d;
      if (o.c2 != null && !o.salto && avance > 0.52) { o.salto = true; o.c = o.c2; if (!RM) for (let i = 0; i < 6; i++) chispas.push({ x: o.x + 5, y: o.y + 4, vx: azar(-1.5, 1.5), vy: azar(-1, 1), vida: 10, c: "#00f6ff", g: 1 }); }
      if (o.h) {
        // Cruza de lado y pasa por el centro justo en su nota, ondulando un poco
        o.x = W / 2 - BW / 2 + ((o.h * (o.tn - ts)) / o.cr) * W;
        o.y = 15 + o.c * ((by - 15) / (carriles - 1)) + Math.sin(ts * 4 + o.tn * 3) * 3;
      } else {
        // La polilla cambia de carril con cada golpe y llega a su carril de verdad en el último
        if (o.tipo === "polilla") o.c = o.cf + (Math.max(0, Math.floor((o.tn - ts) / (60 / R.sec[o.s][3]))) % 2 ? o.dirP : 0);
        if (o.lat) {
          // De lado: viajan de la derecha hasta BIT; cambiar de carril es cambiar de fila
          const xx = o.cuelga ? 27 + Math.sin(ts * 22) : 26 + (W + 2 - 26) * (1 - avance);
          o.x = o.suave ? o.x + (xx - o.x) * 0.3 : xx;
          o.y += (filaY(o.c) - o.y) * (o.salto ? 0.5 : 1);
          o.latListo = true;
        } else
        o.x += (xBug(o.c) - o.x) * (o.salto ? 0.5 : 1);
        // El gemelo que espera se queda flotando a la altura de BIT; los que rebotan (acorazado, crías) se mueven suave
        const yy = o.cuelga ? yT - 3 + Math.sin(ts * 22) : y0 + (yT - y0) * avance;
        if (!o.lat) o.y = o.suave ? o.y + (yy - o.y) * 0.3 : yy;
      }
      // Se acabó la espera del gemelo: se va sin castigo
      if (o.cuelga && ts > o.cuelga) { o.fuera = true; textos.push({ txt: T("SE FUE", "GONE"), x: o.x + 5, y: o.y, vida: 34, max: 34, c: "#8f93a8", e: 1 }); continue; }
      // Con la ayuda del reloj, BIT alcanza también los carriles de al lado (las trampas no: esas hay que tocarlas a propósito)
      const alcance = iman > ts && !esTrampa(o) ? 1 : 0;
      const toca = !(o.noAntes > ts) && (vuela || o.h
        ? o.x < bit.x + 11 && o.x + BW > bit.x - 1 && o.y < bit.y + 12 && o.y + BH > bit.y - 1
        : o.lat ? lateral && o.x <= 27 && o.x + BW >= 13 && Math.abs(o.c - bit.c) <= alcance
        : o.y + BH >= by + 1 && o.y <= by + 9 && Math.abs(o.c - bit.c) <= alcance);
      if (toca && esTrampa(o)) {
        // El maldito y el troyano tramposo no se atrapan: tocarlos castiga
        o.fuera = true;
        tramos[o.s][1]++;
        maldito(o, o.tipo === "troya" ? T("TROYANO", "TROJAN") : null);
        if (vidasR <= 0) { muereBit(); return; }
      } else if (toca && o.tipo === "acorazado" && !o.golpe) {
        // Primer toque al acorazado: pierde el casco, rebota y vuelve a caer en el carril de al lado
        o.golpe = 1; o.suave = true; o.salto = true;
        o.c += o.c < 2 ? 1 : o.c > 2 ? -1 : Math.floor(o.tn * 10) % 2 ? 1 : -1;
        o.tn = ts + 0.66; o.d = 1.2; o.noAntes = ts + 0.34;
        pts += 5; aplasta = 5; punch = Math.min(2, punch + 0.6);
        bip(1500, 700, 0.08, "square", 0.05); bip(2100, 0, 0.04, "triangle", 0.04, 0.03);
        textos.push({ txt: "CLANK", x: o.x + 5, y: o.y, vida: 34, max: 34, c: "#c9c6b8", e: 1 });
        if (!RM) for (let i = 0; i < 8; i++) chispas.push({ x: o.x + 5, y: o.y + 2, vx: azar(-2, 2), vy: azar(-2.6, -0.6), vida: 14, c: "#c9c6b8", g: 1 });
        hud();
      } else if (toca) {
        o.fuera = true;
        const antes = nivelCombo();
        combo++;
        if ((o.tipo !== "bono" || o.nota) && !o.libre && !o.cria) { atrapados++; tramos[o.s][0]++; tramos[o.s][1]++; }
        if (G()) luz = Math.min(1, luz + 0.07);
        // En el pueblo cada bug da una campana (el dorado, tres)
        if (DM() && mundoDe(o.s) !== "i" && !o.libre) campanas += o.tipo === "oro" ? 3 : 1;
        if (!o.h) celdas[o.c] = 9;
        if (pistaT > 40 && ++atrapadosPista >= 3) pistaT = 40;
        if (combo > maxCombo) maxCombo = combo;
        const nv = nivelCombo(), tono = TONOS_COMBO[Math.min(nv, TONOS_COMBO.length - 1)];
        // Los de premio valen cada vez más mientras dure la fiebre
        // Gusano: 10, 15 y el tercero 45 · troyano de verdad: 100 · gemelos: doble si se alcanzan los dos
        const pareja = o.tipo === "gemelo" && o.par && o.par.cogido;
        const base = o.tipo === "bono" ? Math.min(60, 15 + fiebreN * 3) : o.tipo === "oro" ? 50 : o.tipo === "arco" ? 100 : o.tipo === "anti" ? 30 : o.tipo === "glitch" ? 25
          : o.tipo === "gusano" ? [10, 15, 45][o.seg || 0] : o.tipo === "troyaOk" ? 100 : pareja ? 80 : BICHOS[o.tipo] ? BICHOS[o.tipo].pts : 10;
        // Los de premio no se multiplican por el combo, solo por la fiebre: si no, los puntos se disparan
        const n = Math.round(base * (o.tipo === "bono" ? 2 : multi()) * (FK() ? 1 + groove / GROOVE_MAX : 1));
        pts += n;
        if (fiebre > ts) { fiebreTotal += n; if (o.tipo === "bono") fiebreN++; }
        atrapa(o, o.tipo === "oro" || o.tipo === "bono" ? "#ffe14a" : o.tipo === "arco" ? SANDE[t % SANDE.length] : o.tipo === "anti" ? "#41B883" : tono, o.tipo === "bug" ? 1 : 2);
        textos.push({ txt: `+${n}`, x: o.x + 5, y: o.y, vida: 38, max: 38, c: o.tipo === "bug" ? tono : "#ffe14a", e: o.tipo === "bug" ? 1 : 1.5 });
        // Cada bug suena un poco más agudo que el anterior: la escala sube con el combo y vuelve a empezar al fallar
        if (o.tipo === "bono") bip(660 * Math.pow(2, Math.min(fiebreN, 26) / 12), 0, 0.06, "square", 0.03);
        else bip(523.25 * Math.pow(2, [0, 2, 4, 7, 9][combo % 5] / 12 + Math.min(2, Math.floor(combo / 10))), 0, 0.07, "triangle", 0.045);
        if (o.tipo === "oro") bip(880, 1760, 0.12, "square", 0.03);
        if (o.tipo === "arco") {
          fiebre = ts + 7;
          fiebreN = 0; fiebreTotal = 0;
          // Mientras dure, TODO lo que cae es de premio: los que ya venían se convierten, no hay rayos y fallar no castiga
          for (const b of objs) if (b !== o && b.tipo !== "bono") { b.nota = !b.libre && !b.cria; b.tipo = "bono"; b.c2 = null; b.cuelga = 0; }
          if (!vuela) ataques = [];
          if (G()) cmd("RUNA.EXE", "RUNE.EXE", "COMPLETO: luz total, todo vale x2", "DONE: full light, everything counts x2"); else cmd("FIEBRE.EXE", "FEVER.EXE", "COMPLETO: todo vale x2", "DONE: everything counts x2");
          punch = 2;
          [659, 880, 1109, 1319, 1760].forEach((f, i) => bip(f, 0, 0.09, "square", 0.035, i * 0.05));
        } else if (o.tipo === "gemelo") {
          o.cogido = true;
          const g = o.par;
          if (pareja) { textos.push({ txt: T("¡PAREJA!", "PAIR!"), x: o.x + 5, y: o.y - 8, vida: 44, max: 44, c: "#38BDF8", e: 1.5 }); [784, 1175].forEach((f, i) => bip(f, 0, 0.09, "square", 0.04, i * 0.06)); }
          else if (g && !g.fuera) {
            // El otro espera un momento. Si se atrapó primero al acompañante, la nota ya cuenta como atrapada
            g.cuelga = ts + 0.55;
            if (o.libre) { g.libre = true; atrapados++; tramos[g.s][0]++; tramos[g.s][1]++; }
          }
        } else if (o.tipo === "bomba") {
          // Estalla: todo lo que haya en pantalla cuenta como atrapado (las trampas simplemente desaparecen)
          let n2 = 0;
          for (const b of objs) {
            if (b === o || b.fuera) continue;
            b.fuera = true;
            if (!esTrampa(b) && !b.libre && !b.cria && (b.tipo !== "bono" || b.nota)) { atrapados++; tramos[b.s][0]++; tramos[b.s][1]++; pts += 10; n2++; }
            else if (esTrampa(b)) { atrapados++; tramos[b.s][0]++; tramos[b.s][1]++; }
            if (!RM) for (let i = 0; i < 6; i++) chispas.push({ x: b.x + 5, y: b.y + 4, vx: azar(-2.5, 2.5), vy: azar(-2.5, 1), vida: 16, c: i % 2 ? "#ffe14a" : "#F28C28", g: 2 });
          }
          textos.push({ txt: n2 ? `BOOM +${n2 * 10}` : "BOOM", x: W / 2, y: H * 0.45, vida: 55, max: 55, c: "#F28C28", e: 2 });
          if (!RM) { temblor = 10; cambio = 12; }
          punch = 2;
          bip(160, 40, 0.4, "sawtooth", 0.09); bip(90, 30, 0.45, "square", 0.07, 0.02);
        } else if (o.tipo === "reloj") {
          iman = ts + 5;
          [988, 1319, 1976].forEach((f, i) => bip(f, 0, 0.09, "triangle", 0.045, i * 0.06));
        } else if (o.tipo === "anti") {
          peligro = Math.max(0, peligro - 2);
          cmd("ANTIVIRUS.EXE", "ANTIVIRUS.EXE", "COMPLETO: memoria liberada", "DONE: memory freed");
        } else if (nv > antes) {
          // Nivel de combo nuevo: el grito cae sobre BIT, con fanfarria y un golpe de cámara más fuerte
          grita(nv);
          punch = 2;
          [0, 4, 7, 12].forEach((st, i) => bip(523.25 * Math.pow(2, (st + nv) / 12), 0, 0.08, "square", 0.035, i * 0.045));
          if (!RM) for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; chispas.push({ x: bit.x + 5, y: bit.y + 4, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3 - 0.5, vida: 20, c: i % 2 ? tono : "#ffffff", g: 2 }); }
        }
        boca = "s"; bocaT = 24;
        // La epidemia de terminales: desde los 3 seguidos ya se nota, y crece rápido hasta el bum, bum, bum.
        // 3 a 9 seguidos: una cada dos bugs · 10 a 24: casi una por bug · 25 a 59: una y a veces dos · 60 a 99: una o dos · 100 o más: dos o tres
        ultN = n;
        const cuantas = combo < 3 ? 0 : combo < 10 ? (combo % 2 ? 1 : 0) : combo < 25 ? (Math.random() < 0.75 ? 1 : 0) : combo < 60 ? 1 + (Math.random() < 0.35 ? 1 : 0) : combo < 100 ? 1 + (Math.random() < 0.65 ? 1 : 0) : 2 + (Math.random() < 0.5 ? 1 : 0);
        if (nv > antes) pideVentanas(1 + Math.min(3, cuantas), "nivel");
        else if (o.tipo !== "bug" && o.tipo !== "bono") pideVentanas(1 + cuantas, "especial", o.tipo);
        else if (o.tipo === "bono") pideVentanas(Math.max(1, cuantas), "pts", n);
        else if (cuantas) pideVentanas(cuantas, Math.random() < 0.6 ? "combo" : "pts", n);
        // Cada tantos seguidos, BIT recupera una vida
        if (combo % D.regen === 0 && vidasR < D.vidas) { vidasR++; vidaFx = 40; textos.push({ txt: T("+1 VIDA", "+1 LIFE"), x: W / 2, y: H * 0.4, vida: 60, max: 60, c: "#41B883", e: 1 }); [784, 1047, 1319].forEach((f, i) => bip(f, 0, 0.1, "triangle", 0.05, i * 0.07)); }
        if (secI === JEFE) peligro = Math.max(0, peligro - JEFE_BAJA);
        hud();
      } else if (o.h ? ts - o.tn > o.cr * 0.56 : o.lat ? o.x < 9 : o.y + BH >= piso()) {
        o.fuera = true;
        if (o.tipo === "bono" || o.libre) continue;
        // El reloj es de ayuda: si se escapa no pasa nada
        if (o.tipo === "reloj") { atrapados++; tramos[o.s][0]++; tramos[o.s][1]++; continue; }
        // El nido revienta en el piso: tres crías rebotan hacia arriba y vuelven a caer regadas
        if (o.tipo === "nido") {
          [-1, 0, 1].forEach((dc, k) => objs.push({ tipo: "cria", cria: true, suave: true, c: Math.max(0, Math.min(carriles - 1, o.c + dc)), tn: ts + 1.05 + k * 0.3, d: 1.5, s: o.s, x: o.x, y: o.y, lat: o.lat }));
          bip(300, 900, 0.15, "square", 0.05);
          if (!RM) for (let i = 0; i < 10; i++) chispas.push({ x: o.x + 5, y: o.y + 6, vx: azar(-2.2, 2.2), vy: azar(-3, -1), vida: 16, c: "#ECEBE4", g: 1 });
        }
        if (o.cria) { falla(o); if (vidasR <= 0) { muereBit(); return; } continue; }
        // Dejar pasar al maldito o al troyano tramposo es lo correcto: cuenta como atrapado
        if (esTrampa(o)) { atrapados++; tramos[o.s][0]++; tramos[o.s][1]++; pts += 5; bip(330, 0, 0.04, "triangle", 0.025); continue; }
        tramos[o.s][1]++;
        falla(o);
        if (peligro >= JEFE_TOPE || vidasR <= 0) { muereBit(); return; }
      }
    }
    objs = objs.filter((o) => !o.fuera);
    // Los rayos del gato caen justo en el bombo que avisaron
    for (const a of ataques) {
      if (a.hecho || ts < a.t1) continue;
      a.hecho = true;
      bip(1400, 200, 0.12, "sawtooth", 0.04);
      const da = a.tipo === "v" ? bit.c === a.c && !vuela : a.tipo === "x" ? Math.abs(bit.x + 5 - a.x) < 7.5 : Math.abs(bit.y + 6 - a.y) < 6.5;
      if (da && invul <= 0) { golpeado(); if (vidasR <= 0) { muereBit(); return; } }
    }
    ataques = ataques.filter((a) => ts < a.t1 + 0.24);
    // Se acaba la fiebre: la cuenta de lo ganado
    if (fiebre && ts > fiebre) {
      fiebre = 0;
      cmd(G() ? "RUNA.EXE /fin" : "FIEBRE.EXE /fin", G() ? "RUNE.EXE /end" : "FEVER.EXE /end", `COMPLETO: +${fiebreTotal} puntos`, `DONE: +${fiebreTotal} points`);
      [784, 988, 1175, 1568].forEach((f, i) => bip(f, 0, 0.1, "square", 0.035, i * 0.07));
      hud();
    }
  }
  // Con cada bombo el gato puede apuntar un rayo: avisa ahora y cae con el bombo siguiente
  function programaAtaque() {
    // Con fiebre el jefe deja de disparar; en el vuelo no: ahí los rayos siguen igual
    if (rG >= R.golpes.length || (fiebre > ts && !vuela)) return;
    const t1 = R.golpes[rG] / 100;
    if (t1 - ts < 0.3 || t1 - ts > 0.9) return;
    if (secI === JEFE && ts > R.sec[JEFE][0] + 4.5 && golpeN % (UIA() ? 4 : 3) === 0) {
      // Con el jefe apunta al carril de BIT, salvo que ahí vaya a caer un bug en ese mismo instante
      const c = bit.c;
      if (objs.some((o) => (o.c === c || o.c2 === c) && Math.abs(o.tn - t1) < 0.3)) return;
      ataques.push({ tipo: "v", c, t0: ts, t1 });
      if (UIA()) cmd("RAYO.EXE", "BOLT.EXE", "ALERTA: sal de la franja rosa", "WARNING: leave the pink strip", "rayos");
    } else if (vuela && energiaAhora > 0.4 && ts > R.sec[VUELO][0] + 5 && golpeN % Math.max(1, D.rayoV - 1) === 0) {
      // En el vuelo los rayos no paran y van cambiando de figura: uno de arriba abajo donde esté BIT, uno de lado a lado,
      // la cruz (los dos a la vez), la jaula (dos a los lados: no te muevas), el pasillo (dos de lado a lado) y el barrido
      // (tres de arriba abajo que cruzan la pantalla uno tras otro)
      if (FK()) cmd("LASER.EXE", "LASER.EXE", "ALERTA: esquiva las franjas de luz", "WARNING: dodge the light strips", "rayosVuelo"); else if (!UIA()) cmd("FUEGO.EXE", "FIRE.EXE", "ALERTA: esquiva las franjas de fuego", "WARNING: dodge the fire strips", "rayosVuelo"); else cmd("RAYO.EXE", "BOLT.EXE", "ALERTA: esquiva las franjas rosas", "WARNING: dodge the pink strips", "rayosVuelo");
      // Avisan con dos golpes de anticipación (poco más de un segundo), para que dé tiempo de salir también con el dedo
      const tv = rG + 1 < R.golpes.length && R.golpes[rG + 1] / 100 - ts < 1.6 ? R.golpes[rG + 1] / 100 : t1;
      const bx = bit.x + 5, by = bit.y + 6, pon = (tipo, v, dt = 0) => ataques.push(tipo === "x" ? { tipo, x: Math.max(8, Math.min(W - 8, v)), t0: ts, t1: tv + dt } : { tipo, y: Math.max(18, Math.min(piso() - 8, v)), t0: ts, t1: tv + dt });
      switch (rayoN++ % 6) {
        case 0: pon("x", bx); break;
        case 1: pon("h", by); break;
        case 2: pon("x", bx); pon("h", by); break;
        case 3: pon("x", bx - 22); pon("x", bx + 22); break;
        case 4: pon("h", by - 19); pon("h", by + 19); break;
        default: { const d = bx < W / 2 ? 1 : -1; [0, 1, 2].forEach((n) => pon("x", W / 2 + d * (n - 1) * W * 0.32, n * 0.2)); }
      }
    }
  }

  /* ---------- 11. Movimiento de BIT y el paso del modo clásico ---------- */
  // Modo clásico: nace un bug en un carril al azar
  function nace() {
    const r = Math.random();
    const tipo = vidas < 3 && r < 0.05 ? "cafe" : r < 0.13 ? "oro" : "bug";
    const v = (0.42 + nivel * 0.07) * (tipo === "oro" ? 1.45 : tipo === "cafe" ? 0.8 : 1) * azar(0.85, 1.15);
    const c = (Math.random() * carriles) | 0;
    objs.push({ tipo, c, x: xBug(c), y: 1, v, e: "ABCDE"[nivel % 5] });
    grietas.push({ x: xBug(c) + 4, vida: 16 });
  }
  // BIT salta de carril en carril: un salto por toque y, si dejas la tecla, sigue saltando rápido.
  // Con el mouse o el dedo, brinca directo al carril que señalas.
  function saltaA(c) {
    c = Math.max(0, Math.min(carriles - 1, c));
    if (c === bit.c) return;
    if (FK() && modo === "ritmo" && estado === "jugando" && !vuela) alCompas();
    // Donde arrancó el salto queda una copia que tarda más en irse
    const f = fuerzaEstela();
    if (!RM) { if (f >= 2) ecos.push({ x: bit.x, y: bit.y, vida: 30, max: 30, c: SANDE[0] }); else if (!f) fantasmas.push({ x: bit.x, vida: 6 }); }
    bit.c = c;
    estira = 1;
  }
  // FUTURE FUNK: si el salto cae a menos de una décima de segundo de un golpe de la música, sube el groove
  function alCompas() {
    const g = R.golpes;
    let mejor = 9;
    for (let i = Math.max(0, rG - 2); i < Math.min(g.length, rG + 2); i++) mejor = Math.min(mejor, Math.abs(g[i] / 100 - ts));
    if (mejor > 0.1) return;
    grooveT = ts; grooveFx = 9;
    bip(2600, 0, 0.02, "square", 0.018); bip(1300, 0, 0.03, "triangle", 0.02);
    if (groove < GROOVE_MAX && ++groove === GROOVE_MAX) {
      textos.push({ txt: "GROOVE x2", x: W / 2, y: H * 0.4, vida: 60, max: 60, c: "#00f6ff", e: 1.5 });
      [659, 880, 1109, 1319].forEach((f, i) => bip(f, 0, 0.09, "square", 0.035, i * 0.05));
    }
    if (!RM) for (let i = 0; i < 6; i++) chispas.push({ x: bit.x + 5, y: bit.y + 11, vx: azar(-1.8, 1.8), vy: azar(-1.6, -0.4), vida: 12, c: i % 2 ? "#00f6ff" : "#ff3fb4", g: 1 });
  }
  // Qué tanta estela deja BIT: 0 nada, 1 corta y azul (partes tranquilas), 2 larga, 3 larga y a todo color (estribillos, vuelo, fiebre)
  function fuerzaEstela() {
    if (modo !== "ritmo" || secI < 0) return 0;
    if (vuela || fiebre > ts || (FK() && groove >= GROOVE_MAX)) return 3;
    return (R.fuerte || [1, JEFE]).includes(secI) ? 3 : (R.sube || [3, 6]).includes(secI) ? 2 : secI === 0 || secI === R.sec.length - 1 ? 0 : 1;
  }
  function dejaEstela() {
    const f = fuerzaEstela();
    if (!f || RM) return;
    const vida = f === 3 ? 24 : f === 2 ? 17 : 10;
    ecos.push({ x: bit.x, y: bit.y, vida, max: vida, c: f === 1 ? SANDE[1 + (ecoN++ % 3)] : SANDE[ecoN++ % SANDE.length] });
    if (ecos.length > 70) ecos.splice(0, ecos.length - 70);
  }
  function moverBit() {
    if (vuela) {
      // Vuelo libre: flechas o WASD en las cuatro direcciones, o seguir al puntero
      const tope = W > 150 ? 3.1 : 2.4, ax = (der ? 1 : 0) - (izq ? 1 : 0), ay = (aba ? 1 : 0) - (arr ? 1 : 0);
      if (ax || ay) { meta = null; vx = Math.max(-tope, Math.min(tope, vx + ax * 0.75)); vy = Math.max(-tope, Math.min(tope, vy + ay * 0.75)); }
      else if (meta != null) { vx = Math.max(-4.5, Math.min(4.5, (meta - 5 - bit.x) * 0.3)); vy = Math.max(-4.5, Math.min(4.5, (metaY - 6 - bit.y) * 0.3)); }
      if (!ax && meta == null) vx *= 0.72;
      if (!ay && meta == null) vy *= 0.72;
      bit.x = Math.max(0, Math.min(W - 10, bit.x + vx));
      bit.y = Math.max(12, Math.min(bitY(), bit.y + vy));
      bit.c = Math.max(0, Math.min(carriles - 1, Math.floor((bit.x + 5) / LW)));
      if (Math.abs(vx) + Math.abs(vy) > 0.7 && t % 2 === 0) dejaEstela();
      return;
    }
    if (lateral) {
      // Tramo lateral: BIT se queda a la izquierda y cambia de fila; el dedo o el mouse lo llevan a la fila que señalan
      if (meta != null && metaY != null) saltaA(Math.round((metaY - 6 - filaY(0)) / ((piso() - 28) / (carriles - 1))));
      const ty = filaY(bit.c), dy = ty - bit.y;
      if (Math.abs(dy) > 0.5) { bit.y = Math.abs(dy) <= 7 ? ty : bit.y + Math.sign(dy) * 7; dejaEstela(); if (bit.y === ty) aplasta = 5; }
      bit.x += (14 - bit.x) * 0.3;
      if (Math.abs(14 - bit.x) < 0.6) bit.x = 14;
      return;
    }
    if (dirTecla) { meta = null; if (--rep <= 0) { saltaA(bit.c + dirTecla); rep = 11; } }
    else if (meta != null) saltaA(Math.floor(meta / LW));
    // El salto es una carrera corta de dos o tres cuadros hasta el carril nuevo, dejando estela
    const tx = xBit(bit.c), d = tx - bit.x, v = Math.max(5, LW / 3);
    if (d) {
      // Dos copias por cuadro: la estela sale tupida aunque el salto dure un instante
      const x0 = bit.x;
      bit.x = Math.abs(d) <= v ? tx : bit.x + Math.sign(d) * v;
      const x1 = bit.x;
      bit.x = (x0 + x1) / 2; dejaEstela();
      bit.x = x1; dejaEstela();
      // Al llegar frena de golpe: se aplasta y levanta polvo
      if (x1 === tx) {
        estira = 0; aplasta = 5;
        if (!RM) for (let i = 0; i < 4; i++) chispas.push({ x: tx + (i % 2 ? 9 : 0), y: bit.y + 11, vx: (i % 2 ? 1 : -1) * azar(0.4, 1.3), vy: azar(-0.9, -0.2), vida: 9, c: "#8f93a8", g: 1 });
      }
    }
    const dy = bitY() - bit.y;
    bit.y = Math.abs(dy) < 1 ? bitY() : bit.y + dy * 0.3;
  }
  // Al atrapar: onda, pedazos de color que saltan, BIT brilla y se aplasta, y la cámara da un golpecito
  function atrapa(o, color, fuerza = 1) {
    aplasta = 5;
    brillo = 3;
    brinco = 6;
    punch = Math.min(2, punch + 0.55 * fuerza);
    if (RM) return;
    ondas.push({ x: o.x + 5, y: o.y + 4, vida: 10, max: 10, c: color, r: 5 + fuerza * 3 });
    for (let i = 0; i < 9 + fuerza * 5; i++) chispas.push({ x: o.x + 5, y: o.y + 4, vx: azar(-2.3, 2.3), vy: azar(-3, -0.4), vida: 14 + ((Math.random() * 10) | 0), c: i % 3 === 0 ? "#ffffff" : color, g: i % 2 ? 2 : 1 });
  }
  function paso() {
    t++;
    if (mensajeT > 0 && --mensajeT === 0) mensaje = "";
    if (bocaT > 0 && --bocaT === 0) boca = "n";
    if (temblor > 0) temblor--;
    if (--parpadeo < -150) parpadeo = 6;
    grietas.forEach((g) => g.vida--); grietas = grietas.filter((g) => g.vida > 0);
    destellos.forEach((d) => d.vida--); destellos = destellos.filter((d) => d.vida > 0);
    // Los puntos saltan de golpe y luego flotan
    textos.forEach((x) => { x.y -= x.vida > (x.max || 40) - 6 ? 1.6 : 0.3; x.vida--; }); textos = textos.filter((x) => x.vida > 0);
    fantasmas.forEach((f) => f.vida--); fantasmas = fantasmas.filter((f) => f.vida > 0);
    ecos.forEach((f) => f.vida--); ecos = ecos.filter((f) => f.vida > 0);
    ondas.forEach((f) => f.vida--); ondas = ondas.filter((f) => f.vida > 0);
    burbujas.forEach((b) => { b.y -= 0.45; b.x += Math.sin((t + b.vida) * 0.2) * 0.3; b.vida--; }); burbujas = burbujas.filter((b) => b.vida > 0 && b.y > 10);
    if (brillo > 0) brillo--;
    if (brinco > 0) brinco--;
    for (let i = 0; i < celdas.length; i++) if (celdas[i] > 0) celdas[i]--;
    punch *= 0.8;
    if (dano > 0) dano--;
    if (interferencia > 0) interferencia--;
    chispas.forEach((c) => { c.x += c.vx; c.y += c.vy; c.vy += 0.16; c.vida--; }); chispas = chispas.filter((c) => c.vida > 0);
    if (aplasta > 0) aplasta--;
    if (destello > 0) destello--;
    if (grooveFx > 0) grooveFx--;
    latK += ((lateral && estado !== "titulo" ? 1 : 0) - latK) * 0.1;
    if (estado === "cierre" && cierre) { pasoCierre(); return; }
    if (estado !== "jugando") return;
    if (modo === "ritmo") { pasoRitmo(); return; }
    if (pistaT > 0 && --pistaT === 280) { if (tactil) cmd("BIT.EXE", "BIT.EXE", "OK: toca un carril o desliza", "OK: tap a lane or slide", "controles"); else cmd("BIT.EXE", "BIT.EXE", "OK: flechas o A/D, un salto por toque", "OK: arrows or A/D, one hop per tap", "controles"); }
    pasoOrden();
    moverBit();
    // Bugs: cada versión salen más seguido y más rápido
    if (--sig <= 0) { nace(); sig = Math.max(20, 60 - nivel * 5) * azar(0.7, 1.2); }
    const by = bitY();
    for (const o of objs) {
      o.y += o.v;
      o.x = xBug(o.c);
      if (o.y + BH >= by + 1 && o.y <= by + 9 && o.c === bit.c) {
        o.fuera = true;
        atrapa(o, o.tipo === "oro" ? "#ffe14a" : o.tipo === "cafe" ? "#ffffff" : col.R, o.tipo === "bug" ? 1 : 2);
        if (o.tipo === "cafe") { vidas = Math.min(3, vidas + 1); textos.push({ txt: "+1", x: o.x + 5, y: o.y, vida: 40, max: 40, c: col.R, e: 1 }); bip(523, 0, 0.09); bip(784, 0, 0.12, "square", 0.05, 0.1); }
        else {
          const n = o.tipo === "oro" ? 50 : 10;
          const antes = Math.floor(pts / 100);
          pts += n;
          textos.push({ txt: `+${n}`, x: o.x + 5, y: o.y, vida: 40, max: 40, c: o.tipo === "oro" ? col.Y : col.W, e: 1 });
          bip(o.tipo === "oro" ? 880 : 660, o.tipo === "oro" ? 1760 : 990, o.tipo === "oro" ? 0.16 : 0.08);
          if (Math.floor(pts / 100) > antes) {
            nivel = Math.floor(pts / 100);
            mensaje = T(`LANZAMIENTO v1.${nivel}`, `RELEASE v1.${nivel}`);
            mensajeT = 90;
            [523, 659, 784, 1047].forEach((f, i) => bip(f, 0, 0.09, "square", 0.04, 0.12 + i * 0.08));
          }
        }
        boca = "s"; bocaT = 24;
        hud();
      } else if (o.y + BH >= piso()) {
        o.fuera = true;
        if (o.tipo === "cafe") continue;
        vidas--;
        destellos.push({ x: o.x, vida: 30 });
        mensaje = T("¡BUG EN PRODUCCION!", "BUG IN PRODUCTION!");
        mensajeT = 70;
        boca = "o"; bocaT = 45;
        if (!RM) temblor = 10;
        bip(180, 70, 0.3, "sawtooth", 0.06);
        hud();
        if (vidas <= 0) { fin(); break; }
      }
    }
    objs = objs.filter((o) => !o.fuera);
  }

  /* ---------- 12. Dibujo del recuadro del juego ---------- */
  function dibuja() {
    const ritmo = modo === "ritmo" && estado !== "cargando" && secI >= 0;
    ctx.save();
    // En ritmo el recuadro es una ventana: el escenario se ve a través, apenas oscurecido para que los bugs resalten
    if (ritmo) ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = ritmo ? "rgba(2,4,10,.56)" : col.F;
    ctx.fillRect(0, 0, W, H);
    // Por dentro es una terminal: renglones de barrido y una guía tenue entre carriles
    ctx.fillStyle = "rgba(0,0,0,.16)";
    for (let y = 9; y < piso(); y += 2) ctx.fillRect(0, y, W, 1);
    if (lateral) { ctx.fillStyle = "rgba(255,255,255,.06)"; for (let c = 0; c < carriles - 1; c++) for (let x = 12; x < W; x += 4) ctx.fillRect(x, Math.round((filaY(c) + filaY(c + 1)) / 2) + 6, 2, 1); }
    else if (!vuela) { ctx.fillStyle = "rgba(255,255,255,.06)"; for (let c = 1; c < carriles; c++) for (let y = 11; y < piso(); y += 4) ctx.fillRect(Math.round(c * LW), y, 1, 2); }
    // El multiplicador de la racha, enorme y tenue al fondo del recuadro: va detrás de todo, así que no tapa nada
    if (ritmo && estado === "jugando" && nivelCombo() > 0) {
      const nv = nivelCombo(), k = W > 150 ? 9 : 6, txt = `X${multi()}`;
      ctx.save();
      ctx.translate(Math.round(W / 2 - (txt.length * 4 - 1) * k / 2), Math.round(9 + (piso() - 9) * 0.5 - 2.5 * k));
      ctx.scale(k, k);
      ctx.globalAlpha = Math.min(0.3, 0.11 + punch * 0.1);
      letras(txt, 0, 0, TONOS_COMBO[Math.min(nv, TONOS_COMBO.length - 1)]);
      ctx.restore();
    }
    if (temblor) ctx.translate(temblor % 2 ? 1 : -1, 0);
    // La memoria que GATO.EXE va llenando: celdas que suben desde el piso, verdes, luego amarillas, luego rojas
    if (ritmo && peligroVis > 0.03) {
      const alto = piso() - 9, pct = Math.min(1, peligroVis / JEFE_TOPE), hp = alto * pct, cima = piso() - hp, tw = W / 10;
      const alerta = peligro >= JEFE_TOPE - 2, base = pct < 0.38 ? col.V : pct < 0.68 ? col.Y : col.R;
      ctx.save();
      ctx.beginPath(); ctx.rect(0, cima, W, hp); ctx.clip();
      for (let j = 0; piso() - j * 6 > cima; j++) for (let i = 0; i < 10; i++) {
        ctx.fillStyle = alerta && (t >> 2) % 2 ? osc(col.R, 0.9) : osc(base, h2(i * 7 + j * 13 + (golpeN >> 1)) < 0.2 ? 0.75 : 0.42);
        ctx.fillRect(Math.round(i * tw), piso() - (j + 1) * 6, Math.ceil(tw) - 1, 5);
      }
      ctx.restore();
      ctx.fillStyle = dano > 0 ? "#ffffff" : base;
      ctx.fillRect(0, Math.round(cima), W, 1);
      // Cuánta memoria va ocupada, y la línea donde el programa truena
      ctx.fillStyle = "rgba(0,0,0,.7)";
      ctx.fillRect(1, Math.round(cima) - 8, 35, 7);
      letras(`M:${Math.round((peligro / JEFE_TOPE) * 100)}%`, 3, Math.round(cima) - 7, alerta ? "R" : "W");
      ctx.fillStyle = alerta && (t >> 2) % 2 ? "#ffffff" : col.R;
      for (let x = (t >> 2) % 6; x < W; x += 6) ctx.fillRect(x, 10, 3, 1);
    }
    // Los rayos del gato: primero una franja que avisa (cada vez más marcada), luego el rayo
    // (en el GRIMORIO son columnas de fuego, en naranja)
    const cA = UIA() ? "#ff2e7e" : FK() ? "#00f6ff" : "#ff7a1a", rA = UIA() ? "255,46,126" : FK() ? "0,246,255" : "255,122,26";
    for (const a of ataques) {
      const k = Math.min(1, (ts - a.t0) / (a.t1 - a.t0));
      const [x, y, w, hh] = a.tipo === "v" ? [Math.round(a.c * LW) + 1, 9, Math.round(LW) - 1, piso() - 9] : a.tipo === "x" ? [Math.round(a.x) - 8, 9, 16, piso() - 9] : [0, Math.round(a.y) - 7, W, 14];
      if (!a.hecho) {
        // El aviso: una franja tenue con el centro que se va llenando; cuando se llena del todo, cae el golpe
        ctx.fillStyle = `rgba(${rA},.1)`;
        ctx.fillRect(x, y, w, hh);
        ctx.fillStyle = `rgba(${rA},.3)`;
        if (a.tipo === "h") ctx.fillRect(x, Math.round(y + (hh / 2) * (1 - k)), w, Math.max(1, Math.round(hh * k)));
        else ctx.fillRect(Math.round(x + (w / 2) * (1 - k)), y, Math.max(1, Math.round(w * k)), hh);
        ctx.fillStyle = (t >> 2) % 2 ? cA : "#ffffff";
        if (a.tipo === "h") { for (let i = (t >> 1) % 6; i < W; i += 6) { ctx.fillRect(i, y, 3, 1); ctx.fillRect(i, y + hh - 1, 3, 1); } }
        else { for (let i = 9 + ((t >> 1) % 6); i < piso(); i += 6) { ctx.fillRect(x, i, 1, 3); ctx.fillRect(x + w - 1, i, 1, 3); } }
        rotulo("!", a.tipo === "h" ? 8 : x + w / 2, a.tipo === "h" ? y + 11 : 22, (t >> 2) % 2 ? "#ffffff" : cA);
      } else {
        const edad = (ts - a.t1) / 0.24;
        ctx.globalAlpha = Math.max(0, 1 - edad);
        // El golpe: un fogonazo blanco y luego el color
        ctx.fillStyle = edad < 0.35 ? "#ffffff" : cA;
        ctx.fillRect(x, y, w, hh);
        ctx.fillStyle = edad < 0.35 ? cA : UIA() ? "#ffffff" : FK() ? "#ff3fb4" : "#ffe14a";
        // El rayo en zigzag
        if (a.tipo === "h") { let yy = y + hh / 2; for (let i = 0; i < W; i += 4) { const ny = y + 2 + Math.random() * (hh - 4); ctx.fillRect(i, Math.round(Math.min(yy, ny)), 4, Math.max(2, Math.round(Math.abs(ny - yy)))); yy = ny; } }
        else { let xx = x + w / 2; for (let i = 9; i < piso(); i += 4) { const nx = x + 2 + Math.random() * (w - 4); ctx.fillRect(Math.round(Math.min(xx, nx)), i, Math.max(2, Math.round(Math.abs(nx - xx))), 4); xx = nx; } }
        ctx.globalAlpha = 1;
      }
    }
    const MU = G() ? MUTA_G : DM() ? MUTA_D : FK() ? MUTA_F : MUTA;
    for (const o of objs) {
      let sp, mp = null, ox = 0;
      const cuadro = (t >> 3) % 2;
      if (o.tipo === "cafe") sp = CAFE;
      else if (o.tipo === "anti") sp = ANTIVIRUS;
      else if (modo !== "ritmo") { sp = ESPECIES[o.e || "A"][cuadro]; mp = o.tipo === "oro" ? ORO_MAPA : null; }
      else if (o.tipo === "cria") sp = CRIA;
      else if (BICHOS[o.tipo]) {
        const b = BICHOS[o.tipo], av = 1 - (o.tn - ts) / o.d;
        sp = o.tipo === "gusano" && o.seg ? GUSANO_CUERPO : b.sp;
        mp = b.m;
        // El troyano tramposo enseña los ojos rojos a media caída; el de verdad los tiene dorados siempre
        if (b === BICHOS.troya) mp = { R: o.tipo === "troya" && av > 0.38 && av < 0.8 && (t >> 2) % 2 ? "#ff3d3d" : "Y", Q: "Q" };
        // Tras el primer toque, el acorazado ya no trae casco
        if (o.tipo === "acorazado" && o.golpe) mp = { G: "N", W: "N", Z: "#8a4a10" };
        // El fantasma se desvanece a media caída y vuelve a verse al llegar
        if (o.tipo === "fantasma") ctx.globalAlpha = av < 0.2 ? 1 : av < 0.3 ? 1 - (av - 0.2) * 9.6 : av < 0.74 ? 0.04 : Math.min(1, 0.04 + (av - 0.74) * 12);
        // La polilla avisa hacia dónde va a brincar
        if (o.tipo === "polilla" && (t >> 2) % 2) { const n = Math.floor((o.tn - ts) / (60 / R.sec[o.s][3])); if (n > 0) { const d = n % 2 ? -o.dirP : o.dirP; ctx.fillStyle = "#ff3fb4"; ctx.fillRect(Math.round(o.x) + (d > 0 ? 12 : -4), Math.round(o.y) + 3, 3, 3); } }
        // El rayo que une a los gemelos
        if (o.tipo === "gemelo" && !o.libre && o.par && !o.par.fuera && !o.cogido && !o.par.cogido) { ctx.fillStyle = (t >> 1) % 2 ? "#ffffff" : "#38BDF8"; const xa = Math.min(o.x, o.par.x) + BW, xb = Math.max(o.x, o.par.x); for (let x = xa; x < xb; x += 3) ctx.fillRect(Math.round(x), Math.round(o.y) + 4 + ((x + t) % 2 | 0), 2, 1); }
        // El gemelo que espera parpadea: queda poco
        if (o.cuelga && (t >> 1) % 2) mp = { C: "#ffffff" };
      }
      else if (o.tipo === "mal") { sp = ESPECIES.G[cuadro]; mp = { R: (t >> 3) % 2 ? "#d44bff" : "#a259ff", Z: "#3a0d5c", K: "#ffffff" }; }
      else if (o.tipo === "arco" && G()) { sp = RUNA; mp = { R: SANDE[(t >> 2) % SANDE.length] }; }
      else if (o.tipo === "bono") { sp = ESPECIES[MU[o.s][0]][cuadro]; mp = { R: SANDE[((t >> 2) + ((o.tn * 7) | 0)) % SANDE.length], Z: "#ffffff" }; }
      else {
        const [esp, m] = MU[o.s];
        sp = ESPECIES[o.tipo === "glitch" ? "D" : esp][cuadro];
        // Especiales: dorado; arcoíris, que cambia de color sin parar; glitch, blanco y tembloroso
        mp = o.tipo === "oro" ? ORO_MAPA : o.tipo === "arco" ? { R: SANDE[(t >> 2) % SANDE.length], Z: "#ffffff" } : o.tipo === "glitch" ? { R: "W", Z: "C" } : m;
        if (o.tipo === "glitch" && !RM && (t >> 1) % 3 === 0) ox = Math.random() < 0.5 ? -1 : 1;
      }
      // En ritmo, un contorno negro con la forma del bug para que se distinga sobre cualquier escenario
      if (ritmo && o.tipo !== "cria") contorno(sp, o.x + ox, o.y);
      // El maldito lleva un aura morada que late
      if (o.tipo === "mal") { ctx.fillStyle = `rgba(212,75,255,${(t >> 2) % 2 ? 0.34 : 0.18})`; ctx.fillRect(Math.round(o.x) - 2, Math.round(o.y) - 2, BW + 4, BH + 4); }
      pinta(sp, o.x + ox, o.y, mp);
      ctx.globalAlpha = 1;
      // La bomba chispea por la mecha
      if (o.tipo === "bomba" && !RM && t % 3 === 0) chispas.push({ x: o.x + 7, y: o.y, vx: azar(-0.6, 0.6), vy: -0.8, vida: 7, c: t % 2 ? "#ffe14a" : "#ffffff", g: 1 });
      // El glitch avisa hacia dónde va a brincar
      if (o.tipo === "glitch" && !o.salto && (t >> 2) % 2) { const d = o.c2 > o.c ? 1 : -1; ctx.fillStyle = "#00f6ff"; ctx.fillRect(Math.round(o.x) + (d > 0 ? 12 : -4), Math.round(o.y) + 3, 3, 3); ctx.fillRect(Math.round(o.x) + (d > 0 ? 15 : -5), Math.round(o.y) + 4, 1, 1); }
      // Dorados y arcoíris sueltan destellos
      if ((o.tipo === "oro" || o.tipo === "arco") && !RM && t % 4 === 0) chispas.push({ x: o.x + Math.random() * BW, y: o.y + Math.random() * BH, vx: 0, vy: -0.4, vida: 8, c: o.tipo === "oro" ? "#ffe14a" : SANDE[t % SANDE.length], g: 1 });
    }
    for (const b of burbujas) { ctx.fillStyle = "#bfe9ff"; ctx.fillRect(Math.round(b.x), Math.round(b.y), b.g, b.g); }
    // Ondas cuadradas que se abren donde se atrapó un bug
    for (const f of ondas) {
      const k = 1 - f.vida / f.max, r = Math.round(3 + k * f.r * 2), X = Math.round(f.x), Y = Math.round(f.y);
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = k < 0.25 ? "#ffffff" : f.c;
      ctx.fillRect(X - r, Y - r, r * 2, 1); ctx.fillRect(X - r, Y + r, r * 2 + 1, 1); ctx.fillRect(X - r, Y - r, 1, r * 2); ctx.fillRect(X + r, Y - r, 1, r * 2);
      ctx.globalAlpha = 1;
    }
    for (const c of chispas) { ctx.fillStyle = col[c.c] || c.c; ctx.fillRect(Math.round(c.x), Math.round(c.y), c.g || 1, c.g || 1); }
    for (const x of textos) if (x.vida > 8 || x.vida % 2) rotulo(x.txt, x.x, x.y, col[x.c] || x.c, x.vida > (x.max || 40) - 5 ? (x.e || 1) * 1.5 : x.e || 1);
    // La barra de la ventana: el juego corre dentro de una terminal abierta, C:\BIT.EXE
    ctx.fillStyle = "#c9c6b8";
    ctx.fillRect(0, 0, W, 8);
    // Con tensión, hasta el título de la ventana se corrompe por instantes
    let titulo2 = "C:\\BIT.EXE";
    if (ritmo && tension > 0 && h2(Math.floor(ts * 9)) < tension * 0.55) titulo2 = [...titulo2].map((ch, i) => (h2(Math.floor(ts * 9) * 3 + i) < 0.4 ? "X%:01E>."[(h2(i + Math.floor(ts * 9)) * 8) | 0] : ch)).join("");
    letras(titulo2, 3, 2, "K");
    // Las vidas de BIT, en la barra de su terminal: corazones rojos; los perdidos, grises. El recién perdido o ganado parpadea
    if (ritmo) for (let i = 0; i < D.vidas; i++) {
      const hx = W - 32 - i * 6, viva = i < vidasR, cambia = vidaFx > 0 && (i === vidasR || i === vidasR - 1) && (t >> 2) % 2;
      ctx.fillStyle = cambia ? "#ffffff" : viva ? col.R : "#8f8c80";
      ctx.fillRect(hx, 2, 2, 2); ctx.fillRect(hx + 3, 2, 2, 2); ctx.fillRect(hx, 3, 5, 2); ctx.fillRect(hx + 1, 5, 3, 1); ctx.fillRect(hx + 2, 6, 1, 1);
    }
    for (let i = 0; i < 3; i++) { ctx.fillStyle = col.F; ctx.fillRect(W - 8 - i * 8, 1, 6, 6); ctx.fillStyle = "#c9c6b8"; ctx.fillRect(W - 6 - i * 8, i === 2 ? 5 : 3, 2, i === 2 ? 1 : 2); }
    ctx.fillStyle = col.F;
    ctx.fillRect(0, 8, W, 1);
    for (const g of grietas) { ctx.fillStyle = g.vida % 4 < 2 ? col.R : "#c9c6b8"; ctx.fillRect(g.x - 1, 6, 5, 3); }
    dibujaOrden();
    // Créditos del arranque: la terminal teclea cómo inicializa la canción, renglón por renglón
    if (ritmo && cred >= 0 && cred < 100 && estado === "jugando") {
      const ls = [`C:\\>PLAY ${R.archivo.split("/").pop().toUpperCase()}`, T("CREANDO OBJETO CANCION ...", "CREATING SONG OBJECT ..."), T(`CARGANDO ${totalNotas} BUGS ...`, `LOADING ${totalNotas} BUGS ...`), T(`SINCRONIZANDO A ${R.sec[0][3]} BPM ...`, `SYNCING TO ${R.sec[0][3]} BPM ...`)];
      ctx.fillStyle = "rgba(0,0,0,.82)";
      ctx.fillRect(0, 9, W, 31);
      ls.forEach((l, i) => {
        const n = Math.floor((cred - i * 20) * 1.8);
        if (n <= 0) return;
        letras(l.slice(0, n), 3, 11 + i * 7, i ? "G" : "W");
        if (i && n > l.length + 6) letras("OK", 3 + (l.length + 1) * 4, 11 + i * 7, "V");
      });
    }
    // En ritmo, la orilla de abajo de la barra marca cuánto va de la canción
    if (ritmo) { ctx.fillStyle = col.Y; ctx.fillRect(0, 8, Math.round((W * ts) / R.dur), 1); }
    // El piso es la línea de comandos: una casilla entre corchetes por carril. La de BIT va encendida,
    // late con el bombo y se pone verde un instante al atrapar
    const py = piso();
    ctx.fillStyle = "#0c0f1a";
    ctx.fillRect(0, py, W, H - py);
    ctx.fillStyle = col.G;
    ctx.fillRect(0, py, W, 1);
    if (lateral) {
      // En el tramo lateral las casillas van en columna, a la izquierda: una por fila, encendida la de BIT
      ctx.fillStyle = "#3a4058"; for (let x = (t >> 1) % 8; x < W; x += 8) ctx.fillRect(x, py + 3, 4, 1);
      ctx.fillStyle = "#0c0f1a"; ctx.fillRect(0, 9, 10, py - 9);
      ctx.fillStyle = col.G; ctx.fillRect(10, 9, 1, py - 9);
      for (let c = 0; c < carriles; c++) {
        const y0 = filaY(c) - 1, act = c === bit.c, ok = celdas[c] > 0;
        ctx.fillStyle = ok ? col.V : act ? (grooveFx > 3 ? "#00f6ff" : pulso > 0.7 ? "#ffffff" : col.Y) : "#3a4058";
        ctx.fillRect(2, y0, 6, 1); ctx.fillRect(2, y0, 1, 3); ctx.fillRect(7, y0, 1, 3); ctx.fillRect(2, y0 + 13, 6, 1); ctx.fillRect(2, y0 + 11, 1, 3); ctx.fillRect(7, y0 + 11, 1, 3);
        if (act || ok) ctx.fillRect(4, y0 + 4, 2, 6);
      }
    }
    else if (vuela) { ctx.fillStyle = "#3a4058"; for (let x = (t >> 1) % 8; x < W; x += 8) ctx.fillRect(x, py + 3, 4, 1); }
    else for (let c = 0; c < carriles; c++) {
      const x0 = Math.round(c * LW), w = Math.round(LW), ok = celdas[c] > 0, lado = ritmo && iman > ts && Math.abs(c - bit.c) === 1 && (iman - ts > 1 || (t >> 2) % 2), act = c === bit.c || lado;
      ctx.fillStyle = ok ? col.V : lado ? col.C : c === bit.c && grooveFx > 3 ? "#00f6ff" : act ? (ritmo && pulso > 0.7 ? "#ffffff" : col.Y) : "#3a4058";
      ctx.fillRect(x0 + 2, py + 2, 1, 4); ctx.fillRect(x0 + 2, py + 2, 3, 1); ctx.fillRect(x0 + 2, py + 5, 3, 1);
      ctx.fillRect(x0 + w - 3, py + 2, 1, 4); ctx.fillRect(x0 + w - 5, py + 2, 3, 1); ctx.fillRect(x0 + w - 5, py + 5, 3, 1);
      if (act || ok) ctx.fillRect(x0 + 6, py + 3, w - 12, 2);
    }
    for (const d of destellos) {
      // El carril donde cayó el bug: una columna roja que se apaga hacia arriba y el piso parpadeando
      const cxl = Math.round(Math.floor((d.x + 5) / LW) * LW) + 1, anc = Math.round(LW) - 1;
      if (ritmo && !RM) { const g = ctx.createLinearGradient(0, piso(), 0, piso() - H * 0.7); g.addColorStop(0, `rgba(255,40,60,${Math.min(0.55, d.vida / 30)})`); g.addColorStop(1, "rgba(255,40,60,0)"); ctx.fillStyle = g; ctx.fillRect(cxl, 9, anc, piso() - 9); }
      if (d.vida % 6 < 3) { ctx.fillStyle = col.R; ctx.fillRect(cxl, piso(), anc, H - piso()); }
    }
    // BIT mira hacia el bug más cercano al piso
    let cerca = null;
    for (const o of objs) if (o.tipo !== "cafe" && (!cerca || o.y > cerca.y)) cerca = o;
    const dx = cerca ? cerca.x + 5 - (bit.x + 5) : 0;
    if (P()) {
      const sprite = P().bitSprite(dx < -8 ? -1 : dx > 8 ? 1 : 0, parpadeo > 0, boca);
      for (const f of fantasmas) { ctx.globalAlpha = (f.vida / 6) * 0.45; pinta(sprite, f.x, bit.y); }
      // La estela: copias de BIT en un solo color que suman luz y se apagan una tras otra, de la más vieja a la más nueva
      ctx.globalCompositeOperation = "lighter";
      for (const f of ecos) { ctx.globalAlpha = Math.pow(f.vida / f.max, 1.4) * 0.85; silueta(sprite, f.x, f.y, f.c); }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      // Al atrapar da un brinquito; al frenar se aplasta; en ritmo, además, late con el bombo
      const yb = bit.y + (aplasta > 2 && !vuela ? 1 : 0) - (brinco > 3 ? 2 : brinco > 0 ? 1 : 0) - (ritmo && estado === "jugando" && pulso > 0.7 && !vuela ? 1 : 0);
      // Mientras corre al otro carril se estira; recién aterrizado, se ensancha
      const ex = RM || vuela || lateral ? 1 : estira ? 1.3 : aplasta > 3 ? 1.15 : 1, ey = RM || vuela || lateral ? 1 : estira ? 0.84 : aplasta > 3 ? 0.9 : 1;
      ctx.save();
      if (ex !== 1) { ctx.translate(bit.x + 5, yb + 12); ctx.scale(ex, ey); ctx.translate(-(bit.x + 5), -(yb + 12)); }
      if (ritmo) contorno(sprite, bit.x, yb);
      // Lastimado parpadea en rojo; recién atrapó, brilla en blanco
      if (invul > 0 && dano <= 0 && (t >> 1) % 2) { /* a salvo un instante: parpadea */ }
      else if (dano > 0 && dano % 6 < 3) silueta(sprite, bit.x, yb, col.R);
      else if (brillo > 1) silueta(sprite, bit.x, yb, "#ffffff");
      else pinta(sprite, bit.x, yb);
      ctx.restore();
      // Recién empezó a volar: cuatro flechas alrededor recuerdan que se mueve en todas direcciones
      if (vuela && ts < R.sec[VUELO][0] + 5.5 && (t >> 3) % 2) {
        const X = Math.round(bit.x) + 5, Y = Math.round(yb) + 6;
        ctx.fillStyle = "#00f6ff";
        for (let i = 0; i < 3; i++) {
          ctx.fillRect(X - 2 + i, Y - 12 - i, 5 - i * 2, 1); ctx.fillRect(X - 2 + i, Y + 11 + i, 5 - i * 2, 1);
          ctx.fillRect(X - 12 - i, Y - 2 + i, 1, 5 - i * 2); ctx.fillRect(X + 11 + i, Y - 2 + i, 1, 5 - i * 2);
        }
      }
      // En FUTURE FUNK, BIT lleva audífonos; con el groove al máximo, le brillan
      if (ritmo && FK()) {
        const X = Math.round(bit.x), Y = Math.round(yb), c = groove >= GROOVE_MAX && (t >> 2) % 2 ? "#ffffff" : "#ff3fb4";
        ctx.fillStyle = "#05030f"; ctx.fillRect(X, Y - 2, 10, 1); ctx.fillRect(X - 1, Y - 1, 1, 3); ctx.fillRect(X + 10, Y - 1, 1, 3);
        ctx.fillStyle = c; ctx.fillRect(X - 2, Y + 2, 2, 4); ctx.fillRect(X + 10, Y + 2, 2, 4);
        ctx.fillStyle = "#00f6ff"; ctx.fillRect(X - 2, Y + 3, 1, 2); ctx.fillRect(X + 11, Y + 3, 1, 2);
      }
      // En DOOM CROSSING: en el pueblo lleva una hojita en la cabeza; en el infierno, casco y hombreras. Con escudo, un marco azul
      if (ritmo && DM()) {
        const X = Math.round(bit.x), Y = Math.round(yb), m = mundoVis();
        if (m === "p") { ctx.fillStyle = "#3fbf5a"; ctx.fillRect(X + 4, Y - 3, 3, 2); ctx.fillRect(X + 6, Y - 4, 2, 1); ctx.fillStyle = "#1d6b4a"; ctx.fillRect(X + 4, Y - 1, 1, 1); }
        else { ctx.fillStyle = "#3f6b2a"; ctx.fillRect(X + 1, Y - 3, 8, 1); ctx.fillRect(X, Y - 2, 10, 2); ctx.fillRect(X - 2, Y + 5, 2, 3); ctx.fillRect(X + 10, Y + 5, 2, 3); ctx.fillStyle = "#7ddc6b"; ctx.fillRect(X + 2, Y - 2, 6, 1); }
        if (escudo > 0 && ((t >> 3) % 2 || escudo > 1)) { ctx.fillStyle = "#7dd3fc"; ctx.fillRect(X - 3, Y - 5, 16, 1); ctx.fillRect(X - 3, Y + 12, 16, 1); ctx.fillRect(X - 3, Y - 5, 1, 18); ctx.fillRect(X + 12, Y - 5, 1, 18); }
      }
      // En el GRIMORIO, BIT va de capucha y con su linterna; en la torre le salen alas de murciélago
      if (ritmo && G()) {
        const X = Math.round(bit.x), Y = Math.round(yb);
        ctx.fillStyle = "#3b1463";
        ctx.fillRect(X + 1, Y - 3, 8, 1); ctx.fillRect(X, Y - 2, 10, 2); ctx.fillRect(X - 1, Y - 1, 1, 6); ctx.fillRect(X + 10, Y - 1, 1, 6);
        ctx.fillStyle = "#6b3aa8";
        ctx.fillRect(X + 2, Y - 2, 6, 1);
        if (vuela) {
          const al = (t >> 3) % 2;
          ctx.fillStyle = "#3b1463";
          ctx.fillRect(X - 5, Y + 2 + al, 4, 2); ctx.fillRect(X - 8, Y + 1 + al * 2, 3, 2); ctx.fillRect(X - 4, Y + 4 + al, 3, 1);
          ctx.fillRect(X + 11, Y + 2 + al, 4, 2); ctx.fillRect(X + 15, Y + 1 + al * 2, 3, 2); ctx.fillRect(X + 11, Y + 4 + al, 3, 1);
        }
        ctx.fillStyle = "#8f93a8";
        ctx.fillRect(X + 12, Y + 5, 1, 2);
        ctx.fillStyle = luzVis > 0.3 || (t >> 2) % 2 ? "#ffe14a" : "#7a5a14";
        ctx.fillRect(X + 11, Y + 7, 3, 3);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(X + 12, Y + 8, 1, 1);
      }
      // Bajo el agua, BIT lleva escafandra: casco de cristal, visor, tanque y manguera
      if (ritmo && UIA() && secI === 2) {
        const X = Math.round(bit.x), Y = Math.round(yb);
        ctx.fillStyle = "rgba(160,220,255,.22)";
        ctx.fillRect(X - 1, Y - 2, 12, 11);
        ctx.fillStyle = "#bfe9ff";
        ctx.fillRect(X, Y - 3, 10, 1); ctx.fillRect(X - 2, Y - 1, 1, 9); ctx.fillRect(X + 11, Y - 1, 1, 9); ctx.fillRect(X - 1, Y - 2, 1, 1); ctx.fillRect(X + 10, Y - 2, 1, 1); ctx.fillRect(X - 1, Y + 8, 1, 1); ctx.fillRect(X + 10, Y + 8, 1, 1); ctx.fillRect(X, Y + 9, 10, 1);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(X + 1, Y - 1, 3, 1); ctx.fillRect(X + 1, Y, 1, 2);
        ctx.fillStyle = col.G;
        ctx.fillRect(X - 5, Y + 2, 3, 7);
        ctx.fillStyle = "#ffd23b";
        ctx.fillRect(X - 5, Y + 1, 3, 1); ctx.fillRect(X - 4, Y - 3, 1, 4); ctx.fillRect(X - 4, Y - 4, 4, 1);
        if (estado === "jugando" && t % 26 === 0 && !RM) burbujas.push({ x: X + 12 + Math.random() * 2, y: Y - 4, vida: 70, g: Math.random() < 0.3 ? 2 : 1 });
      }
    }
    // GRIMORIO: la oscuridad. Solo se ve bien lo que alcanza la linterna; de lo demás apenas brillan los ojos.
    // El jefe alumbra su salón, así que ahí la oscuridad es más leve; en el primer tramo todavía no cae
    if (ritmo && G() && secI > 0 && estado === "jugando") {
      const entra = Math.min(1, (ts - R.sec[1][0]) / 2.5), tope = (secI === JEFE ? 0.45 : secI === 5 ? 0.3 : 0.8) * entra;
      const cxL = Math.round(bit.x) + 5, cyL = Math.round(bit.y) + 5, r = 16 + Math.min(1.8, luzVis) * W * 0.36 + (pulso > 0.7 ? 1 : 0);
      const g = ctx.createRadialGradient(cxL, cyL, 0, cxL, cyL, r + 22);
      // Tres anillos de sombra con bordes duros, como luz pixelada
      const k1 = r / (r + 22), k2 = (r + 10) / (r + 22);
      g.addColorStop(0, "rgba(255,200,110,.10)"); g.addColorStop(k1 * 0.55, "rgba(255,200,110,.10)"); g.addColorStop(k1 * 0.55, "rgba(255,200,110,.05)"); g.addColorStop(k1, "rgba(255,200,110,.05)"); g.addColorStop(k1, `rgba(2,1,6,${tope * 0.45})`); g.addColorStop(k2, `rgba(2,1,6,${tope * 0.45})`); g.addColorStop(k2, `rgba(2,1,6,${tope * 0.75})`); g.addColorStop(0.999, `rgba(2,1,6,${tope * 0.75})`); g.addColorStop(1, `rgba(2,1,6,${tope})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 9, W, piso() - 9);
      for (const o of objs) {
        if (Math.hypot(o.x + 5 - cxL, o.y + 4 - cyL) < r + 8) continue;
        ctx.fillStyle = o.tipo === "mal" ? "#d44bff" : o.tipo === "oro" || o.tipo === "bono" ? "#ffe14a" : o.tipo === "arco" ? SANDE[(t >> 2) % SANDE.length] : "#ff5a4a";
        ctx.fillRect(Math.round(o.x) + 3, Math.round(o.y) + 4, 1, 1); ctx.fillRect(Math.round(o.x) + 7, Math.round(o.y) + 4, 1, 1);
      }
      // Cuánta luz queda, en la orilla izquierda
      ctx.fillStyle = "rgba(0,0,0,.7)"; ctx.fillRect(1, 11, 4, 22);
      ctx.fillStyle = luz < 0.3 && (t >> 2) % 2 ? col.R : "#ffe14a"; const hl = Math.round(Math.min(1, luz) * 20); ctx.fillRect(2, 12 + 20 - hl, 2, hl);
    }
    // FUTURE FUNK: el medidor de groove, en la orilla izquierda: ocho escalones que se encienden de rosa a cian
    if (ritmo && FK() && estado === "jugando") {
      ctx.fillStyle = "rgba(0,0,0,.7)"; ctx.fillRect(1, 11, 7, 30);
      letras("G", 3, 12, groove >= GROOVE_MAX ? "#00f6ff" : "W");
      for (let i = 0; i < GROOVE_MAX; i++) { ctx.fillStyle = i < groove ? (grooveFx > 4 ? "#ffffff" : i >= 5 ? "#00f6ff" : "#ff3fb4") : "#3a4058"; ctx.fillRect(2, 38 - i * 3, 5, 2); }
    }
    // DOOM CROSSING: las campanas juntadas (se llenan hasta valer un escudo) y los escudos que ya se tienen, en la orilla izquierda
    if (ritmo && DM() && estado === "jugando") {
      ctx.fillStyle = "rgba(0,0,0,.7)"; ctx.fillRect(1, 11, 9, 34);
      pinta(CAMPANA, 3, 12, null);
      const hl = Math.round((Math.min(campanas, CAMPANAS_ESCUDO) / CAMPANAS_ESCUDO) * 18);
      ctx.fillStyle = "#3a4058"; ctx.fillRect(4, 19, 3, 18); ctx.fillStyle = campanas >= CAMPANAS_ESCUDO && (t >> 2) % 2 ? "#ffffff" : "#ffe14a"; ctx.fillRect(4, 19 + 18 - hl, 3, hl);
      for (let i = 0; i < 2; i++) { ctx.fillStyle = i < escudo ? "#7dd3fc" : "#3a4058"; ctx.fillRect(2 + i * 4, 39, 3, 4); }
    }
    // Con fiebre, el marco del recuadro corre en colores
    if (ritmo && fiebre > ts) {
      for (let i = 0; i < W; i += 4) { ctx.fillStyle = SANDE[((i >> 2) + (t >> 1)) % SANDE.length]; ctx.fillRect(i, 9, 4, 1); ctx.fillRect(W - 4 - i, piso() - 1, 4, 1); }
      const falta = (fiebre - ts) / 7;
      ctx.fillStyle = "#ff3fb4";
      ctx.fillRect(0, 10, Math.round(W * falta), 1);
    }
    // Al arrancar en el teléfono se van encendiendo, uno por uno, los carriles que se pueden tocar
    if (pistaT > 0 && estado === "jugando" && !vuela && tactil && (pistaT > 40 || pistaT % 6 < 3)) {
      const c = (t >> 4) % carriles;
      ctx.fillStyle = "rgba(255,225,74,.13)";
      ctx.fillRect(Math.round(c * LW) + 1, 9, Math.round(LW) - 1, piso() - 9);
    }
    ctx.restore();
    // El gato, cuando su vuelta lo trae por delante de la terminal: se pinta encima del recuadro, en el mismo lugar que en
    // el escenario (contando el acercamiento de la cámara). Con el jefe y en el vuelo va más transparente para no tapar los bugs
    if (ritmo && UIA() && gatoOk && gatoFrente > 0.5 && estado === "jugando" && gatoSeVe() && limpieza() <= 0) {
      const lado = Math.max(2, Math.round(Math.min(64, FW * 0.42, FH * 0.36) * gatoTam * (1 + pulso * 0.07) * zoom));
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 9, W, piso() - 9); ctx.clip();
      ctx.imageSmoothingEnabled = false;
      pintaGato(gatoX * zoom + focoX * (1 - zoom) - gx, gatoY * zoom + focoY * (1 - zoom) - gy, lado, gatoQuieto ? null : giro, (secI === JEFE || vuela ? 0.5 : 0.9) * Math.min(1, (gatoFrente - 0.5) * 4), ctx);
      ctx.restore();
    }
    if (ritmo && estado === "cierre" && cierre) dibujaLlave();
    // En pausa o al terminar, el recuadro se oscurece para que se lea el mensaje
    if (ritmo && estado !== "jugando" && estado !== "cierre") { ctx.fillStyle = "rgba(0,0,0,.72)"; ctx.fillRect(0, 0, W, H); }
    // Los destellos del nivel también ciegan la terminal y a BIT
    if (ritmo && estado === "jugando") { const fg = fogonazo(); if (fg > 0.01) { ctx.fillStyle = `rgba(255,255,255,${Math.min(1, fg).toFixed(3)})`; ctx.fillRect(0, 0, W, H); } }
    // El fogonazo con que aparecen los resultados
    if (destello > 0) { ctx.fillStyle = `rgba(255,255,255,${destello / 26})`; ctx.fillRect(0, 0, W, H); }
    // Al fallar, las orillas del recuadro se encienden en rojo
    if (ritmo && dano > 0 && !RM) {
      const a = (dano / 26) * 0.5;
      for (const [x0, y0, x1, y1] of [[0, 0, 14, 0], [W, 0, W - 14, 0]]) {
        const g = ctx.createLinearGradient(x0, y0, x1, y1);
        g.addColorStop(0, `rgba(255,30,50,${a})`); g.addColorStop(1, "rgba(255,30,50,0)");
        ctx.fillStyle = g;
        ctx.fillRect(Math.min(x0, x1), 9, 14, piso() - 9);
      }
    }
    // Interferencia en la terminal: tiras de la imagen que se corren, una copia desfasada y líneas de barrido que brincan.
    // Entre más tensión (el error, el jefe con la memoria llena, la lluvia de código), más seguido y más fuerte
    let brincaX = 0;
    // Cada vez que el recuadro da un golpe fuerte (un bicho especial, varios seguidos, subir de nivel de combo), la imagen
    // se descompone un instante: dos tiras se corren de lado y aparece una copia desfasada
    if (ritmo && !RM && punch > 0.7 && estado === "jugando") {
      for (let i = 0; i < 2; i++) { const yy = 9 + Math.floor(h2(t * 3 + i) * (H - 20)), hh = 3 + Math.floor(h2(t * 5 + i) * 8), dxx = Math.round((h2(t * 7 + i) - 0.5) * punch * 10); ctx.drawImage(lienzo, 0, yy, W, hh, dxx, yy, W, hh); }
      ctx.globalAlpha = Math.min(0.3, punch * 0.15); ctx.globalCompositeOperation = "lighter"; ctx.drawImage(lienzo, Math.round(punch * 1.5), 0); ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
      if (punch > 1.4) brincaX = (t >> 1) % 2 ? -2 : 2;
    }
    if (ritmo && tension > 0 && estado === "jugando") {
      const paso = Math.floor(ts * 22);
      if (h2(paso) < tension * 0.55) for (let i = 0; i < 1 + Math.floor(tension * 3); i++) {
        const yy = 9 + Math.floor(h2(paso * 3 + i) * (H - 12)), hh = 2 + Math.floor(h2(paso * 5 + i) * 7), dxx = Math.round((h2(paso * 7 + i) - 0.5) * tension * 22);
        ctx.drawImage(lienzo, 0, yy, W, hh, dxx, yy, W, hh);
      }
      if (h2(paso + 7) < tension * 0.3) { ctx.globalAlpha = 0.22; ctx.globalCompositeOperation = "lighter"; ctx.drawImage(lienzo, 2 + Math.round(tension * 2), 0); ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1; }
      if (h2(paso + 13) < tension * 0.3) { ctx.fillStyle = "rgba(255,255,255,.13)"; ctx.fillRect(0, Math.floor(h2(paso + 2) * H), W, 2); }
      if (h2(paso + 21) < tension * 0.22) brincaX = h2(paso) < 0.5 ? -2 : 2;
    }
    const tenso = ritmo && tension > 0.6 && estado === "jugando";
    if (lienzo.classList.contains("tenso") !== tenso) lienzo.classList.toggle("tenso", tenso);
    // El recuadro da un golpecito al atrapar y late en las partes fuertes
    const esc = RM || estado !== "jugando" ? 1 : 1 + punch * 0.016 + (ritmo && (R.fuerte || [1, JEFE, 7]).includes(secI) ? pulso * 0.016 : 0);
    // La terminal también se mueve: en el tramo lateral se encoge un poco y se va a la izquierda (sin llegar a la orilla),
    // y justo antes, con el recuadro que se lleva todo, se encoge hacia BIT hasta casi desaparecer
    const cs = ritmo ? cajaS() : 1, kLat = ritmo && estado !== "fin" ? latK : 0;
    if (cs < 1 || kLat > 0.002) {
      const libre = rect0 ? Math.max(0, rect0.left - window.innerWidth * 0.05) : 0, sLat = 1 - 0.14 * kLat;
      lienzo.style.transformOrigin = cs < 1 ? `${(((bit.x + 5) / W) * 100).toFixed(1)}% ${(((bit.y + 6) / H) * 100).toFixed(1)}%` : "";
      lienzo.style.transform = `translateX(${(brincaX - libre * kLat).toFixed(1)}px) scale(${(esc * sLat * cs).toFixed(4)})`;
      rectL = lienzo.getBoundingClientRect();
      movida = true;
    } else {
      if (movida) { movida = false; lienzo.style.transformOrigin = ""; rectL = rect0 || rectL; }
      lienzo.style.transform = esc > 1.0005 || brincaX ? `translateX(${brincaX}px) scale(${esc.toFixed(4)})` : "";
    }
    if (!ritmo && mensaje && mensajeT % 20 > 4) {
      ctx.font = `8px "Press Start 2P"`;
      ctx.textAlign = "center";
      ctx.fillStyle = /BUG/.test(mensaje) ? col.R : col.Y;
      ctx.fillText(mensaje, W / 2, Math.round(H * 0.42));
    }
  }

  /* ---------- 13. Escenarios del modo ritmo: uno por cada parte de la canción ----------
     Se dibujan en el lienzo de efectos, que cubre toda la pantalla: el recuadro del juego es solo una ventana.
     e = { cx, cy: centro del recuadro · suelo: la línea del piso del juego · sec: la sección actual } */
  const TAU = Math.PI * 2;
  // Azar que no cambia de un cuadro a otro: cada estrella, burbuja o edificio cae siempre en su lugar
  const h = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const rc = (c, x, y, w, hh) => { c2.fillStyle = c; c2.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(hh))); };
  function linea(c, x0, y0, x1, y1) {
    c2.fillStyle = c;
    const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    for (let i = 0; i <= n; i++) c2.fillRect(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), 1, 1);
  }
  const bandas = (cols, ya, yb) => cols.forEach((c, i) => rc(c, 0, ya + ((yb - ya) * i) / cols.length, FW, (yb - ya) / cols.length + 1));
  function disco(c, x, y, r) { for (let dy = -r; dy <= r; dy++) { const w = Math.round(Math.sqrt(r * r - dy * dy)); rc(c, x - w, y + dy, w * 2, 1); } }
  function poligono(c, alfa, pts) {
    c2.globalAlpha = alfa;
    c2.fillStyle = c;
    c2.beginPath();
    pts.forEach(([x, y], i) => (i ? c2.lineTo(x, y) : c2.moveTo(x, y)));
    c2.fill();
    c2.globalAlpha = 1;
  }
  // Un haz de luz que suma brillo y se desvanece a lo largo: rayos de sol bajo el agua, reflectores de la disco
  function haz(rgb, brillo, x0, ancho0, x1, ancho1, y0, y1) {
    const g = c2.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, `rgba(${rgb},${brillo})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    c2.globalCompositeOperation = "lighter";
    c2.fillStyle = g;
    c2.beginPath();
    c2.moveTo(x0 - ancho0 / 2, y0); c2.lineTo(x0 + ancho0 / 2, y0); c2.lineTo(x1 + ancho1 / 2, y1); c2.lineTo(x1 - ancho1 / 2, y1);
    c2.fill();
    c2.globalCompositeOperation = "source-over";
  }
  function texto(c, txt, x, y) { c2.font = `8px "Press Start 2P"`; c2.textAlign = "center"; c2.fillStyle = c; c2.fillText(txt, Math.round(x), Math.round(y)); }
  // Tiras de la imagen que se corren de lado, como una señal con interferencia
  function tiras(n, fuerza, semilla) {
    for (let i = 0; i < n; i++) {
      const y = Math.floor(h(semilla + i) * FH), alto = 2 + Math.floor(h(semilla + i + 0.5) * 9), dx = Math.round((h(semilla + i + 0.8) - 0.5) * 2 * fuerza);
      c2.drawImage(fx, 0, y, FW, alto, dx, y, FW, alto);
    }
  }
  // Un rayo en zigzag entre dos puntos
  function rayo(x0, y0, x1, y1, c, grosor) {
    const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 7));
    let px = x0, py = y0;
    for (let i = 1; i <= n; i++) {
      const k = i / n, nx = x0 + (x1 - x0) * k + (i < n ? (Math.random() - 0.5) * 9 : 0), ny = y0 + (y1 - y0) * k + (i < n ? (Math.random() - 0.5) * 9 : 0);
      c2.fillStyle = c;
      const pasos = Math.max(1, Math.round(Math.max(Math.abs(nx - px), Math.abs(ny - py))));
      for (let j = 0; j <= pasos; j++) c2.fillRect(Math.round(px + ((nx - px) * j) / pasos), Math.round(py + ((ny - py) * j) / pasos), grosor, grosor);
      px = nx; py = ny;
    }
  }
  // Un color más apagado (f de 0 a 1), para que el fondo no le gane a los bugs
  const oscuros = {};
  function osc(hex, f) {
    const k = hex + f;
    if (!oscuros[k]) {
      const n = parseInt(hex.slice(1), 16);
      oscuros[k] = `rgb(${Math.round(((n >> 16) & 255) * f)},${Math.round(((n >> 8) & 255) * f)},${Math.round((n & 255) * f)})`;
    }
    return oscuros[k];
  }
  const ESCENAS = [
    // 1. ARRANQUE: la consola corre sus comandos... hasta que GATO.EXE la tumba con un error crítico
    (e) => {
      rc(col.F, 0, 0, FW, FH);
      const tErr = R.error, roto = ts >= tErr, tt = Math.min(ts, tErr);
      const filas = Math.floor(FH / 4), escritas = Math.floor(tt * 6), off = Math.max(0, escritas - filas + 2);
      for (let i = 0; i < filas; i++) {
        const n = i + off;
        if (n > escritas) break;
        // Cada renglón es un comando: su > y luego lo que contesta la consola
        rc(roto ? col.R : col.W, 3, 2 + i * 4, 2, 2);
        let x = 8 + ((h(n) * 3) | 0) * 4;
        const segs = 1 + ((h(n + 0.5) * 7) | 0);
        for (let s = 0; s < segs && x < FW - 6; s++) {
          let l = 4 + ((h(n * 7 + s) * 24) | 0);
          if (n === escritas && !roto) l = Math.min(l, ((tt * 6) % 1) * 140 - s * 20);
          if (l < 1) break;
          const verde = h(n * 3 + s) < 0.3;
          // Conforme se acerca el error, algunos renglones ya salen en rojo
          const malo = roto ? h(n + s + golpeN) < 0.7 : ts > tErr - 4 && h(n * 5 + s) < (ts - (tErr - 4)) / 8;
          rc(malo ? osc(col.R, roto ? 0.75 : 0.55) : verde ? (pulso > 0.5 ? col.V : "#1d5c3f") : col.D, x, 2 + i * 4, Math.min(l, FW - 3 - x), 2);
          x += l + 3;
        }
        if (n === escritas && !roto && (t >> 3) % 2) rc(col.W, Math.min(x, FW - 5), 2 + i * 4, 2, 2);
      }
      if (!roto) { rc("rgba(65,184,131,.07)", 0, (ts * 34) % (FH + 10) - 8, FW, 8); return; }
      // El error crítico: todo en rojo, la imagen rota y el aviso con el culpable
      const edad = ts - tErr;
      if (!RM) tiras(7, 14, Math.floor(ts * 14));
      c2.globalAlpha = RM ? 0.2 : 0.14 + 0.1 * ((t >> 2) % 2);
      rc("#ff0030", 0, 0, FW, FH);
      c2.globalAlpha = 1;
      const an = Math.min(FW - 8, 132), al = 36, bx = Math.round(e.cx - an / 2), by = Math.round(Math.max(6, gy + H * 0.14));
      if (edad > 0.08) {
        rc("#000000", bx + 3, by + 3, an, al);
        rc((t >> 3) % 2 || RM ? col.R : "#7a0018", bx, by, an, al);
        rc("#000000", bx + 2, by + 2, an - 4, al - 4);
        texto(col.R, T("ERROR CRITICO", "CRITICAL ERROR"), e.cx, by + 15);
        if (edad > 0.45) texto(col.W, "GATO.EXE", e.cx, by + 28);
      }
    },
    // 2. CIUDAD NEON: sol de rayas, edificios de lado a lado y una rejilla que avanza con el compás hasta el borde de la pantalla
    (e) => {
      const hy = Math.round(gy + H * 0.6), cx = e.cx;
      bandas(["#0d0221", "#150430", "#1b0638", "#2d0a4e", "#4a0f5e", "#6b1560"], 0, hy);
      for (let i = 0; i < 60; i++) if (h(i + Math.floor(ts * 2 + h(i) * 9)) > 0.2) rc(i % 9 === 0 ? col.C : "#8a6fb0", h(i) * FW, h(i + 0.5) * hy * 0.7, 1, 1);
      const r = Math.round(Math.min(FW * 0.17, FH * 0.3) + pulso * 2);
      for (let dy = -r; dy <= 0; dy++) {
        const w = Math.round(Math.sqrt(r * r - dy * dy)), y = hy + dy, f = -dy / r;
        if (f < 0.6 && (y + (t >> 3)) % 4 === 0) continue;
        rc(f > 0.66 ? col.Y : f > 0.33 ? col.N : col.P, cx - w, y, w * 2, 1);
      }
      // El espectro de la música sale del horizonte, detrás de los edificios: barras finas que suben y bajan suave,
      // rosas abajo y cian en la punta, más altas hacia las orillas para no pelear con el sol
      for (let x = 1, i = 0; x < FW; x += 4, i++) {
        const lejos = Math.min(1, Math.abs(x - cx) / (FW * 0.5)), meta2 = Math.abs(x - cx) < r + 3 ? 0 : (0.12 + 0.88 * vu) * (0.3 + 0.7 * h(i * 1.7 + golpeN)) * (0.35 + 0.65 * lejos);
        espectro[i] = (espectro[i] || 0) + (meta2 - (espectro[i] || 0)) * 0.22;
        const alto = espectro[i] * FH * 0.34;
        if (alto < 1) continue;
        rc(osc(col.P, 0.75), x, hy - alto, 3, alto);
        rc(col.M, x, hy - alto, 3, Math.min(alto, alto * 0.45));
        rc(col.C, x, hy - alto, 3, 1);
      }
      for (let x = 0, i = 0; x < FW; i++) {
        const w = 6 + ((h(i) * 9) | 0), alto = Math.abs(x + w / 2 - cx) < r ? 3 + ((h(i + 0.3) * 3) | 0) : 6 + ((h(i + 0.3) * FH * 0.2) | 0);
        rc("#150a2e", x, hy - alto, w, alto);
        for (let wy = hy - alto + 2; wy < hy - 1; wy += 3) for (let wx = x + 1; wx < x + w - 1; wx += 3) if (h(i * 13 + wx * 7 + wy) < 0.45) rc(h(i + wx + wy + (golpeN >> 2)) < 0.6 ? col.Y : "#5a3d1e", wx, wy, 1, 1);
        x += w + 1;
      }
      rc("#0a0118", 0, hy, FW, FH - hy);
      for (let j = -16; j <= 16; j++) linea("#5a2a9c", cx + j * 5, hy, cx + j * FW * 0.2, FH);
      const fase = ((ts * e.sec[3]) / 60) % 1;
      for (let k = 0; k < 8; k++) { const pp = (k + fase) / 8; rc(k % 2 ? col.M : col.P, 0, hy + (FH - hy) * pp * pp, FW, 1); }
      rc(col.P, 0, hy, FW, 1);
    },
    // 3. BAJO EL AGUA: la música suena tapada. Los rayos entran desde arriba de la pantalla y se pierden en el fondo
    () => {
      bandas(["#0f4c82", "#0b3d6e", "#0a3260", "#082650", "#061b3d", "#04122b"], 0, FH);
      // La superficie, ondulando arriba
      c2.fillStyle = "rgba(190,233,255,.5)";
      for (let x = 0; x < FW; x++) c2.fillRect(x, Math.round(1.5 + Math.sin(x * 0.15 + ts * 2) * 1.2 + Math.sin(x * 0.4 - ts * 3) * 0.8), 1, 1);
      for (let i = 0; i < 8; i++) {
        const x0 = (FW * (i + 0.5)) / 8 + FW * 0.12 + Math.sin(ts * 0.3 + i * 1.7) * FW * 0.05, ancho = 5 + h(i) * 11;
        const brillo = Math.max(0.03, 0.13 + 0.09 * Math.sin(ts * 0.9 + i * 2.3) + pulso * 0.06);
        haz("150,215,255", brillo, x0, ancho, x0 - FH * 0.42 + Math.sin(ts * 0.4 + i) * 5, ancho * 3.2, 0, FH * (0.75 + 0.2 * h(i + 0.4)));
      }
      rc("#0a2a3d", 0, FH - 3, FW, 3);
      for (let x = 3, i = 0; x < FW; x += 9 + ((h(i) * 9) | 0), i++) {
        const alto = 9 + ((h(i + 0.2) * FH * 0.16) | 0);
        for (let j = 0; j < alto; j++) rc(j % 4 < 2 ? "#1f7a5a" : "#17604a", x + Math.round(Math.sin(ts * 2 + j * 0.35 + i) * (j / alto) * 3), FH - 3 - j, 2, 1);
      }
      // Un cardumen que cruza y peces sueltos
      const tramo = FW + 80, xc = ((ts * 16) % tramo) - 40, yc = FH * 0.3 + Math.sin(ts * 0.6) * FH * 0.08;
      for (let i = 0; i < 16; i++) rc("#9fdcff", xc + h(i) * 34 + Math.sin(ts * 3 + i) * 1.5, yc + h(i + 0.5) * 16 + Math.cos(ts * 2.4 + i * 2) * 1.5, 2, 1);
      for (let i = 0; i < 5; i++) {
        const dir = i % 2 ? 1 : -1, tr = FW + 30;
        let x = (ts * (9 + i * 4) + h(i) * tr) % tr;
        if (dir < 0) x = tr - x;
        x -= 15;
        const y = FH * (0.14 + 0.16 * i) + Math.sin(ts * 1.5 + i) * 2, c = i % 3 === 0 ? col.Y : col.N;
        rc(c, x, y, 5, 3);
        rc(c, dir > 0 ? x - 2 : x + 5, y + ((t >> 3) % 2), 2, 2);
        rc(col.K, dir > 0 ? x + 3 : x + 1, y + 1, 1, 1);
      }
      for (let i = 0; i < 38; i++) {
        const g = i % 4 === 0 ? 2 : 1;
        rc("#7fd4ff", h(i) * FW + Math.sin(ts * 1.6 + i * 2) * 3, FH - ((ts * (7 + h(i + 0.3) * 16) + h(i + 0.7) * FH) % FH), g, g);
      }
    },
    // 4. DESPEGUE: las estrellas salen del centro y aceleran por toda la pantalla mientras la canción sube
    (e) => {
      rc("#05030f", 0, 0, FW, FH);
      const L = e.sec[1] - e.sec[0], seg = Math.max(0, ts - e.sec[0]), k = Math.min(1, seg / L);
      const fase = 0.12 * seg + (0.5 * seg * seg * seg) / (L * L), radio = Math.hypot(FW, FH) / 2 + 8;
      for (let i = 0; i < 130; i++) {
        const a = h(i) * TAU, d = (h(i + 0.5) + fase * (0.6 + h(i + 0.8) * 0.8)) % 1, r = d * d * radio + 6, largo = 1 + k * k * 18 * d + pulso * 2;
        const c = d < 0.3 ? "#555a77" : i % 5 === 0 ? col.C : i % 7 === 0 ? col.Y : "#ffffff";
        linea(c, e.cx + Math.cos(a) * r, e.cy + Math.sin(a) * r, e.cx + Math.cos(a) * (r - largo), e.cy + Math.sin(a) * (r - largo));
      }
    },
    // 5. JEFE, GATO.EXE satura la memoria. El fondo va apagado y en azules para que se lea el recuadro:
    //    lo único rosa en pantalla es lo que hace daño (el rayo que carga y cae)
    (e) => {
      const FONDO = "#070b1c", CELDA = "#0d1330", VIVA = "#25337a", ROSA = "#ff2e7e";
      rc(FONDO, 0, 0, FW, FH);
      // La memoria: una cuadrícula de celdas; entre más llena va, más se encienden
      for (let y = 4, j = 0; y < FH; y += 10, j++) for (let x = 4, i = 0; x < FW; x += 14, i++) rc(h(i * 7 + j * 13 + (golpeN >> 1)) < 0.05 + peligro * 0.025 ? VIVA : CELDA, x, y, 10, 6);
      // Con cada bombo sale un aro del gato, apenas visible
      anillos.forEach((tg) => {
        const edad = ts - tg;
        if (edad < 0 || edad > 0.9) return;
        const r = 18 + edad * 170;
        c2.globalAlpha = (1 - edad / 0.9) * 0.55;
        for (let i = 0; i < 44; i++) { const a = (i * TAU) / 44; rc(VIVA, gatoX + Math.cos(a) * r, gatoY + Math.sin(a) * r * 0.8, 2, 2); }
        c2.globalAlpha = 1;
      });
      // Cuando el gato carga un rayo, un aro rosa se cierra sobre él: es la señal de que viene el golpe
      const carga = ataques.find((a) => !a.hecho);
      if (carga) {
        const k = Math.min(1, (ts - carga.t0) / (carga.t1 - carga.t0)), r = Math.min(64, FW * 0.42, FH * 0.36) * (1.15 - 0.55 * k);
        for (let i = 0; i < 18; i++) { const a = ts * 3 + (i * TAU) / 18; rc(i % 2 ? ROSA : "#ffffff", gatoX + Math.cos(a) * r - 1, gatoY + Math.sin(a) * r - 1, 3, 3); }
      }
      // Con la memoria casi llena, la pantalla late en rojo
      if (peligro >= JEFE_TOPE - 3) { c2.globalAlpha = 0.06 + 0.05 * (peligro - (JEFE_TOPE - 3)) + 0.08 * pulso; rc("#ff0030", 0, 0, FW, FH); c2.globalAlpha = 1; }
    },
    // 6. NOCHE EN CALMA: la canción descansa. Luna, nubes de orilla a orilla, cerros y luciérnagas
    () => {
      bandas(["#060920", "#070b22", "#0a1030", "#0e173f", "#131f4f", "#1a2a60"], 0, FH);
      for (let i = 0; i < 110; i++) if (h(i + Math.floor(ts * 1.5 + h(i + 0.9) * 7)) > 0.25) rc(i % 6 === 0 ? col.Y : "#cfd6ff", h(i) * FW, h(i + 0.5) * FH * 0.8, 1, 1);
      const mx = Math.round(FW * 0.84), my = Math.round(FH * 0.17);
      c2.globalAlpha = 0.08; disco("#f1edcf", mx, my, 15); c2.globalAlpha = 0.12; disco("#f1edcf", mx, my, 12); c2.globalAlpha = 1;
      disco("#f1edcf", mx, my, 9);
      rc("#d4cfa8", mx - 4, my - 3, 3, 2); rc("#d4cfa8", mx + 2, my + 2, 3, 2); rc("#d4cfa8", mx - 1, my + 5, 2, 1);
      // Una estrella fugaz cada tanto
      const tf = ts % 5.5;
      if (tf < 0.5) { const x0 = FW * (0.15 + h(Math.floor(ts / 5.5)) * 0.5) + tf * 90, y0 = FH * 0.08 + tf * 40; linea("#ffffff", x0, y0, x0 - 9, y0 - 4); }
      for (let i = 0; i < 8; i++) {
        const tr = FW + 70, x = ((ts * (2.5 + i * 1.1) + h(i) * tr) % tr) - 55, y = 8 + h(i + 0.2) * FH * 0.5, c = i % 2 ? "#2a3970" : "#35478a";
        rc(c, x, y, 30, 4); rc(c, x + 6, y - 3, 16, 3); rc(c, x + 13, y + 4, 22, 2);
      }
      for (let x = 0; x < FW; x++) { const alto = 16 + Math.sin(x * 0.045 + 1) * 8 + Math.sin(x * 0.11) * 3; rc("#0d1a45", x, FH - alto, 1, alto); }
      for (let x = 0; x < FW; x++) { const alto = 8 + Math.sin(x * 0.07) * 4 + Math.sin(x * 0.19 + 2) * 2; rc("#0a1330", x, FH - alto, 1, alto); }
      for (let i = 0; i < 16; i++) if (Math.sin(ts * 2 + i * 1.7) > 0) rc(col.Y, h(i) * FW + Math.sin(ts * 0.7 + i) * 8, FH - 12 - h(i + 0.3) * FH * 0.3 + Math.cos(ts * 0.9 + i * 2) * 4, 1, 1);
    },
    // 7. LLUVIA DE CODIGO: cae por toda la pantalla, cada vez más rápido hasta el último estribillo
    (e) => {
      rc("#020a05", 0, 0, FW, FH);
      const L = e.sec[1] - e.sec[0], seg = Math.max(0, ts - e.sec[0]), fase = seg + (seg * seg) / L;
      const TONOS = ["#d9ffe6", col.V, "#2a8a5f", "#1d5c3f", "#123a28", "#0b2419"];
      for (let c = 0; c * 5 < FW; c++) {
        const cab = ((fase * (16 + h(c) * 26) + h(c + 0.4) * (FH + 70)) % (FH + 70)) - 10;
        for (let j = 0; j < 12; j++) {
          const y = Math.round(cab - j * 5);
          if (y < -4 || y > FH) continue;
          c2.fillStyle = TONOS[j < 1 ? 0 : Math.min(5, 1 + (j >> 1))];
          const bits = (h(c * 31 + j * 17 + Math.floor(fase * 3 + h(c) * 9) * 7) * 4096) | 0;
          for (let b = 0; b < 12; b++) if ((bits >> b) & 1) c2.fillRect(c * 5 + 1 + (b % 3), y + ((b / 3) | 0), 1, 1);
        }
      }
    },
    // 8. HIPERESPACIO: rayos que giran desde el centro hasta las esquinas, anillos con cada bombo y colores que cambian cada cuatro
    (e) => {
      const pares = [[col.P, col.M], [col.B, col.C], [col.N, col.R], [col.V, col.C]], par = pares[RM ? 0 : (golpeN >> 2) % 4];
      const a0 = ts * (RM ? 0.25 : 1.3), n = 14, radio = Math.hypot(FW, FH), cx = e.cx, cy = e.cy;
      rc(osc(par[1], 0.28), 0, 0, FW, FH);
      for (let i = 0; i < n; i += 2) {
        const a = a0 + (i * TAU) / n, b = a0 + ((i + 1) * TAU) / n;
        poligono(osc(par[0], 0.45), 1, [[cx, cy], [cx + Math.cos(a) * radio, cy + Math.sin(a) * radio], [cx + Math.cos(b) * radio, cy + Math.sin(b) * radio]]);
      }
      for (let i = 0; i < 50; i++) {
        const a = h(i) * TAU, d = (h(i + 0.5) + ts * 1.4 * (0.6 + h(i + 0.2))) % 1, r = d * d * radio * 0.6 + 8, largo = 2 + d * 10;
        linea("#ffffff", cx + Math.cos(a) * r, cy + Math.sin(a) * r, cx + Math.cos(a) * (r - largo), cy + Math.sin(a) * (r - largo));
      }
      if (!RM) for (const tg of anillos) {
        const edad = ts - tg;
        if (edad < 0 || edad > 0.7) continue;
        const rx = 8 + edad * 260, ry = rx * 0.6;
        c2.globalAlpha = (1 - edad / 0.7) * 0.6;
        rc("#ffffff", cx - rx, cy - ry, rx * 2, 1); rc("#ffffff", cx - rx, cy + ry, rx * 2, 1);
        rc("#ffffff", cx - rx, cy - ry, 1, ry * 2); rc("#ffffff", cx + rx, cy - ry, 1, ry * 2);
        c2.globalAlpha = 1;
      }
    },
    // 9. ABISMO: la canción se hunde. Ondas lentas de lado a lado, plancton y un resto de luz que ya casi no llega
    () => {
      bandas(["#030714", "#02040c", "#030714", "#040a1c"], 0, FH);
      for (let i = 0; i < 3; i++) { const x0 = FW * (0.25 + i * 0.3) + Math.sin(ts * 0.2 + i) * 8; haz("70,120,200", 0.07 + pulso * 0.04, x0, 8, x0 - FH * 0.3, 30, 0, FH * 0.6); }
      for (let w = 0; w < 5; w++) {
        const yb = FH * (0.2 + w * 0.16), amp = 2 + energiaAhora * 8 + pulso * 2.5;
        c2.fillStyle = ["#1b4a8a", "#174079", "#143663", "#102c52", "#0d2444"][w];
        for (let x = 0; x < FW; x++) c2.fillRect(x, Math.round(yb + Math.sin(x * 0.07 + ts * (1.2 - w * 0.2) + w * 2) * amp + Math.sin(x * 0.21 - ts) * 1.5), 1, 1);
      }
      for (let i = 0; i < 46; i++) rc(i % 5 === 0 ? "#6f9bd8" : "#3b5a8f", h(i) * FW + Math.sin(ts * 0.6 + i) * 4, FH - ((ts * (2 + h(i + 0.3) * 5) + h(i + 0.7) * FH) % FH), 1, 1);
    },
    // 10. LIMPIEZA: el antivirus borra a GATO.EXE renglón por renglón; al llegar a 100 %, virus eliminado
    (e) => {
      rc("#020805", 0, 0, FW, FH);
      const k = limpieza(), listo = k >= 1;
      // Renglones de registro que suben
      for (let i = 0; i < FH / 4 + 1; i++) {
        const n = i + Math.floor(ts * 5);
        let x = 3;
        for (let s = 0; s < 1 + ((h(n + 0.5) * 6) | 0) && x < FW - 6; s++) { const l = 4 + ((h(n * 7 + s) * 22) | 0); rc(h(n * 3 + s) < 0.35 ? "#143d2b" : "#0c1f17", x, i * 4 - ((ts * 20) % 4), Math.min(l, FW - 3 - x), 2); x += l + 3; }
      }
      const an = Math.min(FW - 12, 150), bx = Math.round(e.cx - an / 2), ty = Math.round(Math.max(22, gy + H * 0.2));
      rc("rgba(0,0,0,.6)", bx - 4, ty - 12, an + 8, 34);
      if (listo) texto((t >> 3) % 2 || RM ? col.V : "#d9ffe6", T("VIRUS ELIMINADO", "VIRUS REMOVED"), e.cx, ty);
      else texto(col.W, T("LIMPIANDO GATO.EXE", "CLEANING CAT.EXE"), e.cx, ty);
      // La barra de avance, por segmentos
      rc(col.G, bx, ty + 6, an, 9);
      rc("#020805", bx + 1, ty + 7, an - 2, 7);
      const segs = Math.floor((an - 4) / 5);
      for (let i = 0; i < Math.round(segs * k); i++) rc(listo ? col.V : i % 2 ? "#2a8a5f" : col.V, bx + 2 + i * 5, ty + 8, 4, 5);
      texto(listo ? col.V : col.Y, `${Math.round(k * 100)}%`, e.cx, ty + 28);
      if (listo && !RM) { const edad = ts - (R.sec[9][0] + R.limpia); if (edad < 0.5) { c2.globalAlpha = (1 - edad / 0.5) * 0.6; rc("#d9ffe6", 0, 0, FW, FH); c2.globalAlpha = 1; } }
    },
  ];

  /* ---------- Escenarios del nivel GRIMORIO (fantasía oscura): siete, uno por tramo ---------- */
  // Puntos repartidos en un círculo (los sellos mágicos) y un sprite pintado en grande sobre el lienzo de efectos
  function aro(c, x, y, r, n, a0, g = 1) { for (let i = 0; i < n; i++) { const a = a0 + (i / n) * TAU; rc(c, x + Math.cos(a) * r, y + Math.sin(a) * r, g, g); } }
  function sprFx(rows, x, y, s, mapa) { rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== ".") rc(mapa[r[i]], x + i * s, y + j * s, s, s); }); }
  // Muro de ladrillo que puede correr hacia abajo (v) y aclararse hacia las orillas
  function ladrillos(base, v, claro, cx) {
    for (let j = -1; j * 8 < FH + 8; j++) {
      const fila = Math.floor(v / 8) - j, y = j * 8 + (v % 8), par = ((fila % 2) + 2) % 2;
      for (let i = -1; i * 16 < FW; i++) {
        const x = i * 16 + par * 8, d = cx == null ? 0 : Math.abs(x + 8 - cx) / (FW / 2);
        rc(osc(base, claro + 0.3 * d * d + 0.16 * h(i * 7 + fila * 13)), x, y, 15, 7);
      }
    }
  }
  const ESCENAS_G = [
    // 1. EL GRIMORIO: la página se llena de runas y un sello late en el centro
    (e) => {
      rc("#07040d", 0, 0, FW, FH);
      const filas = Math.floor(FH / 5), escritas = Math.floor(ts * 4);
      for (let i = 0; i < filas && i <= escritas; i++) {
        let x = 6 + ((h(i) * 4) | 0) * 3;
        const segs = 4 + ((h(i + 0.5) * 14) | 0);
        for (let s = 0; s < segs && x < FW - 6; s++) { const l = 1 + ((h(i * 7 + s) * 4) | 0); rc(h(i * 3 + s + golpeN) < 0.1 ? "#c084ff" : h(i * 3 + s) < 0.3 ? "#3b1f63" : "#1b0f2b", x, 3 + i * 5, l, 3); x += l + 2; }
      }
      const k = Math.min(1, ts / e.sec[1]), r = 14 + k * 16 + pulso * 3;
      aro("#c084ff", e.cx, e.cy, r, 24, ts * 0.4, 2); aro("#ffd23b", e.cx, e.cy, r * 0.62, 12, -ts * 0.7, 1); aro("#5b2a8c", e.cx, e.cy, r * 1.35, 36, ts * 0.15, 1);
      c2.globalAlpha = k * 0.35; rc("#1b0733", 0, 0, FW, FH); c2.globalAlpha = 1;
    },
    // 2. BOSQUE MALDITO: luna menguante, tres capas de árboles muertos que pasan, niebla y luciérnagas
    () => {
      bandas(["#04070d", "#060d16", "#08141d", "#0a1a22"], 0, FH);
      disco("#cfd8e8", FW * 0.78, FH * 0.2, 9); disco("#060d16", FW * 0.78 + 4, FH * 0.2 - 3, 8);
      for (let capa = 0; capa < 3; capa++) {
        const c = ["#0c1c24", "#08131a", "#020608"][capa], paso = [26, 40, 58][capa], corre = ts * [2, 5, 9][capa], base = Math.floor(corre / paso);
        for (let j = -1; j < FW / paso + 2; j++) {
          const n = base + j, x = j * paso - (corre % paso) + h(n + capa * 9) * paso * 0.5, w = 2 + capa * 2, alto = FH * (0.5 + 0.18 * capa) + h(n * 3 + capa) * 22;
          rc(c, x, FH - alto, w, alto);
          for (let r = 0; r < 4; r++) { const dir = h(n + r * 5 + capa) > 0.5 ? 1 : -1, len = (5 + h(n * 3 + r) * 9) * (1 + capa * 0.6), y = FH - alto + 4 + r * (8 + capa * 4); linea(c, x + w / 2, y + len * 0.4, x + w / 2 + dir * len, y - len * 0.3); }
        }
      }
      c2.globalAlpha = 0.09;
      for (let i = 0; i < 5; i++) rc("#9fb4c8", ((ts * 5 * (i + 1) + h(i) * FW) % (FW + 90)) - 90, FH * (0.5 + i * 0.1), 90, 3);
      c2.globalAlpha = 1;
      if (!RM) for (let i = 0; i < 14; i++) if (Math.sin(ts * (1 + h(i)) + i * 2) > 0.2) rc(pulso > 0.6 ? "#f7ff4a" : "#8fd14f", h(i + 0.2) * FW + Math.sin(ts * 0.6 + i) * 5, FH * (0.3 + h(i + 0.7) * 0.6) + Math.cos(ts * 0.8 + i) * 3, 1, 1);
    },
    // 3. CATACUMBAS: muro de ladrillo, columnas con antorchas que laten y nichos con calaveras
    () => {
      rc("#0b0809", 0, 0, FW, FH);
      ladrillos("#4a3b33", 0, 0.2);
      for (let i = 0; i < 9; i++) { const x = Math.round(h(i) * (FW - 14)), y = Math.round(FH * (0.5 + h(i + 0.3) * 0.42)); rc("#050304", x, y, 12, 10); rc("#b9b3a3", x + 3, y + 2, 6, 5); rc("#b9b3a3", x + 4, y + 7, 4, 2); rc("#050304", x + 4, y + 4, 1, 2); rc("#050304", x + 7, y + 4, 1, 2); }
      const paso = Math.max(56, FW / 5);
      for (let x = paso / 2; x < FW; x += paso) {
        rc("#060405", x - 5, 0, 10, FH); rc("#15100f", x - 7, 0, 14, 4);
        const fy = FH * 0.3, f = RM ? 1 : ((t >> 2) + ((x * 7) | 0)) % 3;
        rc("#3a2a20", x - 1, fy, 3, 8); rc("#ff7a1a", x - 2, fy - 3 - f, 5, 3 + f); rc("#ffe14a", x - 1, fy - 2 - f, 3, 2 + f);
        haz("255,140,40", 0.1 + pulso * 0.1, x, 8, x, 80, fy - 4, fy + 70);
      }
    },
    // 4. JEFE LICHE.EXE: el liche flota arriba, con la corona puesta y los ojos encendidos; el salón late en rojo
    (e) => {
      bandas(["#0d0206", "#16040a", "#1f060d", "#16040a", "#0a0204"], 0, FH);
      const paso = Math.max(48, FW / 6);
      for (let x = paso / 2; x < FW; x += paso) { rc("#07020a", x - 4, 0, 8, FH); rc("#2a0a14", x - 6, FH * 0.12, 12, 2); }
      const s = Math.max(2, Math.round(Math.min(60, FW * 0.4, FH * 0.34) / 14)), lx = e.cx + Math.sin(ts * 1.1) * W * 0.3, ly = gy + H * 0.3 - pulso * 3 + Math.sin(ts * 2) * 2;
      haz("255,40,60", 0.14 + pulso * 0.14, lx, 14 * s, lx, FW * 0.7, ly, FH);
      const x0 = Math.round(lx - 6.5 * s), y0 = Math.round(ly - 7 * s);
      sprFx(LICHE, x0, y0, s, { Y: pulso > 0.6 ? "#fff36b" : "#ffd23b", M: "#3b1463", W: "#d9d3c3", K: "#07040d", C: pulso > 0.5 ? "#ffffff" : "#ff3b3b", Z: "#22093d" });
      aro("#ff3b3b", lx, ly, 9 * s + pulso * 4, 16, ts * 0.8, 1);
      if (!RM) for (let i = 0; i < 22; i++) rc(i % 3 ? "#ff7a1a" : "#ffe14a", h(i) * FW, FH - ((ts * (14 + h(i + 0.4) * 26) + h(i + 0.1) * FH) % FH), 1, 1);
    },
    // 5. LA TORRE: los muros corren hacia abajo mientras BIT sube; pasan ventanas con luz de luna y cadenas
    (e) => {
      rc("#05050a", 0, 0, FW, FH);
      const v = RM ? 0 : ts * (26 + energiaAhora * 26);
      ladrillos("#3d4257", v, 0.06, e.cx);
      for (let n = Math.floor((v - FH) / 130); n <= Math.floor(v / 130) + 1; n++) {
        const y = v - n * 130, lado = ((n % 2) + 2) % 2, x = lado ? FW * 0.86 : FW * 0.14;
        rc("#9fb4e8", x - 4, y, 8, 14); rc("#9fb4e8", x - 3, y - 2, 6, 2); rc("#05050a", x, y - 1, 1, 15);
        haz("160,190,255", 0.13, x, 8, e.cx, 70, y + 7, y + 80);
      }
      for (let i = 0; i < 3; i++) { const x = FW * (0.3 + i * 0.2); for (let y = -8 + ((v * 0.5) % 8); y < FH * (0.2 + h(i) * 0.3); y += 4) rc(y % 8 < 4 ? "#6b7088" : "#3a3f55", x + (Math.round(y / 4) % 2), y, 2, 3); }
    },
    // 6. LA HOGUERA: noche quieta, una espada clavada en la lumbre y chispas que suben
    (e) => {
      bandas(["#03040a", "#050814", "#080c1a", "#0a0f1e"], 0, FH);
      for (let i = 0; i < 50; i++) if (h(i + 0.9) > 0.5 || (t >> 4) % 2) rc(h(i + 0.3) > 0.8 ? "#ffffff" : "#5d6a8f", h(i) * FW, h(i + 0.5) * FH * 0.7, 1, 1);
      const x = e.cx, y = gy + H * 0.66;
      rc("#0d0f14", 0, y + 6, FW, FH);
      c2.globalAlpha = 0.1 + pulso * 0.05; disco("#ff7a1a", x, y, 34); c2.globalAlpha = 0.14; disco("#ffb13b", x, y, 20); c2.globalAlpha = 1;
      rc("#3a2a20", x - 9, y + 4, 18, 3); rc("#2a1c14", x - 6, y + 2, 12, 2);
      for (let i = -3; i <= 3; i++) { const a = (RM ? 5 : 4 + ((h(i + (t >> 2)) * 7) | 0)) * (1 - Math.abs(i) / 4.5); rc("#ff5a1a", x + i * 2 - 1, y + 2 - a, 2, a); rc("#ffd23b", x + i * 2 - 1, y + 2 - a * 0.55, 2, a * 0.55); }
      rc("#c9c6b8", x, y - 22, 1, 22); rc("#8f93a8", x - 3, y - 17, 7, 1); rc("#3a2a20", x, y - 26, 1, 4);
      haz("255,150,60", 0.1, x, 10, x, 90, y - 6, y - 80);
      if (!RM) for (let i = 0; i < 12; i++) { const k = (ts * (0.2 + h(i) * 0.2) + h(i + 0.3)) % 1; rc(k < 0.5 ? "#ffd23b" : "#ff5a1a", x + (h(i + 0.6) - 0.5) * 30 + Math.sin(ts * 2 + i) * 3, y - k * 70, 1, 1); }
    },
    // 7. EL SELLO: el círculo mágico se cierra sobre el libro, cada vez más encendido
    (e) => {
      const k = Math.min(1, Math.max(0, (ts - e.sec[0]) / (e.sec[1] - e.sec[0])));
      rc("#0a0514", 0, 0, FW, FH);
      const R0 = Math.min(FW, FH) * (0.46 - k * 0.1) + pulso * 3, oro = pulso > 0.6 || k > 0.85;
      for (let i = 0; i < 6; i++) { const a = ts * 0.5 + (i / 6) * TAU, b = a + TAU / 3; linea(oro ? "#ffd23b" : "#7a3fc0", e.cx + Math.cos(a) * R0, e.cy + Math.sin(a) * R0, e.cx + Math.cos(b) * R0, e.cy + Math.sin(b) * R0); }
      aro(oro ? "#fff36b" : "#c084ff", e.cx, e.cy, R0, 48, ts * 0.5, 2); aro("#ffd23b", e.cx, e.cy, R0 * 0.72, 24, -ts * 0.9, 1); aro("#5b2a8c", e.cx, e.cy, R0 * 1.25, 60, ts * 0.2, 1); aro("#c084ff", e.cx, e.cy, R0 * 0.4, 12, ts * 1.6, 2);
      for (let i = 0; i < 6; i++) { const a = -ts * 0.3 + (i / 6) * TAU; haz("192,132,255", 0.05 + k * 0.1 + pulso * 0.05, e.cx + Math.cos(a) * FW * 0.5, 16, e.cx, 4, 0, e.cy); }
      if (!RM) for (let i = 0; i < 26; i++) { const a = h(i) * TAU + ts * 0.4, d = ((1 - ((ts * (0.25 + h(i + 0.5) * 0.3) + h(i + 0.2)) % 1)) * FW) / 2; rc(i % 3 ? "#c084ff" : "#ffd23b", e.cx + Math.cos(a) * d, e.cy + Math.sin(a) * d, 1, 1); }
      c2.globalAlpha = k * k * 0.25; rc("#ffd23b", 0, 0, FW, FH); c2.globalAlpha = 1;
    },
  ];

  /* ---------- Escenarios del nivel DOOM CROSSING ----------
     Dos mundos que se turnan: un pueblito de colores pastel y un infierno rojo. Los cambios de mundo caen en los mismos
     segundos que en el video oficial de la canción (R.cambios), y se hacen por un portal: un óvalo que crece desde el
     centro y deja ver el otro lado. Por el fondo corre la pareja del nivel, dos robots propios del juego: TANQUE, grande
     y de visor rosa, y ROBI, chico y redondo. En el pueblo pasean; en el infierno van mandando diablillos a volar. */
  const TANQUE = ["....MM......", "..SSSSSSSS..", "..SVVVVVVS..", "..SSSSSSSS..", ".SSSSSSSSSS.", "SSDSSSSSSDSS", "SS.SSCCSS.SS", "SS.SSSSSS.SS", "FF.SSSSSS.FF", "...SS..SS...", "...SS..SS...", "..DDD..DDD.."];
  const ROBI = ["...C....", "..WWWW..", ".WWWWWW.", ".WKWWKW.", ".WWWWWW.", ".WWKKWW.", "..WWWW..", "..C..C.."];
  const COL_DUO = { S: "#5a6b9a", D: "#2a3358", V: "#ff3fb4", C: "#00f6ff", F: "#ffd23b", M: "#ff3fb4", W: "#9be8ff", K: "#05030f" };
  // La pareja corriendo por el horizonte. modo: "p" pasean (con redes si caza), "i" a toda prisa, tirando diablillos
  function pareja(y, modo, caza) {
    const vel = modo === "i" ? 46 : 20, x = ((ts * vel) % (FW + 120)) - 60, paso = RM ? 0 : (t >> (modo === "i" ? 2 : 3)) % 2, s = 2;
    const ty = y - 12 * s + (paso && modo === "i" ? -1 : 0);
    sprFx(TANQUE.slice(0, 9), x, ty, s, COL_DUO);
    sprFx(TANQUE.slice(9), x + (paso ? s : 0), ty + 9 * s, s, COL_DUO);
    const rx = x - 26, ry = y - 8 * s - Math.abs(Math.sin(ts * (modo === "i" ? 9 : 5))) * 5;
    sprFx(ROBI, rx, ry, s, COL_DUO);
    if (caza) for (const [bx, by] of [[x + 20, ty - 6], [rx + 12, ry - 8]]) { linea("#ffd23b", bx - 6, by + 12, bx, by + 2); aro("#ffffff", bx + 2, by - 2, 4, 8, 0); }
    if (modo !== "i") return;
    // Tres diablillos se le echan encima y salen volando al compás
    for (let i = 0; i < 3; i++) {
      const f = (ts * 1.5 + i / 3) % 1, vuela = f > 0.62, k = vuela ? (f - 0.62) / 0.38 : 0;
      const dx = vuela ? x + 30 + k * 70 : x + 30 + (1 - f / 0.62) * 80, dy = vuela ? y - 12 - Math.sin(k * 3.1) * 44 : y - 10 - Math.abs(Math.sin(ts * 8 + i)) * 3;
      sprFx(ESPECIES.L[(t >> 2) % 2], dx, dy, 1, { R: vuela ? "#ffffff" : "#ff2a4a", W: "#ffd23b", K: "#05030f" });
      if (vuela && k < 0.25) { rc("#ffffff", x + 26, y - 16, 6, 2); rc("#ffd23b", x + 28, y - 18, 2, 6); }
    }
  }
  // El pueblo, a distintas horas: 0 amanecer, 1 día, 2 tarde, 3 noche, 4 nublado en rojo, 5 atardecer
  function pueblo(hora) {
    const noche = hora === 3, rojo = hora === 4;
    bandas([["#ffd9c2", "#ffe9c9", "#fff3d6", "#d8f3ff"], ["#7dd3fc", "#a5e3ff", "#c9f0ff", "#e6f9ff"], ["#ffb86b", "#ffcf8a", "#ffe2a8", "#fff0c9"], ["#0b1030", "#141a44", "#1d2658", "#2a3470"], ["#7a3b4a", "#a3505a", "#c9736b", "#e0a58a"], ["#ff7a59", "#ff9d6b", "#ffc27d", "#ffe0a3"]][hora], 0, FH);
    if (noche) for (let i = 0; i < 40; i++) if (h(i + 0.9) > 0.4 || (t >> 4) % 2) rc("#ffffff", h(i) * FW, h(i + 0.5) * FH * 0.5, 1, 1);
    disco(noche ? "#fff6d8" : rojo ? "#ff8a70" : "#fff6b0", FW * 0.78, FH * (hora === 5 ? 0.45 : 0.2), 9 + pulso * 1.5);
    for (let i = 0; i < 4; i++) {
      const x = ((ts * (3 + i) + h(i) * FW) % (FW + 60)) - 40, y = FH * (0.08 + h(i + 0.4) * 0.25), c = noche ? "#3a4680" : rojo ? "#8a4a55" : "#ffffff";
      rc(c, x, y, 26, 5); rc(c, x + 5, y - 3, 14, 4); rc(c, x + 8, y + 4, 16, 3);
    }
    const verde = noche ? ["#12402f", "#0c2f24"] : rojo ? ["#5a6b3a", "#44552c"] : ["#7ddc6b", "#4fbf5a"];
    const loma = (x, capa) => FH * (0.62 + capa * 0.12) + Math.sin((x + capa * 40) * 0.035 + capa) * 7 + Math.sin(x * 0.013 + 2) * 5;
    for (let capa = 0; capa < 2; capa++) {
      for (let x = 0; x < FW; x += 2) { const y = loma(x, capa); rc(verde[capa], x, y, 2, FH - y); }
      // Entre una loma y la otra: casitas de techos de colores y árboles redondos con fruta, que se mecen con el golpe
      if (capa === 0) for (let i = 0; i < 6; i++) {
        const x = Math.round(FW * (0.06 + i * 0.18) + h(i) * 12), y = Math.round(loma(x, 0)) + 2;
        if (i % 2) {
          const techo = ["#ff6b6b", "#5aa9ff", "#ffb13b"][i % 3];
          rc("#fff3d6", x - 7, y - 9, 14, 9);
          for (let k = 0; k < 5; k++) rc(techo, x - 9 + k * 2, y - 10 - k, 18 - k * 4, 1);
          rc("#8a5a3a", x - 2, y - 5, 4, 5); rc(noche ? "#ffe14a" : "#bfe9ff", x + 3, y - 7, 3, 3);
        } else {
          rc("#8a5a3a", x - 1, y - 8, 3, 8); disco(noche ? "#1d6b4a" : rojo ? "#6b7a3a" : "#3fbf5a", x, y - 13, 7 + (pulso > 0.6 ? 1 : 0));
          rc("#ff6b6b", x - 3, y - 14, 2, 2); rc("#ff6b6b", x + 2, y - 11, 2, 2);
        }
      }
    }
    for (let i = 0; i < 60; i++) rc(noche ? "#1a5a40" : rojo ? "#36451f" : "#3fa84c", h(i) * FW, FH * (0.76 + h(i + 0.2) * 0.23), 2, 1);
    if (!RM) for (let i = 0; i < 18; i++) rc(noche ? "#fff6b0" : i % 2 ? "#ffb3d9" : "#ffffff", (h(i) * FW + ts * (8 + h(i + 0.3) * 10)) % FW, (h(i + 0.5) * FH + ts * (10 + h(i + 0.1) * 8)) % FH, 1, 1);
  }
  // El infierno: cielo de sangre, un eclipse, sierras dentadas, un río de lava que late y pilares en llamas
  function infierno(nivel) {
    bandas(["#120004", "#2a0308", "#4a060c", "#7a0d0f", "#b3260f"], 0, FH * 0.72);
    rc("#1a0206", 0, FH * 0.7, FW, FH);
    disco("#ff3b1a", FW * 0.5, FH * 0.28, 14 + pulso * 2); disco("#120004", FW * 0.5, FH * 0.28, 10);
    for (let capa = 0; capa < 2; capa++) for (let x = 0; x < FW; x += 3) {
      const n = Math.floor(x / 3), y = FH * (0.52 + capa * 0.12) - Math.abs(((n * 7 + capa * 13) % 17) - 8) * (1.6 + capa) - h(n + capa) * 5;
      rc(capa ? "#0a0002" : "#2a0308", x, y, 3, FH - y);
    }
    const ly = FH * 0.82;
    for (let x = 0; x < FW; x += 2) { const y = ly + Math.sin(x * 0.05 + ts * 2) * 2; rc(pulso > 0.6 ? "#ffd23b" : "#ff7a1a", x, y, 2, 3); rc("#b3260f", x, y + 3, 2, FH - y); }
    for (let i = 0; i < 4; i++) {
      const x = FW * (0.12 + i * 0.25), f = RM ? 2 : ((t >> 2) + i) % 3;
      rc("#0a0002", x - 3, FH * 0.44, 6, FH * 0.4); rc("#2a0308", x - 5, FH * 0.44, 10, 2);
      rc("#ff7a1a", x - 2, FH * 0.44 - 4 - f, 5, 4 + f); rc("#ffe14a", x - 1, FH * 0.44 - 3 - f, 3, 2 + f);
    }
    if (!RM) for (let i = 0; i < 24 + nivel * 12; i++) rc(i % 3 ? "#ff7a1a" : "#ffe14a", h(i) * FW, FH - ((ts * (16 + h(i + 0.4) * 30) + h(i + 0.1) * FH) % FH), 1, 1);
    if (!RM && nivel && pulso > 0.85) { c2.globalAlpha = 0.12; rc("#ff2a1a", 0, 0, FW, FH); c2.globalAlpha = 1; }
  }
  // Un portal: óvalo por el que se ve la escena 'dentro', con su aro de chispas
  function portal(x, y, rx, dentro, e) {
    const ry = rx * 1.6;
    if (rx < 1) return;
    c2.save();
    c2.beginPath(); c2.ellipse(x, y, rx, ry, 0, 0, TAU); c2.clip();
    dentro(e);
    c2.restore();
    for (let i = 0; i < 40; i++) { const a = (i / 40) * TAU + ts * 2; rc(i % 3 ? "#ff2a4a" : i % 2 ? "#ffd23b" : "#ffffff", x + Math.cos(a) * (rx + (RM ? 0 : Math.random() * 2)), y + Math.sin(a) * (ry + (RM ? 0 : Math.random() * 2)), rx > 20 ? 2 : 1, rx > 20 ? 2 : 1); }
  }
  // La pasarela: cortinas a rayas y reflectores rosas que barren al compás
  function pasarela() {
    for (let x = 0; x < FW; x += 12) rc(x % 24 ? "#7a2a6b" : "#a33a8a", x, 0, 12, FH);
    rc("#3a1040", 0, FH * 0.7, FW, FH);
    for (let i = 0; i < 4; i++) { const x = FW * (0.15 + i * 0.23); haz("255,200,230", 0.16 + pulso * 0.12, x, 4, x + Math.sin(ts * 1.3 + i * 1.7) * FW * 0.2, 60, 0, FH * 0.7); }
    for (let i = 0; i < 24; i++) if ((t >> 3) % 3 === i % 3) rc("#ffffff", h(i) * FW, h(i + 0.5) * FH * 0.7, 1, 1);
  }
  const conPareja = (f, modo, caza) => (e) => { f(e); pareja(Math.round(FH * 0.66), modo, caza); };
  // Cada tramo trae sus dos caras [pueblo, infierno]; los que van sueltos (jefe, túnel, pantalla partida) son una sola escena
  const ESCENAS_D = [
    [conPareja(() => pueblo(0), "p"), conPareja(() => infierno(0), "i")],
    [conPareja(() => pueblo(1), "p"), conPareja(() => infierno(0), "i")],
    [conPareja(() => pueblo(1), "p"), conPareja(() => infierno(0), "i")],
    [conPareja(() => pueblo(2), "p", true), conPareja(() => infierno(1), "i")],
    [conPareja(() => pueblo(1), "p", true), conPareja(() => infierno(1), "i")],
    [conPareja(pasarela, "p"), conPareja(() => infierno(1), "i")],
    // JEFE DEMONIO.EXE: una calavera con cuernos flota sobre la lava, con los ojos encendidos
    (e) => {
      infierno(2);
      const s = Math.max(2, Math.round(Math.min(60, FW * 0.4, FH * 0.34) / 12)), lx = e.cx + Math.sin(ts * 1.2) * W * 0.3, ly = gy + H * 0.3 - pulso * 3 + Math.sin(ts * 2) * 2;
      haz("255,60,20", 0.14 + pulso * 0.14, lx, 13 * s, lx, FW * 0.7, ly, FH);
      sprFx(DEMONIO, Math.round(lx - 6.5 * s), Math.round(ly - 6 * s), s, { R: "#b3260f", W: "#e8e0d0", K: "#0a0002", Y: pulso > 0.5 ? "#ffffff" : "#ffd23b" });
    },
    // ENTRE DIMENSIONES: BIT vuela por el túnel entre los dos mundos; pasan portales por los que se asoma el pueblo
    (e) => {
      bandas(["#2a0308", "#4a060c", "#7a0d0f", "#b3260f", "#7a0d0f", "#4a060c", "#2a0308"], 0, FH);
      if (!RM) for (let i = 0; i < 40; i++) { const v = 60 + h(i) * 140, x = FW - ((ts * v + h(i + 0.3) * FW) % FW); rc(i % 4 ? "#ff7a1a" : "#ffe14a", x, h(i + 0.6) * FH, 3 + v / 40, 1); }
      for (let i = 0; i < 2; i++) { const x = FW + 50 - ((ts * 34 + i * (FW + 100) / 2) % (FW + 100)); portal(x, FH * (0.3 + i * 0.4), 16 + pulso * 2, () => pueblo(i ? 2 : 1), e); }
    },
    // DOS MUNDOS: la pantalla partida, el pueblo de un lado y el infierno del otro; la raya se mece con la música
    (e) => {
      const corte = e.cx + Math.sin(ts * 1.4) * FW * 0.12, inc = FH * 0.18;
      pueblo(1);
      c2.save();
      c2.beginPath(); c2.moveTo(corte + inc, 0); c2.lineTo(FW, 0); c2.lineTo(FW, FH); c2.lineTo(corte - inc, FH); c2.closePath(); c2.clip();
      infierno(1);
      c2.restore();
      linea(pulso > 0.6 ? "#ffffff" : "#ffd23b", corte + inc, 0, corte - inc, FH); linea("#0a0002", corte + inc + 1, 0, corte - inc + 1, FH);
    },
    [conPareja(() => pueblo(5), "p"), conPareja(() => infierno(0), "i")],
  ];
  // En qué mundo va el video en este segundo, y cuándo fue el último cambio y cuándo viene el siguiente
  function mundoVideo() {
    let m = 0, ult = -9, sig = 1e9;
    for (const c of R.cambios || []) { if (ts >= c) { m ^= 1; ult = c; } else { sig = c; break; } }
    return { m, ult, sig };
  }
  // El mundo que se ve ahora (para el traje de BIT): el del video en los tramos de dos caras; el del tramo en los demás
  const mundoVis = () => (Array.isArray(ESCENAS_D[secI]) ? (mundoVideo().m ? "i" : "p") : mundoDe(secI));
  // La escena del tramo. Al cambiar de mundo, el otro lado entra por un portal que crece desde el centro; si el cambio
  // viene tras un rato largo en el mismo mundo, un par de segundos antes ya se ve el portal abierto a la derecha
  function escenaDoom(e) {
    const par = ESCENAS_D[secI];
    if (!Array.isArray(par)) { par(e); return; }
    const { m, ult, sig } = mundoVideo(), en = ts - ult;
    if (!RM && en < 0.55) { par[m ^ 1](e); portal(e.cx, e.cy, Math.pow(en / 0.55, 2) * Math.hypot(FW, FH) * 0.5, par[m], e); return; }
    par[m](e);
    if (sig - ts < 2.5 && sig - ult > 6) portal(FW * 0.88, FH * 0.5, Math.min(12, (2.5 - (sig - ts)) * 8) + pulso * 1.5, par[m ^ 1], e);
  }
  /* ---------- Escenarios del nivel FUTURE FUNK ----------
     Pixel art de consola de 8 bits: muy pocos colores por escena (azules de noche, o el morado al naranja del ocaso, más
     negro, un naranja de acento y blanco), degradados hechos con trama en vez de mezclas suaves, siluetas grandes en negro
     con un filo de luz, cielo con pocas estrellas y franjas negras de cine arriba y abajo. */
  // Las tramas (degradados punteados) se pintan una sola vez en un lienzo guardado y luego solo se copian
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  let tramas = {};
  const rgbDe = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  function trama(clave, w, hh, pintar) {
    const k = `${clave}|${w}|${hh}`;
    if (!tramas[k]) {
      const cv = document.createElement("canvas");
      cv.width = w; cv.height = hh;
      const x = cv.getContext("2d"), im = x.createImageData(w, hh);
      pintar(im.data, w, hh);
      x.putImageData(im, 0, 0);
      tramas[k] = cv;
    }
    return tramas[k];
  }
  // El cielo: los colores van de arriba abajo y entre uno y el siguiente se mezclan con trama
  function cieloTramado(cols, y0, y1) {
    const hh = Math.max(1, Math.round(y1 - y0));
    c2.drawImage(trama(`c${cols.join("")}`, FW, hh, (d, w, alto) => {
      const C = cols.map(rgbDe), n = C.length - 1;
      for (let y = 0; y < alto; y++) {
        const f = (y / alto) * n, i = Math.min(n - 1, Math.floor(f)), fr = f - i;
        for (let x = 0; x < w; x++) { const c = fr * 16 > BAYER[(x & 3) + (y & 3) * 4] + 0.5 ? C[i + 1] : C[i], p = (y * w + x) * 4; d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2]; d[p + 3] = 255; }
      }
    }), 0, Math.round(y0));
  }
  // Una mancha de un solo color hecha de puntos: fn(x, y) (de 0 a 1 en cada eje) dice qué tan tupida va en cada lugar
  function mancha(clave, c, fn) {
    c2.drawImage(trama(`m${clave}${c}`, FW, FH, (d, w, alto) => {
      const C = rgbDe(c);
      for (let y = 0; y < alto; y++) for (let x = 0; x < w; x++) if (fn(x / w, y / alto) * 16 > BAYER[(x & 3) + (y & 3) * 4] + 0.5) { const p = (y * w + x) * 4; d[p] = C[0]; d[p + 1] = C[1]; d[p + 2] = C[2]; d[p + 3] = 255; }
    }), 0, 0);
  }
  const PF = { k: "#000010", n1: "#0c0c6c", n2: "#1c1cb4", n3: "#2c64e4", n4: "#5cb0fc", o1: "#e86c10", o2: "#fca44c", b: "#ffffff" };
  const NOCHE_F = [PF.n1, PF.n1, PF.n2, PF.n2, PF.n3], OCASO_F = ["#18084c", "#4c1088", "#a0247c", "#e4505c", "#fc9c4c", "#fcd87c"], ALBA_F = ["#4c1088", "#a0247c", "#e4505c", "#fc9c4c", "#fcd87c", "#fcf4c4"];
  // Las laderas de luz punteada que suben por los dos costados, y las franjas negras de cine
  const laderas = (c) => mancha("lad", c, (x, y) => Math.max(0, (y - 0.12 - Math.min(x, 1 - x) * 1.7) * 1.5));
  const resplandor = (clave, c, cx, cy, r) => mancha(`r${clave}`, c, (x, y) => Math.max(0, 1 - Math.hypot((x - cx) * (FW / FH), y - cy) / r));
  function cine() { const a = Math.round(FH * 0.09); rc("#000000", 0, 0, FW, a); rc("#000000", 0, FH - a, FW, a); }
  // Pocas estrellas: puntos sueltos y alguna en cruz, que titila
  function estrellasF(n, yMax, c) {
    for (let i = 0; i < n; i++) {
      const x = Math.round(h(i + 0.13) * FW), y = Math.round(FH * 0.1 + h(i + 0.57) * yMax);
      if (i % 5 === 0) { if (RM || (t >> 4) % 3 !== i % 3) { rc(c, x - 1, y, 3, 1); rc(c, x, y - 1, 1, 3); } } else rc(c, x, y, 1, 1);
    }
  }
  // La luna, gordita y de orillas a escalón
  function lunaF(x, y, r) { for (let dy = -r; dy <= r; dy++) { const w = Math.min(r, Math.round((r - Math.abs(dy)) * 1.6 + r * 0.45)); rc(PF.b, x - w, y + dy, w * 2, 1); } }
  // El piso en rejilla, con las líneas que se acercan
  function rejilla(c, yH, fondo) {
    rc(fondo, 0, yH, FW, FH - yH);
    for (let i = 0; i < 9; i++) { const k = (i + (RM ? 0 : (ts * 0.9) % 1)) / 9, y = yH + k * k * (FH - yH); rc(c, 0, y, FW, 1); }
    for (let i = -8; i <= 8; i++) linea(c, FW / 2 + i * 9, yH, FW / 2 + i * 34, FH);
  }
  // El sol: un disco de dos tonos cortado por franjas del color del cielo
  function solRetro(c1, c2b, cA, x, y, r) {
    for (let dy = -r; dy <= r; dy++) { const w = Math.round(Math.sqrt(r * r - dy * dy)); rc(dy > r * 0.1 ? c2b : c1, x - w, y + dy, w * 2, 1); }
    for (let i = 1; i < 6; i++) rc(cA, x - r, y + r - i * i * 0.8 - 1, r * 2, Math.max(1, Math.round(i * 0.55)));
  }
  // La ciudad en silueta: negra, con un filo de luz a la izquierda de cada edificio y pocas ventanas encendidas
  function ciudad(yH, alto, filo, luces, codigo) {
    for (let i = 0; i < 16; i++) {
      const x = Math.round(i * (FW / 16)), w = Math.ceil(FW / 16), a = Math.round((8 + h(i + 0.2) * 24) * alto + (i % 5 === 2 ? 14 * alto : 0));
      // Rota: cada edificio es una columna de letras verdes que cambian sin parar
      if (codigo) {
        rc("#000800", x, yH - a, w, a); rc("#3fff8a", x, yH - a, 1, a); rc("#3fff8a", x, yH - a, w, 1);
        const paso = Math.floor(ts * 12);
        for (let k = 0; k * 6 < a - 6; k++) for (let j = 0; j * 4 < w - 4; j++) { const q = h(i * 13 + k * 7 + j * 3 + paso * 0.61); if (q > 0.35) glifo("01<>/#$%=+*X"[(q * 97) % 12 | 0], x + 2 + j * 4, yH - a + 3 + k * 6, q > 0.9 ? "#ffffff" : q > 0.6 ? "#3fff8a" : "#1d7a45"); }
        continue;
      }
      rc(PF.k, x, yH - a, w, a); rc(filo, x, yH - a, 1, a); rc(filo, x, yH - a, w * 0.5, 1);
      if (i % 5 === 2) { rc(PF.k, x + w / 2 - 1, yH - a - 7, 2, 7); if ((t >> 4) % 2) rc(luces[1], x + w / 2 - 1, yH - a - 8, 2, 1); }
      for (let k = 0; k < a / 6 - 1; k++) for (let j = 0; j < 2; j++) if (h(i * 9 + k * 3 + j + (golpeN >> 3)) > 0.7) rc(luces[(i + k + j) % luces.length], x + 3 + j * 5, yH - a + 4 + k * 6, 2, 3);
    }
  }
  // Palmeras en primer plano: silueta negra con el filo de las hojas iluminado
  function palmeras(yH, lugares, filo) {
    lugares.forEach(([fx, alto], i) => {
      const x = Math.round(FW * fx), y = yH + 6, m = RM ? 0 : Math.sin(ts * 1.2 + i) * 2, cima = y - alto;
      for (let k = 0; k < alto; k++) rc(PF.k, x + Math.round(Math.sin(k * 0.05 + i) * 4), y - k, 3 + (k < 6 ? 1 : 0), 1);
      const cx2 = x + Math.round(Math.sin(alto * 0.05 + i) * 4) + 1;
      for (let k = -3; k <= 3; k++) {
        const largo = alto * 0.42, ex = cx2 + k * largo * 0.36 + m, ey = cima + Math.abs(k) * largo * 0.24 - (3 - Math.abs(k)) * 2;
        for (let g = 0; g < 3; g++) linea(PF.k, cx2, cima + g, ex, ey + g + 1);
        linea(filo, cx2, cima - 1, ex, ey);
      }
      rc(PF.k, cx2 - 2, cima, 5, 4);
    });
  }
  // El casete gigante del arranque y del lado B: silueta negra con filo de luz, dos carretes que giran y el avance de la cinta
  function casete(e, ladoB) {
    cieloTramado(NOCHE_F, 0, FH);
    laderas(PF.n3);
    estrellasF(26, FH * 0.5, PF.b);
    lunaF(Math.round(FW * 0.82), Math.round(FH * 0.24), 6);
    const w = Math.round(Math.min(160, FW * 0.62)), hh = Math.round(w * 0.6), x = Math.round(e.cx - w / 2), y = Math.round(e.cy - hh / 2), filo = ladoB ? PF.n4 : PF.o2;
    rc(PF.k, x, y, w, hh); rc(filo, x, y, w, 1); rc(filo, x + w - 1, y, 1, hh); rc(ladoB ? PF.n3 : PF.o1, x + w - 2, y + 2, 1, hh - 2);
    rc(PF.n1, x + 10, y + 9, w - 20, Math.round(hh * 0.5)); rc(PF.n2, x + 10, y + 9, w - 20, 1);
    for (const lado of [-1, 1]) {
      const cx2 = Math.round(e.cx + lado * w * 0.22), cy2 = Math.round(y + 9 + hh * 0.25), g = ts * (ladoB ? -3 : 2) * lado;
      disco(PF.k, cx2, cy2, 12); aro(PF.b, cx2, cy2, 9, 6, g, 2); aro(filo, cx2, cy2, 4, 4, -g, 1);
    }
    rc(PF.n2, x + 12, y + hh - 13, w - 24, 4); rc(filo, x + 12, y + hh - 13, Math.round((w - 24) * Math.min(1, Math.max(0, (ts - e.sec[0]) / (e.sec[1] - e.sec[0])))), 4);
    for (let i = 0; i < 4; i++) rc(PF.n2, x + 8 + i * ((w - 20) / 3), y + hh - 5, 4, 2);
    cine();
  }
  // Cada tantos segundos la ciudad "se rompe" un instante y se ve como código verde
  const glitchCiudad = () => !RM && h(Math.floor(ts * 1.5) * 0.731) < 0.2;
  // Una letra de la fuente chica (3×5) en el lienzo de efectos
  function glifo(ch, x, y, c) { c2.fillStyle = c; (FUENTE[ch] || []).forEach((r, j) => { for (let i = 0; i < 3; i++) if (r[i] === "1") c2.fillRect(x + i, y + j, 1, 1); }); }
  // Luces de discoteca de los 90 detrás de la ciudad: cuatro reflectores que barren el cielo y cambian de color con el golpe
  function lucesDisco(yH) {
    const cols = [PF.n4, "#e4505c", "#fcd87c", "#a0247c"];
    for (let i = 0; i < 4; i++) {
      const x = FW * (0.14 + i * 0.24), a = -Math.PI / 2 + Math.sin(ts * 1.1 + i * 1.9) * 0.55, largo = FH * 0.9, c = cols[(i + golpeN) % 4];
      poligono(c, 0.2 + pulso * 0.14, [[x, yH], [x + Math.cos(a - 0.07) * largo, yH + Math.sin(a - 0.07) * largo], [x + Math.cos(a + 0.07) * largo, yH + Math.sin(a + 0.07) * largo]]);
      const px = x + Math.cos(a) * FH * 0.42, py = yH + Math.sin(a) * FH * 0.42; rc(c, px - 2, py, 5, 1); rc(c, px, py - 2, 1, 5);
    }
    // Destellos de bola de espejos repartidos por el cielo
    if (!RM) for (let i = 0; i < 18; i++) if (h(i + golpeN * 0.37) > 0.6) rc(cols[i % 4], h(i + 0.2) * FW, FH * 0.1 + h(i + 0.7) * (yH - FH * 0.2), 2, 2);
  }
  // Una maquinita de arcade: marquesina encendida, pantalla con su juego, tablero con palanca y botones, y puerta de monedas
  function maquina(x, yBase, s, n) {
    const X = Math.round(x), Y = Math.round(yBase - 30 * s), r = (c, a, b, w, hh) => rc(c, X + a * s, Y + b * s, w * s, hh * s);
    const v = ((n % 4) + 4) % 4, cuerpo = [PF.n3, PF.n2, "#a0247c", PF.n3][v], claro = [PF.n4, PF.n3, "#e4505c", PF.n4][v], oscuro = [PF.n2, PF.n1, "#4c1088", PF.n2][v], pant = ["#a0247c", PF.o1, PF.n1, "#18084c"][v], tinta = ["#fcd87c", PF.b, PF.n4, PF.o2][v];
    r(PF.k, -1, -1, 18, 32);
    r(cuerpo, 1, 0, 14, 5); r(claro, 1, 0, 14, 1);
    r((golpeN + n) % 2 ? tinta : claro, 3, 1, 10, 3); r(PF.k, 5, 2, 6, 1);
    r(cuerpo, 0, 5, 16, 12); r(claro, 0, 5, 1, 12); r(oscuro, 15, 5, 1, 12);
    r(PF.k, 2, 6, 12, 10); r(pant, 3, 7, 10, 8);
    // El juego en pantalla: tres marcianitos que bajan y una nave que dispara
    const f = RM ? 0 : (t >> 4) + n * 3;
    for (let i = 0; i < 3; i++) r(tinta, 4 + i * 3 + (f % 2), 8 + (Math.floor(f / 2) % 3), 2, 1);
    r(PF.b, 5 + (f % 6), 13, 2, 1); if (f % 3 === 0) r(PF.b, 6 + (f % 6), 10, 1, 2);
    r(claro, -1, 17, 18, 1); r(cuerpo, -1, 18, 18, 2); r(oscuro, -1, 20, 18, 1);
    r(PF.k, 4, 15, 1, 3); r("#e4505c", 3, 14, 3, 2);
    r(PF.o2, 9, 18, 2, 1); r(PF.b, 12, 18, 2, 1); r("#e4505c", 12, 16, 1, 1);
    r(oscuro, 1, 21, 14, 9); r(cuerpo, 1, 21, 1, 9); r(PF.n1, 2, 22, 12, 1);
    r(PF.k, 6, 24, 4, 4); r(PF.o2, 7, 25, 1, 1); r(claro, 9, 26, 1, 1);
    for (let i = 0; i < 3; i++) r(PF.n1, 3 + i * 4, 29, 2, 1);
  }
  const BOCINA = ["..MMMMMMMMM..", ".MSSSSSSSSSM.", "MSSWWSSSWWSSM", "MSWKKWSWKKWSM", "MSWKKWSWKKWSM", "MSSWWSSSWWSSM", "MSSSSSSSSSSSM", "MSCCCCCCCCCSM", "MSCKCKCKCKCSM", ".MSSSSSSSSSM.", "..MMMMMMMMM.."];
  const ESCENAS_F = [
    // 1. ASCENSO: BIT sube por el cielo hacia la luna. Empieza despacio, entre nubes; al final va a la velocidad de la luz,
    //    las estrellas se vuelven rayas, la luna aparece enorme al centro y todo se va a blanco para dar paso al atardecer
    (e) => {
      const dur = e.sec[1] - e.sec[0], k = Math.min(1, Math.max(0, (ts - e.sec[0]) / dur)), vel = 6 + 900 * Math.pow(k, 5), dist = RM ? 0 : 6 * ts + 150 * dur * Math.pow(k, 6);
      cieloTramado(k < 0.35 ? NOCHE_F : k < 0.7 ? [PF.k, PF.n1, PF.n1, PF.n2] : [PF.k, PF.k, PF.k, PF.n1], 0, FH);
      if (k < 0.3) laderas(PF.n3);
      // Las nubes se quedan abajo
      for (let i = 0; i < 6; i++) { const w = 60 + h(i) * 60, x = h(i + 0.3) * (FW + 40) - 40, y = FH * (0.62 + h(i + 0.6) * 0.3) + dist * (1 + h(i) * 0.6); if (y < FH) { rc(PF.k, x, y, w, FH); rc(PF.k, x + 10, y - 5, w - 24, 5); rc(PF.n4, x, y, 10, 1); rc(PF.n4, x + 10, y - 5, w - 24, 1); } }
      // Las estrellas pasan hacia abajo: puntos al principio, rayas cada vez más largas después
      for (let i = 0; i < 70; i++) {
        const par = 0.3 + h(i + 0.2) * 0.9, x = Math.round(h(i) * FW), y = (h(i + 0.5) * FH + dist * par) % FH, largo = Math.max(1, Math.min(FH * 0.7, vel * par * 0.035));
        rc(i % 6 === 0 ? PF.n4 : PF.b, x, y - largo, 1, largo);
        if (largo < 2 && i % 7 === 0 && (RM || (t >> 4) % 3 !== i % 3)) { rc(PF.b, x - 1, y - 1, 3, 1); rc(PF.b, x, y - 2, 1, 3); }
      }
      // La luna crece al centro, con su resplandor punteado y rayos de velocidad que salen de ella
      if (k > 0.7) {
        const q = (k - 0.7) / 0.3, r = Math.round(2 + q * q * Math.min(FW, FH) * 0.3), mx = Math.round(e.cx), my = Math.round(FH * 0.4);
        if (q > 0.35) resplandor(`as${q > 0.7 ? 2 : 1}`, q > 0.7 ? PF.n4 : PF.n3, 0.5, 0.4, q > 0.7 ? 0.62 : 0.4);
        if (!RM) for (let i = 0; i < 46; i++) { const a = h(i + 0.9) * TAU, f = (ts * (1.5 + h(i) * 2) + h(i + 0.4)) % 1, r0 = r + 4 + f * FW * 0.6, r1 = r0 + 6 + q * 40 * f; linea(i % 4 ? PF.b : PF.n4, mx + Math.cos(a) * r0, my + Math.sin(a) * r0, mx + Math.cos(a) * r1, my + Math.sin(a) * r1); }
        lunaF(mx, my, r);
        if (r > 8) { rc(PF.n4, mx - r * 0.45, my - r * 0.3, r * 0.28, r * 0.16); rc(PF.n4, mx + r * 0.3, my + r * 0.25, r * 0.22, r * 0.14); rc(PF.n4, mx - r * 0.1, my + r * 0.5, r * 0.16, r * 0.1); }
        // El gran destello: la pantalla se llena de blanco en cuatro pasos de trama
        if (q > 0.86) { const f = (q - 0.86) / 0.14; if (f > 0.75) rc(PF.b, 0, 0, FW, FH); else mancha(`fl${Math.floor(f * 4)}`, PF.b, () => [0.3, 0.55, 0.8][Math.floor(f * 4)]); }
      }
      cine();
    },
    // 2. ATARDECER: el sol se mete en el mar; dos palmeras enormes en primer plano
    (e) => {
      const yH = Math.round(FH * 0.64), k = Math.min(1, Math.max(0, (ts - e.sec[0]) / (e.sec[1] - e.sec[0])));
      cieloTramado(OCASO_F, 0, yH);
      estrellasF(12, FH * 0.2, PF.b);
      // El sol va saliendo del mar poco a poco a lo largo del tramo
      solRetro("#fcd87c", "#fc9c4c", "#e4505c", Math.round(FW * 0.5), Math.round(yH + 22 - k * 32), Math.round(24 + pulso * 2));
      rc("#18084c", 0, yH, FW, FH - yH);
      mancha("mar", "#e4505c", (x, y) => (y < 0.64 ? 0 : Math.max(0, 0.9 - Math.abs(x - 0.5) * 5 - (y - 0.64) * 1.2)));
      for (let i = 0; i < 9; i++) { const y = yH + 3 + i * i * 0.9; rc("#fc9c4c", FW * 0.5 - 16 + h(i + (t >> 4)) * 26, y, 5 + h(i) * 6, 1); }
      rc("#4c1088", 0, yH, FW, 1);
      palmeras(yH + 8, [[0.1, 62], [0.2, 40], [0.86, 70], [0.95, 44]], "#fc9c4c");
      rc(PF.k, 0, yH + 12, FW * 0.3, FH); rc(PF.k, FW * 0.76, yH + 14, FW, FH);
      cine();
    },
    // 3. AUTOPISTA: la carretera corre hacia ti, con la ciudad en silueta contra el ocaso y luces de disco detrás
    () => {
      const yH = Math.round(FH * 0.6), gl = glitchCiudad();
      cieloTramado(OCASO_F, 0, yH);
      solRetro("#fcd87c", "#fc9c4c", "#e4505c", Math.round(FW * 0.5), yH - 4, Math.round(22 + pulso * 3));
      lucesDisco(yH);
      ciudad(yH, 0.9, "#a0247c", ["#fcd87c", "#fc9c4c"], gl);
      rejilla(gl ? "#3fff8a" : "#a0247c", yH, PF.k);
      rc(gl ? "#3fff8a" : "#fc9c4c", 0, yH, FW, 1);
      for (let i = 0; i < 6; i++) { const k = (i + (RM ? 0 : (ts * 1.8) % 1)) / 6, y = yH + k * k * (FH - yH); rc("#fcd87c", FW / 2 - 1 - k * 2, y, 2 + k * 4, 2 + k * 5); }
      for (const lado of [-1, 1]) for (let i = 0; i < 3; i++) { const k = (i + (RM ? 0 : (ts * 0.9) % 1)) / 3, y = yH + k * k * (FH - yH), x = FW / 2 + lado * (40 + k * k * FW * 0.5); rc(PF.k, x, y - 12 - k * 34, 2 + k * 2, 12 + k * 34); rc("#fcd87c", x - 2, y - 14 - k * 34, 6 + k * 3, 2); }
      if (gl) tiras(4, 10, Math.floor(ts * 14));
      cine();
    },
    // 4. EL RASCACIELOS: la cámara sube por la fachada de un edificio en plena fiesta. Sus ventanas laten con la música,
    //    cada tanto el edificio se rompe en código verde, y la luna lo mira todo desde atrás
    (e) => {
      const k = Math.min(1, Math.max(0, (ts - e.sec[0]) / (e.sec[1] - e.sec[0]))), sube = RM ? 0 : (ts - e.sec[0]) * (26 + 44 * k), gl = glitchCiudad();
      cieloTramado(NOCHE_F, 0, FH);
      laderas(PF.n3);
      estrellasF(26, FH * 0.7, PF.b);
      const mx = Math.round(FW * 0.75), my = Math.round(FH * 0.3);
      resplandor("ras", PF.n4, 0.75, 0.3, 0.3);
      lunaF(mx, my, 15); rc(PF.n4, mx - 7, my - 5, 4, 3); rc(PF.n4, mx + 5, my + 4, 3, 2); rc(PF.n4, mx - 2, my + 8, 3, 2);
      lucesDisco(FH);
      // Los edificios de los lados, más lejos: pasan más despacio
      for (const [x0, x1] of [[0, FW * 0.2], [FW * 0.86, FW]]) {
        rc(PF.k, x0, 0, x1 - x0, FH); rc(PF.n3, x1 === FW ? x0 : x1 - 1, 0, 1, FH);
        for (let r = -1; r < FH / 9 + 1; r++) { const n = Math.floor((sube * 0.45) / 9) - r, y = r * 9 + ((sube * 0.45) % 9); for (let i = 0; (i + 1) * 6 < x1 - x0; i++) if (h(n * 7.3 + i * 3.1 + x0) > 0.62) rc(h(n + i) > 0.5 ? PF.n3 : PF.o1, x0 + 3 + i * 6, y, 3, 4); }
      }
      // El edificio del centro: piso por piso, con cornisas y ventanas de colores que cambian con el golpe
      const bx = Math.round(FW * 0.3), bw = Math.round(FW * 0.38), alto = 13, cols = Math.max(4, Math.floor((bw - 8) / 9));
      rc(gl ? "#000800" : "#04041c", bx, 0, bw, FH); rc(gl ? "#3fff8a" : PF.n4, bx, 0, 1, FH); rc(gl ? "#1d7a45" : PF.n2, bx + bw - 1, 0, 1, FH);
      for (let r = -1; r < FH / alto + 1; r++) {
        const n = Math.floor(sube / alto) - r, y = Math.round(r * alto + (sube % alto));
        if (gl) { const paso = Math.floor(ts * 12); for (let i = 0; i * 4 < bw - 6; i++) for (let j = 0; j < 2; j++) { const q = h(n * 13.7 + i * 3.3 + j * 7.1 + paso * 0.61); if (q > 0.3) glifo("01<>/#$%=+*X"[(q * 97) % 12 | 0], bx + 3 + i * 4, y + 1 + j * 6, q > 0.9 ? "#ffffff" : q > 0.6 ? "#3fff8a" : "#1d7a45"); } continue; }
        rc(((n % 6) + 6) % 6 === 0 ? PF.n3 : PF.n1, bx + 1, y + alto - 2, bw - 2, ((n % 6) + 6) % 6 === 0 ? 2 : 1);
        for (let i = 0; i < cols; i++) {
          const q = h(n * 5.3 + i * 9.7 + (golpeN >> 1) * 0.37), fiesta = h(n * 2.1 + i) > 0.55, x = bx + 5 + Math.round((i * (bw - 10)) / cols);
          rc(!fiesta ? (q > 0.8 ? PF.n2 : PF.n1) : q > 0.72 ? PF.b : q > 0.5 ? PF.o2 : q > 0.3 ? "#e4505c" : PF.n3, x, y + 2, 6, 7);
          if (fiesta && q > 0.5) rc(PF.k, x + 2 + ((golpeN + i) % 2), y + 5, 2, 4);
        }
      }
      // Un letrero de neón vertical trepa por la orilla
      if (!gl) for (let r = -1; r < FH / 20 + 1; r++) { const y = r * 20 + (sube % 20); rc((golpeN + r) % 2 ? "#e4505c" : PF.o2, bx - 5, y, 3, 12); }
      if (gl) tiras(4, 10, Math.floor(ts * 14));
      cine();
    },
    // 5. ARCADE: un recorrido de izquierda a derecha por el salón; dos filas de maquinitas pasan a distinta velocidad
    () => {
      const yH = Math.round(FH * 0.72), cam = RM ? 0 : ts * 26;
      rc("#04041c", 0, 0, FW, FH);
      mancha("arc", PF.n1, (x, y) => Math.max(0, 0.8 - Math.abs(y - 0.4) * 2.2));
      // La pared del fondo: tubos de neón y carteles que pasan despacio
      for (let i = -1; i < FW / 70 + 1; i++) { const n = Math.floor(cam * 0.3 / 70) + i, x = n * 70 - cam * 0.3; rc((golpeN + n) % 2 ? PF.o1 : PF.n3, x + 8, FH * 0.14, 40, 2); rc(PF.n1, x + 16, FH * 0.2, 24, 16); rc(PF.n2, x + 16, FH * 0.2, 24, 1); rc(((n % 3) + 3) % 3 ? PF.n3 : PF.o2, x + 20, FH * 0.2 + 4, 16, 8); }
      // Fila de atrás (chicas) y fila de adelante (grandes)
      for (let i = -1; i < FW / 26 + 1; i++) { const n = Math.floor(cam * 0.6 / 26) + i; maquina(n * 26 - cam * 0.6, yH - 6, 1, n); }
      for (let j = 0; j < 6; j++) for (let i = -1; i < FW / 14 + 2; i++) { const n = Math.floor(cam / 14) + i; if ((((n + j) % 2) + 2) % 2) rc(PF.n1, n * 14 - cam, yH + j * 8, 14, 8); }
      rc(PF.n3, 0, yH, FW, 1);
      for (let i = -1; i < FW / 50 + 1; i++) { const n = Math.floor(cam / 50) + i; maquina(n * 50 - cam + 6, yH + 14, 2, n + 7); }
      cine();
    },
    // 6. LA AZOTEA: la luna enorme, antenas y un tinaco en silueta, la ciudad chiquita al fondo
    () => {
      const yH = Math.round(FH * 0.78);
      cieloTramado(NOCHE_F, 0, FH);
      laderas(PF.n3);
      estrellasF(34, FH * 0.55, PF.b);
      resplandor("lu", PF.n4, 0.68, 0.34, 0.34);
      lunaF(Math.round(FW * 0.68), Math.round(FH * 0.34), 20);
      rc(PF.n4, FW * 0.68 - 9, FH * 0.34 - 6, 5, 3); rc(PF.n4, FW * 0.68 + 6, FH * 0.34 + 5, 4, 3); rc(PF.n4, FW * 0.68 - 2, FH * 0.34 + 10, 3, 2);
      ciudad(yH, 0.6, PF.n3, [PF.o2, PF.n4]);
      rc(PF.k, 0, yH, FW, FH); rc(PF.o2, 0, yH, FW, 1);
      const ax = Math.round(FW * 0.14);
      rc(PF.k, ax, yH - 46, 2, 46); for (let k = 0; k < 4; k++) rc(PF.k, ax - 7 + k, yH - 44 + k * 5, 16 - k * 2, 1);
      rc((t >> 4) % 2 ? PF.o1 : PF.k, ax, yH - 48, 2, 2);
      const tx = Math.round(FW * 0.3); rc(PF.k, tx, yH - 26, 22, 18); rc(PF.o2, tx, yH - 26, 1, 18); rc(PF.o2, tx, yH - 26, 22, 1); rc(PF.k, tx + 3, yH - 8, 2, 8); rc(PF.k, tx + 17, yH - 8, 2, 8);
      cine();
    },
    // 7. PISTA DE BAILE: losetas de tres colores que se encienden con el golpe, bola de espejos y conos de luz punteada
    (e) => {
      const yH = Math.round(FH * 0.58), k = Math.min(1, Math.max(0, (ts - e.sec[0]) / (e.sec[1] - e.sec[0])));
      rc(PF.k, 0, 0, FW, FH);
      const cono = golpeN % 3;
      mancha(`co${cono}`, [PF.n2, PF.o1, PF.n3][cono], (x, y) => { const d = Math.abs(x - 0.5 - (cono - 1) * (y - 0.12) * 0.7); return y < 0.12 ? 0 : Math.max(0, 0.6 - d * 5 / (0.4 + y)); });
      for (let j = 0; j < 7; j++) {
        const y0 = yH + (j * j * (FH - yH)) / 49, y1 = yH + ((j + 1) * (j + 1) * (FH - yH)) / 49;
        for (let i = 0; i < 8; i++) { const on = h(i * 5 + j * 11 + golpeN) < 0.25 + k * 0.35, c = on ? [PF.n3, PF.o2, PF.n4, PF.b][(i + j + golpeN) % (k > 0.7 ? 4 : 3)] : (i + j) % 2 ? PF.n1 : "#04041c"; rc(c, FW / 2 + (i - 4) * (14 + j * 9), y0, 13 + j * 9, Math.max(1, y1 - y0 - 1)); }
      }
      const bx = Math.round(e.cx), by = Math.round(FH * 0.17);
      rc(PF.n2, bx, 0, 1, by); disco(PF.n2, bx, by, 11);
      for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (Math.abs(i) + Math.abs(j) < 4) rc(h(i * 3 + j * 7 + golpeN) > 0.6 ? PF.b : h(i + j * 5) > 0.5 ? PF.n4 : PF.n3, bx + i * 4 - 1 + (j & 1), by + j * 4 - 1, 3, 3);
      cine();
    },
    // 8. JEFE DJ.EXE: una bocina con cara flota sobre la pista; las barras del sonido suben con la música
    (e) => {
      rc(PF.k, 0, 0, FW, FH);
      mancha("dj", PF.n1, (x, y) => Math.max(0, 0.9 - Math.hypot(x - 0.5, (y - 0.4) * 0.9) * 2.2));
      for (let i = 0; i < 14; i++) { const x = Math.round(i * (FW / 14)), w = Math.ceil(FW / 14) - 2, a = Math.round(6 + espectro12(i) * FH * 0.36); for (let y = 0; y < a; y += 4) rc(y > a - 5 ? PF.o2 : y > a * 0.6 ? PF.n4 : PF.n3, x + 1, FH - Math.round(FH * 0.09) - y - 3, w, 3); }
      const s = Math.max(2, Math.round(Math.min(60, FW * 0.4, FH * 0.34) / 11)), lx = e.cx + Math.sin(ts * 1.2) * W * 0.3, ly = gy + H * 0.3 - pulso * 3 + Math.sin(ts * 2) * 2;
      sprFx(BOCINA, Math.round(lx - 6.5 * s), Math.round(ly - 5.5 * s), s, { M: PF.o2, S: PF.k, W: pulso > 0.5 ? PF.b : PF.n4, K: PF.k, C: pulso > 0.5 ? PF.o2 : PF.n2 });
      aro(PF.n4, lx, ly, 8 * s + pulso * 5, 18, ts, 1);
      cine();
    },
    // 9. LADO B
    (e) => casete(e, true),
    // 10. CIELO DE NEON: BIT vuela sobre un mar de nubes en silueta, con el filo encendido por el ocaso
    () => {
      cieloTramado(OCASO_F, 0, FH);
      estrellasF(16, FH * 0.25, PF.b);
      solRetro("#fcd87c", "#fc9c4c", "#e4505c", Math.round(FW * 0.5), Math.round(FH * 0.8), Math.round(30 + pulso * 3));
      for (let capa = 0; capa < 3; capa++) {
        const c = ["#4c1088", "#18084c", PF.k][capa], filo = ["#e4505c", "#fc9c4c", "#fcd87c"][capa], vel = [10, 22, 40][capa], y0 = FH * (0.56 + capa * 0.13);
        for (let i = 0; i < 7; i++) { const w = 50 + h(i + capa) * 50, x = FW + 40 - ((ts * vel + h(i + capa * 3 + 0.2) * (FW + 160)) % (FW + 160)), y = Math.round(y0 + h(i + capa + 0.5) * 12); rc(c, x, y, w, FH); rc(c, x + 8, y - 5, w - 20, 5); rc(c, x + 16, y - 9, w - 40, 4); rc(filo, x, y, 8, 1); rc(filo, x + 8, y - 5, 8, 1); rc(filo, x + 16, y - 9, Math.max(2, w - 40), 1); }
      }
      if (!RM) for (let i = 0; i < 16; i++) { const v = 70 + h(i) * 120, x = FW - ((ts * v + h(i + 0.3) * FW) % FW); rc(PF.b, x, FH * 0.12 + h(i + 0.6) * FH * 0.35, 4 + v / 30, 1); }
      cine();
    },
    // 11. AMANECER FUNK: sale el sol entre rayos punteados; palmeras y ciudad en silueta
    () => {
      const yH = Math.round(FH * 0.64);
      cieloTramado(ALBA_F, 0, yH);
      const fase = golpeN % 2;
      mancha(`ray${fase}`, "#fcf4c4", (x, y) => { if (y > 0.64) return 0; const a = Math.atan2(0.64 - y, (x - 0.5) * (FW / FH)); return (Math.floor(a / 0.2618) + fase) % 2 ? 0.34 : 0; });
      solRetro("#fcf4c4", "#fcd87c", "#fc9c4c", Math.round(FW * 0.5), yH - 2, Math.round(28 + pulso * 3));
      ciudad(yH, 0.7, "#e4505c", ["#fcf4c4", "#fc9c4c"]);
      rejilla("#e4505c", yH, "#18084c");
      rc("#fcd87c", 0, yH, FW, 1);
      palmeras(yH + 8, [[0.08, 66], [0.92, 72]], "#fcd87c");
      if (!RM) for (let i = 0; i < 26; i++) rc([PF.b, "#fcd87c", "#e4505c"][i % 3], (h(i) * FW + Math.sin(ts + i) * 6) % FW, (h(i + 0.5) * FH + ts * (20 + h(i + 0.2) * 30)) % FH, 2, 2);
      cine();
    },
  ];
  // Las barras del DJ: suben y bajan con la energía y el golpe
  const espectro12 = (i) => Math.max(0.05, (0.3 + energiaAhora * 0.5) * (0.4 + 0.6 * Math.abs(Math.sin(ts * (2 + i * 0.37) + i))) * (0.6 + pulso * 0.4));


  /* ---------- El gato: quieto cuando la canción calla, girando cuando suena ----------
     La hoja images/juego/gato-uia.png trae 6 cuadros de 64 px: 0 = parado, 1 a 5 = una vuelta.
     La vuelta dura más o menos según la energía de la canción, y el gato se pasea distinto en cada escenario. */
  const gatoHoja = new Image();
  let gatoOk = false, gatoPedido = false, gatoX = 0, gatoY = 0, gatoTam = 1, gatoQuieto = true, estela = [];
  // En sus vueltas el gato pasa por detrás de la terminal y por delante: gatoFrente va de 0 (detrás) a 1 (delante)
  let gatoFrente = 0;
  gatoHoja.onload = () => { gatoOk = true; };
  function pideGato() { if (!gatoPedido && R && R.gato) { gatoPedido = true; gatoHoja.src = R.gato; } }
  function pasoGato() {
    // En el GRIMORIO no hay gato: la cámara, en la calma, se va a la hoguera
    if (!UIA()) { gatoX = gx + W / 2; gatoY = gy + H * 0.6; return; }
    const cx = gx + W / 2, cy = gy + H * 0.5, sec = R.sec[secI], k = Math.min(1, Math.max(0, (ts - sec[0]) / (sec[1] - sec[0])));
    const base = Math.min(64, FW * 0.42, FH * 0.36);
    let x = cx, y = cy, tam = 1;
    switch (secI) {
      case 0: y = gy + H * 0.66; break;                                                                        // aparece bajo el aviso de error
      case 1: x = cx + Math.sin(ts * 0.8) * FW * 0.3; y = gy + H * 0.6 - base * 0.3; break;                  // camina por el horizonte, frente al sol
      case 2: x = cx + Math.sin(ts * 0.35) * FW * 0.33; y = cy + Math.sin(ts * 0.9) * FH * 0.13; break;       // flota
      case 3: tam = 0.45 + k * k * 1.1; x = cx + (RM ? 0 : Math.sin(ts * 31) * k * 2); y = cy + (RM ? 0 : Math.cos(ts * 27) * k * 2); break; // se acerca
      case 4: x = cx + Math.sin(ts * 1.1) * W * 0.3; y = gy + H * 0.32 - pulso * 3; tam = 1.05 + peligro * 0.05; break; // el jefe: arriba, creciendo con la pista
      case 5: x = FW * 0.3 + Math.sin(ts * 0.3) * FW * 0.16; y = FH * 0.3 + Math.cos(ts * 0.4) * 7; tam = 0.85; break; // pasea por el cielo
      case 6: x = cx + Math.sin(ts * 0.9) * FW * 0.3; y = cy + Math.sin(ts * 1.8) * FH * 0.17; break;          // dibuja un ocho
      case 7: x = cx + Math.cos(ts * 2.2) * FW * 0.27; y = cy + Math.sin(ts * 2.2) * FH * 0.22; tam = 1.1; break; // da vueltas alrededor del centro
      case 8: x = cx + Math.sin(ts * 0.25) * FW * 0.22; y = cy + Math.sin(ts * 0.5) * FH * 0.1; tam = 0.9; break; // se hunde despacio
      case 9: y = gy + H * 0.6; break;                                                                         // quieto mientras lo limpian
      default: break;
    }
    // La profundidad de la vuelta: un rato detrás (más chico) y un rato delante (más grande). En el arranque y la limpieza, siempre detrás
    const alFrente = secI > 0 && secI < R.sec.length - 1 && !gatoQuieto && Math.sin(ts * 0.85 + 1) > 0.25;
    gatoFrente += ((alFrente ? 1 : 0) - gatoFrente) * 0.08;
    tam *= 0.9 + gatoFrente * 0.28;
    const lento = 0.09;
    gatoX += (x - gatoX) * lento;
    gatoY += (y - gatoY) * lento;
    gatoTam += (tam - gatoTam) * 0.1;
    // Con la canción en silencio se queda parado; cuando vuelve, gira
    if (gatoQuieto ? energiaAhora > 0.31 : energiaAhora < 0.24) gatoQuieto = !gatoQuieto;
    if (secI === 7 && !RM && t % 3 === 0) { estela.push([gatoX, gatoY, giro]); if (estela.length > 5) estela.shift(); }
    else if (secI !== 7 && estela.length) estela = [];
  }
  function pintaGato(x, y, lado, vuelta, alfa, c = c2) {
    const dib = (f, a) => { c.globalAlpha = a; c.drawImage(gatoHoja, f * 64, 0, 64, 64, Math.round(x - lado / 2), Math.round(y - lado / 2), lado, lado); };
    if (vuelta == null) dib(0, alfa);
    else {
      const f = (((vuelta * 5) % 5) + 5) % 5, i = Math.floor(f);
      dib(1 + i, alfa);
      // En las vueltas lentas, un cuadro se funde con el siguiente para que no se vea a saltos
      if (vGiro < 1.3 && !RM) dib(1 + ((i + 1) % 5), alfa * (f - i));
    }
    c.globalAlpha = 1;
  }
  // Cuánto lleva la limpieza del final, de 0 a 1
  const limpieza = () => (secI === 9 ? Math.min(1, Math.max(0, (ts - R.sec[9][0] - 0.6) / (R.limpia - 0.6))) : 0);
  // En el arranque el gato todavía no se ve: solo se asoma un instante antes de tumbar la consola
  const gatoSeVe = () => secI > 0 || ts >= R.error || (!RM && R.asomos.some((a) => ts >= a && ts < a + 0.09));
  function dibujaGato() {
    if (!gatoOk || !gatoSeVe()) return;
    const base = Math.min(64, FW * 0.42, FH * 0.36), lado = Math.max(2, Math.round(base * gatoTam * (1 + pulso * 0.07)));
    c2.imageSmoothingEnabled = false;
    estela.forEach(([x, y, g], i) => pintaGato(x, y, lado, g, 0.1 + i * 0.07));
    const k = limpieza();
    if (k >= 1) return;
    if (k > 0) {
      // La limpieza lo borra de arriba hacia abajo: una línea verde lo recorre y suelta pixeles
      const arriba = gatoY - lado / 2, corte = arriba + lado * k;
      c2.save();
      c2.beginPath(); c2.rect(gatoX - lado, corte, lado * 2, lado * (1 - k) + 2); c2.clip();
      pintaGato(gatoX + (RM ? 0 : Math.round((h(Math.floor(ts * 12)) - 0.5) * 3)), gatoY, lado, gatoQuieto ? null : giro, 1);
      c2.restore();
      rc(col.V, gatoX - lado / 2 - 3, corte, lado + 6, 1);
      if (!RM) for (let i = 0; i < 16; i++) rc(i % 3 ? col.V : "#d9ffe6", gatoX - lado / 2 + h(i) * lado, corte - ((ts * 34 + h(i + 0.3) * 22) % 22), 1, 1);
      return;
    }
    pintaGato(gatoX, gatoY, lado, gatoQuieto ? null : giro, secI === 8 ? 0.8 : 1);
    if (secI === JEFE || secI === VUELO) corona(lado);
  }
  // La corona de rayos del gato cuando ataca: cinco picos de electricidad que no dejan de moverse
  function corona(lado) {
    const y0 = gatoY - lado * 0.42, ancho = lado * 0.5, tiembla = RM ? 0 : 1;
    let px = gatoX - ancho / 2, py = y0;
    for (let i = 1; i <= 10; i++) {
      const nx = gatoX - ancho / 2 + (ancho * i) / 10, pico = i % 2 ? 7 + (i === 5 ? 4 : 0) + pulso * 3 + Math.random() * 3 * tiembla : 0, ny = y0 - pico;
      linea(i % 4 < 2 ? "#fff36b" : "#ffffff", px, py, nx, ny);
      px = nx; py = ny;
    }
    rc("#fff36b", gatoX - ancho / 2, y0 + 1, ancho, 1);
    if (!RM) for (let i = 0; i < 4; i++) rc(i % 2 ? "#00f6ff" : "#ffffff", gatoX + (Math.random() - 0.5) * lado * 0.8, y0 - Math.random() * 14, 1, 1);
  }
  // Los rayos salen de la corona: una chispa fina mientras avisa y el rayo entero cuando cae
  function rayosDelGato() {
    if (!gatoOk || !ataques.length) return;
    const lado = Math.min(64, FW * 0.42, FH * 0.36) * gatoTam, ox = gatoX, oy = gatoY - lado * 0.5;
    for (const a of ataques) {
      const [dx, dy] = a.tipo === "v" ? [gx + a.c * LW + LW / 2, gy + 9] : a.tipo === "x" ? [gx + a.x, gy + 9] : [gx, gy + a.y];
      if (!a.hecho) { if (!RM && (t >> 1) % 2) rayo(ox, oy, dx, dy, "#ff2e7e", 1); }
      else { rayo(ox, oy, dx, dy, "#ff2e7e", 3); rayo(ox, oy, dx, dy, "#ffffff", 2); }
    }
  }

  // Todo lo que va en el lienzo de efectos: escenario, gato y, encima, destellos y apagón
  let fxLimpio = true;
  function dibujaFx() {
    const activo = modo === "ritmo" && estado !== "cargando" && secI >= 0;
    if (!activo) { if (!fxLimpio) { c2.clearRect(0, 0, FW, FH); fx.style.transform = ""; fxLimpio = true; } return; }
    fxLimpio = false;
    c2.globalAlpha = 1;
    if (estado === "cierre" && cierre) { dibujaCierreFx(); return; }
    // Tras el cierre, el escenario se queda apagado detrás de los resultados
    if (negro && estado === "fin") { fx.style.transform = ""; rc("#000000", 0, 0, FW, FH); if (destello > 0) { c2.globalAlpha = destello / 26; rc("#ffffff", 0, 0, FW, FH); c2.globalAlpha = 1; } return; }
    const esc = { cx: gx + W / 2, cy: gy + H * 0.5, suelo: gy + piso(), sec: R.sec[secI] };
    const cs = cajaS();
    if (cs < 1) {
      // El recuadro que se lleva todo: la escena entera se encoge hacia BIT dentro de un marco blanco, sobre negro
      const bx = gx + bit.x + 5, by2 = gy + bit.y + 6;
      rc("#000000", 0, 0, FW, FH);
      c2.save();
      c2.translate(bx * (1 - cs), by2 * (1 - cs)); c2.scale(cs, cs);
      c2.beginPath(); c2.rect(0, 0, FW, FH); c2.clip();
      ESCENAS_F[secI](esc);
      c2.restore();
      const x0 = bx * (1 - cs), y0 = by2 * (1 - cs), w0 = FW * cs, h0 = FH * cs;
      rc("#ffffff", x0, y0, w0, 1); rc("#ffffff", x0, y0 + h0 - 1, w0, 1); rc("#ffffff", x0, y0, 1, h0); rc("#ffffff", x0 + w0 - 1, y0, 1, h0);
    } else if (DM()) escenaDoom(esc); else (G() ? ESCENAS_G : FK() ? ESCENAS_F : ESCENAS)[secI](esc);
    if (UIA()) { dibujaGato(); rayosDelGato(); }
    // Con fiebre, una lluvia de destellos de colores por toda la pantalla
    if (fiebre > ts && !RM) for (let i = 0; i < 26; i++) rc(SANDE[(i + (t >> 2)) % SANDE.length], h(i) * FW, (h(i + 0.5) * FH + ts * (30 + h(i + 0.2) * 50)) % FH, 2, 2);
    // El destello al cambiar de escenario y el fogonazo del despegue
    if (!RM && cambio > 0 && !DM()) { c2.globalAlpha = (cambio / 26) * 0.55; rc("#ffffff", 0, 0, FW, FH); c2.globalAlpha = 1; }
    if (!RM && UIA() && secI === 3 && ts > 98.86) { c2.globalAlpha = Math.min(1, (ts - 98.86) / 1.96) * 0.5; rc("#ffffff", 0, 0, FW, FH); c2.globalAlpha = 1; }
    { const fg = estado === "jugando" ? fogonazo() : 0; if (fg > 0.01) { c2.globalAlpha = Math.min(1, fg); rc("#ffffff", 0, 0, FW, FH); c2.globalAlpha = 1; } }
    // Al fallar un bug: la imagen se rompe en tiras y se tiñe de rojo
    if (interferencia > 0 && !RM) { tiras(5, 10, t); c2.globalAlpha = (interferencia / 12) * 0.2; rc("#ff0030", 0, 0, FW, FH); c2.globalAlpha = 1; }
    // La cámara: el lienzo de efectos se acerca un poco hacia su foco; el recuadro del juego apenas late
    fx.style.transform = zoom > 1.001 ? `translate(${(focoX * (1 - zoom) * escala).toFixed(2)}px,${(focoY * (1 - zoom) * escala).toFixed(2)}px) scale(${zoom.toFixed(4)})` : "";
    // El apagón final: la pantalla entera se cierra en una línea y la línea en un punto
    const falta = R.dur - ts;
    if (G()) {
      // El grimorio se cierra: las dos tapas llegan al centro justo en el último golpe
      if (secI === R.sec.length - 1 && falta < 1.6) {
        const k = 1 - Math.max(0, falta) / 1.6, ancho = (FW / 2) * k * k;
        rc("#1a0f08", 0, 0, ancho, FH); rc("#1a0f08", FW - ancho, 0, ancho + 1, FH);
        rc("#ffd23b", ancho - 2, 0, 2, FH); rc("#ffd23b", FW - ancho, 0, 2, FH);
        for (let y = 6; y < FH; y += 14) { rc("#3a2414", ancho - 12, y, 6, 2); rc("#3a2414", FW - ancho + 6, y, 6, 2); }
      }
    } else if (UIA() && secI === R.sec.length - 1 && falta < 3) {
      const k = 1 - Math.max(0, falta) / 3, mitad = Math.max(1, (FH / 2) * (1 - k) * (1 - k));
      rc(col.F, 0, 0, FW, FH / 2 - mitad);
      rc(col.F, 0, FH / 2 + mitad, FW, FH / 2 - mitad + 1);
      if (k > 0.75) { const ancho = (FW / 2) * (1 - (k - 0.75) / 0.25); rc(col.F, 0, 0, FW / 2 - ancho, FH); rc(col.F, FW / 2 + ancho, 0, FW / 2 - ancho + 1, FH); }
    }
    // En pausa o al terminar, todo se oscurece para que se lea el mensaje
    if (estado !== "jugando") rc("rgba(0,0,0,.74)", 0, 0, FW, FH);
  }
  // El cierre en el lienzo de efectos: fogonazo, estrellas del color del nivel que salen del centro y titilan, y negro
  function dibujaCierreFx() {
    const k = cierre, T0 = k.t, cx = gx + W / 2, cy = gy + H * 0.5;
    fx.style.transform = "";
    rc("#000000", 0, 0, FW, FH);
    const cols = G() ? ["#c084ff", "#ffd23b", "#ffffff", "#7a3fc0"] : DM() ? ["#ff5a4a", "#7dff3c", "#ffd23b", "#ffffff"] : FK() ? ["#ff3fb4", "#00f6ff", "#ffd23b", "#ffffff"] : ["#00f6ff", "#ff3fb4", "#ffe14a", "#ffffff"];
    const p = Math.min(1, T0 / 150), sale = 1 - Math.pow(1 - p, 3), alfa = T0 < 80 ? 1 : Math.max(0, 1 - (T0 - 80) / 70);
    if (alfa > 0) {
      c2.globalAlpha = alfa;
      for (let i = 0; i < 110; i++) {
        if (!RM && h(i + (T0 >> 2) * 0.37) < 0.22) continue;
        const a = h(i) * TAU, d = (0.06 + h(i + 0.3) * 0.94) * Math.hypot(FW, FH) * 0.55 * sale, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.8, g = h(i + 0.6) < 0.2 ? 2 : 1, c = cols[i % 4];
        // Estrellas de cuatro puntas; en el nivel del gato, mezcladas con pixeles sueltos
        if (G() || i % 3 === 0) { rc(c, x - 2 * g, y, 5 * g, g); rc(c, x, y - 2 * g, g, 5 * g); } else rc(c, x, y, 2 * g, 2 * g);
      }
      c2.globalAlpha = 1;
    }
    if (T0 < 18) { c2.globalAlpha = 1 - T0 / 18; rc("#ffffff", 0, 0, FW, FH); c2.globalAlpha = 1; }
    if (k.fase === "fin") { c2.globalAlpha = Math.min(1, k.tt / 13); rc("#ffffff", 0, 0, FW, FH); c2.globalAlpha = 1; }
  }
  function bucle(ahora) {
    raf = requestAnimationFrame(bucle);
    acum += Math.min(100, ahora - (ult || ahora));
    ult = ahora;
    while (acum >= 1000 / 60) { paso(); acum -= 1000 / 60; }
    dibuja();
    dibujaFx();
  }

  /* ---------- 14. Teclado, puntero, abrir y cerrar ---------- */
  // Puntero: BIT brinca al carril que señala el mouse o el dedo; en el vuelo, lo sigue
  lienzo.addEventListener("pointerdown", (e) => { lienzo.setPointerCapture(e.pointerId); mueve(e); });
  lienzo.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse" || e.buttons) mueve(e); });
  function mueve(e) { const r = lienzo.getBoundingClientRect(); meta = ((e.clientX - r.left) / r.width) * W; metaY = ((e.clientY - r.top) / r.height) * H; }

  // Teclado: mientras el juego está abierto, todas las teclas son suyas
  function teclas(e) {
    if (el.hidden) return;
    const k = e.key.toLowerCase();
    const flechaIzq = k === "arrowleft" || k === "a", flechaDer = k === "arrowright" || k === "d";
    const flechaArr = k === "arrowup" || k === "w", flechaAba = k === "arrowdown" || k === "s";
    if (e.type === "keyup") {
      if (flechaIzq) izq = false;
      if (flechaDer) der = false;
      if (flechaIzq || flechaDer) { dirTecla = der ? 1 : izq ? -1 : 0; rep = 22; }
      if (flechaArr) arr = false;
      if (flechaAba) aba = false;
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    e.stopPropagation();
    e.preventDefault();
    // Durante la cuenta del final, cualquier tecla la salta
    if (enTrans) return;
    if (estado === "fin" && finModo === "conteo") { if (!e.repeat) pasaAResultado(); return; }
    if (flechaIzq || flechaDer) {
      // Cada toque es un salto inmediato; dejar la tecla apretada repite el salto
      if (e.repeat) return;
      if (flechaIzq) izq = true; else der = true;
      dirTecla = flechaIzq ? -1 : 1;
      // Un toque = un salto. Solo si se deja la tecla apretada un buen rato (un tercio de segundo) empieza a repetir, y despacio
      rep = 22;
      if ((estado === "jugando" || estado === "cierre") && !vuela && !lateral) { meta = null; saltaA(bit.c + dirTecla); }
      else if (estado === "titulo") { if (filaSel === 0 && R) cambiaCancion(dirTecla); else eligeDisco(selDisco + dirTecla); }
      else if (estado === "tramos") { bip(880, 0, 0.03, "square", 0.03); verTramos(selTramo + dirTecla); }
    }
    else if ((estado === "jugando" || estado === "cierre") && !vuela && k >= "1" && k <= "5" && k.length === 1) { meta = null; saltaA(+k - 1); }
    else if (estado === "titulo" && (flechaArr || flechaAba)) { if (R && filaSel !== (flechaArr ? 0 : 1)) { filaSel = flechaArr ? 0 : 1; bip(880, 0, 0.03, "square", 0.03); pintaTitulo(); } }
    else if (estado === "jugando" && lateral && (flechaArr || flechaAba)) { if (!e.repeat) { meta = null; metaY = null; saltaA(bit.c + (flechaArr ? -1 : 1)); } }
    else if (flechaArr) arr = true;
    else if (flechaAba) aba = true;
    else if (k === "escape") { if (estado === "jugando") pausa(true); else if (estado === "tramos") irA(titulo); else if (estado === "cierre") { cierre = null; finRitmo(); } else cerrar(false); }
    else if (k === "p") pausa(estado === "jugando");
    else if (estado === "titulo" && k >= "1" && k <= "4" && k.length === 1) { eligeDisco(+k - 1); jugar(); }
    else if (estado === "titulo" && (k === " " || k === "enter")) jugar();
    else if (estado === "titulo" && k === "n" && selDisco > 0 && cancionAbierta(cancionI)) irA(() => verTramos());
    else if (estado === "tramos" && (k === " " || k === "enter")) practicar();
    else if (estado === "tramos" && k === "m") irA(titulo);
    else if (estado === "pausa" && (k === " " || k === "enter")) pausa(false);
    else if ((estado === "pausa" || estado === "fin") && k === "m") irA(titulo);
    else if (estado === "fin" && (k === "r" || k === " " || k === "enter")) (modo !== "ritmo" ? empezar : muerto ? reintenta : practica != null ? () => practicar(practica) : empezarRitmo)();
    else if (estado === "fin" && finModo === "resultado" && k === "j" && res && res.peor >= 0) practicar(res.peor);
    else if (estado === "fin" && finModo === "practica" && k === "n") irA(() => verTramos(practica));
    else if (estado === "fin" && k === "y" && deApagado) cerrar(true);
  }
  window.addEventListener("keydown", teclas, true);
  window.addEventListener("keyup", teclas, true);
  const alSalir = () => pausa(true);
  document.addEventListener("visibilitychange", () => {
    if (el.hidden) return;
    if (document.hidden) pausa(true);
    // La música que sigue en la pantalla de resultados calla mientras la pestaña no se ve
    if (audio && estado === "fin" && finModo !== "crash" && R && R.sigue && practica == null) { if (document.hidden) audio.pause(); else audio.play().catch(() => {}); }
  });

  function abrir() {
    if (!el.hidden) return;
    deApagado = !!(P() && P().consola.apagada());
    volverA = document.activeElement;
    bloqueamos = !doc.classList.contains("lock");
    doc.classList.add("lock");
    el.hidden = false;
    leeCol();
    medir();
    hud();
    titulo();
    entraMsg();
    izq = der = arr = aba = false;
    dirTecla = 0;
    meta = null;
    ult = 0;
    raf = requestAnimationFrame(bucle);
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
    modo = "clasico";
    el.hidden = true;
    cancelAnimationFrame(raf);
    raf = 0;
    estado = "titulo";
    window.removeEventListener("resize", medir);
    window.removeEventListener("blur", alSalir);
    if (bloqueamos) doc.classList.remove("lock");
    if (encender && deApagado && P()) P().consola.encender();
    else if (volverA && volverA.isConnected) volverA.focus({ preventScroll: true });
  }

  window.Juego = { abrir, abierto: () => !el.hidden };
})();