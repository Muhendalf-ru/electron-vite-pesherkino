import { ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'
import { configDir, configFilePath, singboxPath, userConfigPath } from '../../constants/constants'
import { saveTelegramId } from './config'

ipcMain.handle('check-config-exists', async (_event) => {
  const configPath = path.join(singboxPath, 'config.json')

  try {
    return fs.existsSync(configPath)
  } catch (error) {
    return false
  }
})

ipcMain.handle(
  'save-config-file',
  async (_event, filename: string, content: string, link?: string) => {
    try {
      const filePath = path.join(singboxPath, filename)

      // Парсим исходный контент в объект (если нужно будет обработать)
      const parsedContent = JSON.parse(content)

      // Убираем currentLink из контента, чтобы его не записывать в singboxPath
      if ('currentLink' in parsedContent) {
        delete parsedContent.currentLink
      }

      // Записываем в singboxPath конфиг БЕЗ currentLink
      const finalContent = JSON.stringify(parsedContent, null, 2)
      await fs.promises.mkdir(configDir, { recursive: true }) // Создаст папку, если её нет

      await fs.promises.writeFile(configFilePath, finalContent, 'utf8')

      if (link) {
        await fs.promises.mkdir(configDir, { recursive: true })

        // Читаем существующий конфиг из AppData (если есть)
        let appDataConfig: Record<string, any> = {}
        try {
          const existing = await fs.promises.readFile(userConfigPath, 'utf8')
          appDataConfig = JSON.parse(existing)
        } catch {
          // Если файла нет или ошибка чтения — используем пустой объект
          appDataConfig = {}
        }

        // Обновляем/добавляем поле currentLink, сохраняя остальные поля
        appDataConfig.currentLink = link

        // Записываем обновленный конфиг обратно в AppData
        await fs.promises.writeFile(userConfigPath, JSON.stringify(appDataConfig, null, 2), 'utf8')
      }

      return { success: true, path: filePath }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }
)

ipcMain.handle('get-current-link', async () => {
  const configPath = path.join(configDir, 'config.json')
  try {
    const content = fs.readFileSync(configPath, 'utf-8')
    const config = JSON.parse(content)
    return config?.currentLink || null
  } catch {
    return null
  }
})

ipcMain.handle('save-telegram-id', async (_event, telegramId: string) => {
  try {
    saveTelegramId(telegramId) // твоя функция записи в файл
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
})
