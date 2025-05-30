import path from 'path'
import fs from 'fs'
import { spawn, exec } from 'child_process'
import axios from 'axios'
import { app } from 'electron'
import 'dotenv/config'

const isDev = !app.isPackaged

const singboxPath = isDev
  ? path.resolve(__dirname, '../../resources')
  : path.resolve(process.resourcesPath, 'app.asar.unpacked', 'resources')

export function getSingboxPath(): string {
  return singboxPath
}

export function getTelegramId(): string | null {
  const filePath = path.join(singboxPath, 'telegram_id.txt')
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8').trim()
  }
  return null
}

export function saveTelegramId(id: string): void {
  const filePath = path.join(singboxPath, 'telegram_id.txt')
  fs.writeFileSync(filePath, id, 'utf-8')
}

const baseUrl =
  process.env.VITE_VPN_CONFIG_URL || 'https://sub.pesherkino.store:8443/pesherkino/vpn/config'

export async function fetchConfig(telegramId: string): Promise<Buffer> {
  const url = `${baseUrl}/${telegramId}`
  const response = await axios.get(url, { responseType: 'arraybuffer' })

  const responseText = response.data.toString()
  try {
    const parsed = JSON.parse(responseText)
    if (parsed && parsed.message === 'Пользователь не найден или нет ссылок') {
      throw new Error('Пользователь не найден')
    }
  } catch {
    // если не JSON — ок, значит бинарный конфиг
  }

  return response.data
}

export function checkRequiredFiles(): void {
  const filesPath = path.join(singboxPath, 'dll')
  if (!fs.existsSync(filesPath)) throw new Error(`Folder not found: ${filesPath}`)

  const requiredFiles = ['DWrite.dll', 'force-proxy.dll', 'proxy.txt']
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(filesPath, file))) {
      throw new Error(`File not found: ${file}`)
    }
  }
}

export function runSingbox(configPath: string): void {
  const singboxExe = path.join(singboxPath, 'sing-box.exe')
  if (!fs.existsSync(singboxExe)) throw new Error('sing-box.exe not found')

  spawn(singboxExe, ['run', '-c', configPath], {
    detached: true,
    stdio: 'ignore',
    cwd: singboxPath
  }).unref()
}

export function isSingboxRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      exec('tasklist', (err, stdout) => {
        if (err) return resolve(false)
        resolve(stdout.toLowerCase().includes('sing-box.exe'))
      })
    } else {
      exec('ps aux', (err, stdout) => {
        if (err) return resolve(false)
        resolve(stdout.toLowerCase().includes('sing-box'))
      })
    }
  })
}

export function stopSingboxAndDiscord(): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      const killProcess = (name: string) =>
        new Promise<{ ok: boolean; error?: string }>((res) => {
          exec(`taskkill /IM ${name} /F`, (err, stderr) => {
            if (err) {
              const isNotFound =
                stderr.toLowerCase().includes('не удалось найти') ||
                stderr.toLowerCase().includes('not found') ||
                stderr.toLowerCase().includes('no instance')
              return res({ ok: isNotFound, error: isNotFound ? undefined : stderr.trim() })
            }
            res({ ok: true })
          })
        })

      Promise.all([killProcess('sing-box.exe'), killProcess('Discord.exe')]).then(
        ([singboxResult, discordResult]) => {
          if (!singboxResult.ok || !discordResult.ok) {
            const combinedError = [singboxResult.error, discordResult.error]
              .filter(Boolean)
              .join('; ')
            return resolve({ success: false, error: combinedError })
          }
          resolve({ success: true })
        }
      )
    } else {
      // Linux/macOS
      const killUnix = (cmd: string) =>
        new Promise<{ ok: boolean; error?: string }>((res) => {
          exec(cmd, (err, stderr) => {
            if (err) {
              const isNotFound = stderr.toLowerCase().includes('no process found')
              return res({ ok: isNotFound, error: isNotFound ? undefined : stderr.trim() })
            }
            res({ ok: true })
          })
        })

      Promise.all([killUnix('pkill -f sing-box'), killUnix('pkill -f discord')]).then(
        ([singboxResult, discordResult]) => {
          if (!singboxResult.ok || !discordResult.ok) {
            const combinedError = [singboxResult.error, discordResult.error]
              .filter(Boolean)
              .join('; ')
            return resolve({ success: false, error: combinedError })
          }
          resolve({ success: true })
        }
      )
    }
  })
}
