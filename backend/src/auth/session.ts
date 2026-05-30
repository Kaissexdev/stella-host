import type { Response } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { env, isProd } from "../config/env.js";
import { randomToken, sha256 } from "../lib/crypto.js";

export const SESSION_COOKIE = "stella_session";

type SessionWithUser = Prisma.SessionGetPayload<{ include: { user: true } }>;

const ttlMs = () => env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

// Creates a session row (token stored hashed) and returns the plaintext token
// that is set as an httpOnly cookie.
export async function createSession(params: {
  userId: string;
  ip?: string | null;
  userAgent?: string | null;
  deviceFingerprint?: string | null;
}): Promise<string> {
  const token = randomToken();
  await prisma.session.create({
    data: {
      userId: params.userId,
      tokenHash: sha256(token),
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
      deviceFingerprint: params.deviceFingerprint ?? null,
      expiresAt: new Date(Date.now() + ttlMs()),
    },
  });
  return token;
}

// Resolves an active (non-revoked, non-expired) session and its user. Returns
// null for banned users so the cookie is effectively dead.
export async function getSessionFromToken(token: string): Promise<SessionWithUser | null> {
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt.getTime() < Date.now()) return null;
  if (session.user.status === "BANNED") return null;

  // Sliding last-seen update (fire and forget).
  prisma.session
    .update({ where: { id: session.id }, data: { lastSeenAt: new Date() } })
    .catch(() => undefined);

  return session;
}

export async function revokeSession(token: string): Promise<void> {
  if (!token) return;
  await prisma.session
    .updateMany({ where: { tokenHash: sha256(token) }, data: { revokedAt: new Date() } })
    .catch(() => undefined);
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    domain: env.COOKIE_DOMAIN || undefined,
    maxAge: ttlMs(),
    path: "/",
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, {
    domain: env.COOKIE_DOMAIN || undefined,
    path: "/",
  });
}
