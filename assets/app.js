/* dotyoujee / Ops Log — front-end renderer.
   Reads committed data/progress.json and data/posts.json. No magic numbers. */
(function () {
  'use strict';

  var state = { progress: null, posts: [] };
  var page = document.body.dataset.page || 'home';

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function bind(name) { return document.querySelector('[data-bind="' + name + '"]'); }
  function setText(name, value) { var el = bind(name); if (el) el.textContent = value; }
  function fmt(n) { return Number(n || 0).toLocaleString('en-US'); }

  var TYPE_LABELS = { meta: 'Meta', notes: 'Notes', lab: 'Lab', writeup: 'Writeup', ctf: 'CTF', cert: 'Cert' };
  var COLOR_MAP = { mint: 'var(--mint)', amber: 'var(--amber)', violet: 'var(--violet)', cyan: 'var(--cyan)', lime: 'var(--lime)', orange: 'var(--orange)' };

  function badgeHtml(type) {
    var cls = type === 'ctf' ? 'amber' : (type === 'cert' ? 'violet' : (type === 'lab' ? 'mint' : ''));
    return '<span class="tag ' + cls + '">' + esc(TYPE_LABELS[type] || type) + '</span>';
  }

  /* ---------- Chrome ---------- */
  function initChrome() {
    var header = document.getElementById('site-header');
    var btn = document.getElementById('menu-btn');
    var nav = document.getElementById('nav-links');
    function onScroll() { if (header) header.classList.toggle('scrolled', window.scrollY > 20); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    if (btn && nav) {
      btn.addEventListener('click', function () {
        var open = nav.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(open));
      });
      nav.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); });
      });
    }
  }

  /* ---------- Home console ---------- */
  function renderHome() {
    var p = state.progress;
    if (!p) return;
    var t = p.totals, l = p.level;
    setText('xp', fmt(t.xp));
    setText('level', l.name);
    setText("level-min", fmt(t.xp) + " XP total");
    setText('to-next', l.next ? fmt(l.to_next) + ' XP to ' + l.next : 'Top level reached');
    setText("posts", fmt(t.posts));
    setText("posts-label", t.posts === 1 ? "entry" : "entries");
    setText('verified', fmt(t.verified_posts));
    setText('modules', t.modules_done + '/' + t.modules_total);
    setText('hours', fmt(t.hours));
    setText('streak', p.streak.current + 'd');
    setText('commit-count', fmt(p.commit_xp.commits));
    setText('generated', 'generated ' + p.generated_at.slice(0, 10));

    var bar = bind('progress-bar');
    if (bar) {
      var pct = l.next_min ? Math.min(100, (t.xp / l.next_min) * 100) : 100;
      requestAnimationFrame(function () { bar.style.width = pct.toFixed(1) + '%'; });
    }
    setText('progress-caption', l.next ? fmt(l.min) + ' → ' + fmt(l.next_min) + ' XP' : 'max level');

    var badges = bind('badges');
    if (badges) {
      badges.innerHTML = p.badges.length
        ? p.badges.map(function (b) { return '<span class="badge" title="' + esc(b.desc) + '">' + esc(b.name) + '</span>'; }).join('')
        : '<span class="badge empty">No badges yet — receipts first.</span>';
    }

    var recent = bind('recent');
    if (recent) {
      recent.innerHTML = p.recent.length ? p.recent.map(function (r) {
        return '<a href="post.html?slug=' + encodeURIComponent(r.slug) + '" style="display:flex;justify-content:space-between;gap:1rem;border-bottom:1px solid var(--line);padding:.7rem 0;font-size:.82rem">' +
          '<span>' + esc(r.title) + '<br><small class="mono" style="color:var(--faint)">' + esc(r.date) + ' · ' + esc(TYPE_LABELS[r.type] || r.type) + '</small></span>' +
          '<span class="' + (r.verified ? 'xp-pill' : 'no-receipt') + ' mono" style="font-size:.7rem">' + (r.verified ? '+' + r.xp + ' XP' : 'no receipt') + '</span></a>';
      }).join('') : '<p class="muted" style="font-size:.84rem">The first entry is live. The first real lab result is next.</p>';
    }

    renderTrackCards(bind('home-tracks'), p.tracks.slice(0, 3));
  }

  function renderTrackCards(target, tracks) {
    if (!target) return;
    target.innerHTML = tracks.map(function (tr) {
      var color = COLOR_MAP[tr.color] || 'var(--mint)';
      return '<a class="track-card ' + (tr.status === 'active' ? 'active' : '') + '" href="learn.html#track-' + esc(tr.id) + '">' +
        '<span class="tag" style="color:' + color + ';border-color:' + color + '55">' + esc(tr.status) + '</span>' +
        '<h3>' + esc(tr.title) + '</h3><p>' + esc(tr.short) + '</p>' +
        '<div class="track-meta"><span>' + tr.completed + ' / ' + tr.total + ' modules</span><span>' + fmt(tr.xp) + ' XP</span></div>' +
        '<div class="mini-track"><span style="width:' + tr.percent + '%;background:' + color + '"></span></div>' +
        '</a>';
    }).join('');
  }

  /* ---------- Learn / skill tree ---------- */
  function renderLearn() {
    var p = state.progress;
    if (!p) return;
    setText('learn-xp', fmt(p.totals.xp) + ' XP');
    setText('learn-modules', p.totals.modules_done + ' of ' + p.totals.modules_total + ' modules complete');

    var filters = bind('track-filters');
    if (filters) {
      filters.innerHTML = '<button type="button" class="filter-btn active" data-filter="all">All tracks</button>' +
        p.tracks.map(function (tr) { return '<button type="button" class="filter-btn" data-filter="' + esc(tr.id) + '">' + esc(tr.title) + '</button>'; }).join('');
      filters.addEventListener('click', function (e) {
        var b = e.target.closest('.filter-btn');
        if (!b) return;
        filters.querySelectorAll('.filter-btn').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        paintTracks(p.tracks, b.dataset.filter);
      });
    }
    paintTracks(p.tracks, 'all');
  }

  function paintTracks(tracks, filter) {
    var target = bind('track-list');
    if (!target) return;
    var shown = tracks.filter(function (t) { return filter === 'all' || t.id === filter; });
    target.innerHTML = shown.map(function (tr) {
      var color = COLOR_MAP[tr.color] || 'var(--mint)';
      var modules = tr.modules.map(function (m) {
        var locked = (m.prereqs || []).some(function (id) {
          var all = {};
          tracks.forEach(function (t) { t.modules.forEach(function (x) { all[x.id] = x.done; }); });
          return !all[id];
        });
        var stateCls = m.done ? 'done' : (locked ? 'locked' : '');
        return '<details class="module ' + stateCls + '">' +
          '<summary><span class="module-id">' + esc(m.id) + '</span><span style="flex:1">' + esc(m.title) + '</span>' +
          '<span class="tag">' + (m.done ? 'complete' : (locked ? 'locked' : m.xp + ' XP')) + '</span></summary>' +
          '<div class="module-body">' +
          '<h4>Objectives</h4><ul>' + (m.objectives || []).map(function (o) { return '<li>' + esc(o) + '</li>'; }).join('') + '</ul>' +
          '<h4>Lab</h4><p>' + esc(m.lab || '') + '</p>' +
          (m.resources && m.resources.length ? '<h4>Resources</h4><ul>' + m.resources.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>' : '') +
          (m.prereqs && m.prereqs.length ? '<h4>Requires</h4><p class="mono" style="font-size:.7rem">' + m.prereqs.map(esc).join(', ') + '</p>' : '') +
          '<div class="receipt-note">' + (m.done ? '✓ Evidence attached in the journal.' : 'To claim: publish a post with an evidence link and list this module ID.') + '</div>' +
          '</div></details>';
      }).join('');
      return '<section class="track-card" id="track-' + esc(tr.id) + '" style="display:block;border-color:' + (tr.status === 'active' ? color + '55' : 'var(--line)') + '">' +
        '<div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;align-items:center">' +
        '<div><span class="tag" style="color:' + color + ';border-color:' + color + '55">' + esc(tr.status) + '</span>' +
        '<h3 style="font-size:1.4rem;margin:.7rem 0 .3rem">' + esc(tr.title) + '</h3><p style="color:var(--muted);font-size:.86rem;margin:0">' + esc(tr.short) + '</p></div>' +
        '<div style="text-align:right"><div class="mono" style="color:' + color + ';font-size:1.5rem">' + tr.percent + '%</div>' +
        '<div class="mono" style="font-size:.6rem;color:var(--faint)">' + tr.completed + '/' + tr.total + ' · ' + fmt(tr.xp) + ' XP</div></div></div>' +
        '<div class="mini-track" style="margin:1.2rem 0"><span style="width:' + tr.percent + '%;background:' + color + '"></span></div>' +
        modules + '</section>';
    }).join('');
  }

  /* ---------- Journal ---------- */
  function renderBlog() {
    var posts = state.posts;
    var filters = bind('post-filters');
    var search = bind('post-search');
    var active = 'all';
    if (filters) {
      filters.innerHTML = '<button type="button" class="filter-btn active" data-filter="all">All</button>' +
        ['lab', 'writeup', 'ctf', 'cert', 'notes', 'meta'].map(function (t) {
          return '<button type="button" class="filter-btn" data-filter="' + t + '">' + TYPE_LABELS[t] + '</button>';
        }).join('');
      filters.addEventListener('click', function (e) {
        var b = e.target.closest('.filter-btn');
        if (!b) return;
        filters.querySelectorAll('.filter-btn').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        active = b.dataset.filter;
        paintPosts();
      });
    }
    if (search) search.addEventListener('input', paintPosts);

    function paintPosts() {
      var q = search ? search.value.trim().toLowerCase() : '';
      var shown = posts.filter(function (p) {
        return (active === 'all' || p.type === active) &&
          (!q || (p.title + ' ' + p.summary + ' ' + p.tags.join(' ')).toLowerCase().indexOf(q) !== -1);
      });
      var target = bind('post-grid');
      if (!target) return;
      target.innerHTML = shown.length ? shown.map(function (p) {
        return '<a class="post-card" href="post.html?slug=' + encodeURIComponent(p.slug) + '">' +
          '<div class="post-top">' + badgeHtml(p.type) + '<span class="mono" style="font-size:.62rem;color:var(--faint)">' + esc(p.date) + '</span></div>' +
          '<h3>' + esc(p.title) + '</h3><p>' + esc(p.summary) + '</p>' +
          '<div class="post-foot"><span>' + esc(p.track || 'general') + (p.hours ? ' · ~' + p.hours + 'h' : '') + '</span>' +
          '<span class="' + (p.verified ? 'xp-pill' : 'no-receipt') + '">' + (p.verified ? '+' + p.xp + ' XP' : 'no XP') + '</span></div></a>';
      }).join('') : '<div class="empty-state">No entries match that. Clear the filter and try again.</div>';
    }
    paintPosts();
    setText('post-count', posts.length + ' entries');
  }

  /* ---------- Single post ---------- */
  function renderPost() {
    var slug = new URLSearchParams(window.location.search).get('slug');
    var post = state.posts.find(function (p) { return p.slug === slug; });
    var target = bind('article');
    if (!target) return;
    if (!post) {
      target.innerHTML = '<h1>Entry not found</h1><p class="muted">That slug is not in the journal. <a class="accent" href="blog.html">Back to the journal</a>.</p>';
      return;
    }
    document.title = post.title + ' — dotyoujee Ops Log';
    var html = window.marked ? window.marked.parse(post.body) : '<pre>' + esc(post.body) + '</pre>';
    var evidence = post.verified
      ? '<div class="evidence-box">EVIDENCE · <a class="accent" href="' + esc(post.evidence) + '" target="_blank" rel="noopener noreferrer">' + esc(post.evidence_label || 'Open receipt') + ' ↗</a><br>' +
        'This entry earns ' + post.xp + ' XP (' + post.base_xp + ' base + ' + (post.module_xp || 0) + ' module).</div>'
      : '<div class="evidence-box none">NO RECEIPT · ' + (post.type === 'meta' || post.type === 'notes' ? 'Meta and notes earn zero by design.' : 'No evidence URL was supplied, so this entry earns zero XP.') + '</div>';
    target.innerHTML =
      '<a class="back-link" href="blog.html">← back to journal</a>' +
      '<h1>' + esc(post.title) + '</h1>' +
      '<div class="article-meta">' + badgeHtml(post.type) +
      '<span>' + esc(post.date) + '</span>' +
      '<span>' + esc(post.track || 'general') + '</span>' +
      (post.hours ? '<span>~' + post.hours + 'h logged</span>' : '') +
      '<span class="' + (post.verified ? 'xp-pill' : 'no-receipt') + '">' + (post.verified ? '+' + post.xp + ' XP' : '0 XP') + '</span></div>' +
      evidence +
      '<div class="article-prose">' + html + '</div>';
  }

  /* ---------- Boot ---------- */
  function boot() {
    initChrome();
    Promise.all([
      fetch('data/progress.json').then(function (r) { return r.json(); }),
      fetch('data/posts.json').then(function (r) { return r.json(); })
    ]).then(function (data) {
      state.progress = data[0];
      state.posts = data[1];
      if (page === 'home') renderHome();
      if (page === 'learn') renderLearn();
      if (page === 'blog') renderBlog();
      if (page === 'post') renderPost();
    }).catch(function (err) {
      document.querySelectorAll('.loading').forEach(function (el) {
        el.textContent = 'Could not load progress data: ' + err.message + '. Serve this folder over HTTP.';
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
