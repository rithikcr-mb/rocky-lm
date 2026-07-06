import React from 'react';

function formatTitleCase(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function Header({ profile = { hasProfile: false, name: '' } }) {
  return (
    <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-outline-variant/20 flex justify-between items-center w-full px-6 py-4">
      <div className="font-bold text-xl text-magma tracking-tight font-heading">Terminal Console</div>
      
      <div className="flex items-center gap-3 bg-basalt/60 border border-outline-variant/15 px-4 py-2 rounded-2xl shadow-md hover:bg-basalt/80 hover:border-magma/30 transition-all duration-300 select-none">
        <div className="text-2xl filter drop-shadow(0 0 4px rgba(226, 167, 111, 0.3))">
          👋
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider leading-none mb-1 opacity-70">
            Welcome back,
          </span>
          <span className="text-sm font-bold text-xenonite font-sans leading-tight">
            {formatTitleCase(profile.name || 'Rithik')}
          </span>
        </div>
      </div>
    </header>
  );
}
