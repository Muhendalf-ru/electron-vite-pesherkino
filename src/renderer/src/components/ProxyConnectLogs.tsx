import React, { useEffect, useState, useRef } from 'react'

type Connection = {
  proto: string
  local: string
  foreign: string
  state: string
  pid: string
  process: string
}

const ProxyConnections: React.FC = () => {
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isInitialLoad = useRef(true) // только при первом рендере

  const fetchConnections = async (showLoading = false) => {
    if (showLoading) setLoading(true)
    setError(null)
    try {
      const result = await window.electronAPI.getProxyConnections()
      setConnections(result)
    } catch (err) {
      console.error('Ошибка при получении подключений:', err)
      setError('Не удалось получить список подключений')
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    fetchConnections(true) // первая загрузка
    isInitialLoad.current = false

    const interval = setInterval(() => {
      fetchConnections(false) // автообновление без спиннера
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="logs-viewer">
      <p>localhost:1080</p>
      <div className="logs-header">
        <h2 className="logs-title">Подключения через SOCKS5</h2>
        <button className="logs-button" onClick={() => fetchConnections(true)} disabled={loading}>
          Обновить
        </button>
      </div>

      {loading && <div className="log-loading active">Загрузка...</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="log-container">
        <div className="log-info">
          <span className="col pid">PID</span>
          <span className="col process">Процесс</span> {/* вот тут должен быть .process */}
          <span className="col proto">Протокол</span>
          <span className="col local">Локальный адрес</span>
          <span className="col foreign">Внешний адрес</span>
          <span className="col state">Состояние</span>
        </div>
        {connections.length === 0 && !loading && (
          <div className="connection-line empty">Нет активных подключений.</div>
        )}

        <hr />

        {connections.map((c, i) => (
          <div className="connection-line active" key={i}>
            <span className="col pid">[PID: {c.pid}]</span>
            <span className="col process">{c.process}</span>{' '}
            <span className="col proto">{c.proto}</span>
            <span className="col local">{c.local}</span>
            <span className="col foreign">{c.foreign}</span>
            <span className="col state">{c.state}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProxyConnections
