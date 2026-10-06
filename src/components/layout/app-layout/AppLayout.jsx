import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import Sidebar from '../sidebar/Sidebar'
import Topbar from '../topbar/Topbar'
import CommandPalette from '../../common/command-palette/CommandPalette'
import useGlobalShortcuts from '../../../hooks/useGlobalShortcuts'

import './AppLayout.css'

function AppLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)
  const [navOpenPath, setNavOpenPath] = useState(null)

  const isNavOpen = navOpenPath === pathname

  const closePalette = useCallback(() => setIsPaletteOpen(false), [])
  const closeNav = useCallback(() => setNavOpenPath(null), [])

  useEffect(() => {
    if (!isNavOpen) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setNavOpenPath(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.classList.add('nav-drawer-open')

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.classList.remove('nav-drawer-open')
    }
  }, [isNavOpen])

  useGlobalShortcuts({
    onTogglePalette: () => setIsPaletteOpen((open) => !open),
    onNewTicket: () => navigate('/tasks?new=1'),
  })

  return (
    <div className="app-layout">

      <Sidebar isOpen={isNavOpen} onClose={closeNav} />

      {isNavOpen && (
        <div
          className="sidebar-backdrop"
          onClick={closeNav}
          aria-hidden="true"
        />
      )}

      <div className="main-wrapper">

        <Topbar
          onOpenPalette={() => setIsPaletteOpen(true)}
          onOpenNav={() => setNavOpenPath(pathname)}
          isNavOpen={isNavOpen}
        />

        <main className="main-content">
          <Outlet />
        </main>

      </div>

      {isPaletteOpen && <CommandPalette onClose={closePalette} />}

    </div>
  )
}

export default AppLayout
