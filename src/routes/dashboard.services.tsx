import { createFileRoute, Link } from "@tanstack/react-router";
import { RotateCw, Rocket, Trash2, ExternalLink, GitBranch } from "lucide-react";
import { toast } from "sonner";
import {
  PageHeader,
  StatusBadge,
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import {
  useServices,
  useTriggerDeployment,
  useDeleteService,
} from "@/lib/api/queries";
import { serviceBadgeStatus, relativeTime, titleCase } from "@/lib/api/format";

export const Route = createFileRoute("/dashboard/services")({
  head: () => ({ meta: [{ title: "Services · Stella Hosting" }] }),
  component: ServicesPage,
});

function ServicesPage() {
  const { data: services, isLoading, isError, error } = useServices();
  const trigger = useTriggerDeployment();
  const remove = useDeleteService();

  const onRedeploy = (id: string, name: string) =>
    trigger.mutate(
      { serviceId: id },
      {
        onSuccess: () => toast.success(`Redeploying ${name}…`),
        onError: (e) => toast.error((e as Error).message),
      },
    );

  const onDelete = (id: string, name: string) =>
    remove.mutate(id, {
      onSuccess: () => toast.success(`${name} deleted`),
      onError: (e) => toast.error((e as Error).message),
    });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Services"
        subtitle="Manage your deployments — redeploy, monitor and remove."
        action={
          <Button asChild variant="hero">
            <Link to="/dashboard/deploy">
              <Rocket className="size-4" /> Deploy new
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState message={(error as Error)?.message} />
      ) : services && services.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {services.map((s) => {
            const latest = s.deployments?.[0];
            return (
              <div key={s.id} className="glass hover-lift rounded-2xl p-5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold">{s.name}</h3>
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                      <GitBranch className="size-3.5" /> {s.repoFullName} · {s.branch}
                    </p>
                  </div>
                  <StatusBadge status={serviceBadgeStatus(s.status)} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-secondary/40 p-3">
                    <div className="text-xs text-muted-foreground">Type</div>
                    <div className="mt-1 font-semibold capitalize">{s.type}</div>
                  </div>
                  <div className="rounded-xl bg-secondary/40 p-3">
                    <div className="text-xs text-muted-foreground">Last deploy</div>
                    <div className="mt-1 font-semibold">
                      {latest ? titleCase(latest.status) : "—"}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {s.region} · updated {relativeTime(s.updatedAt)}
                  </span>
                  {latest?.url && (
                    <a
                      href={latest.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      Open <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="glass"
                    size="sm"
                    disabled={trigger.isPending}
                    onClick={() => onRedeploy(s.id, s.name)}
                  >
                    <RotateCw className="size-3.5" /> Redeploy
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={remove.isPending}
                    onClick={() => onDelete(s.id, s.name)}
                  >
                    <Trash2 className="size-3.5" /> Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No services yet"
          description="Deploy your first project from a GitHub repository to get started."
          action={
            <Button asChild variant="hero" size="sm">
              <Link to="/dashboard/deploy">Deploy now</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
