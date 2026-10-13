# ─── 1. Build Next.js Frontend ─────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json frontend/tsconfig.json frontend/next.config.ts ./
RUN npm ci

COPY frontend/public ./public
COPY frontend/src ./src
RUN npm run build

# ─── 2. Build Express Backend ──────────────────────────
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend

COPY backend/package*.json backend/tsconfig.json ./
RUN npm ci

COPY backend/src ./src
RUN npm run build

# ─── 3. Unified Production Runner ──────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/src/app/favicon.ico ./frontend/src/app/favicon.ico

EXPOSE 5000

CMD ["node", "dist/server.js"]
