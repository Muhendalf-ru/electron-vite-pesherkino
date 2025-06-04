import { Client } from 'discord-rpc'
import { isSingboxRunning } from '../ipc/Singbox/singbox'

const clientId = '1378082680339697775'
let rpc: Client | null = null
let isReady = false

export async function initDiscordRPC(): Promise<void> {
  if (rpc) return
  rpc = new Client({ transport: 'ipc' })

  rpc.on('ready', async () => {
    isReady = true
    console.log('[RPC] Hooked!')
    try {
      const running = await isSingboxRunning()
      if (running) {
        setActivity('Подключён к VPN')
      } else {
        setActivity('Отключён от VPN')
      }
    } catch (e) {
      console.error('[RPC] Не удалось получить статус VPN:', e)
    }
  })

  rpc.on('disconnected', () => {
    isReady = false
    console.log('[RPC] Disconnected!')
    rpc = null
    // Переподключение теперь не здесь, а через вотчер!
  })

  try {
    await rpc.login({ clientId })
  } catch (err) {
    console.error('[RPC] Login error:', err)
    isReady = false
    rpc = null
    // Переподключение теперь не здесь, а через вотчер!
  }
}

export function setActivity(state: string): void {
  if (!rpc) {
    console.warn('[RPC] Not initialized')
    return
  }
  rpc
    .request('SET_ACTIVITY', {
      pid: process.pid,
      activity: {
        details: 'Самый лучший vpn сервис ❤️',
        state,
        startTimestamp: Date.now(),
        assets: {
          large_image: 'chatgpt_image_26_2025_23_43_59',
          large_text: 'Шкодит обходя блокировки'
        },
        buttons: [
          {
            label: 'Подключиться',
            url: 'https://t.me/pesherkino_bot?start=ref_855347094'
          },
          {
            label: 'Поддержка',
            url: 'https://t.me/pesherkino_support'
          }
        ]
      }
    })
    .then(() => console.log('[RPC] Activity set:', state))
    .catch((err) => console.error('[RPC] Activity error:', err))
}

export function clearActivity(): void {
  if (!rpc || !isReady) {
    console.warn('[RPC] Not initialized')
    return
  }
  rpc
    .request('SET_ACTIVITY', {
      pid: process.pid,
      activity: {}
    })
    .then(() => console.log('[RPC] Activity cleared'))
    .catch((err) => console.error('[RPC] Clear activity error:', err))
}

export async function stopDiscordRPC(): Promise<void> {
  if (rpc) {
    try {
      await rpc.destroy()
    } catch (e) {
      // ignore
    }
    rpc = null
    isReady = false
  }
}
