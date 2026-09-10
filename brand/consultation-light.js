/* Shared by the home and product pages, including Astro client navigation. */
(() => {
  if (window.__jiyouConsultationLight) return;
  window.__jiyouConsultationLight = true;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let active = null;
  let frame = 0;
  let x = 0;
  let y = 0;
  const clear = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    active?.removeAttribute('data-light-active');
    active = null;
  };
  document.addEventListener('pointermove', event => {
    const card = event.target instanceof Element
      ? event.target.closest('.next-step.next-step--card[data-spotlight]') : null;
    if (!fine.matches || event.pointerType === 'touch' || !card) { clear(); return; }
    if (active !== card) { clear(); active = card; }
    x = event.clientX;
    y = event.clientY;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!active) return;
      const rect = active.getBoundingClientRect();
      active.style.setProperty('--light-x', reduced.matches ? '50%' : `${x - rect.left}px`);
      active.style.setProperty('--light-y', reduced.matches ? '50%' : `${y - rect.top}px`);
      active.setAttribute('data-light-active', '');
    });
  }, { passive: true });
  document.addEventListener('pointerout', event => { if (!event.relatedTarget) clear(); });
  window.addEventListener('blur', clear);
  window.addEventListener('scroll', clear, { passive: true });
  document.addEventListener('astro:before-swap', clear);
})();
