import fs from 'fs'
import { machineIdSync } from 'node-machine-id'
import { userConfigPath, configDir } from '../Config/configManager.ipc'
import dotenv from 'dotenv'
dotenv.config()

import os from 'os'
import { app } from 'electron'

console.log('process.cwd():', process.cwd())
console.log('__dirname:', __dirname)
console.log('[DEBUG] API_SECRET:', process.env.API_SECRET)
console.log('[DEBUG] MEASUREMENT_ID:', process.env.MEASUREMENT_ID)

const API_SECRET = process.env.API_SECRET || ''
const MEASUREMENT_ID = process.env.MEASUREMENT_ID || ''

if (!API_SECRET || !MEASUREMENT_ID) {
  console.error('GA: переменные не заданы')
}

interface UserConfig {
  userId?: string
  // здесь можно расширить, если нужны другие настройки
}

function readConfig(): UserConfig {
  try {
    if (fs.existsSync(userConfigPath)) {
      const raw = fs.readFileSync(userConfigPath, 'utf-8')
      return JSON.parse(raw) as UserConfig
    }
  } catch (e) {
    console.warn('Ошибка чтения конфига:', e)
  }
  return {}
}

function writeConfig(config: UserConfig) {
  try {
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true })
    }
    fs.writeFileSync(userConfigPath, JSON.stringify(config, null, 2), 'utf-8')
  } catch (e) {
    console.warn('Ошибка записи конфига:', e)
  }
}

function getClientId(): string {
  const config = readConfig()

  if (config.userId) {
    return config.userId
  }

  const newId = machineIdSync()
  config.userId = newId
  writeConfig(config)

  return newId
}

export { getClientId }

// Получение расширенной информации о системе и приложении
function getDefaultParams() {
  return {
    app_version: app?.getVersion?.() || '',
    os_platform: process.platform,
    os_release: os.release(),
    os_arch: process.arch,
    lang: process.env.LANG || '',
    node_version: process.version,
    electron_version: process.versions?.electron || '',
    timestamp: Date.now(),
  }
}

// Генерация уникального session_id для каждой сессии запуска
function generateSessionId() {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`
}

let session_id: string | null = null
let engagementInterval: NodeJS.Timeout | null = null

export function initAnalytics(mainScreenName = 'Main') {
  session_id = generateSessionId()
  const client_id = getClientId()

  // Событие app_open (GA4 стандарт)
  sendEvent('app_open', { session_id})

  // Событие session_start (GA4 стандарт)
  sendEvent('session_start', { session_id})

  // Событие screen_view (GA4 стандарт)
  sendEvent('screen_view', {
    session_id,
    screen_name: mainScreenName,
    app_name: app?.getName?.() || 'ElectronApp',
    app_version: app?.getVersion?.() || '',
  })

  // Регулярно отправляем user_engagement и screen_view
  if (engagementInterval) clearInterval(engagementInterval)
  engagementInterval = setInterval(() => {
    sendEvent('user_engagement', {
      session_id,
      engagement_time_msec: 60000,
    })
    // Дополнительно отправляем screen_view для лучшей фиксации активности
    sendEvent('screen_view', {
      session_id,
      screen_name: mainScreenName,
      app_name: app?.getName?.() || 'ElectronApp',
      app_version: app?.getVersion?.() || '',
    })
  }, 30000)
}

export async function sendEvent(name: string, params: Record<string, any> = {}) {
  const client_id = getClientId()
  const user_id = client_id
  const payload = {
    client_id,
    user_id,
    user_properties: {
      platform: { value: process.platform },
      app_version: { value: app?.getVersion?.() || '' },
    },
    events: [
      {
        name,
        params: {
          ...params,
          session_id: session_id || undefined,
          app_name: app?.getName?.() || 'ElectronApp',
          app_version: app?.getVersion?.() || '',
          engagement_time_msec: 1000,
          traffic_source: {
            medium: 'app',
            source: 'electron',
            name: 'direct',
          },
          debug_mode: process.env.NODE_ENV === 'development',
        }
      },
    ],
  }

  try {
    const res = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )
    const text = await res.text()
    console.log(`[GA] ${name}: ${res.status} ${res.statusText} — ${text}`)
  } catch (err) {
    console.error(`[GA] Ошибка отправки события ${name}:`, err)
  }
}

// Для ручной отправки screen_view при смене экрана
export function sendScreenView(screenName: string) {
  if (!session_id) return
  sendEvent('screen_view', {
    session_id,
    screen_name: screenName,
    app_name: app?.getName?.() || 'ElectronApp',
    app_version: app?.getVersion?.() || '',
  })
}