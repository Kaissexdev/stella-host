#!/usr/bin/env bash
#
# Stella Hosting — one-shot VPS installer.
# Installs system dependencies, configures the environment, builds the project,
# sets up systemd services and starts BOTH the backend API (+ deployment runner)
# and the frontend. Tested on Debian/Ubuntu and RHEL/Alma/Rocky family.
#
# Usage:
#   sudo bash installer.sh
#
set -euo pipefail

# --------------------------------------------------------------------------
# Config (override via environment before running)
# --------------------------------------------------------------------------
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${APP_DIR}/backend"
NODE_MAJOR="${NODE_MAJOR:-20}"
SERVICE_USER="${SERVICE_USER:-stella}"
WORKSPACE_DIR="${WORKSPACE_DIR:-/var/lib/stella/workspaces}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
BACKEND_PORT="${BACKEND_PORT:-4000}"

log()  { printf "\033[1;36m[stella]\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m[stella]\033[0m %s\n" "$*"; }
die()  { printf "\033[1;31m[stella]\033[0m %s\n" "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "Please run as root (sudo bash installer.sh)."

# --------------------------------------------------------------------------
# Detect package manager
# --------------------------------------------------------------------------
if command -v apt-get >/dev/null 2>&1; then PM=apt
elif command -v dnf >/dev/null 2>&1; then PM=dnf
elif command -v yum >/dev/null 2>&1; then PM=yum
else die "Unsupported distro: need apt, dnf or yum."; fi

pkg_install() {
  case "$PM" in
    apt) DEBIAN_FRONTEND=noninteractive apt-get install -y "$@" ;;
    dnf) dnf install -y "$@" ;;
    yum) yum install -y "$@" ;;
  esac
}

log "Updating package index…"
case "$PM" in
  apt) apt-get update -y ;;
  dnf|yum) "$PM" makecache -y || true ;;
esac

log "Installing base dependencies (git, curl, ca-certificates, openssl)…"
pkg_install git curl ca-certificates openssl gnupg || pkg_install git curl ca-certificates openssl

# --------------------------------------------------------------------------
# Node.js
# --------------------------------------------------------------------------
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | sed 's/v\([0-9]*\).*/\1/')" -lt "$NODE_MAJOR" ]; then
  log "Installing Node.js ${NODE_MAJOR}.x…"
  if [ "$PM" = "apt" ]; then
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
    pkg_install nodejs
  else
    curl -fsSL "https://rpm.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
    pkg_install nodejs
  fi
else
  log "Node.js $(node -v) already installed."
fi

# --------------------------------------------------------------------------
# Docker (required by the deployment runner)
# --------------------------------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  log "Installing Docker…"
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker || true
else
  log "Docker $(docker --version) already installed."
fi

# --------------------------------------------------------------------------
# Service user + workspace
# --------------------------------------------------------------------------
if ! id "$SERVICE_USER" >/dev/null 2>&1; then
  log "Creating service user '${SERVICE_USER}'…"
  useradd --system --create-home --shell /usr/sbin/nologin "$SERVICE_USER" 2>/dev/null \
    || useradd --system --create-home --shell /sbin/nologin "$SERVICE_USER"
fi
usermod -aG docker "$SERVICE_USER" || true
mkdir -p "$WORKSPACE_DIR"
chown -R "$SERVICE_USER":"$SERVICE_USER" "$WORKSPACE_DIR"

# --------------------------------------------------------------------------
# PostgreSQL + Redis (via Docker for portability across distros)
# --------------------------------------------------------------------------
log "Ensuring PostgreSQL and Redis containers are running…"

ENV_FILE="${BACKEND_DIR}/.env"

# Read a KEY=value from a dotenv file (ignores comments/quotes). Empty if absent.
read_env_value() {
  local key="$1" file="$2"
  [ -f "$file" ] || return 0
  sed -n "s/^[[:space:]]*${key}[[:space:]]*=[[:space:]]*//p" "$file" \
    | tail -n1 | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}

# Resolve the DB password. Priority:
#   1. password embedded in an existing backend/.env DATABASE_URL
#   2. PG_PASS env override
#   3. a freshly generated random password
# Keeping it stable across re-runs guarantees it matches the password already
# baked into the postgres data volume (otherwise: P1000 auth failed).
PRIOR_DB_URL="$(read_env_value DATABASE_URL "$ENV_FILE")"
PRIOR_PG_PASS=""
if [ -n "$PRIOR_DB_URL" ]; then
  PRIOR_PG_PASS="$(printf '%s' "$PRIOR_DB_URL" | sed -n 's#^postgresql://[^:]*:\([^@]*\)@.*#\1#p')"
