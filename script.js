(function () {
  const media = window.portfolioMedia || {};
  const reels = Array.isArray(media.reels) ? media.reels : [];
  const photos = Array.isArray(media.photos) ? media.photos : [];
  const reelsList = document.getElementById("reelsList");
  const photosGrid = document.getElementById("photosGrid");

  const placeholderCount = {
    reels: 3,
    photos: 9
  };
  const videoExtensions = new Set(["mp4", "mov", "m4v", "webm", "ogv"]);
  const programmaticPauses = new WeakSet();
  let reelsMuted = true;
  const reelMuteControls = [];

  function getExtension(src = "") {
    const cleanSrc = src.split("?")[0].split("#")[0];
    const extension = cleanSrc.includes(".") ? cleanSrc.split(".").pop() : "";
    return extension.toLowerCase();
  }

  function isVideoItem(item) {
    return item.type === "video" || videoExtensions.has(getExtension(item.src));
  }

  function createFallback(item, label) {
    const fallback = document.createElement("div");
    fallback.className = "media-fallback";
    fallback.textContent = label;
    return fallback;
  }

  function markUnavailable(event) {
    const card = event.currentTarget.closest(".reel-card, .photo-card");
    if (card) {
      card.classList.add("is-unavailable");
    }
  }

  function createVideo(item, label, options = {}) {
    const video = document.createElement("video");
    const muted = options.muted === true;

    video.src = item.src;
    video.defaultMuted = muted;
    video.muted = muted;
    video.volume = muted ? 0 : 1;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = true;
    video.preload = options.preload || "metadata";
    video.controls = options.controls !== false;
    video.setAttribute("aria-label", label);
    video.setAttribute("controlsList", "nodownload");
    video.dataset.autoplayWhenVisible = "true";
    video.dataset.mediaGroup = options.group || "media";

    if (item.poster) {
      video.poster = item.poster;
    }

    video.addEventListener("error", markUnavailable);
    video.addEventListener("play", () => {
      video.dataset.userPaused = "false";
    });
    video.addEventListener("pause", () => {
      if (!programmaticPauses.has(video) && !video.ended) {
        video.dataset.userPaused = "true";
      }
    });
    return video;
  }

  function createIcon(name) {
    const icon = document.createElement("span");
    icon.className = `reel-action-icon reel-action-icon-${name}`;
    icon.style.setProperty("--icon-mask", `url(assets/icons/${name}.png)`);
    icon.setAttribute("aria-hidden", "true");
    return icon;
  }

  function createActionButton(name, label, count) {
    const button = document.createElement("button");
    const countText = document.createElement("span");

    button.type = "button";
    button.className = `reel-action-button reel-action-${name}`;
    button.setAttribute("aria-label", label);
    button.append(createIcon(name));
    countText.className = "reel-action-count";
    countText.textContent = count;
    button.append(countText);

    return button;
  }

  function createMuteButton(video) {
    const button = document.createElement("button");
    const icon = document.createElement("span");

    button.type = "button";
    button.className = "reel-action-button reel-action-mute";
    icon.className = "reel-action-icon";
    icon.setAttribute("aria-hidden", "true");
    button.append(icon);

    function syncState() {
      video.muted = reelsMuted;
      video.volume = reelsMuted ? 0 : 1;
      icon.style.setProperty(
        "--icon-mask",
        `url(assets/icons/${reelsMuted ? "mute" : "unmute"}.png)`
      );
      button.setAttribute(
        "aria-label",
        reelsMuted ? "Unmute reel" : "Mute reel"
      );
    }

    syncState();
    reelMuteControls.push(syncState);

    button.addEventListener("click", (event) => {
      event.stopPropagation();
      reelsMuted = !reelsMuted;
      reelMuteControls.forEach((sync) => sync());
    });

    return button;
  }

  function createReelOverlay(item, video, index) {
    const overlay = document.createElement("div");
    const meta = document.createElement("div");
    const avatar = document.createElement("span");
    const avatarImage = document.createElement("img");
    const copy = document.createElement("div");
    const username = document.createElement("strong");
    const caption = document.createElement("p");
    const actions = document.createElement("div");
    const playIndicator = document.createElement("div");
    const muteButton = createMuteButton(video);
    const likeButton = createActionButton("heart", "Like reel", "8210");
    const commentButton = createActionButton("comment", "Comment on reel", "3994");
    const shareButton = createActionButton("share", "Share reel", "1384");

    overlay.className = "reel-overlay";
    meta.className = "reel-meta";
    avatar.className = "reel-avatar";
    avatarImage.src = "assets/logo.png";
    avatarImage.alt = "Roxie";
    copy.className = "reel-copy";
    username.textContent = "Hyeyoung Park";
    caption.textContent = "roxie2339@gmail.com";
    actions.className = "reel-actions";
    playIndicator.className = "reel-play-indicator";
    playIndicator.setAttribute("aria-hidden", "true");

    avatar.append(avatarImage);
    copy.append(username, caption);
    meta.append(avatar, copy);
    muteButton.classList.add("reel-mute-button");
    actions.append(likeButton, commentButton, shareButton);
    overlay.append(meta, actions, muteButton, playIndicator);

    likeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      likeButton.classList.toggle("is-liked");
    });

    commentButton.addEventListener("click", (event) => {
      event.stopPropagation();
      window.location.href = "mailto:roxie2339@gmail.com";
    });

    shareButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const shareUrl = "https://roxiepark.github.io";

      if (navigator.share) {
        navigator.share({ url: shareUrl }).catch(() => {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl).catch(() => {});
      } else {
        window.open(shareUrl, "_blank", "noopener");
      }
    });

    video.addEventListener("play", () => {
      playIndicator.classList.remove("is-visible");
    });
    video.addEventListener("pause", () => {
      if (!programmaticPauses.has(video) && !video.ended) {
        playIndicator.classList.add("is-visible");
      }
    });

    return overlay;
  }

  function renderReel(item, index) {
    const card = document.createElement("article");
    card.className = "reel-card";

    const video = createVideo(item, item.title || `REEL ${index + 1}`, {
      controls: false,
      muted: true,
      preload: index === 0 ? "auto" : "metadata",
      group: "reels"
    });
    const overlay = createReelOverlay(item, video, index);

    card.addEventListener("click", (event) => {
      if (event.target.closest("button")) {
        return;
      }

      if (video.paused) {
        video.dataset.userPaused = "false";
        video.play().catch(() => {});
      } else {
        video.dataset.userPaused = "true";
        video.pause();
      }
    });

    card.append(video, overlay, createFallback(item, "VIDEO UNAVAILABLE"));
    return card;
  }

  function renderPhoto(item, index) {
    const card = document.createElement("article");
    card.className = `photo-card ${isVideoItem(item) ? "is-video" : "is-image"}`;

    if (isVideoItem(item)) {
      const video = createVideo(item, item.title || `VIDEO ${index + 1}`, {
        muted: true,
        group: "photos"
      });
      card.append(video, createFallback(item, "VIDEO UNAVAILABLE"));
      return card;
    }

    const image = document.createElement("img");
    image.src = item.src;
    image.alt = item.title || `PHOTO ${index + 1}`;
    image.decoding = "async";
    image.dataset.ready = "false";

    let retries = 0;
    const maxRetries = 3;

    function settle() {
      image.dataset.ready = "true";
      image.dispatchEvent(new Event("mediaready"));
    }

    function retryLoad() {
      if (retries >= maxRetries) {
        markUnavailable({ currentTarget: image });
        settle();
        return;
      }

      retries += 1;
      const delay = retries * 500;
      window.setTimeout(() => {
        const separator = item.src.includes("?") ? "&" : "?";
        image.src = `${item.src}${separator}retry=${retries}-${Date.now()}`;
      }, delay);
    }

    image.addEventListener("load", () => {
      if (image.naturalWidth > 40 && image.naturalHeight > 40) {
        if (image.decode) {
          image
            .decode()
            .then(settle)
            .catch(settle);
        } else {
          settle();
        }
        return;
      }

      retryLoad();
    });
    image.addEventListener("error", retryLoad);

    card.append(image, createFallback(item, "PHOTO UNAVAILABLE"));
    return card;
  }

  function renderPlaceholder(kind, index) {
    const card = document.createElement("article");
    card.className = kind === "reels" ? "reel-card" : "photo-card";

    const fill = document.createElement("div");
    fill.className = `placeholder-fill ${kind === "reels" ? "reel-placeholder" : "photo-placeholder"}`;
    fill.textContent = kind === "reels" ? `REEL ${index + 1}` : `PHOTO ${index + 1}`;

    card.append(fill);
    return card;
  }

  let photoCardElements = [];

  function layoutPhotosColumns(columns) {
    const columnEls = Array.from({ length: columns }, () => {
      const column = document.createElement("div");
      column.className = "photos-column";
      return column;
    });

    photoCardElements.forEach((card, index) => {
      columnEls[index % columns].append(card);
    });

    photosGrid.replaceChildren(...columnEls);
  }

  function mount() {
    const reelItems = reels.length
      ? reels.map(renderReel)
      : Array.from({ length: placeholderCount.reels }, (_, index) =>
          renderPlaceholder("reels", index)
        );

    photoCardElements = photos.length
      ? photos.map(renderPhoto)
      : Array.from({ length: placeholderCount.photos }, (_, index) =>
          renderPlaceholder("photos", index)
        );

    reelsList.replaceChildren(...reelItems);
    layoutPhotosColumns(1);
    const refreshAutoplay = observeAutoplayVideos();
    snapPaneOnScrollEnd(".reels-pane .pane-scroll", reelsList, ".reel-card");
    snapPaneOnScrollEnd(".photos-pane .pane-scroll", photosGrid, ".photo-card", {
      topOffset: () => parseFloat(getComputedStyle(photosGrid).paddingTop) || 0,
      shouldSnap: () => photosGrid.dataset.columns === "1"
    });
    syncCustomScrollbars();
    enablePhotosZoom();
    enablePaneTabs();
    setupPaneLoader(
      "reels",
      ".reels-pane",
      Array.from(reelsList.querySelectorAll("video")),
      refreshAutoplay
    );
    setupPaneLoader(
      "photos",
      ".photos-pane",
      Array.from(photosGrid.querySelectorAll("img, video")),
      refreshAutoplay
    );
  }

  const MAX_LOADING_MS = 45000;

  function setupPaneLoader(paneName, paneSelector, mediaElements, refreshAutoplay) {
    const paneEl = document.querySelector(paneSelector);
    const loader = document.querySelector(`${paneSelector} .pane-loading`);
    const menuOption = document.querySelector(`.pane-menu-option[data-pane="${paneName}"]`);

    if (!loader && !menuOption) {
      return;
    }

    function setProgress(percent) {
      loader?.style.setProperty("--progress", `${percent}%`);
      menuOption?.style.setProperty("--progress", `${percent}%`);
    }

    setProgress(0);

    let finishCalled = false;
    let fallbackTimer;

    function finish() {
      if (finishCalled) {
        return;
      }
      finishCalled = true;
      window.clearTimeout(fallbackTimer);
      setProgress(100);

      paneEl?.classList.remove("is-loading");
      requestAnimationFrame(() => refreshAutoplay?.(paneEl));

      if (loader) {
        loader.classList.add("is-complete");
        window.setTimeout(() => loader.remove(), 250);
      }

      if (menuOption) {
        menuOption.disabled = false;
      }
    }

    if (!mediaElements.length) {
      finish();
      return;
    }

    fallbackTimer = window.setTimeout(finish, MAX_LOADING_MS);

    const total = mediaElements.length;
    let loadedCount = 0;

    function registerLoaded() {
      loadedCount += 1;
      setProgress((loadedCount / total) * 100);

      if (loadedCount >= total) {
        finish();
      }
    }

    mediaElements.forEach((el) => {
      if (el.tagName === "IMG") {
        if (el.dataset.ready === "true") {
          registerLoaded();
        } else {
          el.addEventListener("mediaready", registerLoaded, { once: true });
        }
      } else if (el.tagName === "VIDEO") {
        const readyEvent = el.preload === "auto" ? "canplay" : "loadedmetadata";
        const readyState = el.preload === "auto" ? 3 : 1;

        if (el.readyState >= readyState) {
          registerLoaded();
        } else {
          el.addEventListener(readyEvent, registerLoaded, { once: true });
          el.addEventListener("error", registerLoaded, { once: true });
        }
      }
    });
  }

  function enablePaneTabs() {
    const contentGrid = document.querySelector(".content-grid");
    const menuOptions = Array.from(document.querySelectorAll(".pane-menu-option"));
    const backButton = document.querySelector(".pane-back");

    if (!contentGrid || !menuOptions.length) {
      return;
    }

    menuOptions.forEach((option) => {
      option.disabled = true;
      option.addEventListener("click", () => {
        if (option.disabled) {
          return;
        }

        contentGrid.dataset.activePane = option.dataset.pane;
      });
    });

    backButton?.addEventListener("click", () => {
      delete contentGrid.dataset.activePane;
    });
  }

  function enablePhotosZoom() {
    const minColumns = 1;
    const mobileQuery = window.matchMedia("(max-width: 760px)");
    const pane = document.querySelector(".photos-pane");

    if (!pane || !photosGrid) {
      return;
    }

    function maxColumns() {
      return mobileQuery.matches ? 2 : 3;
    }

    let columns = maxColumns();

    function applyColumns(next) {
      columns = Math.min(Math.max(next, minColumns), maxColumns());
      photosGrid.dataset.columns = String(columns);
      layoutPhotosColumns(columns);
    }

    let wheelCooldown = false;

    pane.addEventListener(
      "wheel",
      (event) => {
        if (!event.ctrlKey) {
          return;
        }

        event.preventDefault();

        if (wheelCooldown) {
          return;
        }

        wheelCooldown = true;
        applyColumns(event.deltaY < 0 ? columns - 1 : columns + 1);
        window.setTimeout(() => {
          wheelCooldown = false;
        }, 220);
      },
      { passive: false }
    );

    function touchDistance(touches) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.hypot(dx, dy);
    }

    let pinch = null;
    const pinchStepThreshold = 0.18;

    pane.addEventListener(
      "touchstart",
      (event) => {
        if (event.touches.length === 2) {
          pinch = { distance: touchDistance(event.touches), columns };
        }
      },
      { passive: true }
    );

    pane.addEventListener(
      "touchmove",
      (event) => {
        if (!pinch || event.touches.length !== 2) {
          return;
        }

        event.preventDefault();

        const distance = touchDistance(event.touches);
        const ratio = distance / pinch.distance;

        if (ratio > 1 + pinchStepThreshold) {
          applyColumns(pinch.columns - 1);
          pinch = { distance, columns };
        } else if (ratio < 1 - pinchStepThreshold) {
          applyColumns(pinch.columns + 1);
          pinch = { distance, columns };
        }
      },
      { passive: false }
    );

    function endPinch(event) {
      if (event.touches.length < 2) {
        pinch = null;
      }
    }

    pane.addEventListener("touchend", endPinch, { passive: true });
    pane.addEventListener("touchcancel", endPinch, { passive: true });

    const scrollArea = pane.querySelector(".pane-scroll");

    pane.addEventListener("click", (event) => {
      if (columns === 1) {
        return;
      }

      const card = event.target.closest(".photo-card");

      if (!card) {
        return;
      }

      applyColumns(1);

      if (!scrollArea) {
        return;
      }

      const topOffset = parseFloat(getComputedStyle(photosGrid).paddingTop) || 0;
      const scrollRect = scrollArea.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const targetTop = Math.max(
        scrollArea.scrollTop + cardRect.top - scrollRect.top - topOffset,
        0
      );

      scrollArea.scrollTo({ top: targetTop, behavior: "auto" });
    });

    applyColumns(columns);
  }

  function snapPaneOnScrollEnd(paneSelector, list, cardSelector, options = {}) {
    const shouldSnap = options.shouldSnap || (() => true);
    const topOffset = options.topOffset || (() => 0);
    const scrollArea = document.querySelector(paneSelector);

    if (!scrollArea || !list) {
      return;
    }

    let snapTimer = 0;
    let isSnapping = false;

    function cards() {
      return Array.from(list.querySelectorAll(cardSelector));
    }

    function clampScrollTop(value) {
      const maxScroll = Math.max(scrollArea.scrollHeight - scrollArea.clientHeight, 0);
      return Math.min(Math.max(value, 0), maxScroll);
    }

    function snapToClosestCard(behavior = "smooth") {
      const items = cards();

      if (!items.length) {
        return;
      }

      const scrollRect = scrollArea.getBoundingClientRect();
      const closestCard = items.reduce((closest, card) => {
        const distance = Math.abs(
          card.getBoundingClientRect().top - scrollRect.top
        );

        return distance < closest.distance ? { card, distance } : closest;
      }, { card: items[0], distance: Infinity }).card;
      const targetTop = clampScrollTop(
        scrollArea.scrollTop +
          closestCard.getBoundingClientRect().top -
          scrollRect.top -
          topOffset()
      );

      if (Math.abs(targetTop - scrollArea.scrollTop) < 2) {
        return;
      }

      isSnapping = true;
      scrollArea.scrollTo({ top: targetTop, behavior });
      window.setTimeout(() => {
        isSnapping = false;
      }, 360);
    }

    function queueSnap() {
      if (isSnapping || !shouldSnap()) {
        return;
      }

      window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(() => {
        snapToClosestCard();
      }, 120);
    }

    scrollArea.addEventListener("scroll", queueSnap, { passive: true });

    if ("onscrollend" in window) {
      scrollArea.addEventListener(
        "scrollend",
        () => shouldSnap() && snapToClosestCard(),
        { passive: true }
      );
    }
  }

  function syncCustomScrollbars() {
    const panes = Array.from(document.querySelectorAll(".media-pane"));

    panes.forEach((pane) => {
      const scrollArea = pane.querySelector(".pane-scroll");
      const thumb = pane.querySelector(".custom-scrollbar-thumb");

      if (!scrollArea || !thumb) {
        return;
      }

      let frame = 0;

      function update() {
        frame = 0;

        const viewportHeight = scrollArea.clientHeight;
        const contentHeight = scrollArea.scrollHeight;
        const maxScroll = Math.max(contentHeight - viewportHeight, 0);
        const trackHeight = thumb.parentElement.clientHeight;
        const thumbHeight = maxScroll
          ? Math.max((viewportHeight / contentHeight) * trackHeight, 36)
          : trackHeight;
        const maxOffset = Math.max(trackHeight - thumbHeight, 0);
        const offset = maxScroll
          ? (scrollArea.scrollTop / maxScroll) * maxOffset
          : 0;

        thumb.style.height = `${thumbHeight}px`;
        thumb.style.transform = `translateY(${offset}px)`;
      }

      function requestUpdate() {
        if (!frame) {
          frame = requestAnimationFrame(update);
        }
      }

      scrollArea.addEventListener("scroll", requestUpdate, { passive: true });
      window.addEventListener("resize", requestUpdate);

      if ("ResizeObserver" in window) {
        const observer = new ResizeObserver(requestUpdate);
        observer.observe(scrollArea);

        if (scrollArea.firstElementChild) {
          observer.observe(scrollArea.firstElementChild);
        }
      }

      requestUpdate();
      enableThumbDrag(scrollArea, thumb);
    });
  }

  function enableThumbDrag(scrollArea, thumb) {
    const track = thumb.parentElement;
    let drag = null;

    thumb.addEventListener("pointerdown", (event) => {
      if (event.button !== undefined && event.button !== 0) {
        return;
      }

      const trackHeight = track.clientHeight;
      const thumbHeight = thumb.offsetHeight;
      const maxOffset = Math.max(trackHeight - thumbHeight, 0);
      const maxScroll = Math.max(
        scrollArea.scrollHeight - scrollArea.clientHeight,
        0
      );

      if (!maxScroll || !maxOffset) {
        return;
      }

      drag = {
        pointerId: event.pointerId,
        startY: event.clientY,
        startScrollTop: scrollArea.scrollTop,
        scrollPerPixel: maxScroll / maxOffset
      };

      thumb.setPointerCapture(event.pointerId);
      thumb.classList.add("is-dragging");
      event.preventDefault();
    });

    thumb.addEventListener("pointermove", (event) => {
      if (!drag || event.pointerId !== drag.pointerId) {
        return;
      }

      const deltaY = event.clientY - drag.startY;
      const maxScroll = Math.max(
        scrollArea.scrollHeight - scrollArea.clientHeight,
        0
      );
      const nextScrollTop = drag.startScrollTop + deltaY * drag.scrollPerPixel;

      scrollArea.scrollTop = Math.min(Math.max(nextScrollTop, 0), maxScroll);
    });

    function endDrag(event) {
      if (!drag || event.pointerId !== drag.pointerId) {
        return;
      }

      if (thumb.hasPointerCapture(event.pointerId)) {
        thumb.releasePointerCapture(event.pointerId);
      }

      thumb.classList.remove("is-dragging");
      drag = null;
    }

    thumb.addEventListener("pointerup", endDrag);
    thumb.addEventListener("pointercancel", endDrag);
  }

  function observeAutoplayVideos() {
    const videos = Array.from(
      document.querySelectorAll("video[data-autoplay-when-visible]")
    );

    if (!videos.length) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      videos.forEach((video) => {
        playAudibleVideo(video);
      });
      return;
    }

    function pauseOtherVideosInGroup(video) {
      const group = video.dataset.mediaGroup;

      videos.forEach((other) => {
        if (other === video || other.dataset.mediaGroup !== group || other.paused) {
          return;
        }

        programmaticPauses.add(other);
        other.pause();
        requestAnimationFrame(() => {
          programmaticPauses.delete(other);
        });
      });
    }

    function playAudibleVideo(video) {
      pauseOtherVideosInGroup(video);
      video.play().catch(() => {
        video.dataset.autoplayBlocked = "true";
        const indicator = video
          .closest(".reel-card")
          ?.querySelector(".reel-play-indicator");

        if (indicator) {
          indicator.classList.add("is-visible");
        }
      });
    }

    function retryBlockedAutoplay(event) {
      const isDirectReelTap =
        (event?.type === "pointerdown" || event?.type === "touchstart") &&
        event.target?.closest?.(".reel-card");

      if (isDirectReelTap) {
        return;
      }

      videos.forEach((video) => {
        if (video.dataset.autoplayBlocked === "true") {
          const rect = video.getBoundingClientRect();
          const visibleHeight =
            Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
          const visibleRatio = Math.max(visibleHeight, 0) / rect.height;

          if (visibleRatio >= 0.45 && video.dataset.userPaused !== "true") {
            video.dataset.autoplayBlocked = "false";
            playAudibleVideo(video);
          }
        }
      });
    }

    ["pointerdown", "keydown", "touchstart", "wheel"].forEach((eventName) => {
      window.addEventListener(eventName, retryBlockedAutoplay, {
        passive: true
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;

          if (
            entry.isIntersecting &&
            entry.intersectionRatio >= 0.45 &&
            video.dataset.userPaused !== "true"
          ) {
            playAudibleVideo(video);
          } else {
            programmaticPauses.add(video);
            video.pause();
            requestAnimationFrame(() => {
              programmaticPauses.delete(video);
            });
          }
        });
      },
      {
        root: null,
        threshold: [0, 0.45, 0.8]
      }
    );

    videos.forEach((video) => observer.observe(video));

    return function refreshAutoplay(container) {
      const scoped = container
        ? videos.filter((video) => container.contains(video))
        : videos;

      scoped.forEach((video) => {
        observer.unobserve(video);
        observer.observe(video);
      });
    };
  }

  mount();
})();
