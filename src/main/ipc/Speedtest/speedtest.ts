import got from 'got'
import { SocksProxyAgent } from 'socks-proxy-agent'
import FormData from 'form-data'

const proxyUrl = 'socks5h://127.0.0.1:1080'
const agent = new SocksProxyAgent(proxyUrl)

const testFileUrl = 'https://speed.hetzner.de/100MB.bin'
const uploadUrl = 'https://httpbin.org/post'

const FILE_SIZE = 100 * 1024 * 1024 // 100MB
const DOWNLOAD_PARTS = 64
const UPLOAD_SIZE = 100 * 1024 * 1024 // 10MB
const UPLOAD_PARALLEL = 3
const PING_TEST_URL = 'https://discord.com'

// Пинг — делаем 5 запросов и берем минимальный ответ (чтобы фильтровать выбросы)
export async function pingTest() {
  const attempts = 5
  let minPing = Infinity

  for (let i = 0; i < attempts; i++) {
    const start = Date.now()
    try {
      await got(PING_TEST_URL, { agent: { https: agent }, timeout: 5000 })
      const duration = Date.now() - start
      if (duration < minPing) minPing = duration
    } catch {
      // игнорируем ошибки, просто пробуем дальше
    }
  }

  return minPing === Infinity ? null : minPing
}

// Загружаем части файла параллельно
async function downloadPart(start: number, end: number) {
  const response = await got(testFileUrl, {
    agent: { https: agent },
    headers: { Range: `bytes=${start}-${end}` },
    responseType: 'buffer',
    https: { rejectUnauthorized: false } // если надо отключить проверку сертификата
  })
  return response.rawBody.length
}

export async function downloadTest() {
  const partSize = Math.floor(FILE_SIZE / DOWNLOAD_PARTS)
  const startTime = Date.now()

  try {
    const promises: Promise<number>[] = []

    for (let i = 0; i < DOWNLOAD_PARTS; i++) {
      const start = i * partSize
      const end = i === DOWNLOAD_PARTS - 1 ? FILE_SIZE - 1 : (i + 1) * partSize - 1
      promises.push(downloadPart(start, end))
    }

    const results = await Promise.all(promises)
    const totalBytes = results.reduce((a, b) => a + b, 0)
    const durationSec = (Date.now() - startTime) / 1000

    return (totalBytes * 8) / durationSec / 1e6 // Mbps
  } catch (error) {
    console.error('Download test failed:', error)
    return null
  }
}

// Отправляем несколько параллельных POST с формой по 10MB
async function uploadOnce() {
  const form = new FormData()
  const buffer = Buffer.alloc(UPLOAD_SIZE, 'x')
  form.append('file', buffer, { filename: 'upload.bin' })

  await got.post(uploadUrl, {
    agent: { https: agent },
    body: form,
    headers: form.getHeaders(),
    https: { rejectUnauthorized: false } // если надо
  })

  return buffer.length
}

export async function uploadTest() {
  const startTime = Date.now()

  try {
    const promises: Promise<number>[] = []

    for (let i = 0; i < UPLOAD_PARALLEL; i++) {
      promises.push(uploadOnce())
    }

    const results = await Promise.all(promises)
    const totalBytes = results.reduce((a, b) => a + b, 0)
    const durationSec = (Date.now() - startTime) / 1000

    return (totalBytes * 8) / durationSec / 1e6 // Mbps
  } catch (error) {
    console.error('Upload test failed:', error)
    return null
  }
}
