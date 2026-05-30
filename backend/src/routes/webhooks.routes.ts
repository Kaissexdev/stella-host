import express, { Router, type Request } from "express";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { verifyHmac } from "../lib/crypto.js";
import { logSecurityEvent } from "../lib/security-log.js";
import { createDeployment, appendLog, updateDeploymentStatus } from "../services/deployment.service.js";

const router = Router();

// GitHub webhook receiver. Must read the RAW body to verify the HMAC signature,
// so this route uses its own express.raw() parser (mounted before json()).
router.post(
  "/github",
  express.raw({ type: "*/*", limit: "5mb" }),
  async (req: Request, res) => {
    const raw = req.body as Buffer;
    const signature = req.headers["x-hub-signature-256"] as string | undefined;
    const eventType = req.headers["x-github-event"] as string | undefined;

    if (!verifyHmac(env.GITHUB_WEBHOOK_SECRET, raw, signature)) {
      await logSecurityEvent({
        type: "WEBHOOK_REJECTED",
        severity: "MEDIUM",
        message: "Rejected GitHub webhook with invalid signature",
        ip: (req.headers["x-forwarded-for"] as string) ?? req.ip,
        metadata: { eventType },
      });
      return res.status(401).json({ error: "Invalid signature" });
    }

    let payload: any;
    try {
      payload = JSON.parse(raw.toString("utf8"));
    } catch {
      return res.status(400).json({ error: "Invalid JSON" });
    }

    await logSecurityEvent({
      type: "WEBHOOK_RECEIVED",
      severity: "INFO",
      message: `GitHub webhook received: ${eventType}`,
      metadata: { repo: payload?.repository?.full_name },
    });

    // Respond immediately; do the work asynchronously.
    res.status(202).json({ ok: true });

    if (eventType !== "push") return;

    try {
      const repoFullName: string | undefined = payload?.repository?.full_name;
      const ref: string = payload?.ref ?? "";
      const branch = ref.replace("refs/heads/", "");
      const head = payload?.head_commit;
      if (!repoFullName || !branch) return;

      // Match every auto-deploy service tracking this repo + branch.
      const services = await prisma.service.findMany({
        where: { repoFullName, branch, autoDeploy: true },
      });

      for (const service of services) {
        const deployment = await createDeployment({
          serviceId: service.id,
          userId: service.userId,
          branch,
          source: "WEBHOOK",
          commitSha: head?.id ?? null,
          commitMessage: head?.message ?? null,
          commitAuthor: head?.author?.name ?? null,
        });

        // Move the deployment into BUILDING so dashboards reflect live status.
        // The actual container build is performed by the runner connected to
        // this deployment record (see README — Deploy engine integration).
        await updateDeploymentStatus({
          deploymentId: deployment.id,
          userId: service.userId,
          status: "BUILDING",
        });
        await appendLog({
          deploymentId: deployment.id,
          userId: service.userId,
          message: `Build triggered by push ${head?.id?.slice(0, 7) ?? ""} — "${head?.message ?? ""}"`,
          stream: "SYSTEM",
        });
      }
    } catch (err) {
      console.error("[webhook] push handling failed", err);
    }
  },
);

export default router;
