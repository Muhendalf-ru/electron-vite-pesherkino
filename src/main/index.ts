import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import { createWindow } from './window'
import { createTray } from './tray'
import './ipc/Config/config.ipc'
import './ipc/Discord/discord.ipc'
import './ipc/Logs/logs.ipc'
import './ipc/Proxy/proxy.ipc'
import './ipc/Config/configManager.ipc'
import './ipc/utils/utils.ipc'
import './ipc/Window/window.ipc'
import './ipc/Speedtest/speedtest.ipc'
import './ipc/Process/processManager.ipc'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { stopDiscordRPC } from './DiscordRpc/discordPresence'
import { stopSingboxAndDiscord } from './ipc/Singbox/singbox'
import { startDiscordRpcWatcher } from './ipc/Discord/discord'
import { stopVpnStatusWatcher } from './ipc/Proxy/proxy'
import * as Sentry from '@sentry/electron/main'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  debug: true
})

// const err = new Error('Manual test error ' + new Date().toISOString())

// console.log('Sending error:', err.message)

// Sentry.captureException(err, {
//   tags: {
//     origin: 'manual-test'
//   },
//   fingerprint: ['manual-test', new Date().toISOString()]
// })

// Sentry.flush(3000).then(() => {
//   console.log('Flushed, exiting...')
//   process.exit(1)
// })

export let mainWindow: BrowserWindow | null = null
let isQuitting = false

function setupApp(): void {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  mainWindow = createWindow()
  createTray(mainWindow)

  autoUpdater.checkForUpdatesAndNotify()

  autoUpdater.on('update-available', () => {
    mainWindow?.webContents.send('update-message', 'Доступно обновление...')
  })

  autoUpdater.on('update-downloaded', async () => {
    mainWindow?.webContents.send('update-message', 'Обновление загружено.')

    const result = dialog.showMessageBoxSync({
      type: 'question',
      buttons: ['Перезапустить', 'Позже'],
      defaultId: 0,
      message: 'Обновление загружено. Перезапустить сейчас?'
    })

    if (result === 0) {
      try {
        await stopSingboxAndDiscord()
      } catch (err) {
        console.error('Ошибка при остановке перед автообновлением:', err)
      } finally {
        autoUpdater.quitAndInstall()
      }
    }
  })

  autoUpdater.on('error', (err) => {
    mainWindow?.webContents.send('update-message', `Ошибка автообновления: ${err.message}`)
  })

  ipcMain.on('check-for-updates', () => {
    mainWindow?.webContents.send('update-message', 'Проверка обновлений...')
    autoUpdater.checkForUpdates()
  })

  autoUpdater.on('checking-for-update', () => {
    mainWindow?.webContents.send('update-message', 'Проверка обновлений...')
  })

  autoUpdater.on('update-not-available', () => {
    mainWindow?.webContents.send('update-message', 'Обновлений нет')
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow()
    }
  })
}

app.whenReady().then(async () => {
  setupApp()
  await startDiscordRpcWatcher()
})

app.on('window-all-closed', async () => {
  try {
    await stopDiscordRPC()
    await stopVpnStatusWatcher()
  } catch (e) {
    console.warn('Ошибка при остановке Discord RPC при закрытии всех окон:', e)
  }
  app.quit()
})

app.on('before-quit', async (event) => {
  if (isQuitting) return
  event.preventDefault()
  isQuitting = true

  try {
    await stopDiscordRPC()
  } catch (e) {
    console.error('Ошибка при остановке Discord RPC:', e)
  }

  try {
    await stopVpnStatusWatcher()
  } catch (e) {
    console.error('Ошибка при остановке VPN watcher:', e)
  }

  try {
    const result = await stopSingboxAndDiscord()
    if (!result.success) {
      console.error('Ошибка при остановке процессов:', result.error)
    }
  } catch (e) {
    console.error('Ошибка при остановке singbox и Discord:', e)
  }

  app.exit()
})

async function handleProcessExit() {
  try {
    await stopDiscordRPC()
    await stopVpnStatusWatcher()
  } catch {}

  try {
    await stopSingboxAndDiscord()
  } catch {}

  process.exit()
}

process.on('SIGINT', handleProcessExit)
process.on('SIGTERM', handleProcessExit)

process.on('uncaughtException', (error) => {
  Sentry.captureException(error)
})

process.on('unhandledRejection', (reason) => {
  Sentry.captureException(reason)
})
