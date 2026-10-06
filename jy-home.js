/* 메인페이지 세부 다듬기 (2026-10-06). 짝: jy-home.css
   - 섹션 제목 낱말 등장, 머리말·설명 따라 오르기, 강조 형광펜, '48종' 숫자 세기
   - 첫 화면 스크롤 시 빠져나가는 느낌, 휴대폰 제목 줄바꿈, 버튼 누름 반응, 상담 카드 전화 버튼
   움직임 줄이기 설정이면 등장·숫자·시차는 켜지 않는다(글자는 처음부터 보임). */
(() => {
  const d = document, root = d.documentElement;
  if (!d.querySelector('#home-title')) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phone = matchMedia('(max-width: 767px)').matches;

  /* 휴대폰 제목: '산업별 특징' 그림 글자 묶음과 뒤의 '에'를 한 덩어리로 묶어 '에'만 다음 줄로 떨어지지 않게 함 */
  const phrase = d.querySelector('#home-title .image-phrase');
  const after = phrase && phrase.nextSibling;
  if (after && after.nodeType === 3 && /^\S/.test(after.data) && !phrase.parentElement.classList.contains('jh-nw')) {
    const m = after.data.match(/^\S+/)[0];
    after.data = after.data.slice(m.length);
    const nw = d.createElement('span'); nw.className = 'jh-nw';
    phrase.before(nw); nw.append(phrase, m);
    /* 이어지는 '적합한 솔루션'도 한 덩어리 → 휴대폰에서 '산업별 특징에 / 적합한 솔루션'으로 나뉨(PC는 한 줄 그대로) */
    const rest = nw.nextSibling, mm = rest && rest.nodeType === 3 && rest.data.match(/^(\s+)(\S+\s\S+)/);
    if (mm) {
      const tail = rest.splitText(mm[1].length); tail.splitText(mm[2].length);
      const nw2 = d.createElement('span'); nw2.className = 'jh-nw'; nw2.textContent = mm[2]; tail.replaceWith(nw2);
    }
  }

  /* '오감 을' → '오감을': 조사 앞 빈칸(소스 줄바꿈이 남긴 것)을 없앰. 오감 글자는 색만 바뀌어 폭이 그대로다 */
  const senses = d.querySelector('#home-title .home-hero__senses');
  const josa = senses && senses.nextSibling;
  if (josa && josa.nodeType === 3 && /^\s+을/.test(josa.data)) josa.data = josa.data.replace(/^\s+/, '');

  /* 상담 카드: 사이트에 이미 있는 대표 전화를 두 번째 버튼으로 */
  const cs = d.getElementById('consultation');
  const tel = d.querySelector('footer a[href^="tel:"]');
  const cta = cs && cs.querySelector(':scope > a.button');
  if (cta && tel && !cs.querySelector('.jh-cta')) {
    const row = d.createElement('div'); row.className = 'jh-cta';
    const call = d.createElement('a');
    call.className = 'button button--secondary button--lg'; call.href = tel.getAttribute('href');
    call.textContent = '전화 ' + tel.textContent.trim();
    cta.before(row); row.append(cta, call);
  }

  d.querySelectorAll('.home-hero__actions > *').forEach((e, k) => e.style.setProperty('--k', k));

  if (still) return;
  /* 강조 바탕색은 새 규칙이 켜지기 전에 읽어 둠 */
  const markBg = new Map([...d.querySelectorAll('main h2 mark')].map(m => [m, getComputedStyle(m).backgroundColor]));

  /* 낱말 나누기: 글자 노드만 낱말 span 으로 감싼다(강조 mark·span 같은 안쪽 요소는 그대로 두고 그 안의 글자도 감쌈) */
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
          const s = d.createElement('span'); s.className = 'jh-w'; s.style.setProperty('--i', i++); s.textContent = part; f.append(s);
        }
        c.replaceWith(f);
      }
    };
    walk(h); return i;
  };

  const groups = [];
  for (const id of ['sense-circle-title', 'case-feature-title', 'core-products-title', 'product-bridge-title', 'next-step-title']) {
    const h = d.getElementById(id); if (!h) continue;
    const n = split(h), base = 90;
    h.style.setProperty('--jh-d', base + 'ms');
    const items = [h];
    const own = h.parentElement.closest('[data-reveal]'); if (own) own.setAttribute('data-jh-own', '');
    const prev = h.previousElementSibling;
    if (prev && prev.tagName === 'P') { prev.classList.add('jh-up'); prev.style.setProperty('--jh-d', '0ms'); items.push(prev); }
    /* 제목 뒤 설명·버튼 줄(최대 3개), 상담 카드는 바깥의 버튼 줄까지 */
    const follow = [];
    for (let e = h.nextElementSibling; e && follow.length < 3; e = e.nextElementSibling) follow.push(e);
    if (own && own.parentElement && own.parentElement.id === 'consultation') for (let e = own.nextElementSibling; e && follow.length < 4; e = e.nextElementSibling) follow.push(e);
    let t = base + n * 45 + 220;
    for (const e of follow) {
      if (e.matches('.case-feature__board, .jy-marquee')) continue; /* 로고 흐름판은 기존 등장 유지 */
      e.classList.add('jh-up'); e.style.setProperty('--jh-d', t + 'ms'); items.push(e); t += 90;
    }
    const mark = h.querySelector('mark');
    if (mark) { mark.style.setProperty('--jh-mark', markBg.get(mark)); h.style.setProperty('--jh-mark-d', (base + n * 45 + 260) + 'ms'); }
    groups.push({ h, items });
  }

  root.classList.add('jh-on');

  /* '48종' 숫자: 글자 속 첫 숫자만 감싸 0 → 원래 수로 셈 */
  const counters = [];
  const eb = d.querySelector('.product-bridge__eyebrow');
  if (eb) {
    const w = d.createTreeWalker(eb, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode());) {
      const m = n.data.match(/\d+/); if (!m) continue;
      const tail = n.splitText(m.index); tail.splitText(m[0].length);
      const s = d.createElement('span'); s.className = 'jh-num'; s.textContent = m[0];
      s.setAttribute('aria-label', m[0]); tail.replaceWith(s);
      counters.push({ s, to: +m[0], host: eb }); break;
    }
  }

  const show = (g, instant) => g.items.forEach(e => { if (instant) e.classList.add('jh-instant'); e.classList.add('is-jh-in'); });
  const count = c => {
    const t0 = performance.now(), dur = 1200;
    const tick = now => { const p = Math.min(1, (now - t0) / dur), v = Math.round(c.to * (1 - Math.pow(1 - p, 3))); c.s.textContent = v; if (p < 1) requestAnimationFrame(tick); };
    c.s.textContent = '0'; setTimeout(() => requestAnimationFrame(tick), 250);
  };
  const io = new IntersectionObserver(es => {
    for (const en of es) {
      const g = groups.find(x => x.h === en.target);
      if (g) {
        if (en.isIntersecting) { show(g); io.unobserve(en.target); }
        else if (en.boundingClientRect.bottom < 0) { show(g, true); io.unobserve(en.target); }
        continue;
      }
      const c = counters.find(x => x.host === en.target);
      if (c && en.isIntersecting) { count(c); io.unobserve(en.target); }
      else if (c && en.boundingClientRect.bottom < 0) io.unobserve(en.target);
    }
  }, { rootMargin: phone ? '0px 0px -8% 0px' : '0px 0px -14% 0px' });
  groups.forEach(g => io.observe(g.h));
  counters.forEach(c => { c.s.textContent = '0'; io.observe(c.host); });

  /* 첫 화면 빠져나가기: 글 묶음은 스크롤보다 느리게 올라가며 옅어지고, 영상은 6%까지 커짐 */
  const hero = d.getElementById('hero');
  const layers = hero ? [...hero.querySelectorAll('.home-hero__content, .home-hero__ring')] : [];
  const media = hero && hero.querySelector('.home-hero__media');
  if (hero && layers.length) {
    let raf = 0;
    /* 2차: 흰 장이 올라탈 때 첫 화면 전체가 어두워지고(최대 60%) 글 묶음은 4% 작아지며 물러남 */
    const dim = d.createElement('div'); dim.className = 'jh-dim'; dim.setAttribute('aria-hidden', 'true'); hero.append(dim);
    const paint = () => {
      raf = 0;
      const h = hero.offsetHeight, y = Math.max(0, scrollY - hero.offsetTop), p = Math.min(1, y / h);
      if (p >= 1 && hero.dataset.jhOut) return;
      hero.dataset.jhOut = p >= 1 ? '1' : '';
      for (const l of layers) {
        l.style.translate = p ? `0 ${(y * 0.22).toFixed(1)}px` : '';
        l.style.opacity = p ? Math.max(0, 1 - p * 1.25).toFixed(3) : '';
        l.style.scale = p ? (1 - p * 0.04).toFixed(4) : '';
      }
      if (media) media.style.scale = p ? (1 + p * 0.06).toFixed(4) : '';
      dim.style.opacity = (p * p * 0.6).toFixed(3);
    };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(paint); }, { passive: true });
    paint();
  }

  /* 2차 S2. 큰 덩어리 안착: 아래·작게 있다가 화면에 들어오면 제자리로(오감 도식은 기존 흐려짐 등장이 있어 위치만) */
  const settle = [['.case-feature__board', 1], ['#core-products .field-panels', 1], ['.sense-circle__diagram', 0], ['#consultation', 0]]
    .map(([sel, fade]) => { const e = d.querySelector(sel); if (e) { e.classList.add('jh-settle'); if (fade) e.classList.add('jh-fade'); } return e; }).filter(Boolean);
  const io2 = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('is-jh-in'); io2.unobserve(en.target); }
    else if (en.boundingClientRect.bottom < 0) { en.target.classList.add('jh-instant', 'is-jh-in'); io2.unobserve(en.target); }
  }), { rootMargin: '0px 0px -10% 0px' });
  settle.forEach(e => io2.observe(e));

  /* 2차 I3. 번호 핀: 현장 섹션이 처음 보일 때부터 차례로 튀어나오게(탭을 바꿀 때마다 새 패널에서도) */
  const fs = d.getElementById('core-products');
  if (fs) {
    fs.querySelectorAll('.field-pins').forEach(g => g.querySelectorAll('button').forEach((b, n) => b.style.setProperty('--n', n)));
    const io3 = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { fs.classList.add('jh-pins-ready'); io3.disconnect(); } }, { rootMargin: '0px 0px -25% 0px' });
    const media0 = fs.querySelector('.field-media'); if (media0) io3.observe(media0);

    /* A1. 핀과 대상 잇는 선이 핀 쪽에서 대상 쪽으로 자라남(선 끝 좌표를 0.45초 동안 옮김) */
    const grow = g => {
      const ln = g.querySelector('line'); if (!ln) return;
      const x1 = +ln.getAttribute('x1'), y1 = +ln.getAttribute('y1');
      const x2 = +(ln.dataset.jhX2 ??= ln.getAttribute('x2')), y2 = +(ln.dataset.jhY2 ??= ln.getAttribute('y2'));
      const t0 = performance.now();
      const step = now => {
        const k = Math.min(1, (now - t0) / 450), e = 1 - Math.pow(1 - k, 3);
        ln.setAttribute('x2', (x1 + (x2 - x1) * e).toFixed(3)); ln.setAttribute('y2', (y1 + (y2 - y1) * e).toFixed(3));
        if (k < 1 && g.hasAttribute('data-active')) requestAnimationFrame(step);
        else { ln.setAttribute('x2', x2); ln.setAttribute('y2', y2); }
      };
      requestAnimationFrame(step);
    };
    new MutationObserver(ms => ms.forEach(m => { if (m.target.hasAttribute('data-active')) grow(m.target); }))
      .observe(fs, { subtree: true, attributes: true, attributeFilter: ['data-active'] });

    /* 휴대폰: 담당자 탭 줄이 옆으로 넘겨진다는 것을 한 번 살짝 밀었다 돌아와 알려 줌 */
    const roles = fs.querySelector('.field-roles');
    if (roles && phone && roles.scrollWidth > roles.clientWidth + 8) {
      const io4 = new IntersectionObserver(es => {
        if (!es.some(e => e.isIntersecting)) return; io4.disconnect();
        if (roles.scrollLeft > 4) return;
        setTimeout(() => { roles.scrollTo({ left: 56, behavior: 'smooth' }); setTimeout(() => { if (roles.scrollLeft <= 60) roles.scrollTo({ left: 0, behavior: 'smooth' }); }, 650); }, 500);
      }, { rootMargin: '0px 0px -30% 0px' });
      io4.observe(roles);
    }
  }
})();
