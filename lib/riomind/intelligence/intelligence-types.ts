export type NexusIntelligenceRequest = {
  aiLayer?: string;
  surface: string;
  meetingCode?: string;
  conversationId?: string;
  workspaceId?: string;
  projectId?: string;
};

export type NexusIntelligenceResponse = {
  summary: any;
  knowledge: {
    topics: any[];
    entities: any[];
    facts: any[];
  };
  decisions: any[];
  actionItems: any[];
  tasks: any[];
  memory: any;
  agents: any[];
};
