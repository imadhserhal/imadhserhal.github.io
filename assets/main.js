(function () {
  // Copy buttons (email). Falls back to selecting the text when the clipboard is refused.
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      var done = function () {
        btn.textContent = "Copied";
        setTimeout(function () { btn.textContent = "Copy"; }, 1600);
      };
      var fallback = function () {
        var target = btn.parentElement.querySelector(".value");
        if (!target) return;
        var range = document.createRange();
        range.selectNodeContents(target);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      };
      try {
        navigator.clipboard.writeText(text).then(done, fallback);
      } catch (e) {
        fallback();
      }
    });
  });

  // Silent demo videos: no audio track, always muted, no native controls.
  // They play while on screen and pause when scrolled away; a small button toggles them.
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var videos = document.querySelectorAll(".video video");

  videos.forEach(function (video) {
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.removeAttribute("controls");
    video.addEventListener("volumechange", function () {
      if (!video.muted) video.muted = true;
    });

    var btn = video.parentElement.querySelector(".vbtn");
    var userPaused = reduceMotion;
    var sync = function () {
      if (btn) btn.textContent = video.paused ? "Play" : "Pause";
    };
    video.addEventListener("play", sync);
    video.addEventListener("pause", sync);
    if (btn) {
      btn.addEventListener("click", function () {
        if (video.paused) {
          userPaused = false;
          video.play().catch(function () {});
        } else {
          userPaused = true;
          video.pause();
        }
      });
    }
    video._shouldPlay = function () { return !userPaused; };
    sync();
  });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var v = entry.target;
        if (entry.isIntersecting && v._shouldPlay()) {
          v.play().catch(function () {});
        } else if (!entry.isIntersecting) {
          v.pause();
        }
      });
    }, { threshold: 0.35 });
    videos.forEach(function (v) { io.observe(v); });
  }

  // Projects page: discipline tabs filter the overview cards and the sections.
  var tabs = document.querySelectorAll(".discipline-nav a[data-filter]");
  var sections = document.querySelectorAll("section.discipline");
  var cards = document.querySelectorAll(".pcard");
  var overview = document.getElementById("projects");
  var setFilter = function (f) {
    tabs.forEach(function (a) { a.classList.toggle("active", a.getAttribute("data-filter") === f); });
    var act = document.querySelector('.discipline-nav a[data-filter="' + f + '"]');
    if (act) {
      var ul = act.closest("ul");
      ul.scrollLeft = act.offsetLeft - (ul.clientWidth - act.offsetWidth) / 2;
    }
    sections.forEach(function (sec) { sec.hidden = f !== "all" && sec.id !== f; });
    cards.forEach(function (c) { c.hidden = f !== "all" && c.getAttribute("data-discipline") !== f; });
    var other = document.querySelector(".other-projects");
    if (other) other.hidden = f !== "all" && f !== "embedded";
    var shown = Array.prototype.filter.call(sections, function (sec) { return !sec.hidden; });
    sections.forEach(function (sec) { sec.classList.remove("first"); });
    if (shown[0]) shown[0].classList.add("first");
  };
  tabs.forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      setFilter(a.getAttribute("data-filter"));
      if (overview) overview.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  // A link to a project inside a filtered-out section shows everything again.
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute("data-filter")) return;
    var t = document.getElementById(a.getAttribute("href").slice(1));
    var sec = t && t.closest("section.discipline");
    if (sec && sec.hidden) setFilter("all");
  });
  if (location.hash && tabs.length) {
    var h = location.hash.slice(1);
    var hit = Array.prototype.some.call(tabs, function (a) { return a.getAttribute("data-filter") === h; });
    if (hit) setFilter(h);
  }

  // Opening a project loads all of its pictures at once instead of one by one while scrolling.
  var loadProject = function (id) {
    var t = id && document.getElementById(id);
    var art = t && (t.classList.contains("project") ? t : t.closest(".project"));
    if (!art) return;
    art.querySelectorAll('img[loading="lazy"]').forEach(function (img) { img.loading = "eager"; });
  };
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (a) loadProject(a.getAttribute("href").slice(1));
  });
  window.addEventListener("hashchange", function () { loadProject(location.hash.slice(1)); });
  if (location.hash) loadProject(location.hash.slice(1));

  // Long galleries and drawing sets show the first few items, with a button for the rest.
  document.querySelectorAll("[data-fold-keep]").forEach(function (box) {
    var keep = parseInt(box.getAttribute("data-fold-keep"), 10);
    var items = Array.prototype.slice.call(box.children);
    if (items.length <= keep) return;
    var noun = box.getAttribute("data-fold-noun") || "figures";
    var extra = items.slice(keep);
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "fold-btn";
    var open = false;
    var render = function () {
      extra.forEach(function (el) { el.hidden = !open; });
      btn.textContent = open ? "Show fewer " + noun : "Show all " + items.length + " " + noun;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    };
    btn.addEventListener("click", function () {
      open = !open;
      render();
      if (!open) box.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    box.insertAdjacentElement("afterend", btn);
    render();
  });

  // Back to top.
  if (document.querySelector(".project")) {
    var top = document.createElement("a");
    top.href = "#top";
    top.className = "to-top";
    top.textContent = "↑ Top";
    top.setAttribute("aria-label", "Back to top");
    top.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    document.body.appendChild(top);
    var onScroll = function () { top.classList.toggle("show", window.scrollY > 900); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Viewer: images and videos open full screen. Images zoom with the buttons,
  // the mouse wheel or a click, and pan by dragging or scrolling when zoomed.
  var media = document.querySelectorAll("main .project img, main .about-photo img, main .role-media img, main .video video");
  if (media.length) {
    var box = document.createElement("div");
    box.className = "viewer";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Media viewer");
    box.hidden = true;
    box.innerHTML =
      '<div class="viewer-bar">' +
        '<span class="viewer-zoom">' +
          '<button type="button" data-z="-" aria-label="Zoom out">−</button>' +
          '<button type="button" data-z="fit" class="viewer-pct">Fit</button>' +
          '<button type="button" data-z="+" aria-label="Zoom in">+</button>' +
        '</span>' +
        '<button type="button" class="viewer-play">Pause</button>' +
        '<button type="button" class="viewer-close" aria-label="Close viewer">Close ×</button>' +
      '</div>' +
      '<div class="viewer-stage"></div>' +
      '<p class="viewer-cap"></p>';
    document.body.appendChild(box);
    var stage = box.querySelector(".viewer-stage");
    var cap = box.querySelector(".viewer-cap");
    var zoomCtl = box.querySelector(".viewer-zoom");
    var pct = box.querySelector(".viewer-pct");
    var playBtn = box.querySelector(".viewer-play");
    var closeBtn = box.querySelector(".viewer-close");
    var current = null, scale = 1, lastFocus = null;

    var fitWidth = function () {
      if (!current || current.tagName !== "IMG") return 0;
      var r = stage.getBoundingClientRect();
      var nw = current.naturalWidth || r.width, nh = current.naturalHeight || r.height;
      return Math.min(r.width - 24, (r.height - 24) * nw / nh, nw * 2);
    };
    var applyZoom = function (s, cx, cy) {
      var old = scale;
      scale = Math.max(1, Math.min(6, s));
      var w = fitWidth();
      // keep the point under the cursor (or the centre) still while zooming
      var r = stage.getBoundingClientRect();
      var px = (cx === undefined ? r.width / 2 : cx - r.left);
      var py = (cy === undefined ? r.height / 2 : cy - r.top);
      var fx = (stage.scrollLeft + px) / old, fy = (stage.scrollTop + py) / old;
      current.style.width = (w * scale) + "px";
      stage.classList.toggle("zoomed", scale > 1);
      stage.scrollLeft = fx * scale - px;
      stage.scrollTop = fy * scale - py;
      pct.textContent = scale > 1 ? Math.round(scale * 100) + "%" : "Fit";
    };

    var open = function (el) {
      lastFocus = document.activeElement;
      stage.innerHTML = "";
      scale = 1;
      var fig = el.closest("figure") || el.closest(".stack") || el.closest(".split");
      var fc = fig ? fig.querySelector("figcaption") : null;
      cap.textContent = fc ? fc.textContent : (el.getAttribute("alt") || el.getAttribute("aria-label") || "");
      if (el.tagName === "IMG") {
        current = document.createElement("img");
        current.src = el.currentSrc || el.src;
        current.alt = el.alt;
        current.addEventListener("load", function () { applyZoom(1); });
        current.addEventListener("click", function (e) {
          if (moved) return;
          applyZoom(scale > 1 ? 1 : 2.5, e.clientX, e.clientY);
        });
        zoomCtl.hidden = false;
        playBtn.hidden = true;
      } else {
        current = document.createElement("video");
        if (el.poster) current.poster = el.poster;
        current.src = el.currentSrc || el.src;
        current.muted = true; current.defaultMuted = true;
        current.loop = true; current.playsInline = true;
        current.setAttribute("muted", ""); current.setAttribute("playsinline", "");
        current.addEventListener("volumechange", function () { if (!current.muted) current.muted = true; });
        current.addEventListener("play", function () { playBtn.textContent = "Pause"; });
        current.addEventListener("pause", function () { playBtn.textContent = "Play"; });
        el.pause();
        zoomCtl.hidden = true;
        playBtn.hidden = false;
      }
      stage.appendChild(current);
      stage.classList.remove("zoomed");
      box.hidden = false;
      document.documentElement.classList.add("viewer-open");
      if (current.tagName === "VIDEO") current.play().catch(function () {});
      else if (current.complete) applyZoom(1);
      closeBtn.focus();
    };
    var close = function () {
      if (current && current.tagName === "VIDEO") current.pause();
      box.hidden = true;
      stage.innerHTML = "";
      current = null;
      document.documentElement.classList.remove("viewer-open");
      if (lastFocus) lastFocus.focus();
    };

    media.forEach(function (el) {
      var trigger;
      if (el.tagName === "VIDEO") {
        trigger = document.createElement("button");
        trigger.type = "button";
        trigger.className = "vexpand";
        trigger.textContent = "View larger";
        el.parentElement.appendChild(trigger);
      } else {
        el.classList.add("zoomable");
        el.setAttribute("tabindex", "0");
        el.setAttribute("role", "button");
        el.setAttribute("aria-label", "View larger: " + (el.alt || "image"));
        el.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(el); }
        });
        trigger = el;
      }
      trigger.addEventListener("click", function () { open(el); });
    });

    closeBtn.addEventListener("click", close);
    playBtn.addEventListener("click", function () {
      if (!current) return;
      if (current.paused) current.play().catch(function () {}); else current.pause();
    });
    zoomCtl.addEventListener("click", function (e) {
      var z = e.target.getAttribute("data-z");
      if (z === "+") applyZoom(scale * 1.5);
      else if (z === "-") applyZoom(scale / 1.5);
      else if (z === "fit") applyZoom(1);
    });
    stage.addEventListener("click", function (e) { if (e.target === stage && scale === 1) close(); });
    stage.addEventListener("wheel", function (e) {
      if (!current || current.tagName !== "IMG") return;
      e.preventDefault();
      applyZoom(scale * (e.deltaY < 0 ? 1.2 : 1 / 1.2), e.clientX, e.clientY);
    }, { passive: false });

    // drag to pan when zoomed
    var drag = null, moved = false;
    stage.addEventListener("pointerdown", function (e) {
      moved = false;
      if (scale === 1 || e.pointerType !== "mouse") return;
      drag = { x: e.clientX, y: e.clientY, l: stage.scrollLeft, t: stage.scrollTop };
    });
    window.addEventListener("pointermove", function (e) {
      if (!drag) return;
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 4) moved = true;
      stage.scrollLeft = drag.l - (e.clientX - drag.x);
      stage.scrollTop = drag.t - (e.clientY - drag.y);
    });
    window.addEventListener("pointerup", function () { drag = null; });

    document.addEventListener("keydown", function (e) {
      if (box.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "+" || e.key === "=") applyZoom(scale * 1.5);
      else if (e.key === "-") applyZoom(scale / 1.5);
    });
    window.addEventListener("resize", function () { if (!box.hidden && current && current.tagName === "IMG") applyZoom(scale); });
  }

  if (window.hljs) window.hljs.highlightAll();
})();
