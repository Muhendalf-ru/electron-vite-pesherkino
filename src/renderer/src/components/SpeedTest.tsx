import { useState } from 'react'

export default function Speedtest() {
  const [results, setResults] = useState<{
    ping: number | null
    download: number | null
    upload: number | null
  } | null>(null)

  const runTest = async () => {
    if (!window.electronAPI?.speedtest) {
      console.error('Speedtest API is not available')
      return
    }
    const data = await window.electronAPI.speedtest.run()
    setResults(data)
  }

  return (
    <div className="speedtestContainer">
      <h1 className="title">Speedtest</h1>
      <p className="warning-text-user">В разработке</p>
      <div className="resultsBox">
        <div className="resultItem">
          📶 Ping:{' '}
          {results && results.ping !== null ? (
            <span className="pingValue"> {results.ping} ms</span>
          ) : (
            'Ошибка'
          )}
        </div>
        <div className="resultItem">
          ⬇️ Download:{' '}
          {results && results.download !== null ? (
            <span className="downloadValue">{results.download.toFixed(2)} Mbps</span>
          ) : (
            'Ошибка'
          )}
        </div>
        <div className="resultItem">
          ⬆️ Upload:{' '}
          {results && results.upload !== null ? (
            <span className="uploadValue">{results.upload.toFixed(2)} Mbps</span>
          ) : (
            'Ошибка'
          )}
        </div>
      </div>

      <div className="buttonsContainer">
        <button onClick={runTest}>Запустить</button>
      </div>
      <p className="warning-text-user">⚠️ Показатели будут отличаться от speedtest.net</p>
    </div>
  )
}
