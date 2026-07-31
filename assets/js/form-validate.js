/* =========================================================================
   form-validate.js - shared, testable field validation helpers.
   Exposed on window.FormValidate for the browser and via module.exports
   for the Node test runner.
   ========================================================================= */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.FormValidate = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^[0-9+()\-\s.]{7,}$/;

  const MESSAGES = {
    required: 'This field is required.',
    requiredCheckbox: 'Please check this box to continue.',
    email: 'Please enter a valid email address, for example name@example.org.',
    tel: 'Please enter a valid phone number, for example (573) 403-3544.',
  };

  const isEmail = (v) => EMAIL_RE.test(String(v || '').trim());
  const isPhone = (v) => {
    const value = String(v || '').trim();
    if (!PHONE_RE.test(value)) return false;
    return (value.match(/[0-9]/g) || []).length >= 7;
  };

  /**
   * Validate a single field descriptor.
   * @param {{type?: string, value?: string, required?: boolean, checked?: boolean}} field
   * @returns {string|null} error message, or null when valid
   */
  function validateField(field) {
    const type = (field.type || 'text').toLowerCase();
    if (type === 'checkbox') {
      if (field.required && !field.checked) return MESSAGES.requiredCheckbox;
      return null;
    }
    const value = String(field.value == null ? '' : field.value).trim();
    if (field.required && !value) return MESSAGES.required;
    if (!value) return null;
    if (type === 'email' && !isEmail(value)) return MESSAGES.email;
    if (type === 'tel' && !isPhone(value)) return MESSAGES.tel;
    return null;
  }

  /** Validate a list of descriptors; returns [{ index, message }] */
  function validateFields(fields) {
    const errors = [];
    fields.forEach((field, index) => {
      const message = validateField(field);
      if (message) errors.push({ index, message });
    });
    return errors;
  }

  /**
   * Decides whether the form can actually be delivered. A form is only live
   * when it posts to a configured endpoint with a non-empty access key.
   */
  function deliveryMode(endpoint, accessKey) {
    const url = String(endpoint || '');
    const key = String(accessKey || '').trim();
    if (url.includes('api.web3forms.com') && key.length > 0) return 'live';
    return 'unconfigured';
  }

  return { validateField, validateFields, deliveryMode, isEmail, isPhone, MESSAGES };
});
