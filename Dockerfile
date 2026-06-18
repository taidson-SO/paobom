FROM node:22-bookworm-slim AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable

WORKDIR /workspace

FROM base AS api-build

COPY . .

RUN pnpm install --frozen-lockfile --filter api --filter @paobom/database
RUN pnpm db:generate
RUN pnpm --filter api build

FROM base AS api

ENV NODE_ENV=production
ENV API_PORT=3333

COPY --from=api-build --chown=node:node /workspace /workspace

USER node

EXPOSE 3333

CMD ["node", "apps/api/dist/server.js"]

FROM base AS web-build

ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

COPY . .

RUN pnpm install --frozen-lockfile --filter web...
RUN pnpm --filter web build

FROM node:22-bookworm-slim AS web

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

WORKDIR /app

COPY --from=web-build --chown=node:node /workspace/apps/web/.next/standalone ./
COPY --from=web-build --chown=node:node /workspace/apps/web/.next/static ./apps/web/.next/static
COPY --from=web-build --chown=node:node /workspace/apps/web/public ./apps/web/public

USER node

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
