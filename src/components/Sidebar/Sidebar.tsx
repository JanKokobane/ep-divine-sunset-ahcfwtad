import React, { useEffect } from 'react';
import { getAvatarSource, useDashboard } from '../../context/DashboardContext';
import { createCx } from '../../utils/cx';
import styles from './Sidebar.module.css';

const cx = createCx(styles);

export const Sidebar: React.FC = () => {
  const {
    activeView,
    switchView,
    projects,
    projectsLoaded,
    currentUser,
    unreadNotificationCount,
    messagesUnreadCount,
    setActiveModal,
    isMobileSidebarOpen,
    setMobileSidebarOpen
  } = useDashboard();

  useEffect(() => {
    document.body.classList.toggle('sidebar-open', isMobileSidebarOpen);
    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, [isMobileSidebarOpen]);

  const avatarSrc = getAvatarSource(currentUser);
  const handleNavClick = (event: React.MouseEvent, viewName: string) => {
    event.preventDefault();
    switchView(viewName);
    setMobileSidebarOpen(false);
  };

  return (
    <aside
      className={cx('sidebar', { 'is-open': isMobileSidebarOpen })}
      aria-label="Primary"
    >
      <a className={cx('brand-link')} href="/" aria-label="Collab Home">
        <img src="/images/logo.png" alt="Collab." className={cx('brand-logo-img')} />
      </a>

      <nav className={cx('primary-nav')}>
        <a
          className={cx('nav-item', { active: activeView === 'Workspace' })}
          data-view="Workspace"
          href="#workspace"
          onClick={(e) => handleNavClick(e, 'Workspace')}
        >
          <svg
            className={cx('nav-icon')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Home
        </a>

        <a
          className={cx('nav-item', { active: activeView === 'Meetings' })}
          data-view="Meetings"
          href="#meetings"
          onClick={(e) => handleNavClick(e, 'Meetings')}
        >
          <svg
            className={cx('nav-icon')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Meetings
        </a>

        <a
          className={cx('nav-item', { active: activeView === 'Messages' })}
          data-view="Messages"
          href="#messages"
          onClick={(e) => handleNavClick(e, 'Messages')}
        >
          <svg
            className={cx('nav-icon')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Messages{' '}
          <b
            id="messages-nav-badge"
            className={cx('messages-nav-badge')}
            hidden={messagesUnreadCount === 0}
          >
            {messagesUnreadCount}
          </b>
        </a>

        <a
          className={cx('nav-item', { active: activeView === 'Brainstorm' })}
          data-view="Brainstorm"
          href="#brainstorm"
          onClick={(e) => handleNavClick(e, 'Brainstorm')}
        >
          <svg
            className={cx('nav-icon')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          Team Brainstorm
        </a>

        <a
          className={cx('nav-item', { active: activeView === 'Admin Console' })}
          data-view="Admin Console"
          href="#workspace-console"
          onClick={(e) => handleNavClick(e, 'Admin Console')}
        >
          <svg
            className={cx('nav-icon')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          Workspace
        </a>
      </nav>

      <div className={cx('nav-label')}>
        <span>PROJECTS</span>
        <button
          id="add-project"
          className={cx('tiny-plus')}
          type="button"
          aria-label="Add project"
          onClick={() => {
            setMobileSidebarOpen(false);
            setActiveModal({ type: 'createProject' });
          }}
        >
          +
        </button>
      </div>

      <nav className={cx('project-nav')} id="project-nav">
        {projectsLoaded && projects.length === 0 ? (
          <div className={cx('project-nav-empty')}>
            <p>No projects yet. Create one to start collaborating.</p>
            <button
              type="button"
              className="outline-button"
              onClick={() => {
                setMobileSidebarOpen(false);
                setActiveModal({ type: 'createProject' });
              }}
            >
              + Create Project
            </button>
          </div>
        ) : (
          projects.map((project) => (
            <a
              key={project.projectId}
              className={cx('nav-item', { active: activeView === project.name })}
              data-view={project.name}
              href={`#${encodeURIComponent(project.name.toLowerCase().replace(/\s+/g, '-'))}`}
              onClick={(e) => handleNavClick(e, project.name)}
            >
              <i className={`dot ${project.color || 'yellow'}`} /> {project.name}
            </a>
          ))
        )}
      </nav>

      <div className={cx('sidebar-bottom')}>
        <a
          className={cx('nav-item', { active: activeView === 'Settings' })}
          data-view="Settings"
          href="#settings"
          onClick={(e) => handleNavClick(e, 'Settings')}
        >
          <svg
            className={cx('nav-icon')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Settings
        </a>

        <button
          id="notification-btn"
          className={`notification-btn${activeView === 'Notifications' ? ' active' : ''}`}
          type="button"
          aria-label="Notifications"
          onClick={() => switchView('Notifications')}
        >
          <svg
            className={cx('nav-icon')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span>Notifications</span>
          <span
            id="notification-badge"
            className="notification-badge"
            hidden={unreadNotificationCount === 0}
          >
            {unreadNotificationCount}
          </span>
        </button>

        <div
          className={cx('profile')}
          id="user-profile"
          role="button"
          tabIndex={0}
          title="Open Account & Profile Settings"
          onClick={() => switchView('Settings')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              switchView('Settings');
            }
          }}
        >
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={currentUser.name || 'User'}
              className={`avatar ${currentUser.tone || 'coral'}-bg`}
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <span className={`avatar ${currentUser.tone || 'coral'}-bg`}>
              {currentUser.initials}
            </span>
          )}
          <div>
            <strong id="sidebar-user-name">{currentUser.name}</strong>
            <small id="sidebar-user-role">{currentUser.role || 'Workspace Admin'}</small>
          </div>
        </div>
      </div>
    </aside>
  );
};
