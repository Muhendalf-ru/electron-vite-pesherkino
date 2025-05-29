<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>VPN Pesherkino</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      line-height: 1.6;
      max-width: 900px;
      margin: 2rem auto;
      padding: 0 1rem;
      color: #eee;
    }
    h1, h2, h3 {
      color: #fff;
    }
    pre {
      padding: 1em;
      overflow-x: auto;
      border-radius: 6px;
      background: #222;
      color: #eee;
    }
    code {
      background: #333;
      padding: 2px 4px;
      border-radius: 4px;
      font-family: monospace;
      color: #f0f0f0;
    }
    ul {
      padding-left: 1.5em;
    }
    .section-divider {
      margin: 2rem 0;
      border-bottom: 2px solid #444;
    }
    a {
      color: #4ea1ff;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }

    /* Стили для блока Discord VPN */
    .discord-vpn-warning {
      background: #222;
      border: 1px solid #444;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      margin-bottom: 2rem;
    }
    .discord-vpn-warning__title {
      color: #72c3fc;
      margin-bottom: 1rem;
    }
    .discord-vpn-warning__text {
      margin-bottom: 1rem;
      font-size: 1rem;
      line-height: 1.5;
      color: #ddd;
    }
    .discord-vpn-warning__link {
      color: #4ea1ff;
    }
    .discord-vpn-warning__text--important {
      background: #3e1b1b;
      <!-- color:rgba(247, 113, 113, 0.58); -->
      padding: 0.3rem 0.3rem;
      border-radius: 6px;
      font-weight: 600;
    }
    .discord-vpn-warning__text--warning {
      background: #4a3f1b;
      color: #f7ca71;
      padding: 0.3rem 0.3rem;
      border-radius: 6px;
      font-weight: 600;
    }
  </style>
</head>
<body>

  <h1>🚀 VPN Pesherkino</h1>
  <p>Кроссплатформенное настольное приложение для управления VPN-сервисом с помощью красивого и удобного интерфейса.</p>

  <div class="section-divider"></div>

  <h2>🧰 Стек технологий</h2>
  <ul>
    <li>⚡ <strong>Vite</strong> — молниеносная сборка</li>
    <li>⚛️ <strong>React</strong> — UI-фреймворк</li>
    <li>🔌 <strong>Electron</strong> — создание десктопных приложений</li>
    <li>🧠 <strong>Redux Toolkit</strong> — управление состоянием</li>
    <li>🟦 <strong>TypeScript</strong> — надежный и масштабируемый JavaScript</li>
  </ul>

  <div class="section-divider"></div>

  <h2>📦 Установка последнего релиза</h2>

  <div style="background: #23272f; border: 1px solid #444; border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem;">
    <h3 style="color: #72c3fc; margin-top: 0;">⬇️ Загрузка последнего установщика</h3>
    <ol style="color: #ddd; font-size: 1rem;">
      <li>
        Перейдите на страницу <a href="https://github.com/Muhendalf-ru/electron-vite-pesherkino/releases" target="_blank" style="color: #4ea1ff;">Pesherkino VPN releases</a>.
      </li>
      <li>
        Скачайте три файла релиза:
        <ul>
          <li><code>latest.yml</code></li>
          <li><code>pesherkino-vpn-2.0.x-setup.exe</code></li>
          <li><code>pesherkino-vpn-2.0.x-setup.exe.blockmap</code></li>
        </ul>
      </li>
      <li>
        Переместите все три файла в одну папку.
      </li>
      <li>
        Запустите <code>pesherkino-vpn-2.0.x-setup.exe</code> для установки приложения.
      </li>
      <li>
        <span class="discord-vpn-warning__text--warning">⚠️ <strong>Важно:</strong> мы используем систему автообновления, установите строго по инструкции</span>
      </li>
    </ol>
  </div>

  <div class="section-divider"></div>

  <h2>📦 Установка</h2>
  <p>Установите зависимости:</p>
  <pre><code>yarn</code></pre>

  <h3>🛠 Режим разработки</h3>
  <p>Запуск приложения в режиме разработки:</p>
  <pre><code>yarn dev</code></pre>
  <p>Приложение автоматически перезапустится при изменениях.</p>

  <h3>🏗 Сборка</h3>

  <h4>🪟 Windows</h4>
  <pre><code>yarn build:win</code></pre>

  <h4>🍎 macOS</h4>
  <pre><code>yarn build:mac</code></pre>

  <h4>🐧 Linux</h4>
  <pre><code>yarn build:linux</code></pre>

  <h4>🚀 Сборка и публикация (Windows)</h4>
  <pre><code>yarn build:win:publish</code></pre>
  <p>Убедитесь, что все переменные окружения для публикации заданы.</p>

  <div class="section-divider"></div>

  <h2>💡 Возможности</h2>
  <ul>
    <li>Авторизация по Telegram ID</li>
    <li>Получение VPN-ссылок</li>
    <li>Разделение по регионам</li>
    <li>Интуитивный интерфейс</li>
    <li>Кроссплатформенность</li>
    <li>Фикс Discord методом DLL инъекции</li>
  </ul>

  <div class="section-divider"></div>

  ### Как работает установка Discord VPN?
  
  **Основное ядро — socks5 proxy:**  
  [sing-box](https://github.com/SagerNet/sing-box) — это программа, которая отвечает за создание и управление SOCKS5 прокси-сервером на нужном порту.
  
  **Proxy DLL:**  
  [discord-voice-proxy](https://github.com/runetfreedom/discord-voice-proxy) — сюда входят файлы `DWrite.dll` и `force-proxy.dll`. Они внедряются (DLL-инъекция) в клиент Discord, а конфигурация с IP и портом прокси передаётся через файл `proxy.txt`.
  
  **Как это работает:**  
  Модифицированные DLL-файлы внедряются в Discord, чтобы весь трафик приложения направлялся через созданный SOCKS5 прокси.
  
  > ⚠️ **Важно:** запускайте Discord _только через эту программу_, чтобы прокси работал корректно и безопасно.
  
  > **Если хотите отключить VPN, нажмите кнопку `Delete Discord DLL` — это удалит все прокси-файлы из клиента Discord.**

  <div class="section-divider"></div>

  <h2>📬 Обратная связь</h2>
  <p>Если у вас есть предложения или баги — создайте Issue или отправьте Pull Request 🙌</p>

  <p><strong>Made with ❤️ by Pesherkino Dev Team</strong></p>

</body>
</html>
