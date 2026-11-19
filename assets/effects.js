/* ==========================================================================
   dotyoujee — interaction & scroll-motion engine (ES module)
   Runs alongside the classic script.js, which owns the legacy form/scanner logic.
   ========================================================================== */

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// Only hide reveal elements once this engine is actually running.
document.body.classList.add('reveal-ready');

/* ---------- 1. Split headline into animatable words ---------------------- */
function splitHeading(el) {
  const frag = document.createDocumentFragment();
  let i = 0;

  function word(text) {
    const outer = document.createElement('span');
    outer.className = 'word';
    const inner = document.createElement('span');
    inner.className = 'word-inner';
    inner.style.setProperty('--i', i++);
    inner.textContent = text;
    outer.appendChild(inner);
    return outer;
  }

  Array.from(el.childNodes).forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent.trim().split(/\s+/).filter(Boolean).forEach(w => {
        frag.appendChild(word(w));
        frag.appendChild(document.createTextNode(' '));
      });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const inner = document.createElement('span');
      inner.className = 'word-inner';
      inner.style.setProperty('--i', i++);
      inner.appendChild(node.cloneNode(true));
      const outer = document.createElement('span');
      outer.className = 'word';
      outer.appendChild(inner);
      frag.appendChild(outer);
      frag.appendChild(document.createTextNode(' '));
    }
  });

  el.textContent = '';
  el.appendChild(frag);
}

document.querySelectorAll('[data-split]').forEach(splitHeading);

/* ---------- 2. Reveal on scroll ------------------------------------------ */
const revealItems = document.querySelectorAll('[data-reveal]');
revealItems.forEach(el => {
  const delay = Number(el.dataset.delay || 0);
  if (delay) el.style.transitionDelay = `${delay}ms`;
});

if (reduced || !('IntersectionObserver' in window)) {
  revealItems.forEach(el => el.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  revealItems.forEach(el => revealObserver.observe(el));
}

/* ---------- 3. Animated number counters --------------------------------- */
function animateCount(el) {
  const target = Number(el.dataset.count || 0);
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  if (reduced) { el.textContent = prefix + target + suffix; return; }

  const duration = 1500;
  const start = performance.now();
  function step(now) {
    const p = clamp((now - start) / duration, 0, 1);
    const eased = 1 - Math.pow(1 - p, 4);
    el.textContent = prefix + Math.round(target * eased) + suffix;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const counters = document.querySelectorAll('[data-count]');
if ('IntersectionObserver' in window) {
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        countObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(el => countObserver.observe(el));
} else {
  counters.forEach(animateCount);
}

/* ---------- 4. Scroll chrome: progress, header, timeline, parallax ------- */
const progress = document.getElementById('scroll-progress');
const header = document.getElementById('site-header');
const backToTop = document.getElementById('back-to-top');
const timeline = document.getElementById('timeline');
const timelineFill = document.getElementById('timeline-fill');
const parallaxEls = document.querySelectorAll('[data-parallax]');
let ticking = false;

function onScrollFrame() {
  const y = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (y / docHeight) * 100 : 0;

  if (progress) progress.style.width = pct + '%';
  if (header) header.classList.toggle('scrolled', y > 24);
  if (backToTop) backToTop.classList.toggle('visible', y > 600);

  if (timeline && timelineFill) {
    const rect = timeline.getBoundingClientRect();
    const t = clamp((window.innerHeight * 0.78 - rect.top) / Math.max(rect.height, 1), 0, 1);
    if (window.innerWidth <= 720) timelineFill.style.height = (t * 100) + '%';
    else timelineFill.style.width = (t * 100) + '%';
  }

  if (!reduced) {
    parallaxEls.forEach(el => {
      const speed = Number(el.dataset.parallax || 0);
      const shift = clamp(y, 0, window.innerHeight * 1.4) * speed * 0.32;
      el.style.translate = `0 ${shift.toFixed(1)}px`;
    });
  }
  ticking = false;
}

function requestScrollFrame() {
  if (!ticking) { ticking = true; requestAnimationFrame(onScrollFrame); }
}
window.addEventListener('scroll', requestScrollFrame, { passive: true });
window.addEventListener('resize', requestScrollFrame, { passive: true });
onScrollFrame();

if (backToTop) {
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));
}

/* ---------- 5. Active nav section --------------------------------------- */
if ('IntersectionObserver' in window) {
  const links = document.querySelectorAll('.nav-link[data-nav]');
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      links.forEach(link => link.classList.toggle('active', link.dataset.nav === id));
    });
  }, { threshold: 0.28, rootMargin: '-15% 0px -45% 0px' });
  document.querySelectorAll('#services, #lab, #method, #proof').forEach(s => navObserver.observe(s));
}

