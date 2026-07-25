import { buildNexusReadyRuntimeContract } from "./nexus-ready-runtime";

export const DATA_SCIENCE_MACHINE_LEARNING_AI_NEXUS_READY_CONTRACT = buildNexusReadyRuntimeContract({
  nicheId: "data_science_machine_learning_ai",
  nicheTitle: "Data Science & Machine Learning AI Intelligence Platform",
  rioMindNexusRole: "RioMind Nexus will act as the data science and ML intelligence layer. It will profile datasets, plan EDA, design features, advise model strategy, review evaluation, plan MLOps, and generate ML intelligence reports.",
  nexusHooks: ["dataset_profiler","eda_planner","feature_engineering_designer","model_strategy_advisor","evaluation_bias_reviewer","forecasting_analyst","mlops_readiness_planner","ml_report_generator"],
  inputSchema: [
    { key: "data_problem", label: "Data problem", type: "textarea", required: true, helper: "Dataset, business question, prediction goal, or research objective.", examples: ["Predict churn", "Analyze sales", "Forecast demand"] },
    { key: "dataset_context", label: "Dataset context", type: "textarea", required: true, helper: "Columns, target, source, size, or data description.", examples: ["CSV with customers and churn label", "Sales by date and region"] },
    { key: "target_metric", label: "Target metric", type: "text", required: false, helper: "Metric or success measure.", examples: ["Accuracy", "AUC", "RMSE", "MAPE", "Revenue lift"] },
    { key: "constraints", label: "Constraints", type: "textarea", required: false, helper: "Privacy, deployment, compute, deadline, or business constraints.", examples: ["No personal data", "Explainable model", "Low compute"] },
    { key: "target_output", label: "Target output", type: "textarea", required: true, helper: "What should be generated.", examples: ["EDA plan", "Model strategy", "Dashboard outline", "ML report"] }
  ],
  workflowActions: [
    { id: "profile_dataset", label: "Profile Dataset", purpose: "Review schema, data quality, target, missing values, outliers, and assumptions." },
    { id: "plan_eda_features", label: "Plan EDA/Features", purpose: "Design EDA, visualizations, leakage checks, feature engineering, and transformations.", requiresDiagnosis: true },
    { id: "advise_model_strategy", label: "Advise Model Strategy", purpose: "Recommend baselines, model families, validation, metrics, and evaluation workflow.", requiresDiagnosis: true },
    { id: "review_evaluation_bias", label: "Review Evaluation/Bias", purpose: "Check overfitting, bias, fairness, explainability, calibration, drift, and uncertainty.", requiresDiagnosis: true },
    { id: "plan_mlops_dashboard", label: "Plan MLOps/Dashboard", purpose: "Design monitoring, dashboard, model registry, retraining, alerts, and reporting.", requiresDiagnosis: true },
    { id: "generate_ml_report", label: "Generate ML Report", purpose: "Produce dataset profile, model plan, risks, assumptions, metrics, and next actions.", requiresDiagnosis: true }
  ],
  expectedOutputs: [
    { key: "dataset_profile", label: "Dataset Profile", description: "Schema, target, columns, quality flags, missing values, and assumptions." },
    { key: "eda_feature_plan", label: "EDA/Feature Plan", description: "Visualizations, leakage checks, transformations, features, and chart plan." },
    { key: "model_strategy", label: "Model Strategy", description: "Baselines, model families, validation, metrics, and evaluation workflow." },
    { key: "evaluation_review", label: "Evaluation Review", description: "Bias, overfitting, explainability, calibration, drift, and uncertainty notes." },
    { key: "dashboard_mlops_plan", label: "Dashboard/MLOps Plan", description: "Dashboard, monitoring, model registry, retraining, drift alerts, and rollback." },
    { key: "privacy_risk_notes", label: "Privacy/Risk Notes", description: "Sensitive data, leakage, privacy, governance, and access-control notes." },
    { key: "ml_intelligence_report", label: "ML Intelligence Report", description: "Final ML report with assumptions, limitations, risks, metrics, and next actions." }
  ],
  verificationLayer: [
    { title: "Dataset validation", rule: "Data and ML outputs require validation against real datasets before use." },
    { title: "No accuracy guarantee", rule: "The system must not guarantee model accuracy, business outcomes, or unbiased results." },
    { title: "Privacy controls", rule: "Sensitive, personal, regulated, or proprietary data requires privacy controls and access review." },
    { title: "Assumption disclosure", rule: "Metrics, assumptions, leakage, bias, and data limitations must be clearly disclosed." }
  ],
  accessModel: [
    { id: "public_analytics_assistant", label: "Public analytics assistant", description: "Basic EDA, model ideas, and dashboard outlines." },
    { id: "subscription_data_workspace", label: "Subscription data workspace", description: "Saved datasets, analyses, dashboards, model reports, and experiments." },
    { id: "usage_credit_ml_engine", label: "Usage-credit ML engine", description: "Advanced analysis using credits, RIO, RUSD, USDT, or USDC." },
    { id: "team_ml_workspace", label: "Team ML workspace", description: "Datasets, experiments, dashboards, MLOps, and ML reports." }
  ]
});
