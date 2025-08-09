# THIS PROJECT REQUIRES NODE.JS RUNTIME - NOT DOCKER!
# Please configure Render with: env: node
FROM node:18-alpine
RUN echo "========================================" && \
    echo "ERROR: Docker build detected!" && \
    echo "This project must use Node.js runtime." && \
    echo "Please configure Render with:" && \
    echo "  env: node" && \
    echo "  runtime: node" && \
    echo "Remove Dockerfile and use Node.js runtime" && \
    echo "========================================" && \
    exit 1
RUN corepack enable && corepack prepare pnpm@9.14.4 --activate

# Copy workspace files and node_modules
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY --from=deps /app/backend/shared/node_modules ./backend/shared/node_modules

# Copy source code
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY backend/ ./backend/

# Build the application
RUN pnpm --filter @vevurn/shared build
RUN pnpm --filter @vevurn/backend build

# Production stage
FROM base AS runner
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.14.4 --activate

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy workspace configuration
COPY --chown=nodejs:nodejs pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/backend/dist ./backend/dist
COPY --from=builder --chown=nodejs:nodejs /app/backend/package.json ./backend/
COPY --from=builder --chown=nodejs:nodejs /app/backend/prisma ./backend/prisma
COPY --from=deps --chown=nodejs:nodejs /app/backend/node_modules ./backend/node_modules

USER nodejs

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

WORKDIR /app/backend
CMD ["pnpm", "start"]
