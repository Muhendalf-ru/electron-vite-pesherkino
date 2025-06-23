export {}

declare global {
  interface Window {
    electronAPI: {
      runVpnSetup: (telegramId?: string) => Promise<{ success: boolean; error?: string }>
      getTelegramId: () => Promise<string | null>
      checkVpnStatus: () => Promise<boolean>
      stopVpn: () => Promise<{ success: boolean; error?: string }>
      deleteDiscordFiles: () => Promise<{ success: boolean; error?: string }>
      copyFreeFiles: () => Promise<{ success: boolean; error?: string }>
      deleteFreePatchFiles: () => Promise<{ success: boolean; error?: string }>
      runDiscord: () => Promise<{ success: boolean; error?: string }>
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
      getProcessList: () => Promise<Process[]>
      onProcessListUpdate: (callback: (processes: Process[]) => void) => void
      onProcessListError: (callback: (error: string) => void) => void
      removeProcessListListeners: () => void
      saveProcessConfig: (data: {
        selectedProcesses: Process[]
        overwrite: boolean
      }) => Promise<boolean>
      getSavedProcesses: () => Promise<Process[]>
      readUserConfig: () => Promise<{
        discordRpcEnabled?: boolean
        telegramId?: string
        currentLink?: string
      }>
      generateConfigFromLink: (link: string) => Promise<any>
      saveTunConfig: (config: any) => Promise<boolean>
      runSingbox: () => Promise<void>

      getDiscordPath: () => Promise<string>
      setDiscordPath: (path: string) => Promise<void>
      selectDiscordPath: () => Promise<string>
      isDiscordRunning: () => Promise<{ running: boolean }>
    }
  }
}
