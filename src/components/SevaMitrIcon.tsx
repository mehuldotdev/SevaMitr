'use client';

import React from 'react';

interface SevaMitrIconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * SevaMitr Brand Icon Mark:
 * - Two cupping caring hands: Kaziranga Forest Green (#214935, "Seva") + Majuli Terracotta (#fe8357, "Mitr")
 * - Radiant 6-point cognitive star in Muga Silk Amber (#f59e0b) representing neuro-vitality & memory
 * - Tea garden leaf canopy backdrop (#e8f5ed / #2d6a4f) rooting the identity in North-East India
 * - High-contrast #1c1b1b Neo-Brutalist contours
 */
export function SevaMitrIcon({ size = 24, className, style }: SevaMitrIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      aria-label="SevaMitr Logo"
      role="img"
    >
      {/* Tea Garden Leaf Canopy Backdrop */}
      <path
        d="M32 6C32 6 20 18 20 29C20 36 25 41 32 43C39 41 44 36 44 29C44 18 32 6 32 6Z"
        fill="#e8f5ed"
        stroke="#1c1b1b"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M32 8V42" stroke="#214935" strokeWidth="2" strokeLinecap="round" opacity="0.3" />

      {/* Flanking Heritage Leaves */}
      <path
        d="M21 16C15 22 14 30 18 37C21 40 25 42 29 43C26 38 25 32 26 26C27 21 29 17 32 13C27 13 23 14 21 16Z"
        fill="#2d6a4f"
        stroke="#1c1b1b"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M43 16C49 22 50 30 46 37C43 40 39 42 35 43C38 38 39 32 38 26C37 21 35 17 32 13C37 13 41 14 43 16Z"
        fill="#e28743"
        stroke="#1c1b1b"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* Radiant Cognitive Star Halo & Spark */}
      <circle cx="32" cy="27" r="10" fill="#fef3c7" opacity="0.8" />
      <path
        d="M32 17.5L34.8 23.5L41.2 24.2L36.4 28.6L37.8 35L32 31.6L26.2 35L27.6 28.6L22.8 24.2L29.2 23.5L32 17.5Z"
        fill="#f59e0b"
        stroke="#1c1b1b"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="27" r="2.8" fill="#ffffff" stroke="#1c1b1b" strokeWidth="1.8" />

      {/* Left Cupping Hand: Kaziranga Forest Green ("Seva" - Service & Healing) */}
      <path
        d="M16 34C14 41 17 48 22 53C26 57 30 59 32 60L32 53C28 50 25 46 24 41C23.5 38 24 35 25 33C21 32 18 33 16 34Z"
        fill="#214935"
        stroke="#1c1b1b"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M22 36C22 36 20 42 24 46C27 49 30 50 32 50"
        stroke="#1c1b1b"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Right Cupping Hand: Majuli Terracotta ("Mitr" - Companion & Warmth) */}
      <path
        d="M48 34C50 41 47 48 42 53C38 57 34 59 32 60L32 53C36 50 39 46 40 41C40.5 38 40 35 39 33C43 32 46 33 48 34Z"
        fill="#fe8357"
        stroke="#1c1b1b"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M42 36C42 36 44 42 40 46C37 49 34 50 32 50"
        stroke="#1c1b1b"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Base Solid Anchor */}
      <path d="M28 58H36L35 61H29L28 58Z" fill="#1c1b1b" stroke="#1c1b1b" strokeWidth="1" />
    </svg>
  );
}

