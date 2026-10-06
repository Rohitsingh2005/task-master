import { useCallback, useEffect } from 'react'

import useStorageKey from './useStorageKey'
import { writeRaw } from '../services/storage'

export const THEME_KEY = 'theme'

const getSystemTheme = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

function useTheme() {
  const savedTheme = useStorageKey(THEME_KEY)
  const theme = savedTheme === 'dark' || savedTheme === 'light'
    ? savedTheme
    : getSystemTheme()

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme)
  }, [theme])

  const setTheme = useCallback((nextTheme) => {
    writeRaw(THEME_KEY, nextTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    writeRaw(THEME_KEY, theme === 'dark' ? 'light' : 'dark')
  }, [theme])

  return { theme, isDark: theme === 'dark', setTheme, toggleTheme }
}

export default useTheme
