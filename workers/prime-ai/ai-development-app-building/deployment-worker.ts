export async function runDeploymentWorker() {
  return {
    ok: true,
    worker: "deployment_worker",
    status: "scaffold_ready",
  };
}
