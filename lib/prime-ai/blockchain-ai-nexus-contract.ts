import { buildNexusReadyRuntimeContract } from "./nexus-ready-runtime";

export const BLOCKCHAIN_AI_NEXUS_READY_CONTRACT = buildNexusReadyRuntimeContract({
  nicheId: "blockchain_ai",
  nicheTitle: "Blockchain AI Intelligence Platform",
  rioMindNexusRole: "RioMind Nexus will act as the blockchain intelligence layer. It will analyze contracts, tokenomics, DEX liquidity, bridges, validators, governance, wallets, explorer proof, and generate blockchain intelligence reports.",
  nexusHooks: ["smart_contract_analyzer","tokenomics_risk_engine","dex_liquidity_analyst","bridge_ibc_risk_reviewer","validator_governance_analyst","wallet_transaction_profiler","explorer_proof_verifier","blockchain_report_generator"],
  inputSchema: [
    { key: "chain_object", label: "Chain object", type: "textarea", required: true, helper: "Contract, token, pool, wallet, validator, bridge route, or proposal.", examples: ["RIO/RUSD pool", "SPO-20 contract", "wallet address", "governance proposal"] },
    { key: "chain_context", label: "Chain context", type: "text", required: true, helper: "Chain or ecosystem context.", examples: ["Spherio", "Cosmos", "EVM", "IBC"] },
    { key: "analysis_goal", label: "Analysis goal", type: "textarea", required: true, helper: "What should be analyzed.", examples: ["Review tokenomics", "Check liquidity risk", "Analyze contract admin controls"] },
    { key: "known_sources", label: "Known sources", type: "textarea", required: false, helper: "Explorer, indexer, contract, registry, or pool evidence.", examples: ["RioExplorer link", "contract address", "pool address"] },
    { key: "risk_constraints", label: "Risk constraints", type: "textarea", required: false, helper: "Specific concerns or review limits.", examples: ["No assumptions without proof", "Check admin authority", "Flag bridge risk"] }
  ],
  workflowActions: [
    { id: "build_chain_context", label: "Build Chain Context", purpose: "Identify chain, asset, contract, liquidity, authority, and proof sources." },
    { id: "analyze_contract_tokenomics", label: "Analyze Contract/Tokenomics", purpose: "Review contract permissions, supply, allocation, vesting, emissions, and controls.", requiresDiagnosis: true },
    { id: "analyze_liquidity_bridge", label: "Analyze Liquidity/Bridge", purpose: "Review pool truth, route risk, slippage, LP exposure, bridge assumptions, and IBC path.", requiresDiagnosis: true },
    { id: "review_governance_validator", label: "Review Governance/Validator", purpose: "Analyze validator posture, proposals, treasury logic, authority, and governance impact.", requiresDiagnosis: true },
    { id: "verify_explorer_proof", label: "Verify Explorer Proof", purpose: "Separate source-of-truth evidence from assumptions and missing data.", requiresDiagnosis: true },
    { id: "generate_blockchain_report", label: "Generate Blockchain Report", purpose: "Produce risk report, proof notes, assumptions, review points, and next actions.", requiresDiagnosis: true }
  ],
  expectedOutputs: [
    { key: "chain_context", label: "Chain Context", description: "Chain, asset, contract, pool, authority, registry, and proof-source summary." },
    { key: "contract_review", label: "Contract Review", description: "Admin controls, permissions, mint/burn, pause, upgrade, and execution risk." },
    { key: "tokenomics_review", label: "Tokenomics Review", description: "Supply, allocation, vesting, emissions, locks, treasury, and incentive notes." },
    { key: "liquidity_bridge_report", label: "Liquidity/Bridge Report", description: "Pool truth, route risk, slippage, price impact, LP exposure, and bridge assumptions." },
    { key: "governance_validator_review", label: "Governance/Validator Review", description: "Validator posture, proposal impact, treasury logic, authority, and governance risk." },
    { key: "explorer_proof_summary", label: "Explorer Proof Summary", description: "Indexer/explorer/contract/pool evidence, missing proof, and assumptions." },
    { key: "blockchain_intelligence_report", label: "Blockchain Intelligence Report", description: "Final protocol report with risks, proof notes, limitations, and next actions." }
  ],
  verificationLayer: [
    { title: "Source-of-truth verification", rule: "Blockchain outputs require explorer, indexer, contract, registry, or pool evidence before protocol decisions." },
    { title: "Audit boundary", rule: "Smart-contract and security conclusions require qualified audit review." },
    { title: "No safety guarantee", rule: "The system must not guarantee exploit-free contracts, profitable tokens, safe pools, or safe bridges." },
    { title: "Assumption separation", rule: "Evidence must be clearly separated from assumptions, estimates, and missing data." }
  ],
  accessModel: [
    { id: "public_chain_assistant", label: "Public blockchain assistant", description: "Basic contract, token, wallet, and proposal summaries." },
    { id: "subscription_protocol_terminal", label: "Subscription protocol terminal", description: "Saved projects, deep analysis, proof reports, and monitoring." },
    { id: "usage_credit_risk_engine", label: "Usage-credit risk engine", description: "Advanced reviews using credits, RIO, RUSD, USDT, or USDC." },
    { id: "team_governance_workspace", label: "Team governance workspace", description: "Audits, proposals, liquidity, validators, bridge reviews, and reports." }
  ]
});
