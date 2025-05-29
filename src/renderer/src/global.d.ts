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

      // Новые методы для кастомного заголовка окна
      minimize?: () => void
      // maximize?: () => void
      close?: () => void
    }
  }
}
