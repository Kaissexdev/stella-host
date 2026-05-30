import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { emitRealtime } from "../lib/realtime.js";
import { encrypt } from "../lib/crypto.js";

const router = Router();
router.use(requireAuth);

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);
}

// List the authenticated user's services with their latest deployment.
router.get("/", async (req, res, next) => {
  try {
    const services = await prisma.service.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      include: { deployments: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    res.json(services);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const service = await prisma.service.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      include: { deployments: { orderBy: { createdAt: "desc" }, take: 20 }, envVars: true },
    });
    if (!service) return res.status(404).json({ error: "Service not found" });
    res.json(service);
  } catch (err) {
    next(err);
  }
});

const createSchema = z.object({
  name: z.string().min(1).max(60),
  repoFullName: z.string().regex(/^[\w.-]+\/[\w.-]+$/),
  branch: z.string().min(1).max(100).default("main"),
  type: z.enum(["web", "worker", "cron", "static"]).default("web"),
  region: z.string().min(1).max(40).default("eu-central"),
  plan: z.string().min(1).max(40).default("starter"),
  buildCommand: z.string().max(500).default("npm install && npm run build"),
  startCommand: z.string().max(500).default("npm start"),
  autoDeploy: z.boolean().default(true),
  envVars: z.array(z.object({ key: z.string().min(1).max(200), value: z.string().max(8000) })).max(100).default([]),
});

router.post("/", async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);

    const count = await prisma.service.count({ where: { userId: req.user!.id } });
    if (count >= req.user!.serviceLimit) {
      return res.status(403).json({ error: `Service limit reached (${req.user!.serviceLimit})` });
    }

    const service = await prisma.service.create({
      data: {
        userId: req.user!.id,
        name: data.name,
        slug: `${slugify(data.name)}-${Math.random().toString(36).slice(2, 7)}`,
        repoFullName: data.repoFullName,
        branch: data.branch,
        type: data.type,
        region: data.region,
        plan: data.plan,
        buildCommand: data.buildCommand,
        startCommand: data.startCommand,
        autoDeploy: data.autoDeploy,
        status: "PROVISIONING",
        envVars: {
          create: data.envVars.map((e) => ({ key: e.key, value: encrypt(e.value) })),
        },
      },
    });

    await emitRealtime({ type: "service.updated", userId: req.user!.id, payload: service });
    res.status(201).json(service);
  } catch (err) {
    next(err);
  }
});

const updateSchema = createSchema.partial().omit({ envVars: true });

router.patch("/:id", async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    const owned = await prisma.service.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!owned) return res.status(404).json({ error: "Service not found" });

    const service = await prisma.service.update({ where: { id: owned.id }, data });
    await emitRealtime({ type: "service.updated", userId: req.user!.id, payload: service });
    res.json(service);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const owned = await prisma.service.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!owned) return res.status(404).json({ error: "Service not found" });
    await prisma.service.delete({ where: { id: owned.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
