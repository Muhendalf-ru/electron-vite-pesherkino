import { Client } from 'discord-rpc'
import { isSingboxRunning } from '../ipc/Singbox/singbox'

const DISCORD_CONFIG = {
  CLIENT_ID: '1378082680339697775',
  DEFAULT_ACTIVITY: {
    details: 'Даже медведи на Камчатке доверяют нашему сервису! 🐻✨',
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

const DETAILS_VARIANTS = [
  'Даже медведи на Камчатке доверяют нашему сервису! 🐻✨',
  'Даже Лабубу в Китае доверяют нашему сервису 🩷',
  'Даже Бобрито Бандито и Тун Тун Сахур выбирают наш прокси — а ты? 🔥',
  'В жизни — abort по-человечески, в VPN — abort контроллер не даст тебя слить! 🚀'
]

let detailsIndex = 0
let detailsInterval: NodeJS.Timeout | null = null
let currentState = 'Статус неизвестен'
let startTimestamp = Math.floor(Date.now() / 1000)

export async function initDiscordRPC(): Promise<void> {
  if (rpc) {
    console.log(`${LOG_PREFIX} RPC already initialized`)
    return
  }

  rpc = new Client({ transport: 'ipc' })

 
  rpc.on('ready', async () => {
    isReady = true
    console.log(`${LOG_PREFIX} Connected successfully!`)
  
    // Получаем статус VPN один раз при старте
    try {
      const running = await isSingboxRunning()
      currentState = running ? 'Подключён к VPN' : 'Отключён от VPN'
    } catch (e) {
      console.error(`${LOG_PREFIX} Failed to get VPN status:`, e)
      currentState = 'Статус неизвестен'
    }
  
    startTimestamp = Math.floor(Date.now() / 1000)  // Инициализация таймстампа при подключении
    startDetailsRotation()
  })

  rpc.on('disconnected', () => {
    isReady = false
    console.log(`${LOG_PREFIX} Disconnected!`)
    stopDetailsRotation()
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

function startDetailsRotation(): void {
  if (!rpc) return

  // Сразу выставляем первый статус
  updateActivityWithCurrentDetails()

  if (detailsInterval) {
    clearInterval(detailsInterval)
  }

  // Увеличиваем интервал до 15 секунд
  detailsInterval = setInterval(() => {
    updateActivityWithCurrentDetails()
  }, 15000)
}

function stopDetailsRotation(): void {
  if (detailsInterval) {
    clearInterval(detailsInterval)
    detailsInterval = null
  }
}

function updateActivityWithCurrentDetails(): void {
  if (!rpc) return

  const currentDetails = DETAILS_VARIANTS[detailsIndex]
  detailsIndex = (detailsIndex + 1) % DETAILS_VARIANTS.length

  console.log(`${LOG_PREFIX} Rotating status: ${detailsIndex}/${DETAILS_VARIANTS.length} - "${currentDetails}"`)

  const activity = {
    details: currentDetails,
    state: currentState,
    timestamps: {
      start: startTimestamp
    },
    assets: {
      large_image: DISCORD_CONFIG.DEFAULT_ACTIVITY.assets.large_image,
      large_text: DISCORD_CONFIG.DEFAULT_ACTIVITY.assets.large_text
    },
    buttons: DISCORD_CONFIG.DEFAULT_ACTIVITY.buttons
  }

  rpc
    .request('SET_ACTIVITY', {
      pid: process.pid,
      activity,
    })
    .then(() => {
      console.log(`${LOG_PREFIX} Activity updated: details="${currentDetails}", state="${currentState}"`)
    })
    .catch((err) => {
      console.error(`${LOG_PREFIX} Activity update error:`, err)
      // Если произошла ошибка, пробуем обновить статус через 5 секунд
      setTimeout(() => {
        updateActivityWithCurrentDetails()
      }, 5000)
    })
}

export function setActivity(state: string): void {
  currentState = state
  updateActivityWithCurrentDetails()
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
    stopDetailsRotation()
    rpc = null
    isReady = false
  }
}
