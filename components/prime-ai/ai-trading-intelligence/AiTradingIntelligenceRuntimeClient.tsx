"use client";

import { useMemo, useState } from "react";
import { AI_TRADING_INTELLIGENCE_DEEP_TEMPLATE } from "@/lib/prime-ai/ai-trading-intelligence-deep-template";
import { AI_TRADING_INTELLIGENCE_NEXUS_READY_CONTRACT } from "@/lib/prime-ai/ai-trading-intelligence-nexus-contract";

type RuntimeMode =
  | "overview"
  | "creator"
  | "context"
  | "risk"
  | "strategy"
  | "backtest"
  | "portfolio"
  | "report"
  | "access";

const workflowButtons: { id: RuntimeMode; label: string; helper: string }[] = [
  { id: "overview", label: "What this terminal is", helper: "Understand the trading intelligence project." },
  { id: "creator", label: "Creator setup", helper: "What the trading creator configures." },
  { id: "context", label: "Build context", helper: "Asset, timeframe, market assumptions." },
  { id: "risk", label: "Analyze risk", helper: "Volatility, liquidity, downside, invalidation." },
  { id: "strategy", label: "Simulate strategy", helper: "Entry, exit, stops, scenarios." },
  { id: "backtest", label: "Plan backtest", helper: "Rules, fees, slippage, limitations." },
  { id: "portfolio", label: "Review exposure", helper: "Allocation, concentration, drawdown." },
  { id: "report", label: "Trading report", helper: "Thesis, risks, scenarios, next actions." },
  { id: "access", label: "Access model", helper: "Public, subscription, credits, workspace." },
];

function panelClass(active: boolean) {
  return active
    ? "border-cyan-300/40 bg-cyan-500/16 text-cyan-100 shadow-[0_0_34px_-18px_rgba(34,211,238,0.95)]"
    : "border-white/10 bg-white/[0.045] text-white/62 hover:bg-white/[0.075]";
}

function SectionCard({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/24 p-5">
      <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200/70">{eyebrow}</div>
      <div className="mt-2 text-xl font-semibold text-white">{title}</div>
      <p className="mt-2 text-sm leading-7 text-white/58">{body}</p>
    </div>
  );
}

function StepRow({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm md:grid-cols-[0.18fr_0.35fr_1fr]">
      <span className="font-black text-cyan-200">{step}</span>
      <span className="font-semibold text-white">{title}</span>
      <span className="text-white/60">{body}</span>
    </div>
  );
}

