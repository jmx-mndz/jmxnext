/* ==========================================================================
   JMX — contact.js  (contact.html only)
   Interactive glass cube (drag / inertia / auto-spin) · inquiry form that
   composes an email or WhatsApp message · local time
   ========================================================================== */
(function () {
  'use strict';
  const J = window.JMX;
  if (!J) return;
  const { $, $$, reduce } = J;

  /* --- glass cube */
  const stage = $('#cubeStage'), cube = $('#cube');
  if (cube) {
    let rx = -18, ry = 32, vx = 0, vy = 0, drag = false, sx = 0, sy = 0, lx = 0, ly = 0, moved = 0, hover = false;
    stage.addEventListener('pointerdown', e => { drag = true; moved = 0; sx = lx = e.clientX; sy = ly = e.clientY; vx = vy = 0; });
    window.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
      moved = Math.max(moved, Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy));
      ry += dx * 0.45; rx -= dy * 0.45; vy = dx * 0.45; vx = -dy * 0.45;
    }, { passive: true });
    window.addEventListener('pointerup', () => { drag = false; });
    stage.addEventListener('pointerenter', () => { hover = true; });
    stage.addEventListener('pointerleave', () => { hover = false; });
    J.onScroll(() => {
      if (!drag) {
        vx *= 0.93; vy *= 0.93; rx += vx; ry += vy;
        if (!reduce && !hover) ry += 0.18;
        rx += (-18 - rx) * 0.02;
      }
      rx = Math.max(-70, Math.min(70, rx));
      cube.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    });
    $$('.cube__face[data-service]', cube).forEach(face => face.addEventListener('click', e => {
      if (moved > 8) { e.preventDefault(); return; }
      const box = $(`#pick input[value="${face.dataset.service}"]`);
      if (box) {
        box.checked = true;
        const lbl = box.closest('label');
        lbl.classList.remove('is-flash'); void lbl.offsetWidth; lbl.classList.add('is-flash');
      }
      J.scrollTo('#inquiry');
    }));
  }

  /* --- inquiry form: no backend needed, composes a ready-to-send message */
  const form = $('#inquiryForm');
  if (form) {
    const err = $('#formErr');
    const compose = () => {
      const f = new FormData(form);
      const services = f.getAll('service');
      return {
        name: (f.get('name') || '').trim(), email: (f.get('email') || '').trim(),
        company: (f.get('company') || '').trim(), message: (f.get('message') || '').trim(), services
      };
    };
    const validate = d => {
      $$('.is-bad', form).forEach(el => el.classList.remove('is-bad'));
      const bad = [];
      if (!d.name) bad.push('name');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) bad.push('email');
      if (!d.message) bad.push('message');
      bad.forEach(n => form.elements[n].classList.add('is-bad'));
      err.hidden = !bad.length;
      err.textContent = bad.length ? 'Please add your ' + bad.join(', ').replace(/, ([^,]*)$/, ' and $1') + '.' : '';
      if (bad.length) form.elements[bad[0]].focus();
      return !bad.length;
    };
    const body = d => `Hi Jonathan,\n\n${d.message}\n\nServices: ${d.services.join(', ') || 'Not sure yet'}\nName: ${d.name}${d.company ? '\nBusiness: ' + d.company : ''}\nEmail: ${d.email}`;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const d = compose();
      if (!validate(d)) return;
      const subject = `Project inquiry — ${d.services.join(' / ') || 'New project'}${d.company ? ' · ' + d.company : ''}`;
      window.location.href = `mailto:jnthnmendoza09@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body(d))}`;
    });
    $('#sendWa').addEventListener('click', () => {
      const d = compose();
      if (!validate(d)) return;
      window.open('https://wa.me/639569784942?text=' + encodeURIComponent(body(d)), '_blank', 'noopener');
    });
  }

  /* --- Jonathan's local time */
  const lt = $('#localTime');
  if (lt) {
    const tick = () => {
      try { lt.textContent = 'Local time ' + new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' }) + ' (PHT)'; } catch (e) {}
    };
    tick(); setInterval(tick, 30000);
  }

  J.bind();
})();
