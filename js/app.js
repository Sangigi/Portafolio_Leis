(() => {
  "use strict";
  const doc = document.documentElement;
  const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  // Sonidos (js/sonidos.js); si no cargó, todo funciona igual pero en silencio
  const SND = window.Sonidos || { play() {}, intro() {}, silenciar() {}, silencio: () => true, fondo: { iniciar() {}, pausar() {}, reanudar() {} } };

  // Modo claro por defecto; si eligieron el oscuro, este navegador lo recuerda
  let modo = "claro";
  try { if (localStorage.getItem("modo") === "oscuro") modo = "oscuro"; } catch (e) { /* sin almacenamiento: claro */ }
  if (modo === "oscuro") doc.setAttribute("data-modo", "oscuro");

  /* ---------- Grano del CRT: una textura de ruido generada al vuelo ---------- */
  try {
    const c = document.createElement("canvas");
    c.width = c.height = 160;
    const g = c.getContext("2d");
    const img = g.createImageData(160, 160);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = Math.random() < 0.65 ? 0 : 11;
    }
    g.putImageData(img, 0, 0);
    doc.style.setProperty("--noise", `url("${c.toDataURL()}")`);
  } catch (e) { /* sin grano, el resto funciona igual */ }

  /* ---------- Sprites pixel art (W blanco, Y amarillo, B azul, R rojo, D pantalla, G gris, A acento) ---------- */
  const SPRITES = {
    folder: [
      "AAAA.......",
      "AAAAAAAAAAA",
      "AWWWWWWWWWA",
      "AAAAAAAAAAA",
      "AAAAAAAAAAA",
      "AAAAAAAAAAA",
      "AAAAAAAAAAA",
    ],
    plus: [
      "...AA...",
      "...AA...",
      "...AA...",
      "AAAAAAAA",
      "AAAAAAAA",
      "...AA...",
      "...AA...",
      "...AA...",
    ],
    mail: [
      "WWWWWWWWWWW",
      "WBWWWWWWWBW",
      "WWBWWWWWBWW",
      "WWWBWWWBWWW",
      "WWWWBWBWWWW",
      "WWWWWBWWWWW",
      "WWWWWWWWWWW",
    ],
    arrow: [
      "..AAAA",
      "....AA",
      "...A.A",
      "..A..A",
      ".A....",
      "A.....",
    ],
    heart: [
      ".RR.RR.",
      "RWRRRRR",
      "RRRRRRR",
      ".RRRRR.",
      "..RRR..",
      "...R...",
    ],
  };
  // Monitor: pantalla de 20×13 dentro del marco ("." = fondo de la pantalla)
  const _ = "....................";
  const CARA = [
    _,
    ".B..................",
    _,
    ".....YY......YY.....",
    ".....YY......YY.....",
    ".....YY......YY.....",
    _,
    _,
    ".....R........R.....",
    "......RRRRRRRR......",
    _,
    _,
    _,
  ];
  const PARPADEO = CARA.slice();
  PARPADEO[3] = PARPADEO[4] = _;
  // K.O centrado y, debajo, la carita x.x centrada: la pantalla se desplaza del uno a la otra
  const KO_TXT = [
    _, _, _, _,
    "....R..R.....RR.....",
    "....R.R.....R..R....",
    "....RR......R..R....",
    "....R.R..RR.R..R....",
    "....R..R.RR..RR.....",
    _, _, _, _,
  ];
  const MUERTA = [
    _, _, _, _, _,
    "....W.W......W.W....",
    ".....W........W.....",
    "....W.W..WW..W.W....",
    _, _, _, _, _,
  ];
  // El reflejo azul de la pantalla no se mueve con el contenido
  const brillo = (screen) => screen.map((r, y) => (y === 1 ? r[0] + "B" + r.slice(2) : r));
  const monitor = (screen, leds) => [
    ".WWWWWWWWWWWWWWWWWWWWWW.",
    "WWWWWWWWWWWWWWWWWWWWWWWW",
    ...screen.map((r) => "WW" + r.replace(/\./g, "D") + "WW"),
    "WWWWWWWWWWWWWWWWWWWWWWWW",
    "WWWWWWWWWWWWWWWWW" + leds + "WW",
    ".WWWWWWWWWWWWWWWWWWWWWW.",
    ".........GGGGGG.........",
    "........GGGGGGGG........",
    ".....WWWWWWWWWWWWWW.....",
  ];
  SPRITES.monitor = monitor(CARA, "BWRWY");
  SPRITES.monitorBlink = monitor(PARPADEO, "BWRWY");
  const TIRA = KO_TXT.concat(MUERTA);
  const KO_PASOS = KO_TXT.length;
  for (let k = 0; k <= KO_PASOS; k++) SPRITES["ko" + k] = monitor(brillo(TIRA.slice(k, k + 13)), "GWRWG");

  // Íconos de tecnologías, a 3 px por pixel (K negro · O azul oscuro · C azul claro · Q amarillo oscuro · G/L grises)
  // PHP: el elefante, con "php" en el lomo
  SPRITES.php = [
    "...OOOO..OOOOOOOOO...",
    "..OCCCCO.OCCCCCCCCO..",
    ".OCBBBBBOOBBBBBBBBBO.",
    ".OCBBBBOBBBBBBBBBBBO.",
    "OCBWOBBOWWBBWBBBWWBOO",
    "OCBOOBBOWBWBWBBBWBWOO",
    "OBBBBBBOWWBBWWBBWWBO.",
    "OBBBBBBOWBBBWBWBWBBO.",
    "OBBBBOOBWBBBWBWBWBBO.",
    "OBOBBBBBBBBBBBBBBBBO.",
    "OBOOBBBBBBBBBBBBBBBO.",
    "OBO.OBB.OBB.OBB.OBB..",
    ".OC.OBB.OBB.OBB.OBB..",
    "....OBB.OBB.OBB.OBB..",
    "....CCC.CCC.CCC.CCC..",
  ];
  // JS: cuadro amarillo con volumen (sombra abajo a la izquierda) y brillo en la esquina
  SPRITES.js = (() => {
    const J = ["...K", "...K", "...K", "...K", "K..K", ".KK."];
    const S = [".KKK", "K...", ".KK.", "...K", "...K", "KKK."];
    const filas = [];
    for (let r = 0; r < 18; r++) {
      let f = "";
      for (let c = 0; c < 18; c++) {
        if (c >= 2 && r <= 15) {
          const enLetras = r >= 8 && r <= 13;
          const k = enLetras && ((c >= 7 && c <= 10 && J[r - 8][c - 7] === "K") || (c >= 12 && c <= 15 && S[r - 8][c - 12] === "K"));
          const brillo = (r === 1 && c >= 13 && c <= 16) || (c === 16 && r >= 1 && r <= 4);
          f += k ? "K" : brillo ? "W" : "Y";
        } else {
          f += c <= 15 && r >= 2 ? "Q" : ".";
        }
      }
      filas.push(f);
    }
    return filas;
  })();
  // SQL: base de datos de tres discos, con sombra gris a la derecha
  SPRITES.sql = [
    "....WWWWWWWWWW....",
    "..WWWWWWWWWWWWWW..",
    ".WWWWWWWWWWWWWWWW.",
    ".BWWWWWWWWWWWWWWB.",
    ".WBBWWWWWWWWWWBBW.",
    ".WWWBBBBBBBBBBWWW.",
    ".WWWWWWWWWWWWWWWW.",
    ".WWWWWWWWWWWWWWWW.",
    ".BWWWWWWWWWWWWWWB.",
    ".WBBWWWWWWWWWWBBW.",
    ".WWWBBBBBBBBBBWWW.",
    ".WWWWWWWWWWWWWWWW.",
    ".WWWWWWWWWWWWWWWW.",
    ".WWWWWWWWWWWWWWWW.",
    "..WWWWWWWWWWWWWW..",
    "....WWWWWWWWWW....",
  ].map((f) => [...f].map((ch, c) => (ch === "W" && c >= 13 ? "L" : ch)).join(""));
  // HTML y CSS: hoja con rótulo de color; el rótulo lleva el nombre y la hoja el símbolo
  (() => {
    const documento = (tinta, letras, simbolo) => {
      const filas = [];
      for (let r = 0; r < 20; r++) {
        let f = "";
        for (let c = 0; c < 19; c++) {
          let ch = ".";
          if (r <= 6) {
            const l = r >= 1 && r <= 5 ? letras[r - 1][c - 1] : undefined;
            ch = l && l !== "." ? "W" : tinta;
          } else if (c >= 2 && c <= 17) {
            const s = r >= 11 && r <= 15 ? simbolo[r - 11][c - 4] : undefined;
            ch = s && s !== "." ? tinta : "W";
          } else if (c === 18) {
            ch = "G";
          }
          f += ch;
        }
        filas.push(f);
      }
      return filas;
    };
    const une = (sep, ...piezas) => piezas[0].map((fila, i) => piezas.map((p) => p[i]).join(sep));
    const H = ["W.W", "W.W", "WWW", "W.W", "W.W"], T = ["WWW", ".W.", ".W.", ".W.", ".W."];
    const M = ["W...W", "WW.WW", "W.W.W", "W...W", "W...W"], L = ["W..", "W..", "W..", "W..", "WWW"];
    const C = ["WWW", "W..", "W..", "W..", "WWW"], S = ["WWW", "W..", "WWW", "..W", "WWW"];
    const menor = ["..T", ".T.", "T..", ".T.", "..T"], barra = ["..T", "..T", ".T.", "T..", "T.."], mayor = ["T..", ".T.", "..T", ".T.", "T.."];
    const abre = [".TT", ".T.", "T..", ".T.", ".TT"], cierra = ["TT.", ".T.", "..T", ".T.", "TT."];
    SPRITES.html = documento("R", une(".", H, T, M, L), une(".", menor, barra, mayor));
    SPRITES.css = documento("B", une(".", C, S, S).map((f) => "..." + f + "..."), une("...", abre, cierra).map((f) => "." + f + "."));
  })();
  // Git: rombo rojo con la rama en blanco
  SPRITES.git = (() => {
    const blanco = { 4: [5, 6], 5: [6, 7], 6: [7, 8], 7: [8, 9], 8: [8, 9, 10, 11], 9: [8, 9, 11, 12], 10: [8, 9, 12, 13, 14], 11: [8, 9, 12, 13, 14], 12: [8, 9, 12, 13, 14], 13: [7, 8, 9, 10], 14: [7, 8, 9, 10], 15: [7, 8, 9, 10] };
    const filas = [];
    for (let r = 0; r < 19; r++) {
      const d = Math.min(r, 18 - r);
      let f = "";
      for (let c = 0; c < 19; c++) f += c < 9 - d || c > 9 + d ? "." : (blanco[r] || []).includes(c) ? "W" : "R";
      filas.push(f);
    }
    return filas;
  })();
  // Corazón de color variable (A toma el color de --c)
  SPRITES.heartA = [".AA.AA.", "AWAAAAA", "AAAAAAA", ".AAAAA.", "..AAA..", "...A..."];
  SPRITES.sol = ["....Y....", ".Y.....Y.", "...YYY...", "..YYYYY..", "Y.YYYYY.Y", "..YYYYY..", "...YYY...", ".Y.....Y.", "....Y...."];
  // Bocina del botón de sonido: con ondas, y callada con una X roja
  SPRITES.bocina = ["...W.....", "..WW..B..", "WWWW...B.", "WWWW.B.B.", "WWWW.B.B.", "WWWW...B.", "..WW..B..", "...W....."];
  SPRITES.bocinaMuda = ["...W.....", "..WW.....", "WWWWR..R.", "WWWW.RR..", "WWWW.RR..", "WWWWR..R.", "..WW.....", "...W....."];
  SPRITES.luna = ["..WWWW...", ".WWW.....", "WWW......", "WWW......", "WWW......", "WWW......", ".WWW.....", "..WWWW..."];
  // Sobre del contacto: cerrado, y abierto con la solapa gris arriba
  SPRITES.sobre = [
    ".............",
    ".............",
    ".............",
    ".............",
    "WWWWWWWWWWWWW",
    "WBWWWWWWWWWBW",
    "WWBWWWWWWWBWW",
    "WWWBWWWWWBWWW",
    "WWWWBWWWBWWWW",
    "WWWWWBWBWWWWW",
    "WWWWWWBWWWWWW",
    "WWWWWWWWWWWWW",
  ];
  SPRITES.sobreAbierto = [
    "......L......",
    "....LLLLL....",
    "..LLLLLLLLL..",
    "LLLLLLLLLLLLL",
    "WWWWWWWWWWWWW",
    "WWWWWWBWWWWWW",
    "WWWWWBWBWWWWW",
    "WWWWBWWWBWWWW",
    "WWWBWWWWWBWWW",
    "WWBWWWWWWWBWW",
    "WBWWWWWWWWWBW",
    "WWWWWWWWWWWWW",
  ];
  // Gato de GitHub (T = tinta del modo: negro en claro, blanco en oscuro). El gato es el hueco.
  SPRITES.gato = [
    ".....TTTTTT.....",
    "...TTTTTTTTTT...",
    "..TT.TTTTTT.TT..",
    ".TTT..TTTT..TTT.",
    ".TTT........TTT.",
    "TTT..........TTT",
    "TTT..........TTT",
    "TTT..........TTT",
    "TTT..........TTT",
    "TTTT........TTTT",
    "TTT.TT....TTTTTT",
    ".TT..T....TTTTT.",
    ".TTT......TTTTT.",
    "..TTTT....TTTT..",
    "...TTT....TTT...",
    ".....T....T.....",
  ];
  SPRITES.gatoOrejas = SPRITES.gato.slice();
  SPRITES.gatoOrejas[2] = "..T.TTTTTTTT.T..";
  SPRITES.gatoOrejas[3] = ".TT..TTTTTT..TT.";
  SPRITES.gatoCola = SPRITES.gato.slice();
  SPRITES.gatoCola[10] = "TTTTTT....TTTTTT";
  SPRITES.gatoCola[11] = ".T...T....TTTTT.";
  // LinkedIn: cuadro azul con "in" en blanco
  SPRITES.linkedin = [
    ".BBBBBBBBBBBB.",
    "BBBBBBBBBBBBBB",
    "BBWWBBBBBBBBBB",
    "BBWWBBBBBBBBBB",
    "BBBBBBBBBBBBBB",
    "BBWWBWWWWWWBBB",
    "BBWWBWWBBBWWBB",
    "BBWWBWWBBBWWBB",
    "BBWWBWWBBBWWBB",
    "BBWWBWWBBBWWBB",
    "BBWWBWWBBBWWBB",
    "BBWWBWWBBBWWBB",
    "BBBBBBBBBBBBBB",
    ".BBBBBBBBBBBB.",
  ];
  // Gestos que BIT muestra sobre su cabeza
  SPRITES.emoteAlerta = ["RR", "RR", "RR", "RR", "..", "RR"];
  SPRITES.emoteDuda = [".YYY.", "Y...Y", "....Y", "..YY.", "..Y..", ".....", "..Y.."];
  SPRITES.emoteNota = ["..BBB", "..B.B", "..B..", "..B..", "BBB..", "BBB.."];
  SPRITES.emoteCorazon = [".RR.RR.", "RWRRRRR", "RRRRRRR", ".RRRRR.", "..RRR..", "...R..."];
  SPRITES.emoteEstrella = ["..Y..", ".YYY.", "YYYYY", ".YYY.", "..Y.."];
  SPRITES.emoteSilencio = ["WWWWWWWWW", "WKWWKWWKW", "WWWWWWWWW", ".WW......", ".W......."];
  // Docker: la ballena con los contenedores en la espalda
  SPRITES.docker = [
    "...............CCC...",
    "...............CCC...",
    "...............CCC...",
    "...........CCC.CCC...",
    "...........CCC.CCC...",
    "...........CCC.CCC.B.",
    "...CCC.CCC.CCC.CCC.BB",
    "...CCC.CCC.CCC.CCC.B.",
    "...CCC.CCC.CCC.CCC.B.",
    ".BBBBBBBBBBBBBBBBBBB.",
    "BBBWBBBBBBBBBBBBBBBB.",
    "BBBBBBBBBBBBBBBBBBB..",
    ".BBBBBBBBBBBBBBBBB...",
    "..BBBBBBBBBBBBBBB....",
    "....BBBBBBBBBB.......",
  ];
  // Vue.js: la V verde con la V oscura adentro
  SPRITES.vue = (() => {
    const filas = [];
    for (let r = 0; r < 17; r++) {
      let f = "";
      const borde = 10 - r * (10 / 17);
      for (let c = 0; c < 20; c++) {
        const d = Math.abs(c + 0.5 - 10);
        if (d <= borde && d >= borde - 4) f += "V";
        else if (d < borde - 4 && d >= borde - 7) f += "N";
        else f += ".";
      }
      filas.push(f);
    }
    return filas;
  })();
  // Laravel: cubo rojo (cara de arriba clara, lado derecho oscuro) con una L
  SPRITES.laravel = [
    ".......SS.......",
    ".....SSSSSS.....",
    "...SSSSSSSSSS...",
    ".SSSSSSSSSSSSSS.",
    "RSSSSSSSSSSSSSSZ",
    "RRRSSSSSSSSSSZZZ",
    "RRRRRSSSSSSZZZZZ",
    "RRWWRRRSSZZZZZZZ",
    "RRWWRRRRZZZZZZZZ",
    "RRWWRRRRZZZZZZZZ",
    "RRWWRRRRZZZZZZZZ",
    "RRWWRRRRZZZZZZZZ",
    "RRWWWWWRZZZZZZZZ",
    ".RRRRRRRZZZZZZZ.",
    "...RRRRRZZZZZ...",
    ".....RRRZZZ.....",
    ".......RZ.......",
  ];
  // BIT: un cursor de terminal con vida. ojos: -1 izquierda, 0 centro, 1 derecha · boca: n normal, s sonrisa, o sorpresa
  function bitSprite(ojos, cierra, boca) {
    const e = 2 + ojos;
    const arriba = [..."YYYYYYYYYY"], abajo = [..."YYYYYYYYYY"];
    if (!cierra) { arriba[e] = arriba[e + 4] = "W"; arriba[e + 1] = arriba[e + 5] = "K"; }
    abajo[e] = abajo[e + 1] = abajo[e + 4] = abajo[e + 5] = "K";
    const bocas = { n: ["YYYYKKYYYY", "YYYYYYYYYY"], s: ["YYYKYYKYYY", "YYYYKKYYYY"], o: ["YYYYKKYYYY", "YYYYKKYYYY"] };
    return [".YYYYYYYY.", "YYYYYYYYYY", "YYYYYYYYYY", arriba.join(""), abajo.join(""), "YYYYYYYYYY", ...bocas[boca], "QYYYYYYYYQ", ".QQQQQQQQ.", "..QQ..QQ..", ".QQQ..QQQ."];
  }
  SPRITES.bit = bitSprite(0, false, "n");

  // ---------- Logos de las categorías (A: Front-End, B: Back-End, C: Aprendiendo, D: Herramientas) ----------
  // Disquete de 3.5": cuerpo del color de la categoría (A), obturador metálico y etiqueta
  SPRITES.disquete = [
    "AAAALLLLLLLLAAA.",
    "AAAALLLLKLLLAAAA",
    "AAAALLLLKLLLAAAA",
    "AAAALLLLKLLLAAAA",
    "AAAALLLLLLLLAAAA",
    "AAAAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAAAA",
    "AAWWWWWWWWWWWWAA",
    "AAWWWWWWWWWWWWAA",
    "AAWGGGGGGGGGGWAA",
    "AAWWWWWWWWWWWWAA",
    "AAWGGGGGGGGWWWAA",
    "AAWWWWWWWWWWWWAA",
    "AAWWWWWWWWWWWWAA",
    "AAWWWWWWWWWWWWAA",
    "AAAAAAAAAAAAAAAA",
  ];
  // Tailwind CSS: dos olas cian
  SPRITES.tailwind = (() => {
    const ola = ["..UUUU......", ".UUUUUU.....", "UU....UU...U", "U......UUUUU", "........UUU."];
    const filas = Array.from({ length: 11 }, () => Array(18).fill("."));
    const pon = (x0, y0) => ola.forEach((f, y) => [...f].forEach((ch, x) => { if (ch !== ".") filas[y0 + y][x0 + x] = ch; }));
    pon(0, 0);
    pon(6, 6);
    return filas.map((f) => f.join(""));
  })();
  // Sass: círculo rosa con la S blanca
  SPRITES.sass = (() => {
    const bordes = [[5, 10], [3, 12], [2, 13], [1, 14], [1, 14], [0, 15], [0, 15], [0, 15], [0, 15], [0, 15], [0, 15], [1, 14], [1, 14], [2, 13], [3, 12], [5, 10]];
    const S = [".WWWW.", "WW..WW", "WW....", ".WWW..", "..WWW.", "....WW", "WW..WW", ".WWWW."];
    return bordes.map(([a, b], y) => {
      let f = "";
      for (let x = 0; x < 16; x++) {
        if (x < a || x > b) { f += "."; continue; }
        f += (S[y - 4] || "")[x - 5] === "W" ? "W" : "P";
      }
      return f;
    });
  })();
  // Figma: las cinco piezas de colores
  SPRITES.figma = (() => {
    const izq = ["..XXXX", ".XXXXX", "XXXXXX", "XXXXXX", ".XXXXX", "..XXXX"];
    const der = ["XXXX..", "XXXXX.", "XXXXXX", "XXXXXX", "XXXXX.", "XXXX.."];
    const circ = [".XXXX.", "XXXXXX", "XXXXXX", "XXXXXX", "XXXXXX", ".XXXX."];
    const gota = ["..XXXX", ".XXXXX", "XXXXXX", "XXXXXX", ".XXXX.", "..XX.."];
    const pinta = (forma, color) => forma.map((f) => f.replace(/X/g, color));
    const a = pinta(izq, "E"), b = pinta(der, "F"), c = pinta(izq, "H"), d = pinta(circ, "I"), e = pinta(gota, "J");
    return [...a.map((f, i) => f + b[i]), ...c.map((f, i) => f + d[i]), ...e.map((f) => f + "......")];
  })();
  // Apache: la pluma, de morado en la base a amarillo en la punta
  SPRITES.apache = (() => {
    const W = 14, H = 20, x0 = 1.5, y0 = 18.5, x1 = 12.5, y1 = 1.5;
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy);
    const filas = [];
    for (let r = 0; r < H; r++) {
      let f = "";
      for (let c = 0; c < W; c++) {
        const px = c + 0.5 - x0, py = r + 0.5 - y0;
        const t = (px * dx + py * dy) / (L * L);
        const dist = Math.abs(px * dy - py * dx) / L;
        const ancho = 2.8 * Math.pow(Math.sin(Math.PI * Math.min(Math.max(t, 0), 1)), 0.7);
        if (t < 0 || t > 1 || dist > ancho) { f += "."; continue; }
        f += t < 0.25 ? "H" : t < 0.5 ? "R" : t < 0.75 ? "X" : "Y";
      }
      filas.push(f);
    }
    return filas;
  })();
  // Node.js: hexágono verde con JS
  SPRITES.node = (() => {
    const bordes = [[7, 8], [5, 10], [3, 12], [1, 14], [0, 15], [0, 15], [0, 15], [0, 15], [0, 15], [0, 15], [0, 15], [0, 15], [0, 15], [0, 15], [1, 14], [3, 12], [5, 10], [7, 8]];
    const J = ["..W", "..W", "..W", "W.W", ".W."], S = ["WWW", "W..", "WWW", "..W", "WWW"];
    return bordes.map(([a, b], y) => {
      let f = "";
      for (let x = 0; x < 16; x++) {
        if (x < a || x > b) { f += "."; continue; }
        const j = (J[y - 6] || "")[x - 4], s = (S[y - 6] || "")[x - 9];
        f += j === "W" || s === "W" ? "W" : "M";
      }
      return f;
    });
  })();
  // Astro: el arco y la flama de colores debajo
  SPRITES.astro = (() => {
    const flama = { 12: 0.6, 13: 1.1, 14: 1.6, 15: 1.6, 16: 1.1, 17: 0.6 };
    const filas = [];
    for (let r = 0; r < 18; r++) {
      let f = "";
      for (let x = 0; x < 16; x++) {
        const cx = x + 0.5;
        let ch = ".";
        if (r <= 13) {
          const izq = 6 - r * 0.45, der = 10 + r * 0.45;
          if ((cx >= izq && cx <= izq + 3) || (cx <= der && cx >= der - 3)) ch = "W";
        }
        if (ch === "." && flama[r] !== undefined && Math.abs(cx - 8) <= flama[r]) ch = r <= 13 ? "H" : r <= 15 ? "P" : "X";
        f += ch;
      }
      filas.push(f);
    }
    return filas;
  })();
  // TypeScript: cuadro azul con volumen y TS en blanco
  SPRITES.ts = (() => {
    const T = ["WWWW", ".WW.", ".WW.", ".WW.", ".WW.", ".WW."];
    const S = [".WWW", "W...", ".WW.", "...W", "...W", "WWW."];
    const filas = [];
    for (let r = 0; r < 18; r++) {
      let f = "";
      for (let c = 0; c < 18; c++) {
        if (c >= 2 && r <= 15) {
          const enLetras = r >= 8 && r <= 13;
          const w = enLetras && ((c >= 6 && c <= 9 && T[r - 8][c - 6] === "W") || (c >= 11 && c <= 14 && S[r - 8][c - 11] === "W"));
          const brillo = (r === 1 && c >= 13 && c <= 16) || (c === 16 && r >= 1 && r <= 4);
          f += w ? "W" : brillo ? "C" : "B";
        } else {
          f += c <= 15 && r >= 2 ? "O" : ".";
        }
      }
      filas.push(f);
    }
    return filas;
  })();
  // Terminal: ventana con barra de título y el prompt >_
  SPRITES.terminal = [
    "GGGGGGGGGGGGGGGGGG",
    "GRRGYYGBBGGGGGGGGG",
    "GGGGGGGGGGGGGGGGGG",
    "GKKKKKKKKKKKKKKKKG",
    "GKKKKKKKKKKKKKKKKG",
    "GKKYKKKKKKKKKKKKKG",
    "GKKKYKKKKKKKKKKKKG",
    "GKKKKYKKKKKKKKKKKG",
    "GKKKYKKKKKKKKKKKKG",
    "GKKYKKKWWWWKKKKKKG",
    "GKKKKKKKKKKKKKKKKG",
    "GKKKKKKKKKKKKKKKKG",
    "GGGGGGGGGGGGGGGGGG",
  ];
  // VS Code: la barra azul de la derecha y los dos brazos en "<"
  SPRITES.vscode = (() => {
    const brazo = (x, y, ax, ay, bx, by) => {
      const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
      const t = ((x - ax) * dx + (y - ay) * dy) / (L * L);
      const d = Math.abs((x - ax) * dy - (y - ay) * dx) / L;
      return t >= 0 && t <= 1 && d <= 1.5;
    };
    const filas = [];
    for (let r = 0; r < 18; r++) {
      let f = "";
      for (let c = 0; c < 18; c++) {
        const x = c + 0.5, y = r + 0.5;
        if (c >= 13 && c <= 16) f += r === 0 || r === 17 ? "." : "C";
        else if (brazo(x, y, 14, 1.5, 3, 9)) f += "B";
        else if (brazo(x, y, 14, 16.5, 3, 9)) f += "O";
        else f += ".";
      }
      filas.push(f);
    }
    return filas;
  })();
  // npm: el rectángulo rojo con las letras en blanco
  SPRITES.npm = (() => {
    const n = ["WWWWW", "WW.WW", "WW.WW", "WW.WW", "WW.WW", "....."];
    const p = ["WWWWW", "WW.WW", "WW.WW", "WWWWW", "WW...", "WW..."];
    const m = ["WWWWWWW", "WW.W.WW", "WW.W.WW", "WW.W.WW", "WW.W.WW", "......."];
    const filas = [];
    for (let r = 0; r < 8; r++) {
      const i = r - 1;
      const fila = i >= 0 && i < 6 ? "." + n[i] + "." + p[i] + "." + m[i] + "." : ".".repeat(21);
      filas.push(fila.replace(/\./g, "R"));
    }
    return filas;
  })();

  function paint(el, name) {
    const rows = SPRITES[name || el.dataset.sprite];
    if (!rows) return;
    const h = rows.length, w = rows[0].length, px = +el.dataset.px || 4;
    let out = "";
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length;) {
        const c = row[x];
        if (c === ".") { x++; continue; }
        let n = 1;
        while (row[x + n] === c) n++;
        out += `<rect class="p${c}" x="${x}" y="${y}" width="${n}" height="1"/>`;
        x += n;
      }
    });
    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="${w * px}" height="${h * px}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${out}</svg>`;
  }
  $$("[data-sprite]").forEach((el) => paint(el));

  /* ---------- La PC del inicio: un clic la noquea (K.O y cara x.x), otro la revive ---------- */
  const pc = $("#pc"), pcSpr = $("#pc .spr"), pcArt = $(".hero-art");
  let ko = false;
  pc.addEventListener("click", () => {
    // Una vez noqueada se queda así hasta que se recarga la página
    if (ko) return;
    ko = true;
    SND.play("ko");
    pcArt.classList.add("ko");
    pc.setAttribute("aria-pressed", "true");
    pc.setAttribute("aria-disabled", "true");
    pc.setAttribute("aria-label", "Computadora noqueada");
    pc.removeAttribute("title");
    bitDice("¡Noqueaste a la PC! x_x", "o", 2800);

    // K.O se queda un momento, sube renglón por renglón y detrás aparece la carita x.x
    const PAUSA = 750, PASO = 55;
    paint(pcSpr, "ko0");
    if (RM) {
      setTimeout(() => paint(pcSpr, "ko" + KO_PASOS), PAUSA);
      return;
    }
    for (let k = 1; k <= KO_PASOS; k++) {
      setTimeout(() => paint(pcSpr, "ko" + k), PAUSA + k * PASO);
    }
    pc.classList.remove("hit");
    void pc.offsetWidth;
    pc.classList.add("hit");
  });
  pc.addEventListener("animationend", (e) => { if (e.target === pc) pc.classList.remove("hit"); });

  /* ---------- Galerías de los proyectos ---------- */
  // Para agregar capturas: pon en "src" la ruta de la imagen (por ejemplo "img/seguros-1.png")
  // y en "pie" una descripción corta. Mientras "src" esté vacío se muestra una carta de ajuste.
  const GALERIAS = {
    "p-seguros-lux": [
      { src: "", pie: "Panel de cotizaciones" },
      { src: "", pie: "Catálogo por empresa" },
      { src: "", pie: "Calendario de citas" },
    ],
    "p-portafolio": [
      { src: "", pie: "Intro de terminal" },
      { src: "", pie: "Habilidades y terminal" },
    ],
  };
  const dos = (n) => String(n).padStart(2, "0");
  const slideHTML = (img, i) => img.src
    ? `<figure class="slide"><img src="${img.src}" alt="${img.pie}" loading="lazy" draggable="false"><figcaption>${img.pie}</figcaption></figure>`
    : `<figure class="slide ph ph-${i % 3}"><figcaption><b>SIN IMAGEN ${dos(i + 1)}</b><span>${img.pie}</span></figcaption></figure>`;

  // Cada tarjeta con imágenes cambia <DIR> por <VER>: abre una pasarela dentro de la misma tarjeta
  const visores = {};
  $$(".card[id]").forEach((card) => {
    const imgs = GALERIAS[card.id];
    const tag = card.querySelector(".card-tag"), info = card.querySelector(".card-info");
    if (!imgs || !imgs.length || !tag || !info) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "card-btn";
    btn.textContent = "<VER>";
    btn.setAttribute("aria-expanded", "false");
    tag.replaceWith(btn);

    const view = document.createElement("div");
    view.className = "view";
    view.hidden = true;
    view.innerHTML =
      `<div class="stage" tabindex="0" role="group" aria-roledescription="carrusel" aria-label="Imágenes de ${card.querySelector("h3").textContent}">` +
        `<div class="track">${imgs.map(slideHTML).join("")}</div>` +
      `</div>` +
      `<div class="ctrl">` +
        `<button type="button" class="mini prev" aria-label="Imagen anterior">&lt;</button>` +
        `<span class="count" aria-live="polite"></span>` +
        `<button type="button" class="mini next" aria-label="Imagen siguiente">&gt;</button>` +
      `</div>`;
    info.after(view);

    const track = view.querySelector(".track"), count = view.querySelector(".count"), stage = view.querySelector(".stage");
    let i = 0;
    const go = (n) => {
      i = (n + imgs.length) % imgs.length;
      track.style.transform = `translateX(${-i * 100}%)`;
      count.textContent = `${dos(i + 1)}/${dos(imgs.length)}`;
    };
    const abrir = (on) => {
      view.hidden = !on;
      info.hidden = on;
      btn.textContent = on ? "<CERRAR>" : "<VER>";
      btn.setAttribute("aria-expanded", String(on));
      if (on && !RM) { card.classList.remove("zap"); void card.offsetWidth; card.classList.add("zap"); }
      if (on) bitDice(imgs.every((im) => !im.src) ? "Aquí irán las capturas. Por ahora, carta de ajuste." : "¡Mira esas capturas!", "s", 2600);
    };
    btn.addEventListener("click", () => abrir(view.hidden));
    view.querySelector(".prev").addEventListener("click", () => go(i - 1));
    view.querySelector(".next").addEventListener("click", () => go(i + 1));
    stage.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { go(i - 1); e.preventDefault(); }
      if (e.key === "ArrowRight") { go(i + 1); e.preventDefault(); }
    });
    let x0 = null;
    stage.addEventListener("pointerdown", (e) => { x0 = e.clientX; });
    stage.addEventListener("pointerup", (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
    });
    go(0);
    visores[card.id] = { abrir: (n) => { abrir(true); go(n); } };
  });

  /* ---------- Habilidades: ícono → búsqueda en la terminal → proyectos ---------- */
  const PROY = {
    lux: { nombre: "SEGUROS_LUX", id: "p-seguros-lux" },
    port: { nombre: "PORTAFOLIO.EXE", id: "p-portafolio" },
  };
  // Conteos tomados del repositorio de Seguros-Lux (noviembre de 2026).
  // Las que no tienen "hits" abren su ícono en grande con una descripción.
  const TECH = {
    html:     { n: "HTML",         q: "html",     c: "var(--rojo)",     s: "html",     hits: [["lux", "34 vistas", "Plantillas PHP del CRM"], ["port", "1 archivo", "Una sola página, sin frameworks"]] },
    css:      { n: "CSS",          q: "css",      c: "var(--azul)",     s: "css",      hits: [["lux", "7 archivos .css", "Tema del CRM, formularios y landing"], ["port", "1 archivo", "Filtro CRT y bordes pixelados"]] },
    js:       { n: "JavaScript",   q: "js",       c: "var(--amarillo)", s: "js",       tile: "JS", hits: [["lux", "23 archivos .js", "Calendario, clientes, cotizaciones y autos"], ["port", "1 archivo", "Intro, sprites y esta terminal"]] },
    vue:      { n: "Vue.js",       q: "vue",      c: "var(--verde)",    s: "vue",      tile: "VUE.JS", hits: [], desc: "Framework de JavaScript para interfaces reactivas." },
    tailwind: { n: "Tailwind CSS", q: "tailwind", c: "var(--azul)",     s: "tailwind", tile: "TAILWIND", hits: [], desc: "CSS con clases de utilidad, directo en el HTML." },
    sass:     { n: "Sass",         q: "sass",     c: "var(--rojo)",     s: "sass",     hits: [], desc: "CSS con variables, anidación y mixins." },
    figma:    { n: "Figma",        q: "figma",    c: "var(--amarillo)", s: "figma",    hits: [], desc: "Diseño de interfaces y prototipos." },
    php:      { n: "PHP",          q: "php",      c: "var(--azul)",     s: "php",      hits: [["lux", "145 archivos .php", "PHP 8.1 · Composer · PHPUnit · PHPMailer"]] },
    sql:      { n: "SQL",          q: "sql",      c: "var(--blanco)",   s: "sql",      hits: [["lux", "4 migraciones .sql", "Cola de correos, renovaciones y citas"]] },
    laravel:  { n: "Laravel",      q: "laravel",  c: "var(--rojo)",     s: "laravel",  hits: [], desc: "Framework de PHP para aplicaciones web." },
    apache:   { n: "Apache",       q: "apache",   c: "var(--amarillo)", s: "apache",   hits: [["lux", "1 archivo .htaccess", "Fuerza HTTPS y reescribe rutas en public/"]] },
    node:     { n: "Node.js",      q: "node",     c: "var(--verde)",    s: "node",     tile: "NODE.JS", hits: [], desc: "JavaScript fuera del navegador." },
    astro:    { n: "Astro",        q: "astro",    c: "var(--amarillo)", s: "astro",    hits: [], desc: "Framework para sitios rápidos y de contenido." },
    docker:   { n: "Docker",       q: "docker",   c: "var(--azul)",     s: "docker",   hits: [], desc: "Contenedores: la app corre igual en todos lados." },
    ts:       { n: "TypeScript",   q: "ts",       c: "var(--azul)",     s: "ts",       tile: "TYPESCRIPT", hits: [], desc: "JavaScript con tipos." },
    git:      { n: "Git",          q: "git",      c: "var(--rojo)",     s: "git",      hits: [["lux", "341 commits", "Historial desde mayo de 2026"]] },
    github:   { n: "GitHub",       q: "github",   c: "var(--blanco)",   s: "gato",     sinContorno: true, hits: [["lux", "CI con GitHub Actions", "composer audit y pruebas con PHPUnit"]] },
    terminal: { n: "Terminal",     q: "terminal", c: "var(--verde)",    s: "terminal", hits: [], desc: "Línea de comandos: aquí pasa todo." },
    vscode:   { n: "VS Code",      q: "vscode",   c: "var(--azul)",     s: "vscode",   hits: [], desc: "Editor de código." },
    npm:      { n: "npm",          q: "npm",      c: "var(--rojo)",     s: "npm",      hits: [], desc: "Gestor de paquetes de Node.js." },
  };
  // Cada categoría es un disquete en su propia unidad
  const CATEGORIAS = {
    front:   { u: "A:", ruta: "FRONTEND",     n: "FRONT-END",    c: "var(--amarillo)", techs: ["html", "css", "js", "vue", "tailwind", "sass", "figma"] },
    back:    { u: "B:", ruta: "BACKEND",      n: "BACK-END",     c: "var(--azul)",     techs: ["php", "sql", "laravel", "apache", "node"] },
    aprendo: { u: "C:", ruta: "APRENDIENDO",  n: "APRENDIENDO",  c: "var(--rojo)",     techs: ["astro", "docker", "ts"] },
    tools:   { u: "D:", ruta: "HERRAMIENTAS", n: "HERRAMIENTAS", c: "var(--blanco)",   techs: ["git", "github", "terminal", "vscode", "npm"] },
  };
  let catActual = "front", unidad = "A:";
  const catDe = (key) => Object.keys(CATEGORIAS).find((id) => CATEGORIAS[id].techs.includes(key));
  const techBtns = $$(".tech"), termWin = $("#term-win"), termOut = $("#term-out"), termSr = $("#term-sr");
  let runId = 0, fullDone = false;

  // Un resultado de la terminal: clic despliega sus imágenes debajo y el > gira a v
  function resultado(p, cuenta, uso) {
    const imgs = GALERIAS[p.id] || [];
    const r = document.createElement("div");
    r.className = "res";
    const thumbs = imgs.map((img, i) =>
      `<button type="button" class="thumb" data-i="${i}" aria-label="Ver imagen ${i + 1}: ${img.pie}">` +
        (img.src ? `<img src="${img.src}" alt="" loading="lazy">` : `<span class="ph ph-${i % 3}"></span>`) +
        `<b>${dos(i + 1)}</b>` +
      `</button>`).join("");
    r.innerHTML =
      `<button type="button" class="res-b" aria-expanded="false">` +
        `<span class="res-h"><span class="res-n">${p.nombre}\\</span><span class="res-c">${cuenta}</span></span>` +
        `<span class="res-d"><span class="car" aria-hidden="true">&gt;</span> ${uso}</span>` +
      `</button>` +
      `<div class="res-x" hidden>` +
        (imgs.length ? `<div class="thumbs">${thumbs}</div>` : `<span class="res-none">Sin imágenes todavía.</span>`) +
        `<a class="res-go" href="#${p.id}">IR AL PROYECTO</a>` +
      `</div>`;
    const b = r.querySelector(".res-b"), x = r.querySelector(".res-x");
    b.addEventListener("click", () => {
      const abrir = x.hidden;
      x.hidden = !abrir;
      b.setAttribute("aria-expanded", String(abrir));
      if (!abrir) return;
      if (!RM) { x.classList.remove("abre"); void x.offsetWidth; x.classList.add("abre"); }
      const top = r.offsetTop, bot = x.offsetTop + x.offsetHeight;
      if (bot > termOut.scrollTop + termOut.clientHeight) {
        termOut.scrollTo({ top: Math.min(top - 8, bot - termOut.clientHeight + 12), behavior: RM ? "auto" : "smooth" });
      }
    });
    r.querySelectorAll(".thumb").forEach((t) => t.addEventListener("click", () => {
      const v = visores[p.id];
      if (!v) return;
      v.abrir(+t.dataset.i);
      document.getElementById(p.id).scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "center" });
    }));
    return r;
  }

  function runTech(key, animate) {
    const T = TECH[key];
    if (!T) return;
    const my = ++runId;
    const alive = () => my === runId;
    // Después de ver la animación completa una vez, las siguientes van rápido
    const fast = animate && fullDone;
    const wait = (ms) => (animate ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());
    $$(".tech").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tech === key)));
    termWin.style.setProperty("--c", T.c);
    termOut.textContent = "";
    const line = (html, cls) => {
      const d = document.createElement("div");
      d.className = "ln" + (cls ? " " + cls : "");
      d.innerHTML = html;
      termOut.appendChild(d);
      termOut.scrollTop = termOut.scrollHeight;
      return d;
    };

    (async () => {
      // 0. La pantalla se limpia con un parpadeo
      if (animate) {
        termOut.classList.remove("cls");
        void termOut.offsetWidth;
        termOut.classList.add("cls");
        await wait(fast ? 90 : 180);
        if (!alive()) return;
      }
      // 1. Se teclea el comando
      const cmdLn = line('<span class="ps">' + unidad + '\\&gt;</span> <span class="typ"></span><span class="cur solid" aria-hidden="true"></span>');
      const typ = cmdLn.querySelector(".typ"), cur = cmdLn.querySelector(".cur");
      const cmd = `findstr /s /i "${T.q}" proyectos\\*`;
      if (animate && !fast) {
        for (let i = 1; i <= cmd.length; i++) {
          typ.textContent = cmd.slice(0, i);
          await wait(16 + Math.random() * 30);
          if (!alive()) return;
        }
      } else {
        typ.textContent = cmd;
      }
      cur.remove();
      await wait(fast ? 40 : 140);
      if (!alive()) return;
      // 2. Barra de carga por segmentos (las barras de antes, recicladas)
      const ld = line('Buscando<span class="lbar" aria-hidden="true">' + "<i></i>".repeat(10) + '</span><span class="pct">0%</span>', "dim");
      const segs = ld.querySelectorAll(".lbar i"), pct = ld.querySelector(".pct");
      for (let i = 0; i < 10; i++) {
        segs[i].classList.add("on");
        pct.textContent = (i + 1) * 10 + "%";
        await wait(fast ? 14 : 40 + Math.random() * 45);
        if (!alive()) return;
      }
      await wait(fast ? 50 : 160);
      if (!alive()) return;
      // 3. Resultados, uno por uno
      for (const [pid, cuenta, uso] of T.hits) {
        termOut.appendChild(resultado(PROY[pid], cuenta, uso));
        termOut.scrollTop = termOut.scrollHeight;
        await wait(fast ? 60 : 150);
        if (!alive()) return;
      }
      // Sin proyectos (herramientas o cosas que estoy aprendiendo): se abre su ícono en grande
      const catT = catDe(key);
      if (!T.hits.length) {
        line(`Sin proyectos que mostrar. Abriendo ${T.q}.ico`, "dim");
        const caja = document.createElement("div");
        caja.className = "ico-grande" + (animate && !RM ? " revela" : "");
        const filas = SPRITES[T.s];
        const spr = document.createElement("span");
        spr.className = "spr" + (T.sinContorno ? " sin-contorno" : "");
        spr.setAttribute("aria-hidden", "true");
        spr.dataset.px = Math.max(3, Math.floor(132 / Math.max(filas.length, filas[0].length)));
        paint(spr, T.s);
        const etiqueta = catT === "aprendo" ? "APRENDIENDO" : catT === "tools" ? "HERRAMIENTA" : "";
        const txt = document.createElement("div");
        txt.className = "ico-txt";
        txt.innerHTML = `<b>${T.n}</b><span>${T.desc || ""}</span>` + (etiqueta ? `<em>${etiqueta}</em>` : "");
        caja.append(spr, txt);
        termOut.appendChild(caja);
        termOut.scrollTop = termOut.scrollHeight;
        await wait(fast ? 150 : 650);
        if (!alive()) return;
      }
      const n = T.hits.length;
      const resumen = n ? `${n} ${n === 1 ? "proyecto" : "proyectos"} con ${T.n}.` : catT === "aprendo" ? "En aprendizaje: todavía sin proyectos." : catT === "tools" ? "Herramienta de trabajo: sin proyectos propios." : "Todavía sin proyectos publicados aquí.";
      line(resumen, "dim sum");
      line('<span class="ps">' + unidad + '\\&gt;</span> <span class="cur" aria-hidden="true"></span>');
      termSr.textContent = `${resumen} ${T.hits.map(([pid]) => PROY[pid].nombre).join(", ")}.`;
      if (animate && !fast) fullDone = true;
    })();
  }
  const FRASE_TECH = {
    html: "HTML: el esqueleto de todo.",
    css: "CSS: lo que me hace ver bien.",
    js: "JavaScript: aquí vivo yo, más o menos.",
    vue: "Vue.js: reactivo, como yo cuando me das clic.",
    tailwind: "Tailwind: clases y más clases, pero rapidísimo.",
    sass: "Sass: CSS con superpoderes.",
    figma: "Figma: aquí se dibuja antes de programar.",
    php: "PHP: 145 archivos en Seguros Lux. ¡Uf!",
    sql: "SQL: SELECT * FROM cosas_bonitas;",
    laravel: "Laravel: PHP con buenos modales.",
    apache: "Apache: el que sirve las páginas. Y la pluma.",
    node: "Node.js: JavaScript fuera del navegador.",
    astro: "Astro: despegando... ¡3, 2, 1!",
    docker: "Docker: todo cabe en un contenedor. Hasta yo.",
    ts: "TypeScript: JavaScript con cinturón de seguridad.",
    git: "Git: 341 commits y contando.",
    github: "GitHub: ahí vive el código. Y el gato.",
    terminal: "Terminal: mi casa. Literal.",
    vscode: "VS Code: el editor de confianza.",
    npm: "npm: instalando dependencias... otra vez.",
  };

  // Mosaicos de la categoría actual (se dibujan de nuevo al cambiar de disquete)
  const techsEl = $(".techs");
  function renderTiles(catId, animate) {
    const cat = CATEGORIAS[catId];
    techsEl.innerHTML = cat.techs.map((k, i) => {
      const T = TECH[k];
      return `<button class="tech" type="button" data-tech="${k}" aria-pressed="false" style="--c:${T.c};--i:${i}">` +
        `<span class="spr${T.sinContorno ? " sin-contorno" : ""}" data-sprite="${T.s}" data-px="3" aria-hidden="true"></span>` +
        `<span class="tech-n">${T.tile || T.n.toUpperCase()}</span></button>`;
    }).join("");
    techsEl.querySelectorAll("[data-sprite]").forEach((el) => paint(el));
    techsEl.classList.remove("carga");
    if (animate) { void techsEl.offsetWidth; techsEl.classList.add("carga"); }
  }

  // Al meter un disquete, la terminal cambia de unidad y lista lo que hay
  function runDir(catId, animate) {
    const cat = CATEGORIAS[catId];
    const my = ++runId;
    const alive = () => my === runId;
    const wait = (ms) => (animate ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());
    termWin.style.setProperty("--c", cat.c);
    $("#term-ruta").textContent = cat.u + "\\" + cat.ruta;
    termOut.textContent = "";
    const line = (html, cls) => {
      const d = document.createElement("div");
      d.className = "ln" + (cls ? " " + cls : "");
      d.innerHTML = html;
      termOut.appendChild(d);
      termOut.scrollTop = termOut.scrollHeight;
      return d;
    };
    (async () => {
      if (animate) {
        termOut.classList.remove("cls");
        void termOut.offsetWidth;
        termOut.classList.add("cls");
        await wait(160);
        if (!alive()) return;
      }
      line(`<span class="ps">${cat.u}\\&gt;</span> dir /w`);
      await wait(220);
      if (!alive()) return;
      line(` El volumen de la unidad ${cat.u[0]} es ${cat.n}`, "dim");
      line(cat.techs.map((k) => `[${(TECH[k].tile || TECH[k].n).toUpperCase()}]`).join("  "));
      await wait(160);
      if (!alive()) return;
      line(`${cat.techs.length} archivo(s). Elige uno para abrirlo.`, "dim sum");
      line(`<span class="ps">${cat.u}\\&gt;</span> <span class="cur" aria-hidden="true"></span>`);
      termSr.textContent = `Unidad ${cat.u} ${cat.n}: ${cat.techs.length} tecnologías.`;
    })();
  }

  const discos = $$(".disco");
  function cambiarCategoria(catId, animate) {
    if (!CATEGORIAS[catId]) return;
    catActual = catId;
    unidad = CATEGORIAS[catId].u;
    discos.forEach((d) => d.setAttribute("aria-selected", String(d.dataset.cat === catId)));
    const d = discos.find((x) => x.dataset.cat === catId);
    if (animate && d && !RM) { d.classList.remove("mete"); void d.offsetWidth; d.classList.add("mete"); }
    renderTiles(catId, animate && !RM);
    runDir(catId, animate);
  }
  discos.forEach((d) => d.addEventListener("click", () => {
    if (d.dataset.cat === catActual) return;
    cambiarCategoria(d.dataset.cat, !RM);
    const cat = CATEGORIAS[d.dataset.cat];
    bitDice(`Disquete ${cat.u} ${cat.n} insertado.`, "s", 2200, false, { salto: "brinco", emote: "Nota" });
  }));
  techsEl.addEventListener("click", (e) => {
    const b = e.target.closest(".tech");
    if (!b) return;
    runTech(b.dataset.tech, !RM);
    bitDice(FRASE_TECH[b.dataset.tech], "s", 2600);
  });
  // Al cargar: disquete A: (Front-End) con HTML abierto
  cambiarCategoria("front", false);
  runTech("html", false);

  /* ---------- Reloj y tiempo de sesión ---------- */
  const clk = $("#clk"), up = $("#up"), t0 = Date.now();
  const pad = (n) => String(n).padStart(2, "0");
  function tick() {
    const d = new Date();
    clk.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    const s = Math.floor((Date.now() - t0) / 1000);
    up.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
  }
  tick();
  setInterval(tick, 1000);

  /* ---------- Intro: \\connecting... durante 5 s ---------- */
  const INTRO_MS = 5000;
  const intro = $("#intro"), term = $("#intro .term"), txt = $("#intro .txt");
  const FULL = txt.dataset.text || "";
  const timers = [];
  const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };
  let introOn = true, introEspera = false;
  doc.classList.add("lock");

  // Los navegadores no dejan sonar nada hasta el primer clic o tecla. Por eso, con el sonido
  // encendido, la intro espera un "PRESIONA START"; con el sonido apagado arranca sola.
  function arrancaIntro() {
    introEspera = false;
    intro.classList.remove("espera");
    intro.setAttribute("aria-label", "Conectando");

    // Las letras (con su cursor) parpadean cada segundo mientras se escriben
    term.classList.add("blink");

    // inicio.mp3 al arrancar la intro; la música de fondo entra un segundo antes de que termine
    SND.intro(() => introOn);
    later(() => SND.fondo.iniciar(), INTRO_MS - 3700);

    // Tecleo con ritmo humano
    let t = 450;
    Array.from(FULL).forEach((ch, i) => {
      if (i > 0) t += 60 + Math.random() * 90;
      if (i > 0 && FULL[i - 1] === "\\" && ch !== "\\") t += 260;
      if (ch === "." && FULL[i - 1] !== ".") t += 160;
      later(() => { txt.textContent += ch; }, t);
    });
    if (!RM) flicker();
    later(endIntro, INTRO_MS);
  }
  // Clic o tecla en la intro: primero la enciende, después la salta
  function introToque() {
    if (introEspera) arrancaIntro();
    else endIntro();
  }

  // Altas y bajas del mismo negro: nunca pasa de un negro un poco más claro
  const NEGROS = ["var(--p-negro)", "var(--p-negro)", "var(--negro-medio)", "var(--negro-claro)"];
  function flicker() {
    if (!introOn) return;
    intro.style.backgroundColor = NEGROS[(Math.random() * NEGROS.length) | 0];
    later(flicker, 40 + Math.random() * (Math.random() < 0.25 ? 480 : 140));
  }

  function endIntro() {
    if (!introOn) return;
    introOn = false;
    timers.forEach(clearTimeout);
    // Si se saltó la intro, la música entra ya
    SND.fondo.iniciar();
    intro.hidden = true;
    doc.classList.remove("lock");
    if (RM) { boot(); return; }
    const p = $("#power");
    p.hidden = false;
    void p.offsetWidth;
    p.classList.add("go");
    document.body.classList.add("warming");
    setTimeout(() => {
      p.hidden = true;
      p.classList.remove("go");
      document.body.classList.remove("warming");
    }, 800);
    setTimeout(boot, 300);
  }
  intro.addEventListener("click", introToque);
  if (SND.silencio()) arrancaIntro();
  else {
    introEspera = true;
    intro.classList.add("espera");
    intro.setAttribute("aria-label", "Presiona cualquier tecla para encender");
  }

  /* ---------- Arranque de la página ---------- */
  let booted = false;
  function boot() {
    if (booted) return;
    booted = true;
    document.body.classList.add("booted");
    typeRole();
    bitArranca();
    if (!RM) { scheduleGlitch(); scheduleBlink(); }
  }

  function typeRole() {
    const typed = $(".role .typed"), ghost = $(".role .ghost"), cur = $(".role .cur");
    if (!typed || RM) return;
    const full = typed.textContent;
    let i = 0;
    cur.classList.add("solid");
    typed.textContent = "";
    ghost.textContent = full;
    (function step() {
      i++;
      typed.textContent = full.slice(0, i);
      ghost.textContent = full.slice(i);
      if (i < full.length) setTimeout(step, 28 + Math.random() * 55);
      else setTimeout(() => cur.classList.remove("solid"), 400);
    })();
  }

  function scheduleGlitch() {
    const n = $(".name");
    (function next() {
      setTimeout(() => {
        n.classList.add("glitch");
        setTimeout(() => n.classList.remove("glitch"), 400);
        next();
      }, 5000 + Math.random() * 7000);
    })();
  }

  function scheduleBlink() {
    const m = pcSpr;
    if (!m) return;
    (function next() {
      setTimeout(() => {
        if (ko) { next(); return; }
        paint(m, "monitorBlink");
        setTimeout(() => { if (!ko) paint(m, "monitor"); next(); }, 170);
      }, 2600 + Math.random() * 3200);
    })();
  }

  /* ---------- Navegación: sección activa y atajos 1-4 ---------- */
  // La sección marcada en el menú de arriba la calcula el espía de scroll (al final del script)

  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const id = a.getAttribute("href").slice(1);
    if (!id || (id !== "inicio" && !document.getElementById(id))) return;
    e.preventDefault();
    irA(id);
  });

  const order = ["sobre-mi", "proyectos", "habilidades", "contacto"];
  window.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (introOn) { e.preventDefault(); introToque(); return; }
    if (e.key === "0") { irA("inicio"); return; }
    const k = "1234".indexOf(e.key);
    if (k > -1 && e.key.length === 1) irA(order[k]);
  });

  /* ---------- Correo: corazón al pasar el mouse, lluvia de corazones al copiar ---------- */
  const copyBtn = $("#copy"), mail = $("#mail");
  function corazon(x, y, extra = {}) {
    const h = document.createElement("span");
    h.className = "heart-fx" + (extra.burst ? " burst" : "");
    h.style.left = x + "px";
    h.style.top = y + "px";
    h.style.setProperty("--c", extra.c || "var(--rojo)");
    if (extra.burst) {
      h.style.setProperty("--dx", extra.dx + "px");
      h.style.setProperty("--dy", extra.dy + "px");
    }
    h.dataset.px = extra.px || 3;
    paint(h, "heartA");
    h.addEventListener("animationend", () => h.remove());
    document.body.appendChild(h);
  }
  let copiadoT = 0;
  function copiarCorreo() {
    const value = mail.textContent.trim();
    const done = (label) => {
      // Aviso flotante sobre el correo: no empuja nada de la fila
      mail.dataset.estado = label === "COPIADO" ? "¡COPIADO!" : "SELECCIONADO";
      mail.classList.remove("copiado");
      void mail.offsetWidth;
      mail.classList.add("copiado");
      clearTimeout(copiadoT);
      copiadoT = setTimeout(() => mail.classList.remove("copiado"), 1600);
      bitDice(label === "COPIADO" ? "Correo copiado. ¡Escríbele!" : "Te lo dejé seleccionado para copiarlo.", "s", 2400, false, { salto: "doble", emote: "Corazon" });
    };
    const select = () => {
      const r = document.createRange();
      r.selectNodeContents(mail);
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
      done("SELECCIONADO");
    };
    try {
      navigator.clipboard.writeText(value).then(() => done("COPIADO"), select);
    } catch (e) { select(); }
  }
  // En el celular no hay botón: tocar el correo lo copia
  copyBtn.addEventListener("click", copiarCorreo);
  mail.addEventListener("click", copiarCorreo);

  // El sobre: se abre al pasar el mouse; con clic suelta un corazón y se queda abierto
  const sobre = $("#sobre"), sobreSpr = $("#sobre .spr");
  let sobreFijo = false;
  const sobreAbre = (on) => paint(sobreSpr, on ? "sobreAbierto" : "sobre");
  sobre.addEventListener("pointerenter", () => sobreAbre(true));
  sobre.addEventListener("focus", () => sobreAbre(true));
  sobre.addEventListener("pointerleave", () => { if (!sobreFijo) sobreAbre(false); });
  sobre.addEventListener("blur", () => { if (!sobreFijo) sobreAbre(false); });
  // Un corazón cada medio segundo como máximo
  let ultimoSobre = 0;
  sobre.addEventListener("click", () => {
    const ahora = Date.now();
    if (ahora - ultimoSobre < 500) return;
    ultimoSobre = ahora;
    const primera = !sobreFijo;
    sobreFijo = true;
    sobreAbre(true);
    sobre.setAttribute("aria-pressed", "true");
    const r = sobre.getBoundingClientRect();
    corazon(r.left + r.width / 2, r.top + r.height * 0.3, { c: "var(--rojo)", px: 3 });
    if (primera) bitDice("¡Un corazón para ti! El sobre se queda abierto.", "s", 2800, false, { emote: "Corazon" });
  });

  // El gato de GitHub mueve las orejas y luego la cola
  const gato = $("#gato"), gatoSpr = $("#gato .spr");
  let gatoT = [];
  gato.addEventListener("click", () => {
    gatoT.forEach(clearTimeout);
    const pasos = RM ? ["gato"] : ["gatoOrejas", "gato", "gatoOrejas", "gato", "gatoCola", "gato", "gatoCola", "gato"];
    gatoT = pasos.map((p, i) => setTimeout(() => paint(gatoSpr, p), i * 110));
    bitDice("¡Miau! ...digo, git push.", "s", 2200, false, { salto: "giro", emote: "Nota" });
  });

  // LinkedIn se cae y se queda tirado
  const linkedin = $("#linkedin");
  linkedin.addEventListener("click", () => {
    if (linkedin.classList.contains("tirado")) return;
    linkedin.classList.add("tirado");
    linkedin.setAttribute("aria-disabled", "true");
    bitDice("¡Se cayó LinkedIn! Ahí se queda, tirado.", "o", 2600);
  });

  /* ---------- Easter egg: la segunda E de LEONEL es una puerta con un alien detrás ---------- */
  const egg = $("#egg");
  try {
    // Alien original, dibujado en un canvas para que escale con la letra sin costuras
    const ALIEN = [
      "..g......g..",
      "...G....G...",
      "...GGGGGG...",
      "..GGGGGGGG..",
      ".GGGGGGGGGG.",
      ".GKKGGGGKKG.",
      "GKWKKGGKWKKG",
      "GKKKKGGKKKKG",
      ".GKKGGGGKKG.",
      ".GGGGGGGGGG.",
      "..GGGKKGGG..",
      "...GGGGGG...",
      "....GGGG....",
      "..GGGGGGGG..",
    ];
    const COLOR = { G: "#5BD15B", g: "#B4F5AA", K: "#030303", W: "#ECEBE4" };
    const c = document.createElement("canvas");
    c.width = 12;
    c.height = ALIEN.length;
    const g = c.getContext("2d");
    ALIEN.forEach((fila, y) => [...fila].forEach((ch, x) => {
      if (!COLOR[ch]) return;
      g.fillStyle = COLOR[ch];
      g.fillRect(x, y, 1, 1);
    }));
    egg.style.setProperty("--alien", `url("${c.toDataURL()}")`);
  } catch (e) { /* sin canvas, la puerta se abre a un cuarto vacío */ }
  let toques = 0, toquesT = 0;
  egg.addEventListener("click", () => {
    // Una vez abierta, la puerta ya no se cierra
    if (egg.classList.contains("abierta")) return;
    toques++;
    clearTimeout(toquesT);
    toquesT = setTimeout(() => { toques = 0; }, 2500);
    if (toques >= 5) {
      egg.classList.remove("toc");
      egg.classList.add("abierta");
      bitDice("¡Un alien! Como el de la cápsula de Stardew Valley.", "o", 3200, false, { salto: "doble", emote: "Alerta" });
      // El alien se asoma un momento y se desvanece hacia arriba
      setTimeout(() => {
        egg.classList.add("ido");
        setTimeout(() => bitDice("...y se fue. Nadie te va a creer.", "n", 3000, false, { emote: "Duda" }), 900);
      }, 2600);
      return;
    }
    if (!RM) { egg.classList.remove("toc"); void egg.offsetWidth; egg.classList.add("toc"); }
    if (toques === 3) bitDice("¿Escuchaste eso? Algo toca detrás de esa E...", "o", 2400);
  });

  /* ---------- exit: la consola se apaga y pregunta CONTINUE? Y/N ---------- */
  const exitB = $("#exit-b"), apagado = $("#apagado"), cont = $("#cont"), contN = $("#cont-n");
  let apagadoOn = false, cuentaT = 0;
  function apagar() {
    if (apagadoOn) return;
    apagadoOn = true;
    SND.play("exit");
    SND.fondo.pausar();
    bitMenu(false);
    doc.classList.add("lock");
    cont.hidden = true;
    cont.classList.remove("over");
    apagado.classList.remove("off", "fin");
    apagado.hidden = false;
    void apagado.offsetWidth;
    apagado.classList.add("off");
    // La imagen se cierra en una línea, la línea en un punto, y el punto se apaga
    setTimeout(() => {
      apagado.classList.add("fin");
      mostrarContinue();
    }, RM ? 0 : 1150);
  }
  function mostrarContinue() {
    let n = 9;
    contN.textContent = n;
    cont.hidden = false;
    clearInterval(cuentaT);
    cuentaT = setInterval(() => {
      n--;
      if (n < 0) { gameOver(); return; }
      contN.textContent = n;
    }, 1000);
    $("#cont-y").focus({ preventScroll: true });
  }
  function gameOver() {
    clearInterval(cuentaT);
    if (cont.classList.contains("over")) return;
    SND.play("terminar");
    cont.classList.add("over");
  }
  function encender() {
    if (!apagadoOn || !apagado.classList.contains("fin")) return;
    clearInterval(cuentaT);
    apagadoOn = false;
    SND.play("continuar");
    SND.fondo.reanudar();
    apagado.hidden = true;
    apagado.classList.remove("off", "fin");
    doc.classList.remove("lock");
    if (!RM) {
      const p = $("#power");
      p.hidden = false;
      p.classList.remove("go");
      void p.offsetWidth;
      p.classList.add("go");
      document.body.classList.add("warming");
      setTimeout(() => {
        p.hidden = true;
        p.classList.remove("go");
        document.body.classList.remove("warming");
      }, 800);
    }
    setTimeout(() => bitDice("¡¿Lo viste?! Se apagaron las luces de repente OwO", "o", 3800, false, { salto: "temblor", emote: "Alerta" }), RM ? 0 : 650);
    exitB.focus({ preventScroll: true });
  }
  exitB.addEventListener("click", apagar);
  apagado.addEventListener("click", (e) => {
    if (!apagado.classList.contains("fin")) return;
    if (e.target.closest("#cont-no")) { gameOver(); return; }
    encender();
  });
  // Con la consola apagada, el teclado solo responde a Y / N
  window.addEventListener("keydown", (e) => {
    if (!apagadoOn) return;
    e.stopPropagation();
    e.preventDefault();
    if (!apagado.classList.contains("fin")) return;
    const k = e.key.toLowerCase();
    if (k === "n" || k === "escape") gameOver();
    else if (k === "y" || k === "enter" || k === " ") encender();
  }, true);

  /* ---------- Tarjeta de presentación: se voltea con un clic ---------- */
  const tarjeta = $("#tarjeta");
  let volteos = 0;
  tarjeta.addEventListener("click", () => {
    const v = !tarjeta.classList.contains("volteada");
    tarjeta.classList.toggle("volteada", v);
    tarjeta.setAttribute("aria-pressed", String(v));
    tarjeta.querySelector(".tj-frente").setAttribute("aria-hidden", String(v));
    tarjeta.querySelector(".tj-dorso").setAttribute("aria-hidden", String(!v));
    if (++volteos === 1) bitDice("Por detrás también tiene lo suyo.", "s", 2400, false, { salto: "giro", emote: "Estrella" });
  });
  // La hora de la tarjeta es la misma de la barra de estado
  setInterval(() => { const c2 = $("#clk2"); if (c2) c2.textContent = clk.textContent; }, 1000);
  /* ---------- Modo claro / oscuro ---------- */
  const modoB = $("#modo-b"), modoIco = $("#modo-ico"), modoTxt = $("#modo-txt");
  function pintaModo() {
    const oscuro = modo === "oscuro";
    if (oscuro) doc.setAttribute("data-modo", "oscuro");
    else doc.removeAttribute("data-modo");
    paint(modoIco, oscuro ? "luna" : "sol");
    modoTxt.textContent = oscuro ? "OSCURO" : "CLARO";
    modoB.title = oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
  }
  pintaModo();
  modoB.addEventListener("click", () => {
    modo = modo === "oscuro" ? "claro" : "oscuro";
    SND.play("tema");
    try { localStorage.setItem("modo", modo); } catch (e) { /* no se recuerda, pero cambia igual */ }
    pintaModo();
    if (!RM) {
      const app = $("#app");
      app.classList.remove("cambio");
      void app.offsetWidth;
      app.classList.add("cambio");
    }
    bitDice(modo === "oscuro" ? "Modo oscuro: fósforo sobre negro." : "Modo claro: tinta sobre papel.", "s", 2000, false, { salto: "giro", emote: "Estrella" });
  });

  /* ---------- Sonido encendido / apagado (se recuerda en este navegador) ---------- */
  const sonidoB = $("#sonido-b"), sonidoIco = $("#sonido-ico"), sonidoTxt = $("#sonido-txt");
  function pintaSonido() {
    const mudo = SND.silencio();
    paint(sonidoIco, mudo ? "bocinaMuda" : "bocina");
    sonidoTxt.textContent = mudo ? "APAGADO" : "ENCENDIDO";
    sonidoB.title = mudo ? "Activar el sonido" : "Quitar el sonido";
    sonidoB.setAttribute("aria-pressed", String(mudo));
  }
  pintaSonido();
  sonidoB.addEventListener("click", () => {
    const mudo = !SND.silencio();
    SND.silenciar(mudo);
    pintaSonido();
    bitDice(mudo ? "Shhh... sonido apagado." : "¡Sonido de vuelta!", "s", 2000, false, { salto: mudo ? "temblor" : "brinco", emote: mudo ? "Silencio" : "Nota" });
  });

  /* ---------- BIT: el compañero que te acompaña y te lleva entre secciones ---------- */
  const buddy = $("#buddy"), buddyB = $("#buddy-b"), buddySpr = $("#buddy-b .spr"), buddySay = $("#buddy-say"), buddyMenu = $("#buddy-menu");
  const NOMBRES = { inicio: "inicio", "sobre-mi": "perfil", proyectos: "proyectos", habilidades: "habilidades", contacto: "contacto" };
  let bitOjos = 0, bitCierra = false, bitBoca = "n", bitClave = "", sayT = 0, bitListo = false;

  function bitPintar() {
    const clave = `${bitOjos}|${bitCierra}|${bitBoca}`;
    if (clave === bitClave) return;
    bitClave = clave;
    SPRITES.bitAhora = bitSprite(bitOjos, bitCierra, bitBoca);
    paint(buddySpr, "bitAhora");
  }
  let bitUltimo = 0, bitMudo = false;
  try { bitMudo = localStorage.getItem("bitMudo") === "1"; } catch (e) { /* habla por defecto */ }
  // gesto opcional { salto, emote }; si no viene, BIT reacciona según la boca
  function bitDice(texto, boca = "n", ms = 2400, aviso = false, gesto = {}) {
    if (!bitListo) return;
    if (bitMudo && aviso) return;
    // BIT solo suena cuando de verdad muestra el mensaje
    if (!bitMudo) SND.play("bit", true);
    if (!aviso) bitUltimo = Date.now();
    const salto = gesto.salto || (aviso ? "brinco" : boca === "o" ? "temblor" : boca === "s" ? null : "brinco");
    const emote = gesto.emote || (aviso ? null : boca === "o" ? "Alerta" : boca === "s" ? (Math.random() < 0.5 ? "Nota" : "Corazon") : null);
    bitSalta(salto);
    if (emote) bitEmote(emote);
    bitBoca = boca;
    bitPintar();
    clearTimeout(sayT);
    buddySay.textContent = bitMudo ? "" : texto;
    sayT = setTimeout(() => {
      buddySay.textContent = "";
      if (buddyMenu.hidden) { bitBoca = "n"; bitPintar(); }
    }, ms);
  }
  const SALTOS = ["brinco", "doble", "giro", "temblor"];
  let saltoT = 0;
  // Saltos variados: si no se pide uno, BIT elige al azar
  function bitSalta(tipo) {
    if (RM) return;
    const t = tipo || SALTOS[Math.floor(Math.random() * SALTOS.length)];
    buddy.classList.remove(...SALTOS);
    void buddy.offsetWidth;
    buddy.classList.add(t);
    clearTimeout(saltoT);
    saltoT = setTimeout(() => buddy.classList.remove(t), 900);
  }
  // Un gesto pixelado sobre la cabeza: Alerta, Duda, Nota, Corazon, Estrella o Silencio
  function bitEmote(cual) {
    if (!bitListo || !SPRITES["emote" + cual]) return;
    buddyB.querySelectorAll(".bit-emote").forEach((x) => x.remove());
    const e = document.createElement("span");
    e.className = "bit-emote";
    e.dataset.px = 3;
    e.setAttribute("aria-hidden", "true");
    paint(e, "emote" + cual);
    e.addEventListener("animationend", () => e.remove());
    buddyB.appendChild(e);
  }
  function bitMenu(abrir) {
    buddyMenu.hidden = !abrir;
    buddyB.setAttribute("aria-expanded", String(abrir));
    if (abrir) { clearTimeout(sayT); buddySay.textContent = ""; marcarSeccion(seccionActual()); }
    bitBoca = abrir ? "s" : "n";
    bitPintar();
  }
  // Quitar o devolver los mensajes de BIT (se recuerda en este navegador)
  function pintaMudo() {
    $("#bit-mudo-txt").textContent = bitMudo ? "MOSTRAR MENSAJES" : "QUITAR MENSAJES";
  }
  function alternarMudo() {
    bitMudo = !bitMudo;
    try { localStorage.setItem("bitMudo", bitMudo ? "1" : "0"); } catch (e) { /* no se recuerda, pero cambia igual */ }
    pintaMudo();
    bitMenu(false);
    if (bitMudo) {
      clearTimeout(sayT);
      buddySay.textContent = "";
      bitSalta("temblor");
      bitEmote("Silencio");
    } else {
      bitDice("Merequetengue, ya puedo hablar otra vez.", "s", 2400, false, { salto: "doble", emote: "Nota" });
    }
  }
  pintaMudo();
  // Lleva la página a una sección dejando su comando justo debajo del encabezado.
  // En celular el encabezado no se queda fijo, así que ahí no se descuenta su alto.
  function irA(id) {
    const comportamiento = RM ? "auto" : "smooth";
    if (id === "inicio") { window.scrollTo({ top: 0, behavior: comportamiento }); marcarSeccion("inicio"); return; }
    const el = document.getElementById(id);
    if (!el) return;
    const destino = el.classList.contains("sec") ? (el.querySelector(".cmd") || el) : el;
    const cabeza = $(".top");
    const fijo = getComputedStyle(cabeza).position === "sticky";
    const y = destino.getBoundingClientRect().top + window.scrollY - (fijo ? cabeza.offsetHeight : 0) - 20;
    window.scrollTo({ top: Math.max(0, y), behavior: comportamiento });
    marcarSeccion(id);
    if (el.classList.contains("card") && !RM) {
      el.classList.remove("destello");
      void el.offsetWidth;
      el.classList.add("destello");
      setTimeout(() => el.classList.remove("destello"), 1800);
    }
  }
  let clicsBit = [];
  buddyB.addEventListener("click", () => {
    bitMenu(buddyMenu.hidden);
    bitSalta();
    bitEmote(Math.random() < 0.5 ? "Nota" : "Corazon");
    const ahora = Date.now();
    clicsBit = clicsBit.filter((t) => ahora - t < 1500).concat(ahora);
    if (clicsBit.length >= 5) { clicsBit = []; bitMenu(false); bitDice("¡Oye! Me mareo... @_@", "o", 2400, false, { salto: "giro", emote: "Estrella" }); }
  });
  buddyMenu.addEventListener("click", (e) => {
    if (e.target.closest("button[data-accion]")) { alternarMudo(); return; }
    const b = e.target.closest("button[data-go]");
    if (!b) return;
    bitMenu(false);
    irA(b.dataset.go);
    bitDice(`C:\\> cd ${NOMBRES[b.dataset.go]}`, "s", 1600);
    buddyB.focus({ preventScroll: true });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !buddyMenu.hidden) { bitMenu(false); buddyB.focus({ preventScroll: true }); }
    if ((e.key === "m" || e.key === "M") && !e.metaKey && !e.ctrlKey && !e.altKey && bitListo) alternarMudo();
  });
  document.addEventListener("pointerdown", (e) => {
    if (!buddyMenu.hidden && !buddy.contains(e.target)) bitMenu(false);
  });

  // Los ojos de BIT siguen al puntero
  let rafOjos = 0, punteroX = 0;
  window.addEventListener("pointermove", (e) => {
    punteroX = e.clientX;
    if (rafOjos || !bitListo) return;
    rafOjos = requestAnimationFrame(() => {
      rafOjos = 0;
      const r = buddyB.getBoundingClientRect();
      const dx = punteroX - (r.left + r.width / 2);
      bitOjos = dx < -60 ? -1 : dx > 30 ? 1 : 0;
      bitPintar();
    });
  }, { passive: true });

  // Lo que dice BIT si te quedas un rato en una sección (hasta 3 frases por visita)
  const FRASES = {
    inicio: ["Psst... dale clic a la PC. No le pasa nada. Creo.", "Ese monitor parpadea cuando no lo ves.", "Oshiyeteo...Shiyeteo"],
    "sobre-mi": ["Leonel trabaja con datos todos los días. Yo, con píxeles.", "Esa lista está alineada a mano, punto por punto.", "ESTADO: disponible. Buena señal, ¿no?"],
    proyectos: ["Dale <VER> a una tarjeta para ver sus imágenes.", "La ranura 03 sigue libre... ¿será tu proyecto?", "Seguros Lux lleva 341 commits. Yo llevo cero."],
    habilidades: ["Elige un ícono y la terminal busca los proyectos.", "¿Viste al elefante de PHP? Somos amigos.", "Abre un resultado: el > se voltea y salen imágenes.", "Mete otro disquete: hay cuatro unidades, de A: a D:."],
    contacto: ["Puro piripitiflautica", "El gato de GitHub es cosquilludo. Dale clic.", "Escríbele, no muerde. El gato tampoco.", "Psst... ¿qué pasará si das clic en exit?", "La tarjeta de presentación se voltea. Pruébalo."],
  };
  let secActual = "inicio", charlaT = 0, charlas = 0, ultimaFrase = "";
  function programarCharla(id, espera) {
    clearTimeout(charlaT);
    charlaT = setTimeout(() => {
      if (secActual !== id || charlas >= 3) return;
      // Si el menú está abierto o BIT acaba de hablar, espera un poco más
      if (!buddyMenu.hidden || Date.now() - bitUltimo < 4000) { programarCharla(id, 3000); return; }
      const opciones = FRASES[id].filter((f) => f !== ultimaFrase);
      ultimaFrase = opciones[Math.floor(Math.random() * opciones.length)];
      bitDice(ultimaFrase, "s", 4200, true, { emote: "Nota" });
      charlas++;
      programarCharla(id, 20000);
    }, espera);
  }

  function bitArranca() {
    buddy.hidden = false;
    bitListo = true;
    bitPintar();
    if (!RM) buddy.classList.add("llega");
    setTimeout(() => bitDice(window.matchMedia("(min-width: 720px)").matches ? "Hola, soy BIT. Te acompaño mientras exploras." : "Hola, soy BIT. Dame clic y te llevo a cualquier sección.", "s", 4500), RM ? 0 : 700);
    secActual = seccionActual();
    programarCharla(secActual, 12000);
    if (!RM) (function parpadea() {
      setTimeout(() => {
        bitCierra = true;
        bitPintar();
        setTimeout(() => { bitCierra = false; bitPintar(); parpadea(); }, 140);
      }, 2500 + Math.random() * 3000);
    })();
    // La sección actual la vigila el espía de scroll (al final del script)
    espiaListo = true;
    revisarSeccion();
  }

  /* ---------- Sección actual: la marcan el menú de arriba y el de BIT, y BIT la anuncia ---------- */
  // Es la última sección cuyo comando ya pasó una línea en el tercio superior de la pantalla.
  // Al llegar al final de la página siempre es Contacto (la última sección no puede subir más).
  const SECCIONES_DOM = ["sobre-mi", "proyectos", "habilidades", "contacto"].map((id) => [id, document.getElementById(id)]).filter(([, el]) => el);
  function seccionActual() {
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) return "contacto";
    const linea = window.innerHeight * 0.35;
    let actual = "inicio";
    for (const [id, el] of SECCIONES_DOM) {
      const ref = el.querySelector(".cmd") || el;
      if (ref.getBoundingClientRect().top <= linea) actual = id;
    }
    return actual;
  }
  function marcarSeccion(id) {
    $$(".nav a").forEach((a) => {
      if (a.getAttribute("href") === "#" + id) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
    buddyMenu.querySelectorAll("button[data-go]").forEach((b) => {
      if (b.dataset.go === id) b.setAttribute("aria-current", "true");
      else b.removeAttribute("aria-current");
    });
  }
  let espiaListo = false, espiaEspera = 0, espiaT = 0;
  function revisarSeccion() {
    marcarSeccion(seccionActual());
    if (!espiaListo) return;
    clearTimeout(espiaEspera);
    espiaEspera = setTimeout(() => {
      const ahora = seccionActual();
      if (ahora === secActual) return;
      secActual = ahora;
      charlas = 0;
      programarCharla(ahora, 9000);
      if (buddyMenu.hidden && Date.now() - bitUltimo > 2500) bitDice(`C:\\> cd ${NOMBRES[ahora]}`, "n", 1600, true);
    }, 450);
  }
  window.addEventListener("scroll", () => {
    if (espiaT) return;
    espiaT = setTimeout(() => { espiaT = 0; revisarSeccion(); }, 80);
  }, { passive: true });
  window.addEventListener("scrollend", revisarSeccion);
  window.addEventListener("resize", revisarSeccion);
  revisarSeccion();
})();
