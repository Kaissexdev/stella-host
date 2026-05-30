import { request } from "undici";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { logSecurityEvent } from "../lib/security-log.js";
import { describeDevice } from "../lib/request-context.js";

interface SignalInput {
  userId: string;
  ip: string;
  deviceFingerprint: string;
  userAgent?: string | null;
}

interface IpIntel {
  vpn: boolean;
  proxy: boolean;
  asn?: string;
  location?: string;
}

// Optional external IP intelligence (VPN/proxy/ASN). Falls back to neutral
// values when no provider is configured.
async function lookupIpIntel(ip: string): Promise<IpIntel> {
  if (!env.IP_INTEL_URL) return { vpn: false, proxy: false };
  try {
    const url = env.IP_INTEL_URL.replace("{ip}", encodeURIComponent(ip));
    const res = await request(url, {
      headers: env.IP_INTEL_API_KEY ? { authorization: `Bearer ${env.IP_INTEL_API_KEY}` } : {},
    });
    const data = (await res.body.json()) as Record<string, unknown>;
    return {
      vpn: Boolean(data.vpn ?? data.is_vpn),
      proxy: Boolean(data.proxy ?? data.is_proxy),
      asn: data.asn ? String(data.asn) : undefined,
      location:
        data.location?.toString() ??
        [data.city, data.country].filter(Boolean).join(", ") ||
        undefined,
    };
  } catch {
    return { vpn: false, proxy: false };
  }
}

export interface AbuseDecision {
  flagged: boolean;
  blocked: boolean;
  reason?: string;
  location?: string;
}

// Records an identity signal (user + ip + device) on every login and evaluates
// multi-account bypass attempts. Returns a decision used to flag the login and,
// for severe cases, ban the offending account and block the IP.
export async function evaluateLogin(input: SignalInput): Promise<AbuseDecision> {
  const intel = await lookupIpIntel(input.ip);

  // Upsert the identity signal (unique on user+ip+device).
  await prisma.identitySignal.upsert({
    where: {
      userId_ip_deviceFingerprint: {
        userId: input.userId,
        ip: input.ip,
        deviceFingerprint: input.deviceFingerprint,
      },
    },
    create: {
      userId: input.userId,
      ip: input.ip,
      deviceFingerprint: input.deviceFingerprint,
      asn: intel.asn,
      isVpn: intel.vpn,
      isProxy: intel.proxy,
    },
    update: { seenCount: { increment: 1 }, lastSeenAt: new Date(), isVpn: intel.vpn, isProxy: intel.proxy },
  });

  // Count DISTINCT accounts sharing this device and this IP.
  const [deviceAccounts, ipAccounts] = await Promise.all([
    prisma.identitySignal.findMany({
      where: { deviceFingerprint: input.deviceFingerprint },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.identitySignal.findMany({
      where: { ip: input.ip },
      distinct: ["userId"],
      select: { userId: true },
    }),
  ]);

  const distinctDeviceUsers = new Set(deviceAccounts.map((d) => d.userId)).size;
  const distinctIpUsers = new Set(ipAccounts.map((d) => d.userId)).size;

  let score = 0;
  const reasons: string[] = [];

  if (distinctDeviceUsers > env.MAX_ACCOUNTS_PER_DEVICE) {
    score += 60;
    reasons.push(`${distinctDeviceUsers} accounts on one device`);
  }
  if (distinctIpUsers > env.MAX_ACCOUNTS_PER_IP) {
    score += 40;
    reasons.push(`${distinctIpUsers} accounts on one IP`);
  }
  if (intel.vpn) {
    score += 15;
    reasons.push("VPN");
  }
  if (intel.proxy) {
    score += 15;
    reasons.push("proxy");
  }

  const flagged = score >= 40;
  const blocked = score >= 80; // hard block threshold

  if (flagged) {
    await prisma.abuseFlag.create({
      data: {
        userId: input.userId,
        ip: input.ip,
        deviceFingerprint: input.deviceFingerprint,
        reason: reasons.join(", "),
        score,
      },
    });
    await logSecurityEvent({
      type: "MULTI_ACCOUNT_SUSPECTED",
      severity: blocked ? "CRITICAL" : "HIGH",
      message: `Multi-account bypass suspected (${describeDevice(input.userAgent)}): ${reasons.join(", ")}`,
      userId: input.userId,
      ip: input.ip,
      deviceFingerprint: input.deviceFingerprint,
      metadata: { score, distinctDeviceUsers, distinctIpUsers, intel },
    });
  }

  if (blocked) {
    // Suspend the offending account and temporarily block the IP (24h).
    await prisma.user.update({ where: { id: input.userId }, data: { status: "SUSPENDED" } });
    await prisma.blockedIp.upsert({
      where: { ip: input.ip },
      create: {
        ip: input.ip,
        reason: `Auto-block: ${reasons.join(", ")}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      update: { reason: `Auto-block: ${reasons.join(", ")}` },
    });
    await logSecurityEvent({
      type: "ABUSE_BLOCKED",
      severity: "CRITICAL",
      message: `Auto-blocked IP ${input.ip} and suspended account for abuse`,
      userId: input.userId,
      ip: input.ip,
      deviceFingerprint: input.deviceFingerprint,
    });
  }

  return { flagged, blocked, reason: reasons.join(", ") || undefined, location: intel.location };
}
