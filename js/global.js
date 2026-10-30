/* ==========================================================================
   JMX — global.js
   Shared behaviour for every page: loader, smooth scroll, nav + mobile menu,
   premium cursor, magnetic buttons, split-text + scroll reveals, 3D tilt,
   parallax, count-ups, page transitions, lightbox, video modal, to-top.
   Page scripts use the small API exposed on window.JMX.
   ========================================================================== */
(function () {
  'use strict';

  const doc = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isMobile = () => window.innerWidth < 768;
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };

  doc.classList.add('js');

  const JMX = window.JMX = {
    $, $$, clamp, lerp, esc, reduce, finePointer, isMobile,
    ready: false, lenis: null, scrollY: window.scrollY,
    _scrollFns: [], _readyFns: []
  };

  /* -------------------------------------------------- tiny event helpers */
  JMX.onScroll = fn => { JMX._scrollFns.push(fn); return fn; };
  JMX.onReady = fn => { JMX.ready ? fn() : JMX._readyFns.push(fn); };
  /* 0 → 1 while a tall (sticky) section scrolls through the viewport */
  JMX.stickyProgress = el => {
    const r = el.getBoundingClientRect();
    const dist = r.height - window.innerHeight;
    return dist <= 0 ? 0 : clamp(-r.top / dist, 0, 1);
  };
  /* 0 when the element's top enters from the bottom, 1 when its bottom leaves the top */
  JMX.viewProgress = el => {
    const r = el.getBoundingClientRect();
    return clamp((window.innerHeight - r.top) / (window.innerHeight + r.height), 0, 1);
  };

  /* ---------------------------------------------- injected chrome (once) */
  function injectChrome() {
    const frag = document.createElement('div');
    frag.innerHTML = `
      <div class="ambient" aria-hidden="true"></div>
      <div class="grain" aria-hidden="true"></div>
      <div class="progress" aria-hidden="true"><i></i></div>
      <div class="curtain" aria-hidden="true"></div>
      <div class="cursor" aria-hidden="true"><span></span></div>
      <div class="cursor-dot" aria-hidden="true"></div>
      <a href="#top" class="to-top" aria-label="Back to top">
        <svg viewBox="0 0 50 50" aria-hidden="true"><defs><linearGradient id="ttg" x1="0" x2="1"><stop offset="0" stop-color="#4a43fe"/><stop offset="1" stop-color="#b44dfd"/></linearGradient></defs><circle cx="25" cy="25" r="24"/></svg>
        <b aria-hidden="true">↑</b>
      </a>
      <div class="modal" id="lb" aria-hidden="true">
        <div class="modal__backdrop" data-close></div>
        <div class="modal__panel" role="dialog" aria-modal="true" aria-labelledby="lbTitle">
          <button class="modal__close" data-close type="button" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
          <div class="modal__media" id="lbMedia"></div>
          <div class="modal__body">
            <span class="tag" id="lbTag" style="align-self:flex-start"></span>
            <h3 class="h-3" id="lbTitle"></h3>
            <p id="lbDesc"></p>
            <div class="modal__ctas">
              <a href="contact.html" class="btn btn--primary">Hire Me Now ${ICON.arrow}</a>
              <a href="https://wa.me/639569784942" target="_blank" rel="noopener" class="btn btn--wa">${ICON.wa} WhatsApp</a>
            </div>
          </div>
        </div>
      </div>
      <div class="modal vmodal" id="vm" aria-hidden="true">
        <div class="modal__backdrop" data-close></div>
        <div class="modal__panel" role="dialog" aria-modal="true" aria-labelledby="vmTitle">
          <button class="modal__close" data-close type="button" aria-label="Close video"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
          <div class="vmodal__player"><video id="vmVideo" controls playsinline preload="none"></video><p class="vmodal__err" hidden>This video couldn't be loaded. Please try again in a moment.</p></div>
          <div class="modal__body">
            <span class="tag" id="vmTag" style="align-self:flex-start"></span>
            <h3 class="h-3" id="vmTitle"></h3>
            <p id="vmDesc"></p>
            <div class="modal__ctas"><a href="contact.html" class="btn btn--primary">Hire Me Now ${ICON.arrow}</a></div>
          </div>
        </div>
      </div>`;
    while (frag.firstChild) document.body.appendChild(frag.firstChild);
  }

  /* ------------------------------------------------------------- icons */
  const ICON = JMX.icons = {
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M7 7h10v10"/></svg>',
    expand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 001.5.86l11-6.5a1 1 0 000-1.72l-11-6.5A1 1 0 008 5.5z"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5.1-1.3A10 10 0 1012 2zm5.8 14.3c-.25.7-1.4 1.35-1.95 1.4-.5.05-1.1.08-1.8-.1a11 11 0 01-4.85-3.1 10 10 0 01-1.95-3.2c-.25-.65-.1-1.35.35-1.85l.5-.55c.2-.2.25-.5.1-.75l-.9-1.9c-.2-.4-.65-.45-1-.15-.6.5-1.25 1.35-1.25 2.6 0 1.65 1.2 3.6 1.4 3.85.2.25 2.4 3.85 6 5.2 3 1.1 3.4.85 4.05.75.65-.1 2.05-.85 2.35-1.65.3-.8.3-1.5.2-1.65-.1-.15-.35-.25-.7-.4z"/></svg>',
    call: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.7a2 2 0 01-.5 2.1L8 9.7a16 16 0 006.3 6.3l1.2-1.2a2 2 0 012.1-.5c.9.3 1.8.5 2.7.6a2 2 0 011.7 2.1z"/></svg>',
    bot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="9" width="16" height="11" rx="2"/><path d="M12 9V5m0 0a2 2 0 100-4 2 2 0 000 4zM8 14v1m8-1v1"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M9 15l2 2 4-4"/></svg>',
    sms: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.4 8.4 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.4 8.4 0 01-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.4 8.4 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>',
    crm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>',
    form: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.4 8.4 0 01-4.8 7.6A8.5 8.5 0 013 15.5V9a6 6 0 016-6h4a6 6 0 016 6v2.5z"/><path d="M7 9h.01M11 9h.01M15 9h.01"/></svg>',
    branch: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="2.2"/><circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="12" r="2.2"/><path d="M6 8.2V18M8 6h4a4 4 0 014 4M8 18h4a4 4 0 004-4"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6.5 7 1-5.2 5 1.3 7-6.1-3.4L5.9 21.5l1.3-7L2 9.5l7-1z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>'
  };

  JMX.flowHtml = item => '<div class="flow" style="--accent:' + (item.accent || '#7c5cff') + '">' +
    item.steps.map((s, i) => (i ? '<div class="flow__arrow"></div>' : '') +
      '<div class="flow__step"><span class="flow__icon">' + (ICON[s.icon] || '') + '</span><span class="flow__label">' + esc(s.label) + '</span></div>').join('') +
    '</div>';

  /* ============================================================ LOADER */
  function runLoader() {
    const loader = $('.loader');
    const finish = () => {
      if (JMX.ready) return;
      doc.classList.add('is-loaded');
      store.set('jmx-visited', '1');
      JMX.ready = true;
      JMX._readyFns.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
      JMX._readyFns = [];
      document.dispatchEvent(new CustomEvent('jmx:ready'));
    };
    if (!loader) { finish(); return; }

    const bar = $('.loader__bar i', loader);
    const pct = $('.loader__pct', loader);
    const firstVisit = !store.get('jmx-visited');
    const minDur = reduce ? 200 : (firstVisit ? 1700 : 650);
    const imgs = $$('img').filter(i => i.loading !== 'lazy' && !i.closest('.loader'));
    let loaded = 0;
    const total = Math.max(1, imgs.length);
    const bump = () => { loaded++; };
    imgs.forEach(img => {
      if (img.complete) bump();
      else { img.addEventListener('load', bump, { once: true }); img.addEventListener('error', bump, { once: true }); }
    });
    let winLoaded = document.readyState === 'complete';
    window.addEventListener('load', () => { winLoaded = true; }, { once: true });

    const t0 = performance.now();
    let shown = 0, prevT = t0;
    (function tick(now) {
      const elapsed = now - t0, dt = Math.max(1, now - prevT);
      prevT = now;
      const timeCap = clamp(elapsed / minDur, 0, 1);
      const real = winLoaded ? 1 : loaded / total;
      const target = Math.min(real, timeCap) * 100;
      shown = lerp(shown, target, 1 - Math.pow(0.86, dt / 16.7));
      if (target >= 100 && shown > 99.4) shown = 100;
      if (bar) bar.style.transform = 'scaleX(' + (shown / 100) + ')';
      if (pct) pct.textContent = String(Math.round(shown)).padStart(3, '0') + '%';
      if (shown >= 100 || elapsed > 5200) { setTimeout(finish, 120); return; }
      requestAnimationFrame(tick);
    })(t0);
  }

  /* ====================================================== SMOOTH SCROLL */
  function initSmoothScroll() {
    if (reduce || typeof window.Lenis !== 'function' || !finePointer) return;
    try {
      const lenis = new window.Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
      JMX.lenis = lenis;
    } catch (e) { JMX.lenis = null; }
  }
  JMX.scrollTo = (target, opts = {}) => {
    const el = typeof target === 'string' ? $(target) : target;
    const offset = opts.offset != null ? opts.offset : -(parseInt(getComputedStyle(doc).getPropertyValue('--nav-h')) || 76) - 10;
    if (JMX.lenis) JMX.lenis.scrollTo(el || 0, { offset, duration: 1.4 });
    else if (el && el.getBoundingClientRect) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: reduce ? 'auto' : 'smooth' });
    else window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };
  JMX.lockScroll = on => {
    if (JMX.lenis) on ? JMX.lenis.stop() : JMX.lenis.start();
    document.body.style.overflow = on ? 'hidden' : '';
  };

  /* ========================================================== MAIN LOOP */
  let lastY = -1;
  function loop(time) {
    if (JMX.lenis) JMX.lenis.raf(time);
    const y = window.scrollY;
    JMX.scrollY = y;
    const changed = y !== lastY;
    for (let i = 0; i < JMX._scrollFns.length; i++) JMX._scrollFns[i](y, changed, time);
    lastY = y;
    requestAnimationFrame(loop);
  }

  /* ================================================================ NAV */
  function initNav() {
    const nav = $('.nav');
    if (!nav) return;
    const page = document.body.dataset.page;
    $$('[data-page]').forEach(a => { if (a.tagName === 'A' && a.dataset.page === page) { a.classList.add('is-active'); a.setAttribute('aria-current', 'page'); } });

    let prev = window.scrollY;
    JMX.onScroll((y, changed) => {
      if (!changed) return;
      nav.classList.toggle('is-scrolled', y > 24);
      if (!doc.classList.contains('menu-open')) {
        const down = y > prev;
        if (down && y > 420 && y - prev > 2) nav.classList.add('is-hidden');
        else if (!down && prev - y > 2) nav.classList.remove('is-hidden');
      }
      prev = y;
    });

    /* compact glass menu built from the nav links */
    const burger = $('.burger', nav);
    if (!burger) return;
    const MI = {
      index: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11l9-8 9 8M5 10v10h14V10"/></svg>',
      work: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
      automation: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/></svg>',
      amazon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>',
      creative: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>',
      about: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/></svg>',
      contact: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>'
    };
    const items = [{ href: 'index.html', key: 'index', label: 'Home' }].concat(
      $$('.nav-links a', nav).map(a => ({ href: a.getAttribute('href'), key: a.dataset.page, label: a.textContent.trim() })));
    const scrim = document.createElement('div');
    scrim.className = 'menu-scrim';
    document.body.appendChild(scrim);
    const menu = document.createElement('div');
    menu.className = 'menu';
    menu.id = 'menu';
    menu.setAttribute('aria-hidden', 'true');
    const SUB = { index: 'Overview & highlights', work: 'Builds, ads & listings', automation: 'GHL, Zapier & Make', amazon: 'Listings & A+ content', creative: 'Ads, reels & social', about: 'Story & experience', contact: 'Start a project' };
    const SOC = [
      ['LinkedIn', 'https://www.linkedin.com/in/jonathan-mendoza-c/', '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="2.5" y="9" width="4" height="12"/><circle cx="4.5" cy="4.5" r="2.3"/><path d="M10.5 9h3.8v2.1h.05c.53-1 1.83-2.1 3.76-2.1 4.02 0 4.76 2.5 4.76 5.9V21h-4v-5.6c0-1.34-.02-3.06-1.87-3.06-1.87 0-2.16 1.46-2.16 2.96V21h-4V9z"/></svg>'],
      ['Instagram', 'https://www.instagram.com/mndz.jnthn/', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/></svg>'],
      ['Facebook', 'https://www.facebook.com/jonathan.mendoza.7839', '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0022 12z"/></svg>']
    ];
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-modal', 'true');
    menu.setAttribute('aria-label', 'Site menu');
    menu.innerHTML = `
      <div class="menu__glow" aria-hidden="true"></div>
      <div class="menu__head"><span class="menu__label">Navigate</span><span class="menu__status"><i></i>Open to new projects</span></div>
      <nav class="menu__links" aria-label="Mobile">${items.map((it, i) => `
        <a href="${it.href}" style="--i:${i}" class="${it.key === page ? 'is-active' : ''}"${it.key === page ? ' aria-current="page"' : ''}>
          <span class="menu__num">${String(i + 1).padStart(2, '0')}</span>
          <span class="menu__txt"><b>${esc(it.label)}</b><small>${SUB[it.key] || ''}</small></span>
          <span class="menu__go">${ICON.arrow}</span></a>`).join('')}
      </nav>
      <div class="menu__foot">
        <span class="menu__label">Quick contact</span>
        <a href="https://wa.me/639569784942" target="_blank" rel="noopener" class="menu__wa">${ICON.wa}<span><b>WhatsApp</b><small>+63 956 978 4942</small></span>${ICON.arrow}</a>
        <div class="menu__row">
          <a href="mailto:jnthnmendoza09@gmail.com" class="menu__pill">${ICON.mail}<span>Email</span></a>
          <a href="tel:+639569784942" class="menu__pill">${ICON.call}<span>Call</span></a>
          <a href="contact.html" class="menu__pill menu__pill--cta">${ICON.arrow}<span>Let's Connect</span></a>
        </div>
        <div class="menu__social">${SOC.map(([n, u, ic]) => `<a href="${u}" target="_blank" rel="noopener" aria-label="${n}">${ic}</a>`).join('')}<span class="menu__loc">Antipolo City, PH · Worldwide</span></div>
      </div>`;
    document.body.appendChild(menu);
    scrim.addEventListener('click', () => set(false));
    burger.setAttribute('aria-controls', 'menu');
    const set = open => {
      doc.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.setAttribute('aria-hidden', String(!open));
      nav.classList.remove('is-hidden');
      JMX.lockScroll(open);
      if (open) setTimeout(() => { const a = $('.menu__links a', menu); if (a) a.focus({ preventScroll: true }); }, 350);
    };
    burger.addEventListener('click', () => set(!doc.classList.contains('menu-open')));
    document.addEventListener('keydown', e => {
      if (!doc.classList.contains('menu-open')) return;
      if (e.key === 'Escape') { set(false); burger.focus(); }
      if (e.key === 'Tab') {
        const f = [burger].concat($$('a[href]', menu));
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    window.addEventListener('resize', () => { if (window.innerWidth > 1100 && doc.classList.contains('menu-open')) set(false); });
    JMX.closeMenu = () => set(false);
  }

  /* ================================================== PAGE TRANSITIONS */
  function initTransitions() {
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (href.startsWith('#')) {
        const t = href.length > 1 ? $(href) : null;
        if (href === '#top' || t) {
          e.preventDefault();
          if (JMX.closeMenu && doc.classList.contains('menu-open')) JMX.closeMenu();
          JMX.scrollTo(href === '#top' ? 0 : t, href === '#top' ? { offset: 0 } : {});
        }
        return;
      }
      if (a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.hasAttribute('download')) return;
      if (!/\.html(#.*)?$/.test(href) || /^(https?:|mailto:|tel:)/.test(href)) return;
      e.preventDefault();
      doc.classList.add('is-leaving');
      setTimeout(() => { window.location.href = href; }, reduce ? 0 : 620);
    });
    window.addEventListener('pageshow', e => { if (e.persisted) doc.classList.remove('is-leaving', 'menu-open'); });
  }

  /* ============================================================ CURSOR */
  function initCursor() {
    if (!finePointer || reduce) return;
    const ring = $('.cursor'), dot = $('.cursor-dot');
    if (!ring || !dot) return;
    const label = $('span', ring);
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, seen = false;
    window.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      if (!seen) { seen = true; rx = mx; ry = my; doc.classList.add('has-cursor'); }
    }, { passive: true });
    document.addEventListener('mouseleave', () => doc.classList.remove('has-cursor'));
    document.addEventListener('mouseenter', () => { if (seen) doc.classList.add('has-cursor'); });
    window.addEventListener('pointerdown', () => ring.classList.add('is-down'));
    window.addEventListener('pointerup', () => ring.classList.remove('is-down'));

    const sel = 'a,button,[role="button"],[data-cursor],[data-lb],label,select,.tilt';
    document.addEventListener('mouseover', e => {
      const t = e.target.closest(sel + ',input,textarea');
      ring.classList.remove('is-hover', 'is-label', 'is-text');
      dot.classList.remove('is-hidden');
      if (!t) return;
      if (t.matches('input:not([type=checkbox]):not([type=radio]):not([type=submit]),textarea')) { ring.classList.add('is-text'); dot.classList.add('is-hidden'); return; }
      const lbl = t.closest('[data-cursor]');
      if (lbl && lbl.dataset.cursor) { label.textContent = lbl.dataset.cursor; ring.classList.add('is-label'); dot.classList.add('is-hidden'); return; }
      ring.classList.add('is-hover');
    });
    JMX.onScroll(() => {
      rx = lerp(rx, mx, 0.18); ry = lerp(ry, my, 0.18);
      ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      dot.style.transform = `translate3d(${mx}px,${my}px,0)`;
    });
  }

  /* ========================================================== MAGNETIC */
  JMX.magnetize = (root = document) => {
    if (!finePointer || reduce) return;
    $$('.btn, .magnetic, .nav-social a, .burger, .arrow-btn', root).forEach(el => {
      if (el.dataset.mag) return;
      el.dataset.mag = '1';
      const k = parseFloat(el.dataset.strength || 0.28);
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
        el.classList.add('is-magnet');
        el.style.translate = `${x * k}px ${y * k * 1.2}px`;
      });
      el.addEventListener('pointerleave', () => { el.classList.remove('is-magnet'); el.style.translate = ''; });
    });
  };

  /* ======================================================= SPLIT TEXT */
  JMX.split = (root = document) => {
    $$('[data-split]', root).forEach(el => {
      if (el.dataset.splitDone) return;
      el.dataset.splitDone = '1';
      let n = 0;
      const walk = (node, grad) => {
        Array.from(node.childNodes).forEach(child => {
          if (child.nodeType === 3) {
            const parts = child.textContent.split(/(\s+)/);
            const frag = document.createDocumentFragment();
            parts.forEach(p => {
              if (!p) return;
              if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
              const w = document.createElement('span'); w.className = 'w';
              const wi = document.createElement('span'); wi.className = 'wi' + (grad ? ' grad' : '');
              wi.style.setProperty('--wi', n++); wi.textContent = p;
              w.appendChild(wi); frag.appendChild(w);
            });
            child.replaceWith(frag);
          } else if (child.nodeType === 1 && child.tagName !== 'BR') {
            const g = grad || child.classList.contains('grad');
            if (child.classList.contains('grad')) child.classList.remove('grad');
            walk(child, g);
          }
        });
      };
      walk(el, el.classList.contains('grad'));
      if (el.classList.contains('grad')) el.classList.remove('grad');
    });
  };

  /* ============================================================ REVEAL */
  let revealIO = null;
  JMX.reveal = (root = document) => {
    $$('[data-stagger]', root).forEach(g => {
      Array.from(g.children).forEach((c, i) => {
        c.style.setProperty('--i', i % 12);
        if (!c.hasAttribute('data-reveal')) c.setAttribute('data-reveal', g.dataset.stagger || 'up');
      });
    });
    const els = $$('[data-reveal],[data-split],[data-inview]', root).filter(el => !el.classList.contains('is-in'));
    if (!('IntersectionObserver' in window) || reduce) { els.forEach(el => el.classList.add('is-in')); return; }
    if (!revealIO) {
      revealIO = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          const t = en.target;
          t.classList.add('is-in');
          revealIO.unobserve(t);
          /* hand the element back to its own transforms (tilt, parallax…) once revealed */
          if (t.hasAttribute('data-reveal')) {
            const i = parseFloat(getComputedStyle(t).getPropertyValue('--i')) || 0;
            setTimeout(() => { t.removeAttribute('data-reveal'); }, 1350 + i * 90);
          }
        });
      }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    }
    els.forEach(el => revealIO.observe(el));
  };

  /* ========================================================== COUNT-UP */
  JMX.counters = (root = document) => {
    const els = $$('[data-count]', root);
    if (!els.length) return;
    const fmt = (el, v) => {
      const d = parseInt(el.dataset.decimals || 0, 10);
      el.textContent = (el.dataset.prefix || '') + v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) + (el.dataset.suffix || '');
    };
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(el => fmt(el, parseFloat(el.dataset.count))); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target, end = parseFloat(el.dataset.count), t0 = performance.now(), dur = 1800;
        (function step(now) {
          const p = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 4);
          fmt(el, end * e);
          if (p < 1) requestAnimationFrame(step);
        })(t0);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    els.forEach(el => { fmt(el, 0); io.observe(el); });
  };

  /* ============================================================== TILT */
  JMX.tilt = (root = document) => {
    if (!finePointer || reduce) return;
    $$('.tilt', root).forEach(card => {
      if (card.dataset.tiltOn) return;
      card.dataset.tiltOn = '1';
      const max = parseFloat(card.dataset.tiltMax || 8);
      if (!card.querySelector(':scope > .tilt-glare') && card.tagName !== 'IMG') {
        const g = document.createElement('span'); g.className = 'tilt-glare'; g.setAttribute('aria-hidden', 'true');
        card.appendChild(g);
      }
      card.addEventListener('pointerenter', () => { card.classList.add('is-tilting'); card.style.setProperty('--lift', card.dataset.lift || '-6px'); });
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--rx', ((0.5 - y) * max).toFixed(2) + 'deg');
        card.style.setProperty('--ry', ((x - 0.5) * max).toFixed(2) + 'deg');
        card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('is-tilting');
        card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); card.style.setProperty('--lift', '0px');
      });
    });
  };

  /* ========================================================== PARALLAX */
  function initParallax() {
    if (reduce) return;
    let items = [];
    const collect = () => { items = $$('[data-speed]').map(el => ({ el, s: parseFloat(el.dataset.speed) || 0 })); };
    collect();
    JMX.refreshParallax = collect;
    JMX.onScroll((y, changed) => {
      if (!changed && y !== 0) return;
      const vh = window.innerHeight, k = isMobile() ? 0.5 : 1;
      for (const it of items) {
        const r = it.el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        const off = (r.top + r.height / 2 - vh / 2) * -it.s * k;
        it.el.style.translate = `0 ${off.toFixed(1)}px`;
      }
    });
  }

  /* ===================================================== PROGRESS BAR */
  function initProgress() {
    const bar = $('.progress i'), top = $('.to-top');
    JMX.onScroll((y, changed) => {
      if (!changed) return;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? clamp(y / h, 0, 1) : 0;
      if (bar) bar.style.transform = `scaleX(${p})`;
      if (top) { top.classList.toggle('is-on', y > 900); top.style.setProperty('--off', (150.8 * (1 - p)).toFixed(1)); }
    });
  }

  /* ========================================================== LIGHTBOX */
  let lastFocus = null;
  function openModal(m) {
    lastFocus = document.activeElement;
    m.classList.add('is-open');
    m.setAttribute('aria-hidden', 'false');
    JMX.lockScroll(true);
    setTimeout(() => { const c = $('.modal__close', m); if (c) c.focus({ preventScroll: true }); }, 60);
  }
  function closeModal(m) {
    if (!m.classList.contains('is-open')) return;
    m.classList.remove('is-open');
    m.setAttribute('aria-hidden', 'true');
    JMX.lockScroll(false);
    if (m.id === 'vm') { const v = $('#vmVideo'); v.pause(); setTimeout(() => { v.removeAttribute('src'); v.load(); }, 400); }
    document.dispatchEvent(new CustomEvent('jmx:modalclose'));
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  JMX.openLightbox = item => {
    const m = $('#lb');
    const media = $('#lbMedia');
    if (item.mediaHtml) media.innerHTML = item.mediaHtml;
    else if (item.image) media.innerHTML = '<img src="' + esc(item.image) + '" alt="' + esc(item.alt || item.title || '') + '">';
    else if (item.steps) media.innerHTML = JMX.flowHtml(item);
    else media.innerHTML = '';
    $('#lbTag').textContent = item.tag || 'Highlight';
    $('#lbTitle').textContent = item.title || '';
    $('#lbDesc').textContent = item.desc || item.blurb || '';
    m.classList.toggle('is-wide', !!item.wide);
    media.scrollTop = 0;
    openModal(m);
  };
  JMX.openVideo = item => {
    const m = $('#vm'), v = $('#vmVideo'), err = $('.vmodal__err', m);
    err.hidden = true;
    $('#vmTag').textContent = item.tag || 'Video';
    $('#vmTitle').textContent = item.title || '';
    $('#vmDesc').textContent = item.desc || '';
    if (item.poster) v.poster = item.poster;
    v.src = item.src;
    v.onerror = () => { err.hidden = false; };
    openModal(m);
    const p = v.play(); if (p && p.catch) p.catch(() => {});
  };
  function initModals() {
    $$('.modal').forEach(m => {
      $$('[data-close]', m).forEach(b => b.addEventListener('click', () => closeModal(m)));
    });
    document.addEventListener('keydown', e => {
      const open = $('.modal.is-open');
      if (!open) return;
      if (e.key === 'Escape') closeModal(open);
      if (e.key === 'Tab') {
        const f = $$('a[href],button,video[controls]', open).filter(x => x.offsetParent !== null);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    /* any [data-lb] element opens the lightbox */
    const fromEl = el => {
      const img = el.tagName === 'IMG' ? el : el.querySelector('img');
      JMX.openLightbox({
        tag: el.dataset.lbTag, title: el.dataset.lbTitle, desc: el.dataset.lbDesc,
        image: el.dataset.lbSrc || (img ? img.getAttribute('src') : ''),
        alt: img ? img.getAttribute('alt') : '', wide: el.dataset.lbWide === 'true'
      });
    };
    document.addEventListener('click', e => {
      const el = e.target.closest('[data-lb]');
      if (!el || e.target.closest('a[href]')) return;
      fromEl(el);
    });
    document.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && document.activeElement && document.activeElement.matches('[data-lb]')) {
        e.preventDefault(); fromEl(document.activeElement);
      }
    });
  }
  JMX.a11yLb = (root = document) => $$('[data-lb]', root).forEach(el => {
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
    if (!el.dataset.cursor) el.dataset.cursor = 'View';
  });

  /* ================================================ HERO PARTICLE FIELD */
  JMX.particles = canvas => {
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w, h, pts = [], mouse = { x: -9999, y: -9999 }, visible = true;
    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(80, Math.floor(w * h / 16000));
      pts = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, r: Math.random() * 1.6 + .5 }));
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });
    canvas.parentElement.parentElement.addEventListener('pointermove', e => {
      const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(canvas);
    const max = 140;
    (function frame() {
      requestAnimationFrame(frame);
      if (!visible) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        if (!reduce) { p.x += p.vx; p.y += p.vy; }
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
        if (d < 120) { p.x += dx / d * 1.2; p.y += dy / d * 1.2; }
      }
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < max) { ctx.strokeStyle = `rgba(130,110,255,${(1 - d / max) * .22})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
        ctx.fillStyle = 'rgba(190,170,255,.75)'; ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
      }
    })();
  };

  /* ===================================================== CTA PORTAL */
  function initPortal() {
    const portals = $$('.cta-portal');
    if (!portals.length || reduce) return;
    JMX.onScroll((y, changed) => {
      if (!changed) return;
      portals.forEach(p => {
        const ring = $('.cta-portal__ring', p);
        if (!ring) return;
        const t = JMX.viewProgress(p);
        ring.style.setProperty('--s', (0.45 + t * 0.85).toFixed(3));
      });
    });
  }


  /* ================================================ CREATIVE GALLERY */
  /* JMX.gallery(rootEl) — needs window.JMX_DATA. Markup hooks:
     [data-g-tabs] [data-g-filters] [data-g-desc] [data-g-grid] [data-g-more] */
  JMX.gallery = root => {
    const D = window.JMX_DATA;
    if (!root || !D) return;
    const sets = {
      hvac: { data: D.hvac, label: 'Regas Media · HVAC', tag: 'Creative · Paid Social · HVAC', desc: '32 Meta & Google ad creatives designed for HVAC lead generation, produced for Regas Media’s HVAC clients.' },
      roofing: { data: D.roofing, label: 'North City Roofing', tag: 'Creative · Social & Ads · Roofing', desc: '54 creatives for North City Roofing — before/after transformations, testimonials, urgency and offer ads, educational and engagement posts, and memes.' },
      garage: { data: D.garage, label: 'Ignite · Garage Rooms', tag: 'Creative · Meta Ads · Ignite Agency', desc: 'Meta ad creative for Garage Rooms (garage conversions, Sussex UK), produced with Ignite Agency — before/after, home-office and annex angles.' }
    };
    Object.keys(sets).forEach(k => { if (!sets[k].data) delete sets[k]; });
    const tabs = $('[data-g-tabs]', root), filters = $('[data-g-filters]', root), desc = $('[data-g-desc]', root),
      grid = $('[data-g-grid]', root), more = $('[data-g-more]', root);
    const PAGE = isMobile() ? 8 : 12;
    let set = 'hvac', cat = 'All', shown = PAGE;
    tabs.innerHTML = Object.keys(sets).map(k => `<button type="button" data-k="${k}">${sets[k].label}<small>${sets[k].data.items.length}</small></button>`).join('');
    function list() { const it = sets[set].data.items; return cat === 'All' ? it : it.filter(x => x.cat === cat); }
    function draw() {
      const s = sets[set], items = list();
      $$('button', tabs).forEach(b => b.classList.toggle('is-on', b.dataset.k === set));
      desc.textContent = s.desc;
      const cats = ['All', ...new Set(s.data.items.map(x => x.cat).filter(Boolean))];
      filters.hidden = cats.length < 2;
      filters.innerHTML = cats.length < 2 ? '' : cats.map(c => `<button type="button" class="${c === cat ? 'is-on' : ''}" data-c="${esc(c)}">${esc(c)}</button>`).join('');
      grid.innerHTML = items.slice(0, shown).map((it, i) => {
        const src = D.src(s.data.base, it.file);
        return `<figure class="g-tile tilt" style="--i:${i % PAGE}" data-lb data-lb-tag="${esc(s.tag)}" data-lb-title="${esc(it.label)}" data-lb-desc="${esc(it.sub + '. ' + s.desc)}">
          <img src="${src}" alt="${esc(it.label + ' — ' + it.sub)}" loading="lazy">
          <figcaption class="g-tile__cap"><b>${esc(it.label)}</b><span>${esc(it.sub)}</span></figcaption></figure>`;
      }).join('');
      more.hidden = items.length <= shown;
      more.querySelector('button').textContent = `Show all ${items.length}`;
      JMX.a11yLb(grid); JMX.tilt(grid);
    }
    tabs.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; set = b.dataset.k; cat = 'All'; shown = PAGE; draw(); });
    filters.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; cat = b.dataset.c; shown = PAGE; draw(); });
    more.querySelector('button').addEventListener('click', () => { shown = 999; draw(); });
    draw();
  };

  /* ============================================================== BOOT */
  JMX.bind = (root = document) => {
    JMX.split(root); JMX.a11yLb(root); JMX.tilt(root); JMX.magnetize(root);
    if (JMX.ready) { JMX.reveal(root); JMX.counters(root); }
    if (JMX.refreshParallax) JMX.refreshParallax();
  };

  function boot() {
    injectChrome();
    initSmoothScroll();
    initNav();
    initTransitions();
    initCursor();
    initModals();
    initProgress();
    initParallax();
    initPortal();
    $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
    $$('canvas[data-particles]').forEach(JMX.particles);
    JMX.split(); JMX.a11yLb(); JMX.tilt(); JMX.magnetize();
    JMX.onReady(() => { JMX.reveal(); JMX.counters(); });
    requestAnimationFrame(loop);
    runLoader();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
