/* ---------- Sonidos del portafolio: efectos cortos y la música de fondo en bucle ----------
   Los archivos van en la carpeta sonidos/ (ojo: en GitHub Pages importan mayúsculas y minúsculas).
   Los navegadores no dejan sonar nada hasta el primer clic o tecla de la visita: si inicio.mp3
   no puede sonar al cargar, suena en cuanto la persona toca algo (si la intro sigue en pantalla). */
(() => {
  "use strict";
  const RUTA = "sonidos/";
  const ARCHIVOS = {
    inicio: "inicio.mp3",
    fondo: "sonido-fondo.mp3",
    tema: "tema.mp3",
    ko: "KO.mp3",
    bit: "BIT.mp3",
    exit: "exit.mp3",
    continuar: "continuar.mp3",
    terminar: "terminar.mp3",
  };
  // Volumen de cada sonido, de 0 a 1
  const VOLUMEN = { inicio: 0.9, fondo: 0.35, tema: 0.8, ko: 0.9, bit: 0.5, exit: 0.9, continuar: 0.9, terminar: 0.9 };
  // La música suena completa la primera vez; después se repite del segundo 10 hasta 8 s antes del final
  const BUCLE_DESDE = 10, BUCLE_ANTES_DEL_FINAL = 8;

  const AC = window.AudioContext || window.webkitAudioContext;
  let ctx = null;
  try { if (AC) ctx = new AC(); } catch (e) { /* sin Web Audio: se usa <audio> */ }
  // Todo pasa por este volumen general: el botón de sonido lo baja a 0
  const general = ctx ? ctx.createGain() : null;
  if (general) general.connect(ctx.destination);

  // Sonido apagado o encendido (se recuerda en este navegador)
  let silencio = false;
  try { silencio = localStorage.getItem("sonido") === "off"; } catch (e) { /* suena por defecto */ }
  if (general) general.gain.value = silencio ? 0 : 1;

  const buf = {}, respaldo = {}, carga = {}, sonando = {};
  let gesto = false;
  const pendientes = [];

  // Respaldo con <audio> (por ejemplo, al abrir index.html directo desde la carpeta)
  function elemento(n) {
    if (!respaldo[n]) {
      const a = new Audio(RUTA + ARCHIVOS[n]);
      a.preload = "auto";
      a.volume = VOLUMEN[n];
      a.muted = silencio;
      respaldo[n] = a;
    }
    return respaldo[n];
  }
  const decodifica = (ab) => new Promise((ok, mal) => ctx.decodeAudioData(ab, ok, mal));
  Object.keys(ARCHIVOS).forEach((n) => {
    const intento = ctx && location.protocol !== "file:"
      ? fetch(RUTA + ARCHIVOS[n]).then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(decodifica).then((b) => { buf[n] = b; })
      : Promise.reject();
    carga[n] = intento.catch(() => { elemento(n); });
  });

  // ¿Se puede sonar ya? Antes del primer gesto, solo si el navegador lo permitió por su cuenta
  const permitido = () => gesto || (ctx && ctx.state === "running");

  // unico: corta la vez anterior del mismo sonido antes de empezar (para que no se encimen)
  function play(n, unico = false) {
    if (!ARCHIVOS[n] || silencio) return;
    if (!buf[n] && !respaldo[n]) {
      const t = Date.now();
      carga[n].then(() => { if (Date.now() - t < 400) play(n, unico); });
      return;
    }
    if (ctx && buf[n]) {
      if (!permitido()) return;
      if (unico && sonando[n]) { try { sonando[n].stop(); } catch (e) { /* ya terminó */ } }
      const g = ctx.createGain();
      g.gain.value = VOLUMEN[n];
      g.connect(general);
      const s = ctx.createBufferSource();
      s.buffer = buf[n];
      s.connect(g);
      s.start();
      sonando[n] = s;
      s.onended = () => { if (sonando[n] === s) sonando[n] = null; };
      return;
    }
    const base = elemento(n);
    const a = unico ? base : base.cloneNode();
    a.volume = VOLUMEN[n];
    a.muted = false;
    try { a.currentTime = 0; } catch (e) { /* aún sin datos */ }
    a.play().catch(() => {});
  }

  /* ---------- Intro: inicio.mp3 en cuanto se pueda, mientras la intro siga en pantalla ---------- */
  function intro(sigue) {
    carga.inicio.then(() => {
      if (!sigue()) return;
      if (ctx && buf.inicio) {
        if (ctx.state === "running") play("inicio");
        else pendientes.push(() => { if (sigue()) play("inicio"); });
        return;
      }
      const a = elemento("inicio");
      a.play().catch(() => pendientes.push(() => {
        if (!sigue()) return;
        try { a.currentTime = 0; } catch (e) { /* aún sin datos */ }
        a.play().catch(() => {});
      }));
    });
  }

  /* ---------- Música de fondo ---------- */
  const fondo = { on: false, src: null, gain: null, t0: 0, desde: 0, html: false, timer: 0, esperando: false };
  // Tramo que se repite, ajustado por si el audio es corto
  function tramo(dur) {
    let ini = Math.min(BUCLE_DESDE, dur), fin = dur - BUCLE_ANTES_DEL_FINAL;
    if (fin - ini < 1) { ini = 0; fin = dur; }
    return [ini, fin];
  }
  // Segundo del archivo que está sonando ahora (Web Audio)
  function posicion() {
    const [ini, fin] = tramo(buf.fondo.duration);
    let p = fondo.desde + (ctx.currentTime - fondo.t0);
    if (p > fin) p = ini + ((p - fin) % (fin - ini));
    return p;
  }
  function fondoSuena() {
    if (!fondo.on || fondo.src || fondo.html) return;
    if (!buf.fondo && !respaldo.fondo) {
      if (!fondo.esperando) { fondo.esperando = true; carga.fondo.then(() => { fondo.esperando = false; fondoSuena(); }); }
      return;
    }
    if (ctx && buf.fondo) {
      if (!permitido()) return; // vuelve a intentarlo con el primer clic o tecla
      const [ini, fin] = tramo(buf.fondo.duration);
      const s = ctx.createBufferSource();
      s.buffer = buf.fondo;
      s.loop = true;
      s.loopStart = ini;
      s.loopEnd = fin;
      const g = ctx.createGain();
      // Entra suave si viene de una pausa
      g.gain.setValueAtTime(fondo.desde > 0 ? 0 : VOLUMEN.fondo, ctx.currentTime);
      if (fondo.desde > 0) g.gain.linearRampToValueAtTime(VOLUMEN.fondo, ctx.currentTime + 0.6);
      s.connect(g);
      g.connect(general);
      const desde = Math.min(fondo.desde, fin - 0.05);
      s.start(0, desde);
      fondo.desde = desde;
      fondo.t0 = ctx.currentTime;
      fondo.src = s;
      fondo.gain = g;
      return;
    }
    // Respaldo con <audio>: se vigila el tiempo y se regresa al segundo 10 a mano
    const a = respaldo.fondo;
    a.volume = VOLUMEN.fondo;
    try { a.currentTime = fondo.desde; } catch (e) { /* aún sin datos */ }
    a.play().then(() => {
      if (!fondo.on) { a.pause(); return; }
      fondo.html = true;
      clearInterval(fondo.timer);
      fondo.timer = setInterval(() => {
        if (!a.duration) return;
        const [ini, fin] = tramo(a.duration);
        if (a.currentTime >= fin) a.currentTime = ini;
      }, 30);
    }).catch(() => {});
  }
  function fondoIniciar() {
    if (fondo.on) return;
    fondo.on = true;
    fondo.desde = 0;
    fondoSuena();
  }
  // Se detiene recordando en qué segundo iba
  function fondoPausar() {
    fondo.on = false;
    if (fondo.src) {
      fondo.desde = posicion();
      const s = fondo.src, g = fondo.gain;
      g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
      try { s.stop(ctx.currentTime + 0.26); } catch (e) { /* ya parado */ }
      fondo.src = fondo.gain = null;
    }
    if (fondo.html) {
      const a = respaldo.fondo;
      fondo.desde = a.currentTime;
      a.pause();
      clearInterval(fondo.timer);
      fondo.html = false;
    }
  }
  function fondoReanudar() {
    if (fondo.on) return;
    fondo.on = true;
    fondoSuena();
  }

  /* ---------- Primer clic o tecla: se desbloquea el audio ---------- */
  const EVENTOS = ["pointerdown", "keydown", "touchend", "click"];
  function desbloquea() {
    if (gesto) return;
    gesto = true;
    EVENTOS.forEach((t) => window.removeEventListener(t, desbloquea, true));
    if (ctx && ctx.state !== "running") ctx.resume().catch(() => {});
    pendientes.splice(0).forEach((fn) => fn());
    fondoSuena();
  }
  EVENTOS.forEach((t) => window.addEventListener(t, desbloquea, true));

  // Si cambias de pestaña, el sonido se pausa y vuelve al regresar
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (ctx && ctx.state === "running") ctx.suspend().catch(() => {});
      if (fondo.html) respaldo.fondo.pause();
    } else {
      if (ctx && gesto) ctx.resume().catch(() => {});
      if (fondo.html && fondo.on) respaldo.fondo.play().catch(() => {});
    }
  });

  /* ---------- Botón de sonido: la música sigue avanzando en silencio, los efectos no suenan ---------- */
  function silenciar(on) {
    silencio = on;
    try { localStorage.setItem("sonido", on ? "off" : "on"); } catch (e) { /* no se recuerda, pero cambia igual */ }
    if (general) {
      general.gain.cancelScheduledValues(ctx.currentTime);
      general.gain.setValueAtTime(general.gain.value, ctx.currentTime);
      general.gain.linearRampToValueAtTime(on ? 0 : 1, ctx.currentTime + 0.15);
    }
    Object.values(respaldo).forEach((a) => { a.muted = on; });
    Object.values(sonando).forEach((s) => { if (on && s) { try { s.stop(); } catch (e) { /* ya terminó */ } } });
  }

  window.Sonidos = { play, intro, silenciar, silencio: () => silencio, fondo: { iniciar: fondoIniciar, pausar: fondoPausar, reanudar: fondoReanudar } };
})();