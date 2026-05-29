// Mock data powering the Stella Hosting dashboard demo experience.

export type ServiceStatus = "running" | "stopped" | "building" | "suspended" | "error";

export interface Service {
  id: string;
  name: string;
  repo: string;
  branch: string;
  status: ServiceStatus;
  region: string;
  domain: string;
  framework: string;
  cpu: number; // percent
  memory: number; // percent
  lastDeploy: string;
  buildCommand: string;
  startCommand: string;
}

export const services: Service[] = [
  {
    id: "svc_aurora",
    name: "aurora-api",
    repo: "stella-labs/aurora-api",
    branch: "main",
    status: "running",
    region: "Frankfurt (eu-central)",
    domain: "aurora-api.stella.app",
    framework: "Node.js",
    cpu: 34,
    memory: 58,
    lastDeploy: "12 min ago",
    buildCommand: "npm install && npm run build",
    startCommand: "node dist/server.js",
  },
  {
    id: "svc_nova",
    name: "nova-web",
    repo: "stella-labs/nova-web",
    branch: "production",
    status: "running",
    region: "New York (us-east)",
    domain: "novaweb.io",
    framework: "Next.js",
    cpu: 21,
    memory: 41,
    lastDeploy: "1 hour ago",
    buildCommand: "pnpm install && pnpm build",
    startCommand: "pnpm start",
  },
  {
    id: "svc_pulsar",
    name: "pulsar-worker",
    repo: "stella-labs/pulsar-worker",
    branch: "main",
    status: "building",
    region: "Singapore (ap-south)",
    domain: "—",
    framework: "Python",
    cpu: 12,
    memory: 27,
    lastDeploy: "deploying…",
    buildCommand: "pip install -r requirements.txt",
    startCommand: "python worker.py",
  },
  {
    id: "svc_comet",
    name: "comet-bot",
    repo: "stella-labs/comet-bot",
    branch: "main",
    status: "stopped",
    region: "Frankfurt (eu-central)",
    domain: "—",
    framework: "Go",
    cpu: 0,
    memory: 0,
    lastDeploy: "2 days ago",
    buildCommand: "go build -o app .",
    startCommand: "./app",
  },
];

export const usageSeries = [
  { t: "00:00", cpu: 22, mem: 40, net: 18 },
  { t: "04:00", cpu: 30, mem: 44, net: 25 },
  { t: "08:00", cpu: 48, mem: 55, net: 42 },
  { t: "12:00", cpu: 65, mem: 62, net: 58 },
  { t: "16:00", cpu: 52, mem: 60, net: 49 },
  { t: "20:00", cpu: 38, mem: 51, net: 33 },
  { t: "Now", cpu: 34, mem: 58, net: 29 },
];

export const requestsSeries = [
  { d: "Mon", reqs: 12400 },
  { d: "Tue", reqs: 16800 },
  { d: "Wed", reqs: 15200 },
  { d: "Thu", reqs: 21000 },
  { d: "Fri", reqs: 24800 },
  { d: "Sat", reqs: 18600 },
  { d: "Sun", reqs: 20400 },
];

export interface DeployRecord {
  id: string;
  service: string;
  commit: string;
  message: string;
  status: "success" | "failed" | "building";
  duration: string;
  when: string;
}

export const deployments: DeployRecord[] = [
  { id: "d1", service: "aurora-api", commit: "a1f9c2e", message: "feat: add rate limiting", status: "success", duration: "48s", when: "12 min ago" },
  { id: "d2", service: "nova-web", commit: "9b3de01", message: "fix: hydration mismatch", status: "success", duration: "1m 12s", when: "1 hour ago" },
  { id: "d3", service: "pulsar-worker", commit: "c7a44f8", message: "chore: bump deps", status: "building", duration: "—", when: "now" },
  { id: "d4", service: "aurora-api", commit: "5e2b9a0", message: "refactor: db pool", status: "failed", duration: "22s", when: "3 hours ago" },
  { id: "d5", service: "nova-web", commit: "1c0fa3d", message: "feat: dark mode", status: "success", duration: "58s", when: "yesterday" },
];

