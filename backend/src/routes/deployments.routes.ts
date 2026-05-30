import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { createDeployment, updateDeploymentStatus } from "../services/deployment.service.js";

const router = Router();
router.use(requireAuth);

// Deployment history (optionally filtered by service), newest first.
router.get("/", async (req, res, next) => {
  try {
    const query = z
      .object({
        serviceId: z.string().optional(),
        status: z.string().optional(),
        take: z.coerce.number().min(1).max(100).default(30),
        cursor: z.string().optional(),
      })
      .parse(req.query);

    const deployments = await prisma.deployment.findMany({
      where: {
        userId: req.user!.id,
        ...(query.serviceId ? { serviceId: query.serviceId } : {}),
        ...(query.status ? { status: query.status as never } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: query.take,
      ...(query.cursor ? { skip: 1, cursor: { id: query.cursor } } : {}),
      include: { service: { select: { name: true, slug: true, repoFullName: true } } },
    });
    res.json(deployments);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const deployment = await prisma.deployment.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      include: { service: true, logs: { orderBy: { timestamp: "asc" } } },
    });
    if (!deployment) return res.status(404).json({ error: "Deployment not found" });
    res.json(deployment);
  } catch (err) {
    next(err);
  }
});

// Stream-friendly: fetch logs for a deployment (real-time updates also arrive
// over the websocket as `deployment.log`).
router.get("/:id/logs", async (req, res, next) => {
  try {
    const owned = await prisma.deployment.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      select: { id: true },
    });
    if (!owned) return res.status(404).json({ error: "Deployment not found" });
    const logs = await prisma.deploymentLog.findMany({
      where: { deploymentId: owned.id },
      orderBy: { timestamp: "asc" },
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

// Manually trigger a deployment for a service the user owns.
const triggerSchema = z.object({ serviceId: z.string().min(1), branch: z.string().optional() });

router.post("/", async (req, res, next) => {
  try {
    const { serviceId, branch } = triggerSchema.parse(req.body);
    const service = await prisma.service.findFirst({
      where: { id: serviceId, userId: req.user!.id },
    });
    if (!service) return res.status(404).json({ error: "Service not found" });

    const deployment = await createDeployment({
      serviceId: service.id,
      userId: req.user!.id,
      branch: branch ?? service.branch,
      source: "MANUAL",
    });
    res.status(201).json(deployment);
  } catch (err) {
    next(err);
  }
});

// Cancel an in-flight deployment.
router.post("/:id/cancel", async (req, res, next) => {
  try {
    const owned = await prisma.deployment.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!owned) return res.status(404).json({ error: "Deployment not found" });
    if (["LIVE", "FAILED", "CANCELLED"].includes(owned.status)) {
      return res.status(409).json({ error: "Deployment already finished" });
    }
    const deployment = await updateDeploymentStatus({
      deploymentId: owned.id,
      userId: req.user!.id,
      status: "CANCELLED",
    });
    res.json(deployment);
  } catch (err) {
    next(err);
  }
});

export default router;
