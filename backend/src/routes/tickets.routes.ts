import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { userId: req.user!.id },
      orderBy: { updatedAt: "desc" },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    res.json(tickets);
  } catch (err) {
    next(err);
  }
});

const createSchema = z.object({
  subject: z.string().min(3).max(200),
  body: z.string().min(1).max(5000),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
});

router.post("/", async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const ticket = await prisma.ticket.create({
      data: {
        userId: req.user!.id,
        subject: data.subject,
        priority: data.priority,
        messages: { create: { authorId: req.user!.id, body: data.body } },
      },
      include: { messages: true },
    });
    res.status(201).json(ticket);
  } catch (err) {
    next(err);
  }
});

const replySchema = z.object({ body: z.string().min(1).max(5000) });

router.post("/:id/reply", async (req, res, next) => {
  try {
    const { body } = replySchema.parse(req.body);
    const owned = await prisma.ticket.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!owned) return res.status(404).json({ error: "Ticket not found" });
    const message = await prisma.ticketMessage.create({
      data: { ticketId: owned.id, authorId: req.user!.id, body },
    });
    await prisma.ticket.update({ where: { id: owned.id }, data: { status: "PENDING" } });
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
});

router.post("/:id/close", async (req, res, next) => {
  try {
    const owned = await prisma.ticket.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!owned) return res.status(404).json({ error: "Ticket not found" });
    const ticket = await prisma.ticket.update({
      where: { id: owned.id },
      data: { status: "CLOSED" },
    });
    res.json(ticket);
  } catch (err) {
    next(err);
  }
});

export default router;
