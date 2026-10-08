# apps/portal/Dockerfile
# Multi-stage build for React portal (Vite)
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm && corepack prepare pnpm@9.4.0 --activate

FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/portal ./apps/portal
RUN pnpm install --frozen-lockfile --filter ovds-portal... --filter @ovds/database...
RUN pnpm run db:generate --filter @ovds/database
RUN pnpm nx run portal:build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist/apps/portal /usr/share/nginx/html
COPY apps/portal/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]