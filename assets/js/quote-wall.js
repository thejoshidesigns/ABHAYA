/* Quote wall — click to open full quote modal */
(function () {
  'use strict';

  var stories = {
    '1': {
      text: 'For the first time in years, I feel like I\u2019m moving forward instead of just surviving each day. The care I received here wasn\u2019t transactional \u2014 it was thoughtful, patient, and deeply human. We worked through what wasn\u2019t working, adjusted along the way, and I finally have tools I actually use.',
      author: 'M.R.',
      role: 'Adult psychiatry patient',
      context: 'In care since 2023'
    },
    '2': {
      text: 'Dr. Puvvadi actually listens. I never felt rushed, never felt like a number. Telepsychiatry made it possible for me to keep appointments during a season of life when in-person just wasn\u2019t going to happen \u2014 and the quality of care never dropped.',
      author: 'J.T.',
      role: 'Telepsychiatry patient',
      context: 'Missouri, remote care'
    },
    '3': {
      text: 'My son finally has a provider who understands adolescents. The change at home has been remarkable \u2014 not overnight, but steady. We were treated like partners in his care, and every visit built on the last one.',
      author: 'Parent of A.S.',
      role: 'Adolescent care',
      context: 'Family-involved treatment'
    },
    '4': {
      text: 'The intake process was thoughtful. I felt seen before we even met. When we did meet, the questions were the right ones \u2014 and the plan we built together felt like mine, not something handed to me.',
      author: 'L.K.',
      role: 'Psychotherapy patient',
      context: 'Supportive psychotherapy'
    },
    '5': {
      text: 'Medication management done carefully \u2014 not just a prescription pad. We revisited, adjusted, and found what actually worked for me. I was included in every decision and never felt hurried through a checklist.',
      author: 'D.P.',
      role: 'Medication management',
      context: 'Ongoing care'
    }
  };

  var modal = document.getElementById('quote-modal');
  if (!modal) return;

  var textEl = document.getElementById('quote-modal-text');
  var authorEl = document.getElementById('quote-modal-author');
  var roleEl = document.getElementById('quote-modal-role');
  var contextEl = document.getElementById('quote-modal-context');
  var lastFocus = null;

  function open(id) {
    var s = stories[id];
    if (!s) return;
    textEl.textContent = s.text;
    authorEl.textContent = s.author;
    roleEl.textContent = s.role;
    contextEl.textContent = s.context;
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      modal.classList.add('is-open');
      var closeBtn = modal.querySelector('.quote-modal__close');
      if (closeBtn) closeBtn.focus();
    });
  }

  function close() {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(function () {
      modal.hidden = true;
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }, 200);
  }

  document.querySelectorAll('.quote-card').forEach(function (card) {
    card.addEventListener('click', function () {
      open(card.getAttribute('data-quote'));
    });
  });

  modal.querySelectorAll('[data-quote-close]').forEach(function (el) {
    el.addEventListener('click', close);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) close();
  });
})();
