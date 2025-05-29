import { Tray, Menu, nativeImage, BrowserWindow, app } from 'electron'
import path from 'path'

let tray: Tray | null = null
let isQuitting = false

export function createTray(win: BrowserWindow): Tray {
  const trayIcon = nativeImage.createFromPath(path.join(__dirname, '../../resources/icon.png'))
  tray = new Tray(trayIcon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: () => {
        win.show()
      }
    },
    {
      label: 'Exit',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setToolTip('Pesherkino VPN')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    win.show()
  })

  win.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      win.hide()
    }
  })

  return tray
}
