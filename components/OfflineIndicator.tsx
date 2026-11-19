'use client';

import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/lib/usePWAInstall';

export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-[95] flex items-center gap-2 rounded-xl border border-amber-400/50 bg-amber-600 px-3.5 py-2 text-xs font-medium text-white shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Sem conexão — reconecte-se para enviar mensagens.</span>
    </div>
  );
}
