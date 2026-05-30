import { Link } from "@tanstack/react-router";
import { Github, ArrowRight, Zap, ShieldCheck, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const stats = [
  { value: "99.99%", label: "Uptime SLA" },
  { value: "48s", label: "Avg. deploy" },
  { value: "12", label: "Global regions" },
  { value: "37k+", label: "Apps hosted" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-44 md:pb-28">
      <img
        src={heroBg}
        alt=""
        width={1920}
        height={1080}
        className="pointer-events-none absolute inset-0 size-full object-cover opacity-70"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />

      <div className="relative mx-auto max-w-7xl px-4 text-center">
        <div
          className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium animate-fade-in"
          style={{ animationDelay: "0.05s" }}
        >
          <span className="flex size-2 rounded-full bg-success animate-status-pulse" />
          New · GitHub-native deploys with isolated containers
        </div>

        <h1
          className="mx-auto max-w-4xl text-4xl font-bold leading-[1.05] sm:text-6xl md:text-7xl animate-fade-up"
        >
          Ship from GitHub to the{" "}
          <span className="text-gradient">stars</span> in seconds.
        </h1>

        <p
          className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg animate-fade-up"
          style={{ animationDelay: "0.1s" }}
        >
          Stella Hosting deploys your repositories into secure, isolated containers with
          real-time logs, custom domains, automatic SSL and built-in malware protection —
          all from one premium dashboard.
        </p>

        <div
          className="mt-9 flex flex-wrap items-center justify-center gap-3 animate-fade-up"
          style={{ animationDelay: "0.15s" }}
        >
          <Button asChild variant="hero" size="xl">
            <Link to="/dashboard">
              <Github className="size-5" /> Continue with GitHub
            </Link>
          </Button>
          <Button asChild variant="glass" size="xl">
            <a href="#features">
              Explore features <ArrowRight className="size-4" />
            </a>
          </Button>
        </div>

        <div
          className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          <span className="inline-flex items-center gap-1.5"><Zap className="size-3.5 text-primary" /> Zero-config builds</span>
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-primary" /> Malware scanning</span>
          <span className="inline-flex items-center gap-1.5"><Activity className="size-3.5 text-primary" /> Real-time monitoring</span>
        </div>

        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="glass rounded-2xl p-4 animate-fade-up"
              style={{ animationDelay: `${0.25 + i * 0.05}s` }}
            >
              <div className="text-2xl font-bold text-gradient sm:text-3xl">{s.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
