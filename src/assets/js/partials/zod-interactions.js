/*
 * ZOD Store interactions for Salla Twilight.
 * Keeps the uploaded theme behavior while using safer guards and IntersectionObserver.
 */

export default function initZodInteractions() {
  const scrollRevealEnabled = window.zod_scroll_reveal !== false && window.zod_scroll_reveal !== 'false';
  const revealSelector = '.product-card, .s-product-card, custom-salla-product-card, .banner-item, .home-section, .zod-section, .zod-glass-card, .zod-promo';
  const targetElements = Array.from(document.querySelectorAll(revealSelector));

  if (scrollRevealEnabled && targetElements.length) {
    targetElements.forEach((el) => el.classList.add('scroll-reveal-item'));

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

      targetElements.forEach((el) => observer.observe(el));
    } else {
      targetElements.forEach((el) => el.classList.add('revealed'));
    }
  }

  document.querySelectorAll('.btn-primary, .s-button-primary, .add-to-cart-btn, .buy-btn, .zod-button, .zod-button--ghost').forEach((button) => {
    button.addEventListener('pointerdown', () => {
      button.style.transform = 'scale(0.965)';
      button.style.transition = 'transform 0.12s ease';
    }, { passive: true });

    ['pointerup', 'pointercancel', 'mouseleave'].forEach((eventName) => {
      button.addEventListener(eventName, () => {
        button.style.transform = '';
      }, { passive: true });
    });
  });

  document.querySelectorAll('a[href^="#category-"], a[href^="#zod-"]').forEach((link) => {
    link.addEventListener('click', function handleAnchorClick(event) {
      const targetId = this.getAttribute('href');
      const targetElement = targetId ? document.querySelector(targetId) : null;

      if (!targetElement) {
        return;
      }

      event.preventDefault();
      window.scrollTo({
        top: targetElement.getBoundingClientRect().top + window.scrollY - 90,
        behavior: 'smooth',
      });
    });
  });
}
