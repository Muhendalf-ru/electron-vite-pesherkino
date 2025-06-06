import { ipcMain } from 'electron'
import { getFilteredProcesses, type Process } from './processManager'
import fs from 'fs'
import { appConfigPath, configDir } from '../../constants/constants'

ipcMain.handle('get-process-list', async () => {
  try {
    const processes = await getFilteredProcesses()
    return processes
  } catch (error) {
    throw new Error(`Ошибка при получении процессов: ${String(error)}`)
  }
})

ipcMain.handle('get-saved-processes', async () => {
  try {
    if (!fs.existsSync(appConfigPath)) {
      return []
    }

    const fileContent = fs.readFileSync(appConfigPath, 'utf-8').trim()
    if (fileContent.length === 0) {
      return []
    }

    const parsed = JSON.parse(fileContent)
    return Array.isArray(parsed.processes) ? parsed.processes : []
  } catch (err) {
    console.error('Ошибка при чтении конфига:', err)
    return []
  }
})

ipcMain.handle(
  'save-process-config',
  async (
    _,
    { selectedProcesses, overwrite }: { selectedProcesses: Process[]; overwrite: boolean }
  ) => {
    try {
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true })
      }

      let existingProcesses: Process[] = []

      if (!overwrite && fs.existsSync(appConfigPath)) {
        const fileContent = fs.readFileSync(appConfigPath, 'utf-8').trim()

        if (fileContent.length > 0) {
          try {
            const parsed = JSON.parse(fileContent)
            existingProcesses = Array.isArray(parsed.processes) ? parsed.processes : []
          } catch (e) {
            console.warn('Ошибка при парсинге текущего app-list.json:', e)
            existingProcesses = []
          }
        }
      }

      const processesToSave = overwrite
        ? selectedProcesses
        : [
            ...existingProcesses,
            ...selectedProcesses.filter(
              (newProcess) =>
                !existingProcesses.some(
                  (existingProcess) => existingProcess.command === newProcess.command
                )
            )
          ]

      fs.writeFileSync(appConfigPath, JSON.stringify({ processes: processesToSave }, null, 2))

      return true
    } catch (err) {
      console.error('Ошибка при записи конфига:', err)
      throw new Error('Не удалось сохранить конфиг')
    }
  }
)
