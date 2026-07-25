import type { DeepNicheTemplate } from "./deep-niche-template";

export const DATA_MARKETPLACE_DEEP_TEMPLATE: DeepNicheTemplate = {
  id: "data_marketplace",
  title: "Data Marketplace Intelligence Platform",
  publicPositioning:
    "A creator-owned data marketplace for datasets, analytics feeds, AI training data, licensing, data quality reports, data products, and enterprise data access.",
  creatorPromise:
    "Prime lets a creator launch their own dataset marketplace, AI training data store, analytics feed platform, verified data exchange, or enterprise data product hub without building the full marketplace stack from scratch.",
  userPromise:
    "Users can list datasets, describe data, define licensing, inspect quality, evaluate AI-training suitability, discover useful datasets, purchase access, and generate dataset intelligence reports.",
  audiences: [
    {
      title: "Dataset sellers",
      description: "Publish datasets, define metadata, pricing, licenses, access rules, quality notes, and monetization terms.",
    },
    {
      title: "AI builders and ML teams",
      description: "Find datasets for training, testing, evaluation, fine-tuning, benchmarking, and analytics workflows.",
    },
    {
      title: "Businesses and analysts",
      description: "Access market data, customer insights, operational datasets, analytics feeds, and decision-support products.",
    },
    {
      title: "Researchers and institutions",
      description: "Share research datasets, verify provenance, define usage rules, and support reproducible analysis.",
    },
  ],
  creatorSetup: [
    {
      title: "Marketplace category",
      description: "The creator chooses the type of data marketplace.",
      options: ["AI training data", "Research datasets", "Market data", "Business analytics", "IoT data", "Geospatial data", "Financial data"],
    },
    {
      title: "Data listing model",
      description: "The creator decides who can list datasets.",
      options: ["Open listing", "Verified sellers", "Curated datasets", "Institution-only", "Enterprise vendors"],
    },
    {
      title: "Data access model",
      description: "The creator chooses how buyers access data.",
      options: ["Download", "API access", "Subscription feed", "One-time purchase", "Token-gated", "Enterprise contract"],
    },
    {
      title: "Access and monetization",
      description: "The creator decides pricing and settlement rails.",
      options: ["Free", "Subscription", "Usage credits", "Dataset purchase", "Revenue share", "RIO/RUSD", "USDT/USDC", "Card payments later"],
    },
  ],
  userWorkflow: [
    {
      step: "01",
      title: "Describe dataset need or listing",
      description: "User explains the dataset they want to buy, sell, analyze, or publish.",
    },
    {
      step: "02",
      title: "Generate data profile",
      description: "The runtime structures metadata, columns, source, coverage, format, update frequency, and intended use.",
    },
    {
      step: "03",
      title: "Assess quality and provenance",
      description: "The app checks completeness, bias, missing values, source reliability, license posture, and privacy concerns.",
    },
    {
      step: "04",
      title: "Review licensing and access",
      description: "The system recommends access model, usage limits, buyer rights, resale rules, and compliance notes.",
    },
    {
      step: "05",
      title: "Match dataset to use case",
      description: "The runtime evaluates whether the data fits AI training, analytics, research, enterprise, or market intelligence needs.",
    },
    {
      step: "06",
      title: "Generate data intelligence report",
      description: "The app outputs data profile, quality score, licensing notes, risk flags, and recommended next actions.",
    },
  ],
  deepModules: [
    {
      title: "Dataset Profile Builder",
      purpose: "Convert dataset description into structured metadata, schema, coverage, source, and intended use.",
      outputs: ["dataset_profile", "schema_summary", "coverage_map"],
    },
    {
      title: "Data Quality Analyzer",
      purpose: "Assess completeness, missing values, duplicates, anomalies, consistency, and update reliability.",
      outputs: ["quality_score", "missing_value_report", "anomaly_flags"],
    },
    {
      title: "Provenance and Source Verifier",
      purpose: "Track source, collection method, ownership claim, update history, and trust posture.",
      outputs: ["provenance_summary", "source_risk", "trust_notes"],
    },
    {
      title: "Privacy and Compliance Reviewer",
      purpose: "Flag personal data, regulated data, sensitive fields, consent needs, and compliance risk.",
      outputs: ["privacy_flags", "compliance_notes", "human_review_rules"],
    },
    {
      title: "Licensing and Access Planner",
      purpose: "Define buyer rights, usage limits, resale restrictions, API/download access, and enterprise terms.",
      outputs: ["license_model", "access_rules", "usage_limits"],
    },
    {
      title: "AI Training Suitability Analyst",
      purpose: "Evaluate whether the dataset is useful for training, fine-tuning, benchmarking, or evaluation.",
      outputs: ["ai_suitability_score", "training_notes", "bias_warnings"],
    },
    {
      title: "Dataset Matching Engine",
      purpose: "Match buyer requests to available datasets based on domain, quality, access, budget, and risk.",
      outputs: ["dataset_matches", "match_reasoning", "buyer_recommendation"],
    },
    {
      title: "Data Product Report Generator",
      purpose: "Generate seller listing report, buyer intelligence brief, risk summary, and next actions.",
      outputs: ["listing_report", "buyer_report", "risk_summary"],
    },
  ],
  accessModels: [
    {
      title: "Public dataset directory",
      description: "Anyone can browse basic dataset listings and sample metadata.",
    },
    {
      title: "Subscription data marketplace",
      description: "Users subscribe for premium datasets, feeds, saved searches, and data intelligence reports.",
    },
    {
      title: "Usage-credit data access",
      description: "Users spend credits, RIO, RUSD, USDT, or USDC for downloads, API calls, or reports.",
    },
    {
      title: "Verified seller marketplace",
      description: "Approved sellers list datasets and earn from purchases, subscriptions, or API usage.",
    },
  ],
  rioMindNexusRole: [
    "Act as the data intelligence analyst behind the Data Marketplace project.",
    "Structure dataset metadata, schema, quality, provenance, licensing, and access rules.",
    "Assess data quality, privacy risk, compliance posture, and AI-training suitability.",
    "Match buyer requests to suitable datasets and explain fit, risk, and limitations.",
    "Generate dataset intelligence reports for buyers, sellers, researchers, and enterprises.",
    "Support future proof, provenance, licensing, reputation, and payment flows through Spherio/RioExplorer layers.",
  ],
  proofAndVerification: [
    "Dataset ownership, license, and provenance must be verified before strong trust claims.",
    "Personal, sensitive, regulated, or restricted data requires compliance review.",
    "AI-training suitability does not guarantee model performance.",
    "Data quality reports should disclose missing values, bias, source limitations, and confidence level.",
  ],
};
