# Build context must be the repo root (see docker-compose.yml).
FROM node:20-alpine AS builder
WORKDIR /app
COPY server/package.json server/package-lock.json* ./
RUN npm ci
COPY server/tsconfig.json ./
COPY server/src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY server/package.json server/package-lock.json* ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY server/migrations ./migrations
# Bake browser SPA into the image so an empty host bind-mount cannot wipe it.
COPY web/dist /data/web
RUN mkdir -p /data/media /data/updates \
  && test -f /data/web/index.html \
  && ls /data/web/assets | head -5
ENV NODE_ENV=production
ENV WEB_DIST=/data/web
EXPOSE 3000
CMD ["sh", "-c", "node dist/migrate-cli.js && node dist/index.js"]
