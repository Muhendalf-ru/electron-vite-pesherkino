import { ipcMain } from 'electron'
import fs from 'fs'
import { logFilePath } from '../../constants/constants'

export function getLogFilePath(): string {
  return logFilePath
}

ipcMain.handle('get-logs', async () => {
  try {
    return await fs.promises.readFile(logFilePath, 'utf-8')
  } catch (error) {
    console.error('Ошибка чтения файла логов:', error)
    throw new Error('Не удалось прочитать логи')
  }
})
