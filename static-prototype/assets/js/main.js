(function () {
  "use strict";

  // Mobile menu
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("site-nav");

  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Закрити меню" : "Відкрити меню");
      nav.classList.toggle("is-open", open);
    };

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    window.matchMedia("(min-width: 961px)").addEventListener("change", function (mq) {
      if (mq.matches) setOpen(false);
    });
  }

  // Header shadow once the page scrolls
  var header = document.querySelector(".site-header");
  if (header) {
    var sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:1px;";
    document.body.prepend(sentinel);
    new IntersectionObserver(function (entries) {
      header.classList.toggle("is-scrolled", !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  // Language switcher (UA / IT). The Italian version is not built yet,
  // so the switch only reflects the chosen state.
  var langButtons = document.querySelectorAll(".lang__btn");
  langButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      langButtons.forEach(function (other) {
        other.setAttribute("aria-pressed", String(other === btn));
      });
    });
  });

  // Reveal on scroll
  var revealItems = document.querySelectorAll("[data-reveal]");
  if (!("IntersectionObserver" in window)) {
    revealItems.forEach(function (el) {
      el.classList.add("is-visible");
    });
    return;
  }

  var revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
  );

  // Content already on screen at load is shown right away, so the first
  // view never depends on the observer firing.
  revealItems.forEach(function (el) {
    if (el.getBoundingClientRect().top < window.innerHeight) {
      el.classList.add("is-visible");
    } else {
      revealObserver.observe(el);
    }
  });
})();
