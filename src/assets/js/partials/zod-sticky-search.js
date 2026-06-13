/* Force the full ZOD header/search/categories to stay visible while customers scroll. */
export default function initZodStickySearch() {
  const enabled = window.zod_sticky_search_enabled !== false && window.zod_sticky_search_enabled !== 'false';
  const header = document.querySelector('.store-header.zod-header');
  const mainnav = document.querySelector('#mainnav');
  const inner = document.querySelector('#mainnav .inner');

  if (!enabled || !header || !mainnav || !inner || header.dataset.zodFixedHeaderReady === '1') return;
  header.dataset.zodFixedHeaderReady = '1';

  const setHeaderHeight = () => {
    header.classList.add('zod-full-fixed-header');
    mainnav.classList.add('zod-force-fixed-header');

    const headerHeight = Math.ceil(header.getBoundingClientRect().height || header.offsetHeight || inner.offsetHeight || 0);
    if (headerHeight) {
      document.documentElement.style.setProperty('--zod-fixed-full-header-height', `${headerHeight}px`);
      document.documentElement.style.setProperty('--zod-sticky-header-height', `${headerHeight}px`);
      document.body.style.setProperty('--zod-fixed-full-header-height', `${headerHeight}px`);
      document.body.classList.add('zod-header-is-fixed');
      document.body.classList.add('zod-sticky-search-ready');
    }
  };

  const run = () => window.requestAnimationFrame(setHeaderHeight);

  setHeaderHeight();
  window.addEventListener('load', () => window.setTimeout(setHeaderHeight, 250), { passive: true });
  window.addEventListener('resize', run, { passive: true });
  window.addEventListener('orientationchange', () => window.setTimeout(setHeaderHeight, 250), { passive: true });
  window.addEventListener('scroll', run, { passive: true });
  document.addEventListener('theme::ready', setHeaderHeight, { once: true });

  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(setHeaderHeight);
    observer.observe(header);
    observer.observe(inner);
  } else if ('MutationObserver' in window) {
    const observer = new MutationObserver(setHeaderHeight);
    observer.observe(header, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
  }

  window.setTimeout(setHeaderHeight, 700);
  window.setTimeout(setHeaderHeight, 1800);
}
