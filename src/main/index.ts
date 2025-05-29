import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import { createWindow } from './window'
import { createTray } from './tray'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import './ipcHandlers'

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

  // Логируем и показываем диалог по загрузке обновления
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

  // Добавляем событие на ручную проверку обновлений из renderer
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

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 && mainWindow === null) {
      mainWindow = createWindow()
    }
  })
}

app.whenReady().then(setupApp)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
