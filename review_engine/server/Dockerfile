# Multi-Stage Minimal Production Container for Cloud Run A2A Service
# Part of GeminiPostCutoff Architecture Review Engine

FROM node:22-alpine AS builder
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
RUN npm ci --omit=dev

# Final Minimal Runtime Stage
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Security: Run as non-root node user
USER node

# Copy dependencies and application code
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node package*.json ./
COPY --chown=node:node skills ./skills
COPY --chown=node:node review_engine ./review_engine
COPY --chown=node:node bin ./bin

EXPOSE 8080

# Health check probe
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/healthz || exit 1

CMD ["node", "review_engine/server/app.js"]
