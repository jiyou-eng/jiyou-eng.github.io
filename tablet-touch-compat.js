(() => {
  'use strict';
  if (window.__jiyouTabletTouchCompat) return;
  window.__jiyouTabletTouchCompat = true;

  const touchPrimary = matchMedia('(hover: none) and (pointer: coarse)');
  const style = document.createElement('style');
  style.dataset.tabletTouchCompat = '';
  style.textContent = `
    html[data-touch-primary] .desktop-nav,
    html[data-touch-primary] .header-cta,
    html[data-touch-primary] .header-portal,
    html[data-touch-primary] [data-mega-menu] {
      display: none !important;
    }
    html[data-touch-primary] .mobile-menu {
      display: block !important;
      margin-left: auto;
    }
  `;
  document.head.append(style);

  const apply = () => {
    document.documentElement.toggleAttribute('data-touch-primary', touchPrimary.matches);
  };

  apply();
  touchPrimary.addEventListener?.('change', apply);
})();
