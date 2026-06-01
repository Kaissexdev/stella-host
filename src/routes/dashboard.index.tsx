import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes, Rocket, ShieldCheck, GitCommit, Cpu, ArrowRight } from "lucide-react";
import {
  PageHeader,
  StatCard,
  StatusBadge,
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import { useServices, useDeployments } from "@/lib/api/queries";
import { useAuth } from "@/lib/auth";
import {
  relativeTime,
  serviceBadgeStatus,
  deploymentStatusTone,
  titleCase,
} from "@/lib/api/format";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Overview · Stella Hosting" }] }),
  component: Overview,
});

function Overview() {
  const { user } = useAuth();
  const services = useServices();
  const deployments = useDeployments();

  const running = services.data?.filter((s) => s.status === "RUNNING").length ?? 0;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const deploysToday =
    deployments.data?.filter((d) => new Date(d.createdAt) >= since).length ?? 0;
  const threats = 0;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Welcome back, ${user?.name ?? user?.username ?? ""}`.trim()}
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
        <StatCard
          label="Active services"
          value={`${running} / ${user?.serviceLimit ?? 5}`}
          icon={Boxes}
        />
        <StatCard label="Deploys today" value={String(deploysToday)} icon={GitCommit} />
        <StatCard label="Total services" value={String(services.data?.length ?? 0)} icon={Cpu} />
        <StatCard label="Threats blocked" value={String(threats)} icon={ShieldCheck} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Your services</h3>
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard/services">
                View all <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          {services.isLoading ? (
            <LoadingState />
          ) : services.isError ? (
            <ErrorState message={(services.error as Error)?.message} />
          ) : services.data && services.data.length > 0 ? (
            <div className="space-y-2">
              {services.data.slice(0, 6).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{s.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{s.repoFullName}</div>
                  </div>
                  <StatusBadge status={serviceBadgeStatus(s.status)} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No services yet"
              description="Deploy your first project from a GitHub repository."
              action={
                <Button asChild variant="hero" size="sm">
                  <Link to="/dashboard/deploy">Deploy now</Link>
                </Button>
              }
            />
          )}
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="mb-4 font-semibold">Recent deployments</h3>
          {deployments.isLoading ? (
            <LoadingState />
          ) : deployments.isError ? (
            <ErrorState message={(deployments.error as Error)?.message} />
          ) : deployments.data && deployments.data.length > 0 ? (
            <div className="space-y-2">
              {deployments.data.slice(0, 6).map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {d.commitMessage ?? `${titleCase(d.source)} deployment`}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {d.service?.name ?? "service"} ·{" "}
                      {d.commitSha ? d.commitSha.slice(0, 7) + " · " : ""}
                      {relativeTime(d.createdAt)}
                    </div>
                  </div>
                  <span className={`shrink-0 text-xs font-medium ${deploymentStatusTone[d.status]}`}>
                    {titleCase(d.status)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No deployments yet" />
          )}
        </div>
      </div>
    </div>
  );
}
