// Brillo Hogar · script principal (los datos del negocio están en config.js)
(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const euro = (n) => n.toLocaleString("es-ES") + " €";

  /* ---------- Datos del negocio en toda la web ---------- */
  if (typeof SITE !== "undefined") {
    const waBase = `https://wa.me/${SITE.phoneIntl}`;
    const values = {
      name: SITE.name, phone: SITE.phone, email: SITE.email, hours: SITE.hours,
      legalName: SITE.legalName, nif: SITE.nif, address: SITE.address,
      city: SITE.areas && SITE.areas.length ? SITE.areas.join(", ") : ""
    };
    $$("[data-site]").forEach((el) => {
      const v = values[el.dataset.site];
      if (v) el.textContent = v;
    });
    $$("[data-site-href]").forEach((el) => {
      const t = el.dataset.siteHref;
      if (t === "tel") el.href = "tel:+" + SITE.phoneIntl;
      if (t === "mail") el.href = "mailto:" + SITE.email;
      if (t === "wa") el.href = waBase + "?text=" + encodeURIComponent("Hola, quiero pedir presupuesto de limpieza");
    });
    const areas = $("#areas");
    if (areas && SITE.areas && SITE.areas.length) {
      areas.innerHTML = "";
      SITE.areas.forEach((a) => {
        const li = document.createElement("li");
        li.textContent = a;
        areas.appendChild(li);
      });
    }
  }

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Menú móvil ---------- */
  const menuBtn = $("#menuBtn");
  const menu = $("#menu");
  if (menuBtn && menu) {
    menuBtn.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    });
    $$("a", menu).forEach((a) =>
      a.addEventListener("click", () => {
        menu.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.setAttribute("aria-label", "Abrir menú");
      })
    );
  }

  /* ---------- Antes / después ---------- */
  const pane = $("#pane");
  if (pane) {
    const range = $("input", pane);

    // Fotos reales, si están configuradas
    if (typeof SITE !== "undefined" && SITE.beforeImg && SITE.afterImg) {
      const put = (sel, src, alt) => {
        const layer = $(sel, pane);
        layer.innerHTML = "";
        const img = new Image();
        img.src = src; img.alt = alt; img.decoding = "async";
        layer.removeAttribute("aria-hidden");
        layer.appendChild(img);
      };
      put(".layer-dirty", SITE.beforeImg, "Antes de la limpieza");
      put(".layer-clean", SITE.afterImg, "Después de la limpieza");
    }

    let intro = null;
    const setPos = (v) => {
      pane.style.setProperty("--pos", v + "%");
      range.value = v;
    };
    const stopIntro = () => { if (intro) { cancelAnimationFrame(intro); intro = null; } };
    range.addEventListener("input", () => { stopIntro(); setPos(range.value); });
    range.addEventListener("pointerdown", stopIntro);

    const target = 55;
    if (reduceMotion) {
      setPos(target);
    } else {
      // Único movimiento automático de la página: la "limpieza" inicial
      const t0 = performance.now() + 500;
      const dur = 1800;
      const tick = (now) => {
        const p = Math.min(Math.max((now - t0) / dur, 0), 1);
        setPos(Math.round(target * (1 - Math.pow(1 - p, 3))));
        intro = p < 1 ? requestAnimationFrame(tick) : null;
      };
      setPos(0);
      intro = requestAnimationFrame(tick);
    }
  }

  /* ---------- Calculadora de presupuesto ---------- */
  const calc = $("#calc");
  if (calc && typeof SITE !== "undefined") {
    const P = SITE.pricing;
    const SERVICES = {
      hogar:   { label: "Limpieza de hogar",  m2h: 30, recurring: true },
      oficina: { label: "Oficina o local",    m2h: 45, recurring: true },
      fondo:   { label: "Limpieza a fondo",   m2h: 18, recurring: false },
      obra:    { label: "Fin de obra",        m2h: 14, recurring: false }
    };
    const FREQ = { puntual: "Una sola vez", mensual: "Mensual", quincenal: "Quincenal", semanal: "Semanal" };
    const EXTRA = { cristales: "Cristales", horno: "Horno", nevera: "Nevera", balcon: "Balcón o terraza" };

    $$("[data-extra]").forEach((el) => { el.textContent = "+" + euro(P.extras[el.dataset.extra]); });

    const m2 = $("#m2"), m2out = $("#m2out");
    const resPrice = $("#resPrice"), resSub = $("#resSub"), resList = $("#resList");
    const resWa = $("#resWa"), resForm = $("#resForm"), resNote = $("#resNote");
    const freqHint = $("#freqHint");
    let lastSummary = "";

    const val = (name) => (calc.querySelector(`input[name="${name}"]:checked`) || {}).value;
    const round5 = (n) => Math.round(n / 5) * 5;

    function update() {
      const svc = SERVICES[val("servicio")];
      const size = Number(m2.value);
      m2out.textContent = size + " m²";

      // Frecuencia solo para servicios recurrentes
      const freqInputs = $$('input[name="frecuencia"]', calc);
      freqInputs.forEach((i) => { i.disabled = !svc.recurring && i.value !== "puntual"; });
      if (!svc.recurring) {
        calc.querySelector('input[name="frecuencia"][value="puntual"]').checked = true;
        freqHint.textContent = "Este servicio se hace una sola vez.";
      } else {
        const d = P.discounts[val("frecuencia")] || 0;
        freqHint.textContent = d ? `Descuento por limpieza recurrente: ${Math.round(d * 100)} %.` : "";
      }
      const freq = val("frecuencia");

      const extras = $$('input[name="extra"]:checked', calc).map((i) => i.value);
      const extrasTotal = extras.reduce((s, k) => s + P.extras[k], 0);

      const hours = Math.max(2, Math.round((size / svc.m2h) * 2) / 2);
      const base = hours * P.hourly * (1 - (P.discounts[freq] || 0));
      const total = Math.max(P.minimum, base + extrasTotal);
      const lo = round5(total * 0.92);
      let hi = round5(total * 1.1);
      if (hi <= lo) hi = lo + 5;

      resPrice.textContent = `${lo}–${hi} €`;
      resSub.textContent = freq === "puntual" ? "por servicio" : "por visita";

      const rows = [
        ["Servicio", svc.label],
        ["Superficie", size + " m²"],
        ["Tiempo estimado", "unas " + String(hours).replace(".", ",") + " h"],
        ["Frecuencia", FREQ[freq]]
      ];
      if (extras.length) rows.push(["Extras", extras.map((k) => EXTRA[k]).join(", ")]);
      resList.innerHTML = "";
      rows.forEach(([k, v]) => {
        const li = document.createElement("li");
        const a = document.createElement("span"); a.textContent = k;
        const b = document.createElement("b"); b.textContent = v;
        li.append(a, b);
        resList.appendChild(li);
      });
      resNote.textContent = `Estimación orientativa, ${P.note}. El precio cerrado te lo confirmo tras ver los detalles.`;

      lastSummary =
        `Hola, quiero un presupuesto de limpieza.\n` +
        `Servicio: ${svc.label}\nSuperficie: ${size} m²\nFrecuencia: ${FREQ[freq]}` +
        (extras.length ? `\nExtras: ${extras.map((k) => EXTRA[k]).join(", ")}` : "") +
        `\nEstimación de la web: ${lo}–${hi} €`;
      resWa.href = `https://wa.me/${SITE.phoneIntl}?text=${encodeURIComponent(lastSummary)}`;
    }

    calc.addEventListener("input", update);
    calc.addEventListener("change", update);
    calc.addEventListener("submit", (e) => e.preventDefault());

    // "Prefiero el formulario": rellena servicio y mensaje con lo calculado
    resForm.addEventListener("click", () => {
      const form = $("#contactForm");
      if (!form) return;
      const map = { hogar: "Limpieza de hogar", oficina: "Oficina o local", fondo: "Limpieza a fondo", obra: "Fin de obra" };
      form.servicio.value = map[val("servicio")] || "";
      form.mensaje.value = lastSummary.replace("Hola, quiero un presupuesto de limpieza.\n", "");
    });

    update();
  }

  /* ---------- Formulario de contacto ---------- */
  const form = $("#contactForm");
  if (form && typeof SITE !== "undefined") {
    const msg = $("#formMsg");

    function read() {
      const d = new FormData(form);
      return {
        nombre: (d.get("nombre") || "").trim(),
        telefono: (d.get("telefono") || "").trim(),
        servicio: d.get("servicio") || "",
        mensaje: (d.get("mensaje") || "").trim()
      };
    }

    function validate(v) {
      $$("input, select", form).forEach((el) => el.classList.remove("invalid"));
      msg.className = "form-msg";
      const errors = [];
      if (!v.nombre) { errors.push("nombre"); form.nombre.classList.add("invalid"); }
      if (!/^[+\d][\d\s-]{7,}$/.test(v.telefono)) { errors.push("teléfono"); form.telefono.classList.add("invalid"); }
      if (!v.servicio) { errors.push("servicio"); form.servicio.classList.add("invalid"); }
      if (errors.length) {
        msg.textContent = "Revisa estos campos: " + errors.join(", ") + ".";
        msg.classList.add("error");
        return false;
      }
      if (!form.privacidad.checked) {
        msg.textContent = "Marca la casilla para aceptar la política de privacidad.";
        msg.classList.add("error");
        return false;
      }
      return true;
    }

    const text = (v) =>
      `Hola, soy ${v.nombre}. Me interesa: ${v.servicio}.\n` +
      (v.mensaje ? v.mensaje + "\n" : "") +
      `Mi teléfono: ${v.telefono}`;

    const done = (txt) => { msg.textContent = txt; msg.classList.add("ok"); form.reset(); };

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = read();
      if (!validate(v)) return;
      window.open(`https://wa.me/${SITE.phoneIntl}?text=${encodeURIComponent(text(v))}`, "_blank", "noopener");
      done("Se abrirá WhatsApp con tu mensaje listo para enviar.");
    });

    $("#mailBtn").addEventListener("click", () => {
      const v = read();
      if (!validate(v)) return;
      const subject = encodeURIComponent("Presupuesto de limpieza: " + v.servicio);
      window.location.href = `mailto:${SITE.email}?subject=${subject}&body=${encodeURIComponent(text(v))}`;
      done("Se abrirá tu programa de correo con el mensaje preparado.");
    });
  }
})();
