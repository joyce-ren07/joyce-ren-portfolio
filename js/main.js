/**
 * Portfolio — shared interactions
 */

(function () {
  /* SVG displacement filters for stained glass refraction */
  if (!document.getElementById("glass-warp-svg")) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("id", "glass-warp-svg");
    svg.setAttribute("aria-hidden", "true");
    svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    svg.innerHTML = `
      <defs>
        <filter id="glass-warp" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="3" seed="8" result="noise">
            <animate attributeName="baseFrequency"
              values="0.008 0.012;0.011 0.015;0.009 0.013;0.008 0.012"
              dur="16s"
              repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="18" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="glass-warp-sm" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.01 0.014" numOctaves="2" seed="3" result="noise">
            <animate attributeName="baseFrequency"
              values="0.01 0.014;0.013 0.017;0.011 0.015;0.01 0.014"
              dur="14s"
              repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="10" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    `;
    document.body.prepend(svg);
  }

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
})();
