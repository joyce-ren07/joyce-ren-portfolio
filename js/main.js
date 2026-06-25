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

  /* --------------------------------------------------------------------------
     Lamp landing — scroll lights the pendant
     -------------------------------------------------------------------------- */

  const lampLanding = document.querySelector(".lamp-landing");
  const lampPull = document.getElementById("lamp-pull");
  const lightStreaks = document.querySelector(".light-streaks");
  const lampState = { targetPower: 0, currentPower: 0 };

  const getLampScrollPower = () => {
    if (!lampLanding) return 0;
    const scrollRange = lampLanding.offsetHeight - window.innerHeight;
    if (scrollRange <= 0) return 0;
    return Math.min(1, Math.max(0, window.scrollY / (scrollRange * 0.88)));
  };

  const updateLampTargets = () => {
    lampState.targetPower = getLampScrollPower();
  };

  const applyLampPower = () => {
    const ease = reducedMotion ? 1 : 0.07;
    lampState.currentPower = lerp(lampState.currentPower, lampState.targetPower, ease);
    const power = lampState.currentPower;

    root.style.setProperty("--lamp-power", power.toFixed(3));
    root.style.setProperty("--light-intensity", lerp(0.2, 1.12, power).toFixed(3));
    document.body.classList.toggle("lamp-is-lit", power > 0.1);

    if (glowPoints.length) {
      const lampX = 50;
      const lampY = 36;
      const offsets = { gold: 0, peach: 48, sage: 102, mauve: 158, lavender: 214, blush: 268 };
      const weights = { gold: 1, peach: 0.86, sage: 0.78, mauve: 0.82, lavender: 0.74, blush: 0.78 };
      const spread = 46 * (1 - power * 0.55);

      glowPoints.forEach((point) => {
        const id = point.getAttribute("data-glow");
        if (!id) return;
        const angle = ((150 + (offsets[id] ?? 0)) * Math.PI) / 180;
        const weight = weights[id] ?? 0.7;
        const farX = 50 + Math.sin(angle) * spread * weight;
        const farY = 50 - Math.cos(angle) * 40 * weight;
        const x = lerp(farX, lampX + Math.sin(angle) * 8, power);
        const y = lerp(farY, lampY + Math.cos(angle) * 4, power);
        point.style.setProperty("--light-pos-x", `${x.toFixed(2)}%`);
        point.style.setProperty("--light-pos-y", `${y.toFixed(2)}%`);
      });

      if (lightStreaks) {
        const t = performance.now() * 0.001;
        const autoX = Math.sin(t * 0.13) * 26 * power + Math.sin(t * 0.21 + 1.8) * 14 * power;
        const autoY = Math.cos(t * 0.1 + 0.6) * 18 * power + Math.sin(t * 0.16 + 2.4) * 11 * power;
        const shiftX = (lampX - 50) * (window.innerWidth * 0.01) * power + autoX;
        const shiftY = (lampY - 50) * (window.innerHeight * 0.01) * power + autoY;
        lightStreaks.style.setProperty("--streak-shift-x", `${shiftX.toFixed(2)}px`);
        lightStreaks.style.setProperty("--streak-shift-y", `${shiftY.toFixed(2)}px`);
      }
    }
  };

  if (lampLanding) {
    updateLampTargets();
    applyLampPower();

    window.addEventListener("scroll", updateLampTargets, { passive: true });
    window.addEventListener("resize", updateLampTargets, { passive: true });

    if (!reducedMotion) {
      const lampTick = () => {
        applyLampPower();
        requestAnimationFrame(lampTick);
      };
      requestAnimationFrame(lampTick);
    }

    if (lampPull) {
      lampPull.addEventListener("click", () => {
        lampPull.classList.add("is-pulled");
        const scrollRange = lampLanding.offsetHeight - window.innerHeight;
        window.scrollTo({
          top: Math.max(0, scrollRange * 0.58),
          behavior: reducedMotion ? "auto" : "smooth",
        });
        window.setTimeout(() => lampPull.classList.remove("is-pulled"), 450);
      });
    }
  }

  const initDefaultGlowPositions = () => {
    const ANCHOR_RADIUS_X = 46;
    const ANCHOR_RADIUS_Y = 40;
    const startAngle = 150;
    const offsets = {
      gold: 0,
      peach: 48,
      sage: 102,
      mauve: 158,
      lavender: 214,
      blush: 268,
    };
    const weights = {
      gold: 1,
      peach: 0.86,
      sage: 0.78,
      mauve: 0.82,
      lavender: 0.74,
      blush: 0.78,
    };

    glowPoints.forEach((point) => {
      const id = point.getAttribute("data-glow");
      if (!id) return;
      const angle = ((startAngle + (offsets[id] ?? 0)) * Math.PI) / 180;
      const weight = weights[id] ?? 0.7;
      const x = 50 + Math.sin(angle) * ANCHOR_RADIUS_X * weight;
      const y = 50 - Math.cos(angle) * ANCHOR_RADIUS_Y * weight;
      point.style.setProperty("--light-pos-x", `${x.toFixed(2)}%`);
      point.style.setProperty("--light-pos-y", `${y.toFixed(2)}%`);
    });
  };

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
      { shiftX: 0, shiftY: 0, opacity: 0.52 },
      { shiftX: 18, shiftY: 48, opacity: 0.4 },
      { shiftX: 32, shiftY: 96, opacity: 0.34 },
      { shiftX: 8, shiftY: 24, opacity: 0.5 },
    ],
    sage: [
      { shiftX: 0, shiftY: 0, opacity: 0.28 },
      { shiftX: -12, shiftY: 36, opacity: 0.48 },
      { shiftX: 8, shiftY: 72, opacity: 0.42 },
      { shiftX: -4, shiftY: 20, opacity: 0.32 },
    ],
    gold: [
      { shiftX: 0, shiftY: 0, opacity: 0.56 },
      { shiftX: 10, shiftY: 28, opacity: 0.42 },
      { shiftX: 16, shiftY: 56, opacity: 0.38 },
      { shiftX: 6, shiftY: 12, opacity: 0.54 },
    ],
    mauve: [
      { shiftX: 0, shiftY: 0, opacity: 0.34 },
      { shiftX: -20, shiftY: 32, opacity: 0.38 },
      { shiftX: -36, shiftY: 64, opacity: 0.5 },
      { shiftX: -14, shiftY: 28, opacity: 0.4 },
    ],
    lavender: [
      { shiftX: 0, shiftY: 0, opacity: 0.26 },
      { shiftX: 28, shiftY: -24, opacity: 0.44 },
      { shiftX: 48, shiftY: 40, opacity: 0.36 },
      { shiftX: 20, shiftY: -8, opacity: 0.3 },
    ],
    blush: [
      { shiftX: 0, shiftY: 0, opacity: 0.32 },
      { shiftX: -16, shiftY: -32, opacity: 0.38 },
      { shiftX: -28, shiftY: -56, opacity: 0.48 },
      { shiftX: -10, shiftY: -20, opacity: 0.4 },
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

  let updateLightDial = () => {};

  if (glowPoints.length) {
    updateScrollTargets();

    if (reducedMotion) {
      applyScrollState();
    } else {
      const tick = () => {
        applyScrollState();
        updatePointerGlow();
        updateLightDial();
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

  /* --------------------------------------------------------------------------
     Light source dial — sun angle drives refraction zone positions
     -------------------------------------------------------------------------- */

  const lightDialRing = document.getElementById("light-dial-ring");
  const lightDialSun = document.getElementById("light-dial-sun");
  const lightDialLabel = document.getElementById("light-dial-label");
  const lightWarmthInput = document.getElementById("light-warmth");
  const lightIntensityInput = document.getElementById("light-intensity");

  if (lightDialRing && lightDialSun && glowPoints.length) {
    const DEG_PER_MS = 360 / 30000;
    const LIGHT_LERP = reducedMotion ? 1 : 0.08;
    const ANCHOR_RADIUS_X = 46;
    const ANCHOR_RADIUS_Y = 40;

    const GLOW_LIGHT_OFFSETS = {
      gold: 0,
      peach: 48,
      sage: 102,
      mauve: 158,
      lavender: 214,
      blush: 268,
    };

    const GLOW_LIGHT_WEIGHTS = {
      gold: 1,
      peach: 0.86,
      sage: 0.78,
      mauve: 0.82,
      lavender: 0.74,
      blush: 0.78,
    };

    const GLOW_PALETTES = {
      peach: {
        cool: [205, 195, 190, 0.42],
        warm: [225, 185, 165, 0.58],
      },
      sage: {
        cool: [185, 195, 205, 0.34],
        warm: [195, 200, 185, 0.46],
      },
      gold: {
        cool: [210, 215, 225, 0.44],
        warm: [235, 215, 175, 0.66],
      },
      mauve: {
        cool: [195, 190, 205, 0.32],
        warm: [210, 175, 170, 0.44],
      },
      lavender: {
        cool: [175, 185, 210, 0.28],
        warm: [185, 185, 205, 0.36],
      },
      blush: {
        cool: [205, 195, 200, 0.3],
        warm: [220, 190, 185, 0.42],
      },
    };

    const GLOW_COLOR_VARS = {
      peach: "--color-peach-blush",
      sage: "--color-sage-gray",
      gold: "--color-golden-warm",
      mauve: "--color-rose-mauve",
      lavender: "--color-lavender-gray",
      blush: "--color-blush-pink",
    };

    const lightState = {
      sunAngle: 150,
      displayAngle: 150,
      warmth: 0.72,
      intensity: 1,
      isDragging: false,
      lastTime: performance.now(),
      glows: {},
      streak: { currentX: 0, currentY: 0, targetX: 0, targetY: 0 },
    };

    glowPoints.forEach((point) => {
      const id = point.getAttribute("data-glow");
      if (!id) return;
      lightState.glows[id] = {
        el: point,
        current: { posX: 50, posY: 50 },
        target: { posX: 50, posY: 50 },
      };
    });

    const GLOW_SUN_ROTATE = {
      peach: 0.09,
      sage: -0.06,
      gold: 0.05,
      mauve: -0.08,
      lavender: 0.07,
      blush: -0.05,
    };

    const CAUSTIC_OFFSETS = [
      { angle: 2, weight: 0.46, rotate: -22, jitterX: -2.8, jitterY: 1.6, scale: 1.06 },
      { angle: -26, weight: 0.54, rotate: 32, jitterX: 2.4, jitterY: -2.6, scale: 0.9 },
      { angle: 44, weight: 0.4, rotate: -8, jitterX: -1.6, jitterY: 3, scale: 1.1 },
      { angle: 16, weight: 0.3, rotate: 18, jitterX: 3.2, jitterY: -1.4, scale: 0.86 },
    ];

    lightState.caustics = [];
    document.querySelectorAll("[data-caustic]").forEach((el, index) => {
      const config = CAUSTIC_OFFSETS[index] ?? { angle: 0, weight: 0.5, rotate: 0, jitterX: 0, jitterY: 0, scale: 1 };
      lightState.caustics.push({
        el,
        config,
        current: { posX: 50, posY: 50 },
        target: { posX: 50, posY: 50 },
      });
    });

    const normalizeAngle = (angle) => ((angle % 360) + 360) % 360;

    const angleToVector = (degrees) => {
      const rad = (degrees * Math.PI) / 180;
      return {
        x: Math.sin(rad),
        y: -Math.cos(rad),
      };
    };

    const anchorFromAngle = (degrees, weight = 1) => {
      const vec = angleToVector(degrees);
      return {
        x: 50 + vec.x * ANCHOR_RADIUS_X * weight,
        y: 50 + vec.y * ANCHOR_RADIUS_Y * weight,
      };
    };

    const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);

    const getTimeName = (angle) => {
      const a = normalizeAngle(angle);
      if (a >= 337.5 || a < 22.5) return "midday";
      if (a < 67.5) return "morning";
      if (a < 112.5) return "golden hour";
      if (a < 157.5) return "afternoon";
      if (a < 202.5) return "dusk";
      if (a < 247.5) return "evening";
      if (a < 292.5) return "golden hour";
      return "dawn";
    };

    const angleToClock = (angle) => {
      const hoursFloat = (12 + normalizeAngle(angle) / 30) % 24;
      const hours = Math.floor(hoursFloat);
      const minutes = Math.round((hoursFloat - hours) * 60) % 60;
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    };

    const mixChannel = (cool, warm, t) => Math.round(lerp(cool, warm, t));

    const applyWarmthPalette = (warmth) => {
      Object.entries(GLOW_PALETTES).forEach(([id, palette]) => {
        const r = mixChannel(palette.cool[0], palette.warm[0], warmth);
        const g = mixChannel(palette.cool[1], palette.warm[1], warmth);
        const b = mixChannel(palette.cool[2], palette.warm[2], warmth);
        const a = lerp(palette.cool[3], palette.warm[3], warmth).toFixed(3);
        root.style.setProperty(GLOW_COLOR_VARS[id], `rgba(${r}, ${g}, ${b}, ${a})`);
      });
    };

    const pointerToAngle = (clientX, clientY) => {
      const rect = lightDialRing.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
      return normalizeAngle(angle);
    };

    const computeLightTargets = (angle) => {
      root.style.setProperty("--light-angle", `${angle.toFixed(2)}deg`);
      root.style.setProperty("--light-intensity", lightState.intensity.toFixed(3));
      root.style.setProperty("--light-warmth", lightState.warmth.toFixed(3));
      applyWarmthPalette(lightState.warmth);

      Object.entries(lightState.glows).forEach(([id, glow]) => {
        const offset = GLOW_LIGHT_OFFSETS[id] ?? 0;
        const weight = GLOW_LIGHT_WEIGHTS[id] ?? 0.65;
        const anchor = anchorFromAngle(angle + offset, weight);
        glow.target.posX = anchor.x;
        glow.target.posY = anchor.y;
      });

      lightState.caustics.forEach((caustic) => {
        const anchor = anchorFromAngle(angle + caustic.config.angle, caustic.config.weight);
        caustic.target.posX = anchor.x + (caustic.config.jitterX ?? 0);
        caustic.target.posY = anchor.y + (caustic.config.jitterY ?? 0);
      });

      if (lightStreaks) {
        const streakAnchor = anchorFromAngle(angle, 0.68);
        lightState.streak.targetX = (streakAnchor.x - 50) * (window.innerWidth * 0.013);
        lightState.streak.targetY = (streakAnchor.y - 50) * (window.innerHeight * 0.01);
      }
    };

    const updateLightStreaks = (now) => {
      if (!lightStreaks) return;

      const t = now * 0.001;
      const autoX = Math.sin(t * 0.13) * 26 + Math.sin(t * 0.21 + 1.8) * 14;
      const autoY = Math.cos(t * 0.1 + 0.6) * 18 + Math.sin(t * 0.16 + 2.4) * 11;

      lightState.streak.currentX = lerp(lightState.streak.currentX, lightState.streak.targetX, 0.035);
      lightState.streak.currentY = lerp(lightState.streak.currentY, lightState.streak.targetY, 0.035);

      const shiftX = lightState.streak.currentX + (reducedMotion ? 0 : autoX);
      const shiftY = lightState.streak.currentY + (reducedMotion ? 0 : autoY);

      lightStreaks.style.setProperty("--streak-shift-x", `${shiftX.toFixed(2)}px`);
      lightStreaks.style.setProperty("--streak-shift-y", `${shiftY.toFixed(2)}px`);
    };

    const applyLightState = () => {
      Object.entries(lightState.glows).forEach(([id, glow]) => {
        glow.current.posX = lerp(glow.current.posX, glow.target.posX, LIGHT_LERP);
        glow.current.posY = lerp(glow.current.posY, glow.target.posY, LIGHT_LERP);

        glow.el.style.setProperty("--light-pos-x", `${glow.current.posX.toFixed(2)}%`);
        glow.el.style.setProperty("--light-pos-y", `${glow.current.posY.toFixed(2)}%`);
        glow.el.style.setProperty(
          "--glow-sun-rotate",
          `${((GLOW_SUN_ROTATE[id] ?? 0) * lightState.displayAngle * 0.12).toFixed(2)}deg`
        );
      });

      lightState.caustics.forEach((caustic) => {
        caustic.current.posX = lerp(caustic.current.posX, caustic.target.posX, LIGHT_LERP);
        caustic.current.posY = lerp(caustic.current.posY, caustic.target.posY, LIGHT_LERP);

        caustic.el.style.setProperty("--light-pos-x", `${caustic.current.posX.toFixed(2)}%`);
        caustic.el.style.setProperty("--light-pos-y", `${caustic.current.posY.toFixed(2)}%`);
        caustic.el.style.setProperty(
          "--caustic-rotate",
          `${(lightState.displayAngle + caustic.config.rotate).toFixed(2)}deg`
        );
        caustic.el.style.setProperty("--caustic-scale", String(caustic.config.scale ?? 1));
      });
    };

    const updateDialVisuals = (angle) => {
      lightDialRing.style.setProperty("--dial-angle", `${angle.toFixed(2)}deg`);
      lightDialSun.setAttribute("aria-valuenow", String(Math.round(angle)));
      if (lightDialLabel) {
        lightDialLabel.textContent = `${capitalize(getTimeName(angle))} · ${angleToClock(angle)}`;
      }
    };

    const setSunAngle = (angle) => {
      lightState.sunAngle = normalizeAngle(angle);
      computeLightTargets(lightState.sunAngle);
    };

    const setWarmth = (value) => {
      lightState.warmth = Math.max(0, Math.min(1, value));
      computeLightTargets(lightState.sunAngle);
    };

    const setIntensity = (value) => {
      lightState.intensity = Math.max(0.55, Math.min(1.35, value));
      computeLightTargets(lightState.sunAngle);
    };

    const startDrag = () => {
      lightState.isDragging = true;
      lightDialRing.classList.add("is-dragging");
    };

    const endDrag = () => {
      lightState.isDragging = false;
      lightDialRing.classList.remove("is-dragging");
    };

    const onPointerMove = (e) => {
      if (!lightState.isDragging) return;
      setSunAngle(pointerToAngle(e.clientX, e.clientY));
    };

    lightDialRing.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      e.preventDefault();
      lightDialRing.setPointerCapture(e.pointerId);
      startDrag();
      setSunAngle(pointerToAngle(e.clientX, e.clientY));
    });

    lightDialRing.addEventListener("pointermove", onPointerMove);
    lightDialRing.addEventListener("pointerup", endDrag);
    lightDialRing.addEventListener("pointercancel", endDrag);

    lightDialSun.addEventListener("keydown", (e) => {
      const step = e.shiftKey ? 15 : 5;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        e.preventDefault();
        setSunAngle(lightState.sunAngle + step);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault();
        setSunAngle(lightState.sunAngle - step);
      }
    });

    if (lightWarmthInput) {
      lightWarmthInput.addEventListener("input", (e) => {
        setWarmth(Number(e.target.value) / 100);
      });
    }

    if (lightIntensityInput) {
      lightIntensityInput.addEventListener("input", (e) => {
        setIntensity(lerp(0.55, 1.35, Number(e.target.value) / 100));
      });
    }

    if (lightWarmthInput) setWarmth(Number(lightWarmthInput.value) / 100);
    if (lightIntensityInput) setIntensity(lerp(0.55, 1.35, Number(lightIntensityInput.value) / 100));

    computeLightTargets(lightState.sunAngle);
    updateDialVisuals(lightState.displayAngle);

    if (reducedMotion) {
      lightState.displayAngle = lightState.sunAngle;
      applyLightState();
      updateDialVisuals(lightState.displayAngle);
      updateLightStreaks(performance.now());
    } else {
      updateLightDial = () => {
        const now = performance.now();
        const dt = now - lightState.lastTime;
        lightState.lastTime = now;

        if (!lightState.isDragging) {
          lightState.sunAngle = normalizeAngle(lightState.sunAngle + DEG_PER_MS * dt);
          computeLightTargets(lightState.sunAngle);
        }

        lightState.displayAngle = lerp(lightState.displayAngle, lightState.sunAngle, LIGHT_LERP);
        applyLightState();
        updateDialVisuals(lightState.displayAngle);
        updateLightStreaks(now);
      };
    }
  } else {
    if (glowPoints.length) initDefaultGlowPositions();

    if (lightStreaks && !lampLanding) {
      const streakTick = (now) => {
        if (!reducedMotion) {
          const t = now * 0.001;
          const autoX = Math.sin(t * 0.13) * 26 + Math.sin(t * 0.21 + 1.8) * 14;
          const autoY = Math.cos(t * 0.1 + 0.6) * 18 + Math.sin(t * 0.16 + 2.4) * 11;
          lightStreaks.style.setProperty("--streak-shift-x", `${autoX.toFixed(2)}px`);
          lightStreaks.style.setProperty("--streak-shift-y", `${autoY.toFixed(2)}px`);
        }
        requestAnimationFrame(streakTick);
      };
      requestAnimationFrame(streakTick);
    }
  }
})();
