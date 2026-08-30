import { spawn } from 'node:child_process'
import net from 'node:net'

const BACKEND_PORT = 3000
const FRONTEND_PORT = 5173

function isPortListening (port, host = '127.0.0.1') {
  return new Promise(resolve => {
    const socket = net.createConnection({ port, host })
    socket.on('connect', () => { socket.end(); resolve(true) })
    socket.on('error', () => resolve(false))
  })
}

function waitForPort (port, timeout = 120000, interval = 100) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    (function check () {
      isPortListening(port).then(listening => {
        if (listening) return resolve()
        if (Date.now() - start > timeout) return reject(new Error(`Timeout waiting for port ${port}`))
        setTimeout(check, interval)
      })
    })()
  })
}

async function main () {
  console.log('[dev-all] Starting backend and frontend in parallel...')

  // Use `nx dev` so Nx's dependency graph is honoured and the target
  // picks up the NODE_OPTIONS + SWC builder flags from project.json.
  const backend = spawn(
    'npx',
    ['nx', 'dev', 'backend'],
    {
      shell: true,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_OPTIONS: '--max-old-space-size=2048',
        FORCE_COLOR: '1',
      },
    }
  )

  backend.on('error', err => {
    console.error('[dev-all] Backend failed to start:', err)
    process.exit(1)
  })

  // Wait for the backend port to be ready before starting the frontend
  // so Vite's proxy target is available on first HMR connection.
  console.log(`[dev-all] Waiting for backend on port ${BACKEND_PORT}...`)
  await waitForPort(BACKEND_PORT).catch(() => {
    console.warn('[dev-all] Backend did not become ready within timeout — starting frontend anyway')
  })
  console.log('[dev-all] Backend ready — starting frontend')

  const frontend = spawn(
    'npx',
    ['nx', 'dev', 'frontend'],
    {
      shell: true,
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: '1' },
    }
  )

  frontend.on('error', err => {
    console.error('[dev-all] Frontend failed to start:', err)
    process.exit(1)
  })

  waitForPort(FRONTEND_PORT).then(() => {
    console.log('[dev-all] Frontend ready on port 5173')
  }).catch(() => {
    console.warn('[dev-all] Frontend did not become ready within timeout')
  })

  const shutdown = (signal) => {
    console.log(`[dev-all] Received ${signal}, shutting down...`)
    frontend.kill('SIGTERM')
    backend.kill('SIGTERM')
    setTimeout(() => process.exit(0), 500)
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

main()
