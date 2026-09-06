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
            <span>Morning Window (8 AM - 3 PM)</span>
          </div>

          <div style={{ fontSize: '2rem', fontWeight: 800, color: morningScore > 0 ? '#1b4332' : '#94a3b8' }}>
            {morningScore > 0 ? `${morningScore}%` : '--'}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>Avg Cognitive Score</div>

          <div style={{ marginTop: '0.75rem', fontSize: '0.95rem', fontWeight: 700, color: morningLatencyMs > 0 ? '#2e7d32' : '#94a3b8' }}>
            {morningLatencyMs > 0 ? `Latency: ${(morningLatencyMs / 1000).toFixed(1)}s` : 'Pending AM session'}
          </div>
        </div>

        {/* Evening Window */}
        <div
          style={{
            background: eveningScore > 0 && sundowningDetected ? '#fff3e0' : '#ede7f6',
            border: `2px solid ${eveningScore > 0 && sundowningDetected ? '#ffb74d' : '#d1c4e9'}`,
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
              color: eveningScore > 0 && sundowningDetected ? '#e65100' : '#4527a0',
              fontWeight: 700,
              marginBottom: '0.5rem',
            }}
          >
            <Moon size={20} />
            <span>Evening Window (4 PM - 11 PM)</span>
          </div>

          <div style={{ fontSize: '2rem', fontWeight: 800, color: eveningScore > 0 ? (sundowningDetected ? '#c85a32' : '#1b4332') : '#94a3b8' }}>
            {eveningScore > 0 ? `${eveningScore}%` : '--'}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>Avg Cognitive Score</div>

          <div
            style={{
              marginTop: '0.75rem',
              fontSize: '0.95rem',
              fontWeight: 700,
              color: eveningLatencyMs > 0 ? (sundowningDetected ? '#d32f2f' : '#2e7d32') : '#94a3b8',
            }}
          >
            {eveningLatencyMs > 0
              ? `Latency: ${(eveningLatencyMs / 1000).toFixed(1)}s${divergencePct ? ` (+${divergencePct}%)` : ''}`
              : 'Pending PM session'}
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
          background: sundowningDetected ? '#fbe9e7' : (morningLatencyMs > 0 && eveningLatencyMs > 0) ? '#e8f5e9' : '#f0fdf4',
          border: `1px solid ${sundowningDetected ? '#ffab91' : (morningLatencyMs > 0 && eveningLatencyMs > 0) ? '#a5d6a7' : '#bbf7d0'}`,
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
        ) : (morningLatencyMs > 0 && eveningLatencyMs > 0) ? (
          <>
            <CheckCircle size={22} style={{ flexShrink: 0 }} />
            <span>
              <strong>Circadian Stability Normal:</strong> Morning and evening performance remain within balanced limits.
            </span>
          </>
        ) : (
          <>
            <CheckCircle size={22} style={{ flexShrink: 0 }} />
            <span>
              <strong>Circadian Tracking Active:</strong> {morningLatencyMs > 0 ? 'Morning baseline recorded. Complete an evening session (4 PM - 11 PM) to measure sundowning divergence.' : eveningLatencyMs > 0 ? 'Evening assessment recorded. Complete a morning session (8 AM - 3 PM) to establish diurnal baseline.' : 'Play assessments during morning (8 AM - 3 PM) and evening (4 PM - 11 PM) windows to establish circadian profiling.'}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
