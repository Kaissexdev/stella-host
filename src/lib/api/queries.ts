// React Query hooks for every backend resource. Loaders/components read real
// data from the self-hosted REST API — no mock data anywhere.

import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "./client";
import type {
  AdminOverview,
  AdminUser,
  Deployment,
  DeploymentLog,
  LoginEvent,
  SecurityLog,
  Service,
  SessionInfo,
  Ticket,
  TicketMessage,
} from "./types";

// ---------------------------------------------------------------- Services
export const servicesQuery = () =>
  queryOptions({
    queryKey: ["services"],
    queryFn: () => api.get<Service[]>("/api/services"),
  });

export const serviceQuery = (id: string) =>
  queryOptions({
    queryKey: ["services", id],
    queryFn: () => api.get<Service>(`/api/services/${id}`),
  });

export function useServices() {
  return useQuery(servicesQuery());
}

export interface CreateServiceInput {
  name: string;
  repoFullName: string;
  branch?: string;
  type?: string;
  region?: string;
  plan?: string;
  buildCommand?: string;
  startCommand?: string;
  autoDeploy?: boolean;
  envVars?: { key: string; value: string }[];
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateServiceInput) => api.post<Service>("/api/services", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del<{ ok: true }>(`/api/services/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }),
  });
}

// ---------------------------------------------------------------- Deployments
export const deploymentsQuery = (serviceId?: string) =>
  queryOptions({
    queryKey: ["deployments", serviceId ?? "all"],
    queryFn: () =>
      api.get<Deployment[]>(
        `/api/deployments${serviceId ? `?serviceId=${encodeURIComponent(serviceId)}` : ""}`,
      ),
  });

export const deploymentLogsQuery = (id: string) =>
  queryOptions({
    queryKey: ["deployments", id, "logs"],
    queryFn: () => api.get<DeploymentLog[]>(`/api/deployments/${id}/logs`),
  });

export function useDeployments(serviceId?: string) {
  return useQuery(deploymentsQuery(serviceId));
}

export function useTriggerDeployment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { serviceId: string; branch?: string }) =>
      api.post<Deployment>("/api/deployments", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deployments"] });
      qc.invalidateQueries({ queryKey: ["services"] });
    },
  });
}

export function useCancelDeployment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Deployment>(`/api/deployments/${id}/cancel`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deployments"] }),
  });
}

// ---------------------------------------------------------------- Security
export const securityEventsQuery = () =>
  queryOptions({
    queryKey: ["security", "events"],
    queryFn: () => api.get<SecurityLog[]>("/api/security/events"),
  });

export const loginsQuery = () =>
  queryOptions({
    queryKey: ["security", "logins"],
    queryFn: () => api.get<LoginEvent[]>("/api/security/logins"),
  });

export const sessionsQuery = () =>
  queryOptions({
    queryKey: ["security", "sessions"],
    queryFn: () => api.get<SessionInfo[]>("/api/security/sessions"),
  });

export function useSecurityEvents() {
  return useQuery(securityEventsQuery());
}
export function useLogins() {
  return useQuery(loginsQuery());
}
export function useSessions() {
  return useQuery(sessionsQuery());
}

// ---------------------------------------------------------------- Tickets
export const ticketsQuery = () =>
  queryOptions({
    queryKey: ["tickets"],
    queryFn: () => api.get<Ticket[]>("/api/tickets"),
  });

export function useTickets() {
  return useQuery(ticketsQuery());
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { subject: string; body: string; priority?: string }) =>
      api.post<Ticket>("/api/tickets", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tickets"] }),
  });
}

export function useReplyTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; body: string }) =>
      api.post<TicketMessage>(`/api/tickets/${input.id}/reply`, { body: input.body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tickets"] }),
  });
}

export function useCloseTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Ticket>(`/api/tickets/${id}/close`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tickets"] }),
  });
}

// ---------------------------------------------------------------- Admin
export const adminOverviewQuery = () =>
  queryOptions({
    queryKey: ["admin", "overview"],
    queryFn: () => api.get<AdminOverview>("/api/security/admin/overview"),
  });

export const adminUsersQuery = () =>
  queryOptions({
    queryKey: ["admin", "users"],
    queryFn: () => api.get<AdminUser[]>("/api/security/admin/users"),
  });

export function useAdminOverview() {
  return useQuery(adminOverviewQuery());
}
export function useAdminUsers() {
  return useQuery(adminUsersQuery());
}

export function useBanUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { userId: string; action: "ban" | "unban" | "suspend" }) =>
      api.post<AdminUser>("/api/security/admin/users/ban", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
  });
}

export function useBlockIp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { ip: string; reason?: string }) =>
      api.post("/api/security/admin/block-ip", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
  });
}
