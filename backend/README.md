# Stella Hosting — Backend

Production REST API for Stella Hosting: GitHub OAuth (cookie sessions), GitHub
webhook handling, real-time deployment/log/status updates over WebSockets, full
service & deployment management, support tickets, and an IP/device-based
abuse-prevention system that blocks multi-account bypass attempts.

**Stack:** Node 22 · TypeScript · Express · Prisma · PostgreSQL · Redis · Socket.io

## Quick start (Docker — recommended for VPS)

```bash
cd backend
cp .env.example .env          # fill in the GitHub + secret values
docker compose up -d --build  # starts postgres, redis and the API
```

Migrations run automatically on container boot. The API listens on `:4000`.

## Quick start (local, no Docker)

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev        # create the schema in your local Postgres
npm run dev
```

## Required secrets (`.env`)

| Variable | How to get it |
| --- | --- |
| `SESSION_SECRET` | `openssl rand -hex 32` |
| `ENCRYPTION_KEY` | `openssl rand -hex 32` (encrypts env vars at rest) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | github.com/settings/developers → New OAuth App. Callback URL: `${API_BASE_URL}/api/auth/github/callback` |
| `GITHUB_WEBHOOK_SECRET` | `openssl rand -hex 32`, set the same value on the GitHub webhook |
| `DATABASE_URL` / `REDIS_URL` | provided by docker-compose; override for managed services |

## GitHub setup

1. **OAuth App** — callback `https://<your-api>/api/auth/github/callback`.
2. **Webhook** (repo or org) — payload URL `https://<your-api>/api/webhooks/github`,
   content type `application/json`, secret = `GITHUB_WEBHOOK_SECRET`, events: *Pushes*.

A `push` to a branch tracked by an auto-deploy service creates a new
`Deployment`, moves it to `BUILDING`, writes logs, and broadcasts every change
live to the dashboard.

## API surface

```
GET    /health
GET    /api/auth/github                 → redirect to GitHub
GET    /api/auth/github/callback        → OAuth callback (sets session cookie)
GET    /api/auth/me                     → current user
POST   /api/auth/logout

GET    /api/services                    POST /api/services
GET    /api/services/:id                PATCH /api/services/:id    DELETE …

GET    /api/deployments                 POST /api/deployments (trigger)
GET    /api/deployments/:id             GET  /api/deployments/:id/logs
POST   /api/deployments/:id/cancel

GET    /api/tickets                     POST /api/tickets
POST   /api/tickets/:id/reply           POST /api/tickets/:id/close

GET    /api/security/events|logins|sessions
GET    /api/security/admin/overview|users     (ADMIN)
POST   /api/security/admin/users/ban|block-ip (ADMIN)

POST   /api/webhooks/github             (HMAC SHA-256 verified)
```

## Real-time (WebSocket)

Socket.io is served at path `/realtime`, authenticated with the same session
cookie. Clients are joined to a per-user room and receive:
`deployment.created`, `deployment.updated`, `deployment.log`,
`service.updated`, and (admins) `security.event`.

## Security & abuse prevention

- **Cookie sessions** — httpOnly, `secure` in prod, `sameSite=lax`; tokens stored
  hashed (sha256). OAuth uses an anti-CSRF `state` nonce.
- **Rate limiting** — Redis-backed, shared across instances (auth/api/webhook tiers).
- **IP guard** — blocked IPs rejected (Redis cache over Postgres `BlockedIp`).
- **Multi-account detection** — every login records an `IdentitySignal`
  (user + IP + device fingerprint). Exceeding `MAX_ACCOUNTS_PER_DEVICE` /
  `MAX_ACCOUNTS_PER_IP`, plus VPN/proxy signals, raises an abuse score; high
  scores auto-suspend the account and block the IP for 24h. All events land in
  `SecurityLog` and stream to admins live.
- **Secrets at rest** — service env vars encrypted with AES-256-GCM.

## Connecting the frontend

Point the Stella Hosting frontend at this API base URL and call it with
`credentials: "include"` so the session cookie is sent. Set `WEB_BASE_URL` to
the frontend origin so CORS and the post-login redirect work.

## Deploy engine integration

This service owns deployment **records, logs, status and real-time updates**.
To perform the actual container builds, connect your Docker/runner
infrastructure: subscribe a worker to new `Deployment` rows (or the
`deployment.created` event), run the build, and call
`updateDeploymentStatus` / `appendLog` (or the REST endpoints) to push live
progress back to the dashboard.
