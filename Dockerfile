FROM node:22.21-alpine3.21 AS base
RUN corepack enable
WORKDIR /app

FROM base AS production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/analytics-service ./apps/analytics-service

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts && \
    cd apps/analytics-service && \
    pnpm build

WORKDIR /app/apps/analytics-service
# RUN chown -R appuser:appgroup /app
# USER appuser

EXPOSE 4000

CMD ["sh", "-c", "node dist/db/migrate.js && node dist/index.js"]
