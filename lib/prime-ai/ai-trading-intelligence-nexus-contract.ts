import { buildNexusReadyRuntimeContract } from "./nexus-ready-runtime";

export const AI_TRADING_INTELLIGENCE_NEXUS_READY_CONTRACT = buildNexusReadyRuntimeContract({
  nicheId: "ai_trading_intelligence",
  nicheTitle: "AI Trading Intelligence Platform",
  rioMindNexusRole:
    "RioMind Nexus will act as the market intelligence analyst behind the AI Trading Intelligence project. It will build market context, analyze risks, simulate strategies, plan backtests, assess portfolio exposure, review DeFi liquidity, and generate non-advisory market intelligence reports.",
  nexusHooks: [
    "market_context_builder",
    "risk_intelligence_engine",
    "strategy_simulator",
    "backtesting_planner",
    "portfolio_exposure_analyst",
    "defi_liquidity_analyst",
    "watchlist_alert_planner",
    "trading_intelligence_reporter",
  ],
  inputSchema: [
    {
      key: "market_question",
      label: "Market question",
      type: "textarea",
      required: true,
      helper: "Describe the asset, market, portfolio, or strategy idea to analyze.",
      examples: ["Analyze RIO/RUSD liquidity risk", "Review BTC trend", "Simulate DCA strategy"],
    },
    {
      key: "asset_or_market",
      label: "Asset or market",
      type: "text",
      required: true,
      helper: "The asset, pair, portfolio, or market focus.",
      examples: ["RIO/RUSD", "BTC", "ETH", "US stocks", "DeFi pool"],
    },
    {
      key: "timeframe",
      label: "Timeframe",
      type: "text",
      required: true,
      helper: "The analysis timeframe.",
      examples: ["Intraday", "1 week", "1 month", "Long-term portfolio"],
    },
    {
      key: "strategy_or_portfolio",
      label: "Strategy or portfolio",
      type: "textarea",
      required: false,
      helper: "Known strategy, allocation, entry/exit idea, or portfolio exposure.",
      examples: ["Buy dips", "DCA monthly", "Hold 60% RIO, 40% RUSD", "LP in RIO/RUSD pool"],
    },
    {
      key: "risk_constraints",
      label: "Risk constraints",
      type: "textarea",
      required: false,
      helper: "Risk tolerance, capital-at-risk, stop conditions, leverage, or liquidity constraints.",
      examples: ["No leverage", "Max 5% drawdown", "Low slippage", "Avoid illiquid assets"],
    },
  ],
  workflowActions: [
    {
      id: "build_market_context",
      label: "Build Market Context",
      purpose: "Create asset profile, timeframe, market condition, catalyst, and assumption summary.",
    },
    {
      id: "analyze_risk",
      label: "Analyze Risk",
      purpose: "Assess volatility, liquidity, downside, leverage, concentration, and invalidation.",
      requiresDiagnosis: true,
    },
    {
      id: "simulate_strategy",
      label: "Simulate Strategy",
      purpose: "Model entry, exit, stop rules, position sizing, and scenario outcomes.",
      requiresDiagnosis: true,
    },
    {
      id: "plan_backtest",
      label: "Plan Backtest",
      purpose: "Define historical window, signal rules, fees, slippage, and limitations.",
      requiresDiagnosis: true,
    },
    {
      id: "review_portfolio_exposure",
      label: "Review Portfolio Exposure",
      purpose: "Evaluate allocation, correlation, concentration, drawdown, and capital-at-risk.",
      requiresDiagnosis: true,
    },
    {
      id: "generate_trading_report",
      label: "Generate Trading Report",
      purpose: "Produce thesis, risk notes, scenarios, assumptions, and non-advisory decision-support.",
      requiresDiagnosis: true,
    },
  ],
  expectedOutputs: [
    {
      key: "market_context",
      label: "Market Context",
      description: "Asset profile, timeframe, catalysts, market conditions, and assumptions.",
    },
    {
      key: "risk_report",
      label: "Risk Report",
      description: "Volatility, liquidity, downside, leverage, concentration, and invalidation notes.",
    },
    {
      key: "strategy_simulation",
      label: "Strategy Simulation",
      description: "Entry/exit logic, stop rules, position sizing, and scenario outcomes.",
    },
    {
      key: "backtest_plan",
      label: "Backtest Plan",
      description: "Historical window, signal rules, fees, slippage, data assumptions, and limitations.",
    },
    {
      key: "portfolio_exposure",
      label: "Portfolio Exposure",
      description: "Allocation, correlation, concentration, drawdown, and capital-at-risk summary.",
    },
    {
      key: "liquidity_analysis",
      label: "Liquidity Analysis",
      description: "Pool liquidity, route risk, price impact, slippage, and DeFi-specific risk flags.",
    },
    {
      key: "trading_intelligence_report",
      label: "Trading Intelligence Report",
      description: "Market thesis, scenarios, assumptions, risk notes, and non-advisory next actions.",
    },
  ],
  verificationLayer: [
    {
      title: "Not financial advice",
      rule: "Outputs are market research and decision-support only, not financial advice or guaranteed trading signals.",
    },
    {
      title: "Risk disclosure",
      rule: "Trading involves risk, losses are possible, and users remain responsible for decisions.",
    },
    {
      title: "Simulation limitation",
      rule: "Backtests and simulations must disclose assumptions, fees, slippage, and historical limitations.",
    },
    {
      title: "Professional advice",
      rule: "Regulated assets, leverage, or high-impact financial decisions may require licensed professional advice.",
    },
  ],
  accessModel: [
    {
      id: "public_access",
      label: "Public market dashboard",
      description: "Anyone can view basic market research and non-advisory summaries.",
    },
    {
      id: "subscription_access",
      label: "Subscription intelligence terminal",
      description: "Users pay for saved watchlists, deeper analysis, simulations, and reports.",
    },
    {
      id: "usage_credit_access",
      label: "Usage-credit strategy lab",
      description: "Users spend credits, RIO, RUSD, USDT, or USDC for simulations and risk reports.",
    },
    {
      id: "professional_workspace",
      label: "Professional workspace",
      description: "Teams and analysts manage research notes, portfolio intelligence, alerts, and reports.",
    },
  ],
});
