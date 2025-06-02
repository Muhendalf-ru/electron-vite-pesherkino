import React from 'react'
import UserInfo from '../components/UserInfo'

function Main(): React.ReactElement {
  return (
    <>
      <UserInfo />
      <div className="user-info">
        <div className="main-fix">
          <h1>Установка Proxy в ваш браузер</h1>
          <p>Установите расширение FoxyProxy для вашего браузера:</p>
          <nav className="browser-links">
            <a
              href="https://chrome.google.com/webstore/detail/foxyproxy/gcknhkkoolaabfmlnjonogaaifnjlfnp"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Chrome
            </a>
            <a
              href="https://addons.mozilla.org/ru/firefox/addon/foxyproxy-standard/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Firefox
            </a>
            <a
              href="https://microsoftedge.microsoft.com/addons/detail/foxyproxy/flcnoalcefgkhkinjkffipfdhglnpnem"
              target="_blank"
              rel="noopener noreferrer"
            >
              Microsoft Edge
            </a>
            <a
              href="https://addons.opera.com/ru/extensions/details/proxy-switcher-manager/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Opera
            </a>
          </nav>

          <hr className="line-dark" />

          <section className="instructions">
            <h2>Как настроить FoxyProxy:</h2>
            <ol>
              <li>
                Откройте настройки расширения <strong>FoxyProxy</strong>
              </li>
              <li>
                Нажмите кнопку <strong>«Добавить»</strong> для создания нового прокси
              </li>
              <li>
                В поле <em>«Название»</em> введите любое удобное вам имя
              </li>
              <li>
                В настройках типа прокси выберите <code>Socks5</code>
              </li>
              <li>
                Укажите IP-адрес прокси — <code>127.0.0.1</code>
              </li>
              <li>
                Укажите порт прокси — <code>1080</code>
              </li>
              <li>Сохраните настройки и активируйте подключение</li>
            </ol>
          </section>

          <hr className="line-dark" />

          <h1>Waiting for update ❤️</h1>
          <p>Please enter your Telegram ID to get started.</p>
        </div>
      </div>
    </>
  )
}

export default Main
