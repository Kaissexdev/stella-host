import type { Request } from "express";
import type { SecurityEventType, Severity } from "@prisma/client";
import { prisma } from "./prisma.js";
import { emitRealtime } from "./realtime.js";
import { getClientIp, getDeviceFingerprint } from "./request-context.js";

interface SecurityLogInput {
  type: SecurityEventType;
  severity?: Severity;
  message: string;
  userId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  deviceFingerprint?: string | null;
  metadata?: Record<string, unknown>;
}

// Single entry point for writing security/audit events. Persists to Postgres
// and broadcasts to the admin real-time channel.
export async function logSecurityEvent(input: SecurityLogInput, req?: Request) {
  const ip = input.ip ?? (req ? getClientIp(req) : null);
  const deviceFingerprint =
    input.deviceFingerprint ?? (req ? getDeviceFingerprint(req) : null);
  const userAgent = input.userAgent ?? (req ? req.headers["user-agent"] ?? null : null);

  const record = await prisma.securityLog.create({
    data: {
      type: input.type,
      severity: input.severity ?? "INFO",
      message: input.message,
      userId: input.userId ?? null,
      ip,
      userAgent: typeof userAgent === "string" ? userAgent : null,
      deviceFingerprint,
      metadata: (input.metadata ?? undefined) as object | undefined,
    },
  });

  await emitRealtime({ type: "security.event", userId: input.userId ?? null, payload: record });
  return record;
}
