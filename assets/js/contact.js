/* =========================================================================
   contact.js - contact form validation and submission.
   Delivery is only attempted when a Web3Forms access key is configured.
   Without one the form never claims success; it points to phone and email.
   ========================================================================= */
(function () {
  'use strict';

  const form = document.querySelector('[data-contact-form]');
  if (!form) return;

  const V = window.FormValidate;
  const success = document.getElementById('contact-success');
  const status = form.querySelector('[data-form-status]');
  const submitBtn = form.querySelector('button[type="submit"]');
  let submitting = false;
  let errorSeq = 0;

  const errorNodeFor = (field) => {
    const wrap = field.closest('.field');
    return wrap ? wrap.querySelector('.field__error') : null;
  };

  const showError = (field, msg) => {
    const wrap = field.closest('.field');
    if (!wrap) return;
    wrap.classList.add('field--error');
    const err = errorNodeFor(field);
    if (err) {
      if (!err.id) err.id = 'field-error-' + ++errorSeq;
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
    const err = errorNodeFor(field);
    if (err) err.textContent = '';
    field.removeAttribute('aria-invalid');
  };

  const setStatus = (msg, tone) => {
    if (!status) return;
    status.textContent = msg;
    status.hidden = !msg;
    status.classList.toggle('form__status--error', tone === 'error');
  };

  const fields = () =>
    Array.from(form.querySelectorAll('input[required], select[required], textarea[required], input[type="email"], input[type="tel"]')).filter(
      (el) => el.type !== 'hidden' && el.name !== 'botcheck' && el.name !== '_gotcha'
    );

  const validate = () => {
    const els = fields();
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
    return { ok: errors.length === 0, first: errors.length ? els[errors[0].index] : null, count: errors.length };
  };

  form.addEventListener('input', (e) => {
    const wrap = e.target.closest && e.target.closest('.field');
    if (wrap && wrap.classList.contains('field--error')) clearError(e.target);
  });
  form.addEventListener('change', (e) => {
    const wrap = e.target.closest && e.target.closest('.field');
    if (wrap && wrap.classList.contains('field--error')) clearError(e.target);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (submitting) return;

    const result = validate();
    if (!result.ok) {
      setStatus(
        result.count === 1
          ? 'One field needs your attention before this can be sent.'
          : result.count + ' fields need your attention before this can be sent.',
        'error'
      );
      if (result.first) result.first.focus();
      return;
    }

    const accessKey = (form.querySelector('input[name="access_key"]') || {}).value || '';
    const endpoint = form.getAttribute('action') || '';

    if (V.deliveryMode(endpoint, accessKey) !== 'live') {
      setStatus(
        'Online message delivery is not active yet. Please call (573) 403-3544 or email contactus@abhayabh.com and we will respond within one business day.',
        'error'
      );
      if (status) status.focus();
      return;
    }

    submitting = true;
    submitBtn.disabled = true;
    const originalLabel = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    setStatus('Sending your message...');

    const reset = () => {
      submitting = false;
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    };

    fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then((r) => r.json().catch(() => ({})))
      .then((res) => {
        if (res && res.success) {
          setStatus('');
          form.hidden = true;
          if (success) {
            success.removeAttribute('hidden');
            success.setAttribute('tabindex', '-1');
            success.focus();
          }
        } else {
          reset();
          setStatus(
            (res && res.message) ||
              'Sorry, your message could not be sent. Please call (573) 403-3544 or email contactus@abhayabh.com.',
            'error'
          );
        }
      })
      .catch(() => {
        reset();
        setStatus(
          'Network error. Please try again, or call (573) 403-3544 or email contactus@abhayabh.com.',
          'error'
        );
      });
  });
})();
