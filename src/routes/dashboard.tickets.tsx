import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, LifeBuoy } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, LoadingState, ErrorState, EmptyState } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTickets, useCreateTicket, useCloseTicket } from "@/lib/api/queries";
import { relativeTime, ticketPriorityTone, ticketStatusTone } from "@/lib/api/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/tickets")({
  head: () => ({ meta: [{ title: "Support · Stella Hosting" }] }),
  component: TicketsPage,
});

function TicketsPage() {
  const { data: tickets, isLoading, isError, error } = useTickets();
  const create = useCreateTicket();
  const close = useCloseTicket();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(
      { subject, body },
      {
        onSuccess: () => {
          toast.success("Ticket created");
          setOpen(false);
          setSubject("");
          setBody("");
        },
        onError: (err) => toast.error((err as Error).message),
      },
    );
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Support tickets"
        subtitle="Get help from the Stella Hosting team."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="hero">
                <Plus className="size-4" /> New ticket
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New support ticket</DialogTitle>
              </DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} required minLength={3} />
                </div>
                <div className="space-y-2">
                  <Label>How can we help?</Label>
                  <Textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={5} />
                </div>
                <DialogFooter>
                  <Button type="submit" variant="hero" disabled={create.isPending}>
                    Submit ticket
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState message={(error as Error)?.message} />
      ) : tickets && tickets.length > 0 ? (
        <div className="glass rounded-2xl p-5">
          <div className="space-y-2">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary/40 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <LifeBuoy className="size-4" />
                  </span>
                  <div>
                    <div className="text-sm font-medium">{t.subject}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.messages?.length ?? 0} messages · updated {relativeTime(t.updatedAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1",
                      ticketPriorityTone[t.priority],
                    )}
                  >
                    {t.priority.toLowerCase()}
                  </span>
                  <span className={cn("text-xs font-medium capitalize", ticketStatusTone[t.status])}>
                    {t.status.toLowerCase()}
                  </span>
                  {t.status !== "CLOSED" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={close.isPending}
                      onClick={() =>
                        close.mutate(t.id, {
                          onSuccess: () => toast.success("Ticket closed"),
                          onError: (err) => toast.error((err as Error).message),
                        })
                      }
                    >
                      Close
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState title="No tickets yet" description="Open a ticket and our team will help you out." />
      )}
    </div>
  );
}
