import { Client } from 'discord-rpc'
import { isSingboxRunning } from '../ipc/Singbox/singbox'

interface ActivityConfig {
  details: string
  state: string
  startTimestamp: number
  assets: {
    large_image: string
    large_text: string
  }
  buttons: Array<{
    label: string
    url: string
  }>
}

const DISCORD_CONFIG = {
  CLIENT_ID: '1378082680339697775',
  DEFAULT_ACTIVITY: {
    details: 'Самый лучший vpn сервис ❤️',
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
}

const LOG_PREFIX = '[RPC]'

let rpc: Client | null = null
let isReady = false

export async function initDiscordRPC(): Promise<void> {
  if (rpc) {
    console.log(`${LOG_PREFIX} RPC already initialized`)
    return
  }

  rpc = new Client({ transport: 'ipc' })

  rpc.on('ready', async () => {
    isReady = true
    console.log(`${LOG_PREFIX} Connected successfully!`)
    await updateActivityBasedOnVPNStatus()
  })

  rpc.on('disconnected', () => {
    isReady = false
    console.log(`${LOG_PREFIX} Disconnected!`)
    rpc = null
  })

  try {
    await rpc.login({ clientId: DISCORD_CONFIG.CLIENT_ID })
  } catch (err) {
    console.error(`${LOG_PREFIX} Auth error:`, err)
    isReady = false
    rpc = null
  }
}

async function updateActivityBasedOnVPNStatus(): Promise<void> {
  try {
    const running = await isSingboxRunning()
    setActivity(running ? 'Подключён к VPN' : 'Отключён от VPN')
  } catch (e) {
    console.error(`${LOG_PREFIX} Failed to get VPN status:`, e)
    setActivity('Статус неизвестен')
  }
}

export function setActivity(state: string): void {
  if (!rpc) {
    console.warn(`${LOG_PREFIX} RPC not initialized`)
    return
  }

  const activity: ActivityConfig = {
    ...DISCORD_CONFIG.DEFAULT_ACTIVITY,
    state,
    startTimestamp: Date.now()
  }

  rpc
    .request('SET_ACTIVITY', {
      pid: process.pid,
      activity
    })
    .then(() => console.log(`${LOG_PREFIX} Activity updated:`, state))
    .catch((err) => console.error(`${LOG_PREFIX} Activity update error:`, err))
}

export function clearActivity(): void {
  if (!rpc || !isReady) {
    console.warn(`${LOG_PREFIX} RPC not initialized`)
    return
  }

  rpc
    .request('SET_ACTIVITY', {
      pid: process.pid,
      activity: {}
    })
    .then(() => console.log(`${LOG_PREFIX} Activity cleared`))
    .catch((err) => console.error(`${LOG_PREFIX} Clear activity error:`, err))
}

export async function stopDiscordRPC(): Promise<void> {
  if (!rpc) return

  try {
    await rpc.destroy()
  } catch (e) {
    console.error(`${LOG_PREFIX} Stop RPC error:`, e)
  } finally {
    rpc = null
    isReady = false
  }
}