/* ---------- 6. Lab tabs -------------------------------------------------- */
const labTabs = document.querySelectorAll('.lab-tab');
labTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const targetId = tab.dataset.tab;
    labTabs.forEach(t => {
      const active = t === tab;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('.lab-panel').forEach(panel => {
      const active = panel.id === targetId;
      panel.classList.toggle('active', active);
      panel.hidden = !active;
    });
    window.dispatchEvent(new Event('dj:pulse'));
  });
});

/* ---------- 7. Magnetic buttons ------------------------------------------ */
if (!reduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('.magnetic').forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.13;
      const y = (e.clientY - r.top - r.height / 2) * 0.2;
      el.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
    });
    el.addEventListener('mouseleave', () => { el.style.translate = ''; });
  });
}

/* ---------- 8. Cursor followers ------------------------------------------ */
const dot = document.getElementById('cursor-dot');
const ring = document.getElementById('cursor-ring');
if (!reduced && dot && ring && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my;
  window.addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
  document.addEventListener('mouseover', (e) => {
    ring.classList.toggle('is-hover', Boolean(e.target.closest('a, button')));
  });
  (function follow() {
    dot.style.transform = `translate3d(${mx - 2.5}px, ${my - 2.5}px, 0)`;
    rx += (mx - rx) * 0.16;
    ry += (my - ry) * 0.16;
    ring.style.transform = `translate3d(${rx - 15}px, ${ry - 15}px, 0)`;
    requestAnimationFrame(follow);
  })();
}

/* ---------- 9. Pulse the globe when an audit is run ---------------------- */
const scanBtn = document.getElementById('start-scan-btn');
if (scanBtn) scanBtn.addEventListener('click', () => window.dispatchEvent(new Event('dj:pulse')));

/* ---------- 10. Card spotlight follows the pointer ----------------------- */
if (!reduced) {
  document.querySelectorAll('.bento-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

/* ---------- 12. Kinetic scroll typography -------------------------------- */
function initScrollText(el) {
  const words = [];
  // Rebuild content with word spans (plain text only)
  const text = el.textContent.trim().replace(/\s+/g, ' ');
  const frag = document.createDocumentFragment();
  text.split(' ').forEach(w => {
    const s = document.createElement('span');
    s.className = 'scroll-word';
    s.textContent = w;
    words.push(s);
    frag.appendChild(s);
    frag.appendChild(document.createTextNode(' '));
  });
  el.textContent = '';
  el.appendChild(frag);

  function update() {
    const r = el.getBoundingClientRect();
    const p = clamp((window.innerHeight * 0.86 - r.top) / (r.height + window.innerHeight * 0.45), 0, 1);
    words.forEach((s, i) => {
      const t = clamp(p * words.length - i, 0, 1);
      s.style.setProperty('--fill', (t * 100).toFixed(1) + '%');
    });
  }
  window.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
}
document.querySelectorAll('.scroll-text').forEach(initScrollText);

/* ---------- 13. Section rail --------------------------------------------- */
const dotLinks = document.querySelectorAll('.section-dots a[data-dot]');
if (dotLinks.length) {
  const sections = [...dotLinks].map(a => document.getElementById(a.dataset.dot)).filter(Boolean);
  function updateDots() {
    let activeId = sections[0]?.id;
    sections.forEach(s => {
      const r = s.getBoundingClientRect();
      if (r.top <= window.innerHeight * 0.42 && r.bottom > 0) activeId = s.id;
    });
    dotLinks.forEach(a => a.classList.toggle('active', a.dataset.dot === activeId));
  }
  window.addEventListener('scroll', () => requestAnimationFrame(updateDots), { passive: true });
  updateDots();
}

/* ---------- 14. Card tilt ------------------------------------------------- */
if (!reduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('.bento-card, .proof-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const rx = ((e.clientY - r.top) / r.height - 0.5) * -6;
      const ry = ((e.clientX - r.left) / r.width - 0.5) * 6;
      card.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}

/* ---------- 15. Graceful fallback if the WebGL module can't load --------- */
const stage = document.getElementById('stage');
if (stage) {
  window.setTimeout(() => {
    if (!stage.classList.contains('ready') && !document.body.classList.contains('no-webgl')) {
      document.body.classList.add('no-webgl');
    }
  }, 6000);
}
