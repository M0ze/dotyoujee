/* Booking handoff: validate, draft, and let the visitor choose the channel.
   No popups, no auto-redirect, no fake backend. */
(function () {
  'use strict';
  var form = document.getElementById('booking-form');
  if (!form) return;
  var confirm = document.getElementById('booking-confirm');
  var summary = document.getElementById('booking-summary');

  function value(id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var required = [
      ['c-name', value('c-name').length > 1],
      ['c-email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value('c-email'))],
      ['c-service', value('c-service').length > 0],
      ['c-brief', value('c-brief').length > 8]
    ];
    var ok = true;
    required.forEach(function (r) {
      var el = document.getElementById(r[0]);
      var err = el && el.parentElement.querySelector('small');
      el.classList.toggle('invalid', !r[1]);
      if (err) err.classList.toggle('show', !r[1]);
      if (!r[1]) ok = false;
    });
    var consent = document.getElementById('c-consent');
    var consentErr = document.getElementById('c-consent-error');
    consent.classList.toggle('invalid', !consent.checked);
    consentErr.style.display = consent.checked ? 'none' : 'block';
    if (!consent.checked) ok = false;
    if (!ok) { form.querySelector('.invalid').focus(); return; }

    var message = [
      'DOTYOUJEE BRIEFING REQUEST',
      'Name: ' + value('c-name'),
      'Organisation: ' + (value('c-org') || 'Not specified'),
      'Email: ' + value('c-email'),
      'Service: ' + value('c-service'),
      'Timeline: ' + value('c-timeline'),
      '',
      'Brief:',
      value('c-brief')
    ].join('\n');

    summary.textContent = message;
    document.getElementById('c-whatsapp').href =
      'https://wa.me/256764625700?text=' + encodeURIComponent(message);
    document.getElementById('c-email').href =
      'mailto:mugaggamoses@gmail.com?subject=' + encodeURIComponent('Briefing request — ' + value('c-org')) +
      '&body=' + encodeURIComponent(message);
    form.hidden = true;
    confirm.hidden = false;
    confirm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  document.getElementById('c-edit').addEventListener('click', function () {
    confirm.hidden = true;
    form.hidden = false;
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.getElementById('c-copy').addEventListener('click', function () {
    var btn = this;
    navigator.clipboard.writeText(summary.textContent).then(function () {
      btn.textContent = 'Copied ✓';
      setTimeout(function () { btn.textContent = 'Copy brief'; }, 2000);
    });
  });
})();
