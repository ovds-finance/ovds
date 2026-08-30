import net from 'node:net'

const port = Number(process.argv[2] || 3000)
const timeout = Number(process.argv[3] || 120000)
const interval = 250
const start = Date.now()

function isListening () {
  return new Promise(resolve => {
    const socket = net.createConnection({ port, host: '127.0.0.1' })
    socket.on('connect', () => { socket.end(); resolve(true) })
    socket.on('error', () => resolve(false))
  })
}

async function main () {
  while (Date.now() - start < timeout) {
    if (await isListening()) {
      console.log(`[wait-for] Backend ready on port ${port}`)
      process.exit(0)
    }
    await new Promise(r => setTimeout(r, interval))
  }
  console.error(`[wait-for] Timeout waiting for port ${port}`)
  process.exit(1)
}

main()
