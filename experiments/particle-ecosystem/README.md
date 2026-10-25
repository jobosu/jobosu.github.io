# Experiment 001 — Particle Ecosystem

**Hypothesis:** three particle species with cyclic attraction/repulsion can create emergent visual patterns in a self-contained browser experiment.

## Candidates considered
1. Particle Ecosystem — selected: high visual interest, no dependencies, feasible.
2. Procedural sound garden — postponed: audio permissions and accessibility require more work.
3. Cellular weather map — postponed: greater implementation scope.

## Run
Open `index.html` in a modern browser. Drag or touch the canvas to attract particles. Use Pause, Reset, Count and Speed controls. No network or build step required.

## Technical details
Canvas 2D, three-species force matrix, toroidal wrapping, bounded velocity, requestAnimationFrame, pixel-ratio scaling. O(n²) interactions: default 160 particles, configurable 60–300.

## Tests and limitations
JavaScript syntax and deterministic force-model tests were executed locally against a prototype; the committed browser version needs independent browser smoke testing. Mobile/touch and reduced-motion behavior are implemented but not device-verified. At 300 particles performance may suffer on older phones.

## Safety
No secrets, APIs, analytics, dependencies or production changes. Do not merge without human review.
