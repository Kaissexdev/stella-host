import {
  GitBranch,
  Boxes,
  Terminal,
  FolderTree,
  ShieldCheck,
  Globe,
  Lock,
  History,
  Bell,
  KeyRound,
  Users,
  Webhook,
} from "lucide-react";

const features = [
  { icon: GitBranch, title: "GitHub-native deploys", desc: "Connect a repo, pick a branch, set build & start commands. Push to deploy automatically via webhooks." },
  { icon: Boxes, title: "Isolated containers", desc: "Every project runs in its own sandboxed container with strict egress and resource limits." },
  { icon: Terminal, title: "Real-time console & logs", desc: "Stream build output and application logs live, with full deployment history." },
  { icon: FolderTree, title: "File manager", desc: "Browse, edit and manage files in your deployment without leaving the dashboard." },
  { icon: ShieldCheck, title: "Built-in security", desc: "Automatic malware scanning blocks crypto miners, reverse shells and dangerous commands." },
  { icon: Globe, title: "Custom domains", desc: "Bring your own domain with one-click setup and automatic DNS verification." },
  { icon: Lock, title: "Automatic SSL", desc: "Free, auto-renewing TLS certificates on every domain — managed for you." },
  { icon: History, title: "Backups & restore", desc: "Scheduled snapshots with instant point-in-time restore for peace of mind." },
  { icon: KeyRound, title: "Env & secrets manager", desc: "Securely store environment variables and rotate API keys with ease." },
  { icon: Users, title: "Teams & sharing", desc: "Invite team members, share services and manage granular access roles." },
  { icon: Webhook, title: "Webhooks & API", desc: "A secure REST API and webhooks to integrate Stella into your workflow." },
  { icon: Bell, title: "Notifications center", desc: "Telegram, email and in-app alerts for deploys, incidents and security events." },
];

export function Features() {
  return (
    <section id="features" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">
            Everything you need
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl md:text-5xl">
            A complete platform to <span className="text-gradient">run anything</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            From your first push to global scale — Stella Hosting bundles deployment,
            monitoring, security and collaboration into one beautiful workspace.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="group glass hover-lift rounded-2xl p-6">
              <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 transition-colors group-hover:bg-primary/20">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
