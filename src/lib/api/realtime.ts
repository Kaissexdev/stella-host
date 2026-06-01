// Realtime updates over Socket.IO. Connects to the self-hosted backend using
// the same cookie session as the REST API and invalidates the matching React
// Query caches so deployment status, logs, services and security events update
// live on the dashboard.

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "./client";
import type { Deployment } from "./types";

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io(API_BASE_URL || undefined, {
      path: "/realtime",
      withCredentials: true,
      autoConnect: true,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function useRealtime(enabled: boolean) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    const s = getSocket();
    if (!s.connected) s.connect();

    const invalidateDeployments = (payload: Deployment) => {
      qc.invalidateQueries({ queryKey: ["deployments"] });
      qc.invalidateQueries({ queryKey: ["services"] });
      if (payload?.id) {
        qc.invalidateQueries({ queryKey: ["deployments", payload.id, "logs"] });
      }
    };

    const onLog = (payload: { deploymentId?: string }) => {
      if (payload?.deploymentId) {
        qc.invalidateQueries({ queryKey: ["deployments", payload.deploymentId, "logs"] });
      }
      qc.invalidateQueries({ queryKey: ["deployments"] });
    };

    const onService = () => qc.invalidateQueries({ queryKey: ["services"] });

    const onSecurity = () => {
      qc.invalidateQueries({ queryKey: ["security"] });
      qc.invalidateQueries({ queryKey: ["admin"] });
    };

    s.on("deployment.created", invalidateDeployments);
    s.on("deployment.updated", invalidateDeployments);
    s.on("deployment.log", onLog);
    s.on("service.updated", onService);
    s.on("security.event", onSecurity);

    return () => {
      s.off("deployment.created", invalidateDeployments);
      s.off("deployment.updated", invalidateDeployments);
      s.off("deployment.log", onLog);
      s.off("service.updated", onService);
      s.off("security.event", onSecurity);
    };
  }, [enabled, qc]);
}

export function disconnectRealtime() {
  if (socket?.connected) socket.disconnect();
}
