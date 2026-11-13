/* ---------- CORREO.EXE: formulario de contacto ----------
   Mientras LLAVE esté vacía, ENVIAR abre el programa de correo de quien escribe con el mensaje ya listo. */
(() => {
  "use strict";
  const LLAVE = "82511b6a-6315-4c02-8665-fa3f2c9acc30";
  const DESTINO = "leo.software@outlook.com";

  const form = document.querySelector(".correo-win");
  if (!form) return;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const T = (es, en) => (document.documentElement.lang === "en" ? en : es);
  const P = () => window.Portafolio || { bitDice() {}, cuenta() {} };
  const bitHabla = (texto, salto) => P().bitDice(texto, "s", 3200, false, { salto, emote: salto === "temblor" ? "Alerta" : "Corazon" });

  const estadoEl = $(".correo-estado", form), cnt = $(".correo-cnt", form);
  const campos = () => $$("input:not(.correo-trampa), textarea", form);
  let enviando = false, borrarT = 0;

  function estado(lineas, clase = "") {
    estadoEl.className = "correo-estado " + clase;
    estadoEl.replaceChildren(...[].concat(lineas).filter(Boolean).map((l) => {
      const p = document.createElement("p");
      p.textContent = l;
      return p;
    }));
  }
  form.message.addEventListener("input", () => { cnt.textContent = `${form.message.value.length}/1000`; });
  // Mientras escribes, las teclas del sitio (1-4, M...) no se disparan
  form.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "F10" || (e.key === "Enter" && (e.ctrlKey || e.metaKey))) { e.preventDefault(); form.requestSubmit(); }
    else if (e.key === "Escape") { e.preventDefault(); borrar(); }
  });
  $('[data-accion="borrar"]', form).addEventListener("click", borrar);
  // Como en DOS: borrar todo hay que confirmarlo
  function borrar() {
    if (enviando || !campos().some((c) => c.value)) return;
    if (!borrarT) {
      estado(T("¿Borrar todo el mensaje? Presiona ESC (o BORRAR) otra vez.", "Clear the whole message? Press ESC (or CLEAR) again."), "aviso");
      borrarT = setTimeout(() => { borrarT = 0; estado(""); }, 2500);
      return;
    }
    clearTimeout(borrarT);
    borrarT = 0;
    form.reset();
    cnt.textContent = "0/1000";
    estado(T("Mensaje borrado.", "Message cleared."), "dim");
    form.email.focus();
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (enviando) return;
    const d = Object.fromEntries(new FormData(form));
    if (d.botcheck) return;
    const correo = d.email.trim();
    if (!correo) { estado(T("ERROR: Falta tu correo para poder responderte.", "ERROR: I need your email to reply."), "err"); form.email.focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) { estado(T("ERROR: Ese correo no parece válido.", "ERROR: That email doesn't look right."), "err"); form.email.focus(); return; }
    if (d.message.trim().length < 5) { estado(T("ERROR: El mensaje está vacío.", "ERROR: The message is empty."), "err"); form.message.focus(); return; }
    if (!LLAVE) { abreCorreo(d); return; }
    enviando = true;
    campos().forEach((c) => { c.readOnly = true; });
    form.classList.add("enviando");
    estado("");
    const r = await barra(d);
    enviando = false;
    campos().forEach((c) => { c.readOnly = false; });
    form.classList.remove("enviando");
    if (r === "ok") { await cierraEnvio(); exito(); }
    else if (r === "cancelado") { await cierraEnvio(); cancelado(); }
    else fallo();
  });

  // Sin LLAVE: el mensaje se abre en el programa de correo de quien escribe
  function abreCorreo(d) {
    const asunto = d.subject.trim() || T("Mensaje desde tu portafolio", "Message from your portfolio");
    const firma = [d.name.trim(), d.email.trim()].filter(Boolean).join(" · ");
    location.href = `mailto:${DESTINO}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(`${d.message.trim()}\n\n${firma}`)}`;
    estado([T("Abrí tu programa de correo con el mensaje listo.", "I opened your email app with the message ready."),
      T(`Si no se abrió, escribe directo a ${DESTINO}`, `If it didn't open, write to ${DESTINO}`)], "ok");
    P().cuenta("correo-mailto");
  }

  async function mandar(d, senal) {
    const r = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: LLAVE,
        from_name: "Portafolio LEO.EXE",
        subject: d.subject.trim() || "Nuevo mensaje desde el portafolio",
        name: d.name.trim(),
        email: d.email.trim(),
        message: d.message.trim(),
      }),
      signal: senal,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.success) throw new Error(j.message || String(r.status));
  }

  /* ---------- Ventana de envío: aparece ENCIMA de la página, como los diálogos de descarga de antes
     (marco con relieve, bloques que caen uno por uno, velocidad a 9600 baudios y tiempo restante) ---------- */
  const envio = document.createElement("div");
  envio.className = "envio";
  envio.hidden = true;
  envio.setAttribute("role", "dialog");
  envio.setAttribute("aria-modal", "true");
  envio.setAttribute("aria-labelledby", "envio-t");
  document.body.appendChild(envio);
  const tactil = window.matchMedia("(pointer: coarse)").matches;
  const conTecla = (k, txt) => (tactil ? txt : `[${k}] ${txt}`);
  let envioEstado = "", control = null, cancelaPedido = false;

  function botonesEnvio(lista) {
    const op = $(".envio-op", envio);
    op.replaceChildren(...lista.map(([id, txt]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.e = id;
      b.textContent = txt;
      return b;
    }));
    if (op.firstChild) op.firstChild.focus({ preventScroll: true });
  }
  envio.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-e]");
    if (!b) return;
    if (b.dataset.e === "reintentar") form.requestSubmit();
    else if (envioEstado === "enviando") { cancelaPedido = true; if (control) control.abort(); }
    else cierraEnvio().then(cancelado);
  });
  // ESC cancela, R/C en el error, y el foco no se sale de sus botones
  envio.addEventListener("keydown", (e) => {
    e.stopPropagation();
    const k = e.key.toLowerCase();
    const btn = (id) => $(`[data-e="${id}"]`, envio);
    if (k === "escape" || (envioEstado === "falla" && k === "c")) { e.preventDefault(); if (btn("cancelar")) btn("cancelar").click(); }
    else if (envioEstado === "falla" && k === "r") { e.preventDefault(); btn("reintentar").click(); }
    else if (k === "tab") {
      const bs = $$("button", envio);
      e.preventDefault();
      if (bs.length) bs[(bs.indexOf(document.activeElement) + (e.shiftKey ? -1 : 1) + bs.length) % bs.length].focus();
    }
  });
  function cierraEnvio() {
    envioEstado = "";
    if (envio.hidden) return Promise.resolve();
    return new Promise((listo) => {
      const fin = () => { envio.hidden = true; envio.classList.remove("sale", "abre"); listo(); };
      if (RM) { fin(); return; }
      envio.classList.add("sale");
      setTimeout(fin, 200);
    });
  }

  async function barra(d) {
    cancelaPedido = false;
    envioEstado = "enviando";
    // Tantos bloques como quepan a lo ancho (11 px + 3 de separación), para que la barra llene la ventana
    const N = Math.max(8, Math.min(32, Math.floor((Math.min(520, innerWidth - 32) - 36 - 12 + 3) / 14)));
    envio.innerHTML = `
      <div class="envio-win">
        <div class="term-bar envio-bar"><span><i class="sw" aria-hidden="true"></i><span id="envio-t">${T("CORREO.EXE", "MAIL.EXE")}</span></span><b class="envio-pct">0%</b></div>
        <div class="envio-cuerpo">
          <p class="envio-que">${T("Enviando mensaje...", "Sending message...")}</p>
          <div class="descarga-barra" role="progressbar" aria-labelledby="envio-t" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">${"<i></i>".repeat(N)}</div>
          <p class="descarga-datos">
            <span>${T("Destino", "To")}: <b>${DESTINO}</b></span>
            <span>${T("Velocidad", "Speed")}: <b class="envio-vel">--</b></span>
            <span>${T("Restante", "Remaining")}: <b class="envio-rest">${T("calculando...", "calculating...")}</b></span>
          </p>
          <div class="envio-op"></div>
        </div>
      </div>`;
    envio.classList.remove("falla", "completa", "sale");
    if (envio.hidden) {
      envio.hidden = false;
      if (!RM) { envio.classList.remove("abre"); void envio.offsetWidth; envio.classList.add("abre"); }
    }
    botonesEnvio([["cancelar", conTecla("ESC", T("CANCELAR", "CANCEL"))]]);
    const que = $(".envio-que", envio), pct = $(".envio-pct", envio), barraEl = $(".descarga-barra", envio);
    const vel = $(".envio-vel", envio), rest = $(".envio-rest", envio), bloques = $$(".descarga-barra i", envio);
    let p = 0, llenos = 0, listo = false, malo = false, t = 0;
    control = new AbortController();
    // Si el servidor no contesta en 20 s, se da por perdida la conexión
    const limite = setTimeout(() => control.abort(), 20000);
    mandar(d, control.signal).then(() => { listo = true; }, () => { malo = true; }).finally(() => clearTimeout(limite));
    const pinta = () => {
      const n = Math.floor((p / 100) * N);
      bloques.forEach((b, i) => b.classList.toggle("on", i < n));
      // El bloque que acaba de caer brilla un instante
      if (n > llenos) { bloques.forEach((b) => b.classList.remove("nuevo")); bloques[n - 1].classList.add("nuevo"); }
      llenos = n;
      pct.textContent = `${Math.round(p)}%`;
      barraEl.setAttribute("aria-valuenow", String(Math.round(p)));
      if (++t % 3 === 0) vel.textContent = `${(7.2 + Math.random() * 2.4).toFixed(1)} KB/s`;
      if (p > 15) rest.textContent = `${Math.max(1, Math.ceil(((100 - p) / 100) * 3))} s`;
    };
    pinta();
    for (;;) {
      await espera(70 + Math.random() * 110);
      if (cancelaPedido) return "cancelado";
      // Avanza sola hasta 90 % y espera la respuesta del servidor para llegar a 100
      if (listo) p = Math.min(100, p + 12);
      else if (malo) {
        envio.classList.add("falla");
        que.textContent = T("Se perdió la conexión", "Connection lost");
        vel.textContent = "0.0 KB/s";
        rest.textContent = "--";
        return "falla";
      } else p = Math.min(90, p + 1 + Math.random() * 6);
      pinta();
      if (p >= 100) {
        que.textContent = T("Envío completo", "Send complete");
        rest.textContent = "0 s";
        bloques.forEach((b) => b.classList.remove("nuevo"));
        envio.classList.add("completa");
        botonesEnvio([]);
        await espera(RM ? 0 : 700);
        return "ok";
      }
    }
  }
  function exito() {
    estado(T("Mensaje enviado.        1 archivo(s) copiado(s).", "Message sent.        1 file(s) copied."), "ok");
    form.reset();
    cnt.textContent = "0/1000";
    P().cuenta("correo-enviado");
    bitHabla(T("¡Mensaje enviado! Ya va en camino.", "Message sent! It's on its way."), "doble");
    $('button[type="submit"]', form).focus({ preventScroll: true });
  }
  function cancelado() {
    estado(T("Envío cancelado. Tu mensaje sigue aquí.", "Sending canceled. Your message is still here."), "dim");
    form.message.focus({ preventScroll: true });
  }
  // Si falla, la ventana se queda abierta con la barra congelada en rojo y dos opciones
  function fallo() {
    envioEstado = "falla";
    const msg = document.createElement("p");
    msg.className = "envio-err";
    msg.textContent = T("Error de red: no se pudo enviar el mensaje.", "Network error: the message couldn't be sent.");
    $(".envio-op", envio).before(msg);
    botonesEnvio([["reintentar", conTecla("R", T("REINTENTAR", "RETRY"))], ["cancelar", conTecla("C", T("CANCELAR", "CANCEL"))]]);
    bitHabla(T("Uy, se cayó la línea. ¿Lo intentamos otra vez?", "Oops, the line dropped. Try again?"), "temblor");
  }
})();
