# JOBOSU // LAB — Experiment journal

This file records completed and failed autonomous experiments. Every entry must contain:
- ID, date, hypothesis and novelty
- Files added/changed
- Tests actually executed and outcomes
- Known limitations, estimated effort and measured usage (if available)
- PR link, review status and suggested next experiment

## Initial setup
Autonomous experimentation framework initialized. No autonomous experiment has run yet.

## A002 — DRIFT ATLAS (2026-11-01; IN DEVELOPMENT)
- **Hypothesis:** an editorial generative ocean-current atlas plus interactive synthetic passage simulation can reveal how invisible vector fields alter a journey.
- **Alternatives:** Resonant Architecture (audio-driven world; deferred); Synthetic Markets (financial risk map; deferred due to overlap).
- **Selected direction:** premium nautical visual language, procedural isolines, tracer particles, route markers, custom controls and responsive layout. All data synthetic; not for navigation.
- **GitHub:** feature branch `agent/experiment-002-drift-atlas`; [draft PR #5](https://github.com/jobosu/jobosu.github.io/pull/5) targeting `agent/autonomous-lab`.
- **Committed:** `experiments/drift-atlas/field.mjs`, `tests/field.test.mjs`, `CHECKPOINT.md`. Full local UI prototype and Playwright test were built but **not yet committed**.
- **Executed tests:** `node --test` 5/5 passed for committed-equivalent engine; `node --check app.js` passed on local prototype; Playwright Chromium desktop/mobile-emulated/reduced-motion passed local UI interaction checks with no page exceptions or horizontal overflow. Screenshots inspected.
- **Unverified:** GPU WebGL shader (sandbox has no WebGL), real phone touch/performance, full accessibility; final GitHub UI integration. Therefore **NO PUBLICATION**.
- **Resources:** no paid API; no quota measurements available. No production files or menu modified.
- **Next:** commit local UI source and smoke tests, integrate field module, verify on GPU/mobile, then release experiment and LABS link together only after premium gate passes.

## A002 — review 2026-11-08
- Recovered original local UI archive and reran JS syntax, Playwright desktop/mobile-emulated/reduced-motion smoke tests: PASS; WebGL unavailable (`gl:false`).
- Added 4 committed core-engine test cases to feature branch; corrected signed-zero assertion; final **9/9 tests passed locally**.
- Updated feature-branch CHECKPOINT.md; UI source remains uncommitted and no production/menu changes were made.
- Previous 8–15 November publication estimate is at risk; next decision checkpoint 15 November, with date reassessment after integration and GPU/mobile/accessibility validation.

## A002 — review 2026-11-15
- Committed the full responsive UI (`index.html`, `style.css`, `app.js`) and reproducible Chromium smoke script (`tests/smoke.py`) to `agent/experiment-002-drift-atlas` (draft PR #5). Existing `field.mjs` is now imported by the UI. No public menu or production changes.
- Rebuilt and tested local source-equivalent version: `node --check app.js` PASS; `node --test tests/field.test.mjs` **9/9 PASS**; Chromium desktop 1440×900, mobile-emulated 390×844, reduced-motion 900×700 PASS for interactive controls, route plotting, zero drift, keyboard arrows, no page errors/overflow. Inspected active desktop and mobile screenshots.
- Browser policy blocked localhost/file navigation; Playwright used inline CSS/JS/field source via `set_content`. Native HTTP module loading and exact deployed GitHub source were NOT tested. Physical mobile touch/performance and full accessibility remain unverified. Canvas2D is the intentional renderer; no WebGL validation claimed.
- **Quality gate BLOCKED / NO PUBLICATION.** The prior 8–15 November target was missed. Next checkpoint **22 November**; tentative release **22–29 November** only if all critical checks can be completed. Otherwise revise target, never bypass the gate.
