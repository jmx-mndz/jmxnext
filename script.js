// ============================================================
// JMX — script.js
// ============================================================

/* ---------- Nav scroll + mobile toggle ---------- */
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

/* ---------- Mobile / tablet drawer menu ---------- */
(function mobileDrawer() {
  if (!nav || !navToggle || !navLinks) return;
  const mq = window.matchMedia('(max-width: 1024px)');

  // Animated burger that morphs into an X
  navToggle.type = 'button';
  navToggle.innerHTML = '<span class="burger" aria-hidden="true"><i></i><i></i><i></i></span>';
  navToggle.setAttribute('aria-controls', 'navLinks');
  navToggle.setAttribute('aria-label', 'Open menu');

  // Dimmed backdrop behind the drawer
  const backdrop = document.createElement('div');
  backdrop.className = 'nav-backdrop';
  document.body.appendChild(backdrop);

  // Drawer label + footer (CTA + socials), built from the existing nav
  if (!navLinks.querySelector('.drawer-label')) {
    const label = document.createElement('span');
    label.className = 'drawer-label';
    label.textContent = 'Menu';
    navLinks.prepend(label);

    const foot = document.createElement('div');
    foot.className = 'drawer-foot';
    const cta = document.querySelector('.nav-cta .btn-primary');
    if (cta) { const c = cta.cloneNode(true); c.classList.remove('btn-sm'); foot.appendChild(c); }
    const social = document.querySelector('.nav-cta .nav-social');
    if (social) foot.appendChild(social.cloneNode(true));
    navLinks.appendChild(foot);
  }

  const isOpen = () => navLinks.classList.contains('open');

  function open() {
    nav.classList.add('menu-open');
    navLinks.classList.add('open');
    backdrop.classList.add('show');
    document.documentElement.classList.add('menu-open');
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Close menu');
    setTimeout(() => navLinks.querySelector('a')?.focus({ preventScroll: true }), 300);
  }
  function close(returnFocus) {
    nav.classList.remove('menu-open');
    navLinks.classList.remove('open');
    backdrop.classList.remove('show');
    document.documentElement.classList.remove('menu-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open menu');
    if (returnFocus) navToggle.focus({ preventScroll: true });
  }

  navToggle.addEventListener('click', () => (isOpen() ? close(true) : open()));
  backdrop.addEventListener('click', () => close(true));
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => close(false)));

  // Esc to close + keep keyboard focus inside the open menu
  document.addEventListener('keydown', e => {
    if (!isOpen()) return;
    if (e.key === 'Escape') { close(true); return; }
    if (e.key === 'Tab') {
      const items = [navToggle, ...navLinks.querySelectorAll('a[href]')];
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Swipe right to close
  let startX = null, startY = null;
  navLinks.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX; startY = e.touches[0].clientY;
  }, { passive: true });
  navLinks.addEventListener('touchend', e => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = Math.abs(e.changedTouches[0].clientY - startY);
    if (dx > 70 && dy < 60) close(false);
    startX = startY = null;
  }, { passive: true });

  // Close automatically if the screen grows to desktop size
  const onChange = e => { if (!e.matches) close(false); };
  mq.addEventListener ? mq.addEventListener('change', onChange) : mq.addListener(onChange);
})();

/* ---------- Active nav link (multi-page) ---------- */
(function activeNav() {
  const page = document.body.dataset.page;
  if (!page) return;
  document.querySelectorAll('.nav-links a[data-page], .footer-links a[data-page]').forEach(a => {
    if (a.dataset.page === page) a.classList.add('active');
  });
})();

/* ---------- Page transition on internal link clicks ---------- */
document.querySelectorAll('a[href$=".html"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const url = a.getAttribute('href');
    if (a.target === '_blank' || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    document.body.classList.add('leaving');
    setTimeout(() => { window.location.href = url; }, 320);
  });
});

/* ---------- Scroll progress bar ---------- */
(function scrollProgress() {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);
  const update = () => {
    const h = document.documentElement;
    const scrolled = h.scrollTop;
    const height = h.scrollHeight - h.clientHeight;
    bar.style.width = height > 0 ? `${(scrolled / height) * 100}%` : '0%';
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
})();

/* ---------- Scroll reveal (with stagger) ---------- */
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const group = e.target.closest('[data-stagger]') ? e.target : e.target;
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => io.observe(el));

  // stagger children of grids marked with data-stagger
  document.querySelectorAll('[data-stagger]').forEach(group => {
    const kids = Array.from(group.children);
    kids.forEach((kid, i) => {
      kid.classList.add('reveal', 'stagger');
      kid.style.setProperty('--d', `${Math.min(i * 0.07, 0.5)}s`);
      io.observe(kid);
    });
  });
} else {
  revealEls.forEach(el => el.classList.add('in'));
}

/* ---------- Tilt + cursor glow + shine sweep on cards ---------- */
(function tiltCards() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;
  document.querySelectorAll('.tilt').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const px = (x / r.width) * 100, py = (y / r.height) * 100;
      card.style.setProperty('--mx', `${px}%`);
      card.style.setProperty('--my', `${py}%`);
      card.style.setProperty('--sx', `${px}%`);
      card.style.setProperty('--sy', `${py}%`);
      const rx = ((y / r.height) - 0.5) * -10;
      const ry = ((x / r.width) - 0.5) * 10;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.02,1.02,1.02) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

/* ---------- Hero 3D phone tilt + floating badge parallax ---------- */
(function heroTilt() {
  const stage = document.getElementById('phoneStage');
  if (!stage) return;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;
  const phone = stage.querySelector('.phone');
  const badges = stage.querySelectorAll('.float-badge');
  const hero = document.querySelector('.hero');

  hero.addEventListener('mousemove', (e) => {
    const r = stage.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dx = (e.clientX - cx) / (r.width / 2);
    const dy = (e.clientY - cy) / (r.height / 2);
    const clampedX = Math.max(-1, Math.min(1, dx));
    const clampedY = Math.max(-1, Math.min(1, dy));
    if (phone) {
      phone.style.animationPlayState = 'paused';
      phone.style.transform = `rotateY(${clampedX * 14}deg) rotateX(${clampedY * -14}deg) translateZ(10px)`;
    }
    badges.forEach((b, i) => {
      b.style.animationPlayState = 'paused';
      const depth = 10 + i * 4;
      b.style.transform = `translate(${clampedX * depth}px, ${clampedY * depth}px)`;
    });
  });
  hero.addEventListener('mouseleave', () => {
    if (phone) { phone.style.transform = ''; phone.style.animationPlayState = 'running'; }
    badges.forEach(b => { b.style.transform = ''; b.style.animationPlayState = 'running'; });
  });
})();

/* ---------- Count-up numbers ---------- */
(function countUp() {
  const els = document.querySelectorAll('[data-count]');
  if (!els.length || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
      const dur = 1400;
      const start = performance.now();
      function tick(now) {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = target * eased;
        el.textContent = prefix + val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.4 });
  els.forEach(el => io.observe(el));
})();

/* ---------- Hero network canvas ---------- */
(function heroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, particles;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    w = canvas.width = canvas.offsetWidth * devicePixelRatio;
    h = canvas.height = canvas.offsetHeight * devicePixelRatio;
  }
  function init() {
    resize();
    const count = Math.min(46, Math.floor((canvas.offsetWidth * canvas.offsetHeight) / 22000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.22 * devicePixelRatio,
      vy: (Math.random() - 0.5) * 0.22 * devicePixelRatio,
    }));
  }
  function step() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
    });
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      ctx.beginPath();
      ctx.arc(a.x, a.y, 1.6 * devicePixelRatio, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(180,150,255,.55)';
      ctx.fill();
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const max = 160 * devicePixelRatio;
        if (dist < max) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(120,100,255,${(1 - dist / max) * 0.22})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    if (!prefersReduced) requestAnimationFrame(step);
  }
  init();
  step();
  window.addEventListener('resize', () => { resize(); }, { passive: true });
})();

/* ---------- Phone mockup rotator ---------- */
(function phoneRotator() {
  const slides = document.querySelectorAll('.phone-slide');
  const dots = document.querySelectorAll('.phone-dots span');
  if (!slides.length) return;
  let idx = 0;
  function show(i) {
    slides.forEach((s, n) => s.classList.toggle('active', n === i));
    dots.forEach((d, n) => d.classList.toggle('active', n === i));
  }
  show(0);
  setInterval(() => {
    idx = (idx + 1) % slides.length;
    show(idx);
  }, 3600);
})();

/* ---------- Creative galleries: real work + placeholder fill ---------- */
const hvacCreatives = [
  { file: 'hvac-01.jpg', label: 'Guru Cooling & Heating', sub: 'Ducted AC sale · human-face ad' },
  { file: 'hvac-02.jpg', label: 'A/C Deep Clean', sub: 'Sydney · Northern Beaches' },
  { file: 'hvac-03.jpg', label: 'ALC Air', sub: 'Ducted aircon clearance sale' },
  { file: 'hvac-04.jpg', label: 'All Ways Air & Electrical', sub: 'Split aircon 2026 sale' },
  { file: 'hvac-05.jpg', label: 'Ambition Air', sub: 'Ducted AC winter sale' },
  { file: 'hvac-06.jpg', label: 'Diverse Air Conditioning', sub: 'Split aircon mega sale' },
  { file: 'hvac-07.jpg', label: 'DM Climate Control', sub: 'Ducted aircon rebates' },
  { file: 'hvac-08.jpg', label: 'DM Climate Control', sub: 'Ducted aircon autumn sale' },
  { file: 'hvac-09.jpg', label: 'RB Electrical', sub: 'Adelaide ducted aircon sale' },
  { file: 'hvac-10.jpg', label: 'Enersol Electrical', sub: 'Ducted aircon massive sale' },
  { file: 'hvac-11.jpg', label: 'Glow Green', sub: 'Melbourne VEU rebate comparison' },
  { file: 'hvac-12.jpg', label: 'Glow Green', sub: 'Gas heater to ducted aircon' },
  { file: 'hvac-13.jpg', label: 'Glow Green', sub: 'Carrier ducted aircon' },
  { file: 'hvac-14.jpg', label: 'Guru Cooling & Heating', sub: 'Ducted AC sale · save $5,000' },
  { file: 'hvac-15.jpg', label: 'Hudson Air Conditioning', sub: 'Adelaide ducted aircon' },
  { file: 'hvac-16.jpg', label: 'Infinite Services', sub: 'Split aircon mega sale' },
  { file: 'hvac-17.jpg', label: 'Infinite Services', sub: 'Split aircon clearance sale' },
  { file: 'hvac-18.jpg', label: 'Inglis Air', sub: '3-head multi-split clearance' },
  { file: 'hvac-19.jpg', label: 'LUX Electrical Industries', sub: 'Bundaberg ducted aircon sale' },
  { file: 'hvac-20.jpg', label: 'Martin Heating & Cooling', sub: 'Melbourne VEU rebates' },
  { file: 'hvac-21.jpg', label: 'Martin Heating & Cooling', sub: 'Geelong · Ballarat · West Melbourne rebates' },
  { file: 'hvac-22.jpg', label: 'Martin Heating & Cooling', sub: 'Ducted aircon 2026 mega sale' },
  { file: 'hvac-23.jpg', label: 'MGW Electrical Solutions', sub: 'Split aircon massive sale' },
  { file: 'hvac-24.jpg', label: 'Reed Brothers Electrical', sub: 'Adelaide limited sale event' },
  { file: 'hvac-25.jpg', label: 'Reed Brothers Electrical', sub: 'Adelaide spring sale, lifestyle' },
  { file: 'hvac-26.jpg', label: 'Shefer Air', sub: 'Ducted A/C clearance sale' },
  { file: 'hvac-27.jpg', label: 'Shefer Air', sub: 'Ducted aircon 2026 sale' },
  { file: 'hvac-28.jpg', label: 'Spin Air', sub: 'Ducted aircon massive sale' },
  { file: 'hvac-29.jpg', label: 'Tech Air Solutions', sub: 'Ducted aircon mega sales' },
  { file: 'hvac-30.jpg', label: 'Templestowe Heating & Cooling', sub: 'Trusted team brand ad' },
  { file: 'hvac-31.jpg', label: 'TM Coastal Cooling', sub: 'Gold Coast mega sale' },
  { file: 'hvac-32.jpg', label: 'Vast Air', sub: 'Hunter Valley mega sale' },
];

