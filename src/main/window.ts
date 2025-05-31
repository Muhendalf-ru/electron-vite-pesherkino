import { BrowserWindow, shell } from 'electron'
import path, { join } from 'path'
import { is } from '@electron-toolkit/utils'

const iconPath = path.join(__dirname, '../../resources/icon.ico')

export function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 950,
    height: 800,
    resizable: false,
    autoHideMenuBar: true,
    show: true,
    title: 'Pesherkino VPN',
    frame: false,
    icon: process.platform === 'win32' || process.platform === 'linux' ? iconPath : undefined,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  // Условная загрузка по окружению
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  return win
}
