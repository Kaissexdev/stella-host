import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Loader2, AlertTriangle, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export type BadgeStatus = "running" | "stopped" | "building" | "suspended" | "error";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  positive = true,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  delta?: string;
  positive?: boolean;
}) {
  return (
    <div className="glass hover-lift rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
          <Icon className="size-[18px]" />
        </span>
      </div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      {delta && (
        <div
          className={cn(
            "mt-1 inline-flex items-center gap-1 text-xs font-medium",
            positive ? "text-success" : "text-destructive",
          )}
        >
          {positive ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
          {delta}
        </div>
      )}
    </div>
  );
}

const statusStyles: Record<BadgeStatus, string> = {
  running: "bg-success/15 text-success ring-success/25",
  stopped: "bg-muted text-muted-foreground ring-border",
  building: "bg-warning/15 text-warning ring-warning/25",
  suspended: "bg-destructive/15 text-destructive ring-destructive/25",
  error: "bg-destructive/15 text-destructive ring-destructive/25",
};

export function StatusBadge({ status }: { status: BadgeStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1",
        statusStyles[status],
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "running" && "bg-success animate-status-pulse",
          status === "building" && "bg-warning animate-status-pulse",
          status === "stopped" && "bg-muted-foreground",
          (status === "suspended" || status === "error") && "bg-destructive",
        )}
      />
      {status}
    </span>
  );
}

// ----------------------------------------------------------- async UI states
export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" /> {label}
    </div>
  );
}

export function ErrorState({ message }: { message?: string }) {
  return (
    <div className="glass flex flex-col items-center justify-center gap-2 rounded-2xl py-16 text-center">
      <AlertTriangle className="size-6 text-destructive" />
      <p className="text-sm font-medium">Couldn't load data</p>
      <p className="max-w-md px-4 text-xs text-muted-foreground">
        {message ?? "The Stella Hosting backend is unreachable. Verify the API is running and VITE_API_URL is configured."}
      </p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className="glass flex flex-col items-center justify-center gap-2 rounded-2xl py-16 text-center">
      <Icon className="size-6 text-muted-foreground" />
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="max-w-md px-4 text-xs text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
