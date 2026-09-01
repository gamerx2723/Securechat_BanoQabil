# ===================================================
# Multi-stage Dockerfile for SecureChat Core API
# ===================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json turbo.json tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install dependencies and build packages
RUN npm install
RUN npm --prefix packages/database run generate || true
RUN npm --prefix packages/validation run build
RUN npm --prefix packages/crypto run build
RUN npm --prefix apps/api run build

# ===================================================
# Production Runner
# ===================================================
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY package*.json ./
COPY packages/ ./packages/
COPY apps/api/package*.json ./apps/api/
COPY apps/api/dist ./apps/api/dist

# Install production dependencies only
RUN npm install --omit=dev

EXPOSE 4000

CMD ["node", "apps/api/dist/index.js"]
