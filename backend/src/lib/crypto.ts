import crypto from "node:crypto";
import { env } from "../config/env.js";

// AES-256-GCM encryption for secrets stored at rest (e.g. service env vars).
const KEY = Buffer.from(env.ENCRYPTION_KEY, "hex");
const ALGO = "aes-256-gcm";

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // iv:tag:ciphertext (all base64)
  return [iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(":");
}

export function decrypt(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(":");
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function randomToken(bytes = 48): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

// HMAC SHA-256 verification with timing-safe comparison (GitHub webhooks).
export function verifyHmac(secret: string, body: Buffer, signatureHeader?: string | null): boolean {
  if (!signatureHeader) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
