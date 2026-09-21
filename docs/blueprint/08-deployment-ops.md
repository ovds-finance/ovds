# 08 — Deployment and Operations

## 1. Containerization

### 1.1 API Dockerfile (Multi-Stage)

```dockerfile
# docker/Dockerfile.api
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY libs/api-core/package.json ./libs/api-core/
COPY libs/feature/*/package.json ./libs/feature/*/
RUN corepack enable && pnpm install --frozen-lockfile --filter api

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN nx run api:build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --from=builder --chown=nestjs:nodejs /app/dist/apps/api ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/prisma/generated ./prisma/generated

USER nestjs
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node dist/health-check.js

CMD ["node", "dist/main"]
```

### 1.2 Web Dockerfile (Multi-Stage)

```dockerfile
# docker/Dockerfile.web
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/
COPY libs/ui/package.json ./libs/ui/
COPY libs/shared/package.json ./libs/shared/
RUN corepack enable && pnpm install --frozen-lockfile --filter web

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for API URL injection
ARG VITE_API_URL=https://api.vat-saas.com
ENV VITE_API_URL=$VITE_API_URL

RUN nx run web:build

FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

RUN addgroup --system --gid 1001 nginx && \
    adduser --system --uid 1001 nginx

COPY --from=builder --chown=nginx:nginx /app/dist/apps/web .
COPY --chown=nginx:nginx docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf

USER nginx
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

## 2. Docker Compose (Local Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: vat
      POSTGRES_PASSWORD: vat_dev
      POSTGRES_DB: vat_shared
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --locale=C"
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U vat"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ..
      dockerfile: docker/Dockerfile.api
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: development
      DATABASE_SHARED_URL: postgres://vat:vat_dev@postgres:5432/vat_shared
      DATABASE_TENANT_URL: postgres://vat:vat_dev@postgres:5432/vat_shared
      REDIS_URL: redis://redis:6379
      JWT_SECRET: dev-secret-change-in-production
      HMRC_CLIENT_ID: ${HMRC_CLIENT_ID:-}
      HMRC_CLIENT_SECRET: ${HMRC_CLIENT_SECRET:-}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ../apps/api/src:/app/dist/apps/api/src
      - ../libs:/app/libs
    command: ["node", "dist/main"]

  web:
    build:
      context: ..
      dockerfile: docker/Dockerfile.web
      args:
        VITE_API_URL: http://localhost:3001
    restart: unless-stopped
    ports:
      - "4200:80"
    depends_on:
      - api

volumes:
  postgres_data:
  redis_data:
```

## 3. Kubernetes Manifests

### 3.1 Namespace

```yaml
# k8s/base/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: vat-saas
  labels:
    name: vat-saas
```

### 3.2 ConfigMap

```yaml
# k8s/base/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
  namespace: vat-saas
data:
  NODE_ENV: "production"
  PORT: "3001"
  DATABASE_SHARED_URL: "postgres://vat:$(DB_PASSWORD)@postgres:5432/vat_shared"
  REDIS_URL: "redis://redis:6379"
  LOG_LEVEL: "info"
```

### 3.3 Secret

```yaml
# k8s/base/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: api-secrets
  namespace: vat-saas
type: Opaque
stringData:
  DATABASE_URL: "postgres://vat:$(DB_PASSWORD)@postgres:5432/vat_shared"
  JWT_SECRET: "$(JWT_SECRET)"
  HMRC_CLIENT_ID: "$(HMRC_CLIENT_ID)"
  HMRC_CLIENT_SECRET: "$(HMRC_CLIENT_SECRET)"
  ENCRYPTION_KEY: "$(ENCRYPTION_KEY)"
```

### 3.4 API Deployment

```yaml
# k8s/base/deployment.api.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: vat-saas
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: vat-saas/api:latest
          ports:
            - containerPort: 3001
          env:
            - name: NODE_ENV
              valueFrom:
                configMapKeyRef:
                  name: api-config
                  key: NODE_ENV
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: api-secrets
                  key: DATABASE_URL
          resources:
            requests:
              cpu: "250m"
              memory: "512Mi"
            limits:
              cpu: "1000m"
              memory: "1Gi"
          livenessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3001
            initialDelaySeconds: 10
            periodSeconds: 5
```

### 3.5 Service

```yaml
# k8s/base/service.api.yaml
apiVersion: v1
kind: Service
metadata:
  name: api
  namespace: vat-saas
spec:
  selector:
    app: api
  ports:
    - port: 80
      targetPort: 3001
  type: ClusterIP
```

### 3.6 Ingress

```yaml
# k8s/base/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
  namespace: vat-saas
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
spec:
  tls:
    - hosts:
        - api.vat-saas.com
      secretName: api-tls
  rules:
    - host: api.vat-saas.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 80
```

### 3.7 Horizontal Pod Autoscaler

