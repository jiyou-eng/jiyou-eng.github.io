/* 기업소개 장면 연출. 짝: jy-company.css
   각 고정 장면(.cx-scene)의 스크롤 진행도 p(0~1)를 구해 화면 값을 바꾼다. 스크롤을 가로채지 않고, 위치에 따라 반응만 한다.
   움직임 줄이기면 아무것도 켜지 않는다(일반 배치로 모든 내용이 보임). */
(() => {
  const d = document, root = d.documentElement, cx = d.getElementById('cx');
  if (!cx || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  root.classList.add('cx-on');

  const clamp = v => Math.max(0, Math.min(1, v));
  const ease = t => (t = clamp(t), t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);   /* 천천히 시작·천천히 멈춤 */
  const out = t => 1 - Math.pow(1 - clamp(t), 3);                                              /* 빠르게 시작·천천히 멈춤 */
  const wide = () => innerWidth >= 900;
  const prog = el => { const r = el.getBoundingClientRect(), span = r.height - innerHeight; return span > 0 ? clamp(-r.top / span) : (r.top < 0 ? 1 : 0); };
  const set = (el, o) => { for (const k in o) el.style.setProperty(k, o[k]); };

  /* 낱말 나누기(안쪽 강조 span 은 두고 그 안 글자도 나눔). key 클래스가 붙은 span 안 낱말은 is-key */
  const split = (h, keySel) => {
    let i = 0;
    const walk = (n, key) => {
      for (const c of [...n.childNodes]) {
        if (c.nodeType === 1) { if (c.tagName !== 'BR') walk(c, key || (keySel && c.matches(keySel))); continue; }
        if (c.nodeType !== 3 || !c.data.trim()) continue;
        const f = d.createDocumentFragment();
        for (const part of c.data.split(/(\s+)/)) {
          if (!part) continue;
          if (/^\s+$/.test(part)) { f.append(part); continue; }
          const s = d.createElement('span'); s.className = 'cx-w' + (key ? ' is-key' : ''); s.style.setProperty('--i', i++); s.textContent = part; f.append(s);
        }
        c.replaceWith(f);
      }
    };
    walk(h, false); return [...h.querySelectorAll('.cx-w')];
  };

  /* 3. '하는 일' 제목: 감지하고 알리는 / 만들고 공급합니다 는 초록 강조 */
  const fillH = cx.querySelector('.cx-fill');
  let fillWords = [];
  if (fillH) {
    const t = fillH.textContent;
    fillH.innerHTML = t.replace('감지하고 알리는', '<span class="cx-key">감지하고 알리는</span>').replace('만들고 공급합니다.', '<span class="cx-key">만들고 공급합니다.</span>');
    fillWords = split(fillH, '.cx-key');
  }

  /* 낱말 등장 제목·카드 묶음·로고 타일: 화면에 들어오면 한 번 */
  const once = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting || e.boundingClientRect.bottom < 0) { e.target.classList.add('is-in'); once.unobserve(e.target); }
  }), { rootMargin: '0px 0px -14% 0px' });
  cx.querySelectorAll('.cx-words').forEach(h => { split(h); once.observe(h); });
  const cards = cx.querySelector('.cx-cards'); if (cards) once.observe(cards);
  const tiles = cx.querySelector('.cx-tiles');
  if (tiles) {
    /* 가운데에서 먼 타일일수록 늦게 */
    const place = () => {
      const g = tiles.getBoundingClientRect(), cxm = g.left + g.width / 2, cym = g.top + g.height / 2;
      const ts = [...tiles.children], ds = ts.map(t => { const r = t.getBoundingClientRect(); return Math.hypot(r.left + r.width / 2 - cxm, (r.top + r.height / 2 - cym) * 1.6); });
      const mx = Math.max(...ds, 1); ts.forEach((t, i) => t.style.setProperty('--d', Math.round(ds[i] / mx * 520) + 'ms'));
    };
    place(); addEventListener('resize', place); once.observe(tiles);
  }

  /* 4. 감각 단계: 넓은 화면에서는 스크롤 위치가 단계를 고름. 머리 버튼을 누르면 그 단계 자리로 스크롤 */
  const senses = cx.querySelector('.cx-senses');
  const steps = senses ? [...senses.querySelectorAll('.cx-step')] : [];
  const shots = senses ? [...senses.querySelectorAll('.cx-senses__shot')] : [];
  let active = -1;
  const pick = i => {
    if (i === active) return; active = i;
    steps.forEach((s, k) => { s.classList.toggle('is-on', k === i); s.querySelector('.cx-step__head').setAttribute('aria-expanded', String(k === i || !wide())); });
    shots.forEach((s, k) => s.classList.toggle('is-on', k === i));
  };
  steps.forEach((s, i) => s.querySelector('.cx-step__head').addEventListener('click', () => {
    if (!wide()) return;
    const r = senses.getBoundingClientRect(), span = r.height - innerHeight;
    scrollTo({ top: scrollY + r.top + span * ((i + .5) / steps.length), behavior: 'smooth' });
  }));

  /* 장면별 그리기 */
  const hero = cx.querySelector('[data-cx=hero]'), card = hero && hero.querySelector('.cx-hero__card');
  const lines = hero ? [...hero.querySelectorAll('.cx-hero__line')] : [];
  const promise = cx.querySelector('[data-cx=promise]'), pill = promise && promise.querySelector('.cx-promise__pill');
  const close = cx.querySelector('[data-cx=close]'), closeLines = close ? [...close.querySelectorAll('.cx-close__line')] : [];
  const header = d.querySelector('.site-header');
  const rail = [...cx.querySelectorAll('.cx-rail span')];
  const railSecs = ['[data-cx=hero]', '#work', '#senses', '#how', '#why', '#partners', '[data-cx=close]', '#facts'].map(s => cx.querySelector(s));

  const draw = () => {
    raf = 0;
    const vw = innerWidth, vh = innerHeight;
    if (hero) {
      const p = prog(hero), e = ease(p / .26), s = ease((p - .86) / .14);
      const hh = 16, side = Math.max(20 * (1 - e), 40 * s), rad = Math.max(32 * (1 - e), 32 * s);
      set(card, { '--t': `${Math.max(hh * (1 - e), 40 * s).toFixed(1)}px`, '--s': `${side.toFixed(1)}px`, '--b': `${Math.max(20 * (1 - e), 40 * s).toFixed(1)}px`, '--r': `${rad.toFixed(1)}px`,
        '--vz': (1 + .14 * ease((p - .2) / .6)).toFixed(4), '--sh': (.7 + .3 * ease((p - .28) / .2)).toFixed(3),
        '--to': (1 - ease((p - .2) / .16)).toFixed(3), '--ty': `${(-60 * ease((p - .2) / .16)).toFixed(1)}px` });
      lines.forEach((l, i) => { const t = out((p - (.4 + i * .08)) / .12); set(l, { '--o': t.toFixed(3), '--y': `${(28 * (1 - t)).toFixed(1)}px` }); l.classList.toggle('is-in', t > .8); });
    }
    if (fillWords.length) {
      const r = fillH.getBoundingClientRect(), t = clamp((vh * .82 - r.top) / (vh * .5)), n = Math.round(t * fillWords.length);
      fillWords.forEach((w, i) => w.classList.toggle('is-on', i < n));
    }
    if (senses && steps.length) {
      if (wide()) pick(Math.min(steps.length - 1, Math.floor(prog(senses) * steps.length)));
      else if (active !== -2) { active = -2; steps.forEach(s => { s.classList.add('is-on'); s.querySelector('.cx-step__head').setAttribute('aria-expanded', 'true'); }); }
    }
    if (promise) {
      const p = prog(promise), g = ease((p - .1) / .58), w0 = vw < 768 ? 56 : 84, h0 = vw < 768 ? 150 : 200;
      const ti = out((p - .66) / .16);
      set(promise, { '--pw': `${(w0 + (vw - w0) * g).toFixed(1)}px`, '--ph': `${(h0 + (vh - h0) * g).toFixed(1)}px`, '--pr': `${(42 * (1 - g)).toFixed(1)}px`,
        '--pz': (1.35 - .35 * g).toFixed(4), '--so': (1 - out(g / .3)).toFixed(3), '--ti': ti.toFixed(3), '--tyy': `${(30 * (1 - ti)).toFixed(1)}px`, '--tp': ti > .6 ? 'auto' : 'none' });
    }
    if (close) {
      const p = prog(close);
      set(close, { '--cz': (1.2 - .2 * ease(p / .85)).toFixed(4), '--cs': (.5 + .4 * ease(p / .5)).toFixed(3) });
      closeLines.forEach((l, i) => { const t = out((p - (.16 + i * .14)) / .16); set(l, { '--o': t.toFixed(3), '--y': `${(30 * (1 - t)).toFixed(1)}px`, '--bl': `${(6 * (1 - t)).toFixed(2)}px` }); });
    }
    if (rail.length) {
      let on = 0; railSecs.forEach((s, i) => { if (s && s.getBoundingClientRect().top <= vh * .5) on = i; });
      rail.forEach((r, i) => r.classList.toggle('is-on', i === on));
    }
  };
  let raf = 0;
  const ask = () => { if (!raf) raf = requestAnimationFrame(draw); };
  addEventListener('scroll', ask, { passive: true });
  addEventListener('resize', ask);
  draw();

  /* 첫 화면 영상: 화면 밖이면 멈춰 전력 아낌 */
  const video = hero && hero.querySelector('video');
  if (video) new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) video.play().catch(() => {}); else video.pause(); })).observe(hero);
})();
