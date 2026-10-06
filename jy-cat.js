/* MOVING 카테고리 페이지 세부 다듬기 (2026-10-06). 짝: jy-cat.css. 메인(jy-home.js) 방식을 그대로 본뜸.
   대상: /solutions(허브), /solutions/eyes·sound·air·guard·story
   - 섹션 제목 낱말 등장, 머리말·설명 따라 오르기, 제목 속 'N개' 숫자 세기
   - 첫 화면: 제목 → 버튼 차례 등장, 스크롤하면 글 묶음이 물러나며 옅어지고 배경(그림)이 어두워짐
   - 허브: 분야 펼침 묶음 안착
   - 글자 다듬기: '모든것을' → '모든 것을', 제목 끝 낱말 하나만 다음 줄로 떨어지지 않게
   움직임 줄이기 설정이면 등장·숫자·시차는 켜지 않는다(글자는 처음부터 보임). */
(() => {
  const d = document, root = d.documentElement, q = s => d.querySelector(s);
  const hub = d.getElementById('solutions-edition');
  const cat = q('#solution-edition .solution-hero--axis');
  if (!hub && !cat) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phone = matchMedia('(max-width: 767px)').matches;

  /* 글자 다듬기 ① 띄어쓰기: '모든것을' → '모든 것을'(의존명사 '것'은 띄어 씀). 제목 읽기 이름도 같이 고침 */
  const title = d.getElementById('solution-title');
  if (title) {
    const w = d.createTreeWalker(title, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode());) if (n.data.includes('모든것을')) n.data = n.data.replace('모든것을', '모든 것을');
    const al = title.getAttribute('aria-label');
    if (al && al.includes('모든것을')) title.setAttribute('aria-label', al.replace('모든것을', '모든 것을'));
  }

  /* 글자 다듬기 ② 줄바꿈 자리만 바꿈(글자는 그대로): 낱말 둘을 한 덩어리로 묶어 그 사이에서 줄이 안 나뉘게 함.
     '것·수·데·줄'(의존명사)은 앞 낱말과 묶고, 첫 화면 제목 첫 줄은 끝 두 낱말을 묶어 끝 낱말 하나만 떨어지지 않게 */
  const bindWords = (node, tail) => {
    if (!node || node.nodeType !== 3) return;
    const ws = [...node.data.matchAll(/\S+/g)];
    if (ws.length < 3 && tail) return;
    let k = ws.findIndex((m, i) => i > 0 && /^(것|수|데|줄)(?![가-힣]{2})/.test(m[0]));
    if (k < 0) { if (!tail) return; k = ws.length - 1; }
    const a = ws[k - 1].index, b = ws[k].index + ws[k][0].length;
    const mid = node.splitText(a); mid.splitText(b - a);
    const s = d.createElement('span'); s.className = 'jc-nw'; s.textContent = mid.data; mid.replaceWith(s);
  };
  if (cat && title && title.firstChild) bindWords(title.firstChild, true);
  d.querySelectorAll('.solution-fold__statement > p').forEach(p => bindWords(p.firstChild, false));

  /* '전체 보기 →'의 화살표만 감싸 마우스를 올리면 밀리게 함(글자·간격은 그대로).
     링크가 flex 라 화살표를 따로 두면 사이가 벌어지므로, 글 전체를 한 덩어리로 감싼 안에 화살표를 둔다 */
  d.querySelectorAll('.solution-fold .all-products').forEach(a => {
    const t = a.lastChild;
    if (a.childNodes.length !== 1 || !t || t.nodeType !== 3 || !/→\s*$/.test(t.data)) return;
    const wrap = d.createElement('span'); a.prepend(wrap); wrap.append(t);
    const arr = t.splitText(t.data.lastIndexOf('→')); arr.splitText(1);
    const s = d.createElement('span'); s.className = 'jc-arr'; s.textContent = '→'; arr.replaceWith(s);
  });

  if (still) return;

  /* 낱말 나누기: 글자 노드만 낱말 span 으로 감싼다(강조 span 같은 안쪽 요소는 그대로 두고 그 안의 글자도 감쌈) */
  const split = h => {
    let i = 0;
    const walk = n => {
      for (const c of [...n.childNodes]) {
        if (c.nodeType === 1) { if (c.tagName !== 'BR') walk(c); continue; }
        if (c.nodeType !== 3 || !c.data.trim()) continue;
        const f = d.createDocumentFragment();
        for (const part of c.data.split(/(\s+)/)) {
          if (!part) continue;
          if (/^\s+$/.test(part)) { f.append(part); continue; }
          const s = d.createElement('span'); s.className = 'jc-w'; s.style.setProperty('--i', i++); s.textContent = part; f.append(s);
        }
        c.replaceWith(f);
      }
    };
    walk(h); return i;
  };

  /* 쪽마다 맡을 제목: 머리말(있으면) → 제목 낱말 → 설명·버튼 순서 */
  const plan = [];
  if (cat) {
    const prob = q('#category-problem-title'), prod = q('#product-title');
    if (prob) plan.push({ h: prob, own: prob.closest('[data-reveal-managed]'), follow: [prob.nextElementSibling] });
    if (prod) plan.push({ h: prod, follow: [prod.nextElementSibling] });
  }
  if (hub) {
    const ax = q('#solution-axes-title');
    if (ax) plan.push({ h: ax, label: ax.closest('header') && ax.closest('header').querySelector('.hub-label'), follow: [ax.nextElementSibling] });
    const fit = q('.solution-fit h2');
    if (fit) { const col = fit.parentElement.nextElementSibling; plan.push({ h: fit, label: fit.previousElementSibling, follow: col ? [...col.children] : [] }); }
  }

  const groups = [];
  for (const g of plan) {
    const n = split(g.h), base = 90;
    g.h.style.setProperty('--jc-d', base + 'ms');
    if (g.own) g.own.setAttribute('data-jc-own', '');
    const items = [g.h];
    const up = (e, t) => { e.classList.add('jc-up'); e.style.setProperty('--jc-d', t + 'ms'); items.push(e); };
    if (g.label && g.label.classList.contains('hub-label')) up(g.label, 0);
    let t = base + n * 45 + 220;
    for (const e of g.follow) if (e) { up(e, t); t += 90; }
    groups.push({ h: g.h, items });
  }

  /* jc-init: 이미 화면에 그려진 글(설명·머리말·묶음)이 숨김 상태로 '사라지는 전환'을 돌지 않게, 처음 한 번은 전환 없이 숨김.
     아래 설정이 다 끝난 뒤 한 번 계산시키고 다음 장면에서 걷는다 */
  root.classList.add('jc-on', 'jc-init');

  /* 제목 속 숫자('8개'의 8): 마지막 수의 폭을 먼저 재어 고정한 뒤 0 → 원래 수로 셈 */
  const cnt = q('#product-title .solution-products__count');
  if (cnt) {
    const w = d.createTreeWalker(cnt, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode());) {
      const m = n.data.match(/\d+/); if (!m) continue;
      const tail = n.splitText(m.index); tail.splitText(m[0].length);
      const s = d.createElement('span'); s.className = 'jc-num'; s.textContent = m[0]; tail.replaceWith(s);
      s.style.minWidth = s.getBoundingClientRect().width.toFixed(2) + 'px';
      const g = groups.find(x => x.h === q('#product-title'));
      if (g) { g.count = { s, to: +m[0], h: g.h, label: g.h.textContent.replace(/\s+/g, ' ').trim() }; s.textContent = '0'; }
      break;
    }
  }
  const count = c => {
    /* 글꼴이 다 내려온 지금 마지막 수의 폭을 다시 재어 고정(세는 동안 줄이 흔들리지 않게) */
    c.s.style.minWidth = ''; c.s.textContent = c.to;
    c.s.style.minWidth = c.s.getBoundingClientRect().width.toFixed(2) + 'px'; c.s.textContent = '0';
    c.h.setAttribute('aria-label', c.label);
    const t0 = performance.now() + 250, dur = 1200;
    const tick = now => {
      const p = Math.max(0, Math.min(1, (now - t0) / dur));
      c.s.textContent = Math.round(c.to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick); else c.h.removeAttribute('aria-label');
    };
    requestAnimationFrame(tick);
  };

  /* 제목이 화면에 들어오면 묶음 전체를 차례로 올림. 아직 화면 아래에 있는 설명·버튼(휴대폰에서 세로로 쌓인 것)은 그것이 들어올 때 올림 */
  const late = new Set();
  const reveal = (g, instant) => {
    for (const e of g.items) {
      if (instant) { e.classList.add('jc-instant', 'is-jc-in'); continue; }
      if (e === g.h || e.getBoundingClientRect().top < innerHeight * .94) e.classList.add('is-jc-in');
      else { e.style.setProperty('--jc-d', '60ms'); late.add(e); io.observe(e); }
    }
    if (g.count) { if (instant) g.count.s.textContent = g.count.to; else count(g.count); }
  };
  const io = new IntersectionObserver(es => {
    for (const en of es) {
      const el = en.target, past = !en.isIntersecting && en.boundingClientRect.bottom < 0;
      if (!en.isIntersecting && !past) continue;
      io.unobserve(el);
      const g = groups.find(x => x.h === el);
      if (g) { reveal(g, past); continue; }
      if (late.delete(el)) el.classList.add(...(past ? ['jc-instant', 'is-jc-in'] : ['is-jc-in']));
    }
  }, { rootMargin: phone ? '0px 0px -8% 0px' : '0px 0px -14% 0px' });
  /* 이미 그려진 화면 안에 있던 제목(태블릿·새로고침 자리)은 숨겼다 다시 보이는 깜빡임 대신 바로 보임 — 기존 등장 장치와 같은 규칙 */
  const painted = performance.getEntriesByType('paint').length > 0;
  const inView = e => { const r = e.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };
  groups.forEach(g => { if (painted && inView(g.h)) reveal(g, true); else io.observe(g.h); });

  /* 큰 덩어리 안착: 허브의 분야 펼침 묶음(카테고리 제품 카드는 기존 카드별 등장이 있어 손대지 않음) */
  const settle = [...d.querySelectorAll('#solutions-edition .solution-folds')];
  settle.forEach(e => e.classList.add('jc-settle'));
  const io2 = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('is-jc-in'); io2.unobserve(en.target); }
    else if (en.boundingClientRect.bottom < 0) { en.target.classList.add('jc-instant', 'is-jc-in'); io2.unobserve(en.target); }
  }), { rootMargin: '0px 0px -10% 0px' });
  settle.forEach(e => { if (painted && inView(e)) e.classList.add('jc-instant', 'is-jc-in'); else io2.observe(e); });
  void root.offsetWidth;
  requestAnimationFrame(() => root.classList.remove('jc-init'));

  /* 첫 화면 등장이 끝나면 애니메이션을 걷음(스크롤 물러남 값이 먹도록). 스크립트가 늦게 와서 이미 끝났으면 바로 걷음 */
  d.querySelectorAll('.solution-hero--axis #solution-title, .solution-hero--axis .solution-hero__content > .button, .solutions-cover__copy > *').forEach(e => {
    const running = e.getAnimations ? e.getAnimations().some(a => a.animationName === 'jc-rise' && a.playState !== 'finished') : false;
    if (!running) { e.classList.add('jc-done'); return; }
    e.addEventListener('animationend', ev => { if (ev.target === e && ev.animationName === 'jc-rise') e.classList.add('jc-done'); });
  });

  /* 첫 화면 빠져나가기: 글 묶음은 스크롤보다 느리게 내려앉으며 옅어지고 조금 작아짐(그림과 겹치기 전까지만 밀림).
     배경은 어두워짐 — 허브는 어두운 첫 화면 전체에 검은 막(최대 60%), 카테고리는 밝은 바탕이라 그림만 살짝 어둡게. */
  const hero = hub ? q('.solutions-cover') : cat;
  if (!hero) return;
  const layers = hub ? [q('.solutions-cover__copy')].filter(Boolean)
    : [title, q('.solution-hero--axis .solution-hero__content > .button')].filter(Boolean);
  const figure = hub ? q('.solutions-cover__visual') : q('.solution-hero__figure');
  const media = hub ? null : q('.solution-hero__media');
  const img = hub ? q('.solutions-cover__visual img') : media && media.querySelector('img');
  let dim = null;
  if (hub) { dim = d.createElement('div'); dim.className = 'jc-dim'; dim.setAttribute('aria-hidden', 'true'); hero.append(dim); }
  const top = e => { let y = 0; for (; e; e = e.offsetParent) y += e.offsetTop; return y; };
  let geo = null, raf = 0, out = false;
  const measure = () => {
    const textBottom = Math.max(...layers.map(l => top(l) + l.offsetHeight));
    const figTop = figure ? top(figure) : textBottom + 48;
    geo = { textBottom, gap: Math.max(0, figTop - textBottom - 6), heroTop: top(hero), heroH: hero.offsetHeight };
  };
  const paint = () => {
    raf = 0; if (!geo) measure();
    /* pt: 글 묶음 아래끝이 화면 위에 닿을 때 1, ph: 첫 화면 아래끝이 화면 위에 닿을 때 1 */
    const y = Math.max(0, scrollY);
    const pt = Math.min(1, y / Math.max(1, geo.textBottom)), ph = Math.min(1, y / Math.max(1, geo.heroTop + geo.heroH));
    if (ph >= 1) { if (out) return; out = true; } else out = false;
    const on = y > 0 && ph < 1;
    for (const l of layers) {
      l.style.translate = on ? `0 ${Math.min(y * 0.2, geo.gap).toFixed(1)}px` : '';
      l.style.opacity = on ? Math.max(0, 1 - pt * 1.15).toFixed(3) : '';
      l.style.scale = on ? (1 - pt * 0.04).toFixed(4) : '';
    }
    if (img) img.style.scale = on ? (1 + ph * (hub ? 0.05 : 0.04)).toFixed(4) : '';
    if (dim) dim.style.opacity = on ? (ph * ph * 0.6).toFixed(3) : '0';
    if (media) media.style.filter = on && ph > 0.02 ? `brightness(${(1 - ph * ph * 0.35).toFixed(3)})` : '';
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(paint); }, { passive: true });
  addEventListener('resize', () => { geo = null; out = false; if (!raf) raf = requestAnimationFrame(paint); }, { passive: true });
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(() => { geo = null; out = false; paint(); });
  paint();
})();
