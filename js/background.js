/**
 * Paned glass — slow gradient mesh with drifting glow points
 * Simulates morning light shifting through frosted glass panes
 */
(function () {
  const canvas = document.getElementById("light-canvas");
  if (!canvas) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = canvas.getContext("2d", { alpha: false });

  const PALETTE = {
    blush: { r: 242, g: 212, b: 204 },
    ivory: { r: 245, g: 239, b: 224 },
    sky: { r: 200, g: 220, b: 232 },
    sage: { r: 200, g: 216, b: 192 },
    gold: { r: 237, g: 224, b: 176 },
    lavender: { r: 221, g: 208, b: 232 },
  };

  const BASE = { r: 168, g: 162, b: 154 };

  const glows = [
    { color: PALETTE.blush, bx: 0.22, by: 0.28, rx: 0.42, ry: 0.38, phase: 0, breathPhase: 0.4, size: 0.55 },
    { color: PALETTE.sky, bx: 0.78, by: 0.22, rx: 0.35, ry: 0.32, phase: 1.8, breathPhase: 1.2, size: 0.5 },
    { color: PALETTE.sage, bx: 0.15, by: 0.72, rx: 0.38, ry: 0.28, phase: 3.1, breathPhase: 2.0, size: 0.48 },
    { color: PALETTE.gold, bx: 0.62, by: 0.58, rx: 0.3, ry: 0.35, phase: 4.5, breathPhase: 0.8, size: 0.52 },
    { color: PALETTE.lavender, bx: 0.48, by: 0.38, rx: 0.28, ry: 0.4, phase: 2.3, breathPhase: 3.4, size: 0.45 },
    { color: PALETTE.ivory, bx: 0.85, by: 0.68, rx: 0.32, ry: 0.25, phase: 5.2, breathPhase: 1.7, size: 0.4 },
  ];

  let width = 0;
  let height = 0;
  let cursor = { x: 0.5, y: 0.5, active: false };
  let startTime = performance.now();
  let rafId = null;

  const CYCLE_MS = 26000;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function mixColor(c1, c2, t) {
    return {
      r: Math.round(lerp(c1.r, c2.r, t)),
      g: Math.round(lerp(c1.g, c2.g, t)),
      b: Math.round(lerp(c1.b, c2.b, t)),
    };
  }

  function drawStatic() {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, `rgb(${PALETTE.ivory.r}, ${PALETTE.ivory.g}, ${PALETTE.ivory.b})`);
    gradient.addColorStop(0.35, `rgb(${PALETTE.blush.r}, ${PALETTE.blush.g}, ${PALETTE.blush.b})`);
    gradient.addColorStop(0.55, `rgb(${PALETTE.sky.r}, ${PALETTE.sky.g}, ${PALETTE.sky.b})`);
    gradient.addColorStop(0.75, `rgb(${PALETTE.sage.r}, ${PALETTE.sage.g}, ${PALETTE.sage.b})`);
    gradient.addColorStop(1, `rgb(${PALETTE.lavender.r}, ${PALETTE.lavender.g}, ${PALETTE.lavender.b})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  function drawFrame(now) {
    const t = ((now - startTime) % CYCLE_MS) / CYCLE_MS;
    const angle = t * Math.PI * 2;

    ctx.fillStyle = `rgb(${BASE.r}, ${BASE.g}, ${BASE.b})`;
    ctx.fillRect(0, 0, width, height);

    const positions = glows.map((g, i) => {
      const driftX = Math.sin(angle + g.phase) * g.rx * 0.12;
      const driftY = Math.cos(angle * 0.85 + g.phase * 1.1) * g.ry * 0.1;
      let x = g.bx + driftX;
      let y = g.by + driftY;

      if (cursor.active) {
        const dx = cursor.x - x;
        const dy = cursor.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - dist * 1.8) * 0.06;
        x += dx * influence;
        y += dy * influence;
      }

      const breath = 0.6 + 0.3 * (0.5 + 0.5 * Math.sin(angle * 1.3 + g.breathPhase));
      const radius = Math.max(width, height) * g.size * (0.92 + 0.08 * Math.sin(angle + g.phase * 0.7));

      return { x: x * width, y: y * height, radius, opacity: breath, color: g.color, index: i };
    });

    ctx.globalCompositeOperation = "lighter";

    positions.forEach((p) => {
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
      const { r, g, b } = p.color;
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${p.opacity * 0.85})`);
      grad.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, ${p.opacity * 0.35})`);
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    });

    ctx.globalCompositeOperation = "source-over";

    const wash = mixColor(PALETTE.ivory, PALETTE.blush, 0.5 + 0.5 * Math.sin(angle * 0.5));
    ctx.fillStyle = `rgba(${wash.r}, ${wash.g}, ${wash.b}, 0.08)`;
    ctx.fillRect(0, 0, width, height);

    rafId = requestAnimationFrame(drawFrame);
  }

  function onPointerMove(e) {
    cursor.x = e.clientX / width;
    cursor.y = e.clientY / height;
    cursor.active = true;
  }

  function onPointerLeave() {
    cursor.active = false;
  }

  resize();
  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("pointerleave", onPointerLeave, { passive: true });

  if (prefersReducedMotion) {
    drawStatic();
  } else {
    rafId = requestAnimationFrame(drawFrame);
  }

  window.addEventListener("beforeunload", () => {
    if (rafId) cancelAnimationFrame(rafId);
  });
})();
