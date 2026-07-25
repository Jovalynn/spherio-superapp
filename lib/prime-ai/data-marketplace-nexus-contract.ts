import { buildNexusReadyRuntimeContract } from "./nexus-ready-runtime";

export const DATA_MARKETPLACE_NEXUS_READY_CONTRACT = buildNexusReadyRuntimeContract({
  nicheId: "data_marketplace",
  nicheTitle: "Data Marketplace Intelligence Platform",
  rioMindNexusRole:
    "RioMind Nexus will act as the data intelligence analyst behind the Data Marketplace. It will profile datasets, assess quality, verify provenance posture, review privacy and licensing, evaluate AI-training suitability, match buyer needs to data, and generate data product reports.",
  nexusHooks: [
    "dataset_profile_builder",
    "data_quality_analyzer",
    "provenance_source_verifier",
    "privacy_compliance_reviewer",
    "licensing_access_planner",
    "ai_training_suitability_analyst",
    "dataset_matching_engine",
    "data_product_report_generator",
  ],
  inputSchema: [
    {
      key: "dataset_goal",
      label: "Dataset goal",
      type: "textarea",
      required: true,
      helper: "Describe whether the user wants to sell, buy, analyze, license, or use a dataset.",
      examples: ["Sell customer support dataset", "Find AI training data for agriculture", "Analyze market data feed"],
    },
    {
      key: "data_domain",
      label: "Data domain",
      type: "text",
      required: true,
      helper: "The type or industry of data.",
      examples: ["Healthcare", "Finance", "Agriculture", "Education", "Retail", "Geospatial", "IoT"],
    },
    {
      key: "data_structure",
      label: "Data structure",
      type: "textarea",
      required: true,
      helper: "Columns, fields, file format, records, update frequency, or API shape.",
      examples: ["CSV with 50,000 rows", "API feed updated daily", "Images with labels"],
    },
    {
      key: "intended_use",
      label: "Intended use",
      type: "textarea",
      required: true,
      helper: "How the data will be used.",
      examples: ["AI training", "Market analytics", "Research", "Benchmarking", "Business intelligence"],
    },
    {
      key: "license_or_privacy_notes",
      label: "License or privacy notes",
      type: "textarea",
      required: false,
      helper: "Known ownership, license, consent, privacy, or access restrictions.",
      examples: ["Anonymized", "Commercial license", "No resale", "Personal data removed"],
    },
  ],
  workflowActions: [
    {
      id: "build_dataset_profile",
      label: "Build Dataset Profile",
      purpose: "Create metadata, schema, source, coverage, format, and intended-use profile.",
    },
    {
      id: "analyze_quality",
      label: "Analyze Data Quality",
      purpose: "Assess completeness, missing values, duplicates, anomalies, and consistency.",
      requiresDiagnosis: true,
    },
    {
      id: "review_provenance",
      label: "Review Provenance",
      purpose: "Check source reliability, ownership posture, collection method, and trust notes.",
      requiresDiagnosis: true,
    },
    {
      id: "review_license_privacy",
      label: "Review License and Privacy",
      purpose: "Flag personal data, sensitive fields, consent needs, and license restrictions.",
      requiresDiagnosis: true,
    },
    {
      id: "evaluate_ai_suitability",
      label: "Evaluate AI Suitability",
      purpose: "Assess training, fine-tuning, benchmarking, bias, and evaluation usefulness.",
      requiresDiagnosis: true,
    },
    {
      id: "generate_data_report",
      label: "Generate Data Report",
      purpose: "Produce buyer/seller report, risk summary, quality notes, and next actions.",
      requiresDiagnosis: true,
    },
  ],
  expectedOutputs: [
    {
      key: "dataset_profile",
      label: "Dataset Profile",
      description: "Metadata, schema, coverage, source, format, and intended use.",
    },
    {
      key: "quality_report",
      label: "Quality Report",
      description: "Completeness, missing values, duplicates, anomalies, consistency, and update reliability.",
    },
    {
      key: "provenance_summary",
      label: "Provenance Summary",
      description: "Source, ownership posture, collection method, update history, and trust notes.",
    },
    {
      key: "license_privacy_review",
      label: "License and Privacy Review",
      description: "Usage rights, restrictions, sensitive fields, consent needs, and compliance warnings.",
    },
    {
      key: "ai_suitability_report",
      label: "AI Suitability Report",
      description: "Training, fine-tuning, benchmarking, bias, and model-use suitability notes.",
    },
    {
      key: "dataset_matches",
      label: "Dataset Matches",
      description: "Matching datasets ranked by domain, quality, access, budget, and risk.",
    },
    {
      key: "data_product_report",
      label: "Data Product Report",
      description: "Buyer/seller intelligence brief, risk summary, confidence, and next actions.",
    },
  ],
  verificationLayer: [
    {
      title: "Ownership verification",
      rule: "Dataset ownership, collection rights, and resale permissions must be verified before strong claims.",
    },
    {
      title: "Privacy review",
      rule: "Personal, sensitive, regulated, or restricted data requires compliance and privacy review.",
    },
    {
      title: "AI limitation",
      rule: "AI-training suitability does not guarantee model accuracy or performance.",
    },
    {
      title: "Quality disclosure",
      rule: "Reports must disclose missing values, bias, source limitations, and confidence level.",
    },
  ],
  accessModel: [
    {
      id: "public_access",
      label: "Public dataset directory",
      description: "Anyone can browse basic dataset listings and sample metadata.",
    },
    {
      id: "subscription_access",
      label: "Subscription data marketplace",
      description: "Users subscribe for premium datasets, feeds, saved searches, and reports.",
    },
    {
      id: "usage_credit_access",
      label: "Usage-credit data access",
      description: "Users spend credits, RIO, RUSD, USDT, or USDC for downloads, API calls, or reports.",
    },
    {
      id: "verified_seller_access",
      label: "Verified seller marketplace",
      description: "Approved sellers list datasets and earn from purchases, subscriptions, or API usage.",
    },
  ],
});
