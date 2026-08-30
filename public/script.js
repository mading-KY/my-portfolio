// ============================================
// PORTFOLIO SCRIPTS — Comprehensive
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all components
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
  initTypingEffect();
});

// ============================================
// LOADING SCREEN
// ============================================
function initLoadingScreen() {
  const loadingScreen = document.getElementById('loadingScreen');
  
  // Hide after page loads
  window.addEventListener('load', () => {
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
    }, 500);
  });
  
  // Safety timeout
  setTimeout(() => {
    loadingScreen.classList.add('hidden');
  }, 3000);
}

// ============================================
// SCROLL PROGRESS BAR
// ============================================
function initScrollProgress() {
  const progressBar = document.getElementById('scrollProgress');
  
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (scrollTop / docHeight) * 100;
    progressBar.style.width = `${progress}%`;
  });
}

// ============================================
// NAVIGATION
// ============================================
function initNavigation() {
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const links = navLinks.querySelectorAll('a');
  
  // Toggle mobile menu
  navToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    navToggle.classList.toggle('is-open');
    navLinks.classList.toggle('is-open');
  });
  
  // Close mobile menu on link click
  links.forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('is-open');
      navLinks.classList.remove('is-open');
    });
  });
  
  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && navLinks.classList.contains('is-open')) {
      navToggle.classList.remove('is-open');
      navLinks.classList.remove('is-open');
    }
  });
  
  // Nav background on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });
  
  // Active link highlighting
  const sections = document.querySelectorAll('section[id]');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const activeLink = navLinks.querySelector(`a[href="#${entry.target.id}"]`);
        if (activeLink) {
          links.forEach(link => link.classList.remove('active'));
          activeLink.classList.add('active');
        }
      }
    });
  }, { threshold: 0.5 });
  
  sections.forEach(section => observer.observe(section));
}

// ============================================
// PARTICLES BACKGROUND
// ============================================
function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  
  const particleCount = 20;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.animationDelay = `${Math.random() * 8}s`;
    particle.style.animationDuration = `${6 + Math.random() * 6}s`;
    
    container.appendChild(particle);
  }
}

// ============================================
// SKILL BARS ANIMATION
// ============================================
function initSkillBars() {
  const skillBars = document.querySelectorAll('.skill-bar__fill');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('skill-bar__fill--animated');
        entry.target.style.transform = `scaleX(${entry.target.dataset.width})`;
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  
  skillBars.forEach(bar => observer.observe(bar));
}

// ============================================
// REVEAL ANIMATIONS
// ============================================
function initRevealAnimations() {
  const revealElements = document.querySelectorAll('.reveal');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  
  revealElements.forEach(el => observer.observe(el));
}

// ============================================
// CONTACT FORM
// ============================================
function initContactForm() {
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  const submitBtn = document.getElementById('submitBtn');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();
    
    // Validation
    if (!name || !email || !message) {
      showFormStatus('Please fill in all fields.', 'error');
      return;
    }
    
    if (!isValidEmail(email)) {
      showFormStatus('Please enter a valid email address.', 'error');
      return;
    }
    
    // Submit
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, message }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }
      
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
  
  setTimeout(() => {
    status.style.display = 'none';
  }, 5000);
}

// ============================================
// BACK TO TOP BUTTON
// ============================================
function initBackToTop() {
  const button = document.getElementById('backToTop');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
      button.classList.add('visible');
    } else {
      button.classList.remove('visible');
    }
  });
  
  button.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  });
}

// ============================================
// FOOTER YEAR
// ============================================
function initFooterYear() {
  document.getElementById('year').textContent = new Date().getFullYear();
}

// ============================================
// SMOOTH SCROLL
// ============================================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    });
  });
}

// ============================================
// TYPING EFFECT
// ============================================
function initTypingEffect() {
  const terminal = document.querySelector('.terminal__body');
  if (!terminal) return;
  
  const cursor = document.querySelector('.terminal__cursor');
  if (cursor) {
    setInterval(() => {
      cursor.style.opacity = cursor.style.opacity === '0' ? '1' : '0';
    }, 500);
  }
}