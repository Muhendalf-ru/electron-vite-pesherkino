import { type TelegramContextType, TelegramContext } from '@renderer/context/TelegramContext'
import { useContext } from 'react'

export function useTelegram(): TelegramContextType {
  const context = useContext(TelegramContext)
  if (context === undefined) {
    throw new Error('useTelegram must be used within a TelegramProvider')
  }
  return context
}
