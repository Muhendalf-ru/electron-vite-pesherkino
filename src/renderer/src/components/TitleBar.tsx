import React from 'react'

const TitleBar: React.FC = () => {
  // Функции для управления окном через preload API
  const minimize = (): void => window.electronAPI.minimize?.()
  // const maximize = (): void => window.electronAPI.maximize?.()
  const close = (): void => window.electronAPI.close?.()

  return (
    <div className="custom-titlebar" data-app-region="drag">
      <div className="custom-titlebar-title">Pesherkino VPN</div>
      <div className="custom-titlebar-buttons">
        <button
          type="button"
          data-app-region="no-drag"
          onClick={minimize}
          aria-label="Минимизировать"
        >
          -
        </button>
        <button type="button" data-app-region="no-drag" onClick={close} aria-label="Закрыть">
          ×
        </button>
      </div>
    </div>
  )
}

export default TitleBar
