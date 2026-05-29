import { createFileRoute } from "@tanstack/react-router";
import { Plus, LifeBuoy } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import { tickets } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/tickets")({
  head: () => ({ meta: [{ title: "Support · Stella Hosting" }] }),
  component: TicketsPage,
});

const priority = {
  high: "bg-destructive/15 text-destructive ring-destructive/25",
  medium: "bg-warning/15 text-warning ring-warning/25",
  low: "bg-primary/15 text-primary ring-primary/25",
};
const statusColor = { open: "text-success", pending: "text-warning", closed: "text-muted-foreground" };

function TicketsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Support tickets"
        subtitle="Get help from the Stella Hosting team."
        action={
          <Button variant="hero" onClick={() => toast.success("New ticket created")}>
            <Plus className="size-4" /> New ticket
          </Button>
        }
      />
      <div className="glass rounded-2xl p-5">
        <div className="space-y-2">
          {tickets.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary/40 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"><LifeBuoy className="size-4" /></span>
                <div>
                  <div className="text-sm font-medium">{t.subject}</div>
                  <div className="text-xs text-muted-foreground">{t.id} · {t.user} · {t.updated}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1", priority[t.priority])}>{t.priority}</span>
                <span className={cn("text-xs font-medium capitalize", statusColor[t.status])}>{t.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
