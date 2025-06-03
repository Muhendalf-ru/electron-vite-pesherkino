import { ipcMain } from 'electron'
import {
  checkRequiredFiles,
  getSingboxPath,
  getTelegramId,
  isSingboxRunning,
  onVpnStatusChanged,
  runSingbox,
  startVpnStatusWatcher,
  stopSingboxAndDiscord,
  stopVpnStatusWatcher
} from '../../vpn'
import path from 'path'
import { copyPatchFiles, getLatestDiscordAppPath, spawnDiscord } from '../Discord/discord'
import fs from 'fs'
import { exec } from 'child_process'

ipcMain.handle('stop-vpn', async () => {
  return stopSingboxAndDiscord()
})

ipcMain.handle('run-vpn-setup', async (_event, telegramIdFromUI: string) => {
  try {
    const telegramId = telegramIdFromUI || getTelegramId()
    if (!telegramId) {
      throw new Error('Telegram ID not provided')
    }

    // 🛑 Останавливаем Discord и Sing-box, если уже запущены
    await stopSingboxAndDiscord()

    // const configData = await fetchConfig(telegramId)

    const singboxPath = getSingboxPath()
    const configPath = path.join(singboxPath, 'config.json') // Переделать
    // fs.writeFileSync(configPath, configData)

    checkRequiredFiles()
    copyPatchFiles(singboxPath)

    runSingbox(configPath, singboxPath) // переделать

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

ipcMain.handle('check-vpn-status', async () => {
  return isSingboxRunning()
})

ipcMain.handle('get-proxy-connections', async () => {
  return new Promise((resolve) => {
    exec('netstat -ano | findstr :1080', (err, stdout) => {
      if (err || !stdout) return resolve([])

      const connections = stdout
        .trim()
        .split('\n')
        .map((line) => line.trim().split(/\s+/))
        .filter((parts) => parts.length >= 5)
        .map(([proto, local, foreign, state, pid]) => ({ proto, local, foreign, state, pid }))

      // получить tasklist по PID
      const uniquePids = [...new Set(connections.map((c) => c.pid))]

      const tasks: Record<string, string> = {}
      let pending = uniquePids.length

      uniquePids.forEach((pid) => {
        exec(`tasklist /FI "PID eq ${pid}"`, (error, stdout) => {
          if (!error && stdout) {
            const match = stdout.match(new RegExp(`([^\\s]+\\.exe)\\s+${pid}`))
            if (match) tasks[pid] = match[1]
          }
          if (--pending === 0) {
            resolve(
              connections.map((c) => ({
                ...c,
                process: tasks[c.pid] || 'Неизвестно'
              }))
            )
          }
        })
      })
    })
  })
})

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

ipcMain.handle('start-vpn-watcher', () => startVpnStatusWatcher())
ipcMain.handle('stop-vpn-watcher', () => stopVpnStatusWatcher())

ipcMain.handle('get-vpn-status', async () => {
  try {
    return await isSingboxRunning()
  } catch {
    return false
  }
})
