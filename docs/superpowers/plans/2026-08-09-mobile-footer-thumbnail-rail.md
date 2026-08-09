# Mobile Footer Thumbnail Rail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On mobile widths (≤760px), replace the fixed footer logo with a per-pane horizontal thumbnail rail once the active reels/photos pane finishes loading, bidirectionally synced with the main scroll, and remove the vertical custom scrollbar.

**Architecture:** Pure static-site changes across `index.html`, `styles.css`, and `script.js`. CSS `:has()` selectors (a pattern already used elsewhere in `styles.css`) gate footer-logo-vs-rail visibility off the existing `data-active-pane` attribute and `is-loading`/`is-complete` classes — no new JS state needed for that part. `script.js` gains: rail thumbnail construction from the same `reels`/`photos` data already used to render the main lists, a tap-to-scroll handler, and a scroll-to-highlight handler that mirrors the existing "closest card to pane top" logic already used for scroll-snapping.

**Tech Stack:** Vanilla HTML/CSS/JS, no build step, no test framework (this repo has no `package.json`/test runner — see Global Constraints).

## Global Constraints

- Applies only inside the existing `@media (max-width: 760px)` block in `styles.css`; desktop/tablet-above-760px behavior must not change.
- This repo has no automated test suite. Every verification step in this plan is a manual browser check using a local static server (`python3 -m http.server`) and browser dev-tools device emulation at a mobile width (e.g. 375px). Do not attempt to add a test framework as part of this work.
- Reuse the existing `is-loading`/`is-complete` pane lifecycle (already toggled by `setupPaneLoader` in `script.js`) for gating the logo vs. rail — do not add new JS to track loading state.
- Photos "closest card to top" detection must always be scoped to `.photos-column:first-child` (the left column), which is correct for both 1-column and multi-column layouts (in 1-column mode there is only one column).
- Follow the existing code style in `script.js`: small named functions, `const`/`function` declarations, no semicolon-free style, 2-space indent (match surrounding code).

---

### Task 1: Footer HTML structure + base/visibility CSS

**Files:**
- Modify: `index.html:86-88`
- Modify: `styles.css:615-629` (existing `.site-footer` / `.site-footer img` rules) and inside the `@media (max-width: 760px)` block at `styles.css:631-748`

**Interfaces:**
- Produces: `.site-footer-logo` class on the footer `<img>`; two empty rail containers `[data-rail="reels"]` and `[data-rail="photos"]` inside `.site-footer`, each expected (by later tasks) to be filled with `button.thumbnail-rail-item` children carrying a `data-index` attribute.

- [ ] **Step 1: Update the footer markup**

Replace the current footer block:

```html
      <footer class="site-footer" aria-label="SM Entertainment logo">
        <img src="assets/logo.png" alt="SM Entertainment">
      </footer>
```

with:

```html
      <footer class="site-footer" aria-label="Site footer">
        <img src="assets/logo.png" alt="SM Entertainment" class="site-footer-logo">
        <div class="thumbnail-rail" data-rail="reels" aria-label="Reels thumbnails"></div>
        <div class="thumbnail-rail" data-rail="photos" aria-label="Photos thumbnails"></div>
      </footer>
```

- [ ] **Step 2: Add the global (non-mobile) rail default and confirm logo rule still applies**

`.site-footer img` (styles.css:626-629) already sets `width: 100%; height: auto;` and will keep applying to `.site-footer-logo` since it's still an `img` inside `.site-footer` — no change needed there.

Add a new global rule directly after the existing `.site-footer img` rule (styles.css:626-629), so the rail is hidden by default at every viewport width, not just inside the mobile query:

```css
.thumbnail-rail {
  display: none;
}
```

- [ ] **Step 3: Add mobile-only footer layout, scrollbar removal, and logo/rail visibility gating**

Inside the existing `@media (max-width: 760px) { ... }` block (styles.css:631-748), add the following before the closing `}` of that block:

