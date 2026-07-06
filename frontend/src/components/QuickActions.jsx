import React, { useState } from 'react';

export default function QuickActions({ quickActions, handleQuickAction }) {
  const [activeIdx, setActiveIdx] = useState(null);

  return (
    <div className="flex flex-nowrap items-center justify-center gap-2.5 w-full overflow-x-auto scrollbar-none animate-fade-in">
      {quickActions.map((action, idx) => {
        const parts = action.label.split(' ');
        const emoji = parts[0];
        const text = parts.slice(1).join(' ');

        return (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setActiveIdx(idx);
              handleQuickAction(action.prompt);
              setTimeout(() => {
                setActiveIdx(null);
              }, 1000);
            }}
            className={`quick-action-button border px-4 h-10 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.03] active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-[#e67e22]/50 cursor-pointer font-sans flex items-center justify-center space-x-2 shrink-0 ${
              activeIdx === idx
                ? 'bg-magma text-white border-magma scale-105 shadow-magma/35 ring-2 ring-magma/30'
                : 'bg-basalt border-outline-variant/30 text-on-surface hover:bg-[#e67e22] hover:text-white hover:border-[#e67e22] hover:shadow-[#e67e22]/25'
            }`}
          >
            <span className="text-sm select-none filter drop-shadow(0 0 3px rgba(230, 126, 34, 0.2))">{emoji}</span>
            <span>{text}</span>
          </button>
        );
      })}
    </div>
  );
}
