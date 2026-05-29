import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Boxes,
  Rocket,
  ShieldCheck,
  Activity,
  Cpu,
  MemoryStick,
  GitCommit,
  ArrowRight,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { PageHeader, StatCard, StatusBadge } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import { services, usageSeries, requestsSeries, deployments } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Overview · Stella Hosting" }] }),
  component: Overview,
});

function Overview() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Welcome back, octocat"
        subtitle="Here's what's happening across your services."
        action={
          <Button asChild variant="hero">
            <Link to="/dashboard/deploy">
              <Rocket className="size-4" /> New deployment
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active services" value="4 / 5" icon={Boxes} delta="+1 this week" />
        <StatCard label="Deploys today" value="12" icon={GitCommit} delta="+24%" />
        <StatCard label="Avg. CPU" value="34%" icon={Cpu} delta="-6%" positive={false} />
        <StatCard label="Threats blocked" value="3" icon={ShieldCheck} delta="all quarantined" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Resource usage</h3>
              <p className="text-xs text-muted-foreground">CPU & memory · last 24h</p>
            </div>
            <Activity className="size-5 text-primary" />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={usageSeries}>
              <defs>
                <linearGradient id="cpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="mem" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="t" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  color: "var(--color-popover-foreground)",
                }}
              />
              <Area type="monotone" dataKey="cpu" stroke="var(--color-chart-1)" fill="url(#cpu)" strokeWidth={2} />
              <Area type="monotone" dataKey="mem" stroke="var(--color-chart-2)" fill="url(#mem)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Requests</h3>
              <p className="text-xs text-muted-foreground">This week</p>
            </div>
            <MemoryStick className="size-5 text-primary" />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={requestsSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="d" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "var(--color-accent)", opacity: 0.3 }}
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  color: "var(--color-popover-foreground)",
                }}
              />
              <Bar dataKey="reqs" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Your services</h3>
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard/services">View all <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
          <div className="space-y-2">
            {services.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{s.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{s.repo}</div>
                </div>
                <StatusBadge status={s.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="mb-4 font-semibold">Recent deployments</h3>
          <div className="space-y-2">
            {deployments.slice(0, 5).map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{d.message}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {d.service} · {d.commit} · {d.when}
                  </div>
                </div>
                <span
                  className={`shrink-0 text-xs font-medium ${
                    d.status === "success" ? "text-success" : d.status === "failed" ? "text-destructive" : "text-warning"
                  }`}
                >
                  {d.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
