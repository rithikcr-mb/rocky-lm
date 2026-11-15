import React from 'react';

export default function RockyMascot({ status, className = '' }) {
  return (
    <img
      src="/rocky-mascot.png"
      alt=""
      aria-hidden="true"
      data-status={status}
      className={`h-full w-full object-contain ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