const roofingCreatives = [
  { file: '1_Before_and_After.png', label: 'North City Roofing', sub: 'Full roof transformation — before & after' },
  { file: '2_Before_and_After.jpg', label: 'North City Roofing', sub: 'Before & after comparison' },
  { file: '3_Before_and_After.png', label: 'North City Roofing', sub: 'Storm damage repair — before & after' },
  { file: '4_Before_and_After.png', label: 'North City Roofing', sub: 'Gutter replacement — before & after' },
  { file: '5_Before_and_After.jpg', label: 'North City Roofing', sub: 'Commercial roofing — before & after' },
  { file: '6_-_Testimonial.png', label: 'North City Roofing', sub: 'Google rating showcase' },
  { file: '7_Testimonial.jpg', label: 'North City Roofing', sub: 'Customer testimonial' },
  { file: '10_Testimonial.jpg', label: 'North City Roofing', sub: 'Neighborhood testimonial' },
  { file: '11_Urgency.jpg', label: 'North City Roofing', sub: 'Storm damage urgency ad' },
  { file: '12_Urgency.jpg', label: 'North City Roofing', sub: 'Warning-sign urgency ad' },
  { file: '13_Urgency.jpg', label: 'North City Roofing', sub: 'Storm-front urgency ad' },
  { file: '14_Urgency.jpg', label: 'North City Roofing', sub: '24/7 emergency repair ad' },
  { file: '15_Urgency.jpg', label: 'North City Roofing', sub: 'Storm-ready urgency ad' },
  { file: '16_Educational.jpg', label: 'North City Roofing', sub: 'Educational roofing content' },
  { file: '17_Educational.jpg', label: 'North City Roofing', sub: 'Educational roofing content' },
  { file: '18_Educational.jpg', label: 'North City Roofing', sub: 'Educational roofing content' },
  { file: '19_Educational.jpg', label: 'North City Roofing', sub: 'Educational roofing content' },
  { file: '22_Offer.jpg', label: 'North City Roofing', sub: 'Special offer creative' },
  { file: '23_Offer.jpg', label: 'North City Roofing', sub: 'Special offer creative' },
  { file: '24_Offer.jpg', label: 'North City Roofing', sub: 'Special offer creative' },
  { file: '25_Offer.jpg', label: 'North City Roofing', sub: 'Special offer creative' },
  { file: '27_Local.jpg', label: 'North City Roofing', sub: 'Local trust / crew showcase' },
  { file: '28_Local.jpg', label: 'North City Roofing', sub: 'Local trust / service area' },
  { file: '30_Local.jpg', label: 'North City Roofing', sub: 'Local trust signal' },
  { file: '33_Carousel.jpg', label: 'North City Roofing', sub: 'Carousel post — free estimate' },
  { file: 'New Set/2.jpg', label: 'North City Roofing', sub: 'Social post' },
  { file: 'New Set/3.jpg', label: 'North City Roofing', sub: 'Roof lifespan educational post' },
  { file: 'New Set/6.jpg', label: 'North City Roofing', sub: 'Winter roof checklist' },
  { file: 'New Set/7.jpg', label: 'North City Roofing', sub: 'Moss & algae educational post' },
  { file: 'New Set/8.jpg', label: 'North City Roofing', sub: 'Attic ventilation 101' },
  { file: 'New Set/11.jpg', label: 'North City Roofing', sub: 'Project complete showcase' },
  { file: 'New Set/39.jpg', label: 'North City Roofing', sub: 'Roof age poll post' },
  { file: 'New Set/40.jpg', label: 'North City Roofing', sub: 'Shingle vs metal poll post' },
  { file: 'New Set/41.jpg', label: 'North City Roofing', sub: 'Roof lifespan true/false post' },
  { file: 'New Set/42.jpg', label: 'North City Roofing', sub: 'Caption-this engagement post' },
  { file: 'New Set/45.jpg', label: 'North City Roofing', sub: 'What-would-you-do engagement post' },
  { file: 'New Set/47.jpg', label: 'North City Roofing', sub: 'Roofing myth or fact post' },
  { file: 'New Set/48.jpg', label: 'North City Roofing', sub: 'Storm rolling through post' },
  { file: 'New Set/49.jpg', label: 'North City Roofing', sub: 'Post-storm roof check post' },
  { file: 'New Set/50.jpg', label: 'North City Roofing', sub: 'Fall checklist post' },
  { file: 'New Set/65.jpg', label: 'North City Roofing', sub: 'What matters most engagement post' },
  { file: 'New Set/66.jpg', label: 'North City Roofing', sub: 'Would-you-rather engagement post' },
  { file: 'Meme Post/1_Meme.jpg', label: 'North City Roofing', sub: 'Meme post' },
  { file: 'Meme Post/2_Meme.jpg', label: 'North City Roofing', sub: 'Meme post' },
  { file: 'Meme Post/3_Meme.jpg', label: 'North City Roofing', sub: 'Meme post' },
  { file: 'Meme Post/4_Meme.png', label: 'North City Roofing', sub: 'Meme post' },
  { file: 'Meme Post/5_Meme.jpg', label: 'North City Roofing', sub: 'Meme post' },
  { file: 'Meme Post/6_Meme.jpg', label: 'North City Roofing', sub: 'Meme post' },
  { file: 'Meme Post/7_Meme.jpg', label: 'North City Roofing', sub: 'Meme post' },
  { file: 'Meme Post/8_Meme.jpg', label: 'North City Roofing', sub: 'Meme post' },
  { file: 'Meme Post/9_Meme.jpg', label: 'North City Roofing', sub: 'Meme post' },
  { file: 'Meme Post/10_Meme.jpg', label: 'North City Roofing', sub: 'Meme post' },
  { file: 'Meme Post/11_Meme.jpg', label: 'North City Roofing', sub: 'Meme post' },
  { file: 'Meme Post/12_Meme.jpg', label: 'North City Roofing', sub: 'Meme post' },
];

