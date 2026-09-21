FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/
COPY packages/*/package.json packages/*/
COPY packages/shared/*/package.json packages/shared/*/
COPY packages/modules/*/package.json packages/modules/*/
COPY packages/domains/*/package.json packages/domains/*/
COPY packages/features/*/package.json packages/features/*/

RUN npm ci --ignore-scripts

COPY . .

RUN npm run build:backend

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV DEPLOYMENT_MODE=CLOUD_SAAS

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma

RUN npx prisma generate --schema=packages/database/prisma/schema.prisma && \
    chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health/live', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })" || exit 1

CMD ["node", "dist/apps/backend/main.js"]
