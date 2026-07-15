/* =========================================================================
   motion.js — Reveal, SplitText, Parallax, Marquee, Counter, Tilt, HeaderMode
   Vanilla JS, IntersectionObserver + rAF. No dependencies.
   All behaviors gated by prefers-reduced-motion.
   ========================================================================= */
(function () {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasIO = 'IntersectionObserver' in window;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  // ---- Reveal (with stagger + delay + custom direction) ----------------
  function initReveal() {
    // Match both v2 attributes and the v1 .reveal class for backward compat
    const els = document.querySelectorAll(
      '[data-reveal], [data-reveal-stagger], [data-split-text], .reveal'
    );
    if (!els.length) return;

    // Apply explicit delays from data-reveal-delay
    document.querySelectorAll('[data-reveal-delay]').forEach((el) => {
      el.style.setProperty('--reveal-delay', el.dataset.revealDelay);
    });

    if (reduce || !hasIO) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -60px 0px', threshold: 0.08 }
    );

    els.forEach((el) => io.observe(el));
  }

  // ---- SplitText (per-word or per-character) ----------------------------
  function splitText(el, mode) {
    mode = mode || el.dataset.splitText || 'words';
    if (mode === 'words') {
      const text = el.textContent;
      el.textContent = '';
      text.split(/(\s+)/).forEach((token) => {
        if (/\s+/.test(token)) {
          el.appendChild(document.createTextNode(token));
        } else if (token.length) {
          const span = document.createElement('span');
          span.className = 'word';
          span.textContent = token;
          el.appendChild(span);
        }
      });
    } else {
      const text = el.textContent;
      el.textContent = '';
      [...text].forEach((ch) => {
        if (ch === ' ') {
          el.appendChild(document.createTextNode(' '));
        } else {
          const span = document.createElement('span');
          span.className = 'char';
          span.textContent = ch;
          el.appendChild(span);
        }
      });
    }
  }

  function initSplitText() {
    const els = document.querySelectorAll('[data-split-text]');
    if (!els.length) return;
    els.forEach((el) => splitText(el));
  }

  // ---- Parallax (rAF-driven, scroll-linked) -----------------------------
  function initParallax() {
    if (reduce) return;
    const els = document.querySelectorAll('[data-parallax]');
    if (!els.length) return;

    let ticking = false;
    const update = () => {
      els.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        // -1 at top of viewport, +1 at bottom (clamped)
        const progress = Math.max(-1, Math.min(1, (rect.top + rect.height / 2 - vh / 2) / vh));
        const speed = parseFloat(el.dataset.parallaxSpeed || '0.15');
        const y = -progress * speed * vh * 0.3;
        el.style.setProperty('--parallax-y', `${y.toFixed(2)}px`);
      });
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }

  // ---- Marquee (duplicate track for seamless loop) ----------------------
  function initMarquee() {
    const els = document.querySelectorAll('.marquee');
    if (!els.length) return;

    els.forEach((el) => {
      const track = el.querySelector('.marquee__track');
      if (!track) return;
      // Clone the track so the loop is seamless (50% translateX in CSS)
      const clone = track.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      // Append the clone to the marquee container (not inside the track)
      // so both tracks sit side by side and the translateX(-50%) loop is seamless.
      el.appendChild(clone);

      if (!reduce) {
        const duration = el.dataset.marqueeDuration || '40s';
        track.style.setProperty('--marquee-duration', duration);
        clone.style.setProperty('--marquee-duration', duration);
        clone.style.animationPlayState = 'running';
      }
    });
  }

  // ---- Counter (animate number on first viewport entry) -----------------
  function initCounters() {
    const els = document.querySelectorAll('[data-counter]');
    if (!els.length) return;

    if (reduce || !hasIO) {
      els.forEach((el) => {
        const target = el.dataset.counter;
        if (target) el.textContent = target;
      });
      return;
    }

    const animate = (el) => {
      const target = parseFloat(el.dataset.counter) || 0;
      const decimals = parseInt(el.dataset.counterDecimals || '0', 10);
      const prefix = el.dataset.counterPrefix || '';
      const suffix = el.dataset.counterSuffix || '';
      const duration = parseInt(el.dataset.counterDuration || '1600', 10);
      const start = performance.now();

      const step = (now) => {
        const elapsed = now - start;
        const t = Math.min(1, elapsed / duration);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - t, 3);
        const value = target * eased;
        el.textContent = prefix + value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix;
        if (t < 1) requestAnimationFrame(step);
        else el.textContent = prefix + target.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix;
      };
      requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );

    els.forEach((el) => io.observe(el));
  }

  // ---- Tilt (pointer-tracked 1-2deg rotation, fine pointer only) --------
  function initTilt() {
    if (reduce || !finePointer) return;
    const els = document.querySelectorAll('[data-tilt]');
    if (!els.length) return;

    els.forEach((el) => {
      const max = parseFloat(el.dataset.tiltMax || '2');
      el.addEventListener('pointermove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.setProperty('--tilt-y', `${(x * max).toFixed(2)}deg`);
        el.style.setProperty('--tilt-x', `${(-y * max).toFixed(2)}deg`);
      });
      el.addEventListener('pointerleave', () => {
        el.style.setProperty('--tilt-y', '0deg');
        el.style.setProperty('--tilt-x', '0deg');
      });
    });
  }

  // ---- HeaderMode (swap header styling on dark sections) ---------------
  function initHeaderMode() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    const darkSections = document.querySelectorAll('[data-section="dark"]');
    if (!darkSections.length) return;

    if (!hasIO) return;

    const io = new IntersectionObserver(
      (entries) => {
        let anyDark = false;
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.4) {
            anyDark = true;
          }
        });
        if (anyDark) header.setAttribute('data-mode', 'dark');
        else header.removeAttribute('data-mode');
      },
      { threshold: [0, 0.4, 0.6] }
    );

    darkSections.forEach((s) => io.observe(s));
  }

  // ---- Init on DOM ready -----------------------------------------------
  function init() {
    initSplitText();   // must run before Reveal observes
    initReveal();
    initParallax();
    initMarquee();
    initCounters();
    initTilt();
    initHeaderMode();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();