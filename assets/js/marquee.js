// Shared logo marquee: continuous auto-scroll + arrow nudges, seamless loop.
(function () {
  function init(wrap) {
    var track = wrap.querySelector('[data-marquee-track]');
    if (!track) return;
    var prev = wrap.querySelector('[data-marquee-prev]');
    var next = wrap.querySelector('[data-marquee-next]');

    // Take over from CSS keyframe animation.
    track.style.animation = 'none';
    track.style.willChange = 'transform';

    var halfWidth = track.scrollWidth / 2;
    var offset = 0;                 // current translateX in px (positive = shifted left)
    var autoSpeed = 30;             // px per second (slow, calm scroll)
    var direction = 1;              // +1 = leftward, -1 = rightward
    var paused = false;
    var lastT = performance.now();
    var nudgeUntil = 0;             // during a click nudge, disable transition-free path
    var animating = false;          // true while a CSS transition tween is running

    function apply() {
      // Seamless wrap using the duplicated set.
      if (halfWidth > 0) {
        if (offset < 0) offset += halfWidth;
        if (offset >= halfWidth) offset -= halfWidth;
      }
      track.style.transform = 'translate3d(' + (-offset) + 'px, 0, 0)';
    }

    function tick(now) {
      var dt = (now - lastT) / 1000;
      lastT = now;
      if (!paused && !animating) {
        offset += direction * autoSpeed * dt;
        apply();
      }
      requestAnimationFrame(tick);
    }

    // Pause on hover so users can read a card.
    wrap.addEventListener('mouseenter', function () { paused = true; });
    wrap.addEventListener('mouseleave', function () { paused = false; lastT = performance.now(); });

    function step(dir) {
      var itemW = 200;
      var first = track.querySelector('.logo-marquee__item');
      if (first) {
        var rect = first.getBoundingClientRect();
        var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 24;
        itemW = rect.width + gap;
      }
      // Smooth tween via CSS transition, then hand control back to rAF.
      animating = true;
      track.style.transition = 'transform 0.55s cubic-bezier(0.22, 0.61, 0.36, 1)';
      offset += dir * itemW * 2;
      apply();
      window.setTimeout(function () {
        track.style.transition = '';
        animating = false;
        lastT = performance.now();
      }, 600);
    }

    prev && prev.addEventListener('click', function () { step(-1); });
    next && next.addEventListener('click', function () { step(1); });

    window.addEventListener('resize', function () {
      halfWidth = track.scrollWidth / 2;
    });

    // Respect user motion preferences.
    var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      autoSpeed = 0;
    }

    apply();
    requestAnimationFrame(tick);
  }

  function boot() {
    document.querySelectorAll('.marquee-wrap').forEach(init);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
