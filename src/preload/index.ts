import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'

const api = {
  runVpnSetup: (telegramId?: string) => ipcRenderer.invoke('run-vpn-setup', telegramId),
  getTelegramId: () => ipcRenderer.invoke('get-telegram-id'),
  checkVpnStatus: () => ipcRenderer.invoke('check-vpn-status'),
  stopVpn: () => ipcRenderer.invoke('stop-vpn'),
  saveTelegramId: (id: string) => ipcRenderer.invoke('save-telegram-id', id),
  deleteDiscordFiles: () => ipcRenderer.invoke('delete-discord-files'),
  // minimize: () => ipcRenderer.send('window-minimize'),
  // maximize: () => ipcRenderer.send('window-maximize'),
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),
  onUpdateMessage: (callback: (msg: string) => void) =>
    ipcRenderer.on('update-message', (_, msg) => callback(msg)),

  minimize: () => ipcRenderer.send('window-minimize'),
  close: () => ipcRenderer.send('window-close'),
  // logs

  getLogs: () => ipcRenderer.invoke('get-logs'),

  updateDiscordStatus: () => ipcRenderer.invoke('update-discord-status'),

  // // Discord status

  // getDiscordRpcEnabled: () => ipcRenderer.invoke('get-discord-rpc-enabled'),
  // setDiscordRpcEnabled: (enabled) => ipcRenderer.invoke('set-discord-rpc-enabled', enabled),

  // onDiscordRpcStatusChanged: (callback) => ipcRenderer.on('discord-rpc-status-changed', (_, value) => callback(value)),

  // startVpnWatcher: () => ipcRenderer.invoke('start-vpn-watcher'),
  // stopVpnWatcher: () => ipcRenderer.invoke('stop-vpn-watcher'),
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

  // VPN статус
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
