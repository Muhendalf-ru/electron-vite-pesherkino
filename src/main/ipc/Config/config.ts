import { configDir, userConfigPath } from '../../constants/constants'
import fs from 'fs'

export function ensureConfigDirExists() {
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true })
  }
}

export function loadConfig(): Record<string, any> {
  ensureConfigDirExists()
  let config: Record<string, any> = {}

  if (fs.existsSync(userConfigPath)) {
    try {
      const data = fs.readFileSync(userConfigPath, 'utf-8')
      config = JSON.parse(data)
    } catch {
      config = {}
    }
  }

  if (typeof config.discordRpcEnabled === 'undefined') {
    config.discordRpcEnabled = true
    saveConfig(config)
  }

  return config
}

export function saveConfig(config: Record<string, any>) {
  ensureConfigDirExists()
  fs.writeFileSync(userConfigPath, JSON.stringify(config, null, 2), 'utf-8')
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
