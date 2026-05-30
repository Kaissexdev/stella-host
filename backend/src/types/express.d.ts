import type { User } from "@prisma/client";

// Augments Express Request with auth + security context populated by middleware.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
      sessionToken?: string;
      clientIp?: string;
      deviceFingerprint?: string;
    }
  }
}

export {};
