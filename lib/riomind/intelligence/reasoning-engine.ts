export function buildRioMindClusterReasoning(cluster: any, question?: string) {
  const counts = cluster?.counts || {};
  const importance = cluster?.importance || {};
  const memberTypes = cluster?.memberTypes || [];
  const previewNodes = cluster?.previewNodes || [];

  const title = cluster?.title || "This intelligence cluster";
  const q = String(question || "Why is this important?").trim();

  const reasoning = [
    `RioMind identified ${counts.nodes || 0} connected knowledge nodes in this cluster.`,
    `The cluster includes ${memberTypes.length || 0} distinct node type(s), which indicates relationship breadth.`,
  ];

  if ((counts.decisions || 0) > 0) {
    reasoning.push(`It contains ${counts.decisions} decision node(s), so it may affect organizational direction.`);
  }

  if ((counts.actions || 0) > 0) {
    reasoning.push(`It contains ${counts.actions} action item(s), so it may require follow-up execution.`);
  }

  if ((counts.risks || 0) > 0) {
    reasoning.push(`It contains ${counts.risks} risk signal(s), so it should be reviewed for exposure or mitigation.`);
  }

  if ((counts.metrics || 0) > 0) {
    reasoning.push(`It contains ${counts.metrics} metric node(s), so it may connect to measurable performance.`);
  }

  const evidenceUsed = previewNodes.slice(0, 8).map((node: any) => ({
    type: node.node_type || "knowledge",
    title: node.title || node.node_key || "Knowledge node",
    summary: node.description || node.title || node.node_key,
    nodeKey: node.node_key,
    nodeId: node.id,
  }));

  const recommendations = [];

  if ((counts.actions || 0) > 0) {
    recommendations.push("Review connected action items and confirm owners, deadlines, and completion status.");
  }

  if ((counts.risks || 0) > 0) {
    recommendations.push("Review risk signals and decide whether mitigation or escalation is needed.");
  }

  if ((counts.decisions || 0) > 0) {
    recommendations.push("Validate whether connected decisions have been communicated and executed.");
  }

  if (!recommendations.length) {
    recommendations.push("Review the connected knowledge nodes to determine whether this cluster requires follow-up.");
  }

  recommendations.push("Use Ask RioMind to explore evidence, related clusters, and downstream impact.");

  const executiveSummary =
    `${title} is rated ${importance.label || "Informational"} because RioMind grouped ` +
    `${counts.nodes || 0} connected node(s), including ${counts.decisions || 0} decision(s), ` +
    `${counts.actions || 0} action item(s), ${counts.risks || 0} risk signal(s), and ${counts.metrics || 0} metric node(s).`;

  const confidence = {
    label: cluster?.confidence || ((counts.nodes || 0) >= 3 ? "High" : "Medium"),
    explanation:
      (counts.nodes || 0) >= 3
        ? "Confidence is supported by multiple connected knowledge nodes."
        : "Confidence is limited because only a small number of connected nodes are available.",
  };

  return {
    question: q,
    title: `${title} Reasoning`,
    executiveSummary,
    reasoning,
    evidenceUsed,
    confidence,
    recommendations,
    source: {
      clusterId: cluster?.clusterId || null,
      clusterTitle: title,
      clusterType: cluster?.type || null,
      importance,
      counts,
    },
  };
}
