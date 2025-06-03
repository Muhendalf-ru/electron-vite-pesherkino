import React, { useEffect, useCallback, useMemo, useState } from 'react'
import { useTelegram } from '@renderer/hooks/useTelegram'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@renderer/redux/store'
import { toggleShowLinks } from '@renderer/redux/slice/uiSlice'
import { fetchUserInfo } from '@renderer/redux/slice/userSlice'
import { generateConfigFromLink } from '@renderer/utils/parseVlessLinks'

type DisplayLink = {
  link: string
  expiryTime: string
  location: string
  _id: string
  type: 'vless' | 'vlessLite' | 'promo' | 'admin'
}

const electronAPI = window.electronAPI

const UserInfo: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [selectedLink, setSelectedLink] = useState<string | null>(null)
  const { telegramId } = useTelegram()
  const dispatch = useDispatch<AppDispatch>()

  const { data, loading, error } = useSelector((state: RootState) => state.userInfo)
  const showLinks = useSelector((state: RootState) => state.ui.showLinks)

  // Собираем все ссылки в один массив с мемоизацией
  const allLinks = useMemo<DisplayLink[]>(() => {
    if (!data) return []
    return [
      ...data.vlessLinks.map(({ link, expiryTime, location, _id }) => ({
        link,
        expiryTime,
        location,
        _id,
        type: 'vless' as const
      })),
      ...data.vlessLinksLite.map(({ link, expiryTime, location, _id }) => ({
        link,
        expiryTime,
        location,
        _id,
        type: 'vlessLite' as const
      })),
      ...data.promoLinks.map(({ link, expiryTime, location, _id }) => ({
        link,
        expiryTime,
        location,
        _id,
        type: 'promo' as const
      })),
      ...data.adminLinks.map(({ link, expiryTime, location, _id }) => ({
        link,
        expiryTime,
        location,
        _id,
        type: 'admin' as const
      }))
    ]
  }, [data])

  // Загрузка информации при появлении telegramId
  useEffect(() => {
    if (telegramId && !data) {
      dispatch(fetchUserInfo(telegramId))
    }
  }, [telegramId, dispatch, data])

  // Проверка текущего выбранного региона из сохранённого конфига
  useEffect(() => {
    const checkConfig = async () => {
      if (allLinks.length === 0) return
      try {
        const exists = await electronAPI.checkConfigExists('config.json')
        if (exists) {
          const savedConfig = generateConfigFromLink(allLinks[0].link)
          const region = savedConfig?.outbounds?.[0]?.tag ?? null
          setSelectedRegion(region)
        }
      } catch (e) {
        console.error('Error checking config:', e)
      }
    }
    checkConfig()
  }, [allLinks])

  // Проверка текущей ссылки из Electron
  useEffect(() => {
    const checkCurrentLink = async () => {
      if (allLinks.length === 0) return
      try {
        const savedLink = await electronAPI.invoke('get-current-link')
        if (savedLink) {
          setSelectedLink(savedLink)
        }
      } catch (e) {
        console.error('Error getting current link:', e)
      }
    }
    checkCurrentLink()
  }, [allLinks])

  const saveConfigToFile = useCallback(async (link: string, location: string) => {
    const config = generateConfigFromLink(link)
    if (!config) {
      alert('Некорректная ссылка')
      return
    }
    const content = JSON.stringify({ ...config, currentLink: link }, null, 2)
    try {
      const result = await electronAPI.invoke('save-config-file', 'config.json', content, link)
      if (result.success) {
        new Notification('Успешно', { body: `Конфиг успешно применен: ${location}` })
        setSelectedRegion(location)
        setSelectedLink(link)
      } else {
        new Notification('Ошибка', { body: `Ошибка сохранения: ${result.error}` })
      }
    } catch (e) {
      alert(`Ошибка IPC: ${(e as Error).message}`)
    }
  }, [])

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      new Notification('Скопировано', { body: 'Ссылка скопирована в буфер обмена' })
    } catch {
      new Notification('Ошибка', { body: 'Не удалось скопировать ссылку' })
    }
  }, [])

  if (loading) return <div className="user-info loading">Загрузка...</div>
  if (error) return <div className="user-info error">Ошибка: {error}</div>
  if (!data) return <div className="user-info no-data">Нет данных</div>

  return (
    <div className="user-info" role="region" aria-label="Информация о пользователе">
      <h2>Информация о пользователе</h2>
      <p className="info-footer">
        Сделано для Telegram-бота{' '}
        <a
          href="https://t.me/pesherkino_bot?start=ref_855347094"
          target="_blank"
          rel="noopener noreferrer"
        >
          Pesherkino VPN{' '}
        </a>
        авторизация идет через Telegram ID.
      </p>
      <section className="section">
        <p>
          <strong>Telegram ID:</strong> {data.telegramId}
        </p>
        <p>
          <strong>Постоянная ссылка:</strong>{' '}
          <a href={data.staticLink} target="_blank" rel="noopener noreferrer">
            {data.staticLink}
          </a>
          <p>
            <strong>Выбранный регион:</strong> {selectedRegion ?? 'не выбран'}
          </p>
        </p>
        {data.email && (
          <p>
            <strong>Email:</strong> {data.email}
          </p>
        )}
        {data.uuid && (
          <p>
            <strong>UUID:</strong> {data.uuid}
          </p>
        )}
      </section>

      <h3>
        <button
          type="button"
          onClick={() => dispatch(toggleShowLinks())}
          className="toggle-links"
          aria-expanded={showLinks}
          aria-label={showLinks ? 'Скрыть ссылки' : 'Показать ссылки'}
        >
          {showLinks ? 'Скрыть ссылки' : 'Показать ссылки'}
        </button>
      </h3>

      {showLinks && (
        <section className="section" aria-live="polite">
          {allLinks.length ? (
            allLinks.map(({ link, expiryTime, location, _id, type }) => {
              const isSelected = selectedLink === link
              return (
                <article key={_id} className="admin-link" tabIndex={0}>
                  <p>
                    <strong>Тип:</strong> {type}
                  </p>
                  {location && (
                    <p>
                      <strong>Локация:</strong> {location}
                    </p>
                  )}
                  {expiryTime && expiryTime !== '1970-01-01T00:00:00.000Z' && (
                    <p>
                      <strong>Срок:</strong> {new Date(expiryTime).toLocaleString()}
                    </p>
                  )}
                  <p>
                    <strong>Ссылка: </strong>
                    <span
                      className="copyable"
                      onClick={() => copyToClipboard(link)}
                      title="Кликните, чтобы скопировать"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && copyToClipboard(link)}
                    >
                      Копировать
                    </span>
                  </p>
                  <button
                    onClick={() => saveConfigToFile(link, location)}
                    className="download-config-btn"
                    aria-pressed={isSelected}
                  >
                    {isSelected ? '✅ Выбран' : 'Выбрать регион'}
                  </button>
                </article>
              )
            })
          ) : (
            <p>Ссылок нет</p>
          )}
        </section>
      )}

      <p className="warning-text-user">
        ⚠️ После смены конфига не забывайте перезапускать Discord Fix
      </p>
    </div>
  )
}

export default UserInfo
