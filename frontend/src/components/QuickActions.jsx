import React, { useState } from 'react';
import { Bug, ListChecks, MessagesSquare, Network } from 'lucide-react';

const icons = {
  quiz: ListChecks,
  mindmap: Network,
  interview: MessagesSquare,
  debug: Bug,
};

export default function QuickActions({ quickActions, handleQuickAction }) {
  const [activeId, setActiveId] = useState(null);

  return (
    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
      {quickActions.map((action) => {
        const Icon = icons[action.id] || ListChecks;
        const active = activeId === action.id;
        return (
          <button
            key={action.id}
            type="button"
            onClick={() => {
              setActiveId(action.id);
              handleQuickAction(action.prompt);
              window.setTimeout(() => setActiveId(null), 900);
            }}
            className={`flex h-10 items-center justify-center gap-2 rounded-lg border px-2.5 text-[13px] transition-colors duration-150 ease-ease sm:h-8 sm:justify-start ${
              active
                ? 'border-ember/50 bg-surface-raised text-ink'
                : 'border-line bg-surface text-ink-secondary hover:bg-surface-raised hover:text-ink'
            }`}
          >
            <Icon
              size={16}
              strokeWidth={1.5}
              className={active ? 'text-ember' : 'text-ink-muted'}
              aria-hidden="true"
            />
            <span>{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
