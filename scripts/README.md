# OVDS Deployment Scripts

Scripts for deploying OVDS on a local Windows/XAMPP server with public internet access via `www.ovds.com.et`.

## Architecture

```
Internet
   │
   ▼
Router (port forward 80/443)
   │
   ▼
Windows PC - Apache (XAMPP) :80/:443
   │
   ├── /          → C:\xampp\htdocs\tcab\public  (React SPA)
   ├── /api/*     → http://127.0.0.1:3000/api    (NestJS backend)
   └── /socket.io → ws://127.0.0.1:3000          (WebSocket)
```

## Run Order

### Step 1 — Build the frontend
```powershell
cd C:\xampp\htdocs\tcab\frontend
npm run build
```

### Step 2 — Build the backend
```powershell
cd C:\xampp\htdocs\tcab
npm run build
```

### Step 3 — Configure production environment
Copy `.env.example` to `.env` and set:
```env
NODE_ENV=production
FRONTEND_URL=https://www.ovds.com.et
CORS_ORIGIN=https://www.ovds.com.et
```

### Step 4 — Run the vhost setup (as Administrator)
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\setup-xampp-vhost.ps1
```
This configures Apache, enables required modules, opens firewall ports, and restarts Apache.

### Step 5 — Configure router port forwarding (manual)
In your router admin panel, forward:
- External TCP port `80`  → your PC's local IP → port `80`
- External TCP port `443` → your PC's local IP → port `443`

### Step 6 — Set DNS records (manual)
At your domain registrar for `ovds.com.et`, add:
| Type | Name  | Value           |
|------|-------|-----------------|
| A    | @     | YOUR_PUBLIC_IP  |
| A    | www   | YOUR_PUBLIC_IP  |

### Step 7 — Check connectivity
```powershell
.\scripts\check-connectivity.ps1
```

### Step 8 — Enable HTTPS (after HTTP is working)
```powershell
.\scripts\setup-https-ssl.ps1
```
Downloads win-acme, gets a free Let's Encrypt certificate, configures HTTPS vhost, and sets up auto-renewal.

### Step 9 — Register as Windows services (auto-start on boot)
```powershell
.\scripts\setup-windows-service.ps1
```
Registers Apache and the NestJS backend as Windows services that start automatically.

---

## Script Reference

| Script | Purpose |
|--------|---------|
| `setup-xampp-vhost.ps1` | Apache vhost + firewall + proxy config |
| `setup-https-ssl.ps1`   | Let's Encrypt SSL certificate + HTTPS vhost |
| `setup-windows-service.ps1` | Apache + NestJS as auto-start Windows services |
| `check-connectivity.ps1` | Verify DNS, Apache, ports, and public access |

## Logs

| Log | Location |
|-----|----------|
| Apache access | `C:\xampp\apache\logs\ovds-access.log` |
| Apache errors | `C:\xampp\apache\logs\ovds-error.log` |
| Apache SSL errors | `C:\xampp\apache\logs\ovds-ssl-error.log` |
| NestJS stdout | `C:\xampp\htdocs\tcab\logs\backend-stdout.log` |
| NestJS stderr | `C:\xampp\htdocs\tcab\logs\backend-stderr.log` |

## Troubleshooting

**Site not loading externally**
- Check router port forwarding is set correctly
- Verify DNS A records point to your current public IP
- Run `check-connectivity.ps1` to diagnose

**API calls failing (404 on /api)**
- Ensure NestJS backend is running on port 3000
- Check `mod_proxy` is enabled in Apache
- Verify `OVDS-Backend` Windows service is running

**SSL certificate errors**
- Ensure port 80 is publicly reachable before requesting cert
- Let's Encrypt rate limit: max 5 certs per domain per week
- Check `C:\xampp\apache\logs\ovds-ssl-error.log`

**Apache won't start after config changes**
- Test config: `C:\xampp\apache\bin\httpd.exe -t`
- Check syntax errors in `httpd-vhosts.conf`

---

## Dependency Optimization Pipeline

The optimization pipeline tracks bundle size over time, enforces dependency hygiene, checks for Prisma configuration issues, and acts as a CI regression gate. It runs bundle analysis, size-regression checks, and dependency audits (via knip, dedupe detection, and version-range inspection) on every relevant push or pull request. Reports are written locally under `.reports/` and uploaded as CI artifacts.

### Entry Points

| Command | What it does |
|---------|-------------|
| `pwsh -File scripts/optimize.ps1` | Full local run (build + all checks + report) |
| `pwsh -File scripts/optimize.ps1 -SkipBuild -SkipKnip -OpenReport` | Fast local run (uses cached build, skips slow knip, opens report) |
| `npm run optimize:bundle` | Bundle analysis only → `.reports/bundle/bundle-stats.json` |
| `npm run optimize:deps` | Dep hygiene only → `.reports/deps/dep-check.json` |
| `npm run optimize:size-check` | Size regression vs baseline → `.reports/bundle/size-check.json` |
| `npm run optimize:report` | Consolidate sub-reports → `.reports/optimize-summary.md` |
| `npm run optimize:size-baseline` | Advance the baseline after intentional size changes |
| `npx nx optimize frontend` | Single-project optimize via Nx |
| `npx nx run-many --target=optimize --projects=frontend,backend` | Multi-project optimize |

### `--fail-on-warn` Flag

By default all warnings are informational — the scripts exit 0 even when issues are found so developers can review them without blocking local work. Passing `--fail-on-warn` changes the exit code to 1 whenever any warning is present, mirroring CI behaviour. The `dep-optimization.yml` workflow automatically enables this flag (`STRICT_MODE=true`) when running on the `main` or `develop` branches, so the pipeline acts as a hard gate there.

### Report Locations

| Report | Path |
|--------|------|
| Bundle stats | `.reports/bundle/bundle-stats.json` |
| Bundle summary | `.reports/bundle/bundle-summary.md` |
| Size regression | `.reports/bundle/size-check.json` |
| Dep check | `.reports/deps/dep-check.json` |
| Full summary | `.reports/optimize-summary.md` |

> All reports are gitignored — CI uploads them as artifacts.

### Fixing Common Issues

| Issue | Fix |
|-------|-----|
| Loose `^` version ranges | Informational only — project policy uses caret ranges with `overrides` for pinning |
| `pnpm dedupe` opportunities | Run `pnpm dedupe` then commit `pnpm-lock.yaml` |
| Oversized chunk (>500 KB) | Split the route further in `vite.config.ts` `manualChunks` |
| Knip false positive | Add to `ignoreDependencies` in `knip.config.ts` |
| Prisma `binaryTargets` warning | Remove `binaryTargets` from `schema.prisma` generator block (not needed in Prisma 7 WASM) |

### Known Oversized Chunks

`index.js` (~830 KB) and `Dashboard.js` (~627 KB) are tracked issues. Both are above the 500 KB warning threshold but below their recorded baseline values, so the CI size-regression gate passes. Reducing them requires splitting their respective lazy-loaded route trees in `vite.config.ts`.
