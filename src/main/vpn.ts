import path from 'path'
import fs from 'fs'
import { spawn, exec } from 'child_process'
import axios from 'axios'
import { app } from 'electron'
import { clearActivity, setActivity, stopDiscordRPC } from './DiscordRpc/discordPresence'

const isDev = !app.isPackaged

const singboxPath = isDev
  ? path.resolve(__dirname, '../../resources')
  : path.resolve(process.resourcesPath, 'app.asar.unpacked', 'resources')

export function getSingboxPath(): string {
  return singboxPath
}

const configDir = path.join(app.getPath('appData'), 'PesherkinoVPN')
const configFilePath = path.join(configDir, 'config.json')

function ensureConfigDirExists() {
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true })
  }
}

function loadConfig(): Record<string, any> {
  ensureConfigDirExists()
  let config: Record<string, any> = {}

  if (fs.existsSync(configFilePath)) {
    try {
      const data = fs.readFileSync(configFilePath, 'utf-8')
      config = JSON.parse(data)
    } catch {
      config = {}
    }
  }

  // 🆕 Устанавливаем discordRpcEnabled по умолчанию, если не задан
  if (typeof config.discordRpcEnabled === 'undefined') {
    config.discordRpcEnabled = true
    saveConfig(config) // сохраняем обратно с новым значением
  }

  return config
}

function saveConfig(config: Record<string, any>) {
  ensureConfigDirExists()
  fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf-8')
}

export function getTelegramId(): string | null {
  const config = loadConfig()
  return config.telegramId || null
}

export function saveTelegramId(id: string): void {
  const config = loadConfig()
  config.telegramId = id
  saveConfig(config)
}

const baseUrl =
  process.env.VITE_VPN_CONFIG_URL || 'https://sub.pesherkino.store:8443/pesherkino/vpn/config'

export async function fetchConfig(telegramId: string): Promise<Buffer> {
  const url = `${baseUrl}/${telegramId}`
  const response = await axios.get(url, { responseType: 'arraybuffer' })

  try {
    const jsonTest = JSON.parse(response.data.toString())
    if (jsonTest?.message === 'Пользователь не найден или нет ссылок') {
      throw new Error('Пользователь не найден')
    }
  } catch {
    // если не JSON — ок, это бинарный конфиг
  }

  return response.data
}

export function checkRequiredFiles(): void {
  const filesPath = path.join(singboxPath, 'dll')
  if (!fs.existsSync(filesPath)) throw new Error(`Папка не найдена: ${filesPath}`)

  const requiredFiles = ['DWrite.dll', 'force-proxy.dll', 'proxy.txt']
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(filesPath, file))) {
      throw new Error(`Файл не найден: ${file}`)
    }
  }
}

export function runSingbox(configPath: string): void {
  const singboxExe = path.join(singboxPath, 'sing-box.exe')
  if (!fs.existsSync(singboxExe)) throw new Error('sing-box.exe не найден')

  spawn(singboxExe, ['run', '-c', configPath], {
    detached: true,
    stdio: 'ignore',
    cwd: singboxPath
  }).unref()
}

export async function isSingboxRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32' ? 'tasklist' : 'ps aux'
    exec(cmd, (err, stdout) => {
      if (err) return resolve(false)
      const isRunning =
        process.platform === 'win32'
          ? stdout.toLowerCase().includes('sing-box.exe')
          : stdout.toLowerCase().includes('sing-box')
      resolve(isRunning)
    })
  })
}
export async function stopSingboxAndDiscord(): Promise<{ success: boolean; error?: any }> {
  try {
    // Если нужно, раскомментируйте для остановки Discord RPC:
    await stopDiscordRPC()
    await stopVpnStatusWatcher()
  } catch (e) {
    console.error('Ошибка при остановке Discord RPC:', e)
  }

  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      // Останавливаем sing-box.exe и Discord.exe
      exec('taskkill /IM sing-box.exe /F', (err1) => {
        exec('taskkill /IM Discord.exe /F', (err2) => {
          if (err1 && err2) {
            console.error('Не удалось остановить sing-box.exe и Discord.exe:', err1, err2)
            resolve({ success: false, error: { singbox: err1, discord: err2 } })
          } else if (err1) {
            console.error('Не удалось остановить sing-box.exe:', err1)
            resolve({ success: false, error: { singbox: err1 } })
          } else if (err2) {
            console.error('Не удалось остановить Discord.exe:', err2)
            resolve({ success: false, error: { discord: err2 } })
          } else {
            resolve({ success: true })
          }
        })
      })
    } else {
      // Для Linux/macOS
      exec('pkill sing-box', (err1) => {
        exec('pkill discord', (err2) => {
          if (err1 && err2) {
            console.error('Не удалось остановить sing-box и discord:', err1, err2)
            resolve({ success: false, error: { singbox: err1, discord: err2 } })
          } else if (err1) {
            console.error('Не удалось остановить sing-box:', err1)
            resolve({ success: false, error: { singbox: err1 } })
          } else if (err2) {
            console.error('Не удалось остановить discord:', err2)
            resolve({ success: false, error: { discord: err2 } })
          } else {
            resolve({ success: true })
          }
        })
      })
    }
  })
}

export function setDiscordRpcEnabled(enabled: boolean): void {
  const cfg = loadConfig()
  cfg.discordRpcEnabled = enabled
  saveConfig(cfg)
}

export function getDiscordRpcEnabled(): boolean {
  const cfg = loadConfig()
  return !!cfg.discordRpcEnabled
}

import { EventEmitter } from 'events'

const vpnEmitter = new EventEmitter()

let lastVpnStatus: boolean | null = null
let watcherInterval: NodeJS.Timeout | null = null

/**
 * Запускает периодическую проверку статуса sing-box (VPN).
 * При смене статуса эмитит событие 'change', а также обновляет Discord RPC через setActivity.
 */
export async function startVpnStatusWatcher(intervalMs = 1000): Promise<void> {
  if (watcherInterval) return

  // Сбросить lastVpnStatus, чтобы статус всегда обновился при старте вотчера
  lastVpnStatus = null

  const checkOnce = async () => {
    const running = await isSingboxRunning()
    // Всегда обновляем Discord RPC при первом запуске вотчера
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
    // Далее — только при изменении статуса
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

/**
 * Подписаться на изменения статуса VPN: callback получит boolean (true=on, false=off)
 */
export function onVpnStatusChanged(callback: (running: boolean) => void): void {
  vpnEmitter.on('change', callback)
}
