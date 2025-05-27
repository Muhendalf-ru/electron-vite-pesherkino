import { contextBridge, ipcRenderer } from 'electron'

const api = {
  runVpnSetup: (telegramId?: string) => ipcRenderer.invoke('run-vpn-setup', telegramId),
  getTelegramId: () => ipcRenderer.invoke('get-telegram-id'),
  checkVpnStatus: () => ipcRenderer.invoke('check-vpn-status'),
  stopVpn: () => ipcRenderer.invoke('stop-vpn'),
  deleteDiscordFiles: () => ipcRenderer.invoke('delete-discord-files')
}

contextBridge.exposeInMainWorld('electronAPI', api)
