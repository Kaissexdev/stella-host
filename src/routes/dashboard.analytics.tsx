import { createFileRoute } from "@tanstack/react-router";
import { Line, LineChart, Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { BarChart3, Globe, Clock, Gauge } from "lucide-react";
import { PageHeader, StatCard } from "@/components/dashboard/widgets";
import { usageSeries, requestsSeries } from "@/lib/mock-data";

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
  return (
    <div className="animate-fade-in">
      <PageHeader title="Analytics" subtitle="Traffic, performance and resource trends across your services." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total requests" value="129k" icon={BarChart3} delta="+18%" />
        <StatCard label="Bandwidth" value="842 GB" icon={Globe} delta="+9%" />
        <StatCard label="Avg. response" value="142ms" icon={Clock} delta="-12ms" />
        <StatCard label="Error rate" value="0.21%" icon={Gauge} delta="-0.05%" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl p-5">
          <h3 className="mb-4 font-semibold">Requests over time</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={requestsSeries}>
              <defs>
                <linearGradient id="reqs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="d" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="reqs" stroke="var(--color-chart-1)" fill="url(#reqs)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="mb-4 font-semibold">CPU & memory</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={usageSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="t" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="cpu" stroke="var(--color-chart-1)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="mem" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="net" stroke="var(--color-chart-3)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
