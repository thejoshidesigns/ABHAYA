/* =========================================================================
   gsap-load.js - conditional, deferred loader for the GSAP motion layer.

   GSAP + ScrollTrigger are ~115 KB of JavaScript that only ever drive
   pointer-hover effects, background parallax and the pinned editorial
   sequence. Every one of those is already gated behind a fine pointer, a
   >=900px viewport, or both, and all of them are disabled outright under
   prefers-reduced-motion.

   Loading that bundle on a reduced-motion or touch/narrow device therefore
   costs bandwidth and main-thread time for behaviour that can never run. This
   loader makes the cost match the benefit:

     - reduced motion, narrow viewport or coarse pointer -> never fetched.
       assets/js/motion.js keeps handling [data-reveal]/.reveal with its own
       IntersectionObserver, so all content still appears normally.
     - otherwise -> fetched after the load event, so it is never on the
       critical path.

   Progressive enhancement: with this script blocked or failed, the page is
   fully readable and every reveal still runs through motion.js.
   ========================================================================= */
(function () {
  'use strict';

  var base = document.currentScript
    ? document.currentScript.src.replace(/gsap-load\.js.*$/, '')
    : 'assets/js/';

  var mq = function (q) {
    return window.matchMedia && window.matchMedia(q).matches;
  };

  // Same gate the GSAP effects themselves use. Keep the two in sync.
  var wanted =
    !mq('(prefers-reduced-motion: reduce)') &&
    mq('(pointer: fine)') &&
    mq('(min-width: 900px)');

  if (!wanted) return;

  /** Load one script and resolve via callback, preserving execution order. */
  function load(src, next) {
    var s = document.createElement('script');
    s.src = base + src;
    s.async = false;
    s.onload = next || null;
    // A failed vendor fetch must not break the page: motion.js already covers
    // the reveals, so there is nothing to fall back to.
    s.onerror = function () {};
    document.head.appendChild(s);
  }

  function boot() {
    load('vendor/gsap.min.js');
    load('vendor/ScrollTrigger.min.js');
    load('motion-gsap.js');
  }

  // Off the critical path entirely.
  var start = function () {
    if (window.requestIdleCallback) window.requestIdleCallback(boot, { timeout: 1500 });
    else window.setTimeout(boot, 200);
  };

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})();
