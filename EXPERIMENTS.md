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
