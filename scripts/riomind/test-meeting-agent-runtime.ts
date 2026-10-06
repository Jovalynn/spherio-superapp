import {
  buildMeetingAgentRuntime,
} from "../../lib/riomind/meetings/intelligence-agents";

const runtime = buildMeetingAgentRuntime({
  meetingCode: "NX-RUNTIME-TEST",
  transcriptAvailable: true,
  persistenceAvailable: true,
  intelligenceCount: 7,
  graphNodeCount: 4,
  actionCount: 2,
});

if (runtime.agents.length !== 8) {
  throw new Error(
    `Expected 8 meeting agents, received ${runtime.agents.length}.`
  );
}

const meetingAgent = runtime.agents.find(
  (agent) => agent.id === "meeting"
);

if (meetingAgent?.status !== "observing") {
  throw new Error(
    "Meeting Agent should be observing."
  );
}

const graphAgent = runtime.agents.find(
  (agent) =>
    agent.id === "knowledge-graph"
);

if (graphAgent?.status !== "ready") {
  throw new Error(
    "Knowledge Graph Agent should be ready."
  );
}

console.log(
  JSON.stringify(runtime, null, 2)
);
