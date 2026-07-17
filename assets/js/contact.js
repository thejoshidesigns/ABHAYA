/* =========================================================================
   contact.js - contact form validation
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

    submitBtn.disabled = true;
    const originalLabel = submitBtn.textContent;
    if (window.LoaderDots) window.LoaderDots.attach(submitBtn);
    else submitBtn.textContent = 'Sending…';

    const showSuccess = () => {
      form.style.display = 'none';
      if (success) {
        success.removeAttribute('hidden');
        success.setAttribute('aria-live', 'polite');
        success.focus();
      }
    };

    const accessKey = (form.querySelector('input[name="access_key"]') || {}).value || '';
    const endpoint = form.getAttribute('action') || '';
    const useLive = endpoint.includes('web3forms.com') && accessKey && !/REPLACE_WITH/i.test(accessKey);

    if (!useLive) {
      const host = window.location.hostname;
      const isDev = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.lovable.app') || host.endsWith('.lovableproject.com');
      if (isDev) {
        // Local/preview only - simulate success so the flow can be tested.
        setTimeout(showSuccess, 600);
        return;
      }
      // Production without a live key: do NOT fake success.
      submitBtn.disabled = false;
      if (window.LoaderDots) window.LoaderDots.detach?.(submitBtn);
      submitBtn.textContent = originalLabel;
      alert('This form is not connected yet. Please email us or call the office directly and we will respond within one business day.');
      return;
    }

    const data = new FormData(form);
    fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      .then((r) => r.json().catch(() => ({})))
      .then((res) => {
        if (res && res.success) {
          showSuccess();
        } else {
          submitBtn.disabled = false;
          if (window.LoaderDots) window.LoaderDots.detach?.(submitBtn);
          submitBtn.textContent = originalLabel;
          alert((res && res.message) || 'Sorry, something went wrong. Please try again or call the office.');
        }
      })
      .catch(() => {
        submitBtn.disabled = false;
        if (window.LoaderDots) window.LoaderDots.detach?.(submitBtn);
        submitBtn.textContent = originalLabel;
        alert('Network error. Please try again or call the office.');
      });
  });
})();
