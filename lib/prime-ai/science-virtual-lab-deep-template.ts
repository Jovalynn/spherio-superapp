import type { DeepNicheTemplate } from "./deep-niche-template";

export const SCIENCE_VIRTUAL_LAB_DEEP_TEMPLATE: DeepNicheTemplate = {
  id: "science_virtual_lab",
  title: "Science & Virtual Lab Intelligence Platform",
  publicPositioning:
    "A creator-owned STEM learning and simulation platform for physics, chemistry, biology, engineering, scientific calculations, experiment design, and virtual lab reporting.",
  creatorPromise:
    "Prime lets a creator launch their own virtual science lab, STEM education platform, exam-prep lab, engineering simulation portal, or science learning product without building the full stack from scratch.",
  userPromise:
    "Students and learners choose a science subject, define an experiment or concept problem, control variables, receive guided simulation logic, interpret results, and generate structured lab reports.",
  audiences: [
    {
      title: "Science students",
      description: "Use virtual experiments, scientific calculators, guided simulations, and lab reports.",
    },
    {
      title: "Teachers and tutors",
      description: "Create guided experiment modules, explain formulas, and support practical science teaching.",
    },
    {
      title: "Schools and training centers",
      description: "Offer branded virtual labs, STEM learning modules, and institution-level science support.",
    },
    {
      title: "Engineering and technical learners",
      description: "Use simulation-style workflows for circuits, robotics, structures, mechanics, and calculations.",
    },
  ],
  creatorSetup: [
    {
      title: "Science market",
      description: "The creator chooses the science audience they want to serve.",
      options: ["Secondary school", "University", "Engineering students", "Vocational labs", "STEM clubs", "Research learners"],
    },
    {
      title: "Lab focus",
      description: "The creator chooses one or more lab tracks.",
      options: ["Physics", "Chemistry", "Biology", "Electronics", "Robotics", "Engineering", "Scientific calculator", "Lab reports"],
    },
    {
      title: "Learning purpose",
      description: "The creator selects the core use case.",
      options: ["Virtual experiments", "Formula solving", "Exam prep", "Lab report writing", "Simulation training", "Research support"],
    },
    {
      title: "Access and monetization",
      description: "The creator decides how learners access the lab.",
      options: ["Free", "Subscription", "Token-gated", "School access", "RIO/RUSD", "USDT/USDC", "Card payments later"],
    },
  ],
  userWorkflow: [
    {
      step: "01",
      title: "Choose science track",
      description: "Learner selects physics, chemistry, biology, engineering, or scientific calculator mode.",
    },
    {
      step: "02",
      title: "Define experiment or problem",
      description: "Learner enters objective, hypothesis, variables, data, formula, or scientific question.",
    },
    {
      step: "03",
      title: "Control variables",
      description: "The runtime separates independent, dependent, and controlled variables.",
    },
    {
      step: "04",
      title: "Run simulation reasoning",
      description: "The app predicts result logic, explains assumptions, and identifies likely scientific behavior.",
    },
    {
      step: "05",
      title: "Interpret result",
      description: "The system explains trends, anomalies, limitations, errors, and scientific meaning.",
    },
    {
      step: "06",
      title: "Generate lab report",
      description: "The app produces objective, hypothesis, method, variables, observations, result, conclusion, and safety notes.",
    },
  ],
  deepModules: [
    {
      title: "Experiment Designer",
      purpose: "Help the learner define objective, hypothesis, apparatus, variables, and expected outcome.",
      outputs: ["experiment_blueprint", "hypothesis", "variable_map"],
    },
    {
      title: "Variable Controller",
      purpose: "Separate independent, dependent, controlled, and error variables before simulation.",
      outputs: ["variable_control_table", "assumption_map", "risk_of_confounding"],
    },
    {
      title: "Formula Assistant",
      purpose: "Identify relevant formulas, explain variables, substitute values, and check units.",
      outputs: ["formula_selection", "substitution_steps", "unit_check"],
    },
    {
      title: "Simulation Reasoner",
      purpose: "Predict result direction based on science principles and clearly state assumptions.",
      outputs: ["predicted_result", "reasoning_trace", "confidence_profile"],
    },
    {
      title: "Observation Logger",
      purpose: "Capture trial records, repeated observations, measurement notes, and anomalies.",
      outputs: ["observation_table", "trial_records", "anomaly_notes"],
    },
    {
      title: "Result Interpreter",
      purpose: "Explain trends, contradictions, experimental errors, limitations, and scientific meaning.",
      outputs: ["trend_analysis", "error_analysis", "conclusion_logic"],
    },
    {
      title: "Lab Report Generator",
      purpose: "Generate structured reports suitable for school, university, or training use.",
      outputs: ["lab_report", "graph_interpretation", "safety_note"],
    },
    {
      title: "Safety and Limitation Evaluator",
      purpose: "Warn when virtual output cannot replace supervised physical lab practice.",
      outputs: ["safety_warning", "limitation_notice", "human_supervision_note"],
    },
  ],
  accessModels: [
    {
      title: "Public virtual lab",
      description: "Anyone can use basic simulations and science explanations.",
    },
    {
      title: "Subscription STEM lab",
      description: "Learners pay for advanced simulations, formula solving, saved reports, and guided experiments.",
    },
    {
      title: "Token-gated lab",
      description: "Access is based on creator token, RIO, RUSD, USDT, or USDC payment or holding.",
    },
    {
      title: "Institution lab access",
      description: "Schools and training centers provide structured lab modules to students.",
    },
  ],
  rioMindNexusRole: [
    "Act as a scientific reasoning analyst behind the virtual lab.",
    "Explain scientific concepts at the learner's level.",
    "Detect poor experiment design, missing controls, and weak hypotheses.",
    "Guide formula selection, unit checks, and result interpretation.",
    "Generate structured lab reports with assumptions, limitations, and safety notes.",
    "Support future proof/certification flows through Spherio/RioExplorer layers.",
  ],
  proofAndVerification: [
    "Virtual lab results are educational simulations, not physical lab proof.",
    "Scientific conclusions must show assumptions, limitations, and confidence level.",
    "Safety-sensitive experiments require human supervision and institutional standards.",
    "Reports should not overstate accuracy without real measurements or validated datasets.",
  ],
};
