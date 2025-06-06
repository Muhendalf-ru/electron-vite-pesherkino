import { ipcMain } from 'electron'
import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import { generateTunConfigFromLink, runSingbox } from '../utils/config.utils'
import { singboxPath } from '../../constants/constants'

export const configDir = path.join(app.getPath('appData'), 'PesherkinoVPN')
export const userConfigPath = path.join(configDir, 'config.json')
export const tunConfigPath = path.join(configDir, 'tun-config.json')

console.log('Инициализация configManager.ipc.ts')
console.log('Путь к конфигу:', userConfigPath)
console.log('Путь к TUN конфигу:', tunConfigPath)

// Обеспечиваем существование директории
if (!fs.existsSync(configDir)) {
  console.log('Создаем директорию:', configDir)
  fs.mkdirSync(configDir, { recursive: true })
}

// Чтение пользовательского конфига
ipcMain.handle('read-user-config', async () => {
  console.log('Вызван хендлер read-user-config')
  try {
    if (!fs.existsSync(userConfigPath)) {
      console.log('Файл конфига не существует')
      return {}
    }
    const content = fs.readFileSync(userConfigPath, 'utf-8')
    const config = JSON.parse(content)
    console.log('Прочитан конфиг:', config)
    return config
  } catch (err) {
    console.error('Ошибка при чтении конфига:', err)
    return {}
  }
})

// Генерация конфига из ссылки
ipcMain.handle('generate-config-from-link', async (_, link: string) => {
  console.log('Вызван хендлер generate-config-from-link с ссылкой:', link)
  try {
    const config = generateTunConfigFromLink(link)
    console.log('Сгенерирован конфиг:', config)
    return config
  } catch (err) {
    console.error('Ошибка при генерации конфига:', err)
    throw err
  }
})

// Сохранение TUN конфига
ipcMain.handle('save-tun-config', async (_, config: any) => {
  console.log('Вызван хендлер save-tun-config')
  try {
    const content = JSON.stringify(config, null, 2)
    fs.writeFileSync(tunConfigPath, content, 'utf-8')
    console.log('Конфиг успешно сохранен в:', tunConfigPath)
    return true
  } catch (err) {
    console.error('Ошибка при сохранении TUN конфига:', err)
    return false
  }
})

ipcMain.handle('run-singbox', async () => {
  try {
    // Запускаем sing-box с конфигом
    runSingbox(tunConfigPath, singboxPath)
    return true
  } catch (error) {
    console.error('Ошибка при запуске sing-box:', error)
    throw error
  }
})
