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
    <div className={`flex-shrink-0 bg-background border-r border-outline-variant/20 flex flex-col transition-all duration-300 ease-in-out w-[64px] md:p-4 p-3 ${
      isCollapsed ? 'md:w-[72px]' : 'md:w-[250px]'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between mb-8 px-2 flex-col md:flex-row ${isCollapsed ? 'md:flex-col md:gap-4' : 'md:flex-row'}`}>
        {/* Mobile Mascot Logo (only visible < md) */}
        <div className="block md:hidden text-xl font-bold text-magma filter drop-shadow(0 0 4px rgba(183, 93, 41, 0.4)) select-none self-center mb-2" title="Rocky-LM">
          🌋
        </div>

        {/* Desktop Brand Details (hidden < md) */}
        <div className="hidden md:block flex-1">
          {!isCollapsed ? (
            <div>
              <h1 className="font-bold text-xl text-magma tracking-tight font-heading">Rocky-LM</h1>
              <p className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider">Volcanic Intelligence</p>
            </div>
          ) : (
            <div className="text-xl font-bold text-magma filter drop-shadow(0 0 4px rgba(183, 93, 41, 0.4)) select-none" title="Volcanic Intelligence">🌋</div>
          )}
        </div>

        <button
          onClick={toggleSidebar}
          type="button"
          className="hidden md:block text-on-surface-variant hover:text-magma p-1.5 rounded-lg hover:bg-surface-container-low transition-all duration-200 active:scale-95 cursor-pointer text-sm"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? '➡️' : '☰'}
        </button>
      </div>

      <nav className="flex flex-col space-y-2">
        <button
          onClick={() => setActiveTab('expeditions')}
          className={`flex items-center rounded-lg text-sm transition-all duration-200 active:scale-[0.98] justify-center md:justify-start ${
            isCollapsed ? 'md:justify-center p-3' : 'md:space-x-3 md:px-4 md:py-2.5'
          } ${
            activeTab === 'expeditions'
              ? 'bg-magma text-white font-bold shadow-md shadow-magma/15'
              : 'text-on-surface-variant hover:text-magma hover:bg-surface-container-low'
          } p-3 md:p-2.5`}
          title={isCollapsed ? "Expeditions" : undefined}
        >
          <span className="text-base">🧭</span>
          <span className={`font-sans hidden ${isCollapsed ? 'md:hidden' : 'md:inline'}`}>Expeditions</span>
        </button>
        
        <button
          onClick={() => setActiveTab('research-log')}
          className={`flex items-center rounded-lg text-sm transition-all duration-200 active:scale-[0.98] justify-center md:justify-start ${
            isCollapsed ? 'md:justify-center p-3' : 'md:space-x-3 md:px-4 md:py-2.5'
          } ${
            activeTab === 'research-log'
              ? 'bg-magma text-white font-bold shadow-md shadow-magma/15'
              : 'text-on-surface-variant hover:text-magma hover:bg-surface-container-low'
          } p-3 md:p-2.5`}
          title={isCollapsed ? "Research Log" : undefined}
        >
          <span className="text-base">📝</span>
          <span className={`font-sans hidden ${isCollapsed ? 'md:hidden' : 'md:inline'}`}>Research Log</span>
        </button>

        <button
          onClick={() => setActiveTab('core-status')}
          className={`flex items-center rounded-lg text-sm transition-all duration-200 active:scale-[0.98] justify-center md:justify-start ${
            isCollapsed ? 'md:justify-center p-3' : 'md:space-x-3 md:px-4 md:py-2.5'
          } ${
            activeTab === 'core-status'
              ? 'bg-magma text-white font-bold shadow-md shadow-magma/15'
              : 'text-on-surface-variant hover:text-magma hover:bg-surface-container-low'
          } p-3 md:p-2.5`}
          title={isCollapsed ? "Core Status" : undefined}
        >
          <span className="text-base">💓</span>
          <span className={`font-sans hidden ${isCollapsed ? 'md:hidden' : 'md:inline'}`}>Core Status</span>
        </button>

        <button
          onClick={() => setActiveTab('archived-artifacts')}
          className={`flex items-center rounded-lg text-sm transition-all duration-200 active:scale-[0.98] justify-center md:justify-start ${
            isCollapsed ? 'md:justify-center p-3' : 'md:space-x-3 md:px-4 md:py-2.5'
          } ${
            activeTab === 'archived-artifacts'
              ? 'bg-magma text-white font-bold shadow-md shadow-magma/15'
              : 'text-on-surface-variant hover:text-magma hover:bg-surface-container-low'
          } p-3 md:p-2.5`}
          title={isCollapsed ? "Archived Artifacts" : undefined}
        >
          <span className="text-base">🗄️</span>
          <span className={`font-sans hidden ${isCollapsed ? 'md:hidden' : 'md:inline'}`}>Archived Artifacts</span>
        </button>
      </nav>
    </div>
  );
}
