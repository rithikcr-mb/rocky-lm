import React from 'react';

function displayName(name) {
  if (!name) return 'Student';
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export default function Header({ profile = { hasProfile: false, name: '' } }) {
  const name = displayName(profile.name);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4 md:h-16 md:px-6">
      <h1 className="text-[17px] font-medium tracking-tight text-ink md:text-lg">Study session</h1>

      <div className="flex min-w-0 items-center gap-2.5">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface-raised text-[11px] font-medium text-ink"
          aria-hidden="true"
        >
          {name.charAt(0)}
        </div>
        <span className="max-w-[10rem] truncate text-[13px] font-medium text-ink-secondary" title={name}>
          {name}
        </span>
      </div>
    </header>
  );
}
