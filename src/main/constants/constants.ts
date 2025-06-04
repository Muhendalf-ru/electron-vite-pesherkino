import path from 'path'
import { app } from 'electron'
import EventEmitter from 'events'

export const isDev = !app.isPackaged

export const logFilePath = isDev
  ? path.join('C:\\Github Project\\electron-vite-pesherkino', 'resources', 'console')
  : path.resolve(process.resourcesPath, 'app.asar.unpacked', 'resources', 'console')

export const singboxPath = isDev
  ? path.resolve(__dirname, '../../resources')
  : path.resolve(process.resourcesPath, 'app.asar.unpacked', 'resources')

export const configDir = path.join(app.getPath('appData'), 'PesherkinoVPN')
export const userConfigPath = path.join(configDir, 'config.json')
export const configFilePath = path.join(configDir, 'config-proxy.json')

export const proxyUrl = 'socks5h://127.0.0.1:1080'
export const testFileUrl = 'https://speed.hetzner.de/100MB.bin'
export const uploadUrl = 'https://httpbin.org/post'
export const FILE_SIZE = 100 * 1024 * 1024 // 100MB
export const DOWNLOAD_PARTS = 64
export const UPLOAD_SIZE = 100 * 1024 * 1024 // 10MB
export const UPLOAD_PARALLEL = 3
export const PING_TEST_URL = 'https://discord.com'

export const vpnEmitter = new EventEmitter()