```css
  .custom-scrollbar {
    display: none;
  }

  .site-footer {
    top: auto;
    bottom: 12px;
    left: 12px;
    right: 12px;
    width: auto;
    min-width: 0;
    height: calc(var(--footer-height) - 24px);
    transform: none;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: auto;
  }

  .site-footer-logo {
    width: min(46vw, 220px);
  }

  .content-grid[data-active-pane="reels"]:has(.reels-pane:not(.is-loading))
    ~ .site-footer .site-footer-logo,
  .content-grid[data-active-pane="photos"]:has(.photos-pane:not(.is-loading))
    ~ .site-footer .site-footer-logo {
    display: none;
  }

  .content-grid[data-active-pane="reels"]:has(.reels-pane:not(.is-loading))
    ~ .site-footer [data-rail="reels"],
  .content-grid[data-active-pane="photos"]:has(.photos-pane:not(.is-loading))
    ~ .site-footer [data-rail="photos"] {
    display: flex;
  }

  .thumbnail-rail {
    width: 100%;
    height: 100%;
    align-items: center;
    gap: 6px;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    padding-inline: 4px;
  }

  .thumbnail-rail::-webkit-scrollbar {
    width: 0;
    height: 0;
  }

  .thumbnail-rail-item {
    flex: 0 0 auto;
    height: 100%;
    padding: 0;
    border: 2px solid transparent;
    border-radius: 6px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.12);
    cursor: pointer;
  }

  .thumbnail-rail-item.is-active {
    border-color: var(--white);
  }

  .thumbnail-rail-item img {
    display: block;
    height: 100%;
    width: auto;
    max-width: none;
  }

  .thumbnail-rail-item-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    aspect-ratio: 3 / 4;
    color: var(--white-soft);
    font-size: 0.7rem;
    font-weight: 600;
  }
```

- [ ] **Step 4: Manual verification**

Run: `python3 -m http.server 8000` from the repo root, open `http://localhost:8000` in a browser.

- At a desktop width (>760px): confirm the page looks unchanged — logo still shown bottom-center, no layout shift. (The rail elements exist in the DOM but are `display: none` from the global rule.)
- Open browser dev tools, switch to a mobile device size (e.g. 375×667), reload:
  - Menu screen (no pane selected): logo visible, footer roughly same visual size as before.
  - Tap into Reels or Photos: once the pane's loading overlay finishes, the logo should disappear and the footer area becomes an empty flex row (no thumbnails yet — that's expected, they're added in Task 2). The vertical scrollbar next to the pane content should be gone.
  - Tap back to the menu: logo reappears.

- [ ] **Step 5: Commit**

```bash
git add index.html styles.css
git commit -m "feat: add mobile footer thumbnail rail scaffolding and hide scrollbar"
```

---

### Task 2: Build and populate rail thumbnails

**Files:**
- Modify: `script.js` (add new functions near the top-level helpers, e.g. after `createFallback`/before `mount()`; call the new build function from inside `mount()`)

**Interfaces:**
- Consumes: `reels` (array), `photos` (array), `placeholderCount` (`{ reels: 3, photos: 9 }`), `isVideoItem(item)` — all already defined at the top of `script.js`.
- Produces: `buildThumbnailRail(railEl, dataItems, placeholderTotal, getThumbSrc, label)` — call once per pane. After calling, `railEl` contains one `button.thumbnail-rail-item` per item (or per placeholder slot), each with `dataset.index` set to its 0-based position, matching the same order as `reelsList.children` / `photoCardElements`.

- [ ] **Step 1: Add the thumbnail button + rail builder functions**

Add this in `script.js`, after the `createFallback` function (around line 32) and before `markUnavailable`:

```javascript
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
```

- [ ] **Step 2: Call the builder from `mount()`**

In `mount()` (script.js, currently starting around line 323), add the rail element lookups near the top of the function and the two build calls after `reelsList.replaceChildren(...reelItems);` / `layoutPhotosColumns(1);`:

```javascript
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

    const refreshAutoplay = observeAutoplayVideos();
    // ...rest of mount() unchanged
```

(Only the lines shown above are new/changed; everything after `const refreshAutoplay = observeAutoplayVideos();` in the existing `mount()` body stays exactly as-is.)

- [ ] **Step 3: Manual verification**

Run: `python3 -m http.server 8000`, open in a browser with dev tools set to a mobile width (375px).

