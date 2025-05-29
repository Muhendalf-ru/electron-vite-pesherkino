import { createContext } from 'react'

export type TelegramContextType = {
  telegramId: string | null
  setTelegramId: (id: string) => void
}

export const TelegramContext = createContext<TelegramContextType | undefined>(undefined)
