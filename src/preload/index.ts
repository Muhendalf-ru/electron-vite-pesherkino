import { contextBridge, ipcRenderer, shell, type IpcRendererEvent } from 'electron'

const api = {
  runVpnSetup: (telegramId?: string) => ipcRenderer.invoke('run-vpn-setup', telegramId),
  getTelegramId: () => ipcRenderer.invoke('get-telegram-id'),
  checkVpnStatus: () => ipcRenderer.invoke('check-vpn-status'),
  stopVpn: () => ipcRenderer.invoke('stop-vpn'),
  saveTelegramId: (id: string) => ipcRenderer.invoke('save-telegram-id', id),
  deleteDiscordFiles: () => ipcRenderer.invoke('delete-discord-files'),
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),
  onUpdateMessage: (callback: (msg: string) => void) =>
    ipcRenderer.on('update-message', (_, msg) => callback(msg)),
  minimize: () => ipcRenderer.send('window-minimize'),
  close: () => ipcRenderer.send('window-close'),
  getLogs: () => ipcRenderer.invoke('get-logs'),
  updateDiscordStatus: () => ipcRenderer.invoke('update-discord-status'),
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  getPing: () => ipcRenderer.invoke('get-ping'),
  checkConfigExists: (filename: string) => ipcRenderer.invoke('check-config-exists', filename),
  getDiscordRpcEnabled: () => ipcRenderer.invoke('get-discord-rpc-enabled'),
  setDiscordRpcEnabled: (enabled: boolean) =>
    ipcRenderer.invoke('set-discord-rpc-enabled', enabled),

  onDiscordRpcStatusChanged: (callback: (enabled: boolean) => void) => {
    const listener = (_: IpcRendererEvent, enabled: boolean) => {
      callback(enabled)
    }
    ipcRenderer.on('discord-rpc-status-changed', listener)
    return () => {
      ipcRenderer.removeListener('discord-rpc-status-changed', listener)
    }
  },

  openFolder: (folderPath) => {
    shell.openPath(folderPath).catch((err) => {
      console.error('Ошибка при открытии папки:', err)
    })
  },

  speedtest: {
    run: () => ipcRenderer.invoke('run-speedtest')
  },

  getProxyConnections: () => ipcRenderer.invoke('get-proxy-connections'),
  getVpnStatus: () => ipcRenderer.invoke('get-vpn-status'),

  onVpnStatusChanged: (callback: (running: boolean) => void) => {
    const listener = (_: IpcRendererEvent, running: boolean) => {
      callback(running)
    }
    ipcRenderer.on('vpn-status-changed', listener)
    return () => {
      ipcRenderer.removeListener('vpn-status-changed', listener)
    }
  }
}

contextBridge.exposeInMainWorld('electronAPI', api)