- Tap into Reels, wait for loading to finish: the footer rail should show one thumbnail per reel, each using its `poster` image, in the same left-to-right order as the reels appear when scrolling. Thumbnails should be full-height of the footer strip with their natural aspect ratio (not stretched or cropped to a square).
- Tap back, then tap into Photos: rail should show one thumbnail per photo (images use `src`, videos use `poster`), same ordering as the photo grid's index order.
- If `media.js` has any photo entries with no `poster` and `type: "video"`, confirm those slots render as a numbered placeholder box instead of a broken image.

- [ ] **Step 4: Commit**

```bash
git add script.js
git commit -m "feat: populate mobile footer thumbnail rail from reels/photos data"
```

---

### Task 3: Tap-to-scroll from rail to main content

**Files:**
- Modify: `script.js` — refactor `enablePhotosZoom` to expose a `collapseToSingleColumn` function, add a `scrollCardIntoView` helper and an `initThumbnailRail` function, wire both panes in `mount()`.

**Interfaces:**
- Consumes: `photoCardElements` (module-level array, already defined at script.js:307), `reelsList`, `photosGrid` (module-level element refs already defined at top of file).
- Produces: `enablePhotosZoom()` now **returns** `{ collapseToSingleColumn: () => void }` instead of returning nothing. `initThumbnailRail(options)` where `options` is `{ railEl, scrollArea, getCard, topOffset, beforeScroll }` — `getCard(index)` returns the target card element or `undefined`, `topOffset()` returns a number (default `0`), `beforeScroll` is an optional no-arg callback run before scrolling.

- [ ] **Step 1: Make `enablePhotosZoom` expose a way to force single-column**

In `script.js`, find the `applyColumns` function inside `enablePhotosZoom` (around line 483-487) and the end of `enablePhotosZoom` (around line 594-595, `applyColumns(columns);` followed by the closing `}`):

Change the end of `enablePhotosZoom` from:

```javascript
    applyColumns(columns);
  }
```

to:

```javascript
    applyColumns(columns);

    return {
      collapseToSingleColumn: () => applyColumns(1)
    };
  }
```

- [ ] **Step 2: Add `scrollCardIntoView` and `initThumbnailRail`**

Add these two functions in `script.js`, after `buildThumbnailRail` (added in Task 2):

```javascript
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

  function initThumbnailRail(options) {
    const { railEl, scrollArea, getCard, topOffset = () => 0, beforeScroll } = options;

    if (!railEl || !scrollArea) {
      return;
    }

    railEl.addEventListener("click", (event) => {
      const button = event.target.closest(".thumbnail-rail-item");

      if (!button || !railEl.contains(button)) {
        return;
      }

      const index = Number(button.dataset.index);

      beforeScroll?.();

      const card = getCard(index);
      scrollCardIntoView(scrollArea, card, topOffset());
    });
  }
```

- [ ] **Step 3: Capture the `enablePhotosZoom` return value and wire both rails in `mount()`**

In `mount()`, change:

```javascript
    syncCustomScrollbars();
    enablePhotosZoom();
    enablePaneTabs();
```

to:

```javascript
    syncCustomScrollbars();
    const photosZoom = enablePhotosZoom();
    enablePaneTabs();

    initThumbnailRail({
      railEl: reelsRail,
      scrollArea: document.querySelector(".reels-pane .pane-scroll"),
      getCard: (index) => reelsList.children[index]
    });

    initThumbnailRail({
      railEl: photosRail,
      scrollArea: document.querySelector(".photos-pane .pane-scroll"),
      getCard: (index) => photoCardElements[index],
      topOffset: () => parseFloat(getComputedStyle(photosGrid).paddingTop) || 0,
      beforeScroll: () => photosZoom?.collapseToSingleColumn()
    });
```

`reelsRail`/`photosRail` are the same variables already declared at the top of `mount()` in Task 2 — no new declarations needed here.

- [ ] **Step 4: Manual verification**

Run: `python3 -m http.server 8000`, mobile width in dev tools.

- Reels: tap the 3rd rail thumbnail — main pane should smoothly scroll/snap to reel #3.
- Photos: while in the default 1-column mobile view, tap a rail thumbnail — main pane scrolls to that photo.
- Photos: pinch-zoom or ctrl+scroll to switch to 2-column view, then tap any rail thumbnail — the grid should collapse back to 1 column and scroll to that specific photo (same behavior as tapping the photo itself already does).

