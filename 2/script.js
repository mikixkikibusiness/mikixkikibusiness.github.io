/* ==========================================================================
   Michael — Apple-Style Portfolio
   Vanilla JS. Everything hand-rolled:
   lerp smooth-scroll · IntersectionObserver reveals · pinned approach ·
   magnetic buttons · custom cursor · 3D Look-In tilt · YouTube facades ·
   iframe fallback detection · nav indicator.
   All scroll/mousemove work is rAF-gated.
   ========================================================================== */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer  = window.matchMedia('(pointer: fine)').matches;

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const lerp  = (a, b, t) => a + (b - a) * t;

  $('#year').textContent = new Date().getFullYear();

  /* ========================================================================
     1. Custom lerp smooth-scroll ("weighted" Apple feel)
     A tall spacer keeps the document height; #smooth-content is fixed and
     translated by the interpolated scroll position each frame.
     ======================================================================== */
  const content = $('#smooth-content');
  let spacer = null;
  let currentScroll = window.scrollY;
  let targetScroll  = window.scrollY;
  let scrollRafId   = null;

  if (!reduceMotion) {
    spacer = document.createElement('div');
    spacer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(spacer);

    const setHeights = () => {
      spacer.style.height = content.offsetHeight + 'px';
      document.body.style.overflow = 'hidden';
      content.style.position = 'fixed';
      content.style.top = '0';
      content.style.left = '0';
      content.style.width = '100%';
      content.style.willChange = 'transform';
    };
    setHeights();

    // Recalculate after fonts/iframes settle and on resize
    window.addEventListener('resize', setHeights);
    window.addEventListener('load', setHeights);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(setHeights);

    const maxScroll = () => Math.max(0, content.offsetHeight - window.innerHeight);

    window.addEventListener('scroll', () => {
      targetScroll = clamp(window.scrollY, 0, maxScroll());
      if (scrollRafId === null) scrollRafId = requestAnimationFrame(tickScroll);
    }, { passive: true });

    function tickScroll() {
      currentScroll = lerp(currentScroll, targetScroll, 0.1); // weight
      if (Math.abs(targetScroll - currentScroll) < 0.1) {
        currentScroll = targetScroll;
        content.style.transform = `translate3d(0, ${-currentScroll}px, 0)`;
        scrollRafId = null;
        onScrollFrame();
        return;
      }
      content.style.transform = `translate3d(0, ${-currentScroll}px, 0)`;
      onScrollFrame();
      scrollRafId = requestAnimationFrame(tickScroll);
    }

    // Anchor links: animate the real scroll position so the lerp picks it up
    $$('[data-scroll-to]').forEach(link => {
      link.addEventListener('click', e => {
        const target = $(link.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        const y = target.getBoundingClientRect().top + currentScroll;
        window.scrollTo(0, clamp(y, 0, maxScroll()));
      });
    });
  } else {
    // Reduced motion: native smooth anchor scrolling only
    document.documentElement.style.scrollBehavior = 'smooth';
  }

  const getScrollY = () => (reduceMotion ? window.scrollY : currentScroll);

  /* ========================================================================
     2. IntersectionObserver — staggered reveals (60–100ms via inline --d)
     ======================================================================== */
  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  $$('.reveal, .reveal-scale').forEach(el => revealIO.observe(el));

  /* ========================================================================
     3. Nav — frosted state + sliding active-section indicator
     ======================================================================== */
  const nav = $('#nav');
  const indicator = $('#navIndicator');
  const navLinks = $$('.nav__link');
  const sectionByLink = new Map();
  navLinks.forEach(link => {
    const sec = $(link.getAttribute('href'));
    if (sec) sectionByLink.set(sec, link);
  });

  const sectionIO = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const link = sectionByLink.get(entry.target);
      if (!link) return;
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('is-active'));
        link.classList.add('is-active');
        moveIndicator(link);
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sectionByLink.forEach((_, sec) => sectionIO.observe(sec));

  function moveIndicator(link) {
    if (!link || link.classList.contains('nav__link--cta')) {
      indicator.classList.remove('is-visible');
      return;
    }
    const parent = link.parentElement.getBoundingClientRect();
    const rect = link.getBoundingClientRect();
    indicator.style.width = rect.width + 'px';
    indicator.style.transform = `translateX(${rect.left - parent.left}px)`;
    indicator.classList.add('is-visible');
  }

  /* ========================================================================
     4. Pinned approach — text swap driven by scroll progress in section
     ======================================================================== */
  const approach = $('.approach');
  const statements = $$('.approach__statement');
  let activeStep = 0;

  function updateApproach() {
    if (!approach || reduceMotion) return;
    const rect = approach.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    if (scrollable <= 0) return;
    const progress = clamp(-rect.top / scrollable, 0, 1);
    const step = Math.min(statements.length - 1, Math.floor(progress * statements.length));
    if (step !== activeStep) {
      activeStep = step;
      statements.forEach(s => s.classList.toggle('is-active', +s.dataset.step === step));
    }
  }

  /* ========================================================================
     5. Parallax — hero background at ~0.25x scroll rate
     ======================================================================== */
  const heroBg = $('#heroBg');
  function updateParallax() {
    if (!heroBg || reduceMotion) return;
    const y = getScrollY();
    if (y < window.innerHeight * 1.2) {
      heroBg.style.transform = `translate3d(0, ${y * 0.25}px, 0)`;
    }
  }

  /* Shared per-scroll-frame hook (called from the lerp loop and natively) */
  function onScrollFrame() {
    nav.classList.toggle('is-scrolled', getScrollY() > 24);
    updateApproach();
    updateParallax();
  }

  if (reduceMotion) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => { onScrollFrame(); ticking = false; });
      }
    }, { passive: true });
  }
  onScrollFrame();

  /* ========================================================================
     6. Hero mouse parallax — blobs drift gently toward cursor (≤0.4x feel)
     ======================================================================== */
  if (finePointer && !reduceMotion) {
    const hero = $('#hero');
    const blobs = $$('.hero__blob');
    let mx = 0, my = 0, cx = 0, cy = 0, heroRaf = null;

    hero.addEventListener('mousemove', e => {
      mx = (e.clientX / window.innerWidth  - 0.5);
      my = (e.clientY / window.innerHeight - 0.5);
      if (heroRaf === null) heroRaf = requestAnimationFrame(tickHero);
    }, { passive: true });

    function tickHero() {
      cx = lerp(cx, mx, 0.06);
      cy = lerp(cy, my, 0.06);
      blobs.forEach((b, i) => {
        const depth = 18 + i * 12; // px, subtle
        b.style.translate = `${cx * depth}px ${cy * depth}px`;
      });
      if (Math.abs(cx - mx) > 0.001 || Math.abs(cy - my) > 0.001) {
        heroRaf = requestAnimationFrame(tickHero);
      } else heroRaf = null;
    }
  }

  /* ========================================================================
     7. Magnetic buttons — pull toward cursor inside bounds, spring back
     ======================================================================== */
  if (finePointer && !reduceMotion) {
    $$('.magnetic').forEach(btn => {
      const strength = 0.3, maxPull = 10;
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        btn.style.transition = 'none';
        btn.style.transform =
          `translate(${clamp(dx * strength, -maxPull, maxPull)}px,
                     ${clamp(dy * strength, -maxPull, maxPull)}px)`;
      }, { passive: true });
      btn.addEventListener('mouseleave', () => {
        btn.style.transition = 'transform .5s cubic-bezier(0.16, 1, 0.3, 1)';
        btn.style.transform = 'translate(0, 0)';
      });
    });
  }

  /* ========================================================================
     8. Custom cursor — dot that scales/inverts over interactive elements
     ======================================================================== */
  if (finePointer && !reduceMotion) {
    document.body.classList.add('has-cursor');
    const cursor = $('#cursor');
    let tx = -100, ty = -100, x = tx, y = ty;

    document.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    document.addEventListener('mouseover', e => {
      cursor.classList.toggle('is-active',
        !!e.target.closest('a, button, .yt-card__poster, .lookin__overlay'));
    });

    (function tickCursor() {
      x = lerp(x, tx, 0.2);
      y = lerp(y, ty, 0.2);
      cursor.style.left = x + 'px';
      cursor.style.top  = y + 'px';
      requestAnimationFrame(tickCursor);
    })();
  }

  /* ========================================================================
     9. Look-In embeds — lazy iframe load, fallback detection, 3D tilt
     ======================================================================== */
  const FRAME_TIMEOUT = 6000; // ms before assuming the site blocks framing

  $$('.lookin').forEach((lookin, i) => {
    const iframe  = $('.lookin__iframe', lookin);
    const frame   = $('.lookin__frame', lookin);
    const url     = lookin.dataset.url;

    // Lazy-load the iframe only when the component nears the viewport
    const loadIO = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        loadIO.disconnect();
        let loaded = false;

        iframe.addEventListener('load', () => { loaded = true; }, { once: true });
        iframe.src = iframe.dataset.src;

        // X-Frame-Options/CSP blocks produce no usable load — fall back
        setTimeout(() => {
          if (!loaded) lookin.classList.add('has-failed');
        }, FRAME_TIMEOUT + i * 500);

        // A blocked frame often fires `load` with an error page; if the
        // browser exposes it as inaccessible/blank we still treat it as ok
        // (same-origin checks are impossible cross-domain — timeout is the
        // reliable signal). Screenshot fallback stays as the safety net.
      });
    }, { rootMargin: '300px' });
    loadIO.observe(lookin);

    // 3D tilt on mouse move (max ~7deg), spring back on leave
    if (finePointer && !reduceMotion) {
      let raf = null, rx = 0, ry = 0, trx = 0, try_ = 0;

      frame.addEventListener('mousemove', e => {
        const r = frame.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width  - 0.5;
        const py = (e.clientY - r.top)  / r.height - 0.5;
        try_ = px * 7;          // rotateY
        trx  = -py * 7;         // rotateX
        if (raf === null) raf = requestAnimationFrame(tickTilt);
      }, { passive: true });

      frame.addEventListener('mouseleave', () => {
        trx = 0; try_ = 0;
        if (raf === null) raf = requestAnimationFrame(tickTilt);
      });

      function tickTilt() {
        rx = lerp(rx, trx, 0.12);
        ry = lerp(ry, try_, 0.12);
        frame.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
        if (Math.abs(rx - trx) > 0.05 || Math.abs(ry - try_) > 0.05) {
          raf = requestAnimationFrame(tickTilt);
        } else { frame.style.transform = 'rotateX(0) rotateY(0)'; raf = null; }
      }
    }

    // Click anywhere on the chrome bar opens the site (iframe handles itself)
    $('.lookin__chrome', lookin).addEventListener('click', () => {
      window.open(url, '_blank', 'noopener');
    });
    $('.lookin__chrome', lookin).style.cursor = 'pointer';
  });

  /* ========================================================================
     10. YouTube facades — poster + play button, iframe injected on click
         (YouTube JS never loads until interaction)
     ======================================================================== */
  $$('.yt-card').forEach(card => {
    const videoId = card.dataset.videoId;
    const poster  = $('.yt-card__poster', card);
    const screen  = $('.yt-card__screen', card);

    // Try YouTube's auto-generated thumbnail as the poster backdrop
    if (videoId && !videoId.startsWith('[')) {
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth > 120) { // 120x90 = YouTube's "no thumb" placeholder
          poster.style.background = `url(https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg) center/cover`;
          poster.style.backgroundColor = '#000';
        }
      };
      img.src = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
    }

    poster.addEventListener('click', () => {
      if (!videoId || videoId.startsWith('[')) {
        console.warn('[portfolio] YouTube video ID placeholder not set for', card);
        return;
      }
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
      iframe.title = 'Project preview video';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      poster.remove();
      screen.appendChild(iframe);
    });
  });

})();
