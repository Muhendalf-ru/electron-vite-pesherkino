import { exec } from 'child_process'
import { ipcMain } from 'electron'

ipcMain.handle('get-proxy-connections', async () => {
  return new Promise((resolve) => {
    exec('netstat -ano | findstr :1080', (err, stdout) => {
      if (err || !stdout) return resolve([])

      const connections = stdout
        .trim()
        .split('\n')
        .map((line) => line.trim().split(/\s+/))
        .filter((parts) => parts.length >= 5)
        .map(([proto, local, foreign, state, pid]) => ({ proto, local, foreign, state, pid }))

      // получить tasklist по PID
      const uniquePids = [...new Set(connections.map((c) => c.pid))]

      const tasks: Record<string, string> = {}
      let pending = uniquePids.length

      uniquePids.forEach((pid) => {
        exec(`tasklist /FI "PID eq ${pid}"`, (error, stdout) => {
          if (!error && stdout) {
            const match = stdout.match(new RegExp(`([^\\s]+\\.exe)\\s+${pid}`))
            if (match) tasks[pid] = match[1]
          }
          if (--pending === 0) {
            resolve(
              connections.map((c) => ({
                ...c,
                process: tasks[c.pid] || 'Неизвестно'
              }))
            )
          }
        })
      })
    })
  })
})
