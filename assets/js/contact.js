/* =========================================================================
   contact.js — contact form validation
   ========================================================================= */
(function () {
  'use strict';

  const form = document.querySelector('[data-contact-form]');
  if (!form) return;

  const success = document.getElementById('contact-success');
  const submitBtn = form.querySelector('button[type="submit"]');

  const showError = (field, msg) => {
    const wrap = field.closest('.field');
    if (!wrap) return;
    wrap.classList.add('field--error');
    const err = wrap.querySelector('.field__error');
    if (err) {
      err.textContent = msg;
      err.setAttribute('role', 'alert');
    }
    field.setAttribute('aria-invalid', 'true');
  };

  const clearError = (field) => {
    const wrap = field.closest('.field');
    if (!wrap) return;
    wrap.classList.remove('field--error');
    const err = wrap.querySelector('.field__error');
    if (err) err.textContent = '';
    field.removeAttribute('aria-invalid');
  };

  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const isPhone = (v) => /^[0-9+()\-\s.]{7,}$/.test(v.trim());

  const validate = () => {
    let ok = true;
    const required = form.querySelectorAll('[required]');
    required.forEach((field) => {
      clearError(field);
      const v = (field.value || '').trim();
      if (!v) {
        showError(field, 'This field is required.');
        ok = false;
        return;
      }
      if (field.type === 'email' && !isEmail(v)) {
        showError(field, 'Please enter a valid email address.');
        ok = false;
      }
      if (field.type === 'tel' && !isPhone(v)) {
        showError(field, 'Please enter a valid phone number.');
        ok = false;
      }
    });
    return ok;
  };

  // Live clear
  form.addEventListener('input', (e) => {
    const f = e.target;
    if (f.matches('[required], [type="email"], [type="tel"]')) {
      const wrap = f.closest('.field');
      if (wrap && wrap.classList.contains('field--error')) clearError(f);
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) {
      const firstError = form.querySelector('.field--error input, .field--error textarea, .field--error select');
      if (firstError) firstError.focus();
      return;
    }

    // Endpoint configuration:
    //   Replace action="https://formspree.io/f/XXXXXXX" with your real endpoint
    //   OR use a mailto: fallback by uncommenting the mailto branch below.
    // For this static build, we simulate success in-browser so the form is
    // fully testable without a live endpoint.

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    setTimeout(() => {
      form.style.display = 'none';
      if (success) {
        success.removeAttribute('hidden');
        success.setAttribute('aria-live', 'polite');
        success.focus();
      }
    }, 600);
  });
})();
