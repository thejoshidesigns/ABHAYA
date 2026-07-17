/* =========================================================================
   approach.js — sticky sequence: swap "current focus" quote as user scrolls
   ========================================================================= */
(function () {
  'use strict';
  const grid = document.querySelector('[data-approach]');
  if (!grid) return;
  const quoteEl = grid.querySelector('[data-approach-quote]');
  const steps = grid.querySelectorAll('[data-approach-step]');
  if (!quoteEl || !steps.length) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const defaultQuote = quoteEl.textContent.trim();
  let current = null;

  const setActive = (step) => {
    if (step === current) return;
    current = step;
    steps.forEach((s) => s.setAttribute('data-active', s === step ? 'true' : 'false'));
    const next = step ? step.dataset.quote : defaultQuote;
    if (reduce) { quoteEl.textContent = next; return; }
    quoteEl.classList.add('is-swapping');
    setTimeout(() => {
      quoteEl.textContent = next;
      quoteEl.classList.remove('is-swapping');
    }, 240);
  };

  if (!('IntersectionObserver' in window)) {
    steps.forEach((s) => s.setAttribute('data-active', 'true'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      // pick the entry closest to the top-third of the viewport
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length) setActive(visible[0].target);
    },
    { rootMargin: '-30% 0px -50% 0px', threshold: 0 }
  );
  steps.forEach((s) => {
    s.setAttribute('data-active', 'false');
    io.observe(s);
  });
})();
