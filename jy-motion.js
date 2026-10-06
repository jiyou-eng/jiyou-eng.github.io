/* 지유이엔지 제품 상세 공통 움직임. 페이지별 설정은 window.JM_PAGE(각 페이지 안 인라인 스크립트).
   기준: 썬플렉스/codex-briefs/jiyou-redesign-plan.md 3절 + 외부 검수(redesign-tools/reviews).
   원칙: 원래 DOM 의 부모-자식 관계를 바꾸지 않는다. 제목 글자 → 제품 그림 연출 대상 제목은 쪼개지 않는다. */
(() => {
  'use strict';
  const d = document, html = d.documentElement, main = d.querySelector('main');
  if (!main || window.__jmMotionLoaded) return;
  window.__jmMotionLoaded = true;
  html.dataset.jmReady = '1';

  const cfg = window.JM_PAGE || {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const motion = html.classList.contains('jm-on') && !reduce.matches && 'IntersectionObserver' in window;
  if (!motion) html.classList.remove('jm-on');
  const pc = matchMedia('(min-width:1024px)');
  const phone = matchMedia('(max-width:767px)');
  const article = main.querySelector('.dedicated-product-page') || main;
  const hero = article.querySelector('section[class*="hero"]');
  const path = location.pathname.replace(/\/$/, '');

  /* 제목 글자 연출 대상 제목 */
  let glyphHost = null;
  try {
    const plan = (window.JiyouProductMotionPlans || {})[path];
    const target = plan && d.querySelector(plan.selector);
    glyphHost = target && target.closest('h1,h2');
  } catch (e) { /* 설정이 없으면 건너뜀 */ }

  const setD = (el, ms) => el.style.setProperty('--d', ms + 'ms');
  const mark = (el, kind, delay) => {
    if (!el || el.dataset.jm || el.closest('[data-jm]')) return;
    el.dataset.jm = kind;
    if (delay) setD(el, delay);
  };

  /* 글자색이 밝으면 어두운 바탕으로 본다 */
  const lightColor = c => {
    const n = (c.match(/[\d.]+%?/g) || []).map(parseFloat);
    if (/^(oklch|oklab|lab)/.test(c)) return (n[0] > 1 ? n[0] / 100 : n[0]) > 0.62;
    if (c.startsWith('color(')) return (0.2126 * n[0] + 0.7152 * n[1] + 0.0722 * n[2]) > 0.6;
    return (0.2126 * n[0] + 0.7152 * n[1] + 0.0722 * n[2]) / 255 > 0.6;
  };
  const lightText = el => lightColor(getComputedStyle(el).color);
  /* 어떤 CSS 색이든(oklch 포함) 캔버스 한 점으로 [r,g,b,a(0~1)] 로 바꿈 */
  const cvx = d.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const rgbaOf = c => { cvx.clearRect(0, 0, 1, 1); cvx.fillStyle = '#000'; cvx.fillStyle = c; cvx.fillRect(0, 0, 1, 1); const [r, g, b, a] = cvx.getImageData(0, 0, 1, 1).data; return [r, g, b, a / 255]; };
  /* 채도 있는 색의 색상각(도). 무채색·투명이면 null */
  const hueOf = c => { const [r, g, b, a] = rgbaOf(c); if (a < .3) return null; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx - mn < 40) return null;
    const h = mx === r ? (g - b) / (mx - mn) : mx === g ? 2 + (b - r) / (mx - mn) : 4 + (r - g) / (mx - mn); return (h * 60 + 360) % 360; };
  const hueGap = (a, b) => { const x = Math.abs(a - b) % 360; return Math.min(x, 360 - x); };
  /* 반투명(알파 0.5 미만) 바탕은 막대 색 판정에서 건너뜀 → 어두운 섹션 안 흰 5% 카드에 흔들리지 않음 */
  const solidBg = c => opaqueBg(c) && rgbaOf(c)[3] >= .5;
  /* 막대 색 판정에 쓰는 '바탕 덩어리': 섹션급 요소, 또는 화면 폭 98% 이상. 카드(article)는 폭 85% 이상일 때만(휴대폰 한 줄 카드) */
  const bgBlock = (n, rr) => /^(SECTION|MAIN|FOOTER|BODY)$/.test(n.tagName) || (n.tagName === 'ARTICLE' && rr.width >= innerWidth * 0.85) || rr.width >= innerWidth * 0.98;
  const opaqueBg = c => c && c !== 'transparent' && !/,\s*0\)$/.test(c) && !/\/\s*0\)$/.test(c);

  /* 제목을 단어 단위로 */
  function split(h, delay) {
    if (h === glyphHost) { mark(h, 'title', delay); return; }
    if (h.classList.contains('jm-split')) return;
    const walker = d.createTreeWalker(h, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    let i = 0;
    for (const n of nodes) {
      if (!n.textContent.trim()) continue;
      const frag = d.createDocumentFragment();
      for (const m of n.textContent.matchAll(/(\s+)|([^\s]+)/g)) {
        if (m[1]) { frag.append(m[1]); continue; }
        const w = d.createElement('span');
        w.className = 'jm-w';
        w.style.setProperty('--i', Math.min(i++, 7));
        w.textContent = m[2];
        frag.append(w);
      }
      n.replaceWith(frag);
    }
    h.classList.add('jm-split');
    if (delay) setD(h, delay);
  }

  /* 머리말(●): 점은 글자색을 따름. 가운데 정렬이면 가운데로, 바로 위에 구분선이 있으면 오른쪽 선 생략 */
  function eyebrow(p) {
    p.dataset.jmInk0 = getComputedStyle(p).color;
    p.classList.add('jm-eyebrow');
    /* 머리말 글자가 어두운 색이어도 바로 뒤 제목이 밝은 글자면 어두운 바탕 */
    const nx = p.nextElementSibling;
    if (lightText(p) || (nx && /^H[1-3]$/.test(nx.tagName) && lightText(nx))) p.classList.add('jm-on-dark');
    const ta = getComputedStyle(p).textAlign;
    if (ta === 'center' || getComputedStyle(p.parentElement).textAlign === 'center') p.classList.add('jm-eyebrow--center');
    for (let n = p.parentElement, k = 0; n && k < 3; n = n.parentElement, k++) {
      if (parseFloat(getComputedStyle(n).borderTopWidth) > 0) { p.classList.add('jm-eyebrow--noline'); break; }
    }
  }

  /* 제목 묶음: 머리말 + 제목 + 뒤따르는 문단 */
  function titleGroup(h, base = 0) {
    const prev = h.previousElementSibling;
    if (prev && prev.tagName === 'P' && prev.textContent.trim().length < 48 && !prev.querySelector('a')) {
      eyebrow(prev);
      mark(prev, 'fade', base);
    }
    split(h, base);
    let n = 0, sib = h.nextElementSibling;
    while (sib && n < 4) {
      if (sib.tagName === 'P' || sib.tagName === 'SMALL') mark(sib, 'up', base + 220 + n++ * 60);
      sib = sib.nextElementSibling;
    }
    const wrap = h.parentElement;
    if (wrap && wrap.tagName === 'DIV' && wrap.children.length <= 2) {
      let s = wrap.nextElementSibling, k = 0;
      while (s && s.tagName === 'P' && k < 2) { mark(s, 'up', base + 260 + k++ * 60); s = s.nextElementSibling; }
    }
  }

  /* ── 첫 화면 ── */
  if (hero) {
    const h1 = hero.querySelector('h1');
    if (h1 && lightText(h1)) hero.classList.add('jm-on-dark');
    if (h1 && getComputedStyle(h1).textAlign === 'center') hero.classList.add('jm-hero-center');
    const status = h1 && h1.previousElementSibling;
    if (status && status.tagName === 'P') mark(status, 'fade', 0);
    if (h1) split(h1, 80);
    let t = 380;
    for (const el of hero.querySelectorAll('h1 ~ p, h1 ~ .jm-hero-stat, h1 ~ .jm-hero-flow, h1 ~ .jm-hero-facts, h1 ~ .jm-hero-cta, h1 ~ a')) { mark(el, 'up', t); t += 90; }
    const media = hero.querySelector('.media-frame');
    if (media) mark(media, 'media', 160);
  }

  /* ── 섹션 제목 ── */
  for (const h of article.querySelectorAll('h2')) if (!hero || !hero.contains(h)) titleGroup(h);
  const consultH = d.querySelector('#consultation h2');
  if (consultH && !consultH.classList.contains('jm-split')) titleGroup(consultH);

  /* ── 2단 머리 틀(그리드, 아래쪽 정렬): 글자 규칙으로 짧아진 제목이 옆 문단 끝으로 처지지 않게 제목만 위쪽 정렬 ── */
  for (const h of article.querySelectorAll('h2')) {
    const par = h.parentElement, ps = getComputedStyle(par);
    if (ps.display !== 'grid' || ps.gridTemplateColumns.split(' ').length < 2) continue;
    if (!/end/.test(getComputedStyle(h).alignSelf + ps.alignItems)) continue;
    h.style.setProperty('align-self', 'start', 'important');
  }

  /* ── 제목-본문 간격 보정(0~11px로 붙은 곳만), 휴대폰 섹션 여백(88px 이상만 64로), 비교표 값 표시 ── */
  for (const h of article.querySelectorAll('h2, #story h3')) {
    const p = h.nextElementSibling;
    if (p && p.tagName === 'P' && parseFloat(getComputedStyle(p).marginTop) < 8 && parseFloat(getComputedStyle(h).marginBottom) < 8) p.classList.add(h.tagName === 'H2' ? 'jm-gap' : 'jm-gap-s');
  }
  /* 가운뎃점으로 이은 낱말 묶음(상·중·하로, 앱·안전상황판)은 줄바꿈 금지 칸으로 감쌈(U+2060 은 Chrome 에서 듣지 않음) */
  {
    const re = /[가-힣A-Za-z0-9]+(?:\u2060?·\u2060?[가-힣A-Za-z0-9]+)+/g;
    const w = d.createTreeWalker(article, NodeFilter.SHOW_TEXT), found = [];
    while (w.nextNode()) { const t = w.currentNode; if (t.parentElement.closest('script,style,.jm-nw,.j-motion-group')) continue; re.lastIndex = 0; if (re.test(t.data)) found.push(t); }
    for (const t of found) {
      const f = d.createDocumentFragment(); let last = 0;
      t.data.replace(re, (m, off) => { if (off > last) f.append(t.data.slice(last, off)); const sp = d.createElement('span'); sp.className = 'jm-nw'; sp.textContent = m; f.append(sp); last = off + m.length; return m; });
      if (last < t.data.length) f.append(t.data.slice(last));
      /* 가로 배치(flex·grid) 부모에서는 조각마다 별도 칸이 되어 gap 이 끼므로, 글 한 줄을 한 칸으로 묶음 */
      const pd = getComputedStyle(t.parentElement).display;
      if (/flex|grid/.test(pd)) { const run = d.createElement('span'); run.className = 'jm-run'; run.append(f); t.replaceWith(run); }
      else t.replaceWith(f);
    }
  }
  for (const sec of article.querySelectorAll('#story > div > section, #highlights')) {
    if (hero && sec === hero) continue;
    if (parseFloat(getComputedStyle(sec).paddingTop) >= 72) sec.classList.add('jm-pad-m');
  }
  const VALS = { '포함': 'yes', '미포함': 'no', '구성 확인': 'check' };
  for (const td of article.querySelectorAll('#story td')) { const k = VALS[td.textContent.trim()]; if (k) td.classList.add('jm-v', 'jm-v--' + k); }

  /* ── 시그니처: 작동 도식 장면(PC) ──
     원래 머리 묶음은 맨 위 원래 모습 그대로. 아래 두 칸: 왼쪽 고정 장면(단계마다 아이콘·이름 교체) / 오른쪽 원래 단계 글.
     장면은 단계 글(h3)을 그대로 옮겨 보여 주는 장식이라 aria-hidden. */
  const ICONS = {
    flame: '<path d="M12 3c1.5 3.2 5 5.4 5 10a5 5 0 0 1-10 0c0-2.2 1-3.6 2.2-4.8.2 1.6 1 2.6 2.1 3.2C11 8.6 11.2 5.6 12 3Z"/>',
    speaker: '<path d="M4 9.5h3.5L13 5v14l-5.5-4.5H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/>',
    bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    wear: '<circle cx="12" cy="4.6" r="2.1"/><path d="M8.2 21v-7.2L6 12.4l2.6-4.4h6.8l2.6 4.4-2.2 1.4V21"/><path d="M10 8l2 4.6L14 8"/>',
    spring: '<path d="M6 3.5h12M6 20.5h12"/><path d="M7 6.5l10 2.3-10 2.3 10 2.3-10 2.3 10 2.3"/>',
    check: '<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M9 3.5h6v2.5H9z"/><path d="m9 13 2 2 4-4.5"/>',
    signal: '<path d="M12 20v-6"/><circle cx="12" cy="12" r="1.6"/><path d="M8.5 8.5a5 5 0 0 1 7 0M6 6a8.5 8.5 0 0 1 12 0"/>',
    phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>'
  };
  const icon = name => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || ICONS.signal) + '</svg>';
  let stepsItems = null;
  /* 원래 섹션 안에 보이는 번호·선·라벨이 원래 강조색(예: 초록)이면, 머리말만 쪽 강조색으로 바뀌어 두 색이 섞이지 않게 원래 색 유지.
     고정 장면 섹션은 새 부품이 쪽 강조색을 쓰므로 제외(단계 구성 뒤에 판정) */
  function keepInk() {
    for (const p of d.querySelectorAll('.jm-eyebrow[data-jm-ink0]')) {
      const c0 = p.dataset.jmInk0, sec = p.closest('section');
      const h0 = hueOf(c0), h1 = hueOf(getComputedStyle(p).color);
      if (h0 === null || h1 === null || hueGap(h0, h1) <= 45 || !sec || sec.closest('.jm-art, .jm-scene') || sec.classList.contains('jm-steps') || sec.querySelector('.jm-scene, .jm-steps')) continue;
      let same = false, k = 0;
      for (const e of sec.querySelectorAll('*')) {
        if (e === p || p.contains(e) || e.closest('.jm-art, .jm-scene, .jm-check, .jm-consult, .jm-deco')) continue;
        if (++k > 600) break;
        if (!e.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
        const cs = getComputedStyle(e);
        for (const c of [cs.color, parseFloat(cs.borderTopWidth) ? cs.borderTopColor : '', parseFloat(cs.borderLeftWidth) ? cs.borderLeftColor : '', cs.backgroundColor]) {
          if (!c) continue; const h = hueOf(c); if (h !== null && hueGap(h, h0) <= 20) { same = true; break; }
        }
        if (same) break;
      }
      if (same) { p.style.setProperty('color', c0, 'important'); p.dataset.jmKeepInk = ''; }
    }
  }
  function setupSteps() {
    const s = cfg.steps;
    if (!s) return;
    const sec = d.querySelector(s.section);
    const grid = sec && (s.grid ? sec.querySelector(s.grid) : sec);
    const list = grid && grid.querySelector(s.list);
    if (!list || list.parentElement !== grid) return;
    const items = [...list.children].filter(n => n.nodeType === 1);
    if (items.length < 2) return;
    for (let n = sec; n; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor; if (opaqueBg(c)) { sec.style.setProperty('--jm-steps-bg', c); break; } }
    /* 단계 번호 색: 어두운 구간이면 모든 폭에서 어두운 바탕용 강조색 */
    const h2s = sec.querySelector('h2');
    if (h2s && lightText(h2s)) sec.classList.add('jm-steps-color', 'jm-on-dark');

    items.forEach(it => { if (opaqueBg(getComputedStyle(it).backgroundColor) || getComputedStyle(it).backgroundImage !== 'none') it.classList.add('jm-own-bg'); });
    const scene = d.createElement('div');
    scene.className = 'jm-scene';
    scene.setAttribute('aria-hidden', 'true');
    /* 노드 이름 = 각 단계의 주체(단계 글 안 굵은 글자), 없으면 단계 제목 */
    const actors = s.actors || items.map(li => ((li.querySelector(s.actor || 'p strong') || li.querySelector('h3') || li).textContent || '').trim());
    const n = items.length;
    const no = i => String(i + 1).padStart(2, '0');
    const art = s.art && s.art.pins && s.art.pins.length ? s.art : null;
    if (art) {
      /* 그림 모드: 현장 모형 위 번호 핀. 핀은 대상 옆에 두고 가는 선으로 잇는다(대상을 가리지 않게).
         단계가 바뀌면 카메라가 그 대상으로 다가가고(확대·이동), 신호 경로 점선이 그 단계까지 채워진다.
         pins: [대상 x%, 대상 y%, 핀 x%, 핀 y%, 이름표 쪽('l'=왼쪽)], links: [[출발 단계, 도착 단계], ...] */
      scene.classList.add('jm-scene--art');
      const P = art.pins.map(([x, y, px, py, side]) => ({ x, y, px: px == null ? x : px, py: py == null ? y : py, side }));
      const curve = (a, b) => { const A = P[a], B = P[b], mx = (A.x + B.x) / 2, my = Math.min(A.y, B.y) - Math.abs(A.x - B.x) * 0.18; return 'M' + A.x + ' ' + A.y + 'Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + B.x + ' ' + B.y; };
      const svg = '<svg class="jm-scene__lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
        (art.links || []).map(([a, b]) => '<path class="jm-path-base" d="' + curve(a, b) + '"/><path class="jm-path" data-to="' + b + '" pathLength="1" d="' + curve(a, b) + '"/>').join('') +
        P.map((q, i) => '<line class="jm-lead" data-i="' + i + '" x1="' + q.x + '" y1="' + q.y + '" x2="' + q.px + '" y2="' + q.py + '"/>').join('') + '</svg>';
      scene.innerHTML = '<div class="jm-scene__stage"><div class="jm-scene__cam"><img class="jm-scene__art" src="' + art.src + '" srcset="' + art.srcset + '" sizes="(min-width:1024px) 54vw, 92vw" width="' + art.w + '" height="' + art.h + '" alt="" loading="lazy" decoding="async">' +
        '<i class="jm-scene__spot"></i>' + svg +
        P.map((q, i) => '<i class="jm-pin__target" style="--x:' + q.x + '%;--y:' + q.y + '%"></i>').join('') +
        P.map((q, i) => '<span class="jm-scene__node jm-pin' + (q.side === 'l' ? ' jm-pin--left' : '') + '" style="--x:' + q.px + '%;--y:' + q.py + '%"><b class="jm-pin__dot">' + no(i) + '</b><span class="jm-pin__tag">' + actors[i] + '</span></span>').join('') +
        '</div></div><ol class="jm-scene__legend">' + actors.map((t, i) => '<li><b>' + no(i) + '</b>' + t + '</li>').join('') + '</ol>';
    } else {
      scene.innerHTML = '<div class="jm-scene__stage"><i class="jm-scene__glow"></i><div class="jm-scene__flow">' +
        items.map((_, i) => (i ? '<i class="jm-scene__link"><b></b></i>' : '') +
          '<div class="jm-scene__node"><span class="jm-scene__icon">' + icon((s.icons || [])[i]) + '</span>' +
          '<span class="jm-scene__no">' + no(i) + '</span><span class="jm-scene__actor">' + actors[i] + '</span></div>').join('') +
        '</div></div>';
    }
    const nodes = [...scene.querySelectorAll('.jm-scene__node')];
    const links = [...scene.querySelectorAll('.jm-scene__link')];
    const stage = scene.querySelector('.jm-scene__stage');

    let on = false;
    const kids = () => [...grid.children];
    /* 그림 모드는 휴대폰·태블릿에서도 단계 목록 뒤에 정지 그림(핀 전부 표시)으로 보여 줌 */
    const still = () => {
      if (!art) return;
      if (on) return;
      scene.classList.add('jm-scene--still');
      if (scene.previousElementSibling !== list) list.after(scene);
    };
    const apply = () => {
      const want = motion && pc.matches;
      if (want === on) { if (!want) still(); return; }
      if (want) {
        scene.classList.remove('jm-scene--still');
        /* 고정 장면을 막는 overflow:hidden 부모(쪽 고유 CSS)는 clip 으로(잘라 보이는 모습은 같고 고정은 됨) */
        for (let n = sec; n && n !== d.body; n = n.parentElement) {
          const o = getComputedStyle(n);
          if (/hidden|auto|scroll/.test(o.overflowX + o.overflowY)) { n.dataset.jmOvf = n.style.overflow || ''; n.style.setProperty('overflow', 'clip', 'important'); }
        }
        grid.append(scene);
        requestAnimationFrame(() => scene.style.setProperty('--jm-scene-h', stage.offsetHeight + 'px'));
        /* 줄 번호를 정해 장면과 목록을 같은 줄에, 나머지는 각자 한 줄 전체 */
        let row = 1;
        for (const k of kids()) {
          if (k === scene) continue;
          if (k === list) { k.style.gridRow = String(row); scene.style.gridRow = String(row); row++; continue; }
          k.style.gridRow = String(row++);
        }
        sec.classList.add('jm-steps'); grid.classList.add('jm-steps__grid'); list.classList.add('jm-steps__list');
        /* 칸 안 글자 없는 장식(aria-hidden)만 숨김 표시 — 글자가 있는 번호 등은 그대로 */
        items.forEach(it => [...it.children].forEach(k => { if (k.getAttribute('aria-hidden') === 'true' && !k.textContent.trim()) k.classList.add('jm-deco'); }));
        /* 원래 칸 바탕이 걷힌 뒤 글자가 섹션 바탕과 같은 밝기면(칸 위 흰 글자 등) 섹션 글자색으로(본문은 76% 농도) */
        requestAnimationFrame(() => {
          const ink = getComputedStyle(h2s || sec).color, dark = lightColor(ink);
          items.forEach(it => it.querySelectorAll('h3, h4, p, strong, small, b, em, div, span:not(:first-child)').forEach(el => {
            if (el.closest('.jm-scene') || !el.textContent.trim()) return;
            if (lightText(el) !== dark) { el.dataset.jmInk = '1'; el.style.setProperty('color', /^(H3|H4|STRONG|B)$/.test(el.tagName) ? ink : 'color-mix(in srgb, ' + ink + ' 76%, transparent)', 'important'); }
          }));
        });
      } else {
        scene.remove();
        kids().forEach(k => k.style.removeProperty('grid-row'));
        d.querySelectorAll('[data-jm-ovf]').forEach(n => { n.style.removeProperty('overflow'); delete n.dataset.jmOvf; });
        list.querySelectorAll('[data-jm-ink]').forEach(el => { el.style.removeProperty('color'); delete el.dataset.jmInk; });
        list.querySelectorAll('.jm-deco').forEach(el => el.classList.remove('jm-deco'));
        sec.classList.remove('jm-steps'); grid.classList.remove('jm-steps__grid'); list.classList.remove('jm-steps__list');
      }
      on = want;
      if (!on) still();
    };
    apply();
    pc.addEventListener('change', apply);
    addEventListener('resize', () => { if (on) scene.style.setProperty('--jm-scene-h', stage.offsetHeight + 'px'); });

    let cur = -1;
    const markY = a => { const no = a.querySelector('span') || a; return Math.round(a.offsetTop + no.offsetTop + no.offsetHeight / 2); };
    const setActive = i => {
      if (i === cur || i < 0) return;
      cur = i;
      items.forEach((el, k) => el.classList.toggle('is-active', k === i));
      nodes.forEach((nd, k) => { nd.classList.toggle('is-active', k === i); nd.classList.toggle('is-past', k < i); });
      links.forEach((l, k) => l.classList.toggle('is-on', k < i));
      stage.style.setProperty('--gx', ((i + 0.5) / n * 100).toFixed(1) + '%');
      if (art) {
        stage.style.setProperty('--sx', art.pins[i][0] + '%'); stage.style.setProperty('--sy', art.pins[i][1] + '%');
        /* 카메라 이동이 끝난 뒤, 그림 가장자리에 걸린 비활성 핀은 숨김 */
        clearTimeout(stage.__clip);
        stage.__clip = setTimeout(() => {
          const sr = stage.getBoundingClientRect();
          nodes.forEach(nd => { const b = nd.querySelector('.jm-pin__dot').getBoundingClientRect(); nd.classList.toggle('is-clip', b.left < sr.left - .5 || b.right > sr.right + .5 || b.top < sr.top - .5 || b.bottom > sr.bottom + .5); });
        }, 520);
        scene.querySelectorAll('.jm-path').forEach(pth => pth.classList.toggle('is-on', +pth.dataset.to <= i));
        scene.querySelectorAll('.jm-lead, .jm-pin__target').forEach((el, k) => el.classList.toggle('is-on', (el.dataset.i != null ? +el.dataset.i : k % n) === i));
      }
      list.style.setProperty('--pl', markY(items[i]) + 'px');
    };
    setActive(0);
    if (motion) {
      const io = new IntersectionObserver(es => {
        for (const e of es) if (e.isIntersecting) setActive(items.indexOf(e.target));
      }, { rootMargin: '-45% 0px -45% 0px' });
      items.forEach(el => io.observe(el));
      addEventListener('resize', () => { if (items[cur]) list.style.setProperty('--pl', markY(items[cur]) + 'px'); });
      /* 고정 장면은 단계 목록이 끝나면 함께 올라감(같은 틀 안에 목록 뒤 블록이 있어도 덮지 않게) */
      let sraf = 0;
      const clamp = () => {
        sraf = 0;
        if (!on) { scene.style.removeProperty('translate'); return; }
        scene.style.removeProperty('translate');
        const over = scene.getBoundingClientRect().bottom - list.getBoundingClientRect().bottom;
        if (over > 0) scene.style.translate = '0 ' + (-over).toFixed(1) + 'px';
      };
      addEventListener('scroll', () => { if (!sraf) sraf = requestAnimationFrame(clamp); }, { passive: true });
    }
    if (motion && pc.matches) stepsItems = new Set(items);
  }
  setupSteps();
  keepInk();

  /* ── 순서 강조(배치 유지, PC만, 스크롤 연동) ──
     도식+목록 묶음이 화면 75% 선에 들어와 25% 선을 벗어날 때까지를 단계 수로 나눔. 강조 대상은 처음부터 보이게(등장 연출 제외). */
  let seqItems = null;
  function setupSeq() {
    const q = cfg.seq;
    if (!q || !motion || !pc.matches) return;
    const sec = d.querySelector(q.section);
    const list = sec && sec.querySelector(q.list);
    if (!list) return;
    const items = [...list.children];
    const parts = (q.parts || []).map(sel => sec.querySelector(sel)).filter(Boolean);
    parts.forEach(p => p.classList.add('jm-seq-part'));
    list.classList.add('jm-seq');
    if (q.dim === false) list.classList.add('jm-seq--outline');
    seqItems = new Set([...items, ...parts]);
    const regionEls = (q.region || []).map(sel => sec.querySelector(sel)).filter(Boolean);
    if (!regionEls.length) regionEls.push(list);
    let cur = -2, raf = 0;
    const tick = () => {
      raf = 0;
      const rs = regionEls.map(e => e.getBoundingClientRect());
      const top = Math.min(...rs.map(r => r.top)), bottom = Math.max(...rs.map(r => r.bottom));
      const p = (innerHeight * 0.75 - top) / (innerHeight * 0.5 + (bottom - top));
      const i = p < 0 || p >= 1 ? -1 : Math.min(items.length - 1, Math.floor(p * items.length));
      if (i === cur) return;
      cur = i;
      sec.classList.toggle('jm-seq-run', i >= 0);
      items.forEach((el, k) => el.classList.toggle('is-active', k === i));
      parts.forEach((pt, k) => pt.classList.toggle('is-on', k === i));
    };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });
    tick();
  }
  setupSeq();

  /* ── 카드·목록 차례 등장 ── */
  const groupSel = [
    'ol:not(.breadcrumb)', '.product-highlights__grid', '.product-related ul', 'dl', 'tbody',
    '[class*="__layout"]', '[class*="-grid"]', '[class*="-flow"]', '[class*="-branches"]', '.expansion-steps'
  ].join(',');
  for (const g of article.querySelectorAll(groupSel)) {
    if (hero && hero.contains(g)) continue;
    const kids = [...g.children].filter(k => /^(LI|ARTICLE|DIV|TR)$/.test(k.tagName));
    if (kids.length < 2) continue;
    kids.forEach(k => { if (!(stepsItems && stepsItems.has(k)) && !(seqItems && seqItems.has(k))) mark(k, 'rise'); });
  }
  d.querySelectorAll('#consultation .jm-consult__actions').forEach(el => mark(el, 'up', 420));

  /* ── 사진·표 ── */
  for (const el of article.querySelectorAll('.media-frame, .jy-r3-slot, .ir3-monitor')) {
    if (hero && hero.contains(el)) continue;
    mark(el, 'media');
  }
  for (const el of article.querySelectorAll('table, details')) mark(el, 'up');

  /* ── 숫자 굴림 ── */
  const counters = [];
  if (motion) for (const sel of cfg.counts || []) for (const el of d.querySelectorAll(sel)) {
    const text = el.textContent.trim();
    const m = text.match(/^(\D*?)(\d[\d.,]*)(.*)$/);
    if (!m) continue;
    const sr = d.createElement('span');
    sr.className = 'jm-sr';
    sr.textContent = text;
    const vis = d.createElement('span');
    vis.className = 'jm-count';
    vis.setAttribute('aria-hidden', 'true');
    if (m[1]) vis.append(m[1]);
    const strips = [];
    for (const ch of m[2]) {
      if (!/\d/.test(ch)) { const s = d.createElement('span'); s.textContent = ch; vis.append(s); continue; }
      const digit = d.createElement('span');
      digit.className = 'jm-digit';
      const strip = d.createElement('span');
      strip.className = 'jm-strip';
      strip.innerHTML = '0123456789012345678'.split('').map(x => '<span>' + x + '</span>').join('');
      digit.append(strip);
      vis.append(digit);
      strips.push([strip, Number(ch)]);
    }
    if (m[3]) vis.append(m[3]);
    el.replaceChildren(sr, vis);
    counters.push({ el, vis, strips, text });
  }
  function runCount(c) {
    c.strips.forEach(([strip, n], i) => {
      strip.style.transition = 'transform ' + (900 + i * 120) + 'ms cubic-bezier(.25,1,.5,1) ' + (i * 90) + 'ms';
      strip.style.transform = 'translateY(' + (-1.08 * (n + 10 > 18 ? n : n + 10)) + 'em)';
    });
    const last = 900 + (c.strips.length - 1) * 210;
    setTimeout(() => c.vis.classList.add('is-pop'), last);
    /* 끝나면 원래 글자로 되돌림(검색·복사·번역에 숫자 띠가 남지 않게) */
    setTimeout(() => { c.el.textContent = c.text; }, last + 340);
  }

  /* ── 보이기 ── */
  const show = el => el.classList.add('is-in');
  if (motion) {
    if (hero) requestAnimationFrame(() => hero.querySelectorAll('[data-jm], .jm-split').forEach(show));
    const pending = new Set([...d.querySelectorAll('[data-jm], .jm-split')].filter(el => !(hero && hero.contains(el))));
    /* PC 는 화면 88% 선, 휴대폰은 90% 선에서 시작(3차 검수: 화면 아래가 늘 비어 보임) */
    const io = new IntersectionObserver(entries => {
      const batch = new Map();
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target;
        io.unobserve(el);
        pending.delete(el);
        if (el.dataset.jm === 'rise') {
          const p = el.parentElement, k = batch.get(p) || 0;
          batch.set(p, k + 1);
          setD(el, Math.min(k, 5) * 80);
        }
        show(el);
      }
    }, { rootMargin: phone.matches ? '100000px 0px -10% 0px' : '100000px 0px -12% 0px' });
    pending.forEach(el => io.observe(el));
    const flush = () => {
      if (innerHeight + scrollY >= d.documentElement.scrollHeight - 4) {
        pending.forEach(el => { io.unobserve(el); show(el); });
        pending.clear();
      }
    };
    addEventListener('scroll', flush, { passive: true });
    d.addEventListener('focusin', e => {
      const el = e.target.closest && e.target.closest('[data-jm]:not(.is-in), .jm-split:not(.is-in)');
      if (el) { io.unobserve(el); pending.delete(el); show(el); }
    });
    reduce.addEventListener('change', () => { if (reduce.matches) { pending.forEach(show); html.classList.remove('jm-on'); } }, { once: true });

    if (counters.length) {
      const heroDelay = el => { const w = el.closest('[data-jm]'); return w ? (parseFloat(w.style.getPropertyValue('--d')) || 0) + 300 : 300; };
      const cio = new IntersectionObserver(es => {
        for (const e of es) if (e.isIntersecting) { cio.unobserve(e.target); runCount(counters.find(x => x.el === e.target)); }
      }, { rootMargin: '0px 0px -25% 0px' });
      counters.forEach(c => { if (hero && hero.contains(c.el)) setTimeout(() => runCount(c), heroDelay(c.el)); else cio.observe(c.el); });
    }
    const flow = hero && hero.querySelectorAll('.jm-hero-flow li');
    if (flow) flow.forEach((li, i) => setTimeout(() => li.classList.add('is-lit'), 900 + i * 380));
  } else {
    d.querySelectorAll('.jm-hero-flow li').forEach(li => li.classList.add('is-lit'));
  }

  /* ── 핀 번호 글자색: 그 자리 강조색 밝기에 맞춰(밝은 민트 위 흰 글자 2:1 방지) ── */
  const pinInk = el => {
    const probe = d.createElement('i'); probe.style.cssText = 'position:absolute;color:var(--jm-accent)'; el.append(probe);
    const c = getComputedStyle(probe).color; probe.remove();
    const n = (c.match(/[\d.]+/g) || []).map(Number);
    const lin = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
    const L = c.startsWith('rgb') ? .2126 * lin(n[0]) + .7152 * lin(n[1]) + .0722 * lin(n[2]) : (lightColor(c) ? .6 : .1);
    const onWhite = 1.05 / (L + .05), onNavy = (L + .05) / (0.0087 + .05);
    el.style.setProperty('--jm-pin-ink', onNavy >= onWhite ? '#0b1424' : '#fff');
  };
  d.querySelectorAll('.jm-scene, .jm-art').forEach(pinInk);

  /* ── 그림 장면(섹션 사이 새 블록): 보이면 핀이 차례로 켜짐 ── */
  for (const fig of d.querySelectorAll('.jm-art')) {
    if (!motion) { fig.classList.add('is-lit'); continue; }
    const io = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) { io.disconnect(); fig.classList.add('is-lit'); } }, { rootMargin: '0px 0px -30% 0px' });
    io.observe(fig);
  }

  /* ── 상담 확인표: 사용자가 항목을 눌러 체크(스크롤로 저절로 차지 않음). 고리는 체크 수만큼, 다 차면 카드 상담 버튼 강조.
     카드가 처음 보일 때 첫 항목만 한 번 살짝 반짝여 누를 수 있음을 알림 ── */
  const check = d.querySelector('#consultation .jm-check');
  if (check) {
    const btns = [...check.querySelectorAll('.jm-check__item')];
    const num = check.querySelector('.jm-check__count');
    const ring = check.querySelector('.jm-check__ring');
    const sync = () => {
      const k = btns.filter(b => b.getAttribute('aria-pressed') === 'true').length;
      if (num) num.textContent = k;
      if (ring) ring.style.setProperty('--p', (k / btns.length).toFixed(3));
      check.classList.toggle('is-full', k === btns.length);
    };
    btns.forEach(b => b.addEventListener('click', () => { b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); b.parentElement.classList.toggle('is-done', b.getAttribute('aria-pressed') === 'true'); sync(); }));
    sync();
    if (motion && btns[0]) {
      const io = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) { io.disconnect(); setTimeout(() => btns[0].classList.add('is-hint'), 500); } }, { rootMargin: '0px 0px -30% 0px' });
      io.observe(check);
    }
  }

  /* ── 위쪽 하위 메뉴(PC·태블릿): 첫 화면을 지나면 나타나고 상담에 닿으면 숨음. 지금 보는 구간을 표시 ── */
  const sub = d.querySelector('.jm-subnav');
  if (sub && hero) {
    const links = [...sub.querySelectorAll('a[data-target]')];
    const targets = links.map((a, i) => {
      const t = d.querySelector(a.dataset.target);
      if (t) { if (!t.id) t.id = 'jm-part-' + (i + 1); a.href = '#' + t.id; }
      return t;
    });
    links.forEach((a, i) => { if (!targets[i]) a.parentElement.remove(); });
    let raf = 0, shown = null, curI = -1;
    const tick = () => {
      raf = 0;
      const past = hero.getBoundingClientRect().bottom < 40;
      const cs = d.getElementById('consultation');
      const end = cs && cs.getBoundingClientRect().top < innerHeight * 0.5;
      const v = past && !end;
      if (v) {
        /* 막대 바로 아래 세 지점(25·50·75%)의 '섹션 바탕'을 다수결로. 그림 장면·떠 있는 막대는 건너뜀 */
        const r = sub.getBoundingClientRect(), y = Math.min(r.bottom + 4, innerHeight - 1);
        const at = x => {
          const el = d.elementsFromPoint(x, y).find(e => !e.closest('.jm-scene, .jm-art, .jm-bar, .jm-subnav, .site-header, figure, picture, .media-frame'));
          for (let n = el; n && n !== d.documentElement; n = n.parentElement) {
            const cs = getComputedStyle(n), rr = n.getBoundingClientRect();
            if (rr.height < 280 || !bgBlock(n, rr)) continue;
            if (solidBg(cs.backgroundColor)) return lightColor(cs.backgroundColor) ? 0 : 1;
            if (cs.backgroundImage && cs.backgroundImage !== 'none' && !/url\(/.test(cs.backgroundImage)) return lightText(n) ? 1 : 0;
          }
          return 0;
        };
        sub.classList.toggle('is-dark', [0.25, 0.5, 0.75].map(f => at(innerWidth * f)).reduce((a, b) => a + b, 0) >= 2);
      }
      if (v !== shown) {
        shown = v;
        html.classList.toggle('jm-sub-on', v && !phone.matches);
        sub.classList.toggle('is-on', v);
        sub.setAttribute('aria-hidden', String(!v));
        links.forEach(a => v ? a.removeAttribute('tabindex') : a.setAttribute('tabindex', '-1'));
      }
      let k = -1;
      targets.forEach((t, i) => { if (t && t.getBoundingClientRect().top < innerHeight * 0.4) k = i; });
      if (k !== curI) {
        curI = k;
        links.forEach((a, i) => { a.classList.toggle('is-cur', i === k); if (i === k) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      }
    };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });
    tick();
  }

  /* ── 하단 상담 바 ──
     떠 있는 조작 층(유리). 아래로 충분히 내려가면 축소, 위로 올리거나 손을 대면 펼침(멈출 때마다 늘었다 줄지 않음).
     바 뒤 배경은 바 안쪽 세 지점 다수결로 판정. 보조 문구는 지금 보는 섹션의 머리말로 바뀜. */
  const bar = d.querySelector('.jm-bar');
  const consult = d.getElementById('consultation');
  if (bar && hero) {
    const links = [...bar.querySelectorAll('a')];
    const line = bar.querySelector('.jm-bar__line');
    const baseLine = line ? line.textContent : '';
    const kick = ((hero.querySelector('.jm-hero-kicker') || {}).textContent || '').trim();
    const sections = [...article.querySelectorAll('#story > div > section, #highlights')].filter(s => !hero.contains(s) && s !== hero)
      .map(s => ({ s, label: ((s.querySelector('.jm-eyebrow') || {}).textContent || '').trim() }))
      .map(x => x.label === kick ? { s: x.s, label: '' } : x);
    /* 그 지점이 속한 가장 가까운 섹션(또는 바탕이 칠해진 큰 덩어리)의 바탕으로 판정 → 카드·사진 하나에 흔들리지 않음 */
    const bgDarkAt = (x, y) => {
      const el = d.elementsFromPoint(x, y).find(e => !bar.contains(e) && !e.closest('.jm-scene, .jm-art, .jm-subnav, figure, picture, .media-frame'));
      for (let n = el; n && n !== d.documentElement; n = n.parentElement) {
        const cs = getComputedStyle(n);
        /* 바 높이를 위아래로 완전히 덮는 바탕만 인정(작은 사진·글줄에 흔들리지 않게) */
        const rr = n.getBoundingClientRect(), half = bar.offsetHeight / 2 + 4;
        if (rr.top > y - half || rr.bottom < y + half || rr.height < 280) continue;
        if (!bgBlock(n, rr)) continue;
        if (solidBg(cs.backgroundColor)) return lightColor(cs.backgroundColor) ? 0 : 1;
        if (cs.backgroundImage && cs.backgroundImage !== 'none') return lightText(n) ? 1 : 0;
      }
      return 0;
    };
    let darkVote = null, darkState = false;
    const bgDark = () => {
      const r = bar.getBoundingClientRect(), y = r.top + r.height / 2;
      const v = [0.2, 0.5, 0.8].map(f => bgDarkAt(Math.min(Math.max(r.left + r.width * f, 1), innerWidth - 2), y)).reduce((a, b) => a + b, 0) >= 2;
      if (v === darkVote || darkVote === null) darkState = v;
      darkVote = v;
      return darkState;
    };
    let raf = 0, state = null, lastY = scrollY, runDown = 0, shownAt = 0, label = baseLine, swapT = 0;
    const setCompact = v => bar.classList.toggle('is-compact', v && phone.matches && !reduce.matches);
    const setLine = text => {
      if (!line || text === label) return;
      label = text;
      clearTimeout(swapT);
      line.classList.add('is-swap');
      swapT = setTimeout(() => { line.textContent = text; line.classList.remove('is-swap'); }, 160);
    };
    const update = () => {
      raf = 0;
      const past = hero.getBoundingClientRect().bottom < 80;
      const before = !consult || consult.getBoundingClientRect().top > innerHeight * 0.85;
      const on = past && before;
      const y = scrollY, dy = y - lastY; lastY = y;
      if (on) {
        if (dy > 0) runDown += dy; else if (dy < -6) { runDown = 0; setCompact(false); }
        if (runDown > 220 && performance.now() - shownAt > 1200) setCompact(true);
        bar.classList.toggle('is-dark', bgDark());
        const mid = innerHeight / 2;
        const cur = sections.find(({ s }) => { const r = s.getBoundingClientRect(); return r.top <= mid && r.bottom > mid; });
        setLine(cur && cur.label.trim() ? cur.label.trim() : baseLine);
      }
      if (on === state) return;
      state = on;
      if (on) { shownAt = performance.now(); runDown = 0; darkVote = null; bar.classList.toggle('is-dark', bgDark()); } else setCompact(false);
      bar.classList.toggle('is-on', on);
      html.classList.toggle('jm-bar-on', on);
      bar.setAttribute('aria-hidden', String(!on));
      links.forEach(a => on ? a.removeAttribute('tabindex') : a.setAttribute('tabindex', '-1'));
    };
    let settle = 0;
    addEventListener('scroll', () => {
      if (!raf) raf = requestAnimationFrame(update);
      clearTimeout(settle); settle = setTimeout(() => { darkVote = null; update(); }, 150);
    }, { passive: true });
    addEventListener('resize', () => { if (!raf) raf = requestAnimationFrame(update); });
    bar.addEventListener('pointerenter', () => { runDown = 0; setCompact(false); });
    bar.addEventListener('focusin', () => { runDown = 0; setCompact(false); });
    update();
  }
})();
