import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import { loadConfig, saveConfig } from '../Config/config'
import { singboxPath, userConfigPath } from '../../constants/constants'
import { initDiscordRPC, stopDiscordRPC } from '../../DiscordRpc/discordPresence'

export function spawnDiscord(discordExe: string, discordPath: string): void {
  spawn(discordExe, [], {
    detached: true,
    stdio: 'ignore',
    cwd: discordPath
  }).unref()
}

export function getDiscordBasePath(): string {
  return path.join(process.env.LOCALAPPDATA || '', 'Discord')
}

export function getLatestDiscordAppPath(): string {
  const discordBase = getDiscordBasePath()

  if (!fs.existsSync(discordBase)) {
    throw new Error(`Discord base folder not found: ${discordBase}`)
  }

  const appDirs = fs
    .readdirSync(discordBase, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith('app-'))
    .map((d) => d.name)
    .sort((a, b) => b.localeCompare(a))

  if (appDirs.length === 0) {
    throw new Error('No Discord app-* folder found.')
  }

  return path.join(discordBase, appDirs[0])
}

export async function copyPatchFiles(singboxPath: string): Promise<void> {
  const discordPath = getLatestDiscordAppPath()
  const filesPath = path.join(singboxPath, 'dll')
  const requiredFiles = ['DWrite.dll', 'force-proxy.dll', 'proxy.txt']

  // Функция для ожидания освобождения файла
  const waitForFileUnlock = async (filePath: string, maxAttempts = 5): Promise<boolean> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Пробуем открыть файл на запись
        const fd = fs.openSync(filePath, 'r+')
        fs.closeSync(fd)
        return true
      } catch (err) {
        if (attempt === maxAttempts) {
          console.error(`Файл ${filePath} заблокирован после ${maxAttempts} попыток`)
          return false
        }
        // Ждем перед следующей попыткой
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }
    return false
  }

  // Функция для копирования одного файла с повторными попытками
  const copyFileWithRetry = async (
    sourceFile: string,
    targetFile: string,
    maxAttempts = 3
  ): Promise<void> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Проверяем существование исходного файла
        if (!fs.existsSync(sourceFile)) {
          throw new Error(`Исходный файл не найден: ${sourceFile}`)
        }

        // Проверяем существование целевой директории
        const targetDir = path.dirname(targetFile)
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true })
        }

        // Ждем освобождения целевого файла, если он существует
        if (fs.existsSync(targetFile)) {
          const isUnlocked = await waitForFileUnlock(targetFile)
          if (!isUnlocked) {
            throw new Error(`Не удалось получить доступ к файлу: ${targetFile}`)
          }
        }

        // Копируем файл
        fs.copyFileSync(sourceFile, targetFile)
        console.log(`Файл успешно скопирован: ${targetFile}`)
        return
      } catch (err) {
        console.error(`Попытка ${attempt} из ${maxAttempts} не удалась:`, err)
        if (attempt === maxAttempts) {
          throw new Error(
            `Не удалось скопировать файл ${sourceFile} после ${maxAttempts} попыток: ${err}`
          )
        }
        // Ждем перед следующей попыткой
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }
  }

  // Копируем все файлы последовательно
  for (const file of requiredFiles) {
    const sourceFile = path.join(filesPath, file)
    const targetFile = path.join(discordPath, file)

    try {
      console.log(`Копирование файла ${file}...`)
      await copyFileWithRetry(sourceFile, targetFile)
    } catch (err) {
      console.error(`Ошибка при копировании ${file}:`, err)
      throw new Error(`Ошибка при копировании ${file}: ${err}`)
    }
  }

  console.log('Все файлы успешно скопированы')
}

export function deletePatchFiles(): { success: boolean; error?: string } {
  try {
    const discordPath = getLatestDiscordAppPath()
    const filesToDelete = ['DWrite.dll', 'force-proxy.dll', 'proxy.txt']

    for (const file of filesToDelete) {
      const filePath = path.join(discordPath, file)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    return { success: true }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    return { success: false, error: errorMessage }
  }
}

export function setDiscordRpcEnabled(enabled: boolean): void {
  const cfg = loadConfig()
  cfg.discordRpcEnabled = enabled
  saveConfig(cfg)
}

export function getDiscordRpcEnabled(): boolean {
  const cfg = loadConfig()
  return !!cfg.discordRpcEnabled
}

export function checkRequiredFiles(): void {
  const filesPath = path.join(singboxPath, 'dll')
  if (!fs.existsSync(filesPath)) throw new Error(`Папка не найдена: ${filesPath}`)

  const requiredFiles = ['DWrite.dll', 'force-proxy.dll', 'proxy.txt']
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(filesPath, file))) {
      throw new Error(`Файл не найден: ${file}`)
    }
  }
}

function isDiscordRpcEnabled(): boolean {
  try {
    const configRaw = fs.readFileSync(userConfigPath, 'utf-8')
    const config = JSON.parse(configRaw)
    return !!config.discordRpcEnabled
  } catch (e) {
    console.error('[RPC] Не удалось прочитать config.json:', e)
    return false
  }
}

let checkInterval: NodeJS.Timeout | null = null

export async function startDiscordRpcWatcher(): Promise<void> {
  if (checkInterval) return
  checkInterval = setInterval(async () => {
    if (isDiscordRpcEnabled()) {
      await initDiscordRPC()
    } else {
      await stopDiscordRPC()
    }
  }, 5000)
}

export function stopDiscordRpcWatcher(): void {
  if (checkInterval) {
    clearInterval(checkInterval)
    checkInterval = null
  }
}
