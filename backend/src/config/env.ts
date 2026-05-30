import "dotenv/config";
import { z } from "zod";

// Centralized, validated environment configuration. Fails fast at boot if a
// required production secret is missing or malformed.
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  API_BASE_URL: z.string().url(),
  WEB_BASE_URL: z.string().url(),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),

  SESSION_SECRET: z.string().min(32),
  SESSION_TTL_DAYS: z.coerce.number().default(7),
  COOKIE_DOMAIN: z.string().optional(),

  ENCRYPTION_KEY: z.string().regex(/^[0-9a-fA-F]{64}$/, "ENCRYPTION_KEY must be 64 hex chars"),

  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  GITHUB_WEBHOOK_SECRET: z.string().min(16),

  IP_INTEL_URL: z.string().url().optional().or(z.literal("")),
  IP_INTEL_API_KEY: z.string().optional().or(z.literal("")),

  MAX_ACCOUNTS_PER_DEVICE: z.coerce.number().default(2),
  MAX_ACCOUNTS_PER_IP: z.coerce.number().default(3),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