```yaml
# k8s/base/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
  namespace: vat-saas
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

## 4. Helm Chart Structure

```
k8s/helm/vat-declaration-saas/
├── Chart.yaml
├── values.yaml
├── values.staging.yaml
├── values.production.yaml
├── templates/
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── deployment.api.yaml
│   ├── service.api.yaml
│   ├── deployment.web.yaml
│   ├── service.web.yaml
│   ├── ingress.yaml
│   ├── hpa.yaml
│   ├── postgres.yaml
│   ├── redis.yaml
│   └── _helpers.tpl
└── charts/
```

## 5. CI/CD Pipelines

### 5.1 GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: nrwl/nx-set-shas@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm nx affected --target=lint --all

  test:
    runs-on: ubuntu-latest
    needs: lint
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: vat
          POSTGRES_PASSWORD: vat_test
          POSTGRES_DB: vat_test
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports: ["6379:6379"]
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: nrwl/nx-set-shas@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm nx affected --target=test --all
      - run: pnpm nx run api:test -- --coverage

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: nrwl/nx-set-shas@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm nx affected --target=build --all
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 7
```

### 5.2 Deployment Workflow

```yaml
# .github/workflows/deploy-api.yml
name: Deploy API

on:
  push:
    branches: [main]
    paths:
      - 'apps/api/**'
      - 'libs/api-core/**'
      - 'libs/feature/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: nrwl/nx-set-shas@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm nx run api:build
      - uses: docker/build-push-action@v5
        with:
          context: .
          file: docker/Dockerfile.api
          push: true
          tags: ${{ secrets.REGISTRY }}/vat-saas/api:${{ github.sha }},${{ secrets.REGISTRY }}/vat-saas/api:latest
      - run: kubectl set image deployment/api api=${{ secrets.REGISTRY }}/vat-saas/api:${{ github.sha }} -n vat-saas
      - run: kubectl rollout status deployment/api -n vat-saas --timeout=300s
```

## 6. Database Migrations

```bash
# Run migrations in CI/CD
pnpm nx run api:prisma migrate deploy -- --schema=prisma/schema/shared.prisma
pnpm nx run api:prisma migrate deploy -- --schema=prisma/schema/tenant.prisma
```

## 7. Backup Strategy

```yaml
# k8s/base/cronjob-backup.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: vat-saas
spec:
  schedule: "0 2 * * *" # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: backup
              image: postgres:16-alpine
              command:
                - /bin/sh
                - -c
                - |
                  pg_dump -U vat vat_shared | gzip > /backups/vat_shared_$(date +%Y%m%d).sql.gz
                  aws s3 cp /backups/vat_shared_$(date +%Y%m%d).sql.gz s3://vat-saas-backups/
              env:
                - name: PGPASSWORD
                  valueFrom:
                    secretKeyRef:
                      name: postgres-secret
                      key: password
              volumeMounts:
                - name: backups
                  mountPath: /backups
          restartPolicy: OnFailure
          volumes:
            - name: backups
              emptyDir: {}
```

## 8. Secrets Management

- **Development**: `.env` files (secrets redacted).
- **CI**: GitHub Encrypted Secrets.
- **Staging/Production**: Kubernetes Secrets + sealed-secrets or HashiCorp Vault.
- **Never** commit real secrets to git.

## 9. Monitoring and Observability

```typescript
// health/health.service.ts
@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: Redis,
  ) {}

  @Get('health')
  async check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('health/ready')
  async readiness() {
    const checks = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      queue: await this.checkQueue(),
    };

    const isReady = Object.values(checks).every((c) => c.status === 'up');
    return { status: isReady ? 'ready' : 'degraded', checks };
  }

  private async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up' };
    } catch {
      return { status: 'down', error: 'Database connection failed' };
    }
  }

  private async checkRedis() {
    try {
      await this.redis.ping();
      return { status: 'up' };
    } catch {
      return { status: 'down', error: 'Redis connection failed' };
    }
  }

  private async checkQueue() {
    const queues = await this.queueService.getJobCounts();
    return { status: 'up', queues };
  }
}
```

## 10. Logging

```typescript
// infrastructure/logging/winston.config.ts
export const winstonConfig: WinstonModuleOptions = {
  transports: [
    new transports.Console({
      format: combine(timestamp(), errors({ stack: true }), printf(({ timestamp, level, message, context, trace }) => {
        return `${timestamp} [${context}] ${level}: ${message} ${trace ? `\n${trace}` : ''}`;
      })),
    }),
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new transports.File({
      filename: 'logs/combined.log',
    }),
  ],
};
```

## 11. Disaster Recovery

- **RPO** (Recovery Point Objective): 1 hour (daily backups + WAL archiving).
- **RTO** (Recovery Time Objective): 4 hours for production.
- **Backup Retention**: 30 days daily, 12 months monthly.
- **Failover**: PostgreSQL streaming replication with automatic failover (Patroni).
