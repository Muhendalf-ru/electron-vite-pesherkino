import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useTelegram } from '@renderer/hooks/useTelegram'

type AdminLink = {
  link: string
  expiryTime: string
  location: string
  _id: string
}

type UserInfoType = {
  telegramId: string
  staticLink: string
  email?: string
  uuid?: string
  vlessLinks: AdminLink[]
  vlessLinksLite: AdminLink[]
  promoLinks: AdminLink[]
  adminLinks: AdminLink[]
}

type DisplayLink = {
  link: string
  expiryTime: string
  location: string
  _id: string
  type: 'vless' | 'vlessLite' | 'promo' | 'admin'
}

const UserInfo: React.FC = () => {
  const { telegramId } = useTelegram()

  const [data, setData] = useState<UserInfoType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!telegramId) {
      setError('Telegram ID не найден')
      setData(null)
      setLoading(false)
      return
    }

    const fetchUserInfo = async (): Promise<void> => {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/vpn/info/${telegramId}`)

        if (!res.ok) {
          throw new Error(`Ошибка HTTP: ${res.status} ${res.statusText}`)
        }

        const json = await res.json()
        if (!json) {
          throw new Error('Пустой ответ от сервера')
        }

        setData(json)
      } catch (err: unknown) {
        console.error('Ошибка при загрузке данных:', err)
        if (err instanceof Error) {
          setError(err.message)
        } else if (typeof err === 'string') {
          setError(err)
        } else {
          setError('Неизвестная ошибка')
        }
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUserInfo()
  }, [telegramId])

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      new Notification('Скопировано', {
        body: 'Ссылка скопирована в буфер обмена'
      })
    } catch {
      new Notification('Ошибка', {
        body: 'Не удалось скопировать ссылку'
      })
    }
  }, [])

  const allLinks: DisplayLink[] = useMemo(() => {
    if (!data) return []

    const vlessLinks: DisplayLink[] = data.vlessLinks.map(
      ({ link, expiryTime, location, _id }) => ({
        link,
        expiryTime,
        location,
        _id,
        type: 'vless'
      })
    )

    const vlessLiteLinks: DisplayLink[] = data.vlessLinksLite.map(
      ({ link, expiryTime, location, _id }) => ({
        link,
        expiryTime,
        location,
        _id,
        type: 'vlessLite'
      })
    )

    const promoLinks: DisplayLink[] = data.promoLinks.map(
      ({ link, expiryTime, location, _id }) => ({
        link,
        expiryTime,
        location,
        _id,
        type: 'promo'
      })
    )

    const adminLinks: DisplayLink[] = data.adminLinks.map(
      ({ link, expiryTime, location, _id }) => ({
        link,
        expiryTime,
        location,
        _id,
        type: 'admin'
      })
    )

    return [...vlessLinks, ...vlessLiteLinks, ...promoLinks, ...adminLinks]
  }, [data])

  if (loading) return <div className="user-info loading">Загрузка...</div>
  if (error) return <div className="user-info error">Ошибка: {error}</div>
  if (!data) return <div className="user-info no-data">Нет данных</div>

  return (
    <div className="user-info">
      <h2>Информация о пользователе</h2>
      <div className="section">
        <p>
          <strong>Telegram ID:</strong> {data.telegramId}
        </p>
        <p>
          <strong>Постоянная ссылка:</strong>{' '}
          <a href={data.staticLink} target="_blank" rel="noopener noreferrer">
            {data.staticLink}
          </a>
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
      </div>

      <h3>Все ссылки</h3>

      <div className="section">
        {allLinks.length > 0 ? (
          allLinks.map(({ link, expiryTime, location, _id, type }) => (
            <div key={_id} className="admin-link">
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
                >
                  Копировать
                </span>
              </p>
            </div>
          ))
        ) : (
          <p>Ссылок нет</p>
        )}
      </div>
    </div>
  )
}

export default UserInfo
