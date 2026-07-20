/* intake-date.js - prefill today's date into the signature field */
(function () {
  'use strict';
  var f = document.getElementById('signature-date');
  if (!f) return;
  var t = new Date();
  var yyyy = t.getFullYear();
  var mm = String(t.getMonth() + 1).padStart(2, '0');
  var dd = String(t.getDate()).padStart(2, '0');
  f.value = yyyy + '-' + mm + '-' + dd;
})();
