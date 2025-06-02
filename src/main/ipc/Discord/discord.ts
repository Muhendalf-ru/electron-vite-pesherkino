import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

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

export function copyPatchFiles(singboxPath: string): void {
  const discordPath = getLatestDiscordAppPath()
  const filesPath = path.join(singboxPath, 'dll')
  const requiredFiles = ['DWrite.dll', 'force-proxy.dll', 'proxy.txt']

  for (const file of requiredFiles) {
    fs.copyFileSync(path.join(filesPath, file), path.join(discordPath, file))
  }
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