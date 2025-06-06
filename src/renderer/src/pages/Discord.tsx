import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DiscordVpnWarningTab } from '../components/DiscordWariningTab'
import {
  setVpnRunning,
  setTelegramId,
  setStatus,
  setIsError
} from '@renderer/redux/slice/discordSlice'
import { RootState } from '@renderer/redux/store'

function Discord(): React.JSX.Element {
  const dispatch = useDispatch()
  const { telegramId, vpnRunning, status, isError } = useSelector(
    (state: RootState) => state.discord
  )

  const [isDeleting, setIsDeleting] = useState(false)
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    const check = async (): Promise<void> => {
      const running = await window.electronAPI.checkVpnStatus()
      dispatch(setVpnRunning(running))

      const savedId = await window.electronAPI.getTelegramId()
      if (savedId) {
        dispatch(setTelegramId(savedId))
      } else {
        dispatch(setStatus('Error: Telegram ID not found. Please set it first.'))
        dispatch(setIsError(true))
      }
    }
    check()
  }, [dispatch])

  useEffect(() => {
    const interval = setInterval(() => {
      window.electronAPI.checkVpnStatus().then((running) => {
        dispatch(setVpnRunning(running))
      })
    }, 5000) // каждые 5 секунд

    return () => clearInterval(interval)
  }, [dispatch])

  const handleRunVpnSetup = async (): Promise<void> => {
    dispatch(setStatus('Running...'))
    dispatch(setIsError(false))

    if (!telegramId || telegramId.trim() === '') {
      dispatch(setStatus('Error: Telegram ID is missing. Cannot run VPN setup.'))
      dispatch(setIsError(true))
      return
    }

    try {
      const res = await window.electronAPI.runVpnSetup(telegramId.trim())
      if (res.success) {
        dispatch(setStatus('VPN setup completed successfully!'))
        dispatch(setVpnRunning(true))
      } else {
        dispatch(setStatus(`Error: ${res.error}`))
        dispatch(setIsError(true))

        await window.electronAPI.updateDiscordStatus()
      }
    } catch (err) {
      dispatch(setStatus(`Unexpected error: ${String(err)}`))
      dispatch(setIsError(true))
    }
  }

  const handleDeleteDiscordFiles = async (): Promise<void> => {
    dispatch(setStatus('Deleting Discord files...'))
    dispatch(setIsError(false))
    setIsDeleting(true)
    try {
      const res = await window.electronAPI.deleteDiscordFiles()
      if (res.success) {
        dispatch(setStatus('Discord files successfully deleted.'))
      } else {
        dispatch(setStatus(`Error during deletion: ${res.error}`))
        dispatch(setIsError(true))
      }
    } catch (err) {
      dispatch(setStatus(`Unexpected error: ${String(err)}`))
      dispatch(setIsError(true))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStopVpn = async (): Promise<void> => {
    dispatch(setStatus('Stopping VPN...'))
    dispatch(setIsError(false))
    try {
      const res = await window.electronAPI.stopVpn()
      if (res.success) {
        dispatch(setStatus('VPN stopped successfully.'))
        dispatch(setVpnRunning(false))

        await window.electronAPI.updateDiscordStatus()
      } else {
        dispatch(setStatus(`Error: ${res.error}`))
        dispatch(setIsError(true))
      }
    } catch (err) {
      dispatch(setStatus(`Unexpected error: ${String(err)}`))
      dispatch(setIsError(true))
    }
  }

  const toggleWarning = (): void => {
    setShowWarning((prev) => !prev)
  }

  return (
    <div className="discord-wrapper">
      <div className={`discord-container ${vpnRunning ? 'vpn-on' : 'vpn-off'}`}>
        <h1 className="discord-title">
          Discord Fix
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

        <button
          onClick={handleRunVpnSetup}
          className="discord-button"
          disabled={vpnRunning || status === 'Запуск...'}
        >
          {status === 'Запуск...' ? 'Запуск...' : 'Запустить'}
        </button>

        <button onClick={handleStopVpn} className="discord-button" disabled={!vpnRunning}>
          Остановить
        </button>

        <button
          onClick={handleDeleteDiscordFiles}
          className="discord-button discord-button--danger"
          disabled={isDeleting}
        >
          {isDeleting ? 'Удаление...' : 'Удалить DLL'}
        </button>

        {status && (
          <p
            className={`discord-status ${isError ? 'discord-status--error' : 'discord-status--success'}`}
          >
            {status}
          </p>
        )}
      </div>

      {showWarning && (
        <div className="discord-overlay" onClick={() => setShowWarning(false)}>
          <div className="discord-warning-modal" onClick={(e) => e.stopPropagation()}>
            <DiscordVpnWarningTab />
            <button className="discord-warnng-button" onClick={() => setShowWarning(false)}>
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Discord
