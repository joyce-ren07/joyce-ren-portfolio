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

    const isHomePage = hashSections.length > 0;
    const travelDuration = reducedMotion ? 0 : 920;
    const hero = document.querySelector(".portfolio-page .hero");
    const NAV_LIGHT_FROM_KEY = "portfolio-nav-light-from";
    const NAV_ITEM_IDS = ["work", "canvas", "about"];

    const getNavItemId = (link) => {
      if (!link) return "main";
      const index = links.indexOf(link);
      return index >= 0 ? NAV_ITEM_IDS[index] || "main" : "main";
    };

    const findLinkByNavId = (id) => {
      if (!id || id === "main") return null;
      const index = NAV_ITEM_IDS.indexOf(id);
      return index >= 0 ? links[index] || null : null;
    };

    const rememberNavLightOrigin = () => {
      try {
        sessionStorage.setItem(NAV_LIGHT_FROM_KEY, getNavItemId(activeLink));
      } catch (_) {
        /* ignore storage errors */
      }
    };

    const consumeNavLightOrigin = () => {
      try {
        const value = sessionStorage.getItem(NAV_LIGHT_FROM_KEY);
        sessionStorage.removeItem(NAV_LIGHT_FROM_KEY);
        return value;
      } catch (_) {
        return null;
      }
    };

    const leavesCurrentPage = (href) => {
      const onAboutPage = /\/about(\/|$)/.test(window.location.pathname);
      const pathOnly = href.split("#")[0];

      if (onAboutPage) {
        if (pathOnly === "index.html" || pathOnly === "./index.html") return false;
        return pathOnly.includes("index.html") || pathOnly.startsWith("../");
      }

      const targetsAbout = /about(\/index\.html)?$/i.test(pathOnly) || pathOnly.includes("about/");
      return isHomePage && targetsAbout;
    };

    const isAtMain = () => {
      if (!isHomePage) return false;
      if (window.scrollY < 48) return true;
      if (!hero) return window.scrollY < 120;
      const rect = hero.getBoundingClientRect();
      return rect.top <= 80 && rect.bottom >= window.innerHeight * 0.42;
    };

    const finishTravel = () => {
      light.classList.remove("is-traveling");
      logo?.classList.remove("is-pulsing");
    };

    const scheduleTravelEnd = () => {
      clearTimeout(travelTimer);
      travelTimer = setTimeout(finishTravel, travelDuration);
    };

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
      const size = logoRect.width;

      return {
        left: logoRect.left - navRect.left + logoRect.width / 2 - size / 2,
        top: logoRect.top - navRect.top + logoRect.height / 2 - size / 2,
        width: size,
        height: size,
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

    const parkLightAtLogo = () => {
      const logoRect = getLogoRect();
      if (!logoRect) return;
      light.style.transition = "none";
      light.style.left = `${logoRect.left}px`;
      light.style.top = `${logoRect.top}px`;
      light.style.width = `${logoRect.width}px`;
      light.style.height = `${logoRect.height}px`;
      requestAnimationFrame(() => {
        light.style.transition = "";
      });
    };

    const hideLight = ({ animate = true } = {}) => {
      clearTimeout(travelTimer);
      finishTravel();

      if (!animate || reducedMotion) {
        light.style.transition = "none";
      }

      light.classList.remove("is-visible");

      if (!animate || reducedMotion) {
        requestAnimationFrame(() => {
          light.style.transition = "";
        });
      }
    };

    const clearActive = ({ animate = true } = {}) => {
      links.forEach((item) => {
        item.classList.remove("is-active");
        item.removeAttribute("aria-current");
      });
      activeLink = null;

      const logoRect = getLogoRect();
      if (!logoRect) {
        hideLight({ animate });
        return;
      }

      const wasVisible = light.classList.contains("is-visible");

      if (animate && !reducedMotion && wasVisible) {
        logo.classList.add("is-pulsing");
        placeLight(logoRect, { animate: true, traveling: true });
        clearTimeout(travelTimer);
        travelTimer = setTimeout(() => {
          finishTravel();
          hideLight({ animate: true });
          parkLightAtLogo();
        }, travelDuration);
      } else {
        parkLightAtLogo();
        hideLight({ animate: false });
      }
    };

    const setActiveLink = (link, { animate = true, fromLink = null } = {}) => {
      if (!link || !links.includes(link) || link === activeLink) return;

      links.forEach((item) => {
        const isActive = item === link;
        item.classList.toggle("is-active", isActive);
        if (isActive) item.setAttribute("aria-current", "page");
        else item.removeAttribute("aria-current");
      });

      activeLink = link;
      clearTimeout(travelTimer);

      const targetRect = getLinkRect(link);
      const wasVisible = light.classList.contains("is-visible");
      const shouldAnimate = animate && !reducedMotion;
      const originLink = fromLink && links.includes(fromLink) ? fromLink : null;

      if (!wasVisible) {
        if (originLink && originLink !== link && shouldAnimate) {
          finishTravel();
          placeLight(getLinkRect(originLink), { animate: false });
          light.classList.add("is-visible");

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              placeLight(targetRect, { animate: true, traveling: true });
              scheduleTravelEnd();
            });
          });
          return;
        }

        const logoRect = getLogoRect();
        if (logoRect && shouldAnimate && !originLink) {
          logo.classList.add("is-pulsing");
          placeLight(logoRect, { animate: false });
          light.classList.add("is-visible");

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              placeLight(targetRect, { animate: true, traveling: true });
              scheduleTravelEnd();
            });
          });
        } else {
          finishTravel();
          placeLight(targetRect, { animate: false });
          light.classList.add("is-visible");
        }
        return;
      }

      finishTravel();
      placeLight(targetRect, { animate: shouldAnimate, traveling: shouldAnimate });
      if (shouldAnimate) scheduleTravelEnd();
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

      if (isHomePage) {
        return null;
      }

      return links.find((link) => link.hasAttribute("aria-current")) || null;
    };

    links.forEach((link) => {
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href") || "";
        const isHashOnly = href.startsWith("#");
        const hashIndex = href.indexOf("#");
        const isSamePageHash = hashIndex !== -1 && !href.startsWith("http");
        const navigatesAway = leavesCurrentPage(href);

        if (navigatesAway) {
          rememberNavLightOrigin();
        }

        if (isHashOnly || (isSamePageHash && !href.includes("about"))) {
          const id = isHashOnly ? href.slice(1) : href.slice(hashIndex + 1);
          const target = document.getElementById(id);
          if (target) {
            event.preventDefault();
            target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
            history.replaceState(null, "", `#${id}`);
          }
        }

        if (activeLink === link || navigatesAway) return;

        setActiveLink(link, { animate: true });
      });
    });

    window.addEventListener("resize", () => {
      if (activeLink) {
        setActiveLink(activeLink, { animate: false });
      } else {
        parkLightAtLogo();
      }
    });

    const initial = resolveLinkFromLocation();
    const previousNavId = consumeNavLightOrigin();
    const previousLink = previousNavId ? findLinkByNavId(previousNavId) : null;

    if (initial && previousLink && previousLink !== initial && !reducedMotion) {
      setActiveLink(initial, { animate: true, fromLink: previousLink });
    } else if (initial) {
      setActiveLink(initial, { animate: false });
    } else {
      parkLightAtLogo();
      clearActive({ animate: false });
    }

    if (hashSections.length && "IntersectionObserver" in window) {
      const visible = new Map();
      const sectionThreshold = 0.12;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
          });

          let best = null;
          let bestRatio = 0;

          hashSections.forEach(({ section, link }) => {
            const ratio = visible.get(section.id) ?? 0;
            if (ratio > bestRatio) {
              bestRatio = ratio;
              best = { section, link };
            }
          });

          if (bestRatio >= sectionThreshold && best) {
            if (best.link !== activeLink) {
              setActiveLink(best.link, { animate: true });
            }
            return;
          }

          if (activeLink && isHomePage && isAtMain()) {
            clearActive({ animate: true });
          }
        },
        {
          rootMargin: "-22% 0px -52% 0px",
          threshold: [0, 0.08, 0.15, 0.25, 0.4, 0.55, 0.75, 1],
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
