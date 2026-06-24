/**
 * Portfolio — interactions + scroll light refraction
 */

(function () {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    reveals.forEach((el) => observer.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const ambient = document.querySelector(".ambient-light");
  const glowPoints = document.querySelectorAll("[data-glow]");
  const refractionLayers = document.querySelectorAll("[data-refraction]");

  const lerp = (a, b, t) => a + (b - a) * t;

  const sampleTrack = (track, progress) => {
    const clamped = Math.max(0, Math.min(1, progress));
    const scaled = clamped * (track.length - 1);
    const index = Math.min(Math.floor(scaled), track.length - 2);
    const t = scaled - index;
    const from = track[index];
    const to = track[index + 1];

    const out = {};
    Object.keys(from).forEach((key) => {
      out[key] = lerp(from[key], to[key], t);
    });
    return out;
  };

  /* Scroll morphing — forms shift like light through frosted glass */
  const GLOW_TRACKS = {
    peach: [
      { shiftX: 0, shiftY: 0, scaleX: 1, scaleY: 1, rotate: 0, opacity: 0.78 },
      { shiftX: 48, shiftY: 120, scaleX: 1.18, scaleY: 0.88, rotate: 4, opacity: 0.58 },
      { shiftX: 72, shiftY: 220, scaleX: 0.92, scaleY: 1.22, rotate: -3, opacity: 0.48 },
      { shiftX: 24, shiftY: 60, scaleX: 1.08, scaleY: 1.02, rotate: 2, opacity: 0.72 },
    ],
    sage: [
      { shiftX: 0, shiftY: 0, scaleX: 1, scaleY: 1, rotate: 0, opacity: 0.42 },
      { shiftX: -36, shiftY: 90, scaleX: 1.28, scaleY: 1.1, rotate: -5, opacity: 0.72 },
      { shiftX: 24, shiftY: 180, scaleX: 1.05, scaleY: 0.95, rotate: 3, opacity: 0.62 },
      { shiftX: -12, shiftY: 48, scaleX: 1.12, scaleY: 1.04, rotate: -2, opacity: 0.5 },
    ],
    gold: [
      { shiftX: 0, shiftY: 0, scaleX: 1, scaleY: 1, rotate: 0, opacity: 0.85 },
      { shiftX: 32, shiftY: 72, scaleX: 1.15, scaleY: 0.82, rotate: 3, opacity: 0.65 },
      { shiftX: 56, shiftY: 140, scaleX: 0.88, scaleY: 1.18, rotate: -4, opacity: 0.55 },
      { shiftX: 18, shiftY: 36, scaleX: 1.1, scaleY: 0.95, rotate: 2, opacity: 0.8 },
    ],
    mauve: [
      { shiftX: 0, shiftY: 0, scaleX: 1, scaleY: 1, rotate: 0, opacity: 0.52 },
      { shiftX: -56, shiftY: 80, scaleX: 1.2, scaleY: 1.08, rotate: 5, opacity: 0.58 },
      { shiftX: -96, shiftY: 160, scaleX: 1.35, scaleY: 0.9, rotate: -6, opacity: 0.78 },
      { shiftX: -40, shiftY: 64, scaleX: 1.1, scaleY: 1.02, rotate: 3, opacity: 0.6 },
    ],
    lavender: [
      { shiftX: 0, shiftY: 0, scaleX: 1, scaleY: 1, rotate: 0, opacity: 0.38 },
      { shiftX: 64, shiftY: -48, scaleX: 1.3, scaleY: 1.15, rotate: -4, opacity: 0.68 },
      { shiftX: 110, shiftY: 72, scaleX: 0.95, scaleY: 1.25, rotate: 6, opacity: 0.52 },
      { shiftX: 44, shiftY: -20, scaleX: 1.15, scaleY: 1.05, rotate: -2, opacity: 0.42 },
    ],
    blush: [
      { shiftX: 0, shiftY: 0, scaleX: 1, scaleY: 1, rotate: 0, opacity: 0.48 },
      { shiftX: -40, shiftY: -72, scaleX: 1.12, scaleY: 1.2, rotate: 4, opacity: 0.55 },
      { shiftX: -72, shiftY: -140, scaleX: 1.28, scaleY: 0.88, rotate: -5, opacity: 0.75 },
      { shiftX: -28, shiftY: -48, scaleX: 1.06, scaleY: 1.1, rotate: 2, opacity: 0.58 },
    ],
  };

  const LAYER_TRACKS = {
    mesh: [
      { x: 0, y: 0, scaleX: 1, scaleY: 1, rotate: 0, opacity: 0.82 },
      { x: -40, y: 80, scaleX: 1.12, scaleY: 0.94, rotate: -2, opacity: 0.9 },
      { x: 30, y: 160, scaleX: 0.92, scaleY: 1.14, rotate: 3, opacity: 0.88 },
      { x: -10, y: 40, scaleX: 1.06, scaleY: 1.02, rotate: -1, opacity: 0.85 },
    ],
    bands: [
      { y: 0, scaleY: 1, skew: 0, opacity: 0.7 },
      { y: 60, scaleY: 1.18, skew: -2, opacity: 0.82 },
      { y: 130, scaleY: 0.88, skew: 3, opacity: 0.78 },
      { y: 30, scaleY: 1.05, skew: -1, opacity: 0.74 },
    ],
    columns: [
      { x: 0, y: 0, scaleX: 1, scaleY: 1, rotate: 0, opacity: 0.75 },
      { x: 80, y: -40, scaleX: 1.22, scaleY: 1.08, rotate: 3, opacity: 0.88 },
      { x: -60, y: 90, scaleX: 0.9, scaleY: 1.2, rotate: -4, opacity: 0.92 },
      { x: 30, y: 20, scaleX: 1.1, scaleY: 0.95, rotate: 2, opacity: 0.8 },
    ],
    shimmer: [
      { x: 0, y: 0, scale: 1, opacity: 0.45 },
      { x: 50, y: 30, scale: 1.08, opacity: 0.58 },
      { x: -40, y: 70, scale: 0.95, opacity: 0.62 },
      { x: 20, y: 15, scale: 1.04, opacity: 0.5 },
    ],
  };

  const HUE_TRACK = [
    { progress: 0, hue: 0 },
    { progress: 0.33, hue: 42 },
    { progress: 0.66, hue: 78 },
    { progress: 1, hue: 22 },
  ];

  const sampleHue = (progress) => {
    const clamped = Math.max(0, Math.min(1, progress));
    let from = HUE_TRACK[0];
    let to = HUE_TRACK[HUE_TRACK.length - 1];

    for (let i = 0; i < HUE_TRACK.length - 1; i += 1) {
      if (clamped >= HUE_TRACK[i].progress && clamped <= HUE_TRACK[i + 1].progress) {
        from = HUE_TRACK[i];
        to = HUE_TRACK[i + 1];
        break;
      }
    }

    const range = to.progress - from.progress || 1;
    const t = (clamped - from.progress) / range;
    return lerp(from.hue, to.hue, t);
  };

  const scrollState = {
    targetProgress: 0,
    currentProgress: 0,
    targetHue: 0,
    currentHue: 0,
    glows: {},
    layers: {},
  };

  glowPoints.forEach((point) => {
    const id = point.getAttribute("data-glow");
    if (!id || !GLOW_TRACKS[id]) return;
    scrollState.glows[id] = {
      el: point,
      current: { shiftX: 0, shiftY: 0, scaleX: 1, scaleY: 1, rotate: 0, opacity: 0.65 },
      target: { shiftX: 0, shiftY: 0, scaleX: 1, scaleY: 1, rotate: 0, opacity: 0.65 },
    };
  });

  refractionLayers.forEach((layer) => {
    const id = layer.getAttribute("data-refraction");
    if (!id || !LAYER_TRACKS[id]) return;
    const defaults = LAYER_TRACKS[id][0];
    scrollState.layers[id] = {
      el: layer,
      current: { ...defaults },
      target: { ...defaults },
    };
  });

  const getScrollProgress = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) return 0;
    return window.scrollY / maxScroll;
  };

  const updateScrollTargets = () => {
    const progress = getScrollProgress();
    scrollState.targetProgress = progress;
    scrollState.targetHue = sampleHue(progress);

    Object.entries(scrollState.glows).forEach(([id, glow]) => {
      glow.target = sampleTrack(GLOW_TRACKS[id], progress);
    });

    Object.entries(scrollState.layers).forEach(([id, layer]) => {
      layer.target = sampleTrack(LAYER_TRACKS[id], progress);
    });
  };

  const applyLayer = (layer, current) => {
    const { el } = layer;
    const id = el.getAttribute("data-refraction");

    if (id === "mesh") {
      el.style.setProperty("--mesh-x", `${current.x.toFixed(1)}px`);
      el.style.setProperty("--mesh-y", `${current.y.toFixed(1)}px`);
      el.style.setProperty("--mesh-scale-x", current.scaleX.toFixed(3));
      el.style.setProperty("--mesh-scale-y", current.scaleY.toFixed(3));
      el.style.setProperty("--mesh-rotate", `${current.rotate.toFixed(2)}deg`);
      el.style.setProperty("--mesh-opacity", current.opacity.toFixed(3));
    } else if (id === "bands") {
      el.style.setProperty("--bands-y", `${current.y.toFixed(1)}px`);
      el.style.setProperty("--bands-scale-y", current.scaleY.toFixed(3));
      el.style.setProperty("--bands-skew", `${current.skew.toFixed(2)}deg`);
      el.style.setProperty("--bands-opacity", current.opacity.toFixed(3));
    } else if (id === "columns") {
      el.style.setProperty("--columns-x", `${current.x.toFixed(1)}px`);
      el.style.setProperty("--columns-y", `${current.y.toFixed(1)}px`);
      el.style.setProperty("--columns-scale-x", current.scaleX.toFixed(3));
      el.style.setProperty("--columns-scale-y", current.scaleY.toFixed(3));
      el.style.setProperty("--columns-rotate", `${current.rotate.toFixed(2)}deg`);
      el.style.setProperty("--columns-opacity", current.opacity.toFixed(3));
    } else if (id === "shimmer") {
      el.style.setProperty("--shimmer-x", `${current.x.toFixed(1)}px`);
      el.style.setProperty("--shimmer-y", `${current.y.toFixed(1)}px`);
      el.style.setProperty("--shimmer-scale", current.scale.toFixed(3));
      el.style.setProperty("--shimmer-opacity", current.opacity.toFixed(3));
    }
  };

  const applyScrollState = () => {
    const ease = reducedMotion ? 1 : 0.08;

    scrollState.currentHue = lerp(scrollState.currentHue, scrollState.targetHue, ease);
    root.style.setProperty("--scroll-hue-rotate", `${scrollState.currentHue.toFixed(2)}deg`);

    Object.values(scrollState.glows).forEach((glow) => {
      const c = glow.current;
      const t = glow.target;

      c.shiftX = lerp(c.shiftX, t.shiftX, ease);
      c.shiftY = lerp(c.shiftY, t.shiftY, ease);
      c.scaleX = lerp(c.scaleX, t.scaleX, ease);
      c.scaleY = lerp(c.scaleY, t.scaleY, ease);
      c.rotate = lerp(c.rotate, t.rotate, ease);
      c.opacity = lerp(c.opacity, t.opacity, ease);

      glow.el.style.setProperty("--scroll-shift-x", `${c.shiftX.toFixed(1)}px`);
      glow.el.style.setProperty("--scroll-shift-y", `${c.shiftY.toFixed(1)}px`);
      glow.el.style.setProperty("--glow-scale-x", c.scaleX.toFixed(3));
      glow.el.style.setProperty("--glow-scale-y", c.scaleY.toFixed(3));
      glow.el.style.setProperty("--glow-rotate", `${c.rotate.toFixed(2)}deg`);
      glow.el.style.setProperty("--glow-scroll-opacity", c.opacity.toFixed(3));
    });

    Object.values(scrollState.layers).forEach((layer) => {
      const c = layer.current;
      const t = layer.target;

      Object.keys(t).forEach((key) => {
        c[key] = lerp(c[key], t[key], ease);
      });

      applyLayer(layer, c);
    });
  };

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;

  const updatePointerGlow = () => {
    if (!glowPoints.length || reducedMotion) return;

    let nearest = null;
    let minDist = Infinity;

    glowPoints.forEach((point) => {
      const rect = point.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(mouseX - cx, mouseY - cy);
      if (dist < minDist) {
        minDist = dist;
        nearest = { point, cx, cy };
      }
    });

    glowPoints.forEach((point) => {
      if (nearest && point === nearest.point) {
        const dx = (mouseX - nearest.cx) * 0.045;
        const dy = (mouseY - nearest.cy) * 0.045;
        point.style.setProperty("--glow-offset-x", `${dx}px`);
        point.style.setProperty("--glow-offset-y", `${dy}px`);
      } else {
        point.style.setProperty("--glow-offset-x", "0px");
        point.style.setProperty("--glow-offset-y", "0px");
      }
    });
  };

  if (ambient && (glowPoints.length || refractionLayers.length)) {
    updateScrollTargets();

    if (reducedMotion) {
      applyScrollState();
    } else {
      const tick = () => {
        applyScrollState();
        updatePointerGlow();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);

      window.addEventListener("scroll", updateScrollTargets, { passive: true });
      window.addEventListener("resize", updateScrollTargets, { passive: true });
      window.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
      }, { passive: true });
    }
  }
})();
