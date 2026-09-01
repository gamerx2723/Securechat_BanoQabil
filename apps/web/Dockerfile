# ===================================================
# Multi-stage Dockerfile for SecureChat Web App
# ===================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json turbo.json tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

RUN npm install
RUN npm --prefix apps/web run build

# ===================================================
# Nginx Static Web Server
# ===================================================
FROM nginx:alpine AS runner

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
