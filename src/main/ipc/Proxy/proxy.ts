import { SocksProxyAgent } from 'socks-proxy-agent'
import { performance } from 'perf_hooks'
import { setActivity, clearActivity } from '../../DiscordRpc/discordPresence'
import { getDiscordRpcEnabled } from '../Discord/discord'
import { isSingboxRunning } from '../Singbox/singbox'
import { vpnEmitter } from '../../constants/constants'

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

let lastVpnStatus: boolean | null = null
let watcherInterval: NodeJS.Timeout | null = null

export async function startVpnStatusWatcher(intervalMs = 1000): Promise<void> {
  if (watcherInterval) return
  lastVpnStatus = null

  const checkOnce = async () => {
    const running = await isSingboxRunning()
    if (lastVpnStatus === null) {
      lastVpnStatus = running
      if (getDiscordRpcEnabled()) {
        if (running) {
          setActivity('⚡️ Подключён к VPN')
        } else {
          setActivity('🌑 Отключён от VPN')
        }
      }
      return
    }
    if (lastVpnStatus !== running) {
      lastVpnStatus = running
      if (getDiscordRpcEnabled()) {
        if (running) {
          setActivity('Подключён к VPN')
        } else {
          setActivity('Отключён от VPN')
        }
      }
    }
  }

  await checkOnce()
  watcherInterval = setInterval(checkOnce, intervalMs)
}

export async function stopVpnStatusWatcher(): Promise<void> {
  if (watcherInterval) {
    clearInterval(watcherInterval)
    watcherInterval = null
    lastVpnStatus = null
    if (getDiscordRpcEnabled()) {
      try {
        await clearActivity()
      } catch (e) {
        console.warn('Ошибка при очистке активности Discord:', e)
      }
    }
  }
}

export function onVpnStatusChanged(callback: (running: boolean) => void): void {
  vpnEmitter.on('change', callback)
}
