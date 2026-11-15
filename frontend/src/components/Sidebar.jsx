import React, { useState } from 'react';
import { Archive, Activity, Compass, NotebookText, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const navItems = [
  { id: 'expeditions', label: 'Expeditions', Icon: Compass },
  { id: 'research-log', label: 'Research log', Icon: NotebookText },
  { id: 'core-status', label: 'Core status', Icon: Activity },
  { id: 'archived-artifacts', label: 'Archived artifacts', Icon: Archive },
];

export default function Sidebar({ activeTab, setActiveTab }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  const toggleSidebar = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('sidebar-collapsed', String(nextState));
  };

  return (
    <aside
      className={`flex h-full shrink-0 flex-col border-r border-line bg-background px-3 py-4 transition-[width] duration-200 ease-ease ${
        isCollapsed ? 'w-16 md:w-16' : 'w-16 md:w-[248px]'
      }`}
    >
      <div className={`flex items-center gap-2.5 px-1 ${isCollapsed ? 'md:flex-col md:gap-3' : ''}`}>
        <img
          src="/rocky-mascot.png"
          alt=""
          className="h-8 w-8 shrink-0 object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
        <div className={`hidden min-w-0 flex-1 ${isCollapsed ? 'md:hidden' : 'md:block'}`}>
          <p className="truncate text-[15px] font-medium leading-none text-ink">Rocky-LM</p>
          <p className="mt-1.5 truncate text-[11px] leading-none text-ink-muted">Study companion</p>
        </div>
        <button
          type="button"
          onClick={toggleSidebar}
          className="hidden h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors duration-150 ease-ease hover:bg-surface hover:text-ink md:flex"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? <PanelLeftOpen size={16} strokeWidth={1.5} /> : <PanelLeftClose size={16} strokeWidth={1.5} />}
        </button>
      </div>

      <nav className="mt-8 flex flex-col gap-0.5" aria-label="Main">
        {navItems.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              aria-current={active ? 'page' : undefined}
              aria-label={label}
              title={label}
              className={`relative flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-sm transition-colors duration-150 ease-ease md:h-9 ${
                isCollapsed ? 'md:justify-center md:px-0' : ''
              } ${
                active
                  ? 'bg-surface-raised text-ink'
                  : 'text-ink-secondary hover:bg-surface hover:text-ink'
              }`}
            >
              <span
                className={`absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-ember transition-opacity duration-150 ease-ease ${
                  active ? 'opacity-100' : 'opacity-0'
                }`}
                aria-hidden="true"
              />
              <Icon size={18} strokeWidth={1.5} className="shrink-0 text-current" aria-hidden="true" />
              <span className={`hidden truncate ${isCollapsed ? 'md:hidden' : 'md:inline'}`}>{label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
