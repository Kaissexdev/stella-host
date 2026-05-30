import { Link } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Nebula",
    price: "$0",
    period: "/mo",
    desc: "For side projects and experiments.",
    features: ["1 hosting slot", "Shared CPU · 256MB RAM", "Community support", "Auto SSL", "GitHub deploys"],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Stellar",
    price: "$19",
    period: "/mo",
    desc: "For growing apps that need power.",
    features: ["5 hosting slots", "2 vCPU · 2GB RAM", "Custom domains", "Real-time logs & console", "Backups & restore", "Priority support"],
    cta: "Go Stellar",
    highlighted: true,
  },
  {
    name: "Galaxy",
    price: "$59",
    period: "/mo",
    desc: "For teams shipping at scale.",
    features: ["5 slots + team seats", "8 vCPU · 8GB RAM", "Service sharing & roles", "Advanced security logs", "API key management", "24/7 dedicated support"],
    cta: "Contact sales",
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">Pricing</span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl md:text-5xl">
            Simple plans that <span className="text-gradient">scale with you</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every plan includes up to 5 hosting slots, isolated containers and built-in security.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={cn(
                "relative rounded-3xl p-7 hover-lift",
                p.highlighted
                  ? "glass glass-ring bg-primary/[0.06]"
                  : "glass",
              )}
            >
              {p.highlighted && (
                <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-[var(--glass-shadow)]">
                  <Sparkles className="size-3.5" /> Most popular
                </span>
              )}
              <h3 className="text-xl font-semibold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              <div className="mt-5 flex items-end gap-1">
                <span className="text-4xl font-bold">{p.price}</span>
                <span className="mb-1 text-sm text-muted-foreground">{p.period}</span>
              </div>
              <Button asChild variant={p.highlighted ? "hero" : "glass"} className="mt-6 w-full" size="lg">
                <Link to="/dashboard">{p.cta}</Link>
              </Button>
              <ul className="mt-7 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