function buildGallery(containerId, count, prefix, basePath, items) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10.5" r="1.5"/><path d="M21 16l-5-5-4 4-3-3-6 6"/></svg>`;
  let html = '';
  items.forEach(item => {
    html += `<div class="g-tile g-tile-img"><img src="${basePath}/${item.file}" alt="${item.label} — ${item.sub}" loading="lazy"><div class="g-cap"><b>${item.label}</b><span>${item.sub}</span></div></div>`;
  });
  for (let i = items.length + 1; i <= count; i++) {
    html += `<div class="g-tile"><span style="color:var(--muted-2)">${icon}</span><span>${prefix} ${String(i).padStart(2,'0')}</span></div>`;
  }
  el.innerHTML = html;
}
buildGallery('gallery-hvac', 32, 'HVAC Creative', 'assets/hvac', hvacCreatives);
buildGallery('gallery-roofing', 54, 'Roofing Creative', 'images/NC', roofingCreatives);

document.querySelectorAll('.gallery-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const grid = document.getElementById(btn.dataset.target);
    const fade = btn.closest('.gallery-fade');
    const expanded = grid.classList.toggle('expanded');
    fade.classList.toggle('hide', expanded);
  });
});

/* ---------- Footer year ---------- */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ============================================================
   HIGHLIGHTS CAROUSEL + LIGHTBOX (homepage only)
   ============================================================ */
