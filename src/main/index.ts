import { app, BrowserWindow } from 'electron'
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
