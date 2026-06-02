// Types mirroring the backend Prisma models / API responses.

export type Role = "USER" | "MODERATOR" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "BANNED";

export type ServiceStatus = "PROVISIONING" | "RUNNING" | "STOPPED" | "BUILDING" | "ERROR";

export type DeploymentStatus =
  | "QUEUED"
  | "BUILDING"
  | "DEPLOYING"
  | "LIVE"
  | "FAILED"
  | "CANCELLED";

export type DeploymentSource = "MANUAL" | "WEBHOOK" | "REDEPLOY";
export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";
export type LogStream = "STDOUT" | "STDERR" | "SYSTEM";
export type TicketStatus = "OPEN" | "PENDING" | "CLOSED";
export type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type Severity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface CurrentUser {
  id: string;
  username: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: Role;
  status: UserStatus;
  serviceLimit: number;
  createdAt: string;
  apiKeyMasked: string | null;
  hasApiKey: boolean;
  notifyDeploys: boolean;
  notifySecurity: boolean;
  notifyTelegram: boolean;
}

export interface ApiKeyResponse extends CurrentUser {
  apiKey: string;
}

export interface Deployment {
  id: string;
  serviceId: string;
  userId: string;
  status: DeploymentStatus;
  source: DeploymentSource;
  branch: string;
  commitSha: string | null;
  commitMessage: string | null;
  commitAuthor: string | null;
  url: string | null;
  durationMs: number | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  service?: Pick<Service, "name" | "slug" | "repoFullName">;
  logs?: DeploymentLog[];
}

export interface DeploymentLog {
  id: string;
  deploymentId: string;
  level: LogLevel;
  stream: LogStream;
  message: string;
  timestamp: string;
}

export interface EnvVar {
  id: string;
  serviceId: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  userId: string;
  name: string;
  slug: string;
  repoFullName: string;
  branch: string;
  type: string;
  region: string;
  plan: string;
  status: ServiceStatus;
  buildCommand: string;
  startCommand: string;
  autoDeploy: boolean;
  createdAt: string;
  updatedAt: string;
  deployments?: Deployment[];
  envVars?: EnvVar[];
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  userId: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  messages?: TicketMessage[];
}

export interface SecurityLog {
  id: string;
  userId: string | null;
  type: string;
  severity: Severity;
  message: string;
  ip: string | null;
  userAgent: string | null;
  deviceFingerprint: string | null;
  metadata: unknown;
  createdAt: string;
}

export interface LoginEvent {
  id: string;
  userId: string;
  ip: string;
  location: string | null;
  userAgent: string | null;
  deviceFingerprint: string | null;
  success: boolean;
  flagged: boolean;
  flagReason: string | null;
  createdAt: string;
}

export interface SessionInfo {
  id: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  lastSeenAt: string;
}

export interface AdminUser extends CurrentUser {
  createdAt: string;
  lastLoginAt: string | null;
  _count?: { services: number };
}

export interface AbuseFlag {
  id: string;
  userId: string;
  ip: string | null;
  deviceFingerprint: string | null;
  reason: string;
  score: number;
  resolved: boolean;
  createdAt: string;
  user?: { username: string };
}

export interface AdminOverview {
  totalUsers: number;
  activeServices: number;
  deploysToday: number;
  threatsBlocked: number;
  recentEvents: SecurityLog[];
  flagged: AbuseFlag[];
}