(function highlightsAndLightbox() {
  const modal = document.getElementById('hlModal');
  const anyTrack = document.getElementById('hlTrackAutomation') || document.getElementById('hlTrackCreative') || document.getElementById('hlTrackAmazon');
  if (!anyTrack && !modal) return; // not on this page

  /* ---- small line-icon set for automation flow diagrams ---- */
  const ICON = {
    call: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.7a2 2 0 01-.5 2.1L8 9.7a16 16 0 006.3 6.3l1.2-1.2a2 2 0 012.1-.5c.9.3 1.8.5 2.7.6a2 2 0 011.7 2.1z"/></svg>',
    bot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="9" width="16" height="11" rx="2"/><path d="M12 9V5m0 0a2 2 0 100-4 2 2 0 000 4zM8 14v1m8-1v1"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M9 15l2 2 4-4"/></svg>',
    sms: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.4 8.4 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.4 8.4 0 01-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.4 8.4 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>',
    crm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>',
    form: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.4 8.4 0 01-4.8 7.6A8.5 8.5 0 013 15.5V9a6 6 0 016-6h4a6 6 0 016 6v2.5z"/><path d="M7 9h.01M11 9h.01M15 9h.01"/></svg>',
    branch: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="2.2"/><circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="12" r="2.2"/><path d="M6 8.2V18M8 6h4a4 4 0 014 4M8 18h4a4 4 0 004-4"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3 6.5 7 1-5.2 5 1.3 7-6.1-3.4L5.9 21.5l1.3-7L2 9.5l7-1z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>'
  };

  function esc(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function flowSteps(steps) {
    return steps.map((s, i) => (
      (i > 0 ? '<div class="hl-flow-arrow"></div>' : '') +
      '<div class="hl-flow-step"><span class="hl-flow-icon">' + ICON[s.icon] + '</span><span class="hl-flow-label">' + s.label + '</span></div>'
    )).join('');
  }
  function flowHtml(item) {
    return '<div class="hl-flow" style="--flow-accent:' + item.accent + '">' + flowSteps(item.steps) + '</div>';
  }

  /* ---- highlight data: automation / creative / amazon ---- */
  const data = [
    {
      cat: 'automation', tag: 'Automation · GoHighLevel', title: 'Voice AI Booking Agent',
      blurb: 'Calls answered, qualified, and booked automatically.',
      desc: 'An AI voice agent trained on the client\u2019s offers and objections answers inbound calls, qualifies the caller, and books the appointment directly into the calendar \u2014 no one has to be sitting by the phone.',
      accent: '#7c5cff',
      steps: [{ icon: 'call', label: 'Inbound call rings in' }, { icon: 'bot', label: 'AI agent qualifies the caller' }, { icon: 'calendar', label: 'Appointment booked instantly' }]
    },
    {
      cat: 'creative', tag: 'Creative · Paid Social', title: 'Guru Cooling & Heating',
      blurb: 'Meta ad creative for Regas Media\u2019s HVAC client base.',
      desc: 'One of 32 Meta & Google ad creatives designed for HVAC lead generation, currently running for Regas Media clients. Built to stop the scroll and drive same-week bookings.',
      image: 'assets/hvac/hvac-01.jpg', alt: 'Guru Cooling & Heating ducted AC sale ad'
    },
    {
      cat: 'amazon', tag: 'Amazon · A+ Content', title: 'Magic Balm — KUTTURA',
      blurb: 'Barrier support balm stick, A+ content built end-to-end.',
      desc: 'Full A+ content build for KUTTURA Skin Co.\u2019s Magic Balm \u2014 problem/solution storytelling, ingredient education, and usage steps. Part of an ongoing Amazon growth engagement.',
      image: 'assets/amazon/case-magicbalm-hero.jpg', alt: 'KUTTURA Magic Balm Amazon A+ content'
    },
    {
      cat: 'automation', tag: 'Automation · GoHighLevel', title: 'Missed-Call Text-Back',
      blurb: 'A missed call still turns into a conversation.',
      desc: 'The moment a call goes unanswered, the lead gets an instant text so the conversation keeps going instead of going cold \u2014 and the contact is logged straight into the pipeline.',
      accent: '#7c5cff',
      steps: [{ icon: 'call', label: 'Call goes unanswered' }, { icon: 'sms', label: 'Instant text sent in seconds' }, { icon: 'crm', label: 'Lead tracked in the pipeline' }]
    },
    {
      cat: 'creative', tag: 'Creative · Paid Social', title: 'Glow Green',
      blurb: 'Melbourne VEU rebate comparison creative.',
      desc: 'Rebate-comparison ad creative for Glow Green, breaking down VEU savings on a ducted-to-aircon upgrade in plain, scannable terms \u2014 built for Meta feed performance.',
      image: 'assets/hvac/hvac-11.jpg', alt: 'Glow Green Melbourne VEU rebate comparison ad'
    },
    {
      cat: 'amazon', tag: 'Amazon · A+ Content', title: 'Aloe Cooler — KUTTURA',
      blurb: 'Cuticle elixir pen, A+ storytelling module.',
      desc: 'A+ content for KUTTURA\u2019s Aloe Cooler cuticle elixir pen, including size comparison and texture-claim modules designed to answer objections before they come up.',
      image: 'assets/amazon/case-aloecooler-hero.jpg', alt: 'KUTTURA Aloe Cooler Amazon A+ content'
    },
    {
      cat: 'automation', tag: 'Automation · Zapier', title: 'Form \u2192 CRM \u2192 Team Alert',
      blurb: 'New leads land in the CRM and the team knows in seconds.',
      desc: 'A lightweight Zap connecting the website form to the CRM and a team chat channel \u2014 the moment someone fills out a form, a contact is created and the team is pinged, no manual entry required.',
      accent: '#FF4A00',
      steps: [{ icon: 'form', label: 'Website form submitted' }, { icon: 'crm', label: 'Contact created in CRM' }, { icon: 'chat', label: 'Team alerted in chat' }]
    },
    {
      cat: 'creative', tag: 'Creative · Paid Social', title: 'Templestowe Heating & Cooling',
      blurb: 'Trusted-team brand ad, built for organic + paid.',
      desc: 'A brand-trust focused creative for Templestowe Heating & Cooling, designed to work across organic posting and paid placement without losing its warmth.',
      image: 'assets/hvac/hvac-30.jpg', alt: 'Templestowe Heating & Cooling trusted team brand ad'
    },
    {
      cat: 'amazon', tag: 'Amazon · A+ Content', title: 'Castor Spoolie — KUTTURA',
      blurb: 'Lash & brow oil, optimized from listing to A+.',
      desc: 'Listing and A+ content for KUTTURA\u2019s Castor Spoolie \u2014 101 units ordered in its first 30 days live, with application-step visuals that reduce pre-purchase questions.',
      image: 'assets/amazon/case-spoolie-hero.jpg', alt: 'KUTTURA Castor Spoolie Amazon A+ content'
    },
    {
      cat: 'creative', tag: 'Creative · Paid Social', title: 'Martin Heating & Cooling',
      blurb: 'Ducted aircon mega-sale creative, built for 2026.',
      desc: 'A high-urgency seasonal sale ad for Martin Heating & Cooling, part of a run of VEU rebate and clearance creative built to perform across Melbourne, Geelong, and Ballarat.',
      image: 'assets/hvac/hvac-22.jpg', alt: 'Martin Heating & Cooling ducted aircon mega sale ad'
    },
    {
      cat: 'amazon', tag: 'Amazon · Live Listing', title: 'Citrus Calm — KUTTURA',
      blurb: 'A cuticle elixir variant, live and converting.',
      desc: 'The Citrus Calm variant of KUTTURA\u2019s cuticle elixir line, live on Amazon with the same A+ storytelling and image direction built for the rest of the collection.',
      image: 'assets/amazon/proof-citruscalm-listing.jpg', alt: 'KUTTURA Citrus Calm live Amazon listing'
    },
    {
      cat: 'creative', tag: 'Creative · Paid Social', title: 'Reed Brothers Electrical',
      blurb: 'Adelaide limited-time sale event creative.',
      desc: 'A limited-time sale event ad for Reed Brothers Electrical, part of a run of Adelaide-focused HVAC creative built to move fast during a short promotional window.',
      image: 'assets/hvac/hvac-24.jpg', alt: 'Reed Brothers Electrical Adelaide limited sale event ad'
    },
    {
      cat: 'creative', tag: 'Creative · Paid Social', title: 'ALC Air',
      blurb: 'Ducted aircon clearance sale creative.',
      desc: 'A clearance-sale ad for ALC Air, built with a clean, high-contrast offer layout to move remaining ducted aircon stock fast.',
      image: 'assets/hvac/hvac-03.jpg', alt: 'ALC Air ducted aircon clearance sale ad'
    },
    {
      cat: 'creative', tag: 'Creative · Paid Social', title: 'RB Electrical',
      blurb: 'Adelaide ducted aircon sale creative.',
      desc: 'A localized ducted aircon sale ad for RB Electrical, targeted to Adelaide homeowners with a direct, no-nonsense offer.',
      image: 'assets/hvac/hvac-09.jpg', alt: 'RB Electrical Adelaide ducted aircon sale ad'
    },
    {
      cat: 'creative', tag: 'Creative · Paid Social', title: 'Infinite Services',
      blurb: 'Split aircon mega-sale creative.',
      desc: 'A high-energy mega-sale ad for Infinite Services, built to drive volume during a split-system aircon promotion.',
      image: 'assets/hvac/hvac-16.jpg', alt: 'Infinite Services split aircon mega sale ad'
    },
    {
      cat: 'creative', tag: 'Creative · Paid Social', title: 'LUX Electrical Industries',
      blurb: 'Bundaberg ducted aircon sale creative.',
      desc: 'A regional ducted aircon sale ad for LUX Electrical Industries, built for the Bundaberg market with local trust signals.',
      image: 'assets/hvac/hvac-19.jpg', alt: 'LUX Electrical Industries Bundaberg ducted aircon sale ad'
    },
    {
      cat: 'creative', tag: 'Creative · Paid Social', title: 'Spin Air',
      blurb: 'Ducted aircon massive-sale creative.',
      desc: 'A bold, high-urgency ducted aircon sale ad for Spin Air, designed to stop the scroll during a limited promotional window.',
      image: 'assets/hvac/hvac-28.jpg', alt: 'Spin Air ducted aircon massive sale ad'
    },
    {
      cat: 'amazon', tag: 'Amazon · Live Listing', title: 'Magic Balm — Live Listing',
      blurb: '4.6★ and climbing, with 10 reviews live.',
      desc: 'The live Amazon listing for KUTTURA\u2019s Magic Balm, holding a 4.6-star rating shortly after launch \u2014 the payoff of the A+ content and keyword work behind it.',
      image: 'assets/amazon/proof-magicbalm-listing.jpg', alt: 'Magic Balm live Amazon listing, 4.6 stars'
    },
    {
      cat: 'automation', tag: 'Automation · Make', title: 'Review Routing Funnel',
      blurb: 'Happy customers reviewed publicly, concerns caught privately.',
      desc: 'A branching Make scenario that asks for a quick rating first: strong ratings are guided straight to a public review link, while lower ratings are routed to a private feedback form so issues get resolved quietly.',
      accent: '#6D00CC',
      steps: [{ icon: 'star', label: 'Customer rates the visit' }, { icon: 'branch', label: 'Routed by response' }, { icon: 'star', label: 'Public reviews collected' }]
    },
    {
      cat: 'automation', tag: 'Automation · Make', title: 'Ad Lead Nurture Sequence',
      blurb: 'Paid leads followed up automatically until they book.',
      desc: 'Meta and Google leads drop straight into a branching Make scenario that nurtures with email and SMS until the lead books \u2014 or opts out \u2014 so no paid lead goes untouched.',
      accent: '#6D00CC',
      steps: [{ icon: 'mail', label: 'Ad lead comes in' }, { icon: 'branch', label: 'Sequence branches by response' }, { icon: 'calendar', label: 'Booked automatically' }]
    }
  ];

  function cardMediaHtml(item) {
    return item.image
      ? '<div class="hl-card-media"><img src="' + item.image + '" alt="' + esc(item.alt) + '" loading="lazy"></div>'
      : '<div class="hl-card-media">' + flowHtml(item) + '</div>';
  }

  /* Shared inner markup (media + view icon + caption) reused by every carousel style. */
  function cardInnerHtml(item) {
    return cardMediaHtml(item) +
      '<span class="hl-card-view"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg></span>' +
      '<div class="hl-card-cap"><span class="hl-card-tag">' + esc(item.tag) + '</span><h3>' + esc(item.title) + '</h3><p>' + esc(item.blurb) + '</p></div>';
  }

  /* ---------------- style 1: coverflow, with autoplay (Automation) ---------------- */
  function buildCarousel(items, ids, opts) {
    opts = opts || {};
    const trackEl = document.getElementById(ids.track);
    if (!trackEl || !items.length) return null;
    const viewportEl = trackEl.closest('.hl-viewport');
    const counterEl = document.getElementById(ids.counter);
    const state = { index: 0 };
    let timer = null;

    function render() {
      trackEl.innerHTML = items.map((item, i) => (
        '<div class="hl-card" role="button" tabindex="0" data-i="' + i + '" aria-label="View ' + esc(item.title) + '">' +
          cardInnerHtml(item) +
        '</div>'
      )).join('');
      trackEl.querySelectorAll('.hl-card').forEach(card => {
        const activate = () => {
          const i = parseInt(card.dataset.i, 10);
          state.index = i;
          layout();
          openModal(items[i]);
        };
        card.addEventListener('click', activate);
        card.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
        });
      });
      layout();
    }

    function layout() {
      if (!viewportEl) return;
      const cards = trackEl.querySelectorAll('.hl-card');
      const vw = viewportEl.offsetWidth || 900;
      const isMobile = vw < 640;
      const spacing = isMobile ? Math.max(130, vw * 0.5) : Math.min(280, vw * 0.26);
      const n = items.length;
      cards.forEach((el, i) => {
        let offset = i - state.index;
        offset = ((offset % n) + n) % n; // 0..n-1
        if (offset > n / 2) offset -= n;   // wrap into (-n/2, n/2]
        const abs = Math.abs(offset);
        const tx = offset * spacing;
        const scale = Math.max(0.6, 1 - Math.min(abs, 3) * 0.16);
        const rot = Math.max(-26, Math.min(26, offset * -15));
        const opacity = abs === 0 ? 1 : abs === 1 ? 0.72 : abs === 2 ? 0.38 : 0;
        el.style.transform = 'translate(-50%,-50%) translateX(' + tx + 'px) scale(' + scale + ') rotateY(' + rot + 'deg)';
        el.style.opacity = opacity;
        el.style.zIndex = 100 - abs;
        el.style.pointerEvents = abs > 2 ? 'none' : 'auto';
        el.classList.toggle('is-active', offset === 0);
      });
      if (counterEl) counterEl.textContent = (state.index + 1) + ' / ' + n;
    }

    function go(delta) {
      state.index = (state.index + delta + items.length) % items.length;
      layout();
    }

    document.getElementById(ids.prev)?.addEventListener('click', () => { go(-1); restart(); });
    document.getElementById(ids.next)?.addEventListener('click', () => { go(1); restart(); });

    if (viewportEl) {
      let startX = null;
      viewportEl.addEventListener('pointerdown', e => { startX = e.clientX; });
      viewportEl.addEventListener('pointerup', e => {
        if (startX === null) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 40) { go(dx < 0 ? 1 : -1); restart(); }
        startX = null;
      });
    }

    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function start() {
      if (!opts.autoplay || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      stop();
      timer = setInterval(() => go(1), opts.interval || 3200);
    }
    function restart() { stop(); start(); }

    if (opts.autoplay && viewportEl) {
      const stage = viewportEl.closest('.hl-carousel') || viewportEl;
      stage.addEventListener('mouseenter', stop);
      stage.addEventListener('mouseleave', start);
      stage.addEventListener('focusin', stop);
      stage.addEventListener('focusout', start);
      start();
    }

    render();
    return { layout };
  }

  /* ---------------- style 2: rotating 3D globe, continuous (Creative) ---------------- */
  function buildGlobe(items, ids) {
    const stageEl = document.getElementById(ids.stage);
    if (!stageEl || !items.length) return null;
    const ringEl = document.createElement('div');
    ringEl.className = 'hl-globe-ring';
    stageEl.innerHTML = '';
    stageEl.appendChild(ringEl);
    const n = items.length;

    /* Card width and ring radius both scale with item count, so cards never
       overlap/hide each other no matter how many are in the carousel. */
    function geometry(vw) {
      const cardW = Math.max(150, Math.min(240, vw * 0.19));
      const angleStep = (2 * Math.PI) / n;
      const minRadius = (cardW / 2) / Math.sin(angleStep / 2) * 1.08; // 8% gap so edges don't touch
      const radius = Math.max(160, Math.min(560, Math.max(vw * 0.3, minRadius)));
      return { cardW, radius };
    }

    function render() {
      const vw = stageEl.offsetWidth || 900;
      const { cardW, radius } = geometry(vw);
      const step = 360 / n;
      ringEl.innerHTML = items.map((item, i) => (
        '<div class="hl-globe-card" role="button" tabindex="0" data-i="' + i + '" aria-label="View ' + esc(item.title) + '" style="--ry:' + (i * step) + 'deg;--rz:' + radius + 'px;width:' + cardW + 'px;">' +
          cardInnerHtml(item) +
        '</div>'
      )).join('');
      ringEl.querySelectorAll('.hl-globe-card').forEach(card => {
        const activate = () => {
          ringEl.classList.add('is-paused');
          openModal(items[parseInt(card.dataset.i, 10)]);
        };
        card.addEventListener('click', activate);
        card.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
        });
      });
    }

    function layout() {
      const vw = stageEl.offsetWidth || 900;
      const { cardW, radius } = geometry(vw);
      ringEl.querySelectorAll('.hl-globe-card').forEach(card => {
        card.style.setProperty('--rz', radius + 'px');
        card.style.width = cardW + 'px';
      });
    }

    render();
    return { layout };
  }

  /* ---------------- style 3: shuffled photo album (Amazon) ---------------- */
  function buildAlbum(items, ids) {
    const stageEl = document.getElementById(ids.stage);
    if (!stageEl || !items.length) return null;
    const counterEl = document.getElementById(ids.counter);
    const angles = [0, -7, 5, -5, 8, -6, 4];
    let order = items.map((_, i) => i);

    function render() {
      stageEl.innerHTML = order.map((origIndex, pos) => {
        const item = items[origIndex];
        return '<div class="hl-album-card' + (pos === 0 ? ' is-front' : '') + '" role="button" tabindex="0" data-orig="' + origIndex + '" aria-label="View ' + esc(item.title) + '">' +
          cardInnerHtml(item) +
        '</div>';
      }).join('');

      const cards = stageEl.querySelectorAll('.hl-album-card');
      cards.forEach((el, pos) => {
        const dx = pos === 0 ? 0 : (pos % 2 === 0 ? 1 : -1) * (14 + pos * 6);
        const dy = pos * 12;
        const rot = pos === 0 ? 0 : angles[pos % angles.length];
        const scale = Math.max(0.86, 1 - pos * 0.045);
        const opacity = pos < 5 ? 1 - pos * 0.14 : 0;
        el.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px)) rotate(' + rot + 'deg) scale(' + scale + ')';
        el.style.zIndex = String(items.length - pos);
        el.style.opacity = String(opacity);
        el.style.pointerEvents = pos < 5 ? 'auto' : 'none';
        const activate = () => {
          if (pos === 0) { openModal(items[parseInt(el.dataset.orig, 10)]); }
          else { bringToFront(parseInt(el.dataset.orig, 10)); }
        };
        el.addEventListener('click', activate);
        el.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
        });
      });

      if (counterEl) counterEl.textContent = (order[0] + 1) + ' / ' + items.length;
    }

    function bringToFront(origIndex) {
      const at = order.indexOf(origIndex);
      order = order.slice(at).concat(order.slice(0, at));
      render();
    }
    function next() { order.push(order.shift()); render(); }
    function prev() { order.unshift(order.pop()); render(); }

    document.getElementById(ids.prev)?.addEventListener('click', prev);
    document.getElementById(ids.next)?.addEventListener('click', next);

    render();
    return { layout: () => {} };
  }

  const carousels = [
    buildCarousel(data.filter(d => d.cat === 'automation'), { track: 'hlTrackAutomation', prev: 'hlPrevAutomation', next: 'hlNextAutomation', counter: 'hlCounterAutomation' }, { autoplay: true, interval: 3200 }),
    buildGlobe(data.filter(d => d.cat === 'creative'), { stage: 'hlGlobeCreative' }),
    buildAlbum(data.filter(d => d.cat === 'amazon'), { stage: 'hlAlbumAmazon', prev: 'hlPrevAmazon', next: 'hlNextAmazon', counter: 'hlCounterAmazon' })
  ].filter(Boolean);

  window.addEventListener('resize', () => carousels.forEach(c => c.layout()), { passive: true });

  /* ---------------- lightbox modal ---------------- */
  const catLabel = { automation: 'Automation', creative: 'Creative', amazon: 'Amazon' };
  function openModal(item) {
    if (!modal) return;
    const mediaEl = document.getElementById('hlModalMedia');
    const tagEl = document.getElementById('hlModalTag');
    const titleEl = document.getElementById('hlModalTitle');
    const descEl = document.getElementById('hlModalDesc');
    if (mediaEl) {
      if (item.mediaHtml) {
        mediaEl.innerHTML = item.mediaHtml;
      } else if (item.image) {
        mediaEl.innerHTML = '<img src="' + item.image + '" alt="' + esc(item.alt || item.title) + '">';
      } else if (item.steps) {
        mediaEl.innerHTML = flowHtml(item);
      } else {
        mediaEl.innerHTML = '';
      }
    }
    if (tagEl) tagEl.textContent = item.tag || catLabel[item.cat] || 'Highlight';
    if (titleEl) titleEl.textContent = item.title || '';
    if (descEl) descEl.textContent = item.desc || item.blurb || '';
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    document.querySelectorAll('.hl-globe-ring.is-paused').forEach(r => r.classList.remove('is-paused'));
  }
  modal?.querySelectorAll('[data-hl-close]').forEach(el => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  /* expose for the hero phone click handler below */
  window.__jmxOpenHighlight = openModal;
})();

