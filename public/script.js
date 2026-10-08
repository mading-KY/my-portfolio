// ============================================
// PORTFOLIO SCRIPTS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  initLoadingScreen();
  initScrollProgress();
  initNavigation();
  initParticles();
  initSkillBars();
  initRevealAnimations();
  initContactForm();
  initBackToTop();
  initFooterYear();
  initSmoothScroll();
});

// LOADING SCREEN
function initLoadingScreen() {
  const loadingScreen = document.getElementById('loadingScreen');
  if (!loadingScreen) return;
  const hide = () => loadingScreen.classList.add('hidden');
  window.addEventListener('load', () => setTimeout(hide, 500));
  setTimeout(hide, 3000); // safety timeout
}

// SCROLL PROGRESS BAR
function initScrollProgress() {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = docHeight > 0 ? `${(window.scrollY / docHeight) * 100}%` : '0%';
  });
}

// NAVIGATION
function initNavigation() {
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const links = navLinks.querySelectorAll('a');

  const closeMenu = () => {
    navToggle.classList.remove('is-open');
    navLinks.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  };

  navToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    navToggle.classList.toggle('is-open');
    const open = navLinks.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(open));
  });

  links.forEach(link => link.addEventListener('click', closeMenu));

  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) closeMenu();
  });

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {   // bottom of page
      links.forEach(l => l.classList.remove('active'));
      links[links.length - 1].classList.add('active');
    }
  });

  // Active link highlighting
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const active = navLinks.querySelector(`a[href="#${entry.target.id}"]`);
      links.forEach(l => l.classList.remove('active'));   // sections without a nav link (home, services) clear the highlight
      if (active) active.classList.add('active');
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });   // thin band near the top-middle of the screen: works for sections of any height

  document.querySelectorAll('section[id]').forEach(s => observer.observe(s));
}

// PARTICLES
function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${Math.random() * 100}%`;
    p.style.animationDelay = `${Math.random() * 8}s`;
    p.style.animationDuration = `${6 + Math.random() * 6}s`;
    container.appendChild(p);
  }
}

// SKILL BARS
function initSkillBars() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.transform = `scaleX(${parseFloat(entry.target.dataset.width) / 100})`;
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.skill-bar__fill').forEach(bar => observer.observe(bar));
}

// REVEAL ANIMATIONS
function initRevealAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// CONTACT FORM
function initContactForm() {
  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!name || !email || !message) return showFormStatus('Please fill in all fields.', 'error');
    if (!isValidEmail(email)) return showFormStatus('Please enter a valid email address.', 'error');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Something went wrong.');

      showFormStatus('Message sent successfully!', 'success');
      form.reset();
    } catch (error) {
      showFormStatus(
        error.message === 'Failed to fetch'
          ? 'Cannot reach server. Email me directly at madingmajok484@gmail.com'
          : error.message,
        'error'
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
    }
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFormStatus(message, type) {
  const status = document.getElementById('formStatus');
  status.textContent = message;
  status.className = `form-status form-status--${type}`;
  status.style.display = 'block';
  setTimeout(() => { status.style.display = 'none'; }, 5000);
}

// BACK TO TOP
function initBackToTop() {
  const button = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    button.classList.toggle('visible', window.scrollY > 500);
  });
  button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// FOOTER YEAR
function initFooterYear() {
  document.getElementById('year').textContent = new Date().getFullYear();
}

// SMOOTH SCROLL
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return; // logo link: let it jump to top
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}