import React from 'react'

export const DiscordVpnWarningTab: React.FC = () => {
  return (
    <section className="discord-vpn-warning">
      <h2 className="discord-vpn-warning__title">Как работает установка Discord VPN?</h2>

      <p className="discord-vpn-warning__text">
        <strong>Основное ядро — socks5 proxy:</strong>{' '}
        <a
          href="https://github.com/SagerNet/sing-box"
          target="_blank"
          rel="noreferrer noopener"
          className="discord-vpn-warning__link"
        >
          sing-box
        </a>{' '}
        — это программа, которая отвечает за создание и управление SOCKS5 прокси-сервером на нужном
        порту.
      </p>

      <p className="discord-vpn-warning__text">
        <strong>Proxy DLL:</strong>{' '}
        <a
          href="https://github.com/runetfreedom/discord-voice-proxy"
          target="_blank"
          rel="noreferrer noopener"
          className="discord-vpn-warning__link"
        >
          discord-voice-proxy
        </a>{' '}
        — сюда входят файлы DWrite.dll и force-proxy.dll. Они внедряются (DLL-инъекция) в клиент
        Discord, а конфигурация с IP и портом прокси передаётся через файл proxy.txt.
      </p>

      <p className="discord-vpn-warning__text">
        <strong>Как это работает:</strong> модифицированные DLL-файлы внедряются в Discord, чтобы
        весь трафик приложения направлялся через созданный SOCKS5 прокси.
      </p>

      <p className="discord-vpn-warning__text discord-vpn-warning__text--important">
        ⚠️ <strong>Важно:</strong> запускайте Discord <em>только через эту программу</em>, чтобы
        прокси работал корректно и безопасно.
      </p>

      <p className="discord-vpn-warning__text discord-vpn-warning__text--warning">
        Если хотите отключить VPN, нажмите кнопку <strong>Delete Discord DLL</strong> — это удалит
        все прокси-файлы из клиента Discord.
      </p>
    </section>
  )
}
