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
    const travelDuration = reducedMotion ? 0 : 900;
    const hero = document.querySelector(".portfolio-page .hero");
    const NAV_LIGHT_FROM_KEY = "portfolio-nav-light-from";
    const NAV_LIGHT_TO_KEY = "portfolio-nav-light-to";
    const NAV_ITEM_IDS = ["work", "canvas", "about"];
    let suppressObserver = false;
    let observerReleaseTimer = null;
    let scrollRaf = null;

    const releaseObserverAfter = (ms) => {
      clearTimeout(observerReleaseTimer);
      suppressObserver = true;
      observerReleaseTimer = setTimeout(() => {
        suppressObserver = false;
        updateActiveFromScroll();
      }, ms);
    };

    const scrollToSection = (section, { behavior } = {}) => {
      if (!section) return;
      section.scrollIntoView({
        behavior: behavior ?? (reducedMotion ? "auto" : "smooth"),
        block: "start",
      });
    };

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

    const getLitLink = () => {
      if (activeLink) return activeLink;
      return links.find((item) => item.classList.contains("is-active")) || null;
    };

    const rememberNavTransition = (toLink) => {
      try {
        sessionStorage.setItem(NAV_LIGHT_FROM_KEY, getNavItemId(getLitLink()));
        sessionStorage.setItem(NAV_LIGHT_TO_KEY, toLink ? getNavItemId(toLink) : "main");
      } catch (_) {
        /* ignore storage errors */
      }
    };

    const consumeNavTransition = () => {
      try {
        const fromId = sessionStorage.getItem(NAV_LIGHT_FROM_KEY);
        const toId = sessionStorage.getItem(NAV_LIGHT_TO_KEY);
        sessionStorage.removeItem(NAV_LIGHT_FROM_KEY);
        sessionStorage.removeItem(NAV_LIGHT_TO_KEY);
        return { fromId, toId };
      } catch (_) {
        return { fromId: null, toId: null };
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
      } else {
        light.style.transition = "";
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

    const slideBetweenRects = (fromRect, toRect, { hideAfter = false } = {}) => {
      if (!fromRect || !toRect) return;

      if (reducedMotion) {
        if (hideAfter) {
          parkLightAtLogo();
          hideLight({ animate: false });
        } else {
          placeLight(toRect, { animate: false });
        }
        return;
      }

      clearTimeout(travelTimer);
      finishTravel();
      light.style.transition = "none";
      placeLight(fromRect, { animate: false });
      light.classList.add("is-visible");
      void light.offsetWidth;
      light.style.transition = "";
      placeLight(toRect, { animate: true, traveling: true });
      scheduleTravelEnd();

      if (hideAfter) {
        clearTimeout(travelTimer);
        travelTimer = setTimeout(() => {
          finishTravel();
          hideLight({ animate: true });
          parkLightAtLogo();
        }, travelDuration);
      }
    };

    const applyLinkState = (link) => {
      links.forEach((item) => {
        const isActive = item === link;
        item.classList.toggle("is-active", isActive);
        if (isActive) item.setAttribute("aria-current", "page");
        else item.removeAttribute("aria-current");
      });
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
      const lit = getLitLink();
      const fromRect = lit ? getLinkRect(lit) : null;

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

      if (animate && !reducedMotion && wasVisible && fromRect) {
        logo.classList.add("is-pulsing");
        slideBetweenRects(fromRect, logoRect, { hideAfter: true });
      } else {
        parkLightAtLogo();
        hideLight({ animate: false });
      }
    };

    const setActiveLink = (link, { animate = true, fromLink = null } = {}) => {
      if (!link || !links.includes(link) || link === activeLink) return;

      const previousActive = activeLink;
      const wasVisible = light.classList.contains("is-visible");
      const shouldAnimate = animate && !reducedMotion;
      const targetRect = getLinkRect(link);
      const originLink = fromLink && links.includes(fromLink) ? fromLink : null;

      applyLinkState(link);
      activeLink = link;
      clearTimeout(travelTimer);

      if (wasVisible && previousActive && shouldAnimate) {
        finishTravel();
        slideBetweenRects(getLinkRect(previousActive), targetRect);
        return;
      }

      if (!wasVisible) {
        if (originLink && originLink !== link && shouldAnimate) {
          finishTravel();
          slideBetweenRects(getLinkRect(originLink), targetRect);
          return;
        }

        const logoRect = getLogoRect();
        if (logoRect && shouldAnimate && !originLink) {
          logo.classList.add("is-pulsing");
          slideBetweenRects(logoRect, targetRect);
          return;
        }

        finishTravel();
        placeLight(targetRect, { animate: false });
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
          rememberNavTransition(link);
        }

        if (isHashOnly || (isSamePageHash && !href.includes("about"))) {
          const id = isHashOnly ? href.slice(1) : href.slice(hashIndex + 1);
          const target = document.getElementById(id);
          if (target) {
            event.preventDefault();
            releaseObserverAfter(reducedMotion ? 50 : travelDuration + 700);
            if (activeLink !== link) {
              setActiveLink(link, { animate: true });
            }
            scrollToSection(target);
            history.replaceState(null, "", `#${id}`);
            return;
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

    if (logo) {
      logo.addEventListener("click", (event) => {
        const lit = getLitLink();
        const hasGlow = Boolean(lit) || light.classList.contains("is-visible");
        if (!hasGlow) return;

        const onAboutPage = /\/about(\/|$)/.test(window.location.pathname);
        const homeHref = logo.getAttribute("href");
        if (!homeHref) return;

        event.preventDefault();

        if (onAboutPage) {
          rememberNavTransition(null);
          clearActive({ animate: true });
          window.setTimeout(() => {
            window.location.href = homeHref;
          }, reducedMotion ? 0 : travelDuration);
          return;
        }

        if (isHomePage) {
          releaseObserverAfter(reducedMotion ? 50 : travelDuration + 700);
          clearActive({ animate: true });
          if (hero) {
            scrollToSection(hero);
          } else {
            window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
          }
          history.replaceState(null, "", window.location.pathname + window.location.search);
        }
      });
    }

    const getSectionFromScroll = () => {
      const activationLine = window.innerHeight * 0.28;
      let best = null;

      hashSections.forEach(({ section, link }) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= activationLine) {
          best = { section, link };
        }
      });

      return best;
    };

    const updateActiveFromScroll = () => {
      if (suppressObserver || !hashSections.length) return;

      if (activeLink && isHomePage && isAtMain()) {
        clearActive({ animate: true });
        return;
      }

      const best = getSectionFromScroll();
      if (!best) return;

      if (best.link !== activeLink) {
        if (light.classList.contains("is-traveling")) return;
        setActiveLink(best.link, { animate: true });
      }
    };

    const hadCrossPageTransition = (() => {
      try {
        return Boolean(sessionStorage.getItem(NAV_LIGHT_TO_KEY));
      } catch (_) {
        return false;
      }
    })();

    const initialHash = isHomePage ? window.location.hash.slice(1) : "";
    const initialHashTarget = initialHash ? document.getElementById(initialHash) : null;

    if (initialHashTarget) {
      suppressObserver = true;
      if (hadCrossPageTransition) {
        if ("scrollRestoration" in history) {
          history.scrollRestoration = "manual";
        }
        window.scrollTo(0, 0);
      }
    }

    const bootstrapNavLight = () => {
      parkLightAtLogo();

      const initial = resolveLinkFromLocation();
      const { fromId, toId } = consumeNavTransition();
      const previousLink = fromId && fromId !== "main" ? findLinkByNavId(fromId) : null;
      const destinationMatches =
        !toId || toId === "main" || (initial && getNavItemId(initial) === toId);
      const crossPageSlide =
        initial &&
        previousLink &&
        previousLink !== initial &&
        destinationMatches &&
        !reducedMotion;

      if (crossPageSlide) {
        applyLinkState(initial);
        activeLink = initial;
        slideBetweenRects(getLinkRect(previousLink), getLinkRect(initial));
      } else if (!initial && previousLink && toId === "main" && !reducedMotion) {
        const logoRect = getLogoRect();
        if (logoRect) {
          slideBetweenRects(getLinkRect(previousLink), logoRect, { hideAfter: true });
        } else {
          clearActive({ animate: false });
        }
      } else if (initial) {
        setActiveLink(initial, { animate: false });
      } else {
        clearActive({ animate: false });
      }

      if (initialHashTarget) {
        if (hadCrossPageTransition) {
          requestAnimationFrame(() => {
            scrollToSection(initialHashTarget);
          });
        }
        const scrollDelay = crossPageSlide ? travelDuration + 700 : 400;
        releaseObserverAfter(reducedMotion ? 100 : scrollDelay);
      }
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(bootstrapNavLight);
    });

    if (hashSections.length) {
      window.addEventListener(
        "scroll",
        () => {
          if (scrollRaf) return;
          scrollRaf = requestAnimationFrame(() => {
            scrollRaf = null;
            updateActiveFromScroll();
          });
        },
        { passive: true }
      );

      updateActiveFromScroll();
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
