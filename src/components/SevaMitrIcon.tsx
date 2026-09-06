'use client';

import React from 'react';

interface SevaMitrIconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * SevaMitr Official Brand Logo:
 * Blooming mind & floral cognitive awakening illustration.
 */
export function SevaMitrIcon({ size = 26, className, style }: SevaMitrIconProps) {
  return (
    <img
      src="/logo.png"
      alt="SevaMitr Logo"
      width={size}
      height={size}
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        borderRadius: '50%',
        objectFit: 'contain',
        ...style,
      }}
    />
  );
}


