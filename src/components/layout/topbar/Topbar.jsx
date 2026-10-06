import { NavLink } from "react-router-dom";

import useProfile from "../../../hooks/useProfile";
import useTheme from "../../../hooks/useTheme";
import Avatar from "../../common/avatar/Avatar";
import NotificationsMenu from "../notifications/NotificationsMenu";
import RunningTimer from "../../tickets/running-timer/RunningTimer";

import "./Topbar.css";

function Topbar({ onOpenPalette, onOpenNav, isNavOpen = false }) {
  const { profile } = useProfile();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="topbar">
      <button
        type="button"
        className="topbar-icon-button topbar-menu-button"
        onClick={onOpenNav}
        aria-label="Open navigation"
        aria-controls="app-sidebar"
        aria-expanded={isNavOpen}
      >
        <i className="bi bi-list"></i>
      </button>

      <div className="topbar-heading">
        <h5 className="topbar-title">Task Master</h5>

        <p className="topbar-subtitle">Manage your Jira workflow</p>
      </div>

      <button
        type="button"
        className="topbar-search"
        onClick={onOpenPalette}
        aria-label="Search everything (Ctrl+K)"
      >
        <i className="bi bi-search"></i>
        <span className="topbar-search-text">Search or jump to...</span>
        <kbd className="topbar-search-kbd">Ctrl K</kbd>
      </button>

      <div className="topbar-actions">
        <RunningTimer />

        <button
          type="button"
          className={`theme-toggle ${isDark ? "dark" : ""}`}
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Light mode" : "Dark mode"}
        >
          <span className="theme-icon">
            <i className={`bi ${isDark ? "bi-moon-stars-fill" : "bi-sun-fill"}`}></i>
          </span>

          <span className="theme-label">{isDark ? "Dark" : "Light"}</span>

          <span className="theme-switch">
            <span className="theme-switch-circle" />
          </span>
        </button>

        <NotificationsMenu />

        <NavLink
          to="/profile"
          className="topbar-user"
          title="View your profile"
          aria-label={`${profile.name}, view profile`}
        >
          <Avatar
            className="topbar-user-avatar"
            name={profile.name}
            photo={profile.photo}
          />

          <div className="d-none d-lg-block">
            <div className="topbar-user-name">{profile.name}</div>

            <div className="topbar-user-role">{profile.position}</div>
          </div>
        </NavLink>
      </div>
    </header>
  );
}

export default Topbar;
