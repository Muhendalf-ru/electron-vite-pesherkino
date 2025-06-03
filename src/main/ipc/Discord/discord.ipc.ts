import { ipcMain } from 'electron'
import { getDiscordRpcEnabled, isSingboxRunning } from '../../vpn'
import { deletePatchFiles } from './discord'

ipcMain.handle('delete-discord-files', async () => {
  return deletePatchFiles()
})

ipcMain.handle('update-discord-status', async () => {
  isSingboxRunning()
})

ipcMain.handle('get-discord-rpc-enabled', () => {
  return getDiscordRpcEnabled()
})
