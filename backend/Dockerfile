FROM node:22-slim AS base
# git + docker CLI are needed by the deployment runner to checkout and build repos.
RUN apt-get update -y \
  && apt-get install -y openssl ca-certificates git curl gnupg \
  && install -m 0755 -d /etc/apt/keyrings \
  && curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc \
  && chmod a+r /etc/apt/keyrings/docker.asc \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo $VERSION_CODENAME) stable" > /etc/apt/sources.list.d/docker.list \
  && apt-get update -y && apt-get install -y docker-ce-cli \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- deps ----
FROM base AS deps
COPY package.json ./
COPY prisma ./prisma
RUN npm install
RUN npx prisma generate

# ---- build ----
FROM deps AS build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- runtime ----
FROM base AS runtime
ENV NODE_ENV=production
COPY package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
EXPOSE 4000
# Apply migrations then boot.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
