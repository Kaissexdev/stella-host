import { createFileRoute } from "@tanstack/react-router";
import { Github, KeyRound, Bell, Globe, Copy } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "Settings · Stella Hosting" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="animate-fade-in max-w-3xl">
      <PageHeader title="Settings" subtitle="Manage your account, integrations and API access." />

      <div className="space-y-4">
        <div className="glass rounded-2xl p-6">
          <h3 className="flex items-center gap-2 font-semibold"><Github className="size-4" /> Connected account</h3>
          <div className="mt-4 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground">O</span>
            <div>
              <div className="text-sm font-medium">octocat</div>
              <div className="text-xs text-muted-foreground">GitHub OAuth · octocat@github.com</div>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="flex items-center gap-2 font-semibold"><KeyRound className="size-4" /> API key</h3>
          <div className="mt-4 flex gap-2">
            <Input readOnly value="stella_sk_•••••••••••••••••3f9a" className="font-mono text-sm" />
            <Button variant="glass" onClick={() => toast.success("API key copied")}><Copy className="size-4" /></Button>
          </div>
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => toast.success("New API key generated")}>Regenerate key</Button>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="flex items-center gap-2 font-semibold"><Bell className="size-4" /> Notifications</h3>
          <div className="mt-4 space-y-4">
            {[
              { l: "Deployment alerts", d: "Notify on successful or failed deploys" },
              { l: "Security alerts", d: "Notify when threats are blocked" },
              { l: "Telegram integration", d: "Send alerts to your Telegram" },
            ].map((row, i) => (
              <div key={row.l}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{row.l}</div>
                    <div className="text-xs text-muted-foreground">{row.d}</div>
                  </div>
                  <Switch defaultChecked={i < 2} />
                </div>
                {i < 2 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="flex items-center gap-2 font-semibold"><Globe className="size-4" /> Custom domain</h3>
          <div className="mt-4 space-y-2">
            <Label>Domain</Label>
            <div className="flex gap-2">
              <Input placeholder="app.yourdomain.com" />
              <Button variant="hero" onClick={() => toast.success("Domain verification started")}>Add</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