/* ---------- Clickable hero phone: opens the active slide in the lightbox ---------- */
(function clickablePhone() {
  const phoneBtn = document.getElementById('phoneOpen');
  if (!phoneBtn || typeof window.__jmxOpenHighlight !== 'function') return;
  phoneBtn.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); phoneBtn.click(); }
  });
  phoneBtn.addEventListener('click', () => {
    const activeSlide = phoneBtn.querySelector('.phone-slide.active') || phoneBtn.querySelector('.phone-slide');
    if (!activeSlide) return;
    const img = activeSlide.querySelector('img');
    const labelEl = activeSlide.querySelector('.phone-slide-label');
    const smallEl = labelEl?.querySelector('small');
    const title = labelEl ? labelEl.firstChild.textContent.trim() : 'GoHighLevel Build';
    const sub = smallEl ? smallEl.textContent.trim() : '';
    window.__jmxOpenHighlight({
      cat: 'automation',
      tag: 'GoHighLevel · Live Build',
      title: title,
      image: img?.getAttribute('src'),
      alt: img?.getAttribute('alt') || title,
      desc: (sub ? sub + '. ' : '') + 'Built end-to-end in GoHighLevel \u2014 funnel, booking flow, and brand design, live and taking bookings today.'
    });
  });
})();

/* ---------- Creative page: gallery tiles open the lightbox on click ---------- */
(function galleryLightbox() {
  if (typeof window.__jmxOpenHighlight !== 'function') return;

  function wireGallery(containerId, tagLabel, fallbackDesc) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.querySelectorAll('.g-tile-img').forEach(tile => {
      tile.setAttribute('role', 'button');
      tile.setAttribute('tabindex', '0');
      const img = tile.querySelector('img');
      const capB = tile.querySelector('.g-cap b');
      const capSpan = tile.querySelector('.g-cap span');
      const activate = () => {
        window.__jmxOpenHighlight({
          cat: 'creative',
          tag: tagLabel,
          title: capB ? capB.textContent.trim() : 'Creative',
          image: img?.getAttribute('src'),
          alt: img?.getAttribute('alt') || '',
          desc: (capSpan ? capSpan.textContent.trim() + '. ' : '') + fallbackDesc
        });
      };
      tile.addEventListener('click', activate);
      tile.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
      });
    });
  }

  wireGallery('gallery-hvac', 'Creative · Paid Social · HVAC', 'One of 32 Meta & Google ad creatives designed for HVAC lead generation, currently running for Regas Media clients.');
  wireGallery('gallery-roofing', 'Creative · Paid Social · Roofing', 'Part of the ongoing North City Roofing content system \u2014 paid ads and organic posts built for local lead generation.');
})();

