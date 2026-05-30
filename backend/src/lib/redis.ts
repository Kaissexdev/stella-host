import { Redis } from "ioredis";
import { env } from "../config/env.js";

// Shared Redis connection used for caching, rate limiting and pub/sub fan-out
// of real-time events across multiple API instances.
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: false,
});

// A second connection dedicated to the subscriber side of pub/sub (ioredis
// requires a connection in subscriber mode to be used only for sub/unsub).
export const redisSub = redis.duplicate();

redis.on("error", (err) => console.error("[redis] error", err.message));

export const REALTIME_CHANNEL = "stella:realtime";
