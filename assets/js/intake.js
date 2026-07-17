/* =========================================================================
   intake.js - multi-step intake form
   Steps: 1 About you | 2 Reason for visit | 3 Insurance & logistics
          4 Consent & submit
   ========================================================================= */
(function () {
  'use strict';

  const form = document.getElementById('intake-form');
  if (!form) return;

  const panels = form.querySelectorAll('.intake__panel');
  const steps = form.querySelectorAll('.intake__step');
  // Each panel has its own Next / Back / Submit buttons. We look them up
  // dynamically per step rather than caching one form-wide button, since
  // `form.querySelector(...)` only ever returns the first match.
  const nextBtns = form.querySelectorAll('[data-intake-next]');
  const prevBtns = form.querySelectorAll('[data-intake-prev]');
  const submitBtns = form.querySelectorAll('[data-intake-submit]');
  const success = document.getElementById('intake-success');
  let current = 0;
  const total = panels.length;

  const showStep = (idx) => {
    panels.forEach((p, i) => {
      p.classList.toggle('is-active', i === idx);
    });
    steps.forEach((s, i) => {
      s.classList.toggle('is-active', i === idx);
      s.classList.toggle('is-done', i < idx);
    });
    // Focus the heading of the active panel for screen readers
    const heading = panels[idx].querySelector('.intake__panel-title');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus();
    }

    current = idx;
  };

  // -------- Validation per step --------
  const validateStep = (idx) => {
    const panel = panels[idx];
    let ok = true;
    const fields = panel.querySelectorAll('input[required], select[required], textarea[required]');
    fields.forEach((field) => {
      clearError(field);
      const v = (field.value || '').trim();
      if (!v) {
        showError(field, 'This field is required.');
        ok = false;
        return;
      }
      if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        showError(field, 'Please enter a valid email address.');
        ok = false;
      }
      if (field.type === 'tel' && !/^[0-9+()\-\s.]{7,}$/.test(v)) {
        showError(field, 'Please enter a valid phone number.');
        ok = false;
      }
      if (field.type === 'checkbox' && !field.checked) {
        showError(field, 'You must agree to continue.');
        ok = false;
      }
    });
    return ok;
  };

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

  // Live error clearing
  form.addEventListener('input', (e) => {
    const f = e.target;
    const wrap = f.closest('.field');
    if (wrap && wrap.classList.contains('field--error')) clearError(f);
  });
  form.addEventListener('change', (e) => {
    const f = e.target;
    const wrap = f.closest('.field');
    if (wrap && wrap.classList.contains('field--error')) clearError(f);
  });

  // -------- Navigation --------
  // Attach a click listener to each Next / Back / Submit button across all
  // panels. Each button knows its own panel via the closest .intake__panel.
  nextBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!validateStep(current)) {
        const firstError = panels[current].querySelector('.field--error input, .field--error select, .field--error textarea');
        if (firstError) firstError.focus();
        return;
      }
      if (current < total - 1) showStep(current + 1);
    });
  });

  prevBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (current > 0) showStep(current - 1);
    });
  });

  // -------- Submit --------
  // Submit listener lives on the form so it catches both Enter-key submits
  // and click-submits from any panel.
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateStep(current)) {
      const firstError = panels[current].querySelector('.field--error input, .field--error select, .field--error textarea');
      if (firstError) firstError.focus();
      return;
    }

    const submitBtn = panels[current].querySelector('[data-intake-submit]');
    if (submitBtn) {
      submitBtn.disabled = true;
      if (window.LoaderDots) window.LoaderDots.attach(submitBtn);
      else submitBtn.textContent = 'Submitting…';
    }

    const showSuccess = () => {
      form.style.display = 'none';
      document.querySelector('.intake__progress')?.style.setProperty('display', 'none');
      if (success) {
        success.classList.add('is-active');
        success.setAttribute('aria-live', 'polite');
        success.focus();
      }
    };

    const originalLabel = submitBtn ? submitBtn.textContent : '';
    const accessKey = (form.querySelector('input[name="access_key"]') || {}).value || '';
    const endpoint = form.getAttribute('action') || '';
    const useLive = endpoint.includes('web3forms.com') && accessKey.trim().length > 0;

    if (!useLive) {
      const host = window.location.hostname;
      const isDev = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.lovable.app') || host.endsWith('.lovableproject.com');
      if (isDev) {
        setTimeout(showSuccess, 800);
        return;
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        if (window.LoaderDots) window.LoaderDots.detach?.(submitBtn);
        submitBtn.textContent = originalLabel;
      }
      alert('This intake form is not connected yet. Please call the office to book your appointment and we will respond within one business day.');
      return;
    }

    const data = new FormData(form);
    fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      .then((r) => r.json().catch(() => ({})))
      .then((res) => {
        if (res && res.success) {
          showSuccess();
        } else {
          if (submitBtn) {
            submitBtn.disabled = false;
            if (window.LoaderDots) window.LoaderDots.detach?.(submitBtn);
            submitBtn.textContent = originalLabel;
          }
          alert((res && res.message) || 'Sorry, something went wrong. Please try again or call the office.');
        }
      })
      .catch(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          if (window.LoaderDots) window.LoaderDots.detach?.(submitBtn);
          submitBtn.textContent = originalLabel;
        }
        alert('Network error. Please try again or call the office.');
      });
  });

  // Initialize
  showStep(0);
})();
