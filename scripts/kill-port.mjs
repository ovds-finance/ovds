/**
 * kill-port.mjs — kills any process listening on the given port (Windows-safe).
 * Usage: node scripts/kill-port.mjs 3000
 * Exits 0 whether or not a process was found — never blocks startup.
 */
import { execSync } from 'child_process';

const port = process.argv[2];
if (!port) process.exit(0);

try {
  if (process.platform === 'win32') {
    // Find PID listening on the port
    const result = execSync(
      `netstat -ano | findstr :${port} | findstr LISTENING`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
    ).trim();

    const pids = [...new Set(
      result.split('\n')
        .map(line => line.trim().split(/\s+/).pop())
        .filter(pid => pid && /^\d+$/.test(pid) && pid !== '0'),
    )];

    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F /T`, { stdio: 'pipe' });
        console.log(`[kill-port] Killed PID ${pid} on port ${port}`);
      } catch {
        // Already gone — ignore
      }
    }
  } else {
    execSync(`lsof -ti tcp:${port} | xargs kill -9`, { stdio: 'pipe' });
  }
} catch {
  // No process on that port — that's fine
}

process.exit(0);
