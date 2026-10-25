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
  let lastPress = -Infinity;
  let clouds = [];
  let presses = [];

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
    gradient.addColorStop(0, `rgba(30.6%, 67.4%, 74.1%, ${opacity})`);
    gradient.addColorStop(0.22, `rgba(54.1%, 85.5%, 89%, ${opacity})`);
    gradient.addColorStop(0.5, `rgba(71.8%, 95.3%, 97.7%, ${opacity})`);
    gradient.addColorStop(0.75, `rgba(71.8%, 95.3%, 97.7%, ${opacity})`);
    gradient.addColorStop(1, 'rgba(71.8%, 95.3%, 97.7%, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  function haze(x, y, radius, opacity, stretchX = 1, stretchY = 1, angle = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(stretchX, stretchY);
    bloom(0, 0, radius, opacity);
    ctx.restore();
  }

  function draw(now) {
    frame = 0;
    const delta = Math.min((now - previousTime) || 16, 48);
    previousTime = now;
    ctx.clearRect(0, 0, width, height);
    if (reducedMotion.matches || document.hidden) return;

    const age = now - pointer.lastSeen;
    const visible = Number.isFinite(pointer.lastSeen);
    let moving = false;
    const radius = Math.min(235, width * 0.43);
    // Color lingers behind the gesture and gently sinks as it diffuses.
    clouds = clouds.filter(cloud => now - cloud.born < cloud.life);
    for (const cloud of clouds) {
      const progress = (now - cloud.born) / cloud.life;
      haze(
        cloud.x + cloud.driftX * progress,
        cloud.y + cloud.driftY * progress + 55 * progress * progress,
        radius * (0.48 + progress * 0.38),
        (1 - progress) ** 2 * 0.23,
        1 + cloud.stretch * (1 - progress), 1 + progress * 0.3, cloud.angle,
      );
    }
    if (visible) {
      const dx = pointer.targetX - pointer.x;
      const dy = pointer.targetY - pointer.y;
      const distance = Math.hypot(dx, dy);
      const stretch = distance > 0.1 ? Math.min(distance / 180, 0.65) : 0;
      const angle = Math.atan2(dy, dx);
      const ease = 1 - Math.exp(-delta / 180);
      pointer.x += dx * ease;
      pointer.y += dy * ease;
      if (distance <= 0.1) {
        pointer.x = pointer.targetX;
        pointer.y = pointer.targetY;
      }
      if (age < 120 && distance > 4 && now - lastTrail > 65) {
        clouds.push({
          x: pointer.x - dx * 0.18, y: pointer.y - dy * 0.18,
          driftX: -dx * 0.16, driftY: -dy * 0.12,
          stretch, angle, born: now, life: 1700,
        });
        clouds = clouds.slice(-24);
        lastTrail = now;
      }
      const pressAge = now - lastPress;
      const compression = pressAge < 700 ? Math.sin(pressAge / 700 * Math.PI) * 0.16 : 0;
      moving = distance > 0.1 || pressAge < 700;
      haze(pointer.x, pointer.y, radius, 1,
        1 + stretch + compression, 1 - stretch * 0.2 - compression, angle);
    }

    // A click deforms the same soft color into a hanging plume: no rings or droplets.
    presses = presses.filter(press => now - press.born < 1400);
    for (const press of presses) {
      const progress = (now - press.born) / 1400;
      const flow = Math.sin(progress * Math.PI / 2);
      haze(press.x, press.y + flow * radius * 0.45,
        radius * (0.5 + flow * 0.2), (1 - progress) ** 1.5 * 0.55,
        1.18 - flow * 0.3, 0.75 + flow * 0.85);
    }
    // Keep the last rendered gradient on screen without rendering idle frames.
    if (moving || clouds.length || presses.length) wake();
  }

  function wake() {
    if (!frame && !document.hidden && !reducedMotion.matches) frame = requestAnimationFrame(draw);
  }

  function track(event) {
    const now = performance.now();
    if (!Number.isFinite(pointer.lastSeen)) {
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
    track(event);
    wake();
  }, { passive: true });

  window.addEventListener('pointerdown', event => {
    if (reducedMotion.matches || !event.isPrimary || event.button !== 0) return;
    const now = track(event);
    if (now - lastPress < 100) return;
    lastPress = now;
    presses.push({ x: event.clientX, y: event.clientY, born: now });
    presses = presses.slice(-6);
    wake();
  }, { passive: true, capture: true });

  function reset() {
    cancelAnimationFrame(frame);
    frame = 0;
    clouds = [];
    presses = [];
    lastPress = -Infinity;
    pointer.lastSeen = -Infinity;
    ctx.clearRect(0, 0, width, height);
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pagehide', reset);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else {
      wake();
    }
  });
  reducedMotion.addEventListener('change', reset);
  resize();
})();
