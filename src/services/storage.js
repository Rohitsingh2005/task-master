export const STORAGE_CHANGED_EVENT = 'taskMaster:storage-changed'

const notifyChange = (key) => {
  window.dispatchEvent(
    new CustomEvent(STORAGE_CHANGED_EVENT, { detail: { key } })
  )
}

export const readRaw = (key) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export const writeRaw = (key, value) => {
  localStorage.setItem(key, value)
  notifyChange(key)
}

export const removeKey = (key) => {
  localStorage.removeItem(key)
  notifyChange(key)
}

export const parseJSON = (raw, fallback) => {
  if (raw === null || raw === undefined) {
    return fallback
  }

  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export const readJSON = (key, fallback) => parseJSON(readRaw(key), fallback)

export const writeJSON = (key, value) => {
  writeRaw(key, JSON.stringify(value))
}

export const readList = (key) => {
  const value = readJSON(key, [])

  return Array.isArray(value) ? value : []
}

export const subscribeToKey = (key, onChange) => {
  const handleLocalChange = (event) => {
    if (event.detail?.key === key || event.detail?.key === '*') {
      onChange()
    }
  }

  const handleOtherTabChange = (event) => {
    if (event.key === key || event.key === null) {
      onChange()
    }
  }

  window.addEventListener(STORAGE_CHANGED_EVENT, handleLocalChange)
  window.addEventListener('storage', handleOtherTabChange)

  return () => {
    window.removeEventListener(STORAGE_CHANGED_EVENT, handleLocalChange)
    window.removeEventListener('storage', handleOtherTabChange)
  }
}

export const notifyAllChanged = () => notifyChange('*')
