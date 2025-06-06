import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'

interface Process {
  pid: number
  name: string
  command: string
}

export function parseVlessLink(link: string) {
  const url = new URL(link)
  const uuid = url.username
  const server = url.hostname
  const port = Number(url.port)
  const params = url.searchParams

  return {
    uuid,
    server,
    port,
    flow: params.get('flow') || '',
    security: params.get('security') || '',
    pbk: params.get('pbk') || '',
    fp: params.get('fp') || '',
    sni: params.get('sni') || '',
    sid: params.get('sid') || ''
  }
}

export function generateTunConfigFromLink(link: string) {
  const { uuid, server, port, flow, pbk, fp, sni, sid } = parseVlessLink(link)

  // Читаем процессы из app-list.json
  const appListPath = path.join(app.getPath('appData'), 'PesherkinoVPN', 'app-list.json')
  let processNames: string[] = []

  try {
    if (fs.existsSync(appListPath)) {
      const fileContent = fs.readFileSync(appListPath, 'utf-8').trim()
      if (fileContent.length > 0) {
        const appList = JSON.parse(fileContent)
        // Проверяем, что appList это массив процессов
        if (Array.isArray(appList)) {
          processNames = appList.map((p: Process) => p.name.toLowerCase())
        } else if (appList && typeof appList === 'object' && 'processes' in appList) {
          // Если процессы хранятся в поле processes
          processNames = appList.processes.map((p: Process) => p.name.toLowerCase())
        }
        console.log('Прочитанные процессы:', processNames)
      }
    } else {
      console.log('Файл app-list.json не найден:', appListPath)
    }
  } catch (err) {
    console.error('Ошибка при чтении app-list.json:', err)
  }

  const config = {
    log: {
      level: 'debug',
      output: 'console'
    },
    dns: {
      final: 'dns-remote',
      independent_cache: true,
      rules: [
        {
          domain: ['dns.google'],
          server: 'dns-direct'
        },
        {
          outbound: ['any'],
          server: 'dns-direct'
        },
        {
          action: 'reject',
          clash_mode: 'block'
        },
        {
          clash_mode: 'direct',
          server: 'dns-direct'
        },
        {
          clash_mode: 'global',
          server: 'dns-remote'
        }
      ],
      servers: [
        {
          address: 'https://dns.google/dns-query',
          address_resolver: 'dns-direct',
          detour: 'proxy',
          strategy: 'prefer_ipv4',
          tag: 'dns-remote'
        },
        {
          address: 'https://223.5.5.5/dns-query',
          address_resolver: 'dns-local',
          detour: 'direct',
          strategy: 'prefer_ipv4',
          tag: 'dns-direct'
        },
        {
          address: 'local',
          tag: 'dns-local'
        }
      ]
    },
    inbounds: [
      {
        type: 'tun',
        tag: 'tun-in',
        interface_name: 'sing-box-tun',
        mtu: 9000,
        auto_route: true,
        stack: 'system',
        endpoint_independent_nat: true,
        inet4_address: ['172.19.0.1/30'],
        inet6_address: ['fdfe:dcba:9876::1/126']
      },
      {
        type: 'socks',
        tag: 'socks-in',
        listen: '127.0.0.1',
        listen_port: 1090,
        sniff: true,
        sniff_override_destination: true
      }
    ],
    outbounds: [
      {
        type: 'vless',
        tag: 'proxy',
        server: server,
        server_port: port,
        uuid: uuid,
        flow: flow,
        tls: {
          enabled: true,
          utls: {
            enabled: true,
            fingerprint: fp || 'chrome'
          },
          server_name: sni,
          reality: {
            enabled: true,
            public_key: pbk,
            short_id: sid
          }
        }
      },
      {
        type: 'direct',
        tag: 'direct'
      },
      {
        type: 'block',
        tag: 'block'
      }
    ],
    route: {
      rules: [
        {
          protocol: 'dns',
          outbound: 'direct'
        },
        {
          process_name: processNames,
          outbound: 'proxy'
        },
        {
          domain_suffix: ['ads.google.com', 'doubleclick.net'],
          outbound: 'block'
        },
        {
          ip_cidr: [
            '0.0.0.0/8',
            '10.0.0.0/8',
            '127.0.0.0/8',
            '169.254.0.0/16',
            '172.16.0.0/12',
            '192.168.0.0/16',
            '::1/128'
          ],
          outbound: 'direct'
        },
        {
          outbound: 'proxy'
        }
      ]
    },
    experimental: {
      cache_file: {
        enabled: true
      },
      clash_api: {
        external_controller: '127.0.0.1:9090',
        external_ui: 'ui',
        secret: '',
        default_mode: 'rule'
      }
    }
  }

  return config
}

export function runSingbox(configPath: string, singboxPath: string): void {
  const singboxExe = path.join(singboxPath, 'sing-box.exe')

  console.log('Запуск sing-box:')
  console.log('singboxExe:', singboxExe)
  console.log('configPath:', configPath)
  console.log('singboxPath:', singboxPath)
  console.log('Текущая директория:', process.cwd())

  if (!fs.existsSync(singboxExe)) {
    console.error('sing-box.exe не найден по пути:', singboxExe)
    throw new Error('sing-box.exe не найден')
  }
  if (!fs.existsSync(configPath)) {
    console.error('config.json не найден по пути:', configPath)
    throw new Error('config.json не найден')
  }

  console.log('Запускаем процесс sing-box...')
  const child = spawn(singboxExe, ['run', '-c', configPath], {
    cwd: singboxPath,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: false,
    env: {
      ...process.env,
      ENABLE_DEPRECATED_TUN_ADDRESS_X: 'true'
    }
  })

  console.log('Процесс запущен с PID:', child.pid)

  let stdoutData = ''
  let stderrData = ''

  child.stdout?.on('data', (data) => {
    const output = data.toString()
    stdoutData += output
    console.log('sing-box stdout:', output)
  })

  child.stderr?.on('data', (data) => {
    const output = data.toString()
    stderrData += output
    console.error('sing-box stderr:', output)
  })

  child.on('error', (err) => {
    console.error('Ошибка при запуске sing-box:', err)
  })

  child.on('exit', (code) => {
    console.log('sing-box завершился с кодом:', code)
    if (code !== 0) {
      console.error('Ошибка запуска sing-box:')
      console.error('stdout:', stdoutData)
      console.error('stderr:', stderrData)
    }
  })

  child.on('spawn', () => {
    console.log('sing-box успешно запущен')
  })
}
