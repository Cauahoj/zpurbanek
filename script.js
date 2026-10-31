/* ═══════════════ Zemní práce Urbánek – interakce ═══════════════ */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* ── Hero: rozjetí nadpisu po načtení ── */
  requestAnimationFrame(() => requestAnimationFrame(() => $('#hero').classList.add('is-loaded')));

  /* ── Mobilní menu ── */
  const burger = $('#burger');
  const setMenu = open => {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Zavřít menu' : 'Otevřít menu');
  };
  burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $$('#mnav a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* ── Reveal + stagger ── */
  $$('[data-stagger]').forEach(g => [...g.children].forEach((c, i) => {
    if (!c.hasAttribute('data-reveal')) c.setAttribute('data-reveal', '');
    c.style.transitionDelay = i * 80 + 'ms';
  }));
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    io.unobserve(e.target);
    setTimeout(() => (e.target.style.transitionDelay = ''), 1400);
  }), { threshold: .15, rootMargin: '0px 0px -8% 0px' });
  $$('[data-reveal]').forEach(el => io.observe(el));

  /* ── Psací stroj ── */
  const typed = $('#typed');
  const phrases = ['výkop pro základy', 'kontejner na suť', 'zbourat stodolu', 'příjezdovou cestu', 'srovnat pozemek', 'navézt štěrk'];
  if (typed && !reduce) {
    let p = 0, i = phrases[0].length, del = true;
    const tick = () => {
      const word = phrases[p];
      i += del ? -1 : 1;
      typed.textContent = word.slice(0, i);
      let wait = del ? 38 : 70;
      if (!del && i === word.length) { del = true; wait = 2200; }
      else if (del && i === 0) { del = false; p = (p + 1) % phrases.length; wait = 280; }
      setTimeout(tick, wait);
    };
    setTimeout(tick, 2800);
  }

  /* ── 3D náklon fotky v heru ── */
  const tilt = $('#tilt');
  if (tilt && fine && !reduce) {
    tilt.addEventListener('pointermove', e => {
      const r = tilt.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      tilt.style.setProperty('--ry', (x - .5) * 10 + 'deg');
      tilt.style.setProperty('--rx', (.5 - y) * 8 + 'deg');
      tilt.style.setProperty('--gx', x * 100 + '%');
      tilt.style.setProperty('--gy', y * 100 + '%');
    });
    tilt.addEventListener('pointerleave', () => { tilt.style.setProperty('--rx', '0deg'); tilt.style.setProperty('--ry', '0deg'); });
  }

  /* ── Počítadla ── */
  const countIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    countIO.unobserve(e.target);
    const el = e.target, to = +el.dataset.count, dec = +(el.dataset.decimals || 0);
    const fmt = v => v.toLocaleString('cs-CZ', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    if (reduce) return (el.textContent = fmt(to));
    const t0 = performance.now(), dur = 1700;
    const step = now => {
      const k = clamp((now - t0) / dur), eased = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(to * eased);
      if (k < 1) requestAnimationFrame(step);
    };
    el.textContent = fmt(0);
    requestAnimationFrame(step);
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* ── Rozsvěcení slov: obalit každé slovo ── */
  const words = $('#words');
  let wordEls = [];
  if (words) {
    const wrap = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(t => {
            if (!t) return;
            if (/^\s+$/.test(t)) return frag.append(t);
            const s = document.createElement('span'); s.className = 'w'; s.textContent = t; frag.append(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) wrap(n);
      });
    };
    wrap(words);
    wordEls = $$('.w', words);
  }

  /* ── Výběr kontejneru ── */
  const sizes = {
    3: { s: .62, t: 'Menší úklid, vyklízení garáže nebo sklepa, odpad z rekonstrukce koupelny.' },
    5: { s: .76, t: 'Rekonstrukce bytu nebo koupelny, vyklízení sklepa či půdy, menší bourací práce.' },
    7: { s: .88, t: 'Větší rekonstrukce domu, suť z bourání příček, zemina z menších výkopů.' },
    10: { s: 1, t: 'Stavba nebo demolice, objemný stavební odpad, rozsáhlé vyklízení.' }
  };
  const svg = $('#contSvg'), fade = $('#contFade');
  const pick = btn => {
    const v = btn.dataset.size, d = sizes[v];
    $$('.size').forEach(b => b.setAttribute('aria-selected', b === btn));
    svg.style.setProperty('--s', d.s);
    $('#contLabel').textContent = v;
    fade.classList.add('swap');
    setTimeout(() => {
      $('#contTitle').textContent = `Kontejner ${v} m³`;
      $('#contText').textContent = d.t;
      const b = $('#contBtn');
      b.dataset.service = `Kontejner ${v} m³`;
      b.firstChild.textContent = `Objednat kontejner ${v} m³`;
      fade.classList.remove('swap');
    }, reduce ? 0 : 200);
  };
  $$('.size').forEach(b => b.addEventListener('click', () => pick(b)));
  if (svg) svg.style.setProperty('--s', sizes[5].s);

  /* ── Předvyplnění formuláře podle tlačítka ── */
  const form = $('#poptavka'), sel = $('#qf-service'), src = $('#qf-src');
  $$('[data-service], [data-src]').forEach(a => a.addEventListener('click', () => {
    if (a.dataset.service) {
      sel.value = a.dataset.service;
      form.classList.remove('flash'); void form.offsetWidth; form.classList.add('flash');
    }
    if (a.dataset.src) src.value = a.dataset.src;
  }));
  const next = form.querySelector('input[name="_next"]');
  next.value = new URL('dekujeme.html', location.href).href;
  // Předvyplnění i z URL: ?sluzba=Kontejner%205%20m³&src=facebook
  const qs = new URLSearchParams(location.search);
  if (qs.get('sluzba')) sel.value = qs.get('sluzba');
  if (qs.get('src')) src.value = qs.get('src');

  /* ── FAQ ── */
  $$('.faq__q').forEach(q => q.addEventListener('click', () => {
    const item = q.parentElement, open = !item.classList.contains('open');
    $$('.faq__item.open').forEach(o => { o.classList.remove('open'); $('.faq__q', o).setAttribute('aria-expanded', false); });
    item.classList.toggle('open', open);
    q.setAttribute('aria-expanded', open);
  }));

  /* ── Magnetické tlačítko ── */
  const mag = $('#magnet');
  if (mag && fine && !reduce) {
    addEventListener('pointermove', e => {
      const r = mag.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy);
      mag.style.transform = d < 180 ? `translate(${dx * .3}px, ${dy * .3}px)` : '';
    }, { passive: true });
  }

  /* ── Lightbox ── */
  const works = $$('.work'), lb = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
  let cur = 0, lastFocus = null;
  const show = i => {
    cur = (i + works.length) % works.length;
    const img = $('img', works[cur]);
    lbImg.src = img.src; lbImg.alt = img.alt;
    const fc = $('figcaption', works[cur]);
    lbCap.textContent = `${fc.firstElementChild.textContent} · ${fc.lastChild.textContent}`;
  };
  const openLb = i => { lastFocus = document.activeElement; show(i); lb.classList.add('open'); document.body.style.overflow = 'hidden'; $('#lbClose').focus(); };
  const closeLb = () => { lb.classList.remove('open'); document.body.style.overflow = ''; lastFocus && lastFocus.focus(); };
  works.forEach((w, i) => {
    w.addEventListener('click', () => openLb(i));
    w.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(i); } });
  });
  $('#lbClose').addEventListener('click', closeLb);
  $('#lbPrev').addEventListener('click', () => show(cur - 1));
  $('#lbNext').addEventListener('click', () => show(cur + 1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowRight') show(cur + 1);
    if (e.key === 'ArrowLeft') show(cur - 1);
  });

  /* ── Horizontální galerie (přišpendlená na desktopu) ── */
  const hs = $('#realizace'), track = $('#track'), hbar = $('#hbar');
  let distance = 0, pinned = false;
  const layoutH = () => {
    pinned = innerWidth >= 761 && !reduce;
    hs.classList.toggle('is-pinned', pinned);
    track.style.transform = '';
    if (!pinned) { hs.style.removeProperty('--h'); return; }
    distance = Math.max(0, track.scrollWidth - innerWidth);
    hs.style.setProperty('--h', innerHeight + distance + 'px');
  };
  track.addEventListener('scroll', () => {
    if (pinned) return;
    const max = track.scrollWidth - track.clientWidth;
    hbar.style.transform = `scaleX(${max > 0 ? track.scrollLeft / max : 0})`;
  }, { passive: true });

  /* ── Jeden scroll handler ── */
  const progress = $('#progress'), header = $('#header'), mbar = $('#mbar'), steps = $('#steps'), stepEls = $$('.step');
  const hero = $('#hero');
  const parallax = $$('[data-parallax]'), heroImg = $('[data-parallax-img]');
  let lastY = scrollY, ticking = false;

  function onScroll() {
    const y = scrollY, vh = innerHeight;
    progress.style.transform = `scaleX(${y / Math.max(1, document.documentElement.scrollHeight - vh)})`;
    header.classList.toggle('is-solid', y > 20);
    if (!document.body.classList.contains('menu-open')) {
      if (y > lastY && y > 300) header.classList.add('is-hidden');
      else if (y < lastY - 4) header.classList.remove('is-hidden');
    }
    lastY = y;
    mbar.classList.toggle('show', y > hero.offsetHeight * .7);

    if (reduce) {
      stepEls.forEach(s => s.classList.add('is-done'));
      return;
    }

    // parallax skvrn a fotky v heru
    if (y < hero.offsetHeight + 200) {
      parallax.forEach(el => (el.style.transform = `translate3d(0, ${y * +el.dataset.parallax * -1}px, 0)`));
      if (heroImg) heroImg.style.transform = `scale(1.08) translate3d(0, ${y * +heroImg.dataset.parallaxImg}px, 0)`;
    }

    // rozsvěcení slov
    if (wordEls.length) {
      const r = words.getBoundingClientRect();
      const p = clamp((vh * .85 - r.top) / (r.height + vh * .35));
      const n = Math.round(p * wordEls.length);
      wordEls.forEach((w, i) => w.classList.toggle('lit', i < n));
    }

    // postup: linka + aktivní krok
    if (steps) {
      const r = steps.getBoundingClientRect();
      steps.style.setProperty('--p', clamp((vh * .55 - r.top) / r.height));
      let active = -1;
      stepEls.forEach((s, i) => { if (s.getBoundingClientRect().top < vh * .6) active = i; });
      stepEls.forEach((s, i) => { s.classList.toggle('is-active', i === active); s.classList.toggle('is-done', i < active); });
    }

    // horizontální galerie
    if (pinned) {
      const r = hs.getBoundingClientRect();
      const p = clamp(-r.top / Math.max(1, r.height - vh));
      track.style.transform = `translate3d(${-p * distance}px, 0, 0)`;
      hbar.style.transform = `scaleX(${p})`;
    }
  }
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScroll(); ticking = false; });
  }, { passive: true });

  let rT;
  addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { layoutH(); onScroll(); }, 120); });
  addEventListener('load', () => { layoutH(); onScroll(); });
  layoutH();
  onScroll();
})();
