# 46 — Local Development Setup Guide

## 1. Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20.x+ | Runtime |
| pnpm | 8.x+ | Package manager |
| Docker | 24.x+ | Containers |
| Docker Compose | 2.x+ | Local services |
| PostgreSQL | 16+ | Database |
| Redis | 7+ | Cache/Queue |
| Git | 2.x+ | Version control |

## 2. Quick Start

```bash
# 1. Clone repository
git clone https://github.com/your-org/vat-declaration-saas.git
cd vat-declaration-saas

# 2. Install dependencies
pnpm install

# 3. Copy environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 4. Start infrastructure
docker compose up -d postgres redis

# 5. Run database migrations
pnpm nx run api:prisma migrate dev

# 6. Seed database
pnpm nx run api:db:seed

# 7. Start development servers
pnpm nx run-many --target=serve --all --parallel
```

## 3. Environment Configuration

```bash
# .env
NODE_ENV=development
PORT=3001

# Database
DATABASE_SHARED_URL=postgres://vat:vat_dev@localhost:5432/vat_shared
DATABASE_TENANT_URL=postgres://vat:vat_dev@localhost:5432/vat_shared

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=dev-secret-change-in-production-min-32-chars
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production-min-32-chars

# Encryption
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# CORS
CORS_ORIGIN=http://localhost:4200

# API
API_URL=http://localhost:3001/api/v1

# Web
VITE_API_URL=http://localhost:3001/api/v1
VITE_APP_URL=http://localhost:4200

# Storage (local for dev)
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=vat-dev
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin

# Optional integrations
HMRC_CLIENT_ID=
HMRC_CLIENT_SECRET=
XERO_CLIENT_ID=
XERO_CLIENT_SECRET=
```

## 4. Docker Compose (Development)

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

  minio:
    image: minio/minio:latest
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

  mailhog:
    image: mailhog/mailhog:latest
    restart: unless-stopped
    ports:
      - "1025:1025"
      - "8025:8025"

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

## 5. IDE Configuration

### 5.1 VS Code Settings

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.eol": "\n",
  "files.insertFinalNewline": true,
  "files.trimTrailingWhitespace": true
}
```

### 5.2 VS Code Extensions

```json
// .vscode/extensions.json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "prisma.prisma",
    "nrwl.angular-console",
    "yoavbls.pretty-json",
    "christian-kohler.path-intellisense",
    "bradlc.vscode-tailwindcss"
  ]
}
```

### 5.3 Debug Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "restart": true,
      "envFile": "${workspaceFolder}/.env"
    },
    {
      "name": "Debug Web",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:4200",
      "webRoot": "${workspaceFolder}/apps/web/src"
    }
  ]
}
```

## 6. Nx Configuration

```json
// nx.json
{
  "extends": "nx/presets/npm.json",
  "affected": {
    "defaultBase": "main"
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"],
      "cache": true
    },
    "test": {
      "inputs": ["default", "^production", "{workspaceRoot}/jest.preset.js"],
      "cache": true
    },
    "lint": {
      "inputs": ["default", "{workspaceRoot}/.eslintrc.json"],
      "cache": true
    }
  }
}
```

## 7. Husky Git Hooks

```bash
# Install husky
pnpm add -D husky
pnpm exec husky install

# Add pre-commit hook
cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm exec lint-staged
EOF

chmod +x .husky/pre-commit
```

## 8. Common Issues and Solutions

### 8.1 Port Conflicts

```bash
# Check what's using port 3001
lsof -i :3001
# Kill process
kill -9 <PID>

# Or use different ports
PORT=3002 pnpm nx serve api
```

### 8.2 Database Connection Issues

```bash
# Check PostgreSQL is running
docker compose ps postgres

# Connect to PostgreSQL
docker compose exec postgres psql -U vat -d vat_shared

# Reset database
pnpm nx run api:prisma migrate reset
```

### 8.3 Redis Connection Issues

```bash
# Check Redis is running
docker compose ps redis

# Test Redis connection
redis-cli ping
```

### 8.4 Nx Cache Issues

```bash
# Clear Nx cache
pnpm nx reset

# Run without cache
pnpm nx run api:build --skip-nx-cache
```

## 9. Development Workflow

```bash
# Start all services
pnpm docker:up

# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Start API in watch mode
pnpm nx serve api

# Start Web in watch mode (separate terminal)
pnpm nx serve web

# Run tests
pnpm test

# Run lint
pnpm lint

# Format code
pnpm format
```

## 10. Useful Scripts

```bash
# Package.json scripts
{
  "scripts": {
    "dev": "pnpm nx run-many --target=serve --all --parallel",
    "build": "pnpm nx run-many --target=build --all",
    "test": "pnpm nx run-many --target=test --all",
    "lint": "pnpm nx run-many --target=lint --all",
    "format": "pnpm nx format:write",
    "db:migrate": "pnpm nx run api:prisma migrate dev",
    "db:seed": "pnpm nx run api:db:seed",
    "db:reset": "pnpm nx run api:prisma migrate reset",
    "db:studio": "pnpm nx run api:prisma studio",
    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down",
    "docker:logs": "docker compose logs -f",
    "clean": "pnpm nx reset && rm -rf node_modules dist .cache"
  }
}
```
