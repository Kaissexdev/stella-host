FROM node:22-slim AS base
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
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
