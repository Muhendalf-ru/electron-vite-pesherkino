import React, { useEffect, useState, useRef, useLayoutEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DiscordVpnWarningTab } from '../components/DiscordWariningTab'
import {
  setVpnRunning,
  setTelegramId,
  setStatus,
  setIsError,
  setActiveMenu
} from '@renderer/redux/slice/discordSlice'
import { RootState } from '@renderer/redux/store'
import { setPatchStatus, setPatchIsError, setPatchRunning } from '@renderer/redux/slice/patchSlice'
import styles from '../styles/components/Discord.module.scss'

// Универсальный компонент меню Discord
function DiscordMenu({
  title,
  vpnRunning,
  status,
  isError,
  telegramId,
  handleRunVpnSetup,
  handleStopVpn,
  handleDeleteDiscordFiles,
  isDeleting,
  showWarning,
  toggleWarning
}) {
  return (
    <div className={`discord-container ${vpnRunning ? 'vpn-on' : 'vpn-off'}`}>
      <h1 className="discord-title">
        {title}
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
  )
}

function Discord(): React.JSX.Element {
  const dispatch = useDispatch()
  const { telegramId, activeMenu } = useSelector((state: RootState) => state.discord)
  const patch = useSelector((state: RootState) => state.patch)

  // refs для табов
  const tabRefs = [useRef<HTMLButtonElement>(null), useRef<HTMLButtonElement>(null)]
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0
  })

  useLayoutEffect(() => {
    const node = tabRefs[activeMenu]?.current
    if (node) {
      setIndicatorStyle({ left: node.offsetLeft, width: node.offsetWidth })
    }
  }, [activeMenu])

  // Состояния и логика для первого меню (Discord VPN)
  const [vpnRunning, setVpnRunningLocal] = useState(false)
  const [status1, setStatus1] = useState('')
  const [isError1, setIsError1] = useState(false)
  const [isDeleting1, setIsDeleting1] = useState(false)
  const [showWarning1, setShowWarning1] = useState(false)

  // Состояния и логика для второго меню (Discord Patch)
  const [isDeleting2, setIsDeleting2] = useState(false)
  const [showWarning2, setShowWarning2] = useState(false)

  // Логика для первого меню (VPN)
  useEffect(() => {
    if (activeMenu !== 0) return
    const check = async (): Promise<void> => {
      const running = await window.electronAPI.checkVpnStatus()
      setVpnRunningLocal(running)
      const savedId = await window.electronAPI.getTelegramId()
      if (!savedId) {
        setStatus1('Error: Telegram ID not found. Please set it first.')
        setIsError1(true)
      }
    }
    check()
  }, [dispatch, activeMenu])

  useEffect(() => {
    if (activeMenu !== 0) return
    const interval = setInterval(() => {
      window.electronAPI.checkVpnStatus().then((running) => {
        setVpnRunningLocal(running)
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [dispatch, activeMenu])

  const handleRunVpnSetup = async (): Promise<void> => {
    // Сначала удаляем DLL из Discord Free
    await handleDeletePatchFiles()
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
    setStatus1('Deleting Discord files...')
    setIsError1(false)
    setIsDeleting1(true)
    try {
      const res = await window.electronAPI.deleteDiscordFiles()
      if (res.success) {
        setStatus1('Discord files successfully deleted.')
      } else {
        setStatus1(`Error during deletion: ${res.error}`)
        setIsError1(true)
      }
    } catch (err) {
      setStatus1(`Unexpected error: ${String(err)}`)
      setIsError1(true)
    } finally {
      setIsDeleting1(false)
    }
  }

  const handleStopVpn = async (): Promise<void> => {
    setStatus1('Stopping VPN...')
    setIsError1(false)
    try {
      const res = await window.electronAPI.stopVpn()
      if (res.success) {
        setStatus1('VPN stopped successfully.')
        setVpnRunningLocal(false)
        await window.electronAPI.updateDiscordStatus()
      } else {
        setStatus1(`Error: ${res.error}`)
        setIsError1(true)
      }
    } catch (err) {
      setStatus1(`Unexpected error: ${String(err)}`)
      setIsError1(true)
    }
  }

  // Логика для второго меню (Patch)
  const handleRunPatch = async (): Promise<void> => {
    // Сначала удаляем DLL из Discord VPN
    await handleDeleteDiscordFiles()
    dispatch(setPatchStatus('Копирование файлов патча...'))
    dispatch(setPatchIsError(false))
    dispatch(setPatchRunning(false))
    try {
      // Вызов IPC для копирования файлов
      const res = await window.electronAPI.copyFreeFiles()
      if (res.success) {
        dispatch(setPatchStatus('Файлы патча скопированы. Запуск Discord...'))
        const runRes = await window.electronAPI.runDiscord()
        if (runRes.success) {
          dispatch(setPatchStatus('Discord запущен!'))
          dispatch(setPatchRunning(true))
        } else {
          dispatch(setPatchStatus(`Ошибка запуска Discord: ${runRes.error}`))
          dispatch(setPatchIsError(true))
        }
      } else {
        dispatch(setPatchStatus(`Ошибка при копировании: ${res.error}`))
        dispatch(setPatchIsError(true))
      }
    } catch (err) {
      dispatch(setPatchStatus(`Ошибка: ${String(err)}`))
      dispatch(setPatchIsError(true))
    }
  }

  const handleDeletePatchFiles = async (): Promise<void> => {
    dispatch(setPatchStatus('Удаление файлов патча...'))
    dispatch(setPatchIsError(false))
    setIsDeleting2(true)
    try {
      // Вызов IPC для удаления файлов
      const res = await window.electronAPI.deleteFreePatchFiles()
      if (res.success) {
        dispatch(setPatchStatus('Файлы патча удалены.'))
      } else {
        dispatch(setPatchStatus(`Ошибка при удалении: ${res.error}`))
        dispatch(setPatchIsError(true))
      }
    } catch (err) {
      dispatch(setPatchStatus(`Ошибка: ${String(err)}`))
      dispatch(setPatchIsError(true))
    } finally {
      setIsDeleting2(false)
    }
  }

  const handleStopPatch = async (): Promise<void> => {
    dispatch(setPatchStatus('Остановка Discord и sing-box...'))
    dispatch(setPatchIsError(false))
    try {
      const res = await window.electronAPI.stopVpn()
      if (res.success) {
        dispatch(setPatchStatus('Discord и sing-box остановлены.'))
        dispatch(setPatchRunning(false))
      } else {
        dispatch(setPatchStatus(`Ошибка при остановке: ${res.error}`))
        dispatch(setPatchIsError(true))
      }
    } catch (err) {
      dispatch(setPatchStatus(`Ошибка: ${String(err)}`))
      dispatch(setPatchIsError(true))
    }
  }

  useEffect(() => {
    if (activeMenu !== 1) return
    let interval: NodeJS.Timeout | null = null
    const check = async () => {
      try {
        const res = await window.electronAPI.isDiscordRunning()
        dispatch(setPatchRunning(res.running))
      } catch {}
    }
    check()
    interval = setInterval(check, 5000)
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [dispatch, activeMenu])

  useEffect(() => {
    const syncTelegramId = async () => {
      const savedId = await window.electronAPI.getTelegramId()
      if (savedId) {
        dispatch(setTelegramId(savedId))
      }
    }
    syncTelegramId()
  }, [dispatch, activeMenu])

  return (
    <div className={styles['discord-wrapper']}>
      <div className={styles['discord-tabs']}>
        <button
          ref={tabRefs[0]}
          className={
            activeMenu === 0
              ? `${styles['discord-tab']} ${styles['active']}`
              : styles['discord-tab']
          }
          onClick={() => dispatch(setActiveMenu(0))}
          type="button"
          disabled={patch.patchRunning}
        >
          Discord VPN
        </button>
        <button
          ref={tabRefs[1]}
          className={
            activeMenu === 1
              ? `${styles['discord-tab']} ${styles['active']}`
              : styles['discord-tab']
          }
          onClick={() => dispatch(setActiveMenu(1))}
          type="button"
          disabled={vpnRunning}
        >
          Discord Free
        </button>
        <div
          className={styles['discord-tab-indicator']}
          style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
        />
      </div>
      <div>
        {activeMenu === 0 && (
          <DiscordMenu
            title="Discord VPN"
            vpnRunning={vpnRunning}
            status={status1}
            isError={isError1}
            telegramId={telegramId}
            handleRunVpnSetup={handleRunVpnSetup}
            handleStopVpn={handleStopVpn}
            handleDeleteDiscordFiles={handleDeleteDiscordFiles}
            isDeleting={isDeleting1}
            showWarning={showWarning1}
            toggleWarning={() => setShowWarning1((v) => !v)}
          />
        )}
        {activeMenu === 1 && (
          <DiscordMenu
            title="Discord Free "
            vpnRunning={patch.patchRunning}
            status={patch.status || ''}
            isError={patch.isError}
            telegramId={telegramId}
            handleRunVpnSetup={handleRunPatch}
            handleStopVpn={handleStopPatch}
            handleDeleteDiscordFiles={handleDeletePatchFiles}
            isDeleting={isDeleting2}
            showWarning={showWarning2}
            toggleWarning={() => setShowWarning2((v) => !v)}
          />
        )}
      </div>
      {showWarning1 && activeMenu === 0 && (
        <div className="discord-overlay" onClick={() => setShowWarning1(false)}>
          <div className="discord-warning-modal" onClick={(e) => e.stopPropagation()}>
            <DiscordVpnWarningTab />
            <button className="discord-warnng-button" onClick={() => setShowWarning1(false)}>
              ×
            </button>
          </div>
        </div>
      )}
      {showWarning2 && activeMenu === 1 && (
        <div className="discord-overlay" onClick={() => setShowWarning2(false)}>
          <div className="discord-warning-modal" onClick={(e) => e.stopPropagation()}>
            <DiscordVpnWarningTab />
            <button className="discord-warnng-button" onClick={() => setShowWarning2(false)}>
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Discord
