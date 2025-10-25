FROM node:22.21-alpine3.21 AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS dependencies
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/analytics-service/package.json ./apps/analytics-service/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --prod --frozen-lockfile --filter analytics-service --ignore-scripts

FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/analytics-service ./apps/analytics-service

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts --filter analytics-service

RUN pnpm --filter analytics-service build

FROM base AS production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=dependencies --chown=appuser:appgroup /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/package.json ./
COPY --from=dependencies --chown=appuser:appgroup /app/apps/analytics-service/package.json ./apps/analytics-service/

COPY --from=dependencies --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=dependencies --chown=appuser:appgroup /app/apps/analytics-service/node_modules ./apps/analytics-service/node_modules

COPY --from=build --chown=appuser:appgroup /app/apps/analytics-service/dist ./apps/analytics-service/dist

WORKDIR /app/apps/analytics-service

USER appuser

EXPOSE 4000

CMD ["node", "dist/index.js"]