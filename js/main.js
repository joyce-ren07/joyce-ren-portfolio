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
      const topbarEl = document.querySelector(".case-topbar");
      if (topbarEl && isOpen) {
        topbarEl.classList.remove("is-hidden");
      }
    });
  }

  /* Sticky top/bottom liquid-glass blur edges */
  ["viewport-top-blur", "viewport-bottom-blur"].forEach((className) => {
    if (document.querySelector(`.${className}`)) return;
    const edge = document.createElement("div");
    edge.className = className;
    edge.setAttribute("aria-hidden", "true");
    document.body.appendChild(edge);
  });

  /* Topbar — hide on scroll down, reveal on scroll up (skip homepage) */
  const topbar = document.querySelector(".case-topbar");
  if (topbar && !document.body.classList.contains("portfolio-page")) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lastY = window.scrollY || 0;
    let hidden = false;
    let raf = 0;

    const setHidden = (next) => {
      if (hidden === next) return;
      hidden = next;
      topbar.classList.toggle("is-hidden", hidden);
    };

    const menuOpen = () => {
      const openNav =
        document.querySelector(".case-topbar__nav.is-open") ||
        document.querySelector(".site-nav.is-open");
      return Boolean(openNav);
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY || 0;
        const delta = y - lastY;

        if (menuOpen() || y < 24) {
          setHidden(false);
        } else if (delta > 6 && y > 64) {
          setHidden(true);
        } else if (delta < -6) {
          setHidden(false);
        }

        lastY = y;
      });
    };

    if (!reducedMotion) {
      window.addEventListener("scroll", onScroll, { passive: true });
    }
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
    const NAV_LIGHT_TO_KEY = "portfolio-nav-light-to";
    const NAV_ITEM_IDS = ["work", "canvas", "about"];
    let suppressObserver = false;

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
      try {
        const nextUrl = new URL(href, window.location.href);
        const normalize = (path) => {
          const cleaned = path.replace(/\/index\.html$/i, "").replace(/\/$/, "");
          return cleaned || "/";
        };
        return normalize(nextUrl.pathname) !== normalize(window.location.pathname);
      } catch (_) {
        return Boolean(href) && !href.startsWith("#");
      }
    };

    const isAtMain = () => {
      if (!isHomePage) return false;
      if (window.scrollY < 48) return true;
      if (!hero) return window.scrollY < 120;
      const rect = hero.getBoundingClientRect();
      // Stay on "main" while the lamp hero still owns most of the viewport.
      return rect.bottom >= window.innerHeight * 0.55;
    };

    const getWorkLink = () => links.find((link) => getNavItemId(link) === "work") || links[0] || null;
    const getCanvasLink = () => links.find((link) => getNavItemId(link) === "canvas") || null;
    const getAboutLink = () => links.find((link) => getNavItemId(link) === "about") || links[links.length - 1] || null;

    const findBestHashSectionLink = () => {
      if (!hashSections.length) return null;

      const focusY = window.innerHeight * 0.32;
      let best = null;
      let bestDistance = Infinity;

      hashSections.forEach(({ section, link }) => {
        const rect = section.getBoundingClientRect();
        const inView = rect.top < window.innerHeight * 0.72 && rect.bottom > window.innerHeight * 0.18;
        if (!inView) return;

        const anchor = Math.min(Math.max(rect.top, 0), window.innerHeight);
        const distance = Math.abs(anchor - focusY);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = link;
        }
      });

      return best;
    };

    const syncHomeNavFromScroll = ({ animate = true } = {}) => {
      if (!isHomePage || suppressObserver) return;

      if (isAtMain()) {
        if (activeLink) clearActive({ animate });
        return;
      }

      const bestLink = findBestHashSectionLink() || getWorkLink();
      if (bestLink && bestLink !== activeLink) {
        setActiveLink(bestLink, { animate });
      }
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
      if (!link || !links.includes(link)) return;

      // Same link: keep styles/glow geometry in sync (e.g. on resize).
      if (link === activeLink) {
        applyLinkState(link);
        placeLight(getLinkRect(link), { animate: false });
        return;
      }

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
        return getAboutLink();
      }

      if (/\/canvas(\/|$)/.test(path)) {
        return getCanvasLink() || links.find((link) => link.hasAttribute("aria-current")) || null;
      }

      // Case studies and other work detail pages always illuminate Work.
      if (/\/case-studies(\/|$)/.test(path)) {
        return getWorkLink();
      }

      if (hash) {
        const hashLink = links.find((link) => {
          const href = link.getAttribute("href") || "";
          return href.includes(hash);
        });
        if (hashLink) return hashLink;
      }

      if (isHomePage) {
        if (isAtMain()) return null;
        return findBestHashSectionLink() || getWorkLink();
      }

      return (
        links.find((link) => link.hasAttribute("aria-current")) ||
        getWorkLink()
      );
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

    if (logo) {
      logo.addEventListener("click", (event) => {
        const lit = getLitLink();
        const hasGlow = Boolean(lit) || light.classList.contains("is-visible");
        if (!hasGlow) return;

        const homeHref = logo.getAttribute("href");
        if (!homeHref) return;

        event.preventDefault();

        // Any non-home page with an active glow (Canvas, About, case studies, …)
        // should clear the glow, then actually go home.
        if (!isHomePage) {
          rememberNavTransition(null);
          clearActive({ animate: true });
          window.setTimeout(() => {
            window.location.href = homeHref;
          }, reducedMotion ? 0 : travelDuration);
          return;
        }

        suppressObserver = true;
        clearActive({ animate: true });
        if (hero) {
          hero.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
        } else {
          window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
        }
        history.replaceState(null, "", window.location.pathname + window.location.search);
        window.setTimeout(() => {
          suppressObserver = false;
        }, reducedMotion ? 0 : travelDuration + 250);
      });
    }

    const bootstrapNavLight = () => {
      parkLightAtLogo();

      const initial = resolveLinkFromLocation();
      const { fromId, toId } = consumeNavTransition();
      const previousLink = fromId && fromId !== "main" ? findLinkByNavId(fromId) : null;
      const destinationMatches =
        !toId || toId === "main" || (initial && getNavItemId(initial) === toId);

      if (
        initial &&
        previousLink &&
        previousLink !== initial &&
        destinationMatches &&
        !reducedMotion
      ) {
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
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(bootstrapNavLight);
    });

    // Home page: keep the moving glow locked to the section in view.
    // Scroll-based detection is used because tall sections make IntersectionObserver
    // ratios too small to cross a fixed threshold reliably.
    if (isHomePage && hashSections.length) {
      let scrollRaf = 0;
      const onScrollOrResize = () => {
        if (scrollRaf) return;
        scrollRaf = requestAnimationFrame(() => {
          scrollRaf = 0;
          syncHomeNavFromScroll({ animate: true });
        });
      };

      window.addEventListener("scroll", onScrollOrResize, { passive: true });
      window.addEventListener("resize", onScrollOrResize);

      if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
          () => syncHomeNavFromScroll({ animate: true }),
          {
            rootMargin: "-18% 0px -45% 0px",
            threshold: [0, 0.01, 0.05, 0.1, 0.2, 0.35, 0.5, 0.75, 1],
          }
        );
        hashSections.forEach(({ section }) => observer.observe(section));
        if (hero) observer.observe(hero);
      }

      // Reconcile once after layout settles (images/fonts can shift scroll position).
      window.setTimeout(() => syncHomeNavFromScroll({ animate: false }), 120);
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

  /* Scroll-triggered videos — replay from start each time they enter view */
  const scrollVideos = document.querySelectorAll(".case-scroll-video__media");
  if (scrollVideos.length && "IntersectionObserver" in window) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!reducedMotion) {
      scrollVideos.forEach((video) => {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                video.currentTime = 0;
                video.play().catch(() => {});
              } else {
                video.pause();
                video.currentTime = 0;
              }
            });
          },
          { threshold: 0.35 }
        );

        observer.observe(video);
      });
    }
  }

  /* Project cover videos — muted autoplay/replay without controls */
  const coverVideos = document.querySelectorAll(
    ".work-card__cover-video, .work-card__image .case-device-video__media, .case-hero-image--video"
  );

  if (coverVideos.length) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobileQuery = window.matchMedia("(max-width: 768px), (hover: none) and (pointer: coarse)");
    const isMobile = () => mobileQuery.matches;

    const isCueTurnCover = (video) =>
      video.classList.contains("work-card__cover-video--cueturn") ||
      video.classList.contains("case-hero-image--cueturn-cover");

    const getLoopStart = (video) => {
      const start = Number(video.getAttribute("data-loop-start"));
      return Number.isFinite(start) && start > 0 ? start : 0;
    };

    const setCurrentTime = (video, time) => {
      try {
        video.currentTime = time;
      } catch {
        /* Ignore seek failures while media is loading. */
      }
    };

    const tryPlay = (video) => {
      // CueTurn covers are intentionally continuous demos, including when the
      // user's reduced-motion preference is enabled.
      if (reducedMotion && !isCueTurnCover(video)) {
        video.pause();
        return;
      }

      const playAttempt = video.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(() => {});
      }
    };

    const replayCover = (video) => {
      setCurrentTime(video, getLoopStart(video));
      tryPlay(video);
    };

    const prepareCover = (video) => {
      video.autoplay = true;
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute("autoplay", "");
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.removeAttribute("controls");
      video.controls = false;
      // CueTurn starts at its countdown frame and therefore uses the
      // explicit replay handler below instead of native looping to time 0.
      video.loop = getLoopStart(video) === 0;
    };

    coverVideos.forEach((video) => {
      prepareCover(video);

      const loopStart = getLoopStart(video);
      if (loopStart > 0) {
        const seekToLoopStart = () => {
          if (!Number.isFinite(video.duration) || video.duration <= loopStart) return;
          setCurrentTime(video, loopStart);
        };

        if (video.readyState >= 1) {
          seekToLoopStart();
        } else {
          video.addEventListener("loadedmetadata", seekToLoopStart, { once: true });
        }

        // Catch the boundary before browsers that skip the ended event.
        video.addEventListener(
          "timeupdate",
          () => {
            if (!Number.isFinite(video.duration)) return;
            if (video.currentTime >= video.duration - 0.2) replayCover(video);
          },
          { passive: true }
        );
      }

      video.addEventListener(
        "ended",
        () => {
          if (reducedMotion && !isCueTurnCover(video)) return;
          replayCover(video);
        },
        { passive: true }
      );

      const requestPlay = () => {
        if (video.ended) {
          replayCover(video);
        } else {
          tryPlay(video);
        }
      };

      // Kick playback once media can play (helps iOS after first paint), and
      // keep retrying if the first autoplay attempt races media loading.
      if (video.readyState >= 2) {
        requestPlay();
      } else {
        video.addEventListener("loadeddata", requestPlay);
        video.addEventListener("canplay", requestPlay);
      }
    });

    // On mobile, keep covers looping while in view and restart when they return.
    if ("IntersectionObserver" in window) {
      const coverObserver = new IntersectionObserver(
        (entries) => {
          if (!isMobile()) return;
          entries.forEach((entry) => {
            const video = entry.target;
            if (reducedMotion && !isCueTurnCover(video)) return;
            if (entry.isIntersecting) {
              if (video.paused || video.ended) {
                replayCover(video);
              } else {
                tryPlay(video);
              }
            } else {
              video.pause();
            }
          });
        },
        { threshold: 0.2 }
      );

      coverVideos.forEach((video) => coverObserver.observe(video));
    }

    // Resume after tab visibility / bfcache restores (common mobile pause).
    const resumeVisibleCovers = () => {
      if (document.hidden) return;
      coverVideos.forEach((video) => {
        if (reducedMotion && !isCueTurnCover(video)) return;
        const rect = video.getBoundingClientRect();
        const inView =
          rect.bottom > 0 &&
          rect.top < (window.innerHeight || document.documentElement.clientHeight);
        if (inView) {
          if (video.ended) replayCover(video);
          else tryPlay(video);
        }
      });
    };

    document.addEventListener("visibilitychange", resumeVisibleCovers);
    window.addEventListener("pageshow", resumeVisibleCovers);
  }

  /* Optional playback-rate overrides for cover / demo videos */
  document.querySelectorAll("video[data-playback-rate]").forEach((video) => {
    const rate = Number(video.getAttribute("data-playback-rate"));
    if (!Number.isFinite(rate) || rate <= 0) return;
    const applyRate = () => {
      video.playbackRate = rate;
    };
    applyRate();
    video.addEventListener("loadedmetadata", applyRate);
    video.addEventListener("play", applyRate);
  });

  /* Social Listening notifications — staggered slide-fade on scroll */
  const notifStacks = document.querySelectorAll(".case-quotes--staggered");
  if (notifStacks.length) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    notifStacks.forEach((stack) => {
      const reveal = () => stack.classList.add("is-inview");

      if (reducedMotion || !("IntersectionObserver" in window)) {
        reveal();
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            reveal();
            observer.unobserve(stack);
          });
        },
        { threshold: 0.25, rootMargin: "0px 0px -6% 0px" }
      );

      observer.observe(stack);
    });
  }

  /* Scroll-triggered Lottie — slide in and play when entering view */
  const scrollLotties = document.querySelectorAll("[data-scroll-lottie]");
  if (scrollLotties.length) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const loadLottie = () =>
      new Promise((resolve, reject) => {
        if (window.lottie) {
          resolve(window.lottie);
          return;
        }
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js";
        script.async = true;
        script.onload = () => resolve(window.lottie);
        script.onerror = reject;
        document.head.appendChild(script);
      });

    loadLottie()
      .then((lottie) => {
        scrollLotties.forEach((host) => {
          const stage = host.querySelector(".case-lottie-break__stage");
          const src = host.getAttribute("data-lottie-src");
          if (!stage || !src) return;

          const animation = lottie.loadAnimation({
            container: stage,
            renderer: "svg",
            loop: true,
            autoplay: false,
            path: src,
          });

          const reveal = () => {
            host.classList.add("is-inview");
            animation.play();
          };

          if (reducedMotion || !("IntersectionObserver" in window)) {
            reveal();
            return;
          }

          const observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                reveal();
                observer.unobserve(host);
              });
            },
            { threshold: 0.4, rootMargin: "0px 0px -8% 0px" }
          );

          observer.observe(host);
        });
      })
      .catch(() => {
        scrollLotties.forEach((host) => host.classList.add("is-inview"));
      });
  }

  /* Home lamp hero — pull chain toggle + near-instant scroll lighting */
  const lampHero = document.querySelector(".lamp-hero");
  const lampPull = document.getElementById("lamp-pull");
  if (lampHero) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = document.querySelector(".portfolio-page") || document.documentElement;
    const state = {
      target: 0,
      current: 0,
      forced: null,
    };

    /* Flip lit after a short scroll — no long progressive blend */
    const SCROLL_ON_PX = 32;
    const SCROLL_OFF_PX = 12;

    const getScrollRange = () => Math.max(0, lampHero.offsetHeight - window.innerHeight);

    const getScrolledPx = () => Math.max(0, -lampHero.getBoundingClientRect().top);

    const getScrollPower = () => {
      const scrolled = getScrolledPx();
      if (state.current >= 0.5) {
        return scrolled > SCROLL_OFF_PX ? 1 : 0;
      }
      return scrolled > SCROLL_ON_PX ? 1 : 0;
    };

    const applyPower = (power) => {
      root.style.setProperty("--lamp-power", power.toFixed(3));
      root.classList.toggle("lamp-is-lit", power > 0.5);
      if (lampPull) {
        lampPull.setAttribute("aria-pressed", power > 0.5 ? "true" : "false");
      }
    };

    const syncTarget = () => {
      if (state.forced !== null) {
        state.target = state.forced;
        return;
      }
      state.target = getScrollPower();
    };

    const tick = () => {
      syncTarget();
      const ease = reducedMotion ? 1 : 0.78;
      state.current += (state.target - state.current) * ease;
      if (Math.abs(state.target - state.current) < 0.01) {
        state.current = state.target;
      }
      applyPower(state.current);
      if (!reducedMotion) {
        requestAnimationFrame(tick);
      }
    };

    const onScrollOrResize = () => {
      if (state.forced !== null) {
        const scrolled = getScrolledPx();
        if (state.forced === 1 && scrolled > SCROLL_ON_PX) {
          state.forced = null;
        } else if (state.forced === 0 && scrolled <= SCROLL_OFF_PX) {
          state.forced = null;
        }
      }
      syncTarget();
      if (reducedMotion) {
        state.current = state.target;
        applyPower(state.current);
      }
    };

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    if (lampPull) {
      lampPull.addEventListener("click", () => {
        const lit = (state.forced !== null ? state.forced : state.current) > 0.5;
        state.forced = lit ? 0 : 1;
        lampPull.classList.add("is-pulled");
        window.setTimeout(() => lampPull.classList.remove("is-pulled"), reducedMotion ? 0 : 280);

        if (!lit) {
          const range = getScrollRange();
          const targetTop = Math.min(Math.max(SCROLL_ON_PX + 8, range * 0.35), Math.max(range, SCROLL_ON_PX + 8));
          if (getScrolledPx() < SCROLL_ON_PX) {
            window.scrollTo({
              top: targetTop,
              behavior: reducedMotion ? "auto" : "smooth",
            });
          }
        } else if (getScrolledPx() > SCROLL_OFF_PX) {
          window.scrollTo({
            top: 0,
            behavior: reducedMotion ? "auto" : "smooth",
          });
        }

        syncTarget();
        if (reducedMotion) {
          state.current = state.target;
          applyPower(state.current);
        }
      });
    }

    syncTarget();
    state.current = state.target;
    applyPower(state.current);
    if (!reducedMotion) {
      requestAnimationFrame(tick);
    }
  }

  /* Canvas magazine spread — zoom/pan + lightbox */
  const canvasViewport = document.querySelector("[data-canvas-viewport]");
  const canvasWorld = document.querySelector("[data-canvas-world]");
  const canvasLightbox = document.querySelector("[data-canvas-lightbox]");
  if (canvasViewport && canvasWorld) {
    const pieces = Array.from(canvasWorld.querySelectorAll("[data-canvas-piece]"));
    const zoomInBtn = document.querySelector("[data-canvas-zoom-in]");
    const zoomOutBtn = document.querySelector("[data-canvas-zoom-out]");
    const zoomResetBtn = document.querySelector("[data-canvas-zoom-reset]");
    const zoomLevelEl = document.querySelector("[data-canvas-zoom-level]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const MIN_SCALE = 0.45;
    const MAX_SCALE = 2.4;
    const state = {
      scale: 1,
      x: 0,
      y: 0,
      dragging: false,
      pointerId: null,
      startX: 0,
      startY: 0,
      originX: 0,
      originY: 0,
      moved: false,
    };

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const fitScale = () => {
      const pad = 72;
      const vw = canvasViewport.clientWidth;
      const vh = canvasViewport.clientHeight;
      const worldW = canvasWorld.offsetWidth || 1480;
      const worldH = canvasWorld.offsetHeight || 920;
      return clamp(Math.min((vw - pad) / worldW, (vh - pad) / worldH), MIN_SCALE, 1);
    };

    const applyTransform = () => {
      canvasWorld.style.transform = `translate(-50%, -50%) translate(${state.x}px, ${state.y}px) scale(${state.scale})`;
      if (zoomLevelEl) zoomLevelEl.textContent = `${Math.round(state.scale * 100)}%`;
    };

    const setScale = (nextScale, originClientX, originClientY) => {
      const prev = state.scale;
      const scale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
      if (scale === prev) return;

      if (typeof originClientX === "number" && typeof originClientY === "number") {
        const rect = canvasViewport.getBoundingClientRect();
        const cx = originClientX - rect.left - rect.width / 2;
        const cy = originClientY - rect.top - rect.height / 2;
        const ratio = scale / prev;
        state.x = cx - (cx - state.x) * ratio;
        state.y = cy - (cy - state.y) * ratio;
      }

      state.scale = scale;
      applyTransform();
    };

    const resetView = () => {
      state.scale = fitScale();
      state.x = 0;
      state.y = 0;
      applyTransform();
    };

    resetView();
    window.addEventListener("resize", () => {
      if (!state.dragging) resetView();
    });

    canvasViewport.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault();
        const direction = event.deltaY > 0 ? -1 : 1;
        const factor = direction > 0 ? 1.08 : 1 / 1.08;
        setScale(state.scale * factor, event.clientX, event.clientY);
      },
      { passive: false }
    );

    canvasViewport.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 && event.pointerType === "mouse") return;
      if (event.target.closest("[data-canvas-piece]")) return;
      state.dragging = true;
      state.moved = false;
      state.pointerId = event.pointerId;
      state.startX = event.clientX;
      state.startY = event.clientY;
      state.originX = state.x;
      state.originY = state.y;
      canvasViewport.classList.add("is-dragging");
      canvasViewport.setPointerCapture(event.pointerId);
    });

    canvasViewport.addEventListener("pointermove", (event) => {
      if (!state.dragging || event.pointerId !== state.pointerId) return;
      const dx = event.clientX - state.startX;
      const dy = event.clientY - state.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) state.moved = true;
      state.x = state.originX + dx;
      state.y = state.originY + dy;
      applyTransform();
    });

    const endDrag = (event) => {
      if (!state.dragging || event.pointerId !== state.pointerId) return;
      state.dragging = false;
      state.pointerId = null;
      canvasViewport.classList.remove("is-dragging");
    };

    canvasViewport.addEventListener("pointerup", endDrag);
    canvasViewport.addEventListener("pointercancel", endDrag);

    zoomInBtn?.addEventListener("click", () => setScale(state.scale * 1.15));
    zoomOutBtn?.addEventListener("click", () => setScale(state.scale / 1.15));
    zoomResetBtn?.addEventListener("click", resetView);

    if (canvasLightbox) {
      const closeBtn = canvasLightbox.querySelector("[data-canvas-lightbox-close]");
      const titleEl = canvasLightbox.querySelector("[data-canvas-lightbox-title]");
      const captionEl = canvasLightbox.querySelector("[data-canvas-lightbox-caption]");
      const visualEl = canvasLightbox.querySelector("[data-canvas-lightbox-visual]");
      let lastTrigger = null;

      const openPiece = (piece) => {
        if (!piece || state.moved) return;
        lastTrigger = piece;
        if (titleEl) titleEl.textContent = piece.dataset.title || "";
        if (captionEl) captionEl.textContent = piece.dataset.caption || "";
        if (visualEl) {
          const frame = piece.querySelector(".canvas-piece__frame");
          visualEl.style.background = frame ? getComputedStyle(frame).background : "";
          const ratio = frame ? getComputedStyle(frame).aspectRatio : "4 / 3";
          visualEl.style.aspectRatio = ratio && ratio !== "auto" ? ratio : "4 / 3";
        }
        if (typeof canvasLightbox.showModal === "function") {
          canvasLightbox.showModal();
        } else {
          canvasLightbox.setAttribute("open", "");
        }
      };

      const closeLightbox = () => {
        if (typeof canvasLightbox.close === "function") {
          canvasLightbox.close();
        } else {
          canvasLightbox.removeAttribute("open");
        }
        if (lastTrigger) {
          lastTrigger.focus();
          lastTrigger = null;
        }
      };

      pieces.forEach((piece) => {
        piece.addEventListener("pointerdown", (event) => {
          state.moved = false;
          state.startX = event.clientX;
          state.startY = event.clientY;
        });
        piece.addEventListener("pointerup", (event) => {
          const dx = event.clientX - state.startX;
          const dy = event.clientY - state.startY;
          if (Math.hypot(dx, dy) < 6) openPiece(piece);
        });
      });

      closeBtn?.addEventListener("click", closeLightbox);
      canvasLightbox.addEventListener("click", (event) => {
        if (event.target === canvasLightbox) closeLightbox();
      });
      canvasLightbox.addEventListener("cancel", (event) => {
        event.preventDefault();
        closeLightbox();
      });
    }

    if (!reducedMotion) {
      const intro = canvasWorld.animate(
        [
          { opacity: 0 },
          { opacity: 1 },
        ],
        { duration: 650, easing: "ease", fill: "both" }
      );
      intro.finished.finally(() => {
        try {
          intro.cancel();
          canvasWorld.style.opacity = "1";
        } catch (_) {
          /* ignore */
        }
      });
    }
  }

  const envelopeTrigger = document.querySelector("[data-foreword-envelope]");
  const forewordLetter = document.querySelector("[data-foreword-letter]");
  if (envelopeTrigger && forewordLetter) {
    const closeForewordBtn = forewordLetter.querySelector("[data-foreword-close]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let forewordTimer = null;
    let envelopePointer = { x: 0, y: 0 };

    const clearForewordTimer = () => {
      if (forewordTimer) {
        window.clearTimeout(forewordTimer);
        forewordTimer = null;
      }
    };

    const resetForewordClasses = () => {
      forewordLetter.classList.remove("is-open", "is-reading");
    };

    const openForeword = () => {
      clearForewordTimer();
      resetForewordClasses();

      if (typeof forewordLetter.showModal === "function") {
        forewordLetter.showModal();
      } else {
        forewordLetter.setAttribute("open", "");
      }

      if (reducedMotion) {
        forewordLetter.classList.add("is-open", "is-reading");
        return;
      }

      // Beat with the closed envelope, then unfold, then expand to reading size.
      forewordTimer = window.setTimeout(() => {
        forewordLetter.classList.add("is-open");
        forewordTimer = window.setTimeout(() => {
          forewordLetter.classList.add("is-reading");
          forewordTimer = null;
        }, 980);
      }, 90);
    };

    const closeForeword = () => {
      clearForewordTimer();
      resetForewordClasses();
      if (typeof forewordLetter.close === "function") {
        forewordLetter.close();
      } else {
        forewordLetter.removeAttribute("open");
      }
      envelopeTrigger.focus();
    };

    envelopeTrigger.addEventListener("pointerdown", (event) => {
      envelopePointer = { x: event.clientX, y: event.clientY };
    });

    envelopeTrigger.addEventListener("pointerup", (event) => {
      const dx = event.clientX - envelopePointer.x;
      const dy = event.clientY - envelopePointer.y;
      if (Math.hypot(dx, dy) < 6) openForeword();
    });

    envelopeTrigger.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openForeword();
      }
    });

    closeForewordBtn?.addEventListener("click", closeForeword);
    forewordLetter.addEventListener("click", (event) => {
      if (event.target === forewordLetter) closeForeword();
    });
    forewordLetter.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeForeword();
    });
  }
})();
