import { dialog, ipcMain } from 'electron'
import { deletePatchFiles, getDiscordRpcEnabled, loadConfigDiscord, saveConfigDiscord, setDiscordRpcEnabled } from './discord'
import { isSingboxRunning } from '../Singbox/singbox'
import { stopDiscordRPC, initDiscordRPC } from '../../DiscordRpc/discordPresence'
import { mainWindow } from '../..'
import { startVpnStatusWatcher, stopVpnStatusWatcher } from '../Proxy/proxy'
import { copyFreeFiles, deleteFreePatchFiles, getLatestDiscordAppPath, spawnDiscord } from './discord'
import { singboxPath } from '../../constants/constants'
import { exec } from 'child_process'

ipcMain.handle('delete-discord-files', async () => {
  return deletePatchFiles()
})

ipcMain.handle('update-discord-status', async () => {
  isSingboxRunning()
})

ipcMain.handle('get-discord-rpc-enabled', () => {
  return getDiscordRpcEnabled()
})

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
      stopVpnStatusWatcher()
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

ipcMain.handle('config:getDiscordPath', () => {
  return loadConfigDiscord().discordPath
})

ipcMain.handle('config:setDiscordPath', (_event, newPath: string) => {
  const config = loadConfigDiscord()
  config.discordPath = newPath
  saveConfigDiscord(config)
})

ipcMain.handle('select-discord-path', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return result.filePaths[0]
})

ipcMain.handle('copy-free-files', async () => {
  try {
    await copyFreeFiles(singboxPath)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
})

ipcMain.handle('delete-free-patch-files', async () => {
  try {
    return deleteFreePatchFiles()
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
})

ipcMain.handle('run-discord', async () => {
  try {
    const discordExe = process.platform === 'win32' ? 'Discord.exe' : 'Discord'
    const discordPath = getLatestDiscordAppPath()
    spawnDiscord(discordExe, discordPath)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
})

// IPC: Проверка, запущен ли процесс Discord
ipcMain.handle('is-discord-running', async () => {
  return new Promise((resolve) => {
    const processName = process.platform === 'win32' ? 'Discord.exe' : 'discord'
    const cmd = process.platform === 'win32'
      ? `tasklist /FI "IMAGENAME eq ${processName}"`
      : `pgrep ${processName}`
    exec(cmd, (err, stdout) => {
      if (process.platform === 'win32') {
        resolve({ running: stdout.toLowerCase().includes(processName.toLowerCase()) })
      } else {
        resolve({ running: !err })
      }
    })
  })
})