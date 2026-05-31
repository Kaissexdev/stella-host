import { redis } from "./redis.js";

// Reliable work queue for deployment jobs backed by a Redis list. Using a list
// (with BRPOP) instead of pub/sub guarantees that exactly one worker picks up
// each job and that jobs are never lost when no worker is connected.
export const DEPLOY_QUEUE_KEY = "stella:deploy:queue";

// A dedicated blocking connection — BRPOP holds the connection open, so it must
// not be shared with the general command connection.
const blockingClient = redis.duplicate();

export interface DeployJob {
  deploymentId: string;
}

export async function enqueueDeployJob(job: DeployJob): Promise<void> {
  await redis.lpush(DEPLOY_QUEUE_KEY, JSON.stringify(job));
}

// Blocks until a job is available (or the timeout elapses) and returns it.
export async function dequeueDeployJob(timeoutSeconds = 5): Promise<DeployJob | null> {
  const res = await blockingClient.brpop(DEPLOY_QUEUE_KEY, timeoutSeconds);
  if (!res) return null;
  try {
    return JSON.parse(res[1]) as DeployJob;
  } catch {
    return null;
  }
}

export function disconnectQueue() {
  blockingClient.disconnect();
}
