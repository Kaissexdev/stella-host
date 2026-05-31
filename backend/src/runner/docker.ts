import { spawn } from "node:child_process";
import { env } from "../config/env.js";
import { redis } from "../lib/redis.js";

// Thin wrappers around the `git` and `docker` CLIs. The runner shells out to
// these binaries (they must be installed on the host / mounted into the
// container) and streams their output back line-by-line so it can be persisted
// and broadcast to the dashboard in real time.

export interface ExecResult {
  code: number;
  stdout: string;
  stderr: string;
}

export type LineHandler = (line: string, stream: "STDOUT" | "STDERR") => void;

// Runs a command, streaming each output line to `onLine`. Rejects only on spawn
// failure — a non-zero exit code is returned in the result so callers decide.
export function exec(
  bin: string,
  args: string[],
  opts: { cwd?: string; env?: NodeJS.ProcessEnv; onLine?: LineHandler; timeoutMs?: number } = {},
): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
      cwd: opts.cwd,
      env: { ...process.env, ...opts.env },
    });

    let stdout = "";
    let stderr = "";
    let stdoutBuf = "";
    let stderrBuf = "";

    const flush = (buf: string, stream: "STDOUT" | "STDERR") => {
      const parts = buf.split(/\r?\n/);
      const remainder = parts.pop() ?? "";
      for (const line of parts) {
        if (line.length === 0) continue;
        opts.onLine?.(line, stream);
      }
      return remainder;
    };

    const timeout = opts.timeoutMs
      ? setTimeout(() => {
          child.kill("SIGKILL");
          opts.onLine?.(`Command timed out after ${opts.timeoutMs}ms`, "STDERR");
        }, opts.timeoutMs)
      : null;

    child.stdout.on("data", (d: Buffer) => {
      const text = d.toString("utf8");
      stdout += text;
      stdoutBuf = flush(stdoutBuf + text, "STDOUT");
    });
    child.stderr.on("data", (d: Buffer) => {
      const text = d.toString("utf8");
      stderr += text;
      stderrBuf = flush(stderrBuf + text, "STDERR");
    });

    child.on("error", (err) => {
      if (timeout) clearTimeout(timeout);
      reject(err);
    });
    child.on("close", (code) => {
      if (timeout) clearTimeout(timeout);
      if (stdoutBuf.trim()) opts.onLine?.(stdoutBuf, "STDOUT");
      if (stderrBuf.trim()) opts.onLine?.(stderrBuf, "STDERR");
      resolve({ code: code ?? 0, stdout, stderr });
    });
  });
}

export function git(args: string[], opts: Parameters<typeof exec>[2] = {}) {
  return exec(env.GIT_BIN, args, opts);
}

export function docker(args: string[], opts: Parameters<typeof exec>[2] = {}) {
  return exec(env.DOCKER_BIN, args, opts);
}

// Quietly run docker and return stdout (used for inspect-style queries).
async function dockerQuiet(args: string[]): Promise<ExecResult> {
  return exec(env.DOCKER_BIN, args, {});
}

export function containerName(serviceId: string): string {
  return `stella-svc-${serviceId}`;
}

export function imageName(serviceId: string): string {
  return `stella/${serviceId}:latest`;
}

export async function isDockerAvailable(): Promise<boolean> {
  try {
    const res = await dockerQuiet(["version", "--format", "{{.Server.Version}}"]);
    return res.code === 0;
  } catch {
    return false;
  }
}

export async function isContainerRunning(serviceId: string): Promise<boolean> {
  const res = await dockerQuiet([
    "inspect",
    "-f",
    "{{.State.Running}}",
    containerName(serviceId),
  ]);
  return res.code === 0 && res.stdout.trim() === "true";
}

export async function stopAndRemoveContainer(serviceId: string): Promise<void> {
  const name = containerName(serviceId);
  await dockerQuiet(["rm", "-f", name]).catch(() => undefined);
}

// Deterministic, persistent host-port allocation per service backed by a Redis
// hash. Re-deploys reuse the same port; new services get the next free one.
const PORT_HASH = "stella:service:ports";

export async function allocatePort(serviceId: string): Promise<number> {
  const existing = await redis.hget(PORT_HASH, serviceId);
  if (existing) return Number(existing);

  const used = await redis.hvals(PORT_HASH);
  const usedSet = new Set(used.map(Number));
  for (let port = env.DEPLOY_PORT_START; port <= env.DEPLOY_PORT_END; port++) {
    if (!usedSet.has(port)) {
      await redis.hset(PORT_HASH, serviceId, String(port));
      return port;
    }
  }
  throw new Error("No free host ports available in the configured range");
}

export async function releasePort(serviceId: string): Promise<void> {
  await redis.hdel(PORT_HASH, serviceId);
}
