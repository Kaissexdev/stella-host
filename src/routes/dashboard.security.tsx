import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, ShieldAlert, KeyRound, Monitor } from "lucide-react";
import {
  PageHeader,
  StatCard,
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/dashboard/widgets";
import { useSecurityEvents, useLogins, useSessions } from "@/lib/api/queries";
import { relativeTime, severityTone, titleCase } from "@/lib/api/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/security")({
  head: () => ({ meta: [{ title: "Security · Stella Hosting" }] }),
  component: SecurityPage,
});

function SecurityPage() {
  const events = useSecurityEvents();
  const logins = useLogins();
  const sessions = useSessions();

  const blocked =
    events.data?.filter((e) => ["HIGH", "CRITICAL"].includes(e.severity)).length ?? 0;
  const flaggedLogins = logins.data?.filter((l) => l.flagged).length ?? 0;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Security" subtitle="Account activity, sessions and threat events." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Security events" value={String(events.data?.length ?? 0)} icon={ShieldAlert} />
        <StatCard label="High severity" value={String(blocked)} icon={ShieldCheck} />
        <StatCard label="Active sessions" value={String(sessions.data?.length ?? 0)} icon={Monitor} />
        <StatCard label="Flagged logins" value={String(flaggedLogins)} icon={KeyRound} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <h3 className="mb-4 font-semibold">Security event log</h3>
          {events.isLoading ? (
            <LoadingState />
          ) : events.isError ? (
            <ErrorState message={(events.error as Error)?.message} />
          ) : events.data && events.data.length > 0 ? (
            <div className="space-y-2">
              {events.data.map((e) => (
                <div
                  key={e.id}
                  className="flex items-start justify-between gap-3 rounded-xl bg-secondary/40 px-3 py-3"
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
                    <p className="mt-1 truncate text-xs text-muted-foreground">{e.message}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {relativeTime(e.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No security events" description="Your account activity is clean." />
          )}
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="mb-4 font-semibold">Active sessions</h3>
          {sessions.isLoading ? (
            <LoadingState />
          ) : sessions.data && sessions.data.length > 0 ? (
            <ul className="space-y-3 text-sm">
              {sessions.data.map((s) => (
                <li key={s.id} className="rounded-xl bg-secondary/40 p-3">
                  <div className="font-mono text-xs">{s.ip ?? "unknown IP"}</div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">
                    {s.userAgent ?? "Unknown device"}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Last seen {relativeTime(s.lastSeenAt)}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No active sessions.</p>
          )}
        </div>
      </div>

      <div className="mt-4 glass rounded-2xl p-5">
        <h3 className="mb-4 font-semibold">Login & device history</h3>
        {logins.isLoading ? (
          <LoadingState />
        ) : logins.data && logins.data.length > 0 ? (
          <div className="space-y-2">
            {logins.data.map((l) => (
              <div
                key={l.id}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary/40 px-3 py-2.5",
                  l.flagged && "bg-destructive/5",
                )}
              >
                <div className="font-mono text-xs">{l.ip}</div>
                <div className="text-xs text-muted-foreground">{l.location ?? "Unknown"}</div>
                <div className="truncate text-xs text-muted-foreground">{l.userAgent ?? "—"}</div>
                <div className="text-xs text-muted-foreground">
                  {relativeTime(l.createdAt)}
                  {l.flagged && <span className="ml-2 text-destructive">⚠ flagged</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No login history.</p>
        )}
      </div>
    </div>
  );
}
