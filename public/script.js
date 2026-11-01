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
  initHeroImage();
  initProfile();
});

const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

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
// Each message gets one submissionId. If the server is slow and you press Send again with the
// SAME text, the same id is sent, so the server recognises it and never delivers it twice.
function initContactForm() {
  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  if (!form) return;
  const LIMITS = { name: 100, email: 254, message: 2000 };
  const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  let attempt = { key: '', id: '' };
  let sending = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending) return;                                            // ignore double clicks

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();
    const website = document.getElementById('website')?.value || '';   // honeypot: only bots fill it

    if (!name || !email || !message) return showFormStatus('Please fill in all fields.', 'error');
    if (!isValidEmail(email)) return showFormStatus('Please enter a valid email address.', 'error');
    if (name.length > LIMITS.name || email.length > LIMITS.email || message.length > LIMITS.message)
      return showFormStatus('Your message is too long. Please shorten it a little.', 'error');
    if (website) { form.reset(); return showFormStatus('Message sent successfully!', 'success'); }   // pretend success, send nothing

    const key = [name, email.toLowerCase(), message].join('\u0000');
    if (attempt.key !== key) attempt = { key, id: newId() };       // new text => new id; same text => same id

    sending = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    const slow = setTimeout(() => showFormStatus('Still sending — the server may need a few seconds to wake up. Please wait.', 'info', true), 6000);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 45000);            // free hosting can take ~30–40 s to wake up

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name, email, message, website, submissionId: attempt.id }),
        signal: ctrl.signal,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');

      showFormStatus('Message sent successfully!', 'success');
      form.reset();
      attempt = { key: '', id: '' };
    } catch (error) {
      const again = 'Press Send again — the same message is never delivered twice.';
      showFormStatus(
        error.name === 'AbortError' ? `The server is taking longer than expected. ${again}`
          : error instanceof TypeError ? `Cannot reach the server. Check your connection and try again — or email me at madingmajok484@gmail.com. ${again}`
          : error.message,
        'error'
      );
    } finally {
      clearTimeout(slow); clearTimeout(timer);
      sending = false;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
    }
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

let statusTimer;
function showFormStatus(message, type, sticky = false) {
  const status = document.getElementById('formStatus');
  clearTimeout(statusTimer);
  status.textContent = message;
  status.className = `form-status form-status--${type}`;
  status.style.display = 'block';
  if (!sticky) statusTimer = setTimeout(() => { status.style.display = 'none'; }, 7000);
}

// BACK TO TOP
function initBackToTop() {
  const button = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    button.classList.toggle('visible', window.scrollY > 500);
  });
  button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' }));
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
        target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
      }
    });
  });
}

// HERO PHOTO: if the image is missing, hide it and let the gradient ring show
function initHeroImage() {
  const img = document.querySelector('.hero__image');
  if (!img) return;
  img.addEventListener('error', () => { img.style.display = 'none'; });
  img.addEventListener('load', () => { img.style.display = ''; });
  if (img.complete && img.naturalWidth === 0) img.style.display = 'none';
}

// PROFILE (optional): fills the hero from /api/profile when the server provides it.
// Uses textContent only (never innerHTML) and validates every value, so the API cannot inject markup.
async function initProfile() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const res = await fetch('/api/profile', { headers: { Accept: 'application/json' }, signal: ctrl.signal });
    if (!res.ok || !(res.headers.get('content-type') || '').includes('application/json')) return;
    const p = await res.json();
    const str = (v, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

    const name = str(p.name, 80), role = str(p.role, 120), bio = str(p.bio, 600), photo = str(p.photo, 300);
    const title = document.querySelector('.hero__title');
    if (title && name) {
      const [first, ...rest] = name.split(/\s+/);
      title.textContent = first + ' ';
      if (rest.length) {
        const span = document.createElement('span');
        span.className = 'highlight';
        span.textContent = rest.join(' ');
        title.appendChild(span);
      }
    }
    const roleEl = document.querySelector('.hero__role em');
    if (roleEl && role) roleEl.textContent = role;
    const bioEl = document.querySelector('.hero__description');
    if (bioEl && bio) bioEl.textContent = bio;
    const img = document.querySelector('.hero__image');
    if (img && photo && (/^\/(?!\/)/.test(photo) || /^https:\/\//i.test(photo))) img.src = photo;   // same-site path or https only
  } catch { /* keep the static content */ } finally { clearTimeout(timer); }
}