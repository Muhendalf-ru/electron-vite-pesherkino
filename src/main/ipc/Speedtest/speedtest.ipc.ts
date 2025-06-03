import { ipcMain } from 'electron'
import { pingTest, downloadTest, uploadTest } from './speedtest'

ipcMain.handle('run-speedtest', async () => {
  const [ping, download, upload] = await Promise.all([pingTest(), downloadTest(), uploadTest()])
  return { ping, download, upload }
})
