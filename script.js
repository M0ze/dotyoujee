/* ==========================================================================
   dotyoujee — Enterprise Cybersecurity Client Experience Engine
   - Particle Constellation Cyber Canvas
   - Theme Toggle (Dark / Light)
   - Interactive Live Security Scan Simulator
   - NISF 2026 & DPPA Compliance Readiness Calculator
   - Pricing & Multi-Currency Configurator (UGX / USD)
   - Service & Resource Category Filters + Live Search
   - Threat Telemetry Feed & Incident Reporter
   - Accordion FAQ & WhatsApp Lead Routing
   ========================================================================== */

const WHATSAPP_PHONE = '256764625700';
const EXCHANGE_RATE_USD = 3700; // 1 USD = 3,700 UGX

// Utilities
function formatUGX(num) {
  return 'UGX ' + num.toLocaleString('en-US');
}

function formatUSD(num) {
  return '$' + Math.round(num).toLocaleString('en-US');
}

/* ==========================================================================
   1. Cyber Canvas: High-Tech Interactive Network Constellation
   ========================================================================== */
function initCyberCanvas() {
  const canvas = document.getElementById('cyber-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  const particleCount = window.innerWidth < 768 ? 35 : 75;
  const maxDistance = 140;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.45;
      this.vy = (Math.random() - 0.5) * 0.45;
      this.radius = Math.random() * 1.8 + 1;
      this.color = Math.random() > 0.4 ? 'rgba(0, 240, 255, ' : 'rgba(59, 130, 246, ';
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color + '0.7)';
      ctx.fill();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  let animationFrameId;
  function animate() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();

      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDistance) {
          const alpha = (1 - dist / maxDistance) * 0.18;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }
    animationFrameId = requestAnimationFrame(animate);
  }

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReduced) {
    animate();
  }
}

/* ==========================================================================
   2. Theme Switcher (Dark Obsidian / Crisp Slate)
   ========================================================================== */
function initTheme() {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;

  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(toggleBtn, savedTheme);

  toggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(toggleBtn, newTheme);
  });
}

function updateThemeIcon(btn, theme) {
  btn.innerHTML = theme === 'dark' 
    ? '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>' 
    : '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>';
  btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
}

/* ==========================================================================
   3. Mobile Navigation Drawer
   ========================================================================== */
function initMobileNav() {
  const toggle = document.getElementById('mobile-toggle');
  const menu = document.getElementById('nav-menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.innerHTML = isOpen 
      ? '<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>'
      : '<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>';
  });

  menu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = '<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>';
    });
  });
}

/* ==========================================================================
   4. Interactive Security Scan Simulator
   ========================================================================== */
