import { SocksProxyAgent } from 'socks-proxy-agent'
import { performance } from 'perf_hooks'

export async function getSocks5Ping(): Promise<number> {
  return new Promise((resolve, reject) => {
    const proxy = 'socks5h://127.0.0.1:1080'
    const agent = new SocksProxyAgent(proxy)

    const startTime = performance.now()
    const req = require('https').get(
      {
        host: 'google.com',
        port: 443,
        agent: agent,
        timeout: 5000
      },
      (res: any) => {
        const ping = performance.now() - startTime
        res.destroy()
        resolve(Math.round(ping))
      }
    )

    req.on('error', (err: Error) => {
      reject(err)
    })
    // fallback timeout
    setTimeout(() => {
      reject(new Error('Timeout'))
    }, 5000)
  })
}