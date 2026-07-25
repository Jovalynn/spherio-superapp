import type { DeepNicheTemplate } from "./deep-niche-template";

export const BLOCKCHAIN_AI_DEEP_TEMPLATE: DeepNicheTemplate = {
  id: "blockchain_ai",
  title: "Blockchain AI Intelligence Platform",
  publicPositioning: "A creator-owned blockchain intelligence platform for smart contracts, tokenomics, DEX liquidity, bridges, validators, governance, explorer proof, wallet intelligence, and protocol risk analysis.",
  creatorPromise: "Prime lets a creator launch a blockchain AI terminal, smart-contract analyzer, tokenomics lab, DEX risk engine, governance assistant, or explorer intelligence workspace.",
  userPromise: "Builders can analyze contracts, tokens, liquidity, wallets, validators, bridges, governance proposals, and on-chain proof before making protocol decisions.",
  audiences: [
    { title: "Protocol builders", description: "Review tokenomics, smart contracts, governance, liquidity, and launch readiness." },
    { title: "DeFi and DEX teams", description: "Analyze pools, routes, LP exposure, slippage, price impact, and market integrity." },
    { title: "Validators and governance teams", description: "Inspect validator posture, treasury logic, proposals, and protocol changes." },
    { title: "Wallets and explorers", description: "Generate wallet intelligence, transaction summaries, proof views, and asset risk notes." }
  ],
  creatorSetup: [
    { title: "Blockchain focus", description: "Choose the intelligence category.", options: ["Smart contracts", "Tokenomics", "DEX", "Bridge", "Validator", "Governance", "Explorer"] },
    { title: "Workflow type", description: "Choose the core workflow.", options: ["Audit prep", "Risk analysis", "Liquidity review", "Token launch", "Proposal review", "Wallet analysis"] },
    { title: "Chain model", description: "Choose chain type.", options: ["Cosmos", "EVM", "Spherio", "IBC", "Multi-chain", "Appchain"] },
    { title: "Access", description: "Choose monetization.", options: ["Free", "Subscription", "Usage credits", "RIO/RUSD", "USDT/USDC"] }
  ],
  userWorkflow: [
    { step: "01", title: "Enter blockchain object", description: "User enters contract, token, pair, wallet, validator, bridge route, or governance proposal." },
    { step: "02", title: "Build chain context", description: "Runtime identifies chain, asset, contract, transaction, liquidity, authority, and proof sources." },
    { step: "03", title: "Analyze risk", description: "App reviews contract, liquidity, tokenomics, bridge, governance, and wallet risk." },
    { step: "04", title: "Generate protocol intelligence", description: "System creates audit-prep notes, market integrity notes, and proof summary." },
    { step: "05", title: "Verify source of truth", description: "Runtime checks explorer/indexer proof, registry data, pool truth, authority, and missing evidence." },
    { step: "06", title: "Generate blockchain report", description: "App outputs risk flags, assumptions, proof notes, review points, and next actions." }
  ],
  deepModules: [
    { title: "Smart Contract Analyzer", purpose: "Review contract purpose, admin controls, mint/burn, pause logic, upgrades, and permissions.", outputs: ["contract_summary", "admin_risks", "permission_flags"] },
    { title: "Tokenomics Risk Engine", purpose: "Analyze supply, allocation, vesting, emissions, treasury, locks, and incentive design.", outputs: ["tokenomics_review", "supply_flags", "incentive_notes"] },
    { title: "DEX Liquidity Analyst", purpose: "Review pools, reserves, routes, slippage, price impact, LP exposure, and CPMM truth.", outputs: ["liquidity_report", "route_risk", "price_impact_notes"] },
    { title: "Bridge and IBC Risk Reviewer", purpose: "Analyze cross-chain path, counterparty chain, relayer assumptions, message risk, and liquidity handoff.", outputs: ["bridge_report", "counterparty_risk", "route_assumptions"] },
    { title: "Validator and Governance Analyst", purpose: "Review validator set, staking posture, proposal risk, treasury impact, and governance authority.", outputs: ["validator_review", "proposal_risk", "governance_notes"] },
    { title: "Wallet and Transaction Profiler", purpose: "Summarize wallet behavior, transaction patterns, exposure, suspicious flows, and proof links.", outputs: ["wallet_profile", "tx_summary", "behavior_flags"] },
    { title: "Explorer Proof Verifier", purpose: "Check source-of-truth evidence from indexer, explorer, contract registry, and pool records.", outputs: ["proof_summary", "missing_evidence", "explorer_notes"] },
    { title: "Blockchain Intelligence Report", purpose: "Generate protocol report with risk flags, proof notes, assumptions, and next actions.", outputs: ["blockchain_report", "risk_flags", "next_actions"] }
  ],
  accessModels: [
    { title: "Public blockchain assistant", description: "Anyone can generate basic contract, wallet, token, and proposal summaries." },
    { title: "Subscription protocol terminal", description: "Users pay for saved projects, deeper analysis, proof reports, and monitoring." },
    { title: "Usage-credit risk engine", description: "Users spend credits, RIO, RUSD, USDT, or USDC for advanced protocol reviews." },
    { title: "Team governance workspace", description: "Teams manage audits, proposals, liquidity, validators, bridge reviews, and reports." }
  ],
  rioMindNexusRole: [
    "Act as the blockchain intelligence layer behind Blockchain AI.",
    "Analyze smart contracts, tokenomics, DEX liquidity, bridges, validators, governance, wallets, and explorer proof.",
    "Generate protocol reports with assumptions, limitations, risk flags, proof notes, and next actions."
  ],
  proofAndVerification: [
    "Blockchain outputs require source-of-truth verification before protocol decisions.",
    "Smart-contract and security conclusions require qualified audit review.",
    "The system must not guarantee exploit-free contracts, profitable tokens, or safe bridges.",
    "Explorer, indexer, contract, and pool evidence must be clearly separated from assumptions."
  ]
};
