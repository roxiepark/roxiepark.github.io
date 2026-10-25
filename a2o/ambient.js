(() => {
  const canvas = document.querySelector('.water-atmosphere');
  const ctx = canvas?.getContext('2d');
  if (!ctx) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, lastSeen: -Infinity };
  let width = 0;
  let height = 0;
  let frame = 0;
  let previousTime = 0;
  let lastTrail = 0;
  let lastBurst = 0;
  let waves = [];
  let drops = [];

  function resize() {
    width = innerWidth;
    height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    wake();
  }

  // Radial color dissolves into the white page, with no hard outer edge.
  function bloom(x, y, radius, opacity) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(0, 173, 190, ${opacity})`);
    gradient.addColorStop(0.3, `rgba(54, 200, 210, ${opacity * 0.8})`);
    gradient.addColorStop(0.65, `rgba(139, 234, 239, ${opacity * 0.45})`);
    gradient.addColorStop(1, 'rgba(190, 247, 250, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  function ring(x, y, radius, opacity, thickness) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(100, 222, 231, 0)');
    gradient.addColorStop(Math.max(0, 1 - thickness), 'rgba(100, 222, 231, 0)');
    gradient.addColorStop(1 - thickness * 0.45, `rgba(37, 190, 205, ${opacity})`);
    gradient.addColorStop(1, 'rgba(171, 243, 247, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  function draw(now) {
    frame = 0;
    const delta = Math.min((now - previousTime) || 16, 48);
    previousTime = now;
    ctx.clearRect(0, 0, width, height);
    if (reducedMotion.matches || document.hidden) return;

    const age = now - pointer.lastSeen;
    const intensity = Math.max(0, 1 - Math.max(0, age - 200) / 1700);
    if (intensity > 0) {
      const ease = 1 - Math.exp(-delta / 130);
      pointer.x += (pointer.targetX - pointer.x) * ease;
      pointer.y += (pointer.targetY - pointer.y) * ease;
      bloom(pointer.x, pointer.y, Math.min(360, width * 0.65), intensity * 0.4);
    }

    waves = waves.filter(wave => now - wave.born < wave.life);
    for (const wave of waves) {
      const progress = (now - wave.born) / wave.life;
      const spread = 1 - (1 - progress) ** 2;
      const radius = 20 + spread * wave.size;
      const fade = (1 - progress) ** 2;
      bloom(wave.x, wave.y, radius, fade * (wave.burst ? 0.2 : 0.08));
      ring(wave.x, wave.y, radius, Math.sin(progress * Math.PI) * fade * (wave.burst ? 0.6 : 0.24), wave.burst ? 0.24 : 0.38);
      if (wave.burst) ring(wave.x, wave.y, radius * 0.72, fade * 0.22, 0.22);
    }

    drops = drops.filter(drop => now - drop.born < drop.life);
    for (const drop of drops) {
      const progress = (now - drop.born) / drop.life;
      const distance = drop.speed * (1 - (1 - progress) ** 3);
      const x = drop.x + Math.cos(drop.angle) * distance;
      const y = drop.y + Math.sin(drop.angle) * distance + progress * progress * 28;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(drop.angle);
      ctx.scale(1.45, 0.8);
      bloom(0, 0, drop.size * (1 - progress * 0.6), (1 - progress) ** 2 * 0.7);
      ctx.restore();
    }
    if (intensity > 0 || waves.length || drops.length) wake();
  }

  function wake() {
    if (!frame && !document.hidden && !reducedMotion.matches) frame = requestAnimationFrame(draw);
  }

  function track(event) {
    const now = performance.now();
    if (now - pointer.lastSeen > 1900) {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    }
    pointer.targetX = event.clientX;
    pointer.targetY = event.clientY;
    pointer.lastSeen = now;
    return now;
  }

  window.addEventListener('pointermove', event => {
    if (reducedMotion.matches || event.pointerType === 'touch') return;
    const now = track(event);
    if (now - lastTrail > 110) {
      waves.push({ x: event.clientX, y: event.clientY, born: now, life: 1500, size: 180, burst: false });
      waves = waves.slice(-24);
      lastTrail = now;
    }
    wake();
  }, { passive: true });

  window.addEventListener('pointerdown', event => {
    if (reducedMotion.matches || !event.isPrimary || event.button !== 0) return;
    const now = track(event);
    if (now - lastBurst < 80) return;
    lastBurst = now;
    waves.push({ x: event.clientX, y: event.clientY, born: now, life: 1800, size: Math.min(360, width * 0.65), burst: true });
    waves = waves.slice(-24);
    for (let i = 0; i < 14; i += 1) {
      drops.push({
        x: event.clientX, y: event.clientY, born: now,
        angle: (i / 14) * Math.PI * 2 + Math.random() * 0.2,
        speed: 60 + Math.random() * 115, size: 6 + Math.random() * 9,
        life: 650 + Math.random() * 450,
      });
    }
    drops = drops.slice(-70);
    wake();
  }, { passive: true, capture: true });

  function reset() {
    cancelAnimationFrame(frame);
    frame = 0;
    waves = [];
    drops = [];
    pointer.lastSeen = -Infinity;
    ctx.clearRect(0, 0, width, height);
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pagehide', reset);
  document.addEventListener('visibilitychange', reset);
  reducedMotion.addEventListener('change', reset);
  resize();
})();
