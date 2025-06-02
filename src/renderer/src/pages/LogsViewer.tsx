import { setLoading, setError, appendLogs, clearLogs } from '@renderer/redux/slice/logsSlice'
import { AppDispatch, RootState } from '@renderer/redux/store'
import React, { useRef, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import ProxyConnections from '../components/ProxyConnectLogs'

const LogsViewer: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const logContainerRef = useRef<HTMLDivElement>(null)

  const { logs, loading, error } = useSelector((state: RootState) => state.logs)

  const fetchLogs = async () => {
    dispatch(setLoading(true))
    dispatch(setError(null))

    try {
      const data = await window.electronAPI.getLogs()
      if (!logs.includes(data)) {
        dispatch(appendLogs(data))
      }
    } catch (err: any) {
      dispatch(setError('Не удалось загрузить логи: ' + (err?.message || err)))
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleClear = () => dispatch(clearLogs())

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
        <h3 className="logs-title">Логи приложения</h3>
        <button onClick={fetchLogs} className="logs-button">
          Обновить
        </button>
        <button onClick={handleClear} className="logs-button">
          Очистить
        </button>
      </div>

      {loading && <div className="log-loading">Загрузка логов...</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="log-container" ref={logContainerRef}>
        {formattedLogs}
      </div>

      <ProxyConnections />
    </div>
  )
}

export default LogsViewer
