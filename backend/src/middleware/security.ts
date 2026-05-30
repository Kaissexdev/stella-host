import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { redis } from "../lib/redis.js";
import { getClientIp, getDeviceFingerprint } from "../lib/request-context.js";
import { logSecurityEvent } from "../lib/security-log.js";

const BLOCK_CACHE_PREFIX = "blocked_ip:";
const BLOCK_CACHE_TTL = 60; // seconds

// Populates req.clientIp / req.deviceFingerprint and rejects requests coming
// from actively blocked IPs (checked via a short Redis cache backed by Postgres).
export async function ipGuard(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  req.clientIp = ip;
  req.deviceFingerprint = getDeviceFingerprint(req);

  try {
    const cacheKey = BLOCK_CACHE_PREFIX + ip;
    const cached = await redis.get(cacheKey);
    let blocked = cached === "1";

    if (cached === null) {
      const row = await prisma.blockedIp.findUnique({ where: { ip } });
      blocked = !!row && (!row.expiresAt || row.expiresAt.getTime() > Date.now());
      await redis.set(cacheKey, blocked ? "1" : "0", "EX", BLOCK_CACHE_TTL);
    }

    if (blocked) {
      await logSecurityEvent(
        { type: "IP_BLOCKED", severity: "HIGH", message: `Blocked IP attempted access: ${ip}` },
        req,
      );
      return res.status(403).json({ error: "Access denied" });
    }
  } catch (err) {
    console.error("[security] ipGuard", err);
  }

  next();
}
