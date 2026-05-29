import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  to = "/",
}: {
  className?: string;
  to?: string;
}) {
  return (
    <Link to={to} className={cn("group flex items-center gap-2.5", className)}>
      <span className="relative grid size-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-[var(--glow)]">
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
          <path d="M12 2l2.39 6.96L21.5 9.2l-5.6 4.3 2.02 7.0L12 16.9 6.08 20.5l2.02-7L2.5 9.2l7.11-.24L12 2z" />
        </svg>
        <span className="absolute inset-0 rounded-xl animate-pulse-glow bg-primary/20 blur-md -z-10" />
      </span>
      <span className="text-lg font-semibold tracking-tight">
        Stella<span className="text-gradient"> Hosting</span>
      </span>
    </Link>
  );
}
