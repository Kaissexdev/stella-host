import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redis } from "../lib/redis.js";
import { getClientIp } from "../lib/request-context.js";

// Redis-backed limiter so limits are shared across all API instances.
function makeLimiter(opts: { windowMs: number; max: number; prefix: string }) {
  return rateLimit({
    windowMs: opts.windowMs,
    max: opts.max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => getClientIp(req),
    store: new RedisStore({
      prefix: `rl:${opts.prefix}:`,
      sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)) as Promise<never>,
    }),
    handler: (_req, res) => res.status(429).json({ error: "Too many requests" }),
  });
}

// Generous default for authenticated API traffic.
export const apiLimiter = makeLimiter({ windowMs: 60_000, max: 120, prefix: "api" });

// Strict limiter for auth endpoints to slow credential/OAuth abuse.
export const authLimiter = makeLimiter({ windowMs: 60_000, max: 20, prefix: "auth" });

// Webhooks can burst; keep a high but bounded ceiling.
export const webhookLimiter = makeLimiter({ windowMs: 60_000, max: 600, prefix: "wh" });
