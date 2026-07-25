export type NexusInputField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "file" | "url";
  required: boolean;
  helper: string;
  examples?: string[];
};

export type NexusWorkflowAction = {
  id: string;
  label: string;
  purpose: string;
  requiresDiagnosis?: boolean;
};

export type NexusExpectedOutput = {
  key: string;
  label: string;
  description: string;
};

export type NexusVerificationRule = {
  title: string;
  rule: string;
};

export type NexusAccessModel = {
  id: string;
  label: string;
  description: string;
};

export type NexusReadyRuntimeContract = {
  nicheId: string;
  nicheTitle: string;
  deepRuntimeMode: "advanced_deep_runtime";
  status: "nexus_ready_not_connected" | "nexus_powered";
  rioMindNexusRole: string;
  nexusHooks: string[];
  inputSchema: NexusInputField[];
  workflowActions: NexusWorkflowAction[];
  expectedOutputs: NexusExpectedOutput[];
  verificationLayer: NexusVerificationRule[];
  accessModel: NexusAccessModel[];
};

export function buildNexusReadyRuntimeContract(input: {
  nicheId: string;
  nicheTitle: string;
  rioMindNexusRole: string;
  nexusHooks: string[];
  inputSchema: NexusInputField[];
  workflowActions: NexusWorkflowAction[];
  expectedOutputs: NexusExpectedOutput[];
  verificationLayer: NexusVerificationRule[];
  accessModel: NexusAccessModel[];
}): NexusReadyRuntimeContract {
  return {
    nicheId: input.nicheId,
    nicheTitle: input.nicheTitle,
    deepRuntimeMode: "advanced_deep_runtime",
    status: "nexus_ready_not_connected",
    rioMindNexusRole: input.rioMindNexusRole,
    nexusHooks: input.nexusHooks,
    inputSchema: input.inputSchema,
    workflowActions: input.workflowActions,
    expectedOutputs: input.expectedOutputs,
    verificationLayer: input.verificationLayer,
    accessModel: input.accessModel,
  };
}
