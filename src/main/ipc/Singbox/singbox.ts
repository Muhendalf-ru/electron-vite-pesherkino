import { exec, spawn } from 'child_process'
import { stopDiscordRPC } from '../../DiscordRpc/discordPresence'
import path from 'path'
import fs from 'fs'
import { stopVpnStatusWatcher } from '../Proxy/proxy'

export async function isSingboxRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32' ? 'tasklist' : 'ps aux'
    exec(cmd, (err, stdout) => {
      if (err) return resolve(false)
      const isRunning =
        process.platform === 'win32'
          ? stdout.toLowerCase().includes('sing-box.exe')
          : stdout.toLowerCase().includes('sing-box')
      resolve(isRunning)
    })
  })
}

export async function stopSingboxAndDiscord(): Promise<{ success: boolean; error?: any }> {
  try {
    // Если нужно, раскомментируйте для остановки Discord RPC:
    await stopDiscordRPC()
    await stopVpnStatusWatcher()
  } catch (e) {
    console.error('Ошибка при остановке Discord RPC:', e)
  }

  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      exec('taskkill /IM sing-box.exe /F', (err1) => {
        exec('taskkill /IM Discord.exe /F', (err2) => {
          if (err1 && err2) {
            console.error('Не удалось остановить sing-box.exe и Discord.exe:', err1, err2)
            resolve({ success: false, error: { singbox: err1, discord: err2 } })
          } else if (err1) {
            console.error('Не удалось остановить sing-box.exe:', err1)
            resolve({ success: false, error: { singbox: err1 } })
          } else if (err2) {
            console.error('Не удалось остановить Discord.exe:', err2)
            resolve({ success: false, error: { discord: err2 } })
          } else {
            resolve({ success: true })
          }
        })
      })
    } else {
      exec('pkill sing-box', (err1) => {
        exec('pkill discord', (err2) => {
          if (err1 && err2) {
            console.error('Не удалось остановить sing-box и discord:', err1, err2)
            resolve({ success: false, error: { singbox: err1, discord: err2 } })
          } else if (err1) {
            console.error('Не удалось остановить sing-box:', err1)
            resolve({ success: false, error: { singbox: err1 } })
          } else if (err2) {
            console.error('Не удалось остановить discord:', err2)
            resolve({ success: false, error: { discord: err2 } })
          } else {
            resolve({ success: true })
          }
        })
      })
    }
  })
}

export function runSingbox(configPath: string, singboxPath: string): void {
  const singboxExe = path.join(singboxPath, 'sing-box.exe')

  console.log('Запуск sing-box:')
  console.log('singboxExe:', singboxExe)
  console.log('configPath:', configPath)

  if (!fs.existsSync(singboxExe)) throw new Error('sing-box.exe не найден')
  if (!fs.existsSync(configPath)) throw new Error('config.json не найден')

  const child = spawn(singboxExe, ['run', '-c', configPath], {
    cwd: singboxPath,
    detached: true,
    stdio: 'inherit'
  })

  child.unref()

  child.on('error', (err) => {
    console.error('Ошибка при запуске sing-box:', err)
  })

  child.on('exit', (code) => {
    console.log('sing-box завершился с кодом:', code)
  })
}
