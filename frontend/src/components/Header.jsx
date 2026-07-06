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
    <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-outline-variant/20 flex justify-between items-center w-full px-3 py-3 md:px-6 md:py-4">
      <div className="font-bold text-base md:text-xl text-magma tracking-tight font-heading">Terminal Console</div>
      
      <div className="flex items-center gap-1.5 md:gap-3 bg-basalt/60 border border-outline-variant/15 px-2 py-1 md:px-4 md:py-2 rounded-xl md:rounded-2xl shadow-md hover:bg-basalt/80 hover:border-magma/30 transition-all duration-300 select-none">
        <div className="text-lg md:text-2xl filter drop-shadow(0 0 4px rgba(226, 167, 111, 0.3))">
          👋
        </div>
        <div className="flex flex-row items-center gap-1 md:flex-col md:items-start text-left">
          <span className="text-[8px] md:text-[10px] text-on-surface-variant font-mono uppercase tracking-wider leading-none opacity-70 whitespace-nowrap">
            Welcome back,
          </span>
          <span className="text-xs md:text-sm font-bold text-xenonite font-sans leading-none">
            {formatTitleCase(profile.name || 'Rithik')}
          </span>
        </div>
      </div>
    </header>
  );
}
