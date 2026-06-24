/**
 * Portfolio — shared interactions
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

  /* Cursor proximity — nearest glow point drifts toward pointer */
  const glowPoints = document.querySelectorAll("[data-glow]");
  if (glowPoints.length && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let rafId = null;

    const onMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!rafId) {
        rafId = requestAnimationFrame(updateGlow);
      }
    };

    const updateGlow = () => {
      rafId = null;
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
        if (point === nearest.point) {
          const dx = (mouseX - nearest.cx) * 0.04;
          const dy = (mouseY - nearest.cy) * 0.04;
          point.style.setProperty("--glow-offset-x", `${dx}px`);
          point.style.setProperty("--glow-offset-y", `${dy}px`);
        } else {
          point.style.removeProperty("--glow-offset-x");
          point.style.removeProperty("--glow-offset-y");
        }
      });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
  }
})();
