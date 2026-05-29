import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Play, Square, RotateCw, Rocket, Cpu, MemoryStick, ExternalLink, GitBranch } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, StatusBadge } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import { services } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard/services")({
  head: () => ({ meta: [{ title: "Services · Stella Hosting" }] }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Services"
        subtitle="Manage your deployments — start, stop, rebuild and monitor."
        action={
          <Button asChild variant="hero">
            <Link to="/dashboard/deploy"><Rocket className="size-4" /> Deploy new</Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {services.map((s) => (
          <div key={s.id} className="glass hover-lift rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold">{s.name}</h3>
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                  <GitBranch className="size-3.5" /> {s.repo} · {s.branch}
                </p>
              </div>
              <StatusBadge status={s.status} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-secondary/40 p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Cpu className="size-3.5" /> CPU</div>
                <div className="mt-1 font-semibold">{s.cpu}%</div>
              </div>
              <div className="rounded-xl bg-secondary/40 p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><MemoryStick className="size-3.5" /> Memory</div>
                <div className="mt-1 font-semibold">{s.memory}%</div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{s.framework} · {s.region}</span>
              {s.domain !== "—" && (
                <a href="#" className="inline-flex items-center gap-1 text-primary hover:underline">
                  {s.domain} <ExternalLink className="size-3" />
                </a>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="glass" size="sm" onClick={() => toast.success(`${s.name} starting…`)}>
                <Play className="size-3.5" /> Start
              </Button>
              <Button variant="glass" size="sm" onClick={() => toast(`${s.name} stopped`)}>
                <Square className="size-3.5" /> Stop
              </Button>
              <Button variant="glass" size="sm" onClick={() => toast.success(`Rebuilding ${s.name}…`)}>
                <RotateCw className="size-3.5" /> Rebuild
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
