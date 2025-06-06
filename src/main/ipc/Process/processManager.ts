import { exec } from 'child_process'
import { promisify } from 'util'
import { targetProcesses } from '../utils/process.utils'

const execAsync = promisify(exec)

export interface Process {
  pid: number
  name: string
  command: string // в данном случае command будет пустой, т.к. tasklist не показывает командную строку
}

export async function getRunningProcesses(): Promise<Process[]> {
  // Выполняем команду tasklist, вывод в CSV без заголовков
  const { stdout } = await execAsync('tasklist /fo csv /nh')

  // Парсим CSV вывод
  const lines = stdout.trim().split('\n')

  const processes: Process[] = lines.map((line) => {
    // Каждая строка — CSV, например: "chrome.exe","1234","Console","1","30,000 K"
    // Разбираем через простой split, учитывая кавычки
    const columns = line.match(/"([^"]*)"/g)?.map((s) => s.replace(/"/g, '')) || []

    return {
      name: columns[0] || '',
      pid: Number(columns[1]) || 0,
      command: '' // команда не доступна из tasklist
    }
  })

  return processes
}

export async function getFilteredProcesses(): Promise<Process[]> {
  const processes = await getRunningProcesses()

  // Фильтруем по targetProcesses (с приведением к lowerCase)
  const filtered = processes.filter((proc) => targetProcesses.includes(proc.name.toLowerCase()))

  // Убираем дубли по имени (оставляем первый встреченный)
  const uniqueMap = new Map<string, Process>()

  for (const proc of filtered) {
    const nameLower = proc.name.toLowerCase()
    if (!uniqueMap.has(nameLower)) {
      uniqueMap.set(nameLower, proc)
    }
  }

  return Array.from(uniqueMap.values())
}
