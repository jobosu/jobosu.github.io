# JOBOSU // LAB — Economic Intelligence

Experimental multi-agent research lab. **Research and simulation only; no real-money trading.**

## Mission
Investigate evidence-based opportunities in global markets, macroeconomics, crypto, equities, and digital business. Agents must challenge each other's claims, cite timestamped sources, and produce reproducible experiments.

## Roles
- Researcher: gathers dated, attributable public evidence.
- Quant: proposes falsifiable hypotheses and tests.
- Builder: implements reproducible simulations.
- Skeptic: independently audits assumptions, leakage, and arithmetic.
- Editor: publishes verified summaries and experiment artifacts.
- Codex (when integrated): engineering review and orchestration; not a continuous background service by default.

Provider adapters may target DeepSeek, Qwen, Kimi, GLM, MiniMax or others, **only after API access is configured and verified**. No provider is claimed connected yet.

## Execution contract
1. Ingest public sources and record URL, timestamp, license and data quality.
2. Generate competing hypotheses with clear falsification criteria.
3. Debate using explicit agent messages (not private chain-of-thought).
4. Backtest with transaction costs, slippage, realistic constraints and out-of-sample tests.
5. Require independent audit before marking a result validated.
6. Publish versioned artifacts and update experiment navigation only after tests pass.

## Safety
- Never commit API keys or personal financial information.
- No trading, withdrawals, transfers, leverage, or live account access.
- Default spend cap: zero until explicitly configured; require hard limits and a kill switch before paid runs.
- No autonomous changes to permissions, budgets, or production infrastructure.
- Research is not investment advice. Simulated profits are not real returns.

## Delivery phases
1. Premium interactive UI using clearly labeled demonstration data.
2. Agent adapters, secret configuration, metering and trace logs.
3. Scheduled research runs with source verification.
4. Paper-trading evaluation and monitoring.
5. Separate explicit authorization before any real-money pilot.


## Verified development checkpoint — 2026-10-26

**Implemented on `agent/economic-intelligence` (not yet merged to `master`):**
- Browser-based simulation desk with three selectable synthetic market scenarios and reproducible seed.
- Dependency-free `engine.mjs`: fixed EMA 12/26, previous-bar signal, next-bar execution, 240-bar EMA warm-up / 120-bar chronological test window, 10 bps fee and 5 bps slippage, long-only, end-of-test liquidation.
- `orchestrator.mjs`: sequential Researcher → Quant → Skeptic → Editor protocol with explicit mock adapters, required source references and limitations. All transcripts are tagged mock.
- Node tests for deterministic inputs, causal EMAs, transaction costs, no-lookahead, validation, and refusal of uncited claims/live mode.
- Read-only GitHub Actions workflow for tests, subject to GitHub workflow execution and checks.

**Local verification:** six engine tests passed in a local Node 22 environment using the same algorithm; the committed engine also passed ten direct invariant/integration checks. The committed mock orchestrator passed direct role-order and fail-closed checks. Browser screenshots are **not yet verified**. The initial GitHub Actions checks were later confirmed successful on 2026-10-26.

**Not implemented:** external model APIs, news feeds, real financial datasets, live agent debates, brokerage connections, any real-money operation. Synthetic returns displayed in the UI are illustrative and must not be used to assess expected profit.

### Run locally
```sh
cd experiments/economic-intelligence
npm test
(cd ../.. && python3 -m http.server 8000)
# open http://localhost:8000/experiments/economic-intelligence/
```
No npm dependencies, provider credentials, or paid APIs are required for this phase.

### Integration gates
1. Add provider adapters server-side, never expose keys in GitHub Pages/browser JS.
2. Store secrets in protected infrastructure, not repository files or chat.
3. Enforce explicit monthly spend caps, request timeouts, rate limits and a kill switch before paid calls.
4. Preserve original source URLs, retrieval dates, licenses and audit logs; label generated claims separately from verified data.
5. Keep simulation and live trading infrastructure physically and logically separate. Real-money actions require a separate explicit approval.
6. Do not merge/publish as production-ready until browser and accessibility checks and CI have passed.

## Development checkpoint — 2026-10-27

- Added `robustness.mjs`: deterministic 32-seed sweeps across three synthetic regimes (96 local simulations), reporting median excess return, share outperforming a benchmark, worst excess return and worst drawdown. All per-seed observations can be exported as JSON from the dashboard.
- Added `robustness.test.mjs` to verify reproducibility, aggregation, configuration validation and explicit synthetic-only labeling.
- Corrected a benchmark timing mismatch: buy-and-hold now enters on the same first executable bar as the EMA strategy. This avoids giving the benchmark one bar of advance exposure.
- Clarified that the first 240 bars are **EMA warm-up**, not model training. There is no parameter fitting, optimization, independent financial sample or evidence of investment edge.
- Confirmed the previous GitHub Actions checks on commit `e290d328a0afca886d116a9404488ca5e30306d6` succeeded on 2026-10-26. Checks on today's commits must be verified separately.
- **Publication gate remains closed:** browser visual/accessibility QA and the current CI run are required before merging PR #3. No external APIs or real-money access are configured.

### Audit command
```sh
cd experiments/economic-intelligence
npm test
node --input-type=module -e "import {robustnessAudit} from './robustness.mjs'; console.log(JSON.stringify(robustnessAudit({seeds:32}),null,2))"
```


## Development checkpoint — 2026-10-28

- Investigated the 2026-10-27 GitHub Actions failure on commit `ca840a6` by reading the **actual failed job logs**: 17 of 18 tests passed, and one UI copy assertion looked for a phrase that the page did not contain. Commit `4d7a682` corrected the test to match the real disclosure. Its GitHub Actions run **#24 passed**. This was a test-copy mismatch, not a trading or API incident.
- Added a click-to-run **mock research debate** to the interactive dashboard. The local, deterministic Researcher → Quant → Skeptic → Editor transcript is displayed with simulated source references and limitations. The page clearly labels it **MOCK ONLY / 0 APIs / 0 TRADES**. No external model is called.
- Localized the mock agent statements into Catalan, added an explicit `synthetic://` provenance guard and rejected malformed/external references in mock mode. All transcript text is rendered via `textContent`, never as injected HTML.
- Extended tests for UI bindings, honest disclosures, safe rendering, synthetic-only provenance and mock session invariants.
- **GitHub Actions verified on commit `37eb35702f26131ad76eb862343fcb19f90209ee`: run #34 completed successfully on 2026-10-28 with 21 tests passed, 0 failed.** This is automated code verification, **not** a browser visual, mobile-device or accessibility audit.
- No secrets, paid provider calls, real-money trading, brokerage connections or public production deployment. The changes remain in branch `agent/economic-intelligence` and PR #3; the publication gate remains closed pending visual/accessibility review.

