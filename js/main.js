/**
 * Portfolio — shared interactions
 */

(function () {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav") || document.querySelector(".case-topbar__nav");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  /* Top bar — sliding glow from logo to active nav item */
  const topNav = document.querySelector(".case-topbar__nav");
  if (topNav) {
    const logo = document.querySelector(".case-topbar__logo");
    const links = Array.from(topNav.querySelectorAll("a"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const light = document.createElement("span");
    light.className = "case-topbar__nav-light";
    light.setAttribute("aria-hidden", "true");
    topNav.prepend(light);

    let activeLink = null;
    let travelTimer = null;

    const getLinkRect = (link) => {
      const navRect = topNav.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      const padX = 10;
      const padY = 6;
      return {
        left: linkRect.left - navRect.left - padX,
        top: linkRect.top - navRect.top - padY,
        width: linkRect.width + padX * 2,
        height: linkRect.height + padY * 2,
      };
    };

    const getLogoRect = () => {
      if (!logo) return null;
      const navRect = topNav.getBoundingClientRect();
      const logoRect = logo.getBoundingClientRect();
      const leftGroup = logo.closest(".case-topbar__left");
      const groupRect = leftGroup ? leftGroup.getBoundingClientRect() : navRect;
      return {
        left: logoRect.left - navRect.left + logoRect.width * 0.5 - 14,
        top: logoRect.top - navRect.top + logoRect.height * 0.5 - 10,
        width: 28,
        height: 20,
        groupLeft: groupRect.left,
      };
    };

    const placeLight = (rect, { animate = true, traveling = false } = {}) => {
      if (!rect) return;

      if (!animate || reducedMotion) {
        light.style.transition = "none";
      }

      light.classList.toggle("is-traveling", traveling);
      light.style.left = `${rect.left}px`;
      light.style.top = `${rect.top}px`;
      light.style.width = `${rect.width}px`;
      light.style.height = `${rect.height}px`;
      light.classList.add("is-visible");

      if (!animate || reducedMotion) {
        requestAnimationFrame(() => {
          light.style.transition = "";
        });
      }
    };

    const setActiveLink = (link, { fromLogo = false, animate = true } = {}) => {
      if (!link || !links.includes(link)) return;

      links.forEach((item) => {
        const isActive = item === link;
        item.classList.toggle("is-active", isActive);
        if (isActive) item.setAttribute("aria-current", "page");
        else item.removeAttribute("aria-current");
      });

      activeLink = link;
      clearTimeout(travelTimer);

      if (fromLogo && logo && animate && !reducedMotion) {
        logo.classList.add("is-pulsing");
        const logoRect = getLogoRect();
        placeLight(logoRect, { animate: false });

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            placeLight(getLinkRect(link), { animate: true, traveling: true });
          });
        });

        travelTimer = setTimeout(() => {
          light.classList.remove("is-traveling");
          logo.classList.remove("is-pulsing");
        }, 680);
      } else {
        logo?.classList.remove("is-pulsing");
        light.classList.remove("is-traveling");
        placeLight(getLinkRect(link), { animate: animate && !reducedMotion });
      }
    };

    const resolveLinkFromLocation = () => {
      const path = window.location.pathname.replace(/\/$/, "") || "/";
      const hash = window.location.hash;

      if (/\/about(\/|$)/.test(path)) {
        return links[links.length - 1];
      }

      if (hash) {
        const hashLink = links.find((link) => {
          const href = link.getAttribute("href") || "";
          return href.includes(hash);
        });
        if (hashLink) return hashLink;
      }

      return (
        links.find((link) => link.hasAttribute("aria-current")) ||
        links.find((link) => {
          const href = link.getAttribute("href") || "";
          return href === "index.html" || href.endsWith("/index.html#work") || href === "#work";
        }) ||
        links[0]
      );
    };

    const hashSections = links
      .map((link) => {
        const href = link.getAttribute("href") || "";
        const hashIndex = href.indexOf("#");
        if (hashIndex === -1) return null;
        const id = href.slice(hashIndex + 1);
        const section = document.getElementById(id);
        return section ? { link, section, id } : null;
      })
      .filter(Boolean);

    links.forEach((link) => {
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href") || "";
        const isHashOnly = href.startsWith("#");
        const hashIndex = href.indexOf("#");
        const isSamePageHash = hashIndex !== -1 && !href.startsWith("http");

        if (isHashOnly || (isSamePageHash && !href.includes("about"))) {
          const id = isHashOnly ? href.slice(1) : href.slice(hashIndex + 1);
          const target = document.getElementById(id);
          if (target) {
            event.preventDefault();
            target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
            history.replaceState(null, "", `#${id}`);
          }
        }

        const shouldTravel = activeLink !== link;
        setActiveLink(link, { fromLogo: shouldTravel, animate: true });
      });
    });

    window.addEventListener("resize", () => {
      if (activeLink) setActiveLink(activeLink, { animate: false });
    });

    const initial = resolveLinkFromLocation();
    setActiveLink(initial, { fromLogo: false, animate: false });

    if (hashSections.length && "IntersectionObserver" in window) {
      const visible = new Map();

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
          });

          let best = hashSections[0];
          let bestRatio = -1;

          hashSections.forEach(({ section, link }) => {
            const ratio = visible.get(section.id) ?? 0;
            if (ratio > bestRatio) {
              bestRatio = ratio;
              best = { section, link };
            }
          });

          if (bestRatio > 0 && best.link !== activeLink) {
            setActiveLink(best.link, { fromLogo: false, animate: true });
          }
        },
        {
          rootMargin: "-25% 0px -55% 0px",
          threshold: [0, 0.15, 0.35, 0.55, 0.75, 1],
        }
      );

      hashSections.forEach(({ section }) => observer.observe(section));
    }
  }

  /* Case study — sticky side nav highlights section in view */
  const sidebar = document.querySelector(".case-sidebar");
  if (sidebar) {
    const links = Array.from(sidebar.querySelectorAll(".case-sidebar__link"));
    const sections = links
      .map((link) => {
        const id = link.getAttribute("href")?.slice(1);
        const section = id ? document.getElementById(id) : null;
        return section ? { link, section } : null;
      })
      .filter(Boolean);

    const setActive = (id) => {
      links.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${id}`;
        link.classList.toggle("is-active", isActive);
        if (isActive) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    };

    if (sections.length && "IntersectionObserver" in window) {
      const visible = new Map();

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
          });

          let bestId = sections[0].section.id;
          let bestRatio = -1;

          sections.forEach(({ section }) => {
            const ratio = visible.get(section.id) ?? 0;
            if (ratio > bestRatio) {
              bestRatio = ratio;
              bestId = section.id;
            }
          });

          setActive(bestId);
        },
        {
          rootMargin: "-20% 0px -55% 0px",
          threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
        }
      );

      sections.forEach(({ section }) => observer.observe(section));
    }

    links.forEach((link) => {
      link.addEventListener("click", (e) => {
        const id = link.getAttribute("href")?.slice(1);
        const target = id ? document.getElementById(id) : null;
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        setActive(id);
      });
    });
  }
})();
