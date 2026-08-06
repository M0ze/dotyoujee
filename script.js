/* ================================================================
   NexUpTech 3D Interactive Controller
   Mouse tracking, parallax, and depth effects at 60fps
   ================================================================ */

const WHATSAPP_NUMBER = '256764625700';
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = /iPhone|iPad|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const hasLowPerformance = navigator.deviceMemory && navigator.deviceMemory <= 4;
const enable3DEffects = !prefersReducedMotion && !isMobile && !hasLowPerformance;

/* ================================================================
   Dark mode toggle — persisted in localStorage
   ================================================================ */
function setupThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;

  const currentTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';

  themeToggle.addEventListener('click', () => {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
  });
}

/* ================================================================
   3D tilt mouse tracking — only animates while active
   ================================================================ */
class Tilt3D {
  constructor(element) {
    this.element = element;
    this.isTouching = false;
    this.isActive = false;
    this.rafId = null;

    this.rotateX = 0;
    this.rotateY = 0;
    this.targetRotateX = 0;
    this.targetRotateY = 0;
    this.rotationSmoothing = 0.1;

    this.element.addEventListener('mouseenter', () => this.onMouseEnter());
    this.element.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.element.addEventListener('mouseleave', () => this.onMouseLeave());
    this.element.addEventListener('touchstart', () => { this.isTouching = true; });
    this.element.addEventListener('touchend', () => { this.isTouching = false; });
  }

  onMouseMove(event) {
    if (this.isTouching) return;

    const rect = this.element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const offsetX = (event.clientX - centerX) / (rect.width / 2);
    const offsetY = (event.clientY - centerY) / (rect.height / 2);

    this.targetRotateY = offsetX * 15;
    this.targetRotateX = -offsetY * 15;
  }

  onMouseEnter() {
    this.isActive = true;
    this.element.style.transformStyle = 'preserve-3d';
    this.startAnimation();
  }

  onMouseLeave() {
    this.targetRotateX = 0;
    this.targetRotateY = 0;
  }

  startAnimation() {
    if (this.rafId) return;

    const animate = () => {
      this.rotateX += (this.targetRotateX - this.rotateX) * this.rotationSmoothing;
      this.rotateY += (this.targetRotateY - this.rotateY) * this.rotationSmoothing;

      this.element.style.transform = `
        perspective(1000px)
        rotateX(${this.rotateX}deg)
        rotateY(${this.rotateY}deg)
        translateZ(15px)
      `;

      const settled =
        Math.abs(this.targetRotateX - this.rotateX) < 0.01 &&
        Math.abs(this.targetRotateY - this.rotateY) < 0.01;

      if (this.isActive || !settled) {
        this.rafId = requestAnimationFrame(animate);
      } else {
        this.rafId = null;
        this.element.style.transform = '';
      }
    };

    this.rafId = requestAnimationFrame(animate);
  }

  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

/* ================================================================
   Parallax scroll — RAF-throttled for performance
   ================================================================ */
class ParallaxController {
  constructor() {
    this.scrollY = 0;
    this.ticking = false;
    this.orbs = document.querySelectorAll('.bg-orb');
    this.demoPages = document.querySelectorAll('.demo-page');

    window.addEventListener('scroll', () => this.onScroll(), { passive: true });
    this.setupIntersectionObserver();
  }

  onScroll() {
    this.scrollY = window.scrollY;
    if (!this.ticking) {
      this.ticking = true;
      requestAnimationFrame(() => {
        this.updateParallax();
        this.ticking = false;
      });
    }
  }

  updateParallax() {
    this.orbs.forEach((orb, index) => {
      const speed = 0.3 + index * 0.15;
      const offset = this.scrollY * speed;
      orb.style.transform = `translateY(${offset}px) translateZ(${index * 20}px)`;
    });
  }

  setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) {
      this.demoPages.forEach((page) => page.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.2 }
    );

    this.demoPages.forEach((page) => observer.observe(page));
  }
}

/* ================================================================
   Smooth scroll for anchor links
   ================================================================ */
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      if (history.pushState) {
        history.pushState(null, '', targetId);
      }
    });
  });
}

/* ================================================================
   Contact form — opens WhatsApp with pre-filled message
   ================================================================ */
function setupContactForm() {
  const contactForm = document.getElementById('contactForm');
  if (!contactForm) return;

  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const service = document.getElementById('service')?.value || 'General inquiry';
    const message = document.getElementById('message').value.trim();

    if (!name || !email || !message) {
      alert('Please fill in all required fields.');
      return;
    }

    const whatsappText = `Hi NexUpTech,

I'm ${name} (${email}).

Service interest: ${service}

${message}

Looking forward to your response.`;

    const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`;

    window.open(whatsappLink, '_blank', 'noopener,noreferrer');
    contactForm.reset();
  });
}

/* ================================================================
   Floating WhatsApp button
   ================================================================ */
function setupWhatsAppButton() {
  const btn = document.getElementById('whatsapp-float');
  if (!btn) return;

  const defaultMessage = encodeURIComponent(
    "Hi, I'm interested in the NISF 2026 Compliance Pack for my business."
  );
  btn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${defaultMessage}`;
  btn.setAttribute('target', '_blank');
  btn.setAttribute('rel', 'noopener noreferrer');
}

/* ================================================================
   Mobile nav toggle
   ================================================================ */
function setupMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  if (!toggle || !navLinks) return;

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ================================================================
   Apply mobile / reduced-motion optimizations
   ================================================================ */
function applyPerformanceOptimizations() {
  if (!enable3DEffects) {
    document.querySelectorAll('.bg-orb').forEach((orb) => {
      orb.style.filter = 'blur(60px)';
      orb.style.opacity = '0.05';
    });
  }
}

/* ================================================================
   Initialization
   ================================================================ */
function init() {
  setupThemeToggle();
  applyPerformanceOptimizations();

  if (enable3DEffects) {
    new ParallaxController();
    document.querySelectorAll('[data-tilt]').forEach((el) => new Tilt3D(el));
  } else {
    document.querySelectorAll('.demo-page').forEach((page) => page.classList.add('visible'));
  }

  setupSmoothScroll();
  setupContactForm();
  setupWhatsAppButton();
  setupMobileNav();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
