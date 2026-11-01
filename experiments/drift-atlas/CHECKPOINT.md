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
- Self-contained HTML, CSS, JavaScript, README and Playwright smoke test.

## Verified locally — 2026-11-01
- `node --check app.js`: passed.
- Playwright Chromium desktop (1440×900), mobile emulation (390×844), reduced-motion (900×700): passed with no JS page errors or horizontal overflow.
- Checked route (91 points), 370–850 particles depending on viewport, live numeric readouts, 0% current → 0.0 nm drift, slider changes, rotation, pause/resume, two-step plot, keyboard adjustment and reset.
- Desktop and mobile screenshots visually inspected. Source snapshot is in `source/DRIFT_ATLAS_A002_source.tar.xz` (archive includes HTML, CSS, JS, README and tests). Extract with `tar xf source/DRIFT_ATLAS_A002_source.tar.xz`.

## Quality gate: NOT YET PASSED
The sandboxed test browser exposes **no WebGL context**, so the shader could not be compiled/rendered on a GPU-capable browser. Real iPhone/Safari and Android touch/performance, WebGL context restoration, contrast and accessibility review remain unverified. **Do not publish or merge to master** until these checks pass and source files are extracted into a normal reviewable directory on this feature branch.

## Next steps
1. Extract the source archive into `experiments/drift-atlas/` as reviewable source files, then rerun the included smoke tests against those exact files.
2. Validate WebGL on a GPU-capable browser and inspect shader output.
3. Test physical mobile touch, frame-time and keyboard/screen-reader behavior.
4. Only then prepare a separate release PR to master containing the experiment and an **AGENT EXP A002** link in `labs/index.html`, published together. No existing published projects may be changed.

**Safety:** no paid services, secrets, trading, real-world ocean data, or external APIs.