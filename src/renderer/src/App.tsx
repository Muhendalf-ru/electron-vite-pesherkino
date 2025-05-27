import React, { useState, useEffect } from 'react'

declare global {
  interface Window {
    electronAPI: {
      runVpnSetup: (telegramId?: string) => Promise<{ success: boolean; error?: string }>
      getTelegramId: () => Promise<string | null>
      checkVpnStatus: () => Promise<boolean>
      stopVpn: () => Promise<{ success: boolean; error?: string }>
      deleteDiscordFiles: () => Promise<{ success: boolean; error?: string }>
    }
  }
}

function App(): React.JSX.Element {
  const [telegramId, setTelegramId] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const [vpnRunning, setVpnRunning] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false) // для статуса удаления

  useEffect(() => {
    const check = async (): Promise<void> => {
      const running = await window.electronAPI.checkVpnStatus()
      setVpnRunning(running)
      const savedId = await window.electronAPI.getTelegramId()
      if (savedId) setTelegramId(savedId)
    }
    check()
  }, [])

  const handleRunVpnSetup = async (): Promise<void> => {
    setStatus('Running...')
    setIsError(false)

    try {
      const res = await window.electronAPI.runVpnSetup(telegramId.trim() || undefined)
      if (res.success) {
        setStatus('VPN setup completed successfully!')
        setIsError(false)
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
        setIsError(false)
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
        setIsError(false)
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

  const openLink = (url: string): void => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={`container ${vpnRunning ? 'vpn-on' : 'vpn-off'}`}>
      <h1 className="creator" style={{ marginBottom: '0.5rem', textAlign: 'center' }}>
        Pesherkino VPN
      </h1>

      <p className="creator" style={{ marginBottom: '0.5rem', textAlign: 'center' }}>
        Устанавливает Proxy в Discord
      </p>

      <input
        type="text"
        placeholder="Enter your Telegram ID"
        value={telegramId}
        onChange={(e) => setTelegramId(e.target.value)}
        className="input"
        autoFocus
        disabled={vpnRunning}
      />

      <button
        onClick={handleRunVpnSetup}
        className="button"
        disabled={vpnRunning || status === 'Running...'}
      >
        {status === 'Running...' ? 'Running...' : 'Run VPN Setup'}
      </button>
      <button onClick={handleStopVpn} className="button" disabled={!vpnRunning}>
        Stop VPN
      </button>
      <button
        onClick={handleDeleteDiscordFiles}
        className="button"
        disabled={isDeleting}
        style={{ backgroundColor: '#f87171' /* красный, чтобы выделить */ }}
      >
        {isDeleting ? 'Delete...' : 'Delete Discord DLL'}
      </button>
      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button
          className="link-button"
          onClick={() => openLink('https://t.me/YourTelegramChannel')}
          type="button"
        >
          Telegram
        </button>
        <button
          className="link-button"
          onClick={() => openLink('https://wiki.pesherkino.store')}
          type="button"
        >
          Wiki
        </button>
        <button
          className="link-button"
          onClick={() => openLink('mailto:support@pesherkino.store')}
          type="button"
        >
          Тех поддержка
        </button>
      </div>

      {status && (
        <p
          className="status"
          style={{ color: isError ? '#ff6b6b' : '#4ade80', fontWeight: 'bold', marginTop: '1rem' }}
        >
          {status}
        </p>
      )}
    </div>
  )
}

export default App
