import { setLoading, setError, appendLogs, clearLogs } from '@renderer/redux/slice/logsSlice'
import { AppDispatch, RootState } from '@renderer/redux/store'
import React, { useRef, useMemo, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import ProxyConnections from '../components/ProxyConnectLogs'

const LogsViewer: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const logContainerRef = useRef<HTMLDivElement>(null)
  const { logs, loading, error } = useSelector((state: RootState) => state.logs)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchLogs = async (showLoading = true) => {
    if (showLoading) {
      dispatch(setLoading(true))
    }
    dispatch(setError(null))

    try {
      const data = await window.electronAPI.getLogs()
      if (data) {
        dispatch(appendLogs(data))
        setLastUpdate(new Date())

        // Прокручиваем к последней записи
        if (logContainerRef.current) {
          logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
        }
      }
    } catch (err: any) {
      console.error('Ошибка при получении логов:', err)
      dispatch(setError('Не удалось загрузить логи: ' + (err?.message || err)))
    } finally {
      if (showLoading) {
        dispatch(setLoading(false))
      }
    }
  }

  // Автоматическое обновление логов каждые 5 секунд
  useEffect(() => {
    fetchLogs(false) // Первоначальная загрузка без индикатора загрузки

    const interval = setInterval(() => {
      fetchLogs(false)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleClear = () => {
    dispatch(clearLogs())
    fetchLogs()
  }

  const formatLog = (log: string) => {
    if (!log.trim()) {
      return <div className="log-line empty">Логи отсутствуют</div>
    }
    return log.split('\n').map((line, index) => {
      let logLevelClass = ''
      if (line.includes('ERROR')) logLevelClass = 'error'
      else if (line.includes('WARN')) logLevelClass = 'warn'
      else if (line.includes('INFO')) logLevelClass = 'info'

      return (
        <div key={index} className={`log-line ${logLevelClass}`}>
          {line}
        </div>
      )
    })
  }

  const formattedLogs = useMemo(() => formatLog(logs), [logs])

  return (
    <div className="logs-viewer">
      <div className="logs-header">
        <div className="logs-title-container">
          <h3 className="logs-title">Логи приложения</h3>
          <span className="last-update">
            Последнее обновление: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
        <div className="logs-buttons">
          <button onClick={() => fetchLogs(true)} className="logs-button" disabled={loading}>
            {loading ? 'Обновление...' : 'Обновить'}
          </button>
          <button onClick={handleClear} className="logs-button" disabled={loading}>
            Очистить
          </button>
        </div>
      </div>

      {loading && <div className="log-loading active">Загрузка логов...</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="log-container" ref={logContainerRef}>
        {formattedLogs}
      </div>

      <ProxyConnections />
    </div>
  )
}

export default LogsViewer
