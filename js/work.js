/* ==========================================================================
   JMX — work.js  (work.html only)
   Rotating gallery-wall hero · hover-to-expand builds · creative gallery
   ========================================================================== */
(function () {
  'use strict';
  const J = window.JMX, D = window.JMX_DATA;
  if (!J || !D) return;
  const { $, $$, esc, reduce } = J;

  /* --- hero: 3D gallery wall that drifts and tilts with scroll */
  function wall() {
    const plane = $('#wall');
    if (!plane) return;
    const pool = D.hvac.items.map(i => D.src(D.hvac.base, i.file))
      .concat(D.roofing.items.slice(0, 20).map(i => D.src(D.roofing.base, i.file)));
    const cols = 5, per = 5;
    let html = '';
    for (let c = 0; c < cols; c++) {
      const imgs = [];
      for (let r = 0; r < per; r++) imgs.push(pool[(c * per + r * 3) % pool.length]);
      const col = imgs.concat(imgs).map(s => `<img src="${s}" alt="" loading="lazy">`).join('');
      html += `<div class="wall__col">${col}</div>`;
    }
    plane.innerHTML = html;
    if (reduce) return;
    J.onScroll((y, changed) => { if (changed) plane.style.setProperty('--wy', (y * 0.35).toFixed(1) + 'px'); });
  }

  /* --- GHL builds: hover / tap to expand */
  function expand() {
    const root = $('#expand');
    if (!root) return;
    root.innerHTML = D.builds.map((b, i) => `
      <article class="xp${i === 0 ? ' is-open' : ''}" tabindex="0" data-cursor="${i === 0 ? '' : 'Open'}">
        <img src="${b.desktop}" alt="${esc(b.name)} website — ${esc(b.platform || 'built in GoHighLevel')}" loading="lazy">
        <span class="xp__label"><small>${String(i + 1).padStart(2, '0')}</small>${esc(b.name)}</span>
        <div class="xp__info">
          <div><span class="tag">${esc(b.type)}</span><h3>${esc(b.name)}</h3><p>${esc(b.desc)}</p></div>
          <div class="xp__btns">
            <a class="btn btn--primary btn--sm" href="${b.url}" target="_blank" rel="noopener">View live site ${J.icons.arrow}</a>
            <button class="btn btn--ghost btn--sm" type="button" data-zoom="${i}">Full screenshot</button>
          </div>
        </div>
      </article>`).join('');
    const items = $$('.xp', root);
    const open = el => items.forEach(x => { const on = x === el; x.classList.toggle('is-open', on); x.dataset.cursor = on ? '' : 'Open'; });
    items.forEach(x => {
      x.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') open(x); });
      x.addEventListener('click', e => { if (!x.classList.contains('is-open')) { e.preventDefault(); open(x); } });
      x.addEventListener('focus', () => open(x));
    });
    root.addEventListener('click', e => {
      const z = e.target.closest('[data-zoom]');
      if (!z) return;
      const b = D.builds[+z.dataset.zoom];
      J.openLightbox({ tag: (b.platform || 'GoHighLevel') + ' · Live build', title: b.name, desc: b.type + '. ' + b.desc, image: b.desktop, alt: b.name, wide: true });
    });
    J.bind(root);
  }

  wall();
  expand();
  J.gallery($('[data-gallery]'));
  J.bind();
})();
