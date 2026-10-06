const DAY_MS = 24 * 60 * 60 * 1000

export const formatDate = (date, options = {}) => {
  if (!date) {
    return ''
  }

  const value = new Date(date)

  if (Number.isNaN(value.getTime())) {
    return ''
  }

  return value.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  })
}

export const formatDateTime = (date) => {
  if (!date) {
    return ''
  }

  return new Date(date).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export const formatRelativeTime = (date, now = Date.now()) => {
  if (!date) {
    return ''
  }

  const timestamp = new Date(date).getTime()

  if (Number.isNaN(timestamp)) {
    return ''
  }

  const seconds = Math.floor((now - timestamp) / 1000)

  if (seconds < 60) {
    return 'Just now'
  }

  const minutes = Math.floor(seconds / 60)

  if (minutes < 60) {
    return `${minutes}m ago`
  }

  const hours = Math.floor(minutes / 60)

  if (hours < 24) {
    return `${hours}h ago`
  }

  const days = Math.floor(hours / 24)

  if (days < 7) {
    return `${days}d ago`
  }

  return formatDate(timestamp, { year: undefined })
}

export const formatDuration = (ms) => {
  const totalSeconds = Math.floor(Math.max(ms, 0) / 1000)
  const totalMinutes = Math.floor(totalSeconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (totalMinutes === 0) {
    return totalSeconds === 0 ? '0m' : `${totalSeconds}s`
  }

  if (hours === 0) {
    return `${minutes}m`
  }

  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`
}

export const formatClock = (ms) => {
  const totalSeconds = Math.floor(Math.max(ms, 0) / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, '0'))
    .join(':')
}

export const startOfDay = (date = new Date()) => {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

export const startOfWeek = (date = new Date()) => {
  const value = startOfDay(date)
  const day = (value.getDay() + 6) % 7
  value.setDate(value.getDate() - day)
  return value
}

export const daysUntil = (dateString, now = new Date()) => {
  if (!dateString) {
    return null
  }

  const [year, month, day] = dateString.split('-').map(Number)
  const due = new Date(year, month - 1, day)

  return Math.round((due - startOfDay(now)) / DAY_MS)
}

export const pluralize = (count, word, plural = `${word}s`) =>
  `${count} ${count === 1 ? word : plural}`
