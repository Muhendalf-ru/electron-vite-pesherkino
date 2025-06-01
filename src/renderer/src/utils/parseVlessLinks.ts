export function parseVlessLink(link: string) {
  // пример ссылки:
  // vless://uuid@server:port?type=tcp&security=reality&pbk=...&fp=chrome&sni=cloudflare.com&sid=00&flow=xtls-rprx-vision#...

  const url = new URL(link)

  // uuid - username в URL
  const uuid = url.username

  // server и port
  const server = url.hostname
  const port = Number(url.port)

  // query параметры
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

export function generateConfigFromLink(link: string) {
  const { uuid, server, port, flow, security, pbk, fp, sni, sid } = parseVlessLink(link)

  // Формируем конфиг (пример с вашим JSON и реальностью reality)
  const config = {
    log: {
      level: 'info',
      output: 'console'
    },
    dns: {
      servers: [
        {
          tag: 'google',
          address: '8.8.8.8',
          address_strategy: 'prefer_ipv4',
          strategy: 'ipv4_only',
          detour: 'direct'
        }
      ]
    },
    inbounds: [
      {
        type: 'socks',
        tag: 'socks-in',
        listen: '127.0.0.1',
        listen_port: 1080,
        sniff: true,
        sniff_override_destination: true
      }
    ],
    outbounds: [
      {
        type: 'vless',
        tag: 'proxy',
        server,
        server_port: port,
        uuid,
        flow,
        tls: {
          enabled: security === 'reality',
          utls: {
            enabled: fp !== '',
            fingerprint: fp || 'chrome'
          },
          server_name: sni,
          reality: {
            enabled: security === 'reality',
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
    experimental: {}
  }

  return config
}
