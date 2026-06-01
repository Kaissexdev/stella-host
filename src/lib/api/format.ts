// Presentation helpers shared across dashboard pages.

import type {
  DeploymentStatus,
  LogStream,
  ServiceStatus,
  TicketPriority,
  TicketStatus,
} from "./types";

export function relativeTime(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const date = typeof input === "string" ? new Date(input) : input;
  const diff = Date.now() - date.getTime();
  if (Number.isNaN(diff)) return "—";
  const sec = Math.round(diff / 1000);
  if (sec < 0) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatDuration(ms: number | null | undefined): string {
  if (ms == null) return "—";
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${min}m ${rem}s`;
}

// Map backend SERVICE statuses to the lowercase variant used by StatusBadge.
const serviceStatusMap: Record<ServiceStatus, "running" | "stopped" | "building" | "error"> = {
  RUNNING: "running",
  STOPPED: "stopped",
  BUILDING: "building",
  PROVISIONING: "building",
  ERROR: "error",
};

export function serviceBadgeStatus(status: ServiceStatus) {
  return serviceStatusMap[status] ?? "stopped";
}

export const deploymentStatusTone: Record<DeploymentStatus, string> = {
  LIVE: "text-success",
  BUILDING: "text-warning",
  DEPLOYING: "text-warning",
  QUEUED: "text-muted-foreground",
  FAILED: "text-destructive",
  CANCELLED: "text-muted-foreground",
};

export const ticketStatusTone: Record<TicketStatus, string> = {
  OPEN: "text-success",
  PENDING: "text-warning",
  CLOSED: "text-muted-foreground",
};

export const ticketPriorityTone: Record<TicketPriority, string> = {
  URGENT: "bg-destructive/15 text-destructive ring-destructive/25",
  HIGH: "bg-destructive/15 text-destructive ring-destructive/25",
  NORMAL: "bg-warning/15 text-warning ring-warning/25",
  LOW: "bg-primary/15 text-primary ring-primary/25",
};

export function severityTone(severity: string): string {
  switch (severity) {
    case "CRITICAL":
    case "HIGH":
      return "bg-destructive/15 text-destructive ring-destructive/25";
    case "MEDIUM":
    case "LOW":
      return "bg-warning/15 text-warning ring-warning/25";
    default:
      return "bg-primary/15 text-primary ring-primary/25";
  }
}

export const logStreamTone: Record<LogStream, string> = {
  STDOUT: "text-foreground",
  STDERR: "text-destructive",
  SYSTEM: "text-primary",
};

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
