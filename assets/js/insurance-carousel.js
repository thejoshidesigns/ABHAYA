/* =========================================================================
   insurance-carousel.js — continuous right-to-left logo scroll.
   - Runs constantly via requestAnimationFrame.
   - Pauses ONLY while the mouse is hovering the logo strip (viewport).
   - Left/right arrows nudge by one slide; auto-scroll resumes on mouseleave.
   ========================================================================= */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init(root) {
    var viewport = root.querySelector('.insurance-carousel__viewport');
    var track = root.querySelector('.insurance-carousel__track');
    if (!viewport || !track) return;

    // Duplicate slides for a seamless loop
    Array.from(track.children).forEach(function (node) {
      var clone = node.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });

    var speed = parseFloat(root.dataset.speed || '0.5'); // px per frame (~30 px/s)
    var hovering = false;
    var rafId = null;
    var visible = true;

    function halfWidth() { return track.scrollWidth / 2; }

    function tick() {
      if (!hovering && !reduce && visible) {
        viewport.scrollLeft += speed;
        var hw = halfWidth();
        if (hw > 0 && viewport.scrollLeft >= hw) {
          viewport.scrollLeft -= hw;
        }
      }
      rafId = requestAnimationFrame(tick);
    }

    function step(dir) {
      var slide = track.children[0];
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '0') || 0;
      var w = slide ? slide.getBoundingClientRect().width + gap : 160;
      var target = viewport.scrollLeft + dir * w;
      var hw = halfWidth();
      if (target < 0) target += hw;
      else if (target >= hw) target -= hw;
      viewport.scrollTo({ left: target, behavior: 'smooth' });
    }

    // Arrows just nudge — they do not permanently stop the scroll
    var prev = root.querySelector('.insurance-carousel__btn--prev');
    var next = root.querySelector('.insurance-carousel__btn--next');
    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });

    // Pause ONLY when the pointer is actually over the logo strip
    viewport.addEventListener('mouseenter', function () { hovering = true; });
    viewport.addEventListener('mouseleave', function () { hovering = false; });

    // Off-screen perf gate
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { visible = e.isIntersecting; });
      }, { threshold: 0 });
      io.observe(root);
    }

    rafId = requestAnimationFrame(tick);
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