function initSecurityScanner() {
  const scanBtn = document.getElementById('start-scan-btn');
  const urlInput = document.getElementById('scan-target-url');
  const progressBar = document.getElementById('scan-progress-bar');
  const progressFill = document.getElementById('scan-progress-fill');
  const resultsPanel = document.getElementById('scan-results-panel');
  const terminalLogs = document.getElementById('scan-terminal-logs');
  const whatsappReportBtn = document.getElementById('whatsapp-report-btn');

  if (!scanBtn || !urlInput) return;

  // Preset chips
  document.querySelectorAll('.preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      urlInput.value = chip.getAttribute('data-target') || chip.textContent.trim();
    });
  });

  let isScanning = false;

  scanBtn.addEventListener('click', () => {
    if (isScanning) return;
    const target = urlInput.value.trim();
    if (!target) {
      urlInput.focus();
      return;
    }

    isScanning = true;
    scanBtn.disabled = true;
    scanBtn.textContent = 'Analyzing...';
    if (progressBar) progressBar.style.display = 'block';
    if (resultsPanel) resultsPanel.style.display = 'none';
    if (terminalLogs) terminalLogs.innerHTML = '';

    const steps = [
      { pct: 15, msg: `[DNS] Resolving A/AAAA records for ${target}... [OK: 102.134.12.8]` },
      { pct: 35, msg: `[SSL/TLS] Inspecting certificate chain, cipher suites, TLS 1.3 posture...` },
      { pct: 55, msg: `[HEADERS] Auditing HSTS, Content-Security-Policy, X-Frame-Options, CORS...` },
      { pct: 75, msg: `[PORT] Probing standard service endpoints: 80, 443, 8080, 22, 3306...` },
      { pct: 90, msg: `[COMPLIANCE] Mapping against Uganda NISF 2026 & DPPA 2019 baseline controls...` },
      { pct: 100, msg: `[COMPLETE] Audit telemetry aggregated. Vulnerability scorecard ready.` }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        const item = steps[currentStep];
        if (progressFill) progressFill.style.width = item.pct + '%';
        if (terminalLogs) {
          const line = document.createElement('div');
          line.className = 'terminal-line';
          line.innerHTML = `<span class="terminal-prompt">&gt;</span> <span>${item.msg}</span>`;
          terminalLogs.appendChild(line);
          terminalLogs.scrollTop = terminalLogs.scrollHeight;
        }
        currentStep++;
      } else {
        clearInterval(interval);
        isScanning = false;
        scanBtn.disabled = false;
        scanBtn.textContent = 'Run Security & NISF Audit';

        // Calculate simulated metrics based on target string seed
        const score = Math.floor(62 + (target.length * 3) % 28);
        const sslGrade = score > 80 ? 'A' : (score > 70 ? 'B+' : 'C');
        const openPorts = score > 75 ? '2 (80, 443)' : '4 (80, 443, 8080, 22)';
        const dppaStatus = score > 75 ? 'Passable' : 'High Risk';

        if (document.getElementById('metric-score')) {
          document.getElementById('metric-score').textContent = score + '/100';
        }
        if (document.getElementById('metric-ssl')) {
          document.getElementById('metric-ssl').textContent = sslGrade;
        }
        if (document.getElementById('metric-ports')) {
          document.getElementById('metric-ports').textContent = openPorts;
        }
        if (document.getElementById('metric-dppa')) {
          document.getElementById('metric-dppa').textContent = dppaStatus;
        }

        if (resultsPanel) resultsPanel.style.display = 'block';

        if (whatsappReportBtn) {
          const text = `Hi dotyoujee, I just simulated an audit for *${target}*.\nSecurity Score: ${score}/100\nSSL Grade: ${sslGrade}\nDPPA Risk: ${dppaStatus}\n\nI want to book the official UGX 1,000,000 Instant Security Scan & Full Remediation Roadmap.`;
          whatsappReportBtn.href = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`;
        }
      }
    }, 450);
  });
}

/* ==========================================================================
   5. Interactive Compliance Readiness Quiz (NISF 2026 & DPPA)
   ========================================================================== */
function initComplianceQuiz() {
  const container = document.getElementById('compliance-calculator');
  if (!container) return;

  const scoreEl = document.getElementById('quiz-score-val');
  const riskTagEl = document.getElementById('quiz-risk-tag');
  const recPackEl = document.getElementById('quiz-rec-pack');
  const fineRiskEl = document.getElementById('quiz-fine-exposure');
  const whatsappQuizBtn = document.getElementById('quiz-whatsapp-btn');

  function calculateScore() {
    let score = 30; // base score

    // Step 1: Sector
    const sector = container.querySelector('input[name="calc-sector"]:checked')?.value;
    if (sector === 'bank' || sector === 'gov' || sector === 'telco') score += 10;
    else score += 15;

    // Step 2: Controls implemented (checkboxes)
    const controls = container.querySelectorAll('input[name="calc-controls"]:checked');
    score += controls.length * 12;

    // Step 3: Audit deadline
    const deadline = container.querySelector('input[name="calc-deadline"]:checked')?.value;
    if (deadline === 'proactive') score += 10;
    else if (deadline === '30days') score -= 5;
    else if (deadline === 'urgent') score -= 15;

    score = Math.max(25, Math.min(96, score));

    if (scoreEl) scoreEl.textContent = score;

    let riskLevel = 'High Risk';
    let riskClass = 'risk-high';
    let pack = 'Professional Pack (Full IT Audit + NISF 2026 Roadmap)';
    let fineEstimate = 'Up to 2% annual gross turnover (DPPA 2019 Sec. 48)';

    if (score >= 75) {
      riskLevel = 'Low Risk / Audit-Ready';
      riskClass = 'risk-low';
      pack = 'Starter Pack or Periodic Verification';
      fineEstimate = 'Minimal exposure; maintain continuous evidence logs';
    } else if (score >= 50) {
      riskLevel = 'Moderate Risk';
      riskClass = 'risk-moderate';
      pack = 'Professional Pack (Gap Analysis + VAPT + DPIA)';
      fineEstimate = 'Potential regulator notices from PDPO or BoU';
    }

    if (riskTagEl) {
      riskTagEl.textContent = riskLevel;
      riskTagEl.className = 'score-risk-tag ' + riskClass;
    }
    if (recPackEl) recPackEl.textContent = pack;
    if (fineRiskEl) fineRiskEl.textContent = fineEstimate;

    if (whatsappQuizBtn) {
      const msg = `Hi dotyoujee,\nI took your Compliance Readiness Assessment:\n- Estimated Score: ${score}/100 (${riskLevel})\n- Recommended: ${pack}\n- Sector: ${sector || 'Not specified'}\n\nI would like to schedule a 30-minute consultation call with your compliance team.`;
      whatsappQuizBtn.href = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`;
    }
  }

  container.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', (e) => {
      // visual style toggle for parent label
      if (input.type === 'radio') {
        const name = input.name;
        container.querySelectorAll(`input[name="${name}"]`).forEach(r => {
          r.closest('.calc-option-label')?.classList.remove('selected');
        });
      }
      if (input.checked) {
        input.closest('.calc-option-label')?.classList.add('selected');
      } else {
        input.closest('.calc-option-label')?.classList.remove('selected');
      }
      calculateScore();
    });
  });

  calculateScore();
}

