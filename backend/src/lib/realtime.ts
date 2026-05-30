import type { Server as HttpServer } from "node:http";
import { Server as SocketServer } from "socket.io";
import { env } from "../config/env.js";
import { redis, redisSub, REALTIME_CHANNEL } from "./redis.js";
import { getSessionFromToken } from "../auth/session.js";

// Real-time event names emitted to dashboard clients.
export type RealtimeEvent =
  | { type: "deployment.created"; userId: string; payload: unknown }
  | { type: "deployment.updated"; userId: string; payload: unknown }
  | { type: "deployment.log"; userId: string; payload: unknown }
  | { type: "service.updated"; userId: string; payload: unknown }
  | { type: "security.event"; userId: string | null; payload: unknown };

let io: SocketServer | null = null;

// Per-user rooms so each client only receives its own data; an "admin" room
// receives the full security firehose.
function userRoom(userId: string) {
  return `user:${userId}`;
}

export function initRealtime(httpServer: HttpServer) {
  io = new SocketServer(httpServer, {
    cors: { origin: env.WEB_BASE_URL, credentials: true },
    path: "/realtime",
  });

  // Authenticate sockets using the same cookie session as the REST API.
  io.use(async (socket, next) => {
    try {
      const cookie = socket.handshake.headers.cookie ?? "";
      const token = cookie
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("stella_session="))
        ?.split("=")[1];
      const session = token ? await getSessionFromToken(decodeURIComponent(token)) : null;
      if (!session) return next(new Error("unauthorized"));
      socket.data.userId = session.user.id;
      socket.data.role = session.user.role;
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    socket.join(userRoom(userId));
    if (socket.data.role === "ADMIN") socket.join("admin");
  });

  // Fan-out across instances: subscribe to Redis and re-emit locally.
  redisSub.subscribe(REALTIME_CHANNEL).catch((e) => console.error("[realtime] subscribe", e));
  redisSub.on("message", (_channel, message) => {
    try {
      const event = JSON.parse(message) as RealtimeEvent;
      dispatchLocal(event);
    } catch (e) {
      console.error("[realtime] bad message", e);
    }
  });

  return io;
}

function dispatchLocal(event: RealtimeEvent) {
  if (!io) return;
  if (event.type === "security.event") {
    io.to("admin").emit(event.type, event.payload);
    if (event.userId) io.to(userRoom(event.userId)).emit(event.type, event.payload);
    return;
  }
  io.to(userRoom(event.userId)).emit(event.type, event.payload);
}

// Publish from anywhere (route handlers, services). Goes through Redis so all
// API instances broadcast to their connected clients.
export async function emitRealtime(event: RealtimeEvent) {
  await redis.publish(REALTIME_CHANNEL, JSON.stringify(event));
}
