(() => {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  /* ==========================================================================
     CUSTOM CURSOR
     ========================================================================== */
  const cursor = document.getElementById('cursorDot');
  if (cursor && !prefersReduced) {
    let cx = 0, cy = 0, tx = 0, ty = 0;

    window.addEventListener('mousemove', (e) => {
      tx = e.clientX;
      ty = e.clientY;
      cursor.classList.add('is-active');
    }, { passive: true });

    document.querySelectorAll('a, button, [data-lookin], [data-video]').forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-hovering'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hovering'));
    });

    (function cursorTick() {
      cx = lerp(cx, tx, 0.22);
      cy = lerp(cy, ty, 0.22);
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(cursorTick);
    })();
  }

  /* ==========================================================================
     SCROLL PROGRESS + NAV STATE
     ========================================================================== */
  const progressBar = document.getElementById('scrollProgress');
  const nav = document.getElementById('nav');
  const navLinks = document.querySelectorAll('[data-nav-link]');

  function updateScrollChrome() {
    const doc = document.documentElement;
    const scrollTop = window.scrollY;
    const max = doc.scrollHeight - doc.clientHeight;
    const pct = max > 0 ? (scrollTop / max) * 100 : 0;
    if (progressBar) progressBar.style.width = pct.toFixed(2) + '%';
    if (nav) nav.classList.toggle('is-scrolled', scrollTop > 40);
    updateApproachProgress();
  }

  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        updateScrollChrome();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });

  /* Active nav link tracking */
  const navMap = new Map();
  navLinks.forEach((link) => {
    const id = link.getAttribute('href').replace('#', '');
    navMap.set(id, link);
  });
  const navSectionEls = Array.from(navMap.keys())
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if (navSectionEls.length) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((l) => l.classList.remove('is-active'));
          const link = navMap.get(entry.target.id);
          if (link) link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    navSectionEls.forEach((el) => navObserver.observe(el));
  }

  /* ==========================================================================
     APPROACH — PINNED, SCROLL-LINKED STATEMENT
     ========================================================================== */
  const approachSection = document.getElementById('approach');
  const approachSegs = document.querySelectorAll('.approach-seg');

  function updateApproachProgress() {
    if (!approachSection || !approachSegs.length) return;
    const rect = approachSection.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    if (total <= 0) return;
    const progress = clamp(-rect.top / total, 0, 1);
    approachSegs.forEach((seg) => {
      const from = parseFloat(seg.dataset.progressFrom);
      const to = parseFloat(seg.dataset.progressTo);
      const local = clamp((progress - from) / (to - from), 0, 1);
      seg.style.opacity = (0.25 + local * 0.75).toFixed(3);
    });
  }

  /* ==========================================================================
     SCROLL REVEALS (IntersectionObserver)
     ========================================================================== */
  const revealEls = document.querySelectorAll('.reveal-up:not([data-delay])');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  revealEls.forEach((el) => revealObserver.observe(el));

  /* ==========================================================================
     HERO ENTRANCE (staggered, runs once on load — not scroll-triggered
     since the hero is already in view)
     ========================================================================== */
  function heroEntrance() {
    const eyebrow = document.querySelector('.hero .eyebrow');
    const words = document.querySelectorAll('.hero-word');
    const sub = document.querySelector('.hero-sub');
    const cta = document.querySelector('.hero .btn');

    if (eyebrow) setTimeout(() => eyebrow.classList.add('is-visible'), 150);
    words.forEach((w, i) => setTimeout(() => w.classList.add('is-visible'), 420 + i * 55));
    const wordsEnd = 420 + words.length * 55;
    if (sub) setTimeout(() => sub.classList.add('is-visible'), wordsEnd + 250);
    if (cta) setTimeout(() => cta.classList.add('is-visible'), wordsEnd + 500);
  }
  requestAnimationFrame(() => setTimeout(heroEntrance, 80));

  /* ==========================================================================
     HERO BACKGROUND PARALLAX (mouse-reactive, lerped)
     ========================================================================== */
  const heroSection = document.getElementById('hero');
  const heroBg = document.getElementById('heroBg');
  if (heroSection && heroBg && !prefersReduced) {
    let mx = 0, my = 0, tmx = 0, tmy = 0;
    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      tmx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      tmy = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    });
    (function heroParallaxTick() {
      mx = lerp(mx, tmx, 0.05);
      my = lerp(my, tmy, 0.05);
      heroBg.style.setProperty('--mx', mx.toFixed(3));
      heroBg.style.setProperty('--my', my.toFixed(3));
      requestAnimationFrame(heroParallaxTick);
    })();
  }

  /* ==========================================================================
     MAGNETIC BUTTONS
     ========================================================================== */
  if (!prefersReduced) {
    document.querySelectorAll('.magnetic').forEach((btn) => {
      let bx = 0, by = 0, tbx = 0, tby = 0;
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        tbx = (e.clientX - rect.left - rect.width / 2) * 0.35;
        tby = (e.clientY - rect.top - rect.height / 2) * 0.35;
      });
      btn.addEventListener('mouseleave', () => { tbx = 0; tby = 0; });
      (function magneticTick() {
        bx = lerp(bx, tbx, 0.18);
        by = lerp(by, tby, 0.18);
        btn.style.transform = `translate(${bx.toFixed(2)}px, ${by.toFixed(2)}px)`;
        requestAnimationFrame(magneticTick);
      })();
    });
  }

  /* ==========================================================================
     "LOOK-IN" EMBED — 3D TILT
     ========================================================================== */
  if (!prefersReduced) {
    document.querySelectorAll('.showcase-frame-wrap').forEach((wrap) => {
      const frame = wrap.querySelector('.browser-frame');
      if (!frame) return;
      let rx = 0, ry = 0, trx = 0, try_ = 0;
      wrap.addEventListener('mousemove', (e) => {
        const rect = wrap.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        try_ = (px - 0.5) * 10;
        trx = (0.5 - py) * 8;
      });
      wrap.addEventListener('mouseleave', () => { trx = 0; try_ = 0; });
      (function tiltTick() {
        rx = lerp(rx, trx, 0.12);
        ry = lerp(ry, try_, 0.12);
        frame.style.transform = `perspective(1400px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
        requestAnimationFrame(tiltTick);
      })();
    });
  }

  /* ==========================================================================
     "LOOK-IN" EMBED — LAZY LOAD + GRACEFUL FALLBACK
     Many sites block being framed via X-Frame-Options / CSP without firing a
     JS 'error' event (the frame just loads blank), so a timeout is the most
     reliable signal here — matches the fallback approach from the build spec.
     ========================================================================== */
  document.querySelectorAll('.browser-frame[data-lookin]').forEach((frame) => {
    const iframe = frame.querySelector('.browser-iframe');
    const body = frame.querySelector('.browser-body');
    if (!iframe || !body) return;
    const src = iframe.dataset.src;
    let settled = false;

    const markLoaded = () => { if (!settled) { settled = true; iframe.classList.add('is-loaded'); } };
    const markFallback = () => { if (!settled) { settled = true; body.classList.add('is-fallback'); } };

    const loadObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          iframe.src = src;
          setTimeout(() => { if (!settled) markFallback(); }, 4500);
          loadObserver.disconnect();
        }
      });
    }, { rootMargin: '200px' });
    loadObserver.observe(frame);

    iframe.addEventListener('load', markLoaded);
    iframe.addEventListener('error', markFallback);
  });

  /* ==========================================================================
     YOUTUBE SHOWCASE — CLICK-TO-LOAD (keeps YouTube's JS off the page
     until the visitor actually presses play)
     ========================================================================== */
  document.querySelectorAll('.video-frame[data-video]').forEach((frame) => {
    const btn = frame.querySelector('.play-btn');
    const poster = frame.querySelector('.video-poster');
    const ytId = frame.dataset.ytId;
    if (!btn) return;
    btn.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.className = 'video-iframe';
      iframe.src = `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`;
      iframe.title = 'Project showcase video';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.loading = 'lazy';
      frame.appendChild(iframe);
      if (poster) poster.style.display = 'none';
    }, { once: true });
  });

  /* ==========================================================================
     EASED ANCHOR SCROLL
     Custom rAF-driven easing for in-page navigation (nav links, CTA, footer),
     giving that "weighted" Apple-style scroll on click. Ordinary wheel/trackpad
     scrolling stays fully native — intentionally not hijacked — so that
     position: sticky (nav, pinned Approach section) keeps working perfectly.
     ========================================================================== */
  function easedScrollTo(targetY, duration = 900) {
    const startY = window.scrollY;
    const diff = targetY - startY;
    const startTime = performance.now();
    function step(now) {
      const t = clamp((now - startTime) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      window.scrollTo(0, startY + diff * eased);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const navHeight = nav ? nav.offsetHeight : 0;
      const y = target.getBoundingClientRect().top + window.scrollY - navHeight + 1;
      if (prefersReduced) {
        window.scrollTo(0, y);
      } else {
        easedScrollTo(y);
      }
    });
  });

  /* Initial paint */
  updateScrollChrome();
})();
