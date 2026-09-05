'use client';

import React from 'react';
import { Sun, Moon, AlertTriangle, CheckCircle } from 'lucide-react';

interface CircadianProps {
  morningLatencyMs: number;
  eveningLatencyMs: number;
  morningScore: number;
  eveningScore: number;
  divergencePct: number;
  sundowningDetected: boolean;
}

export function CircadianTimelineChart({
  morningLatencyMs,
  eveningLatencyMs,
  morningScore,
  eveningScore,
  divergencePct,
  sundowningDetected,
}: CircadianProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Visual comparison bars */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
        }}
      >
        {/* Morning Window */}
        <div
          style={{
            background: '#fffde7',
            border: '2px solid #fff59d',
            borderRadius: '16px',
            padding: '1.25rem',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#f57f17', fontWeight: 700, marginBottom: '0.5rem' }}>
            <Sun size={20} />
            <span>Morning Window (08:00 - 12:00)</span>
          </div>

          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1b4332' }}>
            {morningScore}%
          </div>
          <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>Avg Cognitive Score</div>

          <div style={{ marginTop: '0.75rem', fontSize: '0.95rem', fontWeight: 700, color: '#2e7d32' }}>
            Latency: {(morningLatencyMs / 1000).toFixed(1)}s
          </div>
        </div>

        {/* Evening Window */}
        <div
          style={{
            background: sundowningDetected ? '#fff3e0' : '#ede7f6',
            border: `2px solid ${sundowningDetected ? '#ffb74d' : '#d1c4e9'}`,
            borderRadius: '16px',
            padding: '1.25rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: sundowningDetected ? '#e65100' : '#4527a0',
              fontWeight: 700,
              marginBottom: '0.5rem',
            }}
          >
            <Moon size={20} />
            <span>Evening Window (17:00 - 21:00)</span>
          </div>

          <div style={{ fontSize: '2rem', fontWeight: 800, color: sundowningDetected ? '#c85a32' : '#1b4332' }}>
            {eveningScore}%
          </div>
          <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>Avg Cognitive Score</div>

          <div
            style={{
              marginTop: '0.75rem',
              fontSize: '0.95rem',
              fontWeight: 700,
              color: sundowningDetected ? '#d32f2f' : '#2e7d32',
            }}
          >
            Latency: {(eveningLatencyMs / 1000).toFixed(1)}s (+{divergencePct}%)
          </div>
        </div>
      </div>

      {/* Status banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.85rem 1.15rem',
          borderRadius: '12px',
          background: sundowningDetected ? '#fbe9e7' : '#e8f5e9',
          border: `1px solid ${sundowningDetected ? '#ffab91' : '#a5d6a7'}`,
          color: sundowningDetected ? '#bf360c' : '#1b5e20',
          fontSize: '0.95rem',
          fontWeight: 600,
        }}
      >
        {sundowningDetected ? (
          <>
            <AlertTriangle size={22} style={{ flexShrink: 0 }} />
            <span>
              <strong>Sun-downing Divergence Detected ({divergencePct}%):</strong> Evening motor latency and error rates
              exceed healthy threshold. Patient shows signs of circadian fatigue.
            </span>
          </>
        ) : (
          <>
            <CheckCircle size={22} style={{ flexShrink: 0 }} />
            <span>
              <strong>Circadian Stability Normal:</strong> Morning and evening performance remain within balanced limits.
            </span>
          </>
        )}
      </div>
    </div>
  );
}
