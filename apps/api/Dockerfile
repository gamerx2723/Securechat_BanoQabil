# ===================================================
# Multi-stage Dockerfile for SecureChat Core API
# ===================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests and workspace configuration
COPY package*.json turbo.json tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install root & workspace dependencies
RUN npm install

# Generate Prisma Client for PostgreSQL
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Build all interdependent packages in strict dependency order
RUN npm --prefix packages/types run build
RUN npm --prefix packages/crypto run build
RUN npm --prefix packages/validation run build
RUN npm --prefix packages/database run build
RUN npm --prefix packages/security run build
RUN npm --prefix apps/api run build

# ===================================================
# Production Runner
# ===================================================
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# Copy built workspace and node_modules directly from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api

EXPOSE 4000

CMD ["node", "apps/api/dist/index.js"]
