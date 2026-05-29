import { useState } from "react";
import { Send, Mail, MessageCircle, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const channels = [
  { icon: Mail, label: "Email", value: "hello@stella.app" },
  { icon: MessageCircle, label: "Telegram", value: "@StellaHosting" },
  { icon: MapPin, label: "HQ", value: "Berlin · Frankfurt · NYC" },
];

export function Contact() {
  const [sending, setSending] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success("Message sent — we'll get back to you within a few hours.");
      (e.target as HTMLFormElement).reset();
    }, 800);
  };

  return (
    <section id="contact" className="relative py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="glass overflow-hidden rounded-3xl">
          <div className="grid md:grid-cols-2">
            <div className="relative bg-primary/[0.06] p-8 sm:p-10">
              <span className="text-sm font-semibold uppercase tracking-widest text-primary">Contact</span>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                Let's get you <span className="text-gradient">launched</span>
              </h2>
              <p className="mt-4 text-sm text-muted-foreground">
                Questions about migrating, enterprise plans, or security? Our team replies fast.
              </p>
              <div className="mt-8 space-y-5">
                {channels.map((c) => (
                  <div key={c.label} className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                      <c.icon className="size-5" />
                    </span>
                    <span>
                      <span className="block text-xs text-muted-foreground">{c.label}</span>
                      <span className="block text-sm font-medium">{c.value}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4 p-8 sm:p-10">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" required placeholder="Ada Lovelace" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required placeholder="you@company.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" required placeholder="How can we help?" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" required rows={5} placeholder="Tell us about your project…" />
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={sending}>
                {sending ? "Sending…" : (<>Send message <Send className="size-4" /></>)}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
