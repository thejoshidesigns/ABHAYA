/* GitHub sync status indicator for the footer */
(function () {
  'use strict';

  const repo = 'thejoshidesigns/ABHAYA';
  const branch = 'main';
  const statusEl = document.querySelector('[data-github-sync]');
  if (!statusEl) return;

  const dot = statusEl.querySelector('[data-sync-dot]');
  const label = statusEl.querySelector('[data-sync-label]');
  const time = statusEl.querySelector('[data-sync-time]');
  const commit = statusEl.querySelector('[data-sync-commit]');

  function setStatus(state, text) {
    if (dot) {
      dot.classList.remove('is-pending', 'is-error');
      if (state === 'pending') dot.classList.add('is-pending');
      if (state === 'error') dot.classList.add('is-error');
    }
    if (label) label.textContent = text;
  }

  function relativeTime(date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  setStatus('pending', 'Checking...');

  fetch(`https://api.github.com/repos/${repo}/commits/${branch}`)
    .then((res) => {
      if (!res.ok) throw new Error('GitHub API unavailable');
      return res.json();
    })
    .then((data) => {
      const sha = data.sha || '';
      const shortSha = sha.slice(0, 7);
      const commitDate = new Date(data.commit?.committer?.date || data.commit?.author?.date || Date.now());
      const commitUrl = data.html_url || `https://github.com/${repo}/commit/${sha}`;

      setStatus('ok', 'Connected');
      if (time) time.textContent = `Synced ${relativeTime(commitDate)}`;
      if (commit) {
        commit.href = commitUrl;
        commit.textContent = shortSha;
      }
    })
    .catch(() => {
      setStatus('error', 'Sync status unavailable');
      if (time) time.textContent = 'Unable to reach GitHub';
      if (commit) {
        commit.href = `https://github.com/${repo}`;
        commit.textContent = 'View repo';
      }
    });
})();
