/* Care-experience modal for principle cards. */
(function () {
  'use strict';

  var stories = {
    '1': {
      text: 'Visits are designed to leave room for context, questions, and shared decision-making. The goal is to understand what has been happening, what has helped before, and what needs to change next.',
      author: 'Time to be heard',
      role: 'Care principle',
      context: 'Abhaya Behavioral Health'
    },
    '2': {
      text: 'Appointments focus on clarity. Patients should leave with a practical understanding of the plan, what to watch for, and how follow-up decisions will be made.',
      author: 'Clear next steps',
      role: 'Care principle',
      context: 'Treatment planning'
    },
    '3': {
      text: 'When clinically appropriate, adolescent care includes family context while protecting the patient\'s dignity, privacy, and trust.',
      author: 'Family-aware adolescent care',
      role: 'Care principle',
      context: 'Adolescents and families'
    },
    '4': {
      text: 'The intake process asks for enough information to prepare for a first conversation without turning a public website form into a full medical record.',
      author: 'Thoughtful intake',
      role: 'Care principle',
      context: 'Privacy-conscious process'
    },
    '5': {
      text: 'Medication decisions are revisited over time. Benefits, side effects, comfort level, and goals all matter when adjusting a treatment plan.',
      author: 'Careful medication management',
      role: 'Care principle',
      context: 'Ongoing care'
    },
    '6': {
      text: 'Telepsychiatry can make care easier to keep up with for eligible patients in Missouri while preserving the same thoughtful approach to assessment and follow-up.',
      author: 'Telehealth access',
      role: 'Care principle',
      context: 'Missouri telepsychiatry'
    },
    '7': {
      text: 'Good psychiatric care works best when the patient is an active participant. The plan should be explained clearly and adjusted collaboratively.',
      author: 'Collaborative planning',
      role: 'Care principle',
      context: 'Shared decisions'
    },
    '8': {
      text: 'Care is grounded in evidence while still making room for the realities of daily life, relationships, stress, sleep, work, school, and family.',
      author: 'Evidence-informed support',
      role: 'Care principle',
      context: 'Whole-person care'
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
