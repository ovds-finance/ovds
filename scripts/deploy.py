#!/usr/bin/env python3
"""
OVDS Full Deployment Script — Interactive shell via SSH
Handles Plesk restricted shells that close exec_command channels.
"""
import paramiko, sys, time

HOST     = "ovds.com.et"
PORT     = 22
USERNAME = "uscis"
PASSWORD = "te091393!"
APP_DIR  = "/httpdocs"

# Sentinel we echo after each command so we know it's done
SENTINEL = "___CMD_DONE___"

def section(title):
    print(f"\n{'='*60}\n  {title}\n{'='*60}")

def drain(chan, idle_timeout=5, hard_timeout=600):
    """Read until idle for idle_timeout seconds or hard_timeout total."""
    buf = ""
    deadline = time.time() + hard_timeout
    last_recv = time.time()
    while time.time() < deadline:
        if chan.recv_ready():
            chunk = chan.recv(16384).decode("utf-8", errors="replace")
            buf += chunk
            sys.stdout.write(chunk)
            sys.stdout.flush()
            last_recv = time.time()
            if SENTINEL in buf:
                break
        elif time.time() - last_recv > idle_timeout:
            break
        time.sleep(0.1)
    return buf

def run(chan, cmd, wait=120):
    """Send command, wait for sentinel, return output."""
    print(f"\n$ {cmd}\n" + "-"*60)
    chan.send(cmd + f"; echo {SENTINEL}\n")
    return drain(chan, idle_timeout=5, hard_timeout=wait)

def main():
    section("Connecting to ovds.com.et")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(HOST, port=PORT, username=USERNAME, password=PASSWORD, timeout=15)
        print("Connected")
    except Exception as e:
        print(f"Connection failed: {e}")
        sys.exit(1)

    chan = client.invoke_shell(width=220, height=50)
    # Wait for shell prompt — drain welcome banner
    print("Waiting for shell prompt...")
    drain(chan, idle_timeout=4, hard_timeout=15)
    print("Shell ready.")

    section("Server info")
    run(chan, "echo SHELL=$SHELL && node --version && npm --version && id", wait=15)

    section("App directory")
    run(chan, f"ls {APP_DIR}", wait=10)

    section("Step 1 — npm install (backend)")
    run(chan, f"cd {APP_DIR} && npm install --legacy-peer-deps 2>&1", wait=300)

    section("Step 2 — Pin Prisma 7")
    run(chan,
        f"cd {APP_DIR} && npm install prisma@7.8.0 @prisma/client@7.8.0 @prisma/adapter-mariadb@7.8.0 --save-exact --legacy-peer-deps 2>&1",
        wait=120)

    section("Step 3 — Write prisma.config.js")
    # Write the Prisma 7 config with adapter
    config_content = r"""// @ts-check
const { defineConfig } = require('prisma/config');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
function getAdapter() {
  const url = process.env.PRISMA_DATABASE_URL;
  if (!url) throw new Error('PRISMA_DATABASE_URL is not set');
  const parsed = new URL(url);
  return new PrismaMariaDb({
    host: parsed.hostname,
    port: parsed.port ? parseInt(parsed.port, 10) : 3306,
    user: parsed.username || 'root',
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    database: parsed.pathname.replace(/^\//, ''),
    connectionLimit: 10,
  });
}
module.exports = defineConfig({ schema: './prisma/schema.prisma', adapter: getAdapter });"""
    # Use node to write the file (avoids shell quoting issues)
    run(chan,
        f"""node -e "require('fs').writeFileSync('{APP_DIR}/packages/database/prisma.config.js', {repr(config_content)})" """,
        wait=10)

    section("Step 4 — Prisma generate")
    run(chan,
        f"cd {APP_DIR} && NODE_TLS_REJECT_UNAUTHORIZED=0 "
        "PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 "
        "node_modules/.bin/prisma generate --config=packages/database/prisma.config.js 2>&1",
        wait=180)

    section("Step 5 — Build shared libraries")
    run(chan, f"cd {APP_DIR} && npm run build:libs 2>&1", wait=300)

    section("Step 6 — Build backend")
    run(chan, f"cd {APP_DIR} && npm run build -w @ovds/backend 2>&1", wait=300)

    section("Step 7 — Build frontend")
    run(chan, f"cd {APP_DIR} && npm run build -w ovds-frontend 2>&1", wait=300)

    section("Step 8 — Verify artifacts")
    run(chan, f"ls -lh {APP_DIR}/apps/backend/dist/main.js {APP_DIR}/public/index.html 2>&1", wait=10)

    section("Step 9 — DB push")
    run(chan,
        f"cd {APP_DIR} && NODE_TLS_REJECT_UNAUTHORIZED=0 "
        "node_modules/.bin/prisma db push --config=packages/database/prisma.config.js --accept-data-loss 2>&1",
        wait=180)

    section("Step 10 — Ensure logs dir")
    run(chan, f"mkdir -p {APP_DIR}/logs && echo 'logs OK'", wait=10)

    section("Step 11 — Restart via PM2")
    run(chan,
        f"cd {APP_DIR} && (pm2 restart ovds-api || pm2 start ecosystem.config.js --env production) && pm2 save 2>&1",
        wait=30)

    section("Step 12 — Health check")
    time.sleep(8)
    run(chan, "curl -sf http://127.0.0.1:3001/api/health/live || echo 'not responding yet'", wait=15)

    section("Deployment complete")
    print("\nhttps://ovds.com.et")
    chan.close()
    client.close()

if __name__ == "__main__":
    main()
