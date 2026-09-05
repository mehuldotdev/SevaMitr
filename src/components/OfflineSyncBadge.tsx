'use client';

import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { syncManager, SyncStatus } from '@/lib/sync/syncManager';

export function OfflineSyncBadge() {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: true,
    unsyncedCount: 0,
    lastSyncedAt: null,
    isSyncing: false,
    message: 'Online',
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const unsubscribe = syncManager.subscribe(setStatus);
    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    if (status.isOnline && !status.isSyncing) {
      await syncManager.triggerSync();
    }
  };

  if (!mounted) {
    return null;
  }

  const isOffline = !status.isOnline;

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        onClick={handleManualSync}
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isOffline ? '#fed7aa' : '#dcfce7',
          color: isOffline ? '#c2410c' : '#15803d',
          border: '2px solid #1c1b1b',
          boxShadow: '2px 2px 0px #1c1b1b',
          cursor: status.unsyncedCount > 0 ? 'pointer' : 'default',
          transition: 'all 0.2s ease',
          padding: 0,
        }}
        title={`Network: ${isOffline ? 'Offline (Saving locally)' : 'Online (Ready to sync)'}${
          status.unsyncedCount > 0 ? ` • ${status.unsyncedCount} items queued` : ''
        }`}
        aria-label={isOffline ? 'Offline (Saving locally)' : 'Online (Ready to sync)'}
      >
        {status.isSyncing ? (
          <RefreshCw size={18} className="spin-slow" />
        ) : isOffline ? (
          <WifiOff size={18} strokeWidth={2.5} />
        ) : (
          <Wifi size={18} strokeWidth={2.5} />
        )}
      </button>

      {/* Pending Sync Badge Dot */}
      {status.unsyncedCount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#ea580c',
            color: '#ffffff',
            border: '2px solid #1c1b1b',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '0.65rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={`${status.unsyncedCount} unsynced sessions queued`}
        >
          {status.unsyncedCount}
        </span>
      )}
    </div>
  );
}

