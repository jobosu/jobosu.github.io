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
- Dependency-free `engine.mjs`: fixed EMA 12/26, previous-bar signal, next-bar execution, 240/120 chronological split, 10 bps fee and 5 bps slippage, long-only, end-of-test liquidation.
- `orchestrator.mjs`: sequential Researcher → Quant → Skeptic → Editor protocol with explicit mock adapters, required source references and limitations. All transcripts are tagged mock.
- Node tests for deterministic inputs, causal EMAs, transaction costs, no-lookahead, validation, and refusal of uncited claims/live mode.
- Read-only GitHub Actions workflow for tests, subject to GitHub workflow execution and checks.

**Local verification:** six engine tests passed in a local Node 22 environment using the same algorithm; the committed engine also passed ten direct invariant/integration checks. The committed mock orchestrator passed direct role-order and fail-closed checks. Browser screenshots and GitHub Actions results are **not yet verified**.

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
