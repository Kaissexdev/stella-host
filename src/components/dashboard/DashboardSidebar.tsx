import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Boxes,
  Rocket,
  ShieldCheck,
  BarChart3,
  LifeBuoy,
  Settings,
  Crown,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useServices } from "@/lib/api/queries";

export const navItems = [
  { label: "Overview", to: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Services", to: "/dashboard/services", icon: Boxes },
  { label: "Deploy", to: "/dashboard/deploy", icon: Rocket },
  { label: "Security", to: "/dashboard/security", icon: ShieldCheck },
  { label: "Analytics", to: "/dashboard/analytics", icon: BarChart3 },
  { label: "Support", to: "/dashboard/tickets", icon: LifeBuoy },
  { label: "Settings", to: "/dashboard/settings", icon: Settings },
] as const;

export function DashboardSidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, isAdmin } = useAuth();
  const { data: services } = useServices();

  const used = services?.length ?? 0;
  const limit = user?.serviceLimit ?? 5;
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar p-4 transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between">
          <Logo />
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="size-5" />
          </Button>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const active = isActive(item.to, "exact" in item ? item.exact : false);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-sidebar-primary/15 text-sidebar-primary ring-1 ring-sidebar-primary/25"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <item.icon className={cn("size-[18px]", active && "text-sidebar-primary")} />
                {item.label}
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <div className="my-3 h-px bg-sidebar-border" />
              <Link
                to="/dashboard/admin"
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  isActive("/dashboard/admin")
                    ? "bg-warning/15 text-warning ring-1 ring-warning/25"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <Crown className="size-[18px]" />
                Admin Panel
              </Link>
            </>
          )}
        </nav>

        <div className="glass rounded-2xl p-4">
          <div className="text-xs font-medium text-muted-foreground">Hosting slots</div>
          <div className="mt-1 text-lg font-bold">
            {used} <span className="text-sm font-normal text-muted-foreground">/ {limit} used</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-gradient-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <Button asChild variant="hero" size="sm" className="mt-3 w-full">
            <Link to="/dashboard/deploy">New deployment</Link>
          </Button>
        </div>
      </aside>
    </>
  );
}
