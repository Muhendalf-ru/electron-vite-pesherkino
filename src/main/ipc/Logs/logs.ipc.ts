import { app, ipcMain } from "electron"
import path from "path"
import fs from 'fs'

const isDev = !app.isPackaged
const logFilePath = isDev
  ? path.join('C:\\Github Project\\electron-vite-pesherkino', 'resources', 'console')
  : path.resolve(process.resourcesPath, 'app.asar.unpacked', 'resources', 'console')

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