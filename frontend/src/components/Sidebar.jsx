import React, { useState } from 'react';

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
    <div className={`flex-shrink-0 bg-background border-r border-outline-variant/20 flex flex-col p-4 transition-all duration-300 ease-in-out ${
      isCollapsed ? 'w-[72px]' : 'w-[250px]'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between mb-8 px-2 ${isCollapsed ? 'flex-col gap-4' : 'flex-row'}`}>
        {!isCollapsed ? (
          <div>
            <h1 className="font-bold text-xl text-magma tracking-tight font-heading">Rocky-LM</h1>
            <p className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider">Volcanic Intelligence</p>
          </div>
        ) : (
          <div className="text-xl font-bold text-magma filter drop-shadow(0 0 4px rgba(183, 93, 41, 0.4)) select-none" title="Volcanic Intelligence">🌋</div>
        )}
        <button
          onClick={toggleSidebar}
          type="button"
          className="text-on-surface-variant hover:text-magma p-1.5 rounded-lg hover:bg-surface-container-low transition-all duration-200 active:scale-95 cursor-pointer text-sm"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? '➡️' : '☰'}
        </button>
      </div>

      <nav className="flex flex-col space-y-2">
        <button
          onClick={() => setActiveTab('expeditions')}
          className={`flex items-center rounded-lg text-sm transition-all duration-200 active:scale-[0.98] ${
            isCollapsed ? 'justify-center p-3' : 'space-x-3 px-4 py-2.5'
          } ${
            activeTab === 'expeditions'
              ? 'bg-magma text-white font-bold shadow-md shadow-magma/15'
              : 'text-on-surface-variant hover:text-magma hover:bg-surface-container-low'
          }`}
          title={isCollapsed ? "Expeditions" : undefined}
        >
          <span className="text-base">🧭</span>
          {!isCollapsed && <span className="font-sans">Expeditions</span>}
        </button>
        
        <button
          onClick={() => setActiveTab('research-log')}
          className={`flex items-center rounded-lg text-sm transition-all duration-200 active:scale-[0.98] ${
            isCollapsed ? 'justify-center p-3' : 'space-x-3 px-4 py-2.5'
          } ${
            activeTab === 'research-log'
              ? 'bg-magma text-white font-bold shadow-md shadow-magma/15'
              : 'text-on-surface-variant hover:text-magma hover:bg-surface-container-low'
          }`}
          title={isCollapsed ? "Research Log" : undefined}
        >
          <span className="text-base">📝</span>
          {!isCollapsed && <span className="font-sans">Research Log</span>}
        </button>

        <button
          onClick={() => setActiveTab('core-status')}
          className={`flex items-center rounded-lg text-sm transition-all duration-200 active:scale-[0.98] ${
            isCollapsed ? 'justify-center p-3' : 'space-x-3 px-4 py-2.5'
          } ${
            activeTab === 'core-status'
              ? 'bg-magma text-white font-bold shadow-md shadow-magma/15'
              : 'text-on-surface-variant hover:text-magma hover:bg-surface-container-low'
          }`}
          title={isCollapsed ? "Core Status" : undefined}
        >
          <span className="text-base">💓</span>
          {!isCollapsed && <span className="font-sans">Core Status</span>}
        </button>

        <button
          onClick={() => setActiveTab('archived-artifacts')}
          className={`flex items-center rounded-lg text-sm transition-all duration-200 active:scale-[0.98] ${
            isCollapsed ? 'justify-center p-3' : 'space-x-3 px-4 py-2.5'
          } ${
            activeTab === 'archived-artifacts'
              ? 'bg-magma text-white font-bold shadow-md shadow-magma/15'
              : 'text-on-surface-variant hover:text-magma hover:bg-surface-container-low'
          }`}
          title={isCollapsed ? "Archived Artifacts" : undefined}
        >
          <span className="text-base">🗄️</span>
          {!isCollapsed && <span className="font-sans">Archived Artifacts</span>}
        </button>
      </nav>
    </div>
  );
}
