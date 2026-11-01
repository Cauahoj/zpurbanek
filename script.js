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

  /* ── Neustále běžící animace: pauza mimo obrazovku a během scrollu ──
     Psací stroj mění text každých ~50 ms a tím nutí prohlížeč přepočítat rozložení stránky.
     Při scrollu na mobilu to způsobovalo drobné záseky, proto se během pohybu nepíše. */
  let scrolling = false, scrollT;
  addEventListener('scroll', () => {
    scrolling = true;
    clearTimeout(scrollT);
    scrollT = setTimeout(() => (scrolling = false), 350);
  }, { passive: true });
  const visible = new WeakMap();
  const visIO = new IntersectionObserver(es => es.forEach(e => {
    visible.set(e.target, e.isIntersecting);
    e.target.classList.toggle('is-off', !e.isIntersecting);
  }));
  $$('#hero, .marquee').forEach(el => visIO.observe(el));

  /* ── Psací stroj ── */
  const typed = $('#typed');
  const phrases = ['výkop pro základy', 'kontejner na suť', 'zbourat stodolu', 'příjezdovou cestu', 'srovnat pozemek', 'navézt štěrk'];
  if (typed && !reduce) {
    let p = 0, i = phrases[0].length, del = true;
    const tick = () => {
      if (scrolling || visible.get($('#hero')) === false) return setTimeout(tick, 400);
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
  // L = délka, H = výška v px (viewBox 420×290); 3 m³ je nízká suťová vana se šikmými čely
  const sizes = {
    3: { L: 250, H: 46, trough: true, t: 'Menší úklid, vyklízení garáže nebo sklepa, odpad z rekonstrukce koupelny.' },
    5: { L: 290, H: 84, t: 'Rekonstrukce bytu nebo koupelny, vyklízení sklepa či půdy, menší bourací práce.' },
    7: { L: 320, H: 114, t: 'Větší rekonstrukce domu, suť z bourání příček, zemina z menších výkopů.' },
    10: { L: 350, H: 150, t: 'Stavba nebo demolice, objemný stavební odpad, rozsáhlé vyklízení.' }
  };
  const ink = '#111', yel = '#F5C100', yel2 = '#D9A600';
  const drawCont = (v, { L, H, trough }) => {
    const G = 272, cx = 210, x0 = cx - L / 2, x1 = cx + L / 2, bot = G - 16, top = bot - H;
    const ins = trough ? 22 : 0, f = (H - 9) / H;
    let s = `<ellipse cx="${cx}" cy="${G + 3}" rx="${L / 2 + 12}" ry="7" fill="rgba(0,0,0,.35)"/>`;
    // podvozek (ližiny + kladky)
    s += `<rect x="${x0 + 14}" y="${bot}" width="${L - 28}" height="9" rx="2" fill="${ink}"/>`;
    s += `<circle cx="${x0 + 22}" cy="${G - 6}" r="6" fill="${ink}"/><circle cx="${x1 - 22}" cy="${G - 6}" r="6" fill="${ink}"/>`;
    // tělo + spodní pás
    s += `<path d="M${x0} ${top}H${x1}L${x1 - ins} ${bot}H${x0 + ins}Z" fill="${yel}"/>`;
    s += `<path d="M${x0 + ins * f} ${bot - 9}H${x1 - ins * f}L${x1 - ins} ${bot}H${x0 + ins}Z" fill="${yel2}"/>`;
    // svislá žebra
    const n = Math.round(L / (trough ? 60 : 40));
    for (let i = 1; i < n; i++) {
      const x = x0 + (L * i) / n;
      s += `<path d="M${x} ${top + 6}V${bot - 9}" stroke="rgba(0,0,0,.26)" stroke-width="3"/>`;
    }
    s += `<path d="M${x0} ${top}H${x1}L${x1 - ins} ${bot}H${x0 + ins}Z" fill="none" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/>`;
    // horní lem
    s += `<rect x="${x0 - 3}" y="${top - 6}" width="${L + 6}" height="8" rx="2" fill="${ink}"/>`;
    // výstražné červenobílé pruhy v rozích
    const sh = Math.min(H * .62, 58), sw = 14, sy = bot - 9 - sh;
    s += `<rect x="${x0 + ins + 5}" y="${sy}" width="${sw}" height="${sh}" fill="url(#rw)" stroke="${ink}" stroke-width="1.5"/>`;
    s += `<rect x="${x1 - ins - 5 - sw}" y="${sy}" width="${sw}" height="${sh}" fill="url(#rw)" stroke="${ink}" stroke-width="1.5"/>`;
    // „A“ rám pro hák
    const apex = top + H * (trough ? .2 : .3), hw = Math.min(28, H * .3 + 8);
    s += `<path d="M${cx - hw} ${bot - 9}L${cx} ${apex}L${cx + hw} ${bot - 9}" fill="none" stroke="${ink}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>`;
    s += `<circle cx="${cx}" cy="${apex}" r="4.5" fill="${ink}"/>`;
    // nápis a štítek s objemem
    if (!trough) {
      const fs = Math.min(24, H * .21);
      s += `<text x="${x0 + L * .27}" y="${top + H * .44}" text-anchor="middle" font-family="Bricolage Grotesque, sans-serif" font-weight="800" font-size="${fs}" fill="${ink}" stroke="${yel}" stroke-width="6" paint-order="stroke" letter-spacing="-.5">URBÁNEK</text>`;
      s += `<rect x="${x1 - L * .27 - 24}" y="${top + H * .3 - 11}" width="48" height="20" rx="3" fill="#fff" stroke="${ink}" stroke-width="1.5"/>`;
      s += `<text x="${x1 - L * .27}" y="${top + H * .3 + 4}" text-anchor="middle" font-family="DM Sans, sans-serif" font-weight="700" font-size="12" fill="${ink}">${v} m³</text>`;
    }
    return `<g class="cg" data-size="${v}">${s}</g>`;
  };
  const svg = $('#contSvg'), fade = $('#contFade');
  if (svg) svg.insertAdjacentHTML('beforeend', Object.entries(sizes).map(([v, d]) => drawCont(v, d)).join(''));
  const showCont = v => $$('.cg', svg).forEach(g => g.classList.toggle('on', g.dataset.size === String(v)));
  const pick = btn => {
    const v = btn.dataset.size, d = sizes[v];
    $$('.size').forEach(b => b.setAttribute('aria-selected', b === btn));
    showCont(v);
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
  if (svg) showCont(5);

  /* ── Předvyplnění formuláře podle tlačítka ── */
  const form = $('#poptavka'), sel = $('#qf-service'), src = $('#qf-src'), mail = $('#ctaMail');
  $$('[data-service], [data-src]').forEach(a => a.addEventListener('click', () => {
    if (a.dataset.service) {
      sel.value = a.dataset.service;
      mail.href = `mailto:zpurbanek@seznam.cz?subject=${encodeURIComponent('Poptávka: ' + a.dataset.service)}`;
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

  /* ── Galerie realizací: při scrollu stránky jemně ujíždí do strany, šipkami se dá projít celá ── */
  const hs = $('#realizace'), track = $('#track'), hbar = $('#hbar'), view = track.parentElement;
  const prevB = $('#hsPrev'), nextB = $('#hsNext');
  const DRIFT = .45; // jakou část galerie ujede sama během průjezdu sekce oknem
  let drift = false, distance = 0, hManual = 0, hCur = 0, hTarget = 0, hRaf = 0;
  let hRect = () => hs.getBoundingClientRect(); // po prvním měření se nahradí výpočtem z uložených rozměrů
  // posun daný polohou sekce v okně (0 = sekce vjíždí zdola, 1 = odjíždí nahoře)
  const hAuto = () => {
    const r = hRect();
    return clamp((innerHeight - r.top) / (innerHeight + r.height)) * distance * DRIFT;
  };
  const hUI = (off, max) => {
    hbar.style.transform = `scaleX(${max > 0 ? off / max : 0})`;
    prevB.disabled = off <= 2;
    nextB.disabled = off >= max - 2;
  };
  // plynulé dojíždění k cíli (lerp), ať pohyb působí měkce i při trhaném kolečku
  const hAnimate = () => {
    hCur += (hTarget - hCur) * .1;
    if (Math.abs(hTarget - hCur) < .4) hCur = hTarget;
    track.style.transform = `translate3d(${-hCur}px, 0, 0)`;
    hUI(hCur, distance);
    hRaf = hCur !== hTarget ? requestAnimationFrame(hAnimate) : 0;
  };
  const hSet = () => {
    hTarget = clamp(hAuto() + hManual, 0, distance);
    if (!hRaf) hRaf = requestAnimationFrame(hAnimate);
  };
  const layoutH = () => {
    drift = innerWidth >= 761 && !reduce;
    hs.classList.toggle('is-drift', drift);
    track.style.transform = '';
    if (!drift) return hUI(track.scrollLeft, track.scrollWidth - track.clientWidth);
    track.scrollLeft = 0;
    distance = Math.max(0, track.scrollWidth - view.clientWidth);
    hCur = hTarget = clamp(hAuto() + hManual, 0, distance);
    track.style.transform = `translate3d(${-hCur}px, 0, 0)`;
    hUI(hCur, distance);
  };
  const hStep = () => Math.min(view.clientWidth * .8, ($('.work', track).offsetWidth + 18) * 2);
  const hMove = dir => {
    if (!drift) return track.scrollBy({ left: dir * hStep(), behavior: reduce ? 'auto' : 'smooth' });
    hManual = clamp(hTarget + dir * hStep(), 0, distance) - hAuto();
    hSet();
  };
  prevB.addEventListener('click', () => hMove(-1));
  nextB.addEventListener('click', () => hMove(1));
  track.addEventListener('scroll', () => { if (!drift) hUI(track.scrollLeft, track.scrollWidth - track.clientWidth); }, { passive: true });
  // vodorovné gesto na touchpadu (nebo Shift + kolečko) posouvá jen galerii
  view.addEventListener('wheel', e => {
    const dx = e.deltaX || (e.shiftKey ? e.deltaY : 0);
    if (!drift || !dx || Math.abs(dx) < Math.abs(e.shiftKey ? 0 : e.deltaY)) return;
    e.preventDefault();
    hManual = clamp(hTarget + dx, 0, distance) - hAuto();
    hSet();
  }, { passive: false });

  /* ── Jeden scroll handler ── */
  const progress = $('#progress'), header = $('#header'), mbar = $('#mbar'), steps = $('#steps'), stepEls = $$('.step');
  const hero = $('#hero');
  const parallax = fine ? $$('[data-parallax]') : [], heroImg = fine ? $('[data-parallax-img]') : null;
  let lastY = scrollY, ticking = false;

  // Rozměry se měří jen při načtení a změně velikosti okna. Při scrollu se už nic neměří,
  // jen se počítá ze scrollY – žádné vynucené přepočítávání layoutu (to dělalo mikrozáseky na mobilu).
  const absTop = el => el.getBoundingClientRect().top + scrollY;
  let M = {};
  const measure = () => {
    M = {
      vh: innerHeight,
      maxY: Math.max(1, document.documentElement.scrollHeight - innerHeight),
      heroH: hero.offsetHeight,
      wordsTop: words ? absTop(words) : 0, wordsH: words ? words.offsetHeight : 0,
      stepsTop: steps ? absTop(steps) : 0, stepsH: steps ? steps.offsetHeight : 0,
      stepTops: stepEls.map(absTop),
      hsTop: absTop(hs), hsH: hs.offsetHeight
    };
  };
  hRect = () => ({ top: M.hsTop - scrollY, height: M.hsH });
  let lastN = -1, lastActive = -2, solid = null, mshow = null;

  function onScroll() {
    const y = scrollY, vh = M.vh;
    progress.style.transform = `scaleX(${y / M.maxY})`;
    if (solid !== (y > 20)) header.classList.toggle('is-solid', (solid = y > 20));
    if (!document.body.classList.contains('menu-open')) {
      if (y > lastY && y > 300) header.classList.add('is-hidden');
      else if (y < lastY - 4) header.classList.remove('is-hidden');
    }
    lastY = y;
    if (mshow !== (y > M.heroH * .7)) mbar.classList.toggle('show', (mshow = y > M.heroH * .7));

    if (reduce) {
      stepEls.forEach(s => s.classList.add('is-done'));
      return;
    }

    // parallax skvrn a fotky v heru (jen myš – na dotyku zbytečně zatěžuje)
    if (y < M.heroH + 200) {
      parallax.forEach(el => (el.style.transform = `translate3d(0, ${y * +el.dataset.parallax * -1}px, 0)`));
      if (heroImg) heroImg.style.transform = `scale(1.08) translate3d(0, ${y * +heroImg.dataset.parallaxImg}px, 0)`;
    }

    // rozsvěcení slov – třídy se mění jen když se posune hranice
    if (wordEls.length) {
      const top = M.wordsTop - y;
      const n = Math.round(clamp((vh * .85 - top) / (M.wordsH + vh * .35)) * wordEls.length);
      if (n !== lastN) {
        const from = Math.min(n, Math.max(lastN, 0)), to = Math.max(n, lastN);
        for (let i = from; i < to && i < wordEls.length; i++) wordEls[i].classList.toggle('lit', i < n);
        if (lastN < 0) wordEls.forEach((w, i) => w.classList.toggle('lit', i < n));
        lastN = n;
      }
    }

    // postup: linka + aktivní krok
    if (steps) {
      steps.style.setProperty('--p', clamp((vh * .55 - (M.stepsTop - y)) / M.stepsH));
      let active = -1;
      M.stepTops.forEach((t, i) => { if (t - y < vh * .6) active = i; });
      if (active !== lastActive) {
        stepEls.forEach((s, i) => { s.classList.toggle('is-active', i === active); s.classList.toggle('is-done', i < active); });
        lastActive = active;
      }
    }

    // galerie realizací
    if (drift) hSet();
  }
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScroll(); ticking = false; });
  }, { passive: true });

  // Na mobilu se „resize“ spouští i schováním lišty prohlížeče – přeměřujeme jen při změně šířky
  // nebo větší změně výšky, ať to neruší plynulý scroll.
  let rT, lastW = innerWidth, lastH = innerHeight;
  addEventListener('resize', () => {
    clearTimeout(rT);
    rT = setTimeout(() => {
      const wChanged = innerWidth !== lastW, bigH = Math.abs(innerHeight - lastH) > 160;
      lastW = innerWidth; lastH = innerHeight;
      if (!wChanged && !bigH && !fine) { M.vh = innerHeight; M.maxY = Math.max(1, document.documentElement.scrollHeight - innerHeight); return; }
      layoutH(); measure(); onScroll();
    }, 150);
  });
  addEventListener('load', () => { layoutH(); measure(); onScroll(); });
  // fonty, FAQ nebo výběr kontejneru mění výšku stránky – pak přeměřit (scroll výšku body nemění)
  let roT = 0;
  if ('ResizeObserver' in window) new ResizeObserver(() => {
    cancelAnimationFrame(roT);
    roT = requestAnimationFrame(() => { measure(); onScroll(); });
  }).observe(document.body);
  layoutH();
  measure();
  onScroll();
})();
