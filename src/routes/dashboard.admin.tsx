import { createFileRoute } from "@tanstack/react-router";
import { Users, Server, Rocket, ShieldAlert, Ban, Megaphone, Power } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, StatCard } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminStats, adminUsers, loginHistory } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/admin")({
  head: () => ({ meta: [{ title: "Admin · Stella Hosting" }] }),
  component: AdminPage,
});

const userStatus = {
  active: "text-success",
  banned: "text-destructive",
  suspended: "text-warning",
};

function AdminPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Admin Panel"
        subtitle="Signed in as RskPowerPz · full platform control."
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1 text-xs font-medium text-warning ring-1 ring-warning/25">
            <ShieldAlert className="size-3.5" /> Administrator
          </span>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={adminStats.totalUsers.toLocaleString()} icon={Users} delta="+42 this week" />
        <StatCard label="Active services" value={adminStats.activeServices.toLocaleString()} icon={Server} delta="+118" />
        <StatCard label="Deploys today" value={adminStats.deploysToday.toString()} icon={Rocket} delta="+24%" />
        <StatCard label="Threats blocked" value={adminStats.threatsBlocked.toString()} icon={ShieldAlert} delta="auto-quarantined" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <h3 className="mb-4 font-semibold">User management</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium">{u.username}</div>
                      <div className="text-xs text-muted-foreground">{u.device}</div>
                    </TableCell>
                    <TableCell>{u.services}/5</TableCell>
                    <TableCell className="font-mono text-xs">{u.ip}</TableCell>
                    <TableCell className={cn("capitalize", userStatus[u.status])}>{u.status}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toast.success(`${u.status === "banned" ? "Unbanned" : "Banned"} ${u.username}`)}
                      >
                        <Ban className="size-3.5" /> {u.status === "banned" ? "Unban" : "Ban"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-2xl p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold"><Megaphone className="size-4" /> Announcements</h3>
            <Button variant="hero" size="sm" className="w-full" onClick={() => toast.success("Announcement published")}>
              Publish announcement
            </Button>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold"><Power className="size-4" /> Maintenance mode</h3>
              <Switch onCheckedChange={(v) => toast(v ? "Maintenance enabled" : "Maintenance disabled")} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Temporarily disable new deployments platform-wide.</p>
          </div>
        </div>
      </div>

      <div className="mt-4 glass rounded-2xl p-5">
        <h3 className="mb-4 font-semibold">Login & device history</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loginHistory.map((l) => (
                <TableRow key={l.id} className={cn(l.flagged && "bg-destructive/5")}>
                  <TableCell className="font-medium">{l.user}</TableCell>
                  <TableCell className="font-mono text-xs">{l.ip}</TableCell>
                  <TableCell>{l.location}</TableCell>
                  <TableCell>{l.device}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {l.when}{l.flagged && <span className="ml-2 text-destructive">⚠ flagged</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
