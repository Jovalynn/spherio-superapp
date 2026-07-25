import type { DeepNicheTemplate } from "./deep-niche-template";

export const AI_TRADING_INTELLIGENCE_DEEP_TEMPLATE: DeepNicheTemplate = {
  id: "ai_trading_intelligence",
  title: "AI Trading Intelligence Platform",
  publicPositioning:
    "A creator-owned market intelligence platform for trading research, portfolio analysis, strategy simulation, risk scoring, backtesting, watchlists, and market decision-support.",
  creatorPromise:
    "Prime lets a creator launch their own trading intelligence terminal, market research dashboard, portfolio analyst, risk engine, strategy lab, or backtesting workspace without building the full stack from scratch.",
  userPromise:
    "Users can analyze assets, define trading ideas, review risk, simulate strategies, monitor watchlists, evaluate portfolio exposure, and generate market intelligence reports without treating outputs as guaranteed financial advice.",
  audiences: [
    {
      title: "Retail traders",
      description: "Use watchlists, market summaries, risk notes, and strategy simulation for decision-support.",
    },
    {
      title: "Portfolio builders",
      description: "Analyze allocation, exposure, concentration, drawdown, diversification, and risk posture.",
    },
    {
      title: "Market analysts",
      description: "Prepare asset research, market commentary, scenario analysis, and structured trade reviews.",
    },
    {
      title: "DeFi and crypto users",
      description: "Analyze pools, token markets, liquidity, volatility, on-chain risk, and trading routes.",
    },
  ],
  creatorSetup: [
    {
      title: "Market focus",
      description: "The creator chooses the market type the project supports.",
      options: ["Crypto", "Stocks", "Forex", "Commodities", "DeFi", "Spherio assets", "Multi-market"],
    },
    {
      title: "Trading workflow",
      description: "The creator chooses the primary intelligence workflow.",
      options: ["Market research", "Portfolio analysis", "Strategy simulation", "Backtesting", "Risk scoring", "Watchlist terminal"],
    },
    {
      title: "User level",
      description: "The creator chooses the expected user sophistication.",
      options: ["Beginner", "Retail trader", "Professional analyst", "Portfolio manager", "DeFi user", "Institutional desk"],
    },
    {
      title: "Access and monetization",
      description: "The creator decides how users access intelligence.",
      options: ["Free", "Subscription", "Token-gated", "Usage credits", "RIO/RUSD", "USDT/USDC", "Card payments later"],
    },
  ],
  userWorkflow: [
    {
      step: "01",
      title: "Enter market question",
      description: "User describes asset, market, timeframe, portfolio, or trading idea they want analyzed.",
    },
    {
      step: "02",
      title: "Build market context",
      description: "The runtime structures asset profile, trend, volatility, liquidity, catalyst, and timeframe assumptions.",
    },
    {
      step: "03",
      title: "Analyze risk",
      description: "The app reviews downside, volatility, concentration, liquidity, leverage, and invalidation conditions.",
    },
    {
      step: "04",
      title: "Simulate strategy",
      description: "The system models entry logic, exit logic, stop conditions, exposure, and scenario outcomes.",
    },
    {
      step: "05",
      title: "Review portfolio impact",
      description: "The runtime evaluates allocation, correlation, drawdown, concentration, and capital-at-risk.",
    },
    {
      step: "06",
      title: "Generate intelligence report",
      description: "The app outputs market thesis, risk notes, scenarios, assumptions, and non-advisory decision-support summary.",
    },
  ],
  deepModules: [
    {
      title: "Market Context Builder",
      purpose: "Convert a trading question into asset profile, timeframe, market conditions, catalysts, and assumptions.",
      outputs: ["market_context", "asset_profile", "timeframe_assumptions"],
    },
    {
      title: "Risk Intelligence Engine",
      purpose: "Analyze volatility, liquidity, drawdown, leverage, concentration, and invalidation conditions.",
      outputs: ["risk_score", "downside_notes", "invalidation_levels"],
    },
    {
      title: "Strategy Simulator",
      purpose: "Model entry logic, exit logic, stop rules, position sizing, and scenario outcomes.",
      outputs: ["strategy_plan", "scenario_table", "risk_reward_notes"],
    },
    {
      title: "Backtesting Planner",
      purpose: "Prepare backtest assumptions, historical window, signal rules, fees, slippage, and limitations.",
      outputs: ["backtest_plan", "assumption_set", "limitation_notes"],
    },
    {
      title: "Portfolio Exposure Analyst",
      purpose: "Evaluate allocation, correlation, concentration, sector/token exposure, and capital-at-risk.",
      outputs: ["exposure_map", "concentration_flags", "portfolio_risk_notes"],
    },
    {
      title: "DeFi / Liquidity Analyst",
      purpose: "Analyze pool liquidity, route risk, price impact, slippage, LP exposure, and on-chain market risk.",
      outputs: ["liquidity_report", "slippage_notes", "pool_risk_flags"],
    },
    {
      title: "Watchlist and Alert Planner",
      purpose: "Create market watchlists, trigger conditions, invalidation alerts, and scenario monitoring.",
      outputs: ["watchlist", "alert_rules", "monitoring_plan"],
    },
    {
      title: "Trading Intelligence Report",
      purpose: "Generate thesis, risk summary, scenarios, assumptions, confidence, and non-advisory notes.",
      outputs: ["market_thesis", "risk_report", "decision_support_summary"],
    },
  ],
  accessModels: [
    {
      title: "Public market dashboard",
      description: "Anyone can view basic market research, watchlists, and non-advisory summaries.",
    },
    {
      title: "Subscription intelligence terminal",
      description: "Users pay for saved watchlists, deeper analysis, simulations, and portfolio reports.",
    },
    {
      title: "Usage-credit strategy lab",
      description: "Users spend credits, RIO, RUSD, USDT, or USDC for simulations, risk reports, and backtest plans.",
    },
    {
      title: "Professional workspace",
      description: "Teams and analysts manage research notes, portfolio intelligence, alerts, and reports.",
    },
  ],
  rioMindNexusRole: [
    "Act as the market intelligence analyst behind the AI Trading Intelligence project.",
    "Structure market questions into context, timeframe, assumptions, risks, and scenarios.",
    "Analyze volatility, liquidity, concentration, portfolio exposure, and downside risks.",
    "Simulate strategies and backtesting assumptions without promising outcomes.",
    "Generate non-advisory market intelligence reports, risk notes, and next-step decision-support.",
    "Support future Spherio/RioDex/RioEx/RioExplorer integration for token markets, pool truth, liquidity, and execution proof.",
  ],
  proofAndVerification: [
    "Outputs are market research and decision-support, not financial advice or guaranteed trading signals.",
    "Trading involves risk, losses are possible, and users remain responsible for decisions.",
    "Backtests and simulations must disclose assumptions, fees, slippage, and historical limitations.",
    "Live trading, regulated assets, leverage, and high-impact financial decisions may require licensed professional advice.",
  ],
};
