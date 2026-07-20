/* conditions-filter.js - search + category filter for conditions page */
(function () {
  'use strict';
  var grid = document.getElementById('conditions-grid');
  var search = document.getElementById('condition-search');
  var filterBar = document.querySelector('.filter-bar');
  var noResults = document.getElementById('no-results');
  if (!grid || !search || !filterBar) return;

  var tiles = Array.prototype.slice.call(grid.querySelectorAll('.bento__tile'));
  var activeFilter = 'all';

  function applyFilters() {
    var query = search.value.trim().toLowerCase();
    var visible = 0;
    tiles.forEach(function (tile) {
      var name = tile.dataset.name || '';
      var category = tile.dataset.category || '';
      var matchFilter = activeFilter === 'all' || category === activeFilter;
      var matchSearch = !query || name.indexOf(query) !== -1;
      if (matchFilter && matchSearch) {
        tile.style.display = '';
        visible++;
      } else {
        tile.style.display = 'none';
      }
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