/* ---------- Amazon page: case studies & A+ modules open the lightbox on click ---------- */
(function amazonLightbox() {
  if (typeof window.__jmxOpenHighlight !== 'function') return;

  document.querySelectorAll('.case-card, .amod-tile').forEach(tile => {
    tile.setAttribute('role', 'button');
    tile.setAttribute('tabindex', '0');
    const img = tile.querySelector('img');
    let title = '', sub = '';
    const caseMeta = tile.querySelector('.case-meta');
    if (caseMeta) {
      title = caseMeta.querySelector('b')?.textContent.trim() || '';
      sub = caseMeta.querySelector('span')?.textContent.trim() || '';
    } else {
      const cap = tile.querySelector('.cap');
      if (cap) {
        const small = cap.querySelector('small');
        sub = small ? small.textContent.trim() : '';
        title = (cap.childNodes[0]?.textContent || cap.textContent).trim();
      }
    }
    const isLive = tile.classList.contains('proof');
    const activate = () => {
      window.__jmxOpenHighlight({
        cat: 'amazon',
        tag: isLive ? 'Amazon · Live Listing' : 'Amazon · A+ Content',
        title: title || 'KUTTURA Skin Co.',
        image: img?.getAttribute('src'),
        alt: img?.getAttribute('alt') || '',
        desc: (sub ? sub + '. ' : '') + 'Part of the ongoing KUTTURA Skin Co. Amazon growth engagement \u2014 A+ content, listing optimization, and live results.'
      });
    };
    tile.addEventListener('click', activate);
    tile.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
    });
  });
})();

