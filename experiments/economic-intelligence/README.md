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
