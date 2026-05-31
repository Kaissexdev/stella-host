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

  // ----- Deployment runner (Docker-based isolated deployments) -----
  // Whether this process should run the build/deploy worker. Disable on API-only
  // nodes that don't have Docker access.
  RUNNER_ENABLED: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  // Absolute path used to check out repositories before building.
  WORKSPACE_DIR: z.string().default("/var/lib/stella/workspaces"),
  // Base image used when a repo has no Dockerfile of its own.
  DEPLOY_BASE_IMAGE: z.string().default("node:20-bookworm-slim"),
  // Wildcard domain for deployed services, e.g. "apps.stella-hosting.com".
  // When set, a service is reachable at https://<slug>.<DEPLOY_DOMAIN>.
  DEPLOY_DOMAIN: z.string().optional().or(z.literal("")),
  // Public host used to build a plain URL when DEPLOY_DOMAIN is not configured.
  DEPLOY_PUBLIC_HOST: z.string().default("localhost"),
  // Host port range allocated to running containers.
  DEPLOY_PORT_START: z.coerce.number().default(41000),
  DEPLOY_PORT_END: z.coerce.number().default(42000),
  // Port the application is expected to listen on inside the container.
  DEPLOY_CONTAINER_PORT: z.coerce.number().default(8080),
  // Per-container resource limits.
  DEPLOY_CPU_LIMIT: z.string().default("1"),
  DEPLOY_MEMORY_LIMIT: z.string().default("512m"),
  // Binaries (override if not on PATH).
  DOCKER_BIN: z.string().default("docker"),
  GIT_BIN: z.string().default("git"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
