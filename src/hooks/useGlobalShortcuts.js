import { useEffect, useRef } from 'react'

const isTypingTarget = (element) =>
  Boolean(element) &&
  (element.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName))

const isModalOpen = () => Boolean(document.querySelector('.app-modal'))

function useGlobalShortcuts({ onTogglePalette, onNewTicket }) {
  const handlers = useRef({ onTogglePalette, onNewTicket })

  useEffect(() => {
    handlers.current = { onTogglePalette, onNewTicket }
  })

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase()

      if ((event.ctrlKey || event.metaKey) && key === 'k') {
        const paletteOpen = Boolean(document.querySelector('.command-palette'))

        if (isModalOpen() && !paletteOpen) {
          return
        }

        event.preventDefault()
        handlers.current.onTogglePalette()
        return
      }

      if (
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        isTypingTarget(event.target) ||
        isModalOpen()
      ) {
        return
      }

      if (key === 'n') {
        event.preventDefault()
        handlers.current.onNewTicket()
        return
      }

      if (event.key === '/') {
        event.preventDefault()

        const searchInput = document.querySelector('[data-search-input]')

        if (searchInput) {
          searchInput.focus()
          searchInput.select?.()
        } else {
          handlers.current.onTogglePalette()
        }

        return
      }

      if (event.key === '?') {
        event.preventDefault()
        handlers.current.onTogglePalette()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])
}

export default useGlobalShortcuts
