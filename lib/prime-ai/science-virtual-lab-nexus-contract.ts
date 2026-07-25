import { buildNexusReadyRuntimeContract } from "./nexus-ready-runtime";

export const SCIENCE_VIRTUAL_LAB_NEXUS_READY_CONTRACT = buildNexusReadyRuntimeContract({
  nicheId: "science_virtual_lab",
  nicheTitle: "Science & Virtual Lab Intelligence Platform",
  rioMindNexusRole:
    "RioMind Nexus will act as the scientific reasoning analyst behind the Science & Virtual Lab project. It will help define experiments, separate variables, select formulas, reason through simulations, interpret observations, generate lab reports, and show safety/limitation notes.",
  nexusHooks: [
    "experiment_designer_agent",
    "hypothesis_builder",
    "variable_controller",
    "formula_assistant",
    "simulation_reasoner",
    "observation_logger",
    "result_interpreter",
    "lab_report_generator",
    "safety_limitation_evaluator",
  ],
  inputSchema: [
    {
      key: "science_track",
      label: "Science track",
      type: "select",
      required: true,
      helper: "The field of science or engineering for the lab.",
      examples: ["Physics", "Chemistry", "Biology", "Engineering", "Electronics", "Robotics"],
    },
    {
      key: "experiment_objective",
      label: "Experiment objective",
      type: "textarea",
      required: true,
      helper: "What the learner wants to test, simulate, calculate, or understand.",
      examples: ["Effect of temperature on reaction rate", "Projectile motion", "Ohm's law circuit"],
    },
    {
      key: "hypothesis",
      label: "Hypothesis",
      type: "textarea",
      required: false,
      helper: "The learner's expected result before simulation.",
      examples: ["Increasing temperature increases reaction rate"],
    },
    {
      key: "variables",
      label: "Variables",
      type: "textarea",
      required: true,
      helper: "Independent, dependent, and controlled variables if known.",
      examples: ["Temperature, reaction rate, concentration, volume"],
    },
    {
      key: "data_or_values",
      label: "Data or values",
      type: "textarea",
      required: false,
      helper: "Known measurements, constants, observations, or values for calculation.",
      examples: ["Voltage = 12V, resistance = 4Ω", "Time = 20s, distance = 100m"],
    },
  ],
  workflowActions: [
    {
      id: "design_experiment",
      label: "Design Experiment",
      purpose: "Create objective, hypothesis, variables, apparatus, and expected result.",
    },
    {
      id: "control_variables",
      label: "Control Variables",
      purpose: "Separate independent, dependent, controlled, and error variables.",
    },
    {
      id: "run_simulation_reasoning",
      label: "Run Simulation Reasoning",
      purpose: "Predict scientific behavior and explain assumptions.",
      requiresDiagnosis: true,
    },
    {
      id: "solve_formula",
      label: "Solve Formula",
      purpose: "Select formulas, substitute values, check units, and explain result.",
      requiresDiagnosis: true,
    },
    {
      id: "interpret_results",
      label: "Interpret Results",
      purpose: "Explain trend, anomaly, error, limitation, and conclusion.",
      requiresDiagnosis: true,
    },
    {
      id: "generate_lab_report",
      label: "Generate Lab Report",
      purpose: "Produce structured lab report with safety and limitation notes.",
      requiresDiagnosis: true,
    },
  ],
  expectedOutputs: [
    {
      key: "experiment_blueprint",
      label: "Experiment Blueprint",
      description: "Objective, hypothesis, apparatus, variables, and procedure.",
    },
    {
      key: "variable_map",
      label: "Variable Map",
      description: "Independent, dependent, controlled, and confounding variables.",
    },
    {
      key: "simulation_reasoning",
      label: "Simulation Reasoning",
      description: "Predicted behavior, assumptions, and scientific explanation.",
    },
    {
      key: "formula_solution",
      label: "Formula Solution",
      description: "Formula selection, substitution steps, units, and result.",
    },
    {
      key: "result_interpretation",
      label: "Result Interpretation",
      description: "Trend, anomaly, error analysis, limitation, and conclusion.",
    },
    {
      key: "lab_report",
      label: "Lab Report",
      description: "Structured report for learning, school, or training use.",
    },
    {
      key: "safety_limitation_note",
      label: "Safety and Limitation Note",
      description: "Where human supervision, real measurement, or institutional review is required.",
    },
  ],
  verificationLayer: [
    {
      title: "Simulation limitation",
      rule: "Virtual simulation is educational and does not replace real supervised laboratory work.",
    },
    {
      title: "Assumption disclosure",
      rule: "Every predicted result must show assumptions and confidence level.",
    },
    {
      title: "Safety review",
      rule: "Safety-sensitive experiments require human supervision and institutional standards.",
    },
    {
      title: "Measurement proof",
      rule: "Scientific claims based on real experiments require real measurements or validated datasets.",
    },
  ],
  accessModel: [
    {
      id: "public_access",
      label: "Public virtual lab",
      description: "Anyone can use basic science explanations and sample simulations.",
    },
    {
      id: "subscription_access",
      label: "Subscription STEM lab",
      description: "Learners pay for advanced simulations, saved reports, and guided lab support.",
    },
    {
      id: "token_gated_access",
      label: "Token-gated lab",
      description: "Access is based on creator token, RIO, RUSD, USDT, or USDC.",
    },
    {
      id: "institution_access",
      label: "Institution lab",
      description: "Schools and training centers manage student lab modules and reports.",
    },
  ],
});