/* ---------- Automation page: platform cards open the lightbox on click ---------- */
(function automationLightbox() {
  if (typeof window.__jmxOpenHighlight !== 'function') return;

  document.querySelectorAll('.auto-card').forEach(card => {
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    const titleEl = card.querySelector('.plat b');
    const descEl = card.querySelector('p');
    const swatch = card.querySelector('.swatch');
    let bg = 'var(--grad)';
    if (swatch) {
      const cs = getComputedStyle(swatch);
      bg = (cs.backgroundImage && cs.backgroundImage !== 'none') ? cs.backgroundImage : cs.backgroundColor;
    }
    const iconHTML = swatch ? swatch.innerHTML : '';
    const mediaHtml = '<div style="width:100%;height:100%;min-height:240px;display:flex;align-items:center;justify-content:center;background:' + bg + ';">'
      + '<div style="width:76px;height:76px;border-radius:22px;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;color:#fff;backdrop-filter:blur(4px);">'
      + (iconHTML || '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.6"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v16"/></svg>')
      + '</div></div>';
    const activate = (e) => {
      if (e && e.target && e.target.closest && e.target.closest('a')) return;
      window.__jmxOpenHighlight({
        cat: 'automation',
        tag: 'Automation · ' + (titleEl ? titleEl.textContent.trim() : 'GoHighLevel'),
        title: titleEl ? titleEl.textContent.trim() : 'Automation',
        desc: descEl ? descEl.textContent.trim() : '',
        mediaHtml: mediaHtml
      });
    };
    card.addEventListener('click', activate);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { if (e.target.closest('a')) return; e.preventDefault(); activate(e); }
    });
  });
})();
/* ---------- Generic lightbox triggers: any element with [data-lb] ---------- */
(function dataLightbox() {
  const modal = document.getElementById('hlModal');
  if (!modal || typeof window.__jmxOpenHighlight !== 'function') return;

  // Wrap the opener so screenshots can use the wide lightbox layout
  const baseOpen = window.__jmxOpenHighlight;
  window.__jmxOpenHighlight = function (item) {
    baseOpen(item);
    modal.classList.toggle('is-wide', !!(item && item.wide));
  };
  const clearWide = () => modal.classList.remove('is-wide');
  modal.querySelectorAll('[data-hl-close]').forEach(el => el.addEventListener('click', clearWide));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') clearWide(); });

  document.querySelectorAll('[data-lb]').forEach(el => {
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    const img = el.querySelector('img');
    const open = () => {
      window.__jmxOpenHighlight({
        cat: el.dataset.lbCat || 'creative',
        tag: el.dataset.lbTag || '',
        title: el.dataset.lbTitle || '',
        desc: el.dataset.lbDesc || '',
        image: el.dataset.lbSrc || (img ? img.getAttribute('src') : ''),
        alt: img ? img.getAttribute('alt') : '',
        wide: el.dataset.lbWide === 'true'
      });
    };
    el.addEventListener('click', open);
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });
})();