/* =========================================================================
   insurance-carousel.js - Infinite auto-scrolling logo carousel with arrows
   Auto-inits any element with .insurance-carousel that contains a
   .insurance-carousel__track holding the slides.
   ========================================================================= */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init(root) {
    var viewport = root.querySelector('.insurance-carousel__viewport');
    var track = root.querySelector('.insurance-carousel__track');
    if (!viewport || !track) return;

    // Duplicate slides for seamless loop
    var originals = Array.from(track.children);
    if (!originals.length) return;
    originals.forEach(function (node) {
      var clone = node.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });

    var speed = parseFloat(root.dataset.speed || '0.5'); // px per frame
    var paused = false;
    var rafId = null;

    function halfWidth() { return track.scrollWidth / 2; }

    function tick() {
      if (!paused && !reduce) {
        viewport.scrollLeft += speed;
        if (viewport.scrollLeft >= halfWidth()) {
          viewport.scrollLeft -= halfWidth();
        }
      }
      rafId = requestAnimationFrame(tick);
    }

    function step(dir) {
      var slide = track.children[0];
      var w = slide ? slide.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '0') : 200;
      var target = viewport.scrollLeft + dir * w;
      // wrap
      if (target < 0) {
        viewport.scrollLeft += halfWidth();
        target += halfWidth();
      } else if (target >= halfWidth()) {
        viewport.scrollLeft -= halfWidth();
        target -= halfWidth();
      }
      viewport.scrollTo({ left: target, behavior: 'smooth' });
    }

    // Arrow buttons
    var prev = root.querySelector('.insurance-carousel__btn--prev');
    var next = root.querySelector('.insurance-carousel__btn--next');
    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });

    // Pause on hover / focus / touch
    ['pointerenter', 'focusin', 'touchstart'].forEach(function (ev) {
      root.addEventListener(ev, function () { paused = true; }, { passive: true });
    });
    ['pointerleave', 'focusout', 'touchend'].forEach(function (ev) {
      root.addEventListener(ev, function () { paused = false; }, { passive: true });
    });

    // Pause when off-screen (perf)
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            if (!rafId) rafId = requestAnimationFrame(tick);
          } else if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
        });
      });
      io.observe(root);
    } else {
      rafId = requestAnimationFrame(tick);
    }
  }

  function boot() {
    document.querySelectorAll('.insurance-carousel').forEach(init);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
