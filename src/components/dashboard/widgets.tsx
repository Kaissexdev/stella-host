import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { ServiceStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

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

const statusStyles: Record<ServiceStatus, string> = {
  running: "bg-success/15 text-success ring-success/25",
  stopped: "bg-muted text-muted-foreground ring-border",
  building: "bg-warning/15 text-warning ring-warning/25",
  suspended: "bg-destructive/15 text-destructive ring-destructive/25",
  error: "bg-destructive/15 text-destructive ring-destructive/25",
};

export function StatusBadge({ status }: { status: ServiceStatus }) {
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
          status === "running" && "bg-success animate-pulse-glow",
          status === "building" && "bg-warning animate-pulse-glow",
          status === "stopped" && "bg-muted-foreground",
          (status === "suspended" || status === "error") && "bg-destructive",
        )}
      />
      {status}
    </span>
  );
}
