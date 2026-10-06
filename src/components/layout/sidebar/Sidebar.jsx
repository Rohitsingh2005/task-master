import { NavLink } from 'react-router-dom'

import useProfile from '../../../hooks/useProfile'
import Avatar from '../../common/avatar/Avatar'
import Logo from '../../common/logo/Logo'

import './Sidebar.css'

function Sidebar({ isOpen = false, onClose }) {
  const { profile } = useProfile()

  const navItems = [
    {
      path: '/',
      label: 'Dashboard',
      icon: 'bi-speedometer2',
    },
    {
      path: '/tasks',
      label: 'Tickets',
      icon: 'bi-ticket-perforated',
    },
    {
      path: '/notes',
      label: 'Notes',
      icon: 'bi-journal-text',
    },
    {
      path: '/pull-request',
      label: 'Pull Requests',
      icon: 'bi-git',
    },
    {
      path: '/profile',
      label: 'Profile',
      icon: 'bi-person',
    },
  ]

  return (
    <aside
      id="app-sidebar"
      className={`sidebar ${isOpen ? 'is-open' : ''}`}
    >

      <div className="sidebar-header">
        <NavLink
          to="/"
          className="sidebar-brand"
          aria-label="Task Master home"
        >
          <Logo />
        </NavLink>

        <button
          type="button"
          className="sidebar-close"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      <nav className="sidebar-nav">

        <div className="nav-section-title">
          WORKSPACE
        </div>

        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <i className={`bi ${item.icon}`}></i>

            <span>{item.label}</span>
          </NavLink>
        ))}

      </nav>

      <div className="sidebar-footer">
        <NavLink
          to="/profile"
          className="sidebar-user"
          title="View your profile"
          aria-label={`${profile.name}, view profile`}
        >

          <Avatar
            className="sidebar-user-avatar"
            name={profile.name}
            photo={profile.photo}
          />

          <div>
            <div className="sidebar-user-name">
              {profile.name}
            </div>

            <div className="sidebar-user-role">
              {profile.position}
            </div>
          </div>

          <i className="bi bi-chevron-right sidebar-user-chevron"></i>
        </NavLink>
      </div>

    </aside>
  )
}

export default Sidebar
