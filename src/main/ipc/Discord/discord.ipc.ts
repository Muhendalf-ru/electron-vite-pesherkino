import { ipcMain } from 'electron'
import { deletePatchFiles, getDiscordRpcEnabled, setDiscordRpcEnabled } from './discord'
import { isSingboxRunning } from '../Singbox/singbox'
import { stopDiscordRPC, initDiscordRPC } from '../../DiscordRpc/discordPresence'
import { mainWindow } from '../..'
import { startVpnStatusWatcher, stopVpnStatusWatcher } from '../Proxy/proxy'

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
