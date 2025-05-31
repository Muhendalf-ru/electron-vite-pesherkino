import { BrowserWindow, ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import {
  checkRequiredFiles,
  fetchConfig,
  getSingboxPath,
  getTelegramId,
  isSingboxRunning,
  runSingbox,
  saveTelegramId,
  stopSingboxAndDiscord
} from './vpn'
import { getLatestDiscordAppPath, copyPatchFiles, deletePatchFiles } from './discordFiles'

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

    const configData = await fetchConfig(telegramId)

    const singboxPath = getSingboxPath()
    const configPath = path.join(singboxPath, 'config.json')
    fs.writeFileSync(configPath, configData)

    checkRequiredFiles()
    copyPatchFiles(singboxPath)

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