/* ==========================================================================
   6. Pricing & Currency Configurator (UGX / USD + Addons)
   ========================================================================== */
function initPricing() {
  const currencyBtns = document.querySelectorAll('.currency-btn');
  let currentCurrency = 'UGX';

  const basePrices = {
    starter: 1000000,
    professional: 3500000,
    enterprise: 10000000
  };

  function updatePricingDisplay() {
    document.querySelectorAll('[data-price-tier]').forEach(el => {
      const tier = el.getAttribute('data-price-tier');
      const base = basePrices[tier];
      if (!base) return;

      if (currentCurrency === 'UGX') {
        if (tier === 'starter') el.textContent = 'UGX 1.0M';
        else if (tier === 'professional') el.textContent = 'UGX 3.5M – 5.0M';
        else if (tier === 'enterprise') el.textContent = 'Custom (> 10M)';
      } else {
        if (tier === 'starter') el.textContent = formatUSD(base / EXCHANGE_RATE_USD);
        else if (tier === 'professional') el.textContent = '$950 – $1,350';
        else if (tier === 'enterprise') el.textContent = 'Custom (>$2,700)';
      }
    });

    const periodLabels = document.querySelectorAll('.currency-period-label');
    periodLabels.forEach(label => {
      label.textContent = currentCurrency === 'UGX' ? '/ fixed engagement' : '/ fixed project';
    });
  }

  currencyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currencyBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCurrency = btn.getAttribute('data-currency') || 'UGX';
      updatePricingDisplay();
    });
  });

  updatePricingDisplay();
}

/* ==========================================================================
   7. Filter Tabs & Live Search for Services & Resources
   ========================================================================== */
