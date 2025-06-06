import { ipcMain } from 'electron'
import path from 'path'
import {
  checkRequiredFiles,
  copyPatchFiles,
  getLatestDiscordAppPath,
  spawnDiscord
} from '../Discord/discord'
import fs from 'fs'
import { exec } from 'child_process'
import { configFilePath, singboxPath } from '../../constants/constants'
import { stopSingboxAndDiscord, isSingboxRunning, runSingboxDiscord } from '../Singbox/singbox'
import { getTelegramId } from '../Config/config'
import { onVpnStatusChanged, startVpnStatusWatcher, stopVpnStatusWatcher } from './proxy'

ipcMain.handle('stop-vpn', async () => {
  return stopSingboxAndDiscord()
})

ipcMain.handle('run-vpn-setup', async (_event, telegramIdFromUI: string) => {
  console.log('Начало настройки VPN...')

  try {
    // Проверка Telegram ID
    const telegramId = telegramIdFromUI || getTelegramId()
    if (!telegramId) {
      console.error('Telegram ID не предоставлен')
      throw new Error('Telegram ID не предоставлен')
    }
    console.log('Telegram ID получен:', telegramId)

    // Остановка существующих процессов
    console.log('Останавливаем существующие процессы...')
    await stopSingboxAndDiscord()
    console.log('Существующие процессы остановлены')

    // Проверка и копирование файлов
    console.log('Проверка необходимых файлов...')
    try {
      checkRequiredFiles()
      console.log('Необходимые файлы проверены')
    } catch (err) {
      console.error('Ошибка при проверке файлов:', err)
      throw new Error(
        `Ошибка при проверке файлов: ${err instanceof Error ? err.message : String(err)}`
      )
    }

    console.log('Копирование патч-файлов...')
    try {
      copyPatchFiles(singboxPath)
      console.log('Патч-файлы скопированы')
    } catch (err) {
      console.error('Ошибка при копировании патч-файлов:', err)
      throw new Error(
        `Ошибка при копировании патч-файлов: ${err instanceof Error ? err.message : String(err)}`
      )
    }

    // Запуск sing-box
    console.log('Запуск sing-box...')
    try {
      runSingboxDiscord(configFilePath, singboxPath)
      console.log('sing-box запущен')
    } catch (err) {
      console.error('Ошибка при запуске sing-box:', err)
      throw new Error(
        `Ошибка при запуске sing-box: ${err instanceof Error ? err.message : String(err)}`
      )
    }

    // Запуск Discord
    console.log('Поиск Discord...')
    const discordPath = getLatestDiscordAppPath()
    const discordExe = path.join(discordPath, 'Discord.exe')

    if (!fs.existsSync(discordExe)) {
      console.error('Discord.exe не найден по пути:', discordExe)
      throw new Error(`Discord.exe не найден по пути: ${discordExe}`)
    }
    console.log('Discord найден:', discordExe)

    console.log('Запуск Discord...')
    try {
      spawnDiscord(discordExe, discordPath)
      console.log('Discord запущен')
    } catch (err) {
      console.error('Ошибка при запуске Discord:', err)
      throw new Error(
        `Ошибка при запуске Discord: ${err instanceof Error ? err.message : String(err)}`
      )
    }

    console.log('Настройка VPN успешно завершена')
    return {
      success: true,
      message: 'VPN успешно настроен и запущен'
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error('Ошибка при настройке VPN:', errorMessage)

    // Попытка очистки в случае ошибки
    try {
      console.log('Очистка после ошибки...')
      await stopSingboxAndDiscord()
      console.log('Очистка завершена')
    } catch (cleanupErr) {
      console.error('Ошибка при очистке:', cleanupErr)
    }

    return {
      success: false,
      error: errorMessage,
      details: err instanceof Error ? err.stack : undefined
    }
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

ipcMain.handle('start-vpn-watcher', () => startVpnStatusWatcher())
ipcMain.handle('stop-vpn-watcher', () => stopVpnStatusWatcher())

ipcMain.handle('get-vpn-status', async () => {
  try {
    return await isSingboxRunning()
  } catch {
    return false
  }
})
