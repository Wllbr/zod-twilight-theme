/* Keeps the ZOD search bar locked with the sticky header and recalculates header height after Salla components hydrate. */
export default function initZodStickySearch() {
  const enabled = window.zod_sticky_search_enabled !== false && window.zod_sticky_search_enabled !== 'false';
  const header = document.querySelector('#mainnav');
  const inner = document.querySelector('#mainnav .inner');
  if (!enabled || !header || !inner) return;

  const setHeight = () => {
    window.requestAnimationFrame(() => {
      header.style.height = `${Math.ceil(inner.getBoundingClientRect().height)}px`;
    });
  };

  document.body.classList.add('zod-sticky-search-ready');
  setHeight();
  window.addEventListener('load', setHeight, { passive: true });
  window.addEventListener('resize', setHeight, { passive: true });
  window.addEventListener('orientationchange', setHeight, { passive: true });

  const observer = new MutationObserver(setHeight);
  observer.observe(inner, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });

  document.addEventListener('theme::ready', setHeight, { once: true });
  window.setTimeout(setHeight, 700);
  window.setTimeout(setHeight, 1800);
}
