const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/HDEBPNEQTU';
// Ссылка на бота-игру (гайд). После переноса бота на аккаунт клиента поменять только здесь.
const BOT_LINK = 'https://t.me/trip_wire_super_bot?start=e4a7a46d91cb';

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (n, a, p) => {
    const e = document.createElementNS(NS, n);
    for (const k in a) e.setAttribute(k, a[k]);
    if (p) p.appendChild(e);
    return e;
  };
  const rng = seed => () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };

  $$('[data-bot]').forEach(a => { a.href = BOT_LINK; });
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ===== HERO: стена из плитки, реагирует на курсор ===== */
  const wall = $('#heroWall');
  if (wall) {
    const C = 6, R = 6, tiles = [];
    const accent = { '2,2': '#B94A2B', '3,3': '#B94A2B', '0,5': '#1F5C57', '1,4': '#1F5C57', '4,1': '#1F5C57', '5,0': '#1F5C57' };
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const t = document.createElement('i');
      t.style.setProperty('--t', accent[c + ',' + r] || ((c + r) % 2 ? '#F0E8D8' : '#E8DFCB'));
      t.style.setProperty('--d', c + r);
      wall.appendChild(t);
      tiles.push({ el: t, c, r, k: 0, g: 0 });
    }
    const visible = tiles.filter(t => t.el.offsetParent !== null);
    if (reduce) wall.classList.add('settled');
    else {
      wall.classList.add('on');
      setTimeout(() => wall.classList.add('settled'), 1500);
    }
    let px = null, py = null, lastMove = -1e9;
    const art = wall.parentElement;
    art.addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; lastMove = performance.now(); });
    art.addEventListener('pointerleave', () => { px = null; });
    let inView = true, raf = 0;
    const loop = now => {
      raf = 0;
      if (!inView) return;
      const now2 = performance.now();
      const hover = px !== null && now2 - lastMove < 2500;
      let moving = false;
      const wfront = (now2 / 330) % 16;
      tiles.forEach(t => {
        if (t.el.offsetParent === null) return;
        let target = 0;
        if (hover) {
          const b = t.el.getBoundingClientRect();
          const dist = Math.hypot(b.left + b.width / 2 - px, b.top + b.height / 2 - py);
          target = Math.pow(clamp(1 - dist / (b.width * 1.9)), 1.6);
        } else {
          target = Math.pow(clamp(1 - Math.abs(t.c + t.r - wfront) / 1.7), 2) * .85;
        }
        t.k += (target - t.k) * .16;
        if (Math.abs(t.k - t.g) > .004) { t.g = t.k; t.el.style.setProperty('--k', t.k.toFixed(3)); }
        moving = true;
      });
      raf = requestAnimationFrame(loop);
    };
    if (!reduce) {
      const start = () => { if (!raf) raf = requestAnimationFrame(loop); };
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(es => { inView = es[0].isIntersecting; if (inView) start(); }).observe(wall);
      }
      start();
    }
  }

  /* ===== SCENE: плитка раскладывается по скроллу ===== */
  const scene = $('#scene');
  const svg = $('#room');
  if (scene && svg) {
    const gOld = $('#gOld'), gNew = $('#gNew'), gGrout = $('#gGrout');
    const screed = $('#rScreed'), rail = $('#rail'), railLine = $('#railLine'), railDot = $('#railDot');
    const label = $('#roomLabel');
    const stages = $$('.st', scene);
    const tabs = $$('#sceneTabs button');
    const X0 = 40, Y0 = 44, W = 560, H = 392;
    let view = 'floor', parts = [], P = reduce ? 1 : 0, activeStage = -1;

    const build = v => {
      view = v;
      [gOld, gNew, gGrout].forEach(g => { g.textContent = ''; });
      parts = [];
      const rnd = rng(v === 'floor' ? 7 : 19);
      const wallV = v === 'wall';
      const cols = wallV ? 8 : 10, rows = wallV ? 11 : 7;
      const tw = wallV ? 70 : 56, th = wallV ? 35 : 56;
      const oldTones = ['#B9AE98', '#C4B9A2', '#AFA48E', '#D0C5AE', '#BFB39B'];
      label.textContent = wallV ? 'Стена, вид спереди' : 'Пол, вид сверху';
      for (let r = 0; r < rows; r++) {
        const shift = wallV && r % 2 ? -tw / 2 : 0;
        const n = wallV && r % 2 ? cols + 1 : cols;
        for (let c = 0; c < n; c++) {
          const x = X0 + c * tw + shift, y = Y0 + r * th;
          const d = clamp(((x + tw / 2 - X0) / W + (y + th / 2 - Y0) / H) / 2);
          // старая плитка
          const go = svgEl('g', { class: 'tile-old' }, gOld);
          svgEl('rect', { x: x + 1, y: y + 1, width: tw - 2, height: th - 2, fill: oldTones[Math.floor(rnd() * oldTones.length)], stroke: '#9C917A', 'stroke-width': 1.5 }, go);
          if (rnd() < .35) {
            const cx = x + tw * (.2 + rnd() * .6), cy = y + th * (.2 + rnd() * .6);
            svgEl('path', { d: `M${cx} ${y + 2} L${cx + 6} ${cy} L${cx - 4} ${y + th - 2}`, fill: 'none', stroke: '#8A7F69', 'stroke-width': 1.3 }, go);
          }
          // новая плитка
          let tone;
          if (!wallV) {
            tone = (c + r) % 2 ? '#F1E9DA' : '#E9E0CC';
            if (Math.abs(c - 4.5) + Math.abs(r - 3) < 2.1) tone = '#B94A2B';
            else if ((c === 0 || c === cols - 1 || r === 0 || r === rows - 1) && (c + r) % 2 === 0) tone = '#1F5C57';
          } else {
            tone = (r + (c % 2)) % 2 ? '#F1E9DA' : '#EAE1CE';
            if (r === 7) tone = '#B94A2B';
            else if (r > 7) tone = '#1F5C57';
          }
          const gn = svgEl('g', {}, gNew);
          svgEl('rect', { x: x + 1.75, y: y + 1.75, width: tw - 3.5, height: th - 3.5, fill: tone }, gn);
          svgEl('path', { d: `M${x + 1.75} ${y + 1.75} h${tw * .55} l-${tw * .55} ${th * .55} z`, fill: '#fff', opacity: .18 }, gn);
          // шов
          const gg = svgEl('path', { d: `M${x} ${y} h${tw} v${th} h-${tw} z`, fill: 'none', stroke: '#8E8574', 'stroke-width': 3.5, pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1, 'stroke-linejoin': 'miter' }, gGrout);
          parts.push({ go, gn, gg, d, thr: clamp(d * .5 + rnd() * .5) });
        }
      }
      render();
    };

    const ease = k => 1 - Math.pow(1 - k, 3);
    const render = () => {
      const s0 = clamp(P / .25), s1 = clamp((P - .25) / .25), s2 = clamp((P - .5) / .3), s3 = clamp((P - .8) / .2);
      parts.forEach(p => {
        const k0 = clamp((s0 - p.thr * .6) / .4);
        p.go.style.opacity = 1 - k0;
        p.go.style.transform = k0 ? `translateY(${(-k0 * 34).toFixed(1)}px) rotate(${((p.thr - .5) * 26 * k0).toFixed(1)}deg) scale(${(1 - k0 * .35).toFixed(3)})` : '';
        p.go.style.visibility = k0 >= 1 ? 'hidden' : '';
        const k2 = ease(clamp((s2 - p.d * .55) / .45));
        p.gn.style.opacity = k2;
        p.gn.style.transform = k2 < 1 ? `translateY(${(-26 * (1 - k2)).toFixed(1)}px) scale(${(1 + .18 * (1 - k2)).toFixed(3)})` : '';
        const k3 = clamp((s3 - p.d * .6) / .4);
        p.gg.style.strokeDashoffset = (1 - k3).toFixed(3);
      });
      const sw = W * ease(s1);
      screed.setAttribute('width', sw.toFixed(1));
      const rx = X0 + sw;
      railLine.setAttribute('x1', rx); railLine.setAttribute('x2', rx);
      railDot.setAttribute('cx', rx);
      rail.setAttribute('opacity', s1 > 0.001 && s1 < 0.999 ? 1 : 0);
      const st = Math.min(3, Math.floor(P * 4));
      if (st !== activeStage) {
        activeStage = st;
        stages.forEach((s, i) => s.classList.toggle('is-on', i === st));
        tabs.forEach((t, i) => { t.classList.toggle('is-on', i === st); t.setAttribute('aria-pressed', i === st); });
      }
    };

    const total = () => scene.offsetHeight - $('.scene__stick').offsetHeight;
    const update = () => {
      if (!scene.classList.contains('is-pin')) return;
      P = clamp(-scene.getBoundingClientRect().top / total());
      render();
    };

    build('floor');
    if (!reduce) {
      scene.classList.add('is-pin');
      tabs.forEach(t => t.addEventListener('click', () => {
        const i = +t.dataset.i;
        const y = scene.getBoundingClientRect().top + scrollY + total() * ((i + .5) / 4);
        scrollTo({ top: y, behavior: 'smooth' });
      }));
      update();
      let ticking = false;
      addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => { ticking = false; update(); });
      }, { passive: true });
      addEventListener('resize', update);
    } else {
      stages.forEach(s => s.classList.remove('is-on'));
    }
    $$('[data-view]').forEach(b => b.addEventListener('click', () => { if (b.dataset.view !== view) { build(b.dataset.view); } }));
  }

  /* ===== smooth anchors ===== */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href.length <= 1) return;
      const target = $(href);
      if (!target) return;
      e.preventDefault();
      const top = href === '#top' ? 0 : target.getBoundingClientRect().top + scrollY - 64;
      scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* ===== FORM -> CLOUDFLARE WORKER -> TELEGRAM ===== */
  const form = $('#leadForm');
  const msg = $('#formMsg');
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    const fd = new FormData(form);
    const payload = {};
    fd.forEach((v, k) => { payload[k] = v; });
    if (payload._gotcha) return;
    msg.classList.remove('err');
    if (!String(payload.name || '').trim() || !String(payload.contact || '').trim()) { msg.textContent = 'Заполните имя и контакт'; msg.classList.add('err'); return; }
    if (!payload.consent) { msg.textContent = 'Нужно согласие на обработку персональных данных'; msg.classList.add('err'); return; }
    delete payload.consent;
    payload.source = 'Укладка плитки СПб и ЛО - лендинг';
    btn.disabled = true;
    btn.textContent = 'Отправляем...';
    try {
      const resp = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      btn.textContent = 'Отправлено';
      msg.textContent = 'Спасибо! Мы свяжемся с вами в ближайшее время.';
      form.reset();
    } catch (err) {
      console.error(err);
      btn.textContent = 'Ошибка, попробуйте ещё раз';
      msg.textContent = 'Не удалось отправить. Попробуйте ещё раз или напишите в Telegram @kusman83.';
      msg.classList.add('err');
    } finally {
      setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 3000);
    }
  });
})();
