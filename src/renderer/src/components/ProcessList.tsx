import React, { useEffect, useState } from 'react'

interface Process {
  pid: number
  name: string
  command: string
}

const ProcessList: React.FC = () => {
  const [processes, setProcesses] = useState<Process[]>([])
  const [selectedPids, setSelectedPids] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Функция для нормализации имени процесса
  const normalizeName = (name: string): string => {
    return name.toLowerCase().replace(/\.[^/.]+$/, '') // Удаляем расширение файла
  }

  // Функция для обновления выбранных процессов на основе сохраненных
  const updateSelectedProcesses = (currentProcesses: Process[], savedProcesses: Process[]) => {
    console.log('Сохраненные процессы:', savedProcesses)
    console.log('Текущие процессы:', currentProcesses)

    const newSelectedPids = new Set<number>()
    const savedNames = new Set(savedProcesses.map((p) => normalizeName(p.name)))

    console.log('Нормализованные сохраненные имена:', Array.from(savedNames))

    currentProcesses.forEach((process) => {
      const normalizedName = normalizeName(process.name)
      console.log(`Проверка процесса ${process.name}:`, {
        originalName: process.name,
        normalizedName,
        isSaved: savedNames.has(normalizedName)
      })

      if (savedNames.has(normalizedName)) {
        newSelectedPids.add(process.pid)
      }
    })

    console.log('Выбранные PIDs:', Array.from(newSelectedPids))
    setSelectedPids(newSelectedPids)
  }

  useEffect(() => {
    const handleUpdate = async (updatedProcesses: Process[]) => {
      setProcesses(updatedProcesses)
      setError(null)

      // Получаем сохраненные процессы и обновляем состояние чекбоксов
      try {
        const savedProcesses = await window.electronAPI.getSavedProcesses()
        console.log('Получены сохраненные процессы:', savedProcesses)
        updateSelectedProcesses(updatedProcesses, savedProcesses)
      } catch (err) {
        console.error('Ошибка при получении сохраненных процессов:', err)
      }
    }

    const handleError = (errorMessage: string) => {
      setError(errorMessage)
    }

    window.electronAPI.onProcessListUpdate(handleUpdate)
    window.electronAPI.onProcessListError(handleError)

    // Начальная загрузка процессов
    const initializeProcesses = async () => {
      try {
        const initialProcesses = await window.electronAPI.getProcessList()
        setProcesses(initialProcesses)
        setError(null)

        // Получаем сохраненные процессы и обновляем состояние чекбоксов
        const savedProcesses = await window.electronAPI.getSavedProcesses()
        console.log('Начальная загрузка - сохраненные процессы:', savedProcesses)
        updateSelectedProcesses(initialProcesses, savedProcesses)
      } catch (err) {
        setError(typeof err === 'string' ? err : 'Не удалось получить список процессов')
      }
    }

    initializeProcesses()

    return () => {
      window.electronAPI.removeProcessListListeners()
    }
  }, [])

  const toggleSelection = (pid: number) => {
    setSelectedPids((prev) => {
      const updated = new Set(prev)
      if (updated.has(pid)) {
        updated.delete(pid)
      } else {
        updated.add(pid)
      }
      return updated
    })
  }

  const saveToConfig = (overwrite: boolean) => {
    const selectedProcesses = processes.filter((p) => selectedPids.has(p.pid))
    console.log('Сохранение процессов:', selectedProcesses)
    window.electronAPI
      .saveProcessConfig({ selectedProcesses, overwrite })
      .then(() => {
        setMessage(overwrite ? 'Конфиг перезаписан' : 'Процессы добавлены в конфиг')
        setError(null)
      })
      .catch(() => {
        setError('Ошибка при сохранении')
        setMessage(null)
      })
  }

  const startVPN = async () => {
    try {
      console.log('Начинаем запуск VPN...')

      // 1. Получаем путь к конфигу и читаем его
      console.log('Читаем конфиг...')
      const config = await window.electronAPI.readUserConfig()
      console.log('Полученный конфиг:', config)

      const currentLink = config?.currentLink
      console.log('Текущая ссылка:', currentLink)

      if (!currentLink) {
        console.error('Ссылка не найдена в конфиге')
        setError('В конфиге не найдена ссылка currentLink')
        return
      }

      // 2. Генерируем новый конфиг из ссылки
      console.log('Генерируем конфиг из ссылки...')
      const generatedConfig = await window.electronAPI.generateConfigFromLink(currentLink)
      console.log('Сгенерированный конфиг:', generatedConfig)

      // 3. Сохраняем сгенерированный конфиг в файл tun-config.json
      console.log('Сохраняем конфиг...')
      const success = await window.electronAPI.saveTunConfig(generatedConfig)
      console.log('Результат сохранения:', success)

      if (success) {
        // 4. Запускаем sing-box с новым конфигом
        console.log('Запускаем sing-box...')
        await window.electronAPI.runSingbox()

        setMessage('VPN конфиг успешно сгенерирован и запущен')
        setError(null)
      } else {
        throw new Error('Не удалось сохранить конфиг')
      }
    } catch (err) {
      console.error('Ошибка при запуске VPN:', err)
      setError('Не удалось запустить VPN')
      setMessage(null)
    }
  }

  return (
    <div className="user-info">
      <div className="section">
        <h2>Активные процессы</h2>

        {error && <div className="error-message">Ошибка: {error}</div>}
        {message && <div className="success-message">{message}</div>}

        {processes.length === 0 && !error ? (
          <div className="no-processes">Нет активных процессов</div>
        ) : (
          <div className="process-grid">
            {processes.map((process) => (
              <div key={process.pid} className="process-card">
                <input
                  id={`process-checkbox-${process.pid}`}
                  type="checkbox"
                  checked={selectedPids.has(process.pid)}
                  onChange={() => toggleSelection(process.pid)}
                  title={`Выбрать процесс ${process.name} (PID: ${process.pid})`}
                />
                <label htmlFor={`process-checkbox-${process.pid}`} className="visually-hidden">
                  {`Выбрать процесс ${process.name} (PID: ${process.pid})`}
                </label>
                <div className="process-name">{process.name}</div>
                <div className="process-pid">PID: {process.pid}</div>
                <div className="process-command">{process.command}</div>
              </div>
            ))}
          </div>
        )}

        <div className="save-controls">
          <button onClick={() => saveToConfig(true)} className="overwrite-button">
            Добавить процессы
          </button>
          <button onClick={startVPN} className="start-button">
            Запустить Proxy
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProcessList
