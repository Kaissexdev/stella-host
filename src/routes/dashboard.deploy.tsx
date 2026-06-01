import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Github, Plus, Trash2, Rocket } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCreateService } from "@/lib/api/queries";

export const Route = createFileRoute("/dashboard/deploy")({
  head: () => ({ meta: [{ title: "Deploy · Stella Hosting" }] }),
  component: DeployPage,
});

function DeployPage() {
  const navigate = useNavigate();
  const create = useCreateService();
  const [envs, setEnvs] = useState<{ key: string; value: string }[]>([{ key: "", value: "" }]);
  const [form, setForm] = useState({
    name: "",
    repoFullName: "",
    branch: "main",
    buildCommand: "npm install && npm run build",
    startCommand: "npm start",
    autoDeploy: true,
  });

  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const onDeploy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[\w.-]+\/[\w.-]+$/.test(form.repoFullName)) {
      toast.error("Repository must be in the form owner/repo");
      return;
    }
    create.mutate(
      {
        ...form,
        envVars: envs.filter((v) => v.key.trim().length > 0),
      },
      {
        onSuccess: () => {
          toast.success("Service created — provisioning isolated container…");
          navigate({ to: "/dashboard/services" });
        },
        onError: (err) => toast.error((err as Error).message),
      },
    );
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="New deployment" subtitle="Deploy a project directly from a GitHub repository." />

      <form onSubmit={onDeploy} className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="glass rounded-2xl p-6">
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <Github className="size-4" /> Source
            </h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>GitHub repository</Label>
                <Input
                  placeholder="owner/repository"
                  value={form.repoFullName}
                  onChange={(e) => set("repoFullName", e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Input value={form.branch} onChange={(e) => set("branch", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Project name</Label>
                  <Input
                    placeholder="my-awesome-app"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="mb-4 font-semibold">Build & run</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Build command</Label>
                <Input
                  className="font-mono text-sm"
                  value={form.buildCommand}
                  onChange={(e) => set("buildCommand", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Run / start command</Label>
                <Input
                  className="font-mono text-sm"
                  value={form.startCommand}
                  onChange={(e) => set("startCommand", e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Auto-deploy on push</Label>
                <Switch checked={form.autoDeploy} onCheckedChange={(v) => set("autoDeploy", v)} />
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Environment variables</h3>
              <Button
                type="button"
                variant="glass"
                size="sm"
                onClick={() => setEnvs([...envs, { key: "", value: "" }])}
              >
                <Plus className="size-3.5" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {envs.map((env, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="KEY"
                    className="font-mono text-sm"
                    value={env.key}
                    onChange={(e) =>
                      setEnvs(envs.map((x, idx) => (idx === i ? { ...x, key: e.target.value } : x)))
                    }
                  />
                  <Input
                    placeholder="value"
                    className="font-mono text-sm"
                    value={env.value}
                    onChange={(e) =>
                      setEnvs(envs.map((x, idx) => (idx === i ? { ...x, value: e.target.value } : x)))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setEnvs(envs.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-2xl p-6">
            <h3 className="mb-3 font-semibold">Summary</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Isolated container deployment</li>
              <li>• Automatic malware scan before launch</li>
              <li>• Free auto-renewing SSL</li>
              <li>• GitHub webhook auto-deploy on push</li>
            </ul>
            <Button type="submit" variant="hero" size="lg" className="mt-5 w-full" disabled={create.isPending}>
              <Rocket className="size-4" /> {create.isPending ? "Creating…" : "Deploy project"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
