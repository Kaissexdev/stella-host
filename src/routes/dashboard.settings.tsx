import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Github, KeyRound, Bell, User as UserIcon, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";
import { useRegenerateApiKey, useUpdateProfile } from "@/lib/api/queries";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "Settings · Stella Hosting" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, isLoading } = useAuth();
  const updateProfile = useUpdateProfile();
  const regenerateKey = useRegenerateApiKey();

  const [name, setName] = useState(user?.name ?? "");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  if (isLoading || !user) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const initial = (user.name ?? user.username ?? "?").charAt(0).toUpperCase();
  const displayKey =
    revealedKey ?? user.apiKeyMasked ?? "No API key generated yet";

  const handleSaveProfile = () => {
    updateProfile.mutate(
      { name: name.trim() || null },
      {
        onSuccess: () => toast.success("Profile updated"),
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  const toggleNotification = (
    field: "notifyDeploys" | "notifySecurity" | "notifyTelegram",
    value: boolean,
  ) => {
    updateProfile.mutate(
      { [field]: value },
      { onError: (e) => toast.error((e as Error).message) },
    );
  };

  const handleRegenerate = () => {
    regenerateKey.mutate(undefined, {
      onSuccess: (data) => {
        setRevealedKey(data.apiKey);
        toast.success("New API key generated — copy it now, it won't be shown again.");
      },
      onError: (e) => toast.error((e as Error).message),
    });
  };

  const handleCopy = () => {
    const value = revealedKey ?? user.apiKeyMasked;
    if (!value || (!revealedKey && !user.hasApiKey)) {
      toast.error("Generate an API key first");
      return;
    }
    navigator.clipboard.writeText(value);
    toast.success("API key copied");
  };

  return (
    <div className="animate-fade-in max-w-3xl">
      <PageHeader title="Settings" subtitle="Manage your account, integrations and API access." />

      <div className="space-y-4">
        {/* Connected account */}
        <div className="glass rounded-2xl p-6">
          <h3 className="flex items-center gap-2 font-semibold">
            <Github className="size-4" /> Connected account
          </h3>
          <div className="mt-4 flex items-center gap-3">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="size-10 rounded-full object-cover"
              />
            ) : (
              <span className="grid size-10 place-items-center rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground">
                {initial}
              </span>
            )}
            <div>
              <div className="text-sm font-medium">{user.username}</div>
              <div className="text-xs text-muted-foreground">
                GitHub OAuth{user.email ? ` · ${user.email}` : ""}
              </div>
            </div>
          </div>
        </div>

        {/* Profile */}
        <div className="glass rounded-2xl p-6">
          <h3 className="flex items-center gap-2 font-semibold">
            <UserIcon className="size-4" /> Profile
          </h3>
          <div className="mt-4 space-y-2">
            <Label htmlFor="display-name">Display name</Label>
            <div className="flex gap-2">
              <Input
                id="display-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={user.username}
              />
              <Button
                variant="hero"
                onClick={handleSaveProfile}
                disabled={updateProfile.isPending || name.trim() === (user.name ?? "")}
              >
                {updateProfile.isPending ? <Loader2 className="size-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </div>

        {/* API key */}
        <div className="glass rounded-2xl p-6">
          <h3 className="flex items-center gap-2 font-semibold">
            <KeyRound className="size-4" /> API key
          </h3>
          <div className="mt-4 flex gap-2">
            <Input readOnly value={displayKey} className="font-mono text-sm" />
            <Button variant="glass" onClick={handleCopy} disabled={!user.hasApiKey && !revealedKey}>
              <Copy className="size-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={handleRegenerate}
            disabled={regenerateKey.isPending}
          >
            {regenerateKey.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : user.hasApiKey ? (
              "Regenerate key"
            ) : (
              "Generate key"
            )}
          </Button>
        </div>

        {/* Notifications */}
        <div className="glass rounded-2xl p-6">
          <h3 className="flex items-center gap-2 font-semibold">
            <Bell className="size-4" /> Notifications
          </h3>
          <div className="mt-4 space-y-4">
            {([
              { l: "Deployment alerts", d: "Notify on successful or failed deploys", field: "notifyDeploys" as const },
              { l: "Security alerts", d: "Notify when threats are blocked", field: "notifySecurity" as const },
              { l: "Telegram integration", d: "Send alerts to your Telegram", field: "notifyTelegram" as const },
            ]).map((row, i, arr) => (
              <div key={row.field}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{row.l}</div>
                    <div className="text-xs text-muted-foreground">{row.d}</div>
                  </div>
                  <Switch
                    checked={user[row.field]}
                    disabled={updateProfile.isPending}
                    onCheckedChange={(v) => toggleNotification(row.field, v)}
                  />
                </div>
                {i < arr.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
