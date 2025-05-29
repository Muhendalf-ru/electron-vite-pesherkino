import { useTelegram } from '@renderer/hooks/useTelegram'
import { GitHubSVG } from '@renderer/svg/GitHub'
import { TelegramSVG } from '@renderer/svg/Telegram'
import React, { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'

function Header(): React.JSX.Element {
  const location = useLocation()
  const isDiscord = location.pathname === '/discord-fix'

  const { telegramId, setTelegramId } = useTelegram()
  const [inputValue, setInputValue] = useState('')

  // При загрузке компонента пытаемся получить сохранённый telegramId и установить в input
  useEffect(() => {
    if (telegramId) {
      setInputValue(telegramId)
    }
  }, [telegramId])

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const val = e.target.value
    setInputValue(val)
    setTelegramId(val)

    // Сохраняем телеграм айди в основной процесс (через electronAPI)
    if (window.electronAPI?.saveTelegramId) {
      try {
        await window.electronAPI.saveTelegramId(val)
      } catch (error) {
        console.error('Failed to save Telegram ID', error)
      }
    }
  }

  return (
    <div className="header_wrapper">
      <h2>Pesherkino VPN</h2>

      <ul className="nav_links">
        <li>
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
            Main Page
          </Link>
        </li>
        <li>
          <Link to="/discord-fix" className={isDiscord ? 'active' : ''}>
            Discord Fix
          </Link>
        </li>
      </ul>

      <input
        className="telegram_input"
        type="password"
        placeholder="Telegram ID"
        value={inputValue}
        onChange={handleChange}
        spellCheck={false}
      />

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
