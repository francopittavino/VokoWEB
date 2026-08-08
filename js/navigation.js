/* ============================================
   VOKO ACCESORIOS — Navigation
   Navbar scroll effects, mobile menu, 
   scroll reveal animations
   ============================================ */

// ──────────────────────────────────────────
// NAVBAR SCROLL EFFECT
// ──────────────────────────────────────────
function initNavbarScroll() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  const handleScroll = () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Initial check
}

// ──────────────────────────────────────────
// MOBILE MENU
// ──────────────────────────────────────────
function initMobileMenu() {
  const hamburger = document.querySelector('.navbar__hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('open');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close on link click
  mobileMenu.querySelectorAll('.mobile-menu__link').forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

// ──────────────────────────────────────────
// ACTIVE LINK HIGHLIGHT
// ──────────────────────────────────────────
function initActiveLinks() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.navbar__link, .mobile-menu__link');

  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;

    // Normalize paths for comparison
    const linkPath = href.replace(/^\.\//, '/').replace(/index\.html$/, '');
    const pagePath = currentPath.replace(/index\.html$/, '');

    if (
      linkPath === pagePath ||
      (linkPath === '/' && pagePath === '/') ||
      (linkPath !== '/' && pagePath.startsWith(linkPath))
    ) {
      link.classList.add('active');
    }
  });
}

// ──────────────────────────────────────────
// SCROLL REVEAL ANIMATION
// ──────────────────────────────────────────
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    }
  );

  reveals.forEach((el) => observer.observe(el));
}

// ──────────────────────────────────────────
// SMOOTH SCROLL TO SECTION
// ──────────────────────────────────────────
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const navHeight = document.querySelector('.navbar')?.offsetHeight || 64;
        const targetPosition = target.offsetTop - navHeight - 16;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        });
      }
    });
  });
}

// ──────────────────────────────────────────
// AÑO ACTUAL EN EL FOOTER
// ──────────────────────────────────────────
function initCurrentYear() {
  const year = String(new Date().getFullYear());
  document.querySelectorAll('[data-current-year]').forEach((el) => {
    el.textContent = year;
  });
}

// ──────────────────────────────────────────
// INITIALIZE
// ──────────────────────────────────────────
export function initNavigation() {
  initNavbarScroll();
  initMobileMenu();
  initActiveLinks();
  initScrollReveal();
  initSmoothScroll();
  initCurrentYear();
}

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNavigation);
} else {
  initNavigation();
}
