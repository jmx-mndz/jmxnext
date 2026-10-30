/* ==========================================================================
   JMX — automation.js  (automation.html only)
   Precision case-study tabs (keyboard accessible) · scroll-assembled
   3D screenshots · hero graph parallax
   ========================================================================== */
(function () {
  'use strict';
  const J = window.JMX;
  if (!J) return;
  const { $, $$, finePointer, reduce } = J;

  /* --- tabs */
  const tabs = $$('.pc-tabs [role="tab"]'), panels = $$('.pc-panel');
  const select = t => {
    tabs.forEach(x => { const on = x === t; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; });
    panels.forEach(p => { const on = p.dataset.panel === t.dataset.tab; p.hidden = !on; p.classList.toggle('is-on', on); });
  };
  tabs.forEach((t, i) => {
    t.tabIndex = i === 0 ? 0 : -1;
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const n = tabs[(i + d + tabs.length) % tabs.length];
      n.focus(); select(n);
    });
  });

  /* --- hero graph: nodes drift with the cursor at different depths */
  const graph = $('#graph');
  if (graph && finePointer && !reduce) {
    const nodes = $$('.node', graph);
    graph.closest('.page-hero').addEventListener('pointermove', e => {
      const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
      nodes.forEach((n, i) => { const d = 10 + (i % 3) * 8; n.style.transform = `translate(${-x * d}px, ${-y * d}px)`; });
      graph.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
    });
  }

  /* --- case study: screenshots assemble out of 3D space as they scroll in */
  const groups = $$('[data-explode]');
  if (groups.length && !reduce) {
    const state = groups.map(() => 1);
    J.onScroll(() => {
      const vh = window.innerHeight;
      groups.forEach((g, i) => {
        if (g.closest('[hidden]')) return;
        const r = g.getBoundingClientRect();
        if (r.top > vh + 200 || r.bottom < -200) return;
        const target = J.clamp((r.top - vh * 0.25) / (vh * 0.6), 0, 1);
        state[i] = J.lerp(state[i], target, 0.1);
        g.style.setProperty('--ex', state[i].toFixed(4));
      });
    });
  }

  J.bind();
})();
