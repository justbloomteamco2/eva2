import handler from "./.open-next/worker.js";

const maintenanceJobs = {
  "37 3 * * *": "/api/maintenance/creator-photos",
  "47 3 * * *": "/api/maintenance/feedback-email"
};

const worker = {
  fetch: handler.fetch,

  async scheduled(event, env, ctx) {
    const path = maintenanceJobs[event.cron];
    if (!path) throw new Error(`No maintenance job is configured for cron: ${event.cron}`);
    if (!env.CRON_SECRET) throw new Error("CRON_SECRET is not configured.");

    const response = await handler.fetch(
      new Request(`https://internal.invalid${path}`, {
        headers: { Authorization: `Bearer ${env.CRON_SECRET}` }
      }),
      env,
      ctx
    );

    if (!response.ok) {
      throw new Error(`Maintenance job ${path} failed with status ${response.status}.`);
    }
  }
};

export default worker;

export { DOQueueHandler, DOShardedTagCache } from "./.open-next/worker.js";
