# DRIFT ATLAS — JOBOSU LAB A002

**Status:** IN DEVELOPMENT — NOT PUBLISHED. **Started:** 2026-11-01.

A cinematic generative observatory of a fictional ocean-current field, with simulated passage planning. Every current, coordinate, distance and ETA is synthetic. **NOT FOR NAVIGATION.**

## Idea selection
- **DRIFT ATLAS** (selected): generative currents, editorial nautical chart, interactive vessel drift. High novelty, strong visual impact, medium engineering risk.
- Resonant Architecture: audio-driven architecture. Deferred pending audio-permission and accessibility research.
- Synthetic Markets: financial risk visualization. Deferred due to overlap with the economic-intelligence project.

## Art direction
Deep petrol/navy, luminous mint tracers, warm-coral actual track, typographic editorial interface, chart isolines, restrained graticule, responsive layouts and cinematic microinteractions. WebGL fragment shader for procedural ocean background, Canvas 2D for tracers/route, Canvas 2D fallback for browsers without WebGL. No dependencies, remote assets, analytics or network calls.

## Features implemented in local source archive
- Current strength (0–100%), current rotation (±180°), pause/resume, reset.
- Plot departure and arrival with pointer/touch; drag either marker; keyboard arrow keys adjust arrival and Shift+arrows departure.
- Synthetic distance, time and drift readouts; route trajectory recomputed after control changes.
- Reduced-motion default pause, capped pixel ratio, mobile particle budget, WebGL fallback, semantic controls.
- A complete self-contained HTML/CSS/JS prototype and Playwright smoke test were built and executed locally. **The UI prototype is not yet committed to GitHub; only the tested core engine and unit tests are in this branch.**

## Verified locally — 2026-11-01
- `node --check app.js`: passed.
- Playwright Chromium desktop (1440×900), mobile emulation (390×844), reduced-motion (900×700): passed with no JS page errors or horizontal overflow.
- Checked route (91 points), 370–850 particles depending on viewport, live numeric readouts, 0% current → 0.0 nm drift, slider changes, rotation, pause/resume, two-step plot, keyboard adjustment and reset.
- Desktop and mobile screenshots visually inspected. The full UI source is available in the downloadable preview artifact from this run, but has **not** been uploaded to this branch. The repository currently contains `field.mjs` and `tests/field.test.mjs` only.

## Additional core-engine verification

- `node --test tests/field.test.mjs`: **5 tests passed** (bounds, zero drift, deterministic finite field, rotation sensitivity, invalid inputs). The committed `field.mjs` and unit test are byte-for-byte equivalent to those locally tested.

## Quality gate: NOT YET PASSED
The sandboxed test browser exposes **no WebGL context**, so the shader could not be compiled/rendered on a GPU-capable browser. Real iPhone/Safari and Android touch/performance, WebGL context restoration, contrast and accessibility review remain unverified. **Do not publish or merge to master** until these checks pass and source files are extracted into a normal reviewable directory on this feature branch.

## Next steps
1. Commit the UI prototype (`index.html`, `style.css`, `app.js`) and Playwright smoke test as reviewable source files in `experiments/drift-atlas/`, integrate the committed `field.mjs` module, and rerun the tests against the exact GitHub source.
2. Validate WebGL on a GPU-capable browser and inspect shader output.
3. Test physical mobile touch, frame-time and keyboard/screen-reader behavior.
4. Only then prepare a separate release PR to master containing the experiment and an **AGENT EXP A002** link in `labs/index.html`, published together. No existing published projects may be changed.

**Safety:** no paid services, secrets, trading, real-world ocean data, or external APIs.

## Progress checkpoint — 2026-11-08

- Recovered the original 2026-11-01 local prototype archive and reran its checks: `node --check app.js` passed, `node --test tests/field.test.mjs` passed 5/5, and `python tests/smoke.py` passed Chromium desktop, mobile emulation and reduced-motion interactions. The browser again reported `gl: false`, so WebGL rendering remains unverified.
- Extended the committed core-engine suite with four numerical/bounds checks; an initial assertion exposed JavaScript signed zero (-0 vs +0), which was corrected in the test without altering the simulation. Final suite: **9/9 passed locally**.
- The prototype HTML/CSS/JS and Playwright smoke test are still in the local archive, **not committed** to GitHub. No claim of deployability or production readiness.
- **Quality gate remains BLOCKED**: GitHub source integration, GPU shader, physical mobile performance and accessibility audits still pending. No public release or menu change.
- **Publication estimate:** previously communicated 2026-11-08 to 2026-11-15. That window is **at risk**, not confirmed. Next decision checkpoint 2026-11-15; publication date to be reassessed after UI source is committed and critical browser tests can run. Do not promise a launch date without evidence.
