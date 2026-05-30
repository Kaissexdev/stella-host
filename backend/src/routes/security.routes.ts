import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { redis } from "../lib/redis.js";
import { logSecurityEvent } from "../lib/security-log.js";

const router = Router();
router.use(requireAuth);

// A user's own security events + login history (for the security dashboard).
router.get("/events", async (req, res, next) => {
  try {
    const take = z.coerce.number().min(1).max(100).default(50).parse(req.query.take ?? 50);
    const events = await prisma.securityLog.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      take,
    });
    res.json(events);
  } catch (err) {
    next(err);
  }
});

router.get("/logins", async (req, res, next) => {
  try {
    const logins = await prisma.loginEvent.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json(logins);
  } catch (err) {
    next(err);
  }
});

router.get("/sessions", async (req, res, next) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: req.user!.id, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastSeenAt: "desc" },
      select: { id: true, ip: true, userAgent: true, createdAt: true, lastSeenAt: true },
    });
    res.json(sessions);
  } catch (err) {
    next(err);
  }
});

// ---------------- Admin-only ----------------

router.get("/admin/overview", requireRole("ADMIN"), async (_req, res, next) => {
  try {
    const [totalUsers, activeServices, deploysToday, threatsBlocked, recentEvents, flagged] =
      await Promise.all([
        prisma.user.count(),
        prisma.service.count({ where: { status: "RUNNING" } }),
        prisma.deployment.count({
          where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        }),
        prisma.securityLog.count({ where: { type: { in: ["ABUSE_BLOCKED", "IP_BLOCKED"] } } }),
        prisma.securityLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
        prisma.abuseFlag.findMany({
          where: { resolved: false },
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { user: { select: { username: true } } },
        }),
      ]);
    res.json({ totalUsers, activeServices, deploysToday, threatsBlocked, recentEvents, flagged });
  } catch (err) {
    next(err);
  }
});

router.get("/admin/users", requireRole("ADMIN"), async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { _count: { select: { services: true } } },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

const banSchema = z.object({ userId: z.string().min(1), action: z.enum(["ban", "unban", "suspend"]) });

router.post("/admin/users/ban", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { userId, action } = banSchema.parse(req.body);
    const status = action === "ban" ? "BANNED" : action === "suspend" ? "SUSPENDED" : "ACTIVE";
    const user = await prisma.user.update({ where: { id: userId }, data: { status } });
    if (status !== "ACTIVE") {
      await prisma.session.updateMany({ where: { userId }, data: { revokedAt: new Date() } });
    }
    await logSecurityEvent(
      {
        type: action === "ban" ? "USER_BANNED" : "USER_SUSPENDED",
        severity: "HIGH",
        message: `Admin ${req.user!.username} ${action}ned ${user.username}`,
        userId,
      },
      req,
    );
    res.json(user);
  } catch (err) {
    next(err);
  }
});

const blockIpSchema = z.object({ ip: z.string().min(3), reason: z.string().max(300).default("Manual block") });

router.post("/admin/block-ip", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { ip, reason } = blockIpSchema.parse(req.body);
    const row = await prisma.blockedIp.upsert({
      where: { ip },
      create: { ip, reason },
      update: { reason },
    });
    await redis.del(`blocked_ip:${ip}`);
    await logSecurityEvent(
      { type: "IP_BLOCKED", severity: "HIGH", message: `Admin blocked IP ${ip}`, ip },
      req,
    );
    res.json(row);
  } catch (err) {
    next(err);
  }
});

export default router;
