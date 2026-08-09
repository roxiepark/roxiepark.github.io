# Mobile footer thumbnail rail

Date: 2026-08-09

## Problem

On mobile/tablet widths (`max-width: 760px`), when a reels or photos pane is
active, the main content area currently shows a vertical `.custom-scrollbar`
alongside the pane, and the fixed footer always shows the SM Entertainment
logo (`.site-footer img`). This wastes footer space that could instead let
the user scrub through the reel/photo items, similar to the native Photos
app filmstrip.

## Scope

Applies only within the existing mobile breakpoint (`max-width: 760px`),
where `.content-grid` already switches to showing one pane at a time via
`data-active-pane`. Desktop/tablet-above-760px layout is unchanged.

## Behavior

- While no pane is active (menu screen) **or** the active pane is still
  loading (`.media-pane.is-loading`), the footer shows the logo, same as
  today.
- Once a pane is active **and** finished loading, the footer swaps to a
  horizontal thumbnail rail for that pane's items, and:
  - `.custom-scrollbar` is hidden everywhere in this breakpoint (mobile
    already only shows one pane at a time and relies on scroll-snap; the
    rail replaces it as the scrub affordance).
- Rail items are sized to the footer's available height, with width auto to
  preserve each thumbnail's native aspect ratio (no cropping to a square).
- **Tap → scroll**: tapping a rail thumbnail scrolls the main pane to that
  card. For photos, this also collapses to 1 column first (reusing the
  existing tap-to-zoom-in behavior) before scrolling.
- **Scroll → highlight**: scrolling/snapping the main pane updates which
  rail thumbnail is marked active, and the rail auto-centers that thumbnail.
  - For reels, this uses the existing "card closest to top of pane"
    detection.
  - For photos, the same detection is used but restricted to cards inside
    `.photos-column:first-child` (the left column). This is column-count
    agnostic: in 1-column mode there is only one column, so it naturally
    covers that case too, and in 2-column mode it deliberately tracks the
    left column as the reference.

## HTML changes (`index.html`)

```html
<footer class="site-footer">
  <img src="assets/logo.png" alt="SM Entertainment" class="site-footer-logo">
  <div class="thumbnail-rail" data-rail="reels"></div>
  <div class="thumbnail-rail" data-rail="photos"></div>
</footer>
```

## CSS changes (`styles.css`, inside the existing `@media (max-width: 760px)` block)

- `.custom-scrollbar { display: none; }`
- Logo visibility (hidden only once its pane is active and loaded):
  ```css
  .content-grid[data-active-pane="reels"]:has(.reels-pane:not(.is-loading))
    ~ .site-footer .site-footer-logo,
  .content-grid[data-active-pane="photos"]:has(.photos-pane:not(.is-loading))
    ~ .site-footer .site-footer-logo {
    display: none;
  }
  ```
- Rail visibility (mirror image of the logo rule, per pane):
  ```css
  .content-grid[data-active-pane="reels"]:has(.reels-pane:not(.is-loading))
    ~ .site-footer [data-rail="reels"],
  .content-grid[data-active-pane="photos"]:has(.photos-pane:not(.is-loading))
    ~ .site-footer [data-rail="photos"] {
    display: flex;
  }
  ```
- `.thumbnail-rail` default: `display: none; overflow-x: auto; overflow-y: hidden; scrollbar-width: none;` laid out as a horizontal flex row filling the footer height.
- `.thumbnail-rail::-webkit-scrollbar { width: 0; height: 0; }`
- Rail item thumbnails (`img`/`video` inside each rail button): `height: 100%; width: auto;` so items keep native aspect ratio instead of being cropped to a square.
- Active rail item gets a visual highlight (border/opacity) via an `is-active` class.

No changes needed above 760px; `.thumbnail-rail` stays `display: none` by default outside the mobile media query block, and the logo's existing desktop styling is untouched.

## JS changes (`script.js`)

- In `mount()`, after rendering `reelsList`/`photosGrid`, build each rail's thumbnail buttons from the same `reels`/`photos` data (or placeholder count, using numbered labels when there's no real media):
  - Reels thumbnail source: `item.poster`.
  - Photos thumbnail source: `item.src` for images, `item.poster` for videos.
- New `initThumbnailRail(kind, mainScrollSelector, listEl, cardSelector, railEl, options)` helper:
  - Click handler on a rail thumbnail: scroll the corresponding main-pane card into view (for photos, calls the existing `applyColumns(1)` path first, mirroring the current photo-card tap-to-zoom interaction).
  - Reuses the "closest card to pane top" logic already present in `snapPaneOnScrollEnd` for determining the active item on scroll; for photos, cards() is restricted to `list.querySelector('.photos-column:first-child').querySelectorAll(cardSelector)`.
  - On active-card change: toggle `is-active` on the corresponding rail thumbnail and call `scrollIntoView({ inline: "center", block: "nearest" })` (or equivalent manual scroll) on the rail.
  - Hooked up for both panes, called from `mount()` alongside the existing `snapPaneOnScrollEnd` calls.
- No JS changes needed for the loading-state gating of logo vs. rail — that's handled entirely by the CSS `:has()` rules above, reusing the `is-loading`/`is-complete` classes `setupPaneLoader` already toggles.

## Testing

- Manual check in a mobile-width browser viewport (or device emulation):
  - Menu screen: logo visible, no rail.
  - Tap into Reels while it's still loading: logo still visible (loading overlay showing).
  - Reels finishes loading: logo hides, reels rail appears with aspect-correct thumbnails; `.custom-scrollbar` is gone.
  - Scroll reels: correct thumbnail highlights and rail auto-centers.
  - Tap a reel thumbnail: main pane scrolls/snaps to that reel.
  - Same checks for Photos in 1-column mode.
  - Pinch/ctrl-wheel to 2-column photos: rail highlight tracks the left column as you scroll; tapping any thumbnail returns to 1-column and scrolls to that photo.
  - Back button returns to menu: logo reappears, rails hidden.
  - Desktop width (>760px): no behavior change — footer logo always shown, no rail, `.custom-scrollbar` still works as before.
