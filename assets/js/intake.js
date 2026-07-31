/* =========================================================================
   intake.js - multi-step appointment request form.
   Steps: 1 About you | 2 Reason for visit | 3 Insurance & logistics
          4 Consent & submit

   IMPORTANT: online delivery for this form stays inactive until the practice
   confirms in writing that the chosen provider meets its HIPAA/BAA
   requirements. Until then the form validates, but never claims a request
   was received; it directs the visitor to phone or email.
   ========================================================================= */
(function () {
  'use strict';

  const form = document.getElementById('intake-form');
  if (!form) return;

  const V = window.FormValidate;
  const panels = form.querySelectorAll('.intake__panel');
  const steps = form.querySelectorAll('.intake__step');
  const nextBtns = form.querySelectorAll('[data-intake-next]');
  const prevBtns = form.querySelectorAll('[data-intake-prev]');
  const status = form.querySelector('[data-form-status]');
  const success = document.getElementById('intake-success');
  let current = 0;
  let submitting = false;
  let errorSeq = 0;
  const total = panels.length;

  const setStatus = (msg, tone) => {
    if (!status) return;
    status.textContent = msg;
    status.hidden = !msg;
    status.classList.toggle('form__status--error', tone === 'error');
  };

  const showStep = (idx) => {
    panels.forEach((p, i) => p.classList.toggle('is-active', i === idx));
    steps.forEach((s, i) => {
      s.classList.toggle('is-active', i === idx);
      s.classList.toggle('is-done', i < idx);
    });
    const heading = panels[idx].querySelector('.intake__panel-title');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus();
    }
    current = idx;
  };

  const showError = (field, msg) => {
    const wrap = field.closest('.field');
    if (!wrap) return;
    wrap.classList.add('field--error');
    const err = wrap.querySelector('.field__error');
    if (err) {
      if (!err.id) err.id = 'intake-error-' + ++errorSeq;
      err.textContent = msg;
      const described = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
      if (!described.includes(err.id)) {
        field.setAttribute('aria-describedby', described.concat(err.id).join(' '));
      }
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

  const stepFields = (idx) =>
    Array.from(
      panels[idx].querySelectorAll(
        'input[required], select[required], textarea[required], input[type="email"], input[type="tel"]'
      )
    ).filter((el) => el.type !== 'hidden');

  const validateStep = (idx) => {
    const els = stepFields(idx);
    els.forEach(clearError);
    const errors = V.validateFields(
      els.map((el) => ({
        type: el.type,
        value: el.value,
        required: el.hasAttribute('required'),
        checked: el.checked,
      }))
    );
    errors.forEach(({ index, message }) => showError(els[index], message));
    if (errors.length) {
      setStatus(
        errors.length === 1
          ? 'One field on this step needs your attention.'
          : errors.length + ' fields on this step need your attention.',
        'error'
      );
      els[errors[0].index].focus();
      return false;
    }
    setStatus('');
    return true;
  };

  form.addEventListener('input', (e) => {
    const wrap = e.target.closest && e.target.closest('.field');
    if (wrap && wrap.classList.contains('field--error')) clearError(e.target);
  });
  form.addEventListener('change', (e) => {
    const wrap = e.target.closest && e.target.closest('.field');
    if (wrap && wrap.classList.contains('field--error')) clearError(e.target);
  });

  nextBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!validateStep(current)) return;
      if (current < total - 1) showStep(current + 1);
    });
  });

  prevBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (current > 0) showStep(current - 1);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!validateStep(current)) return;

    const submitBtn = panels[current].querySelector('[data-intake-submit]');
    const accessKey = (form.querySelector('input[name="access_key"]') || {}).value || '';
    const endpoint = form.getAttribute('action') || '';

    if (V.deliveryMode(endpoint, accessKey) !== 'live') {
      setStatus(
        'Online appointment requests are not active yet. Please call (573) 403-3544 (Mon-Fri, 9 AM-4 PM) or email contactus@abhayabh.com to request a visit.',
        'error'
      );
      if (status) status.focus();
      return;
    }

    submitting = true;
    const originalLabel = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
    }
    setStatus('Sending your request...');

    const reset = () => {
      submitting = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      }
    };

    fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then((r) => r.json().catch(() => ({})))
      .then((res) => {
        if (res && res.success) {
          setStatus('');
          form.hidden = true;
          const progress = document.querySelector('.intake__progress');
          if (progress) progress.hidden = true;
          if (success) {
            success.classList.add('is-active');
            success.focus();
          }
        } else {
          reset();
          setStatus(
            (res && res.message) ||
              'Sorry, your request could not be sent. Please call (573) 403-3544.',
            'error'
          );
        }
      })
      .catch(() => {
        reset();
        setStatus('Network error. Please try again, or call (573) 403-3544.', 'error');
      });
  });

  showStep(0);
})();
