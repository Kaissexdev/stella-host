import type { DeploymentStatus, LogLevel, LogStream } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { emitRealtime } from "../lib/realtime.js";
import { enqueueDeployJob } from "../lib/queue.js";

// Centralizes deployment lifecycle writes so every status change and log line
// is persisted AND pushed to the dashboard in real time.

export async function appendLog(params: {
  deploymentId: string;
  userId: string;
  message: string;
  level?: LogLevel;
  stream?: LogStream;
}) {
  const log = await prisma.deploymentLog.create({
    data: {
      deploymentId: params.deploymentId,
      message: params.message,
      level: params.level ?? "INFO",
      stream: params.stream ?? "STDOUT",
    },
  });
  await emitRealtime({ type: "deployment.log", userId: params.userId, payload: log });
  return log;
}

export async function updateDeploymentStatus(params: {
  deploymentId: string;
  userId: string;
  status: DeploymentStatus;
  url?: string | null;
}) {
  const now = new Date();
  const existing = await prisma.deployment.findUnique({ where: { id: params.deploymentId } });
  if (!existing) throw new Error("Deployment not found");

  const startedAt =
    params.status === "BUILDING" && !existing.startedAt ? now : existing.startedAt;
  const finishedAt = ["LIVE", "FAILED", "CANCELLED"].includes(params.status) ? now : null;
  const durationMs =
    finishedAt && startedAt ? finishedAt.getTime() - startedAt.getTime() : existing.durationMs;

  const deployment = await prisma.deployment.update({
    where: { id: params.deploymentId },
    data: {
      status: params.status,
      url: params.url ?? existing.url,
      startedAt,
      finishedAt,
      durationMs,
    },
    include: { service: true },
  });

  // Reflect terminal states onto the parent service.
  if (params.status === "LIVE") {
    await prisma.service.update({ where: { id: deployment.serviceId }, data: { status: "RUNNING" } });
  } else if (params.status === "FAILED") {
    await prisma.service.update({ where: { id: deployment.serviceId }, data: { status: "ERROR" } });
  } else if (params.status === "BUILDING") {
    await prisma.service.update({ where: { id: deployment.serviceId }, data: { status: "BUILDING" } });
  }

  await emitRealtime({ type: "deployment.updated", userId: params.userId, payload: deployment });
  return deployment;
}

export async function createDeployment(params: {
  serviceId: string;
  userId: string;
  branch: string;
  source: "MANUAL" | "WEBHOOK" | "REDEPLOY";
  commitSha?: string | null;
  commitMessage?: string | null;
  commitAuthor?: string | null;
}) {
  const deployment = await prisma.deployment.create({
    data: {
      serviceId: params.serviceId,
      userId: params.userId,
      branch: params.branch,
      source: params.source,
      commitSha: params.commitSha ?? null,
      commitMessage: params.commitMessage ?? null,
      commitAuthor: params.commitAuthor ?? null,
      status: "QUEUED",
    },
  });
  await emitRealtime({ type: "deployment.created", userId: params.userId, payload: deployment });
  await appendLog({
    deploymentId: deployment.id,
    userId: params.userId,
    message: `Deployment queued from ${params.source.toLowerCase()} (branch ${params.branch}).`,
    stream: "SYSTEM",
  });
  return deployment;
}
