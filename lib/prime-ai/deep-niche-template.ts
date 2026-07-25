export type DeepNicheAudience = {
  title: string;
  description: string;
};

export type DeepNicheCreatorSetup = {
  title: string;
  description: string;
  options: string[];
};

export type DeepNicheUserWorkflow = {
  step: string;
  title: string;
  description: string;
};

export type DeepNicheModule = {
  title: string;
  purpose: string;
  outputs: string[];
};

export type DeepNicheAccessModel = {
  title: string;
  description: string;
};

export type DeepNicheTemplate = {
  id: string;
  title: string;
  publicPositioning: string;
  creatorPromise: string;
  userPromise: string;
  audiences: DeepNicheAudience[];
  creatorSetup: DeepNicheCreatorSetup[];
  userWorkflow: DeepNicheUserWorkflow[];
  deepModules: DeepNicheModule[];
  accessModels: DeepNicheAccessModel[];
  rioMindNexusRole: string[];
  proofAndVerification: string[];
};
