import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { getRioMindOwnerKey, getRioMindPgPool } from "@/lib/riomind/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown, fallback = "") {
  return String(value ?? fallback).replace(/\s+/g, " ").trim();
}

function mapDashboard(row: any) {
  return {
    id: row.id,
    ownerKey: row.owner_key,
    reportId: row.report_id,
    sessionId: row.session_id,
    title: row.title,
    dashboardType: row.dashboard_type,
    status: row.status,
    dashboardJson: withAnalyticsV6(row.dashboard_type || row.dashboardType || "executive", withAnalyticsV5(row.dashboard_type || row.dashboardType || "executive", row.dashboard_json)),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function inferDashboardType(report: any) {
  const text = `${report.title} ${report.report_type} ${report.content}`.toLowerCase();

  if (/sales|pipeline|win rate|quota|sales velocity|conversion funnel/.test(text)) return "sales_analytics";
  if (/customer|retention|churn|nps|lifetime value|ltv|segment/.test(text)) return "customer_intelligence";
  if (/operations|capacity|utilization|bottleneck|sla|process efficiency/.test(text)) return "operations_analytics";
  if (/product|feature|activation|engagement|cohort|roadmap/.test(text)) return "product_analytics";
  if (/investment|venture|fundraising|runway|burn rate|portfolio|startup valuation/.test(text)) return "investment_analysis";
  if (/\bai\b|artificial intelligence|automation|innovation|technology|capability gap|\broi\b/.test(text)) return "ai_innovation";

  if (/financial|valuation|revenue forecast|cash flow|ebitda|dcf/.test(text)) return "financial_modeling";
  if (/business intelligence|kpi|sales|customer|retention|churn/.test(text)) return "business_intelligence";
  if (/market|competitor|tam|sam|som|pricing/.test(text)) return "market_intelligence";
  if (/compliance|audit|risk|control|iso|soc/.test(text)) return "compliance";
  if (/forecast|prediction|scenario|sensitivity/.test(text)) return "forecasting";

  return "executive";
}

function getDashboardTemplate(type: string) {
  switch (type) {
    case "financial_modeling":
      return {
        name: "Financial Modeling",
        sections: ["Revenue Forecast", "Valuation", "EBITDA", "DCF", "Sensitivity Analysis", "Scenario Analysis", "Financial Tables"],
      };
    case "business_intelligence":
      return {
        name: "Business Intelligence",
        sections: ["KPIs", "ARR", "MRR", "Retention", "Churn", "Growth", "Department Performance", "Executive KPIs"],
      };
    case "market_intelligence":
      return {
        name: "Market Intelligence",
        sections: ["TAM", "SAM", "SOM", "Competitor Analysis", "Pricing Analysis", "Positioning Matrix", "Opportunity Score"],
      };
    case "compliance":
      return {
        name: "Compliance & Risk",
        sections: ["Risk Score", "Control Matrix", "Audit Findings", "Compliance Gaps", "Remediation Plan", "Risk Heatmap"],
      };
    case "sales_analytics":
      return {
        name: "Sales Analytics",
        sections: ["Pipeline", "Win Rate", "Conversion Funnel", "Sales Velocity", "Revenue by Segment", "Quota Performance"],
      };
    case "customer_intelligence":
      return {
        name: "Customer Intelligence",
        sections: ["Customer Segments", "Retention", "Churn Risk", "NPS", "Customer Lifetime Value", "Expansion Opportunities"],
      };
    case "operations_analytics":
      return {
        name: "Operations Analytics",
        sections: ["Process Efficiency", "Capacity Planning", "Resource Utilization", "Bottlenecks", "Operational KPIs"],
      };
    case "product_analytics":
      return {
        name: "Product Analytics",
        sections: ["Feature Adoption", "User Engagement", "Activation", "Retention Cohorts", "Product Health", "Roadmap Insights"],
      };
    case "investment_analysis":
      return {
        name: "Investment & Venture Analysis",
        sections: ["Startup Valuation", "Fundraising Readiness", "Runway", "Burn Rate", "Investment Scoring", "Portfolio Analysis"],
      };
    case "ai_innovation":
      return {
        name: "AI & Innovation Intelligence",
        sections: ["AI Opportunity Assessment", "Automation Potential", "Capability Gaps", "Technology Benchmarking", "Implementation Roadmap", "ROI Analysis"],
      };
    case "executive":
    default:
      return {
        name: "Executive Strategy",
        sections: ["Executive Summary", "Strategic KPIs", "Recommendations", "Opportunities", "Risks", "Decision Support"],
      };
  }
}

function extractFinancialMetrics(content: string) {
  const text = String(content || "");
  const moneyValues = text.match(/\$[\d,.]+(?:\.\d+)?(?:M|B|K)?/gi) || [];
  const percentages = text.match(/\d+(?:\.\d+)?%/g) || [];
  const years = text.match(/Year\s+\d+/gi) || [];

  return {
    moneyValues,
    percentages,
    years,
    hasExtractedValues: moneyValues.length > 0 || percentages.length > 0 || years.length > 0,
  };
}

function parseMoneyValue(value: string) {
  const cleanValue = String(value).replace(/[^0-9.]/g, "");
  const base = Number(cleanValue || 0);
  const upper = String(value).toUpperCase();

  if (upper.includes("B")) return base * 1_000_000_000;
  if (upper.includes("M")) return base * 1_000_000;
  if (upper.includes("K")) return base * 1_000;

  return base;
}


function getTemplateDashboardConfig(type: string, revenueSeries: Array<{ label: string; value: number }>) {
  const finalRevenue = revenueSeries[revenueSeries.length - 1]?.value ?? 3200000;
  const baseValuation = finalRevenue * 5;

  if (type === "business_intelligence") {
    const baseDashboardJson = {
      kpis: [
        { label: "ARR", value: "$1.2M", trend: "+18%", tone: "positive" },
        { label: "MRR", value: "$100K", trend: "+6%", tone: "positive" },
        { label: "Churn", value: "3.1%", trend: "watch", tone: "warning" },
        { label: "Retention", value: "91%", trend: "stable", tone: "positive" },
      ],
      charts: [
        { title: "ARR / MRR trend", type: "line", description: "Recurring revenue performance across reporting periods.", data: [{ label: "Q1", value: 220000 }, { label: "Q2", value: 280000 }, { label: "Q3", value: 340000 }, { label: "Q4", value: 420000 }] },
        { title: "Department performance", type: "bar", description: "Business KPI performance by function." },
        { title: "Executive KPI table", type: "table", description: "ARR, MRR, retention, churn, and conversion summary." },
      ],
      scenarios: [
        { scenario: "Low growth", impact: 35, confidence: "Higher" },
        { scenario: "Base growth", impact: 60, confidence: "Moderate" },
        { scenario: "High growth", impact: 85, confidence: "Lower" },
      ],
      risks: [
        { risk: "Data freshness", impact: "Medium", confidence: "Medium", action: "Connect source systems or upload updated datasets." },
        { risk: "Churn pressure", impact: "High", confidence: "Medium", action: "Review retention cohorts and customer health." },
        { risk: "KPI ownership", impact: "Medium", confidence: "High", action: "Assign owners for each executive KPI." },
      ],
    };
  }

  if (type === "market_intelligence") {
    const baseDashboardJson = {
      kpis: [
        { label: "TAM", value: "$5B", trend: "large market", tone: "positive" },
        { label: "SAM", value: "$900M", trend: "reachable", tone: "neutral" },
        { label: "SOM", value: "$45M", trend: "initial capture", tone: "neutral" },
        { label: "Competitors", value: "18", trend: "fragmented", tone: "warning" },
      ],
      charts: [
        { title: "Market opportunity", type: "bar", description: "TAM, SAM, and SOM comparison." },
        { title: "Competitor positioning", type: "table", description: "Competitor, pricing, strength, and weakness matrix." },
        { title: "Opportunity score", type: "bar", description: "Opportunity scoring by customer or market segment." },
      ],
      scenarios: [
        { scenario: "Niche entry", revenue: 45000000, valuation: 225000000, confidence: "Higher" },
        { scenario: "Regional expansion", revenue: 120000000, valuation: 600000000, confidence: "Moderate" },
        { scenario: "Category leader", revenue: 300000000, valuation: 1500000000, confidence: "Lower" },
      ],
      risks: [
        { risk: "Competitive intensity", impact: "High", confidence: "Medium", action: "Map competitors by segment and pricing." },
        { risk: "Market timing", impact: "Medium", confidence: "Medium", action: "Validate demand signals and adoption timing." },
        { risk: "Positioning risk", impact: "Medium", confidence: "Low", action: "Test messaging with target customer groups." },
      ],
    };
  }

  if (type === "compliance") {
    const baseDashboardJson = {
      kpis: [
        { label: "Compliance", value: "92%", trend: "near-ready", tone: "positive" },
        { label: "Controls Passed", value: "184", trend: "validated", tone: "positive" },
        { label: "Open Gaps", value: "16", trend: "requires action", tone: "warning" },
        { label: "Risk Rating", value: "Medium", trend: "manageable", tone: "warning" },
      ],
      charts: [
        { title: "Control matrix", type: "table", description: "Control status, owner, evidence, and gap mapping." },
        { title: "Gap analysis", type: "bar", description: "Compliance gaps by severity." },
        { title: "Remediation plan", type: "table", description: "Actions, owners, deadlines, and readiness impact." },
      ],
      scenarios: [
        { scenario: "Minimum readiness", impact: 60, confidence: "Higher" },
        { scenario: "Audit ready", impact: 92, confidence: "Moderate" },
        { scenario: "Best practice", impact: 98, confidence: "Lower" },
      ],
      risks: [
        { risk: "Evidence gaps", impact: "High", confidence: "Medium", action: "Collect missing policies, logs, and control evidence." },
        { risk: "Control ownership", impact: "Medium", confidence: "High", action: "Assign owners to each remediation action." },
        { risk: "Audit timing", impact: "Medium", confidence: "Medium", action: "Create readiness timeline and checkpoints." },
      ],
    };
  }

  if (type === "sales_analytics") {
    const baseDashboardJson = {
      kpis: [
        { label: "Pipeline", value: "$2.4M", trend: "+21%", tone: "positive" },
        { label: "Win Rate", value: "28%", trend: "+4%", tone: "positive" },
        { label: "Sales Velocity", value: "42d", trend: "improve", tone: "warning" },
        { label: "Quota Attainment", value: "81%", trend: "tracking", tone: "neutral" },
      ],
      charts: [
        { title: "Pipeline trend", type: "line", description: "Sales pipeline value across periods.", data: [{ label: "Jan", value: 900000 }, { label: "Feb", value: 1250000 }, { label: "Mar", value: 1800000 }, { label: "Apr", value: 2400000 }] },
        { title: "Conversion funnel", type: "bar", description: "Lead, opportunity, proposal, and closed-won funnel." },
        { title: "Quota performance", type: "table", description: "Rep, target, actual, and attainment." },
      ],
      scenarios: [
        { scenario: "Weak pipeline", impact: 40, confidence: "Higher" },
        { scenario: "Base pipeline", impact: 68, confidence: "Moderate" },
        { scenario: "Strong pipeline", impact: 88, confidence: "Lower" },
      ],
      risks: [
        { risk: "Pipeline quality", impact: "High", confidence: "Medium", action: "Review stage age, deal quality, and next steps." },
        { risk: "Conversion leakage", impact: "Medium", confidence: "Medium", action: "Audit funnel drop-off points." },
        { risk: "Forecast accuracy", impact: "High", confidence: "Low", action: "Compare forecast to closed-won history." },
      ],
    };
  }

  if (type === "customer_intelligence") {
    const baseDashboardJson = {
      kpis: [
        { label: "Retention", value: "91%", trend: "stable", tone: "positive" },
        { label: "Churn Risk", value: "Medium", trend: "watch", tone: "warning" },
        { label: "LTV", value: "$4.8K", trend: "+12%", tone: "positive" },
        { label: "NPS", value: "48", trend: "healthy", tone: "positive" },
      ],
      charts: [
        { title: "Retention trend", type: "line", description: "Customer retention movement across cohorts.", data: [{ label: "C1", value: 86 }, { label: "C2", value: 88 }, { label: "C3", value: 91 }] },
        { title: "Customer segments", type: "bar", description: "Customer distribution by segment." },
        { title: "Expansion opportunities", type: "table", description: "Accounts, expansion potential, and next actions." },
      ],
      scenarios: [
        { scenario: "Churn pressure", impact: 42, confidence: "Higher" },
        { scenario: "Base retention", impact: 72, confidence: "Moderate" },
        { scenario: "Expansion upside", impact: 90, confidence: "Lower" },
      ],
      risks: [
        { risk: "Churn concentration", impact: "High", confidence: "Medium", action: "Identify at-risk cohorts and top churn drivers." },
        { risk: "Low engagement", impact: "Medium", confidence: "Medium", action: "Review usage and activation signals." },
        { risk: "Expansion timing", impact: "Medium", confidence: "Low", action: "Prioritize accounts by intent and readiness." },
      ],
    };
  }

  if (type === "operations_analytics") {
    const baseDashboardJson = {
      kpis: [
        { label: "Efficiency", value: "76%", trend: "+9%", tone: "positive" },
        { label: "Utilization", value: "83%", trend: "high", tone: "positive" },
        { label: "Bottlenecks", value: "4", trend: "action needed", tone: "warning" },
        { label: "SLA Health", value: "94%", trend: "stable", tone: "positive" },
      ],
      charts: [
        { title: "Operational efficiency", type: "line", description: "Efficiency movement across operational periods.", data: [{ label: "W1", value: 62 }, { label: "W2", value: 69 }, { label: "W3", value: 76 }] },
        { title: "Resource utilization", type: "bar", description: "Capacity and utilization by team or resource." },
        { title: "Bottleneck register", type: "table", description: "Process bottlenecks, owners, and remediation actions." },
      ],
      scenarios: [
        { scenario: "Capacity constrained", impact: 45, confidence: "Higher" },
        { scenario: "Base operations", impact: 76, confidence: "Moderate" },
        { scenario: "Optimized operations", impact: 92, confidence: "Lower" },
      ],
      risks: [
        { risk: "Capacity overload", impact: "High", confidence: "Medium", action: "Review workload, staffing, and process throughput." },
        { risk: "Process bottlenecks", impact: "Medium", confidence: "High", action: "Map delays and handoff failures." },
        { risk: "SLA degradation", impact: "High", confidence: "Medium", action: "Monitor SLA breaches and escalation paths." },
      ],
    };
  }

  if (type === "product_analytics") {
    const baseDashboardJson = {
      kpis: [
        { label: "Activation", value: "64%", trend: "+11%", tone: "positive" },
        { label: "Engagement", value: "72%", trend: "healthy", tone: "positive" },
        { label: "Feature Adoption", value: "38%", trend: "grow", tone: "warning" },
        { label: "Product Health", value: "Good", trend: "stable", tone: "positive" },
      ],
      charts: [
        { title: "Activation trend", type: "line", description: "User activation movement across cohorts.", data: [{ label: "C1", value: 48 }, { label: "C2", value: 56 }, { label: "C3", value: 64 }] },
        { title: "Feature adoption", type: "bar", description: "Adoption by feature or product area." },
        { title: "Roadmap insights", type: "table", description: "Feature signals, user impact, and roadmap priorities." },
      ],
      scenarios: [
        { scenario: "Low adoption", impact: 38, confidence: "Higher" },
        { scenario: "Base adoption", impact: 64, confidence: "Moderate" },
        { scenario: "Strong adoption", impact: 88, confidence: "Lower" },
      ],
      risks: [
        { risk: "Activation friction", impact: "High", confidence: "Medium", action: "Analyze onboarding drop-offs." },
        { risk: "Feature underuse", impact: "Medium", confidence: "Medium", action: "Review feature adoption and user feedback." },
        { risk: "Retention weakness", impact: "High", confidence: "Low", action: "Compare usage depth with retention cohorts." },
      ],
    };
  }

  if (type === "investment_analysis") {
    const baseDashboardJson = {
      kpis: [
        { label: "Runway", value: "18mo", trend: "adequate", tone: "positive" },
        { label: "Burn Rate", value: "$85K", trend: "monthly", tone: "neutral" },
        { label: "Readiness", value: "Medium", trend: "improve", tone: "warning" },
        { label: "Investment Score", value: "74", trend: "promising", tone: "positive" },
      ],
      charts: [
        { title: "Runway forecast", type: "line", description: "Runway trend under current burn assumptions.", data: [{ label: "Now", value: 18 }, { label: "Q1", value: 15 }, { label: "Q2", value: 12 }, { label: "Q3", value: 9 }] },
        { title: "Funding scenarios", type: "bar", description: "Conservative, base, and aggressive funding outcomes." },
        { title: "Investment scorecard", type: "table", description: "Market, traction, team, risk, and readiness scoring." },
      ],
      scenarios: [
        { scenario: "Bridge round", revenue: 500000, valuation: 6000000, confidence: "Higher" },
        { scenario: "Seed round", revenue: 1500000, valuation: 15000000, confidence: "Moderate" },
        { scenario: "Growth round", revenue: 4000000, valuation: 40000000, confidence: "Lower" },
      ],
      risks: [
        { risk: "Runway pressure", impact: "High", confidence: "Medium", action: "Model burn reduction and financing options." },
        { risk: "Traction proof", impact: "High", confidence: "Medium", action: "Strengthen revenue, users, and retention evidence." },
        { risk: "Valuation expectation", impact: "Medium", confidence: "Low", action: "Benchmark round size and valuation multiples." },
      ],
    };
  }

  if (type === "ai_innovation") {
    const baseDashboardJson = {
      kpis: [
        { label: "Automation ROI", value: "3.4x", trend: "high", tone: "positive" },
        { label: "Capability Gaps", value: "5", trend: "prioritize", tone: "warning" },
        { label: "AI Readiness", value: "Medium", trend: "build", tone: "warning" },
        { label: "Opportunity Score", value: "82", trend: "strong", tone: "positive" },
      ],
      charts: [
        { title: "AI opportunity trend", type: "line", description: "Opportunity score across implementation phases.", data: [{ label: "Assess", value: 52 }, { label: "Pilot", value: 68 }, { label: "Scale", value: 82 }] },
        { title: "Automation potential", type: "bar", description: "Automation potential by workflow." },
        { title: "Implementation roadmap", type: "table", description: "AI initiatives, dependencies, ROI, and readiness." },
      ],
      scenarios: [
        { scenario: "Pilot only", impact: 45, confidence: "Higher" },
        { scenario: "Department rollout", impact: 72, confidence: "Moderate" },
        { scenario: "Enterprise AI", impact: 92, confidence: "Lower" },
      ],
      risks: [
        { risk: "Data readiness", impact: "High", confidence: "Medium", action: "Audit data quality, ownership, and access." },
        { risk: "Workflow fit", impact: "Medium", confidence: "Medium", action: "Prioritize high-volume repeatable workflows." },
        { risk: "Adoption risk", impact: "High", confidence: "Low", action: "Create training, governance, and change plan." },
      ],
    };
  }

  if (type === "executive") {
    const baseDashboardJson = {
      kpis: [
        { label: "Strategic Priority", value: "High", trend: "decision-ready", tone: "positive" },
        { label: "Opportunities", value: "3", trend: "identified", tone: "positive" },
        { label: "Risks", value: "3", trend: "monitored", tone: "warning" },
        { label: "Actions", value: "5", trend: "next steps", tone: "neutral" },
      ],
      charts: [
        { title: "Strategic KPI trend", type: "line", description: "Executive KPI movement across periods.", data: [{ label: "P1", value: 40 }, { label: "P2", value: 58 }, { label: "P3", value: 73 }] },
        { title: "Opportunity comparison", type: "bar", description: "Opportunity scoring by initiative." },
        { title: "Decision support table", type: "table", description: "Risks, opportunities, recommendations, and owners." },
      ],
      scenarios: [
        { scenario: "Low", impact: 35, confidence: "Higher" },
        { scenario: "Base", impact: 60, confidence: "Moderate" },
        { scenario: "High", impact: 85, confidence: "Lower" },
      ],
      risks: [
        { risk: "Strategic clarity", impact: "Medium", confidence: "Medium", action: "Define the decision and owner." },
        { risk: "Execution risk", impact: "High", confidence: "Medium", action: "Translate recommendations into milestones." },
        { risk: "Data limitation", impact: "Medium", confidence: "Low", action: "Validate assumptions with source material." },
      ],
    };
  }

  return {
    kpis: [
      { label: "Forecast Revenue", value: `$${(finalRevenue / 1_000_000).toFixed(1)}M`, trend: "+68%", tone: "positive" },
      { label: "Base Valuation", value: `$${(baseValuation / 1_000_000).toFixed(1)}M`, trend: "5.0x revenue", tone: "neutral" },
      { label: "EBITDA Outlook", value: "Positive", trend: "Year 3", tone: "positive" },
      { label: "Confidence", value: "Moderate", trend: "assumption-based", tone: "warning" },
    ],
    charts: [
      { title: "Revenue forecast", type: "line", description: "Revenue forecast curve based on extracted or fallback model values.", data: revenueSeries },
      { title: "Valuation scenario", type: "bar", description: "Conservative, base, and aggressive valuation comparison." },
      { title: "Sensitivity matrix", type: "table", description: "Growth, margin, and valuation multiple sensitivity." },
    ],
    scenarios: [
      { scenario: "Conservative", revenue: Math.round(finalRevenue * 0.66), valuation: Math.round(baseValuation * 0.66), confidence: "Higher" },
      { scenario: "Base", revenue: finalRevenue, valuation: baseValuation, confidence: "Moderate" },
      { scenario: "Aggressive", revenue: Math.round(finalRevenue * 1.63), valuation: Math.round(baseValuation * 1.63), confidence: "Lower" },
    ],
    risks: [
      { risk: "Revenue assumptions", impact: "High", confidence: "Medium", action: "Validate ARPU, churn, and growth assumptions." },
      { risk: "Valuation multiple", impact: "High", confidence: "Medium", action: "Benchmark against comparable companies." },
      { risk: "Execution dependency", impact: "High", confidence: "Low", action: "Track hiring, delivery, and sales milestones." },
    ],
  };
}


function buildAnalyticsV5Intelligence(type: string, dashboardJson: any) {
  const templateName = dashboardJson?.templateName || type.replace(/_/g, " ");
  const kpis = Array.isArray(dashboardJson?.kpis) ? dashboardJson.kpis : [];
  const risks = Array.isArray(dashboardJson?.risks) ? dashboardJson.risks : [];
  const scenarios = Array.isArray(dashboardJson?.scenarios) ? dashboardJson.scenarios : [];
  const primaryKpi = kpis[0]?.label || "Primary KPI";
  const primaryValue = kpis[0]?.value || "Pending";
  const riskCount = risks.length;

  return {
    version: "V5",
    workspaceType: "professional_analytics",
    executiveInsight: {
      title: `${templateName} Executive Intelligence`,
      summary: "This dashboard includes V5 analyst intelligence: executive interpretation, forecast signals, risk assessment, recommendations, and action-ready next steps.",
      primarySignal: `${primaryKpi}: ${primaryValue}`,
      decisionStatus: riskCount > 2 ? "Review risks before execution" : "Ready for executive review",
    },
    keyFindings: [
      {
        label: "Primary performance signal",
        insight: `${primaryKpi} is the lead dashboard signal and should anchor the executive interpretation.`,
        severity: "Important",
      },
      {
        label: "Scenario readiness",
        insight: scenarios.length
          ? `${scenarios.length} scenarios are available for comparison and decision planning.`
          : "No scenario set is available yet; add scenarios for stronger decision support.",
        severity: scenarios.length ? "Opportunity" : "Missing input",
      },
      {
        label: "Risk visibility",
        insight: riskCount
          ? `${riskCount} risk areas are tracked and should be reviewed before final decisions.`
          : "No major risks are currently mapped.",
        severity: riskCount ? "Critical" : "Stable",
      },
    ],
    forecastSignals: [
      {
        metric: "Growth direction",
        signal: "Monitor trend acceleration, scenario spread, and KPI movement.",
        outlook: "Moderate",
      },
      {
        metric: "Execution outlook",
        signal: "Execution quality depends on source data quality, ownership, and milestone tracking.",
        outlook: riskCount > 2 ? "Watch" : "Constructive",
      },
    ],
    recommendationEngine: [
      {
        action: "Validate source assumptions",
        reason: "Analyst-grade dashboards require verified inputs before strategic decisions.",
        priority: "High",
      },
      {
        action: "Compare base, conservative, and aggressive cases",
        reason: "Scenario spread helps prevent overconfidence and supports board-level review.",
        priority: "High",
      },
      {
        action: "Export report package",
        reason: "Use PDF, DOCX, PPTX, and XLSX outputs for stakeholder review.",
        priority: "Medium",
      },
    ],
    actionPlan: [
      { step: 1, task: "Review dashboard KPIs and confirm business assumptions.", owner: "Analyst / Founder" },
      { step: 2, task: "Validate high-impact risks and missing data.", owner: "Operations / Finance" },
      { step: 3, task: "Generate exportable report and presentation artifacts.", owner: "Nexus Workspace" },
    ],
    intelligenceCards: [
      {
        title: "Executive Decision Support",
        value: riskCount > 2 ? "Risk review required" : "Ready",
        tone: riskCount > 2 ? "warning" : "positive",
      },
      {
        title: "Forecast Quality",
        value: scenarios.length ? "Scenario-backed" : "Needs scenarios",
        tone: scenarios.length ? "positive" : "warning",
      },
      { title: "Analyst Readiness", value: "V5 enabled", tone: "positive" },
    ],
  };
}



function withAnalyticsV5(dashboardType: string, dashboardJson: any) {
  const safeJson = dashboardJson && typeof dashboardJson === "object" ? dashboardJson : {};

  return {
    ...safeJson,
    analyticsV5:
      safeJson.analyticsV5 ||
      buildAnalyticsV5Intelligence(dashboardType, safeJson),
  };
}



function buildAnalyticsV6Intelligence(type: string, dashboardJson: any) {
  const templateName = dashboardJson?.templateName || type.replace(/_/g, " ");

  return {
    version: "V6",
    workspaceType: "executive_intelligence_workspace",
    competitiveIntelligence: [
      {
        competitor: "Market Leader",
        position: "Leader",
        strength: "Distribution and brand trust",
        weakness: "Higher operating cost",
        threatLevel: "High",
        opportunityGap: "Mid-market and underserved customer segments",
      },
      {
        competitor: "Emerging Challenger",
        position: "Challenger",
        strength: "Speed and product focus",
        weakness: "Limited scale",
        threatLevel: "Medium",
        opportunityGap: "Enterprise accounts and vertical specialization",
      },
      {
        competitor: "Infrastructure Giant",
        position: "Platform incumbent",
        strength: "Capital, cloud, and ecosystem scale",
        weakness: "Slower niche execution",
        threatLevel: "High",
        opportunityGap: "Specialized workflow intelligence and premium user experience",
      },
    ],
    opportunityEngine: [
      {
        opportunity: `${templateName} expansion`,
        roi: "Very High",
        confidence: 84,
        priority: "Immediate",
      },
      {
        opportunity: "Executive reporting and export packages",
        roi: "High",
        confidence: 79,
        priority: "High",
      },
      {
        opportunity: "Automated analyst recommendations",
        roi: "High",
        confidence: 76,
        priority: "Medium",
      },
    ],
    analystConclusion: {
      verdict: "Proceed with controlled execution",
      confidence: 84,
      summary:
        "The dashboard shows a constructive executive signal, but assumptions, scenario quality, and risk controls should be reviewed before strategic execution.",
    },
  };
}

function withAnalyticsV6(dashboardType: string, dashboardJson: any) {
  const safeJson = dashboardJson && typeof dashboardJson === "object" ? dashboardJson : {};

  return {
    ...safeJson,
    analyticsV6:
      safeJson.analyticsV6 ||
      buildAnalyticsV6Intelligence(dashboardType, safeJson),
  };
}

function buildDashboardJson(report: any, dashboardType: string) {
  const content = String(report.content || "");
  const extracted = extractFinancialMetrics(content);
  const template = getDashboardTemplate(dashboardType);

  const sections =
    content
      .replace(/\\n/g, "\n")
      .split(/\n(?=##\s+)/)
      .map((section) => section.trim())
      .filter(Boolean)
      .map((section) => {
        const lines = section.split("\n");
        return {
          title: (lines[0] || "Section").replace(/^#+\s*/, ""),
          summary: lines.slice(1).join("\n").trim().slice(0, 600),
        };
      });

  const isFinancial = dashboardType === "financial_modeling";

  const revenueSeries =
    extracted.moneyValues.length >= 3
      ? extracted.moneyValues.slice(0, 3).map((value, index) => ({
          label: extracted.years[index] || `Year ${index + 1}`,
          value: parseMoneyValue(value),
        }))
      : [
          { label: "Year 1", value: 1000000 },
          { label: "Year 2", value: 1800000 },
          { label: "Year 3", value: 3200000 },
        ];

  const forecastRevenue = revenueSeries[revenueSeries.length - 1]?.value ?? 3200000;
  const baseValuation = forecastRevenue * 5;
  const templateConfig = getTemplateDashboardConfig(dashboardType, revenueSeries);

  const kpis = isFinancial
    ? [
        { label: "Forecast Revenue", value: `$${(forecastRevenue / 1_000_000).toFixed(1)}M`, trend: "+68%", tone: "positive" },
        { label: "Base Valuation", value: `$${(baseValuation / 1_000_000).toFixed(1)}M`, trend: "5.0x revenue", tone: "neutral" },
        { label: "EBITDA Outlook", value: "Positive", trend: "Year 3", tone: "positive" },
        { label: "Confidence", value: "Moderate", trend: "assumption-based", tone: "warning" },
      ]
    : [
        { label: "Dashboard Type", value: dashboardType.replace(/_/g, " "), trend: "ready", tone: "positive" },
        { label: "Report Type", value: report.report_type || "executive", trend: "generated", tone: "neutral" },
        { label: "Confidence", value: "Moderate", trend: "assumption-based", tone: "warning" },
        { label: "Sections", value: String(sections.length), trend: "report mapped", tone: "neutral" },
      ];

  const scenarios = isFinancial
    ? [
        { scenario: "Conservative", revenue: Math.round(forecastRevenue * 0.66), valuation: Math.round(baseValuation * 0.66), confidence: "Higher" },
        { scenario: "Base", revenue: forecastRevenue, valuation: baseValuation, confidence: "Moderate" },
        { scenario: "Aggressive", revenue: Math.round(forecastRevenue * 1.63), valuation: Math.round(baseValuation * 1.63), confidence: "Lower" },
      ]
    : [
        { scenario: "Low", impact: 35, confidence: "Higher" },
        { scenario: "Base", impact: 60, confidence: "Moderate" },
        { scenario: "High", impact: 85, confidence: "Lower" },
      ];

  const risks = isFinancial
    ? [
        { risk: "Revenue assumptions", impact: "High", confidence: "Medium", action: "Validate ARPU, churn, and growth assumptions." },
        { risk: "Valuation multiple", impact: "High", confidence: "Medium", action: "Benchmark against comparable companies." },
        { risk: "Execution dependency", impact: "High", confidence: "Low", action: "Track hiring, delivery, and sales milestones." },
      ]
    : [
        { risk: "Data quality", impact: "High", confidence: "Medium", action: "Validate source files and assumptions." },
        { risk: "Market uncertainty", impact: "Medium", confidence: "Medium", action: "Compare with external benchmarks." },
        { risk: "Execution dependency", impact: "High", confidence: "Low", action: "Track milestones and ownership." },
      ];

  const charts = isFinancial
    ? [
        { title: "Revenue forecast", type: "line", description: "Revenue forecast curve based on extracted or fallback model values.", data: revenueSeries },
        { title: "Valuation scenario", type: "bar", description: "Conservative, base, and aggressive valuation comparison." },
        { title: "Sensitivity matrix", type: "table", description: "Growth, margin, and valuation multiple sensitivity." },
      ]
    : [
        { title: "KPI trend", type: "line", description: "Trend-ready KPI visualization.", data: [{ label: "P1", value: 40 }, { label: "P2", value: 58 }, { label: "P3", value: 73 }] },
        { title: "Scenario comparison", type: "bar", description: "Scenario comparison." },
        { title: "Risk matrix", type: "table", description: "Risk, impact, confidence, and action summary." },
      ];

  return {
    kpis: templateConfig.kpis,
    executiveSummary:
      "This dashboard converts the analytics report into a decision-ready view with KPI cards, scenario comparison, risk tracking, and chart-ready panels.",
    extractedMetrics: extracted,
    templateName: template.name,
    templateSections: template.sections,
    sections,
    insights: [
      { label: "Assumption quality", severity: "Important", text: "Review report assumptions before making business decisions." },
      { label: "Data validation", severity: "Critical", text: "Validate source data before finalizing forecasts or executive conclusions." },
      { label: "Operational use", severity: "Opportunity", text: "Use exports for stakeholder review and dashboard views for operational monitoring." },
    ],
    financialTable: isFinancial
      ? revenueSeries.map((row, index) => ({
          year: row.label,
          revenue: row.value,
          ebitda: Math.round(row.value * (index === 0 ? 0.2 : index === 1 ? 0.28 : 0.32)),
          valuation: Math.round(row.value * 5),
        }))
      : [],
    scenarios: templateConfig.scenarios,
    risks: templateConfig.risks,
    charts: templateConfig.charts,
    chartPlaceholders: templateConfig.charts.map((chart) => ({ title: chart.title, type: chart.type })),
  };
}



export async function POST(request: NextRequest) {
  try {
    const db = getRioMindPgPool();
    const ownerKey = getRioMindOwnerKey(request.headers);
    const body = await request.json().catch(() => ({}));

    const reportId = clean(body.reportId);

    if (!reportId) {
      return NextResponse.json(
        { ok: false, product: "RioMind Nexus", error: "report_id_required" },
        { status: 400 }
      );
    }

    const reportResult = await db.query(
      `
      SELECT id, owner_key, session_id, title, report_type, status, content, created_at, updated_at
      FROM riomind_analytics_reports
      WHERE id = $1 AND owner_key = $2
      LIMIT 1
      `,
      [reportId, ownerKey]
    );

    const report = reportResult.rows[0];

    if (!report) {
      return NextResponse.json(
        { ok: false, product: "RioMind Nexus", error: "analytics_report_not_found" },
        { status: 404 }
      );
    }

    const dashboardType = inferDashboardType(report);
    const dashboardJsonBase = buildDashboardJson(report, dashboardType);
    const dashboardJson = {
      ...dashboardJsonBase,
      analyticsV5: buildAnalyticsV5Intelligence(dashboardType, dashboardJsonBase),
    };
    const id = randomUUID();
    const title = `${report.title} — dashboard`;

    const result = await db.query(
      `
      INSERT INTO riomind_analytics_dashboards (
        id, owner_key, report_id, session_id, title, dashboard_type, status, dashboard_json
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'generated', $7::jsonb)
      RETURNING id, owner_key, report_id, session_id, title, dashboard_type, status, dashboard_json, created_at, updated_at
      `,
      [id, ownerKey, report.id, report.session_id, title, dashboardType, JSON.stringify(dashboardJson)]
    );

    return NextResponse.json({
      ok: true,
      product: "RioMind Nexus",
      dashboard: mapDashboard(result.rows[0]),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        product: "RioMind Nexus",
        error: error instanceof Error ? error.message : "analytics_dashboard_create_failed",
      },
      { status: 500 }
    );
  }
}
