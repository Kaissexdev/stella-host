import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { BarChart3, CheckCircle2, Clock, Rocket } from "lucide-react";
import { PageHeader, StatCard, LoadingState, ErrorState, EmptyState } from "@/components/dashboard/widgets";
import { useDeployments } from "@/lib/api/queries";
import { formatDuration } from "@/lib/api/format";

export const Route = createFileRoute("/dashboard/analytics")({
  head: () => ({ meta: [{ title: "Analytics · Stella Hosting" }] }),
  component: AnalyticsPage,
});

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  color: "var(--color-popover-foreground)",
};

function AnalyticsPage() {
  const { data, isLoading, isError, error } = useDeployments();

  const total = data?.length ?? 0;
  const live = data?.filter((d) => d.status === "LIVE").length ?? 0;
  const successRate = total > 0 ? Math.round((live / total) * 100) : 0;
  const durations = (data ?? []).map((d) => d.durationMs).filter((d): d is number => d != null);
  const avgDuration = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : null;

  // Deployments per day, last 7 days — derived from real history.
  const days: { d: string; deploys: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const count =
      data?.filter((dep) => {
        const t = new Date(dep.createdAt).getTime();
        return t >= day.getTime() && t < next.getTime();
      }).length ?? 0;
    days.push({ d: day.toLocaleDateString(undefined, { weekday: "short" }), deploys: count });
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Analytics" subtitle="Deployment activity and reliability trends." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total deployments" value={String(total)} icon={Rocket} />
        <StatCard label="Live services" value={String(live)} icon={CheckCircle2} />
        <StatCard label="Success rate" value={`${successRate}%`} icon={BarChart3} />
        <StatCard label="Avg. build time" value={formatDuration(avgDuration)} icon={Clock} />
      </div>

      <div className="mt-4 glass rounded-2xl p-5">
        <h3 className="mb-4 font-semibold">Deployments · last 7 days</h3>
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState message={(error as Error)?.message} />
        ) : total === 0 ? (
          <EmptyState title="No deployment data yet" description="Deploy a service to see analytics." />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={days}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="d" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "var(--color-accent)", opacity: 0.3 }} contentStyle={tooltipStyle} />
              <Bar dataKey="deploys" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
