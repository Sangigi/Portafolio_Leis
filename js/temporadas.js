/* ---------- Temporadas: el portafolio se decora solo según la fecha ----------
   28 oct – 2 nov  Día de Muertos: BIT de calaverita, papel picado y pétalos de cempasúchil
   1 – 30 dic      Navidad: gorro para BIT y nieve pixelada
   31 dic – 1 ene  Año Nuevo: cuenta regresiva (los últimos 10 s a pantalla completa) y fuegos artificiales
   13 – 14 feb     San Valentín: pocos corazones por las orillas y BIT sonrojado
   Para verlas sin esperar la fecha: agrega ?evento=muertos (o navidad, anio, valentin) a la dirección. */
(() => {
  "use strict";
  const doc = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const T = (es, en) => (doc.lang === "en" ? en : es);
  const pig = (v) => getComputedStyle(doc).getPropertyValue(v).trim();
  const azar = (a, b) => a + Math.random() * (b - a);
  const pad = (n) => String(n).padStart(2, "0");
  const SND = window.Sonidos || { play() {} };
  const P = () => window.Portafolio || { bitDice() {}, bitEmote() {}, bitListo: () => false };

  /* ---------- ¿Qué toca hoy? ---------- */
  function eventoDe(d) {
    const md = (d.getMonth() + 1) * 100 + d.getDate();
    if (md >= 1028 && md <= 1102) return "muertos";
    if (md >= 1201 && md <= 1230) return "navidad";
    if (md === 1231 || md === 101) return "anio";
    if (md === 213 || md === 214) return "valentin";
    return null;
  }
  // Vista previa con ?evento=...: el reloj del módulo se adelanta a esa fecha
  let desfase = 0;
  const ahora = () => new Date(Date.now() + desfase);
  const pedido = new URLSearchParams(location.search).get("evento");
  const y = new Date().getFullYear();
  const PRUEBA = { muertos: new Date(y, 10, 1, 12), navidad: new Date(y, 11, 15, 12), anio: new Date(y, 11, 31, 23, 59, 35), valentin: new Date(y, 1, 14, 12) };
  if (PRUEBA[pedido]) desfase = PRUEBA[pedido] - Date.now();
  const evento = eventoDe(ahora());
  if (!evento) return;

  /* ---------- Sprites: los de BIT van como imagen de fondo (CSS), así no se borran cuando app.js lo repinta ---------- */
  const PIG = () => ({
    W: pig("--p-blanco"), Y: pig("--p-amarillo"), R: pig("--p-rojo"), B: pig("--p-azul"), G: pig("--p-gris"), K: pig("--p-negro"),
    X: pig("--p-naranja"), P: pig("--p-rosa"), H: pig("--p-morado"), V: pig("--p-verde"), Q: pig("--amarillo-oscuro"), L: pig("--gris-claro"),
  });
  function svgUri(rows) {
    const col = PIG(), h = rows.length, w = rows[0].length;
    let out = "";
    rows.forEach((row, j) => {
      for (let x = 0; x < w;) {
        const c = row[x];
        if (c === ".") { x++; continue; }
        let n = 1;
        while (row[x + n] === c) n++;
        out += `<rect fill="${col[c]}" x="${x}" y="${j}" width="${n}" height="1"/>`;
        x += n;
      }
    });
    return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${out}</svg>`)}")`;
  }
  const CORAZON = [".RR.RR.", "RWRRRRR", "RRRRRRR", ".RRRRR.", "..RRR..", "...R..."];
  const GORRO = ["..........WW.", ".......RRRWW.", ".....RRRRR...", "...RRRRRRR...", "..RRRRRRRRR..", ".WWWWWWWWWWW.", ".WWWWWWWWWWW."];
  const CORONA = [".X..PP..X.", "XYXPHHPXYX", ".X..PP..X."];
  const CARITA = ["....HH....", "..........", "..........", "..........", "P........P"];
  const RUBOR = ["P........P"];
  const BANDERA = ["AAAAAAAA", "A.AAAA.A", "AA.AA.AA", "AAA..AAA", "AA.AA.AA", "A.AAAA.A", "AAAAAAAA", "AA.AA.AA", "A.A..A.A"];
  // Papel picado: renglón 0 es el cordel; cada bandera mide 8 de ancho con 4 de aire entre una y otra
  const PICADO = (() => {
    const filas = [];
    for (let j = 0; j < 10; j++) {
      let f = "";
      for (const c of ["P", "X", "H", "V", "B", "Y"]) {
        for (let x = 0; x < 12; x++) {
          const bx = x - 2;
          f += j === 0 ? "G" : bx >= 0 && bx < 8 && BANDERA[j - 1][bx] === "A" ? c : ".";
        }
      }
      filas.push(f);
    }
    return filas;
  })();
  if (evento === "navidad" || evento === "anio") doc.style.setProperty("--ev-gorro", svgUri(GORRO));
  if (evento === "muertos") {
    doc.style.setProperty("--ev-corona", svgUri(CORONA));
    doc.style.setProperty("--ev-carita", svgUri(CARITA));
    doc.style.setProperty("--ev-picado", svgUri(PICADO));
    const banda = document.createElement("div");
    banda.className = "ev-picado";
    banda.setAttribute("aria-hidden", "true");
    $(".top").appendChild(banda);
  }
  if (evento === "valentin") doc.style.setProperty("--ev-rubor", svgUri(RUBOR));
  doc.dataset.evento = evento;

  /* ---------- Partículas pixeladas sobre la página (debajo de las líneas del CRT) ---------- */
  const motor = (() => {
    let lienzo = null, ctx = null, raf = 0, ult = 0, acum = 0, U = 3, dpr = 1, colores = null, modo = "";
    const sistemas = new Set(), cache = new Map();
    function ajusta() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      lienzo.width = Math.round(innerWidth * dpr);
      lienzo.height = Math.round(innerHeight * dpr);
      U = Math.max(2, Math.round(3 * dpr));
      cache.clear();
    }
    function leeColores() {
      modo = doc.dataset.modo || "claro";
      colores = { ...PIG(), C: pig("--azul-claro"), tinta: pig("--blanco") };
      cache.clear();
    }
    function pixel(x, yy, w, h, c) {
      ctx.fillStyle = colores[c] || c;
      ctx.fillRect(Math.round(x) * U, Math.round(yy) * U, w * U, h * U);
    }
    // Un sprite se dibuja UNA vez en un lienzo chiquito (con contorno en modo claro) y luego solo se copia
    function imagen(rows, mapa = {}) {
      const k = rows.join("/") + JSON.stringify(mapa);
      let c = cache.get(k);
      if (c) return c;
      const o = modo !== "oscuro" ? Math.max(1, Math.round(dpr * 1.5)) : 0;
      c = document.createElement("canvas");
      c.width = rows[0].length * U + o * 2;
      c.height = rows.length * U + o * 2;
      const g = c.getContext("2d");
      if (o) { g.fillStyle = colores.tinta; rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== ".") g.fillRect(i * U, j * U, U + o * 2, U + o * 2); }); }
      rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== ".") { g.fillStyle = colores[mapa[r[i]] || r[i]]; g.fillRect(o + i * U, o + j * U, U, U); } });
      c.o = o;
      cache.set(k, c);
      return c;
    }
    // x, y en px de pantalla, redondeados al pixel físico: se mueve suave sin verse borroso
    function img(c, x, yy, alfa = 1) {
      ctx.globalAlpha = alfa;
      ctx.drawImage(c, Math.round(x * dpr) - c.o, Math.round(yy * dpr) - c.o);
      ctx.globalAlpha = 1;
    }
    function bucle(t) {
      raf = requestAnimationFrame(bucle);
      const dt = Math.min(100, t - (ult || t));
      ult = t;
      // Nieve, pétalos y fuegos van a saltitos (20 pasos por segundo, como consola vieja); los corazones, en cada cuadro
      acum += dt;
      const tic = acum >= 50;
      if (tic) acum = 0;
      let suave = false;
      for (const s of sistemas) if (s.suave) { suave = true; break; }
      if (!tic && !suave) return;
      if ((doc.dataset.modo || "claro") !== modo) leeColores();
      const W = lienzo.width / U, H = lienzo.height / U;
      ctx.clearRect(0, 0, lienzo.width, lienzo.height);
      const api = { pixel, imagen, img, W, H, claro: modo !== "oscuro" };
      for (const s of sistemas) {
        if (s.suave) s.paso(dt / 1000);
        else if (tic) s.paso(W, H);
        s.dibuja(api);
      }
    }
    return {
      agrega(s) {
        if (RM) return;
        if (!lienzo) {
          lienzo = document.createElement("canvas");
          lienzo.className = "ev-lienzo";
          lienzo.setAttribute("aria-hidden", "true");
          document.body.appendChild(lienzo);
          ctx = lienzo.getContext("2d");
          ajusta();
          leeColores();
          window.addEventListener("resize", ajusta);
        }
        s.inicia(lienzo.width / U, lienzo.height / U);
        sistemas.add(s);
        if (!raf) { ult = 0; raf = requestAnimationFrame(bucle); }
      },
      quita(s) {
        sistemas.delete(s);
        if (!sistemas.size && raf) { cancelAnimationFrame(raf); raf = 0; ctx.clearRect(0, 0, lienzo.width, lienzo.height); }
      },
    };
  })();

  const nieve = () => {
    let copos = [];
    return {
      inicia(W, H) {
        const n = Math.min(160, Math.round((W * H) / 900));
        copos = Array.from({ length: n }, () => ({ x: azar(0, W), y: azar(-H, H), v: azar(0.25, 0.9), s: Math.random() < 0.25 ? 2 : 1, f: azar(0, 6) }));
      },
      paso(W, H) {
        for (const c of copos) {
          c.y += c.v;
          c.f += 0.08;
          c.x += Math.sin(c.f) * 0.3;
          if (c.y > H) { c.y = -2; c.x = azar(0, W); }
        }
      },
      // En papel (modo claro) la nieve es azul pálido; en fósforo, blanca
      dibuja({ pixel, claro }) { for (const c of copos) pixel(c.x, c.y, c.s, c.s, claro ? "C" : "W"); },
    };
  };
  const petalos = () => {
    let ps = [], k = 0;
    return {
      inicia(W, H) {
        const n = Math.min(70, Math.round((W * H) / 2400));
        ps = Array.from({ length: n }, () => ({ x: azar(0, W), y: azar(-H, H), v: azar(0.2, 0.5), f: azar(0, 6), c: Math.random() < 0.7 ? "X" : Math.random() < 0.6 ? "Y" : "P" }));
      },
      paso(W, H) {
        k++;
        for (const p of ps) {
          p.y += p.v;
          p.f += 0.12;
          p.x += Math.sin(p.f) * 0.6;
          if (p.y > H) { p.y = -2; p.x = azar(0, W); }
        }
      },
      // Cada pétalo voltea entre acostado y parado: así parece que revolotea
      dibuja({ pixel }) { ps.forEach((p, i) => { const parado = ((k >> 2) + i) % 2; pixel(p.x, p.y, parado ? 1 : 2, parado ? 2 : 1, p.c); }); },
    };
  };
  // San Valentín: pocos corazones, lentos y por las orillas, para acompañar sin tapar el contenido
  const corazones = () => {
    let cs = [];
    const cuantos = () => (innerWidth >= 1100 ? 6 : innerWidth >= 700 ? 4 : 3);
    function nace(primera) {
      // Si sobra margen a los lados (pantallas anchas), suben por ahí; si no, por cualquier lado
      const margen = (innerWidth - 1120) / 2;
      const x = margen > 70
        ? (Math.random() < 0.5 ? azar(8, margen - 32) : azar(innerWidth - margen + 8, innerWidth - 32))
        : azar(8, innerWidth - 32);
      return {
        x, y: primera ? azar(innerHeight * 0.25, innerHeight) : innerHeight + azar(20, innerHeight * 0.7),
        v: azar(22, 36), f: azar(0, 6), fv: azar(0.7, 1.2), amp: azar(5, 10), c: Math.random() < 0.6 ? "R" : "P",
      };
    }
    return {
      suave: true,
      inicia() { cs = Array.from({ length: cuantos() }, () => nace(true)); },
      paso(dt) {
        cs.forEach((c, i) => {
          c.y -= c.v * dt;
          c.f += c.fv * dt;
          if (c.y < -30) cs[i] = nace(false);
        });
      },
      dibuja({ imagen, img }) {
        const H = innerHeight;
        for (const c of cs) {
          // Entran abajo y se desvanecen arriba, sin parpadeos
          const a = Math.min(1, (H - c.y) / (H * 0.12), c.y / (H * 0.4));
          if (a > 0) img(imagen(CORAZON, { R: c.c }), c.x + Math.sin(c.f) * c.amp, c.y, a * 0.85);
        }
      },
    };
  };
  const fuegos = () => {
    let chispas = [], k = 0;
    const COL = ["Y", "R", "B", "W", "V", "P", "X"];
    function estalla(W, H) {
      const x = azar(W * 0.12, W * 0.88), yy = azar(H * 0.1, H * 0.5), c = COL[(Math.random() * COL.length) | 0], n = 36;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, v = azar(2, 4.2);
        chispas.push({ x, y: yy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: Math.round(azar(18, 30)), c });
      }
    }
    return {
      inicia(W, H) { chispas = []; k = 0; estalla(W, H); estalla(W, H); },
      paso(W, H) {
        if (++k % 9 === 0) estalla(W, H);
        for (const p of chispas) { p.x += p.vx; p.y += p.vy; p.vx *= 0.9; p.vy = p.vy * 0.9 + 0.09; p.vida--; }
        chispas = chispas.filter((p) => p.vida > 0);
      },
      // Chispas de 2×2 que se encogen y parpadean antes de apagarse
      dibuja({ pixel }) { for (const p of chispas) if (p.vida > 6 || p.vida % 2) { const s = p.vida > 12 ? 2 : 1; pixel(p.x, p.y, s, s, p.c); } },
    };
  };

  /* ---------- Lo que dice BIT (cuando ya llegó a la pantalla) ---------- */
  function cuandoBit(fn) {
    if (P().bitListo()) { setTimeout(fn, 800); return; }
    // BIT saluda primero; el comentario de temporada va después
    document.addEventListener("bit:listo", () => setTimeout(fn, 5600), { once: true });
  }
  const bitDice = (texto, salto, emote) => P().bitDice(texto, "s", 3800, true, { salto, emote });

  /* ---------- Etiqueta en la barra de estado ---------- */
  const NOMBRE = { muertos: ["DÍA DE MUERTOS", "DAY OF THE DEAD"], navidad: ["NAVIDAD", "HOLIDAYS"], valentin: ["SAN VALENTÍN", "VALENTINE'S DAY"] };
  const chip = document.createElement("span");
  chip.className = "ev-chip";
  const statusIn = $(".status-in");
  if (statusIn) statusIn.appendChild(chip);
  const pintaChip = (etq, valor) => {
    chip.replaceChildren(document.createTextNode(etq + " "), Object.assign(document.createElement("b"), { textContent: valor }));
  };

  if (evento === "navidad") {
    pintaChip(T("TEMPORADA", "SEASON"), T(...NOMBRE.navidad));
    motor.agrega(nieve());
    cuandoBit(() => bitDice(T("¡Jo, jo, jo! Me prestaron el gorro.", "Ho, ho, ho! They lent me the hat."), "doble", "Estrella"));
  } else if (evento === "muertos") {
    pintaChip(T("TEMPORADA", "SEASON"), T(...NOMBRE.muertos));
    motor.agrega(petalos());
    cuandoBit(() => bitDice(T("Hoy me pinté de calaverita. ¿Qué tal me veo?", "I'm a sugar skull today. How do I look?"), "giro", "Nota"));
  } else if (evento === "valentin") {
    pintaChip(T("TEMPORADA", "SEASON"), T(...NOMBRE.valentin));
    motor.agrega(corazones());
    cuandoBit(() => {
      bitDice(T("Hoy reparto corazones. Toma uno.", "Handing out hearts today. Have one."), "brinco", "Corazon");
      // De vez en cuando, otro corazón sobre su cabeza (sin saturar)
      setInterval(() => { if (P().bitListo() && !document.hidden) P().bitEmote("Corazon"); }, 15000);
    });
  } else if (evento === "anio") {
    anioNuevo();
  }

  /* ---------- Año Nuevo: cuenta regresiva y el gran momento ---------- */
  function anioNuevo() {
    motor.agrega(nieve());
    const gran = document.createElement("div");
    gran.className = "ev-gran";
    gran.hidden = true;
    gran.setAttribute("role", "status");
    gran.innerHTML = `<p class="ev-gran-t"></p><p class="ev-gran-n"></p><p class="ev-gran-s"></p>`;
    document.body.appendChild(gran);
    let cerrado = false, fiesta = false;
    gran.addEventListener("click", () => { gran.hidden = true; cerrado = true; });
    const [gt, gn, gs] = gran.querySelectorAll("p");
    function tic() {
      const d = ahora();
      if (d.getMonth() === 0) {
        pintaChip(T("FELIZ", "HAPPY"), String(d.getFullYear()));
        if (!fiesta) celebra(d.getFullYear(), d.getHours() === 0 && d.getMinutes() < 1);
        return;
      }
      const s = Math.max(0, Math.ceil((new Date(d.getFullYear() + 1, 0, 1) - d) / 1000));
      pintaChip(T("AÑO NUEVO EN", "NEW YEAR IN"), `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`);
      // Los últimos 10 segundos, a pantalla completa (como el CONTINUE?)
      if (s <= 10 && s > 0 && !cerrado) {
        gran.hidden = false;
        gran.classList.remove("feliz");
        gt.textContent = T(`${d.getFullYear() + 1} EN`, `${d.getFullYear() + 1} IN`);
        gn.textContent = s;
        gs.textContent = T("clic para cerrar", "click to close");
      }
    }
    // justoAhora: si la página ya estaba abierta a la medianoche; si llegan el 1 de enero, solo el saludo
    function celebra(anio, justoAhora) {
      fiesta = true;
      if (!justoAhora) {
        cuandoBit(() => bitDice(T(`¡Feliz ${anio}! Que compile a la primera.`, `Happy ${anio}! May it compile on the first try.`), "doble", "Estrella"));
        return;
      }
      SND.play("continuar");
      gran.hidden = cerrado;
      gran.classList.add("feliz");
      gt.textContent = "";
      gn.textContent = T(`¡FELIZ ${anio}!`, `HAPPY ${anio}!`);
      gs.textContent = T("Gracias por pasar este año por aquí.", "Thanks for stopping by this year.");
      const f = fuegos();
      motor.agrega(f);
      bitDice(T(`¡Feliz ${anio}! Que compile a la primera.`, `Happy ${anio}! May it compile on the first try.`), "doble", "Estrella");
      setTimeout(() => { gran.hidden = true; }, 6500);
      setTimeout(() => motor.quita(f), 11000);
    }
    tic();
    setInterval(tic, 250);
    cuandoBit(() => { if (!fiesta) bitDice(T("¡Ya casi! Te aviso cuando falten 10 segundos.", "Almost there! I'll let you know at 10 seconds."), "brinco", "Estrella"); });
  }
})();
