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

  /* Card hover — local glow intensifies and shifts color temperature */
  const interactiveCards = document.querySelectorAll(
    ".work-card, .glass--hero, .glass--panel, .case-result"
  );

  interactiveCards.forEach((card) => {
    card.addEventListener("pointerenter", () => {
      card.dataset.glowTemp = Math.random() > 0.5 ? "warm" : "cool";
    });
    card.addEventListener("pointerleave", () => {
      delete card.dataset.glowTemp;
    });
  });
})();
