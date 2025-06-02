import { app, BrowserWindow, ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'

import {
  checkRequiredFiles,
  getTelegramId,
  isSingboxRunning,
  runSingbox,
  saveTelegramId,
  stopSingboxAndDiscord
} from './vpn'

// Helper function
function spawnDiscord(discordExe: string, discordPath: string): void {
  spawn(discordExe, [], {
    detached: true,
    stdio: 'ignore',
    cwd: discordPath
  }).unref()
}

// Environment and paths
const isDev = !app.isPackaged
const singboxPath = isDev
  ? path.resolve(__dirname, '../../resources')
  : path.resolve(process.resourcesPath, 'app.asar.unpacked', 'resources')
const configDir = path.join(app.getPath('appData'), 'PesherkinoVPN')
const userConfigPath = path.join(configDir, 'config.json')

// IPC handlers
ipcMain.handle('get-telegram-id', async () => {
  return getTelegramId()
})

ipcMain.handle('check-vpn-status', async () => {
  return isSingboxRunning()
})

ipcMain.handle('run-vpn-setup', async (_event, telegramIdFromUI: string) => {
  try {
    const telegramId = telegramIdFromUI || getTelegramId()
    if (!telegramId) throw new Error('Telegram ID not provided')

    await stopSingboxAndDiscord()

    const configPath = path.join(singboxPath, 'config.json')
    checkRequiredFiles()
    copyPatchFiles()
    runSingbox(configPath)

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

ipcMain.handle('update-discord-status', async () => {
  return isSingboxRunning()
})

ipcMain.handle('stop-vpn', async () => {
  return stopSingboxAndDiscord()
})

ipcMain.handle('delete-discord-files', async () => {
  return deletePatchFiles()
})

ipcMain.handle('save-telegram-id', async (_event, telegramId: string) => {
  try {
    saveTelegramId(telegramId)
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
    win.hide()
    event.preventDefault()
  }
})

ipcMain.handle('get-ping', async () => {
  try {
    const ping = await getSocks5Ping()
    return ping
  } catch (err) {
    return null
  }
})

ipcMain.handle(
  'save-config-file',
  async (_event, filename: string, content: string, link?: string) => {
    try {
      const filePath = path.join(singboxPath, filename)
      let finalContent = content

      if (link) {
        const parsed = JSON.parse(content)
        parsed.currentLink = link
        finalContent = JSON.stringify(parsed, null, 2)
      }

      await fs.promises.writeFile(filePath, finalContent, 'utf8')

      if (link) {
        await fs.promises.mkdir(configDir, { recursive: true })

        let appDataConfig: { currentLink?: string } = {}
        try {
          const existing = await fs.promises.readFile(userConfigPath, 'utf8')
          appDataConfig = JSON.parse(existing)
        } catch {
          appDataConfig = {}
        }

        appDataConfig.currentLink = link
        await fs.promises.writeFile(userConfigPath, JSON.stringify(appDataConfig, null, 2), 'utf8')
      }

      return { success: true, path: filePath }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }
)

ipcMain.handle('check-config-exists', async (_event) => {
  const configPath = path.join(singboxPath, 'config.json')
  try {
    return fs.existsSync(configPath)
  } catch {
    return false
  }
})

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

function copyPatchFiles() {
  throw new Error('Function not implemented.')
}

function getLatestDiscordAppPath(): string {
  // Example implementation for Windows Discord install path
  // You may need to adjust this logic for your actual requirements
  const localAppData = process.env.LOCALAPPDATA
  if (!localAppData) throw new Error('LOCALAPPDATA environment variable not found')

  const discordBase = path.join(localAppData, 'Discord')
  if (!fs.existsSync(discordBase)) throw new Error('Discord base folder not found')

  // Find the latest version folder
  const versions = fs.readdirSync(discordBase)
    .filter((name) => name.startsWith('app-'))
    .sort()
  if (versions.length === 0) throw new Error('No Discord app versions found')

  return path.join(discordBase, versions[versions.length - 1])
}

function deletePatchFiles(): any {
  throw new Error('Function not implemented.')
}

function getSocks5Ping() {
  throw new Error('Function not implemented.')
}

