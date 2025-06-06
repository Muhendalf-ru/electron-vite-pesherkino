import { useTelegram } from '@renderer/hooks/useTelegram'
import { GitHubSVG } from '@renderer/svg/GitHub'
import { TelegramSVG } from '@renderer/svg/Telegram'
import React, { useState, useEffect, useCallback } from 'react'
import { useLocation, Link } from 'react-router-dom'
import styles from '@renderer/styles/components/Header.module.scss'

// Функция валидации Telegram ID
const isValidTelegramUsername = (value: string): boolean => {
  // Telegram ID может быть числом или строкой, начинающейся с @
  return /^(@?[a-zA-Z0-9_]{5,32}|[0-9]+)$/.test(value)
}

function Header(): React.JSX.Element {
  const location = useLocation()
  const navLinks = [
    { path: '/', label: 'Главная' },
    { path: '/proxy', label: 'Прокси', disabled: true },
    { path: '/discord-fix', label: 'Дискорд' },
    { path: '/logs', label: 'Логи' },
    { path: '/settings', label: 'Настройки' }
  ]

  const { telegramId, setTelegramId } = useTelegram()
  const [inputValue, setInputValue] = useState('')
  const [updateStatus, setUpdateStatus] = useState('')
  const [isError, setIsError] = useState(false)

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (!isValidTelegramUsername(value)) {
      setIsError(true)
      // Убираем класс ошибки через 500мс
      setTimeout(() => setIsError(false), 500)
    }
  }

  useEffect(() => {
    telegramId && setInputValue(telegramId)
  }, [telegramId])

  useEffect(() => {
    if (window.electronAPI?.onUpdateMessage) {
      const handler = (msg: string): void => {
        setUpdateStatus(msg)
        setTimeout(() => {
          setUpdateStatus('')
        }, 15000)
      }
      const unsubscribe = window.electronAPI.onUpdateMessage(handler)
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe()
        }
      }
    }
    return undefined
  }, [])

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setInputValue(val)

      // Проверяем валидность перед сохранением
      if (isValidTelegramUsername(val)) {
        setTelegramId(val)
        try {
          await window.electronAPI?.saveTelegramId?.(val)
        } catch (error) {
          console.error('Failed to save Telegram ID', error)
          setIsError(true)
          setTimeout(() => setIsError(false), 500)
        }
      } else {
        setIsError(true)
        setTimeout(() => setIsError(false), 500)
      }
    },
    [setTelegramId]
  )

  const handleCheckUpdates = (): void => {
    if (window.electronAPI?.checkForUpdates) {
      window.electronAPI.checkForUpdates()
      setUpdateStatus('Проверка обновлений...')
    }
  }

  return (
    <div>
      {updateStatus && <div className={styles.update_status_popup}>{updateStatus}</div>}
      <div className={styles.header_wrapper}>
        <h2>Pesherkino VPN</h2>
        <ul className={styles.nav_links}>
          {navLinks.map(({ path, label, disabled }) => (
            <li key={path}>
              {disabled ? (
                <span className={styles.disabled}>{label}</span>
              ) : (
                <Link to={path} className={location.pathname === path ? styles.active : ''}>
                  {label}
                </Link>
              )}
            </li>
          ))}
        </ul>

        <input
          className={`${styles.telegram_input} ${isError ? styles.error : ''}`}
          type="password"
          placeholder="Telegram ID"
          value={inputValue}
          onChange={handleChange}
          onInput={handleInput}
          spellCheck={false}
        />

        <button
          className={styles.update_button}
          onClick={handleCheckUpdates}
          disabled={updateStatus === 'Проверка обновлений...'}
        >
          Check Update
        </button>

        <ul className={styles.icon_links}>
          <li>
            <a
              href="https://t.me/pesherkino_bot?start=ref_855347094"
              target="_blank"
              rel="noopener noreferrer"
              title="Купить VPN в Telegram"
            >
              <TelegramSVG />
            </a>
          </li>
          <li>
            <a
              href="https://pesherkino-vpn.gitbook.io/pesherkino-vpn"
              target="_blank"
              rel="noopener noreferrer"
              title="GitBook"
            >
              <GitHubSVG />
            </a>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Header
