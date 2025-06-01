import React from 'react'

const OpenFolders: React.FC = () => {
  const openConfigFolder = () => {
    window.electronAPI.openFolder('C:\\Users\\lesni\\AppData\\Roaming\\PesherkinoVPN')
  }

  const openProgramFolder = () => {
    window.electronAPI.openFolder('C:\\Users\\lesni\\AppData\\Local\\Programs\\pesherkino-vpn')
  }

  return (
    <div className="app">
      <div className="buttons-container">
        <button onClick={openConfigFolder}>Открыть папку конфигурации</button>
        <button onClick={openProgramFolder}>Расположение программы</button>
      </div>
    </div>
  )
}

export default OpenFolders
