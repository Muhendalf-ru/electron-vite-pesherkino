import { ipcMain } from 'electron'
import { getSocks5Ping } from '../Proxy/proxy'
import { getTelegramId } from '../Config/config'

ipcMain.handle('get-ping', async () => {
  try {
    const ping = await getSocks5Ping()
    return ping
  } catch (err) {
    return null
  }
})

ipcMain.handle('get-telegram-id', async () => {
  return getTelegramId()
})
