/* =========================================================================
   nav.js - sticky header, mobile menu, focus trap
   ========================================================================= */
(function () {
  'use strict';

  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav__toggle');
  const menu = document.getElementById('mobile-menu');

  if (!toggle || !menu) return;

  // Sticky header: add is-scrolled class after threshold
  if (header) {
    const onScroll = () => {
      if (window.scrollY > 8) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Mobile menu state
  let lastFocused = null;

  const openMenu = () => {
    lastFocused = document.activeElement;
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
    menu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // Focus first focusable
    const first = menu.querySelector('a, button');
    if (first) first.focus();
    document.addEventListener('keydown', onKey);
  };

  const closeMenu = () => {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    menu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKey);
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
  };

  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  toggle.addEventListener('click', () => {
    isOpen() ? closeMenu() : openMenu();
  });

  // Focus trap
  const onKey = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeMenu();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusables = menu.querySelectorAll(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // Close on link click
  menu.addEventListener('click', (e) => {
    const t = e.target;
    if (t && t.closest('a')) closeMenu();
  });

  // Close on resize past breakpoint
  const mq = window.matchMedia('(min-width: 1024px)');
  mq.addEventListener('change', (e) => {
    if (e.matches && isOpen()) closeMenu();
  });
})();
