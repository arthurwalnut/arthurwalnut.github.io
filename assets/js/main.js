(() => {
  const nav = document.querySelector(".top-nav");
  if (!nav) {
    return;
  }

  const links = Array.from(nav.querySelectorAll('a[href^="#"]'));
  const indicator = nav.querySelector(".nav-indicator");
  const sections = links
    .map((link) => document.getElementById(link.getAttribute("href").slice(1)))
    .filter(Boolean);

  if (!indicator || links.length === 0 || sections.length === 0) {
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let ticking = false;

  const lerp = (start, end, amount) => start + (end - start) * amount;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function getTopOffset() {
    const topbar = document.querySelector(".top-nav-bar");
    const topbarHeight = topbar ? topbar.getBoundingClientRect().height : 0;
    return topbarHeight + 12;
  }

  function getMaxScroll() {
    return Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
  }

  function getTargetTop(section) {
    const rawTop = section.getBoundingClientRect().top + window.scrollY - getTopOffset();
    return clamp(rawTop, 0, getMaxScroll());
  }

  function getMetric(index) {
    const link = links[index];
    const navRect = nav.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    const sidePadding = 8;
    const width = linkRect.width + sidePadding * 2;
    const x = linkRect.left - navRect.left - sidePadding;
    const y = linkRect.bottom - navRect.top - 4;

    return { x, y, width };
  }

  function getSectionProgress() {
    const scrollPosition = window.scrollY;
    const tops = sections.map(getTargetTop);
    const lastIndex = tops.length - 1;

    if (scrollPosition <= tops[0] || getMaxScroll() === 0) {
      return 0;
    }

    if (scrollPosition >= getMaxScroll() - 1) {
      return lastIndex;
    }

    for (let index = 0; index < lastIndex; index += 1) {
      const start = tops[index];
      const end = tops[index + 1];

      if (scrollPosition >= start && scrollPosition < end) {
        const distance = Math.max(end - start, 1);
        return index + (scrollPosition - start) / distance;
      }
    }

    return lastIndex;
  }

  function setCurrentLink(activeIndex) {
    links.forEach((link, index) => {
      if (index === activeIndex) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function updateIndicator() {
    ticking = false;

    const progress = getSectionProgress();
    const lowerIndex = Math.floor(progress);
    const upperIndex = Math.min(lowerIndex + 1, links.length - 1);
    const amount = progress - lowerIndex;
    const lowerMetric = getMetric(lowerIndex);
    const upperMetric = getMetric(upperIndex);

    const x = lerp(lowerMetric.x, upperMetric.x, amount);
    const y = lerp(lowerMetric.y, upperMetric.y, amount);
    const width = lerp(lowerMetric.width, upperMetric.width, amount);

    nav.style.setProperty("--indicator-x", `${x}px`);
    nav.style.setProperty("--indicator-y", `${y}px`);
    nav.style.setProperty("--indicator-width", `${width}px`);
    nav.classList.add("is-indicator-ready");
    setCurrentLink(Math.round(progress));
  }

  function requestIndicatorUpdate() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateIndicator);
    }
  }

  links.forEach((link, index) => {
    link.addEventListener("click", (event) => {
      const target = sections[index];
      if (!target) {
        return;
      }

      event.preventDefault();
      window.scrollTo({
        top: getTargetTop(target),
        behavior: prefersReducedMotion.matches ? "auto" : "smooth",
      });
      history.pushState(null, "", link.getAttribute("href"));
    });
  });

  window.addEventListener("scroll", requestIndicatorUpdate, { passive: true });
  window.addEventListener("resize", requestIndicatorUpdate);
  window.addEventListener("load", updateIndicator);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(updateIndicator);
  }

  updateIndicator();
})();

(() => {
  const wrapper = document.querySelector(".profile-pic-wrap");
  const images = wrapper ? Array.from(wrapper.querySelectorAll(".profile-pic")) : [];
  const button = wrapper ? wrapper.querySelector(".profile-switch") : null;

  if (!wrapper || images.length === 0 || !button) {
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let showingSecondary = false;
  let isFlipping = false;

  images.forEach((image) => {
    if (image.currentSrc || image.src) {
      const preload = new Image();
      preload.src = image.currentSrc || image.src;
    }
  });

  function setSide(nextShowingSecondary) {
    showingSecondary = nextShowingSecondary;
    wrapper.classList.toggle("is-showing-secondary", showingSecondary);
    button.setAttribute("aria-pressed", String(showingSecondary));
  }

  button.addEventListener("click", () => {
    if (isFlipping) {
      return;
    }

    const nextShowingSecondary = !showingSecondary;

    if (prefersReducedMotion.matches) {
      setSide(nextShowingSecondary);
      return;
    }

    isFlipping = true;
    button.disabled = true;
    setSide(nextShowingSecondary);

    window.setTimeout(() => {
      button.disabled = false;
      isFlipping = false;
    }, 760);
  });
})();

(() => {
  const switchers = Array.from(document.querySelectorAll("[data-lang-switch]"));

  if (switchers.length === 0) {
    return;
  }

  function closeAll(except = null) {
    switchers.forEach((switcher) => {
      if (switcher === except) {
        return;
      }

      switcher.classList.remove("is-open");
      const trigger = switcher.querySelector(".lang-switch-trigger");
      if (trigger) {
        trigger.setAttribute("aria-expanded", "false");
      }
    });
  }

  switchers.forEach((switcher) => {
    const trigger = switcher.querySelector(".lang-switch-trigger");

    if (!trigger) {
      return;
    }

    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      const willOpen = !switcher.classList.contains("is-open");
      closeAll();
      switcher.classList.toggle("is-open", willOpen);
      trigger.setAttribute("aria-expanded", String(willOpen));
    });
  });

  document.addEventListener("click", (event) => {
    if (switchers.some((switcher) => switcher.contains(event.target))) {
      return;
    }

    closeAll();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    closeAll();
  });
})();
