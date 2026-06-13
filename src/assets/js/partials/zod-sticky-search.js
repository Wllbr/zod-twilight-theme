/* Force the ZOD header/search area to stay fixed at the top while customers scroll. */
export default function initZodStickySearch() {
  const enabled = window.zod_sticky_search_enabled !== false && window.zod_sticky_search_enabled !== 'false';
  const header = document.querySelector('#mainnav');
  const inner = document.querySelector('#mainnav .inner');
  if (!enabled || !header || !inner) return;

  let originalTop = 0;
  let headerHeight = 0;
  let ticking = false;

  const setFixedState = () => {
    const shouldFix = window.scrollY > originalTop;
    header.classList.toggle('zod-force-fixed-header', shouldFix);
    document.body.classList.toggle('zod-header-is-fixed', shouldFix);
  };

  const measure = () => {
    const wasFixed = header.classList.contains('zod-force-fixed-header');

    if (wasFixed) header.classList.remove('zod-force-fixed-header');
    headerHeight = Math.ceil(inner.getBoundingClientRect().height || inner.offsetHeight || 0);
    originalTop = header.getBoundingClientRect().top + window.scrollY;

    if (headerHeight) {
      header.style.height = `${headerHeight}px`;
      header.style.setProperty('--zod-sticky-header-height', `${headerHeight}px`);
      document.documentElement.style.setProperty('--zod-sticky-header-height', `${headerHeight}px`);
    }

    if (wasFixed) header.classList.add('zod-force-fixed-header');
    setFixedState();
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      setFixedState();
      ticking = false;
    });
  };

  document.body.classList.add('zod-sticky-search-ready');
  measure();
  onScroll();

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('load', () => window.setTimeout(measure, 250), { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('orientationchange', () => window.setTimeout(measure, 250), { passive: true });

  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(measure);
    observer.observe(inner);
  } else if ('MutationObserver' in window) {
    const observer = new MutationObserver(measure);
    observer.observe(inner, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
  }

  document.addEventListener('theme::ready', measure, { once: true });
  window.setTimeout(measure, 700);
  window.setTimeout(measure, 1800);
}
