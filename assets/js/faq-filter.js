/* faq-filter.js - search + category filter for FAQ page */
(function () {
  'use strict';
  var search = document.getElementById('faq-search');
  var filterBar = document.querySelector('.filter-bar');
  var noResults = document.getElementById('faq-no-results');
  var categories = document.querySelectorAll('.faq-category');
  if (!search || !filterBar) return;

  var allItems = Array.prototype.slice.call(document.querySelectorAll('[data-faq]'));
  var activeFilter = 'all';

  function applyFilters() {
    var query = search.value.trim().toLowerCase();
    var visible = 0;
    allItems.forEach(function (item) {
      var summary = item.querySelector('.faq-accordion__summary');
      var body = item.querySelector('.faq-accordion__body');
      var text = (item.dataset.search || '').toLowerCase() + ' ' +
        (summary ? summary.textContent : '').toLowerCase() + ' ' +
        (body ? body.textContent : '').toLowerCase();
      var cat = item.closest('.faq-category');
      var category = cat ? cat.dataset.category : '';
      var matchFilter = activeFilter === 'all' || category === activeFilter;
      var matchSearch = !query || text.indexOf(query) !== -1;
      if (matchFilter && matchSearch) {
        item.style.display = '';
        visible++;
      } else {
        item.style.display = 'none';
        if (item.open) item.open = false;
      }
    });
    categories.forEach(function (cat) {
      var catItems = cat.querySelectorAll('[data-faq]');
      var any = Array.prototype.some.call(catItems, function (it) { return it.style.display !== 'none'; });
      cat.style.display = any ? '' : 'none';
    });
    if (noResults) noResults.style.display = visible === 0 ? '' : 'none';
  }

  search.addEventListener('input', applyFilters);

  filterBar.addEventListener('click', function (e) {
    var btn = e.target.closest('.filter-bar__btn');
    if (!btn) return;
    filterBar.querySelectorAll('.filter-bar__btn').forEach(function (b) {
      b.setAttribute('aria-pressed', 'false');
    });
    btn.setAttribute('aria-pressed', 'true');
    activeFilter = btn.dataset.filter;
    applyFilters();
  });
})();
