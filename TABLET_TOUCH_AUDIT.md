# Tablet touch compatibility audit

Branch: `fix/tablet-touch-compat`
Date: 2026-09-16

## Scope

Static deployment repository audit focused on touch-primary tablets and hybrid input behavior. Checked shared navigation, home interactions, product explorer, company tabs, product detail effects, clipboard controls, field solution tabs/pins, hover-only motion helpers, and touch-specific CSS/JS.

## Findings and actions

### Fixed

1. `_astro/SenseProductPreview.astro_astro_type_script_index_0_lang.Vvd5mRg8.js`
   - Problem: on `(hover:none)` devices, clicking a MOVING sense link always called `preventDefault()`, so `/solutions/...` navigation could never occur. Repeated taps were also blocked.
   - Fix: preserve mouse-hover preview and keyboard behavior, but leave touch activation as native link navigation. One tap now produces a deterministic result.

2. `tablet-touch-compat.js` (new)
   - Problem: layout used desktop navigation from 680px upward even when the primary input was coarse touch, while desktop mega-menu behavior also relied on pointer enter/leave. Tablets could therefore receive a desktop hover-oriented header.
   - Fix: detect `(hover:none) and (pointer:coarse)`. On touch-primary devices hide desktop nav/desktop CTA/portal/mega menus and expose the existing drawer menu. Fine-pointer desktop behavior is unchanged. Media-query changes are observed so hybrid input changes can recover.

3. `_astro/BaseLayout.astro_astro_type_script_index_1_lang.b4be4433e1.js`
   - Fix: load `tablet-touch-compat.js` for the current shared layout bundle.

4. `_astro/BaseLayout.astro_astro_type_script_index_1_lang.ChfKVAYh.js`
   - Fix: load `tablet-touch-compat.js` for pages still using the older shared layout bundle.

5. `text-image-hero.js`
   - Problem: touch activation depended only on `click.pointerType === 'touch'`. Some browser/event combinations can expose click without a useful pointerType even on a touch-primary tablet.
   - Fix: also use `(hover:none) and (pointer:coarse)` as a fallback, preserving the existing visual tap behavior.

### Audited — no functional change required

- `_astro/CoreProductFeature.astro_astro_type_script_index_0_lang.D5AXWx0T.js`
  - Tabs and field pins are click/button based. `preventDefault()` is used intentionally for same-page tab/hash enhancement and the requested content is updated in the same handler.

- `_astro/ProductExplorer.astro_astro_type_script_index_0_lang.B7oirYsg.js`
  - Filter controls use native inputs/buttons and submit/change/input events. Touch-compatible.

- `_astro/company.astro_astro_type_script_index_0_lang.BADlZZfY.js`
  - Sense tabs use click and keyboard events. Hero pointer reaction is enabled only for motion + fine pointer, so touch does not lose functionality.

- `_astro/ProductPageShell.astro_astro_type_script_index_0_lang.BX1YeJM3.js`
  - Tilt is progressive enhancement gated by fine pointer. Product links/content remain functional on touch.

- `_astro/core.a2raYywT.js`
  - Pointer-driven effects are gated by `(pointer:fine)` and minimum width. This appropriately disables decorative effects on touch without blocking actions.

- `_astro/magnetic.D2Ek6UfV.js`
  - Decorative magnetic motion only; gated through shared fine-pointer checks.

- `solution-menu.js`
  - Generated tabs and links use click/keyboard semantics. No hover dependency for activation.

- `product-category-menu.js`
  - Desktop tabs/categories are buttons; mobile groups are native `<details>/<summary>`. Touch-compatible.

- `brand/consultation-light.js`
  - Glow/light effects explicitly require `(hover:hover) and (pointer:fine)` and do not modify link/tab activation.

- `brand/portal-link.css`
  - Hover styles are cosmetic. Active states and native links remain available on touch. Touch-primary navigation is now handled by `tablet-touch-compat.js`.

- `_astro/index.astro_astro_type_script_index_0_lang.BonphxFw.js`
  - Home ring/spotlight/scrolly motion is fine-pointer or motion gated; ring nodes remain native anchors.

- `_astro/index.astro_astro_type_script_index_0_lang.BuFaRt2w.js`
  - Clipboard action is click based and has failure feedback.

- `_astro/index.astro_astro_type_script_index_0_lang.CdcjPa5N.js`
  - Scroll-state visual rail only; no touch activation dependency.

- `_astro/ContactPanel.astro_astro_type_script_index_0_lang.DC1F8pIG.js`
  - Clipboard action is click based and has failure feedback.

## Interaction policy after this patch

- Fine pointer + hover: retain desktop navigation, hover previews, magnetic/tilt/glow effects.
- Touch-primary tablet/mobile: use drawer navigation; no desktop mega-menu hover dependency.
- MOVING sense links: touch activation navigates immediately; mouse hover can still preview.
- Decorative pointer effects may be absent on touch, but no navigation or control should depend on them.

## Verification notes

This repository is a static deployment artifact repository rather than the original Astro source project, so verification is performed against the emitted HTML/CSS/JS and branch diff. Before merging, perform a physical-device smoke test on iPadOS Safari and an Android tablet for header drawer, MOVING links, field tabs/pins, product filters, company tabs, contact copy controls, and orientation changes.