export const consoleLines: string[] = [
  "[stella] Starting build for aurora-api (main @ a1f9c2e)",
  "[stella] Pulling base image node:20-alpine ...",
  "[scan]   Running malware & integrity scan ... clean ✓",
  "[scan]   No crypto miners / reverse shells detected ✓",
  "[build]  npm install — 412 packages added in 9.4s",
  "[build]  npm run build — compiled successfully",
  "[deploy] Provisioning isolated container (cpu: 1 vCPU, mem: 512MB)",
  "[deploy] Health check passed on :3000 ✓",
  "[deploy] Routing aurora-api.stella.app → container 4f8a (SSL active)",
  "[stella] Deployment live in 48s 🚀",
];

export interface SecurityEvent {
  id: string;
  level: "info" | "warning" | "blocked";
  title: string;
  detail: string;
  when: string;
}

export const securityEvents: SecurityEvent[] = [
  { id: "s1", level: "blocked", title: "Crypto miner blocked", detail: "xmrig signature in build artifact — service quarantined", when: "2h ago" },
  { id: "s2", level: "blocked", title: "Reverse shell attempt", detail: "outbound nc to 51.x.x.x:4444 denied by egress policy", when: "5h ago" },
  { id: "s3", level: "warning", title: "Dangerous command", detail: "`rm -rf /` intercepted in start command", when: "1d ago" },
  { id: "s4", level: "info", title: "Scan complete", detail: "All 5 active services passed integrity scan", when: "1d ago" },
];

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  services: number;
  status: "active" | "banned" | "suspended";
  ip: string;
  device: string;
  joined: string;
}

export const adminUsers: AdminUser[] = [
  { id: "u1", username: "octocat", email: "octocat@github.com", services: 3, status: "active", ip: "92.14.88.21", device: "macOS · Chrome", joined: "Mar 2025" },
  { id: "u2", username: "linus", email: "linus@kernel.org", services: 5, status: "active", ip: "188.43.2.10", device: "Linux · Firefox", joined: "Jan 2025" },
  { id: "u3", username: "miner_x", email: "miner@temp.io", services: 1, status: "banned", ip: "51.222.9.4", device: "Linux · curl", joined: "May 2026" },
  { id: "u4", username: "devjane", email: "jane@dev.io", services: 2, status: "active", ip: "77.91.33.7", device: "Windows · Edge", joined: "Feb 2025" },
  { id: "u5", username: "spambot", email: "x@x.x", services: 0, status: "suspended", ip: "51.222.9.4", device: "Linux · curl", joined: "May 2026" },
];

export interface LoginRecord {
  id: string;
  user: string;
  ip: string;
  location: string;
  device: string;
  when: string;
  flagged: boolean;
}

export const loginHistory: LoginRecord[] = [
  { id: "l1", user: "octocat", ip: "92.14.88.21", location: "Berlin, DE", device: "macOS · Chrome", when: "2 min ago", flagged: false },
  { id: "l2", user: "linus", ip: "188.43.2.10", location: "Helsinki, FI", device: "Linux · Firefox", when: "1 hour ago", flagged: false },
  { id: "l3", user: "miner_x", ip: "51.222.9.4", location: "Unknown (VPN)", device: "Linux · curl", when: "5 hours ago", flagged: true },
  { id: "l4", user: "spambot", ip: "51.222.9.4", location: "Unknown (VPN)", device: "Linux · curl", when: "5 hours ago", flagged: true },
];

export interface Ticket {
  id: string;
  subject: string;
  user: string;
  priority: "low" | "medium" | "high";
  status: "open" | "pending" | "closed";
  updated: string;
}

export const tickets: Ticket[] = [
  { id: "T-1042", subject: "Custom domain not resolving", user: "devjane", priority: "high", status: "open", updated: "10 min ago" },
  { id: "T-1041", subject: "Increase memory on nova-web", user: "octocat", priority: "medium", status: "pending", updated: "1 hour ago" },
  { id: "T-1039", subject: "Billing question", user: "linus", priority: "low", status: "closed", updated: "yesterday" },
];

export const adminStats = {
  totalUsers: 1284,
  activeServices: 3120,
  deploysToday: 482,
  threatsBlocked: 37,
};
