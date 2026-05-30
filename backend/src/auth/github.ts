import { request } from "undici";
import { env } from "../config/env.js";

const GITHUB_AUTHORIZE = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN = "https://github.com/login/oauth/access_token";
const GITHUB_API = "https://api.github.com";

export const GITHUB_CALLBACK_URL = `${env.API_BASE_URL}/api/auth/github/callback`;

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

// Builds the GitHub consent URL. `state` is an anti-CSRF nonce stored in a
// short-lived httpOnly cookie and verified on callback.
export function buildAuthorizeUrl(state: string): string {
  const url = new URL(GITHUB_AUTHORIZE);
  url.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  url.searchParams.set("redirect_uri", GITHUB_CALLBACK_URL);
  url.searchParams.set("scope", "read:user user:email");
  url.searchParams.set("state", state);
  url.searchParams.set("allow_signup", "true");
  return url.toString();
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const res = await request(GITHUB_TOKEN, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: GITHUB_CALLBACK_URL,
    }),
  });
  const data = (await res.body.json()) as { access_token?: string; error?: string };
  if (!data.access_token) {
    throw new Error(`GitHub token exchange failed: ${data.error ?? "unknown"}`);
  }
  return data.access_token;
}

export async function fetchGitHubUser(accessToken: string): Promise<GitHubUser> {
  const headers = {
    authorization: `Bearer ${accessToken}`,
    accept: "application/vnd.github+json",
    "user-agent": "stella-hosting",
  };
  const userRes = await request(`${GITHUB_API}/user`, { headers });
  const user = (await userRes.body.json()) as GitHubUser;

  // Primary email may be private; fetch the verified primary explicitly.
  if (!user.email) {
    try {
      const emailRes = await request(`${GITHUB_API}/user/emails`, { headers });
      const emails = (await emailRes.body.json()) as Array<{
        email: string;
        primary: boolean;
        verified: boolean;
      }>;
      const primary = emails.find((e) => e.primary && e.verified) ?? emails.find((e) => e.verified);
      user.email = primary?.email ?? null;
    } catch {
      // non-fatal
    }
  }
  return user;
}
