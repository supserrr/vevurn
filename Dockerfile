# Multi-stage Dockerfile for Render deployment
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS backend-deps
RUN apk add --no-cache libc6-compat postgresql-client
WORKDIR /app/backend

# Copy package files
COPY backend/package.json backend/pnpm-lock.yaml* ./
COPY pnpm-workspace.yaml /app/
COPY package.json /app/

# Enable corepack and install dependencies
RUN corepack enable && corepack prepare pnpm@9.14.4 --activate
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS backend-builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.14.4 --activate

# Copy workspace files
COPY pnpm-workspace.yaml package.json ./
COPY backend/ ./backend/
COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules

# Build the application
WORKDIR /app/backend
RUN pnpm build

# Production stage
FROM base AS backend-runner
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.14.4 --activate

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy built application
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/dist ./dist
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/package.json ./
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/prisma ./prisma
COPY --from=backend-deps --chown=nodejs:nodejs /app/backend/node_modules ./node_modules

USER nodejs

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["pnpm", "start"]