- [ ] **Step 5: Commit**

```bash
git add script.js
git commit -m "feat: scroll main content when a footer rail thumbnail is tapped"
```

---

### Task 4: Scroll-to-highlight sync from main content to rail

**Files:**
- Modify: `script.js` — add `initRailHighlightSync` and call it for both panes in `mount()`.

**Interfaces:**
- Consumes: same module-level refs as Task 3 (`reelsList`, `photosGrid`, `photoCardElements`), plus the `reelsRail`/`photosRail` variables from `mount()`.
- Produces: `initRailHighlightSync(options)` where `options` is `{ scrollArea, railEl, getCards, indexOf }` — `getCards()` returns an array of card elements in on-screen top-to-bottom order, `indexOf(card)` returns that card's rail-button index (matching the `data-index` values set in Task 2).

- [ ] **Step 1: Add `initRailHighlightSync`**

Add this function in `script.js`, after `initThumbnailRail` (added in Task 3):

```javascript
  function initRailHighlightSync(options) {
    const { scrollArea, railEl, getCards, indexOf } = options;

    if (!scrollArea || !railEl) {
      return;
    }

    let frame = 0;

    function closestCardIndex() {
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

    function update() {
      frame = 0;

      const activeIndex = closestCardIndex();
      const buttons = Array.from(railEl.querySelectorAll(".thumbnail-rail-item"));

      buttons.forEach((button) => {
        button.classList.toggle("is-active", Number(button.dataset.index) === activeIndex);
      });

      const activeButton = buttons[activeIndex];

      if (activeButton) {
        const railRect = railEl.getBoundingClientRect();
        const buttonRect = activeButton.getBoundingClientRect();
        const targetScroll =
          railEl.scrollLeft +
          (buttonRect.left + buttonRect.width / 2) -
          (railRect.left + railRect.width / 2);

        railEl.scrollTo({ left: targetScroll, behavior: "smooth" });
      }
    }

    function requestUpdate() {
      if (!frame) {
        frame = requestAnimationFrame(update);
      }
    }

    scrollArea.addEventListener("scroll", requestUpdate, { passive: true });
    requestUpdate();
  }
```

- [ ] **Step 2: Wire it for both panes in `mount()`**

Add these two calls in `mount()`, right after the two `initThumbnailRail(...)` calls added in Task 3:

```javascript
    initRailHighlightSync({
      scrollArea: document.querySelector(".reels-pane .pane-scroll"),
      railEl: reelsRail,
      getCards: () => Array.from(reelsList.children),
      indexOf: (card) => Array.from(reelsList.children).indexOf(card)
    });

    initRailHighlightSync({
      scrollArea: document.querySelector(".photos-pane .pane-scroll"),
      railEl: photosRail,
      getCards: () => Array.from(photosGrid.querySelector(".photos-column")?.children || []),
      indexOf: (card) => photoCardElements.indexOf(card)
    });
```

- [ ] **Step 3: Manual verification**

Run: `python3 -m http.server 8000`, mobile width in dev tools.

- Reels: scroll/swipe through several reels without touching the rail. Confirm the rail's active-thumbnail highlight (white border) moves to match the currently-snapped reel, and the rail auto-scrolls to keep the active thumbnail roughly centered.
- Photos, 1-column mode: scroll through photos, confirm the same highlight + auto-center behavior.
- Photos, 2-column mode: pinch-zoom/ctrl+scroll to 2 columns, then scroll. Confirm the highlight tracks the photo currently at the top of the **left** column (not the right column) as you scroll.
- Confirm tapping a rail thumbnail (from Task 3) still works and now also updates the highlight to match.
- Re-check desktop width (>760px): no rail visible, no console errors from the new `querySelector` calls (they should simply resolve to `null` scroll areas outside mobile and the functions no-op via the early `if (!scrollArea || !railEl) return;` guard — note the scroll areas exist at all widths since `.pane-scroll` isn't mobile-only, but `railEl` being hidden via CSS doesn't prevent this from running; confirm no visible glitches on desktop since the rail stays `display: none` regardless of highlight-class churn).

- [ ] **Step 4: Commit**

```bash
git add script.js
git commit -m "feat: sync footer rail highlight to main content scroll position"
```
