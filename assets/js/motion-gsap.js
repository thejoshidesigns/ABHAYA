/* =========================================================================
   motion-gsap.js - GSAP micro-interactions & scroll motion
   Requires: gsap, ScrollTrigger (loaded via CDN before this file)
   All behavior gated by prefers-reduced-motion and pointer capability.
   Auto-wires from selectors + data-attributes so pages stay declarative.
   ========================================================================= */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var wide = window.matchMedia('(min-width: 900px)').matches;

  if (!window.gsap) {
    // GSAP not loaded - expose no-op loader helper so forms still work
    window.LoaderDots = { attach: function () {}, detach: function () {} };
    return;
  }
  var gsap = window.gsap;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
  var ST = window.ScrollTrigger;

  // ---------------------------------------------------------------------
  // 1. Subtle hover - buttons, chips, nav links
  // ---------------------------------------------------------------------
  function initSubtleHover() {
    if (reduce || !finePointer) return;
    var sel = [
      '.btn', '.btn-pill', '.nav__link', '.nav__phone',
      '.conditions-chips li a', '.footer__list a', '.service-card__cta'
    ].join(',');
    document.querySelectorAll(sel).forEach(function (el) {
      el.addEventListener('pointerenter', function () {
        gsap.to(el, { y: -1, opacity: 0.92, duration: 0.15, ease: 'power1.out', overwrite: 'auto' });
      });
      el.addEventListener('pointerleave', function () {
        gsap.to(el, { y: 0, opacity: 1, duration: 0.2, ease: 'power1.out', overwrite: 'auto' });
      });
    });
  }

  // ---------------------------------------------------------------------
  // 2. Standard card hover - service cards, why items, insurance tiles
  // ---------------------------------------------------------------------
  function initCardHover() {
    if (reduce || !finePointer) return;
    var sel = [
      '.service-card:not(.service-card--soon)',
      '.why-item',
      '.hero-split__card',
      '.insurance-strip__row span'
    ].join(',');
    document.querySelectorAll(sel).forEach(function (el) {
      var base = getComputedStyle(el).boxShadow;
      el.addEventListener('pointerenter', function () {
        gsap.to(el, {
          y: -4, scale: 1.02,
          boxShadow: '0 12px 28px rgba(7,171,206,0.18)',
          duration: 0.25, ease: 'power2.out', overwrite: 'auto'
        });
      });
      el.addEventListener('pointerleave', function () {
        gsap.to(el, {
          y: 0, scale: 1, boxShadow: base,
          duration: 0.3, ease: 'power2.out', overwrite: 'auto'
        });
      });
    });
  }

  // ---------------------------------------------------------------------
  // 3. Magnetic / tilt hover - hero figure + primary CTA
  // ---------------------------------------------------------------------
  function initMagnetic() {
    if (reduce || !finePointer) return;
    var els = document.querySelectorAll('.hero-split__figure, .hero-split .btn-pill--primary, [data-magnetic]');
    els.forEach(function (el) {
      var strength = parseFloat(el.dataset.magneticStrength || '0.25');
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * strength;
        var y = (e.clientY - r.top - r.height / 2) * strength;
        gsap.to(el, {
          x: x, y: y,
          rotationY: x * 0.15, rotationX: -y * 0.15,
          transformPerspective: 800,
          duration: 0.4, ease: 'power3.out', overwrite: 'auto'
        });
      });
      el.addEventListener('pointerleave', function () {
        gsap.to(el, {
          x: 0, y: 0, rotationX: 0, rotationY: 0,
          duration: 0.5, ease: 'elastic.out(1, 0.6)', overwrite: 'auto'
        });
      });
    });
  }

  // ---------------------------------------------------------------------
  // 4/5. Scroll reveals - fade + slide-up (upgrades existing [data-reveal])
  // ---------------------------------------------------------------------
  function initScrollReveals() {
    if (!ST) return;
    if (reduce) {
      document.querySelectorAll('[data-reveal], .reveal').forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }
    // Take over the visual reveal - mark handled so motion.css doesn't double-run
    var els = document.querySelectorAll('[data-reveal], .reveal');
    els.forEach(function (el) {
      // Skip if inside a stagger container (handled below)
      if (el.closest('[data-stagger]')) return;
      gsap.fromTo(el,
        { opacity: 0, y: 14 },
        {
          opacity: 1, y: 0,
          duration: 0.5, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          onStart: function () { el.classList.add('is-visible'); }
        }
      );
    });
  }

  // ---------------------------------------------------------------------
  // 6. Staggered lists / grids
  // ---------------------------------------------------------------------
  function initStagger() {
    if (!ST) return;
    // Auto-tag common containers
    document.querySelectorAll('.services-grid').forEach(function (el) {
      if (!el.hasAttribute('data-stagger')) el.setAttribute('data-stagger', 'bento');
    });
    document.querySelectorAll('.conditions-chips, .insurance-strip__row, .why-list, .footer__list').forEach(function (el) {
      if (!el.hasAttribute('data-stagger')) el.setAttribute('data-stagger', 'list');
    });

    document.querySelectorAll('[data-stagger]').forEach(function (el) {
      var mode = el.dataset.stagger || 'list';
      var kids = Array.from(el.children);
      if (!kids.length) return;
      if (reduce) { el.classList.add('is-visible'); return; }

      if (mode === 'bento') {
        gsap.fromTo(kids,
          { opacity: 0, y: 20, scale: 0.94 },
          {
            opacity: 1, y: 0, scale: 1,
            duration: 0.45, ease: 'back.out(1.4)',
            stagger: { each: 0.07 },
            scrollTrigger: { trigger: el, start: 'top 85%', once: true }
          }
        );
      } else {
        gsap.fromTo(kids,
          { opacity: 0, y: 12 },
          {
            opacity: 1, y: 0,
            duration: 0.4, ease: 'power2.out',
            stagger: 0.05,
            scrollTrigger: { trigger: el, start: 'top 88%', once: true }
          }
        );
      }
    });
  }

  // ---------------------------------------------------------------------
  // 7. Background parallax - blobs + hero figure
  // ---------------------------------------------------------------------
  function initParallax() {
    if (reduce || !ST) return;
    var els = document.querySelectorAll('.blob, [data-parallax], .hero-split__figure');
    els.forEach(function (el) {
      var speed = parseFloat(el.dataset.parallaxSpeed || '0.15');
      gsap.to(el, {
        yPercent: -speed * 100,
        ease: 'none',
        scrollTrigger: {
          trigger: el.closest('section, .hero-split, aside') || el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    });
  }

  // ---------------------------------------------------------------------
  // 8. Scrollytelling pin - opt-in via [data-pin]
  // ---------------------------------------------------------------------
  function initPin() {
    if (reduce || !ST || !wide) return;
    document.querySelectorAll('[data-pin]').forEach(function (el) {
      var media = el.querySelector('[data-pin-media]');
      if (!media) return;
      ST.create({
        trigger: el, start: 'top top', end: 'bottom bottom',
        pin: media, pinSpacing: false
      });
    });
  }

  // ---------------------------------------------------------------------
  // 9. Page transitions - outgoing fade + teal overlay wipe
  // ---------------------------------------------------------------------
  function initPageTransition() {
    if (reduce) return;
    var main = document.getElementById('main') || document.querySelector('main');
    if (!main) return;

    // Incoming fade
    gsap.fromTo(main, { opacity: 0 }, { opacity: 1, duration: 0.28, ease: 'power1.out' });

    // Build overlay
    var wipe = document.createElement('div');
    wipe.className = 'page-wipe';
    document.body.appendChild(wipe);

    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || href.startsWith('#') || a.target === '_blank' || a.hasAttribute('download')) return;
      if (a.hasAttribute('data-no-transition')) return;
      if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('sms:')) return;
      // same-origin only
      try {
        var url = new URL(href, location.href);
        if (url.origin !== location.origin) return;
        if (url.pathname === location.pathname && url.search === location.search) return;
      } catch (_) { return; }
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      e.preventDefault();
      gsap.timeline({ onComplete: function () { window.location.href = href; } })
        .to(main, { opacity: 0, duration: 0.18, ease: 'power1.in' }, 0)
        .fromTo(wipe, { xPercent: -100 }, { xPercent: 0, duration: 0.28, ease: 'power2.inOut' }, 0);
    });
  }

  // ---------------------------------------------------------------------
  // 10. Loader helper - dots + shimmer (used by intake/contact submits)
  // ---------------------------------------------------------------------
  window.LoaderDots = {
    attach: function (btn) {
      if (!btn) return;
      if (btn.dataset.loading === '1') return;
      btn.dataset.loading = '1';
      btn.dataset.originalHtml = btn.innerHTML;
      btn.classList.add('is-loading');
      btn.innerHTML = '<span class="loader-dots" aria-hidden="true"><span></span><span></span><span></span></span><span class="sr-only">Loading</span>';
      if (reduce || !window.gsap) return;
      var dots = btn.querySelectorAll('.loader-dots > span');
      gsap.timeline({ repeat: -1, id: 'loader-' + Math.random() })
        .to(dots, { y: -6, duration: 0.35, stagger: 0.12, ease: 'sine.inOut' })
        .to(dots, { y: 0, duration: 0.35, stagger: 0.12, ease: 'sine.inOut' }, '>-0.35');
    },
    detach: function (btn) {
      if (!btn || btn.dataset.loading !== '1') return;
      btn.classList.remove('is-loading');
      btn.innerHTML = btn.dataset.originalHtml || '';
      delete btn.dataset.loading;
      delete btn.dataset.originalHtml;
    }
  };

  // ---------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------
  function init() {
    initScrollReveals();
    initStagger();
    initParallax();
    initPin();
    initSubtleHover();
    initCardHover();
    initMagnetic();
    initPageTransition();
    if (ST) ST.refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
