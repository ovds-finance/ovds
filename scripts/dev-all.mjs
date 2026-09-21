/**
 * dev-all.mjs
 *
 * Starts backend first, waits for it to be listening, then starts the frontend.
 * This eliminates ECONNREFUSED errors from the Vite dev server proxy when
 * frontend hooks (useNetworkStatus, health checks) fire before the NestJS
 * backend has finished bootstrapping and called app.listen().
 *
 * Backend : node scripts/bin-run.mjs @nestjs/cli/bin/nest start --watch --builder swc
 * Frontend: node scripts/bin-run.mjs vite/bin/vite
 */
import { spawn } from 'node:child_process'
import net from 'node:net'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const binRun = resolve(__dirname, 'bin-run.mjs')

const BACKEND_PORT = 3000
const FRONTEND_PORT = 5173

let backend, frontend
let shuttingDown = false

function isPortListening(port, host = '127.0.0.1') {
  return new Promise(resolve => {
    const socket = net.createConnection({ port, host })
    socket.on('connect', () => { socket.end(); resolve(true) })
    socket.on('error', () => resolve(false))
  })
}

async function waitForPort(port, timeout = 120000, interval = 250, hosts = ['127.0.0.1', 'localhost', '0.0.0.0']) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    (function check() {
      let idx = 0
      function tryNext() {
        if (idx >= hosts.length) {
          if (Date.now() - start > timeout) return reject(new Error(`Timeout waiting for port ${port}`))
          setTimeout(check, interval)
          return
        }
        isPortListening(port, hosts[idx++]).then(listening => {
          if (listening) return resolve()
          tryNext()
        })
      }
      tryNext()
    })()
  })
}

function shutdown(signal) {
  if (shuttingDown) return
  shuttingDown = true
  console.log(`[dev-all] Received ${signal}, shutting down...`)
  for (const proc of [frontend, backend]) {
    if (proc && !proc.killed) proc.kill('SIGTERM')
  }
  setTimeout(() => process.exit(0), 1000)
}

function spawnProc(args, cwd, extraEnv = {}) {
  return spawn(process.execPath, [binRun, ...args], {
    shell: false,
    stdio: 'inherit',
    cwd,
    env: { ...process.env, ...extraEnv },
  })
}

async function main() {
  console.log('[dev-all] Starting backend...')

  function onBackendExit(code, signal) {
    if (shuttingDown) return
    if (signal === 'SIGTERM') return
    console.error(`[dev-all] Backend exited with code ${code}`)
    console.error('[dev-all] If this is a NestJS watch restart, ignore this message. Otherwise check the logs above.')
    frontend?.kill('SIGTERM')
    process.exit(code ?? 1)
  }

  function onBackendError(err) {
    console.error('[dev-all] Backend failed to start:', err)
    process.exit(1)
  }

  // Start backend directly — no NX project-graph overhead
  backend = spawnProc(
    ['@nestjs/cli/bin/nest', 'start', '--watch', '--builder', 'swc'],
    resolve(root, 'apps', 'backend'),
    { NODE_OPTIONS: '--max-old-space-size=2048' }
  )

  backend.on('error', onBackendError)
  backend.on('exit', onBackendExit)

  // Wait for the backend to be fully bootstrapped and listening before
  // starting the frontend. The NestJS bootstrap runs Prisma queries (RBAC
  // seeding, VAT manifest upsert) via OnModuleInit / OnApplicationBootstrap
  // before app.listen() is called. Starting Vite in parallel causes its
  // proxy to hit 127.0.0.1:3000 and emit ECONNREFUSED while the backend
  // is still in that phase.
  console.log(`[dev-all] Waiting for backend on port ${BACKEND_PORT}...`)
  try {
    await waitForPort(BACKEND_PORT)
    console.log(`[dev-all] Backend ready on port ${BACKEND_PORT}`)
  } catch (err) {
    console.error(`[dev-all] Backend did not become ready within timeout. Check logs above.`)
    backend?.kill('SIGTERM')
    process.exit(1)
  }

  console.log('[dev-all] Starting frontend...')

  // Start frontend directly — no NX project-graph overhead
  frontend = spawnProc(
    ['vite/bin/vite'],
    resolve(root, 'apps', 'frontend')
  )

  frontend.on('error', err => {
    console.error('[dev-all] Frontend failed to start:', err)
    process.exit(1)
  })

  frontend.on('exit', (code, signal) => {
    if (shuttingDown) return
    if (signal === 'SIGTERM') return
    console.error(`[dev-all] Frontend exited with code ${code}`)
    backend?.kill('SIGTERM')
    process.exit(code ?? 1)
  })

  waitForPort(FRONTEND_PORT)
    .then(() => console.log(`[dev-all] Frontend ready on port ${FRONTEND_PORT}`))
    .catch(() => console.warn('[dev-all] Frontend did not become ready within timeout'))

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

main()
