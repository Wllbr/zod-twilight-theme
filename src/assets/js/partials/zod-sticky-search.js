/* ZOD stable fixed + compact header. */
export default function initZodStickySearch() {
  const enabled = window.zod_sticky_search_enabled !== false && window.zod_sticky_search_enabled !== 'false';
  const compactEnabled = window.zod_compact_header_enabled !== false && window.zod_compact_header_enabled !== 'false';
  const header = document.querySelector('.store-header.zod-header');
  const mainnav = document.querySelector('#mainnav');
  if (!enabled || !header || !mainnav || header.dataset.zodStableFixedHeaderReady === '1') return;
  header.dataset.zodStableFixedHeaderReady = '1';

  const measurePart = (selector) => {
    const el = header.querySelector(selector);
    if (!el) return 0;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return 0;
    return Math.ceil(el.getBoundingClientRect().height || el.offsetHeight || 0);
  };

  const setStableHeader = () => {
    header.classList.add('zod-full-fixed-header');
    mainnav.classList.add('zod-safe-fixed-header');
    mainnav.classList.remove('zod-force-fixed-header');

    const isCompact = compactEnabled && window.scrollY > 72;
    header.classList.toggle('zod-header--compact', isCompact);
    document.body.classList.toggle('zod-header-compact-active', isCompact);

    const topbar = measurePart('.zod-header__topbar');
    const main = measurePart('.zod-header__main-inner');
    const cats = measurePart('.zod-header__category-row');
    const measured = topbar + main + cats;
    const fallback = window.innerWidth <= 768 ? 162 : 190;
    const maxSafe = window.innerWidth <= 768 ? 210 : 245;
    const safeHeight = Math.min(Math.max(measured || fallback, 86), maxSafe);

    document.documentElement.style.setProperty('--zod-safe-header-offset', `${safeHeight}px`);
    document.body.style.setProperty('--zod-safe-header-offset', `${safeHeight}px`);
    document.body.classList.add('zod-header-is-fixed', 'zod-sticky-search-ready');
  };

  const run = () => window.requestAnimationFrame(setStableHeader);

  setStableHeader();
  window.addEventListener('scroll', run, { passive: true });
  window.addEventListener('load', () => window.setTimeout(setStableHeader, 250), { passive: true });
  window.addEventListener('resize', run, { passive: true });
  window.addEventListener('orientationchange', () => window.setTimeout(setStableHeader, 250), { passive: true });
  document.addEventListener('theme::ready', setStableHeader, { once: true });

  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(run);
    observer.observe(header);
  }

  window.setTimeout(setStableHeader, 700);
  window.setTimeout(setStableHeader, 1800);
}
