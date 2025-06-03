import { useTelegram } from '@renderer/hooks/useTelegram'
import { GitHubSVG } from '@renderer/svg/GitHub'
import { TelegramSVG } from '@renderer/svg/Telegram'
import React, { useState, useEffect, useCallback } from 'react'
import { useLocation, Link } from 'react-router-dom'

function Header(): React.JSX.Element {
  const location = useLocation()
  const navLinks = [
    { path: '/', label: 'Main Page' },
    { path: '/discord-fix', label: 'Discord Fix' },
    { path: '/logs', label: 'Logs' },
    { path: '/settings', label: 'Settings' }
  ]

  const { telegramId, setTelegramId } = useTelegram()
  const [inputValue, setInputValue] = useState('')
  const [updateStatus, setUpdateStatus] = useState('')

  useEffect(() => {
    telegramId && setInputValue(telegramId)
  }, [telegramId])

  useEffect(() => {
    if (window.electronAPI?.onUpdateMessage) {
      const handler = (msg: string): void => {
        setUpdateStatus(msg)
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
      setTelegramId(val)

      try {
        await window.electronAPI?.saveTelegramId?.(val)
      } catch (error) {
        console.error('Failed to save Telegram ID', error)
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
    <div className="header_wrapper">
      <h2>Pesherkino VPN</h2>
      <ul className="nav_links">
        {navLinks.map(({ path, label }) => (
          <li key={path}>
            <Link to={path} className={location.pathname === path ? 'active' : ''}>
              {label}
            </Link>
          </li>
        ))}
      </ul>

      <input
        className="telegram_input"
        type="password"
        placeholder="Telegram ID"
        value={inputValue}
        onChange={handleChange}
        spellCheck={false}
      />

      <button
        className="update_button"
        onClick={handleCheckUpdates}
        disabled={updateStatus === 'Проверка обновлений...'}
      >
        Check Update
      </button>

      {updateStatus && <div className="update_status_popup">{updateStatus}</div>}

      <ul className="icon_links">
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
  )
}

export default Header
