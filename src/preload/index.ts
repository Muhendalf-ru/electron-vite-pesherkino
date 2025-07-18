import { contextBridge, ipcRenderer, shell, type IpcRendererEvent } from 'electron'
import type { Process } from '../main/ipc/Process/processManager'

const api = {
  runVpnSetup: (telegramId?: string) => ipcRenderer.invoke('run-vpn-setup', telegramId),
  getTelegramId: () => ipcRenderer.invoke('get-telegram-id'),
  checkVpnStatus: () => ipcRenderer.invoke('check-vpn-status'),
  stopVpn: () => ipcRenderer.invoke('stop-vpn'),
  saveTelegramId: (id: string) => ipcRenderer.invoke('save-telegram-id', id),
  deleteDiscordFiles: () => ipcRenderer.invoke('delete-discord-files'),
  copyFreeFiles: () => ipcRenderer.invoke('copy-free-files'),
  deleteFreePatchFiles: () => ipcRenderer.invoke('delete-free-patch-files'),
  runDiscord: () => ipcRenderer.invoke('run-discord'),
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
  },

  getProcessList: () => ipcRenderer.invoke('get-process-list'),

  saveProcessConfig: (data: { selectedProcesses: Process[]; overwrite: boolean }) =>
    ipcRenderer.invoke('save-process-config', data),

  getSavedProcesses: () => ipcRenderer.invoke('get-saved-processes'),

  onProcessListUpdate: (callback: (processes: Process[]) => void) => {
    ipcRenderer.on('process-list-update', (_, processes) => callback(processes))
  },

  onProcessListError: (callback: (error: string) => void) => {
    ipcRenderer.on('process-list-error', (_, error) => callback(error))
  },

  removeProcessListListeners: () => {
    ipcRenderer.removeAllListeners('process-list-update')
    ipcRenderer.removeAllListeners('process-list-error')
  },

  readUserConfig: () => ipcRenderer.invoke('read-user-config'),
  generateConfigFromLink: (link: string) => ipcRenderer.invoke('generate-config-from-link', link),
  saveTunConfig: (config: any) => ipcRenderer.invoke('save-tun-config', config),
  runSingbox: () => ipcRenderer.invoke('run-singbox'),

  getDiscordPath: () => ipcRenderer.invoke('config:getDiscordPath'),
  setDiscordPath: (path: string) => ipcRenderer.invoke('config:setDiscordPath', path),
  selectDiscordPath: () => ipcRenderer.invoke('select-discord-path'),

  isDiscordRunning: () => ipcRenderer.invoke('is-discord-running'),
}

contextBridge.exposeInMainWorld('electronAPI', api)