fi
PG_PASS="${PRIOR_PG_PASS:-${PG_PASS:-$(openssl rand -hex 16)}}"

docker volume create stella-pgdata >/dev/null
docker volume create stella-redisdata >/dev/null

if ! docker ps -a --format '{{.Names}}' | grep -q '^stella-postgres$'; then
  docker run -d --name stella-postgres --restart unless-stopped \
    -e POSTGRES_USER=stella -e POSTGRES_PASSWORD="$PG_PASS" -e POSTGRES_DB=stella \
    -p 127.0.0.1:5432:5432 -v stella-pgdata:/var/lib/postgresql/data postgres:16-alpine
else
  docker start stella-postgres >/dev/null 2>&1 || true
fi
if ! docker ps -a --format '{{.Names}}' | grep -q '^stella-redis$'; then
  docker run -d --name stella-redis --restart unless-stopped \
    -p 127.0.0.1:6379:6379 -v stella-redisdata:/data redis:7-alpine \
    redis-server --appendonly yes
else
  docker start stella-redis >/dev/null 2>&1 || true
fi

# Wait for PostgreSQL to accept connections before touching it.
log "Waiting for PostgreSQL to become ready…"
for _ in $(seq 1 60); do
  docker exec stella-postgres pg_isready -U stella -d stella >/dev/null 2>&1 && break
  sleep 2
done

# Sync the postgres role password to match what we write into .env. The official
# image trusts local socket connections, so no password is needed here. This
# repairs any drift between a pre-existing data volume and the .env file.
log "Synchronizing database password…"
docker exec stella-postgres psql -v ON_ERROR_STOP=1 -U stella -d stella \
  -c "ALTER USER stella WITH PASSWORD '${PG_PASS}';" >/dev/null 2>&1 \
  || warn "Could not sync DB password automatically (relying on existing credentials)."


# --------------------------------------------------------------------------
# Environment file — fully automatic.
#
# The ONLY thing you ever need to provide is your GitHub OAuth app:
#   GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET
#
# Put them in any of these (checked in order) and the installer does the rest:
#   1. backend/.env
#   2. ./.env            (project root)
#   3. GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET environment variables
#
# Everything else (DB password, secrets, encryption key, webhook secret,
# ports, URLs) is generated automatically and never overwritten on re-runs.
# --------------------------------------------------------------------------
ENV_FILE="${BACKEND_DIR}/.env"

# Read a KEY=value from a dotenv file (ignores comments/quotes). Empty if absent.
read_env_value() {
  local key="$1" file="$2"
  [ -f "$file" ] || return 0
  sed -n "s/^[[:space:]]*${key}[[:space:]]*=[[:space:]]*//p" "$file" \
    | tail -n1 | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}

# Resolve GitHub credentials from (in priority): backend/.env, root .env, env vars.
GH_ID="${GITHUB_CLIENT_ID:-}"
GH_SECRET="${GITHUB_CLIENT_SECRET:-}"
for SRC in "$ENV_FILE" "${APP_DIR}/.env"; do
  [ -n "$GH_ID" ]     || GH_ID="$(read_env_value GITHUB_CLIENT_ID "$SRC")"
  [ -n "$GH_SECRET" ] || GH_SECRET="$(read_env_value GITHUB_CLIENT_SECRET "$SRC")"
done

# Preserve previously generated secrets across re-runs so sessions stay valid.
PRIOR_SESSION_SECRET="$(read_env_value SESSION_SECRET "$ENV_FILE")"
PRIOR_ENCRYPTION_KEY="$(read_env_value ENCRYPTION_KEY "$ENV_FILE")"
PRIOR_WEBHOOK_SECRET="$(read_env_value GITHUB_WEBHOOK_SECRET "$ENV_FILE")"
PRIOR_DB_URL="$(read_env_value DATABASE_URL "$ENV_FILE")"

SESSION_SECRET="${PRIOR_SESSION_SECRET:-$(openssl rand -hex 32)}"
ENCRYPTION_KEY="${PRIOR_ENCRYPTION_KEY:-$(openssl rand -hex 32)}"
GITHUB_WEBHOOK_SECRET="${PRIOR_WEBHOOK_SECRET:-$(openssl rand -hex 32)}"
# Keep the existing DB URL (with its password) if we already provisioned one.
DATABASE_URL="${PRIOR_DB_URL:-postgresql://stella:${PG_PASS}@127.0.0.1:5432/stella?schema=public}"

