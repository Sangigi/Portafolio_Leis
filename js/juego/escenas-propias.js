/* ---------- BIT & BUGS · escenas-propias.js: los escenarios que crea el jugador (modelo, guardado y dibujo) ---------- */
/* Un escenario es una pila de capas, de atrás hacia adelante. Hay capas armadas (cielo, astro, estrellas, fondo, silueta,
   piso, efecto: cada una con forma, colores y movimiento) y capas PINTURA, dibujadas pixel por pixel en escenarios.js,
   que pueden tener varios cuadros (animación) y, si son el JEFE, un cuadro de ataque y una sacudida cuando ataca.
   Se guardan en el navegador (IndexedDB, almacén "escenarios") y se usan por tramo en el editor de ritmo con la clave
   "m:<id>". Este archivo sabe dibujarlos en cualquier lienzo: la vista previa del editor o el lienzo de efectos del juego. */
(() => {
  "use strict";
  const BB = window.BitBugs, S = BB.S;
  const { RM } = BB;
  Object.assign(BB, { eligeEstado, estadoNuevo, normaliza, pintaEscenario, capaNueva, escenarioNuevo, cargaEscenas, guardaEscena, borraEscena, miniEscena });
  S.misEscenas = []; S.escenasListas = false;

  /* ---------- El modelo ---------- */
  const id = () => `e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  function capaNueva(k) {
    const base = { k, on: true };
    switch (k) {
      case "cielo": return { ...base, c: ["#18084c", "#4c1088", "#a0247c", "#fc9c4c"], estilo: "trama" };
      case "astro": return { ...base, forma: "sol", x: 0.62, y: 0.5, r: 0.2, c: ["#fca44c", "#e86c10"], late: true };
      case "estrellas": return { ...base, n: 0.5, c: "#ffffff", titila: true, fugaces: false };
      case "fondo": return { ...base, forma: "montanas", alto: 0.25, c: "#4c1088", desliza: 0.15 };
      case "silueta": return { ...base, forma: "ciudad", alto: 0.45, dens: 0.7, desliza: 0.3, c: ["#000010", "#fca44c", "#fcd87c"], luces: "parpadean" };
      case "piso": return { ...base, forma: "rejilla", alto: 0.3, c: ["#0c0634", "#ff3fb4"], vel: 0.5 };
      case "efecto": return { ...base, forma: "reflectores", c: "#00f6ff", n: 0.5, late: true };
      default: return { ...base, k: "pintura", w: 160, h: 90, estados: [estadoNuevo("REPOSO", "reposo")], x: 0.5, y: 0.5, alto: 1, rep: false, desliza: 0, mov: "nada", jefe: false };
    }
  }
  // Un ESTADO es una animación con nombre (REPOSO, ATAQUE...): sus cuadros, cuánto dura cada uno (segundos),
  // si se repite en bucle o va una vez, y cuándo se usa en el juego (USOS)
  function estadoNuevo(n = "REPOSO", uso = "reposo") { return { n, uso, loop: uso === "reposo", golpe: false, frames: [{ src: "", d: 0.15 }] }; }
  // Las capas pintadas de antes (frames + fps) pasan a estados: si era jefe, el último cuadro es su ATAQUE
  function normaliza(c) {
    if (!c || c.k !== "pintura" || Array.isArray(c.estados)) return c;
    const d = Math.round(100 / (c.fps || 6)) / 100, fr = (c.frames && c.frames.length ? c.frames : [""]).map((src) => ({ src, d }));
    const rep = { ...estadoNuevo("REPOSO", "reposo"), golpe: !!c.golpe, frames: c.jefe && fr.length > 1 ? fr.slice(0, -1) : fr };
    c.estados = [rep];
    if (c.jefe && fr.length > 1) c.estados.push({ ...estadoNuevo("ATAQUE", "ataque"), frames: [{ src: fr[fr.length - 1].src, d: 0.45 }] });
    delete c.frames; delete c.fps; delete c.golpe;
    return c;
  }
  function escenarioNuevo() { return { id: id(), nombre: "MI ESCENARIO", fecha: Date.now(), capas: ["cielo", "astro", "estrellas", "fondo", "silueta", "piso"].map(capaNueva) }; }

  /* ---------- Guardado ---------- */
  function cargaEscenas() {
    if (!BB.idb) return Promise.resolve([]);
    return BB.idb.todas("escenarios").then((l) => { l.forEach((e) => (e.capas || []).forEach(normaliza)); S.misEscenas = l.sort((a, b) => a.fecha - b.fecha); S.escenasListas = true; return S.misEscenas; }).catch(() => S.misEscenas);
  }
  function guardaEscena(e) {
    e.fecha = e.fecha || Date.now();
    const i = S.misEscenas.findIndex((x) => x.id === e.id);
    if (i >= 0) S.misEscenas[i] = e; else S.misEscenas.push(e);
    imgs.clear(); minis.delete(e.id);
    return BB.idb ? BB.idb.guarda("escenarios", JSON.parse(JSON.stringify(e))) : Promise.resolve();
  }
  function borraEscena(eid) {
    S.misEscenas = S.misEscenas.filter((x) => x.id !== eid);
    minis.delete(eid);
    return BB.idb ? BB.idb.borra("escenarios", eid) : Promise.resolve();
  }

  /* ---------- Herramientas de dibujo ---------- */
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const h = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const rgb = (hex) => [parseInt(hex.slice(1, 3), 16) || 0, parseInt(hex.slice(3, 5), 16) || 0, parseInt(hex.slice(5, 7), 16) || 0];
  // El cielo con trama se calcula una vez por tamaño y colores, y luego solo se copia
  const cielos = new Map();
  function cielo(x, W, H, alto, cols, estilo) {
    const clave = `${W}x${alto}|${cols.join("")}|${estilo}`;
    let cv = cielos.get(clave);
    if (!cv) {
      if (cielos.size > 24) cielos.clear();
      cv = document.createElement("canvas"); cv.width = W; cv.height = Math.max(1, alto);
      const c = cv.getContext("2d"), im = c.createImageData(W, cv.height), d = im.data, C = cols.map(rgb), n = C.length - 1;
      for (let y = 0; y < cv.height; y++) {
        const f = (y / cv.height) * n, i = Math.min(n - 1, Math.floor(f)), fr = f - i;
        for (let X = 0; X < W; X++) {
          const col = estilo === "liso" ? (fr > 0.5 ? C[i + 1] : C[i]) : estilo === "franjas" ? C[Math.min(n, Math.round(f))] : fr * 16 > BAYER[(X & 3) + (y & 3) * 4] + 0.5 ? C[i + 1] : C[i], p = (y * W + X) * 4;
          d[p] = col[0]; d[p + 1] = col[1]; d[p + 2] = col[2]; d[p + 3] = 255;
        }
      }
      c.putImageData(im, 0, 0); cielos.set(clave, cv);
    }
    x.drawImage(cv, 0, 0);
  }
  // Los cuadros pintados se convierten en imágenes una sola vez
  const imgs = new Map();
  function img(src) {
    if (!src) return null;
    let im = imgs.get(src);
    if (!im) { im = new Image(); im.src = src; imgs.set(src, im); if (imgs.size > 300) imgs.delete(imgs.keys().next().value); }
    return im.complete && im.naturalWidth ? im : null;
  }

  /* ---------- Dibujar un escenario ----------
     x: contexto · W, H: tamaño en pixeles · v: { t: segundos, pulso: 0 a 1 con cada golpe, golpe: número de golpe,
     ataque: segundos desde el último ataque del jefe (o null) } */
  function pintaEscenario(esc, x, W, H, v) {
    const t = RM ? 0 : v.t, pulso = RM ? 0 : v.pulso || 0;
    const rc = (c, a, b, w, hh) => { x.fillStyle = c; x.fillRect(Math.round(a), Math.round(b), Math.max(1, Math.round(w)), Math.max(1, Math.round(hh))); };
    x.save(); x.imageSmoothingEnabled = false;
    rc("#000000", 0, 0, W, H);
    const piso = esc.capas.find((c) => c.k === "piso" && c.on), yH = Math.round(H * (1 - (piso ? piso.alto : 0.28)));
    esc.capas.forEach((c, ci) => {
      if (!c.on) return;
      try {
        if (c.k === "cielo") cielo(x, W, H, c.estilo === "lleno" ? H : yH, c.c, c.estilo);
        else if (c.k === "astro") {
          const r = Math.max(2, Math.round(H * c.r * (c.late ? 1 + pulso * 0.04 : 1))), cx = Math.round(W * c.x), cy = Math.round(H * c.y);
          for (let dy = -r; dy <= r; dy++) {
            const w = Math.round(Math.sqrt(r * r - dy * dy));
            if (c.forma === "sol") rc(dy > r * 0.1 ? c.c[1] : c.c[0], cx - w, cy + dy, w * 2, 1);
            else if (c.forma === "luna") { rc(c.c[0], cx - w, cy + dy, w * 2, 1); if (dy % 5 === 0 && Math.abs(dy) < r * 0.7) rc(c.c[1], cx - w * 0.3, cy + dy, w * 0.3, 2); }
            else rc((dy + r) / (2 * r) * 16 > BAYER[((cx - w) & 3) + ((dy & 3) * 4)] * 0.6 + 7 ? c.c[1] : c.c[0], cx - w, cy + dy, w * 2, 1);
          }
          if (c.forma === "sol") for (let i = 1; i < 6; i++) rc("#000000", cx - r, cy + r - i * i * (r / 22) - 1, r * 2, Math.max(1, Math.round(i * r / 40)));
          if (c.forma === "planeta") for (let k = -1; k <= 1; k += 2) for (let X = -r * 2; X <= r * 2; X++) { const yy = cy + X * -0.18 + k * Math.sqrt(Math.max(0, 1 - (X / (2 * r)) ** 2)) * r * 0.3; if (k > 0 || Math.abs(X) > r) rc(c.c[0], cx + X, yy, 1, 2); }
          if (c.forma === "sol" || c.forma === "luna") { x.globalAlpha = 0.18 + pulso * 0.15; rc(c.c[0], cx - r * 1.6, cy - 1, r * 3.2, 2); x.globalAlpha = 1; }
        } else if (c.k === "estrellas") {
          const n = Math.round(10 + c.n * 140);
          for (let i = 0; i < n; i++) { if (c.titila && !RM && h(i + Math.floor(t * 3) * 0.37) < 0.15) continue; const sx = h(i + 0.13) * W, sy = h(i + 0.57) * yH * 0.9; if (i % 9 === 0) { rc(c.c, sx - 1, sy, 3, 1); rc(c.c, sx, sy - 1, 1, 3); } else rc(c.c, sx, sy, 1, 1); }
          if (c.fugaces && !RM) { const k = Math.floor(t / 2.6), p = (t / 2.6 - k) / 0.3; if (p < 1) { const sx = W * (0.1 + h(k) * 0.7) + p * W * 0.2, sy = H * (0.1 + h(k + 0.5) * 0.2) + p * H * 0.08; for (let j = 0; j < 14; j++) rc(j < 3 ? "#ffffff" : c.c, sx - j * 2, sy - j, 2, 1); } }
        } else if (c.k === "fondo") {
          const corre = t * c.desliza * 30, alto = H * c.alto;
          for (let X = 0; X < W; X += 2) {
            const u = X + corre, a = c.forma === "dunas" ? alto * (0.5 + 0.5 * Math.sin(u * 0.012)) : c.forma === "colinas" ? alto * (0.55 + 0.45 * Math.abs(Math.sin(u * 0.018 + Math.sin(u * 0.005)))) : alto * (0.35 + 0.65 * Math.abs(Math.sin(u * 0.03) + Math.sin(u * 0.071 + 1) * 0.5) / 1.5);
            rc(c.c, X, yH - a, 2, a + 1);
          }
        } else if (c.k === "silueta") {
          const corre = t * c.desliza * 40, cw = c.forma === "torres" ? 14 : c.forma === "ciudad" ? 20 : 26, k0 = Math.floor(corre / cw);
          for (let k = k0 - 1; (k - k0 - 1) * cw < W; k++) {
            if (h(k * 1.37 + ci) > c.dens + 0.15) continue;
            const X = Math.round(k * cw - corre), q = k * 1.37 + ci * 7, a = Math.round(H * c.alto * (0.35 + h(q) * 0.65));
            if (c.forma === "ciudad" || c.forma === "torres" || c.forma === "fabrica") {
              const w = cw - (c.forma === "torres" ? 2 : 1);
              rc(c.c[0], X, yH - a, w, a); rc(c.c[1], X, yH - a, 1, a); rc(c.c[1], X, yH - a, w * 0.5, 1);
              if (c.forma === "fabrica" && h(q + 0.4) > 0.5) { rc(c.c[0], X + w * 0.6, yH - a - H * 0.12, 4, H * 0.12); if (!RM) for (let j = 0; j < 4; j++) { const f = (t * 0.5 + h(q + j)) % 1; x.globalAlpha = 0.5 * (1 - f); rc("#8f93a8", X + w * 0.6 - 2 + f * 8, yH - a - H * 0.12 - f * 30, 6, 4); x.globalAlpha = 1; } }
              if (c.luces !== "no") for (let j = 0; j * 6 < a - 8; j++) for (let i = 0; (i + 1) * 5 < w - 2; i++) { const vv = h(q + j * 7.1 + i * 3.3 + (c.luces === "parpadean" ? Math.floor(t * 1.5 + h(q + i)) * 0.11 : 0)); if (vv > 0.62) rc(c.c[2], X + 3 + i * 5, yH - a + 4 + j * 6, 2, 3); }
            } else if (c.forma === "palmeras" || c.forma === "arboles") {
              const cx = X + cw / 2, m = RM ? 0 : Math.sin(t * 1.2 + k) * 2;
              rc(c.c[0], cx - 1, yH - a, 3, a);
              if (c.forma === "palmeras") for (let s = -3; s <= 3; s++) for (let j = 0; j < a * 0.4; j++) rc(j > a * 0.35 ? c.c[1] : c.c[0], cx + s * j * 0.36 + m * (j / (a * 0.4)), yH - a + Math.abs(s) * j * 0.22 - (3 - Math.abs(s)) * j * 0.05, 2, 2);
              else for (let dy = -a * 0.3; dy <= a * 0.3; dy++) { const w = Math.sqrt(Math.max(0, (a * 0.3) ** 2 - dy * dy)); rc(c.c[0], cx - w + m * 0.5, yH - a + dy, w * 2, 1); if (dy < -a * 0.15) rc(c.c[1], cx - w + m * 0.5, yH - a + dy, 1, 1); }
            } else { const r = cw * 0.5 * (0.5 + h(q)), cy = yH + 6 + h(q + 0.3) * (H - yH) * 0.6; for (let dy = -r * 0.3; dy <= r * 0.3; dy++) { const w = Math.sqrt(Math.max(0, (r * 0.3) ** 2 - dy * dy)) / 0.3; rc(dy < 0 ? c.c[0] : c.c[1], X + cw / 2 - w, cy + dy, w * 2, 1); } }
          }
        } else if (c.k === "piso") {
          rc(c.c[0], 0, yH, W, H - yH);
          if (c.forma === "rejilla") { for (let i = 0; i < 9; i++) { const k = (i + (RM ? 0 : (t * c.vel * 2) % 1)) / 9, y = yH + k * k * (H - yH); rc(c.c[1], 0, y, W, 1); } x.strokeStyle = c.c[1]; x.lineWidth = 1; for (let i = -10; i <= 10; i++) { x.beginPath(); x.moveTo(W / 2 + i * 9 + 0.5, yH); x.lineTo(W / 2 + i * W * 0.11, H); x.stroke(); } }
          else if (c.forma === "agua") for (let i = 0; i < 50; i++) { const y = yH + 2 + h(i + 0.5) * (H - yH - 4), sx = ((h(i) * W - t * c.vel * 40) % W + W) % W; x.globalAlpha = 0.6; rc(c.c[1], sx, y, 3 + h(i + 0.2) * 9, 1); x.globalAlpha = 1; }
          rc(c.c[1], 0, yH, W, 1);
        } else if (c.k === "efecto") {
          const n = Math.round(8 + c.n * 60), b = c.late ? 0.6 + pulso * 0.6 : 1;
          if (c.forma === "reflectores") for (let i = 0; i < 4; i++) { const bx = W * (0.15 + i * 0.23), a = -Math.PI / 2 + Math.sin(t * 1.1 + i * 1.9) * 0.55, L = H * 1.1; x.globalAlpha = 0.18 * b; x.fillStyle = c.c; x.beginPath(); x.moveTo(bx, yH); x.lineTo(bx + Math.cos(a - 0.07) * L, yH + Math.sin(a - 0.07) * L); x.lineTo(bx + Math.cos(a + 0.07) * L, yH + Math.sin(a + 0.07) * L); x.fill(); x.globalAlpha = 1; }
          else if (c.forma === "lluvia" || c.forma === "codigo") for (let i = 0; i < n; i++) { const sx = h(i) * W, sy = (h(i + 0.5) * H + t * (80 + h(i + 0.2) * 120)) % H; if (c.forma === "codigo") { x.globalAlpha = 0.8; rc(c.c, sx, sy, 2, 3); rc(c.c, sx, sy - 6, 2, 3); x.globalAlpha = 0.4; rc(c.c, sx, sy - 12, 2, 3); x.globalAlpha = 1; } else rc(c.c, sx, sy, 1, 4); }
          else if (c.forma === "nieve" || c.forma === "burbujas" || c.forma === "chispas") for (let i = 0; i < n; i++) { const up = c.forma !== "nieve", sx = (h(i) * W + Math.sin(t + i) * 6) % W, sy = up ? ((h(i + 0.5) * H - t * (12 + h(i + 0.2) * 30)) % H + H) % H : (h(i + 0.5) * H + t * (10 + h(i + 0.2) * 20)) % H, g = c.forma === "burbujas" ? 2 + Math.round(h(i + 0.7) * 2) : 1 + (i % 3 === 0 ? 1 : 0); if (c.forma === "burbujas") { x.strokeStyle = c.c; x.strokeRect(sx + 0.5, sy + 0.5, g, g); } else { x.globalAlpha = c.forma === "chispas" ? Math.min(1, b) : 1; rc(c.c, sx, sy, g, g); x.globalAlpha = 1; } }
          else if (c.forma === "confeti") for (let i = 0; i < n; i++) { const sx = (h(i) * W + Math.sin(t * 2 + i) * 8) % W, sy = (h(i + 0.5) * H + t * (30 + h(i + 0.2) * 40)) % H; rc(["#ff3fb4", "#00f6ff", "#FFD319", "#41B883"][i % 4], sx, sy, 2, 3); }
          if (c.late && pulso > 0.6) { x.globalAlpha = (pulso - 0.6) * 0.25; rc(c.c, 0, 0, W, H); x.globalAlpha = 1; }
        } else if (c.k === "pintura") pintura(c, x, W, H, v, t, pulso);
      } catch (e) { /* una capa rota no tumba a las demás */ }
    });
    x.restore();
  }
  /* Qué estado toca y qué cuadro de él. Cada estado dice CUÁNDO se usa (uso) y, si hace falta, un número (p):
       reposo   siempre que no pasa nada más
       ataque · acierto · fallo   al salir un ataque del jefe, al atrapar un bug, al escaparse uno
       combo    cada vez que el combo llega a un múltiplo de p (10, 20, 30...)
       golpes   cada p golpes de la música
       tramo    al empezar el tramo (cuando aparece el escenario)
       energia  mientras la música esté fuerte (energía de p o más, de 1 a 9)
       evento   solo cuando lo pongas tú en el editor de ritmo (EVENTOS), en el segundo que quieras
       libre    no sale en el juego (borrador)
     Si varios estados tienen el mismo uso, se turnan. Prioridad: evento > ataque > fallo > acierto > combo > golpes > tramo > energía > reposo.
     v: { t, golpe, tGolpe, ataque, ataqueDur, acierto, fallo, combo, tramo, energia, eventos: [{ n, dt, d }] } */
  const DISPARO = { ataque: 0, acierto: 0.8, fallo: 0.8 };
  const totalDe = (q) => q.frames.reduce((a, f) => a + (f.d || 0.1), 0);
  const turno = (lista, cuando) => lista[Math.abs(Math.floor(cuando * 7.31)) % lista.length];
  function eligeEstado(c, v, t) {
    const es = c.estados || [], rep = es.find((e) => e.uso === "reposo") || es[0], de = (u) => es.filter((x) => x.uso === u);
    // Eventos puestos a mano (por nombre del estado; el más reciente manda)
    for (const ev of v.eventos || []) {
      const q = es.find((x) => x.n === ev.n);
      if (q && ev.dt >= 0 && ev.dt < (ev.d > 0 ? ev.d : totalDe(q))) return { e: q, dt: ev.dt, activo: "evento" };
    }
    for (const uso of ["ataque", "fallo", "acierto"]) {
      const l = de(uso), d = v[uso];
      if (!l.length || d == null || d < 0) continue;
      const q = turno(l, t - d), total = totalDe(q), dura = q.loop ? Math.max(total, uso === "ataque" ? v.ataqueDur || total : DISPARO[uso]) : total;
      if (d < dura) return { e: q, dt: d, activo: uso };
    }
    for (const q of de("combo")) { const n = Math.max(2, q.p || 10); if (v.combo > 0 && v.combo % n === 0 && v.acierto != null && v.acierto < totalDe(q)) return { e: q, dt: v.acierto, activo: "combo" }; }
    for (const q of de("golpes")) { const n = Math.max(1, q.p || 4); if (v.tGolpe != null && (v.golpe || 0) % n === 0 && v.tGolpe < totalDe(q)) return { e: q, dt: v.tGolpe, activo: "golpes" }; }
    { const l = de("tramo"); if (l.length && v.tramo != null && v.tramo >= 0) { const q = l[0]; if (v.tramo < totalDe(q)) return { e: q, dt: v.tramo, activo: "tramo" }; } }
    { const l = de("energia").filter((q) => (v.energia || 0) >= (q.p || 7)); if (l.length) return { e: l[0], dt: t, activo: "energia" }; }
    return { e: rep, dt: t, activo: null };
  }
  function cuadroDe(c, v, t) {
    const { e, dt, activo } = eligeEstado(c, v, t);
    if (!e || !e.frames.length) return { f: null, activo };
    const n = e.frames.length;
    if (e.golpe) return { f: e.frames[!activo || activo === "energia" ? (v.golpe || 0) % n : Math.min(n - 1, Math.floor(dt * 2))], activo };
    const total = totalDe(e);
    let tt = e.loop ? dt % total : Math.min(dt, total - 0.0001), i = 0;
    while (i < n - 1 && tt >= (e.frames[i].d || 0.1)) { tt -= e.frames[i].d || 0.1; i++; }
    return { f: e.frames[i], activo };
  }
  // Una capa pintada: su cuadro según su estado, su lugar, su tamaño y su movimiento. El JEFE se sacude al atacar
  function pintura(c, x, W, H, v, t, pulso) {
    normaliza(c);
    const { f, activo } = cuadroDe(c, v, t), ataca = c.jefe && activo === "ataque";
    const im = f && img(f.src);
    if (!im) return;
    // La escala la marca el tamaño de la capa: cada cuadro se dibuja con su propio tamaño, centrado en su lugar
    const px = (H * c.alto) / c.h, alto = (f.h || im.naturalHeight || c.h) * px, ancho = (f.w || im.naturalWidth || c.w) * px;
    let cx = W * c.x, cy = H * c.y, esc = 1;
    if (c.mov === "flota") cy += Math.sin(t * 1.6) * H * 0.02;
    if (c.mov === "late") esc = 1 + pulso * 0.06;
    if (c.mov === "rebota") cy -= Math.abs(Math.sin(t * Math.PI * 2)) * H * 0.03;
    if (ataca && v.ataque < 0.45 && !RM) { cx += (Math.random() - 0.5) * 6; cy += (Math.random() - 0.5) * 4; }
    const w = ancho * esc, hh = alto * esc;
    if (c.rep) { const corre = (((t * c.desliza * 40) % w) + w) % w; for (let X = -corre; X < W; X += w) x.drawImage(im, Math.round(X), Math.round(cy - hh / 2), Math.ceil(w), Math.round(hh)); }
    else { const corre = c.desliza ? ((((t * c.desliza * 40) % (W + w)) + W + w) % (W + w)) : 0; let X = cx - w / 2 - corre; if (X + w < 0) X += W + w; x.drawImage(im, Math.round(X), Math.round(cy - hh / 2), Math.round(w), Math.round(hh)); }
    if (ataca && v.ataque < 0.12 && !RM) { x.globalAlpha = 0.5; x.fillStyle = "#ffffff"; x.fillRect(Math.round(cx - w / 2), Math.round(cy - hh / 2), Math.round(w), Math.round(hh)); x.globalAlpha = 1; }
  }
  // Una miniatura de 96 × 54 de un escenario (para los catálogos)
  const minis = new Map();
  function miniEscena(e) {
    if (minis.has(e.id)) return minis.get(e.id);
    const cv = document.createElement("canvas"); cv.width = 192; cv.height = 108;
    pintaEscenario(e, cv.getContext("2d"), 192, 108, { t: 3, pulso: 0, golpe: 0 });
    const url = cv.toDataURL();
    // Las capas pintadas tardan un instante en cargar: si aún no estaban, la miniatura se rehace luego
    if (e.capas.some((c) => c.k === "pintura" && c.on && normaliza(c).estados.some((q) => q.frames.some((f) => f.src && !img(f.src))))) setTimeout(() => minis.delete(e.id), 300); else minis.set(e.id, url);
    return url;
  }
})();