/* =========================================================
   motion.js — shared animation layer for every page
   Needs (loaded before this, all `defer`):
     gsap 3.12.5 · ScrollTrigger 3.12.5 · Lenis 1.1.13
   Every block guards for missing elements, so the same file
   runs on index / about / portfolio / contact / testimonial.
   Nothing is hidden by CSS: hidden start-states are only ever
   applied by GSAP, so if a library fails the page stays visible.
   ========================================================= */
(() => {
  "use strict";

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const loader = $(".mo-loader");
  const header = $("header");

  /* -------------------------------------------------------
     Accessibility upgrades that apply even without animation
     ------------------------------------------------------- */
  // Accordion headers are <div>s — make them keyboard-operable buttons.
  $$(".accordion-header").forEach((head) => {
    const item = head.parentElement;
    head.setAttribute("role", "button");
    head.setAttribute("tabindex", "0");
    head.setAttribute("aria-expanded", item.classList.contains("active") ? "true" : "false");
    head.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        head.click();
      }
    });
    head.addEventListener("click", () =>
      // existing script.js toggles .active first; sync aria afterwards
      requestAnimationFrame(() =>
        $$(".accordion-header").forEach((h) =>
          h.setAttribute("aria-expanded", h.parentElement.classList.contains("active") ? "true" : "false")
        )
      )
    );
  });

  // Icon-only social links get an accessible name + tooltip.
  const socialNames = {
    dribbble: "Dribbble", telegram: "Telegram", linkedin: "LinkedIn", twitter: "X (Twitter)",
    facebook: "Facebook", instagram: "Instagram", be: "Behance", github: "GitHub",
  };
  $$(".social-media a.fa, .footer-social-media a.fa").forEach((a) => {
    const key = Object.keys(socialNames).find((k) => a.classList.contains("fa-" + k));
    if (key && !a.hasAttribute("aria-label")) {
      a.setAttribute("aria-label", socialNames[key]);
      a.setAttribute("title", socialNames[key]);
    }
  });

  // Old AOS hooks (e.g. in leftover markup) must not fight GSAP.
  $$("[data-aos]").forEach((el) =>
    Object.keys(el.dataset)
      .filter((k) => k.startsWith("aos"))
      .forEach((k) => delete el.dataset[k])
  );

  // No GSAP (CDN blocked) or reduced motion → remove the overlay and stop.
  if (!window.gsap || !window.ScrollTrigger || reduceMotion) {
    if (loader) loader.classList.add("is-hidden");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: "expo.out", duration: 1.1 });
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  if (!location.hash) window.scrollTo(0, 0);

  /* -------------------------------------------------------
     Helpers
     ------------------------------------------------------- */

  // Split text into masked words (optionally chars) while keeping nested
  // markup like <span> and <br> intact. Uses custom tags so existing rules
  // such as ".design-parent h1 span { color }" don't hit every word.
  function split(el, type = "words") {
    if (el._moSplit) return el._moSplit;
    if (!el.hasAttribute("aria-label")) el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    const words = [];
    const chars = [];
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(" "));
              return;
            }
            const word = document.createElement("mo-word");
            word.setAttribute("aria-hidden", "true");
            const inner = document.createElement("mo-wi");
            if (type === "chars") {
              Array.from(part).forEach((c) => {
                const ch = document.createElement("mo-char");
                ch.textContent = c;
                inner.appendChild(ch);
                chars.push(ch);
              });
            } else {
              inner.textContent = part;
            }
            word.appendChild(inner);
            frag.appendChild(word);
            words.push(inner);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE && !/^(BR|IMG|SVG|I|MO-WORD)$/i.test(child.tagName)) {
          walk(child);
        }
      });
    };
    walk(el);
    el._moSplit = { words, chars };
    return el._moSplit;
  }

  // Lighter split for paragraphs: plain inline words, no masks.
  function splitScrub(el) {
    const out = [];
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) return frag.appendChild(document.createTextNode(" "));
            const w = document.createElement("mo-sw");
            w.textContent = part;
            frag.appendChild(w);
            out.push(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== "BR") {
          walk(child);
        }
      });
    };
    walk(el);
    return out;
  }

  const handled = new WeakSet();
  const mark = (els) => [].concat(els).forEach((e) => e && handled.add(e));

  /* -------------------------------------------------------
     Smooth scroll — Lenis driven by GSAP's ticker
     ------------------------------------------------------- */
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop(); // until the intro is done
  }

  const headerOffset = () => (header ? header.offsetHeight + 10 : 0);
  function scrollToTarget(target) {
    if (lenis) lenis.scrollTo(target, { offset: target === 0 ? 0 : -headerOffset(), duration: 1.4 });
    else if (target === 0) window.scrollTo({ top: 0, behavior: "smooth" });
    else target.scrollIntoView({ behavior: "smooth" });
  }

  // In-page anchors (#my-project, the scroll-to-top button)
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    e.preventDefault();
    if (id === "#") return scrollToTarget(0);
    const target = $(id);
    if (target) scrollToTarget(target);
  });

  /* -------------------------------------------------------
     Intro + page transitions (split stair panels)
     ------------------------------------------------------- */
  const pageName = ($(".page-heading h1") && $(".page-heading h1").textContent.trim()) || "Home";

  let firstVisit = true;
  try {
    firstVisit = !sessionStorage.getItem("mo-visited");
    sessionStorage.setItem("mo-visited", "1");
  } catch (_) {}

  const L = loader
    ? {
        accent: $$(".mo-loader__layer--accent span", loader),
        main: $$(".mo-loader__layer--main span", loader),
        name: $$(".mo-loader__name span", loader),
        label: $(".mo-loader__label span", loader),
        count: $(".mo-loader__count span", loader),
        bar: $(".mo-loader__bar", loader),
      }
    : null;

  function revealPage(onStart) {
    if (!loader) return onStart();
    loader.classList.add("is-controlled");
    loader.classList.remove("is-hidden");
    gsap.set([L.accent, L.main], { yPercent: 0 });

    const tl = gsap.timeline({ onComplete: () => loader.classList.add("is-hidden") });

    if (firstVisit) {
      // First page of the session: name + 0→100 counter
      L.label.textContent = "Full Stack Developer";
      const counter = { v: 0 };
      tl.from(L.name, { yPercent: 110, duration: 0.8, stagger: 0.08 })
        .from([L.label, L.count], { yPercent: 110, duration: 0.8 }, "<0.1")
        .to(
          counter,
          {
            v: 100,
            duration: 1.2,
            ease: "power2.inOut",
            onUpdate: () => (L.count.textContent = Math.round(counter.v)),
          },
          "<0.1"
        )
        .to(L.bar, { scaleX: 1, duration: 1.2, ease: "power2.inOut" }, "<")
        .to([L.name, L.label, L.count], { yPercent: -110, duration: 0.6, ease: "power3.in", stagger: 0.04 })
        .to(L.bar, { scaleX: 0, transformOrigin: "right", duration: 0.45, ease: "power3.in" }, "<");
    } else {
      // Arriving from another page: flash the page name
      gsap.set([L.name, L.count, L.bar], { autoAlpha: 0 });
      L.label.textContent = pageName;
      tl.from(L.label, { yPercent: 110, duration: 0.5 }).to(L.label, {
        yPercent: -110,
        duration: 0.4,
        ease: "power3.in",
        delay: 0.05,
      });
    }

    tl.to(L.main, { yPercent: -100, duration: 0.85, ease: "expo.inOut", stagger: 0.06 })
      .to(L.accent, { yPercent: -100, duration: 0.85, ease: "expo.inOut", stagger: 0.06 }, "<0.12")
      .add(onStart, "<0.2");
  }

  function leavePage(url, label) {
    if (!loader) return (location.href = url);
    if (lenis) lenis.stop();
    loader.classList.add("is-controlled");
    loader.classList.remove("is-hidden");
    gsap.set([L.name, L.count, L.bar], { autoAlpha: 0 });
    L.label.textContent = label || "";
    gsap
      .timeline({ onComplete: () => (location.href = url) })
      .fromTo(L.accent, { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: "expo.inOut", stagger: 0.05 })
      .fromTo(L.main, { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: "expo.inOut", stagger: 0.05 }, "<0.1")
      .fromTo(L.label, { yPercent: 110 }, { yPercent: 0, duration: 0.4 }, "-=0.2");
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (a.target === "_blank" || a.hasAttribute("download")) return;
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || /^(mailto|tel|javascript):/i.test(href)) return;
    let url;
    try {
      url = new URL(a.href, location.href);
    } catch (_) {
      return;
    }
    const sameSite = url.protocol === location.protocol && url.host === location.host;
    if (!sameSite || !/(\.html?|\/)$/.test(url.pathname)) return;
    if (url.pathname === location.pathname && url.hash) return;
    e.preventDefault();
    leavePage(url.href, a.textContent.trim());
  });

  // Back/forward cache restores the page mid-transition → clear the overlay.
  window.addEventListener("pageshow", (e) => {
    if (e.persisted && loader) {
      loader.classList.add("is-hidden");
      if (lenis) lenis.start();
    }
  });

  /* -------------------------------------------------------
     Scroll progress + smart header
     ------------------------------------------------------- */
  const progress = document.createElement("div");
  progress.className = "mo-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.appendChild(progress);
  gsap.to(progress, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

  if (header) {
    const showHeader = (show) =>
      gsap.to(header, { yPercent: show ? 0 : -110, duration: 0.45, ease: "power3.out", overwrite: "auto" });
    ScrollTrigger.create({
      start: "top top-=140",
      end: "max",
      onUpdate: (self) => showHeader(self.direction === -1 || header.contains(document.activeElement)),
      onLeaveBack: () => showHeader(true),
    });
    header.addEventListener("focusin", () => showHeader(true)); // keyboard users always see the nav
  }

  /* -------------------------------------------------------
     Custom cursor + magnetic elements (desktop only)
     ------------------------------------------------------- */
  if (finePointer) {
    const dot = document.createElement("div");
    const ring = document.createElement("div");
    dot.className = "mo-cursor is-hidden";
    ring.className = "mo-cursor-ring is-hidden";
    dot.setAttribute("aria-hidden", "true");
    ring.setAttribute("aria-hidden", "true");
    ring.innerHTML = '<span class="mo-cursor-ring__label"></span>';
    document.body.append(dot, ring);
    document.documentElement.classList.add("has-cursor");
    const ringLabel = ring.firstElementChild;

    const dx = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3" });
    const dy = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3" });
    const rx = gsap.quickTo(ring, "x", { duration: 0.55, ease: "power3" });
    const ry = gsap.quickTo(ring, "y", { duration: 0.55, ease: "power3" });

    window.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      dot.classList.remove("is-hidden");
      ring.classList.remove("is-hidden");
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
    });
    document.documentElement.addEventListener("pointerleave", () => {
      dot.classList.add("is-hidden");
      ring.classList.add("is-hidden");
    });

    // Small labels inside the ring on project cards
    $$(".accordion-item").forEach((el) => (el.dataset.cursor = "Open"));
    $$(".gallery .image").forEach((el) => (el.dataset.cursor = "View"));

    const hoverSel = "a, button, input, textarea, label, .night-toggle, .design-box, .skill-box, .detail";
    document.addEventListener("pointerover", (e) => {
      const labelled = e.target.closest("[data-cursor]");
      const hov = e.target.closest(hoverSel);
      ring.classList.toggle("is-label", !!labelled);
      ring.classList.toggle("is-hover", !labelled && !!hov);
      if (labelled) ringLabel.textContent = labelled.dataset.cursor;
    });

    const magnetic = (el, strength) => {
      const mx = gsap.quickTo(el, "x", { duration: 0.8, ease: "elastic.out(1, 0.35)" });
      const my = gsap.quickTo(el, "y", { duration: 0.8, ease: "elastic.out(1, 0.35)" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * strength);
        my((e.clientY - r.top - r.height / 2) * strength);
      });
      el.addEventListener("pointerleave", () => {
        mx(0);
        my(0);
      });
    };
    $$(".about-hire > a, .navTalk a, .night-toggle, .scroll-down").forEach((el) => magnetic(el, 0.35));
    $$(".social-media a, .footer-social-media a, .menuItem li").forEach((el) => magnetic(el, 0.5));
  }

  /* -------------------------------------------------------
     3D tilt + cursor spotlight (desktop only)
     ------------------------------------------------------- */
  function tilt(el, max = 10, lift = 1.05) {
    if (!finePointer) return;
    gsap.set(el, { transformPerspective: 900 });
    const rX = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3" });
    const rY = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3" });
    const sc = gsap.quickTo(el, "scale", { duration: 0.6, ease: "power3" });
    el.addEventListener("pointerenter", () => sc(lift));
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      rY((px - 0.5) * max * 2);
      rX(-(py - 0.5) * max * 2);
      el.style.setProperty("--mx", `${px * 100}%`);
      el.style.setProperty("--my", `${py * 100}%`);
    });
    el.addEventListener("pointerleave", () => {
      rX(0);
      rY(0);
      sc(1);
    });
  }

  /* -------------------------------------------------------
     Hero (index + about)
     ------------------------------------------------------- */
  const hero = $(".about");
  let heroTl = null;

  function buildHero() {
    if (!hero) return;
    mark(hero);
    const left = $(".about-left", hero);
    const right = $(".child-about-right", hero);
    heroTl = gsap.timeline({ paused: true, defaults: { ease: "expo.out", duration: 1.2 } });

    if (header && !$(".page-heading")) heroTl.from(header, { yPercent: -110, duration: 1 }, 0);

    if (left) {
      const hello = $(":scope > p:first-child", left);
      if (hello) heroTl.from(hello, { y: 30, autoAlpha: 0 }, 0.05);
      $$(":scope > h1", left).forEach((h, i) => {
        const { chars } = split(h, "chars");
        heroTl.from(chars, { yPercent: 115, rotate: 10, duration: 1.1, stagger: 0.022 }, 0.12 + i * 0.18);
      });
      const chips = $$(".hero-stack li", left);
      if (chips.length)
        heroTl.from(chips, { y: 16, autoAlpha: 0, scale: 0.9, stagger: 0.05, duration: 0.7, ease: "back.out(2)" }, 0.45);
      const para = $(".about-para2", left);
      if (para) heroTl.from(para, { y: 24, autoAlpha: 0, duration: 1 }, 0.55);
      heroTl.from($$(".about-hire > a", left), { y: 40, autoAlpha: 0, stagger: 0.1 }, 0.65);
      heroTl.from($$(".social-media > *", left), { y: 24, autoAlpha: 0, stagger: 0.05, duration: 0.8 }, 0.75);
    }

    if (right) {
      const [person, shape] = $$(":scope > img", right);
      const circles = $$(".circle", right);
      const boxes = $$(".box", right);

      if (shape) heroTl.from(shape, { scaleY: 0, transformOrigin: "50% 100%", duration: 1.3 }, 0.2);
      if (person)
        heroTl.fromTo(
          person,
          { clipPath: "inset(100% 0% 0% 0%)", yPercent: 8 },
          { clipPath: "inset(0% 0% 0% 0%)", yPercent: 0, duration: 1.5 },
          0.35
        );
      if (circles.length)
        heroTl.from(circles, { scale: 0, rotation: -180, duration: 1.2, stagger: 0.1, ease: "back.out(2)" }, 0.7);
      if (boxes.length) {
        heroTl.from(
          boxes,
          { scale: 0.3, autoAlpha: 0, y: 40, duration: 1, stagger: 0.12, ease: "back.out(1.7)" },
          0.9
        );
        // idle float on yPercent so it composes with mouse-parallax x/y
        boxes.forEach((b, i) =>
          gsap.to(b, { yPercent: i % 2 ? 14 : -14, duration: 2.2 + i * 0.4, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 2 })
        );
      }
      circles.forEach((c, i) =>
        gsap.to(c, { rotation: i % 2 ? "-=360" : "+=360", duration: 8 + i * 3, ease: "none", repeat: -1, delay: 2 })
      );

      // Mouse parallax: each layer at a different depth
      if (finePointer) {
        const layers = [
          ...(person ? [{ el: person, d: 14 }] : []),
          ...(shape ? [{ el: shape, d: 6 }] : []),
          ...boxes.map((el, i) => ({ el, d: 28 + i * 8 })),
          ...circles.map((el, i) => ({ el, d: 40 + i * 10 })),
        ].map(({ el, d }) => ({
          d,
          x: gsap.quickTo(el, "x", { duration: 1, ease: "power3" }),
          y: gsap.quickTo(el, "y", { duration: 1, ease: "power3" }),
        }));
        hero.addEventListener("pointermove", (e) => {
          const nx = e.clientX / innerWidth - 0.5;
          const ny = e.clientY / innerHeight - 0.5;
          layers.forEach((l) => {
            l.x(nx * l.d);
            l.y(ny * l.d);
          });
        });
      }

      // Subtle scroll parallax as the hero leaves
      gsap.to(right, {
        yPercent: -10,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
      });
    }
    if (left)
      gsap.to(left, {
        yPercent: 14,
        autoAlpha: 0.25,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
      });
  }

  /* -------------------------------------------------------
     Inner-page heading (About / Portfolio / Contact / …)
     ------------------------------------------------------- */
  let pageHeadTl = null;
  function buildPageHeading() {
    const ph = $(".page-heading");
    if (!ph) return;
    mark(ph);
    const h1 = $("h1", ph);
    const p = $("p", ph);
    pageHeadTl = gsap.timeline({ paused: true });
    if (header) pageHeadTl.from(header, { yPercent: -110, duration: 1 }, 0);
    if (h1) pageHeadTl.from(split(h1, "chars").chars, { yPercent: 120, rotate: 12, duration: 1.2, stagger: 0.04 }, 0.1);
    if (p) pageHeadTl.from(p, { y: 20, autoAlpha: 0, duration: 1 }, 0.45);
  }

  /* -------------------------------------------------------
     Scroll-driven sections
     ------------------------------------------------------- */
  function buildScroll() {
    // Section headings: masked word rise
    $$("section h1").forEach((h) => {
      if (h.closest(".about, .detail, .page-heading, .mo-marquee")) return;
      gsap.from(split(h, "words").words, {
        yPercent: 115,
        rotate: 6,
        duration: 1.1,
        stagger: 0.07,
        scrollTrigger: { trigger: h, start: "top 88%" },
      });
    });

    // Long paragraphs: words light up as you read down
    $$(".project-right > p, .work-section > p:first-of-type, .contact-left > p").forEach((p) => {
      gsap.fromTo(
        splitScrub(p),
        { opacity: 0.18 },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.1,
          scrollTrigger: { trigger: p, start: "top 85%", end: "bottom 55%", scrub: true },
        }
      );
    });

    // "Here to help" block: arch grows, photo wipes in, badges pop
    $$(".project").forEach((sec) => {
      mark(sec);
      const arch = $(".project-img-border", sec);
      const img = $(".child-project > img", sec);
      const boxes = $$(".project-box", sec);
      const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: "top 75%" } });
      if (arch) tl.from(arch, { scaleY: 0, transformOrigin: "50% 100%", duration: 1.2 });
      if (img)
        tl.fromTo(img, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4 }, "<0.15");
      if (boxes.length) {
        tl.from(boxes, { scale: 0.3, autoAlpha: 0, x: -30, stagger: 0.12, duration: 1, ease: "back.out(1.7)" }, "<0.4");
        boxes.forEach((b, i) =>
          gsap.to(b, { yPercent: i % 2 ? 12 : -12, duration: 2.4 + i * 0.3, ease: "sine.inOut", yoyo: true, repeat: -1 })
        );
      }
      if (img)
        gsap.to(img, {
          yPercent: -8,
          ease: "none",
          scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: true },
        });
    });

    // Specialized cards: pinned "deck spread" on desktop, simple stagger on mobile
    const designWrap = $(".design-child");
    if (designWrap) {
      const section = designWrap.closest("section") || designWrap.parentElement;
      mark(section);
      const cards = $$(".design-box", designWrap);
      cards.forEach((c) => tilt(c, 12, 1.08));
      const mm = gsap.matchMedia();
      mm.add("(min-width: 900px)", () => {
        const mid = Math.floor(cards.length / 2);
        gsap.set(cards[mid], { zIndex: 3 });
        // offsets from layout (ignore transforms) so recalculating on resize stays stable;
        // works for one row of cards or a 2×2 grid
        const toCenter = (el) => designWrap.clientWidth / 2 - (el.offsetLeft + el.offsetWidth / 2);
        const toMiddle = (el) => designWrap.clientHeight / 2 - (el.offsetTop + el.offsetHeight / 2);
        gsap
          .timeline({
            scrollTrigger: {
              trigger: section,
              start: "center center",
              end: "+=90%",
              pin: true,
              scrub: 1,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          })
          .fromTo(
            cards,
            {
              x: (i, el) => toCenter(el),
              y: (i, el) => toMiddle(el) + 60,
              rotation: (i) => (i - (cards.length - 1) / 2) * -8,
              scale: 0.85,
            },
            { x: 0, y: 0, rotation: 0, scale: 1, ease: "power2.inOut" }
          );
      });
      mm.add("(max-width: 899px)", () => {
        gsap.from(cards, {
          y: 70,
          autoAlpha: 0,
          rotationX: -35,
          transformPerspective: 800,
          stagger: 0.15,
          scrollTrigger: { trigger: designWrap, start: "top 85%" },
        });
      });
    }

    // Skills — full GSAP choreography
    // Each property has one owner so nothing fights:
    //   tile: entrance y/rotationX, scroll depth yPercent, hover tilt rotation/scale
    //   logo: entrance scale/rotation → wave scale, idle float yPercent,
    //         hover magnet x/y, hover flip rotationY
    const skillGrid = $(".all-skill-box");
    const skillBoxes = $$(".skill-box");
    if (skillBoxes.length) {
      mark($(".skill-section"));
      const logos = skillBoxes.map((b) => $("img", b)).filter(Boolean);
      const names = $$(".skill-box .skill-name");
      const cats = $$(".skill-box .skill-cat");
      logos.forEach((l) => (l.style.animation = "none")); // GSAP takes over the CSS float

      // 1. Entrance: tiles flip up in a diagonal sweep, logos spring in from the
      //    centre of the grid, then names and categories settle in
      let entered = false;
      const enter = gsap.timeline({
        scrollTrigger: { trigger: skillGrid || skillBoxes[0], start: "top 82%" },
        onComplete: () => {
          entered = true;
          if (waveActive) wave.play();
        },
      });
      enter
        .from(skillBoxes, {
          y: 110,
          rotationX: -75,
          autoAlpha: 0,
          transformPerspective: 900,
          transformOrigin: "50% 0%",
          duration: 1.1,
          ease: "expo.out",
          stagger: { grid: "auto", from: "start", amount: 0.55 },
        })
        .from(
          logos,
          { scale: 0, rotation: -120, duration: 1, ease: "back.out(2.2)", stagger: { grid: "auto", from: "center", amount: 0.5 } },
          "<0.25"
        )
        .from(names, { y: 18, autoAlpha: 0, duration: 0.7, stagger: 0.04 }, "<0.3")
        .from(cats, { autoAlpha: 0, letterSpacing: "0.55em", duration: 0.9, stagger: 0.04 }, "<0.1");

      // 2. Idle float: every logo bobs on its own random rhythm
      logos.forEach((l) =>
        gsap.to(l, {
          yPercent: -9,
          duration: gsap.utils.random(1.6, 2.6),
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: gsap.utils.random(0, 2),
        })
      );

      // 3. Ripple: a pulse sweeps diagonally across the grid every few seconds,
      //    only while the grid is on screen
      const wave = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 3.2 });
      wave.to(logos, {
        scale: 1.16,
        duration: 0.32,
        ease: "power2.out",
        yoyo: true,
        repeat: 1,
        stagger: { grid: "auto", from: "start", amount: 0.7 },
      });
      let waveActive = false;
      ScrollTrigger.create({
        trigger: skillGrid || skillBoxes[0],
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => {
          waveActive = self.isActive;
          if (!entered) return;
          waveActive ? wave.play() : wave.pause();
        },
      });

      // 4. Scroll depth (desktop): columns drift at different speeds while scrolling
      gsap.matchMedia().add("(min-width: 900px)", () => {
        gsap.to(skillBoxes, {
          yPercent: (i) => [0, -12, 5, -8, 9, -5][i % 6],
          ease: "none",
          scrollTrigger: { trigger: skillGrid, start: "top bottom", end: "bottom top", scrub: 1 },
        });
      });

      // 5. Hover (desktop): tile tilts, logo is pulled toward the cursor and flips
      skillBoxes.forEach((box) => {
        tilt(box, 14, 1.06);
        const img = $("img", box);
        if (!img || !finePointer) return;
        const mx = gsap.quickTo(img, "x", { duration: 0.6, ease: "power3" });
        const my = gsap.quickTo(img, "y", { duration: 0.6, ease: "power3" });
        box.addEventListener("pointerenter", () =>
          gsap.fromTo(img, { rotationY: 0 }, { rotationY: 360, duration: 1, ease: "power3.out" })
        );
        box.addEventListener("pointermove", (e) => {
          const r = box.getBoundingClientRect();
          mx(((e.clientX - r.left) / r.width - 0.5) * 20);
          my(((e.clientY - r.top) / r.height - 0.5) * 20);
        });
        box.addEventListener("pointerleave", () => {
          mx(0);
          my(0);
        });
      });
    }

    // Skill groups (chip cards under the logo grid)
    // glass cards rise in, then their chips pop in one by one
    const groups = $$(".skill-group");
    groups.forEach((g, gi) => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: g, start: "top 90%" } });
      tl.from(g, { y: 60, autoAlpha: 0, scale: 0.96, duration: 1, delay: (gi % 3) * 0.08 })
        .from($("h2", g), { x: -20, autoAlpha: 0, duration: 0.6 }, "<0.25")
        .from($$("li", g), { y: 14, scale: 0.6, autoAlpha: 0, duration: 0.55, ease: "back.out(2.4)", stagger: 0.045 }, "<0.1");
    });

    // Experience: card rises, then each highlight, then the tech tags
    $$(".exp-section").forEach((sec) => {
      mark(sec);
      const card = $(".exp-card", sec);
      if (!card) return;
      // card wipes up, then the role header assembles
      const head = $(".exp-head", sec);
      const intro = gsap.timeline({ scrollTrigger: { trigger: card, start: "top 82%" } });
      intro.fromTo(
        card,
        { y: 70, autoAlpha: 0, clipPath: "inset(12% 0% 0% 0% round 2rem)" },
        { y: 0, autoAlpha: 1, clipPath: "inset(0% 0% 0% 0% round 2rem)", duration: 1.2, clearProps: "clipPath,transform" }
      );
      if (head) {
        const title = $("h2", head);
        intro
          .from($(".exp-date", head), { y: 16, autoAlpha: 0, duration: 0.6 }, "<0.3")
          .from(title ? split(title, "words").words : [], { yPercent: 115, rotate: 5, stagger: 0.08, duration: 1 }, "<0.05")
          .from($(".exp-company", head), { x: -24, autoAlpha: 0, duration: 0.7 }, "<0.3")
          .from($(".exp-badge", head), { scale: 0, autoAlpha: 0, duration: 0.7, ease: "back.out(2.5)" }, "<0.1");
      }

      // timeline: progress line fills with scroll, items slide in, the one
      // crossing the middle of the screen lights up
      const list = $(".exp-list", sec);
      if (list) {
        gsap.fromTo(
          list,
          { "--exp-progress": 0 },
          {
            "--exp-progress": 1,
            ease: "none",
            scrollTrigger: { trigger: list, start: "top 60%", end: "bottom 60%", scrub: 0.6 },
          }
        );
        $$(":scope > li", list).forEach((li) => {
          gsap
            .timeline({ scrollTrigger: { trigger: li, start: "top 88%" } })
            .from(li, { x: 60, autoAlpha: 0, duration: 0.9 })
            .from(li, { "--badge-scale": 0, "--badge-rotate": "-90deg", duration: 0.8, ease: "back.out(2.5)" }, "<0.15");
          ScrollTrigger.create({
            trigger: li,
            start: "top 55%",
            end: "bottom 55%",
            toggleClass: { targets: li, className: "is-active" },
          });
        });
      }

      gsap.from($$(".exp-tags li", sec), {
        scale: 0.6,
        autoAlpha: 0,
        stagger: 0.03,
        duration: 0.6,
        ease: "back.out(2)",
        scrollTrigger: { trigger: $(".exp-tags", sec), start: "top 95%" },
      });
    });

    // Education journey — the line draws across; as it reaches each milestone
    // the node pops and lights up, the card rises and its watermark year slides in
    $$(".edu-section").forEach((sec) => {
      mark(sec);
      const intro = $(".edu-intro", sec);
      if (intro)
        gsap.from(intro, { y: 20, autoAlpha: 0, duration: 0.9, scrollTrigger: { trigger: intro, start: "top 90%" } });

      const track = $(".edu-track", sec);
      if (!track) return;
      const steps = $$(".edu-step", track);
      steps.forEach((st) => st.classList.remove("is-on"));
      const tl = gsap.timeline({ scrollTrigger: { trigger: track, start: "top 78%" } });
      tl.fromTo(track, { "--edu-progress": 0 }, { "--edu-progress": 1, duration: 2, ease: "power2.inOut" }, 0);
      steps.forEach((st, i) => {
        const at = 0.1 + i * (1.75 / steps.length);
        tl.from($(".edu-node", st), {
          scale: 0,
          rotation: -90,
          duration: 0.6,
          ease: "back.out(2.6)",
          onStart: () => st.classList.add("is-on"),
        }, at)
          .from($(".edu-card", st), { y: 50, autoAlpha: 0, rotationX: -18, transformPerspective: 900, duration: 0.9 }, at + 0.05)
          .from($(".edu-watermark", st), { xPercent: 35, autoAlpha: 0, duration: 1.1 }, at + 0.2);
      });

      gsap.from($$(".edu-langs > *", sec), {
        y: 16,
        autoAlpha: 0,
        stagger: 0.08,
        duration: 0.7,
        scrollTrigger: { trigger: $(".edu-langs", sec) || track, start: "top 92%" },
      });
    });

    buildMarquee();

    // Projects accordion
    const accItems = $$(".accordion-item");
    if (accItems.length) {
      mark($(".work-section"));
      // each row: divider draws, title rises word by word, label slides in
      accItems.forEach((item) => {
        const head = $(".accordion-header", item);
        const title = head && $(":scope > span:not(.proj-meta)", head);
        const tl = gsap.timeline({ scrollTrigger: { trigger: item, start: "top 90%" } });
        tl.fromTo(item, { "--line": 0 }, { "--line": 1, duration: 1.1, ease: "expo.inOut" });
        if (title) tl.from(split(title, "words").words, { yPercent: 115, stagger: 0.05, duration: 0.9 }, "<0.35");
        tl.from($$(".proj-meta", head), { autoAlpha: 0, x: 20, duration: 0.6, clearProps: "transform" }, "<0.2");
        // the chevron's rotation belongs to CSS (open/closed) — only fade it
        tl.from($$("i", head), { autoAlpha: 0, duration: 0.6, clearProps: "opacity,visibility" }, "<0.1");
      });
      $$(".accordion-header").forEach((head) =>
        head.addEventListener("click", () => {
          requestAnimationFrame(() => {
            const item = head.parentElement;
            if (item.classList.contains("active")) {
              gsap.from($(".accordion-content", item).children, {
                y: 24,
                autoAlpha: 0,
                stagger: 0.06,
                duration: 0.8,
                delay: 0.1,
                clearProps: "transform,opacity,visibility",
              });
            }
          });
          // content height changed → recalc trigger positions after the CSS transition
          setTimeout(() => ScrollTrigger.refresh(), 450);
        })
      );
    }

    // Statistics bento — cards rise, icon spins in, number counts up while the
    // pips light one by one, then the number bounces and a shine sweeps across
    const statWrap = $(".stats-bento");
    if (statWrap) {
      mark(statWrap);
      const stats = $$(".stat", statWrap);
      gsap.from(stats, {
        y: 60,
        autoAlpha: 0,
        scale: 0.94,
        stagger: 0.1,
        duration: 1.1,
        scrollTrigger: { trigger: statWrap, start: "top 85%" },
      });
      stats.forEach((card, i) => {
        tilt(card, 7, 1.02);
        const val = $(".stat__value", card);
        if (!val) return;
        const num = $(".stat__num", card);
        const pips = $$(".stat__pips span", card);
        const target = parseInt(val.dataset.count, 10) || 0;
        const obj = { v: 0 };
        const render = () => {
          const n = Math.round(obj.v);
          val.textContent = n;
          pips.forEach((p, k) => p.classList.toggle("is-on", k < n));
        };
        render(); // start at 0 with dark pips
        const tl = gsap.timeline({ paused: true });
        tl.from($(".stat__icon", card), { scale: 0, rotation: -120, duration: 0.9, ease: "back.out(2.4)" })
          .to(obj, { v: target, duration: target > 6 ? 2.2 : 1.5, ease: "power2.out", onUpdate: render }, "<0.15")
          .to(num, { scale: 1.1, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" })
          .fromTo(card, { "--shine": -120 }, { "--shine": 120, duration: 1.1, ease: "power2.inOut" }, "<");
        ScrollTrigger.create({
          trigger: card,
          start: "top 88%",
          once: true,
          onEnter: () => gsap.delayedCall(0.25 + i * 0.12, () => tl.play()),
        });
      });
    }

    const details = $$(".detail");
    if (details.length) {
      mark(details[0].closest("section"));
      gsap.from(details, {
        y: 50,
        autoAlpha: 0,
        stagger: 0.1,
        scrollTrigger: { trigger: details[0].parentElement, start: "top 88%" },
      });
      $$(".detail img").forEach((img) =>
        gsap.from(img, {
          rotation: -90,
          scale: 0,
          duration: 1.2,
          ease: "back.out(2)",
          scrollTrigger: { trigger: img, start: "top 90%" },
        })
      );
    }
    // Count up to the number already written in the page (keeps the suffix, e.g. "5+")
    $$(".detail h1").forEach((el) => {
      const m = el.textContent.trim().match(/^(\d+)(.*)$/);
      if (!m) return;
      const target = parseInt(m[1], 10);
      const suffix = m[2];
      const obj = { v: 0 };
      el.setAttribute("aria-label", el.textContent.trim());
      ScrollTrigger.create({
        trigger: el,
        start: "top 90%",
        once: true,
        onEnter: () =>
          gsap.fromTo(
            obj,
            { v: 0 },
            { v: target, duration: 2, ease: "power3.out", onUpdate: () => (el.textContent = Math.round(obj.v) + suffix) }
          ),
      });
    });

    // Contact
    $$(".contacts").forEach((sec) => {
      mark(sec);
      const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: "top 75%" } });
      tl.from($$(".contact", sec), { x: -60, autoAlpha: 0, stagger: 0.12 });
      tl.from($$(".contact-right > *", sec), { y: 40, autoAlpha: 0, stagger: 0.08, duration: 1 }, "<0.1");
      tl.from($$(".contact img", sec), { scale: 0, rotation: -45, stagger: 0.12, ease: "back.out(2)" }, "<0.2");
    });

    // Footer
    $$(".footer").forEach((sec) => {
      mark(sec);
      const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: "top 95%" } });
      const title = $(".footer-title", sec);
      if (title) tl.from(split(title, "words").words, { yPercent: 115, rotate: 6, stagger: 0.06, duration: 1.1 });
      tl.from($$(".footer-eyebrow, .footer-actions > *, .footer-Name h2", sec), { y: 30, autoAlpha: 0, stagger: 0.08 }, "<0.1");
      tl.from($(".footer-bottom", sec), { autoAlpha: 0, y: 20 }, "<0.3");
      tl.from(
        $$(".footer-social-media a", sec),
        { y: 30, scale: 0.4, autoAlpha: 0, stagger: 0.06, ease: "back.out(2)" },
        "<0.1"
      );
    });

    // Image gallery cards (if present)
    const gallery = $$(".gallery .image");
    if (gallery.length) {
      gsap.set(gallery, { autoAlpha: 0, y: 80 });
      ScrollTrigger.batch(gallery, {
        start: "top 92%",
        once: true,
        onEnter: (batch) => gsap.to(batch, { y: 0, autoAlpha: 1, stagger: 0.1, duration: 1.1 }),
      });
    }

    // Everything else (testimonial slider etc.): gentle rise
    $$("main > section, body > section").forEach((sec) => {
      if (handled.has(sec)) return;
      gsap.from(sec, { y: 60, autoAlpha: 0, duration: 1.2, scrollTrigger: { trigger: sec, start: "top 88%" } });
    });
  }

  /* -------------------------------------------------------
     Typographic marquee — drifts, speeds up and flips with scroll
     ------------------------------------------------------- */
  function buildMarquee() {
    const wraps = $$(".mo-marquee");
    if (!wraps.length) return;

    let velocity = 0;
    let scrollDir = 1;
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        velocity = self.getVelocity();
        scrollDir = self.direction;
      },
    });

    const rows = [];
    wraps.forEach((wrap) => {
      const state = { visible: false };
      ScrollTrigger.create({
        trigger: wrap,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => (state.visible = self.isActive),
      });
      gsap.from(wrap, { autoAlpha: 0, y: 60, scrollTrigger: { trigger: wrap, start: "top 92%" } });

      $$(".mo-marquee__row", wrap).forEach((row, i) => {
        const track = $(".mo-marquee__track", row);
        if (!track) return;
        const copies = Math.max(2, Math.ceil((innerWidth * 2) / Math.max(track.offsetWidth, 1)) + 1);
        for (let c = 1; c < copies; c++) {
          const clone = track.cloneNode(true);
          clone.setAttribute("aria-hidden", "true");
          row.appendChild(clone);
        }
        // start with a full word at the visible left edge (the tilted band bleeds 5% each side)
        const w0 = track.offsetWidth;
        rows.push({
          row,
          track,
          state,
          dir: i % 2 ? 1 : -1,
          x: w0 ? gsap.utils.wrap(-w0, 0, wrap.clientWidth * 0.05 + 24) : 0,
          w: w0,
          skew: gsap.quickTo(row, "skewX", { duration: 0.5, ease: "power3" }),
        });
      });
    });

    gsap.ticker.add((_, dt) => {
      const boost = 1 + Math.min(Math.abs(velocity) / 250, 8);
      const skew = gsap.utils.clamp(-12, 12, -velocity / 300);
      rows.forEach((r) => {
        if (!r.state.visible || !r.w) return;
        r.x = gsap.utils.wrap(-r.w, 0, r.x + r.dir * scrollDir * 0.06 * dt * boost);
        gsap.set(r.row, { x: r.x });
        r.skew(skew);
      });
      velocity *= 0.92;
    });

    ScrollTrigger.addEventListener("refresh", () => rows.forEach((r) => (r.w = r.track.offsetWidth)));
  }

  /* -------------------------------------------------------
     Boot
     ------------------------------------------------------- */
  buildHero();
  buildPageHeading();

  const start = () => {
    buildScroll();
    if (heroTl) heroTl.play();
    if (pageHeadTl) pageHeadTl.play();
    if (lenis) lenis.start();
    ScrollTrigger.refresh();
    if (location.hash) {
      const t = $(location.hash);
      if (t) setTimeout(() => scrollToTarget(t), 300);
    }
  };

  // Wait for fonts so splitting/measuring is accurate — never longer than 1.2s
  const fontsReady = document.fonts
    ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))])
    : Promise.resolve();
  fontsReady.then(() => revealPage(start));

  // Late-loading images change layout → recompute trigger positions
  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
