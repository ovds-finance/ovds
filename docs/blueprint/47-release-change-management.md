# 48 — Release and Change Management

## 1. Release Strategy

The system follows **continuous delivery** with weekly releases to production.

```
Main branch
    │
    ├──▶ Feature branches (short-lived)
    │
    ├──▶ PR → CI (lint, test, build)
    │
    ├──▶ Merge to main → Auto-deploy to staging
    │
    └──▶ Manual promotion to production (weekly)
```

## 2. Branching Strategy

```
main           # Production-ready code
  ├── develop  # Integration branch (optional)
  ├── feature/* # Feature branches
  ├── fix/*     # Bug fix branches
  └── release/* # Release branches
```

### 2.1 Feature Branch Workflow

```bash
# Create feature branch
git checkout -b feature/vat-return-validation

# Work on feature
git add .
git commit -m "feat: add VAT return validation"

# Push and create PR
git push origin feature/vat-return-validation
```

### 2.2 Commit Convention

```
<type>(<scope>): <subject>

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- perf: Performance improvement
- test: Tests
- chore: Maintenance
- ci: CI/CD

Scopes:
- api: Backend API
- web: Frontend web
- shared: Shared libraries
- infra: Infrastructure
- db: Database
```

## 3. CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
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
      - uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

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

## 4. Deployment Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging
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
          tags: ${{ secrets.REGISTRY }}/vat-saas/api:${{ github.sha }},${{ secrets.REGISTRY }}/vat-saas/api:staging
      - run: kubectl set image deployment/api api=${{ secrets.REGISTRY }}/vat-saas/api:${{ github.sha }} -n vat-saas-staging
      - run: kubectl rollout status deployment/api -n vat-saas-staging --timeout=300s

  deploy-production:
    runs-on: ubuntu-latest
    needs: deploy-staging
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
      - run: pnpm nx run api:prisma migrate deploy
```

## 5. Release Checklist

```
□ All tests passing
□ Code review approved
□ CHANGELOG.md updated
□ Version bumped in package.json
□ OpenAPI spec updated (if API changed)
□ Database migrations tested
□ Rollback plan documented
□ Monitoring dashboards updated
□ Release notes drafted
□ Stakeholders notified
```

## 6. Versioning

- **API**: Semantic versioning (`v1`, `v2`)
- **Package**: Semantic versioning (`1.2.3`)
- **Database**: Migration-based versioning

## 7. Changelog

```markdown
# Changelog

## [1.2.0] - 2024-01-15

### Added
- VAT return submission to HMRC
- Multi-currency support
- Bulk import for transactions

### Changed
- Improved validation error messages
- Updated UI design system

### Fixed
- Fixed rounding discrepancy in VAT calculations
- Fixed race condition in job processing

### Security
- Updated dependencies
```

## 8. Rollback Procedure

```bash
# Kubernetes rollback
kubectl rollout undo deployment/api -n vat-saas
kubectl rollout status deployment/api -n vat-saas

# Database rollback
pnpm nx run api:prisma migrate resolve --rolled-back 20240115_add_vat_returns

# Rollback script
pnpm nx run api:db:rollback -- --steps=1
```

## 9. Feature Flags

```typescript
// libs/api-core/config/src/feature-flags.service.ts
@Injectable()
export class FeatureFlagService {
  private readonly flags = new Map<string, boolean>();

  constructor(private readonly configService: ConfigService) {
    this.loadFlags();
  }

  private loadFlags(): void {
    const flags = this.configService.get('FEATURE_FLAGS', {});
    for (const [key, value] of Object.entries(flags)) {
      this.flags.set(key, value);
    }
  }

  isEnabled(flag: string): boolean {
    return this.flags.get(flag) ?? false;
  }
}

// Usage
if (this.featureFlagService.isEnabled('hmrc_integration')) {
  // Enable HMRC integration
}
```

## 10. Change Management

### 10.1 Change Approval Process

```
1. RFC document created
2. Technical review
3. Security review (if needed)
4. Stakeholder approval
5. Implementation
6. Testing
7. Deployment
8. Post-deployment verification
```

### 10.2 Change Types

| Type | Approval | Testing | Rollback |
|------|----------|---------|----------|
| Feature | Tech lead | Full test suite | Yes |
| Bug fix | Team | Unit tests | Yes |
| Hotfix | Tech lead | Smoke tests | Yes |
| Infrastructure | Ops | Canary | Yes |
| Security | Security team | Pen test | No |
