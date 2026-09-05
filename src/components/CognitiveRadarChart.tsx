'use client';

import React from 'react';

interface RadarProps {
  scores: {
    memory: number;    // 0 - 100
    executive: number; // 0 - 100
    attention: number; // 0 - 100
    auditory: number;  // 0 - 100
    math: number;      // 0 - 100
  };
}

export function CognitiveRadarChart({ scores }: RadarProps) {
  const domains = [
    { key: 'memory', label: 'Memory', val: scores.memory },
    { key: 'executive', label: 'Executive', val: scores.executive },
    { key: 'attention', label: 'Attention', val: scores.attention },
    { key: 'auditory', label: 'Auditory', val: scores.auditory },
    { key: 'math', label: 'Calculation', val: scores.math },
  ];

  const size = 320;
  const center = size / 2;
  const radius = 105;
  const total = domains.length;

  const getCoordinates = (index: number, value: number) => {
    const angle = (Math.PI * 2 / total) * index - Math.PI / 2;
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Polygon points for patient data
  const dataPoints = domains.map((d, i) => {
    const { x, y } = getCoordinates(i, d.val);
    return `${x},${y}`;
  }).join(' ');

  // Polygon points for standard healthy baseline (85%)
  const baselinePoints = domains.map((_, i) => {
    const { x, y } = getCoordinates(i, 80);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background concentric rings */}
        {[0.25, 0.5, 0.75, 1].map((scale, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={radius * scale}
            fill="none"
            stroke="#e2dcd0"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
        ))}

        {/* Axis spokes */}
        {domains.map((_, i) => {
          const { x, y } = getCoordinates(i, 100);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#e2dcd0"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Healthy Baseline polygon */}
        <polygon
          points={baselinePoints}
          fill="none"
          stroke="#a5d6a7"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Patient Score Polygon */}
        <polygon
          points={dataPoints}
          fill="rgba(27, 67, 50, 0.25)"
          stroke="#1b4332"
          strokeWidth="2.5"
        />

        {/* Score vertices */}
        {domains.map((d, i) => {
          const { x, y } = getCoordinates(i, d.val);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="5"
              fill="#c85a32"
              stroke="#ffffff"
              strokeWidth="2"
            />
          );
        })}

        {/* Axis Labels */}
        {domains.map((d, i) => {
          const { x, y } = getCoordinates(i, 125);
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fontWeight="700"
              fill="#192024"
            >
              {d.label}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.85rem', fontWeight: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '12px', height: '12px', background: '#1b4332', borderRadius: '3px' }} />
          <span>Patient Actual</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '12px', height: '2px', background: '#2e7d32', borderTop: '2px dashed #2e7d32' }} />
          <span>Clinical Baseline (80%)</span>
        </div>
      </div>
    </div>
  );
}
