import { execSync } from 'node:child_process'
import net from 'node:net'

function isPortListening (port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host })
    socket.on('connect', () => { socket.end(); resolve(true) })
    socket.on('error', () => resolve(false))
  })
}

function killByNetstat (ports) {
  const cmd = `netstat -ano | findstr LISTENING`
  let killed = 0
  try {
    const out = execSync(cmd, { stdio: 'pipe', encoding: 'utf8' })
    const portPids = new Map()
    for (const line of out.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed) continue
      const parts = trimmed.split(/\s+/)
      const localAddr = parts[1] ?? ''
      const portNum = localAddr.split(':').pop()
      if (!portNum || !ports.includes(Number(portNum))) continue
      const pid = parts[parts.length - 1]
      if (pid && /^\d+$/.test(pid) && pid !== '0') {
        if (!portPids.has(portNum)) portPids.set(portNum, new Set())
        portPids.get(portNum).add(pid)
      }
    }
    for (const pids of portPids.values()) {
      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' })
          killed++
        } catch { /* process may have already exited */ }
      }
    }
  } catch { /* no matching entries */ }
  return killed
}

async function main () {
  const portsSource = process.env.PORTS || process.env.PORT;
  const ports = portsSource ? String(portsSource).split(',').map(p => p.trim()) : ['3000', '3001', '3002', '3003', '5173', '5174'];
  const portNumbers = ports.map(Number).filter(p => Number.isFinite(p) && p > 0)

  const occupied = (await Promise.all(portNumbers.map(async p => {
    const listening = await isPortListening(p)
    return listening ? p : null
  }))).filter((p) => p !== null)

  for (const p of portNumbers) {
    const listening = occupied.includes(p)
    console.log(`[ensure-ports] Port ${p} is ${listening ? 'in use' : 'free'}.`)
  }

  if (occupied.length > 0) {
    const killed = killByNetstat(occupied)
    console.log(`[ensure-ports] Killed ${killed} process(es).`)

    await new Promise(r => setTimeout(r, 150))
    const stillOccupied = (await Promise.all(occupied.map(async p => {
      const listening = await isPortListening(p)
      return listening ? p : null
    }))).filter((p) => p !== null)

    for (const p of occupied) {
      if (stillOccupied.includes(p)) {
        console.warn(`[ensure-ports] Port ${p} still appears in use after kill attempt.`)
      } else {
        console.log(`[ensure-ports] Port ${p} freed.`)
      }
    }
  }
}

main().catch((err) => { console.error('[ensure-ports] Failed:', err); process.exit(1) })
