// Shared navigation behaviour: mobile hamburger + session-expired banner
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.nav-hamburger');
  const navEl = document.querySelector('nav');

  if (hamburger && navEl) {
    hamburger.addEventListener('click', () => {
      const isOpen = navEl.classList.toggle('nav-open');
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });
    document.querySelectorAll('.nav-links a').forEach((link) => {
      link.addEventListener('click', () => {
        navEl.classList.remove('nav-open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Simulate template_redirect guard messaging: /?expired=1
  const params = new URLSearchParams(window.location.search);
  const banner = document.getElementById('sessionBanner');
  if (banner && params.get('expired') === '1') {
    banner.style.display = 'block';
    document.body.classList.add('has-banner');
  }
});

/**
 * Generic "unsaved changes" confirm modal.
 * Any link with [data-guard-link] will trigger this if window.__wpdjDirty is true.
 */
(function setupUnsavedGuard() {
  window.__wpdjDirty = false;

  document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('unsavedModal');
    if (!modal) return;

    const stayBtn = document.getElementById('unsavedStay');
    const leaveBtn = document.getElementById('unsavedLeave');
    let pendingHref = null;

    document.querySelectorAll('[data-guard-link]').forEach((link) => {
      link.addEventListener('click', (e) => {
        if (window.__wpdjDirty) {
          e.preventDefault();
          pendingHref = link.getAttribute('href');
          modal.classList.add('open');
        }
      });
    });

    stayBtn?.addEventListener('click', () => {
      modal.classList.remove('open');
      pendingHref = null;
    });

    leaveBtn?.addEventListener('click', () => {
      if (pendingHref) window.location.href = pendingHref;
    });

    window.addEventListener('beforeunload', (e) => {
      if (window.__wpdjDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  });
})();

/**
 * Scroll-reveal for elements with [data-delay] (matches WPD site's
 * IntersectionObserver fade-up pattern).
 */
document.addEventListener('DOMContentLoaded', () => {
  const targets = document.querySelectorAll('.card-lift');
  if (!targets.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.delay || '0', 10);
        setTimeout(() => entry.target.classList.add('visible'), delay);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  targets.forEach((el) => observer.observe(el));
});
