(function () {
  function setViewportUnit() {
    const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty("--vh-unit", `${height / 100}px`);
  }

  setViewportUnit();
  window.addEventListener("resize", setViewportUnit);
  window.addEventListener("orientationchange", setViewportUnit);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", setViewportUnit);
  }

  const media = window.portfolioMedia || {};
  const reels = Array.isArray(media.reels) ? media.reels : [];
  const photos = Array.isArray(media.photos) ? media.photos : [];
  const reelsList = document.getElementById("reelsList");
  const photosGrid = document.getElementById("photosGrid");

  const placeholderCount = {
    reels: 3,
    photos: 9
  };
  const careersMedia = {
    project1: [
      ["14apfaz1DKARoD6i1EZM5C0fFnQ9Qs5ZR"],
      ["1SI9eeXca1wU37FipyrN25qMOoxqhuZRS", "1v-PlWYF9OxQA16mCPZyT6taqduRM1l4s"],
      [
        "1vMcKW6jMSTycpTr0R5_Nf8hoUbqFn2vL",
        "1yUxTga6zi_xYgU-Kse3OEJXYnP9gTIcv",
        "1_lmG0Lq2_b7ucAP3K4ufBhhAXjJkWuNy"
      ]
    ],
    project2: [
      ["1zPmFImxZHIuoVdJYk-CywbEs0s0PR9mv"],
      [
        "1QM-phLXdXOTr9GyBnSG6xcvc_Xjakx-4",
        "1TJfJCFu4UYYZelh1XAfg771GRjTc0yL6"
      ],
      ["17_F1qjdEFuSEf1v6tAi48fhl8ulbR7h8"]
    ],
    project3: [
      ["1ZUf1DUcHyekTSA1sLInDh4fyvBe0zXT6", "1xSFHjFLPo4tGRVcv7bYvD2GOtcaryPOe"],
      ["1hg6GKJQ6AVX6LlavY6ldQp6_u0aKqL1z"],
      ["1evi7kVu7cJvOTDtbSxQ2wCPmfPcw4Y2L", "1nOJZM0Y1PtKOLBOtKHikOfx8-570dR2f"],
      ["1bdmhb7P9AdwacQIx6vash1TAN3VCUukZ", "1IIKE1wthwA4UTJj7SaqWXJyTEEDr8xlg"]
    ],
    project4: [
      ["1zWgkIlRtelN-XRF746oi6vxPl5SWBj27"],
      ["181IXmx079XMXOK7L8EXCZsFN3ldtoVsi"]
    ],
    project7: [
      ["1mOA2eYGywCKwfP4xTlqPKIdwKpOWMxkp"],
      [
        "1-AunVv1WsFp3Ux3_xWNDrxVUY4ryNao0",
        "1jG07YuJkl25QoBGoOSXlmxwrI3CplCP9",
        "1d2iXdczpddxwffkejR2qjaooOD5uTgpo"
      ],
      ["1lpA05l2VDJxnPhtc1R6LQdceoYa-hYMF", "13EMAe547Y3JZc7VEIKZtEa1sxg3pJOK3"],
      ["1tRerwb7Scf_3XZHoooJ15d4P2uS2r-_y", "18f4D9mmzd8k2tYKMW1i1dgq7hC7UtmtW"]
    ],
    project8: [["1iACyeWyYoTEI9qRMmRuIabeoYUmsw33M", "1WTY0aJwVR91Ot8ZXE6n2hTqbMq60CeFG"]]
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

  function createRailThumbButton(index, src, label) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "thumbnail-rail-item";
    button.dataset.index = String(index);
    button.setAttribute("aria-label", `${label} ${index + 1}`);

    if (src) {
      const img = document.createElement("img");
      img.src = src;
      img.alt = "";
      img.loading = "lazy";
      button.append(img);
    } else {
      const placeholder = document.createElement("span");
      placeholder.className = "thumbnail-rail-item-placeholder";
      placeholder.textContent = String(index + 1);
      button.append(placeholder);
    }

    return button;
  }

  function driveThumbnailUrl(id, size = "w1600") {
    return `https://drive.google.com/thumbnail?id=${id}&sz=${size}`;
  }

  function createCareersPhoto(id, projectName, areaIndex, imageIndex) {
    const frame = document.createElement("span");
    const image = document.createElement("img");

    frame.className = "careers-photo-item";
    image.src = driveThumbnailUrl(id);
    image.alt = `${projectName.toUpperCase()} area ${areaIndex + 1} image ${imageIndex + 1}`;
    image.loading = "lazy";
    image.decoding = "async";
    frame.append(image);

    return frame;
  }

  function renderCareersPhotos() {
    Object.entries(careersMedia).forEach(([projectName, areaGroups]) => {
      const slots = Array.from(
        document.querySelectorAll(
          `.careers-section[data-careers-section="${projectName}"] .careers-photo-slot`
        )
      );

      areaGroups.forEach((imageIds, areaIndex) => {
        const slot = slots[areaIndex];

        if (!slot || !imageIds.length) {
          return;
        }

        slot.replaceChildren(
          ...imageIds.map((id, imageIndex) =>
            createCareersPhoto(id, projectName, areaIndex, imageIndex)
          )
        );
      });
    });
  }

  function renderCareersRoleBadges() {
    document.querySelectorAll(".careers-role").forEach((roleEl) => {
      if (roleEl.querySelector(".careers-role-badge")) {
        return;
      }

      const items = roleEl.textContent
        .split(/\s*·\s*/)
        .map((item) => item.trim())
        .filter(Boolean);

      roleEl.replaceChildren(
        ...items.map((item) => {
          const badge = document.createElement("span");
          badge.className = "careers-role-badge";
          badge.textContent = item;
          return badge;
        })
      );
    });
  }

  function groupCareersAreas() {
    document.querySelectorAll(".careers-section").forEach((section) => {
      if (section.querySelector(".careers-area")) {
        return;
      }

      const photoStack = section.querySelector(".careers-photo-stack");
      const copyStack = section.querySelector(".careers-copy-stack");

      if (!copyStack) {
        return;
      }

      const photoSlots = section.classList.contains("careers-info")
        ? []
        : Array.from(photoStack?.children || []).filter((child) =>
            child.classList.contains("careers-photo-slot")
          );
      const copyBlocks = Array.from(copyStack.children).filter((child) =>
        child.classList.contains("careers-copy-block")
      );

      const areas = copyBlocks.map((block, index) => {
        const area = document.createElement("div");
        const slot = photoSlots[index];

        area.className = "careers-area";

        if (slot) {
          area.append(slot);
        } else {
          area.classList.add("has-no-photo");
        }

        area.append(block);
        return area;
      });

      section.replaceChildren(...areas);
    });
  }

  function buildThumbnailRail(railEl, dataItems, placeholderTotal, getThumbSrc, label) {
    if (!railEl) {
      return;
    }

    const total = dataItems.length || placeholderTotal;
    const buttons = Array.from({ length: total }, (_, index) => {
      const item = dataItems[index];
      const src = item ? getThumbSrc(item) : "";
      return createRailThumbButton(index, src, label);
    });

    railEl.replaceChildren(...buttons);
  }

  function syncRailEdgePadding(railEl) {
    if (!railEl) {
      return;
    }

    function update() {
      const buttons = Array.from(railEl.querySelectorAll(".thumbnail-rail-item"));

      if (!buttons.length) {
        return;
      }

      const railWidth = railEl.clientWidth;
      const firstWidth = buttons[0].getBoundingClientRect().width;
      const lastWidth = buttons[buttons.length - 1].getBoundingClientRect().width;

      railEl.style.paddingInlineStart = `${Math.max(railWidth / 2 - firstWidth / 2, 0)}px`;
      railEl.style.paddingInlineEnd = `${Math.max(railWidth / 2 - lastWidth / 2, 0)}px`;
    }

    update();

    Array.from(railEl.querySelectorAll("img")).forEach((img) => {
      if (!img.complete) {
        img.addEventListener("load", update, { once: true });
      }
    });

    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(update);
      observer.observe(railEl);
    } else {
      window.addEventListener("resize", update);
    }
  }

  function scrollCardIntoView(scrollArea, card, topOffset = 0) {
    if (!scrollArea || !card) {
      return;
    }

    const scrollRect = scrollArea.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const targetTop = Math.max(
      scrollArea.scrollTop + cardRect.top - scrollRect.top - topOffset,
      0
    );

    scrollArea.scrollTo({ top: targetTop, behavior: "smooth" });
  }

  function normalizePhotosTopPaddingScroll() {
    const scrollArea = document.querySelector(".photos-pane .pane-scroll");

    if (!scrollArea || !photosGrid || photosGrid.dataset.columns === "1") {
      return;
    }

    const topOffset = parseFloat(getComputedStyle(photosGrid).paddingTop) || 0;

    if (scrollArea.scrollTop > 0 && scrollArea.scrollTop <= topOffset + 2) {
      scrollArea.scrollTop = 0;
    }
  }

  function schedulePhotosTopPaddingScrollReset() {
    requestAnimationFrame(normalizePhotosTopPaddingScroll);
    window.setTimeout(normalizePhotosTopPaddingScroll, 120);
    window.setTimeout(normalizePhotosTopPaddingScroll, 500);
  }

  function initRailSync(options) {
    const {
      railEl,
      scrollArea,
      getCard,
      getCards,
      indexOf,
      topOffset = () => 0
    } = options;

    if (!railEl || !scrollArea) {
      return;
    }

    let activeIndex = -1;
    let suppressMain = false;
    let suppressRail = false;
    let suppressMainClearTimer = 0;
    let suppressRailClearTimer = 0;

    const SUPPRESS_SETTLE_MS = 220;

    function suppressMainScroll() {
      suppressMain = true;
      window.clearTimeout(suppressMainClearTimer);
      suppressMainClearTimer = window.setTimeout(() => {
        suppressMain = false;
      }, SUPPRESS_SETTLE_MS);
    }

    function releaseMainSuppression() {
      suppressMain = false;
      window.clearTimeout(suppressMainClearTimer);
    }

    function suppressRailScroll() {
      suppressRail = true;
      window.clearTimeout(suppressRailClearTimer);
      suppressRailClearTimer = window.setTimeout(() => {
        suppressRail = false;
      }, SUPPRESS_SETTLE_MS);
    }

    function releaseRailSuppression() {
      suppressRail = false;
      window.clearTimeout(suppressRailClearTimer);
    }

    function highlight(index) {
      const buttons = Array.from(railEl.querySelectorAll(".thumbnail-rail-item"));

      buttons.forEach((button) => {
        button.classList.toggle("is-active", Number(button.dataset.index) === index);
      });

      return buttons[index];
    }

    function centerRailOnButton(button) {
      if (!button) {
        return;
      }

      const railRect = railEl.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      const targetScroll =
        railEl.scrollLeft +
        (buttonRect.left + buttonRect.width / 2) -
        (railRect.left + railRect.width / 2);

      suppressRailScroll();
      railEl.scrollTo({ left: targetScroll, behavior: "smooth" });
    }

    function scrollMainToIndex(index) {
      const card = getCard(index);

      if (!card) {
        return;
      }

      suppressMainScroll();
      scrollCardIntoView(scrollArea, card, topOffset());
    }

    function setActive(index, { centerRail = false, scrollMain = false } = {}) {
      if (index < 0 || index === activeIndex) {
        return;
      }

      activeIndex = index;

      const button = highlight(index);

      if (centerRail) {
        centerRailOnButton(button);
      }

      if (scrollMain) {
        scrollMainToIndex(index);
      }
    }

    function closestCardIndexToTop() {
      const cards = getCards();

      if (!cards.length) {
        return -1;
      }

      const scrollRect = scrollArea.getBoundingClientRect();
      const closest = cards.reduce(
        (best, card) => {
          const distance = Math.abs(card.getBoundingClientRect().top - scrollRect.top);
          return distance < best.distance ? { card, distance } : best;
        },
        { card: cards[0], distance: Infinity }
      ).card;

      return indexOf(closest);
    }

    function closestButtonIndexToCenter() {
      const buttons = Array.from(railEl.querySelectorAll(".thumbnail-rail-item"));

      if (!buttons.length) {
        return -1;
      }

      const railRect = railEl.getBoundingClientRect();
      const railCenter = railRect.left + railRect.width / 2;
      const closest = buttons.reduce(
        (best, button) => {
          const buttonRect = button.getBoundingClientRect();
          const buttonCenter = buttonRect.left + buttonRect.width / 2;
          const distance = Math.abs(buttonCenter - railCenter);
          return distance < best.distance ? { button, distance } : best;
        },
        { button: buttons[0], distance: Infinity }
      ).button;

      return Number(closest.dataset.index);
    }

    let mainFrame = 0;

    function updateFromMain() {
      mainFrame = 0;
      setActive(closestCardIndexToTop(), { centerRail: true });
    }

    function handleMainScroll() {
      if (suppressMain) {
        suppressMainScroll();
        return;
      }

      if (!mainFrame) {
        mainFrame = requestAnimationFrame(updateFromMain);
      }
    }

    let railFrame = 0;
    let railSettleTimer = 0;

    function mainScrollTargetForIndex(index) {
      const card = getCard(index);

      if (!card) {
        return null;
      }

      const scrollRect = scrollArea.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();

      return scrollArea.scrollTop + cardRect.top - scrollRect.top - topOffset();
    }

    function mirrorMainToRailProgress() {
      const buttons = Array.from(railEl.querySelectorAll(".thumbnail-rail-item"));

      if (!buttons.length) {
        return;
      }

      const railRect = railEl.getBoundingClientRect();
      const railCenter = railRect.left + railRect.width / 2;
      const centers = buttons.map((button) => {
        const rect = button.getBoundingClientRect();
        return rect.left + rect.width / 2;
      });

      let floorIndex = 0;
      let frac = 0;

      if (railCenter <= centers[0]) {
        floorIndex = 0;
        frac = 0;
      } else if (railCenter >= centers[centers.length - 1]) {
        floorIndex = centers.length - 1;
        frac = 0;
      } else {
        for (let i = 0; i < centers.length - 1; i += 1) {
          if (railCenter >= centers[i] && railCenter <= centers[i + 1]) {
            floorIndex = i;
            const span = centers[i + 1] - centers[i];
            frac = span > 0 ? (railCenter - centers[i]) / span : 0;
            break;
          }
        }
      }

      const ceilIndex = Math.min(floorIndex + 1, centers.length - 1);
      const floorTarget = mainScrollTargetForIndex(floorIndex);
      const ceilTarget = mainScrollTargetForIndex(ceilIndex);

      if (floorTarget === null || ceilTarget === null) {
        return;
      }

      const target = floorTarget + (ceilTarget - floorTarget) * frac;
      const maxMainScroll = Math.max(scrollArea.scrollHeight - scrollArea.clientHeight, 0);

      suppressMainScroll();
      scrollArea.scrollTop = Math.min(Math.max(target, 0), maxMainScroll);
    }

    function previewFromRail() {
      railFrame = 0;

      if (suppressRail) {
        return;
      }

      const index = closestButtonIndexToCenter();

      if (index >= 0) {
        highlight(index);
      }

      mirrorMainToRailProgress();
    }

    function commitFromRail() {
      if (suppressRail) {
        return;
      }

      setActive(closestButtonIndexToCenter(), { scrollMain: true });
    }

    function handleRailScroll() {
      if (suppressRail) {
        suppressRailScroll();
        return;
      }

      if (!railFrame) {
        railFrame = requestAnimationFrame(previewFromRail);
      }

      window.clearTimeout(railSettleTimer);
      railSettleTimer = window.setTimeout(commitFromRail, 150);
    }

    scrollArea.addEventListener("scroll", handleMainScroll, { passive: true });
    railEl.addEventListener("scroll", handleRailScroll, { passive: true });

    scrollArea.addEventListener("pointerdown", releaseMainSuppression, { passive: true });
    railEl.addEventListener("pointerdown", releaseRailSuppression, { passive: true });

    railEl.addEventListener("click", (event) => {
      const button = event.target.closest(".thumbnail-rail-item");

      if (!button || !railEl.contains(button)) {
        return;
      }

      setActive(Number(button.dataset.index), { centerRail: true, scrollMain: true });
    });

    handleMainScroll();
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
    const reelsRail = document.querySelector('[data-rail="reels"]');
    const photosRail = document.querySelector('[data-rail="photos"]');

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

    buildThumbnailRail(reelsRail, reels, placeholderCount.reels, (item) => item.poster, "Reel");
    buildThumbnailRail(
      photosRail,
      photos,
      placeholderCount.photos,
      (item) => (isVideoItem(item) ? item.poster : item.src),
      "Photo"
    );
    renderCareersPhotos();
    renderCareersRoleBadges();
    groupCareersAreas();
    syncRailEdgePadding(reelsRail);
    syncRailEdgePadding(photosRail);

    const refreshAutoplay = observeAutoplayVideos();
    snapPaneOnScrollEnd(".reels-pane .pane-scroll", reelsList, ".reel-card");
    snapPaneOnScrollEnd(".photos-pane .pane-scroll", photosGrid, ".photo-card", {
      topOffset: () => parseFloat(getComputedStyle(photosGrid).paddingTop) || 0,
      shouldSnap: () => photosGrid.dataset.columns === "1"
    });
    syncCustomScrollbars();
    enablePhotosZoom();
    enablePaneTabs();

    initRailSync({
      railEl: reelsRail,
      scrollArea: document.querySelector(".reels-pane .pane-scroll"),
      getCard: (index) => reelsList.children[index],
      getCards: () => Array.from(reelsList.children),
      indexOf: (card) => Array.from(reelsList.children).indexOf(card)
    });

    initRailSync({
      railEl: photosRail,
      scrollArea: document.querySelector(".photos-pane .pane-scroll"),
      getCard: (index) => photoCardElements[index],
      getCards: () => Array.from(photosGrid.querySelector(".photos-column")?.children || []),
      indexOf: (card) => photoCardElements.indexOf(card),
      topOffset: () => parseFloat(getComputedStyle(photosGrid).paddingTop) || 0
    });
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

      if (paneName === "photos") {
        schedulePhotosTopPaddingScrollReset();
      }

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
    const backButtons = Array.from(document.querySelectorAll("[data-pane-back]"));
    const careersToggle = document.querySelector("[data-careers-toggle]");
    const careersScroll = document.querySelector(".careers-scroll");
    const careersIndexLinks = Array.from(document.querySelectorAll("[data-careers-target]"));

    if (!contentGrid) {
      return;
    }

    function setActivePane(paneName) {
      contentGrid.dataset.activePane = paneName;
      careersToggle?.setAttribute(
        "aria-expanded",
        paneName === "careers" ? "true" : "false"
      );
    }

    function clearActivePane() {
      delete contentGrid.dataset.activePane;
      careersToggle?.setAttribute("aria-expanded", "false");
    }

    function scrollToCareersTarget(targetId, behavior = "smooth") {
      const target = document.getElementById(targetId);

      if (!target || !careersScroll) {
        return;
      }

      const scrollRect = careersScroll.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const targetTop = Math.max(
        careersScroll.scrollTop + targetRect.top - scrollRect.top,
        0
      );
      const scrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : behavior;

      careersScroll.scrollTo({ top: targetTop, behavior: scrollBehavior });
    }

    menuOptions.forEach((option) => {
      const needsLoading =
        option.dataset.pane === "reels" || option.dataset.pane === "photos";
      option.disabled = needsLoading;
      option.addEventListener("click", () => {
        if (option.disabled) {
          return;
        }

        setActivePane(option.dataset.pane);
      });
    });

    careersToggle?.addEventListener("click", () => {
      setActivePane("careers");
    });

    careersIndexLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        const targetId = link.dataset.careersTarget;

        if (!targetId) {
          return;
        }

        event.preventDefault();
        setActivePane("careers");
        requestAnimationFrame(() => {
          scrollToCareersTarget(targetId, "smooth");
          window.setTimeout(() => scrollToCareersTarget(targetId, "smooth"), 450);
          window.setTimeout(() => scrollToCareersTarget(targetId, "smooth"), 1200);
        });
      });
    });

    backButtons.forEach((backButton) => backButton.addEventListener("click", () => {
      clearActivePane();
    }));
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
      const prevColumns = columns;
      const isInitialApply = photosGrid.dataset.columns === undefined;
      columns = Math.min(Math.max(next, minColumns), maxColumns());

      const columnsChanged =
        !isInitialApply && columns !== prevColumns;
      let anchorCard = null;

      if (columnsChanged && scrollArea && photoCardElements.length) {
        const scrollRect = scrollArea.getBoundingClientRect();
        anchorCard = photoCardElements.reduce(
          (best, card) => {
            const distance = Math.abs(card.getBoundingClientRect().top - scrollRect.top);
            return distance < best.distance ? { card, distance } : best;
          },
          { card: photoCardElements[0], distance: Infinity }
        ).card;
      }

      photosGrid.dataset.columns = String(columns);
      layoutPhotosColumns(columns);

      if (isInitialApply) {
        schedulePhotosTopPaddingScrollReset();
      }

      if (anchorCard) {
        const topOffset = parseFloat(getComputedStyle(photosGrid).paddingTop) || 0;
        const scrollRect = scrollArea.getBoundingClientRect();
        const cardRect = anchorCard.getBoundingClientRect();
        const targetTop = Math.max(
          scrollArea.scrollTop + cardRect.top - scrollRect.top - topOffset,
          0
        );

        scrollArea.scrollTo({ top: targetTop, behavior: "auto" });
      }
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
