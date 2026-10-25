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
  let clouds = [];

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
    gradient.addColorStop(0.28, `rgba(54, 200, 210, ${opacity * 0.94})`);
    gradient.addColorStop(0.58, `rgba(139, 234, 239, ${opacity * 0.8})`);
    gradient.addColorStop(0.82, `rgba(190, 247, 250, ${opacity * 0.42})`);
    gradient.addColorStop(1, 'rgba(190, 247, 250, 0)');
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
    const intensity = Math.max(0, 1 - Math.max(0, age - 800) / 2000);
    // Broad, overlapping color clouds leave a soft particulate haze, without rings.
    clouds = clouds.filter(cloud => now - cloud.born < cloud.life);
    for (const cloud of clouds) {
      const progress = (now - cloud.born) / cloud.life;
      bloom(cloud.x, cloud.y, 110 + progress * 180, (1 - progress) ** 2 * 0.045);
    }
    if (intensity > 0) {
      const ease = 1 - Math.exp(-delta / 130);
      pointer.x += (pointer.targetX - pointer.x) * ease;
      pointer.y += (pointer.targetY - pointer.y) * ease;
      bloom(pointer.x, pointer.y, Math.min(520, width * 0.75), intensity);
    }

    if (intensity > 0 || clouds.length) wake();
  }

  function wake() {
    if (!frame && !document.hidden && !reducedMotion.matches) frame = requestAnimationFrame(draw);
  }

  function track(event) {
    const now = performance.now();
    if (now - pointer.lastSeen > 2800) {
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
      clouds.push({ x: event.clientX, y: event.clientY, born: now, life: 1500 });
      clouds = clouds.slice(-16);
      lastTrail = now;
    }
    wake();
  }, { passive: true });

  function reset() {
    cancelAnimationFrame(frame);
    frame = 0;
    clouds = [];
    pointer.lastSeen = -Infinity;
    ctx.clearRect(0, 0, width, height);
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pagehide', reset);
  document.addEventListener('visibilitychange', reset);
  reducedMotion.addEventListener('change', reset);
  resize();
})();