function initFiltersAndSearch() {
  // Service category tabs
  const serviceTabs = document.querySelectorAll('#services-tabs .tab-btn');
  const serviceCards = document.querySelectorAll('.service-card-item');

  if (serviceTabs.length > 0) {
    serviceTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        serviceTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const filter = tab.getAttribute('data-filter') || 'all';

        serviceCards.forEach(card => {
          if (filter === 'all' || card.getAttribute('data-category') === filter) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  // Resources search input & tags
  const resourceSearch = document.getElementById('resource-search-input');
  const resourceCards = document.querySelectorAll('.resource-item-card');
  const resourceFilterBtns = document.querySelectorAll('#resource-filters .tab-btn');

  if (resourceSearch) {
    resourceSearch.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      resourceCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(q) ? 'flex' : 'none';
      });
    });
  }

  if (resourceFilterBtns.length > 0) {
    resourceFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        resourceFilterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.getAttribute('data-category');

        resourceCards.forEach(card => {
          if (cat === 'all' || card.getAttribute('data-tag') === cat) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }
}

/* ==========================================================================
   8. Threat Telemetry & Scammer Payback Africa Dashboard Features
   ========================================================================== */
function initThreatDashboard() {
  const reportForm = document.getElementById('scam-report-form');
  if (reportForm) {
    reportForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const type = document.getElementById('scam-type')?.value;
      const target = document.getElementById('scam-target')?.value;
      const details = document.getElementById('scam-details')?.value;

      const text = `🚨 *SCAMMER PAYBACK AFRICA INCIDENT REPORT*\n- Vector: ${type}\n- Suspect Entity/Phone/URL: ${target}\n- Observations: ${details}\n\nPlease analyze and add to the regional threat intelligence feed.`;
      window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
      reportForm.reset();
      alert('Report dispatched to dotyoujee threat triage desk on WhatsApp.');
    });
  }
}

/* ==========================================================================
   9. FAQ Accordion & Form Submissions
   ========================================================================== */
function initFAQ() {
  document.querySelectorAll('.faq-question-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('active');

      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));

      if (!isOpen) {
        item.classList.add('active');
      }
    });
  });
}

function initContactForms() {
  // Main contact form
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('contact-name')?.value.trim();
      const company = document.getElementById('contact-company')?.value.trim() || 'Not specified';
      const email = document.getElementById('contact-email')?.value.trim();
      const service = document.getElementById('contact-service')?.value || 'General Security Pack';
      const timeline = document.getElementById('contact-timeline')?.value || 'Flexible';
      const message = document.getElementById('contact-message')?.value.trim();

      const text = `*dotyoujee Official Engagement Request*\n- Name: ${name}\n- Organization: ${company}\n- Email: ${email}\n- Requested Service: ${service}\n- Delivery Timeline: ${timeline}\n\n*Brief:*\n${message}`;
      window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
      contactForm.reset();
    });
  }

  // Newsletter
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = newsletterForm.querySelector('input[type="email"]');
      if (emailInput && emailInput.value) {
        const text = `Hi dotyoujee, please subscribe ${emailInput.value.trim()} to your Monthly Ugandan Cyber & Compliance Brief.`;
        window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
        emailInput.value = '';
        alert('Thank you! WhatsApp confirmation opened.');
      }
    });
  }

  // PGP Key copy
  const copyPgpBtn = document.getElementById('copy-pgp-btn');
  if (copyPgpBtn) {
    copyPgpBtn.addEventListener('click', () => {
      const keyText = document.getElementById('pgp-key-content')?.innerText;
      if (keyText) {
        navigator.clipboard.writeText(keyText).then(() => {
          copyPgpBtn.textContent = 'Copied!';
          setTimeout(() => { copyPgpBtn.textContent = 'Copy PGP Key'; }, 2000);
        });
      }
    });
  }
}

/* ==========================================================================
   Master Initialization
   ========================================================================== */
function init() {
  initCyberCanvas();
  initTheme();
  initMobileNav();
  initSecurityScanner();
  initComplianceQuiz();
  initPricing();
  initFiltersAndSearch();
  initThreatDashboard();
  initFAQ();
  initContactForms();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