HOST_IP="$(hostname -I | awk '{print $1}')"
API_BASE_URL="${API_BASE_URL:-http://${HOST_IP}:${BACKEND_PORT}}"
WEB_BASE_URL="${WEB_BASE_URL:-http://${HOST_IP}:${FRONTEND_PORT}}"

if [ -z "$GH_ID" ] || [ -z "$GH_SECRET" ]; then
  warn "GitHub OAuth credentials not found yet."
  warn "Create an OAuth app at https://github.com/settings/developers with:"
  warn "  Authorization callback URL: ${API_BASE_URL}/api/auth/github/callback"
  warn "Then add to ${ENV_FILE}:"
  warn "  GITHUB_CLIENT_ID=...    GITHUB_CLIENT_SECRET=..."
  warn "and re-run: sudo bash installer.sh"
fi

log "Writing ${ENV_FILE} (auto-generated; only GitHub credentials are user-supplied)…"
cat > "$ENV_FILE" <<EOF
NODE_ENV=production
PORT=${BACKEND_PORT}
API_BASE_URL=${API_BASE_URL}
WEB_BASE_URL=${WEB_BASE_URL}

DATABASE_URL=${DATABASE_URL}
REDIS_URL=redis://127.0.0.1:6379

SESSION_SECRET=${SESSION_SECRET}
SESSION_TTL_DAYS=7

ENCRYPTION_KEY=${ENCRYPTION_KEY}

GITHUB_CLIENT_ID=${GH_ID}
GITHUB_CLIENT_SECRET=${GH_SECRET}
GITHUB_WEBHOOK_SECRET=${GITHUB_WEBHOOK_SECRET}

MAX_ACCOUNTS_PER_DEVICE=2
MAX_ACCOUNTS_PER_IP=3

RUNNER_ENABLED=true
WORKSPACE_DIR=${WORKSPACE_DIR}
DEPLOY_BASE_IMAGE=node:20-bookworm-slim
DEPLOY_PUBLIC_HOST=${HOST_IP}
DEPLOY_PORT_START=41000
DEPLOY_PORT_END=42000
DEPLOY_CONTAINER_PORT=8080
DEPLOY_CPU_LIMIT=1
DEPLOY_MEMORY_LIMIT=512m
EOF
chown "$SERVICE_USER":"$SERVICE_USER" "$ENV_FILE"
chmod 600 "$ENV_FILE"


# --------------------------------------------------------------------------
# Build backend
# --------------------------------------------------------------------------
log "Installing & building backend…"
cd "$BACKEND_DIR"
npm install
npx prisma generate
npm run build
log "Applying database migrations…"
npx prisma migrate deploy || npx prisma db push

# --------------------------------------------------------------------------
# Build frontend
# --------------------------------------------------------------------------
log "Installing & building frontend…"
cd "$APP_DIR"
: "${VITE_API_BASE_URL:=http://$(hostname -I | awk '{print $1}'):${BACKEND_PORT}}"
export VITE_API_BASE_URL
npm install
npm run build

chown -R "$SERVICE_USER":"$SERVICE_USER" "$APP_DIR"

# --------------------------------------------------------------------------
# systemd services
# --------------------------------------------------------------------------
log "Creating systemd services…"
cat > /etc/systemd/system/stella-backend.service <<EOF
[Unit]
Description=Stella Hosting Backend API + Deployment Runner
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=${SERVICE_USER}
WorkingDirectory=${BACKEND_DIR}
EnvironmentFile=${BACKEND_DIR}/.env
ExecStart=/usr/bin/node ${BACKEND_DIR}/dist/index.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/stella-frontend.service <<EOF
[Unit]
Description=Stella Hosting Frontend (TanStack Start)
After=network.target stella-backend.service

[Service]
Type=simple
User=${SERVICE_USER}
WorkingDirectory=${APP_DIR}
Environment=PORT=${FRONTEND_PORT}
Environment=NODE_ENV=production
ExecStart=/usr/bin/node ${APP_DIR}/.output/server/index.mjs
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now stella-backend.service
systemctl enable --now stella-frontend.service

log "Done! 🚀"
log "Backend:  http://${HOST_IP}:${BACKEND_PORT}/health"
log "Frontend: http://${HOST_IP}:${FRONTEND_PORT}"
log "GitHub OAuth callback URL: ${API_BASE_URL}/api/auth/github/callback"
if [ -n "$GH_ID" ] && [ -n "$GH_SECRET" ]; then
  log "GitHub OAuth credentials detected — the platform is fully configured."
else
  warn "Add GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET to ${ENV_FILE}, then re-run:"
  warn "  sudo bash installer.sh   (or: systemctl restart stella-backend)"
fi
