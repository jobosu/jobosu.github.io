# JOBOSU // LAB — Experiment journal

This file records completed and failed autonomous experiments. Every entry must contain:
- ID, date, hypothesis and novelty
- Files added/changed
- Tests actually executed and outcomes
- Known limitations, estimated effort and measured usage (if available)
- PR link, review status and suggested next experiment

## Initial setup
Autonomous experimentation framework initialized. No autonomous experiment has run yet.

## EXP-001 — Particle Ecosystem (2026-10-25)
- Hypothesis: cyclic attraction/repulsion among three particle species produces emergent visual patterns.
- Alternatives considered: procedural sound garden; cellular weather map.
- Added: `experiments/particle-ecosystem/index.html`, `simulation.js`, `README.md`.
- Tests: Node.js syntax checks and 8 groups of assertions passed on a local prototype; browser version not yet smoke-tested on a real device. No claim of CI coverage.
- Limitations: O(n²) force calculations, performance at 300 particles unverified; touch and reduced-motion unverified on device.
- Usage: subscription/token quota not available; no paid API invoked.
- Review: pending; do not merge or deploy. Next candidate: procedural sound garden.
