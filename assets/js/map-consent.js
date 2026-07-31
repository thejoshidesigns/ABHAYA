/* =========================================================================
   map-consent.js - click-to-load Google Maps embed

   The map is off by default. Nothing is requested from Google until the
   visitor explicitly asks for it, which matters on a behavioural-health
   contact page: simply reading the address should not hand a third party a
   record of the visit.

   Progressive enhancement: the address and the "Open in Google Maps" link are
   plain HTML and work with this script blocked, failed or disabled. This file
   only ever adds the embed.
   ========================================================================= */
(function () {
  'use strict';

  var wrap = document.querySelector('[data-map-consent]');
  if (!wrap) return;

  var button = wrap.querySelector('[data-map-load]');
  var status = wrap.querySelector('[data-map-status]');
  var frameHost = document.querySelector('[data-map-frame]');
  if (!button || !frameHost) return;

  button.addEventListener('click', function () {
    var src = button.getAttribute('data-map-src');
    if (!src) return;

    button.disabled = true;
    if (status) status.textContent = 'Loading map\u2026';

    var iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = button.getAttribute('data-map-title') || 'Map of the office location';
    iframe.loading = 'lazy';
    // Send no referrer at all: Google does not need to know which page of the
    // site the visitor came from.
    iframe.referrerPolicy = 'no-referrer';
    iframe.setAttribute('allowfullscreen', '');

    iframe.addEventListener('load', function () {
      if (status) status.textContent = 'Map loaded.';
      // Move focus to the map so keyboard users land on what they asked for
      // instead of being stranded on a now-removed button.
      iframe.setAttribute('tabindex', '0');
      try { iframe.focus({ preventScroll: true }); } catch (e) { /* older browsers */ }
    });

    iframe.addEventListener('error', function () {
      if (status) {
        status.textContent =
          'The map could not be loaded. Use the "Open in Google Maps" link below.';
      }
      button.disabled = false;
    });

    frameHost.appendChild(iframe);
    frameHost.hidden = false;

    // The button has done its job. Keep the privacy note and the plain link.
    button.hidden = true;
  });
})();
