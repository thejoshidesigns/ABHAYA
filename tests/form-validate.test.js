const test = require('node:test');
const assert = require('node:assert');
const V = require('../assets/js/form-validate.js');

test('required text field must not be empty', () => {
  assert.equal(V.validateField({ type: 'text', value: '  ', required: true }), V.MESSAGES.required);
  assert.equal(V.validateField({ type: 'text', value: 'Ana', required: true }), null);
});

test('optional empty field passes', () => {
  assert.equal(V.validateField({ type: 'email', value: '', required: false }), null);
});

test('email format', () => {
  assert.equal(V.validateField({ type: 'email', value: 'nope', required: true }), V.MESSAGES.email);
  assert.equal(V.validateField({ type: 'email', value: 'a@b.org', required: true }), null);
});

test('phone format needs at least seven digits', () => {
  assert.equal(V.validateField({ type: 'tel', value: '(573) 40', required: true }), V.MESSAGES.tel);
  assert.equal(V.validateField({ type: 'tel', value: '(573) 403-3544', required: true }), null);
});

test('required checkbox must be checked', () => {
  assert.equal(V.validateField({ type: 'checkbox', required: true, checked: false }), V.MESSAGES.requiredCheckbox);
  assert.equal(V.validateField({ type: 'checkbox', required: true, checked: true }), null);
});

test('validateFields reports indexes in order', () => {
  const errors = V.validateFields([
    { type: 'text', value: 'ok', required: true },
    { type: 'email', value: '', required: true },
    { type: 'tel', value: 'abc', required: false },
  ]);
  assert.deepEqual(errors.map((e) => e.index), [1, 2]);
});

test('delivery is unconfigured without an access key', () => {
  assert.equal(V.deliveryMode('https://api.web3forms.com/submit', ''), 'unconfigured');
  assert.equal(V.deliveryMode('https://api.web3forms.com/submit', '   '), 'unconfigured');
  assert.equal(V.deliveryMode('', 'abc-123'), 'unconfigured');
  assert.equal(V.deliveryMode('https://api.web3forms.com/submit', 'abc-123'), 'live');
});
