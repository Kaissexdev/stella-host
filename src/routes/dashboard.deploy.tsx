import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Github, Plus, Trash2, Rocket } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/dashboard/deploy")({
  head: () => ({ meta: [{ title: "Deploy · Stella Hosting" }] }),
  component: DeployPage,
});

const repos = ["stella-labs/aurora-api", "stella-labs/nova-web", "stella-labs/pulsar-worker", "octocat/hello-world"];

function DeployPage() {
  const [envs, setEnvs] = useState([{ key: "", value: "" }]);

  const onDeploy = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Deployment started — provisioning isolated container…");
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="New deployment" subtitle="Deploy a project directly from a GitHub repository." />

      <form onSubmit={onDeploy} className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="glass rounded-2xl p-6">
            <h3 className="mb-4 flex items-center gap-2 font-semibold"><Github className="size-4" /> Source</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>GitHub repository</Label>
                <Select defaultValue={repos[0]}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {repos.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Input defaultValue="main" />
                </div>
                <div className="space-y-2">
                  <Label>Project name</Label>
                  <Input placeholder="my-awesome-app" required />
                </div>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="mb-4 font-semibold">Build & run</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Build command</Label>
                <Input defaultValue="npm install && npm run build" className="font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label>Run / start command</Label>
                <Input defaultValue="npm start" className="font-mono text-sm" />
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Environment variables</h3>
              <Button type="button" variant="glass" size="sm" onClick={() => setEnvs([...envs, { key: "", value: "" }])}>
                <Plus className="size-3.5" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {envs.map((_, i) => (
                <div key={i} className="flex gap-2">
                  <Input placeholder="KEY" className="font-mono text-sm" />
                  <Input placeholder="value" className="font-mono text-sm" />
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
            <Button type="submit" variant="hero" size="lg" className="mt-5 w-full">
              <Rocket className="size-4" /> Deploy project
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">Uses 1 of your 5 hosting slots</p>
          </div>
        </div>
      </form>
    </div>
  );
}
