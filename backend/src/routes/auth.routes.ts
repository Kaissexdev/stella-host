import { Router } from "express";
import { z } from "zod";
import type { User } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authLimiter } from "../middleware/rate-limit.js";
import { requireAuth } from "../middleware/auth.js";
import { randomToken, sha256 } from "../lib/crypto.js";
import {
  buildAuthorizeUrl,
  exchangeCodeForToken,
  fetchGitHubUser,
} from "../auth/github.js";
import {
  clearSessionCookie,
  createSession,
  revokeSession,
  setSessionCookie,
} from "../auth/session.js";
import { env, isProd } from "../config/env.js";
import { logSecurityEvent } from "../lib/security-log.js";
import { evaluateLogin } from "../services/abuse.service.js";

const router = Router();
const OAUTH_STATE_COOKIE = "stella_oauth_state";

// Step 1 — redirect the user to GitHub with an anti-CSRF state nonce.
router.get("/github", authLimiter, (req, res) => {
  const state = randomToken(16);
  res.cookie(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 10 * 60 * 1000,
    path: "/",
  });
  res.redirect(buildAuthorizeUrl(state));
});

// Step 2 — GitHub redirects back here with a code; verify state, exchange,
// upsert the user, run abuse checks and issue a cookie session.
const callbackSchema = z.object({ code: z.string().min(1), state: z.string().min(1) });

router.get("/github/callback", authLimiter, async (req, res, next) => {
  try {
    const parsed = callbackSchema.safeParse(req.query);
    if (!parsed.success) return res.redirect(`${env.WEB_BASE_URL}/login?error=invalid_request`);

    const stateCookie = req.cookies?.[OAUTH_STATE_COOKIE];
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/" });
    if (!stateCookie || stateCookie !== parsed.data.state) {
      await logSecurityEvent(
        { type: "LOGIN_FAILED", severity: "MEDIUM", message: "OAuth state mismatch" },
        req,
      );
      return res.redirect(`${env.WEB_BASE_URL}/login?error=state_mismatch`);
    }

    const accessToken = await exchangeCodeForToken(parsed.data.code);
    const ghUser = await fetchGitHubUser(accessToken);

    const user = await prisma.user.upsert({
      where: { githubId: String(ghUser.id) },
      create: {
        githubId: String(ghUser.id),
        username: ghUser.login,
        name: ghUser.name,
        email: ghUser.email,
        avatarUrl: ghUser.avatar_url,
        lastLoginAt: new Date(),
      },
      update: {
        username: ghUser.login,
        name: ghUser.name,
        email: ghUser.email,
        avatarUrl: ghUser.avatar_url,
        lastLoginAt: new Date(),
      },
    });

    if (user.status === "BANNED") {
      await logSecurityEvent(
        { type: "PERMISSION_DENIED", severity: "HIGH", message: "Banned user login attempt", userId: user.id },
        req,
      );
      return res.redirect(`${env.WEB_BASE_URL}/login?error=banned`);
    }

    // Abuse / multi-account evaluation.
    const decision = await evaluateLogin({
      userId: user.id,
      ip: req.clientIp ?? "0.0.0.0",
      deviceFingerprint: req.deviceFingerprint ?? "unknown",
      userAgent: req.headers["user-agent"] ?? null,
    });

    await prisma.loginEvent.create({
      data: {
        userId: user.id,
        ip: req.clientIp ?? "0.0.0.0",
        location: decision.location ?? null,
        userAgent: req.headers["user-agent"] ?? null,
        deviceFingerprint: req.deviceFingerprint ?? null,
        success: !decision.blocked,
        flagged: decision.flagged,
        flagReason: decision.reason ?? null,
      },
    });

    if (decision.blocked) {
      return res.redirect(`${env.WEB_BASE_URL}/login?error=abuse_detected`);
    }

    const token = await createSession({
      userId: user.id,
      ip: req.clientIp,
      userAgent: req.headers["user-agent"] ?? null,
      deviceFingerprint: req.deviceFingerprint,
    });
    setSessionCookie(res, token);

    await logSecurityEvent(
      { type: "LOGIN_SUCCESS", severity: "INFO", message: `${user.username} signed in`, userId: user.id },
      req,
    );

    res.redirect(`${env.WEB_BASE_URL}/dashboard`);
  } catch (err) {
    next(err);
  }
});

// Builds the masked API key shown in the dashboard (never the real key).
function maskedApiKey(prefix: string | null): string | null {
  if (!prefix) return null;
  return `stella_sk_${"•".repeat(20)}${prefix}`;
}

function serializeUser(u: NonNullable<typeof globalThis extends never ? never : import("@prisma/client").User>) {
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    email: u.email,
    avatarUrl: u.avatarUrl,
    role: u.role,
    status: u.status,
    serviceLimit: u.serviceLimit,
    createdAt: u.createdAt,
    apiKeyMasked: maskedApiKey(u.apiKeyPrefix),
    hasApiKey: !!u.apiKeyHash,
    notifyDeploys: u.notifyDeploys,
    notifySecurity: u.notifySecurity,
    notifyTelegram: u.notifyTelegram,
  };
}

// Current authenticated user.
router.get("/me", requireAuth, (req, res) => {
  res.json(serializeUser(req.user!));
});

// Update profile + notification preferences.
const profileSchema = z.object({
  name: z.string().min(1).max(120).nullish(),
  notifyDeploys: z.boolean().optional(),
  notifySecurity: z.boolean().optional(),
  notifyTelegram: z.boolean().optional(),
});

router.patch("/profile", requireAuth, async (req, res, next) => {
  try {
    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: parsed.data,
    });
    res.json(serializeUser(user));
  } catch (err) {
    next(err);
  }
});

// Generate (or rotate) the user's personal REST API key. The plaintext key is
// returned exactly once; only its sha256 hash + last 4 chars are persisted.
router.post("/api-key", requireAuth, async (req, res, next) => {
  try {
    const raw = randomToken(24);
    const key = `stella_sk_${raw}`;
    const prefix = raw.slice(-4);
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { apiKeyHash: sha256(key), apiKeyPrefix: prefix },
    });
    await logSecurityEvent(
      { type: "PERMISSION_DENIED", severity: "INFO", message: `${user.username} rotated API key`, userId: user.id },
      req,
    );
    res.json({ apiKey: key, ...serializeUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", async (req, res) => {
  if (req.sessionToken) await revokeSession(req.sessionToken);
  if (req.user) {
    await logSecurityEvent(
      { type: "LOGOUT", severity: "INFO", message: `${req.user.username} signed out`, userId: req.user.id },
      req,
    );
  }
  clearSessionCookie(res);
  res.json({ ok: true });
});

export default router;
