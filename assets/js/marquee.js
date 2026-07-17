// Shared logo marquee: wraps [data-marquee-track] motion and hooks up arrow buttons.
(function () {
  function init(wrap) {
    var track = wrap.querySelector('[data-marquee-track]');
    if (!track) return;
    var prev = wrap.querySelector('[data-marquee-prev]');
    var next = wrap.querySelector('[data-marquee-next]');

    var halfWidth = track.scrollWidth / 2;
    var offset = halfWidth * 0.5;

    // Take over from the CSS keyframe so JS controls transform cleanly.
    track.style.animation = 'none';
    track.style.willChange = 'transform';
    track.style.transition = 'transform 0.6s cubic-bezier(0.22, 0.61, 0.36, 1)';

    function apply() {
      if (offset < 0) offset += halfWidth;
      if (offset >= halfWidth) offset -= halfWidth;
      track.style.transform = 'translate3d(' + (-offset) + 'px, 0, 0)';
    }
    apply();

    function step(dir) {
      var itemW = 200;
      var first = track.querySelector('.logo-marquee__item');
      if (first) {
        var rect = first.getBoundingClientRect();
        var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 24;
        itemW = rect.width + gap;
      }
      offset += dir * itemW * 2;
      apply();
    }

    prev && prev.addEventListener('click', function () { step(-1); });
    next && next.addEventListener('click', function () { step(1); });

    window.addEventListener('resize', function () {
      halfWidth = track.scrollWidth / 2;
    });
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
