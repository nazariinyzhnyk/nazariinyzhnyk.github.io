(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CAREER_START = { y: 2018, m: 3 };

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  // A cancellable timeline: cancel() fast-forwards every pending and future wait.
  function makeClock() {
    let cancelled = false;
    const pending = new Set();
    return {
      get cancelled() { return cancelled; },
      wait(ms) {
        return new Promise((resolve) => {
          if (cancelled || ms <= 0) return resolve();
          const done = () => { clearTimeout(t); pending.delete(done); resolve(); };
          const t = setTimeout(done, ms);
          pending.add(done);
        });
      },
      cancel() { cancelled = true; [...pending].forEach((f) => f()); },
    };
  }

  async function type(node, text, clock, speed = 26) {
    node.textContent = '';
    node.classList.add('typing');
    for (const ch of text) {
      if (clock.cancelled) break;
      node.textContent += ch;
      await clock.wait(speed * (0.5 + Math.random()));
    }
    node.textContent = text;
    node.classList.remove('typing');
  }

  /* ── matrix rain ──────────────────────────────────────────────── */
  (() => {
    const canvas = $('#rain');
    if (!canvas || still) return;
    const ctx = canvas.getContext('2d');
    const glyphs = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン0123456789Z:・."=*+-<>¦';
    const FS = 16;
    const css = (v) => getComputedStyle(root).getPropertyValue(v).trim();
    const color = css('--fg');
    const head = css('--white');
    let w = 0, h = 0, drops = [], last = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${FS}px ${css('--mono')}`;
      const cols = Math.ceil(w / FS);
      drops = Array.from({ length: cols }, (_, i) => drops[i] ?? -Math.random() * (h / FS) * 1.5);
    }
    function frame(t) {
      requestAnimationFrame(frame);
      if (document.hidden || t - last < 70) return;
      last = t;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.085)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < drops.length; i++) {
        const y = drops[i] * FS;
        if (y > 0) {
          ctx.fillStyle = Math.random() < 0.05 ? head : color;
          ctx.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], i * FS, y);
        }
        drops[i] += 1;
        if (y > h && Math.random() > 0.975) drops[i] = 0;
      }
    }
    resize();
    addEventListener('resize', resize);
    document.fonts?.ready.then(resize);
    requestAnimationFrame(frame);
  })();

  /* ── small live details ───────────────────────────────────────── */
  const now = new Date();
  const months = (now.getFullYear() - CAREER_START.y) * 12 + now.getMonth() - CAREER_START.m;
  const uptime = $('#uptime');
  if (uptime) {
    uptime.textContent = `${Math.floor(months / 12)}y ${months % 12}m`;
    uptime.title = 'since april 2018';
  }
  const year = $('#year');
  if (year) year.textContent = now.getFullYear();

  const clock = $('#clock');
  const fmtTime = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Prague', hour: '2-digit', minute: '2-digit', hour12: false });
  const fmtDate = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Prague', day: '2-digit', month: 'short', year: '2-digit' });
  const tick = () => {
    const d = new Date();
    if (clock) clock.textContent = `${fmtTime.format(d)} ${fmtDate.format(d).replace(/ /g, '-')}`;
  };
  tick();
  setInterval(tick, 15000);

  const dims = $('#dims');
  const term = $('#term');
  const measure = () => {
    if (!dims || !term) return;
    const probe = el('span', null, 'MMMMMMMMMM');
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
    term.append(probe);
    const cw = probe.getBoundingClientRect().width / 10;
    const lh = parseFloat(getComputedStyle(term).lineHeight) || 24;
    probe.remove();
    dims.textContent = `${Math.floor(term.clientWidth / cw)}×${Math.floor(innerHeight / lh)}`;
  };
  addEventListener('resize', measure);
  document.fonts?.ready.then(measure);
  measure();

  const realTitle = document.title;
  document.addEventListener('visibilitychange', () => {
    document.title = document.hidden ? '[1]+  Stopped   nazar' : realTitle;
  });

  /* ── tmux bar: active window ──────────────────────────────────── */
  const wins = $$('.tmux a[data-win]');
  if ('IntersectionObserver' in window && wins.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        wins.forEach((a) => a.classList.toggle('active', a.dataset.win === en.target.id));
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    $$('.block[id]').forEach((b) => io.observe(b));
  }

  /* ── intro: boot + typed commands ─────────────────────────────── */
  async function intro() {
    window.__intro = true;
    const c = makeClock();
    const skip = (e) => {
      if (e.type === 'keydown') {
        if (e.metaKey || e.ctrlKey) return;
        e.preventDefault();
      }
      c.cancel();
    };
    const evs = ['keydown', 'pointerdown', 'wheel', 'touchstart'];
    evs.forEach((t) => addEventListener(t, skip, { capture: true, passive: t !== 'keydown' }));

    const boot = $('#boot');
    if (boot) {
      boot.append(el('p', 'skip', 'press any key to skip_'));
      const lines = [
        [null, 'nazarOS 26.11-ml (tty1)'],
        [null, ' '],
        ['ok', '[  OK  ] Mounted /home/nazar'],
        ['ok', '[  OK  ] Started caffeine.service'],
        ['ok', '[  OK  ] Spawned agents (smarter & faster than yesterday)'],
        ['ok', '[  OK  ] Woke up the dog'],
        ['warn', '[ WARN ] 137 browser tabs still open'],
        ['ok', '[  OK  ] Reached target personal-page.target'],
        [null, ' '],
      ];
      for (const [cls, text] of lines) {
        boot.append(el('p', cls, text));
        await c.wait(60 + Math.random() * 110);
      }
      const login = el('p', null, 'nyzhnyk login: ');
      const who = el('span', 'ok');
      login.append(who);
      boot.append(login);
      await type(who, 'guest', c, 60);
      await c.wait(200);
      boot.append(el('p', null, ' '), el('span', 'grant', 'ACCESS GRANTED'));
      await c.wait(420);
      boot.classList.add('out');
      await c.wait(450);
      boot.remove();
    }
    try { sessionStorage.setItem('booted', '1'); } catch (e) { /* private mode */ }

    for (const block of $$('.term .block')) {
      block.classList.add('shown');
      const cmd = $('.prompt .cmd', block);
      if (cmd) {
        const text = cmd.textContent;
        await c.wait(160);
        await type(cmd, text, c, 26);
        await c.wait(110);
      }
      block.classList.add('done');
      await c.wait(160);
    }

    root.classList.remove('intro');
    evs.forEach((t) => removeEventListener(t, skip, { capture: true }));
  }

  if (root.classList.contains('intro')) intro();
  else $('#boot')?.remove();

  /* ── for the curious ──────────────────────────────────────────── */
  console.log(
    '%c\n  ▄▀▀▄ hey, fellow hacker.\n  █▄▄█ looking for the source?\n       → github.com/nazariinyzhnyk/nazariinyzhnyk.github.io\n',
    'color:#33ff77;font-family:monospace;font-size:12px'
  );
})();
