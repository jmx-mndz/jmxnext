/* ==========================================================================
   JMX — creative.js  (creative.html only)
   3D auto-playing video-reel cover flow · Garage Rooms scroll-fanned deck · horizontal scroll
   gallery · creative library
   ========================================================================== */
(function () {
  'use strict';
  const J = window.JMX, D = window.JMX_DATA;
  if (!J || !D) return;
  const { $, $$, clamp, lerp, esc, reduce, finePointer, isMobile } = J;

  /* --- reels: 3D cover flow, every reel auto-plays muted while the
         section is on screen; tap the front reel to watch with sound */
  function reels() {
    const root = $('#reelflow');
    if (!root) return;
    const items = $$('.reel', root), n = items.length, count = $('#reelCount');
    let idx = Math.floor(n / 2), inView = false, modalOpen = false;
    const layout = () => {
      const w = items[0].offsetWidth, gap = isMobile() ? w * 0.62 : w * 0.9;
      items.forEach((el, i) => {
        const o = i - idx, a = Math.abs(o);
        el.style.transform = `translate(-50%,-50%) translate3d(${o * gap}px,0,${-a * 200}px) rotateY(${clamp(-o * 32, -64, 64)}deg)`;
        el.style.zIndex = 10 - a;
        el.style.opacity = a > 2 ? 0 : a > 1 ? 0.55 : 1;
        el.style.pointerEvents = a > 2 ? 'none' : 'auto';
        el.classList.toggle('is-active', o === 0);
      });
      count.textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
    };
    const go = i => { idx = clamp(i, 0, n - 1); layout(); };
    const vid = el => $('.reel__preview', el);
    function play(el) {
      const v = vid(el);
      if (!v.getAttribute('src')) { v.src = el.dataset.src; v.preload = 'auto'; }
      v.muted = true;
      const p = v.play();
      if (p && p.then) p.then(() => el.classList.add('is-playing')).catch(() => {});
      else el.classList.add('is-playing');
    }
    function pause(el) { const v = vid(el); if (!v.paused) v.pause(); }
    const sync = () => items.forEach(el => (inView && !modalOpen && !reduce) ? play(el) : pause(el));
    items.forEach(el => vid(el).addEventListener('playing', () => el.classList.add('is-playing')));
    if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => { inView = en.isIntersecting; sync(); }, { rootMargin: '120px 0px', threshold: 0.15 }).observe(root);
    else { inView = true; sync(); }
    document.addEventListener('visibilitychange', () => { if (document.hidden) items.forEach(pause); else sync(); });
    document.addEventListener('jmx:modalclose', () => { modalOpen = false; sync(); });

    items.forEach((el, i) => {
      $('.reel__card', el).addEventListener('click', () => {
        if (moved) return;
        if (i !== idx) { go(i); return; }
        modalOpen = true; sync();
        J.openVideo({ src: el.dataset.src, poster: el.dataset.poster, title: el.dataset.title, desc: el.dataset.desc, tag: el.dataset.tag });
      });
    });
    $('#reelPrev').addEventListener('click', () => go(idx - 1));
    $('#reelNext').addEventListener('click', () => go(idx + 1));
    let sx = null, moved = false;
    root.addEventListener('pointerdown', e => { sx = e.clientX; moved = false; });
    root.addEventListener('pointermove', e => { if (sx !== null && Math.abs(e.clientX - sx) > 12) moved = true; });
    root.addEventListener('pointerup', e => { if (sx !== null && Math.abs(e.clientX - sx) > 50) go(idx + (e.clientX < sx ? 1 : -1)); sx = null; setTimeout(() => { moved = false; }, 0); });
    root.addEventListener('keydown', e => { if (e.key === 'ArrowRight') go(idx + 1); if (e.key === 'ArrowLeft') go(idx - 1); });
    window.addEventListener('resize', layout, { passive: true });
    layout();
  }

  /* --- Garage Rooms: a stacked deck that fans out into a 3D arc as you scroll */
  function garageDeck() {
    const stage = $('#garageStage'), deck = $('#garageDeck');
    if (!stage) return;
    const cards = $$('.gr-card', deck), n = cards.length, mid = (n - 1) / 2;
    let cur = 0, tx = 0, ty = 0, mx = 0, my = 0;
    if (finePointer && !reduce) {
      stage.addEventListener('pointermove', e => { const r = stage.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5; });
      stage.addEventListener('pointerleave', () => { tx = ty = 0; });
    }
    J.onScroll(() => {
      const r = stage.getBoundingClientRect(), vh = window.innerHeight;
      if (r.bottom < -100 || r.top > vh + 100) return;
      const p = clamp((vh * 0.92 - r.top) / (vh * 0.75), 0, 1);
      cur = reduce ? 1 : lerp(cur, p, 0.09);
      mx = lerp(mx, tx, 0.08); my = lerp(my, ty, 0.08);
      const e = 1 - Math.pow(1 - cur, 3);
      const wide = stage.offsetWidth, spread = isMobile() ? wide * 0.17 : wide * 0.19;
      deck.style.transform = `rotateX(${(8 - my * 10).toFixed(2)}deg) rotateY(${(mx * 16).toFixed(2)}deg)`;
      cards.forEach((c, i) => {
        const o = i - mid, a = Math.abs(o);
        const x = o * spread * e, z = (-a * 120 * e) + (1 - e) * (-i * 14), y = (a * a * 10 * e) + (1 - e) * (i * -6);
        const ry = -o * 16 * e, rz = o * 5 * e + (1 - e) * ((i % 2 ? 1 : -1) * (2 + i));
        c.style.transform = `translate(-50%,-50%) translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${z.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg)`;
        c.style.zIndex = String(20 - Math.round(a * 2));
      });
    });
  }

  /* --- horizontal gallery: vertical scroll drives a sideways rail */
  function hscroll() {
    const track = $('#hTrack'), rail = $('#hRail');
    if (!track) return;
    const picks = [
      ['hvac', 'hvac-22.jpg'], ['roofing', '1_Before_and_After.png'], ['hvac', 'hvac-11.jpg'], ['roofing', '11_Urgency.jpg'],
      ['hvac', 'hvac-01.jpg'], ['roofing', '7_Testimonial.jpg'], ['hvac', 'hvac-30.jpg'], ['garage', 'garage-03-same-garage-different-room.jpg'], ['roofing', 'new-set/7.jpg'],
      ['hvac', 'hvac-19.jpg'], ['garage', 'garage-04-kitchen-table.jpg'], ['roofing', 'memes/3_Meme.jpg'], ['hvac', 'hvac-28.jpg'], ['roofing', '22_Offer.jpg']
    ];
    const tag = { hvac: 'Creative · Paid Social · HVAC', roofing: 'Creative · Social & Ads · Roofing', garage: 'Creative · Meta Ads · Ignite Agency' };
    rail.innerHTML = picks.map(([set, file], i) => {
      const s = D[set], it = s.items.find(x => x.file === file);
      return `<figure class="h-card" data-lb data-lb-tag="${tag[set]}" data-lb-title="${esc(it.label)}" data-lb-desc="${esc(it.sub)}.">
        <img src="${D.src(s.base, it.file)}" alt="${esc(it.label + ' — ' + it.sub)}" loading="lazy">
        <figcaption><b>${esc(it.label)}</b><span>${esc(it.sub)}</span></figcaption></figure>`;
    }).join('') + `<div class="h-card h-card--end"><b>Want ads like these?</b><a href="contact.html" class="btn btn--primary">Let's Connect ${J.icons.arrow}</a></div>`;
    J.bind(rail);
    const num = $('#hNum'), bar = $('#hBar'), total = picks.length;
    let cur = 0;
    const size = () => { if (window.innerWidth > 900) track.style.height = (rail.scrollWidth - window.innerWidth + window.innerHeight * 1.2) + 'px'; else track.style.height = ''; };
    size();
    window.addEventListener('resize', size, { passive: true });
    window.addEventListener('load', size);
    J.onScroll(() => {
      if (window.innerWidth <= 900) return;
      const p = J.stickyProgress(track);
      const max = rail.scrollWidth - window.innerWidth + 60;
      cur = reduce ? p : lerp(cur, p, 0.1);
      rail.style.transform = `translate3d(${(-cur * max).toFixed(1)}px,0,0)`;
      bar.style.transform = `scaleX(${cur.toFixed(4)})`;
      num.textContent = String(clamp(Math.round(cur * (total - 1)) + 1, 1, total)).padStart(2, '0');
      const vel = (p - cur) * 40;
      rail.style.setProperty('--skew', vel.toFixed(2));
      $$('.h-card', rail).forEach(c => c.style.setProperty('--ry', clamp(vel * -6, -12, 12).toFixed(2) + 'deg'));
    });
  }

  reels();
  garageDeck();
  hscroll();
  J.gallery($('[data-gallery]'));
  J.bind();
})();
