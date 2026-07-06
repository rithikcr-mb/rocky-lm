import React from 'react';

export default function RockyMascot({ status }) {
  return (
    <img
      src="/rocky-mascot.png"
      alt="Rocky"
      className={`rocky-pixel-mascot status-${status} w-full h-full`}
    />
  );
}
