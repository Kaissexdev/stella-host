import type { NextFunction, Request, Response } from "express";
import { getSessionFromToken, SESSION_COOKIE } from "../auth/session.js";

// Attaches req.user from the session cookie when present. Does NOT reject —
// use requireAuth/requireRole to enforce access.
export async function attachUser(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[SESSION_COOKIE];
    if (token) {
      const session = await getSessionFromToken(token);
      if (session) {
        req.user = session.user;
        req.sessionToken = token;
      }
    }
  } catch (err) {
    console.error("[auth] attachUser", err);
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Authentication required" });
  if (req.user.status === "BANNED") return res.status(403).json({ error: "Account banned" });
  if (req.user.status === "SUSPENDED") {
    return res.status(403).json({ error: "Account suspended" });
  }
  next();
}

export function requireRole(...roles: Array<"USER" | "MODERATOR" | "ADMIN">) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}
