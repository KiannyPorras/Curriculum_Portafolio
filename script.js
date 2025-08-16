// ====== script.js (Kianny & Yulissa) ======
(function () {
  // Helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // 0) Año en el footer
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();

  // 1) Toggle claro/oscuro con persistencia
  const html = document.documentElement;
  const themeBtn = $('#themeToggle');

  // ⚑ Mostrar botón de tema SOLO en index.html o en la raíz "/"
  if (themeBtn) {
    const current = (location.pathname || '').toLowerCase();
    const file = current.split('/').pop();            // "index.html", "cv-kianny.html", "" si es raíz
    const isHome = file === '' || file === 'index.html';
    if (!isHome) themeBtn.style.display = 'none';
  }

  // Carga preferencia guardada
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') html.classList.add('dark');
  } catch (_) {}

  const updateThemeIcon = () => {
    if (!themeBtn) return;
    themeBtn.textContent = html.classList.contains('dark') ? '🌞' : '🌙';
  };
  updateThemeIcon();

  themeBtn && themeBtn.addEventListener('click', () => {
    html.classList.toggle('dark');
    const isDark = html.classList.contains('dark');
    try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch (_) {}
    updateThemeIcon();
  });

  // 2) Efecto tilt (inclinación suave) en avatares y tarjetas
  const ALLOW_TILT_ON_TOUCH = true; 
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  const enableTilt = ALLOW_TILT_ON_TOUCH || !isTouch;

  function addTilt(el, max = 10) {
    let raf = null;

    const set = (xRot, yRot, scale = 1.03) => {
      el.style.transform = `rotateX(${xRot}deg) rotateY(${yRot}deg) scale(${scale})`;
    };

    const getPoint = e => {
      const t = e.touches && e.touches[0];
      return { x: (t ? t.clientX : e.clientX), y: (t ? t.clientY : e.clientY) };
    };

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const { x, y } = getPoint(e);
      const px = (x - rect.left) / rect.width - 0.5;
      const py = (y - rect.top) / rect.height - 0.5;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => set((-py * max).toFixed(2), (px * max).toFixed(2)));
    };

    const onEnter = () => { el.style.transition = 'transform 120ms ease'; };
    const onLeave = () => { el.style.transition = 'transform 180ms ease'; set(0, 0, 1); };

    el.style.willChange = 'transform';
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);

    // soporte táctil
    el.addEventListener('touchstart', onEnter, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: true });
    el.addEventListener('touchend', onLeave, { passive: true });
  }

  if (enableTilt) {
    $$('.avatar, .card').forEach(el => addTilt(el, 10));
  }

  // 3) Filtros del portafolio (si existen en la página)
  const grid = $('#grid');
  const filterBtns = $$('.filter-btn');
  if (grid && filterBtns.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const tag = btn.dataset.filter;
        $$('.project').forEach(card => {
          const visible = tag === 'all' || (card.dataset.tags || '').includes(tag);
          card.style.display = visible ? '' : 'none';
        });
      });
    });
  }

  // 4) Mostrar #contacto al hacer clic en "Perfiles" (activar :target)
  const linkPerfiles = document.getElementById('navPerfiles');

  if (linkPerfiles) {
    linkPerfiles.addEventListener('click', (e) => {
      if (location.hash === '#contacto') return;
      e.preventDefault();
      location.hash = 'contacto'; // activa :target { display:block }
    });
  }

  // Asegurar scroll suave al llegar a #contacto
  window.addEventListener('hashchange', () => {
    if (location.hash === '#contacto') {
      document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // 5) Contacto: sincronizar Destinataria <-> Correo destino + envío demo
  const form = $('#contactForm');
  const formMsg = $('#formMsg');

  // selects (puede que correoDestino no exista aún; el código es tolerante)
  const destinatariaSelect = form ? form.querySelector('#destinataria, select[name="destinataria"]') : null;
  const correoDestinoSelect = form ? form.querySelector('#correoDestino, select[name="correoDestino"]') : null;

  // Autoselección según página de CV (si aplica)
  if (destinatariaSelect) {
    const path = (location.pathname || '').toLowerCase();
    if (path.includes('cv-kianny')) destinatariaSelect.value = 'Kianny';
    if (path.includes('cv-yulissa')) destinatariaSelect.value = 'Yulissa';
  }

  // Helpers de sync
  function personaToCorreo(persona) {
    if (!correoDestinoSelect) return;
    const opt = Array.from(correoDestinoSelect.options).find(o => o.dataset?.persona === persona);
    if (opt) correoDestinoSelect.value = opt.value;
  }
  function correoToPersona(correo) {
    if (!destinatariaSelect || !correoDestinoSelect) return;
    const opt = Array.from(correoDestinoSelect.options).find(o => o.value === correo);
    const persona = opt?.dataset?.persona;
    if (persona) destinatariaSelect.value = persona;
  }

  // Sync en cambios
  destinatariaSelect?.addEventListener('change', () => {
    if (destinatariaSelect.value) personaToCorreo(destinatariaSelect.value);
  });
  correoDestinoSelect?.addEventListener('change', () => {
    if (correoDestinoSelect.value) correoToPersona(correoDestinoSelect.value);
  });

  // Inicializar sync si ya hay persona seleccionada
  if (destinatariaSelect && destinatariaSelect.value) {
    personaToCorreo(destinatariaSelect.value);
  }

  // Envío demo
  form && form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const persona   = (data.get('destinataria') || '').toString().trim();
    const correoTo  = (data.get('correoDestino') || '').toString().trim(); // puede venir vacío si no agregaste el select
    const emailFrom = (data.get('email') || '').toString().trim();
    const mensaje   = (data.get('mensaje') || '').toString().trim();

    // Validación mínima
    if (!persona || !emailFrom || !mensaje || (correoDestinoSelect && !correoTo)) {
      if (formMsg) {
        formMsg.textContent = 'Por favor completa todos los campos.';
        formMsg.className = 'msg-error';
      }
      return;
    }

    // Aquí iría tu lógica real (fetch a tu backend / email service)
    // fetch('/api/contacto', { method: 'POST', body: data })

    if (formMsg) {
      formMsg.textContent = correoTo
        ? `¡Listo! Tu mensaje para ${persona} se enviará a ${correoTo}.`
        : `¡Listo! Tu mensaje fue dirigido a ${persona}.`;
      formMsg.className = 'msg-ok';
    }
    form.reset();

    // Reaplicar autoselección si venías de un CV
    if (destinatariaSelect) {
      const path = (location.pathname || '').toLowerCase();
      if (path.includes('cv-kianny')) destinatariaSelect.value = 'Kianny';
      if (path.includes('cv-yulissa')) destinatariaSelect.value = 'Yulissa';
      if (destinatariaSelect.value) personaToCorreo(destinatariaSelect.value);
    }
  });

})();

