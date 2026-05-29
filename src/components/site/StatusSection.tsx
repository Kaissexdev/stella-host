import { CheckCircle2 } from "lucide-react";

const systems = [
  { name: "API & Control Plane", status: "Operational", uptime: "99.99%" },
  { name: "Deployment Pipeline", status: "Operational", uptime: "99.98%" },
  { name: "Container Runtime", status: "Operational", uptime: "100%" },
  { name: "Dashboard", status: "Operational", uptime: "99.99%" },
  { name: "Edge Network & SSL", status: "Operational", uptime: "99.97%" },
];

const bars = Array.from({ length: 60 }).map((_, i) => (i % 17 === 0 ? "warn" : "ok"));

export function StatusSection() {
  return (
    <section id="status" className="relative py-24">
      <div className="mx-auto max-w-5xl px-4">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">Status</span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl md:text-5xl">
            All systems <span className="text-gradient">operational</span>
          </h2>
        </div>

        <div className="glass mt-12 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-2 text-success">
            <CheckCircle2 className="size-5" />
            <span className="font-semibold">All services running normally</span>
            <span className="ml-auto text-xs text-muted-foreground">Updated just now</span>
          </div>

          <div className="mt-6 flex gap-[3px]">
            {bars.map((b, i) => (
              <span
                key={i}
                className={`h-9 flex-1 rounded-[2px] ${b === "ok" ? "bg-success/70" : "bg-warning/70"}`}
                title={b === "ok" ? "Operational" : "Degraded"}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>60 days ago</span>
            <span>Today</span>
          </div>

          <div className="mt-8 divide-y divide-border">
            {systems.map((s) => (
              <div key={s.name} className="flex items-center justify-between py-3.5">
                <span className="flex items-center gap-2.5 text-sm font-medium">
                  <span className="size-2 rounded-full bg-success animate-pulse-glow" />
                  {s.name}
                </span>
                <span className="flex items-center gap-4 text-sm">
                  <span className="hidden text-muted-foreground sm:inline">{s.uptime} uptime</span>
                  <span className="text-success">{s.status}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
