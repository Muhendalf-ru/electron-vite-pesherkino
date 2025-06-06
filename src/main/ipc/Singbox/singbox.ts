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
    // Останавливаем Discord RPC и VPN статус
    await stopDiscordRPC()
    await stopVpnStatusWatcher()
  } catch (e) {
    console.error('Ошибка при остановке Discord RPC:', e)
  }

  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      // Функция для проверки существования процесса
      const isProcessRunning = (processName: string): Promise<boolean> => {
        return new Promise((resolve) => {
          exec(`tasklist /FI "IMAGENAME eq ${processName}"`, (err, stdout) => {
            if (err) {
              console.error(`Ошибка при проверке процесса ${processName}:`, err)
              resolve(false)
              return
            }
            resolve(stdout.toLowerCase().includes(processName.toLowerCase()))
          })
        })
      }

      // Функция для остановки процесса
      const killProcess = (processName: string): Promise<void> => {
        return new Promise((resolve) => {
          exec(`taskkill /IM ${processName} /F`, (err) => {
            if (err) {
              console.error(`Ошибка при остановке ${processName}:`, err)
            }
            resolve()
          })
        })
      }

      // Последовательно проверяем и останавливаем процессы
      const stopProcesses = async () => {
        try {
          // Проверяем и останавливаем sing-box
          const isSingboxRunning = await isProcessRunning('sing-box.exe')
          if (isSingboxRunning) {
            console.log('Останавливаем sing-box...')
            await killProcess('sing-box.exe')
            console.log('sing-box остановлен')
          } else {
            console.log('sing-box не запущен')
          }

          // Проверяем и останавливаем Discord
          const isDiscordRunning = await isProcessRunning('Discord.exe')
          if (isDiscordRunning) {
            console.log('Останавливаем Discord...')
            await killProcess('Discord.exe')
            console.log('Discord остановлен')
          } else {
            console.log('Discord не запущен')
          }

          resolve({ success: true })
        } catch (error) {
          console.error('Ошибка при остановке процессов:', error)
          resolve({ success: false, error })
        }
      }

      stopProcesses()
    } else {
      // Функция для проверки существования процесса в Unix-системах
      const isProcessRunning = (processName: string): Promise<boolean> => {
        return new Promise((resolve) => {
          exec(`pgrep ${processName}`, (err) => {
            resolve(!err)
          })
        })
      }

      // Функция для остановки процесса в Unix-системах
      const killProcess = (processName: string): Promise<void> => {
        return new Promise((resolve) => {
          exec(`pkill ${processName}`, (err) => {
            if (err) {
              console.error(`Ошибка при остановке ${processName}:`, err)
            }
            resolve()
          })
        })
      }

      // Последовательно проверяем и останавливаем процессы
      const stopProcesses = async () => {
        try {
          // Проверяем и останавливаем sing-box
          const isSingboxRunning = await isProcessRunning('sing-box')
          if (isSingboxRunning) {
            console.log('Останавливаем sing-box...')
            await killProcess('sing-box')
            console.log('sing-box остановлен')
          } else {
            console.log('sing-box не запущен')
          }

          // Проверяем и останавливаем Discord
          const isDiscordRunning = await isProcessRunning('discord')
          if (isDiscordRunning) {
            console.log('Останавливаем Discord...')
            await killProcess('discord')
            console.log('Discord остановлен')
          } else {
            console.log('Discord не запущен')
          }

          resolve({ success: true })
        } catch (error) {
          console.error('Ошибка при остановке процессов:', error)
          resolve({ success: false, error })
        }
      }

      stopProcesses()
    }
  })
}

export function runSingboxDiscord(configPath: string, singboxPath: string): void {
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
