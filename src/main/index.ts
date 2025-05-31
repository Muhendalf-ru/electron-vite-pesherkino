import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import { createWindow } from './window'
import { createTray } from './tray'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import './ipcHandlers'
import fs from 'fs'
import path from 'path'

import {
  getDiscordRpcEnabled,
  isSingboxRunning,
  onVpnStatusChanged,
  setDiscordRpcEnabled,
  startVpnStatusWatcher,
  stopSingboxAndDiscord,
  stopVpnStatusWatcher
} from './vpn'

import { initDiscordRPC, stopDiscordRPC } from './DiscordRpc/discordPresence'

let mainWindow: BrowserWindow | null = null
let isQuitting = false

function setupApp(): void {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  mainWindow = createWindow()
  createTray(mainWindow)

  // Автообновление
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

  const discordEnabled = await getDiscordRpcEnabled()
  if (discordEnabled) {
    try {
      await initDiscordRPC()
      await startVpnStatusWatcher()
    } catch (err) {
      console.error('Ошибка при запуске Discord RPC или VPN watcher:', err)
    }
  }
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

// Логи
const isDev = !app.isPackaged
const logFilePath = isDev
  ? path.join('C:\\Github Project\\electron-vite-pesherkino', 'resources', 'console')
  : path.resolve(process.resourcesPath, 'app.asar.unpacked', 'resources', 'console')

export function getLogFilePath(): string {
  return logFilePath
}

ipcMain.handle('get-logs', async () => {
  try {
    return await fs.promises.readFile(logFilePath, 'utf-8')
  } catch (error) {
    console.error('Ошибка чтения файла логов:', error)
    throw new Error('Не удалось прочитать логи')
  }
})

// Корректное завершение при выходе
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
    await stopVpnStatusWatcher() // <--- добавить, если не вызывается через stopSingboxAndDiscord
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

// Обработка сигналов завершения процесса
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

/**
 * IPC: получить текущее состояние Discord RPC (true/false)
 */
ipcMain.handle('get-discord-rpc-enabled', () => {
  return getDiscordRpcEnabled()
})

// IPC - VPN watcher
ipcMain.handle('start-vpn-watcher', () => startVpnStatusWatcher())
ipcMain.handle('stop-vpn-watcher', () => stopVpnStatusWatcher())

/**
 * IPC: получить текущее состояние VPN (true/false)
 */
ipcMain.handle('get-vpn-status', async () => {
  try {
    return await isSingboxRunning()
  } catch {
    return false
  }
})

/**
 * IPC: изменить состояние Discord RPC (вкл/выкл)
 */
ipcMain.handle('set-discord-rpc-enabled', async (_, enabled: boolean) => {
  try {
    setDiscordRpcEnabled(enabled)

    if (enabled) {
      // Остановим старый клиент и вотчер, если были
      try {
        await stopDiscordRPC()
        await stopVpnStatusWatcher()
      } catch (e: unknown) {
        console.warn('stopDiscordRPC перед init ошибся:', e)
      }
      stopVpnStatusWatcher()
      await initDiscordRPC()
      await startVpnStatusWatcher()
    } else {
      // Очищаем статус и останавливаем всё
      try {
        await stopDiscordRPC()
      } catch (e: unknown) {
        console.warn('stopDiscordRPC при выключении ошибся:', e)
      }
      stopVpnStatusWatcher()
    }

    // Уведомляем рендерер о смене статуса
    mainWindow?.webContents.send('discord-rpc-status-changed', enabled)
  } catch (err) {
    console.error('Ошибка при смене состояния Discord RPC:', err)
  }
})

/**
 * IPC: подписка на изменения VPN-статуса
 */
ipcMain.handle('on-vpn-status-changed', (event) => {
  const webContents = event.sender
  const listener = (running: boolean) => {
    webContents.send('vpn-status-changed', running)
  }
  onVpnStatusChanged(listener)

  // Когда рендерер вызовет 'remove-vpn-status-listener', уберём подписку
  const removeListener = () => {
    onVpnStatusChanged(() => {}) // просто заглушка, EventEmitter не удаляет анонимные
  }

  ipcMain.on('remove-vpn-status-listener', (removeEvent) => {
    if (removeEvent.sender === webContents) {
      removeListener()
    }
  })
})

/**
 * IPC: подписка на изменения Discord RPC-статуса
 */

ipcMain.handle('on-discord-rpc-status-changed', (event) => {
  const webContents = event.sender
  // Здесь можно реализовать подписку на событие, если потребуется

  // Для удаления слушателя используем отдельный ipcMain.on
  ipcMain.on('remove-discord-rpc-status-listener', (removeEvent) => {
    if (removeEvent.sender === webContents) {
      // Здесь можно удалить слушателя, если он был добавлен
      // Например: someEmitter.removeListener('discord-rpc-status-changed', listener)
    }
  })
})
