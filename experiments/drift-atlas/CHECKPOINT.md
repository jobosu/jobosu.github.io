# DRIFT ATLAS — A002 / DEVELOPMENT CHECKPOINT

**Reviewed:** 2026-11-15. **Status:** IN DEVELOPMENT; not public. [Draft PR #5](https://github.com/jobosu/jobosu.github.io/pull/5) → `agent/autonomous-lab`.

## Intent and alternatives

A generative, fictional ocean-current observatory showing how an invisible vector field changes a simulated passage. Three candidates considered: **DRIFT ATLAS** (selected for visual distinctiveness and testability), **Resonant Architecture** (deferred; audio permissions/accessibility), and **Synthetic Markets** (deferred; overlap with separate economic intelligence work). The ID **A002** is unique within the autonomous A-series; the public site separately has numbered EXP 001/002.

## Delivered on feature branch (2026-11-15)

- `experiments/drift-atlas/index.html`: Catalan editorial experience, route and metrics, semantic controls, safety note.
- `style.css`: navy/petrol typography-led responsive visual system, mint tracers/coral track, keyboard focus and reduced-motion rules.
- `app.js`: live Canvas2D vector-field and particle visualization using the existing `field.mjs` simulation; plotting and dragging two waypoints, arrow-key adjustments, energy and rotation sliders, pause/reset, synthetic route readouts.
- `tests/smoke.py`: reproducible desktop/mobile-emulated/reduced-motion browser smoke test (inlined local-source adapter for restricted navigation environments). Existing `tests/field.test.mjs` has nine core tests.
- No dependencies, remote data, paid services, secrets, trading, production or menu changes.

**Implementation decision:** use Canvas2D as the actual renderer in this iteration rather than an unverified WebGL shader. This is deliberate graceful compatibility, not a claim of WebGL/GPU validation. WebGL remains a possible enhancement only if it demonstrably improves the experience.

## Evidence actually gathered (2026-11-15)

- `node --check app.js`: PASS on the locally constructed source-equivalent version.
- `node --test tests/field.test.mjs`: **9/9 PASS** locally against the existing synthetic engine.
- Playwright + Chromium: desktop **1440×900**, mobile-emulated **390×844**, reduced-motion **900×700**: PASS for zero-current drift, slider changes, pause, two-click plotting, arrow-key waypoint adjustment, absence of JS page errors and horizontal overflow.
- Screenshots inspected locally; initial active field and desktop/mobile layouts rendered. Chromium navigation to localhost/file was blocked by sandbox policy, so the smoke runner used `page.set_content` with CSS/JS and field source inlined. This verifies UI behavior but **does not verify ES module loading over HTTP or deployment**.
- Chromium reported WebGL unavailable; this implementation does not depend on WebGL.
- New UI source was committed and re-read from GitHub; no GitHub Actions CI result or physical-device test is claimed.

## Remaining release blockers

1. Test the **actual committed GitHub source** via HTTP on a browser with normal module loading; verify no path or MIME failures.
2. Physical iPhone Safari / Android Chrome touch, sustained frame-time, battery/thermal behavior; optimize Canvas2D if needed.
3. Keyboard + screen-reader audit, contrast and readable labels; test touch marker drag, mobile orientation changes, small screens.
4. Review final visual craft and security; if all pass, create separate isolated release PR to `master` containing only A002 files and its **LABS menu entry**, and merge only when permitted.

**Quality gate:** BLOCKED; **do not publish**. The previous estimated publication window **8–15 November was not met** because the UI had not been committed and final-environment/device validation remains outstanding.

**Next checkpoint:** 2026-11-22. **Provisional release target:** **2026-11-22 to 2026-11-29**, conditional on resolving all critical validation blockers. If a physical device and normal HTTP browser cannot be tested, the release date must be reassessed rather than bypassing checks.
