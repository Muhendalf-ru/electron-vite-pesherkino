import React, { useEffect, useState } from 'react'
import { TelegramContext } from './TelegramContext'

export const TelegramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [telegramId, setTelegramIdState] = useState<string | null>(null)

  useEffect(() => {
    async function loadTelegramId(): Promise<void> {
      try {
        const savedId = await window.electronAPI.getTelegramId()
        if (savedId) {
          setTelegramIdState(savedId)
        }
      } catch (err) {
        console.error('Ошибка загрузки Telegram ID:', err)
      }
    }
    loadTelegramId()
  }, [])

  const setTelegramId = async (id: string): Promise<void> => {
    setTelegramIdState(id)
  }

  return (
    <TelegramContext.Provider value={{ telegramId, setTelegramId }}>
      {children}
    </TelegramContext.Provider>
  )
}
