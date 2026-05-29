import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, ShieldAlert, Ban, Bug } from "lucide-react";
import { PageHeader, StatCard } from "@/components/dashboard/widgets";
import { securityEvents } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/security")({
  head: () => ({ meta: [{ title: "Security · Stella Hosting" }] }),
  component: SecurityPage,
});

const levelStyle = {
  blocked: "bg-destructive/15 text-destructive ring-destructive/25",
  warning: "bg-warning/15 text-warning ring-warning/25",
  info: "bg-primary/15 text-primary ring-primary/25",
};

function SecurityPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="Security" subtitle="Automatic scanning, isolation and threat blocking across all services." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Threats blocked" value="37" icon={ShieldAlert} delta="last 30 days" />
        <StatCard label="Miners stopped" value="9" icon={Bug} delta="quarantined" />
        <StatCard label="Commands restricted" value="14" icon={Ban} delta="egress denied" />
        <StatCard label="Scans passed" value="100%" icon={ShieldCheck} delta="all services clean" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <h3 className="mb-4 font-semibold">Security event log</h3>
          <div className="space-y-2">
            {securityEvents.map((e) => (
              <div key={e.id} className="flex items-start justify-between gap-3 rounded-xl bg-secondary/40 px-3 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1", levelStyle[e.level])}>
                      {e.level}
                    </span>
                    <span className="text-sm font-medium">{e.title}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{e.detail}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{e.when}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="mb-4 font-semibold">Active protections</h3>
          <ul className="space-y-3 text-sm">
            {[
              "Malware & integrity scanning",
              "Crypto miner detection",
              "Reverse shell prevention",
              "VPS-damaging process blocking",
              "Dangerous command restriction",
              "Container isolation & egress limits",
              "Auto-suspension of malicious projects",
            ].map((p) => (
              <li key={p} className="flex items-center gap-2.5">
                <ShieldCheck className="size-4 shrink-0 text-success" />
                <span className="text-muted-foreground">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
