/* ---------- BIT & BUGS · ventana.js: la ventana del juego que se agrega a la página (marcador, recuadro, lienzo de efectos, ventanitas) ---------- */
(() => {
  "use strict";
  const BB = window.BitBugs, S = BB.S;
  const { $ } = BB;

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
    // La imagen del gato: una sola por ventana (las copias de la primera ya la traen)
    let g = $(".jv-g", v);
    if (!g) { g = document.createElement("img"); g.className = "jv-g"; g.alt = ""; $(".jv-n", v).before(g); }
    VENT.push({ el: v, tit: $(".jv-bar span", v), num: $(".jv-n", v), txt: $(".jv-t", v), gato: g, T: 0, lugar: -1 });
  }
  const aEl = $(".j-audio", el), gEl = $(".j-grito", el), trEl = $(".j-trans", el);
  const ptsEl = $(".j-pts", el), recEl = $(".j-rec", el), verEl = $(".j-ver", el), verK = $(".j-ver-k", el), vidasEl = $(".j-vidas", el);

  Object.assign(BB, { VENT, aEl, c2, ctx, el, fx, gEl, lienzo, marco, msg, ptsEl, recEl, trEl, vBase, verEl, verK, vidasEl });
})();
