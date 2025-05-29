import { contextBridge, ipcRenderer } from 'electron'

const api = {
  runVpnSetup: (telegramId?: string) => ipcRenderer.invoke('run-vpn-setup', telegramId),
  getTelegramId: () => ipcRenderer.invoke('get-telegram-id'),
  checkVpnStatus: () => ipcRenderer.invoke('check-vpn-status'),
  stopVpn: () => ipcRenderer.invoke('stop-vpn'),
  saveTelegramId: (id: string) => ipcRenderer.invoke('save-telegram-id', id),
  deleteDiscordFiles: () => ipcRenderer.invoke('delete-discord-files'),
  // minimize: () => ipcRenderer.send('window-minimize'),
  // maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),
  onUpdateMessage: (callback: (msg: string) => void) =>
    ipcRenderer.on('update-message', (_, msg) => callback(msg))
}

contextBridge.exposeInMainWorld('electronAPI', api)
