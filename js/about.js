/* ==========================================================================
   JMX — about.js  (about.html only)
   3D portrait tilt + light sweep · scroll-drawn experience timeline
   ========================================================================== */
(function () {
  'use strict';
  const J = window.JMX;
  if (!J) return;
  const { $, $$, clamp, finePointer, reduce } = J;

  /* --- portrait: follows the cursor, light sweeps across the glass */
  const portrait = $('#portrait');
  if (portrait && finePointer && !reduce) {
    const frame = $('.portrait__frame', portrait), shine = $('.portrait__shine', portrait);
    portrait.closest('.page-hero').addEventListener('pointermove', e => {
      const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
      frame.style.setProperty('--ry', (x * 20 - 4).toFixed(2) + 'deg');
      frame.style.setProperty('--rx', (-y * 14).toFixed(2) + 'deg');
      shine.style.setProperty('--sx', (50 - x * 100).toFixed(1) + '%');
    });
  }

  /* --- timeline: the line draws itself and lights each role as you pass it */
  const tl = $('#timeline');
  if (tl) {
    const line = $('.tl__line', tl), items = $$('.tl__item', tl);
    J.onScroll((y, changed) => {
      if (!changed && y !== 0) return;
      const r = tl.getBoundingClientRect(), mark = innerHeight * 0.6;
      const p = clamp((mark - r.top) / r.height, 0, 1);
      line.style.setProperty('--p', p.toFixed(4));
      items.forEach(it => it.classList.toggle('is-lit', it.getBoundingClientRect().top + 30 < mark));
    });
  }

  J.bind();
})();
