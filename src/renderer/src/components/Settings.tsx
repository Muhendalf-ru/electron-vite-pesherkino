import React, { useState, useEffect } from 'react'

interface Props {
  onToggle?: (enabled: boolean) => void
}

const DiscordRpcToggle: React.FC<Props> = ({ onToggle }) => {
  const [enabled, setEnabled] = useState(false)
  const [vpnRunning, setVpnRunning] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchInitial = async () => {
      try {
        const [rpcValue, vpnValue] = await Promise.all([
          window.electronAPI.getDiscordRpcEnabled(),
          window.electronAPI.getVpnStatus()
        ])
        if (isMounted) {
          setEnabled(rpcValue)
          setVpnRunning(vpnValue)
        }
      } catch (err) {
        console.error('Ошибка инициализации Discord RPC или VPN', err)
        if (isMounted) {
          setError('Ошибка инициализации Discord RPC или VPN')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchInitial()

    const unsubscribeRpc = window.electronAPI.onDiscordRpcStatusChanged((value: boolean) => {
      if (isMounted) {
        setEnabled(value)
        setError(null)
        if (onToggle) onToggle(value)
      }
    }) as (() => void) | undefined

    const unsubscribeVpn = window.electronAPI.onVpnStatusChanged((running: boolean) => {
      if (isMounted) {
        setVpnRunning(running)
      }
    }) as (() => void) | undefined

    return () => {
      isMounted = false
      unsubscribeRpc?.()
      unsubscribeVpn?.()
    }
  }, [onToggle])

  const handleChange = async () => {
    setLoading(true)
    setError(null)
    try {
      await window.electronAPI.setDiscordRpcEnabled(!enabled)
    } catch (err) {
      console.error('Ошибка изменения статуса Discord RPC', err)
      setError('Не удалось изменить статус Discord RPC')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <div className="content">
        <div className="discord-rpc-toggle">
          <label className="switch">
            <input
              type="checkbox"
              checked={enabled}
              onChange={handleChange}
              disabled={loading}
              title="Toggle Discord Rich Presence"
              aria-label="Toggle Discord Rich Presence"
            />
            <span className="slider" />
          </label>

          <div className="description">
            <h3>Discord Rich Presence</h3>

            <div className="status">
              {enabled ? (
                <p>Discord RPC включён. Статус в Discord обновляется.</p>
              ) : (
                <p>Discord RPC выключен. Статус в Discord не виден.</p>
              )}
              <p>
                <strong>VPN:</strong> {vpnRunning ? 'Подключён к VPN' : 'Отключён от VPN'}
              </p>
            </div>

            {error && <div className="error">{error}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DiscordRpcToggle
