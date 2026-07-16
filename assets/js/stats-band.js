(function () {
  const items = document.querySelectorAll('.stats-band [data-stat]');
  if (!items.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function formatValue(val, decimals) {
    if (decimals > 0) return val.toFixed(decimals);
    return Math.round(val).toLocaleString('en-US');
  }

  function animate(el) {
    const valueEl = el.querySelector('.stats-band__value');
    if (!valueEl || el.dataset.animated) return;
    el.dataset.animated = '1';

    const target = parseFloat(el.dataset.target || '0');
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const duration = 1600;

    if (prefersReduced) {
      valueEl.textContent = formatValue(target, decimals);
      return;
    }

    const start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      valueEl.textContent = formatValue(target * eased, decimals);
      if (p < 1) requestAnimationFrame(tick);
      else valueEl.textContent = formatValue(target, decimals);
    }
    requestAnimationFrame(tick);
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          animate(e.target);
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  items.forEach((el) => io.observe(el));
})();
