/* ============================================================
   JMX — Horizontal Reel Slider (Creative page)
   Vanilla JS, no dependencies. Safe to load on any page:
   it exits immediately if #reels isn't present.
   ============================================================ */
(function reelSlider() {
  'use strict';

  const root = document.getElementById('reels');
  if (!root) return;

  /* ---- settings ---- */
  const WHEEL_STEPS_CARDS = true;   // vertical mouse-wheel over the track steps card-by-card (releases at the ends)
  const WHEEL_COOLDOWN = 450;       // ms between wheel steps
  const DRAG_THRESHOLD = 6;         // px before a press becomes a drag
  const FLICK_VELOCITY = 0.45;      // px/ms — fast flick advances one card

  const track = root.querySelector('.reel-track');
  const slides = Array.from(track.querySelectorAll('.reel-slide'));
  const prevBtn = root.querySelector('[data-reel-prev]');
  const nextBtn = root.querySelector('[data-reel-next]');
  const curEl = root.querySelector('[data-reel-current]');
  const totEl = root.querySelector('[data-reel-total]');
  const thumb = root.querySelector('.reel-progress-thumb');
  const n = slides.length;
  if (!n) return;

  const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  const behavior = () => (reduceMQ.matches ? 'auto' : 'smooth');
  const pad = v => String(v).padStart(2, '0');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  let active = 0;
  let pending = null;       // index we're currently gliding to
  let pendingTimer = 0;
  let raf = 0;

  if (totEl) totEl.textContent = pad(n);
  if (thumb) thumb.style.width = (100 / n) + '%';

  /* ---------------- geometry ---------------- */
  const targetLeft = i => {
    const s = slides[i];
    return s.offsetLeft - (track.clientWidth - s.offsetWidth) / 2;
  };
  const nearest = () => {
    const x = track.scrollLeft;
    let best = 0, bestD = Infinity;
    for (let i = 0; i < n; i++) {
      const d = Math.abs(targetLeft(i) - x);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  };

  function goTo(i, instant) {
    i = clamp(i, 0, n - 1);
    pending = i;
    clearTimeout(pendingTimer);
    pendingTimer = setTimeout(() => { pending = null; }, 650);
    track.scrollTo({ left: targetLeft(i), behavior: instant ? 'auto' : behavior() });
  }

  /* ---------------- state sync ---------------- */
  function update() {
    raf = 0;
    const idx = nearest();
    if (idx !== active || !slides[idx].classList.contains('is-active')) {
      active = idx;
      slides.forEach((s, k) => s.classList.toggle('is-active', k === idx));
      if (curEl) curEl.textContent = pad(idx + 1);
    }
    const max = track.scrollWidth - track.clientWidth;
    const frac = max > 0 ? clamp(track.scrollLeft / max, 0, 1) : 0;
    if (thumb) thumb.style.transform = `translateX(${frac * (n - 1) * 100}%)`;
    setArrow(prevBtn, track.scrollLeft <= 2);
    setArrow(nextBtn, track.scrollLeft >= max - 2);
  }
  function setArrow(btn, disabled) {
    if (btn) btn.setAttribute('aria-disabled', disabled ? 'true' : 'false');
  }
  const queueUpdate = () => { if (!raf) raf = requestAnimationFrame(update); };

  track.addEventListener('scroll', queueUpdate, { passive: true });
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => { track.scrollTo({ left: targetLeft(active), behavior: 'auto' }); queueUpdate(); }).observe(track);
  } else {
    window.addEventListener('resize', () => { goTo(active, true); queueUpdate(); });
  }

  /* ---------------- arrows ---------------- */
  const step = d => { goTo((pending !== null ? pending : active) + d); };
  prevBtn && prevBtn.addEventListener('click', () => step(-1));
  nextBtn && nextBtn.addEventListener('click', () => step(1));

  /* ---------------- mouse wheel ---------------- */
  let wheelAt = 0;
  track.addEventListener('wheel', e => {
    if (!WHEEL_STEPS_CARDS || e.ctrlKey) return;
    if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;      // horizontal trackpad / shift+wheel → native
    const dir = Math.sign(e.deltaY);
    if (!dir) return;
    const cur = pending !== null ? pending : active;
    if ((dir > 0 && cur >= n - 1) || (dir < 0 && cur <= 0)) return; // at an end → let the page scroll
    e.preventDefault();
    const now = performance.now();
    if (now - wheelAt < WHEEL_COOLDOWN) return;
    wheelAt = now;
    goTo(cur + dir);
  }, { passive: false });

  /* ---------------- click-and-drag (mouse only; touch scrolls natively) ---------------- */
  let down = false, moved = false, suppressClick = false;
  let startX = 0, startScroll = 0, startIdx = 0, lastX = 0, lastT = 0, vel = 0, settleTimer = 0;

  track.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    down = true; moved = false; suppressClick = false;
    startX = lastX = e.clientX;
    startScroll = track.scrollLeft;
    startIdx = active;
    lastT = performance.now(); vel = 0;
    clearTimeout(settleTimer);
  });
  window.addEventListener('pointermove', e => {
    if (!down) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > DRAG_THRESHOLD) {
      moved = true;
      track.classList.add('is-dragging');
      try { track.setPointerCapture(e.pointerId); } catch (_) {}
    }
    if (!moved) return;
    track.scrollLeft = startScroll - dx;
    const now = performance.now(), dt = now - lastT;
    if (dt > 0) vel = vel * 0.6 + ((e.clientX - lastX) / dt) * 0.4;
    lastX = e.clientX; lastT = now;
  });
  const endDrag = () => {
    if (!down) return;
    down = false;
    if (!moved) return;
    suppressClick = true;
    let i = nearest();
    if (Math.abs(vel) > FLICK_VELOCITY) i = startIdx + (vel < 0 ? 1 : -1);
    goTo(i);
    settleTimer = setTimeout(() => track.classList.remove('is-dragging'), 650);
  };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  // a drag must never open a video
  track.addEventListener('click', e => {
    if (suppressClick) { e.preventDefault(); e.stopPropagation(); suppressClick = false; }
  }, true);

  /* ---------------- keyboard ---------------- */
  const cards = slides.map(s => s.querySelector('.reel-card'));
  track.addEventListener('keydown', e => {
    const idx = cards.indexOf(document.activeElement);
    if (idx < 0) return;
    let to = null;
    if (e.key === 'ArrowRight') to = idx + 1;
    else if (e.key === 'ArrowLeft') to = idx - 1;
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = n - 1;
    if (to === null) return;
    e.preventDefault();
    to = clamp(to, 0, n - 1);
    cards[to].focus({ preventScroll: true });
    goTo(to);
  });
  // keyboard focus (Tab) brings the card to the centre
  cards.forEach((c, i) => c.addEventListener('focus', () => {
    if (c.matches(':focus-visible')) goTo(i);
  }));

  /* ---------------- lazy poster / first-frame loading ---------------- */
  function loadMedia(slide) {
    const media = slide.querySelector('.reel-media');
    const img = media.querySelector('.reel-poster');
    const vid = media.querySelector('.reel-preview');
    const poster = slide.dataset.poster;
    const src = slide.dataset.video;

    const useFrame = () => {                 // fallback: show the video's own first frame
      if (!vid || vid.getAttribute('src')) return;
      vid.muted = true;
      vid.preload = 'metadata';
      vid.addEventListener('loadeddata', () => media.classList.add('has-frame'), { once: true });
      vid.src = src + '#t=0.1';              // metadata only — never plays
    };

    if (poster && img) {
      img.addEventListener('load', () => media.classList.add('has-poster'), { once: true });
      img.addEventListener('error', () => { img.remove(); useFrame(); }, { once: true });
      img.src = poster;
    } else {
      useFrame();
    }
  }
  if ('IntersectionObserver' in window) {
    const lazy = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { loadMedia(en.target); lazy.unobserve(en.target); }
      });
    }, { root: null, rootMargin: '0px 400px 0px 400px', threshold: 0.01 });
    slides.forEach(s => lazy.observe(s));
  } else {
    slides.forEach(loadMedia);
  }

  /* ---------------- video modal ---------------- */
  const modal = document.getElementById('reelModal');
  if (modal) {
    const video = modal.querySelector('#reelModalVideo');
    const errEl = modal.querySelector('.reel-modal-error');
    const titleEl = modal.querySelector('#reelModalTitle');
    const descEl = modal.querySelector('#reelModalDesc');
    const tagEl = modal.querySelector('#reelModalTag');
    const closeBtn = modal.querySelector('.reel-modal-close');
    let trigger = null;

    const pauseEverything = () => document.querySelectorAll('video').forEach(v => { if (!v.paused) v.pause(); });
    const isOpen = () => modal.classList.contains('open');

    function open(i, from) {
      const s = slides[i];
      pauseEverything();                       // never two videos at once
      trigger = from || document.activeElement;
      titleEl.textContent = s.dataset.title || '';
      descEl.textContent = s.dataset.desc || '';
      tagEl.textContent = s.dataset.tag || '';
      errEl.hidden = true;
      const posterImg = s.querySelector('.reel-poster');
      if (posterImg && posterImg.complete && posterImg.naturalWidth) video.poster = posterImg.src;
      else video.removeAttribute('poster');
      video.src = s.dataset.video;
      video.load();
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add('reel-lock');
      closeBtn.focus({ preventScroll: true });
      const p = video.play();                  // user gesture → sound allowed
      if (p && p.catch) p.catch(() => {});     // autoplay refused? controls are right there
    }

    function close() {
      if (!isOpen()) return;
      video.pause();
      video.removeAttribute('src');            // stop buffering, free memory
      video.removeAttribute('poster');
      video.load();
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove('reel-lock');
      if (trigger && trigger.focus) trigger.focus({ preventScroll: true });
      trigger = null;
    }

    video.addEventListener('error', () => { if (video.getAttribute('src')) errEl.hidden = false; });

    cards.forEach((c, i) => c.addEventListener('click', () => open(i, c)));
    modal.querySelectorAll('[data-reel-close]').forEach(el => el.addEventListener('click', close));

    document.addEventListener('keydown', e => {
      if (!isOpen()) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key === 'Tab') {                   // keep focus inside the dialog
        const f = Array.from(modal.querySelectorAll('button, [href], video[controls], [tabindex]:not([tabindex="-1"])'))
          .filter(el => !el.hidden && el.offsetParent !== null);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        else if (!modal.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      }
    });

    document.addEventListener('visibilitychange', () => { if (document.hidden && isOpen()) video.pause(); });
    window.addEventListener('pagehide', () => { video.pause(); });
  }

  /* ---------------- init ---------------- */
  track.scrollTo({ left: targetLeft(0), behavior: 'auto' });
  update();
})();
