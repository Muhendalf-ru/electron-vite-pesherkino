// Основные импорты Electron и модулей проекта
import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import { createWindow } from './window'
import { createTray } from './tray'
import './proxyConnections'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import './ipcHandlers'
import fs from 'fs'
import path from 'path'
import  { initDiscordRPC, stopDiscordRPC } from './DiscordRpc/discordPresence'
import { getDiscordRpcEnabled, stopSingboxAndDiscord,  startVpnStatusWatcher,  stopVpnStatusWatcher, isSingboxRunning, setDiscordRpcEnabled,  onVpnStatusChanged } from './vpn'

let mainWindow: BrowserWindow | null = null
let isQuitting = false

// Основная функция для инициализации приложения
function setupApp(): void {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  mainWindow = createWindow()
  createTray(mainWindow)

  autoUpdater.checkForUpdatesAndNotify()

  // Обработка обновлений
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

  // Ручная проверка обновлений
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

// Запуск при готовности приложения
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

// Закрытие всех окон
app.on('window-all-closed', async () => {
  try {
    await stopDiscordRPC()
    await stopVpnStatusWatcher()
  } catch (e) {
    console.warn('Ошибка при остановке Discord RPC при закрытии всех окон:', e)
  }
  app.quit()
})

// Пути к логам (dev/prod)
const isDev = !app.isPackaged
const logFilePath = isDev
  ? path.join('C:\\Github Project\\electron-vite-pesherkino', 'resources', 'console')
  : path.resolve(process.resourcesPath, 'app.asar.unpacked', 'resources', 'console')

export function getLogFilePath(): string {
  return logFilePath
}

// Получение логов через IPC
ipcMain.handle('get-logs', async () => {
  try {
    return await fs.promises.readFile(logFilePath, 'utf-8')
  } catch (error) {
    console.error('Ошибка чтения файла логов:', error)
    throw new Error('Не удалось прочитать логи')
  }
})

// Перед выходом: корректное завершение
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

// Получение текущего состояния Discord RPC
ipcMain.handle('get-discord-rpc-enabled', () => {
  return getDiscordRpcEnabled()
})

// Управление VPN watcher'ом
ipcMain.handle('start-vpn-watcher', () => startVpnStatusWatcher())
ipcMain.handle('stop-vpn-watcher', () => stopVpnStatusWatcher())

// Получение текущего статуса VPN
ipcMain.handle('get-vpn-status', async () => {
  try {
    return await isSingboxRunning()
  } catch {
    return false
  }
})

// Изменение состояния Discord RPC (вкл/выкл)
ipcMain.handle('set-discord-rpc-enabled', async (_, enabled: boolean) => {
  try {
    setDiscordRpcEnabled(enabled)

    if (enabled) {
      try {
        await stopDiscordRPC()
        await stopVpnStatusWatcher()
      } catch (e: unknown) {
        console.warn('stopDiscordRPC перед init ошибся:', e)
      }
      await initDiscordRPC()
      await startVpnStatusWatcher()
    } else {
      try {
        await stopDiscordRPC()
      } catch (e: unknown) {
        console.warn('stopDiscordRPC при выключении ошибся:', e)
      }
      stopVpnStatusWatcher()
    }

    mainWindow?.webContents.send('discord-rpc-status-changed', enabled)
  } catch (err) {
    console.error('Ошибка при смене состояния Discord RPC:', err)
  }
})

// Подписка на изменение статуса VPN
ipcMain.handle('on-vpn-status-changed', (event) => {
  const webContents = event.sender
  const listener = (running: boolean) => {
    webContents.send('vpn-status-changed', running)
  }
  onVpnStatusChanged(listener)

  ipcMain.on('remove-vpn-status-listener', (removeEvent) => {
    if (removeEvent.sender === webContents) {
      onVpnStatusChanged(() => {}) // заглушка
    }
  })
})

// Подписка на изменение статуса Discord RPC (пустая заглушка)
ipcMain.handle('on-discord-rpc-status-changed', (event) => {
  const webContents = event.sender
  ipcMain.on('remove-discord-rpc-status-listener', (removeEvent) => {
    if (removeEvent.sender === webContents) {
      // Удаление слушателя при необходимости
    }
  })
})