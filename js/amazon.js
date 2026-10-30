/* ==========================================================================
   JMX — amazon.js  (amazon.html only)
   Depth-layer hero (mouse-driven 3D) + sticky stacking case cards
   ========================================================================== */
(function () {
  'use strict';
  const J = window.JMX;
  if (!J) return;
  const { $, $$, clamp, lerp, finePointer, reduce, isMobile } = J;

  /* --- hero layers: real translateZ depth, scene rotates toward the cursor */
  const layers = $('#layers');
  if (layers) {
    const inner = document.createElement('div');
    inner.className = 'layers__inner';
    while (layers.firstChild) inner.appendChild(layers.firstChild);
    layers.appendChild(inner);
    $$('[data-z]', inner).forEach(el => { el.style.transform = `translateZ(${isMobile() ? el.dataset.z / 2 : el.dataset.z}px)`; });
    let tx = -0.35, ty = 0.2, x = tx, y = ty;
    inner.style.transform = 'rotateY(-14deg) rotateX(8deg)';
    if (finePointer && !reduce) {
      window.addEventListener('pointermove', e => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; }, { passive: true });
      J.onScroll(() => {
        x = lerp(x, tx, 0.06); y = lerp(y, ty, 0.06);
        inner.style.transform = `rotateY(${(-10 + x * 22).toFixed(2)}deg) rotateX(${(8 - y * 16).toFixed(2)}deg)`;
      });
    }
  }

  /* --- deck: earlier cards sink back as the next one slides over them */
  const cards = $$('.deck__card');
  if (cards.length && !reduce) {
    J.onScroll((y, changed) => {
      if (!changed || window.innerWidth <= 900) return;
      cards.forEach((c, i) => {
        const next = cards[i + 1];
        if (!next) return;
        const stickTop = parseFloat(getComputedStyle(next).top) || 0;
        const p = clamp(1 - (next.getBoundingClientRect().top - stickTop) / c.offsetHeight, 0, 1);
        c.style.transform = `scale(${(1 - p * 0.06).toFixed(4)})`;
        c.style.filter = `brightness(${(1 - p * 0.45).toFixed(3)})`;
      });
    });
  }

  J.bind();
})();