export function AiTradingIntelligenceRuntimeClient() {
  const template = AI_TRADING_INTELLIGENCE_DEEP_TEMPLATE;
  const nexusContract = AI_TRADING_INTELLIGENCE_NEXUS_READY_CONTRACT;

  const [mode, setMode] = useState<RuntimeMode>("overview");
  const [marketQuestion, setMarketQuestion] = useState("Analyze RIO/RUSD liquidity and downside risk before a position");
  const [assetMarket, setAssetMarket] = useState("RIO/RUSD");
  const [timeframe, setTimeframe] = useState("1 week");
  const [strategyPortfolio, setStrategyPortfolio] = useState("Spot-only position, no leverage, monitor liquidity and slippage");
  const [riskConstraints, setRiskConstraints] = useState("No leverage, max 5% capital-at-risk, avoid high slippage");
  const [contextBuilt, setContextBuilt] = useState(false);

  const riskSignals = useMemo(
    () => riskConstraints.split(",").map((item) => item.trim()).filter(Boolean),
    [riskConstraints],
  );

  function loadExample(type: "rio" | "btc" | "portfolio" | "defi") {
    if (type === "rio") {
      setMarketQuestion("Analyze RIO/RUSD liquidity and downside risk before a position");
      setAssetMarket("RIO/RUSD");
      setTimeframe("1 week");
      setStrategyPortfolio("Spot-only position, no leverage, monitor liquidity and slippage");
      setRiskConstraints("No leverage, max 5% capital-at-risk, avoid high slippage");
    }

    if (type === "btc") {
      setMarketQuestion("Review BTC trend and risk before a swing trade");
      setAssetMarket("BTC");
      setTimeframe("2 weeks");
      setStrategyPortfolio("Entry after pullback, stop below invalidation, partial take-profit");
      setRiskConstraints("No leverage, max 3% risk, avoid event volatility");
    }

    if (type === "portfolio") {
      setMarketQuestion("Review portfolio concentration and drawdown exposure");
      setAssetMarket("Crypto portfolio");
      setTimeframe("Long-term");
      setStrategyPortfolio("50% BTC, 20% ETH, 20% RIO, 10% RUSD");
      setRiskConstraints("Reduce concentration, preserve stable allocation, avoid correlated drawdown");
    }

    if (type === "defi") {
      setMarketQuestion("Analyze LP risk for a DeFi pool");
      setAssetMarket("RIO/RUSD pool");
      setTimeframe("1 month");
      setStrategyPortfolio("Provide liquidity and monitor impermanent loss");
      setRiskConstraints("Low slippage, liquidity depth, pool volatility, LP exposure");
    }

    setContextBuilt(false);
    setMode("context");
  }

  function buildContext() {
    setContextBuilt(true);
    setMode("risk");
  }

  function activeWorkflowTitle() {
    if (mode === "overview") return "Project understanding";
    if (mode === "creator") return "Creator trading terminal blueprint";
    if (mode === "context") return "Market context";
    if (mode === "risk") return "Risk analysis";
    if (mode === "strategy") return "Strategy simulation";
    if (mode === "backtest") return "Backtest planning";
    if (mode === "portfolio") return "Portfolio exposure review";
    if (mode === "report") return "Trading intelligence report";
    if (mode === "access") return "Access and monetization model";
    return "Trading intelligence workflow";
  }

  function activeWorkflowOutput() {
    if (!contextBuilt && ["risk", "strategy", "backtest", "portfolio", "report"].includes(mode)) {
      return "Build market context first. The runtime needs asset, timeframe, strategy, and risk constraints before deeper trading intelligence can be generated.";
    }

    if (mode === "overview") return "This project is a creator-owned trading intelligence terminal for market research, risk analysis, strategy simulation, portfolio exposure, and non-advisory decision-support.";
    if (mode === "creator") return "The creator configures market focus, workflow type, user level, and access model. This turns Prime into a trading intelligence product launcher.";
    if (mode === "context") return contextBuilt ? `Market context ready for ${assetMarket}, timeframe ${timeframe}. Question: ${marketQuestion}.` : "Fill the market profile and click Build Market Context.";
    if (mode === "risk") return `Risk analysis should inspect ${riskSignals.length} risk constraint(s), plus volatility, liquidity, downside, invalidation, and capital-at-risk.`;
    if (mode === "strategy") return `Strategy simulation should model: ${strategyPortfolio}, with clear entry, exit, stop, scenario, and invalidation logic.`;
    if (mode === "backtest") return "Backtest plan should include historical window, fees, slippage, signal rules, survivorship bias, and limitation notes.";
    if (mode === "portfolio") return "Portfolio review should inspect allocation, correlation, concentration, drawdown, stable exposure, and liquidity risk.";
    if (mode === "report") return "Trading report should include thesis, risks, scenarios, assumptions, confidence, and non-advisory next actions.";
    if (mode === "access") return "The creator can choose public dashboard, subscription terminal, usage-credit strategy lab, RIO/RUSD/USDT/USDC payment, and professional workspace.";
    return "Select a workflow.";
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[36px] border border-cyan-300/20 bg-white/[0.045] p-7 shadow-[0_32px_120px_-82px_rgba(34,211,238,0.9)]">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">Prime AI Niche Template · AI Trading Intelligence</div>
        <h1 className="mt-3 max-w-5xl text-4xl font-semibold tracking-tight md:text-5xl">{template.title}</h1>
        <p className="mt-4 max-w-4xl text-sm leading-8 text-white/62">{template.publicPositioning}</p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-amber-300/15 bg-amber-500/[0.055] p-5">
            <div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/75">Creator promise</div>
            <p className="mt-2 text-sm leading-7 text-white/68">{template.creatorPromise}</p>
          </div>
          <div className="rounded-3xl border border-emerald-300/15 bg-emerald-500/[0.055] p-5">
            <div className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200/75">User promise</div>
            <p className="mt-2 text-sm leading-7 text-white/68">{template.userPromise}</p>
          </div>
        </div>
      </div>

      <section className="rounded-[34px] border border-violet-300/18 bg-violet-500/[0.055] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.26em] text-violet-200/80">RioMind Nexus-ready contract</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">Ready for future market intelligence</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-white/62">
              This AI Trading Intelligence niche is not Nexus-powered yet, but it is structured as if Nexus already exists.
              Later, Nexus will build market context, analyze risks, simulate strategies, plan backtests, review exposure,
              and generate non-advisory trading intelligence reports.
            </p>
          </div>
          <div className="rounded-2xl border border-violet-300/18 bg-black/25 px-4 py-3 text-xs font-bold text-violet-100">{nexusContract.status.replaceAll("_", " ")}</div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-black/22 p-4"><div className="text-xs text-white/35">Input fields</div><div className="mt-1 text-2xl font-semibold text-cyan-100">{nexusContract.inputSchema.length}</div></div>
          <div className="rounded-2xl border border-white/10 bg-black/22 p-4"><div className="text-xs text-white/35">Workflows</div><div className="mt-1 text-2xl font-semibold text-amber-100">{nexusContract.workflowActions.length}</div></div>
          <div className="rounded-2xl border border-white/10 bg-black/22 p-4"><div className="text-xs text-white/35">Outputs</div><div className="mt-1 text-2xl font-semibold text-emerald-100">{nexusContract.expectedOutputs.length}</div></div>
          <div className="rounded-2xl border border-white/10 bg-black/22 p-4"><div className="text-xs text-white/35">Verification rules</div><div className="mt-1 text-2xl font-semibold text-violet-100">{nexusContract.verificationLayer.length}</div></div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/22 p-4">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-violet-200/70">Nexus role</div>
          <p className="mt-2 text-sm leading-7 text-white/62">{nexusContract.rioMindNexusRole}</p>
        </div>
      </section>

      <section className="rounded-[34px] border border-white/10 bg-black/20 p-5">
        <div className="text-xs font-black uppercase tracking-[0.26em] text-cyan-200/75">How to use this trading intelligence terminal</div>
        <div className="mt-4 grid gap-3">
          {template.userWorkflow.map((item) => <StepRow key={item.step} step={item.step} title={item.title} body={item.description} />)}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.035] p-5">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/80">Market input</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Start with the market question</h2>
          <p className="mt-2 text-sm leading-7 text-white/55">The user defines the asset, timeframe, strategy or portfolio, and risk constraints.</p>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => loadExample("rio")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load RIO/RUSD example</button>
            <button type="button" onClick={() => loadExample("btc")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load BTC example</button>
            <button type="button" onClick={() => loadExample("portfolio")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load portfolio example</button>
            <button type="button" onClick={() => loadExample("defi")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load DeFi LP example</button>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Market question</span><textarea value={marketQuestion} onChange={(event) => setMarketQuestion(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Asset or market</span><input value={assetMarket} onChange={(event) => setAssetMarket(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Timeframe</span><input value={timeframe} onChange={(event) => setTimeframe(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Strategy or portfolio</span><textarea value={strategyPortfolio} onChange={(event) => setStrategyPortfolio(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Risk constraints</span><textarea value={riskConstraints} onChange={(event) => setRiskConstraints(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <button type="button" onClick={buildContext} className="w-full rounded-2xl border border-cyan-300/25 bg-cyan-500/14 px-5 py-3 text-sm font-bold text-cyan-100 hover:bg-cyan-500/20">Build Market Context</button>
          </div>
        </div>

        <div className="rounded-[32px] border border-cyan-300/16 bg-cyan-500/[0.055] p-5">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200/80">Runtime actions</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Choose what to do next</h2>
          <p className="mt-2 text-sm leading-7 text-white/58">Click a workflow. The selected workflow produces a generated output in the RioMind Nexus market intelligence panel.</p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {workflowButtons.map((item) => (
              <button key={item.id} type="button" onClick={() => setMode(item.id)} className={`rounded-2xl border p-4 text-left transition ${panelClass(mode === item.id)}`}>
                <div className="text-sm font-bold">{item.label}</div>
                <div className="mt-1 text-xs leading-5 opacity-75">{item.helper}</div>
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Context</div><div className="mt-1 text-lg font-semibold text-white">{contextBuilt ? "Ready" : "Pending"}</div></div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Risk signals</div><div className="mt-1 text-lg font-semibold text-cyan-100">{contextBuilt ? riskSignals.length : "--"}</div></div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Next action</div><div className="mt-1 text-sm font-semibold text-amber-100">{contextBuilt ? "Analyze risk, then simulate strategy." : "Fill market profile and build context."}</div></div>
          </div>

          <div className="mt-5 rounded-[26px] border border-violet-300/18 bg-violet-500/[0.07] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><div className="text-xs font-black uppercase tracking-[0.24em] text-violet-200/80">RioMind Nexus Market Hook</div><h3 className="mt-2 text-xl font-semibold text-white">{activeWorkflowTitle()}</h3></div>
              <span className="rounded-full border border-violet-300/20 bg-black/25 px-3 py-1 text-xs font-bold text-violet-100">Nexus-ready</span>
            </div>
            <p className="mt-3 text-sm leading-7 text-white/66">{activeWorkflowOutput()}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[36px] border border-white/10 bg-black/20 p-5">
        {mode === "overview" ? <div className="grid gap-4 md:grid-cols-2">{template.audiences.map((audience) => <SectionCard key={audience.title} eyebrow="Who this serves" title={audience.title} body={audience.description} />)}</div> : null}
        {mode === "creator" ? <div className="grid gap-4 md:grid-cols-2">{template.creatorSetup.map((setup) => <div key={setup.title} className="rounded-3xl border border-white/10 bg-black/24 p-5"><div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/70">{setup.title}</div><div className="mt-2 text-sm leading-7 text-white/58">{setup.description}</div><div className="mt-4 flex flex-wrap gap-2">{setup.options.map((option) => <span key={option} className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-xs text-white/68">{option}</span>)}</div></div>)}</div> : null}
        {mode === "context" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Market context" title={contextBuilt ? "Context ready" : "Awaiting context"} body={contextBuilt ? `${assetMarket}, ${timeframe}. ${marketQuestion}` : "Fill market input and click Build Market Context."} /><SectionCard eyebrow="Non-advisory posture" title="Research before execution" body="The runtime supports market research and risk analysis, not guaranteed trading signals." /><SectionCard eyebrow="Recommended next step" title={contextBuilt ? "Analyze risk" : "Build context first"} body={contextBuilt ? "Analyze risk, then simulate strategy." : "Fill asset, timeframe, strategy, and constraints."} /></div> : null}
        {mode === "risk" ? <div className="grid gap-4 md:grid-cols-3">{riskSignals.map((risk) => <SectionCard key={risk} eyebrow="Risk signal" title={risk} body="Nexus later should inspect downside, volatility, liquidity, leverage, invalidation, and capital-at-risk." />)}</div> : null}
        {mode === "strategy" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Strategy" title="Entry / exit logic" body={strategyPortfolio} /><SectionCard eyebrow="Scenario" title="Bull / base / bear case" body="Simulation should show possible outcomes and invalidation, not guaranteed profit." /><SectionCard eyebrow="Sizing" title="Capital-at-risk" body="Position sizing should respect risk constraints and liquidity." /></div> : null}
        {mode === "backtest" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Backtest" title="Historical assumptions" body="Define signal rules, historical window, fees, slippage, data source, and survivorship limits." /><SectionCard eyebrow="Fees and slippage" title="Execution friction" body="Backtests must include realistic costs and liquidity assumptions." /><SectionCard eyebrow="Limitation" title="Past is not guarantee" body="Historical performance does not guarantee future results." /></div> : null}
        {mode === "portfolio" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Exposure" title="Allocation and concentration" body={strategyPortfolio} /><SectionCard eyebrow="Drawdown" title="Downside pressure" body="Portfolio analysis should show what happens under adverse market moves." /><SectionCard eyebrow="Correlation" title="Hidden concentration" body="Assets may appear diversified while still moving together under stress." /></div> : null}
        {mode === "report" ? <div className="grid gap-4 md:grid-cols-2">{template.deepModules.map((module) => <SectionCard key={module.title} eyebrow="Trading report module" title={module.title} body={`${module.purpose} Outputs: ${module.outputs.join(", ")}.`} />)}</div> : null}
        {mode === "access" ? <div className="grid gap-4 md:grid-cols-2">{template.accessModels.map((access) => <SectionCard key={access.title} eyebrow="Access model" title={access.title} body={access.description} />)}{template.proofAndVerification.map((proof) => <SectionCard key={proof} eyebrow="Verification rule" title="Financial safety layer" body={proof} />)}</div> : null}
      </section>
    </section>
  );
}
