/* =========================================================================
   MICHAEL — PORTFOLIO
   Vanilla JS only. No dependencies.
   Sections: reduced-motion check, hero word reveal + accent word, scroll
   reveals, pinned philosophy progress, magnetic buttons, look-in tilt +
   image fade-in, youtube showcase click-to-embed, eased anchor scroll,
   active nav link.
   ========================================================================= */

(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* =======================================================================
     HERO — word-by-word headline reveal
     ======================================================================= */

  function initHeroReveal() {
    var headline = document.getElementById("hero-headline");
    if (!headline) return;

    var fullText = headline.getAttribute("aria-label") || "";
    var words = fullText.split(" ").filter(Boolean);

    // The single word that carries the blue accent instead of solid black.
    // Matched case-insensitively, punctuation stripped, so "software" still
    // matches if the headline copy ever picks up trailing punctuation.
    var accentWord = "software";

    var frag = document.createDocumentFragment();
    words.forEach(function (word, i) {
      var span = document.createElement("span");
      var bareWord = word.replace(/[^\w]/g, "").toLowerCase();
      span.className = bareWord === accentWord ? "word word-accent" : "word";
      span.textContent = word;
      frag.appendChild(span);
      if (i < words.length - 1) {
        frag.appendChild(document.createTextNode(" "));
      }
    });
    headline.appendChild(frag);

    var wordEls = headline.querySelectorAll(".word");

    if (prefersReducedMotion) {
      wordEls.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    // Stagger word reveal shortly after load.
    requestAnimationFrame(function () {
      wordEls.forEach(function (el, i) {
        setTimeout(function () {
          el.classList.add("is-visible");
        }, 80 * i);
      });
    });
  }

  /* =======================================================================
     SCROLL REVEALS — IntersectionObserver, staggered within groups
     ======================================================================= */

  function initScrollReveals() {
    var revealEls = document.querySelectorAll(".reveal");
    if (!revealEls.length) return;

    if (prefersReducedMotion) {
      revealEls.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* =======================================================================
     PHILOSOPHY — pinned section, sentence-by-sentence scroll progress
     ======================================================================= */

  function initPhilosophy() {
    var section = document.getElementById("philosophy");
    var lines = document.querySelectorAll(".philosophy-line");
    if (!section || !lines.length) return;

    var ticking = false;

    function update() {
      ticking = false;
      var rect = section.getBoundingClientRect();
      var sectionHeight = section.offsetHeight;
      var viewportH = window.innerHeight;

      // Progress 0 -> 1 across the pinned scroll distance.
      var scrolled = -rect.top;
      var scrollableDistance = sectionHeight - viewportH;
      if (scrollableDistance <= 0) return;

      var progress = scrolled / scrollableDistance;
      progress = Math.max(0, Math.min(1, progress));

      var count = lines.length;
      var activeIndex = Math.floor(progress * count);
      if (activeIndex >= count) activeIndex = count - 1;

      lines.forEach(function (line, i) {
        line.classList.remove("is-active", "is-passed");
        if (i === activeIndex) {
          line.classList.add("is-active");
        } else if (i < activeIndex) {
          line.classList.add("is-passed");
        }
      });
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  }

  /* =======================================================================
     MAGNETIC BUTTONS — primary CTAs shift toward cursor, spring back
     ======================================================================= */

  function initMagneticButtons() {
    if (prefersReducedMotion) return;

    var buttons = document.querySelectorAll("[data-magnetic]");
    if (!buttons.length) return;

    var maxOffset = 10;

    buttons.forEach(function (btn) {
      var rafId = null;

      btn.addEventListener("mousemove", function (e) {
        var rect = btn.getBoundingClientRect();
        var relX = e.clientX - rect.left - rect.width / 2;
        var relY = e.clientY - rect.top - rect.height / 2;
        var x = Math.max(-maxOffset, Math.min(maxOffset, relX * 0.3));
        var y = Math.max(-maxOffset, Math.min(maxOffset, relY * 0.3));

        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(function () {
          btn.style.transform = "translate(" + x + "px, " + y + "px)";
        });
      });

      btn.addEventListener("mouseleave", function () {
        if (rafId) cancelAnimationFrame(rafId);
        btn.style.transform = "translate(0, 0)";
      });
    });
  }

  /* =======================================================================
     LOOK-IN TILT — subtle 3D tilt toward cursor on embed frames
     ======================================================================= */

  function initLookinTilt() {
    if (prefersReducedMotion) return;

    var frames = document.querySelectorAll("[data-tilt]");
    if (!frames.length) return;

    var maxTilt = 6; // degrees

    frames.forEach(function (frame) {
      var rafId = null;

      frame.addEventListener("mousemove", function (e) {
        var rect = frame.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width; // 0 -> 1
        var py = (e.clientY - rect.top) / rect.height;

        var rotateY = (px - 0.5) * maxTilt * 2;
        var rotateX = (0.5 - py) * maxTilt * 2;

        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(function () {
          frame.style.transform =
            "perspective(1000px) rotateX(" + rotateX + "deg) rotateY(" + rotateY + "deg)";
        });
      });

      frame.addEventListener("mouseleave", function () {
        if (rafId) cancelAnimationFrame(rafId);
        frame.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
      });
    });
  }

  /* =======================================================================
     LOOK-IN SHOTS — fade each screenshot in once it finishes loading,
     clearing the shimmer placeholder underneath. Images use loading="lazy"
     natively and are preloaded via <link rel="preload"> in <head>, so this
     just handles the crossfade rather than any fetching itself.
     ======================================================================= */

  function initLookinShots() {
    var shots = document.querySelectorAll(".lookin-shot");
    if (!shots.length) return;

    shots.forEach(function (img) {
      var viewport = img.closest(".lookin-viewport");
      var placeholder = viewport ? viewport.querySelector(".lookin-placeholder") : null;

      function reveal() {
        img.classList.add("is-loaded");
        if (placeholder) placeholder.remove();
      }

      // Preloaded/cached images can be complete before this listener
      // attaches, so check first rather than waiting on an event that
      // already fired.
      if (img.complete && img.naturalWidth > 0) {
        reveal();
      } else {
        img.addEventListener("load", reveal, { once: true });
      }
    });
  }

  /* =======================================================================
     YOUTUBE SHOWCASE — swap poster/play button for the real iframe on click
     ======================================================================= */

  function initYoutubeShowcase() {
    var cards = document.querySelectorAll(".showcase-card");
    if (!cards.length) return;

    cards.forEach(function (card) {
      var playBtn = card.querySelector(".showcase-play");
      var slot = card.querySelector(".showcase-iframe-slot");
      var videoId = card.getAttribute("data-youtube-id");

      if (!playBtn || !slot) return;

      playBtn.addEventListener("click", function () {
        if (!videoId || videoId.indexOf("[") === 0) {
          // Placeholder video ID not yet filled in; nothing to embed.
          return;
        }

        var iframe = document.createElement("iframe");
        iframe.src = "https://www.youtube.com/embed/" + videoId + "?autoplay=1&rel=0";
        iframe.title = card.querySelector("h3") ? card.querySelector("h3").textContent : "Video";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        iframe.setAttribute("frameborder", "0");

        slot.appendChild(iframe);
        playBtn.classList.add("is-hidden");
      });
    });
  }

  /* =======================================================================
     EASED ANCHOR SCROLL — custom curve instead of instant/native jump
     ======================================================================= */

  function initEasedAnchorScroll() {
    var links = document.querySelectorAll('a[href^="#"]');
    if (!links.length) return;

    var navHeight = document.getElementById("nav") ? document.getElementById("nav").offsetHeight : 0;

    // cubic-bezier(0.65, 0, 0.35, 1) approximated for a JS easing function.
    function easeScroll(t) {
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    links.forEach(function (link) {
      link.addEventListener("click", function (e) {
        var targetId = link.getAttribute("href");
        if (!targetId || targetId === "#") return;

        var target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();

        var startY = window.pageYOffset;
        var targetY = target.getBoundingClientRect().top + startY - navHeight;
        var distance = targetY - startY;
        var duration = prefersReducedMotion ? 0 : Math.min(1000, Math.max(400, Math.abs(distance) * 0.6));

        if (duration === 0) {
          window.scrollTo(0, targetY);
          return;
        }

        var startTime = null;

        function step(timestamp) {
          if (startTime === null) startTime = timestamp;
          var elapsed = timestamp - startTime;
          var progress = Math.min(elapsed / duration, 1);
          var eased = easeScroll(progress);

          window.scrollTo(0, startY + distance * eased);

          if (progress < 1) {
            requestAnimationFrame(step);
          }
        }

        requestAnimationFrame(step);
      });
    });
  }

  /* =======================================================================
     ACTIVE NAV LINK — highlight the section currently in view
     ======================================================================= */

  function initActiveNavLink() {
    var navLinks = document.querySelectorAll("[data-nav-link]");
    if (!navLinks.length) return;

    var sections = [];
    navLinks.forEach(function (link) {
      var id = link.getAttribute("href");
      var section = document.querySelector(id);
      if (section) sections.push({ link: link, section: section });
    });

    if (!sections.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var match = sections.find(function (s) {
            return s.section === entry.target;
          });
          if (!match) return;

          if (entry.isIntersecting) {
            navLinks.forEach(function (l) {
              l.classList.remove("is-active");
            });
            match.link.classList.add("is-active");
          }
        });
      },
      { rootMargin: "-40% 0px -50% 0px" }
    );

    sections.forEach(function (s) {
      observer.observe(s.section);
    });
  }

  /* =======================================================================
     INIT
     ======================================================================= */

  function init() {
    initHeroReveal();
    initScrollReveals();
    initPhilosophy();
    initMagneticButtons();
    initLookinTilt();
    initLookinShots();
    initYoutubeShowcase();
    initEasedAnchorScroll();
    initActiveNavLink();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
