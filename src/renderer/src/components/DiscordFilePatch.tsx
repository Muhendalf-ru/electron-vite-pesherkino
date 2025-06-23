import React, { useEffect, useState } from 'react'

const DiscordPathInput: React.FC = () => {
  const [discordPath, setDiscordPath] = useState('')
  const [notification, setNotification] = useState('')

  useEffect(() => {
    window.electronAPI.getDiscordPath().then(setDiscordPath)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDiscordPath(e.target.value)
  }

  const handleSave = async () => {
    await window.electronAPI.setDiscordPath(discordPath)
    setNotification('✅ Путь успешно сохранён!')
    setTimeout(() => setNotification(''), 3000)
  }

  const handleSelectPath = async () => {
    const selectedPath = await window.electronAPI.selectDiscordPath()
    if (selectedPath) setDiscordPath(selectedPath)
  }

  return (
    <div className="discord-path-box">
      <div className="discord-path-description">
        <h3>Путь к Discord</h3>
        <p>Укажите путь к установленному Discord, если он отличается от стандартного.</p>
      </div>
      <input
        type="text"
        value={discordPath}
        onChange={handleChange}
        className="discord-path-input"
        placeholder="C:\\Users\\Имя\\AppData\\Local\\Discord"
        title="Путь к Discord"
      />
      <div className="buttons-container">
        <button onClick={handleSelectPath}>Выбрать путь</button>
        <button onClick={handleSave}>Сохранить</button>
      </div>
      {notification && <div className="notification">{notification}</div>}
    </div>
  )
}

export default DiscordPathInput
