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

/* Progressive enhancement: one active surface, no changes to link or tab behavior. */
(() => {
 if (window.__jiyouSiteGlow) return;
 window.__jiyouSiteGlow = true;
 const groups = [
  ['.product-card', 'product'],
  ['.support-guide summary', 'row'],
  ['.catalog-assist', 'large'],
  ['[data-field-tab],.sense-explorer button[data-sense]', 'tab'],
  ['[data-field-point]', 'pin'],
  ['.field-product-link', 'row'],
  ['.header-cta,.header-portal,.contact-cover__actions .button', 'button']
 ];
 const colors = {eyes:'91,141,183',sound:'173,143,86',air:'96,159,143',guard:'178,119,104',story:'145,125,171'};
 const fine = matchMedia('(hover: hover) and (pointer: fine)');
 const reduce = matchMedia('(prefers-reduced-motion: reduce)');
 let active = null, frame = 0, x = 0, y = 0;
 const clear = () => { cancelAnimationFrame(frame); frame = 0; active?.removeAttribute('data-jglow-active'); active = null; };
 const init = () => {
  groups.forEach(([selector, type]) => document.querySelectorAll(selector).forEach(el => {
   if (el.hasAttribute('data-jglow')) return;
   el.dataset.jglow = type;
   el.style.setProperty('--jg-color', colors[el.dataset.sense] || '119,163,140');
   const body = type === 'product' ? el.querySelector('.product-card__content') : el;
   if (!body) return;
   body.setAttribute('data-jglow-body','');
   const light = document.createElement('i');
   light.className = 'jg-light'; light.setAttribute('aria-hidden','true'); body.append(light);
   const edge = document.createElement('i');
   edge.className = 'jg-edge'; edge.setAttribute('aria-hidden','true'); el.append(edge);
  }));
 };
 document.addEventListener('pointermove', event => {
  const el = event.target instanceof Element ? event.target.closest('[data-jglow]') : null;
  if (!fine.matches || event.pointerType === 'touch' || !el) {clear();return;}
  if (active !== el) {clear();active = el;}
  x = event.clientX; y = event.clientY;
  if (frame) return;
  frame = requestAnimationFrame(() => {
   frame = 0;if (!active) return;
   const rect = active.getBoundingClientRect();
   active.style.setProperty('--jg-x', reduce.matches ? '50%' : `${x-rect.left}px`);
   active.style.setProperty('--jg-y', reduce.matches ? '50%' : `${y-rect.top}px`);
   if (active.dataset.jglow === 'product') {
    const body = active.querySelector('[data-jglow-body]');
    const box = body.getBoundingClientRect();
    body.style.setProperty('--jg-x', reduce.matches ? '50%' : `${x-box.left}px`);
    body.style.setProperty('--jg-y', reduce.matches ? '50%' : `${y-box.top}px`);
   }
   active.setAttribute('data-jglow-active','');
  });
 },{passive:true});
 document.addEventListener('pointerout', e => {if (!e.relatedTarget) clear();});
 document.addEventListener('astro:before-swap',clear);
 document.addEventListener('astro:page-load',init);
 window.addEventListener('blur',clear);
 window.addEventListener('scroll',clear,{passive:true});
 fine.addEventListener('change',clear);
 init();
})();
