import React, { useEffect, useState } from 'react'

const PingDisplay: React.FC = () => {
  const [ping, setPing] = useState<number | null>(null)

  const fetchPing = async () => {
    try {
      const result = await window.electronAPI.invoke('get-ping')
      if (typeof result === 'number') {
        setPing(result)
      } else {
        setPing(null)
      }
    } catch {
      setPing(null)
    }
  }

  useEffect(() => {
    fetchPing()
    const interval = setInterval(fetchPing, 10000) // каждые 10 сек
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="ping-display">
      <span className="label">Ping:</span>{' '}
      {ping === null ? (
        <span className="error">Socks5 Inactive</span>
      ) : (
        <span className={`ping ${ping > 150 ? 'moderate' : 'good'}`}>{ping} мс</span>
      )}
    </div>
  )
}

export default PingDisplay
