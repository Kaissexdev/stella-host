import { createFileRoute } from "@tanstack/react-router";
import { Users, Server, Rocket, ShieldAlert, Ban } from "lucide-react";
import { toast } from "sonner";
import {
  PageHeader,
  StatCard,
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminOverview, useAdminUsers, useBanUser } from "@/lib/api/queries";
import { useAuth } from "@/lib/auth";
import { relativeTime, severityTone, titleCase } from "@/lib/api/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/admin")({
  head: () => ({ meta: [{ title: "Admin · Stella Hosting" }] }),
  component: AdminPage,
});

const userStatusTone: Record<string, string> = {
  ACTIVE: "text-success",
  BANNED: "text-destructive",
  SUSPENDED: "text-warning",
};

function AdminPage() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const overview = useAdminOverview();
  const users = useAdminUsers();
  const ban = useBanUser();

  if (authLoading) return <LoadingState />;
  if (!isAdmin) {
    return (
      <EmptyState
        title="Administrator access required"
        description="You don't have permission to view the admin panel."
        icon={ShieldAlert}
      />
    );
  }

  const o = overview.data;

  const act = (userId: string, action: "ban" | "unban" | "suspend") =>
    ban.mutate(
      { userId, action },
      {
        onSuccess: () => toast.success(`User ${action}ned`),
        onError: (e) => toast.error((e as Error).message),
      },
    );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Admin Panel"
        subtitle="Full platform control."
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1 text-xs font-medium text-warning ring-1 ring-warning/25">
            <ShieldAlert className="size-3.5" /> Administrator
          </span>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={(o?.totalUsers ?? 0).toLocaleString()} icon={Users} />
        <StatCard label="Active services" value={(o?.activeServices ?? 0).toLocaleString()} icon={Server} />
        <StatCard label="Deploys today" value={String(o?.deploysToday ?? 0)} icon={Rocket} />
        <StatCard label="Threats blocked" value={String(o?.threatsBlocked ?? 0)} icon={ShieldAlert} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <h3 className="mb-4 font-semibold">User management</h3>
          {users.isLoading ? (
            <LoadingState />
          ) : users.isError ? (
            <ErrorState message={(users.error as Error)?.message} />
          ) : users.data && users.data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.data.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="font-medium">{u.username}</div>
                        <div className="text-xs text-muted-foreground">{u.email ?? "—"}</div>
                      </TableCell>
                      <TableCell>
                        {u._count?.services ?? 0}/{u.serviceLimit}
                      </TableCell>
                      <TableCell className="text-xs">{titleCase(u.role)}</TableCell>
                      <TableCell className={cn("capitalize", userStatusTone[u.status])}>
                        {u.status.toLowerCase()}
                      </TableCell>
                      <TableCell className="text-right">
                        {u.status === "ACTIVE" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={ban.isPending || u.role === "ADMIN"}
                            onClick={() => act(u.id, "ban")}
                          >
                            <Ban className="size-3.5" /> Ban
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={ban.isPending}
                            onClick={() => act(u.id, "unban")}
                          >
                            Unban
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState title="No users found" />
          )}
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="mb-4 font-semibold">Open abuse flags</h3>
          {overview.isLoading ? (
            <LoadingState />
          ) : o && o.flagged.length > 0 ? (
            <div className="space-y-2">
              {o.flagged.map((f) => (
                <div key={f.id} className="rounded-xl bg-secondary/40 p-3">
                  <div className="text-sm font-medium">{f.user?.username ?? "user"}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{f.reason}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    score {f.score} · {relativeTime(f.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No open flags.</p>
          )}
        </div>
      </div>

      <div className="mt-4 glass rounded-2xl p-5">
        <h3 className="mb-4 font-semibold">Recent security events</h3>
        {overview.isLoading ? (
          <LoadingState />
        ) : o && o.recentEvents.length > 0 ? (
          <div className="space-y-2">
            {o.recentEvents.map((e) => (
              <div
                key={e.id}
                className="flex items-start justify-between gap-3 rounded-xl bg-secondary/40 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1",
                        severityTone(e.severity),
                      )}
                    >
                      {e.severity.toLowerCase()}
                    </span>
                    <span className="text-sm font-medium">{titleCase(e.type)}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {e.message}
                    {e.ip ? ` · ${e.ip}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {relativeTime(e.createdAt)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No recent events.</p>
        )}
      </div>
    </div>
  );
}
