export async function runAgentRevenueWorker() {
  return {
    ok: true,
    worker: "agent_revenue_worker",
    status: "scaffold_ready",
  };
}
