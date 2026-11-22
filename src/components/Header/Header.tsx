import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getAvatarSource, useDashboard } from '../../context/DashboardContext';
import { api } from '../../services/api';
import { Project, ProjectMember, TaskItem, TaskPriority } from '../../types/dashboard';
import { createCx } from '../../utils/cx';
import { toLocalDateKey } from '../../utils/dateUtils';
import styles from './Header.module.css';

const cx = createCx(styles);

export const Header: React.FC = () => {
  const {
    activeView,
    switchView,
    searchQuery,
    setSearchQuery,
    accessibleTasks,
    projects,
    activeProject,
    accessibleMembers,
    currentUser,
    unreadNotificationCount,
    isMobileSidebarOpen,
    setMobileSidebarOpen,
    setActiveModal,
    showDashboardToast,
    isDarkThemeActive,
    toggleDarkLightMode,
    signOutUser
  } = useDashboard();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [aiParsing, setAiParsing] = useState(false);

  const searchWrapRef = useRef<HTMLDivElement>(null);
  const profileWrapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const avatarSrc = getAvatarSource(currentUser);
  const breadcrumbLabel = activeView === 'Workspace' ? 'All Collaboration Tasks' : activeView;

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (profileWrapRef.current && !profileWrapRef.current.contains(target)) {
        setDropdownOpen(false);
      }
      if (searchWrapRef.current && !searchWrapRef.current.contains(target)) {
        setSearchFocused(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
        setSearchFocused(false);
      }
    };
    document.addEventListener('click', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query || /^create task\b/i.test(query)) {
      return null;
    }
    const matchedTasks = accessibleTasks
      .filter((task) =>
        [task.title, task.project, task.description, task.tag, task.status, task.sprint]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(query))
      )
      .slice(0, 5);
    const matchedProjects = projects
      .filter((project) =>
        [project.name, project.projectType, project.description]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(query))
      )
      .slice(0, 5);
    const matchedMembers = accessibleMembers
      .filter((member) =>
        [member.name, member.email, member.role]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(query))
      )
      .slice(0, 5);

    return { matchedTasks, matchedProjects, matchedMembers };
  }, [searchQuery, accessibleTasks, projects, accessibleMembers]);

  const showSearchResults = Boolean(
    searchFocused && searchQuery.trim() && !/^create task\b/i.test(searchQuery.trim())
  );

  const handleSelectTaskResult = (task: TaskItem) => {
    setSearchFocused(false);
    const targetView =
      task.project && projects.some((p) => p.name === task.project) ? task.project : 'My Tasks';
    switchView(targetView);
    window.setTimeout(() => {
      const card = document.querySelector<HTMLElement>(
        `.task-card[data-id="${String(task.id).replace(/"/g, '\\"')}"]`
      );
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('search-result-highlight');
        window.setTimeout(() => card.classList.remove('search-result-highlight'), 1800);
      }
    }, 80);
  };

  const handleSelectProjectResult = (project: Project) => {
    setSearchFocused(false);
    switchView(project.name);
  };

  const handleSelectMemberResult = (_member: ProjectMember) => {
    setSearchFocused(false);
    switchView('Admin Console');
  };

  const handleSearchKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    const rawQuery = searchQuery.trim();
    if (!/^create task\b/i.test(rawQuery)) return;

    event.preventDefault();
    const promptText = rawQuery.replace(/^create task[:\s-]*/i, '').trim() || rawQuery;
    const targetProject =
      activeProject || projects.find((p) => (p.sprints || []).length > 0) || projects[0];
    if (!targetProject) {
      showDashboardToast('Create or join a project first before creating a task.', 'warning');
      return;
    }

    setAiParsing(true);
    try {
      const res = await api.post('/ai/parse-task', { promptText });
      const parsed = res?.parsed || {};
      const todayKey = toLocalDateKey();
      const rawDue =
        typeof parsed.dueDate === 'string' ? parsed.dueDate.slice(0, 10) : '';
      const validDue =
        /^\d{4}-\d{2}-\d{2}$/.test(rawDue) && rawDue >= todayKey ? rawDue : todayKey;
      const priorityValue = String(parsed.priority || 'medium').toLowerCase();
      const priority: TaskPriority =
        priorityValue === 'high' || priorityValue === 'low' || priorityValue === 'medium'
          ? priorityValue
          : 'medium';

      setActiveModal({
        type: 'createTask',
        projectId: targetProject.projectId,
        prefill: {
          title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : promptText,
          description:
            typeof parsed.description === 'string' ? parsed.description.trim() : '',
          priority,
          dueDate: validDue
        }
      });
      setSearchQuery('');
      setSearchFocused(false);
    } catch (error: any) {
      showDashboardToast(
        error?.message || 'Could not parse AI task command. Try again.',
        'error'
      );
    } finally {
      setAiParsing(false);
    }
  };

  return (
    <header className={cx('topbar')}>
      <button
        type="button"
        id="sidebar-menu-toggle"
        className={cx('sidebar-menu-toggle')}
        aria-label="Open navigation menu"
        aria-expanded={isMobileSidebarOpen}
        onClick={(e) => {
          e.stopPropagation();
          setMobileSidebarOpen((prev) => !prev);
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>

      <div className={cx('breadcrumbs')}>
        <span>Workspace</span>
        <span>›</span>
        <strong id="breadcrumb-title">{breadcrumbLabel}</strong>
      </div>

      <div className={cx('topbar-center')} ref={searchWrapRef}>
        <label className={cx('search')}>
          <span className={cx('search-icon')}>⌕</span>
          <input
            ref={searchInputRef}
            id="search"
            type="search"
            placeholder='Search or type "create task: [request]"'
            autoComplete="off"
            disabled={aiParsing}
            value={aiParsing ? '🤖 Parsing AI task...' : searchQuery}
            onFocus={() => setSearchFocused(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchFocused(true);
            }}
            onKeyDown={handleSearchKeyDown}
          />
        </label>

        <div
          id="dashboard-search-results"
          className={cx('dashboard-search-results')}
          hidden={!showSearchResults}
        >
          {showSearchResults && searchResults && (
            <>
              {searchResults.matchedTasks.length === 0 &&
              searchResults.matchedProjects.length === 0 &&
              searchResults.matchedMembers.length === 0 ? (
                <p className={cx('dashboard-search-empty')}>
                  No tasks, projects, or collaborators match &ldquo;{searchQuery.trim()}&rdquo;.
                </p>
              ) : (
                <>
                  {searchResults.matchedTasks.length > 0 && (
                    <>
                      <div className={cx('dashboard-search-group-title')}>Tasks</div>
                      {searchResults.matchedTasks.map((task) => (
                        <button
                          key={`task-${task.id}`}
                          type="button"
                          className={cx('dashboard-search-result')}
                          onClick={() => handleSelectTaskResult(task)}
                        >
                          <strong>{task.title || 'Untitled task'}</strong>
                          <span>
                            {task.project || 'Workspace'} · {task.status || 'To do'}
                          </span>
                        </button>
                      ))}
                    </>
                  )}
                  {searchResults.matchedProjects.length > 0 && (
                    <>
                      <div className={cx('dashboard-search-group-title')}>Projects</div>
                      {searchResults.matchedProjects.map((project) => (
                        <button
                          key={`project-${project.projectId}`}
                          type="button"
                          className={cx('dashboard-search-result')}
                          onClick={() => handleSelectProjectResult(project)}
                        >
                          <strong>{project.name}</strong>
                          <span>{project.projectType || 'Project'}</span>
                        </button>
                      ))}
                    </>
                  )}
                  {searchResults.matchedMembers.length > 0 && (
                    <>
                      <div className={cx('dashboard-search-group-title')}>Collaborators</div>
                      {searchResults.matchedMembers.map((member) => (
                        <button
                          key={`member-${member.email || member.uid || member.name}`}
                          type="button"
                          className={cx('dashboard-search-result')}
                          onClick={() => handleSelectMemberResult(member)}
                        >
                          <strong>{member.name || member.email || 'Member'}</strong>
                          <span>{member.role || 'Collaborator'}</span>
                        </button>
                      ))}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className={cx('top-actions')}>
        <button
          id="topbar-notification-btn"
          className={`notification-btn ${cx('topbar-notification-btn')}${
            activeView === 'Notifications' ? ' active' : ''
          }`}
          type="button"
          aria-label="Notifications"
          title="Notifications"
          onClick={() => switchView('Notifications')}
        >
          <svg
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
          <span
            id="topbar-notification-badge"
            className="notification-badge"
            hidden={unreadNotificationCount === 0}
          >
            {unreadNotificationCount}
          </span>
        </button>

        <div className={cx('profile-dropdown-wrap')} id="profile-dropdown-wrap" ref={profileWrapRef}>
          <div className={cx('topbar-profile-group')}>
            <button
              className={cx('topbar-avatar-btn')}
              id="signin-user-btn"
              type="button"
              title="Account Profile & Settings"
              aria-haspopup="menu"
              aria-expanded={dropdownOpen}
              onClick={(e) => {
                e.stopPropagation();
                setDropdownOpen((prev) => !prev);
              }}
            >
              {avatarSrc ? (
                <img
                  id="topbar-avatar-circle"
                  src={avatarSrc}
                  alt={currentUser.name || 'User'}
                  className={`${cx('topbar-avatar-circle')} avatar ${currentUser.tone || 'coral'}-bg`}
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <span
                  className={`${cx('topbar-avatar-circle')} ${currentUser.tone || 'coral'}-bg`}
                  id="topbar-avatar-circle"
                >
                  {currentUser.initials}
                </span>
              )}
            </button>
            <div className={cx('topbar-profile-copy')}>
              <strong id="topbar-user-name">{currentUser.name}</strong>
              <small id="topbar-user-role">{currentUser.role || 'Workspace Member'}</small>
            </div>
          </div>

          <div
            className={cx('profile-dropdown-menu')}
            id="profile-dropdown-menu"
            role="menu"
            hidden={!dropdownOpen}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={cx('profile-dropdown-header')}>
              {avatarSrc ? (
                <img
                  id="dropdown-avatar-circle"
                  src={avatarSrc}
                  alt={currentUser.name || 'User'}
                  className={`${cx('profile-dropdown-avatar')} avatar ${currentUser.tone || 'coral'}-bg`}
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div
                  className={`${cx('profile-dropdown-avatar')} ${currentUser.tone || 'coral'}-bg`}
                  id="dropdown-avatar-circle"
                >
                  {currentUser.initials}
                </div>
              )}
              <div className={cx('profile-dropdown-info')}>
                <strong id="dropdown-user-name">{currentUser.name}</strong>
                <span id="dropdown-user-email" className={cx('dropdown-email')}>
                  {currentUser.email}
                </span>
                <span id="dropdown-user-role" className={cx('dropdown-role-badge')}>
                  Role: {currentUser.role || 'Workspace Admin'}
                </span>
              </div>
            </div>

            <div className={cx('profile-dropdown-divider')} />

            <div className={cx('profile-dropdown-actions')}>
              <button
                type="button"
                className={cx('dropdown-item')}
                id="dropdown-profile-settings"
                role="menuitem"
                onClick={() => {
                  setDropdownOpen(false);
                  switchView('Settings');
                }}
              >
                <span className={cx('dropdown-item-icon')}>⚙️</span>
                <span>Profile &amp; Workspace Settings</span>
              </button>
              <button
                type="button"
                className={cx('dropdown-item')}
                role="menuitem"
                onClick={() => {
                  toggleDarkLightMode();
                  setDropdownOpen(false);
                }}
              >
                <span className={cx('dropdown-item-icon')}>{isDarkThemeActive ? '☀️' : '🌙'}</span>
                <span>{isDarkThemeActive ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
              </button>
            </div>

            <div className={cx('profile-dropdown-divider')} />

            <div className={cx('profile-dropdown-footer')}>
              <button
                type="button"
                className={cx('dropdown-item', 'logout')}
                id="dropdown-signout-btn"
                role="menuitem"
                onClick={async () => {
                  setDropdownOpen(false);
                  await signOutUser();
                }}
              >
                <span className={cx('dropdown-item-icon')}>🚪</span>
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
