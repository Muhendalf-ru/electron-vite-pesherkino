import { ipcMain } from 'electron'
import fs from 'fs'
import { logFilePath } from '../../constants/constants'

// Тип для ошибок файловой системы
interface FSError extends Error {
  code?: string
}

export function getLogFilePath(): string {
  return logFilePath
}

// Функция для проверки существования файла логов
async function checkLogFileExists(): Promise<boolean> {
  try {
    await fs.promises.access(logFilePath, fs.constants.R_OK)
    return true
  } catch {
    return false
  }
}

// Функция для чтения последних N строк файла
async function readLastLines(filePath: string, maxLines: number = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let totalLength = 0

    const stream = fs.createReadStream(filePath, {
      encoding: 'utf8',
      start: 0,
      end: 1024 * 1024 * 5 // Читаем максимум 5MB
    })

    stream.on('data', (chunk: string | Buffer) => {
      if (Buffer.isBuffer(chunk)) {
        chunks.push(chunk)
        totalLength += chunk.length
      } else {
        chunks.push(Buffer.from(chunk))
        totalLength += chunk.length
      }
    })

    stream.on('end', () => {
      const content = Buffer.concat(chunks).toString('utf8')
      const allLines = content.split('\n')
      const lastLines = allLines.slice(-maxLines)
      resolve(lastLines.join('\n'))
    })

    stream.on('error', (error) => {
      reject(error)
    })
  })
}

ipcMain.handle('get-logs', async () => {
  try {
    // Проверяем существование файла
    const exists = await checkLogFileExists()
    if (!exists) {
      console.error('Файл логов не найден:', logFilePath)
      throw new Error('Файл логов не найден')
    }

    // Читаем последние 1000 строк из файла логов
    const logs = await readLastLines(logFilePath, 1000)
    return logs
  } catch (error) {
    console.error('Ошибка чтения файла логов:', error)

    // Более информативное сообщение об ошибке
    const fsError = error as FSError
    if (fsError.code === 'ENOENT') {
      throw new Error(`Файл логов не найден: ${logFilePath}`)
    } else if (fsError.code === 'EACCES') {
      throw new Error(`Нет доступа к файлу логов: ${logFilePath}`)
    } else if (fsError.code === 'EBUSY') {
      throw new Error(`Файл логов занят другим процессом: ${logFilePath}`)
    }

    throw new Error(
      'Не удалось прочитать логи: ' + (error instanceof Error ? error.message : String(error))
    )
  }
})
