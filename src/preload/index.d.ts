export {}

declare global {
  interface Window {
    electronAPI: {
      runVpnSetup: (telegramId?: string) => Promise<{ success: boolean; error?: string }>
      getTelegramId: () => Promise<string | null>
      checkVpnStatus: () => Promise<boolean>
      stopVpn: () => Promise<{ success: boolean; error?: string }>
      deleteDiscordFiles: () => Promise<{ success: boolean; error?: string }>
      saveTelegramId: (id: string) => Promise<{ success: boolean; error?: string }>
      minimize?: () => void
      close?: () => void
      checkForUpdates: () => void
      onUpdateMessage: (callback: (msg: string) => void) => () => void
      getLogs: () => Promise<string> // Возвращаем логи как строку
      updateDiscordStatus: () => Promise<void>
      getDiscordRpcEnabled: () => Promise<boolean>
      setDiscordRpcEnabled: (enabled: boolean) => Promise<void>
      startVpnWatcher: () => Promise<void>
      stopVpnWatcher: () => Promise<void>
      onVpnStatusChanged: (callback: (running: boolean) => void) => () => void
      getVpnStatus: () => Promise<boolean>
      invoke: <T = any>(channel: string, ...args: any[]) => Promise<T>
      openFolder: (folderPath: string) => void
      onDiscordRpcStatusChanged: (callback: (value: any) => void) => void
      checkConfigExists: (filename: string) => Promise<boolean>
      getProxyConnections: () => Promise<any>
      startDiscordRpcWatcher: () => Promise<void>
      stopDiscordRpcWatcher: () => void
      getSingBoxStatus: () => Promise<boolean>
      speedtest: {
        run: () => Promise<{ ping: number | null; download: number | null; upload: number | null }>
      }
    }
  }
}
