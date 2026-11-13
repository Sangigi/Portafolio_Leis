/* ---------- Idioma: español (chcp 850) / inglés (chcp 437) ----------
   Traduce la página con un diccionario de pares [español, inglés]. Si cambias un texto en index.html
   o en app.js, cambia también su par aquí; si no, ese texto simplemente se queda en español.
   Va ANTES de app.js: así la página ya arranca en el idioma elegido y lo que app.js escriba después
   (BIT, <VER>, botones) también se traduce al vuelo.
   Para mandar el portafolio en inglés: agrega ?lang=en al link. */
(() => {
  "use strict";
  const doc = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lee = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const guarda = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* solo esta visita */ } };
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));

  const DIC = [
    // Navegación y BIT
    ["PERFIL", "PROFILE"], ["PROYECTOS", "PROJECTS"], ["HABILIDADES", "SKILLS"], ["CONTACTO", "CONTACT"], ["INICIO", "HOME"],
    ["QUITAR MENSAJES", "MUTE MESSAGES"], ["MOSTRAR MENSAJES", "SHOW MESSAGES"],
    ["Sonido", "Sound"], ["Modo", "Mode"], ["ENCENDIDO", "ON"], ["APAGADO", "OFF"], ["CLARO", "LIGHT"], ["OSCURO", "DARK"],
    // Inicio
    ["Desarrollo web · CDMX", "Web developer · Mexico City"], ["VER PROYECTOS", "VIEW PROJECTS"], ["CONTACTAR", "CONTACT ME"],
    ["EN LÍNEA", "ONLINE"], ["HORA LOCAL", "LOCAL TIME"], ["SESIÓN", "SESSION"],
    // Perfil
    ["sobre_mi.txt", "about_me.txt"],
    ["Soy un desarrollador web, enfocado principalmente en el desarrollo Back-End y apasionado por construir aplicaciones funcionales, eficientes y escalables, complementando mis conocimientos con herramientas Front-End.",
      "I'm a web developer focused mainly on back-end development, passionate about building functional, efficient and scalable applications, and I round out my skills with front-end tools."],
    ["ROL", "ROLE"], ["Desarrollo Back-End", "Back-end development"], ["ESTADO", "STATUS"], ["Disponible", "Available"],
    // Proyectos
    ["proyectos", "projects"],
    ["El volumen de la unidad C es PORTAFOLIO\n Directorio de C:\\PROYECTOS", "Volume in drive C is PORTFOLIO\n Directory of C:\\PROJECTS"],
    ["CRM de seguros para varias empresas: catálogos propios por empresa, filtro por ramo, citas, renovaciones y envío de cotizaciones al cliente.",
      "Insurance CRM for multiple companies: per-company catalogs, filtering by line of business, appointments, renewals and sending quotes to clients."],
    ["Punto de venta y cobranza multiempresa: una base por cliente, inventario por almacenes, IVA e IEPS, facturación CFDI y guías de paquetería.",
      "Multi-tenant point of sale and collections: one database per client, inventory by warehouse, VAT and IEPS taxes, CFDI e-invoicing and shipping labels."],
    ["MULTIEMPRESA", "MULTI-TENANT"], ["EN CURSO", "IN PROGRESS"], ["VERSIÓN 0.1", "VERSION 0.1"],
    ["RANURA 03", "SLOT 03"], ["<LIBRE>", "<FREE>"], ["RANURA_VACIA", "EMPTY_SLOT"], ["Aquí entra el próximo proyecto.", "The next project goes here."], ["LIBRE", "FREE"],
    ["<VER>", "<VIEW>"], ["<CERRAR>", "<CLOSE>"],
    // Habilidades
    ["habilidades", "skills"], ["APRENDIENDO", "LEARNING"], ["HERRAMIENTAS", "TOOLS"],
    // Contacto
    ["contacto", "contact"],
    ["Haciendo ping a leonel con 32 bytes de datos:\nRespuesta desde correo: bytes=32 tiempo<24h TTL=64", "Pinging leonel with 32 bytes of data:\nReply from email: bytes=32 time<24h TTL=64"],
    ["CORREO", "EMAIL"], ["COPIAR", "COPY"], ["COPIADO", "COPIED"],
    ["TARJETA.DAT", "CARD.DAT"], ["Desarrollo web · sistemas a la medida", "Web development · custom-built systems"], ["VOLTEAR >", "FLIP >"],
    ["Gracias por pasar.", "Thanks for stopping by."], ["Esta página se sigue construyendo, pixel por pixel.", "This page is still being built, pixel by pixel."],
    ["© 2026 Leonel Almanza · dibujado pixel por pixel", "© 2026 Leonel Almanza · drawn pixel by pixel"],
    // CORREO.EXE
    ["correo.exe", "mail.exe"], ["CORREO.EXE", "MAIL.EXE"], ["· MENSAJE NUEVO", "· NEW MESSAGE"],
    ["PARA:", "TO:"], ["DE:", "FROM:"], ["NOMBRE:", "NAME:"], ["ASUNTO:", "SUBJECT:"],
    ["tu@correo.com", "you@email.com"], ["Cómo te llamas", "Your name"], ["Propuesta de trabajo", "Job opportunity"],
    ["Escribe tu mensaje...", "Write your message..."], ["Mensaje", "Message"], ["ENVIAR", "SEND"], ["BORRAR", "CLEAR"], ["SIGUIENTE CAMPO", "NEXT FIELD"],
    // Apagado, intro y juego
    ["Clic o tecla Y para volver a encender", "Click or press Y to power back on"],
    ["clic o cualquier tecla para saltar", "click or press any key to skip"], ["PRESIONA START", "PRESS START"],
    ["clic o cualquier tecla para encender", "click or press any key to power on"],
    ["JUGAR BIT VS BUGS", "PLAY BIT VS BUGS"], ["PUNTOS", "SCORE"], ["RECORD", "HIGH"],
    ["← → o A D para mover · P pausa · ESC salir", "← → or A D to move · P pause · ESC quit"],
    // Temporadas
    ["TEMPORADA", "SEASON"], ["DÍA DE MUERTOS", "DAY OF THE DEAD"], ["NAVIDAD", "HOLIDAYS"], ["SAN VALENTÍN", "VALENTINE'S DAY"],
    ["AÑO NUEVO EN", "NEW YEAR IN"], ["FELIZ", "HAPPY"],
    // Atributos (title / aria-label / placeholder)
    ["Secciones", "Sections"], ["LEO.EXE, ir al inicio", "LEO.EXE, go to top"], ["Noquear la computadora", "Knock out the computer"],
    ["¿Y si le pegas?", "What if you hit it?"], ["Estado", "Status"], ["Categorías de tecnologías", "Technology categories"],
    ["Tecnologías: elige una para ver sus proyectos", "Technologies: pick one to see its projects"], ["Abrir el sobre", "Open the envelope"],
    ["Clic para copiar", "Click to copy"], ["Gato de GitHub: dale clic", "GitHub cat: click it"], ["Logo de LinkedIn: dale clic", "LinkedIn logo: click it"],
    ["Tarjeta de presentación. Clic para voltearla", "Business card. Click to flip it"], ["Apagar la consola", "Power off the console"],
    ["Quitar el sonido", "Mute sound"], ["Activar el sonido", "Turn sound on"], ["Cambiar a modo oscuro", "Switch to dark mode"],
    ["Cambiar a modo claro", "Switch to light mode"], ["BIT: abrir su menú", "BIT: open its menu"], ["Conectando", "Connecting"],
    ["Presiona cualquier tecla para encender", "Press any key to power on"], ["Consola apagada", "Console off"],
    ["Formulario de contacto", "Contact form"], ["Idioma / Language", "Language / Idioma"],
    // Lo que dice BIT
    ["¡Noqueaste a la PC! x_x", "You knocked out the PC! x_x"],
    ["¡Mira esas capturas! Dale clic a una para verla en grande.", "Check out those screenshots! Click one to see it full size."],
    ["Aquí irán las capturas. Por ahora, carta de ajuste.", "Screenshots go here. For now, a test pattern."],
    ["Correo copiado. ¡Escríbele!", "Email copied. Drop Leonel a line!"], ["Te lo dejé seleccionado para copiarlo.", "I left it selected so you can copy it."],
    ["¡Un corazón para ti! El sobre se queda abierto.", "A heart for you! The envelope stays open."], ["¡Miau! ...digo, git push.", "Meow! ...I mean, git push."],
    ["¡Se cayó LinkedIn! Ahí se queda, tirado.", "LinkedIn fell over! It's staying down there."],
    ["¡Un alien! Como el de la cápsula de Stardew Valley.", "An alien! Like the one in the Stardew Valley capsule."],
    ["...y se fue. Nadie te va a creer.", "...and it's gone. Nobody's going to believe you."],
    ["¿Escuchaste eso? Algo toca detrás de esa E...", "Did you hear that? Something's knocking behind that E..."],
    ["¡¿Lo viste?! Se apagaron las luces de repente OwO", "Did you see that?! The lights just went out OwO"],
    ["Por detrás también tiene lo suyo.", "The back has something too."], ["Modo oscuro: fósforo sobre negro.", "Dark mode: phosphor on black."],
    ["Modo claro: tinta sobre papel.", "Light mode: ink on paper."], ["Shhh... sonido apagado.", "Shhh... sound off."], ["¡Sonido de vuelta!", "Sound's back!"],
    ["Merequetengue, ya puedo hablar otra vez.", "Merequetengue, I can talk again."], ["¡Oye! Me mareo... @_@", "Hey! I'm getting dizzy... @_@"],
    ["Hola, soy BIT. Te acompaño mientras exploras.", "Hi, I'm BIT. I'll keep you company while you explore."],
    ["Hola, soy BIT. Dame clic y te llevo a cualquier sección.", "Hi, I'm BIT. Tap me and I'll take you to any section."],
    ["Psst... dale clic a la PC. No le pasa nada. Creo.", "Psst... click the PC. Nothing will happen to it. I think."],
    ["Ese monitor parpadea cuando no lo ves.", "That monitor blinks when you're not looking."],
    ["Leonel trabaja con datos todos los días. Yo, con píxeles.", "Leonel works with data every day. Me, with pixels."],
    ["Esa lista está alineada a mano, punto por punto.", "That list is aligned by hand, dot by dot."],
    ["ESTADO: disponible. Buena señal, ¿no?", "STATUS: available. Good sign, right?"],
    ["Dale <VER> a una tarjeta para ver sus imágenes.", "Hit <VIEW> on a card to see its images."],
    ["La ranura 03 sigue libre... ¿será tu proyecto?", "Slot 03 is still free... could it be your project?"],
    ["Seguros Lux lleva 341 commits. Yo llevo cero.", "Seguros Lux has 341 commits. I have zero."],
    ["Elige un ícono y la terminal busca los proyectos.", "Pick an icon and the terminal finds the projects."],
    ["¿Viste al elefante de PHP? Somos amigos.", "Did you see the PHP elephant? We're friends."],
    ["Abre un resultado: el > se voltea y salen imágenes.", "Open a result: the > flips and images come out."],
    ["Mete otro disquete: hay cuatro unidades, de A: a D:.", "Insert another floppy: there are four drives, A: to D:."],
    ["El gato de GitHub es cosquilludo. Dale clic.", "The GitHub cat is ticklish. Click it."],
    ["Escríbele, no muerde. El gato tampoco.", "Send a message, nobody bites. Not even the cat."],
    ["Psst... ¿qué pasará si das clic en exit?", "Psst... what happens if you click exit?"],
    ["La tarjeta de presentación se voltea. Pruébalo.", "The business card flips. Try it."],
  ];
  const ES_EN = new Map(DIC), EN_ES = new Map(DIC.map(([a, b]) => [b, a]));
  // Pedazos de texto (cuando el renglón trae más cosas alrededor)
  const PARCIAL = [["1 ranura libre", "1 free slot"]];
  const CD = { inicio: "home", perfil: "profile", proyectos: "projects", habilidades: "skills", contacto: "contact" };
  const CD_ES = Object.fromEntries(Object.entries(CD).map(([a, b]) => [b, a]));

  function trad(s, lang) {
    const core = s.trim();
    if (!core) return null;
    let r = (lang === "en" ? ES_EN : EN_ES).get(core);
    if (r == null) for (const [es, en] of PARCIAL) {
      const [a, b] = lang === "en" ? [es, en] : [en, es];
      if (core.includes(a)) { r = core.replace(a, b); break; }
    }
    // "C:\> cd perfil" y "Disquete A: FRONT-END insertado." llevan una parte variable
    if (r == null) {
      const m = core.match(/^C:\\> cd (\S+)$/);
      const tabla = lang === "en" ? CD : CD_ES;
      if (m && tabla[m[1]]) r = `C:\\> cd ${tabla[m[1]]}`;
    }
    if (r == null) {
      const m = core.match(lang === "en" ? /^Disquete (\S+) (.+) insertado\.$/ : /^Floppy (\S+) (.+) inserted\.$/);
      if (m) r = lang === "en" ? `Floppy ${m[1]} ${ES_EN.get(m[2]) || m[2]} inserted.` : `Disquete ${m[1]} ${EN_ES.get(m[2]) || m[2]} insertado.`;
    }
    return r == null || r === core ? null : s.replace(core, () => r);
  }
  const FUERA = ".chcp, script, style, textarea, input";
  const RAICES = () => [$("#app"), $("#buddy"), $("#apagado"), $("#intro")].filter(Boolean);
  function cambiosTexto(lang, raices = RAICES()) {
    const out = [];
    for (const raiz of raices) {
      const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = w.nextNode())) {
        if (n.parentElement && n.parentElement.closest(FUERA)) continue;
        const r = trad(n.nodeValue, lang);
        if (r != null) out.push([n, r]);
      }
    }
    return out;
  }
  function traduceAtributos(lang, raices = RAICES()) {
    for (const raiz of raices) for (const el of [raiz, ...raiz.querySelectorAll("[title],[aria-label],[placeholder]")]) {
      for (const a of ["title", "aria-label", "placeholder"]) {
        const v = el.getAttribute(a);
        if (!v) continue;
        const r = trad(v, lang);
        if (r != null) el.setAttribute(a, r);
      }
    }
  }
  // Las letras se revuelven y se acomodan, como una página de códigos que cambia
  const RUIDO = "#%&@$*+=?!/<>";
  let revolviendo = false;
  function revuelve(cambios) {
    if (RM || !cambios.length) { cambios.forEach(([n, r]) => { n.nodeValue = r; }); return Promise.resolve(); }
    revolviendo = true;
    const PASOS = 9;
    let k = 0;
    return new Promise((listo) => {
      const iv = setInterval(() => {
        k++;
        for (const [n, r] of cambios) {
          if (k >= PASOS) { n.nodeValue = r; continue; }
          const corte = Math.floor((r.length * k) / PASOS);
          let s = r.slice(0, corte);
          for (let i = corte; i < r.length; i++) s += /\s/.test(r[i]) ? r[i] : RUIDO[(Math.random() * RUIDO.length) | 0];
          n.nodeValue = s;
        }
        if (k >= PASOS) { clearInterval(iv); revolviendo = false; listo(); }
      }, 45);
    });
  }
  const META = {
    es: ["Portafolio Leonel Almanza", "Portafolio de Leonel Almanza: desarrollo web."],
    en: ["Leonel Almanza · Portfolio", "Leonel Almanza's portfolio: web development."],
  };
  function aplicaIdioma(lang, animar) {
    doc.lang = lang;
    document.title = META[lang][0];
    const md = $('meta[name="description"]');
    if (md) md.content = META[lang][1];
    traduceAtributos(lang);
    const cambios = cambiosTexto(lang);
    if (animar) return revuelve(cambios);
    cambios.forEach(([n, r]) => { n.nodeValue = r; });
    return Promise.resolve();
  }

  let idioma = "es";
  // Lo que se escribe después (BIT, <VER>/<CERRAR>, botones, el formulario, el juego) también se traduce
  new MutationObserver((muts) => {
    if (idioma === "es" || revolviendo) return;
    for (const m of muts) {
      const t = m.target;
      const el = t.nodeType === 1 ? t : t.parentElement;
      if (el && el.closest(FUERA)) continue;
      if (m.type === "characterData") { const r = trad(t.nodeValue, "en"); if (r != null) t.nodeValue = r; }
      else if (m.type === "attributes") { const v = t.getAttribute(m.attributeName); const r = v && trad(v, "en"); if (r) t.setAttribute(m.attributeName, r); }
      else m.addedNodes.forEach((n) => {
        if (n.nodeType === 3) { const r = trad(n.nodeValue, "en"); if (r != null) n.nodeValue = r; }
        else if (n.nodeType === 1) { cambiosTexto("en", [n]).forEach(([x, r]) => { x.nodeValue = r; }); traduceAtributos("en", [n]); }
      });
    }
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["title", "aria-label", "placeholder"] });

  /* ---------- El botón ES / EN del encabezado, con su mini consola ---------- */
  const lang = $(".lang");
  const chcpEl = $(".chcp"), l1 = $(".chcp-1"), l2 = $(".chcp-2");
  const pintaLang = () => $$("button[data-lang]", lang || document).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === idioma)));
  let turno = 0, cierraT = 0;
  async function chcp(nuevo) {
    if (nuevo === idioma) return;
    const yo = ++turno;
    idioma = nuevo;
    guarda("idioma", nuevo);
    pintaLang();
    const P = window.Portafolio;
    if (P) P.cuenta(`idioma-${nuevo}`);
    const cp = nuevo === "en" ? 437 : 850;
    clearTimeout(cierraT);
    if (!RM && chcpEl) {
      chcpEl.hidden = false;
      l1.textContent = "";
      l2.textContent = "";
      const cmd = `C:\\> chcp ${cp}`;
      for (let i = 1; i <= cmd.length; i++) { if (yo !== turno) return; l1.textContent = cmd.slice(0, i); await espera(34); }
      await espera(160);
      if (yo !== turno) return;
      l2.textContent = nuevo === "en" ? `Active code page: ${cp}` : `Página de códigos activa: ${cp}`;
    }
    await aplicaIdioma(nuevo, true);
    if (chcpEl) cierraT = setTimeout(() => { chcpEl.hidden = true; }, 1500);
    if (P) P.bitDice(nuevo === "en" ? "Hi! I speak English now. Code page 437, like the old days." : "¡De vuelta al español! Página 850.", "s", 3200, false, { salto: "giro", emote: "Nota" });
  }
  if (lang) lang.addEventListener("click", (e) => { const b = e.target.closest("button[data-lang]"); if (b) chcp(b.dataset.lang); });

  /* ---------- Idioma al llegar: ?lang=en, el que eligió antes, o el del navegador ---------- */
  const pedido = new URLSearchParams(location.search).get("lang");
  const navegador = (navigator.languages || [navigator.language]).some((l) => /^es/i.test(l || "")) ? "es" : "en";
  const inicial = pedido === "en" || pedido === "es" ? pedido : lee("idioma") || navegador;
  if (inicial === "en") { idioma = "en"; aplicaIdioma("en", false); }
  pintaLang();
})();
