import type { DeepNicheTemplate } from "./deep-niche-template";

export const DATA_SCIENCE_MACHINE_LEARNING_AI_DEEP_TEMPLATE: DeepNicheTemplate = {
  id: "data_science_machine_learning_ai",
  title: "Data Science & Machine Learning AI Intelligence Platform",
  publicPositioning: "A creator-owned data science and ML intelligence platform for datasets, analytics, feature engineering, model planning, evaluation, forecasting, dashboards, MLOps, and AI research workflows.",
  creatorPromise: "Prime lets a creator launch a data science lab, ML assistant, analytics workspace, model-evaluation platform, forecasting tool, or enterprise AI research hub.",
  userPromise: "Users can profile datasets, define ML problems, build analysis plans, design features, compare models, evaluate metrics, generate dashboards, and produce machine-learning reports.",
  audiences: [
    { title: "Data scientists", description: "Analyze datasets, engineer features, compare models, evaluate metrics, and generate reports." },
    { title: "ML engineers", description: "Plan pipelines, training workflows, evaluation, monitoring, drift checks, and MLOps readiness." },
    { title: "Business analysts", description: "Turn raw data into insights, dashboards, forecasts, KPIs, and decision-support reports." },
    { title: "AI research teams", description: "Frame experiments, compare approaches, document assumptions, and prepare research outputs." }
  ],
  creatorSetup: [
    { title: "Data focus", description: "Choose the analytics category.", options: ["Dataset profiling", "Forecasting", "Classification", "Regression", "NLP", "Computer vision", "MLOps"] },
    { title: "Workflow type", description: "Choose the main workflow.", options: ["EDA", "Feature engineering", "Model planning", "Evaluation", "Dashboard", "Experiment report"] },
    { title: "User level", description: "Choose user level.", options: ["Student", "Analyst", "Data scientist", "ML engineer", "Enterprise"] },
    { title: "Access", description: "Choose monetization.", options: ["Free", "Subscription", "Usage credits", "RIO/RUSD", "USDT/USDC"] }
  ],
  userWorkflow: [
    { step: "01", title: "Enter data problem", description: "User describes dataset, business question, prediction goal, metrics, or research objective." },
    { step: "02", title: "Profile data context", description: "Runtime structures columns, targets, data quality, missing values, leakage risk, and assumptions." },
    { step: "03", title: "Plan analysis", description: "App proposes EDA, features, validation, model candidates, metrics, and visualization plan." },
    { step: "04", title: "Evaluate model strategy", description: "System reviews model fit, bias, overfitting, explainability, drift, and deployment concerns." },
    { step: "05", title: "Generate insight package", description: "Runtime creates charts plan, dashboard outline, model report, and decision notes." },
    { step: "06", title: "Generate ML report", description: "App outputs dataset profile, model plan, risks, assumptions, metrics, and next actions." }
  ],
  deepModules: [
    { title: "Dataset Profiler", purpose: "Review schema, columns, target, data types, missing values, outliers, and quality risks.", outputs: ["dataset_profile", "quality_flags", "schema_notes"] },
    { title: "EDA Planner", purpose: "Plan distributions, correlations, segment analysis, leakage checks, and visual exploration.", outputs: ["eda_plan", "chart_plan", "leakage_flags"] },
    { title: "Feature Engineering Designer", purpose: "Design transformations, encodings, aggregations, time windows, embeddings, and feature store notes.", outputs: ["feature_plan", "transforms", "feature_risks"] },
    { title: "Model Strategy Advisor", purpose: "Recommend model families, baselines, validation strategy, metrics, and evaluation workflow.", outputs: ["model_strategy", "baseline_plan", "metric_plan"] },
    { title: "Evaluation and Bias Reviewer", purpose: "Review overfitting, bias, fairness, explainability, calibration, drift, and uncertainty.", outputs: ["evaluation_review", "bias_flags", "drift_notes"] },
    { title: "Forecasting Analyst", purpose: "Plan time-series models, seasonality, trend, backtesting, anomaly detection, and forecast intervals.", outputs: ["forecast_plan", "backtest_notes", "anomaly_flags"] },
    { title: "MLOps Readiness Planner", purpose: "Plan deployment, monitoring, model registry, retraining, drift alerts, and rollback.", outputs: ["mlops_plan", "monitoring_rules", "rollback_notes"] },
    { title: "ML Intelligence Report", purpose: "Generate complete ML report with assumptions, risks, metrics, and next actions.", outputs: ["ml_report", "risk_flags", "next_actions"] }
  ],
  accessModels: [
    { title: "Public analytics assistant", description: "Anyone can generate basic EDA, model ideas, and dashboard outlines." },
    { title: "Subscription data workspace", description: "Users pay for saved datasets, analyses, dashboards, model reports, and experiments." },
    { title: "Usage-credit ML engine", description: "Users spend credits, RIO, RUSD, USDT, or USDC for advanced analysis and model review." },
    { title: "Team ML workspace", description: "Teams manage datasets, experiments, dashboards, MLOps, and ML reports." }
  ],
  rioMindNexusRole: [
    "Act as the data science and ML intelligence layer behind Data Science & Machine Learning AI.",
    "Profile datasets, plan EDA, design features, advise model strategy, review evaluation, plan MLOps, and generate ML reports.",
    "Generate data/ML reports with assumptions, limitations, risks, metrics, and next actions."
  ],
  proofAndVerification: [
    "Data and ML outputs require validation against real datasets before use.",
    "The system must not guarantee model accuracy, business outcomes, or unbiased results.",
    "Sensitive, personal, regulated, or proprietary data requires privacy controls and access review.",
    "Metrics, assumptions, leakage, bias, and data limitations must be clearly disclosed."
  ]
};
