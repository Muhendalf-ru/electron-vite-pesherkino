import { useTelegram } from '@renderer/hooks/useTelegram'
import React, { useEffect, useState } from 'react'
import { DiscordVpnWarningTab } from './DiscordWariningTab'

function Discord(): React.JSX.Element {
  const { telegramId, setTelegramId } = useTelegram()

  const [status, setStatus] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const [vpnRunning, setVpnRunning] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showWarning, setShowWarning] = useState(false) // для показа/скрытия таба

  useEffect(() => {
    const check = async (): Promise<void> => {
      const running = await window.electronAPI.checkVpnStatus()
      setVpnRunning(running)

      const savedId = await window.electronAPI.getTelegramId()
      if (savedId) {
        setTelegramId(savedId)
      } else {
        setStatus('Error: Telegram ID not found. Please set it first.')
        setIsError(true)
      }
    }
    check()
  }, [setTelegramId])

  const handleRunVpnSetup = async (): Promise<void> => {
    setStatus('Running...')
    setIsError(false)

    if (!telegramId || telegramId.trim() === '') {
      setStatus('Error: Telegram ID is missing. Cannot run VPN setup.')
      setIsError(true)
      return
    }

    try {
      const res = await window.electronAPI.runVpnSetup(telegramId.trim())
      if (res.success) {
        setStatus('VPN setup completed successfully!')
        setVpnRunning(true)
      } else {
        setStatus(`Error: ${res.error}`)
        setIsError(true)
      }
    } catch (err) {
      setStatus(`Unexpected error: ${String(err)}`)
      setIsError(true)
    }
  }

  const handleDeleteDiscordFiles = async (): Promise<void> => {
    setStatus('Deleting Discord files...')
    setIsError(false)
    setIsDeleting(true)
    try {
      const res = await window.electronAPI.deleteDiscordFiles()
      if (res.success) {
        setStatus('Discord files successfully deleted.')
      } else {
        setStatus(`Error during deletion: ${res.error}`)
        setIsError(true)
      }
    } catch (err) {
      setStatus(`Unexpected error: ${String(err)}`)
      setIsError(true)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStopVpn = async (): Promise<void> => {
    setStatus('Stopping VPN...')
    setIsError(false)
    try {
      const res = await window.electronAPI.stopVpn()
      if (res.success) {
        setStatus('VPN stopped successfully.')
        setVpnRunning(false)
      } else {
        setStatus(`Error: ${res.error}`)
        setIsError(true)
      }
    } catch (err) {
      setStatus(`Unexpected error: ${String(err)}`)
      setIsError(true)
    }
  }

  const toggleWarning = (): void => {
    setShowWarning((prev) => !prev)
  }

  return (
    <div className="discord-wrapper">
      <div className={`discord-container ${vpnRunning ? 'vpn-on' : 'vpn-off'}`}>
        <h1 className="discord-title">
          Discord Proxy
          {/* Иконка подсказки */}
          <button
            className="discord-help-icon"
            onClick={toggleWarning}
            aria-label={showWarning ? 'Скрыть предупреждение' : 'Показать предупреждение'}
            title={showWarning ? 'Скрыть предупреждение' : 'Показать предупреждение'}
            type="button"
          >
            ℹ️
          </button>
        </h1>

        {/* Кнопки управления */}
        <button
          onClick={handleRunVpnSetup}
          className="discord-button"
          disabled={vpnRunning || status === 'Running...'}
        >
          {status === 'Running...' ? 'Running...' : 'Run VPN Setup'}
        </button>

        <button onClick={handleStopVpn} className="discord-button" disabled={!vpnRunning}>
          Stop VPN
        </button>

        <button
          onClick={handleDeleteDiscordFiles}
          className="discord-button discord-button--danger"
          disabled={isDeleting}
        >
          {isDeleting ? 'Delete...' : 'Delete Discord DLL'}
        </button>

        {status && (
          <p
            className={`discord-status ${isError ? 'discord-status--error' : 'discord-status--success'}`}
          >
            {status}
          </p>
        )}
      </div>

      {/* Вкладка предупреждения, видна только если showWarning=true */}
      {showWarning && (
        <div className="discord-overlay" onClick={() => setShowWarning(false)}>
          <div
            className="discord-warning-modal"
            onClick={(e) => e.stopPropagation()} // чтобы клик по модалке не закрывал её
          >
            <DiscordVpnWarningTab />
            {/* Добавим кнопку закрытия */}
            <button
              className="discord-warnng-button"
              onClick={() => setShowWarning(false)}
              aria-label="Закрыть предупреждение"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Discord
