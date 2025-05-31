import type { JSX } from 'react'

export const Footer = (): JSX.Element => (
  <footer className="footer">
    <div className="footer-links">
      <a
        href="https://github.com/Muhendalf-ru/pesherkino-vpn"
        target="_blank"
        rel="noopener noreferrer"
        title="GitHub"
      >
        GitHub
      </a>
      <a
        href="https://pesherkino-vpn.gitbook.io/pesherkino-vpn"
        target="_blank"
        rel="noopener noreferrer"
        title="GitBook"
      >
        GitBook
      </a>
      <a
        href="https://t.me/pesherkino_bot?start=ref_855347094"
        target="_blank"
        rel="noopener noreferrer"
        title="Купить VPN в Telegram"
      >
        Купить VPN
      </a>
      <a
        href="https://t.me/pesherkino_support"
        target="_blank"
        rel="noopener noreferrer"
        title="Техподдержка"
      >
        Техподдержка
      </a>
    </div>

    <div className="footer-version">v {import.meta.env.VITE_APP_VERSION}</div>
  </footer>
)
