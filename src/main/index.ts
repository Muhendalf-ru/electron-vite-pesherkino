import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import { createWindow } from './window'
import { createTray } from './tray'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import './ipcHandlers'
import * as fs from 'fs'
import * as path from 'path'
import { stopSingboxAndDiscord } from './vpn'

let mainWindow: BrowserWindow | null = null

function setupApp(): void {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  mainWindow = createWindow()
  createTray(mainWindow)

  // Автообновление: первоначальная проверка и уведомление
  autoUpdater.checkForUpdatesAndNotify()

  autoUpdater.on('update-available', () => {
    console.log('🔄 Доступно обновление...')
    mainWindow?.webContents.send('update-message', 'Доступно обновление...')
  })

  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update-message', 'Обновление загружено.')
    const result = dialog.showMessageBoxSync({
      type: 'question',
      buttons: ['Перезапустить', 'Позже'],
      defaultId: 0,
      message: 'Обновление загружено. Перезапустить сейчас?'
    })

    if (result === 0) {
      autoUpdater.quitAndInstall()
    }
  })

  autoUpdater.on('error', (err) => {
    console.error('❌ Ошибка автообновления:', err)
    mainWindow?.webContents.send('update-message', 'Ошибка автообновления: ' + err.message)
  })

  ipcMain.on('check-for-updates', () => {
    if (!mainWindow) return
    mainWindow.webContents.send('update-message', 'Проверка обновлений...')
    autoUpdater.checkForUpdates()
  })

  autoUpdater.on('checking-for-update', () => {
    mainWindow?.webContents.send('update-message', 'Проверка обновлений...')
  })

  autoUpdater.on('update-not-available', () => {
    mainWindow?.webContents.send('update-message', 'Обновлений нет')
  })

  // Обработчик активации приложения (macOS)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow()
    }
  })
}

// Запускаем setupApp при готовности приложения
app.whenReady().then(setupApp)

// Закрытие приложения при закрытии всех окон (кроме macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Логи
const isDev = !app.isPackaged

const logFilePath = isDev
  ? path.join('C:\\Github Project\\electron-vite-pesherkino', 'resources', 'console') // Dev
  : path.resolve(process.resourcesPath, 'app.asar.unpacked', 'resources', 'console') // Prod

export function getLogFilePath(): string {
  return logFilePath
}

ipcMain.handle('get-logs', async () => {
  try {
    const logData = await fs.promises.readFile(logFilePath, 'utf-8')
    return logData
  } catch (error) {
    console.error('Ошибка чтения файла логов:', error)
    throw new Error('Не удалось прочитать логи')
  }
})

// Остановка процессов перед выходом
let isQuitting = false

app.on('before-quit', async (event) => {
  if (isQuitting) return

  event.preventDefault()
  isQuitting = true

  const result = await stopSingboxAndDiscord()
  if (!result.success) {
    console.error('Ошибка при остановке процессов:', result.error)
  }

  app.exit()
})

// Обработка сигналов завершения процесса
process.on('SIGINT', async () => {
  await stopSingboxAndDiscord()
  process.exit()
})

process.on('SIGTERM', async () => {
  await stopSingboxAndDiscord()
  process.exit()
})
