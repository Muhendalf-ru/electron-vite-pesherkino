import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import path from 'path'
import fs from 'fs'
import { spawn, exec } from 'child_process'
import axios from 'axios'

// Теперь singboxPath указывает на папку resources рядом с текущей сборкой main

const isDev = !app.isPackaged

const singboxPath = isDev
  ? path.resolve(__dirname, '../../resources') // для разработки
  : path.resolve(process.resourcesPath, 'app.asar.unpacked', 'resources') // для сборки

console.log('singboxPath:', singboxPath)

function getTelegramId(): string | null {
  const filePath = path.join(singboxPath, 'telegram_id.txt')
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8').trim()
  }
  return null
}

function saveTelegramId(id: string): void {
  const filePath = path.join(singboxPath, 'telegram_id.txt')
  fs.writeFileSync(filePath, id, 'utf-8')
}

ipcMain.handle('run-vpn-setup', async (_event, telegramIdFromUI: string) => {
  const discordBase = path.join(process.env.LOCALAPPDATA || '', 'Discord')

  try {
    const telegramId = telegramIdFromUI || getTelegramId()
    if (!telegramId) {
      throw new Error('Telegram ID not provided')
    }

    // Запрос конфигурации
    const url = `https://sub.pesherkino.store:8443/pesherkino/vpn/config/${telegramId}`
    const response = await axios.get(url, { responseType: 'arraybuffer' })

    // Проверим, не JSON ли это с ошибкой
    const responseText = response.data.toString()
    try {
      const parsed = JSON.parse(responseText)
      if (parsed && parsed.message === 'Пользователь не найден или нет ссылок') {
        // Пользователь не найден — не сохраняем telegramId
        throw new Error('Пользователь не найден')
      }
    } catch {
      // Если JSON.parse не сработал — значит это не JSON, а бинарный config — всё ок
    }

    // Сохраняем telegramId только если config получен корректно
    saveTelegramId(telegramId)

    const configPath = path.join(singboxPath, 'config.json')
    fs.writeFileSync(configPath, response.data)

    // Проверка папок и файлов как было...
    const filesPath = path.join(singboxPath, 'dll')
    if (!fs.existsSync(filesPath)) {
      throw new Error(`Folder not found: ${filesPath}`)
    }

    const requiredFiles = ['DWrite.dll', 'force-proxy.dll', 'proxy.txt']
    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(filesPath, file))) {
        throw new Error(`File not found: ${file}`)
      }
    }

    if (!fs.existsSync(discordBase)) {
      throw new Error(`Discord base folder not found: ${discordBase}`)
    }

    const appDirs = fs
      .readdirSync(discordBase, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.startsWith('app-'))
      .map((d) => d.name)
      .sort((a, b) => b.localeCompare(a))

    if (appDirs.length === 0) {
      throw new Error('No Discord app-* folder found.')
    }

    const latest = appDirs[0]
    const discordPath = path.join(discordBase, latest)

    for (const file of requiredFiles) {
      fs.copyFileSync(path.join(filesPath, file), path.join(discordPath, file))
    }

    const singboxExe = path.join(singboxPath, 'sing-box.exe')
    if (!fs.existsSync(singboxExe)) {
      throw new Error('sing-box.exe not found')
    }
    spawn(singboxExe, ['run', '-c', configPath], {
      detached: true,
      stdio: 'ignore',
      cwd: singboxPath
    }).unref()

    const discordExe = path.join(discordPath, 'Discord.exe')
    if (!fs.existsSync(discordExe)) {
      throw new Error('Discord.exe not found')
    }
    spawn(discordExe, [], {
      detached: true,
      stdio: 'ignore',
      cwd: discordPath
    }).unref()

    return { success: true }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    return { success: false, error: errorMessage }
  }
})

// Вот добавленные новые обработчики:
ipcMain.handle('get-telegram-id', async () => {
  return getTelegramId()
})

ipcMain.handle('check-vpn-status', async () => {
  return new Promise<boolean>((resolve) => {
    if (process.platform === 'win32') {
      exec('tasklist', (err, stdout) => {
        if (err) return resolve(false)
        resolve(stdout.toLowerCase().includes('sing-box.exe'))
      })
    } else {
      exec('ps aux', (err, stdout) => {
        if (err) return resolve(false)
        resolve(stdout.toLowerCase().includes('sing-box'))
      })
    }
  })
})

ipcMain.handle('stop-vpn', async () => {
  return new Promise<{ success: boolean; error?: string }>((resolve) => {
    if (process.platform === 'win32') {
      // Завершаем процессы sing-box.exe и Discord.exe через taskkill
      exec('taskkill /IM sing-box.exe /F && taskkill /IM Discord.exe /F', (err) => {
        if (err) {
          resolve({ success: false, error: err.message })
        } else {
          resolve({ success: true })
        }
      })
    } else {
      // На Linux/macOS убиваем процессы sing-box и Discord
      // Discord процесс обычно называется "discord" или "Discord"
      exec('pkill -f sing-box && pkill -f discord', (err) => {
        if (err) {
          if (err.code === 1) {
            // Процессы не найдены — считаем остановленными
            resolve({ success: true })
          } else {
            resolve({ success: false, error: err.message })
          }
        } else {
          resolve({ success: true })
        }
      })
    }
  })
})

ipcMain.handle('delete-discord-files', async () => {
  try {
    const discordBase = path.join(process.env.LOCALAPPDATA || '', 'Discord')

    if (!fs.existsSync(discordBase)) {
      throw new Error(`Discord base folder not found: ${discordBase}`)
    }

    const appDirs = fs
      .readdirSync(discordBase, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.startsWith('app-'))
      .map((d) => d.name)
      .sort((a, b) => b.localeCompare(a))

    if (appDirs.length === 0) {
      throw new Error('No Discord app-* folder found.')
    }

    const latest = appDirs[0]
    const discordPath = path.join(discordBase, latest)

    const filesToDelete = ['DWrite.dll', 'force-proxy.dll', 'proxy.txt']

    for (const file of filesToDelete) {
      const filePath = path.join(discordPath, file)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    return { success: true }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    return { success: false, error: errorMessage }
  }
})

let tray: Tray | null = null

function createWindow(): void {
  const win = new BrowserWindow({
    width: 900,
    height: 750,
    resizable: false,
    autoHideMenuBar: true,
    show: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  win.on('ready-to-show', () => {
    win.show()
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // 🧠 Создаём трей
  const trayIcon = nativeImage.createFromPath(path.join(__dirname, '../../resources/icon.png'))
  tray = new Tray(trayIcon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Показать',
      click: () => {
        win.show()
      }
    },
    {
      label: 'Выход',
      click: () => {
        ;(app as AppWithIsQuitting).isQuitting = true
        app.quit()
      }
    }
  ])
  tray.setToolTip('Pesherkino VPN')
  if (tray) {
    tray.setContextMenu(contextMenu)
  }

  // 🟡 При сворачивании — скрыть окно
  win.on('minimize', () => {
    win.hide()
  })

  // ✅ При нажатии на крестик — закрыть (а не скрыть)
  interface AppWithIsQuitting extends Electron.App {
    isQuitting?: boolean
  }

  win.on('close', (event: Electron.Event) => {
    if (!(app as AppWithIsQuitting).isQuitting) {
      event.preventDefault()
      win.hide()
    }
  })

  // 🟢 По клику на трей — показать окно
  tray.on('click', () => {
    win.show()
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
