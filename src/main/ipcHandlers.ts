import { app, BrowserWindow, ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import {
  checkRequiredFiles,
  // fetchConfig,
  getSingboxPath,
  getTelegramId,
  isSingboxRunning,
  runSingbox,
  saveTelegramId,
  stopSingboxAndDiscord
} from './vpn'
import { getLatestDiscordAppPath, copyPatchFiles, deletePatchFiles } from './discordFiles'
import { getSocks5Ping } from './Proxy/getSocks5Ping'

ipcMain.handle('get-telegram-id', async () => {
  return getTelegramId()
})

ipcMain.handle('check-vpn-status', async () => {
  return isSingboxRunning()
})

ipcMain.handle('run-vpn-setup', async (_event, telegramIdFromUI: string) => {
  try {
    const telegramId = telegramIdFromUI || getTelegramId()
    if (!telegramId) {
      throw new Error('Telegram ID not provided')
    }

    // 🛑 Останавливаем Discord и Sing-box, если уже запущены
    await stopSingboxAndDiscord()

    // const configData = await fetchConfig(telegramId)

    const singboxPath = getSingboxPath()
    const configPath = path.join(singboxPath, 'config.json') // Переделать
    // fs.writeFileSync(configPath, configData)

    checkRequiredFiles()
    copyPatchFiles(singboxPath)

    runSingbox(configPath) // переделать

    const discordPath = getLatestDiscordAppPath()
    const discordExe = path.join(discordPath, 'Discord.exe')
    if (!fs.existsSync(discordExe)) throw new Error('Discord.exe not found')

    spawnDiscord(discordExe, discordPath)

    return { success: true }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    return { success: false, error: errorMessage }
  }
})

function spawnDiscord(discordExe: string, discordPath: string): void {
  spawn(discordExe, [], {
    detached: true,
    stdio: 'ignore',
    cwd: discordPath
  }).unref()
}

ipcMain.handle('update-discord-status', async () => {
  isSingboxRunning()
})

ipcMain.handle('stop-vpn', async () => {
  return stopSingboxAndDiscord()
})

ipcMain.handle('delete-discord-files', async () => {
  return deletePatchFiles()
})

ipcMain.handle('save-telegram-id', async (_event, telegramId: string) => {
  try {
    saveTelegramId(telegramId) // твоя функция записи в файл
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
})

ipcMain.on('window-minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) win.minimize()
})

ipcMain.on('window-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return
  if (win.isMaximized()) {
    win.unmaximize()
  } else {
    win.maximize()
  }
})

ipcMain.on('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) {
    // Прячем в трей вместо закрытия
    win.hide()
    event.preventDefault()
  }
})

ipcMain.handle('get-ping', async () => {
  try {
    const ping = await getSocks5Ping()
    return ping
  } catch (err) {
    return null // или -1
  }
})

// test
const isDev = !app.isPackaged

const singboxPath = isDev
  ? path.resolve(__dirname, '../../resources')
  : path.resolve(process.resourcesPath, 'app.asar.unpacked', 'resources')

const configDir = path.join(app.getPath('appData'), 'PesherkinoVPN')
const userConfigPath = path.join(configDir, 'config.json')

ipcMain.handle(
  'save-config-file',
  async (_event, filename: string, content: string, link?: string) => {
    try {
      // Путь в статичные ресурсы (для прокси)
      const filePath = path.join(singboxPath, filename)

      let finalContent = content

      if (link) {
        const parsed = JSON.parse(content)
        parsed.currentLink = link
        finalContent = JSON.stringify(parsed, null, 2)
      }

      // Записываем полный конфиг в singboxPath
      await fs.promises.writeFile(filePath, finalContent, 'utf8')

      // Записываем только currentLink в AppData\Roaming\PesherkinoVPN\config.json
      if (link) {
        await fs.promises.mkdir(configDir, { recursive: true })

        // Читаем существующий конфиг из AppData
        let appDataConfig: { currentLink?: string } = {}
        try {
          const existing = await fs.promises.readFile(userConfigPath, 'utf8')
          appDataConfig = JSON.parse(existing)
        } catch {
          appDataConfig = {}
        }

        // Обновляем поле currentLink
        appDataConfig.currentLink = link

        // Записываем обратно в файл
        await fs.promises.writeFile(userConfigPath, JSON.stringify(appDataConfig, null, 2), 'utf8')
      }

      return { success: true, path: filePath }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }
)

ipcMain.handle('check-config-exists', async (_event) => {
  // const fs = require('fs')
  // const path = require('path')
  // const configPath = path.join(app.getPath('userData'), filename)
  const configPath = path.join(singboxPath, 'config.json')

  try {
    return fs.existsSync(configPath)
  } catch (error) {
    return false
  }
})

// const configDir = path.join(app.getPath('appData'), 'PesherkinoVPN')

ipcMain.handle('get-current-link', async () => {
  const configPath = path.join(configDir, 'config.json')
  try {
    const content = fs.readFileSync(configPath, 'utf-8')
    const config = JSON.parse(content)
    return config?.currentLink || null
  } catch {
    return null
  }
})
