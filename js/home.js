/* ==========================================================================
   JMX — home.js  (index.html only)
   1. Hero: Three.js infinite portal frames + particle stream (with fallback)
   1b. 3D kinetic type ring (disciplines)
   2. Mouse-depth parallax (hero badges + floating service panels)
   3. Scroll-lit statement
   4. Selected work: scroll-driven 3D browser stack + phone
   5. Automation: 3D cover flow
   6. Creative: orbital gallery (drag to spin)
   7. Amazon: stacked cards (swipe / fly away)
   8. Social process line
   ========================================================================== */
(function () {
  'use strict';
  const J = window.JMX, D = window.JMX_DATA;
  if (!J || !D) return;
  const { $, $$, clamp, lerp, esc, reduce, finePointer, isMobile } = J;

  /* ======================================================== 1. HERO 3D
     Infinite portal: luminous rounded frames stream toward the camera
     through a particle field. Mouse steers the camera, scroll adds warp. */
  function hero3D() {
    const canvas = $('#heroGL');
    if (!canvas) return;
    const ok = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
    if (typeof window.THREE === 'undefined' || !ok) { document.documentElement.classList.add('no-webgl'); return; }
    const T = window.THREE;

    let renderer;
    try { renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
    catch (e) { document.documentElement.classList.add('no-webgl'); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(55, 1, 0.1, 80);
    camera.position.set(0, 0, 8);

    const mobile = isMobile();
    const DEPTH = 46, NF = mobile ? 14 : 20, GAP = DEPTH / NF;
    const cA = new T.Color('#7be3ff'), cB = new T.Color('#4a43fe'), cC = new T.Color('#b44dfd');
    const mix = t => t < 0.5 ? cA.clone().lerp(cB, t * 2) : cB.clone().lerp(cC, (t - 0.5) * 2);

    /* rounded-rect ring geometry (outline only) */
    function ringGeo(w, h, r, th) {
      const rr = (sh, W, H, R) => {
        const x = -W / 2, y = -H / 2;
        sh.moveTo(x + R, y); sh.lineTo(x + W - R, y); sh.quadraticCurveTo(x + W, y, x + W, y + R);
        sh.lineTo(x + W, y + H - R); sh.quadraticCurveTo(x + W, y + H, x + W - R, y + H);
        sh.lineTo(x + R, y + H); sh.quadraticCurveTo(x, y + H, x, y + H - R);
        sh.lineTo(x, y + R); sh.quadraticCurveTo(x, y, x + R, y);
      };
      const outer = new T.Shape(); rr(outer, w, h, r);
      const hole = new T.Path(); rr(hole, w - th * 2, h - th * 2, Math.max(0.01, r - th));
      outer.holes.push(hole);
      return new T.ShapeGeometry(outer, 24);
    }
    const W = 4.6, H = 6.2, R = 0.9;
    const gThin = ringGeo(W, H, R, 0.03), gGlow = ringGeo(W + 0.16, H + 0.16, R + 0.08, 0.2);

    /* glowing node sprite */
    const dotTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.3, 'rgba(210,200,255,.85)'); gr.addColorStop(1, 'rgba(120,90,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c); })();

    const tunnel = new T.Group();
    scene.add(tunnel);
    const frames = [];
    for (let i = 0; i < NF; i++) {
      const g = new T.Group();
      const thin = new T.Mesh(gThin, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
      const glow = new T.Mesh(gGlow, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
      g.add(glow, thin);
      /* two travelling light nodes on each frame */
      const nodes = [0, 1].map(() => { const sp = new T.Sprite(new T.SpriteMaterial({ map: dotTex, transparent: true, blending: T.AdditiveBlending, depthWrite: false })); sp.scale.setScalar(0.38); g.add(sp); return sp; });
      g.position.z = -i * GAP;
      tunnel.add(g);
      frames.push({ g, thin, glow, nodes, seed: Math.random() * 10 });
    }
    /* point on rounded-rect perimeter (approx: rectangle walk) */
    const perim = (u, out) => {
      const P = 2 * (W + H); let d = ((u % 1) + 1) % 1 * P;
      if (d < W) out.set(-W / 2 + d, -H / 2, 0.02);
      else if ((d -= W) < H) out.set(W / 2, -H / 2 + d, 0.02);
      else if ((d -= H) < W) out.set(W / 2 - d, H / 2, 0.02);
      else { d -= W; out.set(-W / 2, H / 2 - d, 0.02); }
      return out;
    };

    /* particle stream */
    const NP = mobile ? 380 : 900;
    const pPos = new Float32Array(NP * 3);
    for (let i = 0; i < NP; i++) {
      const a = Math.random() * Math.PI * 2, r = 1.2 + Math.random() * 7;
      pPos[i * 3] = Math.cos(a) * r; pPos[i * 3 + 1] = Math.sin(a) * r * 0.9; pPos[i * 3 + 2] = -Math.random() * DEPTH + 8;
    }
    const pGeo = new T.BufferGeometry();
    pGeo.setAttribute('position', new T.BufferAttribute(pPos, 3));
    const pts = new T.Points(pGeo, new T.PointsMaterial({ size: 0.07, map: dotTex, color: 0xcfc4ff, transparent: true, opacity: 0.85, depthWrite: false, blending: T.AdditiveBlending }));
    scene.add(pts);

    /* core light at the vanishing point */
    const core = new T.Sprite(new T.SpriteMaterial({ map: dotTex, color: 0x9d7bff, transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
    core.position.z = -DEPTH + 2; core.scale.setScalar(16);
    scene.add(core);

    /* layout: vanishing point sits right of the copy on desktop, high-centre on mobile */
    let shiftX = 0, shiftY = 0;
    function layout() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      if (w > 900) { shiftX = -w * 0.24; shiftY = 0; } else { shiftX = 0; shiftY = h * 0.22; }
      camera.setViewOffset(w, h, shiftX, shiftY, w, h);
      camera.updateProjectionMatrix();
    }
    layout();
    window.addEventListener('resize', layout, { passive: true });

    let mx = 0, my = 0, tx = 0, ty = 0, intro = 0, visible = true, warp = 0, lastY = window.scrollY;
    window.addEventListener('pointermove', e => { tx = (e.clientX / innerWidth) * 2 - 1; ty = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });
    if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(canvas);
    J.onReady(() => canvas.classList.add('is-on'));

    const tmp = new T.Vector3(), look = new T.Vector3(0, 0, -20);
    const clock = new T.Clock();
    (function frame() {
      requestAnimationFrame(frame);
      if (!visible || document.hidden) { clock.getDelta(); return; }
      const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
      if (J.ready) intro = Math.min(1, intro + dt * 0.55);
      const ease = 1 - Math.pow(1 - intro, 3);
      const y = window.scrollY, dy = y - lastY; lastY = y;
      warp = lerp(warp, clamp(Math.abs(dy) * 0.12, 0, 6), 0.08);
      const speed = reduce ? 0 : (1.6 + warp * 3) * (0.25 + ease * 0.75);
      mx = lerp(mx, tx, 0.04); my = lerp(my, ty, 0.04);

      camera.position.x = mx * 1.1; camera.position.y = -my * 0.8;
      camera.lookAt(look);
      camera.rotation.z = mx * -0.05;
      tunnel.rotation.z = t * 0.03;

      for (let i = 0; i < frames.length; i++) {
        const f = frames[i], g = f.g;
        g.position.z += speed * dt;
        if (g.position.z > 7.5) g.position.z -= DEPTH;
        const z = g.position.z;
        const depth = clamp((7.5 - z) / DEPTH, 0, 1);            /* 0 near camera → 1 far */
        const near = clamp((7.5 - z) / 5, 0, 1);                  /* fade just before passing the camera */
        const far = clamp(1 - depth * 1.05, 0, 1);
        const a = near * (0.25 + far * 0.75) * ease;
        const col = mix(depth);
        f.thin.material.color.copy(col); f.thin.material.opacity = a * 0.95;
        f.glow.material.color.copy(col); f.glow.material.opacity = a * 0.16;
        g.rotation.z = Math.sin(z * 0.09 + f.seed) * 0.12 + z * 0.012;
        const u = t * 0.06 + f.seed;
        perim(u, f.nodes[0].position); perim(u + 0.5, f.nodes[1].position);
        f.nodes.forEach(n => { n.material.opacity = a; n.material.color.copy(col).lerp(new T.Color(1, 1, 1), 0.5); });
      }
      const arr = pGeo.attributes.position.array;
      for (let i = 0; i < NP; i++) { arr[i * 3 + 2] += speed * dt * 1.6; if (arr[i * 3 + 2] > 8) arr[i * 3 + 2] -= DEPTH; }
      pGeo.attributes.position.needsUpdate = true;
      pts.material.size = 0.06 + warp * 0.02;
      core.material.opacity = (0.55 + Math.sin(t * 1.4) * 0.12) * ease;
      renderer.render(scene, camera);
    })();
  }

  /* ================================================ 1b. 3D KINETIC TYPE RING */
  function ring3d() {
    const ring = $('#ring3d'), stage = $('#ring3dStage');
    if (!ring) return;
    const items = $$('.ring3d__item', ring), n = items.length, now = $('#ring3dNow');
    let angles = [], r = 0, rot = 0, vel = 0, lastY = window.scrollY, inView = true, last = -1;
    function geo() {
      const gap = parseFloat(getComputedStyle(ring).fontSize) * 1.1;
      const widths = items.map(el => el.offsetWidth + gap);
      const C = widths.reduce((a, b) => a + b, 0);
      r = C / (Math.PI * 2);
      let acc = 0;
      angles = widths.map(w => { const a = (acc + w / 2) / C * 360; acc += w; return a; });
      ring.style.setProperty('--r', r.toFixed(1) + 'px');
      items.forEach((el, i) => { el.style.transform = `translate(-50%,-50%) rotateY(${angles[i].toFixed(2)}deg) translateZ(${r.toFixed(1)}px)`; });
    }
    geo();
    window.addEventListener('resize', geo, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(geo);
    if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => { inView = en.isIntersecting; }).observe(stage);
    J.onScroll((y, ch, time) => {
      if (!inView) { lastY = y; return; }
      const dy = y - lastY; lastY = y;
      vel = lerp(vel, dy * 0.06, 0.12);
      if (!reduce) rot += 0.09 + vel;
      ring.style.transform = `translateZ(${(-r).toFixed(1)}px) rotateY(${(-rot).toFixed(2)}deg)`;
      let best = 0, bestF = -2;
      items.forEach((el, i) => {
        const f = Math.cos((angles[i] - rot) * Math.PI / 180);   /* 1 = facing viewer */
        el.style.opacity = (f > 0 ? 0.25 + f * 0.75 : 0.1 + (f + 1) * 0.12).toFixed(3);
        el.classList.toggle('is-front', f > 0.9);
        el.classList.toggle('is-back', f < 0);
        if (f > bestF) { bestF = f; best = i; }
      });
      if (best !== last && now) { last = best; now.textContent = String(best + 1).padStart(2, '0') + ' — ' + items[best].textContent; }
    });
  }

  /* ============================================= 2. MOUSE-DEPTH PARALLAX */
  function depthParallax(zone, items, k) {
    if (!zone || !items.length || !finePointer || reduce) return;
    zone.addEventListener('pointermove', e => {
      const r = zone.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 2 - 1, y = ((e.clientY - r.top) / r.height) * 2 - 1;
      items.forEach(el => { const d = parseFloat(el.dataset.depth) * k; el.style.translate = `${(-x * d).toFixed(1)}px ${(-y * d).toFixed(1)}px`; });
    });
    zone.addEventListener('pointerleave', () => items.forEach(el => { el.style.translate = ''; }));
  }

  /* ================================================ 3. SCROLL-LIT STATEMENT */
  function statement() {
    const el = $('#statement');
    if (!el) return;
    const words = [];
    const walk = (node, grad) => {
      Array.from(node.childNodes).forEach(ch => {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(p => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            const s = document.createElement('span'); s.className = 'sw' + (grad ? ' grad' : ''); s.textContent = p;
            words.push(s); frag.appendChild(s);
          });
          ch.replaceWith(frag);
        } else if (ch.nodeType === 1) walk(ch, grad || ch.tagName === 'EM');
      });
    };
    walk(el, false);
    if (reduce) { words.forEach(w => { w.style.opacity = 1; }); return; }
    let last = -1;
    J.onScroll(() => {
      const r = el.getBoundingClientRect(), vh = innerHeight;
      const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.25), 0, 1);
      const lit = Math.round(p * words.length * 1.05);
      if (lit === last) return;
      last = lit;
      words.forEach((w, i) => { w.style.opacity = i < lit ? 1 : 0.16; });
    });
  }

  /* ============================================== 4b. TOOLS · tilted 3D deck */
  function toolsDeck() {
    const deck = $('#toolsDeck');
    if (!deck || reduce) return;
    J.onScroll((y, changed) => {
      if (!changed && y !== 0) return;
      const p = J.viewProgress(deck);                 /* 0 → 1 across the viewport */
      const k = clamp((p - 0.15) / 0.45, 0, 1), e = 1 - Math.pow(1 - k, 3);
      deck.style.setProperty('--rx', (34 * (1 - e)).toFixed(2) + 'deg');
      deck.style.setProperty('--tz', (-160 * (1 - e)).toFixed(1) + 'px');
      deck.style.setProperty('--op', (0.25 + e * 0.75).toFixed(3));
    });
  }

  /* ===================================== 4. SHOWCASE · 3D BROWSER STACK */
  function showcase() {
    const track = $('#showcase');
    if (!track) return;
    const builds = D.builds, n = builds.length;
    const wrap = $('#scBrowsers'), list = $('#scList'), screen = $('#scPhoneScreen');
    track.style.setProperty('--n', n);
    $('#scTotal').textContent = String(n).padStart(2, '0');

    wrap.innerHTML = builds.map((b, i) => `
      <article class="browser sc-browser" data-i="${i}" data-lb data-lb-wide="true" data-lb-tag="${esc((b.platform || 'GoHighLevel') + ' · Live build')}" data-lb-title="${esc(b.name)}" data-lb-desc="${esc(b.type + '. ' + b.desc + (b.platform ? ' Designed and coded end-to-end.' : ' Built end-to-end in GoHighLevel — funnel, booking flow and brand design.'))}" data-lb-src="${b.desktop}">
        <div class="browser__bar"><i></i><i></i><i></i><span>${esc(b.host)}</span></div>
        <div class="browser__body"><img src="${b.desktop}" alt="${esc(b.name)} website" ${i ? 'loading="lazy"' : ''}></div>
        <div class="sc-cap"><b>${esc(b.name)}</b><span>${esc(b.type)}</span><a class="link-arrow" href="${b.url}" target="_blank" rel="noopener">View live site ${J.icons.arrow}</a></div>
      </article>`).join('');
    list.innerHTML = builds.map((b, i) => `<li><button type="button" data-i="${i}"><small>${String(i + 1).padStart(2, '0')}</small>${esc(b.name)}</button></li>`).join('');
    screen.innerHTML = builds.map((b, i) => `<img src="${b.mobile}" alt="" ${i ? 'loading="lazy"' : ''}>`).join('');
    J.bind(wrap);

    const cards = $$('.sc-browser', wrap), btns = $$('button', list), shots = $$('img', screen);
    const num = $('#scNum'), desc = $('#scDesc'), link = $('#scLink'), bar = $('#scBar');
    let cur = 0, active = -1;

    const setActive = i => {
      if (i === active) return;
      active = i;
      num.textContent = String(i + 1).padStart(2, '0');
      desc.textContent = builds[i].desc;
      link.href = builds[i].url;
      btns.forEach((b, k) => b.classList.toggle('is-active', k === i));
      shots.forEach((s, k) => s.classList.toggle('is-active', k === i));
    };
    setActive(0);

    btns.forEach(b => b.addEventListener('click', () => {
      const i = +b.dataset.i;
      const top = track.getBoundingClientRect().top + window.scrollY;
      const dist = track.offsetHeight - window.innerHeight;
      const y = top + (i / (n - 1)) * dist + 2;
      if (J.lenis) J.lenis.scrollTo(y, { duration: 1.2 }); else window.scrollTo({ top: y, behavior: 'smooth' });
    }));

    J.onScroll(() => {
      if (isMobile() || window.innerWidth <= 900) return;
      const p = J.stickyProgress(track);
      const target = p * (n - 1);
      cur = reduce ? target : lerp(cur, target, 0.12);
      if (Math.abs(cur - target) < 0.0005) cur = target;
      bar.style.transform = `scaleX(${p})`;
      setActive(clamp(Math.round(cur), 0, n - 1));
      cards.forEach((c, i) => {
        const d = i - cur;
        let tf, op, z;
        if (d >= 0) {
          tf = `translate3d(0,${(-d * 7).toFixed(2)}%,${(-d * 150).toFixed(1)}px) rotateX(${(d * 3).toFixed(2)}deg) scale(${(1 - d * 0.035).toFixed(4)})`;
          op = d > 3.2 ? 0 : 1 - d * 0.18;
          z = 100 - Math.round(d * 10);
          c.style.filter = `brightness(${(1 - Math.min(d, 3) * 0.22).toFixed(3)})`;
        } else {
          const k = -d;
          tf = `translate3d(0,${(k * 46).toFixed(2)}%,${(k * 220).toFixed(1)}px) rotateX(${(-k * 32).toFixed(2)}deg) scale(${(1 + k * 0.04).toFixed(4)})`;
          op = clamp(1 - k * 1.6, 0, 1);
          z = 200;
          c.style.filter = '';
        }
        c.style.transform = tf;
        c.style.opacity = op.toFixed(3);
        c.style.zIndex = z;
        c.style.pointerEvents = Math.abs(d) < 0.5 ? 'auto' : 'none';
      });
    });
  }

  /* ==================================================== 5. COVER FLOW */
  function coverflow() {
    const root = $('#coverflow'), stage = $('#cfStage');
    if (!root) return;
    const items = D.highlights.filter(h => h.cat === 'automation');
    const n = items.length;
    stage.innerHTML = items.map((it, i) => `
      <div class="cf-card" data-i="${i}" tabindex="0" role="button" aria-label="Open ${esc(it.title)}">
        <div class="cf-card__media">${J.flowHtml(it)}</div>
        <div class="cf-card__cap"><span class="tag">${esc(it.tag)}</span><h3>${esc(it.title)}</h3><p>${esc(it.blurb)}</p></div>
      </div>`).join('');
    const cards = $$('.cf-card', stage), count = $('#cfCount');
    let idx = 0, timer = null, hover = false, inView = false;

    function layout() {
      const vw = root.offsetWidth;
      const cw = cards[0].offsetWidth;
      const spacing = vw < 640 ? cw * 0.62 : Math.min(cw * 0.78, vw * 0.22);
      cards.forEach((c, i) => {
        let o = ((i - idx) % n + n) % n;
        if (o > n / 2) o -= n;
        const a = Math.abs(o);
        c.style.transform = `translate(-50%,-50%) translate3d(${o * spacing}px,0,${-a * 200}px) rotateY(${clamp(-o * 42, -60, 60)}deg) scale(${1 - Math.min(a, 3) * 0.06})`;
        c.style.opacity = a > 2 ? 0 : 1 - a * 0.15;
        c.style.zIndex = 50 - a;
        c.style.pointerEvents = a > 2 ? 'none' : 'auto';
        c.classList.toggle('is-active', o === 0);
        c.setAttribute('aria-hidden', a > 2 ? 'true' : 'false');
      });
      count.textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
    }
    const go = d => { idx = (idx + d + n) % n; layout(); };
    const stop = () => { clearInterval(timer); timer = null; };
    const start = () => { stop(); if (!reduce && inView && !hover && !document.querySelector('.modal.is-open')) timer = setInterval(() => go(1), 3600); };

    $('#cfPrev').addEventListener('click', () => { go(-1); start(); });
    $('#cfNext').addEventListener('click', () => { go(1); start(); });
    root.addEventListener('pointerenter', () => { hover = true; stop(); });
    root.addEventListener('pointerleave', () => { hover = false; start(); });
    root.addEventListener('focusin', stop);
    document.addEventListener('jmx:modalclose', start);
    if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => { inView = en.isIntersecting; inView ? start() : stop(); }, { threshold: 0.3 }).observe(root);

    /* drag / swipe + tap */
    let sx = null, moved = 0, downCard = null;
    root.addEventListener('pointerdown', e => { sx = e.clientX; moved = 0; downCard = e.target.closest('.cf-card'); });
    window.addEventListener('pointermove', e => { if (sx !== null) moved = e.clientX - sx; });
    window.addEventListener('pointerup', () => {
      if (sx === null) return;
      if (Math.abs(moved) > 40) { go(moved < 0 ? 1 : -1); start(); }
      else if (downCard) activate(+downCard.dataset.i);
      sx = null; downCard = null;
    });
    const activate = i => { if (i === idx) { stop(); J.openLightbox(items[i]); } else { idx = i; layout(); } };
    cards.forEach(c => c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(+c.dataset.i); } }));
    root.addEventListener('keydown', e => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); });
    window.addEventListener('resize', layout, { passive: true });
    layout();
  }

  /* ================================================== 6. ORBITAL GALLERY */
  function orbit() {
    const root = $('#orbit'), ring = $('#orbitRing');
    if (!root) return;
    const items = D.highlights.filter(h => h.cat === 'creative');
    const n = items.length, step = 360 / n;
    ring.innerHTML = items.map((it, i) => `
      <div class="orbit-card" data-i="${i}" tabindex="0" role="button" aria-label="View ${esc(it.title)}" style="--a:${i * step}deg">
        <img src="${it.image}" alt="${esc(it.alt)}" loading="lazy" draggable="false">
        <span class="orbit-card__cap">${esc(it.title)}</span>
      </div>`).join('');
    const cards = $$('.orbit-card', ring);
    const geo = () => {
      const vw = root.offsetWidth;
      const cw = clamp(vw * 0.16, 132, 230);
      const r = (cw / 2) / Math.sin(Math.PI / n) * 1.12;
      root.style.setProperty('--cw', cw + 'px');
      cards.forEach(c => { c.style.setProperty('--cw', cw + 'px'); c.style.setProperty('--r', r + 'px'); });
    };
    geo();
    window.addEventListener('resize', geo, { passive: true });

    let rot = 0, vel = 0, paused = false, dragging = false, inView = false, sx = 0, lx = 0, downCard = null, last = performance.now();
    if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => { inView = en.isIntersecting; }).observe(root);
    cards.forEach(c => {
      c.addEventListener('pointerenter', () => { paused = true; });
      c.addEventListener('pointerleave', () => { paused = false; });
      c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); J.openLightbox(items[+c.dataset.i]); } });
      c.addEventListener('focus', () => { paused = true; });
      c.addEventListener('blur', () => { paused = false; });
    });
    root.addEventListener('pointerdown', e => { dragging = true; sx = lx = e.clientX; vel = 0; downCard = e.target.closest('.orbit-card'); });
    window.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - lx; lx = e.clientX;
      rot += dx * 0.3; vel = dx * 0.3;
    }, { passive: true });
    window.addEventListener('pointerup', e => {
      if (!dragging) return;
      dragging = false;
      if (Math.abs(e.clientX - sx) < 6 && downCard) { vel = 0; J.openLightbox(items[+downCard.dataset.i]); }
      downCard = null;
    });

    J.onScroll((y, ch, now) => {
      const dt = Math.min((now - last) / 16.7, 3); last = now;
      if (!inView) return;
      if (!dragging) {
        vel *= Math.pow(0.94, dt);
        rot += vel * dt;
        if (!paused && !reduce && !document.querySelector('.modal.is-open')) rot -= 0.14 * dt;
      }
      ring.style.transform = `rotateX(-7deg) rotateY(${rot.toFixed(2)}deg)`;
      cards.forEach((c, i) => {
        const a = ((i * step + rot) % 360 + 360) % 360;
        const f = Math.cos(a * Math.PI / 180);
        c.style.opacity = (0.28 + 0.72 * Math.max(0, f)).toFixed(3);
        c.style.pointerEvents = f > 0.2 ? 'auto' : 'none';
      });
    });
  }

  /* ================================================= 7. STACKED CARDS */
  function stack() {
    const root = $('#stack');
    if (!root) return;
    const items = D.highlights.filter(h => h.cat === 'amazon');
    const n = items.length;
    root.innerHTML = items.map((it, i) => `
      <div class="stk-card" data-i="${i}" role="button" tabindex="-1" aria-label="View ${esc(it.title)}">
        <img src="${it.image}" alt="${esc(it.alt)}" loading="lazy" draggable="false">
        <span class="stk-card__view">${J.icons.expand} View</span>
      </div>`).join('');
    const cards = $$('.stk-card', root);
    let order = items.map((_, i) => i), timer = null, hover = false, inView = false;
    const meta = { num: $('#stkNum'), tag: $('#stkTag'), title: $('#stkTitle'), blurb: $('#stkBlurb') };
    $('#stkTotal').textContent = String(n).padStart(2, '0');
    const rots = [0, -3.5, 3, -2.2, 2];

    function layout() {
      order.forEach((ci, k) => {
        const c = cards[ci];
        c.classList.toggle('is-front', k === 0);
        c.setAttribute('tabindex', k === 0 ? '0' : '-1');
        c.style.zIndex = 50 - k;
        c.style.opacity = k > 3 ? 0 : 1;
        c.style.filter = `brightness(${1 - Math.min(k, 3) * 0.16})`;
        c.style.transform = k === 0 ? 'translate3d(0,0,0)' :
          `translate3d(${k * 10}px,${-k * 24}px,${-k * 70}px) rotate(${rots[k] || 0}deg) scale(${1 - k * 0.05})`;
      });
      const it = items[order[0]];
      meta.num.textContent = String(order[0] + 1).padStart(2, '0');
      meta.tag.textContent = it.tag; meta.title.textContent = it.title; meta.blurb.textContent = it.blurb;
    }
    function fling(dir) {
      const c = cards[order[0]];
      c.style.transform = `translate3d(${dir * 135}%, -8%, 60px) rotate(${dir * 24}deg)`;
      c.style.opacity = 0;
      setTimeout(() => { order.push(order.shift()); layout(); }, 380);
    }
    function back() {
      order.unshift(order.pop());
      const c = cards[order[0]];
      c.style.transition = 'none';
      c.style.transform = 'translate3d(-135%,-8%,60px) rotate(-24deg)'; c.style.opacity = 0; c.style.zIndex = 60;
      void c.offsetWidth;
      c.style.transition = '';
      layout();
    }
    const stop = () => { clearInterval(timer); timer = null; };
    const start = () => { stop(); if (!reduce && inView && !hover) timer = setInterval(() => fling(1), 4200); };
    $('#stkNext').addEventListener('click', () => { fling(1); start(); });
    $('#stkPrev').addEventListener('click', () => { back(); start(); });
    root.addEventListener('pointerenter', () => { hover = true; stop(); });
    root.addEventListener('pointerleave', () => { hover = false; start(); });
    document.addEventListener('jmx:modalclose', start);
    if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => { inView = en.isIntersecting; inView ? start() : stop(); }, { threshold: 0.4 }).observe(root);

    /* swipe the front card */
    let sx = null, dx = 0, front = null;
    root.addEventListener('pointerdown', e => {
      front = e.target.closest('.stk-card.is-front');
      if (!front) { if (e.target.closest('.stk-card')) { fling(1); start(); } return; }
      sx = e.clientX; dx = 0; front.classList.add('is-dragging'); stop();
    });
    window.addEventListener('pointermove', e => {
      if (sx === null) return;
      dx = e.clientX - sx;
      front.style.transform = `translate3d(${dx}px,${Math.abs(dx) * -0.05}px,0) rotate(${dx * 0.04}deg)`;
    }, { passive: true });
    window.addEventListener('pointerup', () => {
      if (sx === null) return;
      front.classList.remove('is-dragging');
      if (Math.abs(dx) > 90) fling(dx > 0 ? 1 : -1);
      else { layout(); if (Math.abs(dx) < 6) J.openLightbox(items[+front.dataset.i]); }
      sx = null; front = null;
    });
    root.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); J.openLightbox(items[order[0]]); }
      if (e.key === 'ArrowRight') fling(1);
      if (e.key === 'ArrowLeft') back();
    });
    layout();
  }

  /* ================================================ 8. PROCESS LINE */
  function process() {
    const el = $('#process');
    if (!el) return;
    const line = $('.process__line', el), steps = $$('.process__step', el);
    J.onScroll((y, changed) => {
      if (!changed && y !== 0) return;
      const r = el.getBoundingClientRect(), vh = innerHeight;
      const p = clamp((vh * 0.75 - r.top) / (r.height * 0.9), 0, 1);
      line.style.setProperty('--p', p.toFixed(3));
      steps.forEach((s, i) => s.classList.toggle('is-lit', p >= i / (steps.length - 1) - 0.02 && p > 0.02));
    });
  }

  /* ============================================================ init */
  hero3D();
  /* hero stat cards rise into place in 3D once the loader clears */
  J.onReady(() => { const h = $('#hstats'); if (h) setTimeout(() => h.classList.add('is-on'), 300); });
  ring3d();
  depthParallax($('#hero'), $$('.hero__aside [data-depth]'), 1);
  depthParallax($('#services'), $$('#space [data-depth]'), 0.6);
  statement();
  toolsDeck();
  showcase();
  coverflow();
  orbit();
  stack();
  process();
  J.bind();
})();
