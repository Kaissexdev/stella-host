import type { Request } from "express";
import { UAParser } from "ua-parser-js";
import { sha256 } from "./crypto.js";

// Extracts the real client IP, honoring a trusted proxy chain (nginx/Cloudflare).
export function getClientIp(req: Request): string {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) {
    return xff.split(",")[0]!.trim();
  }
  const cf = req.headers["cf-connecting-ip"];
  if (typeof cf === "string") return cf;
  return req.ip ?? req.socket.remoteAddress ?? "0.0.0.0";
}

// Builds a stable-but-coarse device fingerprint from headers. Combined with a
// client-supplied fingerprint header when available for higher fidelity.
export function getDeviceFingerprint(req: Request): string {
  const ua = req.headers["user-agent"] ?? "";
  const lang = req.headers["accept-language"] ?? "";
  const platform = req.headers["sec-ch-ua-platform"] ?? "";
  const clientFp = req.headers["x-device-id"] ?? "";
  const parser = new UAParser(String(ua));
  const result = parser.getResult();
  const basis = [
    clientFp,
    result.browser.name,
    result.os.name,
    result.device.type ?? "desktop",
    platform,
    lang,
  ].join("|");
  return sha256(basis).slice(0, 32);
}

export function describeDevice(userAgent?: string | null): string {
  if (!userAgent) return "Unknown device";
  const r = new UAParser(userAgent).getResult();
  const browser = r.browser.name ?? "Unknown";
  const os = r.os.name ?? "Unknown OS";
  return `${browser} · ${os}`;
}
