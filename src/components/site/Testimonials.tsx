import { Star } from "lucide-react";

const testimonials = [
  { name: "Maya Chen", role: "Founder, Novaweb", quote: "We migrated 12 services to Stella in an afternoon. Deploys went from minutes to seconds and the dashboard is genuinely a joy to use.", avatar: "MC" },
  { name: "Daniel Roy", role: "CTO, Pulsar Labs", quote: "The built-in malware scanning caught a compromised dependency before it ever hit production. That alone paid for the year.", avatar: "DR" },
  { name: "Priya Nair", role: "Indie developer", quote: "GitHub push, container live, SSL handled. I haven't touched a server config since switching to Stella Hosting.", avatar: "PN" },
  { name: "Tom Baker", role: "Lead Eng, Comet", quote: "Real-time logs and the console make debugging deployments trivial. The isolation gives us total confidence.", avatar: "TB" },
  { name: "Sofia Almeida", role: "DevOps, Aurora", quote: "Backups, custom domains, team roles — everything we needed in one place, wrapped in a beautiful UI.", avatar: "SA" },
  { name: "Liam O'Brien", role: "Solo SaaS", quote: "The free tier got me started, and scaling up was one click. Best hosting experience I've had, period.", avatar: "LO" },
];

function Card({ t }: { t: (typeof testimonials)[number] }) {
  return (
    <figure className="glass w-[340px] shrink-0 rounded-2xl p-6">
      <div className="flex gap-0.5 text-primary">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="size-4 fill-current" />
        ))}
      </div>
      <blockquote className="mt-4 text-sm text-foreground/90">"{t.quote}"</blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground">
          {t.avatar}
        </span>
        <span>
          <span className="block text-sm font-semibold">{t.name}</span>
          <span className="block text-xs text-muted-foreground">{t.role}</span>
        </span>
      </figcaption>
    </figure>
  );
}

export function Testimonials() {
  const row = [...testimonials, ...testimonials];
  return (
    <section id="testimonials" className="relative overflow-hidden py-24">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <span className="text-sm font-semibold uppercase tracking-widest text-primary">Loved by builders</span>
        <h2 className="mt-3 text-3xl font-bold sm:text-4xl md:text-5xl">
          Trusted by <span className="text-gradient">thousands of developers</span>
        </h2>
      </div>

      <div className="relative mt-14">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />
        <div className="flex w-max gap-4 animate-marquee hover:[animation-play-state:paused]">
          {row.map((t, i) => (
            <Card key={i} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
