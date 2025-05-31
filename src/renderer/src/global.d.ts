export {}

declare const __APP_VERSION__: string
declare global {
  interface Window {
    electronAPI: {
      runVpnSetup: (telegramId?: string) => Promise<{ success: boolean; error?: string }>
      getTelegramId: () => Promise<string | null>
      checkVpnStatus: () => Promise<boolean>
      stopVpn: () => Promise<{ success: boolean; error?: string }>
      deleteDiscordFiles: () => Promise<{ success: boolean; error?: string }>
      saveTelegramId: (id: string) => Promise<{ success: boolean; error?: string }>

      // Новые методы для кастомного заголовка окна
      minimize?: () => void
      // maximize?: () => void
      close?: () => void

      // Новые методы для автообновления
      checkForUpdates: () => void
      onUpdateMessage: (callback: (msg: string) => void) => () => void

      // логи

      getLogs: () => Promise<string> // Возвращаем логи как строку
      updateDiscordStatus: () => Promise<void>

      getDiscordRpcEnabled: () => Promise<boolean>
      setDiscordRpcEnabled: (enabled: boolean) => Promise<void>

      startVpnWatcher: () => Promise<void>
      stopVpnWatcher: () => Promise<void>
      setDiscordRpcEnabled: (enabled: boolean) => Promise<void>

      onVpnStatusChanged: (callback: (running: boolean) => void) => () => void
      getVpnStatus: () => Promise<boolean>

      onDiscordRpcStatusChanged: (callback: (value: any) => void) => void
      getDiscordRpcEnabled: () => Promise<boolean>
      setDiscordRpcEnabled: (enabled: boolean) => Promise<void>
      onDiscordRpcStatusChanged?: (callback: (enabled: boolean) => void) => void

      // Дополнительно — для статуса sing-box (VPN)
      getSingBoxStatus: () => Promise<boolean>
      onSingBoxStatusChanged?: (callback: (connected: boolean) => void) => void
    }
  }
}
