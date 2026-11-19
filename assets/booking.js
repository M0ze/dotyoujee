/* ==========================================================================
   dotyoujee — booking + pricing interactions
   No popups, no redirects: the visitor always sees what happens next.
   ========================================================================== */

(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WA = '256764625700';

  /* ---------- Header / theme / progress (shared on these pages) ---------- */
  var toggle = document.getElementById('theme-toggle');
  if (toggle) {
    var saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    toggle.innerHTML = saved === 'dark' ? '🌙' : '☀️';
    toggle.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      toggle.innerHTML = next === 'dark' ? '🌙' : '☀️';
    });
  }

  var mobileToggle = document.getElementById('mobile-toggle');
  var nav = document.getElementById('nav-menu');
  if (mobileToggle && nav) {
    mobileToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      mobileToggle.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var header = document.getElementById('site-header');
  var progress = document.getElementById('scroll-progress');
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 24);
    if (progress) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Currency switch for the package page ----------------------- */
  var currencyButtons = document.querySelectorAll('.currency-switch button');
  var priceNodes = document.querySelectorAll('[data-ugx][data-usd]');
  function setCurrency(code) {
    priceNodes.forEach(function (node) {
      node.textContent = code === 'USD' ? node.getAttribute('data-usd') : node.getAttribute('data-ugx');
    });
    currencyButtons.forEach(function (b) { b.classList.toggle('active', b.dataset.currency === code); });
    try { localStorage.setItem('dj-currency', code); } catch (e) {}
  }
  if (currencyButtons.length) {
    currencyButtons.forEach(function (b) {
      b.addEventListener('click', function () { setCurrency(b.dataset.currency); });
    });
    setCurrency(localStorage.getItem('dj-currency') || 'UGX');
  }

  /* ---------- Resource search + tag filters ------------------------------ */
  var resourceSearch = document.getElementById('resource-search-input');
  var resourceCards = document.querySelectorAll('.resource-item-card');
  var resourceFilters = document.querySelectorAll('#resource-filters .tab-btn');
  var emptyState = document.getElementById('resource-empty');
  if (resourceCards.length) {
    var activeTag = 'all';
    function applyResourceFilters() {
      var query = resourceSearch ? resourceSearch.value.trim().toLowerCase() : '';
      var shown = 0;
      resourceCards.forEach(function (card) {
        var tagOK = activeTag === 'all' || card.getAttribute('data-tag') === activeTag;
        var textOK = !query || card.textContent.toLowerCase().indexOf(query) !== -1;
        var show = tagOK && textOK;
        card.style.display = show ? 'flex' : 'none';
        if (show) shown++;
      });
      if (emptyState) emptyState.hidden = shown !== 0;
    }
    if (resourceSearch) resourceSearch.addEventListener('input', applyResourceFilters);
    resourceFilters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        resourceFilters.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        activeTag = btn.getAttribute('data-category') || 'all';
        applyResourceFilters();
      });
    });
    applyResourceFilters();
  }

  /* ---------- Booking form ----------------------------------------------- */
  var form = document.getElementById('booking-form');
  if (!form) return;

  var params = new URLSearchParams(window.location.search);
  var packParam = params.get('pack');
  var sourceParam = params.get('source');
  var packSelect = document.getElementById('bk-pack');
  var validPacks = ['recon', 'essential', 'guard', 'assurance', 'programme', 'enterprise', 'addon'];
  if (packSelect && packParam && validPacks.indexOf(packParam) !== -1) packSelect.value = packParam;

  var confirm = document.getElementById('booking-confirm');
  var summary = document.getElementById('bk-summary');
  var refEl = document.getElementById('bk-ref');
  var waLink = document.getElementById('bk-whatsapp');
  var emailLink = document.getElementById('bk-email');
  var copyBtn = document.getElementById('bk-copy');
  var editBtn = document.getElementById('bk-edit');

  function value(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function checked(id) { var el = document.getElementById(id); return !!(el && el.checked); }

  function validate() {
    var rules = [
      ['bk-name', value('bk-name').length > 1],
      ['bk-email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value('bk-email'))],
      ['bk-sector', value('bk-sector').length > 0],
      ['bk-timeline', value('bk-timeline').length > 0],
      ['bk-pack', value('bk-pack').length > 0],
      ['bk-brief', value('bk-brief').length > 8]
    ];
    var ok = true;
    rules.forEach(function (r) {
      var el = document.getElementById(r[0]);
      var err = el && el.parentElement.querySelector('.field-error');
      el.classList.toggle('invalid', !r[1]);
      if (err) err.classList.toggle('show', !r[1]);
      if (!r[1]) ok = false;
    });
    var consent = document.getElementById('bk-consent');
    var consentErr = document.querySelector('.consent-error');
    var consentOk = checked('bk-consent');
    if (consent) consent.classList.toggle('invalid', !consentOk);
    if (consentErr) consentErr.classList.toggle('show', !consentOk);
    if (!consentOk) ok = false;
    return ok;
  }

  form.addEventListener('input', function (e) {
    if (e.target.classList) e.target.classList.remove('invalid');
    var err = e.target.parentElement && e.target.parentElement.querySelector('.field-error');
    if (err) err.classList.remove('show');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) {
      var first = form.querySelector('.invalid');
      if (first) first.focus();
      return;
    }

    var name = value('bk-name');
    var org = value('bk-org') || 'Not specified';
    var email = value('bk-email');
    var phone = value('bk-phone') || 'Not provided';
    var sector = value('bk-sector');
    var timeline = value('bk-timeline');
    var packText = packSelect.options[packSelect.selectedIndex].text;
    var brief = value('bk-brief');
    var stamp = new Date();
    var pad = function (n) { return String(n).padStart(2, '0'); };
    var ref = 'DJ-' + stamp.getFullYear() + pad(stamp.getMonth() + 1) + pad(stamp.getDate()) + '-' + pad(stamp.getHours()) + pad(stamp.getMinutes());
    var message = [
      '*DOTYOUJEE BRIEFING REQUEST*',
      'Ref: ' + ref,
      'Name: ' + name,
      'Organisation: ' + org,
      'Email: ' + email,
      'WhatsApp/Phone: ' + phone,
      'Sector: ' + sector,
      'Timeline: ' + timeline,
      'Package: ' + packText,
      'Source page: ' + (sourceParam || 'website'),
      '',
      'Brief:',
      brief
    ].join('\n');

    if (refEl) refEl.textContent = ref;
    if (summary) summary.textContent = message;
    if (waLink) waLink.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(message);
    if (emailLink) emailLink.href = 'mailto:mugaggamoses@gmail.com?subject=' + encodeURIComponent('Briefing ' + ref + ' — ' + org) + '&body=' + encodeURIComponent(message);

    form.hidden = true;
    if (confirm) {
      confirm.hidden = false;
      confirm.focus();
      var behavior = reduced ? 'auto' : 'smooth';
      confirm.scrollIntoView({ behavior: behavior, block: 'center' });
    }
  });

  if (editBtn) editBtn.addEventListener('click', function () {
    if (confirm) confirm.hidden = true;
    form.hidden = false;
    form.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    var first = form.querySelector('input');
    if (first) first.focus();
  });

  if (copyBtn) copyBtn.addEventListener('click', function () {
    var text = summary ? summary.textContent : '';
    var done = function () {
      copyBtn.textContent = 'Copied ✓';
      setTimeout(function () { copyBtn.textContent = 'Copy brief'; }, 2200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text, done); });
    } else { fallbackCopy(text, done); }
  });

  function fallbackCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) {}
    document.body.removeChild(ta);
  }
})();
