import { createServer } from "node:http";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
/// <reference path="./types/express.d.ts" />

import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { redis } from "./lib/redis.js";
import { initRealtime } from "./lib/realtime.js";
import { startRunner, stopRunner } from "./runner/runner.js";
import { attachUser } from "./middleware/auth.js";
import { ipGuard } from "./middleware/security.js";
import { apiLimiter, authLimiter, webhookLimiter } from "./middleware/rate-limit.js";
import { errorHandler, notFound } from "./middleware/error.js";

import authRoutes from "./routes/auth.routes.js";
import servicesRoutes from "./routes/services.routes.js";
import deploymentsRoutes from "./routes/deployments.routes.js";
import ticketsRoutes from "./routes/tickets.routes.js";
import securityRoutes from "./routes/security.routes.js";
import webhookRoutes from "./routes/webhooks.routes.js";

const app = express();

// Behind nginx/Cloudflare — trust the proxy so client IPs resolve correctly.
app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin: env.WEB_BASE_URL,
    credentials: true,
  }),
);

// Health check (no auth, no rate limit).
app.get("/health", (_req, res) => res.json({ status: "ok", uptime: process.uptime() }));

// Webhooks must be mounted BEFORE the JSON body parser because they verify the
// raw request body for HMAC signatures.
app.use("/api/webhooks", webhookLimiter, ipGuard, webhookRoutes);

// Standard JSON API.
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(ipGuard);
app.use(attachUser);

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/services", apiLimiter, servicesRoutes);
app.use("/api/deployments", apiLimiter, deploymentsRoutes);
app.use("/api/tickets", apiLimiter, ticketsRoutes);
app.use("/api/security", apiLimiter, securityRoutes);

app.use(notFound);
app.use(errorHandler);

const httpServer = createServer(app);
initRealtime(httpServer);

async function start() {
  await prisma.$connect();
  await redis.ping();
  httpServer.listen(env.PORT, () => {
    console.log(`🚀 Stella Hosting API listening on :${env.PORT} (${env.NODE_ENV})`);
  });
  // Start the Docker-based deployment runner (no-op if Docker is unavailable).
  if (env.RUNNER_ENABLED) await startRunner();
}

start().catch((err) => {
  console.error("Fatal startup error", err);
  process.exit(1);
});

// Graceful shutdown.
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    console.log(`\n${signal} received, shutting down…`);
    stopRunner();
    httpServer.close();
    await prisma.$disconnect();
    redis.disconnect();
    process.exit(0);
  });
}
