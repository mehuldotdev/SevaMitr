'use client';

import React from 'react';
import { SevaMitrIcon } from './SevaMitrIcon';

export interface SevaMitrLogoProps {
  layout?: 'horizontal' | 'vertical' | 'icon-only';
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  subtitle?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function SevaMitrLogo({
  layout = 'horizontal',
  size = 'md',
  showSubtitle = false,
  subtitle = 'Cognitive Neuro-Care & Eldercare',
  className = '',
  style,
}: SevaMitrLogoProps) {
  const iconSizeMap = {
    sm: 22,
    md: 32,
    lg: 48,
  };

  const badgeSizeMap = {
    sm: { width: '36px', height: '36px', radius: '10px', shadow: '2px 2px 0px #1c1b1b' },
    md: { width: '48px', height: '48px', radius: '14px', shadow: '3px 3px 0px #1c1b1b' },
    lg: { width: '68px', height: '68px', radius: '18px', shadow: '4px 4px 0px #1c1b1b' },
  };

  const titleSizeMap = {
    sm: '1.25rem',
    md: '1.65rem',
    lg: '2.25rem',
  };

  const subtitleSizeMap = {
    sm: '0.65rem',
    md: '0.75rem',
    lg: '0.9rem',
  };

  const isVertical = layout === 'vertical';
  const badgeConfig = badgeSizeMap[size];

  if (layout === 'icon-only') {
    return (
      <div
        className={className}
        style={{
          width: badgeConfig.width,
          height: badgeConfig.height,
          borderRadius: badgeConfig.radius,
          background: '#ffffff',
          border: '2px solid #1c1b1b',
          boxShadow: badgeConfig.shadow,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          ...style,
        }}
      >
        <SevaMitrIcon size={iconSizeMap[size]} />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        flexDirection: isVertical ? 'column' : 'row',
        alignItems: 'center',
        gap: isVertical ? '12px' : '14px',
        textAlign: isVertical ? 'center' : 'left',
        ...style,
      }}
    >
      {/* Icon Badge */}
      <div
        style={{
          width: badgeConfig.width,
          height: badgeConfig.height,
          borderRadius: badgeConfig.radius,
          background: '#ffffff',
          border: '2px solid #1c1b1b',
          boxShadow: badgeConfig.shadow,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <SevaMitrIcon size={iconSizeMap[size]} />
      </div>

      {/* Typography */}
      <div>
        <div
          className="font-clash-bold"
          style={{
            fontSize: titleSizeMap[size],
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.01em',
            lineHeight: 1.1,
          }}
        >
          <span style={{ color: 'var(--color-primary, #214935)' }}>Seva</span>
          <span style={{ color: '#1c1b1b' }}>Mitr</span>
        </div>

        {showSubtitle && (
          <div
            className="font-clash-regular"
            style={{
              fontSize: subtitleSizeMap[size],
              fontWeight: 600,
              color: 'var(--color-terracotta, #fe8357)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginTop: '3px',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
