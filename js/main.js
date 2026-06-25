/**
 * Portfolio — shared interactions + scroll light refraction
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
  const glowPoints = document.querySelectorAll("[data-glow]");
  const root = document.documentElement;

  const lerp = (a, b, t) => a + (b - a) * t;

  const sampleTrack = (track, progress) => {
    const clamped = Math.max(0, Math.min(1, progress));
    const scaled = clamped * (track.length - 1);
    const index = Math.min(Math.floor(scaled), track.length - 2);
    const t = scaled - index;
    const from = track[index];
    const to = track[index + 1];

    return {
      shiftX: lerp(from.shiftX, to.shiftX, t),
      shiftY: lerp(from.shiftY, to.shiftY, t),
      opacity: lerp(from.opacity, to.opacity, t),
    };
  };

  /* 0% peach/gold top-heavy → 33% sage/lavender → 66% rose/mauve → 100% golden return */
  const GLOW_TRACKS = {
    peach: [
      { shiftX: 0, shiftY: 0, opacity: 0.38 },
      { shiftX: 18, shiftY: 48, opacity: 0.28 },
      { shiftX: 32, shiftY: 96, opacity: 0.22 },
      { shiftX: 8, shiftY: 24, opacity: 0.36 },
    ],
    sage: [
      { shiftX: 0, shiftY: 0, opacity: 0.18 },
      { shiftX: -12, shiftY: 36, opacity: 0.36 },
      { shiftX: 8, shiftY: 72, opacity: 0.3 },
      { shiftX: -4, shiftY: 20, opacity: 0.22 },
    ],
    gold: [
      { shiftX: 0, shiftY: 0, opacity: 0.38 },
      { shiftX: 10, shiftY: 28, opacity: 0.28 },
      { shiftX: 16, shiftY: 56, opacity: 0.24 },
      { shiftX: 6, shiftY: 12, opacity: 0.36 },
    ],
    mauve: [
      { shiftX: 0, shiftY: 0, opacity: 0.22 },
      { shiftX: -20, shiftY: 32, opacity: 0.24 },
      { shiftX: -36, shiftY: 64, opacity: 0.36 },
      { shiftX: -14, shiftY: 28, opacity: 0.26 },
    ],
    lavender: [
      { shiftX: 0, shiftY: 0, opacity: 0.16 },
      { shiftX: 28, shiftY: -24, opacity: 0.32 },
      { shiftX: 48, shiftY: 40, opacity: 0.24 },
      { shiftX: 20, shiftY: -8, opacity: 0.18 },
    ],
    blush: [
      { shiftX: 0, shiftY: 0, opacity: 0.2 },
      { shiftX: -16, shiftY: -32, opacity: 0.24 },
      { shiftX: -28, shiftY: -56, opacity: 0.34 },
      { shiftX: -10, shiftY: -20, opacity: 0.28 },
    ],
  };

  const HUE_TRACK = [
    { progress: 0, hue: 0 },
    { progress: 0.33, hue: 38 },
    { progress: 0.66, hue: 72 },
    { progress: 1, hue: 18 },
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
  };

  glowPoints.forEach((point) => {
    const id = point.getAttribute("data-glow");
    if (!id || !GLOW_TRACKS[id]) return;
    scrollState.glows[id] = {
      el: point,
      current: { shiftX: 0, shiftY: 0, opacity: 0.3 },
      target: { shiftX: 0, shiftY: 0, opacity: 0.3 },
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
  };

  const applyScrollState = () => {
    const ease = reducedMotion ? 1 : 0.06;

    scrollState.currentProgress = lerp(scrollState.currentProgress, scrollState.targetProgress, ease);
    scrollState.currentHue = lerp(scrollState.currentHue, scrollState.targetHue, ease);

    root.style.setProperty("--scroll-hue-rotate", `${scrollState.currentHue.toFixed(2)}deg`);

    Object.values(scrollState.glows).forEach((glow) => {
      glow.current.shiftX = lerp(glow.current.shiftX, glow.target.shiftX, ease);
      glow.current.shiftY = lerp(glow.current.shiftY, glow.target.shiftY, ease);
      glow.current.opacity = lerp(glow.current.opacity, glow.target.opacity, ease);

      glow.el.style.setProperty("--scroll-shift-x", `${glow.current.shiftX.toFixed(2)}px`);
      glow.el.style.setProperty("--scroll-shift-y", `${glow.current.shiftY.toFixed(2)}px`);
      glow.el.style.setProperty("--glow-scroll-opacity", glow.current.opacity.toFixed(3));
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
        const dx = (mouseX - nearest.cx) * 0.035;
        const dy = (mouseY - nearest.cy) * 0.035;
        point.style.setProperty("--glow-offset-x", `${dx}px`);
        point.style.setProperty("--glow-offset-y", `${dy}px`);
      } else {
        point.style.setProperty("--glow-offset-x", "0px");
        point.style.setProperty("--glow-offset-y", "0px");
      }
    });
  };

  if (glowPoints.length) {
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
